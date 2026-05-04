import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getMisMaterias } from '../../services/docenteService';
import DocenteBottomNav from '../../components/DocenteBottomNav';

export default function MateriasDocenteScreen({ navigation }) {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMaterias = useCallback(async () => {
    try {
      setLoading(true);
      setMaterias(await getMisMaterias());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMaterias(); }, [loadMaterias]));

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}><Ionicons name="book-outline" size={24} color="#2E86AB" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSubtitle}>{item.carrera?.nombre || 'Carrera no asignada'}</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <Metric icon="people-outline" label="Estudiantes" value={item.estudiantes_count || 0} />
        <Metric icon="calendar-outline" label="Actividades" value={item.actividades_count || 0} />
      </View>
      <Pressable style={styles.detailButton} onPress={() => navigation.navigate('DetalleMateria', { materia: item })}>
        <Text style={styles.detailText}>Ver detalle</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </Pressable>
    </View>
  );

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#2E86AB" /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Materias</Text>
        <Text style={styles.headerSubtitle}>Materias asignadas a tu carga docente</Text>
      </View>
      <FlatList
        data={materias}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No tienes materias asignadas.</Text></View>}
      />
      <DocenteBottomNav navigation={navigation} active="MateriasDocente" />
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color="#2E86AB" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#232C57', padding: 24, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 6, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#64748b', marginTop: 3, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metric: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center' },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#232C57', marginTop: 4 },
  metricLabel: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  detailButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2E86AB', borderRadius: 14, paddingVertical: 13 },
  detailText: { color: '#fff', fontWeight: '800' },
  empty: { backgroundColor: '#fff', borderRadius: 18, padding: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontWeight: '700' },
});
