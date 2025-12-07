import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/houses';

export const houseService = {
  createHouse: async (name) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/create`, { name });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create house'
      };
    }
  },

  joinHouse: async (houseKey) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/join`, { houseKey });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to join house'
      };
    }
  },

  getMyHouses: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/my-houses`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch houses'
      };
    }
  },

  getHouseDetails: async (houseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${houseId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch house details'
      };
    }
  },

  renameHouse: async (houseId, name) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${houseId}/rename`, { name });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to rename house'
      };
    }
  },

  assignRole: async (houseId, memberId, role) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${houseId}/assign-role`, {
        memberId,
        role
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to assign role'
      };
    }
  }
};
