import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getAll, remove } from '../../services/facultadService';
import getErrorMessage from '../../utils/apiError';
import styles from './styles';
import BottomNav from '../../components/BottomNav';

export default function FacultadesScreen({ navigation }) {
  const [facultades, setFacultades] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFacultades = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAll();
      setFacultades(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No fue posible cargar las facultades.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFacultades();
    }, [loadFacultades])
  );

  const handleDelete = (facultad) => {
    Alert.alert(
      'Eliminar facultad',
      `¿Deseas eliminar ${facultad.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(facultad.id);
              loadFacultades();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'No fue posible eliminar la facultad.'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={facultades}
        keyExtractor={(item) => `${item.id}`}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Facultades</Text>
            <Text style={styles.subtitle}>Administra las facultades registradas.</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No hay facultades registradas</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => navigation.navigate('FacultadForm', { facultad: item })}
                style={[styles.button, styles.editButton]}>
                <Text style={styles.buttonText}>Editar</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                style={[styles.button, styles.dangerButton]}>
                <Text style={styles.buttonText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable onPress={() => navigation.navigate('FacultadForm')} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <BottomNav navigation={navigation} activeScreen="Facultades" />
    </SafeAreaView>
  );
}
