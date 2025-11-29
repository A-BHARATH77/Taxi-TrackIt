import { supabase } from '../config/database.js';
import * as turf from '@turf/turf';

// Define the polygon boundary for the area
const AREA_BOUNDS = [
  [41.087114594299216, -74.57065069277387],
  [41.08297420451945, -74.24849147423781],
  [40.947750930283476, -74.21895448831657],
  [40.9353026724978, -74.59537933214979]
];

// Calculate bounds for faster random generation
const LAT_MIN = Math.min(...AREA_BOUNDS.map(coord => coord[0]));
const LAT_MAX = Math.max(...AREA_BOUNDS.map(coord => coord[0]));
const LNG_MIN = Math.min(...AREA_BOUNDS.map(coord => coord[1]));
const LNG_MAX = Math.max(...AREA_BOUNDS.map(coord => coord[1]));

class TaxiSimulator {
  constructor() {
    this.taxis = [];
    this.zones = []; // Store zone data
    this.taxiStates = new Map(); // Store last position, direction, and target zone for each taxi
    this.isRunning = false;
    this.intervalId = null;
    this.refreshIntervalId = null;
    this.zoneRefreshIntervalId = null;
    this.updateInterval = 3000; // Update every 3 seconds
    this.refreshInterval = 10000; // Refresh taxi list every 10 seconds
    this.zoneRefreshInterval = 30000; // Refresh zones every 30 seconds
  }

  // Check if a point is inside the polygon
  isPointInPolygon(lat, lng) {
    let inside = false;
    for (let i = 0, j = AREA_BOUNDS.length - 1; i < AREA_BOUNDS.length; j = i++) {
      const xi = AREA_BOUNDS[i][0], yi = AREA_BOUNDS[i][1];
      const xj = AREA_BOUNDS[j][0], yj = AREA_BOUNDS[j][1];
      
      const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Generate random point within the polygon
  generateRandomPointInPolygon() {
    let lat, lng;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      lat = LAT_MIN + Math.random() * (LAT_MAX - LAT_MIN);
      lng = LNG_MIN + Math.random() * (LNG_MAX - LNG_MIN);
      attempts++;
    } while (!this.isPointInPolygon(lat, lng) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback to center of bounds
      lat = (LAT_MIN + LAT_MAX) / 2;
      lng = (LNG_MIN + LNG_MAX) / 2;
    }

    return { lat, lng };
  }

  // Move taxi from current position (simulate realistic movement)
  moveFromPosition(currentLat, currentLng) {
    // Small random movement (simulating realistic taxi movement)
    // Movement range: approximately 0.001 to 0.003 degrees (roughly 100-300 meters)
    const latDelta = (Math.random() - 0.5) * 0.003;
    const lngDelta = (Math.random() - 0.5) * 0.003;

    let newLat = currentLat + latDelta;
    let newLng = currentLng + lngDelta;

    // Keep within bounds
    newLat = Math.max(LAT_MIN, Math.min(LAT_MAX, newLat));
    newLng = Math.max(LNG_MIN, Math.min(LNG_MAX, newLng));

    // If moved outside polygon, generate new position inside
    if (!this.isPointInPolygon(newLat, newLng)) {
      return this.generateRandomPointInPolygon();
    }

    return { lat: newLat, lng: newLng };
  }

  // Move taxi toward target zone (zone-aware movement)
  moveTowardTarget(currentLat, currentLng, targetZone, currentState) {
    if (!targetZone) {
      // No target zone, just move randomly
      return this.moveFromPosition(currentLat, currentLng);
    }

    const target = targetZone.center;
    
    // Calculate direction to target
    const latDiff = target.lat - currentLat;
    const lngDiff = target.lng - currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // If very close to target, pick a new target zone
    if (distance < 0.005 || currentState.stepsInZone > 10) {
      // Pick a different zone as new target
      if (this.zones.length > 1) {
        let newTarget;
        do {
          newTarget = this.zones[Math.floor(Math.random() * this.zones.length)];
        } while (newTarget.id === targetZone.id);
        currentState.targetZone = newTarget;
        currentState.stepsInZone = 0;
        console.log(`   🎯 ${currentState.taxi_id || 'Taxi'}: New target → "${newTarget.name}"`);
        return this.moveTowardTarget(currentLat, currentLng, newTarget, currentState);
      }
    }
    
    // Move toward target with some randomness
    const stepSize = 0.002; // ~200 meters
    const randomness = 0.4; // 40% random component
    
    let latDelta = (latDiff / distance) * stepSize * (1 - randomness) + (Math.random() - 0.5) * stepSize * randomness;
    let lngDelta = (lngDiff / distance) * stepSize * (1 - randomness) + (Math.random() - 0.5) * stepSize * randomness;
    
    let newLat = currentLat + latDelta;
    let newLng = currentLng + lngDelta;
    
    // Keep within bounds
    newLat = Math.max(LAT_MIN, Math.min(LAT_MAX, newLat));
    newLng = Math.max(LNG_MIN, Math.min(LNG_MAX, newLng));
    
    // Check if still in valid area
    if (!this.isPointInPolygon(newLat, newLng)) {
      // If moved outside, try smaller step
      latDelta *= 0.5;
      lngDelta *= 0.5;
      newLat = currentLat + latDelta;
      newLng = currentLng + lngDelta;
      
      if (!this.isPointInPolygon(newLat, newLng)) {
        // Still outside, just make a small random move
        return this.moveFromPosition(currentLat, currentLng);
      }
    }
    
    return { lat: newLat, lng: newLng };
  }

  // Fetch all taxis from database
  async fetchTaxis() {
    try {
      console.log('📡 Fetching taxis from database...');
      const { data, error } = await supabase
        .from('taxis')
        .select('taxi_id, name');

      if (error) {
        console.error('❌ Error fetching taxis:', error);
        return [];
      }

      console.log(`✅ Loaded ${data?.length || 0} taxis for simulation`);
      if (data && data.length > 0) {
        data.forEach(taxi => console.log(`   - ${taxi.taxi_id}: ${taxi.name}`));
      }
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching taxis:', error);
      return [];
    }
  }

  // Fetch all zones from database
  async fetchZones() {
    try {
      console.log('🗺️  Fetching zones from database...');
      const { data, error } = await supabase
        .from('zones')
        .select('id, name, boundary');

      if (error) {
        console.error('❌ Error fetching zones:', error);
        return [];
      }

      // Parse and validate zones
      const validZones = [];
      for (const zone of data || []) {
        try {
          let boundary = zone.boundary;
          
          // Parse boundary if it's a string
          if (typeof boundary === 'string') {
            boundary = JSON.parse(boundary);
          }

          // Validate GeoJSON structure
          if (boundary && boundary.type === 'Polygon' && boundary.coordinates) {
            validZones.push({
              id: zone.id,
              name: zone.name,
              boundary: boundary,
              // Calculate center point for targeting
              center: this.getPolygonCenter(boundary.coordinates[0])
            });
            console.log(`   ✅ Zone "${zone.name}" - ${boundary.coordinates[0].length} points`);
          } else {
            console.log(`   ⚠️  Skipping invalid zone: ${zone.name}`);
          }
        } catch (parseError) {
          console.error(`   ❌ Error parsing zone ${zone.name}:`, parseError.message);
        }
      }

      console.log(`✅ Loaded ${validZones.length} valid zones for simulation\n`);
      return validZones;
    } catch (error) {
      console.error('❌ Error fetching zones:', error);
      return [];
    }
  }

  // Calculate center of a polygon
  getPolygonCenter(coordinates) {
    const lngs = coordinates.map(c => c[0]);
    const lats = coordinates.map(c => c[1]);
    return {
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      lat: lats.reduce((a, b) => a + b, 0) / lats.length
    };
  }

  // Get a random point inside a specific zone
  getRandomPointInZone(zone) {
    try {
      const polygon = turf.polygon(zone.boundary.coordinates);
      const bbox = turf.bbox(polygon);
      
      // Try to generate a point inside the zone
      for (let i = 0; i < 100; i++) {
        const randomLng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
        const randomLat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
        const point = turf.point([randomLng, randomLat]);
        
        if (turf.booleanPointInPolygon(point, polygon)) {
          return { lat: randomLat, lng: randomLng };
        }
      }
      
      // Fallback to zone center
      return zone.center;
    } catch (error) {
      console.error(`❌ Error generating point in zone ${zone.name}:`, error.message);
      return zone.center;
    }
  }

  // Initialize taxi states with random starting positions and target zones
  initializeTaxiStates() {
    console.log('🎲 Initializing taxi starting positions and routes...');
    
    if (this.zones.length === 0) {
      console.log('⚠️  No zones available. Taxis will move randomly within area bounds.');
      // Fallback to random movement
      this.taxis.forEach(taxi => {
        if (!this.taxiStates.has(taxi.taxi_id)) {
          const position = this.generateRandomPointInPolygon();
          console.log(`   ${taxi.taxi_id}: Starting at (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`);
          this.taxiStates.set(taxi.taxi_id, {
            lat: position.lat,
            lng: position.lng,
            speed: Math.floor(Math.random() * 40) + 20,
            targetZone: null,
            currentZone: null
          });
        }
      });
      return;
    }

    // Assign each taxi to a random starting zone and a different target zone
    this.taxis.forEach(taxi => {
      if (!this.taxiStates.has(taxi.taxi_id)) {
        // Pick a random starting zone
        const startZone = this.zones[Math.floor(Math.random() * this.zones.length)];
        
        // Pick a different target zone
        let targetZone;
        if (this.zones.length > 1) {
          do {
            targetZone = this.zones[Math.floor(Math.random() * this.zones.length)];
          } while (targetZone.id === startZone.id);
        } else {
          targetZone = startZone;
        }
        
        // Get starting position inside the starting zone
        const position = this.getRandomPointInZone(startZone);
        
        console.log(`   ${taxi.taxi_id}: Starting in "${startZone.name}" → Target: "${targetZone.name}"`);
        console.log(`      Position: (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`);
        
        this.taxiStates.set(taxi.taxi_id, {
          lat: position.lat,
          lng: position.lng,
          speed: Math.floor(Math.random() * 40) + 20,
          targetZone: targetZone,
          currentZone: startZone,
          stepsInZone: 0 // Track how many updates in current zone
        });
      }
    });
    console.log('');
  }

  // Send location update for a taxi (both endpoints)
  async sendLocationUpdate(taxiId, lat, lng, speed) {
    try {
      // Send to zone crossing endpoint (primary)
      const zoneCrossingResponse = await fetch('http://localhost:5000/api/zone-crossing/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taxi_id: taxiId,
          lat,
          lng,
          speed,
        }),
      });

      const zoneCrossingResult = await zoneCrossingResponse.json();
      
      if (zoneCrossingResponse.ok) {
        // The zone crossing endpoint already logs to console
        // Just update our internal state if zone changed
        if (zoneCrossingResult.data?.zoneChanged) {
          const state = this.taxiStates.get(taxiId);
          if (state) {
            state.stepsInZone = 0;
          }
        } else {
          const state = this.taxiStates.get(taxiId);
          if (state) {
            state.stepsInZone++;
          }
        }
      } else {
        console.error(`❌ Failed to update ${taxiId} (zone crossing):`, zoneCrossingResult.error);
      }

      // Also send to regular location endpoint (for backwards compatibility)
      await fetch('http://localhost:5000/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taxi_id: taxiId,
          lat,
          lng,
          speed,
        }),
      });

    } catch (error) {
      console.error(`❌ Network error for ${taxiId}:`, error.message);
    }
  }

  // Update all taxis
  async updateAllTaxis() {
    const updatePromises = this.taxis.map(async (taxi) => {
      const currentState = this.taxiStates.get(taxi.taxi_id);
      
      // Move toward target zone (zone-aware movement)
      const newPosition = this.moveTowardTarget(
        currentState.lat, 
        currentState.lng, 
        currentState.targetZone,
        currentState
      );
      
      // Slightly vary speed
      const speedVariation = (Math.random() - 0.5) * 10;
      const newSpeed = Math.max(10, Math.min(70, currentState.speed + speedVariation));

      // Update state
      this.taxiStates.set(taxi.taxi_id, {
        ...currentState,
        lat: newPosition.lat,
        lng: newPosition.lng,
        speed: Math.round(newSpeed)
      });

      // Send update
      await this.sendLocationUpdate(
        taxi.taxi_id,
        newPosition.lat,
        newPosition.lng,
        Math.round(newSpeed)
      );
    });

    await Promise.all(updatePromises);
  }

  // Refresh taxi list from database
  async refreshTaxiList() {
    try {
      const newTaxis = await this.fetchTaxis();
      
      // Check for new taxis
      const oldTaxiIds = new Set(this.taxis.map(t => t.taxi_id));
      const newTaxiIds = new Set(newTaxis.map(t => t.taxi_id));
      
      // Find newly added taxis
      const addedTaxis = newTaxis.filter(t => !oldTaxiIds.has(t.taxi_id));
      
      // Find removed taxis
      const removedTaxiIds = Array.from(oldTaxiIds).filter(id => !newTaxiIds.has(id));
      
      if (addedTaxis.length > 0) {
        console.log(`\n✨ ${addedTaxis.length} new taxi(s) detected:`);
        addedTaxis.forEach(taxi => {
          console.log(`   ➕ ${taxi.taxi_id}: ${taxi.name}`);
          
          // Initialize with zone-aware positioning
          if (this.zones.length > 0) {
            const startZone = this.zones[Math.floor(Math.random() * this.zones.length)];
            let targetZone;
            if (this.zones.length > 1) {
              do {
                targetZone = this.zones[Math.floor(Math.random() * this.zones.length)];
              } while (targetZone.id === startZone.id);
            } else {
              targetZone = startZone;
            }
            
            const position = this.getRandomPointInZone(startZone);
            console.log(`   Starting in "${startZone.name}" → Target: "${targetZone.name}"`);
            console.log(`   Position: (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`);
            
            this.taxiStates.set(taxi.taxi_id, {
              lat: position.lat,
              lng: position.lng,
              speed: Math.floor(Math.random() * 40) + 20,
              targetZone: targetZone,
              currentZone: startZone,
              stepsInZone: 0
            });
          } else {
            // Fallback to random positioning
            const position = this.generateRandomPointInPolygon();
            console.log(`   Starting position: (${position.lat.toFixed(6)}, ${position.lng.toFixed(6)})`);
            
            this.taxiStates.set(taxi.taxi_id, {
              lat: position.lat,
              lng: position.lng,
              speed: Math.floor(Math.random() * 40) + 20,
              targetZone: null,
              currentZone: null,
              stepsInZone: 0
            });
          }
        });
        console.log('');
      }
      
      if (removedTaxiIds.length > 0) {
        console.log(`\n🗑️  ${removedTaxiIds.length} taxi(s) removed from database:`);
        removedTaxiIds.forEach(id => {
          console.log(`   ➖ ${id}`);
          this.taxiStates.delete(id);
        });
        console.log('');
      }
      
      this.taxis = newTaxis;
    } catch (error) {
      console.error('❌ Error refreshing taxi list:', error.message);
    }
  }

  // Refresh zones from database
  async refreshZones() {
    try {
      const newZones = await this.fetchZones();
      
      if (newZones.length !== this.zones.length) {
        console.log(`\n🗺️  Zone count changed: ${this.zones.length} → ${newZones.length}`);
        
        // Reassign target zones for all taxis
        if (newZones.length > 0) {
          console.log('🔄 Reassigning taxi targets...');
          this.taxiStates.forEach((state, taxiId) => {
            if (newZones.length > 1) {
              let newTarget = newZones[Math.floor(Math.random() * newZones.length)];
              state.targetZone = newTarget;
              state.stepsInZone = 0;
              console.log(`   ${taxiId} → New target: "${newTarget.name}"`);
            }
          });
          console.log('');
        }
      }
      
      this.zones = newZones;
    } catch (error) {
      console.error('❌ Error refreshing zones:', error.message);
    }
  }

  // Start the simulator
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Simulator is already running');
      return;
    }

    console.log('\n🚕 Starting Taxi Movement Simulator...\n');
    console.log('📍 Area bounds:');
    AREA_BOUNDS.forEach((coord, i) => {
      console.log(`   Point ${i + 1}: [${coord[0]}, ${coord[1]}]`);
    });
    console.log('');

    // Fetch zones first
    this.zones = await this.fetchZones();
    
    if (this.zones.length === 0) {
      console.log('⚠️  No zones found. Taxis will move randomly within area bounds.');
      console.log('💡 Tip: Create zones in the Zone Management page for realistic zone-crossing simulation.\n');
    }

    // Fetch taxis from database
    this.taxis = await this.fetchTaxis();

    if (this.taxis.length === 0) {
      console.error('❌ No taxis found in database. Please add taxis first.');
      return;
    }

    // Initialize taxi states
    this.initializeTaxiStates();

    console.log(`\n🎬 Simulating ${this.taxis.length} taxis`);
    console.log(`⏱️  Update interval: ${this.updateInterval / 1000}s`);
    console.log('📡 Sending updates to:');
    console.log('   - http://localhost:5000/api/zone-crossing/update (primary)');
    console.log('   - http://localhost:5000/api/location/update (secondary)\n');

    this.isRunning = true;

    // Send initial positions
    await this.updateAllTaxis();

    // Start continuous updates
    this.intervalId = setInterval(async () => {
      await this.updateAllTaxis();
    }, this.updateInterval);

    // Start periodic taxi list refresh (check for new/removed taxis)
    this.refreshIntervalId = setInterval(async () => {
      await this.refreshTaxiList();
    }, this.refreshInterval);

    // Start periodic zone refresh
    this.zoneRefreshIntervalId = setInterval(async () => {
      await this.refreshZones();
    }, this.zoneRefreshInterval);

    console.log('✅ Simulator started! Press Ctrl+C to stop.\n');
  }

  // Stop the simulator
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Simulator is not running');
      return;
    }

    clearInterval(this.intervalId);
    clearInterval(this.refreshIntervalId);
    clearInterval(this.zoneRefreshIntervalId);
    this.isRunning = false;
    console.log('\n\n👋 Stopping taxi simulator...');
    console.log('✅ Simulator stopped.\n');
  }

  // Get simulator status
  getStatus() {
    return {
      isRunning: this.isRunning,
      taxiCount: this.taxis.length,
      updateInterval: this.updateInterval,
      bounds: AREA_BOUNDS
    };
  }
}

// Export singleton instance
const simulator = new TaxiSimulator();
export default simulator;

// Start simulator immediately when file is run directly
console.log('🚀 Taxi Simulator Script Loaded');
console.log('📂 Module URL:', import.meta.url);

simulator.start().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  simulator.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  simulator.stop();
  process.exit(0);
});

