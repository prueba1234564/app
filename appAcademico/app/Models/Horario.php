<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Horario extends Model
{
    use HasFactory;

    protected $table = 'horarios';

    protected $fillable = [
        'materia_id',
        'dia',
        'hora_inicio',
        'hora_fin',
        'aula',
    ];

    protected $casts = [
        'dia' => 'string',
        'hora_inicio' => 'datetime:H:i:s',
        'hora_fin' => 'datetime:H:i:s',
    ];

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }
}
