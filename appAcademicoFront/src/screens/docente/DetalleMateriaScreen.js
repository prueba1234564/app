import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getActividadesPorMateria, getEstudiantesPorMateria } from '../../services/docenteService';
import { remove as removeActividad } from '../../services/actividadService';

const CATEGORY = {
  parcial: { color: '#ef4444', bg: '#fef2f2' },
  tarea: { color: '#2563eb', bg: '#eff6ff' },
  proyecto: { color: '#16a34a', bg: '#f0fdf4' },
  evento: { color: '#f97316', bg: '#fff7ed' },
  comunicado: { color: '#64748b', bg: '#f1f5f9' },
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha de entrega';
  return new Date(value).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export default function DetalleMateriaScreen({ navigation, route }) {
  const materia = route.params?.materia;
  const [activeTab, setActiveTab] = useState('actividades');
  const [actividades, setActividades] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!materia?.id) return;
    try {
      setLoading(true);
      const [acts, ests] = await Promise.all([
        getActividadesPorMateria(materia.id),
        getEstudiantesPorMateria(materia.id),
      ]);
      setActividades(acts);
      setEstudiantes(ests);
    } finally {
      setLoading(false);
    }
  }, [materia?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const confirmDelete = (actividad) => {
    Alert.alert('Eliminar actividad', `¿Deseas eliminar "${actividad.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await removeActividad(actividad.id); loadData(); } },
    ]);
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#2E86AB" /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{materia?.nombre || 'Materia'}</Text>
          <Text style={styles.headerSubtitle}>Gestiona actividades y estudiantes</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, activeTab === 'actividades' && styles.tabActive]} onPress={() => setActiveTab('actividades')}>
          <Text style={[styles.tabText, activeTab === 'actividades' && styles.tabTextActive]}>Actividades</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'estudiantes' && styles.tabActive]} onPress={() => setActiveTab('estudiantes')}>
          <Text style={[styles.tabText, activeTab === 'estudiantes' && styles.tabTextActive]}>Estudiantes</Text>
        </Pressable>
      </View>

      {activeTab === 'actividades' ? (
        <FlatList
          data={actividades}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Empty text="No hay actividades creadas para esta materia." />}
          renderItem={({ item }) => <ActividadCard item={item} onEdit={() => navigation.navigate('ActividadForm', { materia, actividad: item })} onDelete={() => confirmDelete(item)} />}
        />
      ) : (
        <FlatList
          data={estudiantes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Empty text="No hay estudiantes inscritos" />}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentAvatar}><Text style={styles.studentInitial}>{item.nombre?.charAt(0).toUpperCase()}</Text></View>
              <View><Text style={styles.studentName}>{item.nombre}</Text><Text style={styles.studentEmail}>{item.email}</Text></View>
            </View>
          )}
        />
      )}

      {activeTab === 'actividades' && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('ActividadForm', { materia })}>
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function ActividadCard({ item, onEdit, onDelete }) {
  const style = CATEGORY[item.categoria] || CATEGORY.comunicado;
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.activityTitle}>{item.titulo}</Text>
          <View style={[styles.categoryPill, { backgroundColor: style.bg }]}>
            <Text style={[styles.categoryText, { color: style.color }]}>{item.categoria}</Text>
          </View>
        </View>
        {!!item.ruta_archivo && <Ionicons name="attach-outline" size={24} color="#64748b" />}
      </View>
      <Text style={styles.dateText}>{formatDate(item.fecha_entrega)}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.editBtn} onPress={onEdit}><Text style={styles.editText}>Editar</Text></Pressable>
        <Pressable style={styles.deleteBtn} onPress={onDelete}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
      </View>
    </View>
  );
}

function Empty({ text }) {
  return <View style={styles.empty}><Ionicons name="albums-outline" size={46} color="#cbd5e1" /><Text style={styles.emptyText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#232C57', padding: 22, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  headerTitle: { color: '#fff', fontSize: 23, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 5, fontWeight: '600' },
  tabs: { flexDirection: 'row', padding: 8, margin: 20, backgroundColor: '#e2e8f0', borderRadius: 18 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#64748b', fontWeight: '800' },
  tabTextActive: { color: '#232C57' },
  list: { paddingHorizontal: 20, paddingBottom: 110 },
  activityCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  activityTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityTitle: { fontSize: 17, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  categoryPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  categoryText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  dateText: { color: '#64748b', marginTop: 12, fontWeight: '600', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editBtn: { flex: 1, backgroundColor: '#eef2ff', borderRadius: 12, padding: 12, alignItems: 'center' },
  editText: { color: '#4f46e5', fontWeight: '800' },
  deleteBtn: { flex: 1, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, alignItems: 'center' },
  deleteText: { color: '#ef4444', fontWeight: '800' },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12 },
  studentAvatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  studentInitial: { color: '#2E86AB', fontWeight: '900', fontSize: 18 },
  studentName: { color: '#0f172a', fontWeight: '900', fontSize: 15 },
  studentEmail: { color: '#64748b', marginTop: 3 },
  empty: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 34 },
  emptyText: { marginTop: 12, color: '#64748b', fontWeight: '700', textAlign: 'center' },
  fab: { position: 'absolute', right: 24, bottom: 28, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2E86AB', alignItems: 'center', justifyContent: 'center', elevation: 7, shadowColor: '#2E86AB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
