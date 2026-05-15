import api from '../api/axios';
import { Platform } from 'react-native';

/**
 * POST /auth/registro
 * Registro de estudiante con PDF de matrícula.
 * Usa FormData porque incluye un archivo.
 */
export const registrarEstudiante = async ({ nombre, email, password, ru, carreraId, archivoPdf }) => {
  const formData = new FormData();
  formData.append('nombre',                 nombre);
  formData.append('email',                  email);
  formData.append('password',               password);
  formData.append('registro_universitario', ru);
  formData.append('carrera_id',             String(carreraId));

  // En web, expo-document-picker devuelve el archivo como File nativo
  // En móvil, devuelve { uri, name, mimeType }
  if (Platform.OS === 'web') {
    // En web el archivo ya es un objeto File nativo — appendarlo directo
    const file = archivoPdf.file ?? archivoPdf;
    if (file instanceof File) {
      formData.append('matricula_pdf', file, file.name ?? 'matricula.pdf');
    } else if (archivoPdf.uri && archivoPdf.uri.startsWith('blob:')) {
      // Convertir blob URL a File
      const blob = await fetch(archivoPdf.uri).then((r) => r.blob());
      const fileObj = new File([blob], archivoPdf.name ?? 'matricula.pdf', { type: 'application/pdf' });
      formData.append('matricula_pdf', fileObj, fileObj.name);
    } else {
      // Fallback: intentar como objeto plano
      formData.append('matricula_pdf', archivoPdf.uri ?? archivoPdf);
    }
  } else {
    // Móvil: React Native acepta el objeto { uri, name, type }
    formData.append('matricula_pdf', {
      uri:  archivoPdf.uri,
      name: archivoPdf.name ?? archivoPdf.fileName ?? 'matricula.pdf',
      type: archivoPdf.mimeType ?? 'application/pdf',
    });
  }

  const response = await api.post('/auth/registro', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export default { registrarEstudiante };
