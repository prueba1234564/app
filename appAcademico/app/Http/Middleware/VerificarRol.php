<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarRol
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        $tieneRol = collect($roles)->some(fn (string $rol) => $usuario?->tokenCan($rol));

        if (! $usuario || ! $tieneRol) {
            return response()->json([
                'message' => 'No tienes permiso para esta acción',
            ], 403);
        }

        return $next($request);
    }
}
