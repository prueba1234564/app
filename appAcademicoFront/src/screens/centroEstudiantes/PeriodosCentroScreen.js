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
import CentroEstudiantesBottomNav from '../../components/CentroEstudiantesBottomNav';

const PRIMARY = '#0f172a';

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

export default function PeriodosCentroScreen({ navigation }) {
  const { usuario } = useAuth();
  const carreraId = usuario?.carrera_id;

  const [periodos,      setPeriodos]      = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState(null);
  const [expandido,     setExpandido]     = useState(null); // id del periodo expandido
  const [ofertas,       setOfertas]       = useState({});   // { periodoId: [...] }
  const [loadingOfertas, setLoadingOfertas] = useState({});
  const [loading,       setLoading]       = useState(true);

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

    if (ofertas[periodoId]) return; // ya cargado

    try {
      setLoadingOfertas((prev) => ({ ...prev, [periodoId]: true }));
      const params = { periodo_id: periodoId };
      if (carreraId) params.carrera_id = carreraId;
      const res = await api.get('/materia-periodo', { params });
      const data = res.data?.data ?? [];
      // Filtrar por carrera si aplica
      const filtradas = carreraId
        ? data.filter((o) => String(o.materia?.carrera_id) === String(carreraId))
        : data;
      setOfertas((prev) => ({ ...prev, [periodoId]: filtradas }));
    } catch (e) {
      setOfertas((prev) => ({ ...prev, [periodoId]: [] }));
    } finally {
      setLoadingOfertas((prev) => ({ ...prev, [periodoId]: false }));
    }
  };

  return (
    <SafeAreaView style={s.screen}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.circleOne} />
        <View style={s.circleTwo} />
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Centro de Estudiantes</Text>
            <Text style={s.title}>Periodos Académicos</Text>
            {usuario?.carrera?.nombre ? (
              <View style={s.badge}>
                <Ionicons name="library-outline" size={13} color="#ddd6fe" />
                <Text style={s.badgeText}>{usuario.carrera.nombre}</Text>
              </View>
            ) : null}
          </View>
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        </View>
        {/* Periodo activo en el header */}
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
              const isActivo   = periodo.activo || periodoActivo?.id === periodo.id;
              const isExpanded = expandido === periodo.id;
              const tipo       = TIPO_COLOR[periodo.tipo] ?? { bg: '#94a3b8', label: periodo.tipo };
              const ofertasList = ofertas[periodo.id] ?? [];
              const cargando   = loadingOfertas[periodo.id];

              return (
                <View key={periodo.id} style={[s.card, isActivo && s.cardActivo]}>
                  {/* Cabecera del periodo */}
                  <Pressable style={s.cardHeader} onPress={() => togglePeriodo(periodo.id)}>
                    <View style={[s.tipoBadge, { backgroundColor: tipo.bg }]}>
                      <Text style={s.tipoText}>{tipo.label}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.periodoNombre, isActivo && { color: PRIMARY }]}>
                        {periodo.nombre}
                      </Text>
                      <Text style={s.periodoFechas}>
                        {formatFecha(periodo.fecha_inicio)} — {formatFecha(periodo.fecha_fin)}
                      </Text>
                    </View>
                    {isActivo && (
                      <View style={s.activoBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={s.activoBadgeText}>Activo</Text>
                      </View>
                    )}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#94a3b8"
                      style={{ marginLeft: 8 }}
                    />
                  </Pressable>

                  {/* Materias del periodo (expandible) */}
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
                                  {oferta.materia?.nombre ?? 'Materia'}
                                  {oferta.paralelo ? ` (${oferta.paralelo})` : ''}
                                </Text>
                                {oferta.docente?.nombre ? (
                                  <View style={s.ofertaDocRow}>
                                    <Ionicons name="person-outline" size={12} color="#94a3b8" />
                                    <Text style={s.ofertaDocente} numberOfLines={1}>
                                      {oferta.docente.nombre}
                                    </Text>
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

      <CentroEstudiantesBottomNav navigation={navigation} active="PeriodosCentro" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#f8fafc' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting:  { fontSize: 13, color: '#ddd6fe', fontWeight: '500' },
  title:     { fontSize: 24, fontWeight: '900', color: '#fff', marginVertical: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#ede9fe', fontWeight: '700', fontSize: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  activoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
  },
  activoDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  activoText: { color: '#d1fae5', fontSize: 12, fontWeight: '700' },

  scroll: { padding: 16 },

  // Cards de periodo
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardActivo: { borderWidth: 1.5, borderColor: '#ddd6fe' },

  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
  },
  tipoBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  tipoText:     { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  periodoNombre:{ flex: 1, fontSize: 15, fontWeight: '800', color: '#0f172a' },
  periodoFechas:{ fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  activoBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activoBadgeText: { fontSize: 11, fontWeight: '700', color: '#10b981' },

  // Ofertas expandidas
  ofertasWrap:    { paddingHorizontal: 16, paddingBottom: 12 },
  ofertasDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  ofertasEmpty:   { alignItems: 'center', paddingVertical: 16, gap: 6 },
  ofertasEmptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  ofertaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  ofertaLeft:    { flex: 1 },
  ofertaMateria: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  ofertaDocRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ofertaDocente: { fontSize: 12, color: '#64748b', fontWeight: '500', flex: 1 },
  estadoBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  estadoText:    { fontSize: 11, fontWeight: '700' },

  // Empty
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub:   { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
});
