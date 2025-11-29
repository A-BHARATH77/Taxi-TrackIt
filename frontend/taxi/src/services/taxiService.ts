interface Taxi {
  id: number;
  name: string;
  taxi_id: string;
  created_at: string;
}

interface AddTaxiData {
  name: string;
  taxiId: string;
}

interface UpdateTaxiData {
  name: string;
  taxiId: string;
}

const API_URL = import.meta.env.VITE_SERVER_URL;

export const taxiService = {
  // Fetch all taxis
  async fetchTaxis(): Promise<Taxi[]> {
    try {
      const response = await fetch(`${API_URL}/taxis`);
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch taxis');
      }
    } catch (error) {
      throw new Error(`Error fetching taxis: ${(error as Error).message}`);
    }
  },

  // Add a new taxi
  async addTaxi(data: AddTaxiData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/taxi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          taxi_id: data.taxiId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error adding taxi');
      }

      return result;
    } catch (error) {
      throw new Error(`Error adding taxi: ${(error as Error).message}`);
    }
  },

  // Update a taxi
  async updateTaxi(id: number, data: UpdateTaxiData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/taxi/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          taxi_id: data.taxiId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error updating taxi');
      }

      return result;
    } catch (error) {
      throw new Error(`Error updating taxi: ${(error as Error).message}`);
    }
  },

  // Delete a taxi
  async deleteTaxi(id: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/taxi/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete taxi');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Error deleting taxi: ${(error as Error).message}`);
    }
  },
};
