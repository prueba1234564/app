<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * PeriodoController
 * -----------------
 * Dos niveles de período:
 *
 *  Nivel 1 — Año académico (decano)
 *    GET  /periodos/anios          → lista años académicos
 *    POST /periodos/anios          → crear año académico
 *    PUT  /periodos/anios/{id}/activar → activar año académico
 *
 *  Nivel 2 — Período de carrera (director)
 *    GET  /periodos                → lista períodos de la carrera del director
 *    POST /periodos                → crear período de carrera
 *    PUT  /periodos/{id}/activar   → activar período de carrera
 *
 *  Compartidos:
 *    GET  /periodos/activo         → período activo (filtrado por carrera si aplica)
 *    GET  /periodos/{id}           → detalle
 *    PUT  /periodos/{id}           → actualizar
 *    DELETE /periodos/{id}         → eliminar
 */
class PeriodoController extends Controller
{
    // =========================================================================
    // NIVEL 1 — AÑOS ACADÉMICOS (DECANO)
    // =========================================================================

    /**
     * GET /periodos/anios
     * Lista todos los años académicos.
     */
    public function indexAnios(): JsonResponse
    {
        try {
            $anios = Periodo::aniosAcademicos()
                ->withCount('periodosHijos')
                ->orderByDesc('fecha_inicio')
                ->get();

            return response()->json(['success' => true, 'data' => $anios], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * POST /periodos/anios
     * Crea un año académico (solo decano).
     */
    public function storeAnio(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre'       => ['required', 'string', 'max:100'],
                'fecha_inicio' => ['required', 'date'],
                'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
                'activo'       => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            $anio = DB::transaction(function () use ($data) {
                if (!empty($data['activo'])) {
                    // Desactivar todos los años académicos
                    Periodo::aniosAcademicos()->update(['activo' => false]);
                }

                return Periodo::create([
                    'nombre'            => $data['nombre'],
                    'tipo'              => Periodo::TIPO_ANIO_ACADEMICO,
                    'fecha_inicio'      => $data['fecha_inicio'],
                    'fecha_fin'         => $data['fecha_fin'],
                    'activo'            => (bool) ($data['activo'] ?? false),
                    'anio_academico_id' => null,
                    'carrera_id'        => null,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Año académico creado correctamente.',
                'data'    => $anio,
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * PUT /periodos/anios/{id}/activar
     * Activa un año académico y desactiva los demás.
     */
    public function activarAnio(int $id): JsonResponse
    {
        try {
            $anio = Periodo::aniosAcademicos()->find($id);

            if (!$anio) {
                return response()->json(['success' => false, 'message' => 'Año académico no encontrado.'], 404);
            }

            $anio = DB::transaction(function () use ($anio) {
                Periodo::aniosAcademicos()->update(['activo' => false]);
                $anio->update(['activo' => true]);
                return $anio;
            });

            return response()->json([
                'success' => true,
                'message' => "Año académico \"{$anio->nombre}\" activado correctamente.",
                'data'    => $anio,
            ], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    // =========================================================================
    // NIVEL 2 — PERÍODOS DE CARRERA (DIRECTOR)
    // =========================================================================

    /**
     * GET /periodos
     * Lista períodos de carrera.
     * - Director: solo los de su carrera
     * - Decano: todos
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $usuario     = $request->user();
            $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
            $rolActivo   = collect($habilidades)->first(fn (string $h) => $h !== '*');

            $query = Periodo::periodosCarrera()
                ->with(['anioAcademico', 'carrera'])
                ->orderByDesc('fecha_inicio');

            // Director solo ve los de su carrera
            if ($rolActivo === 'director' && $usuario->carrera_id) {
                $query->where('carrera_id', $usuario->carrera_id);
            }

            return response()->json([
                'success' => true,
                'data'    => $query->get(),
            ], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * POST /periodos
     * Crea un período de carrera (director).
     * Se vincula automáticamente al año académico activo.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $usuario     = $request->user();
            $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
            $rolActivo   = collect($habilidades)->first(fn (string $h) => $h !== '*');

            $validator = Validator::make($request->all(), [
                'nombre'       => ['required', 'string', 'max:100'],
                'tipo'         => ['required', 'in:semestre,anual,temporada'],
                'fecha_inicio' => ['required', 'date'],
                'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
                'activo'       => ['nullable', 'boolean'],
                'carrera_id'   => ['nullable', 'integer', 'exists:carreras,id'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            // El director solo puede crear períodos para su carrera
            if ($rolActivo === 'director') {
                $data['carrera_id'] = $usuario->carrera_id;
            }

            // Buscar el año académico activo para vincularlo
            $anioActivo = Periodo::aniosAcademicos()->where('activo', true)->first();

            $periodo = DB::transaction(function () use ($data, $anioActivo) {
                if (!empty($data['activo'])) {
                    // Desactivar otros períodos de la misma carrera
                    Periodo::periodosCarrera()
                        ->where('carrera_id', $data['carrera_id'])
                        ->update(['activo' => false]);
                }

                return Periodo::create([
                    'nombre'            => $data['nombre'],
                    'tipo'              => $data['tipo'],
                    'fecha_inicio'      => $data['fecha_inicio'],
                    'fecha_fin'         => $data['fecha_fin'],
                    'activo'            => (bool) ($data['activo'] ?? false),
                    'anio_academico_id' => $anioActivo?->id,
                    'carrera_id'        => $data['carrera_id'] ?? null,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Período creado correctamente.',
                'data'    => $periodo->load(['anioAcademico', 'carrera']),
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    // =========================================================================
    // COMPARTIDOS
    // =========================================================================

    /**
     * GET /periodos/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::with(['anioAcademico', 'carrera', 'periodosHijos'])->find($id);

            if (!$periodo) {
                return response()->json(['success' => false, 'message' => 'Período no encontrado.'], 404);
            }

            return response()->json(['success' => true, 'data' => $periodo], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * PUT /periodos/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json(['success' => false, 'message' => 'Período no encontrado.'], 404);
            }

            $esAnio = $periodo->tipo === Periodo::TIPO_ANIO_ACADEMICO;

            $validator = Validator::make($request->all(), [
                'nombre'       => ['sometimes', 'string', 'max:100'],
                'tipo'         => $esAnio ? ['prohibited'] : ['sometimes', 'in:semestre,anual,temporada'],
                'fecha_inicio' => ['sometimes', 'date'],
                'fecha_fin'    => ['sometimes', 'date'],
                'activo'       => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data    = $validator->validated();
            $updated = DB::transaction(function () use ($periodo, $data, $esAnio) {
                if (array_key_exists('activo', $data) && $data['activo']) {
                    if ($esAnio) {
                        Periodo::aniosAcademicos()->update(['activo' => false]);
                    } else {
                        Periodo::periodosCarrera()
                            ->where('carrera_id', $periodo->carrera_id)
                            ->update(['activo' => false]);
                    }
                }

                $periodo->update($data);
                return $periodo;
            });

            return response()->json([
                'success' => true,
                'message' => 'Período actualizado correctamente.',
                'data'    => $updated->load(['anioAcademico', 'carrera']),
            ], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * DELETE /periodos/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json(['success' => false, 'message' => 'Período no encontrado.'], 404);
            }

            $periodo->delete();

            return response()->json(['success' => true, 'message' => 'Período eliminado correctamente.'], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * GET /periodos/activo
     * Devuelve el período activo según el contexto:
     * - Con ?tipo_carrera=semestral|anual → período de carrera compatible
     * - Sin parámetro → año académico activo
     */
    public function activo(Request $request): JsonResponse
    {
        try {
            $tipoCarrera = $request->query('tipo_carrera');
            $carreraId   = $request->query('carrera_id');

            if ($tipoCarrera || $carreraId) {
                // Buscar período de carrera activo
                $query = Periodo::periodosCarrera()->where('activo', true);

                if ($carreraId) {
                    $query->where('carrera_id', $carreraId);
                }
                if ($tipoCarrera) {
                    $query->compatibleConCarrera($tipoCarrera);
                }

                $periodo = $query->with(['anioAcademico', 'carrera'])->first();

                // Fallback por fechas
                if (!$periodo) {
                    $fallback = Periodo::periodosCarrera()->vigenteHoy();
                    if ($carreraId) $fallback->where('carrera_id', $carreraId);
                    if ($tipoCarrera) $fallback->compatibleConCarrera($tipoCarrera);
                    $periodo = $fallback->with(['anioAcademico', 'carrera'])->orderByDesc('fecha_inicio')->first();
                }
            } else {
                // Buscar año académico activo
                $periodo = Periodo::aniosAcademicos()
                    ->where('activo', true)
                    ->with('periodosHijos.carrera')
                    ->first();

                if (!$periodo) {
                    $periodo = Periodo::aniosAcademicos()
                        ->vigenteHoy()
                        ->with('periodosHijos.carrera')
                        ->orderByDesc('fecha_inicio')
                        ->first();
                }
            }

            return response()->json(['success' => true, 'data' => $periodo], 200);
        } catch (Throwable $e) {
            \Log::error('PeriodoController::activo() — ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }

    /**
     * PUT /periodos/{id}/activar
     * Activa un período (carrera o año académico).
     */
    public function activar(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json(['success' => false, 'message' => 'Período no encontrado.'], 404);
            }

            $esAnio = $periodo->tipo === Periodo::TIPO_ANIO_ACADEMICO;

            $periodo = DB::transaction(function () use ($periodo, $esAnio) {
                if ($esAnio) {
                    Periodo::aniosAcademicos()->update(['activo' => false]);
                } else {
                    Periodo::periodosCarrera()
                        ->where('carrera_id', $periodo->carrera_id)
                        ->update(['activo' => false]);
                }

                $periodo->update(['activo' => true]);
                return $periodo;
            });

            return response()->json([
                'success' => true,
                'message' => "Período \"{$periodo->nombre}\" activado correctamente.",
                'data'    => $periodo->load(['anioAcademico', 'carrera']),
            ], 200);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error del servidor.'], 500);
        }
    }
}
