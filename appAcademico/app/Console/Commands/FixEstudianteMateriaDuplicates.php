<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixEstudianteMateriaDuplicates extends Command
{
    protected $signature = 'fix:estudiante-materia-duplicates';
    protected $description = 'Elimina registros duplicados en estudiante_materia';

    public function handle()
    {
        $this->info('Buscando duplicados...');

        // Encontrar duplicados (materia_id, usuario_id) con múltiples registros
        $duplicados = DB::table('estudiante_materia')
            ->select('materia_id', 'usuario_id', DB::raw('COUNT(*) as cant'))
            ->groupBy('materia_id', 'usuario_id')
            ->having('cant', '>', 1)
            ->get();

        $this->info("Duplicados encontrados: " . $duplicados->count());

        foreach ($duplicados as $dup) {
            $this->info("Materia ID: {$dup->materia_id}, Usuario ID: {$dup->usuario_id}, Cant: {$dup->cant}");

            // Obtener todos los registros excepto el más antiguo (el primero)
            \$ids = DB::table('estudiante_materia')
                ->where('materia_id', \$dup->materia_id)
                ->where('usuario_id', \$dup->usuario_id)
                ->orderBy('id') // el más antiguo primero
                ->pluck('id')
                ->toArray();

            // Mantener el primer ID, eliminar el resto
            \$idsToDelete = array_slice(\$ids, 1);

            if (!empty(\$idsToDelete)) {
                DB::table('estudiante_materia')->whereIn('id', \$idsToDelete)->delete();
                $this->info("  Eliminados: " . count(\$idsToDelete) . " registros");
            }
        }

        $this->info('¡Listo!');
        return 0;
    }
}
