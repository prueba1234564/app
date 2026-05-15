import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import CentroEstudiantesBottomNav from '../../components/CentroEstudiantesBottomNav';

const PRIMARY = '#0f172a';

const CATEGORY_STYLE = {
  parcial:    { color: '#ef4444', bg: '#fef2f2', icon: 'document-text-outline' },
  tarea:      { color: '#2563eb', bg: '#eff6ff', icon: 'pencil-outline' },
  proyecto:   { color: '#16a34a', bg: '#f0fdf4', icon: 'construct-outline' },
  evento:     { color: '#f97316', bg: '#fff7ed', icon: 'calendar-outline' },
  comunicado: { color: '#64748b', bg: '#f1f5f9', icon: 'megaphone-outline' },
};

const FILTERS = ['todas', 'parcial', 'tarea', 'proyecto', 'evento', 'comunicado'];

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ActividadesCentroScreen({ navigation }) {
  const { usuario } = useAuth();
  const carreraId = usuario?.carrera_id;

  const [actividades, setActividades] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtro,      setFiltro]      = useState('todas');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { rol_destino: 'estudiantes' };
      if (carreraId) params.carrera_id = carreraId;
      const res = await api.get('/actividades', { params });
      const data = res.data?.data ?? res.data ?? [];
      setActividades(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando actividades:', e);
    } finally {
      setLoading(false);
    }
  }, [carreraId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filtradas = useMemo(() => {
    const base = filtro === 'todas' ? actividades : actividades.filter((a) => a.categoria === filtro);
    return [...base].sort((a, b) => new Date(a.fecha_entrega || 0) - new Date(b.fecha_entrega || 0));
  }, [actividades, filtro]);

  const proximas = actividades.filter((a) => a.fecha_entrega && new Date(a.fecha_entrega) >= new Date()).length;

  const renderItem = ({ item }) => {
    const cs      = CATEGORY_STYLE[item.categoria] ?? CATEGORY_STYLE.comunicado;
    const fecha   = formatDate(item.fecha_entrega);
    const upcoming = item.fecha_entrega && new Date(item.fecha_entrega) >= new Date();

    return (
      <View style={[s.card, upcoming && s.cardUpcoming]}>
        <View style={s.cardTop}>
          <View style={[s.iconBox, { backgroundColor: cs.bg }]}>
            <Ionicons name={cs.icon} size={20} color={cs.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{item.titulo}</Text>
            <View style={s.metaRow}>
              <View style={[s.pill, { backgroundColor: cs.bg }]}>
                <Text style={[s.pillText, { color: cs.color }]}>{item.categoria}</Text>
              </View>
              {item.materia?.nombre ? (
                <Text style={s.materiaText} numberOfLines={1}>{item.materia.nombre}</Text>
              ) : null}
            </View>
          </View>
          {upcoming && (
            <View style={s.upcomingBadge}>
              <Ionicons name="time-outline" size={12} color="#0f766e" />
              <Text style={s.upcomingText}>Próxima</Text>
            </View>
          )}
        </View>

        {item.descripcion ? (
          <Text style={s.desc} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}

        <View style={s.cardFooter}>
          {fecha ? (
            <View style={s.fechaRow}>
              <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
              <Text style={s.fechaText}>{fecha}</Text>
            </View>
          ) : <View />}
          {item.creador?.nombre ? (
            <View style={s.creadorRow}>
              <Ionicons name="person-outline" size={13} color="#94a3b8" />
              <Text style={s.creadorText} numberOfLines={1}>{item.creador.nombre}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
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
            <Text style={s.title}>Actividades</Text>
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
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statChip}>
            <Text style={s.statNum}>{actividades.length}</Text>
            <Text style={s.statLbl}>Total</Text>
          </View>
          <View style={s.statChip}>
            <Text style={s.statNum}>{proximas}</Text>
            <Text style={s.statLbl}>Próximas</Text>
          </View>
        </View>
      </View>

      {/* ── Filtros ── */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item: f }) => (
          <Pressable
            style={[s.filterChip, filtro === f && s.filterChipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[s.filterText, filtro === f && s.filterTextActive]}>
              {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadData}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="albums-outline" size={52} color="#cbd5e1" />
              <Text style={s.emptyTitle}>Sin actividades</Text>
              <Text style={s.emptySub}>No hay actividades disponibles para tu carrera.</Text>
            </View>
          }
        />
      )}
      <CentroEstudiantesBottomNav navigation={navigation} active="ActividadesCentro" />
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLbl: { color: '#ddd6fe', fontSize: 12, fontWeight: '600' },

  // Filtros
  filterList:       { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: PRIMARY },
  filterText:       { color: '#64748b', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 100 },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardUpcoming: { borderWidth: 1.5, borderColor: '#ddd6fe' },
  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconBox:  { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 5 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  materiaText: { fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },
  upcomingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ecfdf5', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  upcomingText: { color: '#0f766e', fontWeight: '800', fontSize: 11 },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fechaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fechaText:   { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  creadorRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creadorText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub:   { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
});
