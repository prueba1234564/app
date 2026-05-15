import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { getAll } from '../../services/usuarioService';
import CentroFacultativoBottomNav from '../../components/CentroFacultativoBottomNav';

const PRIMARY = '#0369a1';

export default function DocentesCentroFacultativoScreen({ navigation }) {
  const { usuario } = useAuth();
  const facultadId = usuario?.facultad_id || usuario?.carrera?.facultad?.id;

  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const todos = await getAll();
      const lista = (Array.isArray(todos) ? todos : todos?.data ?? []).filter((u) => {
        const roles = u.roles_usuario ?? u.rolesUsuario ?? u.roles ?? [];
        const esDocente = roles.some((r) => {
          const n = typeof r === 'string' ? r : (r?.rol ?? r?.name ?? '');
          return n === 'docente';
        });
        const mismaFacultad = facultadId
          ? String(u.facultad_id) === String(facultadId) || String(u.carrera?.facultad?.id) === String(facultadId)
          : true;
        return esDocente && mismaFacultad;
      });
      setDocentes(lista);
    } catch (e) {
      console.error('Error cargando docentes de facultad:', e);
    } finally {
      setLoading(false);
    }
  }, [facultadId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const filtrados = docentes.filter((d) =>
    d.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{item.nombre?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.nombre}>{item.nombre}</Text>
        <View style={s.metaRow}>
          <Ionicons name="mail-outline" size={13} color="#94a3b8" />
          <Text style={s.meta} numberOfLines={1}>{item.email}</Text>
        </View>
        {item.carrera?.nombre ? (
          <View style={s.metaRow}>
            <Ionicons name="library-outline" size={13} color="#94a3b8" />
            <Text style={s.meta} numberOfLines={1}>{item.carrera.nombre}</Text>
          </View>
        ) : null}
      </View>
      <View style={s.activoBadge}>
        <View style={s.activoDot} />
        <Text style={s.activoText}>Activo</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.header}>
        <View style={s.circleOne} />
        <View style={s.circleTwo} />
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Centro Facultativo</Text>
            <Text style={s.title}>Docentes</Text>
            {usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre ? (
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
        <View style={s.statRow}>
          <View style={s.statChip}>
            <Text style={s.statNum}>{docentes.length}</Text>
            <Text style={s.statLbl}>Docentes activos</Text>
          </View>
        </View>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListEmptyComponent={(
            <View style={s.empty}>
              <Ionicons name="person-outline" size={52} color="#cbd5e1" />
              <Text style={s.emptyTitle}>Sin docentes</Text>
              <Text style={s.emptySub}>
                {busqueda ? 'No hay resultados para tu búsqueda.' : 'No hay docentes registrados en esta facultad.'}
              </Text>
            </View>
          )}
        />
      )}
      <CentroFacultativoBottomNav navigation={navigation} active="DocentesFacultativo" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  statRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLbl: { color: '#dbeafe', fontSize: 12, fontWeight: '600' },

  searchWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },

  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: '#dbeafe',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: PRIMARY },
  nombre:  { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  meta:    { fontSize: 12, color: '#64748b', fontWeight: '500', flex: 1 },
  activoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#eff6ff', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  activoDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0ea5e9' },
  activoText: { fontSize: 11, fontWeight: '700', color: '#0ea5e9' },
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub:   { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },
});
