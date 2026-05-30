import axios from 'axios';

export const settlementService = {
  getBalances: async (houseId) => {
    try {
      const res = await axios.get(`/api/houses/${houseId}/balances`);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Failed to load balances' };
    }
  },
  settle: async (houseId, paidTo, amount, note) => {
    try {
      const res = await axios.post(`/api/houses/${houseId}/settle`, { paidTo, amount, note });
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Failed to record settlement' };
    }
  },
  getActivity: async (houseId, limit = 30) => {
    try {
      const res = await axios.get(`/api/houses/${houseId}/activity?limit=${limit}`);
      return { success: true, data: res.data };
    } catch (e) {
      return { success: false, error: e.response?.data?.message || 'Failed to load activity' };
    }
  }
};
