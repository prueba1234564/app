import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Iconos vectoriales

import { useAuth } from '../../context/AuthContext';
// import styles from './styles'; // <-- Comentado para usar estilos en línea
import BottomNav from '../../components/BottomNav';
import RolSwitcher from '../../components/RolSwitcher';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';

export default function ConfigScreen({ navigation }) {
  const { usuario, logout, rol } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const nombre = usuario?.nombre || 'Usuario';
  const email = usuario?.email || 'Sin email';

  // Get role from useAuth context
  const userRole = rol || usuario?.rol || usuario?.roles?.[0]?.rol || usuario?.roles?.[0]?.nombre || 'Usuario';

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'decano': 'Super Administrador',
      'director': 'Administrador',
      'centro_facultativo': 'Centro Facultativo',
      'centro_estudiantes': 'Centro de Estudiantes',
      'docente': 'Docente',
      'estudiante': 'Estudiante',
    };
    return roleMap[role] || role || 'Usuario';
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/usuarios/cambiar-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.data.success) {
        Alert.alert('Éxito', 'Contraseña actualizada correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        Alert.alert('Error', response.data.message || 'No se pudo actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      Alert.alert('Error', 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    Promise.resolve(logout());
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Modal
        transparent
        visible={showLogoutConfirm}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            <Text style={styles.modalText}>¿Estás seguro de que deseas cerrar sesión?</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalConfirm]} onPress={confirmLogout}>
                <Text style={styles.modalConfirmText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Sólido Premium */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>Gestiona tu información y seguridad</Text>
        </View>

        {/* Avatar y Nombre Principal */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{nombre}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <View style={styles.rolBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#4f46e5" />
              <Text style={styles.rolText}>
                {getRoleDisplayName(userRole)}
              </Text>
            </View>
          </View>
          <View style={styles.editIconContainer}>
            <Ionicons name="create-outline" size={20} color="#94a3b8" />
          </View>
        </View>

        {/* Información de la cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="person-outline" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.infoLabel}>Nombre</Text>
              </View>
              <Text style={styles.infoValue}>{nombre}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="mail-outline" size={18} color="#22c55e" />
                </View>
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{email}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <View style={[styles.infoIconBg, { backgroundColor: '#f5f3ff' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.infoLabel}>Rol</Text>
              </View>
              <Text style={styles.infoValue}>
                {getRoleDisplayName(userRole)}
              </Text>
            </View>
          </View>
        </View>

        {/* Roles disponibles */}
        <RolSwitcher />

        {/* Cambiar contraseña */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          
          <Pressable
            style={styles.passwordToggleCard}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
          >
            <View style={styles.passwordToggleLeft}>
              <View style={styles.passwordToggleIconBg}>
                <Ionicons name="lock-closed-outline" size={22} color="#4f46e5" />
              </View>
              <View>
                <Text style={styles.passwordToggleTitle}>Contraseña</Text>
                <Text style={styles.passwordToggleSubtext}>
                  {showPasswordForm ? 'Ocultar formulario' : 'Actualiza tu contraseña de acceso'}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={showPasswordForm ? "chevron-up" : "chevron-forward"} 
              size={22} 
              color="#94a3b8" 
            />
          </Pressable>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              {/* Input con ícono integrado */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña actual"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-open-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <Pressable 
                style={[styles.saveButton, loading && { opacity: 0.7 }]} 
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Guardar Contraseña</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Cerrar sesión */}
        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </Pressable>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNav navigation={navigation} activeScreen="Config" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // HEADER SÓLIDO
  header: {
    backgroundColor: '#1A1A4E',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#c7d2fe',
    fontWeight: '500',
  },

  // PROFILE CARD
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff', // Fondo índigo suave
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4f46e5', // Texto índigo
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  rolText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  editIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SECTIONS
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // INFO CARD (Cuenta)
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 60, // Empieza después de los iconos
  },

  // SECURITY SECTION
  passwordToggleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  passwordToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  passwordToggleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  passwordToggleSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  
  passwordForm: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 4,
    borderTopColor: '#4f46e5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    height: '100%',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },

  // LOGOUT
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalCancel: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modalConfirm: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  modalCancelText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});