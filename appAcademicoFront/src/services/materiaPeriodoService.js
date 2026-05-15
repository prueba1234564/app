import api from '../api/axios';

export const getAll = async (params = {}) => {
  const response = await api.get('/materia-periodo', { params });
  return response.data;
};

export const getOne = async (id) => {
  const response = await api.get(`/materia-periodo/${id}`);
  return response.data;
};

export const create = async (data) => {
  const response = await api.post('/materia-periodo', data);
  return response.data;
};

export const update = async (id, data) => {
  const response = await api.put(`/materia-periodo/${id}`, data);
  return response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/materia-periodo/${id}`);
  return response.data;
};

export const getByPeriodoActivo = async () => {
  const response = await api.get('/materia-periodo/periodo-activo');
  return response.data;
};

export const getByDocente = async (docenteId, periodoId = null) => {
  const params = periodoId ? { periodo_id: periodoId } : {};
  const response = await api.get(`/materia-periodo/docente/${docenteId}`, { params });
  return response.data;
};

export const asignarDocente = async (id, docenteId) => {
  const response = await api.put(`/materia-periodo/${id}/asignar-docente`, { docente_id: docenteId });
  return response.data;
};

export const getDocenteOfertas = async () => {
  const response = await api.get('/docente/ofertas-periodo');
  return response.data;
};

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByPeriodoActivo,
  getByDocente,
  asignarDocente,
  getDocenteOfertas,
};
