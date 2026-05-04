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
}
