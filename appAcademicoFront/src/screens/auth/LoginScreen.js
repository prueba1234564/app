import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // <-- Añadido para iconos

import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await login(email.trim(), password);

      if (result.requiresRoleSelection) {
        navigation.navigate('SeleccionarRol', {
          roles: result.roles,
        });
        return;
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'No fue posible iniciar sesión. Verifica tus credenciales.';

      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      
      {/* Elementos decorativos de fondo para dar profundidad */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <View style={styles.content}>
        {/* Logo / Branding Superior */}
        <View style={styles.brandingContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="shield-checkmark" size={40} color="#ffffff" />
          </View>
          <Text style={styles.appName}>SGA Académico</Text>
          <Text style={styles.subtitle}>Gestiona tu institución de forma segura</Text>
        </View>

        {/* Formulario de Login */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.formSubtitle}>
            Ingresa tus credenciales para continuar
          </Text>

          {/* Input Email con Icono */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Correo electrónico"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Input Password con Icono */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#64748b"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Botón Principal Premium */}
          <Pressable 
            disabled={submitting} 
            onPress={handleLogin} 
            style={[styles.button, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#1A1A4E" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </Pressable>

          {/* Registro de estudiantes */}
          <Pressable
            style={styles.registerBtn}
            onPress={() => navigation.navigate('RegistroEstudiante')}
          >
            <Ionicons name="person-add-outline" size={16} color="#6366f1" />
            <Text style={styles.registerText}>¿Eres estudiante? Regístrate aquí</Text>
          </Pressable>

          {/* Recuperar contraseña */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('RecuperarPassword')}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        {/* Texto inferior sutil */}
        <Text style={styles.footerText}>
          Sistema de Gestión Académica v1.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0d2e', // Fondo casi negro con tono índigo muy oscuro
  },
  
  // ESFERAS DECORATIVAS (Efecto de profundidad)
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#312e81',
    top: -80,
    right: -80,
    opacity: 0.4,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1A1A4E',
    bottom: 100,
    left: -60,
    opacity: 0.3,
  },
  bgCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    top: '40%',
    right: '20%',
    opacity: 0.2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    zIndex: 1, // Asegura que el contenido esté por encima de las esferas
  },

  // BRANDING
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.2)', // Índigo translúcido
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // FORMULARIO
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Efecto cristal sutil
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    padding: 28,
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 28,
  },

  // INPUTS
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Fondo oscuro inside cristal
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff', // Texto blanco
    height: '100%',
  },

  // BOTÓN
  button: {
    marginTop: 10,
    backgroundColor: '#ffffff', // Botón blanco brillante
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#312e81', // Texto oscuro índigo dentro del botón blanco
    fontSize: 16,
    fontWeight: '800',
  },

  // FOOTER
  footerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)',
  },
  registerText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  forgotText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
});