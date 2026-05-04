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
  Image, // Necesario para el visor de imágenes
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

import BottomNav from '../../components/BottomNav';
import HeaderConfigButton from '../../components/HeaderConfigButton';
import api from '../../api/axios';
import { getAll as getActividades } from '../../services/actividadService';

const DESTINOS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Director', value: 'director' },
  { label: 'C. Facultativo', value: 'centro_facultativo' },
  { label: 'C. Estudiantes', value: 'centro_estudiantes' },
  { label: 'Docentes', value: 'docentes' },
  { label: 'Estudiantes', value: 'estudiantes' },
];

export default function NotificacionesScreen({ navigation }) {
  const { height: windowHeight } = useWindowDimensions();
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [rolesSeleccionados, setRolesSeleccionados] = useState(['todos']);
  const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [archivoActual, setArchivoActual] = useState(null); // Para guardar el archivo existente al editar
  const [eliminarArchivo, setEliminarArchivo] = useState(false); // Para marcar si se debe eliminar el archivo
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [activeTab, setActiveTab] = useState('otros'); // 'enviadas' o 'otros'
  const [filtroUsuario, setFiltroUsuario] = useState(null); // ID del usuario para filtrar
  const [usuariosList, setUsuariosList] = useState([]); // Lista de usuarios para el selector
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notificacionEditando, setNotificacionEditando] = useState(null);
  const [notificacionDetalle, setNotificacionDetalle] = useState(null);
  const [imageViewer, setImageViewer] = useState(null); // Estado para el visor de imágenes
  const fileInputRef = useRef(null); // Ref para input de archivo nativo en web
  
  // Estados para filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtro por rol (para tab "De otros")
  const [filtroRol, setFiltroRol] = useState(null);
  
  // Estados para actividades (opcional)
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [mostrarSelectorActividad, setMostrarSelectorActividad] = useState(false);

  const toggleDestino = (value) => {
    if (value === 'todos') {
      setRolesSeleccionados(['todos']);
      return;
    }
    setRolesSeleccionados((prev) => {
      const withoutTodos = prev.filter((item) => item !== 'todos');
      const exists = withoutTodos.includes(value);
      const next = exists ? withoutTodos.filter((item) => item !== value) : [...withoutTodos, value];
      return next.length ? next : ['todos'];
    });
  };

  const getRolDestinoPayload = () => {
    const selected = rolesSeleccionados.includes('todos') ? [] : rolesSeleccionados;
    const normalized = selected.filter(
      (value) =>
        value === 'director' ||
        value === 'centro_facultativo' ||
        value === 'centro_estudiantes' ||
        value === 'docentes' ||
        value === 'estudiantes'
    );
    if (normalized.length === 0) return 'todos';
    return normalized[0]; // Devuelve el primer rol seleccionado
  };

  const getRolesArrayPayload = () => {
    const selected = rolesSeleccionados.includes('todos') ? [] : rolesSeleccionados;
    const normalized = selected.filter(
      (value) =>
        value === 'director' ||
        value === 'centro_facultativo' ||
        value === 'centro_estudiantes' ||
        value === 'docentes' ||
        value === 'estudiantes'
    );
    return normalized.length > 0 ? normalized : null; // Devuelve array o null
  };

  const cargarNotificaciones = async (params = {}) => {
    setLoadingList(true);
    try {
      // Construir query params para filtros de fecha y usuario
      const queryParams = new URLSearchParams();
      if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
      if (params.enviado_por) queryParams.append('enviado_por', params.enviado_por);
      if (params.rol_destino) queryParams.append('rol_destino', params.rol_destino);
      
      // Seleccionar endpoint según el tab activo
      const endpoint = activeTab === 'enviadas' ? '/notificaciones/enviadas' : '/notificaciones';
      const url = endpoint + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      console.log('>>> Cargando notificaciones:', url);
      
      const response = await api.get(url);
      let data = response.data?.data ?? [];
      if (activeTab === 'otros' && params.rol_destino) {
        const rol = String(params.rol_destino);
        data = (Array.isArray(data) ? data : []).filter((item) => {
          const rolesArray = Array.isArray(item?.rol_destino_array) ? item.rol_destino_array : [];
          if (rolesArray.length > 0) return rolesArray.includes(rol);
          return String(item?.rol_destino ?? '') === rol;
        });
      }
      setNotificaciones(data);
    } catch (_error) {
      setNotificaciones([]);
    } finally {
      setLoadingList(false);
    }
  };
   
  const aplicarFiltros = () => {
    cargarNotificaciones({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      enviado_por: activeTab === 'otros' ? filtroUsuario : null,
      rol_destino: activeTab === 'otros' ? filtroRol : null
    });
  };
   
  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setFiltroUsuario(null);
    setFiltroRol(null);
    cargarNotificaciones();
  };

  useEffect(() => {
    cargarNotificaciones();
    cargarCarreras();
    cargarActividades();
    cargarUsuarios();
  }, [activeTab]);
   
  const cargarActividades = async () => {
    try {
      const data = await getActividades();
      setActividades(data);
    } catch (error) {
      console.log('Error cargando actividades:', error);
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

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
      setUsuariosList(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error?.response?.data || error.message);
      setUsuariosList([]);
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
    setMostrarSelectorActividad(false);
  };

  const openCreateModal = () => {
    console.log('>>> openCreateModal llamado');
    resetForm();
    setShowCreateForm(true);
    console.log('>>> showCreateForm seteado a true');
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
       
      if (carrerasSeleccionadas.length > 0) {
        payload.carrera_ids = carrerasSeleccionadas;
      }
       
      // Agregar actividad relacionada (opcional)
      if (actividadSeleccionada) {
        payload.actividad_id = actividadSeleccionada.id;
      }
       
      // Solo enviar rol_destino_array si hay múltiples roles seleccionados
      if (rolesArray && rolesArray.length > 1) {
        payload.rol_destino_array = rolesArray;
      }

      let response;
       
      // Usar FormData si hay archivo (tanto para crear como editar)
      if (archivo || !notificacionEditando) {
        const formData = new FormData();
        formData.append('titulo', payload.titulo);
        formData.append('cuerpo', payload.cuerpo);
        formData.append('rol_destino', payload.rol_destino);
         
        // Agregar actividad relacionada (opcional)
        if (actividadSeleccionada) {
          formData.append('actividad_id', actividadSeleccionada.id);
        }
         
        // Solo enviar rol_destino_array si hay múltiples roles seleccionados
        if (rolesArray && rolesArray.length > 1) {
          rolesArray.forEach((rol) => {
            formData.append('rol_destino_array[]', rol);
          });
        }
         
        if (carrerasSeleccionadas.length > 0) {
          carrerasSeleccionadas.forEach((id) => {
            formData.append('carrera_ids[]', id);
          });
        }
         
        if (archivo) {
          console.log('>>> Archivo a enviar:', archivo);
          console.log('>>> Es File nativo:', archivo instanceof File);
           
          // En web, el archivo es un objeto File nativo del input
          // En móvil, es el asset del DocumentPicker
          formData.append('archivo', archivo);
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
           
          // Agregar actividad relacionada (opcional)
          if (actividadSeleccionada) {
            formData.append('actividad_id', actividadSeleccionada.id);
          }
           
          if (rolesArray && rolesArray.length > 1) {
            rolesArray.forEach((rol) => {
              formData.append('rol_destino_array[]', rol);
            });
          }
           
          if (carrerasSeleccionadas.length > 0) {
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

  const handleVerDetalle = async (item) => {
    const readItem = { ...item, leida: true, leido_en: item.leido_en || new Date().toISOString() };
    setNotificacionDetalle(readItem);

    if (activeTab !== 'otros' || item.leida) return;

    setNotificaciones((prev) => prev.map((notificacion) => (
      notificacion.id === item.id ? readItem : notificacion
    )));

    try {
      const response = await api.post(`/notificaciones/${item.id}/leer`);
      const leidoEn = response.data?.data?.leido_en || readItem.leido_en;
      const updatedItem = { ...readItem, leido_en: leidoEn };

      setNotificacionDetalle((current) => (
        current?.id === item.id ? updatedItem : current
      ));
      setNotificaciones((prev) => prev.map((notificacion) => (
        notificacion.id === item.id ? updatedItem : notificacion
      )));
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

  const getEmisorName = (item) => {
    if (!item) return 'Remitente no disponible';
    if (item.emisor?.nombre) return item.emisor.nombre;

    const usuarioEmisor = usuariosList.find((usuario) => String(usuario.id) === String(item.enviado_por));
    if (usuarioEmisor?.nombre) return usuarioEmisor.nombre;

    return item.enviado_por ? `Usuario #${item.enviado_por}` : 'Remitente no disponible';
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
              <View style={styles.glassTitleBlock}>
                <Text style={styles.glassTitle}>Centro de Avisos</Text>
                <Text style={styles.glassSubtitle}>Comunicados institucionales</Text>
              </View>
              <HeaderConfigButton navigation={navigation} />
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

        <Modal visible={showCreateForm} transparent={true} animationType="slide" onRequestClose={() => setShowCreateForm(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateForm(false)} />
            <View style={styles.bottomSheetContainer}>
              <View style={[styles.bottomSheet, { height: Math.max(420, windowHeight * 0.92) }]}>
                <View style={styles.sheetGlow} />
                <View style={styles.modalHandle} />
                <Pressable style={styles.modalClose} onPress={() => setShowCreateForm(false)}>
                  <Ionicons name="close" size={22} color="#475569" />
                </Pressable>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                >
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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Filtrar por Carrera (Opcional)</Text>
                  <View style={styles.chipsContainer}>
                    <Pressable onPress={() => setCarrerasSeleccionadas([])} style={[styles.chip, carrerasSeleccionadas.length === 0 && styles.chipActive]}>
                      {carrerasSeleccionadas.length === 0 ? <Ionicons name="checkmark-sharp" size={14} color="#fff" style={{ marginRight: 5 }} /> : <Ionicons name="ellipse-outline" size={16} color="#94a3b8" style={{ marginRight: 5 }} />}
                      <Text style={[styles.chipText, carrerasSeleccionadas.length === 0 && styles.chipTextActive]}>Todas</Text>
                    </Pressable>
                    {carreras.map((carrera) => {
                      const carreraIdStr = String(carrera.id);
                      const isSelected = carrerasSeleccionadas.some((id) => String(id) === carreraIdStr);
                      return (
                        <Pressable
                          key={carrera.id}
                          onPress={() =>
                            setCarrerasSeleccionadas((prev) => {
                              const prevStr = prev.map((id) => String(id));
                              const currentIdStr = String(carrera.id);
                              return prevStr.includes(currentIdStr) ? prev.filter((id) => String(id) !== currentIdStr) : [...prev, carrera.id];
                            })
                          }
                          style={[styles.chip, isSelected && styles.chipActive]}
                        >
                          {isSelected ? <Ionicons name="checkmark-sharp" size={14} color="#fff" style={{ marginRight: 5 }} /> : <Ionicons name="ellipse-outline" size={16} color="#94a3b8" style={{ marginRight: 5 }} />}
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]} numberOfLines={1}>
                            {carrera.nombre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

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
                  <Ionicons name={(archivo || archivoActual) ? 'checkmark-done-circle' : 'cloud-upload-outline'} size={26} color={(archivo || archivoActual) ? '#059669' : '#64748b'} />
                  <View style={styles.dropzoneInfo}>
                    <Text style={[styles.dropzoneTitle, (archivo || archivoActual) && { color: '#059669' }]}>
                      {archivo ? archivo.name : archivoActual ? 'Archivo actual: ' + archivoActual.split('/').pop() : 'Adjuntar Documento'}
                    </Text>
                    <Text style={styles.dropzoneSub}>
                      {archivo ? 'Nuevo archivo seleccionado' : archivoActual ? 'Toca para cambiar el archivo' : 'PDF o Imagen (Opcional)'}
                    </Text>
                  </View>
                </Pressable>

                {(archivo || archivoActual) && (
                  <Pressable
                    style={{ marginTop: -20, marginBottom: 20, alignSelf: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => {
                      setArchivo(null);
                      setArchivoActual(null);
                      setEliminarArchivo(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                    <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>Eliminar archivo</Text>
                  </Pressable>
                )}

                <Pressable style={[styles.sendBtn, loading && { opacity: 0.6 }]} onPress={handleEnviar} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                      <Text style={styles.sendBtnText}>{notificacionEditando ? 'Guardar cambios' : 'Enviar Masivamente'}</Text>
                    </>
                  )}
                </Pressable>
                <View style={{ height: 20 }} />
              </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={!!imageViewer} transparent={true} animationType="fade" onRequestClose={() => setImageViewer(null)}>
          <View style={styles.imageViewerContainer}>
            <Pressable style={styles.imageViewerClose} onPress={() => setImageViewer(null)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
            <Image source={{ uri: imageViewer }} style={styles.imageViewerImage} resizeMode="contain" />
          </View>
        </Modal>

        <Modal visible={!!notificacionDetalle} transparent={true} animationType="slide" onRequestClose={() => setNotificacionDetalle(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setNotificacionDetalle(null)}>
            <Pressable style={styles.detailModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.detailHandle} />
              <Pressable style={styles.detailCloseBtn} onPress={() => setNotificacionDetalle(null)}>
                <Ionicons name="close" size={22} color="#475569" />
              </Pressable>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll} contentContainerStyle={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeText}>{getRolesLabel(notificacionDetalle)}</Text>
                  </View>
                  {activeTab === 'otros' && (
                    <View style={[styles.readStatusPill, styles.readStatusPillRead]}>
                      <Ionicons name="checkmark-done-outline" size={13} color="#059669" />
                      <Text style={[styles.readStatusText, styles.readStatusTextRead]}>Leída</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.detailTitle}>{notificacionDetalle?.titulo}</Text>

                <View style={styles.detailMeta}>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text style={styles.detailMetaText}>{formatFecha(notificacionDetalle?.created_at || notificacionDetalle?.fecha)}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <View style={styles.detailMetaTextBlock}>
                      <Text style={styles.detailMetaLabel}>Enviado por</Text>
                      <Text style={styles.detailMetaText}>{getEmisorName(notificacionDetalle)}</Text>
                    </View>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Ionicons name="school-outline" size={14} color="#64748b" />
                    <View style={styles.detailMetaTextBlock}>
                      <Text style={styles.detailMetaLabel}>Carrera</Text>
                      <Text style={styles.detailMetaText}>{getCareerNames(notificacionDetalle)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.detailBodyLabel}>Mensaje</Text>
                <View style={styles.detailBody}>
                  <Text style={styles.detailBodyText}>{notificacionDetalle?.cuerpo}</Text>
                </View>

                {notificacionDetalle?.ruta_archivo ? (
                  <Pressable style={styles.detailAttachment} onPress={() => openAttachment(notificacionDetalle.ruta_archivo)}>
                    <Ionicons name="attach" size={18} color="#4f46e5" />
                    <View style={styles.detailAttachmentInfo}>
                      <Text style={styles.detailAttachmentText} numberOfLines={1}>
                        {notificacionDetalle.ruta_archivo.split('/').pop()}
                      </Text>
                      <Text style={styles.detailAttachmentSubtext}>Toca para abrir</Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color="#4f46e5" />
                  </Pressable>
                ) : (
                  <Text style={styles.detailNoAttachment}>Sin archivo adjunto</Text>
                )}

                {activeTab === 'enviadas' && (
                  <View style={styles.detailActions}>
                    <Pressable style={styles.detailEditBtn} onPress={() => handleEditar(notificacionDetalle)}>
                      <Ionicons name="create-outline" size={18} color="#4f46e5" />
                      <Text style={styles.detailBtnText1}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.detailDeleteBtn} onPress={() => handleEliminar(notificacionDetalle)}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={styles.detailBtnText2}>Eliminar</Text>
                    </Pressable>
                  </View>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* TABS DE NOTIFICACIONES */}
        <View style={styles.tabsContainer}>
          <Pressable 
            style={[styles.tabButton, activeTab === 'otros' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('otros')}
          >
            <Ionicons name="globe-outline" size={16} color={activeTab === 'otros' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'otros' && styles.tabButtonTextActive]}>De otros</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabButton, activeTab === 'enviadas' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('enviadas')}
          >
            <Ionicons name="send-outline" size={16} color={activeTab === 'enviadas' ? '#ffffff' : '#64748b'} />
            <Text style={[styles.tabButtonText, activeTab === 'enviadas' && styles.tabButtonTextActive]}>Enviadas</Text>
          </Pressable>
        </View>

        {/* Historial Timeline */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderCard}>
            <View style={styles.historyHeaderTopRow}>
              <View style={styles.historyHeaderTitleBlock}>
                <Text style={styles.historyTitle}>{activeTab === 'enviadas' ? 'Notificaciones Enviadas' : 'Notificaciones de Otros'}</Text>
                <Text style={styles.historySubtitle}>
                  {activeTab === 'enviadas'
                    ? 'Comunicados que enviaste desde tu cuenta'
                    : 'Comunicados enviados por otros usuarios'}
                </Text>
              </View>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{notificaciones.length} {activeTab === 'enviadas' ? 'enviadas' : 'recibidas'}</Text>
              </View>
            </View>
            <View style={styles.historyHeaderActionsRow}>
              <Pressable 
                style={[styles.filterBtn, mostrarFiltros && styles.filterBtnActive]} 
                onPress={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Ionicons name="filter-outline" size={16} color={mostrarFiltros ? '#fff' : '#1A1A4E'} />
                <Text style={[styles.filterBtnText, mostrarFiltros && styles.filterBtnTextActive]}>Filtrar</Text>
              </Pressable>
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
              
              {/* Selector de Rol (solo para tab "De otros") */}
              {activeTab === 'otros' && (
                <View style={styles.filtroItemFull}>
                  <Text style={styles.filtroLabel}>Filtrar por Rol:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolSelectorScroll}>
                    <Pressable 
                      style={[styles.rolChip, !filtroRol && styles.rolChipActive]}
                      onPress={() => setFiltroRol(null)}
                    >
                      <Ionicons name="people" size={12} color={!filtroRol ? '#ffffff' : '#64748b'} />
                      <Text style={[styles.rolChipText, !filtroRol && styles.rolChipTextActive]}>Todos los roles</Text>
                    </Pressable>
                    {DESTINOS.filter(d => d.value !== 'todos').map((rol) => (
                      <Pressable 
                        key={rol.value}
                        style={[styles.rolChip, filtroRol === rol.value && styles.rolChipActive]}
                        onPress={() => setFiltroRol(rol.value)}
                      >
                        <Ionicons name="person" size={12} color={filtroRol === rol.value ? '#ffffff' : '#64748b'} />
                        <Text style={[styles.rolChipText, filtroRol === rol.value && styles.rolChipTextActive]}>{rol.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              
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
            <View style={styles.notifGrid}>
              {notificaciones.map((item, index) => {
                // Determinar el rol para el estilo
                const primerRol = (item.rol_destino_array && item.rol_destino_array.length > 0) 
                  ? item.rol_destino_array[0] 
                  : item.rol_destino;
                const style = getRolStyle(primerRol);
                
                return (
                  <Pressable 
                    key={item.id} 
                    style={({ pressed }) => [
                      styles.notifCard,
                      pressed && styles.notifCardPressed
                    ]}
                    onPress={() => handleVerDetalle(item)}
                  >
                    {/* Barra de color según rol */}
                    <View style={[styles.notifCardAccent, { backgroundColor: style.accent }]} />
                    
                    <View style={styles.notifCardContent}>
                      {/* Header con icono de rol, título y badge */}
                      <View style={styles.notifCardHeader}>
                        <View style={[styles.notifIconContainer, { backgroundColor: style.bg }]}>
                          <Ionicons name="notifications" size={16} color={style.text} />
                          {activeTab === 'otros' && !item.leida && <View style={styles.unreadDot} />}
                        </View>
                        <View style={styles.notifTitleContainer}>
                          <Text style={styles.notifCardTitle} numberOfLines={1}>{item.titulo}</Text>
                          <Text style={[styles.notifCardMeta, { color: style.text }]}>
                            {getRolesLabel(item)}
                          </Text>
                        </View>
                        <View style={[styles.notifBadge, { backgroundColor: style.bg }]}>
                          <Text style={[styles.notifBadgeText, { color: style.text }]}>{getRolesLabel(item)}</Text>
                        </View>
                      </View>
                      
                      {/* Cuerpo del mensaje */}
                      <Text style={styles.notifCardBody} numberOfLines={3}>{item.cuerpo}</Text>
                      
                      {/* Footer con información adicional */}
                      <View style={styles.notifCardFooter}>
                        <View style={styles.notifFooterLeft}>
                          {activeTab === 'otros' && (
                            <View style={[styles.readStatusPill, item.leida ? styles.readStatusPillRead : styles.readStatusPillUnread]}>
                              <Ionicons name={item.leida ? 'checkmark-done-outline' : 'ellipse'} size={11} color={item.leida ? '#059669' : '#dc2626'} />
                              <Text style={[styles.readStatusText, item.leida ? styles.readStatusTextRead : styles.readStatusTextUnread]}>
                                {item.leida ? 'Leída' : 'No leída'}
                              </Text>
                            </View>
                          )}

                          {/* Fecha */}
                          <View style={styles.notifDateBadge}>
                            <Ionicons name="time-outline" size={12} color="#64748b" />
                            <Text style={styles.notifDateText}>{formatFecha(item.created_at || item.fecha)}</Text>
                          </View>
                          
                          {/* Indicador de Actividad vinculada */}
                          {item.actividad_id && (
                            <View style={styles.notifActivityBadge}>
                              <Ionicons name="calendar" size={10} color="#4f46e5" />
                              <Text style={styles.notifActivityText}>Tiene actividad</Text>
                            </View>
                          )}
                          
                          {/* Mostrar emisor en tab "De otros" */}
                          {activeTab === 'otros' && (
                            <View style={styles.notifEmisorBadge}>
                              <Ionicons name="person-circle" size={12} color="#64748b" />
                              <Text style={styles.notifEmisorText}>De: {getEmisorName(item)}</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Botón ver más */}
                        <View style={styles.notifViewMore}>
                          <Text style={styles.notifViewMoreText}>Ver más</Text>
                          <Ionicons name="chevron-forward" size={14} color="#4f46e5" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyCircle}>
                <Ionicons name={activeTab === 'enviadas' ? 'paper-plane-outline' : 'notifications-outline'} size={34} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'enviadas'
                  ? 'Todavía no enviaste comunicados. Crea uno para que aparezca en tu historial.'
                  : 'No hay notificaciones recibidas con los filtros actuales.'}
              </Text>
              <Pressable
                style={styles.emptyActionBtn}
                onPress={() => {
                  if (activeTab === 'enviadas') {
                    openCreateModal();
                    return;
                  }
                  setMostrarFiltros(true);
                }}
              >
                <Ionicons name={activeTab === 'enviadas' ? 'create-outline' : 'filter-outline'} size={18} color="#ffffff" />
                <Text style={styles.emptyActionText}>
                  {activeTab === 'enviadas' ? 'Redactar aviso' : 'Ajustar filtros'}
                </Text>
              </Pressable>
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
    case 'centro_estudiantes': return { bg: '#faf5ff', text: '#7c3aed', accent: '#8b5cf6' };
    default: return { bg: '#f1f5f9', text: '#475569', accent: '#94a3b8' };
  }
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 100 },
  
  // TABS
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  tabButtonActive: { backgroundColor: '#1A1A4E', borderColor: '#1A1A4E', shadowColor: '#1A1A4E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  tabButtonText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  tabButtonTextActive: { color: '#ffffff' },
  
  // HEADER
  headerBg: { backgroundColor: '#1e1b4b', paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', position: 'relative' },
  bgCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#1A1A4E', top: -60, right: -40, opacity: 0.4 },
  bgCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#6366f1', bottom: -20, left: 30, opacity: 0.3 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 24, padding: 24, position: 'relative', zIndex: 1 },
  glassHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  glassTitleBlock: { flex: 1 },
  glassIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  glassTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  glassSubtitle: { fontSize: 14, color: '#a5b4fc', marginTop: 2 },
  glassButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  glassButtonPressed: { opacity: 0.8, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  glassButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  
  // USER SELECTOR
  filtroItemFull: { marginBottom: 16 },
  userSelectorScroll: { flexDirection: 'row', marginTop: 8 },
  userChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  userChipActive: { backgroundColor: '#1A1A4E', borderColor: '#1A1A4E' },
  userChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  userChipTextActive: { color: '#ffffff' },
  
  // MODAL CREAR
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  bottomSheetContainer: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 12 },
  bottomSheet: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, minHeight: 420, position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 720, alignSelf: 'center', flexShrink: 1 },
  sheetGlow: { position: 'absolute', top: -50, left: '20%', right: '20%', height: 100, backgroundColor: '#6366f1', opacity: 0.15, borderRadius: 50 },
  modalHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginTop: 14, marginBottom: 10 },
  modalClose: { position: 'absolute', top: 16, right: 20, zIndex: 10, backgroundColor: '#e2e8f0', borderRadius: 20, padding: 6 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  modalHeaderEmpty: { flex: 1 },
  modalCloseBtnLarge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f1f5f9', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  modalCloseText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  modalScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  modalScrollContent: { paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, marginTop: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
   
  // FORM INPUTS
  inputGroup: { marginBottom: 22 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 18, height: 56, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  textAreaWrapper: { height: 120, paddingVertical: 16, alignItems: 'flex-start' },
  input: { fontSize: 15, color: '#0f172a', width: '100%', fontWeight: '500' },
  textArea: { height: '100%', textAlignVertical: 'top' },
   
  // CHIPS
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50, borderWidth: 1.5, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#ffffff' },

  dropzone: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1', borderRadius: 18, padding: 16, marginBottom: 24 },
  dropzoneSuccess: { borderColor: '#34d399', backgroundColor: '#f0fdf4' },
  dropzoneInfo: { flex: 1, minWidth: 0 },
  dropzoneTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  dropzoneSub: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' },

  sendBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 18 },
  sendBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  
  // EMISOR BADGE
  emisorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, gap: 4 },
  emisorBadgeText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  
  // ROL SELECTOR (nuevos estilos)
  rolSelectorScroll: { flexDirection: 'row', marginTop: 8 },
  rolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  rolChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  rolChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  rolChipTextActive: { color: '#ffffff' },
  
  // NUEVAS CARDS DE NOTIFICACIÓN (diseño moderno)
  // MODAL DETALLE
  detailModal: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '88%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: Platform.OS === 'web' ? 28 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 28 : 0,
    overflow: 'hidden',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  detailHandle: { width: 44, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  detailCloseBtn: { position: 'absolute', top: 14, right: 16, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  detailScroll: { flexShrink: 1 },
  detailContent: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 26 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14, paddingRight: 36 },
  detailBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#c7d2fe' },
  detailBadgeText: { fontSize: 11, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' },
  readStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  readStatusPillUnread: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  readStatusPillRead: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  readStatusText: { fontSize: 11, fontWeight: '800' },
  readStatusTextUnread: { color: '#dc2626' },
  readStatusTextRead: { color: '#059669' },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', lineHeight: 29, marginBottom: 16 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', maxWidth: '100%' },
  detailMetaTextBlock: { flexShrink: 1 },
  detailMetaLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  detailMetaText: { fontSize: 13, color: '#334155', fontWeight: '700', flexShrink: 1 },
  detailBodyLabel: { fontSize: 13, color: '#475569', fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  detailBody: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 16, borderRadius: 14, marginBottom: 16 },
  detailBodyText: { fontSize: 15, color: '#334155', lineHeight: 22 },
  detailAttachment: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', padding: 14, borderRadius: 14, marginBottom: 18 },
  detailAttachmentInfo: { flex: 1, minWidth: 0 },
  detailAttachmentText: { fontSize: 14, color: '#4338ca', fontWeight: '800' },
  detailAttachmentSubtext: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  detailNoAttachment: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textAlign: 'center', paddingVertical: 12, marginBottom: 8 },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  detailEditBtn: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eef2ff', borderRadius: 14, borderWidth: 1, borderColor: '#c7d2fe' },
  detailDeleteBtn: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecaca' },
  detailBtnText1: { fontSize: 14, color: '#4f46e5', fontWeight: '800' },
  detailBtnText2: { fontSize: 14, color: '#ef4444', fontWeight: '800' },

  // VISOR IMAGENES
  imageViewerContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 44, right: 18, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  imageViewerImage: { width: '100%', height: '100%' },

  notifGrid: { gap: 12 },
  notifCard: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  notifCardPressed: { 
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.04
  },
  notifCardAccent: { width: 5 },
  notifCardContent: { flex: 1, padding: 16 },
  notifCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 10
  },
  notifIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  unreadDot: { position: 'absolute', top: -3, right: -3, width: 11, height: 11, borderRadius: 6, backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#ffffff' },
  notifTitleContainer: { flex: 1 },
  notifCardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a',
    marginBottom: 2
  },
  notifCardMeta: { 
    fontSize: 12, 
    fontWeight: '600'
  },
  notifBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  notifBadgeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  notifCardBody: { 
    fontSize: 14, 
    color: '#64748b', 
    lineHeight: 20,
    marginBottom: 12
  },
  notifCardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc'
  },
  notifFooterLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flexWrap: 'wrap',
    flex: 1
  },
  notifDateBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  notifDateText: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '500' 
  },
  notifActivityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  notifActivityText: { 
    fontSize: 11, 
    color: '#4f46e5', 
    fontWeight: '600' 
  },
  notifEmisorBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  notifEmisorText: { 
    fontSize: 11, 
    color: '#059669', 
    fontWeight: '600' 
  },
  notifViewMore: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4
  },
  notifViewMoreText: { 
    fontSize: 13, 
    color: '#4f46e5', 
    fontWeight: '600' 
  },

  // HISTORIAL + EMPTY STATE (mejorado)
  historySection: { paddingHorizontal: 20, marginTop: 10 },
  historyHeaderCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  historyHeaderTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  historyHeaderTitleBlock: { flex: 1 },
  historyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  historySubtitle: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '500' },
  historyHeaderActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  historyCount: { backgroundColor: '#eef2ff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  historyCountText: { fontSize: 12, fontWeight: '800', color: '#1A1A4E' },

  emptyState: { alignItems: 'center', paddingTop: 30, paddingBottom: 10 },
  emptyCircle: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 30, lineHeight: 20, marginBottom: 16 },
  emptyActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
  emptyActionText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
