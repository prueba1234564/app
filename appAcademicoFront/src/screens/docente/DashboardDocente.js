import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { getActividadesPorMateria, getMisMaterias } from '../../services/docenteService';
import DocenteBottomNav from '../../components/DocenteBottomNav';

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export default function DashboardDocente({ navigation }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre || 'Docente';
  const [materias, setMaterias] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const misMaterias = await getMisMaterias();
      setMaterias(misMaterias);
      const listas = await Promise.all(misMaterias.map((materia) => getActividadesPorMateria(materia.id)));
      setActividades(listas.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const resumen = useMemo(() => ({
    materias: materias.length,
    actividades: actividades.length,
    estudiantes: materias.reduce((total, materia) => total + (materia.estudiantes_count || 0), 0),
  }), [materias, actividades]);

  const recientes = [...actividades]
    .sort((a, b) => new Date(b.created_at || b.fecha_entrega || 0) - new Date(a.created_at || a.fecha_entrega || 0))
    .slice(0, 3);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#2E86AB" /></View>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>Bienvenido de vuelta,</Text>
              <Text style={styles.name}>{nombre}</Text>
              <View style={styles.badge}>
                <Ionicons name="school" size={14} color="#c7d2fe" />
                <Text style={styles.badgeText}>Docente</Text>
              </View>
            </View>
            <Pressable style={styles.avatar} onPress={() => navigation.navigate('PerfilDocente')}>
              <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="book-outline" label="Materias" value={resumen.materias} color="#232C57" bg="#eff6ff" />
          <StatCard icon="calendar-outline" label="Actividades" value={resumen.actividades} color="#8A220B" bg="#fff7ed" />
          <StatCard icon="people-outline" label="Estudiantes" value={resumen.estudiantes} color="#0f766e" bg="#ecfdf5" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividades Recientes</Text>
          <Pressable onPress={() => navigation.navigate('MateriasDocente')}><Text style={styles.link}>Ver materias</Text></Pressable>
        </View>
        {recientes.length ? recientes.map((actividad) => (
          <View key={actividad.id} style={styles.activityCard}>
            <View style={styles.activityIcon}><Ionicons name="sparkles-outline" size={20} color="#2E86AB" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{actividad.titulo}</Text>
              <Text style={styles.activityMeta}>{actividad.categoria} · {formatDate(actividad.fecha_entrega)}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.empty}><Text style={styles.emptyText}>Aún no tienes actividades recientes.</Text></View>
        )}
        <View style={{ height: 96 }} />
      </ScrollView>
      <DocenteBottomNav navigation={navigation} active="DashboardDocente" />
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={22} color={color} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statAccent, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 110 },
  header: { backgroundColor: '#232C57', borderRadius: 24, padding: 24, paddingTop: 44, marginBottom: 24, overflow: 'hidden', shadowColor: '#232C57', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 },
  circleOne: { position: 'absolute', width: 150, height: 150, borderRadius: 80, top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.06)' },
  circleTwo: { position: 'absolute', width: 90, height: 90, borderRadius: 45, bottom: 10, left: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { flex: 1 },
  greeting: { fontSize: 14, color: '#c7d2fe', fontWeight: '500' },
  name: { fontSize: 25, fontWeight: '800', color: '#fff', marginVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20 },
  badgeText: { color: '#e0e7ff', fontWeight: '700', fontSize: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#8A220B', marginBottom: 14 },
  link: { color: '#2E86AB', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  statIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  statLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  statAccent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  activityIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  activityMeta: { marginTop: 3, color: '#64748b', fontSize: 12, textTransform: 'capitalize' },
  empty: { backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center' },
  emptyText: { color: '#64748b', fontWeight: '600' },
});
