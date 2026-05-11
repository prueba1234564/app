import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import BottomNav from '../../components/BottomNav';
import { SkeletonList, SkeletonStatCard } from '../../components/SkeletonLoader';

// Módulos específicos para Director - solo su carrera
const MODULES = [
  { title: 'Gestión de Materias', route: 'Materias', iconName: 'library', iconFamily: 'Ionicons', color: '#fbbf24', desc: 'Administrar materias de mi carrera' },
  { title: 'Actividades', route: 'Actividades', iconName: 'calendar', iconFamily: 'Ionicons', color: '#3b82f6', desc: 'Eventos y comunicados de mi carrera' },
  { title: 'Materias del Periodo', route: 'MateriaPeriodo', iconName: 'time', iconFamily: 'Ionicons', color: '#10b981', desc: 'Asignar materias y docentes al periodo activo' },
  { title: 'Gestión de Usuarios', route: 'Usuarios', iconName: 'people-sharp', iconFamily: 'Ionicons', color: '#f87171', desc: 'Docentes y estudiantes de mi carrera' },
  { title: 'Notificaciones', route: 'Notificaciones', iconName: 'notifications', iconFamily: 'Ionicons', color: '#818cf8', desc: 'Enviar notificaciones' },
];

export default function DashboardDirector({ navigation }) {
  const { usuario, logout } = useAuth();
  const nombre = usuario?.nombre || 'Usuario';
  const userId = usuario?.id;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodoActivo, setPeriodoActivo] = useState(null);

  // Notificaciones
  const [notificacionesRecibidas, setNotificacionesRecibidas] = useState([]);
  const [notificacionesEnviadas, setNotificacionesEnviadas] = useState([]);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadStats();
    loadNotificaciones();
    loadPeriodo();
  }, []);

  const loadPeriodo = async () => {
    try {
      const res = await api.get('/periodos/activo');
      setPeriodoActivo(res.data?.data ?? null);
    } catch { setPeriodoActivo(null); }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOffline(false);
      const response = await api.get('/dashboard/director-stats');
      if (response.data?.success) {
        setStats(response.data.data);
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('cache_stats_director', JSON.stringify({ data: response.data.data, ts: Date.now() }));
      } else {
        setError('No se pudieron cargar los datos');
      }
    } catch {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const raw = await AsyncStorage.getItem('cache_stats_director');
        if (raw) {
          const { data } = JSON.parse(raw);
          setStats(data);
          setIsOffline(true);
        } else {
          setError('Sin conexión y sin datos guardados.');
        }
      } catch { setError('Error de conexión con el servidor'); }
    } finally {
      setLoading(false);
    }
  };

  const loadNotificaciones = async () => {
    if (!userId) return;
    
    try {
      setLoadingNotificaciones(true);
      
      // Notificaciones recibidas (las que el director puede ver según su rol/carrera)
      const recibidasResponse = await api.get('/notificaciones?limit=5');
      setNotificacionesRecibidas(recibidasResponse.data?.data || []);
      
      // Notificaciones enviadas por el director
      const enviadasResponse = await api.get(`/notificaciones?enviado_por=${userId}&limit=5`);
      setNotificacionesEnviadas(enviadasResponse.data?.data || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoadingNotificaciones(false);
    }
  };

  const formatTiempo = (fecha) => {
    if (!fecha) return '';
    const diff = Math.floor((new Date() - new Date(fecha)) / 60000); // minutos
    if (diff < 1) return 'Hace un momento';
    if (diff < 60) return `Hace ${diff} min`;
    const horas = Math.floor(diff / 60);
    if (horas < 24) return `Hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
  };

  // Función para renderizar el icono dinámicamente según la familia
  const renderIcon = (iconName, iconFamily, size, color) => {
    const IconComponent = iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
    return <IconComponent name={iconName} size={size || 24} color={color || '#fff'} />;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>📶 Sin conexión — datos guardados</Text>
          </View>
        )}
        {/* Header Premium */}}
        <View style={styles.header}>
          {/* Elementos decorativos de fondo */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Bienvenido de vuelta,</Text>
              <Text style={styles.name}>{nombre}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#c7d2fe" />
                <Text style={styles.role}>Director de Carrera</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('Notificaciones')}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="notifications-outline" size={22} color="#ffffff" />
              </Pressable>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Periodo Activo */}
        <Pressable
          onPress={() => navigation.navigate('MateriaPeriodo')}
          style={periodoActivo ? styles.periodoActivoCard : styles.periodoInactivoCard}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.periodoIconBg, { backgroundColor: periodoActivo ? '#dcfce7' : '#fef3c7' }]}>
              <Ionicons name="calendar" size={20} color={periodoActivo ? '#16a34a' : '#d97706'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.periodoLabel}>Periodo Activo</Text>
              <Text style={[styles.periodoNombre, { color: periodoActivo ? '#16a34a' : '#d97706' }]}>
                {periodoActivo ? periodoActivo.nombre : 'Sin periodo activo'}
              </Text>
              {periodoActivo && (
                <Text style={styles.periodoFechas}>
                  {periodoActivo.fecha_inicio} — {periodoActivo.fecha_fin}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>

        {/* Estadísticas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
        </View>
        
        {loading ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 }}>
            <SkeletonStatCard style={{ width: '48%', marginBottom: 14 }} />
            <SkeletonStatCard style={{ width: '48%', marginBottom: 14 }} />
            <SkeletonStatCard style={{ width: '48%', marginBottom: 14 }} />
            <SkeletonStatCard style={{ width: '48%', marginBottom: 14 }} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#8A220B" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadStats}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : stats ? (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#eff6ff' }]}>
                {renderIcon('people-sharp', 'Ionicons', 22, '#232C57')}
              </View>
              <Text style={styles.statValue}>{stats.total_usuarios}</Text>
              <Text style={styles.statTitle}>Usuarios</Text>
              <View style={[styles.statAccent, { backgroundColor: '#232C57' }]} />
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#ecfdf5' }]}>
                {renderIcon('book-education', 'MaterialCommunityIcons', 22, '#8A220B')}
              </View>
              <Text style={styles.statValue}>{stats.total_carreras}</Text>
              <Text style={styles.statTitle}>Carreras</Text>
              <View style={[styles.statAccent, { backgroundColor: '#8A220B' }]} />
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#fffbeb' }]}>
                {renderIcon('library', 'Ionicons', 22, '#232C57')}
              </View>
              <Text style={styles.statValue}>{stats.total_materias}</Text>
              <Text style={styles.statTitle}>Materias</Text>
              <View style={[styles.statAccent, { backgroundColor: '#232C57' }]} />
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#f5f3ff' }]}>
                {renderIcon('stats-chart', 'Ionicons', 22, '#8A220B')}
              </View>
              <Text style={styles.statValue}>{stats.actividad_mensual}%</Text>
              <Text style={styles.statTitle}>Actividad</Text>
              <View style={[styles.statAccent, { backgroundColor: '#8A220B' }]} />
            </View>
          </View>
        ) : null}

        {/* Mi Carrera */}
        {stats?.mi_carrera && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mi Carrera</Text>
            </View>
            <View style={styles.miCarreraCard}>
              <View style={styles.carreraTop}>
                <View style={[styles.carreraIconBg, { backgroundColor: '#e0e7ff' }]}>
                  {renderIcon('school', 'Ionicons', 24, '#4f46e5')}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carreraNombre}>{stats.mi_carrera.nombre}</Text>
                  <Text style={styles.carreraFacultad}>{stats.mi_carrera.facultad}</Text>
                </View>
              </View>
              
              <View style={styles.carreraDivider} />
              
              <View style={styles.carreraStatsRow}>
                <View style={styles.carreraStatBox}>
                  <Text style={styles.carreraStatNum}>{stats.mi_carrera.total_estudiantes}</Text>
                  <Text style={styles.carreraStatLabel}>Estudiantes</Text>
                </View>
                <View style={styles.carreraStatBox}>
                  <Text style={styles.carreraStatNum}>{stats.mi_carrera.total_docentes}</Text>
                  <Text style={styles.carreraStatLabel}>Docentes</Text>
                </View>
                <View style={styles.carreraStatBox}>
                  <Text style={styles.carreraStatNum}>{stats.mi_carrera.total_materias}</Text>
                  <Text style={styles.carreraStatLabel}>Materias</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Notificaciones Recibidas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notificaciones Recibidas</Text>
          <Pressable onPress={() => navigation.navigate('Notificaciones')}>
            <Text style={styles.verTodasLink}>Ver todas</Text>
          </Pressable>
        </View>
        
        {loadingNotificaciones ? (
          <ActivityIndicator size="small" color="#8A220B" style={{ marginVertical: 20 }} />
        ) : notificacionesRecibidas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>No tienes notificaciones recibidas</Text>
          </View>
        ) : (
          <View style={styles.notificacionesList}>
            {notificacionesRecibidas.slice(0, 3).map((notif, index) => (
              <View key={notif.id || index} style={styles.notificacionCard}>
                <View style={[styles.notifIconBg, { backgroundColor: '#818cf820' }]}>
                  <Ionicons name="notifications" size={18} color="#818cf8" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitulo} numberOfLines={1}>{notif.titulo}</Text>
                  <Text style={styles.notifCuerpo} numberOfLines={2}>{notif.cuerpo}</Text>
                  <Text style={styles.notifTiempo}>{formatTiempo(notif.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notificaciones Enviadas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notificaciones Enviadas</Text>
          <Pressable onPress={() => navigation.navigate('Notificaciones')}>
            <Text style={styles.verTodasLink}>Ver todas</Text>
          </Pressable>
        </View>
        
        {loadingNotificaciones ? (
          <ActivityIndicator size="small" color="#8A220B" style={{ marginVertical: 20 }} />
        ) : notificacionesEnviadas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="send-outline" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>No has enviado notificaciones aún</Text>
          </View>
        ) : (
          <View style={styles.notificacionesList}>
            {notificacionesEnviadas.slice(0, 3).map((notif, index) => (
              <View key={notif.id || index} style={styles.notificacionCard}>
                <View style={[styles.notifIconBg, { backgroundColor: '#10b98120' }]}>
                  <Ionicons name="send" size={18} color="#10b981" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitulo} numberOfLines={1}>{notif.titulo}</Text>
                  <Text style={styles.notifCuerpo} numberOfLines={2}>{notif.cuerpo}</Text>
                  <Text style={styles.notifTiempo}>{formatTiempo(notif.created_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Módulos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Módulos de Gestión</Text>
        </View>
        <View style={styles.modulesList}>
          {MODULES.map((mod) => (
            <Pressable
              key={mod.title}
              style={({ pressed }) => [
                styles.moduleCard, 
                { backgroundColor: pressed ? '#f8fafc' : '#ffffff', transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
              onPress={() => navigation.navigate(mod.route)}
            >
              <View style={[styles.modIcon, { backgroundColor: mod.color + '15' }]}>
                {renderIcon(mod.iconName, mod.iconFamily, 24, mod.color)}
              </View>
              <View style={styles.modInfo}>
                <Text style={styles.modTitle}>{mod.title}</Text>
                <Text style={styles.modDesc}>{mod.desc}</Text>
              </View>
              <View style={styles.modArrowBg}>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Cerrar Sesión */}
        <Pressable 
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]} 
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>
        
        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomNav navigation={navigation} activeScreen="DashboardDirector" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  
  // HEADER PREMIUM
  header: {
    backgroundColor: '#232C57',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    marginTop: -20,
    paddingTop: 50,
    overflow: 'hidden',
    shadowColor: '#232C57',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  headerCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -30,
    right: -30,
  },
  headerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 10,
    left: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#232C57',
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  role: {
    fontSize: 12,
    color: '#e0e7ff',
    fontWeight: '600',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },

  // SECTIONS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8A220B',
  },
  sectionLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  statAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    opacity: 0.8,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // CARRERAS (Ahora en Horizontal)
  carrerasScroll: {
    marginBottom: 24,
    marginLeft: -20, // Para alinear con el padding del scroll
    paddingHorizontal: 20,
  },
  carreraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    width: 220,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  carreraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  carreraIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carreraNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A220B',
    flexShrink: 1,
  },
  carreraDirector: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
    marginLeft: 52,
  },
  carreraDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 14,
  },
  carreraStats: {
    flexDirection: 'row',
    gap: 16,
  },
  carreraStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carreraStatText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  
  // MI CARRERA (Director)
  miCarreraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  carreraFacultad: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  carreraStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  carreraStatBox: {
    alignItems: 'center',
  },
  carreraStatNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#232C57',
    marginBottom: 4,
  },
  carreraStatLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // NOTIFICACIONES
  verTodasLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 8,
  },
  notificacionesList: {
    gap: 12,
    marginBottom: 24,
  },
  notificacionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  notifIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
  },
  notifTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  notifCuerpo: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 18,
  },
  notifTiempo: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // ACTIVIDAD RECIENTE (legacy)
  actividadList: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  actividadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  actividadDotContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actividadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actividadContent: {
    flex: 1,
  },
  actividadTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A220B',
    marginBottom: 2,
  },
  actividadDescripcion: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actividadTiempo: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },

  // MÓDULOS
  modulesList: {
    gap: 12,
    marginBottom: 32,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  modIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modInfo: {
    flex: 1,
  },
  modTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A220B',
    marginBottom: 3,
  },
  modDesc: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  modArrowBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LOGOUT
  logoutBtn: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' },
  offlineText: { color: '#92400e', fontWeight: '700', fontSize: 13 },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    marginVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#8A220B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // PERIODO ACTIVO
  periodoActivoCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#bbf7d0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  periodoInactivoCard: {
    backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#fde68a',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  periodoIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  periodoLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  periodoNombre: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  periodoFechas: { fontSize: 12, color: '#64748b', marginTop: 2 },
});