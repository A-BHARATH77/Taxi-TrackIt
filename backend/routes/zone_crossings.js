import express from 'express';
import * as turf from '@turf/turf';
import { supabase } from '../config/supabaseClient.js';
import redis from '../config/redis.js';

const router = express.Router();

// Load all zones into Redis on startup
async function loadZonesToRedis() {
  try {
    console.log('📦 Loading zones into Redis...');
    
    const { data: zones, error } = await supabase
      .from('zones')
      .select('id, name, boundary');

    if (error) throw error;

    // Store each zone in Redis with a 1-hour expiry
    for (const zone of zones) {
      try {
        let boundary = zone.boundary;
        
        // Parse boundary if it's a string
        if (typeof boundary === 'string') {
          if (boundary.length < 50 || !boundary.includes('{')) {
            console.warn(`⚠️ Skipping invalid zone: ${zone.name}`);
            continue;
          }
          boundary = JSON.parse(boundary);
        }

        // Validate GeoJSON structure
        if (!boundary || !boundary.type || !boundary.coordinates) {
          console.warn(`⚠️ Skipping zone with invalid GeoJSON: ${zone.name}`);
          continue;
        }

        await redis.set(
          `zone:${zone.id}`,
          JSON.stringify({ id: zone.id, name: zone.name, boundary }),
          { EX: 3600 } // 1 hour expiry
        );
        
        console.log(`✅ Loaded zone "${zone.name}" into Redis`);
      } catch (zoneError) {
        console.error(`❌ Error loading zone ${zone.name}:`, zoneError.message);
      }
    }

    console.log(`🎉 Successfully loaded ${zones.length} zones into Redis`);
  } catch (error) {
    console.error('❌ Error loading zones to Redis:', error);
  }
}

// Load zones on startup
loadZonesToRedis();

// Reload zones every hour
setInterval(loadZonesToRedis, 3600000);

// POST /api/zone-crossing/update - Track zone crossings
router.post('/update', async (req, res) => {
  try {
    const { taxi_id, lat, lng, speed } = req.body;

    // Validate input
    if (!taxi_id || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Missing required fields: taxi_id, lat, lng' });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Get taxi name for better logging
    let taxiName = taxi_id;
    let taxiDisplayName = null;
    try {
      const { data: taxiData } = await supabase
        .from('taxis')
        .select('name')
        .eq('taxi_id', taxi_id)
        .single();
      if (taxiData) {
        taxiName = `${taxi_id} (${taxiData.name})`;
        taxiDisplayName = taxiData.name;
      }
    } catch (e) {
      // If taxi not found, just use taxi_id
    }

    // Current point
    const point = turf.point([lng, lat]);

    // Get all zones from Redis
    const zoneKeys = await redis.keys('zone:*');
    let currentZone = null;
    let currentZoneName = null;

    // Check which zone the taxi is in
    for (const key of zoneKeys) {
      const zoneData = await redis.get(key);
      if (!zoneData) continue;

      try {
        const zone = JSON.parse(zoneData);
        
        // Check if point is inside this zone's polygon
        if (turf.booleanPointInPolygon(point, zone.boundary)) {
          currentZone = zone.id;
          currentZoneName = zone.name;
          break;
        }
      } catch (parseError) {
        console.error(`❌ Error parsing zone data for ${key}:`, parseError.message);
      }
    }

    // Get previous location data from Redis
    const previousDataStr = await redis.get(`taxi:${taxi_id}:location`);
    let previousZone = null;
    let previousZoneName = null;
    let previousLat = null;
    let previousLng = null;

    if (previousDataStr) {
      try {
        const previousData = JSON.parse(previousDataStr);
        previousZone = previousData.zone;
        previousZoneName = previousData.zoneName;
        previousLat = previousData.lat;
        previousLng = previousData.lng;
      } catch (parseError) {
        console.error('❌ Error parsing previous location data:', parseError.message);
      }
    }

    // Compare zones and determine event type
    const zoneChanged = String(previousZone) !== String(currentZone);

    if (zoneChanged) {
      // ZONE CHANGED → Save to database
      try {
        // Determine event type
        let eventType = 'CROSSING'; // Moving from one zone to another
        if (previousZone && !currentZone) {
          eventType = 'EXIT'; // Exiting a zone to outside
        } else if (!previousZone && currentZone) {
          eventType = 'ENTER'; // Entering a zone from outside
        }

        // Prepare insert data (event_type is optional in case column doesn't exist yet)
        const insertData = {
          taxi_id,
          previous_zone: previousZone || null,
          current_zone: currentZone || null,
          lat,
          lng,
          speed: speed || 0,
          crossed_at: new Date().toISOString()
        };

        // Try to add event_type if column exists
        try {
          insertData.event_type = eventType;
        } catch (e) {
          // Column might not exist yet
        }

        const { error } = await supabase
          .from('zone_crossings')
          .insert(insertData);

        if (error) throw error;

        const prevZoneDisplay = previousZoneName || (previousZone ? `Zone ${previousZone}` : 'Outside');
        const currZoneDisplay = currentZoneName || (currentZone ? `Zone ${currentZone}` : 'Outside');
        
        // Different emoji based on event type
        const emoji = eventType === 'ENTER' ? '🟢' : eventType === 'EXIT' ? '🔴' : '🚗';
        
        console.log(
          `${emoji} ${eventType} - Taxi ${taxiName}\n` +
          `   ${prevZoneDisplay} → ${currZoneDisplay}\n` +
          `   Coordinates: (${lat.toFixed(6)}, ${lng.toFixed(6)})\n` +
          `   Speed: ${speed || 0} km/h\n` +
          `   ✅ Saved to database`
        );

        // Publish zone crossing event to Redis for WebSocket broadcast
        await redis.publish('zone_crossing_events', JSON.stringify({
          taxi_id,
          taxi_name: taxiDisplayName || `Taxi ${taxi_id}`,
          event_type: eventType,
          previous_zone: prevZoneDisplay,
          current_zone: currZoneDisplay,
          lat,
          lng,
          speed: speed || 0,
          timestamp: Date.now()
        }));

      } catch (dbError) {
        console.error('❌ Error saving zone crossing:', dbError.message);
        // Continue execution even if database save fails
      }
    } else {
      // SAME ZONE → Don't save
      const zoneDisplay = currentZoneName || (currentZone ? `Zone ${currentZone}` : 'Outside zones');
      console.log(
        `🚕 Taxi ${taxiName} - ${zoneDisplay} | ` +
        `Coords: (${lat.toFixed(6)}, ${lng.toFixed(6)}) | Speed: ${speed || 0} km/h`
      );
    }

    // Update Redis with current location (this becomes "previous" for next request)
    await redis.set(
      `taxi:${taxi_id}:location`,
      JSON.stringify({
        zone: currentZone,
        zoneName: currentZoneName,
        lat,
        lng,
        speed: speed || 0,
        timestamp: Date.now()
      }),
      { EX: 300 } // 5 minutes expiry
    );

    // Return response
    res.json({
      success: true,
      message: 'Location processed',
      data: {
        taxi_id,
        previousZone: previousZoneName || previousZone,
        currentZone: currentZoneName || currentZone,
        zoneChanged,
        coordinates: { lat, lng }
      }
    });

  } catch (error) {
    console.error('❌ Zone crossing update error:', error);
    res.status(500).json({ 
      error: 'Server error while processing location',
      message: error.message 
    });
  }
});

// GET /api/zone-crossing/history/:taxi_id - Get zone crossing history for a taxi
router.get('/history/:taxi_id', async (req, res) => {
  try {
    const { taxi_id } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('zone_crossings')
      .select('*')
      .eq('taxi_id', taxi_id)
      .order('crossed_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error('❌ Error fetching zone crossing history:', error);
    res.status(500).json({ 
      error: 'Server error while fetching history',
      message: error.message 
    });
  }
});

// GET /api/zone-crossing/all - Get all zone crossings
router.get('/all', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    // Fetch zone crossings with zone names and taxi names
    const { data: crossings, error, count } = await supabase
      .from('zone_crossings')
      .select('*', { count: 'exact' })
      .order('crossed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Fetch all zones to map IDs to names
    const { data: zones } = await supabase
      .from('zones')
      .select('id, name');
    
    const zoneMap = new Map();
    if (zones) {
      zones.forEach(zone => zoneMap.set(zone.id, zone.name));
    }

    // Fetch all taxis to map IDs to names
    const { data: taxis } = await supabase
      .from('taxis')
      .select('taxi_id, name');
    
    const taxiMap = new Map();
    if (taxis) {
      taxis.forEach(taxi => taxiMap.set(taxi.taxi_id?.toString(), taxi.name));
    }

    // Enrich data with zone and taxi names
    const enrichedData = crossings.map(crossing => ({
      ...crossing,
      previous_zone_name: crossing.previous_zone ? (zoneMap.get(crossing.previous_zone) || null) : null,
      current_zone_name: crossing.current_zone ? (zoneMap.get(crossing.current_zone) || null) : null,
      taxi_name: taxiMap.get(crossing.taxi_id?.toString()) || null
    }));

    res.json({
      success: true,
      count: enrichedData.length,
      total: count,
      data: enrichedData
    });

  } catch (error) {
    console.error('❌ Error fetching zone crossings:', error);
    res.status(500).json({ 
      error: 'Server error while fetching crossings',
      message: error.message 
    });
  }
});

export default router;
