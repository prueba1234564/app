import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { remove } from '../../services/actividadService';
import { getMisMaterias, getMisActividades } from '../../services/docenteService';
import DocenteBottomNav from '../../components/DocenteBottomNav';

const CATEGORY_STYLE = {
  parcial:    { color: '#ef4444', bg: '#fef2f2', icon: 'document-text' },
  tarea:      { color: '#2563eb', bg: '#eff6ff', icon: 'pencil' },
  proyecto:   { color: '#16a34a', bg: '#f0fdf4', icon: 'construct' },
  evento:     { color: '#f97316', bg: '#fff7ed', icon: 'calendar' },
  comunicado: { color: '#64748b', bg: '#f1f5f9', icon: 'megaphone' },
};

const formatDate = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ActividadesDocenteScreen({ navigation }) {
  const [actividades, setActividades] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMateriaPicker, setShowMateriaPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [acts, mats] = await Promise.all([
        getMisActividades(),
        getMisMaterias(),
      ]);
      setActividades(acts);
      setMaterias(mats);
    } catch (e) {
      console.error('Error cargando actividades:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = (actividad) => {
    Alert.alert('Eliminar actividad', `¿Deseas eliminar "${actividad.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await remove(actividad.id);
            loadData();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  const getMateriaDeActividad = (actividad) =>
    materias.find((m) => m.id === actividad.materia_id) || null;

  const renderItem = ({ item }) => {
    const cs = CATEGORY_STYLE[item.categoria] || CATEGORY_STYLE.comunicado;
    const materia = getMateriaDeActividad(item);
    const fecha = formatDate(item.fecha_entrega);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: cs.bg }]}>
            <Ionicons name={cs.icon} size={20} color={cs.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.pill, { backgroundColor: cs.bg }]}>
                <Text style={[styles.pillText, { color: cs.color }]}>{item.categoria}</Text>
              </View>
              {materia && (
                <Text style={styles.materiaText} numberOfLines={1}>{materia.nombre}</Text>
              )}
            </View>
          </View>
        </View>

        {item.descripcion ? (
          <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}

        {fecha && (
          <View style={styles.fechaRow}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.fechaText}>{fecha}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={styles.editBtn}
            onPress={() => navigation.navigate('ActividadForm', { materia, actividad: item })}
          >
            <Ionicons name="pencil-outline" size={15} color="#4f46e5" />
            <Text style={styles.editText}>Editar</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
            <Text style={styles.deleteText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mis Actividades</Text>
          <Text style={styles.headerSub}>Tareas, parciales y eventos</Text>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => navigation.navigate('NotificacionForm', { fromActividades: true })}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={actividades}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin actividades</Text>
              <Text style={styles.emptySub}>
                Presiona + para crear tu primera actividad
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}

      <DocenteBottomNav navigation={navigation} active="ActividadesDocente" />

      {/* FAB crear actividad */}
      <Pressable style={styles.fab} onPress={() => {
        if (materias.length === 0) {
          Alert.alert('Sin materias', 'No tienes materias asignadas en el periodo activo.');
          return;
        }
        if (materias.length === 1) {
          navigation.navigate('ActividadForm', { materia: materias[0] });
        } else {
          setShowMateriaPicker(true);
        }
      }}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Modal selector de materia */}
      <Modal visible={showMateriaPicker} transparent animationType="slide" onRequestClose={() => setShowMateriaPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMateriaPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>¿Para qué materia?</Text>
            <ScrollView>
              {materias.map((m) => (
                <Pressable
                  key={m.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setShowMateriaPicker(false);
                    navigation.navigate('ActividadForm', { materia: m });
                  }}
                >
                  <View style={styles.pickerItemIcon}>
                    <Ionicons name="book-outline" size={20} color="#2E86AB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerItemText}>{m.nombre}</Text>
                    {m.carrera?.nombre && (
                      <Text style={styles.pickerItemSub}>{m.carrera.nombre}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#232C57', padding: 22, paddingTop: 28, paddingBottom: 28,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#c7d2fe', marginTop: 4, fontWeight: '600' },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 20, paddingBottom: 110 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  materiaText: { fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  fechaText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#eef2ff', borderRadius: 12, paddingVertical: 10 },
  editText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 10 },
  deleteText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
  fab: {
    position: 'absolute', right: 24, bottom: 90,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#2E86AB', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E86AB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 7,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 30, maxHeight: '60%',
  },
  pickerHandle: { width: 44, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', paddingHorizontal: 24, marginBottom: 12 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  pickerItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
