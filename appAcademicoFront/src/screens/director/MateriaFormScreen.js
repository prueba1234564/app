import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { create, update } from '../../services/materiaService';
import getErrorMessage from '../../utils/apiError';

export default function MateriaFormScreen({ navigation, route }) {
  const { usuario } = useAuth();
  const directorCarreraId = usuario?.carrera_id;
  const directorCarreraNombre = usuario?.carrera?.nombre || 'Mi Carrera';
  
  const materia = route.params?.materia;
  const isEditing = Boolean(materia);
  
  const [nombre, setNombre] = useState(materia?.nombre ?? '');
  // La carrera se asigna automáticamente desde el director
  const carreraId = directorCarreraId;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Verificar que el director tenga carrera asignada
    if (!directorCarreraId) {
      setError('No tienes una carrera asignada. Contacta al administrador.');
    }
  }, [directorCarreraId]);

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

          {/* CARRERA AUTOMÁTICA DEL DIRECTOR */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Carrera (automática)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="school-outline" size={20} color="#4f46e5" />
              <Text style={[styles.input, { color: directorCarreraId ? '#0f172a' : '#94a3b8' }]}>
                {directorCarreraNombre}
              </Text>
            </View>
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