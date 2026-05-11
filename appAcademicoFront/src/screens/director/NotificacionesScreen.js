import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

import BottomNav from '../../components/BottomNav';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DESTINOS = [
  { label: 'Docentes', value: 'docentes' },
  { label: 'Estudiantes', value: 'estudiantes' },
  { label: 'C. Estudiantes', value: 'centro_estudiantes' },
];

export default function NotificacionesScreen({ navigation }) {
  const { usuario } = useAuth();
  const directorCarreraId = usuario?.carrera_id;
  const directorCarreraNombre = usuario?.carrera?.nombre || 'Mi Carrera';

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [rolesSeleccionados, setRolesSeleccionados] = useState(['docentes']);
  const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [archivoActual, setArchivoActual] = useState(null);
  const [eliminarArchivo, setEliminarArchivo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notificacionEditando, setNotificacionEditando] = useState(null);
  const [notificacionDetalle, setNotificacionDetalle] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const fileInputRef = useRef(null);
  
  // Actividad vinculada (opcional)
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [showActividadPicker, setShowActividadPicker] = useState(false);
  
  // Estados para filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Tab activa: 'recibidas' o 'enviadas'
  const [vistaActiva, setVistaActiva] = useState('recibidas');
  const [notificacionesRecibidas, setNotificacionesRecibidas] = useState([]);
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState([]);

  const toggleDestino = (value) => {
    setRolesSeleccionados((prev) => {
      const exists = prev.includes(value);
      const next = exists ? prev.filter((item) => item !== value) : [...prev, value];
      return next.length ? next : ['docentes'];
    });
  };

  const getRolDestinoPayload = () => {
    const normalized = rolesSeleccionados.filter(
      (value) => value === 'centro_estudiantes' || value === 'docentes' || value === 'estudiantes'
    );
    return normalized.length ? normalized[0] : 'docentes';
  };

  const getRolesArrayPayload = () => {
    const normalized = rolesSeleccionados.filter(
      (value) => value === 'centro_estudiantes' || value === 'docentes' || value === 'estudiantes'
    );
    return normalized.length > 0 ? normalized : null;
  };

  const cargarNotificaciones = async (params = {}) => {
    setLoadingList(true);
    try {
      // Construir query params para filtros de fecha
      const queryParamsRecibidas = new URLSearchParams();
      const queryParamsEnviadas = new URLSearchParams();
      
      if (params.fecha_desde) {
        queryParamsRecibidas.append('fecha_desde', params.fecha_desde);
        queryParamsEnviadas.append('fecha_desde', params.fecha_desde);
      }
      if (params.fecha_hasta) {
        queryParamsRecibidas.append('fecha_hasta', params.fecha_hasta);
        queryParamsEnviadas.append('fecha_hasta', params.fecha_hasta);
      }
      
      const urlRecibidas = '/notificaciones/recibidas' + (queryParamsRecibidas.toString() ? `?${queryParamsRecibidas.toString()}` : '');
      const urlEnviadas = '/notificaciones/enviadas' + (queryParamsEnviadas.toString() ? `?${queryParamsEnviadas.toString()}` : '');
      
      console.log('>>> Cargando notificaciones recibidas:', urlRecibidas);
      console.log('>>> Cargando notificaciones enviadas:', urlEnviadas);
      
      const [responseRecibidas, responseEnviadas] = await Promise.all([
        api.get(urlRecibidas),
        api.get(urlEnviadas)
      ]);
      
      setNotificacionesRecibidas(responseRecibidas.data?.data ?? []);
      setNotificacionesEnviadas(responseEnviadas.data?.data ?? []);
      
      // Mantener compatibilidad con el estado notificaciones
      setNotificaciones(vistaActiva === 'recibidas' 
        ? (responseRecibidas.data?.data ?? []) 
        : (responseEnviadas.data?.data ?? []));
    } catch (_error) {
      console.error('Error cargando notificaciones:', _error);
      setNotificacionesRecibidas([]);
      setNotificacionesEnviadas([]);
      setNotificaciones([]);
    } finally {
      setLoadingList(false);
    }
  };
  
  const aplicarFiltros = () => {
    cargarNotificaciones({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta
    });
  };
  
  const cambiarVista = (vista) => {
    setVistaActiva(vista);
    // Actualizar notificaciones según la vista seleccionada
    setNotificaciones(vista === 'recibidas' ? notificacionesRecibidas : notificacionesEnviadas);
  };
  
  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    cargarNotificaciones();
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarActividades = async () => {
    try {
      const response = await api.get('/actividades');
      setActividades(response.data?.data ?? []);
    } catch (_e) {
      setActividades([]);
    }
  };

  const cargarCarreras = async () => {
    try {
      const response = await api.get('/carreras');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
      setCarreras(data);
    } catch (error) {
      console.error('Error cargando carreras:', error?.response?.data || error.message);
      setCarreras([]);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setCuerpo('');
    setRolesSeleccionados(['todos']);
    setCarrerasSeleccionadas([]);
    setArchivo(null);
    setArchivoActual(null);
    setEliminarArchivo(false);
    setNotificacionEditando(null);
    setActividadSeleccionada(null);
  };

  const openCreateModal = () => {
    resetForm();
    cargarActividades();
    setShowCreateForm(true);
  };

  const handleEnviar = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      Alert.alert('Error', 'Título y mensaje son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const rolDestino = getRolDestinoPayload();
      const rolesArray = getRolesArrayPayload();
      
      const payload = {
        titulo: titulo.trim(),
        cuerpo: cuerpo.trim(),
        rol_destino: rolDestino,
      };

      // Director: forzar el envío a su propia carrera
      if (directorCarreraId) {
        payload.carrera_ids = [directorCarreraId];
      } else if (carrerasSeleccionadas.length > 0) {
        payload.carrera_ids = carrerasSeleccionadas;
      }
      
      // Solo enviar rol_destino_array si hay múltiples roles seleccionados
      if (rolesArray && rolesArray.length > 1) {
        payload.rol_destino_array = rolesArray;
      }

      // Actividad vinculada (opcional)
      if (actividadSeleccionada) {
        payload.actividad_id = actividadSeleccionada.id;
      }

      let response;
      
      // Usar FormData si hay archivo (tanto para crear como editar)
      if (archivo || !notificacionEditando) {
        const formData = new FormData();
        formData.append('titulo', payload.titulo);
        formData.append('cuerpo', payload.cuerpo);
        formData.append('rol_destino', payload.rol_destino);
        
        // Solo enviar rol_destino_array si hay múltiples roles seleccionados
        if (rolesArray && rolesArray.length > 1) {
          rolesArray.forEach((rol) => {
            formData.append('rol_destino_array[]', rol);
          });
        }

        // Director: forzar el envío a su propia carrera
        if (directorCarreraId) {
          formData.append('carrera_ids[]', directorCarreraId);
        } else if (carrerasSeleccionadas.length > 0) {
          carrerasSeleccionadas.forEach((id) => {
            formData.append('carrera_ids[]', id);
          });
        }
        
        if (archivo) {
          console.log('>>> Archivo a enviar:', archivo);
          console.log('>>> Es File nativo:', archivo instanceof File);
          formData.append('archivo', archivo);
        }
        
        // Actividad vinculada (opcional)
        if (actividadSeleccionada) {
          formData.append('actividad_id', actividadSeleccionada.id);
        }
        
        // Si se marcó para eliminar el archivo existente
        if (eliminarArchivo && !archivo) {
          formData.append('eliminar_archivo', 'true');
          console.log('>>> Marcado para eliminar archivo existente');
        }
        
        console.log('>>> Enviando FormData...');
        
        if (notificacionEditando) {
          // Para editar con archivo, usar POST directo
          response = await api.post(`/notificaciones/${notificacionEditando.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await api.post('/notificaciones', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        // Editar sin archivo - usar JSON normalmente, o FormData si se quiere eliminar archivo
        if (eliminarArchivo) {
          // Usar FormData para enviar la bandera de eliminar archivo
          const formData = new FormData();
          formData.append('titulo', payload.titulo);
          formData.append('cuerpo', payload.cuerpo);
          formData.append('rol_destino', payload.rol_destino);
          formData.append('eliminar_archivo', 'true');
          
          if (rolesArray && rolesArray.length > 1) {
            rolesArray.forEach((rol) => {
              formData.append('rol_destino_array[]', rol);
            });
          }

          // Director: forzar el envío a su propia carrera
          if (directorCarreraId) {
            formData.append('carrera_ids[]', directorCarreraId);
          } else if (carrerasSeleccionadas.length > 0) {
            carrerasSeleccionadas.forEach((id) => {
              formData.append('carrera_ids[]', id);
            });
          }
          
          console.log('>>> Enviando FormData para eliminar archivo...');
          response = await api.post(`/notificaciones/${notificacionEditando.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await api.put(`/notificaciones/${notificacionEditando.id}`, payload);
        }
      }

      console.log('>>> Respuesta del backend:', response.data);
      if (response.data?.success) {
        Alert.alert('Éxito', notificacionEditando ? 'Notificación actualizada correctamente' : 'Notificación enviada correctamente');
        resetForm();
        setShowCreateForm(false);
        await cargarNotificaciones();
        return;
      }
      Alert.alert('Error', response.data?.message || 'No se pudo enviar la notificación');
    } catch (error) {
      console.error('Error al enviar:', error?.response?.data || error);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'No se pudo enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (item) => {
    console.log('>>> Editando notificación:', item);
    console.log('>>> rol_destino recibido:', item.rol_destino);
    
    // Manejar carrera_ids que puede venir como string JSON o array
    let carrerasIds = [];
    if (item.carrera_ids) {
      if (typeof item.carrera_ids === 'string') {
        try {
          carrerasIds = JSON.parse(item.carrera_ids);
        } catch (e) {
          console.log('Error parseando carrera_ids:', e);
          carrerasIds = [];
        }
      } else if (Array.isArray(item.carrera_ids)) {
        carrerasIds = item.carrera_ids;
      }
    } else if (item.carrera_id) {
      carrerasIds = [item.carrera_id];
    }
    
    // Manejar múltiples roles (rol_destino_array tiene prioridad)
    let rolesArray = ['todos'];
    if (item.rol_destino_array && item.rol_destino_array.length > 0) {
      rolesArray = item.rol_destino_array;
    } else if (item.rol_destino) {
      rolesArray = [item.rol_destino];
    }
    
    // Actualizar todos los estados primero
    setNotificacionEditando(item);
    setTitulo(item.titulo);
    setCuerpo(item.cuerpo);
    setRolesSeleccionados(rolesArray);
    setCarrerasSeleccionadas(carrerasIds);
    setArchivo(null); // Nuevo archivo seleccionado (null inicialmente)
    setArchivoActual(item.ruta_archivo || null); // Guardar archivo existente
    
    console.log('>>> Estados actualizados, abriendo modal...');
    console.log('>>> rolesSeleccionados:', rolesArray);
    console.log('>>> carrerasSeleccionadas:', carrerasIds);
    
    // Abrir el modal después de actualizar estados
    setShowCreateForm(true);
  };

  const handleEliminar = async (item) => {
    console.log('>>> handleEliminar llamado con item:', item);
    
    if (!item || !item.id) {
      console.log('>>> ERROR: Item inválido o sin ID');
      return;
    }
    
    // Cerrar el modal de detalle primero
    setNotificacionDetalle(null);
    
    const isWeb = Platform.OS === 'web';
    
    // Pequeño delay para que el modal se cierre antes de eliminar
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('>>> Enviando DELETE...');
    try {
      console.log('>>> URL:', `/notificaciones/${item.id}`);
      const response = await api.delete(`/notificaciones/${item.id}`);
      console.log('>>> Respuesta DELETE:', response.data);
      await cargarNotificaciones();
      console.log('>>> Notificación eliminada correctamente');
    } catch (error) {
      console.log('>>> Error al eliminar:', error);
    }
  };

  const updateReadState = (item) => {
    setNotificaciones((prev) => prev.map((notif) => notif.id === item.id ? item : notif));
    setNotificacionesRecibidas((prev) => prev.map((notif) => notif.id === item.id ? item : notif));
  };

  const handleVerDetalle = async (item) => {
    const readItem = { ...item, leida: true, leido_en: item.leido_en || new Date().toISOString() };
    setNotificacionDetalle(readItem);

    if (vistaActiva !== 'recibidas' || item.leida) return;

    updateReadState(readItem);

    try {
      const response = await api.post(`/notificaciones/${item.id}/leer`);
      const updatedItem = { ...readItem, leido_en: response.data?.data?.leido_en || readItem.leido_en };
      setNotificacionDetalle((current) => current?.id === item.id ? updatedItem : current);
      updateReadState(updatedItem);
    } catch (error) {
      console.log('Error marcando notificación como leída:', error?.response?.data || error.message);
    }
  };

  const getRolLabel = (rol) => {
    const destino = DESTINOS.find((d) => d.value === rol);
    return destino ? destino.label : rol;
  };

  const getRolesLabel = (item) => {
    if (!item) return 'TODOS';
    
    // Usar rol_destino_array si existe, sino usar rol_destino
    let roles = [];
    if (item.rol_destino_array && item.rol_destino_array.length > 0) {
      roles = item.rol_destino_array;
    } else if (item.rol_destino) {
      roles = [item.rol_destino];
    }
    
    if (roles.length === 0 || roles.includes('todos')) {
      return 'TODOS';
    }
    
    // Mapear cada rol a su label
    const labels = roles.map(rol => {
      const destino = DESTINOS.find((d) => d.value === rol);
      return destino ? destino.label : rol;
    });
    
    return labels.join(', ');
  };

  const getCareerNames = (item) => {
    if (!item) return 'Todas las carreras';
    if (item.carrera_ids && item.carrera_ids.length > 0) {
      const selectedCarreras = carreras.filter((c) => item.carrera_ids.includes(c.id));
      return selectedCarreras.map((c) => c.nombre).join(', ');
    }
    if (item.carrera) {
      return item.carrera.nombre;
    }
    return 'Todas las carreras';
  };

  // Formateador de fecha nativo
  const formatFecha = (fechaString) => {
    if (!fechaString) return '';
    try {
      const date = new Date(fechaString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (e) {
      return '';
    }
  };

  // Manejador para input de archivo nativo (web)
  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('>>> Archivo seleccionado via input nativo:', file);
      setArchivo(file);
    }
  };

  // Selector de archivos unificado (Funciona perfecto en Web y Móvil)
  const handleSeleccionarArchivo = async () => {
    // En web, usar input nativo de HTML
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    
    // En móvil, usar DocumentPicker
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      console.log('>>> DocumentPicker result:', result);
      
      if (!result.canceled && result.assets?.[0]) {
        const fileAsset = result.assets[0];
        console.log('>>> Archivo seleccionado:', fileAsset);
        setArchivo(fileAsset);
      }
    } catch (_error) {
      console.log('Error seleccionando archivo:', _error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // Visor inteligente (Imágenes a pantalla completa, PDFs en navegador interno)
  const openAttachment = async (url) => {
    if (!url) return;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    
    if (isImage) {
      setImageViewer(url);
    } else {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch (_error) {
        Alert.alert('Error', 'No se pudo abrir el archivo');
      }
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Glassmorphism */}
        <View style={styles.headerBg}>
          <View style={[styles.bgCircle1, { zIndex: 0 }]} pointerEvents="none" />
          <View style={[styles.bgCircle2, { zIndex: 0 }]} pointerEvents="none" />
          <View style={[styles.glassCard, { zIndex: 10 }]}>
            <View style={styles.glassHeaderTop}>
              <View style={styles.glassIconContainer}>
                <Ionicons name="notifications" size={24} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.glassTitle}>Centro de Avisos</Text>
                <Text style={styles.glassSubtitle}>Comunicados institucionales</Text>
              </View>
            </View>
            <Pressable 
              style={({ pressed }) => [
                styles.glassButton,
                pressed && styles.glassButtonPressed,
                { zIndex: 20, elevation: 10 }
              ]} 
              onPress={() => {
                console.log('>>> Botón presionado');
                openCreateModal();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create" size={18} color="#ffffff" />
              <Text style={styles.glassButtonText}>Redactar Nuevo Aviso</Text>
            </Pressable>
          </View>
        </View>

        {/* Modal Crear/Editar (Bottom Sheet) */}
        <Modal visible={showCreateForm} transparent={true} animationType="slide" onRequestClose={() => setShowCreateForm(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreateForm(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetGlow} />
              <View style={styles.modalHandle} />
              <Pressable style={styles.modalClose} onPress={() => setShowCreateForm(false)}>
                <Ionicons name="close" size={22} color="#475569" />
              </Pressable>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Ionicons name="megaphone-outline" size={28} color="#4f46e5" />
                  <Text style={styles.modalTitle}>{notificacionEditando ? 'Editar Comunicación' : 'Nueva Comunicación'}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Título</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} placeholder="Ej: Cambio de horario" placeholderTextColor="#94a3b8" value={titulo} onChangeText={setTitulo} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mensaje</Text>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe los detalles aquí..." placeholderTextColor="#94a3b8" value={cuerpo} onChangeText={setCuerpo} multiline />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Destinatarios</Text>
                  {console.log('>>> Renderizando destinatarios - rolesSeleccionados:', rolesSeleccionados)}
                  <View style={styles.chipsContainer}>
                    {DESTINOS.map((destino) => {
                      const isSelected = rolesSeleccionados.includes(destino.value);
                      return (
                        <Pressable key={destino.value} onPress={() => toggleDestino(destino.value)} style={[styles.chip, isSelected && styles.chipActive]}>
                          {isSelected ? <Ionicons name="checkmark-sharp" size={14} color="#fff" style={{ marginRight: 5 }} /> : <Ionicons name="ellipse-outline" size={16} color="#94a3b8" style={{ marginRight: 5 }} />}
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{destino.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {false && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Filtrar por Carrera (Opcional)</Text>
                    <View style={styles.chipsContainer}>
                      <Pressable onPress={() => setCarrerasSeleccionadas([])} style={[styles.chip, carrerasSeleccionadas.length === 0 && styles.chipActive]}>
                        {carrerasSeleccionadas.length === 0 ? <Ionicons name="checkmark-sharp" size={14} color="#fff" style={{ marginRight: 5 }} /> : <Ionicons name="ellipse-outline" size={16} color="#94a3b8" style={{ marginRight: 5 }} />}
                        <Text style={[styles.chipText, carrerasSeleccionadas.length === 0 && styles.chipTextActive]}>Todas</Text>
                      </Pressable>
                      {carreras.map((carrera) => {
                        // Convertir ambos a string para comparación segura
                        const carreraIdStr = String(carrera.id);
                        const isSelected = carrerasSeleccionadas.some(id => String(id) === carreraIdStr);
                        return (
                          <Pressable key={carrera.id} onPress={() => setCarrerasSeleccionadas((prev) => {
                            const prevStr = prev.map(id => String(id));
                            const currentIdStr = String(carrera.id);
                            return prevStr.includes(currentIdStr) 
                              ? prev.filter((id) => String(id) !== currentIdStr) 
                              : [...prev, carrera.id];
                          })} style={[styles.chip, isSelected && styles.chipActive]}>
                            {isSelected ? <Ionicons name="checkmark-sharp" size={14} color="#fff" style={{ marginRight: 5 }} /> : <Ionicons name="ellipse-outline" size={16} color="#94a3b8" style={{ marginRight: 5 }} />}
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]} numberOfLines={1}>{carrera.nombre}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Input de archivo nativo para web (oculto) */}
                {Platform.OS === 'web' && (
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="application/pdf,image/*"
                    onChange={handleFileInputChange}
                  />
                )}
                
                <Pressable style={[styles.dropzone, (archivo || archivoActual) && styles.dropzoneSuccess]} onPress={handleSeleccionarArchivo}>
                  <Ionicons name={(archivo || archivoActual) ? "checkmark-done-circle" : "cloud-upload-outline"} size={26} color={(archivo || archivoActual) ? "#059669" : "#64748b"} />
                  <View style={styles.dropzoneInfo}>
                    <Text style={[styles.dropzoneTitle, (archivo || archivoActual) && { color: '#059669' }]}>
                      {archivo ? archivo.name : (archivoActual ? 'Archivo actual: ' + archivoActual.split('/').pop() : 'Adjuntar Documento')}
                    </Text>
                    <Text style={styles.dropzoneSub}>
                      {archivo ? 'Nuevo archivo seleccionado' : (archivoActual ? 'Toca para cambiar el archivo' : 'PDF o Imagen (Opcional)')}
                    </Text>
                  </View>
                </Pressable>
                
                {(archivo || archivoActual) && (
                  <Pressable 
                    style={{ marginTop: -20, marginBottom: 20, alignSelf: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => {
                      setArchivo(null);
                      setArchivoActual(null);
                      setEliminarArchivo(true); // Marcar para eliminar en el backend
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>Eliminar archivo</Text>
                  </Pressable>
                )}

                {/* Actividad vinculada (opcional) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.inputLabel}>Actividad vinculada <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(opcional)</Text></Text>
                    <Pressable
                      onPress={() => { setShowCreateForm(false); navigation.navigate('Actividades'); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}
                    >
                      <Ionicons name="add-circle-outline" size={15} color="#3b82f6" />
                      <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '700' }}>Nueva actividad</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 }]}
                    onPress={() => setShowActividadPicker(!showActividadPicker)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
                    <Text style={{ flex: 1, color: actividadSeleccionada ? '#0f172a' : '#94a3b8', fontSize: 15 }} numberOfLines={1}>
                      {actividadSeleccionada ? actividadSeleccionada.titulo : 'Seleccionar actividad...'}
                    </Text>
                    {actividadSeleccionada ? (
                      <Pressable onPress={(e) => { e.stopPropagation(); setActividadSeleccionada(null); }}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                      </Pressable>
                    ) : (
                      <Ionicons name={showActividadPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
                    )}
                  </Pressable>
                  {showActividadPicker && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4, maxHeight: 220, overflow: 'hidden' }}>
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {actividades.length === 0 ? (
                          <Pressable
                            style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}
                            onPress={() => { setShowCreateForm(false); navigation.navigate('Actividades'); }}
                          >
                            <Ionicons name="calendar-outline" size={32} color="#cbd5e1" />
                            <Text style={{ color: '#94a3b8', fontSize: 14 }}>No hay actividades</Text>
                            <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>Crear una actividad →</Text>
                          </Pressable>
                        ) : (
                          actividades.map((act) => {
                            const isSelected = actividadSeleccionada?.id === act.id;
                            const colorMap = { evento: '#3b82f6', comunicado: '#10b981', parcial: '#ef4444', tarea: '#f59e0b', proyecto: '#8b5cf6' };
                            const color = colorMap[act.categoria] || '#64748b';
                            return (
                              <Pressable
                                key={act.id}
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: isSelected ? '#eff6ff' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                onPress={() => { setActividadSeleccionada(act); setShowActividadPicker(false); }}
                              >
                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                  <Ionicons name="calendar" size={16} color={color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>{act.titulo}</Text>
                                  <Text style={{ fontSize: 12, color: '#64748b' }}>{act.categoria}{act.fecha_entrega ? ' · ' + new Date(act.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}</Text>
                                </View>
                                {isSelected && <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />}
                              </Pressable>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Pressable style={[styles.sendBtn, loading && { opacity: 0.6 }]} onPress={handleEnviar} disabled={loading}>
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="paper-plane-outline" size={20} color="#fff" /><Text style={styles.sendBtnText}>Enviar Masivamente</Text></>}
                </Pressable>
                <View style={{ height: 20 }} />
              </ScrollView>
            </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {/* Modal Detalle */}
        <Modal visible={!!notificacionDetalle} transparent={true} animationType="fade" onRequestClose={() => setNotificacionDetalle(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setNotificacionDetalle(null)}>
            <Pressable style={styles.detailModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.detailHandle} />
              <Pressable style={styles.detailCloseBtn} onPress={() => setNotificacionDetalle(null)}><Ionicons name="close-outline" size={24} color="#64748b" /></Pressable>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailBadge}><Text style={styles.detailBadgeText}>{getRolesLabel(notificacionDetalle)}</Text></View>
                  {vistaActiva === 'recibidas' && (
                    <View style={[styles.readStatusPill, styles.readStatusPillRead]}>
                      <Ionicons name="checkmark-done-outline" size={13} color="#059669" />
                      <Text style={[styles.readStatusText, styles.readStatusTextRead]}>Leída</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.detailTitle}>{notificacionDetalle?.titulo}</Text>
                <View style={styles.detailMeta}>
                  <View style={styles.detailMetaItem}><Ionicons name="person-outline" size={16} color="#64748b" /><Text style={styles.detailMetaText}>{notificacionDetalle?.emisor?.nombre || 'Sistema'}</Text></View>
                  <View style={styles.detailMetaItem}><Ionicons name="school-outline" size={16} color="#64748b" /><Text style={styles.detailMetaText}>{getCareerNames(notificacionDetalle)}</Text></View>
                </View>
                 <Text style={styles.detailBodyLabel}>Mensaje:</Text>
                 <View style={styles.detailBody}><Text style={styles.detailBodyText}>{notificacionDetalle?.cuerpo}</Text></View>
                 {console.log('>>> Detalle - ruta_archivo:', notificacionDetalle?.ruta_archivo)}
                 {console.log('>>> Detalle - actividad:', notificacionDetalle?.actividad)}
                 {(() => {
                   const attachmentUrl = notificacionDetalle?.ruta_archivo || notificacionDetalle?.actividad?.ruta_archivo;
                   return attachmentUrl ? (
                     <Pressable style={styles.detailAttachment} onPress={() => openAttachment(attachmentUrl)}>
                       <Ionicons name="document-attach-outline" size={20} color="#4f46e5" />
                       <View style={styles.detailAttachmentInfo}>
                         <Text style={styles.detailAttachmentText}>Documento adjunto</Text>
                         <Text style={styles.detailAttachmentSubtext}>{attachmentUrl}</Text>
                       </View>
                       <Ionicons name="open-outline" size={20} color="#94a3b8" />
                     </Pressable>
                   ) : <Text style={styles.detailNoAttachment}>Sin archivo adjunto</Text>;
                 })()}
                <View style={styles.detailActions}>
                  <Pressable style={styles.detailEditBtn} onPress={() => { 
                    const notifToEdit = notificacionDetalle;
                    setNotificacionDetalle(null);
                    // Esperar a que se cierre el modal y luego abrir edición
                    setTimeout(() => handleEditar(notifToEdit), 100);
                  }}><Ionicons name="pencil-outline" size={18} color="#4f46e5" /><Text style={styles.detailBtnText1}>Editar</Text></Pressable>
                  <Pressable style={styles.detailDeleteBtn} onPress={() => handleEliminar(notificacionDetalle)}><Ionicons name="trash-outline" size={18} color="#ef4444" /><Text style={styles.detailBtnText2}>Eliminar</Text></Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* VISOR DE IMÁGENES A PANTALLA COMPLETA */}
        <Modal visible={!!imageViewer} transparent={true} animationType="fade" onRequestClose={() => setImageViewer(null)}>
          <View style={styles.imageViewerContainer}>
            <Pressable style={styles.imageViewerClose} onPress={() => setImageViewer(null)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
            <Image source={{ uri: imageViewer }} style={styles.imageViewerImage} resizeMode="contain" />
          </View>
        </Modal>

        {/* Historial Timeline */}
        <View style={styles.historySection}>
          {/* Tabs Recibidas / Enviadas */}
          <View style={styles.tabsContainer}>
            <Pressable 
              style={[styles.tab, vistaActiva === 'recibidas' && styles.tabActive]} 
              onPress={() => cambiarVista('recibidas')}
            >
              <Ionicons 
                name="notifications" 
                size={16} 
                color={vistaActiva === 'recibidas' ? '#ffffff' : '#64748b'} 
              />
              <Text style={[styles.tabText, vistaActiva === 'recibidas' && styles.tabTextActive]}>
                Recibidas
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{notificacionesRecibidas.length}</Text>
              </View>
            </Pressable>
            <Pressable 
              style={[styles.tab, vistaActiva === 'enviadas' && styles.tabActive]} 
              onPress={() => cambiarVista('enviadas')}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={vistaActiva === 'enviadas' ? '#ffffff' : '#64748b'} 
              />
              <Text style={[styles.tabText, vistaActiva === 'enviadas' && styles.tabTextActive]}>
                Enviadas
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{notificacionesEnviadas.length}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              {vistaActiva === 'recibidas' ? 'Notificaciones Recibidas' : 'Notificaciones Enviadas'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable 
                style={[styles.filterBtn, mostrarFiltros && styles.filterBtnActive]} 
                onPress={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Ionicons name="filter-outline" size={16} color={mostrarFiltros ? '#fff' : '#1A1A4E'} />
                <Text style={[styles.filterBtnText, mostrarFiltros && styles.filterBtnTextActive]}>Filtrar</Text>
              </Pressable>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>
                  {notificaciones.length} {vistaActiva === 'recibidas' ? 'recibidas' : 'enviadas'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Panel de filtros */}
          {mostrarFiltros && (
            <View style={styles.filtrosContainer}>
              <View style={styles.filtrosRow}>
                <View style={styles.filtroItem}>
                  <Text style={styles.filtroLabel}>Desde:</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      style={styles.filtroInputWeb}
                    />
                  ) : (
                    <TextInput
                      style={styles.filtroInput}
                      value={fechaDesde}
                      onChangeText={setFechaDesde}
                      placeholder="YYYY-MM-DD"
                    />
                  )}
                </View>
                <View style={styles.filtroItem}>
                  <Text style={styles.filtroLabel}>Hasta:</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      style={styles.filtroInputWeb}
                    />
                  ) : (
                    <TextInput
                      style={styles.filtroInput}
                      value={fechaHasta}
                      onChangeText={setFechaHasta}
                      placeholder="YYYY-MM-DD"
                    />
                  )}
                </View>
              </View>
              <View style={styles.filtrosActions}>
                <Pressable style={styles.filtroAplicarBtn} onPress={aplicarFiltros}>
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.filtroAplicarText}>Aplicar</Text>
                </Pressable>
                <Pressable style={styles.filtroLimpiarBtn} onPress={limpiarFiltros}>
                  <Ionicons name="close-outline" size={16} color="#64748b" />
                  <Text style={styles.filtroLimpiarText}>Limpiar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {loadingList ? (
            <View style={styles.centerLoader}><ActivityIndicator size="large" color="#6366f1" /></View>
          ) : notificaciones.length > 0 ? (
            <View style={styles.timelineContainer}>
              {notificaciones.map((item, index) => {
                // Determinar el rol para el estilo (usar el primero del array o el rol_destino)
                const primerRol = (item.rol_destino_array && item.rol_destino_array.length > 0) 
                  ? item.rol_destino_array[0] 
                  : item.rol_destino;
                const style = getRolStyle(primerRol);
                return (
                  <View key={item.id} style={styles.timelineItem}>
                    {index < notificaciones.length - 1 && <View style={[styles.timelineDashedLine, { borderColor: style.accent + '40' }]} />}
                    <View style={styles.timelineDotWrapper}>
                      <View style={[styles.timelineDotOuter, { backgroundColor: style.accent + '20' }]} />
                      <View style={[styles.timelineDotInner, { backgroundColor: style.accent }]} />
                      {vistaActiva === 'recibidas' && !item.leida && <View style={styles.unreadDot} />}
                    </View>
                    <Pressable 
                      style={({ pressed }) => [
                        styles.timelineCardWrapper,
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => handleVerDetalle(item)}
                    >
                      <View style={[styles.timelineAccent, { backgroundColor: style.accent }]} />
                      <View style={styles.timelineCardContent}>
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardNotifTitle} numberOfLines={1}>{item.titulo}</Text>
                          <View style={[styles.rolePill, { backgroundColor: style.bg }]}>
                            <Text style={[styles.rolePillText, { color: style.text }]}>{getRolesLabel(item)}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardNotifBody} numberOfLines={2}>{item.cuerpo}</Text>
                        
                        <View style={styles.cardBottomRow}>
                          {vistaActiva === 'recibidas' && (
                            <View style={[styles.readStatusPill, item.leida ? styles.readStatusPillRead : styles.readStatusPillUnread]}>
                              <Ionicons name={item.leida ? 'checkmark-done-outline' : 'ellipse'} size={11} color={item.leida ? '#059669' : '#dc2626'} />
                              <Text style={[styles.readStatusText, item.leida ? styles.readStatusTextRead : styles.readStatusTextUnread]}>
                                {item.leida ? 'Leída' : 'No leída'}
                              </Text>
                            </View>
                          )}
                          {/* FECHA Y HORA AQUÍ */}
                          <View style={styles.timelineDateContainer}>
                            <Ionicons name="time-outline" size={12} color="#94a3b8" />
                            <Text style={styles.timelineDateText}>{formatFecha(item.created_at || item.fecha)}</Text>
                          </View>

                          <View style={styles.timelineViewMoreContainer}>
                            <Text style={styles.timelineViewMore}>Ver detalles</Text>
                            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}><Ionicons name="time-outline" size={36} color="#cbd5e1" /></View>
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptySub}>Los avisos que envíes aparecerán aquí organizados.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNav navigation={navigation} activeScreen="Notificaciones" />
    </SafeAreaView>
  );
}

// Función de colores para el Timeline (fuera del componente para no re-renderizarse)
const getRolStyle = (rol) => {
  switch (rol) {
    case 'director': return { bg: '#eff6ff', text: '#2563eb', accent: '#3b82f6' };
    case 'docentes': return { bg: '#fffbeb', text: '#d97706', accent: '#f59e0b' };
    case 'estudiantes': return { bg: '#ecfdf5', text: '#059669', accent: '#10b981' };
    case 'centro_facultativo': 
    case 'centro_estudiantes': return { bg: '#faf5ff', text: '#0f172a', accent: '#8b5cf6' };
    default: return { bg: '#f1f5f9', text: '#475569', accent: '#94a3b8' };
  }
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 100 },
  
  // HEADER
  headerBg: { backgroundColor: '#1e1b4b', paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', position: 'relative' },
  bgCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#1A1A4E', top: -60, right: -40, opacity: 0.4 },
  bgCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#6366f1', bottom: -20, left: 30, opacity: 0.3 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 24, padding: 24, position: 'relative', zIndex: 1 },
  glassHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  glassIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  glassTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  glassSubtitle: { fontSize: 14, color: '#a5b4fc', marginTop: 2 },
  glassButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  glassButtonPressed: { opacity: 0.8, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  glassButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // MODAL CREAR
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '95%', position: 'relative' },
  sheetGlow: { position: 'absolute', top: -50, left: '20%', right: '20%', height: 100, backgroundColor: '#6366f1', opacity: 0.15, borderRadius: 50 },
  modalHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginTop: 14, marginBottom: 10 },
  modalClose: { position: 'absolute', top: 16, right: 20, zIndex: 10, backgroundColor: '#e2e8f0', borderRadius: 20, padding: 6 },
  modalScroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', flexShrink: 1 },
  
  // FORM INPUTS
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 16, height: 50, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  textAreaWrapper: { height: 100, paddingVertical: 12, alignItems: 'flex-start' },
  input: { fontSize: 15, color: '#0f172a', width: '100%', fontWeight: '500' },
  textArea: { height: '100%', textAlignVertical: 'top' },
  
  // CHIPS
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50, borderWidth: 1.5, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#ffffff' },

  // DROPZONE
  dropzone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 14, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', marginBottom: 16, gap: 12 },
  dropzoneSuccess: { borderColor: '#10b981', backgroundColor: '#f0fdf4', borderStyle: 'solid' },
  dropzoneInfo: { flex: 1 },
  dropzoneTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  dropzoneSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },

  // BOTON ENVIAR
  sendBtn: { backgroundColor: '#0f766e', padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  sendBtnText: { fontSize: 15, color: '#ffffff', fontWeight: '800', letterSpacing: 0.2 },

  // MODAL DETALLE
  detailModal: { backgroundColor: '#ffffff', margin: 20, borderRadius: 20, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  detailHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  detailCloseBtn: { position: 'absolute', top: 16, right: 16, padding: 4, zIndex: 1 },
  detailContent: { padding: 20, paddingTop: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  detailBadge: { backgroundColor: '#f5f3ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  detailBadgeText: { fontSize: 12, fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase' },
  readStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  readStatusPillUnread: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  readStatusPillRead: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  readStatusText: { fontSize: 11, fontWeight: '800' },
  readStatusTextUnread: { color: '#dc2626' },
  readStatusTextRead: { color: '#059669' },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 16, lineHeight: 28 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  detailMetaText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  detailBodyLabel: { fontSize: 14, color: '#64748b', fontWeight: '700', marginBottom: 8 },
  detailBody: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16 },
  detailBodyText: { fontSize: 15, color: '#334155', lineHeight: 22 },
  detailNoAttachment: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  detailAttachment: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 14, borderRadius: 12, marginBottom: 20, gap: 12 },
  detailAttachmentInfo: { flex: 1 },
  detailAttachmentText: { fontSize: 14, color: '#4f46e5', fontWeight: '700' },
  detailAttachmentSubtext: { fontSize: 12, color: '#64748b', marginTop: 2 },
  detailActions: { flexDirection: 'row', gap: 12 },
  detailEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eef2ff', paddingVertical: 12, borderRadius: 12 },
  detailDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', paddingVertical: 12, borderRadius: 12 },
  detailBtnText1: { fontSize: 14, color: '#4f46e5', fontWeight: '700' },
  detailBtnText2: { fontSize: 14, color: '#ef4444', fontWeight: '700' },

  // VISOR IMÁGENES
  imageViewerContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  imageViewerImage: { width: '100%', height: '100%' },

  // HISTORIAL
  historySection: { paddingHorizontal: 20, marginTop: 10 },
  
  // TABS RECIBIDAS/ENVIADAS
  tabsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#1A1A4E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  tabBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 4 },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#1A1A4E' },
  
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  historyCount: { backgroundColor: '#e0e7ff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  historyCountText: { fontSize: 12, fontWeight: '700', color: '#1A1A4E' },
  centerLoader: { paddingVertical: 60 },
  
  // FILTROS
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  filterBtnActive: { backgroundColor: '#1A1A4E' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#1A1A4E' },
  filterBtnTextActive: { color: '#fff' },
  filtrosContainer: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  filtrosRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  filtroItem: { flex: 1 },
  filtroLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  filtroInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' },
  filtroInputWeb: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', width: '100%', height: 44 },
  filtrosActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  filtroAplicarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1A4E', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  filtroAplicarText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  filtroLimpiarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  filtroLimpiarText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  // TIMELINE AVANZADO
  timelineContainer: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', paddingBottom: 28, position: 'relative' },
  timelineDashedLine: { position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', borderStyle: 'dashed' },
  timelineDotWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginRight: 16, zIndex: 2, borderWidth: 2, borderColor: '#f1f5f9' },
  timelineDotOuter: { position: 'absolute', width: 32, height: 32, borderRadius: 16 },
  timelineDotInner: { width: 12, height: 12, borderRadius: 6 },
  unreadDot: { position: 'absolute', top: -4, right: -4, width: 11, height: 11, borderRadius: 6, backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#ffffff' },
  timelineCardWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  timelineAccent: { width: 5 },
  timelineCardContent: { flex: 1, padding: 16, gap: 10 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardNotifTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },
  rolePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, maxWidth: 180 },
  rolePillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
  cardNotifBody: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  
  // FECHA Y HORA
  timelineDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timelineDateText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  
  timelineViewMoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timelineViewMore: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },

  // EMPTY STATE
  emptyState: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
