import api from '../api/axios';

const unwrap = (response) => response.data?.data || response.data || [];

/**
 * GET /estudiante/historial
 * Returns materias grouped by periodo with docente and horarios info.
 */
export const getMisMaterias = async () => {
  const response = await api.get('/estudiante/historial');
  const data = unwrap(response);

  // Flatten all materias from all periods, keeping period + docente context
  const materias = [];
  data.forEach((periodoGroup) => {
    (periodoGroup.materias || []).forEach((item) => {
      materias.push({
        ...item.materia,
        paralelo: item.paralelo,
        estado: item.estado,
        docente: item.docente,
        horarios: item.horarios || [],
        periodo: periodoGroup.periodo,
        materia_periodo_id: item.id,
      });
    });
  });

  return materias;
};

/**
 * GET /actividades?carrera_id=X&rol_destino=estudiantes
 * Returns activities for the student's carrera.
 */
export const getMisActividades = async (carreraId) => {
  const params = { rol_destino: 'estudiantes' };
  if (carreraId) params.carrera_id = carreraId;

  const response = await api.get('/actividades', { params });
  return unwrap(response);
};

/**
 * GET /notificaciones/recibidas
 */
export const getMisNotificaciones = async () => {
  const response = await api.get('/notificaciones/recibidas');
  return response.data?.data || response.data || [];
};

/**
 * POST /notificaciones/:id/leer
 */
export const marcarLeida = async (id) => {
  const response = await api.post(`/notificaciones/${id}/leer`);
  return response.data?.data || response.data;
};

/**
 * GET /estudiante/materias-carrera
 * Returns all materias of the student's carrera with inscription status
 * and active period offer info.
 */
export const getMateriasCarrera = async () => {
  const response = await api.get('/estudiante/materias-carrera');
  return response.data; // { success, periodo_activo, data: [...] }
};

/**
 * POST /estudiante/inscribirse
 */
export const inscribirseMateria = async (materiaId) => {
  const response = await api.post('/estudiante/inscribirse', { materia_id: materiaId });
  return response.data;
};

/**
 * POST /estudiante/desinscribirse
 */
export const desinscribirseMateria = async (materiaId) => {
  const response = await api.post('/estudiante/desinscribirse', { materia_id: materiaId });
  return response.data;
};

/**
 * POST /estudiante/actividades/:id/completar
 */
export const completarActividad = async (id) => {
  const response = await api.post(`/estudiante/actividades/${id}/completar`);
  return response.data;
};

/**
 * DELETE /estudiante/actividades/:id/completar
 */
export const descompletarActividad = async (id) => {
  const response = await api.delete(`/estudiante/actividades/${id}/completar`);
  return response.data;
};
