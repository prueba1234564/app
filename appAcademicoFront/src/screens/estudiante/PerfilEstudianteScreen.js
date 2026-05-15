import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';
import RolSwitcher from '../../components/RolSwitcher';
import CambiarPassword from '../../components/CambiarPassword';

const PRIMARY = '#1e3a5f';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PerfilEstudianteScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const nombre = usuario?.nombre || 'Estudiante';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>
        </View>

        <View style={styles.body}>
          {/* ── Info card ── */}
          <View style={styles.card}>
            <InfoRow icon="person-outline"    label="Nombre"   value={nombre} />
            <InfoRow icon="mail-outline"       label="Correo"   value={usuario?.email || 'Sin correo'} />
            {usuario?.registro_universitario ? (
              <InfoRow icon="id-card-outline"  label="Registro" value={usuario.registro_universitario} />
            ) : null}
            {usuario?.carrera?.nombre ? (
              <InfoRow icon="library-outline"  label="Carrera"  value={usuario.carrera.nombre} />
            ) : null}
            {usuario?.carrera?.facultad?.nombre ? (
              <InfoRow icon="business-outline" label="Facultad" value={usuario.carrera.facultad.nombre} />
            ) : null}
          </View>

          {/* ── Cambio de rol (solo aparece si tiene 2+ roles) ── */}
          <RolSwitcher />

          {/* ── Cambiar contraseña ── */}
          <CambiarPassword />

          {/* ── Logout ── */}
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
      <EstudianteBottomNav navigation={navigation} active="PerfilEstudiante" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 110 },
  body:    { paddingHorizontal: 20, paddingTop: 20 },

  header: {
    alignItems: 'center', backgroundColor: PRIMARY,
    padding: 30, paddingTop: 42,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  name:       { color: '#fff', fontSize: 24, fontWeight: '900' },
  email:      { color: '#c7d2fe', marginTop: 5, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 22, padding: 20,
    marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  infoValue: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginTop: 2 },

  logoutButton: {
    backgroundColor: '#ef4444', borderRadius: 16, padding: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: '900' },
});
