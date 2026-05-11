import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';

// ─── Metadatos por rol ────────────────────────────────────────────────────────
const ROL_META = {
  decano: {
    label:  'Super Administrador',
    desc:   'Gestión completa de la facultad',
    icon:   'ribbon',
    color:  '#0f172a',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
  },
  director: {
    label:  'Director',
    desc:   'Administración de carrera',
    icon:   'briefcase',
    color:  '#0369a1',
    bg:     '#e0f2fe',
    border: '#bae6fd',
  },
  docente: {
    label:  'Docente',
    desc:   'Portal de enseñanza y actividades',
    icon:   'person',
    color:  '#0f766e',
    bg:     '#ecfdf5',
    border: '#a7f3d0',
  },
  estudiante: {
    label:  'Estudiante',
    desc:   'Portal académico estudiantil',
    icon:   'school',
    color:  '#1e3a5f',
    bg:     '#e8f0fe',
    border: '#bfdbfe',
  },
  centro_estudiantes: {
    label:  'Centro de Estudiantes',
    desc:   'Panel del centro estudiantil',
    icon:   'people',
    color:  '#0f172a',
    bg:     '#f5f3ff',
    border: '#ddd6fe',
  },
  centro_facultativo: {
    label:  'Centro Facultativo',
    desc:   'Panel del centro de la facultad',
    icon:   'school',
    color:  '#0369a1',
    bg:     '#e0f2fe',
    border: '#bae6fd',
  },
};

const getMeta = (role) => {
  const key = typeof role === 'string'
    ? role.toLowerCase()
    : (role?.rol ?? role?.name ?? role?.nombre ?? '').toLowerCase();
  return ROL_META[key] ?? {
    label:  key || 'Rol',
    desc:   'Continuar con este rol',
    icon:   'person-circle',
    color:  '#64748b',
    bg:     '#f1f5f9',
    border: '#e2e8f0',
  };
};

const getRoleValue = (role) =>
  typeof role === 'string' ? role : (role?.rol ?? role?.name ?? role?.nombre ?? role?.slug ?? '');

export default function SeleccionarRolScreen({ navigation, route }) {
  const { pendingRoles, seleccionarRol, usuario } = useAuth();
  const roles  = route.params?.roles?.length ? route.params.roles : pendingRoles;
  const nombre = usuario?.nombre ?? '';

  const [loading, setLoading] = useState(null); // rol en proceso

  const handleSeleccion = async (role) => {
    const value = getRoleValue(role);
    try {
      setLoading(value);
      await seleccionarRol(role);
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'No fue posible seleccionar el rol.';
      Alert.alert('Error', message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <Text style={s.avatarText}>
              {nombre ? nombre.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>

          {nombre ? (
            <Text style={s.heroGreeting}>Hola, {nombre.split(' ')[0]} 👋</Text>
          ) : null}
          <Text style={s.heroTitle}>¿Con qué rol deseas ingresar?</Text>
          <Text style={s.heroSub}>
            Tu cuenta tiene {roles.length} roles disponibles.{'\n'}Selecciona uno para continuar.
          </Text>
        </View>

        {/* ── Cards de roles ── */}
        <View style={s.cardsContainer}>
          {roles.map((role, idx) => {
            const meta  = getMeta(role);
            const value = getRoleValue(role);
            const busy  = loading === value;

            return (
              <Pressable
                key={`${value}-${idx}`}
                style={({ pressed }) => [
                  s.card,
                  { borderColor: meta.border, backgroundColor: busy ? meta.bg : '#fff' },
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                  loading !== null && !busy && { opacity: 0.5 },
                ]}
                onPress={() => handleSeleccion(role)}
                disabled={loading !== null}
              >
                {/* Ícono */}
                <View style={[s.cardIcon, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={28} color={meta.color} />
                </View>

                {/* Texto */}
                <View style={s.cardText}>
                  <Text style={[s.cardLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={s.cardDesc}>{meta.desc}</Text>
                </View>

                {/* Acción */}
                {busy ? (
                  <ActivityIndicator size="small" color={meta.color} />
                ) : (
                  <View style={[s.cardArrow, { backgroundColor: meta.bg }]}>
                    <Ionicons name="chevron-forward" size={18} color={meta.color} />
                  </View>
                )}

                {/* Barra de color izquierda */}
                <View style={[s.cardAccent, { backgroundColor: meta.color }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    backgroundColor: '#1e3a5f',
    padding: 32, paddingTop: 48, paddingBottom: 40,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    alignItems: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    top: -60, right: -50, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    bottom: -30, left: -20, backgroundColor: 'rgba(255,255,255,0.06)',
  },

  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText:    { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroGreeting:  { color: '#c7d2fe', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  heroTitle:     { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  heroSub:       { color: '#93c5fd', fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 20 },

  // ── Cards ──
  cardsContainer: { paddingHorizontal: 20, gap: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1.5, padding: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  cardIcon: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
  cardText:  { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  cardDesc:  { fontSize: 13, color: '#64748b', fontWeight: '500' },
  cardArrow: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
