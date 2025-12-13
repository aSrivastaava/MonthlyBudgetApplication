import axios from 'axios';

const API_URL = 'http://localhost:5000/api/houses';

export const paymentService = {
  async createPayment(houseId, paymentData) {
    try {
      const formData = new FormData();
      formData.append('budgetId', paymentData.budgetId);
      formData.append('category', paymentData.category);
      formData.append('amount', paymentData.amount);
      if (paymentData.description) {
        formData.append('description', paymentData.description);
      }
      if (paymentData.receipt) {
        formData.append('receipt', paymentData.receipt);
      }
      if (paymentData.contributions) {
        formData.append('contributions', JSON.stringify(paymentData.contributions));
      }

      const response = await axios.post(`${API_URL}/${houseId}/payment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create payment'
      };
    }
  },

  async getPaymentsByBudget(houseId, budgetId) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/payments/${budgetId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payments'
      };
    }
  },

  async getAllPayments(houseId) {
    try {
      const response = await axios.get(`${API_URL}/${houseId}/payments`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payments'
      };
    }
  }
};
