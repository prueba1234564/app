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
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { remove } from '../../services/materiaService';
import getErrorMessage from '../../utils/apiError';
import BottomNav from '../../components/BottomNav';

export default function MateriasScreen({ navigation }) {
  const { usuario } = useAuth();
  const carreraId = usuario?.carrera_id;
  const carreraNombre = usuario?.carrera?.nombre || 'Mi Carrera';
  
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMaterias = useCallback(async () => {
    if (!carreraId) {
      setMaterias([]);
      setLoading(false);
      Alert.alert('Error', 'No tienes una carrera asignada. Contacta al administrador.');
      return;
    }

    try {
      setLoading(true);
      // Cargar solo materias de la carrera del director
      const response = await api.get(`/materias?carrera_id=${carreraId}`);
      setMaterias(response.data?.data || response.data || []);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No fue posible cargar las materias.'));
    } finally {
      setLoading(false);
    }
  }, [carreraId]);

  useFocusEffect(
    useCallback(() => {
      loadMaterias();
    }, [loadMaterias])
  );

  const handleDelete = (materia) => {
    Alert.alert(
      'Eliminar materia',
      `¿Deseas eliminar "${materia.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(materia.id);
              loadMaterias();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'No fue posible eliminar la materia.'));
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
      {/* Fila Superior: Ícono de Materia + Info */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="library-outline" size={24} color="#d97706" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nombre}</Text>
        </View>
      </View>

      {/* Fila Inferior: Carrera Asociada + Acciones */}
      <View style={styles.cardFooter}>
        <View style={styles.carreraBadge}>
          <Ionicons name="school-outline" size={14} color="#6d28d9" />
          <Text style={styles.carreraText}>
            {item.carrera?.nombre ?? 'Sin carrera asignada'}
          </Text>
        </View>
        
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigation.navigate('MateriaForm', { materia: item })}
            style={styles.editButton}
          >
            <Ionicons name="pencil-outline" size={16} color="#4f46e5" />
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header Sólido Premium */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Materias de {carreraNombre}</Text>
        <Text style={styles.headerSubtitle}>{materias.length} materias en tu carrera</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={materias}
        keyExtractor={(item) => `${item.id}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay materias registradas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar una nueva</Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* FAB Moderno */}
      <Pressable 
        onPress={() => navigation.navigate('MateriaForm')} 
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <BottomNav navigation={navigation} activeScreen="Materias" />
    </SafeAreaView>
  );
}

const styles = {
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
    backgroundColor: '#1A1A4E', // Color sólido premium sin gradiente
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
    paddingBottom: 120, // Espacio para FAB y BottomNav
  },

  // TARJETAS DE MATERIA
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#fffbeb', // Tono ámbar muy suave para diferenciar de Usuarios
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  carreraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 12,
  },
  carreraText: {
    fontSize: 12,
    color: '#6d28d9',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // BOTONES DE ACCIÓN
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 6,
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

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 90, // Encima del BottomNav
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A4E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};
