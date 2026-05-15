import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnios, createAnio, activarAnio, remove } from '../../services/periodoService';
import BottomNav from '../../components/BottomNav';

const PRIMARY = '#1A1A4E';

export default function PeriodosScreen({ navigation }) {
  const [anios, setAnios]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre]     = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving]     = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getAnios();
      setAnios(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los años académicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const anioActivo = anios.find((a) => a.activo);

  const abrirCrear = () => {
    setNombre('');
    setFechaInicio('');
    setFechaFin('');
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !fechaInicio || !fechaFin) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }
    try {
      setSaving(true);
      await createAnio({ nombre: nombre.trim(), fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      setShowModal(false);
      cargar();
    } catch {
      Alert.alert('Error', 'No se pudo crear el año académico.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivar = async (id) => {
    try {
      await activarAnio(id);
      cargar();
    } catch {
      Alert.alert('Error', 'No se pudo activar.');
    }
  };

  const handleEliminar = (anio) => {
    Alert.alert(
      'Eliminar año académico',
      `¿Eliminar "${anio.nombre}"? Se eliminarán también sus períodos asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(anio.id);
              cargar();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  const formatFecha = (f) => {
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Años Académicos</Text>
          <Text style={styles.headerSub}>
            {anioActivo ? `Activo: ${anioActivo.nombre}` : 'Ninguno activo'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
        <Text style={styles.infoText}>
          El año académico activo es el marco general. Los directores crean los períodos
          (semestres, anuales) dentro del año activo para sus carreras.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {anios.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin años académicos</Text>
              <Text style={styles.emptySub}>Crea el primer año académico</Text>
            </View>
          ) : (
            anios.map((anio) => (
              <View key={anio.id} style={[styles.card, anio.activo && styles.cardActivo]}>
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, anio.activo && styles.cardIconActivo]}>
                    <Ionicons
                      name={anio.activo ? 'checkmark-circle' : 'calendar-outline'}
                      size={24}
                      color={anio.activo ? '#10b981' : '#94a3b8'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{anio.nombre}</Text>
                      {anio.activo && (
                        <View style={styles.activoPill}>
                          <Text style={styles.activoPillText}>Activo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDates}>
                      {formatFecha(anio.fecha_inicio)} — {formatFecha(anio.fecha_fin)}
                    </Text>
                    <Text style={styles.cardPeriodos}>
                      {anio.periodos_hijos_count ?? 0} período{(anio.periodos_hijos_count ?? 0) !== 1 ? 's' : ''} de carrera
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  {!anio.activo && (
                    <Pressable style={styles.btnActivar} onPress={() => handleActivar(anio.id)}>
                      <Ionicons name="play-circle-outline" size={16} color="#4f46e5" />
                      <Text style={styles.btnActivarText}>Activar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.btnVer}
                    onPress={() => navigation.navigate('ResumenPeriodo', { periodo: anio })}
                  >
                    <Ionicons name="eye-outline" size={16} color="#0f766e" />
                    <Text style={styles.btnVerText}>Ver</Text>
                  </Pressable>
                  <Pressable style={styles.btnEliminar} onPress={() => handleEliminar(anio)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={abrirCrear}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <BottomNav navigation={navigation} activeScreen="Periodos" />

      {/* Modal crear año */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nuevo Año Académico</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2026"
              placeholderTextColor="#94a3b8"
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Fecha inicio</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={fechaInicio}
              onChangeText={setFechaInicio}
            />

            <Text style={styles.label}>Fecha fin</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={fechaFin}
              onChangeText={setFechaFin}
            />

            <Pressable
              style={[styles.btnGuardar, saving && { opacity: 0.6 }]}
              onPress={handleGuardar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnGuardarText}>Crear año académico</Text>
              )}
            </Pressable>
            <View style={{ height: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row', alignItems: 'center',
    padding: 24, paddingTop: 28, paddingBottom: 30,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub: { color: '#a5b4fc', marginTop: 4, fontWeight: '600' },
  headerIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eef2ff', borderRadius: 16,
    margin: 16, padding: 14,
    borderWidth: 1, borderColor: '#c7d2fe',
  },
  infoText: { flex: 1, fontSize: 13, color: '#3730a3', lineHeight: 18, fontWeight: '500' },

  list: { paddingHorizontal: 16, paddingTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  cardActivo: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  cardIconActivo: { backgroundColor: '#dcfce7' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  activoPill: {
    backgroundColor: '#dcfce7', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  activoPillText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },
  cardDates: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
  cardPeriodos: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btnActivar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#eef2ff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  btnActivarText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  btnVer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  btnVerText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  btnEliminar: {
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 8,
  },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 6 },

  fab: {
    position: 'absolute', bottom: 90, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: 12,
  },
  sheetHandle: {
    width: 48, height: 5, backgroundColor: '#cbd5e1',
    borderRadius: 3, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, height: 52,
    borderWidth: 1.5, borderColor: '#e2e8f0',
    fontSize: 15, color: '#0f172a', marginBottom: 16,
  },
  btnGuardar: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnGuardarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
