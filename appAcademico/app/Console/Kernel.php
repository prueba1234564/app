<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\FixEstudianteMateriaDuplicates;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        FixEstudianteMateriaDuplicates::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        // Define tus tareas programadas aquí si es necesario
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
