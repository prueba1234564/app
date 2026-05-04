import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getMisMaterias, getMisActividades } from '../../services/docenteService';
import { create } from '../../services/notificacionService';

export default function NotificacionFormScreen({ navigation }) {
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('todas');
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [sending, setSending] = useState(false);

  // Actividad vinculada (opcional)
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [showActividadPicker, setShowActividadPicker] = useState(false);

  useFocusEffect(useCallback(() => {
    getMisMaterias().then(setMaterias);
    getMisActividades().then((data) => setActividades(Array.isArray(data) ? data : [])).catch(() => setActividades([]));
  }, []));

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) setArchivo(result.assets[0]);
  };

  const handleSend = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      Alert.alert('Validación', 'Título y mensaje son obligatorios.');
      return;
    }

    // Obtener carrera_id de cada materia (puede estar directo o en el objeto carrera)
    const getCarreraId = (m) => m.carrera_id || m.carrera?.id || null;

    const carreraIds = materiaId === 'todas'
      ? [...new Set(materias.map(getCarreraId).filter(Boolean))]
      : [getCarreraId(materias.find((m) => String(m.id) === String(materiaId)))].filter(Boolean);

    const payload = {
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim(),
      rol_destino: 'estudiantes',
    };

    // Solo agregar carrera_ids si se pudo determinar
    if (carreraIds.length > 0) {
      payload.carrera_ids = carreraIds;
    }

    if (actividadSeleccionada) {
      payload.actividad_id = actividadSeleccionada.id;
    }
    if (archivo) payload.archivo = archivo;

    try {
      setSending(true);
      await create(payload);
      Alert.alert('Éxito', 'Notificación enviada correctamente.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'No fue posible enviar la notificación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Nueva Notificación</Text>
          <Text style={styles.headerSubtitle}>Envía comunicados a estudiantes</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.label}>Título</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Título del comunicado" />

          <Text style={styles.label}>Mensaje</Text>
          <TextInput style={[styles.input, styles.textArea]} value={cuerpo} onChangeText={setCuerpo} placeholder="Escribe el mensaje" multiline />

          <Text style={styles.label}>Destinatarios</Text>
          <View style={styles.lockedField}><Ionicons name="people-outline" size={18} color="#2E86AB" /><Text style={styles.lockedText}>Estudiantes de mis materias</Text></View>

          <Text style={styles.label}>Materia</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={materiaId} onValueChange={setMateriaId}>
              <Picker.Item label="Todas mis materias" value="todas" />
              {materias.map((materia) => <Picker.Item key={materia.id} label={materia.nombre} value={String(materia.id)} />)}
            </Picker>
          </View>

          <Text style={styles.label}>Archivo adjunto</Text>
          <Pressable style={styles.fileButton} onPress={pickFile}>
            <Ionicons name="cloud-upload-outline" size={22} color="#2E86AB" />
            <Text style={styles.fileText}>{archivo?.name || 'Seleccionar PDF o imagen'}</Text>
          </Pressable>

          {/* Actividad vinculada (opcional) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
            <Text style={styles.label}>Actividad vinculada</Text>
            <Pressable
              onPress={() => navigation.navigate('ActividadesDocente')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}
            >
              <Ionicons name="add-circle-outline" size={14} color="#2E86AB" />
              <Text style={{ fontSize: 12, color: '#2E86AB', fontWeight: '700' }}>Nueva</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.fileButton, { borderStyle: 'solid' }]}
            onPress={() => setShowActividadPicker(!showActividadPicker)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2E86AB" />
            <Text style={[styles.fileText, { color: actividadSeleccionada ? '#0f172a' : '#94a3b8' }]} numberOfLines={1}>
              {actividadSeleccionada ? actividadSeleccionada.titulo : 'Seleccionar actividad (opcional)'}
            </Text>
            {actividadSeleccionada ? (
              <Pressable onPress={(e) => { e.stopPropagation(); setActividadSeleccionada(null); }}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            ) : (
              <Ionicons name={showActividadPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
            )}
          </Pressable>
          {showActividadPicker && (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4, maxHeight: 200, overflow: 'hidden' }}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {actividades.length === 0 ? (
                  <Pressable
                    style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}
                    onPress={() => { setShowActividadPicker(false); navigation.navigate('ActividadesDocente'); }}
                  >
                    <Ionicons name="calendar-outline" size={28} color="#cbd5e1" />
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>No hay actividades</Text>
                    <Text style={{ color: '#2E86AB', fontSize: 12, fontWeight: '700' }}>Crear actividad →</Text>
                  </Pressable>
                ) : (
                  actividades.map((act) => {
                    const isSelected = actividadSeleccionada?.id === act.id;
                    const colorMap = { parcial: '#ef4444', tarea: '#2563eb', proyecto: '#16a34a', evento: '#f97316', comunicado: '#64748b' };
                    const color = colorMap[act.categoria] || '#64748b';
                    return (
                      <Pressable
                        key={act.id}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: isSelected ? '#eff6ff' : '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                        onPress={() => { setActividadSeleccionada(act); setShowActividadPicker(false); }}
                      >
                        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          <Ionicons name="calendar" size={15} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{act.titulo}</Text>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>{act.categoria}{act.fecha_entrega ? ' · ' + new Date(act.fecha_entrega).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#2E86AB" />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Enviar</Text>}
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
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 6, fontWeight: '600' },
  formCard: { margin: 20, backgroundColor: '#fff', borderRadius: 22, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  label: { color: '#334155', fontWeight: '900', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 15, color: '#0f172a' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  lockedField: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 14, padding: 14 },
  lockedText: { color: '#2E86AB', fontWeight: '800' },
  pickerWrap: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, overflow: 'hidden' },
  fileButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eff6ff', borderRadius: 14, padding: 15 },
  fileText: { color: '#2E86AB', fontWeight: '800', flex: 1 },
  sendButton: { marginTop: 24, backgroundColor: '#2E86AB', borderRadius: 16, padding: 16, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
