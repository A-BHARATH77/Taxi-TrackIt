import * as turf from '@turf/turf';
import { supabase } from '../config/database.js';

class ZoneService {
  // Get all zones from database
  async getAllZones() {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, boundary');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  }

  // Detect which zone a point is in
  async detectZone(lat, lng) {
    try {
      const zones = await this.getAllZones();
      const point = turf.point([lng, lat]);

      for (const zone of zones) {
        try {
          let polygon;
          
          // Parse boundary if it's a string
          if (typeof zone.boundary === 'string') {
            // Check if it looks like a UUID or invalid short string
            if (zone.boundary.length < 50 || !zone.boundary.includes('{')) {
              // Silently skip invalid zones
              continue;
            }
            
            // Check if it's a valid GeoJSON string
            try {
              polygon = JSON.parse(zone.boundary);
            } catch (parseError) {
              // Silently skip invalid zones
              continue;
            }
          } else {
            polygon = zone.boundary;
          }

          // Validate polygon structure
          if (!polygon || !polygon.type || !polygon.coordinates || !Array.isArray(polygon.coordinates)) {
            // Silently skip invalid zones
            continue;
          }

          // Check if point is inside polygon
          if (turf.booleanPointInPolygon(point, polygon)) {
            return zone.id;
          }
        } catch (zoneError) {
          // Silently skip problematic zones
          continue;
        }
      }

      return null; // Not in any zone
    } catch (error) {
      console.error('Error detecting zone:', error);
      return null; // Return null instead of throwing
    }
  }

  // Log zone event (ENTER/EXIT)
  // NOTE: This table doesn't exist - using zone_crossings table instead
  async logZoneEvent(taxiId, zoneId, eventType) {
    // Disabled - use zone_crossings table via /api/zone-crossing/update endpoint
    return;
  }

  // Update taxi zone status
  // NOTE: This table doesn't exist - zone status is tracked in Redis
  async updateTaxiZoneStatus(taxiId, currentZone) {
    // Disabled - zone status is tracked in Redis via zone_crossings route
    return;
  }

  // Log location history (optional - for analytics)
  async logLocationHistory(taxiId, lat, lng, speed, zone) {
    try {
      const { error } = await supabase
        .from('taxi_locations')
        .insert({
          taxi_id: taxiId,
          lat,
          lng,
          speed: speed || 0,
          zone: zone,  // Changed from zone_id to zone (UUID column)
          recorded_at: new Date().toISOString()  // Changed from created_at to recorded_at
        });

      if (error) {
        // Don't log errors for missing table - it's optional
        if (error.code === 'PGRST204') {
          // Table doesn't exist yet, silently skip
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw - this is optional logging
    }
  }
}

export default new ZoneService();
