import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

import api from '../../api/axios';
import { registrarEstudiante } from '../../services/registroService';

export default function RegistroEstudianteScreen({ navigation }) {
  const [nombre,    setNombre]    = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [ru,        setRu]        = useState('');
  const [carreraId, setCarreraId] = useState(null);
  const [carreras,  setCarreras]  = useState([]);
  const [pdf,       setPdf]       = useState(null);
  const [showPass,  setShowPass]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step,      setStep]      = useState(1);

  // Modal de feedback (éxito o error)
  const [modal, setModal] = useState(null);
  // modal = { tipo: 'exito'|'error'|'pendiente', titulo, mensaje, onClose }

  const showModal = (tipo, titulo, mensaje, onClose) => {
    setModal({ tipo, titulo, mensaje, onClose: onClose ?? (() => setModal(null)) });
  };

  useEffect(() => {
    api.get('/publico/carreras').then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setCarreras(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPdf(result.assets[0]);
    }
  };

  const validateStep1 = () => {
    if (!nombre.trim()) { showModal('error', 'Campo requerido', 'El nombre es obligatorio.'); return false; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showModal('error', 'Email inválido', 'Ingresa un email válido.'); return false;
    }
    if (password.length < 6) { showModal('error', 'Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.'); return false; }
    if (password !== confirm) { showModal('error', 'Contraseñas distintas', 'Las contraseñas no coinciden.'); return false; }
    if (!ru.trim()) { showModal('error', 'Campo requerido', 'El Registro Universitario es obligatorio.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!carreraId) { showModal('error', 'Carrera requerida', 'Selecciona tu carrera.'); return; }
    if (!pdf)       { showModal('error', 'PDF requerido', 'Sube tu PDF de matrícula.'); return; }

    try {
      setSubmitting(true);
      const res = await registrarEstudiante({
        nombre: nombre.trim(),
        email:  email.trim(),
        password,
        ru:     ru.trim(),
        carreraId,
        archivoPdf: pdf,
      });

      if (res.verificado) {
        showModal(
          'exito',
          '¡Registro exitoso!',
          'Tu cuenta fue verificada automáticamente con tu PDF de matrícula. Ya puedes iniciar sesión.',
          () => { setModal(null); navigation.replace('Login'); }
        );
      } else {
        showModal(
          'pendiente',
          'Registro recibido',
          'Tu cuenta fue creada pero no pudimos verificar tu RU en el PDF. Un administrador revisará tu solicitud pronto.',
          () => { setModal(null); navigation.replace('Login'); }
        );
      }
    } catch (e) {
      const errors = e?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        const msg = Array.isArray(first) ? first[0] : first;
        showModal('error', 'Error de validación', msg);
      } else {
        showModal('error', 'Error', e?.response?.data?.message ?? 'No se pudo completar el registro.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      {/* Círculos decorativos */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      {/* ── Modal de feedback ── */}
      <Modal
        transparent
        visible={Boolean(modal)}
        animationType="fade"
        onRequestClose={() => modal?.onClose?.()}
      >
        <View style={s.overlay}>
          <View style={s.dialog}>
            <View style={[
              s.dialogIcon,
              modal?.tipo === 'exito'    && { backgroundColor: '#ecfdf5' },
              modal?.tipo === 'pendiente'&& { backgroundColor: '#fffbeb' },
              modal?.tipo === 'error'    && { backgroundColor: '#fef2f2' },
            ]}>
              <Ionicons
                name={
                  modal?.tipo === 'exito'     ? 'checkmark-circle' :
                  modal?.tipo === 'pendiente' ? 'time-outline' :
                  'alert-circle-outline'
                }
                size={32}
                color={
                  modal?.tipo === 'exito'     ? '#10b981' :
                  modal?.tipo === 'pendiente' ? '#f59e0b' :
                  '#ef4444'
                }
              />
            </View>
            <Text style={s.dialogTitle}>{modal?.titulo}</Text>
            <Text style={s.dialogBody}>{modal?.mensaje}</Text>
            <Pressable
              style={[
                s.dialogBtn,
                modal?.tipo === 'exito'     && { backgroundColor: '#10b981' },
                modal?.tipo === 'pendiente' && { backgroundColor: '#f59e0b' },
                modal?.tipo === 'error'     && { backgroundColor: '#ef4444' },
              ]}
              onPress={() => modal?.onClose?.()}
            >
              <Text style={s.dialogBtnText}>
                {modal?.tipo === 'exito'     ? 'Ir al login' :
                 modal?.tipo === 'pendiente' ? 'Entendido' :
                 'Cerrar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerWrap}>
          <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </Pressable>
          <View style={s.iconWrap}>
            <Ionicons name="person-add" size={36} color="#fff" />
          </View>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Regístrate como estudiante</Text>

          {/* Indicador de pasos */}
          <View style={s.stepsRow}>
            <View style={[s.stepDot, step >= 1 && s.stepDotActive]} />
            <View style={s.stepLine} />
            <View style={[s.stepDot, step >= 2 && s.stepDotActive]} />
          </View>
          <Text style={s.stepLabel}>
            {step === 1 ? 'Paso 1: Datos personales' : 'Paso 2: Carrera y matrícula'}
          </Text>
        </View>

        <View style={s.form}>

          {step === 1 ? (
            <>
              {/* Nombre */}
              <Text style={s.label}>Nombre completo</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput style={s.input} placeholder="Tu nombre completo" placeholderTextColor="#475569"
                  value={nombre} onChangeText={setNombre} />
              </View>

              {/* Email */}
              <Text style={s.label}>Correo electrónico</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                <TextInput style={s.input} placeholder="tu@correo.com" placeholderTextColor="#475569"
                  autoCapitalize="none" keyboardType="email-address"
                  value={email} onChangeText={setEmail} />
              </View>

              {/* RU */}
              <Text style={s.label}>Registro Universitario (RU)</Text>
              <View style={s.inputWrap}>
                <Ionicons name="id-card-outline" size={18} color="#94a3b8" />
                <TextInput style={s.input} placeholder="Ej: 20231234" placeholderTextColor="#475569"
                  keyboardType="numeric" maxLength={20}
                  value={ru} onChangeText={setRu} />
              </View>
              <Text style={s.hint}>
                <Ionicons name="information-circle-outline" size={13} color="#6366f1" />
                {' '}Tu RU (solo números) debe aparecer en el PDF de matrícula para verificación automática
              </Text>

              {/* Contraseña */}
              <Text style={s.label}>Contraseña</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Mínimo 6 caracteres" placeholderTextColor="#475569"
                  secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Confirmar */}
              <Text style={s.label}>Confirmar contraseña</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput style={s.input} placeholder="Repite tu contraseña" placeholderTextColor="#475569"
                  secureTextEntry value={confirm} onChangeText={setConfirm} />
              </View>

              <Pressable style={s.nextBtn} onPress={() => { if (validateStep1()) setStep(2); }}>
                <Text style={s.nextBtnText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color="#312e81" />
              </Pressable>
            </>
          ) : (
            <>
              {/* Carrera */}
              <Text style={s.label}>Selecciona tu carrera</Text>
              <View style={s.carrerasGrid}>
                {carreras.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[s.carreraChip, carreraId === c.id && s.carreraChipActive]}
                    onPress={() => setCarreraId(c.id)}
                  >
                    <Ionicons
                      name="library-outline"
                      size={16}
                      color={carreraId === c.id ? '#fff' : '#6366f1'}
                    />
                    <Text style={[s.carreraText, carreraId === c.id && s.carreraTextActive]}
                      numberOfLines={2}>
                      {c.nombre}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* PDF */}
              <Text style={s.label}>PDF de matrícula</Text>
              <Pressable style={[s.pdfBtn, pdf && s.pdfBtnDone]} onPress={pickPdf}>
                <Ionicons
                  name={pdf ? 'document-text' : 'cloud-upload-outline'}
                  size={24}
                  color={pdf ? '#10b981' : '#6366f1'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.pdfBtnTitle, pdf && { color: '#10b981' }]}>
                    {pdf ? 'PDF seleccionado' : 'Subir PDF de matrícula'}
                  </Text>
                  <Text style={s.pdfBtnSub} numberOfLines={1}>
                    {pdf ? pdf.name : 'Toca para seleccionar el archivo'}
                  </Text>
                </View>
                {pdf && <Ionicons name="checkmark-circle" size={22} color="#10b981" />}
              </Pressable>

              <Text style={s.hint}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#6366f1" />
                {' '}El sistema buscará tu RU <Text style={{ fontWeight: '800', color: '#fff' }}>{ru}</Text> en el PDF para verificar tu cuenta automáticamente
              </Text>

              <View style={s.btnsRow}>
                <Pressable style={s.backStepBtn} onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={18} color="#94a3b8" />
                  <Text style={s.backStepText}>Atrás</Text>
                </Pressable>
                <Pressable
                  style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#312e81" />
                  ) : (
                    <>
                      <Text style={s.submitBtnText}>Registrarme</Text>
                      <Ionicons name="checkmark-done" size={18} color="#312e81" />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d2e' },
  bgCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#312e81', top: -80, right: -80, opacity: 0.4,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#1A1A4E', bottom: 100, left: -60, opacity: 0.3,
  },

  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  headerWrap: { alignItems: 'center', marginBottom: 32 },
  backBtn: {
    position: 'absolute', left: 0, top: 0,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title:    { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },

  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stepDot:  { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepLabel:{ fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  form: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28, padding: 24,
  },

  label: { fontSize: 13, fontWeight: '700', color: '#c7d2fe', marginBottom: 8, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)',
    borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, color: '#fff', height: '100%' },

  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6, lineHeight: 18 },

  nextBtn: {
    marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  nextBtnText: { color: '#312e81', fontSize: 15, fontWeight: '800' },

  // Carreras
  carrerasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  carreraChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.4)',
    backgroundColor: 'rgba(99,102,241,0.08)',
    maxWidth: '48%',
  },
  carreraChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  carreraText:       { fontSize: 12, fontWeight: '600', color: '#c7d2fe', flex: 1 },
  carreraTextActive: { color: '#fff' },

  // PDF
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 16, padding: 16, marginBottom: 8,
    borderStyle: 'dashed',
  },
  pdfBtnDone:    { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', borderStyle: 'solid' },
  pdfBtnTitle:   { fontSize: 14, fontWeight: '700', color: '#c7d2fe', marginBottom: 2 },
  pdfBtnSub:     { fontSize: 12, color: '#64748b' },

  // Botones paso 2
  btnsRow:     { flexDirection: 'row', gap: 12, marginTop: 24 },
  backStepBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 14,
  },
  backStepText: { color: '#94a3b8', fontWeight: '700' },
  submitBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
  },
  submitBtnText: { color: '#312e81', fontSize: 15, fontWeight: '800' },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  dialog: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  dialogIcon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  dialogTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  dialogBody:  { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  dialogBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
  },
  dialogBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
