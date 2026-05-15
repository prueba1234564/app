import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getEnviadas, getRecibidas, markAsRead } from '../../services/notificacionService';
import DocenteBottomNav from '../../components/DocenteBottomNav';

export default function NotificacionesDocenteScreen({ navigation }) {
  const [active, setActive] = useState('recibidas');
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rec, env] = await Promise.all([getRecibidas(), getEnviadas()]);
      setRecibidas(rec);
      setEnviadas(env);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const data = active === 'recibidas' ? recibidas : enviadas;

  const openDetail = async (item) => {
    const readItem = { ...item, leida: true, leido_en: item.leido_en || new Date().toISOString() };
    setDetalle(readItem);

    if (active !== 'recibidas' || item.leida) return;

    setRecibidas((prev) => prev.map((notif) => notif.id === item.id ? readItem : notif));

    try {
      const result = await markAsRead(item.id);
      const updatedItem = { ...readItem, leido_en: result?.leido_en || readItem.leido_en };
      setDetalle((current) => current?.id === item.id ? updatedItem : current);
      setRecibidas((prev) => prev.map((notif) => notif.id === item.id ? updatedItem : notif));
    } catch (error) {
      console.log('Error marcando notificación como leída:', error?.response?.data || error.message);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#2E86AB" /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <Text style={styles.headerSubtitle}>Comunicados recibidos y enviados</Text>
        </View>
        <Pressable style={styles.newButton} onPress={() => navigation.navigate('NotificacionForm')}>
          <Ionicons name="create-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, active === 'recibidas' && styles.tabActive]} onPress={() => setActive('recibidas')}><Text style={[styles.tabText, active === 'recibidas' && styles.tabTextActive]}>Recibidas</Text></Pressable>
        <Pressable style={[styles.tab, active === 'enviadas' && styles.tabActive]} onPress={() => setActive('enviadas')}><Text style={[styles.tabText, active === 'enviadas' && styles.tabTextActive]}>Enviadas</Text></Pressable>
      </View>

      <Pressable style={styles.composeButton} onPress={() => navigation.navigate('NotificacionForm')}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.composeText}>Nueva Notificación</Text>
      </Pressable>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No hay notificaciones {active}.</Text></View>}
        renderItem={({ item }) => <NotificationCard item={item} active={active} onPress={() => openDetail(item)} />}
      />

      <Modal visible={!!detalle} transparent animationType="fade" onRequestClose={() => setDetalle(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDetalle(null)}>
          <Pressable style={styles.detailModal} onPress={(event) => event.stopPropagation()}>
            <Pressable style={styles.closeButton} onPress={() => setDetalle(null)}>
              <Ionicons name="close-outline" size={24} color="#64748b" />
            </Pressable>
            <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={styles.detailIcon}>
                  <Ionicons name="notifications" size={22} color="#2E86AB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{detalle?.titulo}</Text>
                  <Text style={styles.detailDate}>{formatDate(detalle?.created_at)}</Text>
                </View>
              </View>

              {active === 'recibidas' && (
                <View style={[styles.readPill, styles.readPillRead]}>
                  <Ionicons name="checkmark-done-outline" size={14} color="#059669" />
                  <Text style={[styles.readPillText, styles.readPillTextRead]}>Leída</Text>
                </View>
              )}

              <Text style={styles.detailLabel}>Mensaje</Text>
              <View style={styles.messageBox}>
                <Text style={styles.detailBody}>{detalle?.cuerpo}</Text>
              </View>

              {!!detalle?.ruta_archivo && (
                <View style={styles.attachmentBox}>
                  <Ionicons name="attach-outline" size={18} color="#4f46e5" />
                  <Text style={styles.attachmentText} numberOfLines={1}>{detalle.ruta_archivo.split('/').pop()}</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <DocenteBottomNav navigation={navigation} active="NotificacionesDocente" />
    </SafeAreaView>
  );
}

function NotificationCard({ item, active, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, active === 'recibidas' && !item.leida && styles.cardUnread, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Ionicons name="notifications-outline" size={22} color="#2E86AB" />
          {active === 'recibidas' && !item.leida && <View style={styles.unreadDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.titulo}</Text>
          <Text style={styles.body} numberOfLines={3}>{item.cuerpo}</Text>
        </View>
        {!!item.ruta_archivo && <Ionicons name="attach-outline" size={22} color="#64748b" />}
      </View>
      <View style={styles.cardFooter}>
        {active === 'recibidas' && (
          <View style={[styles.readPill, item.leida ? styles.readPillRead : styles.readPillUnread]}>
            <Ionicons name={item.leida ? 'checkmark-done-outline' : 'ellipse'} size={11} color={item.leida ? '#059669' : '#dc2626'} />
            <Text style={[styles.readPillText, item.leida ? styles.readPillTextRead : styles.readPillTextUnread]}>
              {item.leida ? 'Leída' : 'No leída'}
            </Text>
          </View>
        )}
        <Text style={styles.meta}>{formatDate(item.created_at)}</Text>
      </View>
    </Pressable>
  );
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#232C57', padding: 24, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#c7d2fe', marginTop: 6, fontWeight: '600' },
  newButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', padding: 8, margin: 20, marginBottom: 10, backgroundColor: '#e2e8f0', borderRadius: 18 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: '#64748b', fontWeight: '900' },
  tabTextActive: { color: '#232C57' },
  composeButton: { marginHorizontal: 20, marginBottom: 14, backgroundColor: '#2E86AB', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  composeText: { color: '#fff', fontWeight: '900' },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardUnread: { borderWidth: 1.5, borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadDot: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#ffffff' },
  title: { color: '#0f172a', fontWeight: '900', fontSize: 16 },
  body: { color: '#64748b', marginTop: 5, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  readPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  readPillUnread: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  readPillRead: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  readPillText: { fontSize: 11, fontWeight: '900' },
  readPillTextUnread: { color: '#dc2626' },
  readPillTextRead: { color: '#059669' },
  meta: { color: '#94a3b8', fontWeight: '700' },
  empty: { backgroundColor: '#fff', borderRadius: 18, padding: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', justifyContent: 'flex-end' },
  detailModal: { width: '100%', maxHeight: '86%', backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  closeButton: { position: 'absolute', top: 14, right: 16, zIndex: 5, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  detailContent: { padding: 22, paddingTop: 26, paddingBottom: 32 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingRight: 42 },
  detailIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
  detailTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900', lineHeight: 26 },
  detailDate: { color: '#94a3b8', fontWeight: '700', marginTop: 4 },
  detailLabel: { color: '#475569', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
  messageBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16 },
  detailBody: { color: '#334155', fontSize: 15, lineHeight: 22 },
  attachmentBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 14, padding: 14 },
  attachmentText: { color: '#4f46e5', fontWeight: '800', flex: 1 },
});
