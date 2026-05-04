import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';

const getRoleLabel = (role) => {
  if (typeof role === 'string') {
    return role;
  }

  return role?.nombre ?? role?.name ?? role?.slug ?? role?.rol ?? 'Rol';
};

export default function SeleccionarRolScreen({ navigation, route }) {
  const { pendingRoles, seleccionarRol } = useAuth();
  const roles = route.params?.roles?.length ? route.params.roles : pendingRoles;

  const handleSeleccion = async (role) => {
    try {
      await seleccionarRol(role);
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'No fue posible seleccionar el rol.';

      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona tu rol</Text>
      <Text style={styles.subtitle}>Elige con que perfil deseas ingresar</Text>

      <FlatList
        contentContainerStyle={styles.list}
        data={roles}
        keyExtractor={(item, index) => `${getRoleLabel(item)}-${index}`}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleSeleccion(item)} style={styles.card}>
            <Text style={styles.cardTitle}>{getRoleLabel(item)}</Text>
            <Text style={styles.cardText}>Continuar con este rol</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    marginTop: 6,
    marginBottom: 18,
  },
  list: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
