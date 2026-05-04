import api from '../api/axios';

export const getAll = async () => {
  const response = await api.get('/materias');
  return response.data;
};

export const getOne = async (id) => {
  const response = await api.get(`/materias/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await api.post('/materias', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await api.put(`/materias/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/materias/${id}`);
  return response.data;
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
};
