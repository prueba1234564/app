import React, { useEffect, useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';

import { getAll as getCarreras } from '../../services/carreraService';
import { getAll as getFacultades } from '../../services/facultadService';
import { create, update } from '../../services/usuarioService';
import getErrorMessage from '../../utils/apiError';
import styles from './styles';

const ROLE_OPTIONS = [
  { label: 'Super Administrador', value: 'decano' },
  { label: 'Administrador', value: 'director' },
  { label: 'Centro Facultativo', value: 'centro_facultativo' },
  { label: 'Centro de Estudiantes', value: 'centro_estudiantes' },
  { label: 'Docente', value: 'docente' },
  { label: 'Estudiante', value: 'estudiante' },
];

const normalizeRoleValue = (value) => {
  if (!value) return '';
  const str = String(value).toLowerCase();
  if (str === 'docentes') return 'docente';
  if (str === 'estudiantes') return 'estudiante';
  return str;
};

const getInitialRole = (usuario) => {
  const role = usuario?.roles?.[0] ?? usuario?.rolesUsuario?.[0];

  if (!role) return '';

  if (typeof role === 'string') {
    return normalizeRoleValue(role);
  }

  return normalizeRoleValue(role?.rol ?? role?.name ?? role?.nombre ?? role?.slug);
};

export default function UsuarioFormScreen({ navigation, route }) {
  const usuario = route.params?.usuario;
  const isEditing = Boolean(usuario);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(getInitialRole(usuario));
  const [carreraId, setCarreraId] = useState(usuario?.carrera_id ? String(usuario.carrera_id) : usuario?.carrera?.id ? String(usuario.carrera.id) : '');
  const [facultadId, setFacultadId] = useState(usuario?.facultad_id ? String(usuario.facultad_id) : usuario?.facultad?.id ? String(usuario.facultad.id) : '');
  const [carreras, setCarreras] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [carrerasData, facultadesData] = await Promise.all([
          getCarreras(),
          getFacultades(),
        ]);

        setCarreras(carrerasData);
        setFacultades(facultadesData);
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'No fue posible cargar las listas del formulario.'));
      } finally {
        setLoading(false);
      }
    };

    loadDependencies();
  }, []);

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim() || !rol) {
      setError('Nombre, email y rol son obligatorios.');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('El email debe tener un formato válido (ejemplo: usuario@dominio.com)');
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
        rol,
        carrera_id: carreraId ? Number(carreraId) : null,
        facultad_id: facultadId ? Number(facultadId) : null,
      };

      if (password.trim()) {
        payload.password = password;
      }

      if (isEditing) {
        await update(usuario.id, payload);
      } else {
        await create(payload);
      }

      navigation.goBack();
    } catch (requestError) {
      const errorMessage = getErrorMessage(requestError, 'No fue posible guardar el usuario.');
      
      // Mostrar errores específicos de validación si existen
      if (requestError?.response?.data?.errors) {
        const errors = requestError.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else {
          setError(firstError);
        }
      } else {
        setError(errorMessage);
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.title}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
          <Text style={styles.subtitle}>Completa la informacion del usuario.</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput placeholder="Nombre completo" style={styles.input} value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Correo electronico"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder={isEditing ? 'Opcional en edicion' : 'Ingresa una contraseña'}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Rol</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={rol} style={styles.picker} onValueChange={setRol}>
              <Picker.Item label="Selecciona un rol" value="" />
              {ROLE_OPTIONS.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Carrera</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={carreraId} style={styles.picker} onValueChange={setCarreraId}>
              <Picker.Item label="Selecciona una carrera" value="" />
              {carreras.map((item) => (
                <Picker.Item key={item.id} label={item.nombre} value={String(item.id)} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Facultad</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={facultadId} style={styles.picker} onValueChange={setFacultadId}>
              <Picker.Item label="Selecciona una facultad" value="" />
              {facultades.map((item) => (
                <Picker.Item key={item.id} label={item.nombre} value={String(item.id)} />
              ))}
            </Picker>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={handleSave} style={[styles.button, styles.primaryButton]} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Guardar</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
