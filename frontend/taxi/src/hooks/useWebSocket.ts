import { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { toast } from 'sonner';

interface TaxiLocation {
  taxi_id: string;
  lat: number;
  lng: number;
  speed: number;
  zone: number | null;
  timestamp: number;
  zone_changed?: boolean;
}

export const useWebSocket = () => {
  const [taxis, setTaxis] = useState<Map<string, TaxiLocation>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Load initial locations
    const loadInitialLocations = async () => {
      try {
        console.log('📡 Loading initial taxi locations...');
        const locations = await locationService.getAllLocations();
        console.log(`✅ Loaded ${locations.length} initial locations:`, locations);
        const taxiMap = new Map();
        locations.forEach((loc) => {
          // Ensure taxi_id is always a string
          const normalizedLoc = { ...loc, taxi_id: String(loc.taxi_id) };
          taxiMap.set(String(loc.taxi_id), normalizedLoc);
        });
        setTaxis(taxiMap);
      } catch (error) {
        console.error('Error loading initial locations:', error);
      }
    };

    loadInitialLocations();

    // Connect to WebSocket
    const websocket = locationService.connectWebSocket(
      (data: TaxiLocation) => {
        // Ensure taxi_id is always a string
        const normalizedData = { ...data, taxi_id: String(data.taxi_id) };
        
        console.log('📍 Frontend received taxi update:', {
          taxi_id: normalizedData.taxi_id,
          lat: normalizedData.lat.toFixed(6),
          lng: normalizedData.lng.toFixed(6),
          speed: normalizedData.speed,
          zone: normalizedData.zone,
          zone_changed: normalizedData.zone_changed
        });
        
        setTaxis((prev) => {
          const newMap = new Map(prev);
          console.log('🔧 Before update - Map size:', prev.size, 'Keys:', Array.from(prev.keys()));
          newMap.set(String(normalizedData.taxi_id), normalizedData);
          console.log('🔧 After update - Map size:', newMap.size, 'Keys:', Array.from(newMap.keys()));
          return newMap;
        });
      },
      (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      },
      (zoneCrossingData) => {
        // Handle zone crossing events and show toast
        const { event_type, taxi_name, previous_zone, current_zone } = zoneCrossingData;
        
        if (event_type === 'ENTER') {
          toast.success(`${taxi_name} entered ${current_zone}`, {
            description: `From ${previous_zone}`,
            duration: 4000,
          });
        } else if (event_type === 'EXIT') {
          toast.info(`${taxi_name} exited ${previous_zone}`, {
            description: `Now in ${current_zone}`,
            duration: 4000,
          });
        } else if (event_type === 'CROSSING') {
          toast(`${taxi_name} crossed zones`, {
            description: `${previous_zone} → ${current_zone}`,
            duration: 4000,
          });
        }
      }
    );

    websocket.addEventListener('open', () => setIsConnected(true));
    websocket.addEventListener('close', () => setIsConnected(false));

    setWs(websocket);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
      }
    };
  }, []);

  return {
    taxis: Array.from(taxis.values()),
    isConnected,
    ws,
    taxiCount: taxis.size,
    taxiIds: Array.from(taxis.keys()),
  };
};
