import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getMisMaterias } from '../../services/estudianteService';
import EstudianteBottomNav from '../../components/EstudianteBottomNav';

const PRIMARY   = '#1e3a5f';
const HEADER_BG = '#e53e6d'; // rosa/rojo como en la imagen
const HORA_BG   = '#63b3ed'; // azul claro para columna de hora
const RECREO_BG = '#fc8181'; // rojo claro para recreo

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_LABEL = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

// Ancho de columnas
const COL_HORA  = 72;
const COL_DIA   = 110;
const COL_SAB   = 130; // sábado más ancho como pide el usuario
const ROW_H     = 52;
const RECREO_H  = 36;

// Paleta de colores por materia
const PALETA = [
  '#fff',        // blanco base
  '#ebf8ff',     // azul muy claro
  '#f0fff4',     // verde muy claro
  '#fffbeb',     // amarillo muy claro
  '#fdf2f8',     // rosa muy claro
  '#f5f3ff',     // violeta muy claro
  '#fff7ed',     // naranja muy claro
];

export default function HorarioEstudianteScreen({ navigation }) {
  const [slots,         setSlots]         = useState({}); // { "lunes|07:45|08:30": {materia, docente, aula, colorIdx} }
  const [franjas,       setFranjas]       = useState([]); // [ {inicio, fin, esRecreo} ]
  const [periodoNombre, setPeriodoNombre] = useState('');
  const [loading,       setLoading]       = useState(true);
  const [hayHorario,    setHayHorario]    = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const todas = await getMisMaterias();
      const activas = todas.filter((m) => m.periodo?.activo);

      if (activas.length > 0 && activas[0].periodo?.nombre) {
        setPeriodoNombre(activas[0].periodo.nombre);
      }

      // Recopilar todos los bloques horarios
      const slotsMap = {};
      const franjasSet = new Set();
      let tieneHorario = false;

      activas.forEach((materia, idx) => {
        const colorIdx = idx % PALETA.length;
        (materia.horarios || []).forEach((h) => {
          const inicio = h.hora_inicio?.slice(0, 5) ?? '';
          const fin    = h.hora_fin?.slice(0, 5) ?? '';
          const dia    = h.dia?.toLowerCase() ?? '';
          if (!inicio || !fin || !dia) return;

          tieneHorario = true;
          franjasSet.add(`${inicio}|${fin}`);
          const key = `${dia}|${inicio}|${fin}`;
          slotsMap[key] = {
            materia:  materia.nombre,
            docente:  materia.docente?.nombre ?? null,
            aula:     h.aula ?? null,
            colorIdx,
          };
        });
      });

      // Ordenar franjas por hora de inicio
      const franjasArr = [...franjasSet]
        .map((f) => { const [i, fi] = f.split('|'); return { inicio: i, fin: fi, esRecreo: false }; })
        .sort((a, b) => a.inicio.localeCompare(b.inicio));

      setSlots(slotsMap);
      setFranjas(franjasArr);
      setHayHorario(tieneHorario);
    } catch (e) {
      console.error('Error cargando horario:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mi Horario</Text>
          <Text style={s.headerSub}>{periodoNombre || 'Periodo activo'}</Text>
        </View>
        <View style={s.headerIcon}>
          <Ionicons name="calendar" size={26} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {!hayHorario ? (
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
          <Text style={s.emptyTitle}>Sin horario disponible</Text>
          <Text style={s.emptySub}>No tienes materias con horarios asignados en el periodo activo.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Tabla con scroll horizontal ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* ── Fila de encabezados ── */}
              <View style={s.headerRow}>
                {/* Celda "Hora" */}
                <View style={[s.thHora, { width: COL_HORA }]}>
                  <Text style={s.thHoraText}>Hora</Text>
                </View>
                {/* Celdas de días */}
                {DIAS.map((dia) => {
                  const isSab = dia === 'sabado';
                  return (
                    <View
                      key={dia}
                      style={[s.thDia, { width: isSab ? COL_SAB : COL_DIA }]}
                    >
                      <Text style={s.thDiaText}>{DIAS_LABEL[dia]}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Filas de franjas horarias ── */}
              {franjas.map((franja, fIdx) => {
                const isRecreo = franja.esRecreo;
                const rowBg    = fIdx % 2 === 0 ? '#fff' : '#f8fafc';

                return (
                  <View key={fIdx} style={[s.row, { height: isRecreo ? RECREO_H : ROW_H, backgroundColor: rowBg }]}>
                    {/* Celda de hora */}
                    <View style={[s.tdHora, { width: COL_HORA, height: isRecreo ? RECREO_H : ROW_H }]}>
                      {isRecreo ? (
                        <Text style={s.recreoHoraText}>{franja.inicio}</Text>
                      ) : (
                        <>
                          <Text style={s.horaText}>{franja.inicio}</Text>
                          <Text style={s.horaSep}>–</Text>
                          <Text style={s.horaText}>{franja.fin}</Text>
                        </>
                      )}
                    </View>

                    {/* Celdas de días */}
                    {DIAS.map((dia) => {
                      const isSab = dia === 'sabado';
                      const w     = isSab ? COL_SAB : COL_DIA;
                      const key   = `${dia}|${franja.inicio}|${franja.fin}`;
                      const slot  = slots[key];

                      if (isRecreo) {
                        return (
                          <View key={dia} style={[s.tdRecreo, { width: w, height: RECREO_H }]}>
                            {dia === 'lunes' && (
                              <Text style={s.recreoLabel}>R E C R E O</Text>
                            )}
                          </View>
                        );
                      }

                      return (
                        <View
                          key={dia}
                          style={[
                            s.tdDia,
                            { width: w, height: ROW_H },
                            slot && { backgroundColor: PALETA[slot.colorIdx] },
                          ]}
                        >
                          {slot ? (
                            <>
                              <Text style={s.slotMateria} numberOfLines={2}>
                                {slot.materia}
                              </Text>
                              {slot.docente ? (
                                <Text style={s.slotDocente} numberOfLines={1}>
                                  {slot.docente}
                                </Text>
                              ) : null}
                              {slot.aula ? (
                                <Text style={s.slotAula}>Aula {slot.aula}</Text>
                              ) : null}
                            </>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                );
              })}

              {/* Línea inferior */}
              <View style={s.tableBorder} />
            </View>
          </ScrollView>

          {/* ── Leyenda ── */}
          <View style={s.leyendaCard}>
            <Text style={s.leyendaTitle}>Leyenda de materias</Text>
            <View style={s.leyendaGrid}>
              {Object.values(
                // Deduplicar por nombre de materia
                Object.values(slots).reduce((acc, slot) => {
                  if (!acc[slot.materia]) acc[slot.materia] = slot;
                  return acc;
                }, {})
              ).map((slot, idx) => (
                <View
                  key={idx}
                  style={[s.leyendaItem, { backgroundColor: PALETA[slot.colorIdx] }]}
                >
                  <View style={[s.leyendaDot, { backgroundColor: '#94a3b8' }]} />
                  <Text style={s.leyendaText} numberOfLines={1}>{slot.materia}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      <EstudianteBottomNav navigation={navigation} active="HorarioEstudiante" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f1f5f9' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row', alignItems: 'center',
    padding: 24, paddingTop: 28, paddingBottom: 30,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSub:   { color: '#c7d2fe', marginTop: 4, fontWeight: '600' },
  headerIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: 16 },

  // ── Tabla ──
  headerRow: {
    flexDirection: 'row',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    overflow: 'hidden',
  },

  // Encabezado "Hora"
  thHora: {
    backgroundColor: HORA_BG,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)',
  },
  thHoraText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Encabezado de día
  thDia: {
    backgroundColor: HEADER_BG,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.25)',
  },
  thDiaText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Fila de datos
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },

  // Celda de hora
  tdHora: {
    backgroundColor: HORA_BG,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 4,
  },
  horaText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
  horaSep:   { color: 'rgba(255,255,255,0.6)', fontSize: 9 },

  // Celda de recreo
  tdRecreo: {
    backgroundColor: RECREO_BG,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)',
  },
  recreoLabel: {
    color: '#fff', fontWeight: '900', fontSize: 11,
    letterSpacing: 2,
  },
  recreoHoraText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Celda de materia
  tdDia: {
    borderRightWidth: 1, borderRightColor: '#e2e8f0',
    padding: 5, justifyContent: 'center', alignItems: 'center',
  },
  slotMateria: {
    fontSize: 11, fontWeight: '700', color: '#1e293b',
    textAlign: 'center', lineHeight: 14,
  },
  slotDocente: {
    fontSize: 9, color: '#64748b', fontWeight: '500',
    textAlign: 'center', marginTop: 2,
  },
  slotAula: {
    fontSize: 9, color: '#94a3b8', fontWeight: '500',
    textAlign: 'center',
  },

  tableBorder: {
    height: 2, backgroundColor: HEADER_BG,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },

  // Leyenda
  leyendaCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  leyendaTitle: {
    fontSize: 12, fontWeight: '800', color: '#64748b',
    textTransform: 'uppercase', marginBottom: 12,
  },
  leyendaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  leyendaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  leyendaDot:  { width: 8, height: 8, borderRadius: 4 },
  leyendaText: { fontSize: 12, fontWeight: '700', color: '#1e293b' },

  // Empty
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 16 },
  emptySub:   { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
