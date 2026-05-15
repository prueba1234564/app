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
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { getAll as getCarreras } from '../../services/carreraService';
import { getAll as getFacultades } from '../../services/facultadService';
import { create, update } from '../../services/usuarioService';
import getErrorMessage from '../../utils/apiError';

// ─── Combinaciones válidas de roles ───────────────────────────────────────────
// Categoría: Estudiantes
const COMBOS_ESTUDIANTE = [
  {
    id:    'solo_estudiante',
    label: 'Estudiante',
    roles: ['estudiante'],
    icon:  'school-outline',
    color: '#4f46e5',
  },
  {
    id:    'est_centro',
    label: 'Estudiante + Centro de Estudiantes',
    roles: ['estudiante', 'centro_estudiantes'],
    icon:  'people-outline',
    color: '#0f172a',
  },
  {
    id:    'est_facultativo',
    label: 'Estudiante + Centro Facultativo',
    roles: ['estudiante', 'centro_facultativo'],
    icon:  'school-outline',
    color: '#0369a1',
  },
];

// Categoría: Administrativos / Docentes
const COMBOS_OTROS = [
  {
    id:    'solo_docente',
    label: 'Docente',
    roles: ['docente'],
    icon:  'person-outline',
    color: '#0f766e',
  },
  {
    id:    'solo_director',
    label: 'Director',
    roles: ['director'],
    icon:  'briefcase-outline',
    color: '#0369a1',
  },
  {
    id:    'director_docente',
    label: 'Director + Docente',
    roles: ['director', 'docente'],
    icon:  'briefcase-outline',
    color: '#0369a1',
  },
  {
    id:    'solo_decano',
    label: 'Decano',
    roles: ['decano'],
    icon:  'ribbon-outline',
    color: '#0f172a',
  },
  {
    id:    'decano_docente',
    label: 'Decano + Docente',
    roles: ['decano', 'docente'],
    icon:  'ribbon-outline',
    color: '#0f172a',
  },
];

const ALL_COMBOS = [...COMBOS_ESTUDIANTE, ...COMBOS_OTROS];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeRole = (v) => {
  if (!v) return '';
  const s = String(v).toLowerCase().trim();
  if (s === 'docentes') return 'docente';
  if (s === 'estudiantes') return 'estudiante';
  return s;
};

const getInitialRoles = (usuario) => {
  if (!usuario) return [];
  return (usuario?.roles ?? usuario?.rolesUsuario ?? [])
    .map((r) => (typeof r === 'string' ? normalizeRole(r) : normalizeRole(r?.rol ?? r?.name ?? r?.nombre ?? r?.slug)))
    .filter(Boolean);
};

const getRolesComboId = (roles) => {
  if (!roles || roles.length === 0) return null;
  const sorted = [...roles].sort().join(',');
  for (const c of ALL_COMBOS) {
    if ([...c.roles].sort().join(',') === sorted) return c.id;
  }
  if (roles.includes('estudiante')) return 'solo_estudiante';
  if (roles.includes('docente'))    return 'solo_docente';
  return null;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function UsuarioFormScreen({ navigation, route }) {
  const usuario   = route.params?.usuario;
  const isEditing = Boolean(usuario);

  const [nombre,       setNombre]       = useState(usuario?.nombre ?? '');
  const [email,        setEmail]        = useState(usuario?.email ?? '');
  const [ru,           setRu]           = useState(usuario?.registro_universitario ?? '');
  const [password,     setPassword]     = useState('');
  const [comboId,      setComboId]      = useState(() => getRolesComboId(getInitialRoles(usuario)));
  const [carreraId,    setCarreraId]    = useState(
    usuario?.carrera_id ? String(usuario.carrera_id) : usuario?.carrera?.id ? String(usuario.carrera.id) : '',
  );
  const [facultadId,   setFacultadId]   = useState(
    usuario?.facultad_id ? String(usuario.facultad_id) : usuario?.facultad?.id ? String(usuario.facultad.id) : '',
  );
  const [carreras,     setCarreras]     = useState([]);
  const [facultades,   setFacultades]   = useState([]);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, f] = await Promise.all([getCarreras(), getFacultades()]);
        setCarreras(c);
        setFacultades(f);
      } catch (e) {
        setError(getErrorMessage(e, 'No se pudieron cargar los datos.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const comboActual        = ALL_COMBOS.find((c) => c.id === comboId) ?? null;
  const rolesSeleccionados = comboActual?.roles ?? [];
  const esEstudiante       = rolesSeleccionados.includes('estudiante');

  const handleSave = async () => {
    setError('');
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('El email no tiene un formato válido.');
      return;
    }
    if (!comboId) {
      setError('Selecciona un tipo de acceso.');
      return;
    }
    if (esEstudiante && !ru.trim()) {
      setError('El RU es obligatorio para estudiantes.');
      return;
    }
    if (!isEditing && !password.trim()) {
      setError('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        nombre:                 nombre.trim(),
        email:                  email.trim(),
        roles:                  rolesSeleccionados,
        registro_universitario: esEstudiante ? ru.trim() : null,
        carrera_id:             carreraId  ? Number(carreraId)  : null,
        facultad_id:            facultadId ? Number(facultadId) : null,
      };
      if (password.trim()) payload.password = password;
      if (isEditing) {
        await update(usuario.id, payload);
      } else {
        await create(payload);
      }
      navigation.goBack();
    } catch (e) {
      const apiErrors = e?.response?.data?.errors;
      if (apiErrors) {
        const first = Object.values(apiErrors)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError(getErrorMessage(e, 'No fue posible guardar el usuario.'));
      }
      Alert.alert('Error', getErrorMessage(e, 'No fue posible guardar el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A4E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.formCard}>
          <Text style={s.title}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
          <Text style={s.subtitle}>Completa la información del usuario.</Text>

          {/* ── Nombre ── */}
          <Text style={s.label}>Nombre</Text>
          <TextInput
            placeholder="Nombre completo"
            style={s.input}
            value={nombre}
            onChangeText={setNombre}
          />

          {/* ── Email ── */}
          <Text style={s.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo electrónico"
            style={s.input}
            value={email}
            onChangeText={setEmail}
          />

          {/* ── Password ── */}
          <Text style={s.label}>
            {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          </Text>
          <TextInput
            placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
            secureTextEntry
            style={s.input}
            value={password}
            onChangeText={setPassword}
          />

          {/* ── Tipo de acceso ── */}
          <Text style={s.label}>Tipo de acceso</Text>

          {/* Sub-categoría: Estudiantes */}
          <Text style={s.categoryLabel}>Estudiantes</Text>
          <View style={s.rolesContainer}>
            {COMBOS_ESTUDIANTE.map((combo) => {
              const selected = comboId === combo.id;
              return (
                <Pressable
                  key={combo.id}
                  style={[
                    s.roleChip,
                    selected && { backgroundColor: combo.color, borderColor: combo.color },
                  ]}
                  onPress={() => setComboId(combo.id)}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selected ? '#fff' : combo.color}
                  />
                  <Ionicons
                    name={combo.icon}
                    size={15}
                    color={selected ? '#fff' : combo.color}
                  />
                  <Text style={[s.roleChipText, selected && { color: '#fff' }]}>
                    {combo.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sub-categoría: Administrativos / Docentes */}
          <Text style={[s.categoryLabel, { marginTop: 8 }]}>Administrativos y Docentes</Text>
          <View style={s.rolesContainer}>
            {COMBOS_OTROS.map((combo) => {
              const selected = comboId === combo.id;
              return (
                <Pressable
                  key={combo.id}
                  style={[
                    s.roleChip,
                    selected && { backgroundColor: combo.color, borderColor: combo.color },
                  ]}
                  onPress={() => setComboId(combo.id)}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selected ? '#fff' : combo.color}
                  />
                  <Ionicons
                    name={combo.icon}
                    size={15}
                    color={selected ? '#fff' : combo.color}
                  />
                  <Text style={[s.roleChipText, selected && { color: '#fff' }]}>
                    {combo.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── RU (solo si es estudiante) ── */}
          {esEstudiante && (
            <>
              <Text style={s.label}>RU — Registro Universitario *</Text>
              <TextInput
                placeholder="Ej: 20231234"
                style={s.input}
                value={ru}
                onChangeText={setRu}
                keyboardType="numeric"
                maxLength={20}
              />
            </>
          )}

          {/* ── Carrera ── */}
          <Text style={s.label}>Carrera</Text>
          <View style={s.pickerWrapper}>
            <Picker
              selectedValue={carreraId}
              style={s.picker}
              onValueChange={setCarreraId}
            >
              <Picker.Item label="Sin carrera asignada" value="" />
              {carreras.map((c) => (
                <Picker.Item key={c.id} label={c.nombre} value={String(c.id)} />
              ))}
            </Picker>
          </View>

          {/* ── Facultad ── */}
          <Text style={s.label}>Facultad</Text>
          <View style={s.pickerWrapper}>
            <Picker
              selectedValue={facultadId}
              style={s.picker}
              onValueChange={setFacultadId}
            >
              <Picker.Item label="Sin facultad asignada" value="" />
              {facultades.map((f) => (
                <Picker.Item key={f.id} label={f.nombre} value={String(f.id)} />
              ))}
            </Picker>
          </View>

          {/* ── Error ── */}
          {!!error && <Text style={s.errorText}>{error}</Text>}

          {/* ── Guardar ── */}
          <Pressable
            onPress={handleSave}
            style={[s.button, s.primaryButton]}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={s.buttonText}>{isEditing ? 'Guardar cambios' : 'Crear usuario'}</Text>
            }
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos (mismo patrón que el director) ───────────────────────────────────
const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#f8fafc' },
  content:          { padding: 20, paddingBottom: 80 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
  },

  title:    { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },

  label: {
    fontSize: 12, fontWeight: '700', color: '#475569',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  categoryLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', marginBottom: 18,
    color: '#1e293b', fontSize: 15,
  },

  // Chips de roles (igual que director pero con radio)
  rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  roleChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  // Picker
  pickerWrapper: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    marginBottom: 18, overflow: 'hidden', backgroundColor: '#fff',
  },
  picker: { width: '100%' },

  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, fontWeight: '500' },

  button:        { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButton: { backgroundColor: '#1A1A4E' },
  buttonText:    { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
