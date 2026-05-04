
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import BottomNav from '../../components/BottomNav';

const ESTADO_COLORS = {
  activa: { color: '#10b981', bg: '#ecfdf5' },
  cancelada: { color: '#ef4444', bg: '#fef2f2' },
  finalizada: { color: '#6366f1', bg: '#eef2ff' },
};

export default function ResumenPeriodoScreen({ navigation, route }) {
  const { periodo } = route.params;
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/materia-periodo?periodo_id=${periodo.id}`);
      setOfertas(res.data?.data ?? []);
    } catch (e) {
      console.error('Error cargando resumen:', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalActivas = ofertas.filter((o) => o.estado === 'activa').length;
  const totalCanceladas = ofertas.filter((o) => o.estado === 'cancelada').length;
  const totalFinalizadas = ofertas.filter((o) => o.estado === 'finalizada').length;
  const conDocente = ofertas.filter((o) => o.docente_id).length;

  // Agrupar por carrera
  const porCarrera = ofertas.reduce((acc, o) => {
    const nombre = o.materia?.carrera?.nombre ?? 'Sin carrera';
    if (!acc[nombre]) acc[nombre] = [];
    acc[nombre].push(o);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{periodo.nombre}</Text>
            <Text style={styles.headerSub}>
              {periodo.tipo === 'semestre' ? 'Semestre' : 'Temporada'} •{' '}
              {periodo.fecha_inicio} — {periodo.fecha_fin}
            </Text>
          </View>
          {periodo.activo && (
            <View style={styles.activoBadge}>
              <Text style={styles.activoBadgeText}>Activo</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
            <Text style={[styles.statNum, { color: '#10b981' }]}>{totalActivas}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#6366f1' }]}>
            <Text style={[styles.statNum, { color: '#6366f1' }]}>{totalFinalizadas}</Text>
            <Text style={styles.statLabel}>Finalizadas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#ef4444' }]}>
            <Text style={[styles.statNum, { color: '#ef4444' }]}>{totalCanceladas}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>{conDocente}</Text>
            <Text style={styles.statLabel}>Con docente</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1A1A4E" style={{ marginTop: 40 }} />
        ) : ofertas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="library-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Sin materias en este periodo</Text>
          </View>
        ) : (
          Object.entries(porCarrera).map(([carrera, items]) => (
            <View key={carrera} style={styles.carreraSection}>
              <View style={styles.carreraHeader}>
                <Ionicons name="school-outline" size={16} color="#4f46e5" />
                <Text style={styles.carreraNombre}>{carrera}</Text>
                <View style={styles.carreraBadge}>
                  <Text style={styles.carreraBadgeText}>{items.length}</Text>
                </View>
              </View>

              {items.map((oferta) => {
                const est = ESTADO_COLORS[oferta.estado] ?? { color: '#94a3b8', bg: '#f1f5f9' };
                const isOpen = expandida === oferta.id;
                return (
                  <Pressable
                    key={oferta.id}
                    style={styles.ofertaCard}
                    onPress={() => setExpandida(isOpen ? null : oferta.id)}
                  >
                    <View style={styles.ofertaTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.ofertaNombre}>{oferta.materia?.nombre}</Text>
                          {!!oferta.paralelo && (
                            <View style={styles.paraleloBadge}>
                              <Text style={styles.paraleloText}>Par. {oferta.paralelo}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.ofertaDocente}>
                          {oferta.docente ? oferta.docente.nombre : 'Sin docente'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[styles.estadoBadge, { backgroundColor: est.bg }]}>
                          <Text style={[styles.estadoText, { color: est.color }]}>{oferta.estado}</Text>
                        </View>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                      </View>
                    </View>

                    {isOpen && (
                      <View style={styles.ofertaDetalle}>
                        {/* Horarios */}
                        {oferta.horarios && oferta.horarios.length > 0 ? (
                          <>
                            <Text style={styles.detalleLabel}>Horarios</Text>
                            {oferta.horarios.map((h) => (
                              <View key={h.id} style={styles.horarioRow}>
                                <View style={styles.horarioDiaBadge}>
                                  <Text style={styles.horarioDiaText}>{h.dia.slice(0, 3).toUpperCase()}</Text>
                                </View>
                                <Text style={styles.horarioHora}>
                                  {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                                  {h.aula ? `  ·  ${h.aula}` : ''}
                                </Text>
                              </View>
                            ))}
                          </>
                        ) : (
                          <Text style={styles.sinDatos}>Sin horarios registrados</Text>
                        )}

                        {/* Observaciones */}
                        {!!oferta.observaciones && (
                          <>
                            <Text style={[styles.detalleLabel, { marginTop: 10 }]}>Observaciones</Text>
                            <Text style={styles.observacionesText}>{oferta.observaciones}</Text>
                          </>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav navigation={navigation} activeScreen="Periodos" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 100 },

  header: {
    backgroundColor: '#1A1A4E', padding: 24, paddingTop: 20, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#1A1A4E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: '#c7d2fe', fontWeight: '500' },
  activoBadge: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  activoBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 0 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748b', marginTop: 12 },

  carreraSection: { marginHorizontal: 20, marginTop: 20 },
  carreraHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  carreraNombre: { flex: 1, fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  carreraBadge: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  carreraBadgeText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },

  ofertaCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  ofertaTop: { flexDirection: 'row', alignItems: 'flex-start' },
  ofertaNombre: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  ofertaDocente: { fontSize: 12, color: '#64748b' },
  paraleloBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  paraleloText: { fontSize: 10, fontWeight: '700', color: '#d97706' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  estadoText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  ofertaDetalle: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detalleLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  horarioDiaBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  horarioDiaText: { fontSize: 10, fontWeight: '800', color: '#4f46e5' },
  horarioHora: { fontSize: 13, color: '#334155', fontWeight: '600' },
  sinDatos: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  observacionesText: { fontSize: 13, color: '#475569', lineHeight: 18 },
});
