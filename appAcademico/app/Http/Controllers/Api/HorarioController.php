<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Horario;
use App\Models\MateriaPeriodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class HorarioController extends Controller
{
    private function periodoCerradoResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Este periodo es historico y solo permite consulta.',
        ], 409);
    }

    // GET /director/horarios/oferta/{id}
    public function index(int $materiaPeriodoId): JsonResponse
    {
        try {
            $oferta = MateriaPeriodo::find($materiaPeriodoId);
            if (!$oferta) {
                return response()->json(['success' => false, 'message' => 'Oferta no encontrada.'], 404);
            }

            if (!$oferta->materia_id) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $horarios = Horario::where('materia_id', $oferta->materia_id)
                ->orderByRaw("FIELD(dia, 'lunes','martes','miercoles','jueves','viernes','sabado')")
                ->orderBy('hora_inicio')
                ->get();

            return response()->json(['success' => true, 'data' => $horarios]);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al obtener horarios: ' . $e->getMessage()], 500);
        }
    }

    // POST /director/horarios/oferta/{id}
    public function store(Request $request, int $materiaPeriodoId): JsonResponse
    {
        try {
            $oferta = MateriaPeriodo::with(['materia', 'periodo'])->find($materiaPeriodoId);
            if (!$oferta) {
                return response()->json(['success' => false, 'message' => 'Oferta no encontrada.'], 404);
            }

            if (!$oferta->periodo?->activo) {
                return $this->periodoCerradoResponse();
            }

            // Verificar que la materia existe
            if (!$oferta->materia) {
                return response()->json(['success' => false, 'message' => 'La materia de esta oferta no existe.'], 404);
            }

            // Verificar que el director es dueño de esta oferta
            $usuario = $request->user();
            if ($usuario->carrera_id && (int)$oferta->materia->carrera_id !== (int)$usuario->carrera_id) {
                return response()->json(['success' => false, 'message' => 'Sin permiso.'], 403);
            }

            $data = $request->validate([
                'dia'         => 'required|in:lunes,martes,miercoles,jueves,viernes,sabado',
                'hora_inicio' => 'required|date_format:H:i',
                'hora_fin'    => 'required|date_format:H:i|after:hora_inicio',
                'aula'        => 'nullable|string|max:50',
            ]);

            $horario = Horario::create([
                'materia_id'  => $oferta->materia_id,
                'dia'         => $data['dia'],
                'hora_inicio' => $data['hora_inicio'],
                'hora_fin'    => $data['hora_fin'],
                'aula'        => $data['aula'] ?? null,
            ]);

            return response()->json(['success' => true, 'data' => $horario], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Datos inválidos.', 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al crear horario: ' . $e->getMessage()], 500);
        }
    }

    // PUT /director/horarios/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $horario = Horario::find($id);
            if (!$horario) {
                return response()->json(['success' => false, 'message' => 'Horario no encontrado.'], 404);
            }

            $data = $request->validate([
                'dia'         => 'sometimes|in:lunes,martes,miercoles,jueves,viernes,sabado',
                'hora_inicio' => 'sometimes|date_format:H:i',
                'hora_fin'    => 'sometimes|date_format:H:i|after:hora_inicio',
                'aula'        => 'nullable|string|max:50',
            ]);

            $horario->update($data);

            return response()->json(['success' => true, 'data' => $horario]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Datos inválidos.', 'errors' => $e->errors()], 422);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al actualizar horario.'], 500);
        }
    }

    // DELETE /director/horarios/{id}
    public function destroy(int $id): JsonResponse
    {
        try {
            $horario = Horario::find($id);
            if (!$horario) {
                return response()->json(['success' => false, 'message' => 'Horario no encontrado.'], 404);
            }

            $horario->delete();
            return response()->json(['success' => true, 'message' => 'Horario eliminado.']);
        } catch (Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Error al eliminar horario.'], 500);
        }
    }
}
