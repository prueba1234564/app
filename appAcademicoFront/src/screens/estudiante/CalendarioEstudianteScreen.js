import React, { useCallback, useMemo, useState } from 'react';
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
import { getMisActividades } from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY = '#1e3a5f';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const CATEGORY_COLOR = {
  parcial:    '#ef4444',
  tarea:      '#2563eb',
  proyecto:   '#16a34a',
  evento:     '#f97316',
  comunicado: '#64748b',
};

const CATEGORY_ICON = {
  parcial:    'document-text-outline',
  tarea:      'pencil-outline',
  proyecto:   'construct-outline',
  evento:     'calendar-outline',
  comunicado: 'megaphone-outline',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Dom
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CalendarioEstudianteScreen({ navigation }) {
  const { usuario } = useAuth();
  const today = new Date();

  const [year,       setYear]       = useState(today.getFullYear());
  const [month,      setMonth]      = useState(today.getMonth());
  const [selected,   setSelected]   = useState(toDateKey(today));
  const [actividades, setActividades] = useState([]);
  const [loading,    setLoading]    = useState(true);

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

  // Mapa fecha → actividades
  const actividadesPorDia = useMemo(() => {
    const map = {};
    actividades.forEach((act) => {
      if (!act.fecha_entrega) return;
      const key = toDateKey(new Date(act.fecha_entrega));
      if (!map[key]) map[key] = [];
      map[key].push(act);
    });
    return map;
  }, [actividades]);

  // Actividades del día seleccionado
  const actividadesDelDia = actividadesPorDia[selected] ?? [];

  // Navegación de mes
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Construir grilla del mes
  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDayOfMonth(year, month);
  const todayKey     = toDateKey(today);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatSelectedDate = () => {
    if (!selected) return '';
    const [y, m, d] = selected.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Calendario</Text>
        <Text style={s.headerSub}>Actividades y fechas importantes</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Calendario ── */}
        <View style={s.calCard}>
          {/* Navegación de mes */}
          <View style={s.navRow}>
            <Pressable style={s.navBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={PRIMARY} />
            </Pressable>
            <Text style={s.navTitle}>{MESES[month]} {year}</Text>
            <Pressable style={s.navBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color={PRIMARY} />
            </Pressable>
          </View>

          {/* Días de la semana */}
          <View style={s.weekRow}>
            {DIAS_SEMANA.map((d) => (
              <Text key={d} style={s.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Grilla de días */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.cell} />;

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday    = dateKey === todayKey;
              const isSelected = dateKey === selected;
              const dots       = actividadesPorDia[dateKey] ?? [];
              const hasDots    = dots.length > 0;

              return (
                <Pressable
                  key={dateKey}
                  style={[
                    s.cell,
                    isSelected && s.cellSelected,
                    isToday && !isSelected && s.cellToday,
                  ]}
                  onPress={() => setSelected(dateKey)}
                >
                  <Text style={[
                    s.cellText,
                    isSelected && s.cellTextSelected,
                    isToday && !isSelected && s.cellTextToday,
                  ]}>
                    {day}
                  </Text>
                  {/* Puntos de actividades */}
                  {hasDots && (
                    <View style={s.dotsRow}>
                      {dots.slice(0, 3).map((act, i) => (
                        <View
                          key={i}
                          style={[s.dot, { backgroundColor: CATEGORY_COLOR[act.categoria] ?? '#64748b' }]}
                        />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Actividades del día seleccionado ── */}
        <View style={s.daySection}>
          <Text style={s.dayTitle} numberOfLines={1}>{formatSelectedDate()}</Text>

          {loading ? (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginTop: 16 }} />
          ) : actividadesDelDia.length === 0 ? (
            <View style={s.emptyDay}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#cbd5e1" />
              <Text style={s.emptyDayText}>Sin actividades este día</Text>
            </View>
          ) : (
            actividadesDelDia.map((act) => {
              const color = CATEGORY_COLOR[act.categoria] ?? '#64748b';
              const icon  = CATEGORY_ICON[act.categoria]  ?? 'calendar-outline';
              return (
                <View key={act.id} style={[s.actCard, { borderLeftColor: color }]}>
                  <View style={[s.actIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.actTitle}>{act.titulo}</Text>
                    <View style={s.actMeta}>
                      <View style={[s.actPill, { backgroundColor: color + '18' }]}>
                        <Text style={[s.actPillText, { color }]}>{act.categoria}</Text>
                      </View>
                      {act.materia?.nombre ? (
                        <Text style={s.actMateria} numberOfLines={1}>{act.materia.nombre}</Text>
                      ) : null}
                    </View>
                    {act.descripcion ? (
                      <Text style={s.actDesc} numberOfLines={2}>{act.descripcion}</Text>
                    ) : null}
                  </View>
                  {act.completada && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ── Próximas actividades ── */}
        {(() => {
          const proximas = actividades
            .filter((a) => a.fecha_entrega && new Date(a.fecha_entrega) >= today && !a.completada)
            .sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
            .slice(0, 5);

          if (proximas.length === 0) return null;

          return (
            <View style={s.proximasSection}>
              <Text style={s.proximasTitle}>Próximas actividades</Text>
              {proximas.map((act) => {
                const color = CATEGORY_COLOR[act.categoria] ?? '#64748b';
                const fecha = new Date(act.fecha_entrega).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short',
                });
                return (
                  <Pressable
                    key={act.id}
                    style={s.proximaRow}
                    onPress={() => setSelected(toDateKey(new Date(act.fecha_entrega)))}
                  >
                    <View style={[s.proximaDot, { backgroundColor: color }]} />
                    <Text style={s.proximaNombre} numberOfLines={1}>{act.titulo}</Text>
                    <Text style={[s.proximaFecha, { color }]}>{fecha}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })()}

        <View style={{ height: 110 }} />
      </ScrollView>

      <EstudianteBottomNav navigation={navigation} active="CalendarioEstudiante" />
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: PRIMARY,
    padding: 22, paddingTop: 28, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub:   { color: '#c7d2fe', marginTop: 4, fontWeight: '600' },

  scroll: { padding: 16 },

  // ── Calendario ──
  calCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },

  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  cellSelected: {
    backgroundColor: PRIMARY, borderRadius: 12,
  },
  cellToday: {
    backgroundColor: '#e8f0fe', borderRadius: 12,
  },
  cellText:         { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  cellTextSelected: { color: '#fff', fontWeight: '900' },
  cellTextToday:    { color: PRIMARY, fontWeight: '900' },

  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot:     { width: 5, height: 5, borderRadius: 3 },

  // ── Día seleccionado ──
  daySection: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  dayTitle: {
    fontSize: 14, fontWeight: '800', color: '#0f172a',
    textTransform: 'capitalize', marginBottom: 12,
  },
  emptyDay: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyDayText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },

  actCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 10,
    marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  actIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  actTitle:  { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  actMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  actPill:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  actPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  actMateria:  { fontSize: 11, color: '#64748b', fontWeight: '600', flex: 1 },
  actDesc:     { fontSize: 12, color: '#94a3b8', lineHeight: 16 },

  // ── Próximas ──
  proximasSection: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  proximasTitle: {
    fontSize: 13, fontWeight: '800', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  proximaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  proximaDot:    { width: 10, height: 10, borderRadius: 5 },
  proximaNombre: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  proximaFecha:  { fontSize: 12, fontWeight: '800' },
});
