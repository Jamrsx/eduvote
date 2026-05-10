<?php

use Illuminate\Support\Facades\Route;

test('public registration routes are not registered', function () {
    expect(Route::has('register'))->toBeFalse()
        ->and(Route::has('register.store'))->toBeFalse();
});
