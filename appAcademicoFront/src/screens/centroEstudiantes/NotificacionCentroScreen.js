import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { create } from '../../services/notificacionService';
import CentroEstudiantesBottomNav from '../../components/CentroEstudiantesBottomNav';

const PRIMARY = '#0f172a';

export default function NotificacionCentroScreen({ navigation }) {
  const { usuario } = useAuth();
  const carreraId     = usuario?.carrera_id;
  const carreraNombre = usuario?.carrera?.nombre ?? 'tu carrera';

  const [titulo,      setTitulo]      = useState('');
  const [cuerpo,      setCuerpo]      = useState('');
  const [sending,     setSending]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSend = () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      Alert.alert('Validación', 'Título y mensaje son obligatorios.');
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    try {
      setSending(true);
      const payload = {
        titulo:      titulo.trim(),
        cuerpo:      cuerpo.trim(),
        rol_destino: 'estudiantes',
      };
      if (carreraId) payload.carrera_ids = [carreraId];
      await create(payload);
      setTitulo('');
      setCuerpo('');
      Alert.alert('✓ Enviada', 'Notificación enviada a los estudiantes.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo enviar la notificación.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>

      {/* ── Modal de confirmación ── */}
      <Modal transparent visible={showConfirm} animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={s.overlay}>
          <View style={s.dialog}>
            <View style={s.dialogIcon}>
              <Ionicons name="notifications" size={28} color={PRIMARY} />
            </View>
            <Text style={s.dialogTitle}>Confirmar envío</Text>
            <Text style={s.dialogBody}>
              Se enviará{'\n'}
              <Text style={{ fontWeight: '800', color: '#0f172a' }}>"{titulo}"</Text>
              {'\n'}a todos los estudiantes de{'\n'}
              <Text style={{ fontWeight: '800', color: PRIMARY }}>{carreraNombre}</Text>
            </Text>
            <View style={s.dialogActions}>
              <Pressable style={s.btnCancel} onPress={() => setShowConfirm(false)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={s.btnConfirm} onPress={confirmSend}>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={s.btnConfirmText}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.circleOne} />
          <View style={s.circleTwo} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>Centro de Estudiantes</Text>
              <Text style={s.title}>Nueva Notificación</Text>
              {usuario?.carrera?.nombre ? (
                <View style={s.badge}>
                  <Ionicons name="library-outline" size={13} color="#ddd6fe" />
                  <Text style={s.badgeText}>{usuario.carrera.nombre}</Text>
                </View>
              ) : null}
            </View>
            <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* ── Destinatario (solo lectura) ── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Destinatarios</Text>
          <View style={s.destinatarioRow}>
            <View style={s.destinatarioIcon}>
              <Ionicons name="people" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.destinatarioTitle}>Estudiantes</Text>
              <Text style={s.destinatarioSub}>{carreraNombre}</Text>
            </View>
            <View style={s.lockedBadge}>
              <Ionicons name="lock-closed-outline" size={12} color="#94a3b8" />
              <Text style={s.lockedText}>Fijo</Text>
            </View>
          </View>
        </View>

        {/* ── Formulario ── */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>Contenido</Text>

          <Text style={s.fieldLabel}>Título <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput
            style={s.input}
            placeholder="Ej: Reunión de carrera este viernes"
            placeholderTextColor="#94a3b8"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
          />
          <Text style={s.charCount}>{titulo.length}/100</Text>

          <Text style={s.fieldLabel}>Mensaje <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Escribe el mensaje para los estudiantes..."
            placeholderTextColor="#94a3b8"
            value={cuerpo}
            onChangeText={setCuerpo}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Botón enviar ── */}
        <Pressable
          style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.88 }, sending && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={s.sendBtnText}>Enviar notificación</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 90 }} />
      </ScrollView>
      <CentroEstudiantesBottomNav navigation={navigation} active="NotificacionCentro" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingBottom: 40 },

  // Header
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
  greeting:  { fontSize: 13, color: '#ddd6fe', fontWeight: '500' },
  title:     { fontSize: 24, fontWeight: '900', color: '#fff', marginVertical: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  badgeText: { color: '#ede9fe', fontWeight: '700', fontSize: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Cards
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

  // Destinatario
  destinatarioRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  destinatarioIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center',
  },
  destinatarioTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  destinatarioSub:   { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f1f5f9', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  lockedText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },

  // Campos
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#f8fafc', fontSize: 15, color: '#0f172a', marginBottom: 4,
  },
  textArea:  { minHeight: 130, textAlignVertical: 'top', marginTop: 0 },
  charCount: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textAlign: 'right', marginBottom: 14 },

  // Botón
  sendBtn: {
    marginHorizontal: 20, marginTop: 4,
    backgroundColor: PRIMARY, borderRadius: 18, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  dialog: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  dialogIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  dialogTitle:   { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  dialogBody:    { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  dialogActions: { flexDirection: 'row', gap: 12, width: '100%' },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  btnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: PRIMARY,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
