import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import DocenteBottomNav from '../../components/DocenteBottomNav';
import RolSwitcher from '../../components/RolSwitcher';
import CambiarPassword from '../../components/CambiarPassword';

export default function PerfilDocenteScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const nombre = usuario?.nombre || 'Docente';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{nombre}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>
          <View style={styles.badge}>
            <Ionicons name="person-outline" size={13} color="#a7f3d0" />
            <Text style={styles.badgeText}>Docente</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Info */}
          <View style={styles.card}>
            <Info icon="person-outline"  label="Nombre" value={nombre} />
            <Info icon="mail-outline"    label="Correo" value={usuario?.email || 'Sin correo'} />
            {usuario?.carrera?.nombre && (
              <Info icon="library-outline" label="Carrera" value={usuario.carrera.nombre} />
            )}
          </View>

          {/* Cambio de rol (solo si tiene más de uno) */}
          <RolSwitcher />

          {/* Cambiar contraseña */}
          <CambiarPassword />

          {/* Cerrar sesión */}
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
      <DocenteBottomNav navigation={navigation} active="PerfilDocente" />
    </SafeAreaView>
  );
}

function Info({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#0f766e" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f8fafc' },
  scroll:  { paddingBottom: 110 },
  content: { padding: 20 },

  header: {
    alignItems: 'center', backgroundColor: '#0f766e',
    padding: 30, paddingTop: 42,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  name:       { color: '#fff', fontSize: 24, fontWeight: '900' },
  email:      { color: '#a7f3d0', marginTop: 5, fontWeight: '600' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#d1fae5', fontWeight: '700', fontSize: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 22, padding: 20,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  infoValue: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginTop: 2 },

  logoutButton: {
    backgroundColor: '#ef4444', borderRadius: 16, padding: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: '900' },
});
