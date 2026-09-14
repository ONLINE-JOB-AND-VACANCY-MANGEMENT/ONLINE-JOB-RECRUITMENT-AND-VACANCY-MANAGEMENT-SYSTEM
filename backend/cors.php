<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    // Was 0 (no caching), forcing a fresh OPTIONS preflight round-trip before every
    // single authenticated request (anything sending the Authorization header).
    // 24 hours is a safe, standard value — the browser just stops re-asking permission
    // it already has for that long.
    'max_age' => 86400,
    'supports_credentials' => true,
];
