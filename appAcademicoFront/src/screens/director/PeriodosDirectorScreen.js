import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import {
  getAll, createDirector, updateDirector, removeDirector, activarDirector, getActivo,
} from '../../services/periodoService';

const PRIMARY = '#1A1A4E';
const TIPO_LABELS = {
  semestre:  { label: 'Semestral',  color: '#4f46e5', bg: '#eef2ff' },
  anual:     { label: 'Anual',      color: '#0f766e', bg: '#f0fdf4' },
  temporada: { label: 'Temporada',  color: '#f59e0b', bg: '#fffbeb' },
};

export default function PeriodosDirectorScreen() {
  const [periodos, setPeriodos]     = useState([]);
  const [anioActivo, setAnioActivo] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editando, setEditando]     = useState(null);
  const [nombre, setNombre]         = useState('');
  const [tipo, setTipo]             = useState('semestre');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]     = useState('');
  const [saving, setSaving]         = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [lista, anioRes] = await Promise.all([getAll(), getActivo()]);
      setPeriodos(Array.isArray(lista) ? lista : []);
      setAnioActivo(anioRes?.data ?? null);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los períodos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const abrirCrear = () => {
    if (!anioActivo) {
      Alert.alert('Sin año académico activo', 'El decano debe activar un año académico primero.');
      return;
    }
    setEditando(null); setNombre(''); setTipo('semestre'); setFechaInicio(''); setFechaFin('');
    setShowModal(true);
  };

  const abrirEditar = (p) => {
    setEditando(p); setNombre(p.nombre); setTipo(p.tipo);
    setFechaInicio(p.fecha_inicio ?? ''); setFechaFin(p.fecha_fin ?? '');
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !fechaInicio || !fechaFin) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }
    try {
      setSaving(true);
      const payload = { nombre: nombre.trim(), tipo, fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (editando) {
        await updateDirector(editando.id, payload);
      } else {
        await createDirector(payload);
      }
      setShowModal(false);
      cargar();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivar = async (id) => {
    try { await activarDirector(id); cargar(); }
    catch { Alert.alert('Error', 'No se pudo activar.'); }
  };

  const handleEliminar = (p) => {
    Alert.alert('Eliminar período', `¿Eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await removeDirector(p.id); cargar(); }
        catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  };

  const fmt = (f) => f ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const periodoActivo = periodos.find((p) => p.activo);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Períodos de Carrera</Text>
          <Text style={s.headerSub}>{anioActivo ? `Año: ${anioActivo.nombre}` : 'Sin año académico activo'}</Text>
        </View>
        <View style={s.headerIcon}><Ionicons name="time" size={26} color="rgba(255,255,255,0.8)" /></View>
      </View>

      {!anioActivo && !loading && (
        <View style={s.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#f59e0b" />
          <Text style={s.warningText}>El decano debe activar un año académico para crear períodos.</Text>
        </View>
      )}

      {periodoActivo && (
        <View style={s.activoCard}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={s.activoLabel}>Período activo</Text>
            <Text style={s.activoNombre}>{periodoActivo.nombre}</Text>
            <Text style={s.activoDates}>{fmt(periodoActivo.fecha_inicio)} — {fmt(periodoActivo.fecha_fin)}</Text>
          </View>
          <View style={[s.tipoBadge, { backgroundColor: TIPO_LABELS[periodoActivo.tipo]?.bg }]}>
            <Text style={[s.tipoText, { color: TIPO_LABELS[periodoActivo.tipo]?.color }]}>
              {TIPO_LABELS[periodoActivo.tipo]?.label}
            </Text>
          </View>
        </View>
      )}

      {loading ? <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {periodos.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="time-outline" size={56} color="#cbd5e1" />
              <Text style={s.emptyTitle}>Sin períodos</Text>
              <Text style={s.emptySub}>{anioActivo ? 'Crea el primer período' : 'Espera al decano'}</Text>
            </View>
          ) : periodos.map((p) => {
            const ti = TIPO_LABELS[p.tipo] ?? { label: p.tipo, color: '#64748b', bg: '#f1f5f9' };
            return (
              <View key={p.id} style={[s.card, p.activo && s.cardActivo]}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.cardTitle}>{p.nombre}</Text>
                      {p.activo && <View style={s.activoPill}><Text style={s.activoPillText}>Activo</Text></View>}
                    </View>
                    <Text style={s.cardDates}>{fmt(p.fecha_inicio)} — {fmt(p.fecha_fin)}</Text>
                    {p.anio_academico && <Text style={s.cardAnio}>Año: {p.anio_academico.nombre}</Text>}
                  </View>
                  <View style={[s.tipoBadge, { backgroundColor: ti.bg }]}>
                    <Text style={[s.tipoText, { color: ti.color }]}>{ti.label}</Text>
                  </View>
                </View>
                <View style={s.cardActions}>
                  {!p.activo && (
                    <Pressable style={s.btnActivar} onPress={() => handleActivar(p.id)}>
                      <Ionicons name="play-circle-outline" size={15} color="#4f46e5" />
                      <Text style={s.btnActivarText}>Activar</Text>
                    </Pressable>
                  )}
                  <Pressable style={s.btnEditar} onPress={() => abrirEditar(p)}>
                    <Ionicons name="pencil-outline" size={15} color="#0f766e" />
                    <Text style={s.btnEditarText}>Editar</Text>
                  </Pressable>
                  <Pressable style={s.btnEliminar} onPress={() => handleEliminar(p)}>
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            );
          })}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {!!anioActivo && (
        <Pressable style={s.fab} onPress={abrirCrear}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editando ? 'Editar Período' : 'Nuevo Período'}</Text>
            {anioActivo && (
              <View style={s.anioInfo}>
                <Ionicons name="calendar-outline" size={14} color="#4f46e5" />
                <Text style={s.anioInfoText}>Año académico: {anioActivo.nombre}</Text>
              </View>
            )}
            <Text style={s.label}>Nombre</Text>
            <TextInput style={s.input} placeholder="Ej: 1er Semestre 2026" placeholderTextColor="#94a3b8" value={nombre} onChangeText={setNombre} />
            <Text style={s.label}>Tipo</Text>
            <View style={s.pickerWrapper}>
              <Picker selectedValue={tipo} onValueChange={setTipo}>
                <Picker.Item label="Semestral" value="semestre" />
                <Picker.Item label="Anual" value="anual" />
                <Picker.Item label="Temporada / Intensivo" value="temporada" />
              </Picker>
            </View>
            <Text style={s.label}>Fecha inicio</Text>
            <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={fechaInicio} onChangeText={setFechaInicio} />
            <Text style={s.label}>Fecha fin</Text>
            <TextInput style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={fechaFin} onChangeText={setFechaFin} />
            <Pressable style={[s.btnGuardar, saving && { opacity: 0.6 }]} onPress={handleGuardar} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.btnGuardarText}>{editando ? 'Guardar cambios' : 'Crear período'}</Text>}
            </Pressable>
            <View style={{ height: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub: { color: '#a5b4fc', marginTop: 4, fontWeight: '600' },
  headerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fffbeb', borderRadius: 16, margin: 16, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18, fontWeight: '500' },
  activoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0fdf4', borderRadius: 16, marginHorizontal: 16, marginTop: 12, padding: 14, borderWidth: 1.5, borderColor: '#bbf7d0' },
  activoLabel: { fontSize: 11, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' },
  activoNombre: { fontSize: 16, fontWeight: '800', color: '#065f46' },
  activoDates: { fontSize: 12, color: '#4ade80', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1.5, borderColor: '#e2e8f0' },
  cardActivo: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  activoPill: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  activoPillText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },
  cardDates: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  cardAnio: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  tipoBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  tipoText: { fontSize: 12, fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btnActivar: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eef2ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  btnActivarText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  btnEditar: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  btnEditarText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  btnEliminar: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 6 },
  fab: { position: 'absolute', bottom: 90, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 12 },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  anioInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef2ff', borderRadius: 10, padding: 10, marginBottom: 16 },
  anioInfoText: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1.5, borderColor: '#e2e8f0', fontSize: 15, color: '#0f172a', marginBottom: 16 },
  pickerWrapper: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 },
  btnGuardar: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnGuardarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
