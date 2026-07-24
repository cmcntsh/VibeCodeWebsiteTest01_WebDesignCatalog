<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: strict-origin-when-cross-origin');

$requestId = bin2hex(random_bytes(8));
header('X-Request-ID: ' . $requestId);

/** @return never */
function respond(int $status, string $message, array $extra = []): never
{
    global $requestId;
    http_response_code($status);
    echo json_encode(array_merge([
        'ok' => $status >= 200 && $status < 300,
        'message' => $message,
        'requestId' => $requestId,
    ], $extra), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function loadConfig(): ?array
{
    $paths = [
        dirname(__DIR__) . '/wdtc-private/config.php',
        __DIR__ . '/private/config.php',
    ];
    foreach ($paths as $path) {
        if (!is_readable($path)) {
            continue;
        }
        $loaded = require $path;
        if (is_array($loaded)) {
            return $loaded;
        }
    }
    return null;
}

function headerValue(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}

function utf8Clean(string $value): string
{
    $value = str_replace("\0", '', trim($value));
    if ($value === '' || preg_match('//u', $value) === 1) {
        return $value;
    }
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
        if (is_string($converted)) {
            return $converted;
        }
    }
    return preg_replace('/[\x80-\xFF]/', '', $value) ?? '';
}

function utf8Length(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    $count = preg_match_all('/./us', $value, $matches);
    return $count === false ? strlen($value) : $count;
}

function utf8Slice(string $value, int $maximum): string
{
    if ($maximum < 1 || $value === '') {
        return '';
    }
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maximum, 'UTF-8');
    }
    $count = preg_match_all('/./us', $value, $matches);
    if ($count === false) {
        return substr($value, 0, $maximum);
    }
    return implode('', array_slice($matches[0], 0, $maximum));
}

function field(string $name, int $maximum = 5000): string
{
    $raw = $_POST[$name] ?? '';
    if (is_array($raw)) {
        return '';
    }
    return utf8Slice(utf8Clean((string)$raw), $maximum);
}

function urlOrigin(string $value): string
{
    $parts = parse_url($value);
    if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
        return '';
    }
    $scheme = strtolower((string)$parts['scheme']);
    if (!in_array($scheme, ['http', 'https'], true)) {
        return '';
    }
    $host = strtolower((string)$parts['host']);
    $portNumber = isset($parts['port']) ? (int)$parts['port'] : null;
    $isDefaultPort = ($scheme === 'https' && $portNumber === 443) || ($scheme === 'http' && $portNumber === 80);
    $port = $portNumber !== null && !$isDefaultPort ? ':' . $portNumber : '';
    return $scheme . '://' . $host . $port;
}

function currentOrigin(): string
{
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $scheme = $https ? 'https' : 'http';
    $host = headerValue((string)($_SERVER['HTTP_HOST'] ?? ''));
    return $host === '' ? '' : urlOrigin($scheme . '://' . $host);
}

function configuredOrigins(array $config): array
{
    $origins = [];
    foreach ((array)($config['allowed_origins'] ?? []) as $value) {
        if (!is_string($value)) {
            continue;
        }
        $origin = urlOrigin(trim($value));
        if ($origin !== '') {
            $origins[] = $origin;
        }
    }
    if ($origins === []) {
        $current = currentOrigin();
        if ($current !== '') {
            $origins[] = $current;
        }
    }
    return array_values(array_unique($origins));
}

function verifyRequestOrigin(array $config): void
{
    $originHeader = headerValue((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $refererHeader = headerValue((string)($_SERVER['HTTP_REFERER'] ?? ''));
    $reported = $originHeader !== '' ? urlOrigin($originHeader) : urlOrigin($refererHeader);
    if ($reported !== '' && !in_array($reported, configuredOrigins($config), true)) {
        respond(403, 'The form origin could not be verified. Reload the page and try again.');
    }
}

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function issueToken(array $config): string
{
    $secret = (string)($config['csrf_secret'] ?? '');
    if (strlen($secret) < 32) {
        throw new RuntimeException('The CSRF secret is missing or too short.');
    }
    $issuedAtMs = (string)(int)round(microtime(true) * 1000);
    $nonce = base64UrlEncode(random_bytes(18));
    $signature = base64UrlEncode(hash_hmac('sha256', $issuedAtMs . '.' . $nonce, $secret, true));
    return $issuedAtMs . '.' . $nonce . '.' . $signature;
}

function verifyToken(string $token, array $config): void
{
    $secret = (string)($config['csrf_secret'] ?? '');
    $parts = explode('.', $token);
    if (strlen($secret) < 32 || count($parts) !== 3 || !ctype_digit($parts[0])) {
        respond(419, 'The form security token is invalid. Reload the page and try again.');
    }
    [$issuedText, $nonce, $signature] = $parts;
    if ($nonce === '' || $signature === '') {
        respond(419, 'The form security token is invalid. Reload the page and try again.');
    }
    $expected = base64UrlEncode(hash_hmac('sha256', $issuedText . '.' . $nonce, $secret, true));
    if (!hash_equals($expected, $signature)) {
        respond(419, 'The form security token is invalid. Reload the page and try again.');
    }
    $ageMs = (int)round(microtime(true) * 1000) - (int)$issuedText;
    $minimumMs = max(500, (int)($config['minimum_submit_ms'] ?? 2500));
    $maximumMs = max(300000, (int)($config['token_max_age'] ?? 7200) * 1000);
    if ($ageMs < $minimumMs) {
        respond(429, 'The form was submitted too quickly. Please wait a moment and try again.');
    }
    if ($ageMs > $maximumMs || $ageMs < 0) {
        respond(419, 'The form security token expired. Reload the page and try again.');
    }
}

function validHttpUrl(string $value): bool
{
    if (!filter_var($value, FILTER_VALIDATE_URL)) {
        return false;
    }
    return in_array(strtolower((string)parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true);
}

function enforceRateLimit(array $config): void
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $window = max(60, (int)($config['rate_limit_window'] ?? 3600));
    $limit = max(1, (int)($config['rate_limit_max'] ?? 5));
    $salt = (string)($config['rate_limit_salt'] ?? '');
    if (strlen($salt) < 16) {
        throw new RuntimeException('The rate-limit salt is missing or too short.');
    }
    $path = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
        . 'wdtc-form-' . hash('sha256', $ip . '|' . $salt) . '.json';
    $handle = @fopen($path, 'c+');
    if ($handle === false) {
        error_log('WDTC form ' . $GLOBALS['requestId'] . ': rate-limit store could not be opened.');
        return;
    }

    $limited = false;
    try {
        if (!flock($handle, LOCK_EX)) {
            error_log('WDTC form ' . $GLOBALS['requestId'] . ': rate-limit store could not be locked.');
            return;
        }
        rewind($handle);
        $decoded = json_decode(stream_get_contents($handle) ?: '[]', true);
        $now = time();
        $timestamps = is_array($decoded) ? $decoded : [];
        $timestamps = array_values(array_filter($timestamps, static function ($stamp) use ($now, $window): bool {
            return is_int($stamp) && $stamp > $now - $window;
        }));
        if (count($timestamps) >= $limit) {
            $limited = true;
        } else {
            $timestamps[] = $now;
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, json_encode($timestamps));
            fflush($handle);
        }
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
    if ($limited) {
        respond(429, 'Too many messages were submitted from this connection. Please try again later.');
    }
}

/** @return array{0:int,1:string} */
function smtpRead($socket): array
{
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (preg_match('/^([0-9]{3}) /', $line, $match) === 1) {
            return [(int)$match[1], trim($response)];
        }
    }
    $meta = stream_get_meta_data($socket);
    if (!empty($meta['timed_out'])) {
        throw new RuntimeException('SMTP response timed out.');
    }
    return [0, trim($response)];
}

function smtpCommand($socket, string $command, array $expected, bool $redact = false): void
{
    if ($command !== '' && fwrite($socket, $command . "\r\n") === false) {
        throw new RuntimeException('SMTP write failed.');
    }
    [$code, $response] = smtpRead($socket);
    if (!in_array($code, $expected, true)) {
        $shown = $redact ? '[redacted command]' : $command;
        throw new RuntimeException('SMTP command failed: ' . $shown . '; response ' . $response);
    }
}

function mimeHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode(headerValue($value)) . '?=';
}

function sendSmtp(array $config, string $replyName, string $replyEmail, string $subject, string $body): void
{
    $host = headerValue((string)($config['smtp_host'] ?? ''));
    $port = (int)($config['smtp_port'] ?? 465);
    $encryption = strtolower((string)($config['smtp_encryption'] ?? 'ssl'));
    $username = headerValue((string)($config['smtp_username'] ?? ''));
    $password = (string)($config['smtp_password'] ?? '');
    $timeout = max(5, min(60, (int)($config['smtp_timeout'] ?? 20)));
    $fromEmail = headerValue((string)($config['from_email'] ?? $username));
    $fromName = headerValue((string)($config['from_name'] ?? 'Web Design Trend Catalog'));
    $toEmail = headerValue((string)($config['to_email'] ?? ''));
    $toName = headerValue((string)($config['to_name'] ?? 'Web Design Trend Catalog'));

    if (
        $host === '' || $username === '' || $password === ''
        || !filter_var($username, FILTER_VALIDATE_EMAIL)
        || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)
        || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)
        || !in_array($encryption, ['ssl', 'tls', 'starttls', 'none'], true)
    ) {
        throw new RuntimeException('SMTP configuration is incomplete.');
    }

    $transport = $encryption === 'ssl' ? 'ssl://' : '';
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'allow_self_signed' => false,
        'peer_name' => $host,
        'SNI_enabled' => true,
    ]]);
    $socket = @stream_socket_client(
        $transport . $host . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );
    if ($socket === false) {
        throw new RuntimeException('SMTP connection failed: ' . $errno . ' ' . $errstr);
    }
    stream_set_timeout($socket, $timeout);

    try {
        smtpCommand($socket, '', [220]);
        $hostname = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['SERVER_NAME'] ?? 'localhost.localdomain'));
        $hostname = $hostname !== '' ? $hostname : 'localhost.localdomain';
        smtpCommand($socket, 'EHLO ' . $hostname, [250]);
        if ($encryption === 'tls' || $encryption === 'starttls') {
            smtpCommand($socket, 'STARTTLS', [220]);
            if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
                throw new RuntimeException('Could not enable SMTP TLS encryption.');
            }
            smtpCommand($socket, 'EHLO ' . $hostname, [250]);
        }
        smtpCommand($socket, 'AUTH LOGIN', [334]);
        smtpCommand($socket, base64_encode($username), [334], true);
        smtpCommand($socket, base64_encode($password), [235], true);
        smtpCommand($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
        smtpCommand($socket, 'RCPT TO:<' . $toEmail . '>', [250, 251]);
        smtpCommand($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . mimeHeader($fromName) . ' <' . $fromEmail . '>',
            'To: ' . mimeHeader($toName) . ' <' . $toEmail . '>',
            'Reply-To: ' . mimeHeader($replyName) . ' <' . headerValue($replyEmail) . '>',
            'Subject: ' . mimeHeader($subject),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $hostname . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'Auto-Submitted: no',
            'X-Auto-Response-Suppress: All',
            'X-Mailer: WDTC Static Site Form',
        ];
        $normalizedBody = str_replace(["\r\n", "\r"], "\n", $body);
        $encodedBody = rtrim(chunk_split(base64_encode($normalizedBody), 76, "\r\n"));
        $payload = implode("\r\n", $headers) . "\r\n\r\n" . $encodedBody;
        if (fwrite($socket, $payload . "\r\n.\r\n") === false) {
            throw new RuntimeException('SMTP message write failed.');
        }
        [$code, $response] = smtpRead($socket);
        if ($code !== 250) {
            throw new RuntimeException('SMTP server rejected the message: ' . $response);
        }
        @fwrite($socket, "QUIT\r\n");
    } finally {
        fclose($socket);
    }
}

$config = loadConfig();
if (!is_array($config)) {
    error_log('WDTC form ' . $requestId . ': private SMTP configuration was not found.');
    respond(503, 'The contact form is not configured yet. Please try again later.');
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? ''));
if ($method === 'GET' && (string)($_GET['action'] ?? '') === 'token') {
    verifyRequestOrigin($config);
    try {
        respond(200, 'Security token issued.', [
            'token' => issueToken($config),
            'expiresIn' => max(300, (int)($config['token_max_age'] ?? 7200)),
            'minimumDelayMs' => max(500, (int)($config['minimum_submit_ms'] ?? 2500)),
        ]);
    } catch (Throwable $error) {
        error_log('WDTC form ' . $requestId . ': token error: ' . $error->getMessage());
        respond(503, 'The contact form security service is not configured yet.');
    }
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, 'This endpoint accepts protected form submissions only.');
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 70000) {
    respond(413, 'The submitted message is too large.');
}

verifyRequestOrigin($config);
verifyToken(field('csrf_token', 500), $config);

if (field('company_website', 200) !== '') {
    respond(200, 'Thank you. Your message has been received.');
}

$formType = field('form_type', 40);
if (!in_array($formType, ['contact', 'contribution'], true)) {
    respond(422, 'Choose a valid form type.');
}
$name = field('name', 120);
$email = field('email', 254);
$topic = field('topic', 120);
$message = field('message', 5000);
$trendName = field('trend_name', 160);
$sourceUrl = field('source_url', 500);
$consent = field('consent', 10);

$topicSets = [
    'contact' => [
        'General enquiry',
        'Education partnership',
        'Press or interview',
        'Licensing or image rights',
        'Technical issue',
        'Other',
    ],
    'contribution' => [
        'Missing trend',
        'Alternate term',
        'Historical example',
        'Correction',
        'Source or citation',
        'Image credit',
    ],
];

$errors = [];
if (utf8Length($name) < 2) {
    $errors[] = 'Enter your name.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Enter a valid email address.';
}
if (!in_array($topic, $topicSets[$formType], true)) {
    $errors[] = 'Choose a valid topic.';
}
if (utf8Length($message) < 20) {
    $errors[] = 'Enter at least 20 characters in the message.';
}
if ($consent !== 'yes') {
    $errors[] = 'Consent is required before submission.';
}
if ($sourceUrl !== '' && !validHttpUrl($sourceUrl)) {
    $errors[] = 'Enter a valid HTTP or HTTPS supporting source URL.';
}
if ($errors !== []) {
    respond(422, implode(' ', $errors));
}

try {
    enforceRateLimit($config);
    $lines = [
        'Request ID: ' . $requestId,
        'Form: ' . $formType,
        'Topic: ' . $topic,
        'Name: ' . $name,
        'Email: ' . $email,
    ];
    if ($trendName !== '') {
        $lines[] = 'Trend or page: ' . $trendName;
    }
    if ($sourceUrl !== '') {
        $lines[] = 'Supporting source: ' . $sourceUrl;
    }
    $lines[] = 'Submitted from: ' . headerValue((string)($_SERVER['HTTP_REFERER'] ?? currentOrigin()));
    $lines[] = 'Time (UTC): ' . gmdate('Y-m-d H:i:s') . ' UTC';
    $lines[] = '';
    $lines[] = 'Message:';
    $lines[] = $message;

    $subjectPrefix = $formType === 'contribution' ? '[WDTC Contribution]' : '[WDTC Contact]';
    sendSmtp($config, $name, $email, $subjectPrefix . ' ' . $topic . ' — ' . $name, implode("\n", $lines));
    respond(200, $formType === 'contribution'
        ? 'Thank you. Your contribution has been submitted for review.'
        : 'Thank you. Your message has been sent.');
} catch (Throwable $error) {
    error_log('WDTC form ' . $requestId . ': delivery error: ' . $error->getMessage());
    respond(502, 'The message could not be delivered. Please try again later.');
}
