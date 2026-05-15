import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

const ROL_META = {
  decano:             { label: 'Super Administrador', icon: 'ribbon-outline',   color: '#0f172a' },
  director:           { label: 'Director',            icon: 'briefcase-outline', color: '#0369a1' },
  docente:            { label: 'Docente',             icon: 'person-outline',    color: '#0f766e' },
  estudiante:         { label: 'Estudiante',          icon: 'school-outline',    color: '#1e3a5f' },
  centro_estudiantes: { label: 'Centro Estudiantes',  icon: 'people-outline',    color: '#0f172a' },
  centro_facultativo: { label: 'Centro Facultativo',  icon: 'school-outline',    color: '#0369a1' },
};

const getMeta = (r) =>
  ROL_META[r?.toLowerCase()] ?? { label: r, icon: 'person-outline', color: '#64748b' };

export default function RolSwitcher() {
  const { todosLosRoles, rol: rolActivo, seleccionarRol } = useAuth();
  const [switching,   setSwitching]   = useState(null);
  const [pendingRol,  setPendingRol]  = useState(null); // rol esperando confirmación

  if (!todosLosRoles || todosLosRoles.length <= 1) return null;

  const openConfirm = (targetRol) => {
    if (targetRol === rolActivo || switching !== null) return;
    setPendingRol(targetRol);
  };

  const handleConfirm = async () => {
    const targetRol = pendingRol;
    setPendingRol(null);
    try {
      setSwitching(targetRol);
      await seleccionarRol(targetRol);
    } catch (e) {
      // silencioso — el error ya se loguea en el contexto
    } finally {
      setSwitching(null);
    }
  };

  const handleCancel = () => setPendingRol(null);

  const pendingMeta = pendingRol ? getMeta(pendingRol) : null;

  return (
    <>
      {/* ── Modal de confirmación ── */}
      <Modal
        transparent
        visible={Boolean(pendingRol)}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={s.overlay}>
          <View style={s.dialog}>
            {/* Ícono */}
            <View style={[s.dialogIcon, { backgroundColor: pendingMeta?.color + '18' }]}>
              <Ionicons
                name={pendingMeta?.icon ?? 'swap-horizontal-outline'}
                size={28}
                color={pendingMeta?.color ?? '#64748b'}
              />
            </View>

            <Text style={s.dialogTitle}>Cambiar rol</Text>
            <Text style={s.dialogBody}>
              ¿Deseas cambiar al panel de{' '}
              <Text style={[s.dialogRolName, { color: pendingMeta?.color }]}>
                {pendingMeta?.label}
              </Text>
              ?
            </Text>

            <View style={s.dialogActions}>
              <Pressable
                style={({ pressed }) => [s.btnCancel, pressed && { opacity: 0.75 }]}
                onPress={handleCancel}
              >
                <Text style={s.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.btnConfirm,
                  { backgroundColor: pendingMeta?.color ?? '#1e3a5f' },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleConfirm}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                <Text style={s.btnConfirmText}>Cambiar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Lista de roles ── */}
      <View style={s.container}>
        <Text style={s.sectionTitle}>Mis roles</Text>
        <View style={s.card}>
          {todosLosRoles.map((r, idx) => {
            const meta     = getMeta(r);
            const isActive = r === rolActivo;
            const isBusy   = switching === r;

            return (
              <React.Fragment key={r}>
                {idx > 0 && <View style={s.divider} />}
                <Pressable
                  style={({ pressed }) => [
                    s.row,
                    isActive && s.rowActive,
                    pressed && !isActive && { opacity: 0.75 },
                  ]}
                  onPress={() => openConfirm(r)}
                  disabled={isActive || switching !== null}
                >
                  <View style={[s.iconWrap, { backgroundColor: isActive ? meta.color : '#f1f5f9' }]}>
                    <Ionicons
                      name={meta.icon}
                      size={20}
                      color={isActive ? '#fff' : meta.color}
                    />
                  </View>

                  <View style={s.textWrap}>
                    <Text style={[s.rolLabel, isActive && { color: meta.color, fontWeight: '800' }]}>
                      {meta.label}
                    </Text>
                    {isActive && (
                      <Text style={[s.activeBadge, { color: meta.color }]}>Rol activo</Text>
                    )}
                  </View>

                  {isActive ? (
                    <View style={[s.activeDot, { backgroundColor: meta.color }]} />
                  ) : isBusy ? (
                    <ActivityIndicator size="small" color={meta.color} />
                  ) : (
                    <View style={s.switchBtn}>
                      <Ionicons name="swap-horizontal-outline" size={15} color="#64748b" />
                      <Text style={s.switchBtnText}>Cambiar</Text>
                    </View>
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  // ── Modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18, fontWeight: '800', color: '#0f172a',
    marginBottom: 8,
  },
  dialogBody: {
    fontSize: 15, color: '#475569', fontWeight: '500',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  dialogRolName: { fontWeight: '800' },
  dialogActions: {
    flexDirection: 'row', gap: 12, width: '100%',
  },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  btnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  btnConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // ── Lista ──
  container:    { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#64748b',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  rowActive:    { backgroundColor: '#fafbff' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap:     { flex: 1 },
  rolLabel:     { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  activeBadge:  { fontSize: 11, fontWeight: '700', marginTop: 2 },
  activeDot:    { width: 10, height: 10, borderRadius: 5 },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#f1f5f9', borderRadius: 10,
  },
  switchBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
});
