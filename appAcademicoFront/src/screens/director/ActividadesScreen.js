import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";

import BottomNav from "../../components/BottomNav";
import { getAll, create, update, remove } from "../../services/actividadService";
import { useAuth } from "../../context/AuthContext";
import getErrorMessage from "../../utils/apiError";

// El director gestiona actividades institucionales de su carrera (no académicas de materia)
const CATEGORIAS = [
  { label: "Evento",       value: "evento",       icon: "calendar",  color: "#3b82f6" },
  { label: "Comunicado",   value: "comunicado",   icon: "megaphone", color: "#10b981" },
];

// El director puede dirigir a todos, docentes o estudiantes
const ROLES_DESTINO = [
  { label: "Todos",        value: "todos" },
  { label: "Docentes",     value: "docentes" },
  { label: "Estudiantes",  value: "estudiantes" },
];

const getCategoriaStyle = (categoria) => {
  const map = {
    evento:     { bg: "#dbeafe", text: "#2563eb", icon: "calendar" },
    comunicado: { bg: "#d1fae5", text: "#059669", icon: "megaphone" },
    // estilos de solo lectura para actividades creadas por docentes
    parcial:    { bg: "#fee2e2", text: "#dc2626", icon: "document-text" },
    tarea:      { bg: "#fef3c7", text: "#d97706", icon: "pencil" },
    proyecto:   { bg: "#ede9fe", text: "#0f172a", icon: "construct" },
  };
  return map[categoria] || map.comunicado;
};

export default function ActividadesScreen({ navigation }) {
  const { usuario } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("evento");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [rolDestino, setRolDestino] = useState("todos");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroCategoria ? { categoria: filtroCategoria } : {};
      const data = await getAll(params);
      setActividades(data);
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "No fue posible cargar las actividades."));
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setCategoria("evento");
    setFechaEntrega("");
    setShowDatePicker(false);
    setRolDestino("todos");
    setArchivo(null);
    setActividadEditando(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (actividad) => {
    setActividadEditando(actividad);
    setTitulo(actividad.titulo);
    setDescripcion(actividad.descripcion || "");
    setCategoria(actividad.categoria);
    setFechaEntrega(actividad.fecha_entrega ? actividad.fecha_entrega.split("T")[0] : "");
    setRolDestino(actividad.rol_destino || "todos");
    setArchivo(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El titulo es obligatorio.");
      return;
    }
    try {
      setGuardando(true);
      const data = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        categoria,
        fecha_entrega: fechaEntrega || null,
        rol_destino: rolDestino,
      };
      if (archivo) data.archivo = archivo;

      if (actividadEditando) {
        await update(actividadEditando.id, data);
        Alert.alert("Exito", "Actividad actualizada correctamente.");
      } else {
        await create(data);
        Alert.alert("Exito", "Actividad creada. Se envio una notificacion automatica a los estudiantes.");
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      Alert.alert("Error", getErrorMessage(error, "No fue posible guardar la actividad."));
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = (actividad) => {
    Alert.alert(
      "Eliminar actividad",
      `Deseas eliminar "${actividad.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(actividad.id);
              loadData();
            } catch (error) {
              Alert.alert("Error", getErrorMessage(error, "No fue posible eliminar la actividad."));
            }
          },
        },
      ]
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setArchivo({ uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  };

  const renderActividad = ({ item }) => {
    const cs = getCategoriaStyle(item.categoria);
    const fecha = item.fecha_entrega
      ? new Date(item.fecha_entrega).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
      : null;
    return (
      <Pressable style={styles.card} onPress={() => setActividadDetalle(item)}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoriaBadge, { backgroundColor: cs.bg }]}>
            <Ionicons name={cs.icon} size={14} color={cs.text} />
            <Text style={[styles.categoriaText, { color: cs.text }]}>
              {CATEGORIAS.find((c) => c.value === item.categoria)?.label || item.categoria}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => handleEdit(item)} style={styles.actionBtn}>
              <Ionicons name="pencil" size={18} color="#3b82f6" />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Ionicons name="trash" size={18} color="#ef4444" />
            </Pressable>
          </View>
        </View>
        <Text style={styles.titulo}>{item.titulo}</Text>
        {item.descripcion ? (
          <Text style={styles.descripcion} numberOfLines={2}>{item.descripcion}</Text>
        ) : null}
        <View style={styles.footer}>
          {fecha ? (
            <View style={styles.fechaContainer}>
              <Ionicons name="calendar-outline" size={14} color="#64748b" />
              <Text style={styles.fechaText}>{fecha}</Text>
            </View>
          ) : null}
          <View style={styles.destinoBadge}>
            <Text style={styles.destinoText}>Para: {ROLES_DESTINO.find(r => r.value === item.rol_destino)?.label || item.rol_destino}</Text>
          </View>
        </View>
        {item.ruta_archivo ? (
          <View style={styles.archivoBadge}>
            <Ionicons name="document-attach" size={14} color="#4f46e5" />
            <Text style={styles.archivoText}>Tiene archivo adjunto</Text>
          </View>
        ) : null}
        {item.notificaciones && item.notificaciones.length > 0 ? (
          <View style={styles.notifBadge}>
            <Ionicons name="notifications" size={14} color="#0891b2" />
            <Text style={styles.notifText}>Notificacion enviada</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividades</Text>
        <Text style={styles.headerSubtitle}>Gestiona las actividades de tu carrera</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosContent}>
          <Pressable
            style={[styles.filtroBtn, !filtroCategoria && styles.filtroBtnActive]}
            onPress={() => setFiltroCategoria(null)}
          >
            <Text style={[styles.filtroText, !filtroCategoria && styles.filtroTextActive]}>Todas</Text>
          </Pressable>
          {CATEGORIAS.map((cat) => (
            <Pressable
              key={cat.value}
              style={[styles.filtroBtn, filtroCategoria === cat.value && styles.filtroBtnActive]}
              onPress={() => setFiltroCategoria(cat.value === filtroCategoria ? null : cat.value)}
            >
              <Ionicons name={cat.icon} size={14} color={filtroCategoria === cat.value ? "#fff" : cat.color} />
              <Text style={[styles.filtroText, filtroCategoria === cat.value && styles.filtroTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={actividades}
        keyExtractor={(item) => `${item.id}`}
        showsVerticalScrollIndicator={false}
        renderItem={renderActividad}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay actividades</Text>
            <Text style={styles.emptySubtext}>Presiona el boton + para crear una nueva</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadData}
      />

      <Pressable style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* Modal Formulario */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actividadEditando ? "Editar Actividad" : "Nueva Actividad"}
              </Text>
              <Pressable onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoriasContainer}>
                {CATEGORIAS.map((cat) => (
                  <Pressable
                    key={cat.value}
                    style={[styles.categoriaBtn, categoria === cat.value && { backgroundColor: cat.color }]}
                    onPress={() => setCategoria(cat.value)}
                  >
                    <Ionicons name={cat.icon} size={18} color={categoria === cat.value ? "#fff" : cat.color} />
                    <Text style={[styles.categoriaBtnText, categoria === cat.value && { color: "#fff" }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Titulo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Parcial 1 - Programacion"
                value={titulo}
                onChangeText={setTitulo}
              />

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripcion de la actividad..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Fecha limite</Text>
              {Platform.OS === "web" ? (
                <View style={styles.fechaInputContainer}>
                  <Ionicons name="calendar" size={20} color="#64748b" style={styles.fechaIcon} />
                  <TextInput
                    style={styles.fechaInput}
                    placeholder="YYYY-MM-DD"
                    value={fechaEntrega}
                    onChangeText={setFechaEntrega}
                  />
                </View>
              ) : (
                <>
                  <Pressable
                    style={styles.fechaInputContainer}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color="#64748b" style={styles.fechaIcon} />
                    <Text style={[styles.fechaInput, { paddingVertical: 12, color: fechaEntrega ? "#0f172a" : "#94a3b8" }]}>
                      {fechaEntrega || "Seleccionar fecha"}
                    </Text>
                    {fechaEntrega ? (
                      <Pressable onPress={() => setFechaEntrega("")} style={{ paddingHorizontal: 12 }}>
                        <Ionicons name="close-circle" size={18} color="#94a3b8" />
                      </Pressable>
                    ) : null}
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={fechaEntrega ? new Date(fechaEntrega + "T12:00:00") : new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          const iso = selectedDate.toISOString().split("T")[0];
                          setFechaEntrega(iso);
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.label}>Dirigido a</Text>
              <View style={styles.rolesContainer}>
                {ROLES_DESTINO.map((rol) => (
                  <Pressable
                    key={rol.value}
                    style={[styles.rolBtn, rolDestino === rol.value && styles.rolBtnActive]}
                    onPress={() => setRolDestino(rol.value)}
                  >
                    <Text style={[styles.rolText, rolDestino === rol.value && styles.rolTextActive]}>
                      {rol.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Archivo adjunto (opcional)</Text>
              <Pressable style={styles.archivoBtn} onPress={pickDocument}>
                <Ionicons name="document-attach" size={20} color="#4f46e5" />
                <Text style={styles.archivoBtnText}>
                  {archivo ? archivo.name : "Seleccionar archivo"}
                </Text>
              </Pressable>
              {archivo && (
                <Pressable style={styles.eliminarArchivoBtn} onPress={() => setArchivo(null)}>
                  <Text style={styles.eliminarArchivoText}>Eliminar archivo</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.guardarBtn, guardando && styles.guardarBtnDisabled]}
                onPress={handleSave}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.guardarBtnText}>
                      {actividadEditando ? "Actualizar" : "Crear Actividad"}
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Detalle */}
      <Modal visible={!!actividadDetalle} animationType="fade" transparent={true}>
        <View style={styles.detalleOverlay}>
          <View style={styles.detalleContainer}>
            {actividadDetalle && (
              <>
                <View style={styles.detalleHeader}>
                  <View style={[styles.detalleCategoriaBadge, { backgroundColor: getCategoriaStyle(actividadDetalle.categoria).bg }]}>
                    <Ionicons
                      name={getCategoriaStyle(actividadDetalle.categoria).icon}
                      size={16}
                      color={getCategoriaStyle(actividadDetalle.categoria).text}
                    />
                    <Text style={[styles.detalleCategoriaText, { color: getCategoriaStyle(actividadDetalle.categoria).text }]}>
                      {CATEGORIAS.find((c) => c.value === actividadDetalle.categoria)?.label}
                    </Text>
                  </View>
                  <Pressable onPress={() => setActividadDetalle(null)}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </Pressable>
                </View>

                <Text style={styles.detalleTitulo}>{actividadDetalle.titulo}</Text>

                {actividadDetalle.descripcion ? (
                  <Text style={styles.detalleDescripcion}>{actividadDetalle.descripcion}</Text>
                ) : null}

                <View style={styles.detalleInfo}>
                  {actividadDetalle.fecha_entrega && (
                    <View style={styles.detalleInfoItem}>
                      <Ionicons name="calendar" size={18} color="#64748b" />
                      <Text style={styles.detalleInfoText}>
                        {new Date(actividadDetalle.fecha_entrega).toLocaleDateString("es-ES", {
                          weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detalleInfoItem}>
                    <Ionicons name="people" size={18} color="#64748b" />
                    <Text style={styles.detalleInfoText}>Dirigido a: {ROLES_DESTINO.find(r => r.value === actividadDetalle.rol_destino)?.label || actividadDetalle.rol_destino}</Text>
                  </View>
                  {actividadDetalle.materia && (
                    <View style={styles.detalleInfoItem}>
                      <Ionicons name="library" size={18} color="#64748b" />
                      <Text style={styles.detalleInfoText}>Materia: {actividadDetalle.materia.nombre}</Text>
                    </View>
                  )}
                </View>

                {actividadDetalle.ruta_archivo && (
                  <View style={styles.detalleArchivo}>
                    <Ionicons name="document-attach" size={20} color="#4f46e5" />
                    <Text style={styles.detalleArchivoText}>Archivo adjunto disponible</Text>
                  </View>
                )}

                {actividadDetalle.notificaciones && actividadDetalle.notificaciones.length > 0 && (
                  <View style={styles.detalleNotif}>
                    <Ionicons name="notifications" size={18} color="#0891b2" />
                    <Text style={styles.detalleNotifText}>
                      Notificacion enviada automaticamente a los estudiantes
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav navigation={navigation} activeScreen="Actividades" />
    </SafeAreaView>
  );
}

const styles = {
  screen: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { backgroundColor: "#0f172a", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#ffffff" },
  headerSubtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  filtrosContainer: { backgroundColor: "#fff", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  filtrosContent: { paddingHorizontal: 16, gap: 8 },
  filtroBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", marginRight: 8, gap: 4 },
  filtroBtnActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  filtroText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  filtroTextActive: { color: "#ffffff" },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  categoriaBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  categoriaText: { fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 6, borderRadius: 8, backgroundColor: "#f8fafc" },
  titulo: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  descripcion: { fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  fechaContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  fechaText: { fontSize: 13, color: "#64748b" },
  destinoBadge: { backgroundColor: "#f0fdf4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  destinoText: { fontSize: 12, color: "#16a34a", fontWeight: "500" },
  archivoBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  archivoText: { fontSize: 13, color: "#4f46e5", fontWeight: "500" },
  notifBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  notifText: { fontSize: 12, color: "#0891b2", fontWeight: "500" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#64748b", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  fab: { position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  modalContainer: { flex: 1, backgroundColor: "#f1f5f9" },
  modalContent: { flex: 1, backgroundColor: "#ffffff", marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  formContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#0f172a", backgroundColor: "#ffffff" },
  textArea: { height: 100, textAlignVertical: "top" },
  categoriasContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoriaBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#f1f5f9", gap: 6 },
  categoriaBtnText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  fechaInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, backgroundColor: "#ffffff" },
  fechaIcon: { paddingHorizontal: 12 },
  fechaInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#0f172a" },
  destinoInfo: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#ecfeff", padding: 14, borderRadius: 12, marginTop: 16 },
  destinoInfoText: { flex: 1, fontSize: 13, color: "#0e7490", lineHeight: 20 },
  rolesContainer: { flexDirection: "row", gap: 8, marginTop: 4 },
  rolBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  rolBtnActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  rolText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  rolTextActive: { color: "#ffffff", fontWeight: "600" },
  archivoBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, borderStyle: "dashed", backgroundColor: "#f8fafc" },
  archivoBtnText: { fontSize: 14, color: "#4f46e5", fontWeight: "500" },
  eliminarArchivoBtn: { marginTop: 8 },
  eliminarArchivoText: { fontSize: 13, color: "#ef4444" },
  guardarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0f172a", paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  guardarBtnDisabled: { opacity: 0.6 },
  guardarBtnText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  detalleOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  detalleContainer: { backgroundColor: "#ffffff", borderRadius: 20, padding: 24, maxHeight: "80%" },
  detalleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detalleCategoriaBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  detalleCategoriaText: { fontSize: 13, fontWeight: "600" },
  detalleTitulo: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  detalleDescripcion: { fontSize: 15, color: "#475569", lineHeight: 24, marginBottom: 20 },
  detalleInfo: { gap: 12, marginBottom: 20 },
  detalleInfoItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  detalleInfoText: { fontSize: 14, color: "#64748b" },
  detalleArchivo: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#eef2ff", borderRadius: 12, marginBottom: 12 },
  detalleArchivoText: { fontSize: 14, color: "#4f46e5", fontWeight: "500" },
  detalleNotif: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#ecfeff", borderRadius: 12 },
  detalleNotifText: { flex: 1, fontSize: 13, color: "#0e7490" },
};
