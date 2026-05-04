import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getAll } from '../../services/carreraService';
import { create, update } from '../../services/materiaService';
import getErrorMessage from '../../utils/apiError';
// import styles from './styles'; // <-- Comentado para usar estilos premium en línea

export default function MateriaFormScreen({ navigation, route }) {
  const materia = route.params?.materia;
  const isEditing = Boolean(materia);
  
  const [nombre, setNombre] = useState(materia?.nombre ?? '');
  const [carreraId, setCarreraId] = useState(materia?.carrera_id ? String(materia.carrera_id) : '');
  const [carreras, setCarreras] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // NUEVO: Estado para el Picker Personalizado (Bottom Sheet)
  const [showCarreraPicker, setShowCarreraPicker] = useState(false);

  // Derivar el nombre de la carrera seleccionada para mostrarlo en el input falso
  const selectedCarrera = carreras.find(c => String(c.id) === carreraId);

  useEffect(() => {
    const loadCarreras = async () => {
      try {
        const data = await getAll();
        setCarreras(data);
        if (!carreraId && materia?.carrera?.id) {
          setCarreraId(String(materia.carrera.id));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'No fue posible cargar las carreras.'));
      } finally {
        setLoading(false);
      }
    };

    loadCarreras();
  }, [carreraId, materia]);

  const handleSave = async () => {
    if (!nombre.trim() || !carreraId) {
      setError('Debes completar el nombre y seleccionar una carrera.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        nombre: nombre.trim(),
        carrera_id: Number(carreraId),
      };

      if (isEditing) {
        await update(materia.id, payload);
      } else {
        await create(payload);
      }

      navigation.goBack();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No fue posible guardar la materia.'));
      Alert.alert('Error', getErrorMessage(requestError, 'No fue posible guardar la materia.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A4E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER SÓLIDO PREMIUM */}
        <View style={styles.header}>
          <Pressable style={styles.headerBack} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar Materia' : 'Nueva Materia'}</Text>
            <Text style={styles.headerSubtitle}>Completa los campos requeridos</Text>
          </View>
          <View style={styles.headerIconBg}>
            <Ionicons name="library-outline" size={24} color="#ffffff" />
          </View>
        </View>

        {/* TARJETA DEL FORMULARIO */}
        <View style={styles.formCard}>
          
          {/* INPUT NOMBRE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de la Materia</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="book-outline" size={20} color="#94a3b8" />
              <TextInput
                style={styles.input}
                placeholder="Ej: Matemáticas Aplicadas"
                placeholderTextColor="#94a3b8"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
          </View>

          {/* FAKE INPUT / DROPDOWN PARA CARRERA */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Carrera Asociada</Text>
            <Pressable style={styles.inputWrapper} onPress={() => setShowCarreraPicker(true)}>
              <Ionicons name="school-outline" size={20} color={selectedCarrera ? "#4f46e5" : "#94a3b8"} />
              <Text style={[styles.input, !selectedCarrera && styles.inputPlaceholder]}>
                {selectedCarrera ? selectedCarrera.nombre : 'Selecciona una carrera'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* MENSAJE DE ERROR */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* BOTÓN GUARDAR */}
          <Pressable 
            style={[styles.saveButton, saving && { opacity: 0.6 }]} 
            onPress={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={22} color="#ffffff" />
                <Text style={styles.saveButtonText}>Guardar Materia</Text>
              </>
            )}
          </Pressable>

        </View>
      </ScrollView>

      {/* ==========================================
           MODAL: CUSTOM PICKER (BOTTOM SHEET)
      ========================================== */}
      <Modal
        visible={showCarreraPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCarreraPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCarreraPicker(false)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Seleccionar Carrera</Text>
              <Pressable onPress={() => setShowCarreraPicker(false)} style={styles.sheetClose}>
                <Ionicons name="close" size={22} color="#475569" />
              </Pressable>
            </View>

            {carreras.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Text style={styles.sheetEmptyText}>No hay carreras disponibles</Text>
              </View>
            ) : (
              <FlatList
                data={carreras}
                keyExtractor={(item) => `${item.id}`}
                contentContainerStyle={styles.sheetList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = String(item.id) === carreraId;
                  return (
                    <TouchableOpacity 
                      style={[styles.sheetItem, isSelected && styles.sheetItemActive]} 
                      onPress={() => {
                        setCarreraId(String(item.id));
                        setShowCarreraPicker(false);
                      }}
                    >
                      <View style={[styles.itemRadioOuter, isSelected && styles.itemRadioOuterActive]}>
                        {isSelected && <View style={styles.itemRadioInner} />}
                      </View>
                      <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>{item.nombre}</Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color="#4f46e5" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
  content: {
    paddingBottom: 40,
  },

  // HEADER
  header: {
    backgroundColor: '#1A1A4E',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#c7d2fe',
    marginTop: 4,
    fontWeight: '500',
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },

  // FORM CARD
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  // INPUTS
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  inputPlaceholder: {
    color: '#94a3b8',
    fontWeight: '400',
  },

  // ERROR
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },

  // BUTTON
  saveButton: {
    backgroundColor: '#1A1A4E',
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '800',
  },

  // --- MODAL CUSTOM PICKER ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetClose: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 6,
  },
  sheetList: {
    paddingHorizontal: 16,
  },
  sheetEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sheetEmptyText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  // LIST ITEMS (Radio Buttons estilizados)
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 14,
  },
  sheetItemActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  itemRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRadioOuterActive: {
    borderColor: '#4f46e5',
  },
  itemRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
  },
  itemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  itemTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
};