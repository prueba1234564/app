import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  desinscribirseMateria,
  getMateriasCarrera,
  inscribirseMateria,
} from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY = '#1e3a5f';
const GREEN   = '#0f766e';
const GRAY    = '#64748b';

export default function InscripcionesScreen({ navigation }) {
  const [materias, setMaterias]           = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [busqueda, setBusqueda]           = useState('');
  const [filtro, setFiltro]               = useState('todas');
  const [procesando, setProcesando]       = useState(null);

  // Modal de confirmación
  const [modalData, setModalData] = useState(null); // { materia, tipo: 'inscribir'|'desinscribir' }

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMateriasCarrera();
      setMaterias(res.data || []);
      setPeriodoActivo(res.periodo_activo || null);
    } catch (e) {
      setModalData({ error: 'No se pudieron cargar las materias.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));

  const handleConfirmar = async () => {
    if (!modalData) return;
    const { materia, tipo } = modalData;
    setModalData(null);

    try {
      setProcesando(materia.id);
      if (tipo === 'inscribir') {
        await inscribirseMateria(materia.id);
        setMaterias((prev) =>
          prev.map((m) => m.id === materia.id ? { ...m, inscrito: true } : m),
        );
      } else {
        await desinscribirseMateria(materia.id);
        setMaterias((prev) =>
          prev.map((m) => m.id === materia.id ? { ...m, inscrito: false } : m),
        );
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo completar la operación.';
      setModalData({ error: msg });
    } finally {
      setProcesando(null);
    }
  };

  // Filtrado
  const materiasFiltradas = materias.filter((m) => {
    const coincideBusqueda = m.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincideBusqueda) return false;
    if (filtro === 'inscritas')   return m.inscrito;
    if (filtro === 'disponibles') return !m.inscrito;
    return true;
  });

  const totalInscritas   = materias.filter((m) => m.inscrito).length;
  const totalDisponibles = materias.filter((m) => !m.inscrito).length;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Cargando materias...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Modal de confirmación ── */}
      <Modal
        transparent
        visible={Boolean(modalData && !modalData.error)}
        animationType="fade"
        onRequestClose={() => setModalData(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[
              styles.dialogIcon,
              { backgroundColor: modalData?.tipo === 'desinscribir' ? '#fef2f2' : '#e8f0fe' }
            ]}>
              <Ionicons
                name={modalData?.tipo === 'desinscribir' ? 'remove-circle-outline' : 'add-circle-outline'}
                size={28}
                color={modalData?.tipo === 'desinscribir' ? '#ef4444' : PRIMARY}
              />
            </View>
            <Text style={styles.dialogTitle}>
              {modalData?.tipo === 'desinscribir' ? 'Desinscribirse' : 'Inscribirse'}
            </Text>
            <Text style={styles.dialogBody}>
              {modalData?.tipo === 'desinscribir'
                ? `¿Seguro que deseas desinscribirte de `
                : `¿Deseas inscribirte en `}
              <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                "{modalData?.materia?.nombre}"
              </Text>
              ?
            </Text>
            <View style={styles.dialogActions}>
              <Pressable style={styles.btnCancel} onPress={() => setModalData(null)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btnConfirm,
                  { backgroundColor: modalData?.tipo === 'desinscribir' ? '#ef4444' : PRIMARY }
                ]}
                onPress={handleConfirmar}
              >
                <Text style={styles.btnConfirmText}>
                  {modalData?.tipo === 'desinscribir' ? 'Desinscribirme' : 'Inscribirme'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal de error ── */}
      <Modal
        transparent
        visible={Boolean(modalData?.error)}
        animationType="fade"
        onRequestClose={() => setModalData(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[styles.dialogIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
            </View>
            <Text style={styles.dialogTitle}>Error</Text>
            <Text style={styles.dialogBody}>{modalData?.error}</Text>
            <Pressable style={[styles.btnConfirm, { backgroundColor: PRIMARY, width: '100%' }]} onPress={() => setModalData(null)}>
              <Text style={styles.btnConfirmText}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.circleOne} />
          <View style={styles.circleTwo} />
          <Text style={styles.headerTitle}>Inscripciones</Text>
          <Text style={styles.headerSub}>Materias de tu carrera</Text>
          {periodoActivo && (
            <View style={styles.periodoBadge}>
              <Ionicons name="calendar-outline" size={13} color="#c7d2fe" />
              <Text style={styles.periodoBadgeText}>
                {periodoActivo.nombre} · {periodoActivo.tipo}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: '#e8f0fe' }]}>
            <Text style={[styles.statNum, { color: PRIMARY }]}>{totalInscritas}</Text>
            <Text style={[styles.statLbl, { color: PRIMARY }]}>Inscritas</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.statNum, { color: GRAY }]}>{totalDisponibles}</Text>
            <Text style={[styles.statLbl, { color: GRAY }]}>Disponibles</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statNum, { color: GREEN }]}>{materias.length}</Text>
            <Text style={[styles.statLbl, { color: GREEN }]}>Total</Text>
          </View>
        </View>

        {/* ── Buscador ── */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar materia..."
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

        {/* ── Filtros ── */}
        <View style={styles.filtrosRow}>
          {[
            { key: 'todas',       label: 'Todas' },
            { key: 'inscritas',   label: 'Inscritas' },
            { key: 'disponibles', label: 'Disponibles' },
          ].map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filtroBtn, filtro === f.key && styles.filtroBtnActive]}
              onPress={() => setFiltro(f.key)}
            >
              <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Lista de materias ── */}
        {materiasFiltradas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay materias en esta categoría.'}
            </Text>
          </View>
        ) : (
          materiasFiltradas.map((materia) => (
            <MateriaCard
              key={materia.id}
              materia={materia}
              procesando={procesando === materia.id}
              onInscribirse={() => setModalData({ materia, tipo: 'inscribir' })}
              onDesinscribirse={() => setModalData({ materia, tipo: 'desinscribir' })}
            />
          ))
        )}

        <View style={{ height: 96 }} />
      </ScrollView>
      <EstudianteBottomNav navigation={navigation} active="InscripcionesEstudiante" />
    </SafeAreaView>
  );
}

function MateriaCard({ materia, procesando, onInscribirse, onDesinscribirse }) {
  const { oferta } = materia;
  const tieneOferta = Boolean(oferta);

  return (
    <View style={[styles.card, materia.inscrito && styles.cardInscrita]}>
      {/* Encabezado de la card */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, materia.inscrito ? styles.cardIconInscrita : styles.cardIconDefault]}>
          <Ionicons
            name={materia.inscrito ? 'checkmark-circle' : 'book-outline'}
            size={22}
            color={materia.inscrito ? GREEN : PRIMARY}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNombre}>{materia.nombre}</Text>
          {materia.inscrito && (
            <View style={styles.inscritoBadge}>
              <Ionicons name="checkmark-circle" size={12} color={GREEN} />
              <Text style={styles.inscritoBadgeText}>Inscrito</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info de la oferta del período activo */}
      {tieneOferta ? (
        <View style={styles.ofertaBox}>
          {oferta.paralelo && (
            <InfoChip icon="git-branch-outline" text={`Paralelo ${oferta.paralelo}`} />
          )}
          {oferta.docente && (
            <InfoChip icon="person-outline" text={oferta.docente.nombre} />
          )}
          {oferta.horarios?.length > 0 && (
            <InfoChip
              icon="time-outline"
              text={oferta.horarios
                .map((h) => `${h.dia} ${h.hora_inicio}–${h.hora_fin}`)
                .join(' · ')}
            />
          )}
        </View>
      ) : (
        <View style={styles.sinOfertaBox}>
          <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
          <Text style={styles.sinOfertaText}>Sin oferta en el período activo</Text>
        </View>
      )}

      {/* Botón de acción */}
      {procesando ? (
        <View style={styles.btnProcesando}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.btnText}>Procesando...</Text>
        </View>
      ) : materia.inscrito ? (
        <Pressable
          style={({ pressed }) => [styles.btnDesinscribir, pressed && styles.btnPressed]}
          onPress={onDesinscribirse}
        >
          <Ionicons name="remove-circle-outline" size={18} color="#ef4444" />
          <Text style={styles.btnDesinscribirText}>Desinscribirme</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.btnInscribir, pressed && styles.btnPressed]}
          onPress={onInscribirse}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Inscribirme</Text>
        </Pressable>
      )}
    </View>
  );
}

function InfoChip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={GRAY} />
      <Text style={styles.chipText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingText: { color: GRAY, fontWeight: '600' },
  content: { paddingBottom: 110 },

  // Header
  header: {
    backgroundColor: PRIMARY,
    padding: 24, paddingTop: 44,
    marginBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  circleOne: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    top: -40, right: -20, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleTwo: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    bottom: 5, left: 15, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  headerSub: { color: '#c7d2fe', fontSize: 14, fontWeight: '500', marginTop: 4 },
  periodoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20,
  },
  periodoBadgeText: { color: '#e0e7ff', fontWeight: '700', fontSize: 12 },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 16,
  },
  statChip: {
    flex: 1, marginHorizontal: 4, borderRadius: 16,
    paddingVertical: 12, alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Search
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '600' },

  // Filtros
  filtrosRow: {
    flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8,
  },
  filtroBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  filtroBtnActive: { backgroundColor: PRIMARY },
  filtroText: { fontSize: 12, fontWeight: '700', color: GRAY },
  filtroTextActive: { color: '#fff' },

  // Cards
  card: {
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  cardInscrita: {
    borderWidth: 1.5, borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconDefault: { backgroundColor: '#e8f0fe' },
  cardIconInscrita: { backgroundColor: '#dcfce7' },
  cardNombre: { fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1 },
  inscritoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 4, alignSelf: 'flex-start',
  },
  inscritoBadgeText: { color: GREEN, fontSize: 12, fontWeight: '700' },

  // Oferta info
  ofertaBox: { gap: 6, marginBottom: 14 },
  sinOfertaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#f8fafc', borderRadius: 10,
  },
  sinOfertaText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

  // Chips
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#f1f5f9', borderRadius: 10, alignSelf: 'flex-start',
  },
  chipText: { color: GRAY, fontSize: 12, fontWeight: '600' },

  // Botones
  btnInscribir: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  btnDesinscribir: {
    borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#fff5f5',
  },
  btnProcesando: {
    backgroundColor: '#94a3b8', borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  btnPressed: { opacity: 0.82 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  btnDesinscribirText: { color: '#ef4444', fontWeight: '900', fontSize: 14 },

  // Empty
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, gap: 12,
  },
  emptyText: { color: '#94a3b8', fontWeight: '600', fontSize: 14, textAlign: 'center' },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  dialog: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  dialogIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  dialogBody:  { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  dialogActions: { flexDirection: 'row', gap: 12, width: '100%' },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#f1f5f9', alignItems: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  btnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
  },
  btnConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
