import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axios';
import BottomNav from '../../components/BottomNav';

const TIPO_LABELS = {
  semestre: 'Semestre',
  temporada: 'Temporada',
};

const TIPO_COLORS = {
  semestre: '#4f46e5',
  temporada: '#f59e0b',
};

export default function PeriodosScreen({ navigation }) {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activo, setActivo] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('semestre');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPeriodos();
    loadActivo();
  }, []);

  const loadPeriodos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/periodos');
      setPeriodos(response.data?.data || []);
    } catch (error) {
      console.error('Error cargando periodos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivo = async () => {
    try {
      const response = await api.get('/periodos/activo');
      setActivo(response.data?.data || null);
    } catch (error) {
      console.error('Error cargando periodo activo:', error);
    }
  };

  const handleActivar = async (id) => {
    try {
      await api.put(`/periodos/${id}/activar`);
      await loadPeriodos();
      await loadActivo();
      Alert.alert('Éxito', 'Periodo activado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo activar el periodo');
    }
  };

  const handleDelete = (periodo) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Eliminar "${periodo.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/periodos/${periodo.id}`);
              await loadPeriodos();
              await loadActivo();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const openCreate = () => {
    setEditingId(null);
    setNombre('');
    setTipo('semestre');
    setFechaInicio('');
    setFechaFin('');
    setShowModal(true);
  };

  const openEdit = (periodo) => {
    setEditingId(periodo.id);
    setNombre(periodo.nombre);
    setTipo(periodo.tipo);
    setFechaInicio(periodo.fecha_inicio);
    setFechaFin(periodo.fecha_fin);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !fechaInicio || !fechaFin) {
      Alert.alert('Error', 'Complete todos los campos');
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      tipo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/periodos/${editingId}`, payload);
      } else {
        await api.post('/periodos', payload);
      }
      setShowModal(false);
      await loadPeriodos();
      await loadActivo();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const esVigente = (periodo) => {
    const hoy = new Date().toISOString().split('T')[0];
    return hoy >= periodo.fecha_inicio && hoy <= periodo.fecha_fin;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBg}>
          <View style={[styles.bgCircle1, { zIndex: 0 }]} />
          <View style={[styles.bgCircle2, { zIndex: 0 }]} />
          <View style={[styles.glassCard, { zIndex: 1 }]}>
            <View style={styles.glassHeaderTop}>
              <View style={styles.glassIconContainer}>
                <Ionicons name="calendar" size={24} color="#ffffff" />
              </View>
              <View style={styles.glassTitleBlock}>
                <Text style={styles.glassTitle}>Gestión Académica</Text>
                <Text style={styles.glassSubtitle}>Periodos, semestres y temporadas</Text>
              </View>
            </View>
            
            {/* Periodo Activo Badge */}
            {activo && (
              <View style={styles.activoBadge}>
                <View style={[styles.activoDot, { backgroundColor: TIPO_COLORS[activo.tipo] }]} />
                <Text style={styles.activoText}>Activo: {activo.nombre}</Text>
                <Text style={styles.activoSub}>
                  {formatFecha(activo.fecha_inicio)} - {formatFecha(activo.fecha_fin)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#4f46e5' }]}>
            <Text style={[styles.statNumber, { color: '#4f46e5' }]}>
              {periodos.filter(p => p.tipo === 'semestre').length}
            </Text>
            <Text style={styles.statLabel}>Semestres</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {periodos.filter(p => p.tipo === 'temporada').length}
            </Text>
            <Text style={styles.statLabel}>Temporadas</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {periodos.filter(esVigente).length}
            </Text>
            <Text style={styles.statLabel}>Vigentes</Text>
          </View>
        </View>

        {/* Action Button */}
        <Pressable style={styles.createBtn} onPress={openCreate}>
          <Ionicons name="add-circle" size={20} color="#ffffff" />
          <Text style={styles.createBtnText}>Nuevo Periodo</Text>
        </Pressable>

        {/* Periodos List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todos los Periodos</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
          ) : periodos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin periodos</Text>
              <Text style={styles.emptySub}>Crea el primer periodo académico</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {periodos.map((periodo) => {
                const isActivo = activo?.id === periodo.id;
                const isVigente = esVigente(periodo);
                
                return (
                  <View key={periodo.id} style={[styles.periodoCard, isActivo && styles.periodoCardActive]}>
                    <View style={[styles.periodoBar, { backgroundColor: TIPO_COLORS[periodo.tipo] }]} />
                    <View style={styles.periodoContent}>
                      <View style={styles.periodoHeader}>
                        <View>
                          <Text style={styles.periodoName}>{periodo.nombre}</Text>
                          <View style={[styles.tipoBadge, { backgroundColor: TIPO_COLORS[periodo.tipo] + '20' }]}>
                            <Text style={[styles.tipoText, { color: TIPO_COLORS[periodo.tipo] }]}>
                              {TIPO_LABELS[periodo.tipo]}
                            </Text>
                          </View>
                        </View>
                        
                        {isActivo && (
                          <View style={styles.activoTag}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text style={styles.activoTagText}>Activo</Text>
                          </View>
                        )}
                        {!isActivo && isVigente && (
                          <View style={styles.vigenteTag}>
                            <Text style={styles.vigenteTagText}>Vigente</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.periodoDates}>
                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                        <Text style={styles.periodoDatesText}>
                          {formatFecha(periodo.fecha_inicio)} - {formatFecha(periodo.fecha_fin)}
                        </Text>
                      </View>
                      
                      <View style={styles.periodoActions}>
                        {!isActivo && (
                          <Pressable 
                            style={styles.activarBtn}
                            onPress={() => handleActivar(periodo.id)}
                          >
                            <Ionicons name="play-circle" size={16} color="#4f46e5" />
                            <Text style={styles.activarBtnText}>Activar</Text>
                          </Pressable>
                        )}

                        <Pressable
                          style={styles.verGestionBtn}
                          onPress={() => navigation.navigate('ResumenPeriodo', { periodo })}
                        >
                          <Ionicons name="eye-outline" size={16} color="#0f766e" />
                          <Text style={styles.verGestionBtnText}>Ver gestión</Text>
                        </Pressable>
                        
                        <Pressable style={styles.editBtn} onPress={() => openEdit(periodo)}>
                          <Ionicons name="create-outline" size={16} color="#4f46e5" />
                        </Pressable>
                        
                        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(periodo)}>
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} activeScreen="Periodos" />

      {/* Modal Create/Edit */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              
              <View style={styles.modalHeader}>
                <Ionicons name="calendar" size={28} color="#4f46e5" />
                <Text style={styles.modalTitle}>
                  {editingId ? 'Editar Periodo' : 'Nuevo Periodo'}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: 2026-1"
                      placeholderTextColor="#94a3b8"
                      value={nombre}
                      onChangeText={setNombre}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tipo</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={tipo}
                      onValueChange={(itemValue) => setTipo(itemValue)}
                    >
                      <Picker.Item label="Semestre" value="semestre" />
                      <Picker.Item label="Temporada" value="temporada" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fecha Inicio</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={fechaInicio}
                      onChangeText={setFechaInicio}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fecha Fin</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={fechaFin}
                      onChangeText={setFechaFin}
                    />
                  </View>
                </View>

                <Pressable 
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>Guardar</Text>
                    </>
                  )}
                </Pressable>
                
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 100 },

  // Header
  headerBg: { backgroundColor: '#1e1b4b', paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden', position: 'relative' },
  bgCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#1A1A4E', top: -60, right: -40, opacity: 0.4 },
  bgCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#6366f1', bottom: -20, left: 30, opacity: 0.3 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 24, padding: 24 },
  glassHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  glassTitleBlock: { flex: 1 },
  glassIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  glassTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  glassSubtitle: { fontSize: 14, color: '#a5b4fc', marginTop: 2 },
  
  activoBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  activoDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
  activoText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  activoSub: { fontSize: 13, color: '#a5b4fc', marginTop: 4 },

  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4 },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },

  // Create Button
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, borderRadius: 16 },
  createBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },

  // List
  listContainer: { gap: 12 },
  periodoCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  periodoCardActive: { borderColor: '#10b981', borderWidth: 2 },
  periodoBar: { width: 5 },
  periodoContent: { flex: 1, padding: 16 },
  periodoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  periodoName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  tipoBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginTop: 6 },
  tipoText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  activoTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#10b981' },
  activoTagText: { fontSize: 11, fontWeight: '700', color: '#10b981' },
  vigenteTag: { backgroundColor: '#dbeafe', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  vigenteTagText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  
  periodoDates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  periodoDatesText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  periodoActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  activarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  activarBtnText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  verGestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  verGestionBtnText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  editBtn: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 10 },
  deleteBtn: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 10 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  modalContainer: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 12 },
  modalContent: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%', maxWidth: 720, minHeight: 420, padding: 24, flexShrink: 1 },
  modalHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },

  // Form
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 18, height: 56, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  input: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  pickerWrapper: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
