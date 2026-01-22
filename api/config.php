<?php
declare(strict_types=1);
/**
 * Déboucheur Expert - Frontend Configuration API
 * Provides non-sensitive configuration to the frontend
 * 
 * @version 2.1.0 - Modernized with security module
 * @requires PHP 8.2+
 */

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/credentials.php';

// Apply security headers and CORS
SecurityHeaders::apply(isApi: true);
SecurityHeaders::cors(['GET', 'OPTIONS']);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    JsonResponse::error('Method not allowed', 405);
}

// Apply rate limiting (30 requests per minute)
$rateLimiter = new RateLimiter();
$rateLimiter->enforce(maxRequests: 30, windowSeconds: 60);

// Get configuration
$config = SecureCredentials::getGeminiConfig();

// Validate API key was decrypted successfully
if (empty($config['api_key'])) {
    SecurityLogger::error('Gemini API key decryption failed');
    JsonResponse::error('Configuration unavailable', 503);
}

// Return config
JsonResponse::success([
    'gemini' => [
        'apiKey' => $config['api_key'],
        'model' => $config['model']
    ],
    'version' => '2.1.0'
]);
