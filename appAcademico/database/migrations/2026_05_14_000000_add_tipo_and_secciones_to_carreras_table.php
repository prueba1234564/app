<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carreras', function (Blueprint $table) {
            $table->enum('tipo', ['anual', 'semestral'])->default('anual')->after('facultad_id');
            $table->unsignedTinyInteger('secciones')->default(1)->after('tipo');
        });
    }

    public function down(): void
    {
        Schema::table('carreras', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'secciones']);
        });
    }
};
