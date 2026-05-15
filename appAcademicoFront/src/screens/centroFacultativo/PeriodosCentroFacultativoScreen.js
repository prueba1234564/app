import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { getAll, getActivo } from '../../services/periodoService';
import api from '../../api/axios';
import CentroFacultativoBottomNav from '../../components/CentroFacultativoBottomNav';

const PRIMARY = '#0369a1';

const TIPO_COLOR = {
  semestre:  { bg: '#8b5cf6', label: 'Semestre' },
  temporada: { bg: '#06b6d4', label: 'Temporada' },
};

const ESTADO_STYLE = {
  activa:     { color: '#10b981', bg: '#ecfdf5', label: 'Activa' },
  cancelada:  { color: '#ef4444', bg: '#fef2f2', label: 'Cancelada' },
  finalizada: { color: '#6366f1', bg: '#eef2ff', label: 'Finalizada' },
};

const formatFecha = (f) => {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PeriodosCentroFacultativoScreen({ navigation }) {
  const { usuario } = useAuth();
  const facultadId = usuario?.facultad_id || usuario?.carrera?.facultad?.id;

  const [periodos, setPeriodos] = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [ofertas, setOfertas] = useState({});
  const [loadingOfertas, setLoadingOfertas] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [todosRes, activoRes] = await Promise.all([getAll(), getActivo()]);
      setPeriodos(todosRes?.data ?? []);
      setPeriodoActivo(activoRes?.data ?? null);
    } catch (e) {
      console.error('Error cargando periodos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const togglePeriodo = async (periodoId) => {
    if (expandido === periodoId) {
      setExpandido(null);
      return;
    }
    setExpandido(periodoId);

    if (ofertas[periodoId]) return;

    try {
      setLoadingOfertas((prev) => ({ ...prev, [periodoId]: true }));
      const params = { periodo_id: periodoId };
      const res = await api.get('/materia-periodo', { params });
      const data = res.data?.data ?? [];
      const filtradas = Array.isArray(data)
        ? data.filter((o) => {
          const facultadOferta = o.materia?.carrera?.facultad?.id;
          return facultadId ? String(facultadOferta) === String(facultadId) : true;
        })
        : [];
      setOfertas((prev) => ({ ...prev, [periodoId]: filtradas }));
    } catch (e) {
      setOfertas((prev) => ({ ...prev, [periodoId]: [] }));
    } finally {
      setLoadingOfertas((prev) => ({ ...prev, [periodoId]: false }));
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <View style={s.circleOne} />
        <View style={s.circleTwo} />
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Centro Facultativo</Text>
            <Text style={s.title}>Periodos Académicos</Text>
            {(usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre) ? (
              <View style={s.badge}>
                <Ionicons name="business-outline" size={13} color="#dbeafe" />
                <Text style={s.badgeText}>{usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre}</Text>
              </View>
            ) : null}
          </View>
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>
        {periodoActivo && (
          <View style={s.activoChip}>
            <View style={s.activoDot} />
            <Text style={s.activoText}>Activo: {periodoActivo.nombre}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {periodos.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={52} color="#cbd5e1" />
              <Text style={s.emptyTitle}>Sin periodos</Text>
              <Text style={s.emptySub}>No hay periodos académicos registrados.</Text>
            </View>
          ) : (
            periodos.map((periodo) => {
              const isActivo = periodo.activo || periodoActivo?.id === periodo.id;
              const isExpanded = expandido === periodo.id;
              const tipo = TIPO_COLOR[periodo.tipo] ?? { bg: '#94a3b8', label: periodo.tipo };
              const ofertasList = ofertas[periodo.id] ?? [];
              const cargando = loadingOfertas[periodo.id];
              return (
                <View key={periodo.id} style={[s.card, isActivo && s.cardActivo]}>
                  <Pressable style={s.cardHeader} onPress={() => togglePeriodo(periodo.id)}>
                    <View style={[s.tipoBadge, { backgroundColor: tipo.bg }]}> 
                      <Text style={s.tipoText}>{tipo.label}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.periodoNombre, isActivo && { color: PRIMARY }]}>{periodo.nombre}</Text>
                      <Text style={s.periodoFechas}>{formatFecha(periodo.fecha_inicio)} — {formatFecha(periodo.fecha_fin)}</Text>
                    </View>
                    {isActivo && (
                      <View style={s.activoBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={s.activoBadgeText}>Activo</Text>
                      </View>
                    )}
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
                  </Pressable>
                  {isExpanded && (
                    <View style={s.ofertasWrap}>
                      <View style={s.ofertasDivider} />
                      {cargando ? (
                        <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 16 }} />
                      ) : ofertasList.length === 0 ? (
                        <View style={s.ofertasEmpty}>
                          <Ionicons name="book-outline" size={28} color="#cbd5e1" />
                          <Text style={s.ofertasEmptyText}>Sin materias en este periodo</Text>
                        </View>
                      ) : (
                        ofertasList.map((oferta) => {
                          const est = ESTADO_STYLE[oferta.estado] ?? ESTADO_STYLE.activa;
                          return (
                            <View key={oferta.id} style={s.ofertaRow}>
                              <View style={s.ofertaLeft}>
                                <Text style={s.ofertaMateria} numberOfLines={1}>
                                  {oferta.materia?.nombre ?? 'Materia'}{oferta.paralelo ? ` (${oferta.paralelo})` : ''}
                                </Text>
                                {oferta.docente?.nombre ? (
                                  <View style={s.ofertaDocRow}>
                                    <Ionicons name="person-outline" size={12} color="#94a3b8" />
                                    <Text style={s.ofertaDocente} numberOfLines={1}>{oferta.docente.nombre}</Text>
                                  </View>
                                ) : null}
                              </View>
                              <View style={[s.estadoBadge, { backgroundColor: est.bg }]}> 
                                <Text style={[s.estadoText, { color: est.color }]}>{est.label}</Text>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
      <CentroFacultativoBottomNav navigation={navigation} active="PeriodosFacultativo" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 20 },

  header: {
    backgroundColor: PRIMARY,
    padding: 24, paddingTop: 44,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 8,
  },
  circleOne: {
    position: 'absolute', width: 150, height: 150, borderRadius: 80,
    top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTwo: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    bottom: 10, left: 20, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, color: '#dbeafe', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginVertical: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#dbeafe', fontWeight: '700', fontSize: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  activoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, backgroundColor: '#eff6ff', padding: 10, borderRadius: 18,
  },
  activoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  activoText: { color: '#0f172a', fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  cardActivo: { borderWidth: 1.3, borderColor: '#bae6fd' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  tipoBadge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  tipoText: { fontSize: 11, fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' },
  periodoNombre: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  periodoFechas: { fontSize: 12, color: '#64748b', marginTop: 6 },
  activoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ecfdf5', borderRadius: 16 },
  activoBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  ofertasWrap: { padding: 18, borderTopWidth: 1, borderTopColor: '#eef2ff' },
  ofertasDivider: { height: 1, backgroundColor: '#eef2ff', marginBottom: 14 },
  ofertasEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  ofertasEmptyText: { color: '#64748b', fontSize: 13 },
  ofertaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 },
  ofertaLeft: { flex: 1 },
  ofertaMateria: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  ofertaDocRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ofertaDocente: { fontSize: 12, color: '#64748b' },
  estadoBadge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  estadoText: { fontSize: 12, fontWeight: '700' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
});
