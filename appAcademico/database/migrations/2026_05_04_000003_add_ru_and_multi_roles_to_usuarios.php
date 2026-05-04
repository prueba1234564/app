<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('registro_universitario', 20)
                ->nullable()
                ->unique()
                ->after('email')
                ->comment('RU - solo requerido para estudiantes');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropUnique(['registro_universitario']);
            $table->dropColumn('registro_universitario');
        });
    }
};
