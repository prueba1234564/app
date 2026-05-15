import api from '../api/axios';

const unwrap = (response) => response.data?.data || response.data || [];

export const getMisMaterias = async () => {
  const response = await api.get('/docente/materias');
  return unwrap(response);
};

export const getMisActividades = async () => {
  const response = await api.get('/docente/actividades');
  return unwrap(response);
};

export const getEstudiantesPorMateria = async (materiaId) => {
  const response = await api.get(`/docente/materias/${materiaId}/estudiantes`);
  return unwrap(response);
};

export const getActividadesPorMateria = async (materiaId) => {
  const response = await api.get(`/docente/materias/${materiaId}/actividades`);
  return unwrap(response);
};
