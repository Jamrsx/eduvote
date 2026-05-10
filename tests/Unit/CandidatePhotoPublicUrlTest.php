<?php

use App\Models\Candidate;

test('photo public url prefixes storage path', function () {
    $candidate = new Candidate(['photo_path' => 'candidate-photos/1/face.jpg']);

    expect($candidate->photoPublicUrl())->toBe('/storage/candidate-photos/1/face.jpg');
});

test('photo public url strips leading slashes on path', function () {
    $candidate = new Candidate(['photo_path' => '/candidate-photos/2/x.png']);

    expect($candidate->photoPublicUrl())->toBe('/storage/candidate-photos/2/x.png');
});

test('photo public url returns null when path missing', function () {
    expect((new Candidate(['photo_path' => null]))->photoPublicUrl())->toBeNull();
    expect((new Candidate(['photo_path' => '']))->photoPublicUrl())->toBeNull();
});
