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
import { Picker } from '@react-native-picker/picker';

import { create, update } from '../../services/carreraService';
import { getAll } from '../../services/facultadService';
import getErrorMessage from '../../utils/apiError';
import styles from './styles';

export default function CarreraFormScreen({ navigation, route }) {
  const carrera = route.params?.carrera;
  const isEditing = Boolean(carrera);
  const [nombre, setNombre] = useState(carrera?.nombre ?? '');
  const [facultadId, setFacultadId] = useState(carrera?.facultad_id ? String(carrera.facultad_id) : '');
  const [facultades, setFacultades] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFacultades = async () => {
      try {
        const data = await getAll();
        setFacultades(data);
        if (!facultadId && carrera?.facultad?.id) {
          setFacultadId(String(carrera.facultad.id));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'No fue posible cargar las facultades.'));
      } finally {
        setLoading(false);
      }
    };

    loadFacultades();
  }, [carrera, facultadId]);

  const handleSave = async () => {
    if (!nombre.trim() || !facultadId) {
      setError('Debes completar el nombre y seleccionar una facultad.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        nombre: nombre.trim(),
        facultad_id: Number(facultadId),
      };

      if (isEditing) {
        await update(carrera.id, payload);
      } else {
        await create(payload);
      }

      navigation.goBack();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No fue posible guardar la carrera.'));
      Alert.alert('Error', getErrorMessage(requestError, 'No fue posible guardar la carrera.'));
    } finally {
      setSaving(false);
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.title}>{isEditing ? 'Editar Carrera' : 'Nueva Carrera'}</Text>
          <Text style={styles.subtitle}>Completa los datos de la carrera.</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput placeholder="Nombre de la carrera" style={styles.input} value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Facultad</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={facultadId} style={styles.picker} onValueChange={setFacultadId}>
              <Picker.Item label="Selecciona una facultad" value="" />
              {facultades.map((item) => (
                <Picker.Item key={item.id} label={item.nombre} value={String(item.id)} />
              ))}
            </Picker>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={handleSave} style={[styles.button, styles.primaryButton]} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Guardar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
