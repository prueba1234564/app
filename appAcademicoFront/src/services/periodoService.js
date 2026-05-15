import api from '../api/axios';

// ─── Años académicos (nivel decano) ──────────────────────────────────────────

export const getAnios = async () => {
  const response = await api.get('/periodos/anios');
  return response.data?.data ?? [];
};

export const createAnio = async (data) => {
  const response = await api.post('/periodos/anios', data);
  return response.data;
};

export const activarAnio = async (id) => {
  const response = await api.put(`/periodos/anios/${id}/activar`);
  return response.data;
};

// ─── Períodos de carrera (nivel director) ────────────────────────────────────

export const getAll = async () => {
  const response = await api.get('/periodos');
  return response.data?.data ?? response.data ?? [];
};

export const getOne = async (id) => {
  const response = await api.get(`/periodos/${id}`);
  return response.data;
};

/** Solo para director — usa rutas /director/periodos */
export const createDirector = async (data) => {
  const response = await api.post('/director/periodos', data);
  return response.data;
};

export const updateDirector = async (id, data) => {
  const response = await api.put(`/director/periodos/${id}`, data);
  return response.data;
};

export const removeDirector = async (id) => {
  const response = await api.delete(`/director/periodos/${id}`);
  return response.data;
};

export const activarDirector = async (id) => {
  const response = await api.put(`/director/periodos/${id}/activar`);
  return response.data;
};

// ─── Compartidos ─────────────────────────────────────────────────────────────

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

/**
 * Obtiene el período activo.
 * - Sin parámetros → año académico activo
 * - Con tipoCarrera → período de carrera compatible
 * - Con carreraId   → período activo de esa carrera específica
 */
export const getActivo = async ({ tipoCarrera = null, carreraId = null } = {}) => {
  const params = new URLSearchParams();
  if (tipoCarrera) params.append('tipo_carrera', tipoCarrera);
  if (carreraId)   params.append('carrera_id', carreraId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/periodos/activo${qs}`);
  return response.data;
};

export default {
  getAnios,
  createAnio,
  activarAnio,
  getAll,
  getOne,
  create,
  update,
  remove,
  activar,
  createDirector,
  updateDirector,
  removeDirector,
  activarDirector,
  getActivo,
};
