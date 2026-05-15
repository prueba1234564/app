<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocenteMateria extends Model
{
    use HasFactory;

    protected $table = 'docente_materia';

    protected $fillable = [
        'usuario_id',
        'materia_id',
        'fecha_asignacion',
    ];

    protected $casts = [
        'fecha_asignacion' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }
}
