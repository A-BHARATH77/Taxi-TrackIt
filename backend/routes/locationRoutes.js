import express from 'express';
import redisService from '../services/redisService.js';
import zoneService from '../services/zoneService.js';
import supabase from '../config/supabaseClient.js';

const router = express.Router();

// POST /api/location/update - Update taxi location
router.post('/location/update', async (req, res) => {
  try {
    const { taxi_id, lat, lng, speed } = req.body;

    // Validate input
    if (!taxi_id || lat === undefined || lng === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: taxi_id, lat, lng' 
      });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        error: 'Invalid coordinates' 
      });
    }

    // 1. Detect current zone using Turf.js
    const currentZone = await zoneService.detectZone(lat, lng);
    
    // Get zone name if in a zone
    let currentZoneName = null;
    if (currentZone) {
      try {
        const { data: zoneData } = await supabase
          .from('zones')
          .select('name')
          .eq('id', currentZone)
          .single();
        if (zoneData) {
          currentZoneName = zoneData.name;
        }
      } catch (e) {
        // Zone name lookup failed, use ID
      }
    }

    // Get taxi name
    let taxiName = null;
    try {
      const { data: taxiData } = await supabase
        .from('taxis')
        .select('name')
        .eq('taxi_id', taxi_id)
        .single();
      if (taxiData) {
        taxiName = taxiData.name;
      }
    } catch (e) {
      // Taxi name lookup failed
    }

    // 2. Get last known zone from Redis
    const lastZone = await redisService.getTaxiZone(taxi_id);

    // 3. Check if zone changed
    let zoneChanged = false;
    if (String(lastZone) !== String(currentZone)) {
      zoneChanged = true;

      // Log zone changes to console (zone_crossings table is used via separate endpoint)
      if (lastZone && lastZone !== 'null') {
        console.log(`🚪 Taxi ${taxi_id} EXIT zone ${lastZone}`);
      }

      if (currentZone) {
        console.log(`🚪 Taxi ${taxi_id} ENTER zone ${currentZone}`);
      }

      // Update zone in Redis
      await redisService.setTaxiZone(taxi_id, currentZone);
    }

    // 4. Store latest location in Redis (with zone name for zone_crossings to use)
    await redisService.setTaxiLocation(taxi_id, {
      lat,
      lng,
      speed: speed || 0,
      zone: currentZone,
      zoneName: currentZoneName
    });

    // 5. Publish update to WebSocket clients via Redis Pub/Sub
    await redisService.publishTaxiUpdate({
      taxi_id,
      taxi_name: taxiName,
      lat,
      lng,
      speed: speed || 0,
      zone: currentZone,
      zone_name: currentZoneName,
      zone_changed: zoneChanged,
      timestamp: Date.now()
    });

    console.log(`✅ Location updated for ${taxi_id}: (${lat.toFixed(6)}, ${lng.toFixed(6)}) Zone: ${currentZone || 'None'}`);

    // 6. (Optional) Log to history table for analytics
    await zoneService.logLocationHistory(taxi_id, lat, lng, speed, currentZone);

    // Return response
    res.json({
      success: true,
      message: 'Location updated',
      data: {
        taxi_id,
        zone: currentZone,
        zone_changed: zoneChanged
      }
    });

  } catch (error) {
    console.error('❌ Location update error:', error);
    res.status(500).json({ 
      error: 'Server error while updating location',
      message: error.message 
    });
  }
});

// GET /api/location/latest - Get all current taxi locations
router.get('/location/latest', async (req, res) => {
  try {
    const locations = await redisService.getAllTaxiLocations();

    console.log(`📊 API /location/latest - Returning ${locations.length} locations:`, locations.map(l => l.taxi_id));

    res.json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({ 
      error: 'Server error while fetching locations',
      message: error.message 
    });
  }
});

// GET /api/location/:taxi_id - Get specific taxi location
router.get('/location/:taxi_id', async (req, res) => {
  try {
    const { taxi_id } = req.params;
    const location = await redisService.getTaxiLocation(taxi_id);

    if (!location) {
      return res.status(404).json({
        error: 'Taxi location not found'
      });
    }

    res.json({
      success: true,
      data: {
        taxi_id,
        ...location
      }
    });

  } catch (error) {
    console.error('❌ Error fetching taxi location:', error);
    res.status(500).json({ 
      error: 'Server error while fetching taxi location',
      message: error.message 
    });
  }
});

export default router;
