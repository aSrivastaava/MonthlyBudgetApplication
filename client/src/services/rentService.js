import axios from 'axios';

const API_URL = 'http://localhost:5000/api/houses';

export const rentService = {
  async createOrUpdateRent(houseId, rentData) {
    try {
      const formData = new FormData();
      formData.append('month', rentData.month);
      formData.append('year', rentData.year);
      formData.append('totalAmount', rentData.totalAmount);
      if (rentData.receipt) {
        formData.append('receipt', rentData.receipt);
      }
      if (rentData.contributions) {
        formData.append('contributions', JSON.stringify(rentData.contributions));
      }

      const response = await axios.post(`${API_URL}/${houseId}/rent`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create/update rent payment'
      };
    }
  },

  async getRentPayment(houseId, year, month) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/rent/${year}/${month}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch rent payment'
      };
    }
  },

  async getAllRentPayments(houseId) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/rent`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch rent payments'
      };
    }
  }
};
