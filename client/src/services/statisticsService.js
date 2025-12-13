import axios from 'axios';

const API_URL = 'http://localhost:5000/api/houses';

export const statisticsService = {
  async getStatistics(houseId, year, month) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/statistics/${year}/${month}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch statistics'
      };
    }
  }
};
