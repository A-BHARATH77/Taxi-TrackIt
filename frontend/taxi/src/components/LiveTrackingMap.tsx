import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWebSocket } from '../hooks/useWebSocket';
import { zoneService } from '../services/zoneService';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Zone {
  id: number;
  name: string;
  boundary: any;
}

interface TaxiLocation {
  taxi_id: string;
  lat: number;
  lng: number;
  speed: number;
  zone: number | null;
  timestamp: number;
  zone_changed?: boolean;
}

export function LiveTrackingMap() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const { taxis, isConnected, taxiCount, taxiIds } = useWebSocket();

  // Debug logging with duplicate detection
  useEffect(() => {
    const uniqueIds = [...new Set(taxis.map(t => t.taxi_id))];
    const hasDuplicates = taxis.length !== uniqueIds.length;
    
    console.log('🔍 LiveTrackingMap Debug:', {
      taxisArrayLength: taxis.length,
      actualMapSize: taxiCount,
      taxiIdsFromMap: taxiIds,
      taxiIdsFromArray: taxis.map(t => t.taxi_id),
      uniqueIds: uniqueIds,
      hasDuplicates: hasDuplicates
    });

    if (hasDuplicates) {
      console.error('❌ DUPLICATE TAXIS DETECTED IN ARRAY!');
      console.log('Full taxis array:', taxis);
    }
  }, [taxis, taxiCount, taxiIds]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('live-tracking-map').setView([51.505, -0.09], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '', // Hide attribution
        maxZoom: 19,
      }).addTo(map);

      // Hide the Leaflet attribution control
      map.attributionControl.remove();

      zonesLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load zones
  useEffect(() => {
    const loadZones = async () => {
      try {
        console.log('📥 Loading zones from database...');
        const zonesData = await zoneService.fetchZones();
        console.log(`✅ Loaded ${zonesData.length} zones:`, zonesData.map(z => ({ id: z.id, name: z.name })));
        setZones(zonesData);
      } catch (error) {
        console.error('❌ Error loading zones:', error);
      }
    };

    loadZones();
    
    // Refresh zones every 15 seconds to catch new zones added in Zone page
    const intervalId = setInterval(loadZones, 15000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Draw zones on map
  useEffect(() => {
    if (mapRef.current && zonesLayerRef.current && zones.length > 0) {
      zonesLayerRef.current.clearLayers();
      
      let drawnCount = 0;
      let skippedCount = 0;

      zones.forEach((zone) => {
        try {
          let boundary = zone.boundary;
          
          // Parse if it's a string
          if (typeof boundary === 'string') {
            // Check if it looks like a UUID or invalid data
            if (boundary.length < 50 || !boundary.includes('{')) {
              console.warn(`⚠️ Zone "${zone.name}" (${zone.id}) has invalid boundary format - skipping`);
              skippedCount++;
              return; // Skip this zone
            }
            
            try {
              boundary = JSON.parse(boundary);
            } catch (parseError) {
              console.warn(`⚠️ Zone "${zone.name}" (${zone.id}) boundary cannot be parsed - skipping`);
              skippedCount++;
              return; // Skip this zone
            }
          }

          // Validate GeoJSON structure
          if (!boundary || !boundary.type || !boundary.coordinates) {
            console.warn(`⚠️ Zone "${zone.name}" (${zone.id}) missing required GeoJSON properties - skipping`);
            skippedCount++;
            return; // Skip this zone
          }

          const polygon = L.geoJSON(boundary, {
            style: {
              color: '#3388ff',
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.1,
            },
          });

          polygon.bindPopup(`<strong>${zone.name}</strong><br>Zone ID: ${zone.id}`);
          polygon.addTo(zonesLayerRef.current!);
          drawnCount++;
        } catch (error) {
          console.warn(`⚠️ Zone "${zone.name}" (${zone.id}) could not be drawn - skipping`);
          skippedCount++;
        }
      });
      
      console.log(`🗺️ Zones drawn on map: ${drawnCount} successful, ${skippedCount} skipped (total: ${zones.length})`);
    }
  }, [zones]);

  // Update taxi markers
  useEffect(() => {
    if (!mapRef.current) return;

    console.log(`🗺️ Updating map with ${taxis.length} taxis:`, taxis.map(t => ({
      id: t.taxi_id,
      lat: t.lat.toFixed(6),
      lng: t.lng.toFixed(6),
      zone: t.zone || 'None'
    })));

    // Center map on first taxi if available
    if (taxis.length > 0 && markersRef.current.size === 0) {
      const firstTaxi = taxis[0];
      mapRef.current.setView([firstTaxi.lat, firstTaxi.lng], 13);
      console.log(`📍 Centered map on taxi ${firstTaxi.taxi_id} at (${firstTaxi.lat.toFixed(6)}, ${firstTaxi.lng.toFixed(6)})`);
    }

    taxis.forEach((taxi) => {
      const existingMarker = markersRef.current.get(taxi.taxi_id);

      if (existingMarker) {
        // Update existing marker
        existingMarker.setLatLng([taxi.lat, taxi.lng]);
        
        // Change color if zone changed
        if (taxi.zone_changed) {
          const icon = L.divIcon({
            className: 'custom-taxi-marker',
            html: `<div style="
              background-color: ${taxi.zone ? '#22c55e' : '#ef4444'};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">🚕</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          existingMarker.setIcon(icon);
        }

        existingMarker.setPopupContent(`
          <strong>Taxi ${taxi.taxi_id}</strong><br>
          Speed: ${taxi.speed || 0} km/h<br>
          Zone: ${taxi.zone || 'Outside'}<br>
          Last update: ${new Date(taxi.timestamp).toLocaleTimeString()}
        `);
      } else {
        // Create new marker
        const icon = L.divIcon({
          className: 'custom-taxi-marker',
          html: `<div style="
            background-color: ${taxi.zone ? '#3b82f6' : '#6b7280'};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">🚕</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([taxi.lat, taxi.lng], { icon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <strong>Taxi ${taxi.taxi_id}</strong><br>
            Speed: ${taxi.speed || 0} km/h<br>
            Zone: ${taxi.zone || 'Outside'}<br>
            Last update: ${new Date(taxi.timestamp).toLocaleTimeString()}
          `);

        markersRef.current.set(taxi.taxi_id, marker);
      }
    });

    // Remove markers for taxis that are no longer sending updates
    const currentTaxiIds = new Set(taxis.map((t) => t.taxi_id));
    markersRef.current.forEach((marker, taxiId) => {
      if (!currentTaxiIds.has(taxiId)) {
        marker.remove();
        markersRef.current.delete(taxiId);
      }
    });
  }, [taxis]);

  return (
    <div className="relative w-full h-full">
      <div 
        id="live-tracking-map" 
        className="w-full h-full rounded-lg shadow-lg"
      />
      
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className={`px-4 py-2 rounded-lg shadow-lg ${
          isConnected 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-white animate-pulse' : 'bg-white'
            }`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Taxi Count - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <div className="px-4 py-2 rounded-lg shadow-lg bg-white dark:bg-neutral-800">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🚕</span>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Active Taxis
              </div>
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {taxis.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
