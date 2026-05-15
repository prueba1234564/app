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

import { getMisMaterias } from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY = '#1e3a5f';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
};

// Agrupa materias por periodo
function agruparPorPeriodo(materias) {
  const grupos = {};
  materias.forEach((m) => {
    const key = m.periodo?.id ?? 'sin-periodo';
    if (!grupos[key]) {
      grupos[key] = {
        periodo: m.periodo ?? { nombre: 'Sin periodo', activo: false },
        materias: [],
      };
    }
    grupos[key].materias.push(m);
  });
  // Ordenar: activo primero, luego por nombre
  return Object.values(grupos).sort((a, b) => {
    if (a.periodo.activo && !b.periodo.activo) return -1;
    if (!a.periodo.activo && b.periodo.activo) return 1;
    return (b.periodo.nombre || '').localeCompare(a.periodo.nombre || '');
  });
}

// Tabla semanal de horarios
function HorarioSemanal({ horarios }) {
  if (!horarios || horarios.length === 0) {
    return (
      <View style={styles.sinHorario}>
        <Ionicons name="time-outline" size={14} color="#94a3b8" />
        <Text style={styles.sinHorarioText}>Sin horario asignado</Text>
      </View>
    );
  }

  // Agrupar por día
  const porDia = {};
  horarios.forEach((h) => {
    if (!porDia[h.dia]) porDia[h.dia] = [];
    porDia[h.dia].push(h);
  });

  const diasConHorario = DIAS.filter((d) => porDia[d]);

  return (
    <View style={styles.horarioTabla}>
      <View style={styles.horarioTablaHeader}>
        <Ionicons name="time-outline" size={14} color={PRIMARY} />
        <Text style={styles.horarioTablaTitle}>Horario semanal</Text>
      </View>
      {diasConHorario.map((dia) => (
        <View key={dia} style={styles.horarioDiaRow}>
          <View style={styles.horarioDiaBadge}>
            <Text style={styles.horarioDiaText}>{DIAS_LABEL[dia]}</Text>
          </View>
          <View style={styles.horarioSlots}>
            {porDia[dia].map((h, idx) => (
              <View key={idx} style={styles.horarioSlot}>
                <Text style={styles.horarioSlotTime}>
                  {h.hora_inicio?.slice(0, 5)} – {h.hora_fin?.slice(0, 5)}
                </Text>
                {h.aula ? (
                  <Text style={styles.horarioSlotAula}>Aula {h.aula}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function MateriaCard({ item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      {/* Header de la tarjeta */}
      <Pressable style={styles.cardTop} onPress={() => setExpanded(!expanded)}>
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={22} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.carrera?.nombre || 'Sin carrera'}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {item.paralelo ? (
            <View style={styles.paraleloBadge}>
              <Text style={styles.paraleloText}>Par. {item.paralelo}</Text>
            </View>
          ) : null}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#94a3b8"
          />
        </View>
      </Pressable>

      {/* Docente siempre visible */}
      {item.docente?.nombre ? (
        <View style={styles.docenteRow}>
          <View style={styles.docenteAvatar}>
            <Text style={styles.docenteAvatarText}>
              {item.docente.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.docenteLabel}>Docente</Text>
            <Text style={styles.docenteNombre}>{item.docente.nombre}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.docenteRow}>
          <View style={[styles.docenteAvatar, { backgroundColor: '#f1f5f9' }]}>
            <Ionicons name="person-outline" size={16} color="#94a3b8" />
          </View>
          <Text style={styles.sinDocente}>Sin docente asignado</Text>
        </View>
      )}

      {/* Horarios expandibles */}
      {expanded && (
        <View style={styles.expandedSection}>
          <HorarioSemanal horarios={item.horarios} />
        </View>
      )}

      {/* Footer con estado */}
      <View style={styles.cardFooter}>
        <View style={[styles.estadoBadge, { backgroundColor: item.estado === 'activa' ? '#ecfdf5' : '#f1f5f9' }]}>
          <View style={[styles.estadoDot, { backgroundColor: item.estado === 'activa' ? '#10b981' : '#94a3b8' }]} />
          <Text style={[styles.estadoText, { color: item.estado === 'activa' ? '#059669' : '#64748b' }]}>
            {item.estado === 'activa' ? 'Activa' : item.estado === 'finalizada' ? 'Finalizada' : item.estado ?? 'Activa'}
          </Text>
        </View>
        <Pressable
          style={styles.horarioBtn}
          onPress={() => setExpanded(!expanded)}
        >
          <Ionicons name="time-outline" size={14} color={PRIMARY} />
          <Text style={styles.horarioBtnText}>
            {item.horarios?.length > 0
              ? `${item.horarios.length} horario${item.horarios.length > 1 ? 's' : ''}`
              : 'Ver horario'}
          </Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={PRIMARY} />
        </Pressable>
      </View>
    </View>
  );
}

export default function MateriasEstudianteScreen({ navigation }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gestionAbierta, setGestionAbierta] = useState({});

  const loadMaterias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMisMaterias();
      const agrupadas = agruparPorPeriodo(data);
      setGrupos(agrupadas);
      // Abrir la gestión activa por defecto
      const inicial = {};
      agrupadas.forEach((g, idx) => {
        inicial[idx] = g.periodo.activo || idx === 0;
      });
      setGestionAbierta(inicial);
    } catch (e) {
      console.error('Error cargando materias:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMaterias(); }, [loadMaterias]));

  const toggleGestion = (idx) => {
    setGestionAbierta((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mis Materias</Text>
          <Text style={styles.headerSubtitle}>
            {grupos.reduce((acc, g) => acc + g.materias.length, 0)} materias inscritas
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="book" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {grupos.length === 0 ? (
        <View style={styles.emptyFull}>
          <Ionicons name="book-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Sin materias inscritas</Text>
          <Text style={styles.emptySub}>
            Contacta a tu director de carrera para inscribirte en materias.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {grupos.map((grupo, idx) => (
            <View key={idx} style={styles.gestionSection}>
              {/* Header de gestión */}
              <Pressable
                style={[
                  styles.gestionHeader,
                  grupo.periodo.activo && styles.gestionHeaderActiva,
                ]}
                onPress={() => toggleGestion(idx)}
              >
                <View style={styles.gestionHeaderLeft}>
                  <Ionicons
                    name={grupo.periodo.activo ? 'checkmark-circle' : 'time-outline'}
                    size={20}
                    color={grupo.periodo.activo ? '#10b981' : '#94a3b8'}
                  />
                  <View>
                    <Text style={[
                      styles.gestionNombre,
                      grupo.periodo.activo && styles.gestionNombreActiva,
                    ]}>
                      {grupo.periodo.nombre || 'Sin periodo'}
                    </Text>
                    <Text style={styles.gestionMeta}>
                      {grupo.materias.length} materia{grupo.materias.length !== 1 ? 's' : ''}
                      {grupo.periodo.fecha_inicio
                        ? ` · ${grupo.periodo.fecha_inicio} – ${grupo.periodo.fecha_fin}`
                        : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.gestionHeaderRight}>
                  {grupo.periodo.activo && (
                    <View style={styles.activoPill}>
                      <Text style={styles.activoPillText}>Activo</Text>
                    </View>
                  )}
                  <Ionicons
                    name={gestionAbierta[idx] ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748b"
                  />
                </View>
              </Pressable>

              {/* Materias de esta gestión */}
              {gestionAbierta[idx] && (
                <View style={styles.materiasContainer}>
                  {grupo.materias.map((materia, mIdx) => (
                    <MateriaCard key={`${materia.id}-${mIdx}`} item={materia} />
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <EstudianteBottomNav navigation={navigation} active="MateriasEstudiante" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row', alignItems: 'center',
    padding: 24, paddingTop: 28, paddingBottom: 30,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 4, fontWeight: '600' },
  headerIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: 16 },

  // Gestión section
  gestionSection: { marginBottom: 16 },
  gestionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  gestionHeaderActiva: {
    borderWidth: 1.5, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4',
  },
  gestionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  gestionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gestionNombre: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  gestionNombreActiva: { color: '#065f46' },
  gestionMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  activoPill: {
    backgroundColor: '#dcfce7', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  activoPillText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },

  materiasContainer: { marginTop: 8, gap: 10 },

  // Materia card
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  cardSubtitle: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paraleloBadge: {
    backgroundColor: '#e8f0fe', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  paraleloText: { color: PRIMARY, fontWeight: '800', fontSize: 11 },

  // Docente
  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  docenteAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
  },
  docenteAvatarText: { color: PRIMARY, fontWeight: '900', fontSize: 14 },
  docenteLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  docenteNombre: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  sinDocente: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  // Horario tabla
  expandedSection: {
    marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12,
  },
  horarioTabla: { gap: 8 },
  horarioTablaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  horarioTablaTitle: { fontSize: 12, fontWeight: '800', color: PRIMARY, textTransform: 'uppercase' },
  horarioDiaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  horarioDiaBadge: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
  },
  horarioDiaText: { fontSize: 11, fontWeight: '900', color: PRIMARY },
  horarioSlots: { flex: 1, gap: 4 },
  horarioSlot: {
    backgroundColor: '#f8fafc', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  horarioSlotTime: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  horarioSlotAula: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sinHorario: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc', borderRadius: 10, padding: 10,
  },
  sinHorarioText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  // Footer card
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  estadoDot: { width: 7, height: 7, borderRadius: 4 },
  estadoText: { fontSize: 12, fontWeight: '700' },
  horarioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#e8f0fe', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  horarioBtnText: { fontSize: 12, fontWeight: '700', color: PRIMARY },

  // Empty
  emptyFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
