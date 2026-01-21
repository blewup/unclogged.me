<?php
declare(strict_types=1);
/**
 * Déboucheur Expert - Security Module
 * Provides security headers, CSRF protection, input validation, and rate limiting
 * 
 * @version 2.0.0
 * @requires PHP 8.2+
 */

// ============================================================================
// SECURITY HEADERS
// ============================================================================

final class SecurityHeaders
{
    private const ALLOWED_ORIGINS = [
        'https://deboucheur.expert',
        'https://www.deboucheur.expert',
        'https://unclogged.me',
        'https://www.unclogged.me',
        'http://localhost:3000',
        'http://localhost:8080',
    ];

    /**
     * Set comprehensive security headers
     */
    public static function apply(bool $isApi = true): void
    {
        // Prevent clickjacking
        header('X-Frame-Options: SAMEORIGIN');
        
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Enable XSS filter
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions policy (Feature-Policy replacement)
        header("Permissions-Policy: geolocation=(self), microphone=(), camera=(), payment=()");
        
        // Content Security Policy
        if (!$isApi) {
            $csp = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://generativelanguage.googleapis.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com data:",
                "img-src 'self' data: blob: https: http:",
                "connect-src 'self' https://deboucheur.expert https://unclogged.me https://generativelanguage.googleapis.com wss:",
                "frame-src 'self' https://www.google.com https://maps.google.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ];
            header('Content-Security-Policy: ' . implode('; ', $csp));
        }
        
        // HSTS - only on HTTPS
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Remove server version headers
        header_remove('X-Powered-By');
        header_remove('Server');
    }

    /**
     * Set CORS headers based on allowed origins
     */
    public static function cors(array $methods = ['GET', 'POST', 'OPTIONS']): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Check if origin is allowed
        if (in_array($origin, self::ALLOWED_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // Allow localhost for development
            if (preg_match('/^https?:\/\/localhost(:\d+)?$/', $origin)) {
                header("Access-Control-Allow-Origin: $origin");
            }
        }
        
        header('Access-Control-Allow-Methods: ' . implode(', ', $methods));
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        
        // Handle preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

final class InputValidator
{
    /**
     * Validate and sanitize email
     */
    public static function email(string $email): ?string
    {
        $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    /**
     * Validate and format phone number (North American)
     */
    public static function phone(string $phone): ?string
    {
        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        
        // Handle various formats
        if (preg_match('/^\+?1?(\d{10})$/', $cleaned, $matches)) {
            $digits = $matches[1];
            return sprintf('+1%s', $digits);
        }
        
        // International format
        if (preg_match('/^\+(\d{11,15})$/', $cleaned)) {
            return $cleaned;
        }
        
        return null;
    }

    /**
     * Sanitize string input (remove XSS, limit length)
     */
    public static function string(string $input, int $maxLength = 1000): string
    {
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        // Strip HTML tags
        $input = strip_tags($input);
        
        // Trim and limit length
        $input = mb_substr(trim($input), 0, $maxLength, 'UTF-8');
        
        // Remove control characters except newlines and tabs
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        
        return $input;
    }

    /**
     * Sanitize for HTML output (prevent XSS)
     */
    public static function htmlSafe(string $input): string
    {
        return htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Validate positive integer
     */
    public static function positiveInt(mixed $value): ?int
    {
        $int = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        return $int !== false ? $int : null;
    }

    /**
     * Validate URL
     */
    public static function url(string $url): ?string
    {
        $url = filter_var(trim($url), FILTER_SANITIZE_URL);
        return filter_var($url, FILTER_VALIDATE_URL) ? $url : null;
    }

    /**
     * Validate language code
     */
    public static function language(string $lang): string
    {
        $allowed = ['fr', 'en'];
        $lang = strtolower(trim($lang));
        return in_array($lang, $allowed, true) ? $lang : 'fr';
    }

    /**
     * Validate JSON input
     */
    public static function json(string $input): ?array
    {
        try {
            $data = json_decode($input, true, 32, JSON_THROW_ON_ERROR);
            return is_array($data) ? $data : null;
        } catch (JsonException) {
            return null;
        }
    }
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

final class CsrfProtection
{
    private const TOKEN_LENGTH = 32;
    private const TOKEN_LIFETIME = 3600; // 1 hour
    private const SESSION_KEY = 'csrf_tokens';

    /**
     * Generate a new CSRF token
     */
    public static function generateToken(): string
    {
        self::startSession();
        
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));
        $expiry = time() + self::TOKEN_LIFETIME;
        
        $_SESSION[self::SESSION_KEY][$token] = $expiry;
        
        // Clean up expired tokens
        self::cleanup();
        
        return $token;
    }

    /**
     * Validate a CSRF token
     */
    public static function validateToken(string $token): bool
    {
        self::startSession();
        
        if (!isset($_SESSION[self::SESSION_KEY][$token])) {
            return false;
        }
        
        $expiry = $_SESSION[self::SESSION_KEY][$token];
        
        // Check if expired
        if ($expiry < time()) {
            unset($_SESSION[self::SESSION_KEY][$token]);
            return false;
        }
        
        // Token is valid - consume it (one-time use)
        unset($_SESSION[self::SESSION_KEY][$token]);
        
        return true;
    }

    /**
     * Get token from request (header or POST)
     */
    public static function getRequestToken(): ?string
    {
        // Check header first
        $headers = getallheaders();
        if (isset($headers['X-CSRF-Token'])) {
            return $headers['X-CSRF-Token'];
        }
        
        // Check POST data
        if (isset($_POST['_csrf_token'])) {
            return $_POST['_csrf_token'];
        }
        
        return null;
    }

    /**
     * Middleware: Require valid CSRF token for state-changing requests
     */
    public static function protect(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Only protect state-changing methods
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }
        
        $token = self::getRequestToken();
        
        if (!$token || !self::validateToken($token)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid or missing CSRF token']);
            exit;
        }
    }

    private static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start([
                'cookie_httponly' => true,
                'cookie_secure' => isset($_SERVER['HTTPS']),
                'cookie_samesite' => 'Lax',
            ]);
        }
    }

    private static function cleanup(): void
    {
        if (!isset($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = [];
            return;
        }
        
        $now = time();
        $_SESSION[self::SESSION_KEY] = array_filter(
            $_SESSION[self::SESSION_KEY],
            fn($expiry) => $expiry > $now
        );
    }
}

// ============================================================================
// ENHANCED RATE LIMITING
// ============================================================================

final class RateLimiter
{
    private const DEFAULT_MAX_REQUESTS = 60;
    private const DEFAULT_WINDOW = 60; // seconds
    private string $storageDir;

    public function __construct(?string $storageDir = null)
    {
        $this->storageDir = $storageDir ?? __DIR__ . '/logs/rate-limits';
        
        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }
    }

    /**
     * Check if request is allowed and update counter
     */
    public function check(
        ?string $identifier = null,
        int $maxRequests = self::DEFAULT_MAX_REQUESTS,
        int $windowSeconds = self::DEFAULT_WINDOW
    ): bool {
        $identifier ??= $this->getClientIdentifier();
        $key = $this->getKey($identifier);
        $file = $this->storageDir . '/' . $key . '.json';
        
        $now = time();
        $data = $this->loadData($file);
        
        // Filter requests within window
        $data['requests'] = array_filter(
            $data['requests'] ?? [],
            fn($timestamp) => $timestamp > ($now - $windowSeconds)
        );
        
        // Check if over limit
        if (count($data['requests']) >= $maxRequests) {
            $this->saveData($file, $data);
            return false;
        }
        
        // Add current request
        $data['requests'][] = $now;
        $this->saveData($file, $data);
        
        return true;
    }

    /**
     * Get rate limit info for response headers
     */
    public function getInfo(
        ?string $identifier = null,
        int $maxRequests = self::DEFAULT_MAX_REQUESTS,
        int $windowSeconds = self::DEFAULT_WINDOW
    ): array {
        $identifier ??= $this->getClientIdentifier();
        $key = $this->getKey($identifier);
        $file = $this->storageDir . '/' . $key . '.json';
        
        $now = time();
        $data = $this->loadData($file);
        
        $requests = array_filter(
            $data['requests'] ?? [],
            fn($timestamp) => $timestamp > ($now - $windowSeconds)
        );
        
        $remaining = max(0, $maxRequests - count($requests));
        $reset = count($requests) > 0 ? min($requests) + $windowSeconds : $now + $windowSeconds;
        
        return [
            'limit' => $maxRequests,
            'remaining' => $remaining,
            'reset' => $reset,
        ];
    }

    /**
     * Apply rate limit headers
     */
    public function applyHeaders(
        ?string $identifier = null,
        int $maxRequests = self::DEFAULT_MAX_REQUESTS,
        int $windowSeconds = self::DEFAULT_WINDOW
    ): void {
        $info = $this->getInfo($identifier, $maxRequests, $windowSeconds);
        
        header("X-RateLimit-Limit: {$info['limit']}");
        header("X-RateLimit-Remaining: {$info['remaining']}");
        header("X-RateLimit-Reset: {$info['reset']}");
    }

    /**
     * Middleware: Block if rate limited
     */
    public function enforce(
        int $maxRequests = self::DEFAULT_MAX_REQUESTS,
        int $windowSeconds = self::DEFAULT_WINDOW
    ): void {
        $identifier = $this->getClientIdentifier();
        
        if (!$this->check($identifier, $maxRequests, $windowSeconds)) {
            $info = $this->getInfo($identifier, $maxRequests, $windowSeconds);
            
            http_response_code(429);
            header('Content-Type: application/json');
            header('Retry-After: ' . ($info['reset'] - time()));
            $this->applyHeaders($identifier, $maxRequests, $windowSeconds);
            
            echo json_encode([
                'error' => 'Rate limit exceeded',
                'retry_after' => $info['reset'] - time(),
            ]);
            exit;
        }
        
        $this->applyHeaders($identifier, $maxRequests, $windowSeconds);
    }

    private function getClientIdentifier(): string
    {
        // Try various headers for real IP
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] 
            ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['HTTP_X_REAL_IP'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '0.0.0.0';
        
        // Take first IP if multiple
        if (str_contains($ip, ',')) {
            $ip = trim(explode(',', $ip)[0]);
        }
        
        return $ip;
    }

    private function getKey(string $identifier): string
    {
        return hash('sha256', $identifier);
    }

    private function loadData(string $file): array
    {
        if (!file_exists($file)) {
            return ['requests' => []];
        }
        
        $content = file_get_contents($file);
        return json_decode($content, true) ?? ['requests' => []];
    }

    private function saveData(string $file, array $data): void
    {
        file_put_contents($file, json_encode($data), LOCK_EX);
    }

    /**
     * Cleanup old rate limit files (run periodically)
     */
    public function cleanup(int $maxAgeSeconds = 3600): void
    {
        $files = glob($this->storageDir . '/*.json');
        $now = time();
        
        foreach ($files as $file) {
            if (($now - filemtime($file)) > $maxAgeSeconds) {
                @unlink($file);
            }
        }
    }
}

// ============================================================================
// LOGGING
// ============================================================================

final class SecurityLogger
{
    private static ?string $logDir = null;

    public static function init(?string $logDir = null): void
    {
        self::$logDir = $logDir ?? __DIR__ . '/logs';
        
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }
    }

    /**
     * Log security event
     */
    public static function log(string $level, string $message, array $context = []): void
    {
        if (!self::$logDir) {
            self::init();
        }
        
        $logFile = self::$logDir . '/security-' . date('Y-m-d') . '.log';
        
        $entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'level' => strtoupper($level),
            'message' => $message,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'uri' => $_SERVER['REQUEST_URI'] ?? '',
            'context' => $context,
        ];
        
        $line = json_encode($entry, JSON_UNESCAPED_SLASHES) . "\n";
        file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    }

    public static function warning(string $message, array $context = []): void
    {
        self::log('warning', $message, $context);
    }

    public static function error(string $message, array $context = []): void
    {
        self::log('error', $message, $context);
    }

    public static function info(string $message, array $context = []): void
    {
        self::log('info', $message, $context);
    }
}

// ============================================================================
// JSON RESPONSE HELPER
// ============================================================================

final class JsonResponse
{
    /**
     * Send success response
     */
    public static function success(array $data = [], int $code = 200): never
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_merge(['status' => 'ok'], $data), JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send error response
     */
    public static function error(string $message, int $code = 400, array $extra = []): never
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_merge(['error' => $message], $extra), JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send validation error response
     */
    public static function validationError(array $errors): never
    {
        self::error('Validation failed', 422, ['validation_errors' => $errors]);
    }
}
