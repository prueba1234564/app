import api from '../api/axios';

const toUploadFile = (archivo) => {
  if (!archivo) return null;
  if (typeof File !== 'undefined' && archivo instanceof File) return archivo;
  return {
    uri: archivo.uri,
    type: archivo.mimeType || archivo.type || 'application/octet-stream',
    name: archivo.name || 'archivo.pdf',
  };
};

const appendArray = (formData, key, values = []) => {
  values.forEach((value) => formData.append(`${key}[]`, value));
};

const buildPayload = (data) => {
  if (!data.archivo) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || key === 'archivo') return;
    if (Array.isArray(value)) {
      appendArray(formData, key, value);
      return;
    }
    formData.append(key, value);
  });

  formData.append('archivo', toUploadFile(data.archivo));
  return formData;
};

const getRecibidas = async () => {
  const response = await api.get('/notificaciones/recibidas');
  return response.data?.data || response.data || [];
};

const getEnviadas = async () => {
  const response = await api.get('/notificaciones/enviadas');
  return response.data?.data || response.data || [];
};

const create = async (data) => {
  const payload = buildPayload(data);
  const response = await api.post('/notificaciones', payload, data.archivo ? {
    headers: { 'Content-Type': 'multipart/form-data' },
  } : undefined);
  return response.data;
};

const markAsRead = async (id) => {
  const response = await api.post(`/notificaciones/${id}/leer`);
  return response.data?.data || response.data;
};

export { getRecibidas, getEnviadas, create, markAsRead };
