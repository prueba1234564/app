<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstudianteMateria extends Model
{
    use HasFactory;

    protected $table = 'estudiante_materia';

    protected $fillable = [
        'usuario_id',
        'materia_id',
        'fecha_inscripcion',
    ];

    protected $casts = [
        'fecha_inscripcion' => 'datetime',
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
