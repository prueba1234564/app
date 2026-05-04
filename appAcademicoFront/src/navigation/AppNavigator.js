import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SeleccionarRolScreen from '../screens/auth/SeleccionarRolScreen';
import CarreraFormScreen from '../screens/decano/CarreraFormScreen';
import CarrerasScreen from '../screens/decano/CarrerasScreen';
import DashboardDecano from '../screens/decano/DashboardDecano';
import FacultadFormScreen from '../screens/decano/FacultadFormScreen';
import FacultadesScreen from '../screens/decano/FacultadesScreen';
import MateriaFormScreen from '../screens/decano/MateriaFormScreen';
import MateriasScreen from '../screens/decano/MateriasScreen';
import NotificacionesScreen from '../screens/decano/NotificacionesScreen';
import UsuarioFormScreen from '../screens/decano/UsuarioFormScreen';
import UsuariosScreen from '../screens/decano/UsuariosScreen';
import ConfigScreen from '../screens/decano/ConfigScreen';
import ActividadesScreen from '../screens/decano/ActividadesScreen';
import PeriodosScreen from '../screens/decano/PeriodosScreen';
import ResumenPeriodoScreen from '../screens/decano/ResumenPeriodoScreen';

import DashboardDirector from '../screens/director/DashboardDirector';
import DirectorActividadesScreen from '../screens/director/ActividadesScreen';
import DirectorMateriasScreen from '../screens/director/MateriasScreen';
import DirectorMateriaFormScreen from '../screens/director/MateriaFormScreen';
import DirectorUsuariosScreen from '../screens/director/UsuariosScreen';
import DirectorUsuarioFormScreen from '../screens/director/UsuarioFormScreen';
import DirectorNotificacionesScreen from '../screens/director/NotificacionesScreen';
import DirectorConfigScreen from '../screens/director/ConfigScreen';
import MateriaPeriodoScreen from '../screens/director/MateriaPeriodoScreen';
import ActividadFormScreen from '../screens/docente/ActividadFormScreen';
import ActividadesDocenteScreen from '../screens/docente/ActividadesDocenteScreen';
import DashboardDocente from '../screens/docente/DashboardDocente';
import DetalleMateriaScreen from '../screens/docente/DetalleMateriaScreen';
import MateriasDocenteScreen from '../screens/docente/MateriasDocenteScreen';
import NotificacionFormScreen from '../screens/docente/NotificacionFormScreen';
import NotificacionesDocenteScreen from '../screens/docente/NotificacionesDocenteScreen';
import PerfilDocenteScreen from '../screens/docente/PerfilDocenteScreen';
import HistorialScreen from '../screens/docente/HistorialScreen';

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0f766e" />
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="SeleccionarRol"
        component={SeleccionarRolScreen}
        options={{ headerShown: true, title: 'Seleccionar rol' }}
      />
    </Stack.Navigator>
  );
}

function DirectorStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardDirector"
        component={DashboardDirector}
        options={{ title: 'Dashboard del Director' }}
      />
      <Stack.Screen name="Materias" component={DirectorMateriasScreen} options={{ title: 'Gestión de Materias' }} />
      <Stack.Screen name="MateriaForm" component={DirectorMateriaFormScreen} options={{ title: 'Formulario de Materia' }} />
      <Stack.Screen name="Usuarios" component={DirectorUsuariosScreen} options={{ title: 'Gestión de Usuarios' }} />
      <Stack.Screen name="UsuarioForm" component={DirectorUsuarioFormScreen} options={{ title: 'Formulario de Usuario' }} />
      <Stack.Screen name="Notificaciones" component={DirectorNotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Actividades" component={DirectorActividadesScreen} options={{ title: 'Actividades' }} />
      <Stack.Screen name="MateriaPeriodo" component={MateriaPeriodoScreen} options={{ title: 'Materias del Periodo' }} />
      <Stack.Screen name="Config" component={DirectorConfigScreen} options={{ title: 'Mi Perfil' }} />
    </Stack.Navigator>
  );
}

function DocenteStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardDocente"
        component={DashboardDocente}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MateriasDocente" component={MateriasDocenteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DetalleMateria" component={DetalleMateriaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ActividadForm" component={ActividadFormScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ActividadesDocente" component={ActividadesDocenteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificacionesDocente" component={NotificacionesDocenteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificacionForm" component={NotificacionFormScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PerfilDocente" component={PerfilDocenteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HistorialDocente" component={HistorialScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function DecanoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardDecano"
        component={DashboardDecano}
        options={{ title: 'Dashboard del Decano' }}
      />
      <Stack.Screen name="Facultades" component={FacultadesScreen} options={{ title: 'Gestion de Facultades' }} />
      <Stack.Screen name="FacultadForm" component={FacultadFormScreen} options={{ title: 'Formulario de Facultad' }} />
      <Stack.Screen name="Carreras" component={CarrerasScreen} options={{ title: 'Gestion de Carreras' }} />
      <Stack.Screen name="CarreraForm" component={CarreraFormScreen} options={{ title: 'Formulario de Carrera' }} />
      <Stack.Screen name="Materias" component={MateriasScreen} options={{ title: 'Gestion de Materias' }} />
      <Stack.Screen name="MateriaForm" component={MateriaFormScreen} options={{ title: 'Formulario de Materia' }} />
      <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Gestion de Usuarios' }} />
      <Stack.Screen name="UsuarioForm" component={UsuarioFormScreen} options={{ title: 'Formulario de Usuario' }} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Actividades" component={ActividadesScreen} options={{ title: 'Gestión de Actividades' }} />
      <Stack.Screen name="Config" component={ConfigScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="Periodos" component={PeriodosScreen} options={{ title: 'Gestión de Períodos' }} />
      <Stack.Screen name="ResumenPeriodo" component={ResumenPeriodoScreen} options={{ title: 'Resumen del Periodo' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, rol, pendingRoles } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : pendingRoles.length > 1 && !rol ? (
        <AuthStack />
      ) : rol?.toLowerCase() === 'decano' ? (
        <DecanoStack />
      ) : rol?.toLowerCase() === 'director' ? (
        <DirectorStack />
      ) : rol?.toLowerCase() === 'docente' ? (
        <DocenteStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});
