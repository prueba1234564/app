<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facultad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class FacultadController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            return response()->json(Facultad::all(), 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $facultad = Facultad::create($validator->validated());

            return response()->json($facultad, 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $facultad = Facultad::with('carreras')->find($id);

            if (! $facultad) {
                return response()->json([
                    'message' => 'Facultad no encontrada.',
                ], 404);
            }

            return response()->json($facultad, 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $facultad = Facultad::find($id);

            if (! $facultad) {
                return response()->json([
                    'message' => 'Facultad no encontrada.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $facultad->update($validator->validated());

            return response()->json($facultad, 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $facultad = Facultad::find($id);

            if (! $facultad) {
                return response()->json([
                    'message' => 'Facultad no encontrada.',
                ], 404);
            }

            $facultad->delete();

            return response()->json([
                'message' => 'Facultad eliminada correctamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }
}
