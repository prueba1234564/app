import api from '../api/axios';

export const getStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export default {
  getStats,
};
