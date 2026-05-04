<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class PeriodoController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => Periodo::orderByDesc('fecha_inicio')->get(),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:100'],
                'tipo' => ['required', 'in:semestre,temporada'],
                'fecha_inicio' => ['required', 'date'],
                'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
                'activo' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            $periodo = DB::transaction(function () use ($data) {
                if (!empty($data['activo'])) {
                    Periodo::query()->update(['activo' => false]);
                }

                return Periodo::create([
                    'nombre' => $data['nombre'],
                    'tipo' => $data['tipo'],
                    'fecha_inicio' => $data['fecha_inicio'],
                    'fecha_fin' => $data['fecha_fin'],
                    'activo' => (bool)($data['activo'] ?? false),
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Periodo creado correctamente.',
                'data' => $periodo,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Periodo no encontrado.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $periodo,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Periodo no encontrado.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => ['sometimes', 'string', 'max:100'],
                'tipo' => ['sometimes', 'in:semestre,temporada'],
                'fecha_inicio' => ['sometimes', 'date'],
                'fecha_fin' => ['sometimes', 'date'],
                'activo' => ['nullable', 'boolean'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            $updated = DB::transaction(function () use ($periodo, $data) {
                if (array_key_exists('activo', $data) && $data['activo']) {
                    Periodo::query()->update(['activo' => false]);
                }

                $periodo->update($data);

                return $periodo;
            });

            return response()->json([
                'success' => true,
                'message' => 'Periodo actualizado correctamente.',
                'data' => $updated,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Periodo no encontrado.',
                ], 404);
            }

            $periodo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Periodo eliminado correctamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function activo(): JsonResponse
    {
        try {
            $periodo = Periodo::query()->where('activo', true)->first();

            if (!$periodo) {
                $periodo = Periodo::query()->vigenteHoy()->orderByDesc('fecha_inicio')->first();
            }

            return response()->json([
                'success' => true,
                'data' => $periodo,
            ], 200);
        } catch (Throwable $e) {
            \Log::error('Error en PeriodoController::activo(): ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function activar(int $id): JsonResponse
    {
        try {
            $periodo = Periodo::find($id);

            if (!$periodo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Periodo no encontrado.',
                ], 404);
            }

            $periodo = DB::transaction(function () use ($periodo) {
                Periodo::query()->update(['activo' => false]);
                $periodo->update(['activo' => true]);
                return $periodo;
            });

            return response()->json([
                'success' => true,
                'message' => 'Periodo activado correctamente.',
                'data' => $periodo,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }
}
