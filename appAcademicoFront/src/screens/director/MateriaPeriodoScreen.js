
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import BottomNav from '../../components/BottomNav';

const ESTADOS = [
  { value: 'activa', label: 'Activa', color: '#10b981', bg: '#ecfdf5' },
  { value: 'cancelada', label: 'Cancelada', color: '#ef4444', bg: '#fef2f2' },
  { value: 'finalizada', label: 'Finalizada', color: '#6366f1', bg: '#eef2ff' },
];

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const getEstadoStyle = (estado) =>
  ESTADOS.find((e) => e.value === estado) || { color: '#94a3b8', bg: '#f1f5f9', label: estado };

export default function MateriaPeriodoScreen({ navigation }) {
  const { usuario } = useAuth();
  const carreraId = usuario?.carrera_id;

  const [periodo, setPeriodo] = useState(null);
  const [todosLosPeriodos, setTodosLosPeriodos] = useState([]);
  const [showPeriodoPicker, setShowPeriodoPicker] = useState(false);
  const [ofertas, setOfertas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal oferta
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [materiaId, setMateriaId] = useState(null);
  const [docenteId, setDocenteId] = useState(null);
  const [paralelo, setParalelo] = useState('');
  const [estado, setEstado] = useState('activa');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMateriaPicker, setShowMateriaPicker] = useState(false);
  const [showDocentePicker, setShowDocentePicker] = useState(false);
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);

  // Modal horarios
  const [horarioModal, setHorarioModal] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [horarioDia, setHorarioDia] = useState('lunes');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFin, setHorarioFin] = useState('');
  const [horarioAula, setHorarioAula] = useState('');
  const [savingHorario, setSavingHorario] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState(false);
  const [horarioEditando, setHorarioEditando] = useState(null); // null = crear, objeto = editar

  // Modal inscripciones
  const [inscripcionModal, setInscripcionModal] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loadingInscrip, setLoadingInscrip] = useState(false);
  const [savingInscrip, setSavingInscrip] = useState(false);

  const cargar = useCallback(async (periodoIdOverride = null) => {
    setLoading(true);
    try {
      const [periodoRes, todosRes, materiasRes, usuariosRes] = await Promise.all([
        api.get('/periodos/activo').catch(() => ({ data: { data: null } })),
        api.get('/periodos').catch(() => ({ data: { data: [] } })),
        api.get(`/materias?carrera_id=${carreraId}`),
        api.get(`/usuarios?carrera_id=${carreraId}`),
      ]);

      const periodoActivo = periodoRes.data?.data ?? null;
      const listaPeriodos = todosRes.data?.data ?? todosRes.data ?? [];
      setTodosLosPeriodos(Array.isArray(listaPeriodos) ? listaPeriodos : []);

      // Usar el periodo override si se pasó, sino el activo
      const periodoSeleccionado = periodoIdOverride
        ? listaPeriodos.find((p) => p.id === periodoIdOverride) ?? periodoActivo
        : periodoActivo;
      setPeriodo(periodoSeleccionado);

      if (periodoSeleccionado?.id) {
        try {
          const ofertasRes = await api.get(`/director/materia-periodo?periodo_id=${periodoSeleccionado.id}`);
          const ofertasData = ofertasRes.data?.data ?? [];
          setOfertas(Array.isArray(ofertasData) ? ofertasData : []);
        } catch { setOfertas([]); }
      } else {
        setOfertas([]);
      }

      const materiasData = materiasRes.data?.data ?? materiasRes.data ?? [];
      setMaterias(Array.isArray(materiasData) ? materiasData : []);

      const usuariosData = usuariosRes.data?.data ?? usuariosRes.data ?? [];
      const soloDocentes = usuariosData.filter((u) => {
        const roles = u.rolesUsuario ?? u.roles_usuario ?? u.roles ?? [];
        return roles.some((r) => (r?.rol ?? r) === 'docente');
      });
      setDocentes(soloDocentes);
    } catch (e) {
      console.error('Error cargando datos:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, [carreraId]);

  const cambiarPeriodo = async (p) => {
    setPeriodo(p);
    setShowPeriodoPicker(false);
    setLoading(true);
    try {
      const ofertasRes = await api.get(`/director/materia-periodo?periodo_id=${p.id}`);
      const ofertasData = ofertasRes.data?.data ?? [];
      setOfertas(Array.isArray(ofertasData) ? ofertasData : []);
    } catch { setOfertas([]); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const resetForm = () => {
    setMateriaId(null); setDocenteId(null); setParalelo('');
    setEstado('activa'); setObservaciones(''); setEditando(null);
  };

  const abrirCrear = () => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las gestiones anteriores solo se pueden consultar.');
      return;
    }

    resetForm();
    setModalVisible(true);
  };

  const abrirEditar = (oferta) => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las gestiones anteriores solo se pueden consultar.');
      return;
    }

    setEditando(oferta);
    setMateriaId(oferta.materia_id);
    setDocenteId(oferta.docente_id ?? null);
    setParalelo(oferta.paralelo ?? '');
    setEstado(oferta.estado ?? 'activa');
    setObservaciones(oferta.observaciones ?? '');
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (!periodo) {
      Alert.alert('Sin periodo activo', 'El decano debe activar un periodo primero.');
      return;
    }
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las gestiones anteriores solo se pueden consultar.');
      return;
    }
    if (!materiaId && !editando) {
      Alert.alert('Error', 'Debes seleccionar una materia.');
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        await api.put(`/director/materia-periodo/${editando.id}`, {
          docente_id: docenteId || null,
          paralelo: paralelo.trim() || null,
          estado,
          observaciones: observaciones.trim() || null,
        });
        Alert.alert('Exito', 'Materia actualizada correctamente.');
      } else {
        await api.post('/director/materia-periodo', {
          periodo_id: periodo.id,
          materia_id: materiaId,
          docente_id: docenteId || null,
          paralelo: paralelo.trim() || null,
          estado,
          observaciones: observaciones.trim() || null,
        });
        Alert.alert('Exito', 'Materia agregada al periodo.');
      }
      setModalVisible(false);
      resetForm();
      cargar();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Horarios ──────────────────────────────────────────────
  const abrirHorarios = async (oferta) => {
    setHorarioModal(oferta);
    setHorarios(oferta.horarios ?? []);
    setHorarioDia('lunes'); setHorarioInicio(''); setHorarioFin(''); setHorarioAula('');
    setHorarioEditando(null);
    setLoadingHorarios(true);
    try {
      const res = await api.get(`/director/horarios/oferta/${oferta.id}`);
      setHorarios(res.data?.data ?? []);
    } catch { setHorarios([]); }
    finally { setLoadingHorarios(false); }
  };

  const handleEditarHorario = (h) => {
    setHorarioEditando(h);
    setHorarioDia(h.dia);
    setHorarioInicio(h.hora_inicio?.slice(0, 5) ?? '');
    setHorarioFin(h.hora_fin?.slice(0, 5) ?? '');
    setHorarioAula(h.aula ?? '');
  };

  const handleCancelarEdicion = () => {
    setHorarioEditando(null);
    setHorarioDia('lunes'); setHorarioInicio(''); setHorarioFin(''); setHorarioAula('');
  };

  const handleAgregarHorario = async () => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Los horarios de gestiones anteriores no se pueden modificar.');
      return;
    }
    if (!horarioInicio || !horarioFin) {
      Alert.alert('Error', 'Hora inicio y fin son obligatorias (formato HH:MM).');
      return;
    }
    setSavingHorario(true);
    try {
      if (horarioEditando) {
        // EDITAR horario existente
        const res = await api.put(`/director/horarios/${horarioEditando.id}`, {
          dia: horarioDia,
          hora_inicio: horarioInicio,
          hora_fin: horarioFin,
          aula: horarioAula.trim() || null,
        });
        const updated = res.data.data;
        setHorarios((prev) => prev.map((h) => h.id === updated.id ? updated : h));
        setOfertas((prev) => prev.map((o) =>
          o.id === horarioModal.id
            ? { ...o, horarios: (o.horarios ?? []).map((h) => h.id === updated.id ? updated : h) }
            : o
        ));
        setHorarioEditando(null);
      } else {
        // CREAR nuevo horario
        const res = await api.post(`/director/horarios/oferta/${horarioModal.id}`, {
          dia: horarioDia,
          hora_inicio: horarioInicio,
          hora_fin: horarioFin,
          aula: horarioAula.trim() || null,
        });
        setHorarios((prev) => [...prev, res.data.data]);
        setOfertas((prev) => prev.map((o) =>
          o.id === horarioModal.id ? { ...o, horarios: [...(o.horarios ?? []), res.data.data] } : o
        ));
      }
      setHorarioInicio(''); setHorarioFin(''); setHorarioAula('');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo guardar el horario.');
    } finally { setSavingHorario(false); }
  };

  const handleEliminarHorario = (horario) => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Los horarios de gestiones anteriores no se pueden modificar.');
      return;
    }

    Alert.alert('Eliminar horario', `Eliminar ${horario.dia} ${horario.hora_inicio}-${horario.hora_fin}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/director/horarios/${horario.id}`);
            setHorarios((prev) => prev.filter((h) => h.id !== horario.id));
            setOfertas((prev) => prev.map((o) =>
              o.id === horarioModal.id
                ? { ...o, horarios: (o.horarios ?? []).filter((h) => h.id !== horario.id) }
                : o
            ));
          } catch { Alert.alert('Error', 'No se pudo eliminar.'); }
        },
      },
    ]);
  };

  const handleEliminar = (oferta) => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las gestiones anteriores solo se pueden consultar.');
      return;
    }

    Alert.alert('Quitar materia', `Quitar "${oferta.materia?.nombre}" del periodo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/director/materia-periodo/${oferta.id}`);
            cargar();
          } catch (_e) {
            Alert.alert('Error', 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  const materiaNombre = (id) => materias.find((m) => m.id === id)?.nombre ?? 'Seleccionar materia';
  const docenteNombre = (id) => {
    if (!id) return 'Sin docente asignado';
    return docentes.find((d) => d.id === id)?.nombre ?? 'Sin docente asignado';
  };
  const materiasDisponibles = materias.filter((m) => !ofertas.some((o) => o.materia_id === m.id));
  const isPeriodoActivo = !!periodo?.activo;

  // ── Inscripciones ─────────────────────────────────────────
  const abrirInscripciones = async (oferta) => {
    setInscripcionModal(oferta);
    setLoadingInscrip(true);
    try {
      const [inscritosRes, disponiblesRes] = await Promise.all([
        api.get(`/director/inscripciones?materia_periodo_id=${oferta.id}`),
        api.get(`/director/estudiantes-disponibles?materia_periodo_id=${oferta.id}`),
      ]);
      setInscritos(inscritosRes.data?.data ?? []);
      setDisponibles(disponiblesRes.data?.data ?? []);
    } catch { setInscritos([]); setDisponibles([]); }
    finally { setLoadingInscrip(false); }
  };

  const handleInscribir = async (usuarioId) => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las inscripciones de gestiones anteriores no se pueden modificar.');
      return;
    }

    setSavingInscrip(true);
    try {
      await api.post('/director/inscripciones', {
        materia_periodo_id: inscripcionModal.id,
        usuario_ids: [usuarioId],
      });
      // Mover de disponibles a inscritos
      const est = disponibles.find((d) => d.id === usuarioId);
      if (est) {
        setInscritos((prev) => [...prev, est]);
        setDisponibles((prev) => prev.filter((d) => d.id !== usuarioId));
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'No se pudo inscribir.');
    } finally { setSavingInscrip(false); }
  };

  const handleDesinscribir = (est) => {
    if (!isPeriodoActivo) {
      Alert.alert('Solo lectura', 'Las inscripciones de gestiones anteriores no se pueden modificar.');
      return;
    }

    Alert.alert('Desinscribir', `Quitar a ${est.nombre} de esta materia?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/director/inscripciones', {
              data: { materia_periodo_id: inscripcionModal.id, usuario_id: est.id },
            });
            setInscritos((prev) => prev.filter((i) => i.id !== est.id));
            setDisponibles((prev) => [...prev, est].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          } catch { Alert.alert('Error', 'No se pudo desinscribir.'); }
        },
      },
    ]);
  };

  const renderOferta = ({ item }) => {
    const est = getEstadoStyle(item.estado);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBg}>
            <Ionicons name="library-outline" size={22} color="#4f46e5" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.cardTitle}>{item.materia?.nombre ?? 'Materia'}</Text>
              {!!item.paralelo && (
                <View style={styles.paraleloBadge}>
                  <Text style={styles.paraleloText}>Par. {item.paralelo}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardSub}>
              {item.docente ? item.docente.nombre : 'Sin docente asignado'}
            </Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
            <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
          </View>
        </View>

        {/* Horarios resumidos */}
        {item.horarios && item.horarios.length > 0 && (
          <View style={styles.horariosResumen}>
            {item.horarios.map((h) => (
              <View key={h.id} style={styles.horarioChip}>
                <Ionicons name="time-outline" size={11} color="#4f46e5" />
                <Text style={styles.horarioChipText}>
                  {h.dia.slice(0,3)} {h.hora_inicio?.slice(0,5)}-{h.hora_fin?.slice(0,5)}
                  {h.aula ? ` · ${h.aula}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!!item.observaciones && (
          <Text style={styles.cardObs}>{item.observaciones}</Text>
        )}
        <View style={styles.cardActions}>
          <Pressable style={styles.horarioBtn} onPress={() => abrirHorarios(item)}>
            <Ionicons name="time-outline" size={15} color="#0f766e" />
            <Text style={styles.horarioBtnText}>Horarios ({item.horarios?.length ?? 0})</Text>
          </Pressable>
          <Pressable style={styles.inscripcionBtn} onPress={() => abrirInscripciones(item)}>
            <Ionicons name="people-outline" size={15} color="#7c3aed" />
            <Text style={styles.inscripcionBtnText}>Alumnos</Text>
          </Pressable>
          {isPeriodoActivo && (
            <>
              <Pressable style={styles.editBtn} onPress={() => abrirEditar(item)}>
                <Ionicons name="pencil-outline" size={15} color="#4f46e5" />
                <Text style={styles.editBtnText}>Editar</Text>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => handleEliminar(item)}>
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Quitar</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gestión de Materias</Text>
          {/* Selector de periodo */}
          <Pressable style={styles.periodoSelector} onPress={() => setShowPeriodoPicker(true)}>
            <Ionicons name="calendar-outline" size={15} color="#c7d2fe" />
            <Text style={styles.periodoSelectorText} numberOfLines={1}>
              {periodo ? periodo.nombre : 'Sin periodo'}
            </Text>
            {isPeriodoActivo && (
              <View style={styles.activoPill}><Text style={styles.activoPillText}>Activo</Text></View>
            )}
            <Ionicons name="chevron-down" size={14} color="#c7d2fe" />
          </Pressable>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{ofertas.length} materias</Text>
        </View>
      </View>

      {periodo && (
        <View style={[styles.periodoCard, !periodo.activo && styles.periodoCardHistorico]}>
          <Ionicons name="calendar-outline" size={18} color={periodo.activo ? '#4f46e5' : '#94a3b8'} />
          <Text style={[styles.periodoText, !periodo.activo && { color: '#94a3b8' }]}>
            {periodo.tipo === 'semestre' ? 'Semestre' : 'Temporada'} - {periodo.fecha_inicio} al {periodo.fecha_fin}
          </Text>
          {!periodo.activo && (
            <View style={styles.soloLecturaBadge}>
              <Ionicons name="eye-outline" size={12} color="#94a3b8" />
              <Text style={styles.soloLecturaText}>Solo lectura</Text>
            </View>
          )}
        </View>
      )}

      {!periodo && !loading && (
        <View style={styles.noPeriodoCard}>
          <Ionicons name="warning-outline" size={28} color="#f59e0b" />
          <Text style={styles.noPeriodoText}>
            No hay periodo activo. El decano debe activar uno primero.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#1A1A4E" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ofertas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderOferta}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin materias en este periodo</Text>
              <Text style={styles.emptySub}>
                {isPeriodoActivo
                  ? 'Presiona + para agregar materias al periodo activo'
                  : 'Esta gestion historica no tiene materias registradas'}
              </Text>
            </View>
          }
        />
      )}

      {isPeriodoActivo && (
        <Pressable style={styles.fab} onPress={abrirCrear}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 24 }}>
              <Text style={styles.sheetTitle}>
                {editando ? 'Editar Materia del Periodo' : 'Agregar Materia al Periodo'}
              </Text>

              {!editando ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MATERIA</Text>
                  <Pressable style={styles.selector} onPress={() => setShowMateriaPicker(true)}>
                    <Ionicons name="library-outline" size={18} color="#4f46e5" />
                    <Text style={[styles.selectorText, !materiaId && { color: '#94a3b8' }]}>
                      {materiaNombre(materiaId)}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>MATERIA</Text>
                  <View style={[styles.selector, { backgroundColor: '#f1f5f9' }]}>
                    <Ionicons name="library-outline" size={18} color="#4f46e5" />
                    <Text style={styles.selectorText}>{editando.materia?.nombre}</Text>
                  </View>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PARALELO (OPCIONAL)</Text>
                <TextInput
                  style={styles.selector}
                  placeholder="Ej: A, B, 1, 2..."
                  placeholderTextColor="#94a3b8"
                  value={paralelo}
                  onChangeText={setParalelo}
                  maxLength={10}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DOCENTE (OPCIONAL)</Text>
                <Pressable style={styles.selector} onPress={() => setShowDocentePicker(true)}>
                  <Ionicons name="person-outline" size={18} color="#0f766e" />
                  <Text style={[styles.selectorText, !docenteId && { color: '#94a3b8' }]}>
                    {docenteNombre(docenteId)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ESTADO</Text>
                <Pressable style={styles.selector} onPress={() => setShowEstadoPicker(true)}>
                  <View style={[styles.estadoDot, { backgroundColor: getEstadoStyle(estado).color }]} />
                  <Text style={styles.selectorText}>{getEstadoStyle(estado).label}</Text>
                  <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>OBSERVACIONES (OPCIONAL)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ej: Materia con cupo limitado..."
                  placeholderTextColor="#94a3b8"
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleGuardar} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>{editando ? 'Guardar Cambios' : 'Agregar al Periodo'}</Text>
                  </>
                )}
              </Pressable>
              <View style={{ height: 30 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showMateriaPicker} transparent animationType="slide" onRequestClose={() => setShowMateriaPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMateriaPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Seleccionar Materia</Text>
            <ScrollView>
              {materiasDisponibles.length === 0 ? (
                <Text style={styles.pickerEmpty}>Todas las materias ya estan en este periodo</Text>
              ) : (
                materiasDisponibles.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.pickerItem, materiaId === m.id && styles.pickerItemActive]}
                    onPress={() => { setMateriaId(m.id); setShowMateriaPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, materiaId === m.id && { color: '#4f46e5', fontWeight: '700' }]}>
                      {m.nombre}
                    </Text>
                    {materiaId === m.id && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showDocentePicker} transparent animationType="slide" onRequestClose={() => setShowDocentePicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDocentePicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Seleccionar Docente</Text>
            <ScrollView>
              <Pressable
                style={[styles.pickerItem, !docenteId && styles.pickerItemActive]}
                onPress={() => { setDocenteId(null); setShowDocentePicker(false); }}
              >
                <Text style={[styles.pickerItemText, !docenteId && { color: '#4f46e5', fontWeight: '700' }]}>
                  Sin docente asignado
                </Text>
                {!docenteId && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
              </Pressable>
              {docentes.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.pickerItem, docenteId === d.id && styles.pickerItemActive]}
                  onPress={() => { setDocenteId(d.id); setShowDocentePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, docenteId === d.id && { color: '#4f46e5', fontWeight: '700' }]}>
                    {d.nombre}
                  </Text>
                  {docenteId === d.id && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showEstadoPicker} transparent animationType="slide" onRequestClose={() => setShowEstadoPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowEstadoPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Seleccionar Estado</Text>
            <ScrollView>
              {ESTADOS.map((e) => (
                <Pressable
                  key={e.value}
                  style={[styles.pickerItem, estado === e.value && styles.pickerItemActive]}
                  onPress={() => { setEstado(e.value); setShowEstadoPicker(false); }}
                >
                  <View style={[styles.estadoDot, { backgroundColor: e.color }]} />
                  <Text style={[styles.pickerItemText, estado === e.value && { color: e.color, fontWeight: '700' }]}>
                    {e.label}
                  </Text>
                  {estado === e.value && <Ionicons name="checkmark" size={18} color={e.color} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Horarios */}
      <Modal visible={!!horarioModal} transparent animationType="slide" onRequestClose={() => setHorarioModal(null)}>
        <Pressable style={styles.overlay} onPress={() => setHorarioModal(null)}>
          <Pressable style={[styles.sheet, { minHeight: '80%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 24 }}>
              <Text style={styles.sheetTitle}>
                Horarios — {horarioModal?.materia?.nombre}{horarioModal?.paralelo ? ` (Par. ${horarioModal.paralelo})` : ''}
              </Text>
              {loadingHorarios ? (
                <ActivityIndicator color="#1A1A4E" style={{ marginVertical: 20 }} />
              ) : horarios.length === 0 ? (
                <View style={styles.horarioEmpty}>
                  <Ionicons name="time-outline" size={32} color="#cbd5e1" />
                  <Text style={styles.horarioEmptyText}>Sin horarios registrados</Text>
                </View>
              ) : (
                horarios.map((h) => (
                  <View key={h.id} style={styles.horarioRow}>
                    <View style={styles.horarioDiaBadge}>
                      <Text style={styles.horarioDiaText}>{h.dia.slice(0,3).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.horarioHora}>{h.hora_inicio?.slice(0,5)} - {h.hora_fin?.slice(0,5)}</Text>
                      {!!h.aula && <Text style={styles.horarioAulaText}>Aula: {h.aula}</Text>}
                    </View>
                    {isPeriodoActivo && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable onPress={() => handleEditarHorario(h)} style={[styles.horarioDeleteBtn, { backgroundColor: '#eef2ff' }]}>
                          <Ionicons name="pencil-outline" size={16} color="#4f46e5" />
                        </Pressable>
                        <Pressable onPress={() => handleEliminarHorario(h)} style={styles.horarioDeleteBtn}>
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              )}
              {isPeriodoActivo ? (
                <View style={styles.horarioFormCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.fieldLabel}>{horarioEditando ? 'EDITAR HORARIO' : 'AGREGAR HORARIO'}</Text>
                    {horarioEditando && (
                      <Pressable onPress={handleCancelarEdicion}>
                        <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600' }}>Cancelar</Text>
                      </Pressable>
                    )}
                  </View>
                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>DIA</Text>
                  <Pressable style={styles.selector} onPress={() => setShowDiaPicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color="#4f46e5" />
                    <Text style={styles.selectorText}>{horarioDia.charAt(0).toUpperCase() + horarioDia.slice(1)}</Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>INICIO</Text>
                      {Platform.OS === 'web' ? (
                        <input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)}
                          style={{ height: 48, borderRadius: 12, border: '1.5px solid #e2e8f0', paddingLeft: 12, fontSize: 15, width: '100%' }} />
                      ) : (
                        <TextInput style={styles.selector} placeholder="08:00" placeholderTextColor="#94a3b8"
                          value={horarioInicio} onChangeText={setHorarioInicio} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>FIN</Text>
                      {Platform.OS === 'web' ? (
                        <input type="time" value={horarioFin} onChange={(e) => setHorarioFin(e.target.value)}
                          style={{ height: 48, borderRadius: 12, border: '1.5px solid #e2e8f0', paddingLeft: 12, fontSize: 15, width: '100%' }} />
                      ) : (
                        <TextInput style={styles.selector} placeholder="10:00" placeholderTextColor="#94a3b8"
                          value={horarioFin} onChangeText={setHorarioFin} />
                      )}
                    </View>
                  </View>
                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>AULA (OPCIONAL)</Text>
                  <TextInput style={styles.selector} placeholder="Ej: Lab 3, Aula 201..."
                    placeholderTextColor="#94a3b8" value={horarioAula} onChangeText={setHorarioAula} />
                  <Pressable style={[styles.saveBtn, { marginTop: 16, backgroundColor: horarioEditando ? '#4f46e5' : '#0f766e' }, savingHorario && { opacity: 0.6 }]}
                    onPress={handleAgregarHorario} disabled={savingHorario}>
                    {savingHorario ? <ActivityIndicator size="small" color="#fff" /> : (
                      <>
                        <Ionicons name={horarioEditando ? 'checkmark-done-outline' : 'add-circle-outline'} size={20} color="#fff" />
                        <Text style={styles.saveBtnText}>{horarioEditando ? 'Guardar Cambios' : 'Agregar Horario'}</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.readOnlyNotice}>
                  <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
                  <Text style={styles.readOnlyNoticeText}>Historial de horarios en solo lectura</Text>
                </View>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Picker Dia */}
      <Modal visible={showDiaPicker} transparent animationType="slide" onRequestClose={() => setShowDiaPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowDiaPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Seleccionar Dia</Text>
            <ScrollView>
              {DIAS.map((d) => (
                <Pressable key={d} style={[styles.pickerItem, horarioDia === d && styles.pickerItemActive]}
                  onPress={() => { setHorarioDia(d); setShowDiaPicker(false); }}>
                  <Text style={[styles.pickerItemText, horarioDia === d && { color: '#4f46e5', fontWeight: '700' }]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                  {horarioDia === d && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Picker Periodo */}
      <Modal visible={showPeriodoPicker} transparent animationType="slide" onRequestClose={() => setShowPeriodoPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowPeriodoPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Seleccionar Periodo</Text>
            <ScrollView>
              {todosLosPeriodos.length === 0 ? (
                <Text style={styles.pickerEmpty}>Sin periodos registrados</Text>
              ) : (
                todosLosPeriodos.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.pickerItem, periodo?.id === p.id && styles.pickerItemActive]}
                    onPress={() => cambiarPeriodo(p)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerItemText, periodo?.id === p.id && { color: '#4f46e5', fontWeight: '700' }]}>
                        {p.nombre}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {p.fecha_inicio} — {p.fecha_fin}
                      </Text>
                    </View>
                    {p.activo && (
                      <View style={[styles.activoPill, { marginRight: 8 }]}>
                        <Text style={styles.activoPillText}>Activo</Text>
                      </View>
                    )}
                    {periodo?.id === p.id && <Ionicons name="checkmark" size={18} color="#4f46e5" />}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal Inscripciones */}
      <Modal visible={!!inscripcionModal} transparent animationType="slide" onRequestClose={() => setInscripcionModal(null)}>
        <Pressable style={styles.overlay} onPress={() => setInscripcionModal(null)}>
          <Pressable style={[styles.sheet, { minHeight: '80%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 24 }}>
              <Text style={styles.sheetTitle}>
                Estudiantes — {inscripcionModal?.materia?.nombre}
                {inscripcionModal?.paralelo ? ` (Par. ${inscripcionModal.paralelo})` : ''}
              </Text>

              {loadingInscrip ? (
                <ActivityIndicator color="#1A1A4E" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  {/* Inscritos */}
                  <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>
                    INSCRITOS ({inscritos.length})
                  </Text>
                  {inscritos.length === 0 ? (
                    <View style={styles.horarioEmpty}>
                      <Ionicons name="people-outline" size={28} color="#cbd5e1" />
                      <Text style={styles.horarioEmptyText}>Sin estudiantes inscritos</Text>
                    </View>
                  ) : (
                    inscritos.map((est) => (
                      <View key={est.id} style={styles.estudianteRow}>
                        <View style={styles.estudianteAvatar}>
                          <Text style={styles.estudianteAvatarText}>{est.nombre.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.estudianteNombre}>{est.nombre}</Text>
                          {!!est.registro_universitario && (
                            <Text style={styles.estudianteRu}>RU: {est.registro_universitario}</Text>
                          )}
                        </View>
                        {isPeriodoActivo && (
                          <Pressable onPress={() => handleDesinscribir(est)} style={styles.horarioDeleteBtn}>
                            <Ionicons name="person-remove-outline" size={16} color="#ef4444" />
                          </Pressable>
                        )}
                      </View>
                    ))
                  )}

                  {/* Disponibles para inscribir */}
                  {isPeriodoActivo && disponibles.length > 0 && (
                    <>
                      <Text style={[styles.fieldLabel, { marginTop: 20, marginBottom: 10 }]}>
                        DISPONIBLES PARA INSCRIBIR ({disponibles.length})
                      </Text>
                      {disponibles.map((est) => (
                        <View key={est.id} style={[styles.estudianteRow, { backgroundColor: '#f8fafc' }]}>
                          <View style={[styles.estudianteAvatar, { backgroundColor: '#e0e7ff' }]}>
                            <Text style={[styles.estudianteAvatarText, { color: '#4f46e5' }]}>{est.nombre.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.estudianteNombre}>{est.nombre}</Text>
                            {!!est.registro_universitario && (
                              <Text style={styles.estudianteRu}>RU: {est.registro_universitario}</Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => handleInscribir(est.id)}
                            disabled={savingInscrip}
                            style={styles.inscribirBtn}
                          >
                            <Ionicons name="person-add-outline" size={16} color="#10b981" />
                          </Pressable>
                        </View>
                      ))}
                    </>
                  )}
                  {!isPeriodoActivo && (
                    <View style={styles.readOnlyNotice}>
                      <Ionicons name="lock-closed-outline" size={16} color="#64748b" />
                      <Text style={styles.readOnlyNoticeText}>Historial de inscripciones en solo lectura</Text>
                    </View>
                  )}
                </>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav navigation={navigation} activeScreen="MateriaPeriodo" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1A1A4E', padding: 24, paddingTop: 20, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#1A1A4E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#c7d2fe', fontWeight: '500' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  headerBadgeText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  // Selector de periodo en header
  periodoSelector: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  periodoSelectorText: { fontSize: 14, color: '#c7d2fe', fontWeight: '600', flex: 1 },
  activoPill: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activoPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  periodoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#eef2ff', marginHorizontal: 20, marginTop: 16,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#c7d2fe',
  },
  periodoCardHistorico: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  periodoText: { fontSize: 13, color: '#4f46e5', fontWeight: '600', flex: 1 },
  soloLecturaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  soloLecturaText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  noPeriodoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fffbeb', marginHorizontal: 20, marginTop: 16,
    padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#fde68a',
  },
  noPeriodoText: { flex: 1, fontSize: 13, color: '#92400e', fontWeight: '500', lineHeight: 18 },
  list: { padding: 20, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardIconBg: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardObs: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 10, paddingLeft: 4 },
  cardActions: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#eef2ff', paddingVertical: 10, borderRadius: 12 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', paddingVertical: 10, borderRadius: 12 },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
  fab: {
    position: 'absolute', bottom: 90, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#1A1A4E', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A1A4E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#f8fafc', borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: '70%', paddingTop: 8 },
  sheetHandle: { width: 44, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 24, paddingHorizontal: 24 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1.5, borderColor: '#e2e8f0' },
  selectorText: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },
  estadoDot: { width: 10, height: 10, borderRadius: 5 },
  textArea: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#e2e8f0', fontSize: 14, color: '#0f172a', minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#1A1A4E', padding: 17, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: '#1A1A4E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '60%', paddingTop: 8, paddingBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', paddingHorizontal: 24, marginBottom: 12 },
  pickerEmpty: { textAlign: 'center', color: '#94a3b8', padding: 24, fontSize: 14 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  pickerItemActive: { backgroundColor: '#eef2ff' },
  pickerItemText: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '500' },
  // Paralelo
  paraleloBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  paraleloText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  // Horarios resumen en card
  horariosResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  horarioChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  horarioChipText: { fontSize: 11, color: '#4f46e5', fontWeight: '600' },
  // Boton horarios en card
  horarioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingVertical: 10, borderRadius: 12 },
  horarioBtnText: { fontSize: 13, fontWeight: '600', color: '#0f766e' },
  // Modal horarios
  horarioEmpty: { alignItems: 'center', paddingVertical: 24 },
  horarioEmptyText: { fontSize: 14, color: '#94a3b8', marginTop: 8 },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  horarioDiaBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  horarioDiaText: { fontSize: 11, fontWeight: '800', color: '#4f46e5' },
  horarioHora: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  horarioAulaText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  horarioDeleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  horarioFormCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  readOnlyNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  readOnlyNoticeText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  // Inscripciones
  inscripcionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f5f3ff', paddingVertical: 10, borderRadius: 12 },
  inscripcionBtnText: { fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  estudianteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  estudianteAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  estudianteAvatarText: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  estudianteNombre: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  estudianteRu: { fontSize: 12, color: '#64748b', marginTop: 1 },
  inscribirBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
});
