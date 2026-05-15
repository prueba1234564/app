import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#0369a1';

const ITEMS = [
  { name: 'Inicio',       icon: 'home',           route: 'DashboardFacultativo' },
  { name: 'Docentes',     icon: 'person',         route: 'DocentesFacultativo' },
  { name: 'Actividades',  icon: 'checkmark-done', route: 'ActividadesFacultativo' },
  { name: 'Periodos',     icon: 'calendar',       route: 'PeriodosFacultativo' },
  { name: 'Notificar',    icon: 'notifications',  route: 'NotificacionFacultativo' },
  { name: 'Perfil',       icon: 'person-circle',  route: 'PerfilFacultativo' },
];

export default function CentroFacultativoBottomNav({ navigation, active }) {
  return (
    <View style={styles.nav}>
      {ITEMS.map((item) => {
        const selected = active === item.route;
        return (
          <Pressable
            key={item.route}
            style={[styles.item, selected && styles.itemActive]}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
              <Ionicons
                name={selected ? item.icon : `${item.icon}-outline`}
                size={22}
                color={selected ? PRIMARY : '#64748b'}
              />
            </View>
            <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  item:           { flex: 1, alignItems: 'center', paddingVertical: 3, borderRadius: 14 },
  itemActive:     { backgroundColor: '#e0f2fe' },
  iconWrap:       { width: 34, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  iconWrapActive: { backgroundColor: '#bae6fd' },
  label:          { fontSize: 9, color: '#64748b', fontWeight: '600', marginTop: 1 },
  labelActive:    { color: PRIMARY, fontWeight: '700' },
});
