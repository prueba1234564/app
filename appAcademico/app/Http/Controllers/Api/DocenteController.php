<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocenteController extends Controller
{
    public function misMaterias(Request $request): JsonResponse
    {
        $docente = $request->user();

        $materias = Materia::with('carrera')
            ->withCount(['estudiantes', 'actividades'])
            ->whereHas('docentes', fn ($query) => $query->where('usuarios.id', $docente->id))
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $materias,
        ]);
    }

    public function estudiantesPorMateria(Request $request, int $id): JsonResponse
    {
        $materia = $this->getMateriaDelDocente($request, $id);

        if (! $materia) {
            return response()->json([
                'success' => false,
                'message' => 'Materia no encontrada o no asignada al docente.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $materia->estudiantes()
                ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email')
                ->orderBy('usuarios.nombre')
                ->get(),
        ]);
    }

    public function actividadesPorMateria(Request $request, int $id): JsonResponse
    {
        $materia = $this->getMateriaDelDocente($request, $id);

        if (! $materia) {
            return response()->json([
                'success' => false,
                'message' => 'Materia no encontrada o no asignada al docente.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $materia->actividades()
                ->with('creador:id,nombre,email')
                ->where('creado_por', $request->user()->id)
                ->latest('fecha_entrega')
                ->get(),
        ]);
    }

    private function getMateriaDelDocente(Request $request, int $id): ?Materia
    {
        return Materia::with(['estudiantes', 'actividades'])
            ->whereKey($id)
            ->whereHas('docentes', fn ($query) => $query->where('usuarios.id', $request->user()->id))
            ->first();
    }
}
