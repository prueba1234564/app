import api from '../api/axios';

export const getAll = async () => {
  const response = await api.get('/periodos');
  return response.data;
};

export const getOne = async (id) => {
  const response = await api.get(`/periodos/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await api.post('/periodos', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await api.put(`/periodos/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/periodos/${id}`);
  return response.data;
};

export const activar = async (id) => {
  const response = await api.put(`/periodos/${id}/activar`);
  return response.data;
};

export const getActivo = async () => {
  const response = await api.get('/periodos/activo');
  return response.data;
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  activar,
  getActivo,
};
