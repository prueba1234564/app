import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Iconos vectoriales

import { getAll, remove } from '../../services/carreraService';
import getErrorMessage from '../../utils/apiError';
// import styles from './styles'; // <-- Comentado para usar estilos modernos en línea
import BottomNav from '../../components/BottomNav';
import HeaderConfigButton from '../../components/HeaderConfigButton';

export default function CarrerasScreen({ navigation }) {
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCarreras = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAll();
      setCarreras(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No fue posible cargar las carreras.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCarreras();
    }, [loadCarreras])
  );

  const handleDelete = (carrera) => {
    Alert.alert(
      'Eliminar carrera',
      `¿Deseas eliminar "${carrera.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(carrera.id);
              loadCarreras();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'No fue posible eliminar la carrera.'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A4E" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Header con Icono, Info y Botones de Acción */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="domain" size={26} color="#ffffff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="barcode-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>Código: {item.codigo}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={14} color="#6366f1" />
            <Text style={[styles.metaText, { color: '#6366f1', fontWeight: '600' }]}>{item.director}</Text>
          </View>
        </View>
        
        {/* Botones de acción compactos con iconos reales */}
        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => navigation.navigate('CarreraForm', { carrera: item })}
            style={styles.iconButton}
          >
            <Ionicons name="create-outline" size={20} color="#4f46e5" />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={[styles.iconButton, { backgroundColor: '#fef2f2' }]}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {/* Estadísticas Inferiores */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, styles.estudiantesBox]}>
          <View style={styles.statLabelRow}>
            <Ionicons name="people-outline" size={16} color="#3b82f6" />
            <Text style={[styles.statLabel, styles.estudiantesLabel]}>Estudiantes</Text>
          </View>
          <Text style={[styles.statValue, styles.estudiantesValue]}>
            {item.total_estudiantes ?? 0}
          </Text>
        </View>
        <View style={[styles.statBox, styles.materiasBox]}>
          <View style={styles.statLabelRow}>
            <Ionicons name="book-outline" size={16} color="#22c55e" />
            <Text style={[styles.statLabel, styles.materiasLabel]}>Materias</Text>
          </View>
          <Text style={[styles.statValue, styles.materiasValue]}>
            {item.total_materias ?? 0}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header Sólido Premium */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Gestión de Carreras</Text>
            <Text style={styles.headerSubtitle}>Administra las carreras y sus métricas</Text>
          </View>
          <HeaderConfigButton navigation={navigation} />
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={carreras}
        keyExtractor={(item) => `${item.id}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="domain" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay carreras registradas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para crear una nueva carrera</Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* FAB Moderno Unificado */}
      <Pressable 
        onPress={() => navigation.navigate('CarreraForm')} 
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <BottomNav navigation={navigation} activeScreen="Carreras" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  
  // HEADER SÓLIDO
  header: {
    backgroundColor: '#1A1A4E', // Unificado con el resto de la app
    padding: 24,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    fontWeight: '500',
  },

  // LISTA
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // TARJETAS DE CARRERA
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#6366f1', // Color índigo suave para carreras
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 10,
  },
  // Botones circulares compactos
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ESTADÍSTICAS INFERIORES
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  estudiantesBox: {
    backgroundColor: '#eff6ff',
  },
  materiasBox: {
    backgroundColor: '#f0fdf4',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  estudiantesLabel: {
    color: '#3b82f6',
  },
  materiasLabel: {
    color: '#22c55e',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  estudiantesValue: {
    color: '#1e40af',
  },
  materiasValue: {
    color: '#166534',
  },

  // ESTADO VACÍO
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 90, // Encima del BottomNav (ajustado)
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A4E', // Unificado
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
