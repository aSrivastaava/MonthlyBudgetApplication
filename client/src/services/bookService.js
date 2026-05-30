import axios from 'axios';

export const bookService = {
  getBook: async (houseId) => {
    try {
      const response = await axios.get(`/api/houses/${houseId}/book`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch book' };
    }
  },

  deletePayment: async (houseId, paymentId) => {
    try {
      const response = await axios.delete(`/api/houses/${houseId}/payments/${paymentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete payment' };
    }
  },
};
