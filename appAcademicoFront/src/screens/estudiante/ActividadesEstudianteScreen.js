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
import {
  completarActividad,
  descompletarActividad,
  getMisActividades,
} from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY = '#1e3a5f';

const CATEGORY_STYLE = {
  parcial:    { color: '#ef4444', bg: '#fef2f2', icon: 'document-text-outline' },
  tarea:      { color: '#2563eb', bg: '#eff6ff', icon: 'pencil-outline' },
  proyecto:   { color: '#16a34a', bg: '#f0fdf4', icon: 'construct-outline' },
  evento:     { color: '#f97316', bg: '#fff7ed', icon: 'calendar-outline' },
  comunicado: { color: '#64748b', bg: '#f1f5f9', icon: 'megaphone-outline' },
};

const FILTERS = ['todos', 'pendientes', 'completadas', 'parcial', 'tarea', 'proyecto', 'evento'];

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const isUpcoming = (fecha) => {
  if (!fecha) return false;
  return new Date(fecha) >= new Date();
};

export default function ActividadesEstudianteScreen({ navigation }) {
  const { usuario } = useAuth();
  const [actividades,  setActividades]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtro,       setFiltro]       = useState('todos');
  const [procesando,   setProcesando]   = useState(null); // id en proceso

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const carreraId = usuario?.carrera_id;
      setActividades(await getMisActividades(carreraId));
    } catch (e) {
      console.error('Error cargando actividades:', e);
    } finally {
      setLoading(false);
    }
  }, [usuario?.carrera_id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleToggleCompletar = async (item) => {
    try {
      setProcesando(item.id);
      if (item.completada) {
        await descompletarActividad(item.id);
      } else {
        await completarActividad(item.id);
      }
      // Actualizar estado local sin recargar todo
      setActividades((prev) =>
        prev.map((a) => a.id === item.id ? { ...a, completada: !a.completada } : a)
      );
    } catch (e) {
      console.error('Error al cambiar estado:', e);
    } finally {
      setProcesando(null);
    }
  };

  const filtered = useMemo(() => {
    let base = actividades;
    if (filtro === 'pendientes')  base = actividades.filter((a) => !a.completada);
    else if (filtro === 'completadas') base = actividades.filter((a) => a.completada);
    else if (filtro !== 'todos')  base = actividades.filter((a) => a.categoria === filtro);

    return [...base].sort((a, b) => {
      if (a.completada && !b.completada) return 1;
      if (!a.completada && b.completada) return -1;
      const aUp = isUpcoming(a.fecha_entrega);
      const bUp = isUpcoming(b.fecha_entrega);
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      return new Date(a.fecha_entrega || 0) - new Date(b.fecha_entrega || 0);
    });
  }, [actividades, filtro]);

  // Contadores para el header
  const totalPendientes  = actividades.filter((a) => !a.completada).length;
  const totalCompletadas = actividades.filter((a) => a.completada).length;

  const renderItem = ({ item }) => {
    const cs      = CATEGORY_STYLE[item.categoria] || CATEGORY_STYLE.comunicado;
    const fecha   = formatDate(item.fecha_entrega);
    const upcoming = isUpcoming(item.fecha_entrega) && !item.completada;
    const busy    = procesando === item.id;

    return (
      <View style={[
        styles.card,
        item.completada && styles.cardCompletada,
        upcoming && !item.completada && styles.cardUpcoming,
      ]}>
        <View style={styles.cardTop}>
          {/* Ícono categoría */}
          <View style={[styles.iconBox, { backgroundColor: item.completada ? '#f0fdf4' : cs.bg }]}>
            <Ionicons
              name={item.completada ? 'checkmark-circle' : cs.icon}
              size={20}
              color={item.completada ? '#16a34a' : cs.color}
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, item.completada && styles.cardTitleCompletada]}>
              {item.titulo}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.pill, { backgroundColor: item.completada ? '#f0fdf4' : cs.bg }]}>
                <Text style={[styles.pillText, { color: item.completada ? '#16a34a' : cs.color }]}>
                  {item.completada ? '✓ Completada' : item.categoria}
                </Text>
              </View>
              {item.materia?.nombre ? (
                <Text style={styles.materiaText} numberOfLines={1}>{item.materia.nombre}</Text>
              ) : null}
            </View>
          </View>

          {/* Badge próxima */}
          {upcoming && (
            <View style={styles.upcomingBadge}>
              <Ionicons name="time-outline" size={12} color="#0f766e" />
              <Text style={styles.upcomingText}>Próxima</Text>
            </View>
          )}
        </View>

        {item.descripcion ? (
          <Text style={[styles.desc, item.completada && { color: '#94a3b8' }]} numberOfLines={2}>
            {item.descripcion}
          </Text>
        ) : null}

        {/* Footer: fecha + botón completar */}
        <View style={styles.cardFooter}>
          {fecha ? (
            <View style={styles.fechaRow}>
              <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
              <Text style={styles.fechaText}>{fecha}</Text>
            </View>
          ) : <View />}

          {/* Botón completar/descompletar */}
          <Pressable
            style={({ pressed }) => [
              styles.completarBtn,
              item.completada ? styles.completarBtnDone : styles.completarBtnPending,
              pressed && { opacity: 0.8 },
              busy && { opacity: 0.6 },
            ]}
            onPress={() => handleToggleCompletar(item)}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator size="small" color={item.completada ? '#16a34a' : '#fff'} />
            ) : (
              <>
                <Ionicons
                  name={item.completada ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={15}
                  color={item.completada ? '#16a34a' : '#fff'}
                />
                <Text style={[
                  styles.completarBtnText,
                  item.completada && styles.completarBtnTextDone,
                ]}>
                  {item.completada ? 'Desmarcar' : 'Completar'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Actividades</Text>
          <Text style={styles.headerSub}>Parciales, tareas y eventos</Text>
        </View>
        {/* Mini stats */}
        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{totalPendientes}</Text>
            <Text style={styles.statLbl}>Pendientes</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: 'rgba(22,163,74,0.18)' }]}>
            <Text style={[styles.statNum, { color: '#bbf7d0' }]}>{totalCompletadas}</Text>
            <Text style={[styles.statLbl, { color: '#bbf7d0' }]}>Hechas</Text>
          </View>
        </View>
      </View>

      {/* Filtros */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: f }) => (
          <Pressable
            style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>
              {f === 'todos'       ? 'Todos'
               : f === 'pendientes'  ? '⏳ Pendientes'
               : f === 'completadas' ? '✓ Completadas'
               : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadData}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin actividades</Text>
              <Text style={styles.emptySub}>
                {filtro === 'completadas'
                  ? 'Aún no has completado ninguna actividad.'
                  : filtro === 'pendientes'
                  ? '¡No tienes actividades pendientes!'
                  : 'No hay actividades disponibles.'}
              </Text>
            </View>
          }
        />
      )}

      <EstudianteBottomNav navigation={navigation} active="ActividadesEstudiante" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PRIMARY, padding: 22, paddingTop: 28, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub:   { color: '#c7d2fe', marginTop: 4, fontWeight: '600' },
  headerStats: { flexDirection: 'row', gap: 8 },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLbl: { color: '#c7d2fe', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  filterList:       { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: PRIMARY },
  filterText:       { color: '#64748b', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingBottom: 110 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardCompletada: { backgroundColor: '#f8fffe', borderWidth: 1, borderColor: '#bbf7d0' },
  cardUpcoming:   { borderWidth: 1.5, borderColor: '#bfdbfe' },

  cardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  iconBox:  { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 5 },
  cardTitleCompletada: { color: '#94a3b8', textDecorationLine: 'line-through' },

  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText:   { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  materiaText:{ fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },

  upcomingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ecfdf5', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  upcomingText: { color: '#0f766e', fontWeight: '800', fontSize: 11 },

  desc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 10 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fechaText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  completarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
  },
  completarBtnPending: { backgroundColor: PRIMARY },
  completarBtnDone:    { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  completarBtnText:     { color: '#fff', fontWeight: '800', fontSize: 12 },
  completarBtnTextDone: { color: '#16a34a' },

  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub:   { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
});
