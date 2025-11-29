import redis from '../config/redis.js';

class RedisService {
  // Store latest taxi location
  async setTaxiLocation(taxiId, data) {
    try {
      await redis.set(
        `taxi:${taxiId}:location`,
        JSON.stringify({
          ...data,
          timestamp: Date.now()
        }),
        { EX: 300 } // Expire after 5 minutes of no updates
      );
    } catch (error) {
      console.error('Error setting taxi location:', error);
      throw error;
    }
  }

  // Get taxi location
  async getTaxiLocation(taxiId) {
    try {
      const data = await redis.get(`taxi:${taxiId}:location`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting taxi location:', error);
      throw error;
    }
  }

  // Store current zone for taxi
  async setTaxiZone(taxiId, zoneId) {
    try {
      await redis.set(`taxi:${taxiId}:zone`, zoneId || 'null');
    } catch (error) {
      console.error('Error setting taxi zone:', error);
      throw error;
    }
  }

  // Get current zone for taxi
  async getTaxiZone(taxiId) {
    try {
      const zone = await redis.get(`taxi:${taxiId}:zone`);
      return zone === 'null' ? null : zone;
    } catch (error) {
      console.error('Error getting taxi zone:', error);
      throw error;
    }
  }

  // Get all taxi locations
  async getAllTaxiLocations() {
    try {
      const keys = await redis.keys('taxi:*:location');
      const locations = [];

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const taxiId = key.split(':')[1];
          const parsedData = JSON.parse(data);
          locations.push({ 
            taxi_id: String(taxiId), // Ensure taxi_id is always a string
            ...parsedData 
          });
        }
      }

      console.log(`📍 Redis: Found ${locations.length} taxi locations - IDs: [${locations.map(l => l.taxi_id).join(', ')}]`);
      return locations;
    } catch (error) {
      console.error('Error getting all taxi locations:', error);
      throw error;
    }
  }

  // Publish update to WebSocket clients
  async publishTaxiUpdate(data) {
    try {
      await redis.publish('taxi_updates', JSON.stringify(data));
    } catch (error) {
      console.error('Error publishing taxi update:', error);
      throw error;
    }
  }

  // Subscribe to taxi updates
  async subscribeTaxiUpdates(callback) {
    const subscriber = redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('taxi_updates', (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error processing taxi update:', error);
      }
    });

    return subscriber;
  }

  // Subscribe to zone crossing events
  async subscribeZoneCrossings(callback) {
    const subscriber = redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('zone_crossing_events', (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        console.error('Error processing zone crossing event:', error);
      }
    });

    console.log('✅ Subscribed to zone_crossing_events channel');
    return subscriber;
  }
}

export default new RedisService();
