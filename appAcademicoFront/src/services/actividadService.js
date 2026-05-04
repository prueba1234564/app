import api from '../api/axios';

const getAll = async (params = {}) => {
  const response = await api.get('/actividades', { params });
  return response.data?.data || response.data || [];
};

const getById = async (id) => {
  const response = await api.get(`/actividades/${id}`);
  return response.data?.data || response.data;
};

const create = async (data) => {
  // Si hay archivo, usar FormData
  if (data.archivo) {
    const formData = new FormData();
    formData.append('titulo', data.titulo);
    formData.append('descripcion', data.descripcion || '');
    formData.append('categoria', data.categoria);
    formData.append('fecha_entrega', data.fecha_entrega || '');
    if (data.materia_id !== undefined) formData.append('materia_id', data.materia_id || '');
    formData.append('carrera_id', data.carrera_id || '');
    formData.append('rol_destino', data.rol_destino);
    
    if (data.archivo) {
      formData.append('archivo', {
        uri: data.archivo.uri,
        type: data.archivo.mimeType || data.archivo.type || 'application/octet-stream',
        name: data.archivo.name || 'archivo.pdf',
      });
    }
    
    const response = await api.post('/actividades', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  // Sin archivo, JSON normal
  const response = await api.post('/actividades', data);
  return response.data;
};

const update = async (id, data) => {
  // Si hay archivo, usar FormData
  if (data.archivo) {
    const formData = new FormData();
    if (data.titulo) formData.append('titulo', data.titulo);
    if (data.descripcion !== undefined) formData.append('descripcion', data.descripcion);
    if (data.categoria) formData.append('categoria', data.categoria);
    if (data.fecha_entrega !== undefined) formData.append('fecha_entrega', data.fecha_entrega);
    if (data.materia_id !== undefined) formData.append('materia_id', data.materia_id);
    if (data.carrera_id !== undefined) formData.append('carrera_id', data.carrera_id);
    if (data.rol_destino) formData.append('rol_destino', data.rol_destino);
    
    formData.append('_method', 'PUT');
    
    if (data.archivo) {
      formData.append('archivo', {
        uri: data.archivo.uri,
        type: data.archivo.mimeType || data.archivo.type || 'application/octet-stream',
        name: data.archivo.name || 'archivo.pdf',
      });
    }
    
    const response = await api.post(`/actividades/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  // Sin archivo, JSON normal
  const response = await api.put(`/actividades/${id}`, data);
  return response.data;
};

const remove = async (id) => {
  const response = await api.delete(`/actividades/${id}`);
  return response.data;
};

export { getAll, getById, create, update, remove };
