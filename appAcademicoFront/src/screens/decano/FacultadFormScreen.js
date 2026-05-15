import React, { useState } from 'react';
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

import { create, update } from '../../services/facultadService';
import getErrorMessage from '../../utils/apiError';
import styles from './styles';

export default function FacultadFormScreen({ navigation, route }) {
  const facultad = route.params?.facultad;
  const isEditing = Boolean(facultad);
  const [nombre, setNombre] = useState(facultad?.nombre ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isEditing) {
        await update(facultad.id, { nombre: nombre.trim() });
      } else {
        await create({ nombre: nombre.trim() });
      }

      navigation.goBack();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No fue posible guardar la facultad.'));
      Alert.alert('Error', getErrorMessage(requestError, 'No fue posible guardar la facultad.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.title}>{isEditing ? 'Editar Facultad' : 'Nueva Facultad'}</Text>
          <Text style={styles.subtitle}>Completa la informacion de la facultad.</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Nombre de la facultad"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={handleSave} style={[styles.button, styles.primaryButton]} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Guardar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
