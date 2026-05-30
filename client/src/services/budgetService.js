import axios from 'axios';

const API_URL = '/api/houses';

export const budgetService = {
  async createOrUpdateBudget(houseId, budgetData) {
    try {
      const response = await axios.post(`${API_URL}/${houseId}/budget`, budgetData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create/update budget'
      };
    }
  },

  async getBudget(houseId, year, month) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/budget/${year}/${month}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch budget'
      };
    }
  },

  async getAllBudgets(houseId) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/budgets`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch budgets'
      };
    }
  }
};
