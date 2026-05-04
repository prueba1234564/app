import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import { create, update } from '../../services/actividadService';

const CATEGORIES = ['parcial', 'tarea', 'proyecto', 'evento', 'comunicado'];

const toInputDate = (date) => date.toISOString().slice(0, 10);

export default function ActividadFormScreen({ navigation, route }) {
  const materia = route.params?.materia;
  const actividad = route.params?.actividad;
  const isEditing = Boolean(actividad);

  const [titulo, setTitulo] = useState(actividad?.titulo || '');
  const [descripcion, setDescripcion] = useState(actividad?.descripcion || '');
  const [categoria, setCategoria] = useState(actividad?.categoria || 'tarea');
  const [fecha, setFecha] = useState(actividad?.fecha_entrega ? new Date(actividad.fecha_entrega) : new Date());
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) setArchivo(result.assets[0]);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      Alert.alert('Validación', 'El título es obligatorio.');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      fecha_entrega: toInputDate(fecha),
      materia_id: materia?.id,
      carrera_id: materia?.carrera_id,
      rol_destino: 'estudiantes',
    };
    if (archivo) payload.archivo = archivo;

    try {
      setSaving(true);
      if (isEditing) await update(actividad.id, payload);
      else await create(payload);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'No fue posible guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEditing ? 'Editar Actividad' : 'Nueva Actividad'}</Text>
          <Text style={styles.headerSubtitle}>{materia?.nombre}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Título</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Título de la actividad" />

          <Text style={styles.label}>Descripción</Text>
          <TextInput style={[styles.input, styles.textArea]} value={descripcion} onChangeText={setDescripcion} placeholder="Detalle opcional" multiline />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={categoria} onValueChange={setCategoria}>
              {CATEGORIES.map((item) => <Picker.Item key={item} label={item.charAt(0).toUpperCase() + item.slice(1)} value={item} />)}
            </Picker>
          </View>

          <Text style={styles.label}>Fecha de entrega</Text>
          {Platform.OS === 'web' ? (
            <TextInput style={styles.input} value={toInputDate(fecha)} onChangeText={(value) => setFecha(new Date(`${value}T12:00:00`))} placeholder="YYYY-MM-DD" />
          ) : (
            <>
              <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#2E86AB" />
                <Text style={styles.dateText}>{toInputDate(fecha)}</Text>
              </Pressable>
              {showPicker && <DateTimePicker value={fecha} mode="date" onChange={(_, selected) => { setShowPicker(false); if (selected) setFecha(selected); }} />}
            </>
          )}

          <Text style={styles.label}>Archivo adjunto</Text>
          <Pressable style={styles.fileButton} onPress={pickFile}>
            <Ionicons name="cloud-upload-outline" size={22} color="#2E86AB" />
            <Text style={styles.fileText}>{archivo?.name || actividad?.ruta_archivo || 'Seleccionar PDF o imagen'}</Text>
          </Pressable>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 30 },
  header: { backgroundColor: '#232C57', padding: 24, paddingTop: 34, paddingBottom: 34, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 6, fontWeight: '600' },
  formCard: { margin: 20, backgroundColor: '#fff', borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  label: { color: '#334155', fontWeight: '900', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 15, color: '#0f172a' },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  pickerWrap: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14 },
  dateText: { color: '#0f172a', fontWeight: '700' },
  fileButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eff6ff', borderRadius: 14, padding: 15 },
  fileText: { color: '#2E86AB', fontWeight: '800', flex: 1 },
  saveButton: { marginTop: 24, backgroundColor: '#2E86AB', borderRadius: 16, padding: 16, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
