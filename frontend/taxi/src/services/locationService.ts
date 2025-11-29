interface TaxiLocation {
  taxi_id: string;
  lat: number;
  lng: number;
  speed: number;
  zone: number | null;
  timestamp: number;
}

const API_URL = import.meta.env.VITE_SERVER_URL;
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export const locationService = {
  // Get all current taxi locations
  async getAllLocations(): Promise<TaxiLocation[]> {
    try {
      const response = await fetch(`${API_URL}/location/latest`);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw new Error(`Error fetching locations: ${(error as Error).message}`);
    }
  },

  // Get specific taxi location
  async getTaxiLocation(taxiId: string): Promise<TaxiLocation> {
    try {
      const response = await fetch(`${API_URL}/location/${taxiId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch taxi location');
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error(`Error fetching taxi location: ${(error as Error).message}`);
    }
  },

  // Send location update (for testing)
  async updateLocation(data: {
    taxi_id: string;
    lat: number;
    lng: number;
    speed?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error updating location');
      }

      return result;
    } catch (error) {
      throw new Error(`Error updating location: ${(error as Error).message}`);
    }
  },

  // Connect to WebSocket
  connectWebSocket(
    onUpdate: (data: any) => void,
    onError?: (error: Event) => void,
    onZoneCrossing?: (data: any) => void
  ): WebSocket {
    console.log('🔌 Creating new WebSocket connection to:', WS_URL);
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Raw WebSocket message received:', message);
        if (message.type === 'taxi_update') {
          console.log('🚕 Processing taxi_update for:', message.data.taxi_id);
          onUpdate(message.data);
        } else if (message.type === 'zone_crossing' && onZoneCrossing) {
          console.log('🚪 Processing zone_crossing event:', message.data);
          onZoneCrossing(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
    };

    return ws;
  },
};
