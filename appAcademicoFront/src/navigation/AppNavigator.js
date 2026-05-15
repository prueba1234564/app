import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SeleccionarRolScreen from '../screens/auth/SeleccionarRolScreen';
import RegistroEstudianteScreen from '../screens/auth/RegistroEstudianteScreen';
import RecuperarPasswordScreen from '../screens/auth/RecuperarPasswordScreen';
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
import PeriodosDirectorScreen from '../screens/director/PeriodosDirectorScreen';
import ActividadFormScreen from '../screens/docente/ActividadFormScreen';
import ActividadesDocenteScreen from '../screens/docente/ActividadesDocenteScreen';
import DashboardDocente from '../screens/docente/DashboardDocente';
import DetalleMateriaScreen from '../screens/docente/DetalleMateriaScreen';
import MateriasDocenteScreen from '../screens/docente/MateriasDocenteScreen';
import NotificacionFormScreen from '../screens/docente/NotificacionFormScreen';
import NotificacionesDocenteScreen from '../screens/docente/NotificacionesDocenteScreen';
import PerfilDocenteScreen from '../screens/docente/PerfilDocenteScreen';
import HistorialScreen from '../screens/docente/HistorialScreen';

import DashboardEstudiante from '../screens/estudiante/DashboardEstudiante';
import MateriasEstudianteScreen from '../screens/estudiante/MateriasEstudianteScreen';
import ActividadesEstudianteScreen from '../screens/estudiante/ActividadesEstudianteScreen';
import NotificacionesEstudianteScreen from '../screens/estudiante/NotificacionesEstudianteScreen';
import PerfilEstudianteScreen from '../screens/estudiante/PerfilEstudianteScreen';
import HorarioEstudianteScreen from '../screens/estudiante/HorarioEstudianteScreen';
import InscripcionesScreen from '../screens/estudiante/InscripcionesScreen';
import CalendarioEstudianteScreen from '../screens/estudiante/CalendarioEstudianteScreen';

import DashboardCentroEstudiantes from '../screens/centroEstudiantes/DashboardCentroEstudiantes';
import PerfilCentroEstudiantesScreen from '../screens/centroEstudiantes/PerfilCentroEstudiantesScreen';
import DocentesCentroScreen from '../screens/centroEstudiantes/DocentesScreen';
import ActividadesCentroScreen from '../screens/centroEstudiantes/ActividadesCentroScreen';
import NotificacionCentroScreen from '../screens/centroEstudiantes/NotificacionCentroScreen';
import PeriodosCentroScreen from '../screens/centroEstudiantes/PeriodosCentroScreen';

import DashboardCentroFacultativo from '../screens/centroFacultativo/DashboardCentroFacultativo';
import PerfilCentroFacultativoScreen from '../screens/centroFacultativo/PerfilCentroFacultativoScreen';
import DocentesCentroFacultativoScreen from '../screens/centroFacultativo/DocentesCentroFacultativoScreen';
import ActividadesCentroFacultativoScreen from '../screens/centroFacultativo/ActividadesCentroFacultativoScreen';
import NotificacionCentroFacultativoScreen from '../screens/centroFacultativo/NotificacionCentroFacultativoScreen';
import PeriodosCentroFacultativoScreen from '../screens/centroFacultativo/PeriodosCentroFacultativoScreen';

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
      <Stack.Screen name="RegistroEstudiante" component={RegistroEstudianteScreen} />
      <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
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
      <Stack.Screen name="PeriodosDirector" component={PeriodosDirectorScreen} options={{ title: 'Períodos de Carrera' }} />
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

function EstudianteStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardEstudiante"    component={DashboardEstudiante}           options={{ headerShown: false }} />
      <Stack.Screen name="MateriasEstudiante"     component={MateriasEstudianteScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="HorarioEstudiante"      component={HorarioEstudianteScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="CalendarioEstudiante"   component={CalendarioEstudianteScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="ActividadesEstudiante"  component={ActividadesEstudianteScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="NotificacionesEstudiante" component={NotificacionesEstudianteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PerfilEstudiante"       component={PerfilEstudianteScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="InscripcionesEstudiante" component={InscripcionesScreen}          options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function CentroEstudiantesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardCentro"    component={DashboardCentroEstudiantes}  options={{ headerShown: false }} />
      <Stack.Screen name="PerfilCentro"       component={PerfilCentroEstudiantesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DocentesCentro"     component={DocentesCentroScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="ActividadesCentro"  component={ActividadesCentroScreen}     options={{ headerShown: false }} />
      <Stack.Screen name="NotificacionCentro" component={NotificacionCentroScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="PeriodosCentro"     component={PeriodosCentroScreen}        options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function CentroFacultativoStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardFacultativo"
        component={DashboardCentroFacultativo}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DocentesFacultativo"
        component={DocentesCentroFacultativoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActividadesFacultativo"
        component={ActividadesCentroFacultativoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificacionFacultativo"
        component={NotificacionCentroFacultativoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PeriodosFacultativo"
        component={PeriodosCentroFacultativoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PerfilFacultativo"
        component={PerfilCentroFacultativoScreen}
        options={{ headerShown: false }}
      />
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

  const rolNorm = rol?.toLowerCase() ?? '';

  const renderStack = () => {
    if (!isAuthenticated) return <AuthStack />;
    if (pendingRoles.length > 1 && !rol) return <AuthStack />;
    if (rolNorm === 'decano')             return <DecanoStack />;
    if (rolNorm === 'director')           return <DirectorStack />;
    if (rolNorm === 'docente')            return <DocenteStack />;
    if (rolNorm === 'estudiante')         return <EstudianteStack />;
    if (rolNorm === 'centro_estudiantes') return <CentroEstudiantesStack />;
    if (rolNorm === 'centro_facultativo') return <CentroFacultativoStack />;
    return <AuthStack />;
  };

  return (
    <NavigationContainer key={`nav-${rolNorm || 'auth'}`}>
      {renderStack()}
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
