import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getMisNotificaciones, marcarLeida } from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY = '#1e3a5f';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificacionesEstudianteScreen({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setNotificaciones(await getMisNotificaciones());
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openDetail = async (item) => {
    const readItem = { ...item, leida: true, leido_en: item.leido_en || new Date().toISOString() };
    setDetalle(readItem);

    if (item.leida) return;

    // Optimistic update
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === item.id ? readItem : n)),
    );

    try {
      const result = await marcarLeida(item.id);
      const updated = { ...readItem, leido_en: result?.leido_en || readItem.leido_en };
      setDetalle((cur) => (cur?.id === item.id ? updated : cur));
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === item.id ? updated : n)),
      );
    } catch (e) {
      console.log('Error marcando notificación como leída:', e?.response?.data || e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <Text style={styles.headerSubtitle}>Comunicados recibidos</Text>
        </View>
        {notificaciones.filter((n) => !n.leida).length > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {notificaciones.filter((n) => !n.leida).length}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySub}>Aquí aparecerán los comunicados que recibas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={() => openDetail(item)} />
        )}
      />

      {/* Detail modal */}
      <Modal
        visible={!!detalle}
        transparent
        animationType="fade"
        onRequestClose={() => setDetalle(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetalle(null)}>
          <Pressable style={styles.detailModal} onPress={(e) => e.stopPropagation()}>
            <Pressable style={styles.closeButton} onPress={() => setDetalle(null)}>
              <Ionicons name="close-outline" size={24} color="#64748b" />
            </Pressable>
            <ScrollView
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailHeader}>
                <View style={styles.detailIcon}>
                  <Ionicons name="notifications" size={22} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{detalle?.titulo}</Text>
                  <Text style={styles.detailDate}>{formatDate(detalle?.created_at)}</Text>
                </View>
              </View>

              <View style={[styles.readPill, styles.readPillRead]}>
                <Ionicons name="checkmark-done-outline" size={14} color="#059669" />
                <Text style={[styles.readPillText, styles.readPillTextRead]}>Leída</Text>
              </View>

              <Text style={styles.detailLabel}>Mensaje</Text>
              <View style={styles.messageBox}>
                <Text style={styles.detailBody}>{detalle?.cuerpo}</Text>
              </View>

              {!!detalle?.ruta_archivo && (
                <View style={styles.attachmentBox}>
                  <Ionicons name="attach-outline" size={18} color="#4f46e5" />
                  <Text style={styles.attachmentText} numberOfLines={1}>
                    {detalle.ruta_archivo.split('/').pop()}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <EstudianteBottomNav navigation={navigation} active="NotificacionesEstudiante" />
    </SafeAreaView>
  );
}

function NotificationCard({ item, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !item.leida && styles.cardUnread,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Ionicons name="notifications-outline" size={22} color={PRIMARY} />
          {!item.leida && <View style={styles.unreadDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.titulo}</Text>
          <Text style={styles.body} numberOfLines={3}>{item.cuerpo}</Text>
        </View>
        {!!item.ruta_archivo && (
          <Ionicons name="attach-outline" size={22} color="#64748b" />
        )}
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.readPill, item.leida ? styles.readPillRead : styles.readPillUnread]}>
          <Ionicons
            name={item.leida ? 'checkmark-done-outline' : 'ellipse'}
            size={11}
            color={item.leida ? '#059669' : '#dc2626'}
          />
          <Text style={[styles.readPillText, item.leida ? styles.readPillTextRead : styles.readPillTextUnread]}>
            {item.leida ? 'Leída' : 'No leída'}
          </Text>
        </View>
        <Text style={styles.meta}>{formatDate(item.created_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: PRIMARY, padding: 24, paddingTop: 28, paddingBottom: 30,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 6, fontWeight: '600' },
  unreadBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  cardUnread: { borderWidth: 1.5, borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: -3, right: -3,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#ffffff',
  },
  title: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  body: { color: '#64748b', marginTop: 5, lineHeight: 19 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10, marginTop: 12,
  },
  readPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
  },
  readPillUnread: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  readPillRead: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  readPillText: { fontSize: 11, fontWeight: '900' },
  readPillTextUnread: { color: '#dc2626' },
  readPillTextRead: { color: '#059669' },
  meta: { color: '#94a3b8', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#64748b', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', justifyContent: 'flex-end' },
  detailModal: {
    width: '100%', maxHeight: '86%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute', top: 14, right: 16, zIndex: 5,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9',
  },
  detailContent: { padding: 22, paddingTop: 26, paddingBottom: 32 },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 16, paddingRight: 42,
  },
  detailIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f0fe',
  },
  detailTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900', lineHeight: 26 },
  detailDate: { color: '#94a3b8', fontWeight: '700', marginTop: 4 },
  detailLabel: {
    color: '#475569', fontSize: 13, fontWeight: '900',
    textTransform: 'uppercase', marginTop: 18, marginBottom: 8,
  },
  messageBox: {
    backgroundColor: '#f8fafc', borderWidth: 1,
    borderColor: '#e2e8f0', borderRadius: 16, padding: 16,
  },
  detailBody: { color: '#334155', fontSize: 15, lineHeight: 22 },
  attachmentBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe',
    borderRadius: 14, padding: 14,
  },
  attachmentText: { color: '#4f46e5', fontWeight: '800', flex: 1 },
});
