import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getAll, remove } from '../../services/usuarioService';
import getErrorMessage from '../../utils/apiError';
import BottomNav from '../../components/BottomNav';
import HeaderConfigButton from '../../components/HeaderConfigButton';

const ROLES = [
  { key: 'todos', label: 'Todos', color: '#4f46e5' },
  { key: 'director', label: 'Directores', color: '#7c3aed' },
  { key: 'docente', label: 'Docentes', color: '#0f766e' },
  { key: 'estudiante', label: 'Estudiantes', color: '#be123c' },
  { key: 'decano', label: 'Decanos', color: '#1A1A4E' },
  { key: 'centro_facultativo', label: 'C. Facultativo', color: '#0369a1' },
  { key: 'centro_estudiantes', label: 'C. Estudiantes', color: '#c2410c' },
];

const formatRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return 'Sin roles';
  return roles.map((role) => role?.rol ?? role?.name ?? role).join(', ');
};

const getRolesFromItem = (item) => {
  if (item?.rolesUsuario && Array.isArray(item.rolesUsuario)) return item.rolesUsuario;
  if (item?.roles_usuario && Array.isArray(item.roles_usuario)) return item.roles_usuario;
  if (item?.roles && Array.isArray(item.roles)) return item.roles;
  return [];
};

const hasRole = (item, role) => {
  const roles = getRolesFromItem(item);
  return roles.some((r) => (r?.rol ?? r) === role);
};

export default function UsuariosScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAll();
      setUsuarios(data);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'No fue posible cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsuarios();
    }, [loadUsuarios])
  );

  // Estadísticas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const porRol = {};
    usuarios.forEach((u) => {
      const roles = getRolesFromItem(u);
      roles.forEach((r) => {
        const rol = r?.rol ?? r;
        porRol[rol] = (porRol[rol] || 0) + 1;
      });
    });
    return { total, porRol };
  }, [usuarios]);

  // Filtrar usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideRol = filtroRol === 'todos' || hasRole(u, filtroRol);
      const coincideBusqueda =
        !busqueda.trim() ||
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideRol && coincideBusqueda;
    });
  }, [usuarios, filtroRol, busqueda]);

  const handleDelete = (usuario) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(usuario.id);
              loadUsuarios();
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'No fue posible eliminar el usuario.'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A1A4E" />
      </View>
    );
  }

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      {/* Fila Superior: Avatar + Info */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nombre?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
        </View>
      </View>

      {/* Fila Inferior: Roles + Acciones */}
      <View style={styles.cardFooter}>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#4f46e5" />
          <Text style={styles.roleText}>{formatRoles(getRolesFromItem(item))}</Text>
        </View>
        
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => navigation.navigate('UsuarioForm', { usuario: item })}
            style={styles.editButton}
          >
            <Ionicons name="pencil-outline" size={16} color="#4f46e5" />
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header con Estadísticas */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
            <Text style={styles.headerSubtitle}>{stats.total} usuarios totales</Text>
          </View>
          <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('UsuarioForm')}>
            <Ionicons name="add-circle" size={28} color="#ffffff" />
          </Pressable>
          <HeaderConfigButton navigation={navigation} />
        </View>

        {/* Tarjetas de Estadísticas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
          {ROLES.slice(1, 4).map((rol) => (
            <View key={rol.key} style={[styles.statCard, { borderLeftColor: rol.color, borderLeftWidth: 4 }]}>
              <Text style={[styles.statNumber, { color: rol.color }]}>{stats.porRol[rol.key] || 0}</Text>
              <Text style={styles.statLabel}>{rol.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <Pressable onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {/* Filtros por Rol */}
      <View style={styles.filterContainer}>
        {ROLES.map((rol) => {
          const isActive = filtroRol === rol.key;
          return (
            <Pressable
              key={rol.key}
              onPress={() => setFiltroRol(rol.key)}
              style={[styles.filterChip, isActive && { backgroundColor: rol.color }]}
            >
              <Text style={[styles.filterChipText, isActive && { color: '#ffffff' }]}>{rol.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={usuariosFiltrados}
        keyExtractor={(item) => `${item.id}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {busqueda.trim() ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </Text>
            <Text style={styles.emptySubtext}>
              {busqueda.trim() ? 'Intenta con otra búsqueda' : 'Presiona el botón "+" para agregar uno nuevo'}
            </Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* FAB Moderno */}
      <Pressable
        onPress={() => navigation.navigate('UsuarioForm')}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <BottomNav navigation={navigation} activeScreen="Usuarios" />
    </SafeAreaView>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  
  // HEADER SÓLIDO
  header: {
    backgroundColor: '#232C57',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  headerTextBlock: {
    flex: 1,
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
  headerIcon: {
    padding: 4,
  },

  // ESTADÍSTICAS
  statsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },

  // BÚSQUEDA
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    paddingVertical: 2,
  },

  // FILTROS
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  // LISTA
  listContent: {
    padding: 20,
    paddingBottom: 120, // Espacio para FAB y BottomNav
  },

  // TARJETAS DE USUARIO
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#eef2ff', // Fondo suave indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4f46e5',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  cardEmail: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginRight: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#6d28d9',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // BOTONES DE ACCIÓN
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 6,
  },

  // ESTADO VACÍO
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 90, // Encima del BottomNav
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A4E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};
