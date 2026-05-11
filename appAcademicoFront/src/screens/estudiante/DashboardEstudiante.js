import React, { useCallback, useMemo, useState } from 'react';
import {
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
import {
  getMisActividades,
  getMisMaterias,
  getMisNotificaciones,
} from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';
import { SkeletonList, SkeletonStatCard } from '../../components/SkeletonLoader';
import { useOfflineCache } from '../../hooks/useOfflineCache';

const PRIMARY = '#1e3a5f';

const ROL_LABELS = {
  estudiante: 'Estudiante',
  centro_estudiantes: 'Centro de Estudiantes',
  centro_facultativo: 'Centro Facultativo',
  docente: 'Docente',
  director: 'Director',
  decano: 'Decano',
};

const ROL_ICONS = {
  estudiante: 'school',
  centro_estudiantes: 'people',
  centro_facultativo: 'school',
  docente: 'person',
  director: 'briefcase',
  decano: 'ribbon',
};

function getRolName(r) {
  return typeof r === 'string' ? r : (r?.rol ?? r?.name ?? r?.nombre ?? '');
}

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const QUICK_MODULES = [
  { label: 'Mis Materias',    icon: 'book-outline',          route: 'MateriasEstudiante',        color: '#1e3a5f', bg: '#e8f0fe' },
  { label: 'Actividades',     icon: 'checkmark-done-outline',route: 'ActividadesEstudiante',     color: '#0f766e', bg: '#ecfdf5' },
  { label: 'Inscripciones',   icon: 'add-circle-outline',    route: 'InscripcionesEstudiante',   color: '#0369a1', bg: '#e0f2fe' },
  { label: 'Calendario',      icon: 'calendar-number-outline',route: 'CalendarioEstudiante',     color: '#0f172a', bg: '#f5f3ff' },
  { label: 'Notificaciones',  icon: 'notifications-outline', route: 'NotificacionesEstudiante',  color: '#f97316', bg: '#fff7ed' },
  { label: 'Mi Perfil',       icon: 'person-outline',        route: 'PerfilEstudiante',          color: '#b45309', bg: '#fffbeb' },
];

export default function DashboardEstudiante({ navigation }) {
  const { usuario } = useAuth();
  const nombre = usuario?.nombre || 'Estudiante';

  // Todos los roles del usuario para mostrar en el header
  const allRoles = (() => {
    const roles = (usuario?.rolesUsuario || usuario?.roles || []).map(getRolName).filter(Boolean);
    return roles.length > 0 ? roles : ['estudiante'];
  })();

  const [materias, setMaterias] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setIsOffline(false);
      const carreraId = usuario?.carrera_id;
      const [mats, acts, notifs] = await Promise.all([
        getMisMaterias(),
        getMisActividades(carreraId),
        getMisNotificaciones(),
      ]);
      setMaterias(mats);
      setActividades(acts);
      setNotificaciones(notifs);
      // Guardar en caché
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('cache_dashboard_est', JSON.stringify({ mats, acts, notifs, ts: Date.now() }));
    } catch {
      // Sin red: usar caché
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('cache_dashboard_est');
        if (raw) {
          const { mats, acts, notifs } = JSON.parse(raw);
          setMaterias(mats || []);
          setActividades(acts || []);
          setNotificaciones(notifs || []);
          setIsOffline(true);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [usuario?.carrera_id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const proximasActividades = useMemo(() => {
    const now = new Date();
    return [...actividades]
      .filter((a) => a.fecha_entrega && new Date(a.fecha_entrega) >= now)
      .sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
      .slice(0, 5);
  }, [actividades]);

  const recentNotifs = useMemo(
    () => [...notificaciones].slice(0, 3),
    [notificaciones],
  );

  const unreadCount = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={[styles.header, { paddingTop: 44 }]}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
          <SkeletonList count={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Banner offline ── */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#92400e" />
            <Text style={styles.offlineText}>Sin conexión — mostrando datos guardados</Text>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>Bienvenido de vuelta,</Text>
              <Text style={styles.name}>{nombre}</Text>
              {/* Badges de todos los roles del usuario */}
              <View style={styles.badgesRow}>
                {allRoles.map((r) => (
                  <View key={r} style={styles.badge}>
                    <Ionicons
                      name={ROL_ICONS[r.toLowerCase()] || 'school'}
                      size={13}
                      color="#c7d2fe"
                    />
                    <Text style={styles.badgeText}>
                      {ROL_LABELS[r.toLowerCase()] || r}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Pressable
              style={styles.avatar}
              onPress={() => navigation.navigate('PerfilEstudiante')}
            >
              <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Stats ── */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="book-outline"
            label="Materias"
            value={materias.length}
            color={PRIMARY}
            bg="#e8f0fe"
          />
          <StatCard
            icon="calendar-outline"
            label="Próximas"
            value={proximasActividades.length}
            color="#0f766e"
            bg="#ecfdf5"
          />
          <StatCard
            icon="notifications-outline"
            label="Sin leer"
            value={unreadCount}
            color="#0f172a"
            bg="#f5f3ff"
          />
        </View>

        {/* ── Quick access ── */}
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
              <Text style={styles.moduleLabel}>{mod.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Recent notifications ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notificaciones Recientes</Text>
          <Pressable onPress={() => navigation.navigate('NotificacionesEstudiante')}>
            <Text style={styles.link}>Ver todas</Text>
          </Pressable>
        </View>
        {recentNotifs.length ? (
          recentNotifs.map((notif) => (
            <View
              key={notif.id}
              style={[styles.notifCard, !notif.leida && styles.notifCardUnread]}
            >
              <View style={styles.notifIcon}>
                <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
                {!notif.leida && <View style={styles.unreadDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle} numberOfLines={1}>{notif.titulo}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{notif.cuerpo}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay notificaciones recientes.</Text>
          </View>
        )}

        {/* ── Upcoming activities ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Actividades</Text>
          <Pressable onPress={() => navigation.navigate('ActividadesEstudiante')}>
            <Text style={styles.link}>Ver todas</Text>
          </Pressable>
        </View>
        {proximasActividades.length ? (
          proximasActividades.map((act) => (
            <View key={act.id} style={styles.actCard}>
              <View style={styles.actIcon}>
                <Ionicons name="sparkles-outline" size={20} color="#2E86AB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actTitle}>{act.titulo}</Text>
                <Text style={styles.actMeta}>
                  {act.categoria} · {formatDate(act.fecha_entrega)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay actividades próximas.</Text>
          </View>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>
      <EstudianteBottomNav navigation={navigation} active="DashboardEstudiante" />
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
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

  // Header
  header: {
    backgroundColor: PRIMARY,
    borderRadius: 24,
    padding: 24,
    paddingTop: 44,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  circleOne: {
    position: 'absolute', width: 150, height: 150, borderRadius: 80,
    top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTwo: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    bottom: 10, left: 20, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { flex: 1 },
  greeting: { fontSize: 14, color: '#c7d2fe', fontWeight: '500' },
  name: { fontSize: 25, fontWeight: '800', color: '#fff', marginVertical: 8 },
  badgesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#e0e7ff', fontWeight: '700', fontSize: 12 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // Stats
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  link: { color: '#2E86AB', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: {
    width: '31%', backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  statIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  statLabel: { color: '#94a3b8', fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  statAccent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 },

  // Quick modules
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  moduleCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  moduleCardPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  moduleIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduleLabel: { color: '#0f172a', fontWeight: '800', fontSize: 13, textAlign: 'center' },

  // Notifications
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  notifCardUnread: { borderWidth: 1.5, borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: -3, right: -3,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#fff',
  },
  notifTitle: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  notifBody: { color: '#64748b', fontSize: 12, marginTop: 3, lineHeight: 17 },

  // Activities
  actCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  actIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  actMeta: { marginTop: 3, color: '#64748b', fontSize: 12, textTransform: 'capitalize' },

  empty: { backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 12 },
  emptyText: { color: '#64748b', fontWeight: '600' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 10,
    marginBottom: 12, borderWidth: 1, borderColor: '#fde68a',
  },
  offlineText: { color: '#92400e', fontWeight: '700', fontSize: 13 },
});
