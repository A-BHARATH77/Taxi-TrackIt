interface Zone {
  id: number;
  name: string;
  boundary: string;
  created_at: string;
}

interface AddZoneData {
  name: string;
  boundary: any;
}

const API_URL = import.meta.env.VITE_SERVER_URL;

export const zoneService = {
  // Fetch all zones
  async fetchZones(): Promise<Zone[]> {
    try {
      const response = await fetch(`${API_URL}/zones`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch zones');
      }
    } catch (error) {
      throw new Error(`Error fetching zones: ${(error as Error).message}`);
    }
  },

  // Add a new zone
  async addZone(data: AddZoneData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/zone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          boundary: data.boundary,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error adding zone');
      }

      return result;
    } catch (error) {
      throw new Error(`Error adding zone: ${(error as Error).message}`);
    }
  },

  // Delete a zone
  async deleteZone(id: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/zone/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete zone');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Error deleting zone: ${(error as Error).message}`);
    }
  },
};
