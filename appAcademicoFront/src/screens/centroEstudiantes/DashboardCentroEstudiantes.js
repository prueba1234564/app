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
import api from '../../api/axios';
import CentroEstudiantesBottomNav from '../../components/CentroEstudiantesBottomNav';

const PRIMARY = '#0f172a';

const QUICK_MODULES = [
  { label: 'Docentes',    icon: 'person-outline',         route: 'DocentesCentro',    color: '#0f766e', bg: '#ecfdf5' },
  { label: 'Actividades', icon: 'checkmark-done-outline', route: 'ActividadesCentro', color: '#2563eb', bg: '#eff6ff' },
  { label: 'Periodos',    icon: 'calendar-outline',       route: 'PeriodosCentro',    color: '#0f172a', bg: '#f5f3ff' },
  { label: 'Notificar',   icon: 'notifications-outline',  route: 'NotificacionCentro',color: '#f97316', bg: '#fff7ed' },
  { label: 'Mi Perfil',   icon: 'person-circle-outline',  route: 'PerfilCentro',      color: '#64748b', bg: '#f1f5f9' },
];

export default function DashboardCentroEstudiantes({ navigation }) {
  const { usuario } = useAuth();
  const nombre  = usuario?.nombre || 'Usuario';
  const carrera = usuario?.carrera?.nombre || '';

  const [stats,   setStats]   = useState({ docentes: 0, actividades: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const carreraId = usuario?.carrera_id;

      const [usuariosRes, actividadesRes] = await Promise.all([
        api.get('/usuarios', { params: carreraId ? { carrera_id: carreraId } : {} }),
        api.get('/actividades', {
          params: { rol_destino: 'estudiantes', ...(carreraId ? { carrera_id: carreraId } : {}) },
        }),
      ]);

      const todos = usuariosRes.data?.data ?? usuariosRes.data ?? [];
      const todosArr = Array.isArray(todos) ? todos : [];

      // El backend devuelve "roles_usuario" (snake_case)
      const docentes = todosArr.filter((u) => {
        const roles = u.roles_usuario ?? u.rolesUsuario ?? u.roles ?? [];
        return roles.some((r) => {
          const n = typeof r === 'string' ? r : (r?.rol ?? r?.name ?? '');
          return n === 'docente';
        });
      });

      const actividades = actividadesRes.data?.data ?? actividadesRes.data ?? [];

      setStats({
        docentes:    docentes.length,
        actividades: Array.isArray(actividades) ? actividades.length : 0,
      });
    } catch (e) {
      console.error('Error cargando stats:', e);
    } finally {
      setLoading(false);
    }
  }, [usuario?.carrera_id]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.circleOne} />
          <View style={s.circleTwo} />
          <View style={s.headerRow}>
            <View style={s.headerCopy}>
              <Text style={s.greeting}>Panel de</Text>
              <Text style={s.name}>Centro de Estudiantes</Text>
              {carrera ? (
                <View style={s.badge}>
                  <Ionicons name="library-outline" size={13} color="#ddd6fe" />
                  <Text style={s.badgeText}>{carrera}</Text>
                </View>
              ) : null}
            </View>
            <Pressable style={s.avatar} onPress={() => navigation.navigate('PerfilCentro')}>
              <Text style={s.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={s.userRow}>
            <Ionicons name="person-circle-outline" size={16} color="#ddd6fe" />
            <Text style={s.userText}>{nombre}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        {loading ? (
          <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 16 }} />
        ) : (
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="person-outline" size={22} color="#0f766e" />
              <Text style={[s.statNum, { color: '#0f766e' }]}>{stats.docentes}</Text>
              <Text style={[s.statLbl, { color: '#0f766e' }]}>Docentes</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="checkmark-done-outline" size={22} color="#2563eb" />
              <Text style={[s.statNum, { color: '#2563eb' }]}>{stats.actividades}</Text>
              <Text style={[s.statLbl, { color: '#2563eb' }]}>Actividades</Text>
            </View>
          </View>
        )}

        {/* ── Módulos rápidos ── */}
        <Text style={s.sectionTitle}>Acceso Rápido</Text>
        <View style={s.modulesGrid}>
          {QUICK_MODULES.map((mod) => (
            <Pressable
              key={mod.route}
              style={({ pressed }) => [s.moduleCard, pressed && s.moduleCardPressed]}
              onPress={() => navigation.navigate(mod.route)}
            >
              <View style={[s.moduleIcon, { backgroundColor: mod.bg }]}>
                <Ionicons name={mod.icon} size={26} color={mod.color} />
              </View>
              <Text style={[s.moduleLabel, { color: mod.color }]}>{mod.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
      <CentroEstudiantesBottomNav navigation={navigation} active="DashboardCentro" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    backgroundColor: PRIMARY,
    borderRadius: 24, padding: 24, paddingTop: 44,
    marginBottom: 20, overflow: 'hidden',
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  greeting: { fontSize: 13, color: '#ddd6fe', fontWeight: '500' },
  name:     { fontSize: 22, fontWeight: '800', color: '#fff', marginVertical: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#ede9fe', fontWeight: '700', fontSize: 12 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  userRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  userText:   { color: '#ddd6fe', fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  // Módulos
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  modulesGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  moduleCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 18,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  moduleCardPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  moduleIcon:  { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleLabel: { fontWeight: '800', fontSize: 13, textAlign: 'center' },
});
