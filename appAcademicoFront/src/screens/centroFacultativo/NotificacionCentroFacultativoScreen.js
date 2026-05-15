import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { create } from '../../services/notificacionService';
import CentroFacultativoBottomNav from '../../components/CentroFacultativoBottomNav';

const PRIMARY = '#0369a1';

const DESTINOS = [
  { value: 'estudiantes', label: 'Estudiantes' },
  { value: 'todos', label: 'Todos en la facultad' },
];

export default function NotificacionCentroFacultativoScreen({ navigation }) {
  const { usuario } = useAuth();
  const facultadId = usuario?.facultad_id || usuario?.carrera?.facultad?.id;

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [destino, setDestino] = useState('estudiantes');
  const [sending, setSending] = useState(false);
  const [carrerasFacultad, setCarrerasFacultad] = useState([]);
  const [loadingCarreras, setLoadingCarreras] = useState(true);

  useEffect(() => {
    const loadCarreras = async () => {
      try {
        setLoadingCarreras(true);
        const response = await api.get('/carreras');
        const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        const facultadCarreras = data.filter((c) => String(c.facultad_id || c?.facultad?.id) === String(facultadId));
        setCarrerasFacultad(facultadCarreras);
      } catch (error) {
        console.error('Error cargando carreras de facultad:', error);
        setCarrerasFacultad([]);
      } finally {
        setLoadingCarreras(false);
      }
    };

    if (facultadId) {
      loadCarreras();
    } else {
      setCarrerasFacultad([]);
      setLoadingCarreras(false);
    }
  }, [facultadId]);

  const handleSend = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      Alert.alert('Validación', 'Título y mensaje son obligatorios.');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim(),
      rol_destino: destino,
    };

    const carreraIds = carrerasFacultad.map((c) => c.id).filter(Boolean);
    if (carreraIds.length > 0) {
      payload.carrera_ids = carreraIds;
    }

    try {
      setSending(true);
      await create(payload);
      setTitulo('');
      setCuerpo('');
      Alert.alert('Éxito', 'Notificación enviada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo enviar la notificación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.circleOne} />
          <View style={s.circleTwo} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>Centro Facultativo</Text>
              <Text style={s.title}>Nueva Notificación</Text>
              {(usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre) ? (
                <View style={s.badge}>
                  <Ionicons name="business-outline" size={13} color="#dbeafe" />
                  <Text style={s.badgeText}>{usuario?.facultad?.nombre || usuario?.carrera?.facultad?.nombre}</Text>
                </View>
              ) : null}
            </View>
            <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionLabel}>Destinatarios</Text>
          <View style={s.radioGroup}>
            {DESTINOS.map((item) => (
              <Pressable
                key={item.value}
                style={[s.radioOption, destino === item.value && s.radioOptionActive]}
                onPress={() => setDestino(item.value)}
              >
                <View style={[s.radioDot, destino === item.value && s.radioDotActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.radioLabel}>{item.label}</Text>
                  <Text style={s.radioSub}>{item.value === 'estudiantes' ? 'Solo estudiantes de la facultad' : 'Todos los usuarios de la facultad'}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text style={s.infoText}>
            {destino === 'estudiantes'
              ? 'Se enviará solo a los estudiantes que pertenecen a la facultad.'
              : 'Se enviará a todos los usuarios de las carreras de la facultad.'}
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.fieldLabel}>Título</Text>
          <TextInput
            style={s.input}
            placeholder="Título de la notificación"
            placeholderTextColor="#94a3b8"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={120}
          />
          <Text style={s.charCount}>{titulo.length}/120</Text>

          <Text style={s.fieldLabel}>Mensaje</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Describe el comunicado..."
            placeholderTextColor="#94a3b8"
            value={cuerpo}
            onChangeText={setCuerpo}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.88 }, sending && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={sending || loadingCarreras}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.sendBtnText}>Enviar notificación</Text>
          )}
        </Pressable>

        <View style={{ height: 90 }} />
      </ScrollView>
      <CentroFacultativoBottomNav navigation={navigation} active="NotificacionFacultativo" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingBottom: 40 },

  header: {
    backgroundColor: PRIMARY,
    padding: 24, paddingTop: 44,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden', marginBottom: 20,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 8,
  },
  circleOne: {
    position: 'absolute', width: 150, height: 150, borderRadius: 80,
    top: -40, right: -30, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTwo: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    bottom: 10, left: 20, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: '#dbeafe', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginVertical: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#dbeafe', fontWeight: '700', fontSize: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  card: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 22, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '800', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14,
  },
  radioGroup: { gap: 10 },
  radioOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  radioOptionActive: {
    backgroundColor: '#eff6ff', borderColor: '#bae6fd',
  },
  radioDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    borderColor: '#94a3b8', backgroundColor: '#fff',
  },
  radioDotActive: {
    backgroundColor: '#0369a1', borderColor: '#0369a1',
  },
  radioLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  radioSub: { fontSize: 12, color: '#64748b' },
  infoText: { color: '#475569', fontSize: 13, marginTop: 12 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#f8fafc', fontSize: 15, color: '#0f172a', marginBottom: 4,
  },
  textArea: { minHeight: 130, textAlignVertical: 'top', marginTop: 0 },
  charCount: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'right', marginBottom: 14 },
  sendBtn: {
    marginHorizontal: 20, marginTop: 4,
    backgroundColor: PRIMARY, borderRadius: 18, paddingVertical: 16, alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
