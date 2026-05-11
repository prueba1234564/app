<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolUsuario;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Throwable;

class RegistroController extends Controller
{
    /**
     * POST /auth/registro
     *
     * Registro de estudiante con verificación automática por RU en PDF de matrícula.
     *
     * Campos:
     *   - nombre          (required)
     *   - email           (required, unique)
     *   - password        (required, min:6)
     *   - registro_universitario (required)
     *   - carrera_id      (required)
     *   - matricula_pdf   (required, file, pdf, max:5MB)
     */
    public function registro(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre'                  => ['required', 'string', 'max:255'],
                'email'                   => ['required', 'email', 'max:255', 'unique:usuarios,email'],
                'password'                => ['required', 'string', 'min:6'],
                'registro_universitario'  => ['required', 'string', 'max:50', 'unique:usuarios,registro_universitario'],
                'carrera_id'              => ['required', 'integer', 'exists:carreras,id'],
                'matricula_pdf'           => ['required', 'file', 'mimes:pdf', 'max:5120'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            $ru   = trim($data['registro_universitario']);

            // ── Guardar el PDF ──────────────────────────────────────────────
            $rutaPdf = $request->file('matricula_pdf')->store('matriculas', 'public');

            // ── Extraer texto del PDF y buscar el RU ────────────────────────
            $verificado = false;
            try {
                $rutaAbsoluta = storage_path('app/public/' . $rutaPdf);
                $parser       = new \Smalot\PdfParser\Parser();
                $pdf          = $parser->parseFile($rutaAbsoluta);
                $texto        = $pdf->getText();

                // Normalizar: quitar espacios extra, saltos de línea
                $textoNorm = preg_replace('/\s+/', ' ', $texto);

                // Buscar el RU en el texto del PDF (case-insensitive)
                // Acepta formatos: "RU-12345", "RU 12345", "12345", etc.
                $ruEscapado = preg_quote($ru, '/');
                $verificado = (bool) preg_match('/\b' . $ruEscapado . '\b/i', $textoNorm);

                \Log::info("Registro estudiante: RU={$ru}, encontrado_en_pdf={$verificado}");
            } catch (Throwable $pdfError) {
                // Si falla la lectura del PDF, dejamos verificado = false
                \Log::warning("No se pudo leer el PDF de matrícula: " . $pdfError->getMessage());
            }

            // ── Crear el usuario ────────────────────────────────────────────
            $usuario = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $ru, $rutaPdf, $verificado) {
                $carrera = \App\Models\Carrera::with('facultad')->find($data['carrera_id']);

                $usuario = Usuario::create([
                    'nombre'                 => $data['nombre'],
                    'email'                  => $data['email'],
                    'password'               => Hash::make($data['password']),
                    'registro_universitario' => $ru,
                    'carrera_id'             => $data['carrera_id'],
                    'facultad_id'            => $carrera?->facultad_id,
                    'matricula_pdf'          => $rutaPdf,
                    'esta_verificado'        => $verificado,
                ]);

                RolUsuario::create([
                    'usuario_id'  => $usuario->id,
                    'rol'         => 'estudiante',
                    'carrera_id'  => $data['carrera_id'],
                    'facultad_id' => $carrera?->facultad_id,
                ]);

                return $usuario->load(['rolesUsuario', 'carrera.facultad']);
            });

            return response()->json([
                'success'      => true,
                'verificado'   => $verificado,
                'message'      => $verificado
                    ? 'Registro exitoso. Tu cuenta ha sido verificada automáticamente.'
                    : 'Registro exitoso. Tu RU no pudo verificarse en el PDF. Un administrador revisará tu cuenta.',
                'data'         => [
                    'id'                     => $usuario->id,
                    'nombre'                 => $usuario->nombre,
                    'email'                  => $usuario->email,
                    'registro_universitario' => $usuario->registro_universitario,
                    'esta_verificado'        => $usuario->esta_verificado,
                ],
            ], 201);

        } catch (Throwable $e) {
            \Log::error('Error en registro de estudiante: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage(),
            ], 500);
        }
    }
}
