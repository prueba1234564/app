<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MateriaPeriodo;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class MateriaPeriodoController extends Controller
{
    private function periodoCerradoResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Este periodo es historico y solo permite consulta.',
        ], 409);
    }

    private function ofertaEsEditable(MateriaPeriodo $oferta): bool
    {
        $oferta->loadMissing('periodo');

        return (bool) $oferta->periodo?->activo;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = MateriaPeriodo::query()
                ->with(['materia.carrera', 'periodo', 'docente', 'horarios']);

            if ($request->has('periodo_id')) {
                $query->delPeriodo($request->periodo_id);
            }

            if ($request->has('docente_id')) {
                $query->delDocente($request->docente_id);
            }

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->boolean('solo_activas')) {
                $query->activa();
            }

            $ofertas = $query->orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $ofertas,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ofertas académicas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'periodo_id' => 'required|exists:periodos,id',
            'materia_id' => 'required|exists:materias,id',
            'docente_id' => 'nullable|exists:usuarios,id',
            'paralelo'   => 'nullable|string|max:10',
            'estado' => 'in:activa,cancelada,finalizada',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $periodo = Periodo::find($request->periodo_id);

            if (!$periodo?->activo) {
                return $this->periodoCerradoResponse();
            }

            $exists = MateriaPeriodo::where('periodo_id', $request->periodo_id)
                ->where('materia_id', $request->materia_id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'La materia ya está asignada a este período.',
                ], 422);
            }

            // Si es director, verificar que la materia pertenece a su carrera
            $usuario = $request->user();
            $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
            $rolActivo = collect($habilidades)->first(fn (string $h) => $h !== '*');

            if ($rolActivo === 'director' && $usuario->carrera_id) {
                $materia = \App\Models\Materia::find($request->materia_id);
                if (!$materia || (int)$materia->carrera_id !== (int)$usuario->carrera_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puedes agregar materias de otra carrera.',
                    ], 403);
                }
            }

            $oferta = MateriaPeriodo::create($validator->validated());
            $oferta->load(['materia.carrera', 'periodo', 'docente']);

            return response()->json([
                'success' => true,
                'data' => $oferta,
                'message' => 'Oferta académica creada exitosamente.',
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear oferta académica.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $oferta = MateriaPeriodo::with(['materia.carrera', 'periodo', 'docente'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $oferta,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Oferta académica no encontrada.',
            ], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $oferta = MateriaPeriodo::findOrFail($id);

            if (!$this->ofertaEsEditable($oferta)) {
                return $this->periodoCerradoResponse();
            }

            $validator = Validator::make($request->all(), [
                'docente_id' => 'nullable|exists:usuarios,id',
                'paralelo'   => 'nullable|string|max:10',
                'estado' => 'in:activa,cancelada,finalizada',
                'observaciones' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $oferta->update($validator->validated());
            $oferta->load(['materia.carrera', 'periodo', 'docente']);

            return response()->json([
                'success' => true,
                'data' => $oferta,
                'message' => 'Oferta académica actualizada exitosamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar oferta académica.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $oferta = MateriaPeriodo::findOrFail($id);

            if (!$this->ofertaEsEditable($oferta)) {
                return $this->periodoCerradoResponse();
            }

            $oferta->delete();

            return response()->json([
                'success' => true,
                'message' => 'Oferta académica eliminada exitosamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar oferta académica.',
            ], 500);
        }
    }

    public function porPeriodoActivo(Request $request): JsonResponse
    {
        try {
            $periodo = Periodo::query()->where('activo', true)->first();

            if (!$periodo) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay período activo.',
                ], 404);
            }

            $query = MateriaPeriodo::query()
                ->delPeriodo($periodo->id)
                ->activa()
                ->with(['materia.carrera', 'docente', 'horarios']);

            // Si el usuario es director, filtrar por su carrera
            $usuario = $request->user();
            $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
            $rolActivo = collect($habilidades)->first(fn (string $h) => $h !== '*');

            if ($rolActivo === 'director' && $usuario->carrera_id) {
                $query->whereHas('materia', fn ($q) => $q->where('carrera_id', $usuario->carrera_id));
            }

            $ofertas = $query->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => $periodo,
                    'ofertas' => $ofertas,
                ],
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ofertas del período activo.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function porDocente(Request $request, $docenteId): JsonResponse
    {
        try {
            $periodoId = $request->query('periodo_id');
            
            $query = MateriaPeriodo::query()
                ->delDocente($docenteId)
                ->activa()
                ->with(['materia.carrera', 'periodo']);

            if ($periodoId) {
                $query->delPeriodo($periodoId);
            }

            $ofertas = $query->orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $ofertas,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener materias del docente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function asignarDocente(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'docente_id' => 'required|exists:usuarios,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $oferta = MateriaPeriodo::findOrFail($id);

            if (!$this->ofertaEsEditable($oferta)) {
                return $this->periodoCerradoResponse();
            }

            $oferta->update(['docente_id' => $request->docente_id]);
            $oferta->load(['materia.carrera', 'periodo', 'docente']);

            return response()->json([
                'success' => true,
                'data' => $oferta,
                'message' => 'Docente asignado exitosamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar docente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
