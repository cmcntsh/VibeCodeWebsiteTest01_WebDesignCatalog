<?php
// Preferred Hostinger location: create wdtc-private/config.php in the directory
// that contains public_html. Never commit or expose the completed configuration.
return [
    'smtp_host' => 'smtp.hostinger.com',
    'smtp_port' => 465,
    'smtp_encryption' => 'ssl', // Use "tls" with port 587 only when required.
    'smtp_username' => 'forms@your-domain.example',
    'smtp_password' => 'REPLACE_WITH_THE_MAILBOX_PASSWORD',
    'from_email' => 'forms@your-domain.example',
    'from_name' => 'Web Design Trend Catalog',
    'to_email' => 'hello@your-domain.example',
    'to_name' => 'Web Design Trend Catalog',
    'allowed_origins' => [
        'https://your-domain.example',
        'https://www.your-domain.example',
    ],
    'minimum_submit_ms' => 2500,
    'token_max_age' => 7200,
    'csrf_secret' => 'REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
    'rate_limit_window' => 3600,
    'rate_limit_max' => 5,
    'rate_limit_salt' => 'REPLACE_WITH_A_DIFFERENT_LONG_RANDOM_STRING',
    'smtp_timeout' => 20,
];
