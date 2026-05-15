
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DocenteBottomNav from '../../components/DocenteBottomNav';

const ESTADO_COLORS = {
  activa:     { color: '#10b981', bg: '#ecfdf5' },
  cancelada:  { color: '#ef4444', bg: '#fef2f2' },
  finalizada: { color: '#6366f1', bg: '#eef2ff' },
};

export default function HistorialScreen({ navigation }) {
  const { rol } = useAuth();
  const esEstudiante = rol === 'estudiante';

  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const url = esEstudiante ? '/estudiante/historial' : '/docente/historial';
      const res = await api.get(url);
      setHistorial(res.data?.data ?? []);
    } catch (e) {
      console.error('Error historial:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, [esEstudiante]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const togglePeriodo = (id) => setExpandido((prev) => (prev === id ? null : id));

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="time" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Mi Historial</Text>
          <Text style={styles.headerSub}>
            {esEstudiante ? 'Materias cursadas por periodo' : 'Materias dictadas por periodo'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#232C57" style={{ marginTop: 40 }} />
      ) : historial.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={52} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Sin historial</Text>
          <Text style={styles.emptySub}>
            {esEstudiante
              ? 'Aún no tienes materias cursadas en periodos anteriores'
              : 'Aún no tienes materias dictadas en periodos anteriores'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {historial.map((item) => {
            const p = item.periodo;
            const isOpen = expandido === p?.id;
            const totalMaterias = item.materias?.length ?? 0;

            return (
              <View key={p?.id} style={styles.periodoBlock}>
                {/* Cabecera del periodo */}
                <Pressable style={[styles.periodoHeader, isOpen && styles.periodoHeaderOpen]} onPress={() => togglePeriodo(p?.id)}>
                  <View style={[styles.periodoIconBg, { backgroundColor: p?.activo ? '#dcfce7' : '#eef2ff' }]}>
                    <Ionicons name="calendar" size={18} color={p?.activo ? '#16a34a' : '#4f46e5'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.periodoNombre}>{p?.nombre ?? 'Periodo'}</Text>
                      {p?.activo && (
                        <View style={styles.activoPill}>
                          <Text style={styles.activoPillText}>Activo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.periodoFechas}>
                      {p?.fecha_inicio} — {p?.fecha_fin}
                    </Text>
                  </View>
                  <View style={styles.materiasCount}>
                    <Text style={styles.materiasCountNum}>{totalMaterias}</Text>
                    <Text style={styles.materiasCountLabel}>materias</Text>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
                </Pressable>

                {/* Materias del periodo */}
                {isOpen && (
                  <View style={styles.materiasContainer}>
                    {item.materias.map((m) => {
                      const est = ESTADO_COLORS[m.estado] ?? { color: '#94a3b8', bg: '#f1f5f9' };
                      return (
                        <View key={m.id} style={styles.materiaCard}>
                          <View style={styles.materiaTop}>
                            <View style={styles.materiaIconBg}>
                              <Ionicons name="library-outline" size={18} color="#4f46e5" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.materiaNombre}>{m.materia?.nombre}</Text>
                                {!!m.paralelo && (
                                  <View style={styles.paraleloBadge}>
                                    <Text style={styles.paraleloText}>Par. {m.paralelo}</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.materiaCarrera}>{m.materia?.carrera?.nombre}</Text>
                              {/* Docente (solo para estudiante) */}
                              {esEstudiante && m.docente && (
                                <Text style={styles.materiaDocente}>
                                  <Ionicons name="person-outline" size={12} color="#64748b" /> {m.docente.nombre}
                                </Text>
                              )}
                            </View>
                            <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                              <Text style={[styles.estadoText, { color: est.color }]}>{m.estado}</Text>
                            </View>
                          </View>

                          {/* Horarios */}
                          {m.horarios && m.horarios.length > 0 && (
                            <View style={styles.horariosRow}>
                              {m.horarios.map((h) => (
                                <View key={h.id} style={styles.horarioChip}>
                                  <Text style={styles.horarioChipText}>
                                    {h.dia.slice(0, 3).toUpperCase()} {h.hora_inicio?.slice(0, 5)}-{h.hora_fin?.slice(0, 5)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <DocenteBottomNav navigation={navigation} active="HistorialDocente" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#232C57', padding: 24, paddingTop: 20, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#232C57', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub: { fontSize: 13, color: '#c7d2fe', fontWeight: '500' },

  content: { padding: 20 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 6, textAlign: 'center', lineHeight: 20 },

  periodoBlock: { marginBottom: 12 },
  periodoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  periodoHeaderOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  periodoIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  periodoNombre: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  periodoFechas: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  activoPill: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activoPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  materiasCount: { alignItems: 'center' },
  materiasCountNum: { fontSize: 20, fontWeight: '800', color: '#232C57' },
  materiasCountLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  materiasContainer: {
    backgroundColor: '#fff', borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    paddingHorizontal: 16, paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  materiaCard: {
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  materiaTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  materiaIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  materiaNombre: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  materiaCarrera: { fontSize: 12, color: '#64748b', marginTop: 2 },
  materiaDocente: { fontSize: 12, color: '#64748b', marginTop: 2 },
  paraleloBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  paraleloText: { fontSize: 10, fontWeight: '700', color: '#d97706' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  estadoText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  horariosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 46 },
  horarioChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  horarioChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
});
