import api from '../api/axios';

export const getAll = async () => {
  const response = await api.get('/usuarios');
  return response.data?.data ?? response.data;
};

export const getOne = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await api.post('/usuarios', data);
  return response.data?.data ?? response.data;
};

export const update = async (id, data) => {
  const response = await api.put(`/usuarios/${id}`, data);
  return response.data?.data ?? response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/usuarios/${id}`);
  return response.data;
};

export const asignarDirector = async (id, carrera_id) => {
  const response = await api.post(`/usuarios/${id}/asignar-director`, { carrera_id });
  return response.data;
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  asignarDirector,
};
