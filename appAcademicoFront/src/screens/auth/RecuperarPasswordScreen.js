import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';

export default function RecuperarPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: email, 2: código + nueva pass
  const [email, setEmail] = useState('');
  const [usuarioId, setUsuarioId] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSolicitarCodigo = async () => {
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    setError('');
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      // En entorno local el backend devuelve el código y usuario_id directamente
      if (res.data?.dev_codigo) {
        setUsuarioId(res.data.usuario_id);
        setCodigo(res.data.dev_codigo);
      }
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'No se pudo enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!codigo.trim()) { setError('Ingresa el código de verificación.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setError('');
    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        usuario_id: usuarioId,
        codigo,
        password,
        password_confirmation: confirm,
      });
      setSuccess(true);
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={s.container}>
        <View style={s.successBox}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text style={s.successTitle}>¡Contraseña restablecida!</Text>
          <Text style={s.successSub}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
          <Pressable style={s.btnPrimary} onPress={() => navigation.replace('Login')}>
            <Text style={s.btnPrimaryText}>Ir al login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
        </Pressable>

        <View style={s.header}>
          <View style={s.iconWrap}>
            <Ionicons name="lock-open-outline" size={36} color="#fff" />
          </View>
          <Text style={s.title}>Recuperar contraseña</Text>
          <Text style={s.subtitle}>
            {step === 1
              ? 'Ingresa tu correo para recibir un código'
              : 'Ingresa el código y tu nueva contraseña'}
          </Text>
          <View style={s.stepsRow}>
            <View style={[s.stepDot, step >= 1 && s.stepDotActive]} />
            <View style={s.stepLine} />
            <View style={[s.stepDot, step >= 2 && s.stepDotActive]} />
          </View>
        </View>

        <View style={s.form}>
          {step === 1 ? (
            <>
              <Text style={s.label}>Correo electrónico</Text>
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={s.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {error ? <Text style={s.error}>{error}</Text> : null}
              <Pressable style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleSolicitarCodigo} disabled={loading}>
                {loading ? <ActivityIndicator color="#312e81" /> : <Text style={s.btnPrimaryText}>Enviar código</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.label}>Código de verificación</Text>
              <View style={s.inputWrap}>
                <Ionicons name="key-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={s.input}
                  placeholder="6 dígitos"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  maxLength={6}
                  value={codigo}
                  onChangeText={setCodigo}
                />
              </View>
              <Text style={s.label}>Nueva contraseña</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={s.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <Text style={s.label}>Confirmar contraseña</Text>
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={s.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
              {error ? <Text style={s.error}>{error}</Text> : null}
              <View style={s.btnsRow}>
                <Pressable style={s.btnSecondary} onPress={() => { setStep(1); setError(''); }}>
                  <Ionicons name="arrow-back" size={16} color="#94a3b8" />
                  <Text style={s.btnSecondaryText}>Atrás</Text>
                </Pressable>
                <Pressable style={[s.btnPrimary, { flex: 2 }, loading && s.btnDisabled]} onPress={handleResetPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#312e81" /> : <Text style={s.btnPrimaryText}>Restablecer</Text>}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d2e' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#312e81', top: -80, right: -80, opacity: 0.4 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#1A1A4E', bottom: 100, left: -60, opacity: 0.3 },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  form: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 28, padding: 24 },
  label: { fontSize: 13, fontWeight: '700', color: '#c7d2fe', marginBottom: 8, marginTop: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', borderRadius: 14, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, color: '#fff', height: '100%' },
  error: { color: '#f87171', fontSize: 13, fontWeight: '600', marginTop: 8 },
  btnsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnPrimary: { marginTop: 24, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnPrimaryText: { color: '#312e81', fontSize: 15, fontWeight: '800' },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 14 },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIcon: { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
});
