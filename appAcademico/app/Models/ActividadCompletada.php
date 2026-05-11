<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActividadCompletada extends Model
{
    protected $table = 'actividad_completada';

    protected $fillable = [
        'usuario_id',
        'actividad_id',
        'completada_en',
    ];

    protected $casts = [
        'completada_en' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }
}
