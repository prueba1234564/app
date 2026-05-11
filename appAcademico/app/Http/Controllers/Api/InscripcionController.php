<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EstudianteMateria;
use App\Models\MateriaPeriodo;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class InscripcionController extends Controller
{
    private function periodoCerradoResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Este periodo es historico y solo permite consulta.',
        ], 409);
    }

    // GET /director/inscripciones?materia_periodo_id=X
    // Estudiantes inscritos en una materia del periodo
    public function index(Request $request): JsonResponse
    {
        try {
            $materiaPeriodoId = $request->query('materia_periodo_id');
            if (!$materiaPeriodoId) {
                return response()->json(['success' => false, 'message' => 'materia_periodo_id requerido.'], 422);
            }

            $oferta = MateriaPeriodo::with('materia')->find($materiaPeriodoId);
            if (!$oferta) {
                return response()->json(['success' => false, 'message' => 'Oferta no encontrada.'], 404);
            }

            $estudiantes = Usuario::whereHas('rolesUsuario', fn($q) => $q->where('rol', 'estudiante'))
                ->whereHas('materiasComoEstudiante', fn($q) => $q->where('materia_id', $oferta->materia_id))
                ->select('id', 'nombre', 'email', 'registro_universitario')
                ->get();

            return response()->json(['success' => true, 'data' => $estudiantes]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al obtener inscripciones.'], 500);
        }
    }

    // POST /director/inscripciones
    // Inscribir estudiante(s) a una materia del periodo
    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'materia_periodo_id' => 'required|exists:materia_periodo,id',
                'usuario_ids'        => 'required|array|min:1',
                'usuario_ids.*'      => 'exists:usuarios,id',
            ]);

            $oferta = MateriaPeriodo::with(['materia', 'periodo'])->find($data['materia_periodo_id']);
            $director = $request->user();

            if (!$oferta?->periodo?->activo) {
                return $this->periodoCerradoResponse();
            }

            // Verificar que la materia pertenece a la carrera del director
            if ($director->carrera_id && (int)$oferta->materia->carrera_id !== (int)$director->carrera_id) {
                return response()->json(['success' => false, 'message' => 'Sin permiso.'], 403);
            }

            $inscritos = 0;
            $yaInscritos = 0;

            DB::transaction(function () use ($data, $oferta, &$inscritos, &$yaInscritos) {
                foreach ($data['usuario_ids'] as $usuarioId) {
                    $existe = EstudianteMateria::where('usuario_id', $usuarioId)
                        ->where('materia_id', $oferta->materia_id)
                        ->exists();
                    if ($existe) {
                        $yaInscritos++;
                        continue;
                    }
                    EstudianteMateria::create([
                        'usuario_id'        => $usuarioId,
                        'materia_id'        => $oferta->materia_id,
                        'fecha_inscripcion' => now(),
                    ]);
                    $inscritos++;
                }
            });

            return response()->json([
                'success' => true,
                'message' => "$inscritos inscrito(s). $yaInscritos ya estaban inscritos.",
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al inscribir.'], 500);
        }
    }

    // DELETE /director/inscripciones
    // Desinscribir estudiante de una materia
    public function destroy(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'materia_periodo_id' => 'required|exists:materia_periodo,id',
                'usuario_id'         => 'required|exists:usuarios,id',
            ]);

            $oferta = MateriaPeriodo::with('periodo')->find($data['materia_periodo_id']);

            if (!$oferta?->periodo?->activo) {
                return $this->periodoCerradoResponse();
            }

            EstudianteMateria::where('usuario_id', $data['usuario_id'])
                ->where('materia_id', $oferta->materia_id)
                ->delete();

            return response()->json(['success' => true, 'message' => 'Estudiante desinscrito.']);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al desinscribir.'], 500);
        }
    }

    // GET /director/estudiantes-disponibles?materia_periodo_id=X
    // Estudiantes de la carrera NO inscritos aún en esa materia
    public function disponibles(Request $request): JsonResponse
    {
        try {
            $materiaPeriodoId = $request->query('materia_periodo_id');
            $oferta = MateriaPeriodo::find($materiaPeriodoId);
            if (!$oferta) {
                return response()->json(['success' => false, 'message' => 'Oferta no encontrada.'], 404);
            }

            $director = $request->user();

            $estudiantes = Usuario::whereHas('rolesUsuario', fn($q) => $q->where('rol', 'estudiante'))
                ->where('carrera_id', $director->carrera_id)
                ->whereDoesntHave('materiasComoEstudiante', fn($q) => $q->where('materia_id', $oferta->materia_id))
                ->select('id', 'nombre', 'email', 'registro_universitario')
                ->orderBy('nombre')
                ->get();

            return response()->json(['success' => true, 'data' => $estudiantes]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error.'], 500);
        }
    }

    /**
     * GET /estudiante/materias-carrera
     *
     * Devuelve todas las materias de la carrera del estudiante autenticado,
     * indicando para cada una si está inscrito y los datos de la oferta del
     * período activo (docente, horarios, paralelo).
     */
    public function materiasCarrera(Request $request): JsonResponse
    {
        try {
            /** @var \App\Models\Usuario $estudiante */
            $estudiante = $request->user();

            if (! $estudiante->carrera_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante no tiene carrera asignada.',
                ], 422);
            }

            // IDs de materias en las que el estudiante ya está inscrito
            $inscritasIds = \App\Models\EstudianteMateria::where('usuario_id', $estudiante->id)
                ->pluck('materia_id')
                ->toArray();

            // Período activo (puede ser null si no hay ninguno)
            $periodoActivo = \App\Models\Periodo::where('activo', true)->first();

            // Todas las materias de la carrera
            $materias = \App\Models\Materia::where('carrera_id', $estudiante->carrera_id)
                ->orderBy('nombre')
                ->get();

            $resultado = $materias->map(function (\App\Models\Materia $materia) use ($inscritasIds, $periodoActivo) {
                $inscrito = in_array($materia->id, $inscritasIds);

                // Oferta del período activo para esta materia (si existe)
                $oferta = null;
                if ($periodoActivo) {
                    $ofertaModel = MateriaPeriodo::with(['docente:id,nombre,email', 'horarios'])
                        ->where('periodo_id', $periodoActivo->id)
                        ->where('materia_id', $materia->id)
                        ->where('estado', 'activa')
                        ->first();

                    if ($ofertaModel) {
                        $oferta = [
                            'id'       => $ofertaModel->id,
                            'paralelo' => $ofertaModel->paralelo,
                            'estado'   => $ofertaModel->estado,
                            'docente'  => $ofertaModel->docente
                                ? ['id' => $ofertaModel->docente->id, 'nombre' => $ofertaModel->docente->nombre]
                                : null,
                            'horarios' => $ofertaModel->horarios,
                        ];
                    }
                }

                return [
                    'id'          => $materia->id,
                    'nombre'      => $materia->nombre,
                    'inscrito'    => $inscrito,
                    'oferta'      => $oferta,
                ];
            });

            return response()->json([
                'success'        => true,
                'periodo_activo' => $periodoActivo
                    ? ['id' => $periodoActivo->id, 'nombre' => $periodoActivo->nombre, 'tipo' => $periodoActivo->tipo]
                    : null,
                'data'           => $resultado,
            ]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al obtener materias.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /estudiante/inscribirse
     *
     * Permite al estudiante inscribirse a una materia.
     */
    public function inscribirse(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'materia_id' => 'required|exists:materias,id',
            ]);

            /** @var \App\Models\Usuario $estudiante */
            $estudiante = $request->user();

            if (! $estudiante->carrera_id) {
                return response()->json(['success' => false, 'message' => 'No tienes carrera asignada.'], 422);
            }

            // Verificar que la materia pertenece a su carrera
            $materia = \App\Models\Materia::find($data['materia_id']);
            if ((int) $materia->carrera_id !== (int) $estudiante->carrera_id) {
                return response()->json(['success' => false, 'message' => 'Esta materia no pertenece a tu carrera.'], 403);
            }

            // Verificar si ya está inscrito
            $existe = EstudianteMateria::where('usuario_id', $estudiante->id)
                ->where('materia_id', $data['materia_id'])
                ->exists();

            if ($existe) {
                return response()->json(['success' => false, 'message' => 'Ya estás inscrito en esta materia.'], 422);
            }

            // Inscribir
            EstudianteMateria::create([
                'usuario_id'        => $estudiante->id,
                'materia_id'        => $data['materia_id'],
                'fecha_inscripcion' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Inscripción exitosa.'], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al inscribirse.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /estudiante/desinscribirse
     *
     * Permite al estudiante desinscribirse de una materia.
     */
    public function desinscribirse(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'materia_id' => 'required|exists:materias,id',
            ]);

            /** @var \App\Models\Usuario $estudiante */
            $estudiante = $request->user();

            $deleted = EstudianteMateria::where('usuario_id', $estudiante->id)
                ->where('materia_id', $data['materia_id'])
                ->delete();

            if (! $deleted) {
                return response()->json(['success' => false, 'message' => 'No estabas inscrito en esta materia.'], 422);
            }

            return response()->json(['success' => true, 'message' => 'Desinscripción exitosa.']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al desinscribirse.', 'error' => $e->getMessage()], 500);
        }
    }
}
