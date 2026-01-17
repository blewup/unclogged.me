<?php
/**
 * Déboucheur Expert - Frontend Configuration API
 * Provides non-sensitive configuration to the frontend
 * 
 * For security, the Gemini API key is exposed here but should ideally
 * be proxied through a server-side endpoint. This is a compromise for
 * shared hosting where a proxy isn't practical.
 * 
 * Required PHP modules: json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/credentials.php';

// Only expose what the frontend needs
$config = SecureCredentials::getGeminiConfig();

// Rate limiting check (basic - can be enhanced)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateLimitFile = __DIR__ . '/logs/rate-limit-' . md5($ip) . '.txt';
$logDir = dirname($rateLimitFile);

if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$now = time();
$requests = [];

if (file_exists($rateLimitFile)) {
    $data = json_decode(file_get_contents($rateLimitFile), true) ?? [];
    // Keep only requests from last minute
    $requests = array_filter($data, fn($t) => $t > $now - 60);
}

// Allow 30 requests per minute per IP
if (count($requests) >= 30) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$requests[] = $now;
file_put_contents($rateLimitFile, json_encode($requests), LOCK_EX);

// Return config
echo json_encode([
    'gemini' => [
        'apiKey' => $config['api_key'],
        'model' => $config['model']
    ],
    'version' => '2.0.0'
]);
