<?php
/**
 * Simple backend endpoint to log consented client data.
 * When a visitor accepts the cookie banner on the front‑end, their browser
 * sends a POST request with JSON containing basic diagnostics such as
 * timezone, language, screen resolution and user agent.  This script
 * appends those details to a log file under api/conscent so you can
 * analyse aggregate statistics later.  No data is logged unless the
 * visitor explicitly provides consent.
 */

// Ensure the conscent directory exists
$dir = __DIR__ . '/conscent';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}
$logFile = $dir . '/conscent.log';

// Read POST body
$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!is_array($data)) {
    $data = [];
}

// Collect server side info as well
$entry = [
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
    'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'tz' => $data['tz'] ?? '',
    'lang' => $data['lang'] ?? '',
    'theme' => $data['theme'] ?? '',
    'screen' => $data['screen'] ?? '',
    'uaClient' => $data['ua'] ?? ''
];

// Append to log as JSON line
$line = json_encode($entry) . PHP_EOL;
file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

// Return success response
header('Content-Type: application/json');
echo json_encode(['status' => 'ok']);
exit;