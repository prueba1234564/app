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
import CentroFacultativoBottomNav from '../../components/CentroFacultativoBottomNav';

const PRIMARY = '#0369a1';

const QUICK_MODULES = [
  { label: 'Docentes',    icon: 'person-outline',         route: 'DocentesFacultativo',    color: '#0369a1', bg: '#eff6ff' },
  { label: 'Actividades', icon: 'checkmark-done-outline', route: 'ActividadesFacultativo', color: '#2563eb', bg: '#eff6ff' },
  { label: 'Periodos',    icon: 'calendar-outline',       route: 'PeriodosFacultativo',    color: '#0f172a', bg: '#f5f3ff' },
  { label: 'Notificar',   icon: 'notifications-outline',  route: 'NotificacionFacultativo',color: '#f97316', bg: '#fff7ed' },
  { label: 'Mi Perfil',   icon: 'person-circle-outline',  route: 'PerfilFacultativo',      color: '#64748b', bg: '#f1f5f9' },
];

export default function DashboardCentroFacultativo({ navigation }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre || 'Usuario';
  const facultad = usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre || '';

  const [stats, setStats] = useState({ docentes: 0, actividades: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const facultadId = usuario?.facultad_id || usuario?.carrera?.facultad?.id;
      const [usuariosRes, actividadesRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/actividades'),
      ]);

      const usuarios = usuariosRes.data?.data ?? usuariosRes.data ?? [];
      const actividades = actividadesRes.data?.data ?? actividadesRes.data ?? [];

      const docentes = (Array.isArray(usuarios) ? usuarios : []).filter((u) => {
        const roles = u.roles_usuario ?? u.rolesUsuario ?? u.roles ?? [];
        const esDocente = roles.some((r) => {
          const n = typeof r === 'string' ? r : (r?.rol ?? r?.name ?? '');
          return n === 'docente';
        });
        const mismaFacultad = facultadId
          ? String(u.facultad_id || u.carrera?.facultad?.id) === String(facultadId)
          : true;
        return esDocente && mismaFacultad;
      });

      const actividadesFacultad = (Array.isArray(actividades) ? actividades : []).filter((item) => {
        const facultadActividad = item?.materia?.carrera?.facultad?.id;
        return facultadId ? String(facultadActividad) === String(facultadId) : true;
      });

      setStats({ docentes: docentes.length, actividades: actividadesFacultad.length });
    } catch (e) {
      console.error('Error cargando stats:', e);
      setStats({ docentes: 0, actividades: 0 });
    } finally {
      setLoading(false);
    }
  }, [usuario?.facultad_id, usuario?.carrera?.facultad?.id]);

  useFocusEffect(useCallback(() => {
    loadStats();
  }, [loadStats]));

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>Panel de</Text>
              <Text style={styles.name}>Centro Facultativo</Text>
              {facultad ? (
                <View style={styles.badge}>
                  <Ionicons name="business-outline" size={13} color="#bae6fd" />
                  <Text style={styles.badgeText}>{facultad}</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              style={styles.avatar}
              onPress={() => navigation.navigate('PerfilFacultativo')}
            >
              <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
          <View style={styles.userRow}>
            <Ionicons name="person-circle-outline" size={16} color="#bae6fd" />
            <Text style={styles.userText}>{nombre}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}> 
            <Ionicons name="person-outline" size={22} color="#0369a1" />
            <Text style={[styles.statNum, { color: '#0369a1' }]}>{stats.docentes}</Text>
            <Text style={[styles.statLbl, { color: '#0369a1' }]}>Docentes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fff7ed' }]}> 
            <Ionicons name="checkmark-done-outline" size={22} color="#f97316" />
            <Text style={[styles.statNum, { color: '#f97316' }]}>{stats.actividades}</Text>
            <Text style={[styles.statLbl, { color: '#f97316' }]}>Actividades</Text>
          </View>
        </View>

        {/* ── Acceso rápido ── */}
        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        <View style={styles.modulesGrid}>
          {QUICK_MODULES.map((mod) => (
            <Pressable
              key={mod.route}
              style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
              onPress={() => navigation.navigate(mod.route)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.bg }]}> 
                <Ionicons name={mod.icon} size={26} color={mod.color} />
              </View>
              <Text style={[styles.moduleLabel, { color: mod.color }]}>{mod.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="school-outline" size={28} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoCardTitle}>Centro Facultativo</Text>
            <Text style={styles.infoCardBody}>
              Desde aquí puedes gestionar las actividades y comunicaciones del centro facultativo de tu facultad.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <CentroFacultativoBottomNav navigation={navigation} active="DashboardFacultativo" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: PRIMARY,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  circleOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 80,
    top: -40,
    right: -30,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    bottom: 10,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: '#bae6fd',
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
  },
  badgeText: {
    color: '#e0f2fe',
    fontWeight: '700',
    fontSize: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  userText: {
    color: '#bae6fd',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 14,
    marginBottom: 20,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  moduleCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  moduleIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduleLabel: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  statNum: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  statLbl: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  infoCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoCardBody: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
  },
});