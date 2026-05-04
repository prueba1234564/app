import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

const DECANO_NAV_ITEMS = [
  { name: 'Dashboard', iconName: 'stats-chart', route: 'DashboardDecano' },
  { name: 'Carreras', iconName: 'school', route: 'Carreras' },
  { name: 'Materias', iconName: 'library', route: 'Materias' },
  { name: 'Usuarios', iconName: 'people', route: 'Usuarios' },
  { name: 'Notificaciones', iconName: 'notifications', route: 'Notificaciones' },
];

const DIRECTOR_NAV_ITEMS = [
  { name: 'Dashboard',   iconName: 'stats-chart',   route: 'DashboardDirector' },
  { name: 'Materias',    iconName: 'library',       route: 'Materias' },
  { name: 'Periodo',     iconName: 'time',          route: 'MateriaPeriodo' },
  { name: 'Avisos',      iconName: 'notifications', route: 'Notificaciones' },
  { name: 'Usuarios',    iconName: 'people',        route: 'Usuarios' },
  { name: 'Perfil',      iconName: 'person-circle', route: 'Config' },
];

export default function BottomNav({ navigation, activeScreen }) {
  const { rol } = useAuth();
  const rolNormalized = String(rol ?? '').trim().toLowerCase();
  const isDirector = rolNormalized === 'director' || rolNormalized === 'administrador';
  const navItems = isDirector ? DIRECTOR_NAV_ITEMS : DECANO_NAV_ITEMS;

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = activeScreen === item.route;
        return (
          <Pressable
            key={item.name}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => navigation.navigate(item.route)}>
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <Ionicons
                name={isActive ? item.iconName : item.iconName + '-outline'}
                size={22}
                color={isActive ? '#3b82f6' : '#64748b'}
              />
            </View>
            <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeNavItem: {
    backgroundColor: '#eff6ff',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: '#dbeafe',
  },
  navLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
