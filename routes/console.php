<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Election schedule (no cron required)
|--------------------------------------------------------------------------
|
| Election open / scheduled / closed statuses are updated on every web
| request via SynchronizeElectionStatusesFromSchedule middleware. You can
| still run `php artisan elections:sync-statuses` manually if needed.
|
| If you later add Laravel's scheduler to cron (`* * * * * php artisan
| schedule:run`), you may register optional tasks here.
|
*/
