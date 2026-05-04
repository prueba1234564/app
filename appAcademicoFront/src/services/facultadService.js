import api from '../api/axios';

export const getAll = async () => {
  const response = await api.get('/facultades');
  return response.data;
};

export const getOne = async (id) => {
  const response = await api.get(`/facultades/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await api.post('/facultades', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await api.put(`/facultades/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/facultades/${id}`);
  return response.data;
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
};
