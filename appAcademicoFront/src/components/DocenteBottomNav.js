import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ITEMS = [
  { name: 'Dashboard',    icon: 'home',          route: 'DashboardDocente' },
  { name: 'Materias',     icon: 'book',          route: 'MateriasDocente' },
  { name: 'Actividades',  icon: 'calendar',      route: 'ActividadesDocente' },
  { name: 'Avisos',       icon: 'notifications', route: 'NotificacionesDocente' },
  { name: 'Perfil',       icon: 'person',        route: 'PerfilDocente' },
];

export default function DocenteBottomNav({ navigation, active }) {
  return (
    <View style={styles.nav}>
      {ITEMS.map((item) => {
        const selected = active === item.route;
        return (
          <Pressable key={item.route} style={[styles.item, selected && styles.itemActive]} onPress={() => navigation.navigate(item.route)}>
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Ionicons name={selected ? item.icon : `${item.icon}-outline`} size={22} color={selected ? '#2E86AB' : '#64748b'} />
            </View>
            <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 16 },
  itemActive: { backgroundColor: '#eff6ff' },
  iconWrap: { width: 38, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  iconWrapActive: { backgroundColor: '#dbeafe' },
  label: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  labelActive: { color: '#2E86AB' },
});
