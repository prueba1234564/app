import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAll, getActivo } from '../services/periodoService';

export default function PeriodoSelector({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [periodos, setPeriodos] = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [todosRes, activoRes] = await Promise.all([
        getAll(),
        getActivo(),
      ]);

      if (todosRes.success) {
        setPeriodos(todosRes.data || []);
      }
      if (activoRes.success) {
        setPeriodoActivo(activoRes.data);
      }
    } catch (error) {
      console.error('Error cargando periodos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleVerPeriodo = (item) => {
    setModalVisible(false);
    const routeNames = navigation?.getState?.()?.routeNames ?? [];
    if (navigation && typeof navigation.navigate === 'function' && routeNames.includes('ResumenPeriodo')) {
      navigation.navigate('ResumenPeriodo', { periodo: item });
    }
  };

  const getTipoLabel = (tipo) => {
    return tipo === 'semestre' ? 'Semestre' : 'Temporada';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const isActive = item.activo || periodoActivo?.id === item.id;

    return (
      <Pressable
        style={[styles.periodoItem, isActive && styles.periodoItemActive]}
        onPress={() => handleVerPeriodo(item)}
      >
        <View style={styles.periodoInfo}>
          <View style={[styles.tipoBadge, { backgroundColor: item.tipo === 'semestre' ? '#8b5cf6' : '#06b6d4' }]}>
            <Text style={styles.tipoText}>{getTipoLabel(item.tipo)}</Text>
          </View>
          <Text style={[styles.periodoNombre, isActive && styles.periodoNombreActive]}>
            {item.nombre}
          </Text>
          <Text style={styles.periodoFechas}>
            {formatFecha(item.fecha_inicio)} - {formatFecha(item.fecha_fin)}
          </Text>
        </View>
        {isActive ? (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.activeText}>Activo</Text>
          </View>
        ) : (
          <View style={styles.viewBadge}>
            <Ionicons name="eye-outline" size={18} color="#64748b" />
            <Text style={styles.viewText}>Ver</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar" size={16} color="#fff" />
        <Text style={styles.selectorText} numberOfLines={1}>
          {periodoActivo ? periodoActivo.nombre : 'Seleccionar periodo'}
        </Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Periodo Academico</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Selecciona una gestion para consultar su resumen
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#8A220B" style={styles.loader} />
            ) : (
              <FlatList
                data={periodos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
            )}

            <Pressable
              style={styles.gestionarButton}
              onPress={() => {
                setModalVisible(false);
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('Periodos');
                } else {
                  console.warn('Navigation no disponible');
                }
              }}
            >
              <Ionicons name="settings-outline" size={16} color="#8A220B" />
              <Text style={styles.gestionarText}>Gestionar Periodos</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 160,
  },
  selectorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  periodoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodoItemActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  periodoInfo: {
    flex: 1,
    gap: 4,
  },
  tipoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tipoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  periodoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  periodoNombreActive: {
    color: '#059669',
  },
  periodoFechas: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  loader: {
    paddingVertical: 40,
  },
  gestionarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A220B',
  },
  gestionarText: {
    color: '#8A220B',
    fontSize: 14,
    fontWeight: '600',
  },
});
