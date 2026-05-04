import React, { useEffect, useState } from 'react';
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
import { create, update } from '../../services/usuarioService';
import getErrorMessage from '../../utils/apiError';

// Solo roles que el director puede asignar
const ROLE_OPTIONS = [
  { label: 'Docente', value: 'docente', icon: 'person-outline', color: '#0f766e' },
  { label: 'Estudiante', value: 'estudiante', icon: 'school-outline', color: '#4f46e5' },
  { label: 'Centro de Estudiantes', value: 'centro_estudiantes', icon: 'people-outline', color: '#7c3aed' },
];

const normalizeRoleValue = (value) => {
  if (!value) return '';
  const str = String(value).toLowerCase().trim();
  if (str === 'docentes') return 'docente';
  if (str === 'estudiantes') return 'estudiante';
  if (str === 'c_estudiantes') return 'centro_estudiantes';
  return str;
};

const getInitialRole = (usuario) => {
  const role = usuario?.roles?.[0] ?? usuario?.rolesUsuario?.[0];
  if (!role) return 'docente';
  if (typeof role === 'string') return normalizeRoleValue(role);
  return normalizeRoleValue(role?.rol ?? role?.name ?? role?.nombre ?? role?.slug);
};

export default function UsuarioFormScreen({ navigation, route }) {
  const { usuario: currentUser } = useAuth();
  const directorCarreraId = currentUser?.carrera_id;
  const directorCarreraNombre = currentUser?.carrera?.nombre || 'Mi Carrera';

  const usuario = route.params?.usuario;
  const isEditing = Boolean(usuario);

  // Obtener roles iniciales (puede ser array)
  const getInitialRoles = (u) => {
    if (!u) return ['docente'];
    const roles = u.rolesUsuario ?? u.roles_usuario ?? u.roles ?? [];
    if (roles.length === 0) return ['docente'];
    return roles.map((r) => normalizeRoleValue(r?.rol ?? r?.name ?? r)).filter(Boolean);
  };

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [ru, setRu] = useState(usuario?.registro_universitario ?? '');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState(getInitialRoles(usuario));
  const carreraId = directorCarreraId;
  const [error, setError] = useState('');
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);

  const esEstudiante = roles.includes('estudiante');

  const toggleRol = (value) => {
    setRoles((prev) => {
      if (prev.includes(value)) {
        // No quitar si es el único rol
        return prev.length > 1 ? prev.filter((r) => r !== value) : prev;
      }
      // Docente es incompatible con estudiante y centro_estudiantes
      if (value === 'docente') {
        return ['docente'];
      }
      // Estudiante/centro_estudiantes son incompatibles con docente
      if (value === 'estudiante' || value === 'centro_estudiantes') {
        return [...prev.filter((r) => r !== 'docente'), value];
      }
      return [...prev, value];
    });
  };

  useEffect(() => {
    if (!directorCarreraId) {
      setError('No tienes una carrera asignada. Contacta al administrador.');
    }
  }, [directorCarreraId]);

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim() || roles.length === 0) {
      setError('Nombre, email y al menos un rol son obligatorios.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('El email debe tener un formato válido.');
      return;
    }
    if (esEstudiante && !ru.trim()) {
      setError('El RU (Registro Universitario) es obligatorio para estudiantes.');
      return;
    }
    if (!isEditing && !password.trim()) {
      setError('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = {
        nombre: nombre.trim(),
        email: email.trim(),
        roles,
        carrera_id: carreraId ? Number(carreraId) : null,
        registro_universitario: esEstudiante ? ru.trim() : null,
      };
      if (password.trim()) payload.password = password;
      if (isEditing) {
        await update(usuario.id, payload);
      } else {
        await create(payload);
      }
      navigation.goBack();
    } catch (requestError) {
      const errors = requestError?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError(getErrorMessage(requestError, 'No fue posible guardar el usuario.'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={fStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A4E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={fStyles.screen}>
      <ScrollView contentContainerStyle={fStyles.content}>
        <View style={fStyles.formCard}>
          <Text style={fStyles.title}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
          <Text style={fStyles.subtitle}>Completa la informacion del usuario.</Text>

          <Text style={fStyles.label}>Nombre</Text>
          <TextInput placeholder="Nombre completo" style={fStyles.input} value={nombre} onChangeText={setNombre} />

          <Text style={fStyles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo electronico"
            style={fStyles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={fStyles.label}>Password</Text>
          <TextInput
            placeholder={isEditing ? 'Opcional en edicion' : 'Ingresa una contraseña'}
            secureTextEntry
            style={fStyles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={fStyles.label}>Rol</Text>
          <View style={fStyles.rolesContainer}>
            {ROLE_OPTIONS.map((item) => {
              const isSelected = roles.includes(item.value);
              return (
                <Pressable
                  key={item.value}
                  style={[fStyles.roleChip, isSelected && { backgroundColor: item.color, borderColor: item.color }]}
                  onPress={() => toggleRol(item.value)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={16}
                    color={isSelected ? '#fff' : item.color}
                  />
                  <Ionicons name={item.icon} size={15} color={isSelected ? '#fff' : item.color} />
                  <Text style={[fStyles.roleChipText, isSelected && { color: '#fff' }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {esEstudiante && (
            <>
              <Text style={fStyles.label}>RU — Registro Universitario *</Text>
              <TextInput
                placeholder="Ej: 20231234"
                style={fStyles.input}
                value={ru}
                onChangeText={setRu}
                keyboardType="default"
                autoCapitalize="characters"
                maxLength={20}
              />
            </>
          )}

          <Text style={fStyles.label}>Carrera (automatica)</Text>
          <View style={[fStyles.input, { backgroundColor: '#f1f5f9', justifyContent: 'center' }]}>
            <Text style={{ color: directorCarreraId ? '#0f172a' : '#94a3b8', fontSize: 16 }}>
              {directorCarreraNombre}
            </Text>
          </View>

          {!!error && <Text style={fStyles.errorText}>{error}</Text>}

          <Pressable onPress={handleSave} style={[fStyles.button, fStyles.primaryButton]} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={fStyles.buttonText}>Guardar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const fStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', marginBottom: 18, color: '#1e293b', fontSize: 15 },
  rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  roleChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, fontWeight: '500' },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButton: { backgroundColor: '#1A1A4E' },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
