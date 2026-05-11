/**
 * CambiarPassword — sección reutilizable de cambio de contraseña.
 * Se puede insertar en cualquier pantalla de perfil.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../api/axios';

export default function CambiarPassword() {
  const [open,            setOpen]            = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/usuarios/cambiar-password', {
        current_password:          currentPassword,
        new_password:              newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (res.data.success) {
        Alert.alert('Listo', 'Contraseña actualizada correctamente.');
        reset();
        setOpen(false);
      } else {
        Alert.alert('Error', res.data.message || 'No se pudo actualizar la contraseña.');
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error de conexión con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {/* ── Toggle ── */}
      <Pressable style={s.toggleRow} onPress={() => { setOpen((v) => !v); reset(); }}>
        <View style={s.toggleIcon}>
          <Ionicons name="lock-closed-outline" size={22} color="#4f46e5" />
        </View>
        <View style={s.toggleText}>
          <Text style={s.toggleTitle}>Contraseña</Text>
          <Text style={s.toggleSub}>
            {open ? 'Ocultar formulario' : 'Actualiza tu contraseña de acceso'}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-forward'}
          size={20}
          color="#94a3b8"
        />
      </Pressable>

      {/* ── Formulario ── */}
      {open && (
        <View style={s.form}>
          <PasswordInput
            placeholder="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            icon="lock-closed-outline"
          />
          <PasswordInput
            placeholder="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            icon="lock-open-outline"
          />
          <PasswordInput
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            icon="checkmark-circle-outline"
          />

          <Pressable
            style={[s.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                <Text style={s.saveBtnText}>Guardar contraseña</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

function PasswordInput({ placeholder, value, onChangeText, show, onToggleShow, icon }) {
  return (
    <View style={s.inputRow}>
      <Ionicons name={icon} size={18} color="#94a3b8" />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <Pressable onPress={onToggleShow} hitSlop={8}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 24 },

  // Toggle row
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  toggleIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
  },
  toggleText:  { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  toggleSub:   { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  // Form
  form: {
    marginTop: 10,
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    gap: 12,
    borderTopWidth: 4, borderTopColor: '#4f46e5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f8fafc', borderRadius: 14,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b' },

  saveBtn: {
    backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 4,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
