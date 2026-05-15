<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocenteController extends Controller
{
    public function misMaterias(Request $request): JsonResponse
    {
        try {
            $docente = $request->user();
            if (!$docente) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autenticado.',
                ], 401);
            }

            // Obtener IDs de materias asignadas en periodos activos usando join directo
            $materiaIds = DB::table('materia_periodo')
                ->join('periodos', 'materia_periodo.periodo_id', '=', 'periodos.id')
                ->where('materia_periodo.docente_id', $docente->id)
                ->where('periodos.activo', true)
                ->distinct()
                ->pluck('materia_periodo.materia_id');

            // Obtener materias con sus conteos
            $materias = Materia::with('carrera')
                ->withCount(['estudiantes', 'actividades'])
                ->whereIn('id', $materiaIds)
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $materias,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Error en misMaterias', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()?->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    // GET /docente/historial — materias por periodo
    public function historial(Request $request): JsonResponse
    {
        $docente = $request->user();

        // Obtener todos los periodos donde el docente tuvo materias asignadas
        $ofertas = \App\Models\MateriaPeriodo::with(['materia.carrera', 'periodo'])
            ->where('docente_id', $docente->id)
            ->orderByDesc('created_at')
            ->get();

        // Agrupar por periodo
        $porPeriodo = $ofertas->groupBy('periodo_id')->map(function ($items) {
            $periodo = $items->first()->periodo;
            return [
                'periodo' => $periodo,
                'materias' => $items->map(fn ($o) => [
                    'id'           => $o->id,
                    'materia'      => $o->materia,
                    'paralelo'     => $o->paralelo,
                    'estado'       => $o->estado,
                    'observaciones'=> $o->observaciones,
                    'horarios'     => $o->horarios ?? [],
                ]),
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $porPeriodo]);
    }

    // GET /estudiante/historial — materias inscritas por periodo
    public function historialEstudiante(Request $request): JsonResponse
    {
        $estudiante = $request->user();

        // Materias en las que está inscrito
        $materiaIds = \App\Models\EstudianteMateria::where('usuario_id', $estudiante->id)
            ->pluck('materia_id');

        // Buscar en materia_periodo para obtener el contexto de periodo
        $ofertas = \App\Models\MateriaPeriodo::with(['materia.carrera', 'periodo', 'docente'])
            ->whereIn('materia_id', $materiaIds)
            ->orderByDesc('created_at')
            ->get();

        $porPeriodo = $ofertas->groupBy('periodo_id')->map(function ($items) {
            $periodo = $items->first()->periodo;
            return [
                'periodo' => $periodo,
                'materias' => $items->map(fn ($o) => [
                    'id'       => $o->id,
                    'materia'  => $o->materia,
                    'paralelo' => $o->paralelo,
                    'estado'   => $o->estado,
                    'docente'  => $o->docente ? ['nombre' => $o->docente->nombre] : null,
                    'horarios' => $o->horarios ?? [],
                ]),
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $porPeriodo]);
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

        // Usar SELECT DISTINCT directamente para garantizar unicidad
        $estudiantes = DB::table('estudiante_materia')
            ->join('usuarios', 'estudiante_materia.usuario_id', '=', 'usuarios.id')
            ->where('estudiante_materia.materia_id', $materia->id)
            ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email')
            ->distinct()
            ->orderBy('usuarios.nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $estudiantes,
            'meta' => ['timestamp' => now()->timestamp]
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate');
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

    public function misActividades(Request $request): JsonResponse
    {
        try {
            $docente = $request->user();

            // Obtener IDs de materias asignadas en periodos activos
            $materiaIds = DB::table('materia_periodo')
                ->join('periodos', 'materia_periodo.periodo_id', '=', 'periodos.id')
                ->where('materia_periodo.docente_id', $docente->id)
                ->where('periodos.activo', true)
                ->distinct()
                ->pluck('materia_periodo.materia_id');

            $actividades = \App\Models\Actividad::with(['materia:id,nombre', 'carrera:id,nombre'])
                ->where('creado_por', $docente->id)
                ->whereIn('materia_id', $materiaIds)
                ->orderBy('fecha_entrega', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $actividades,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    private function getMateriaDelDocente(Request $request, int $id): ?Materia
    {
        $docente = $request->user();

        // Verificar que el docente tiene esta materia asignada en algún periodo activo
        $tieneMateria = \App\Models\MateriaPeriodo::join('periodos', 'materia_periodo.periodo_id', '=', 'periodos.id')
            ->where('materia_periodo.materia_id', $id)
            ->where('materia_periodo.docente_id', $docente->id)
            ->where('periodos.activo', true)
            ->exists();

        if (!$tieneMateria) {
            return null;
        }

        return Materia::with(['estudiantes', 'actividades'])->find($id);
    }
}
