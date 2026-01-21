<?php
declare(strict_types=1);
/**
 * Déboucheur Expert - Enhanced Visitor Tracking
 * Comprehensive user data collection for client analysis
 * 
 * @version 2.1.0 - Modernized with security module
 * @requires PHP 8.2+
 */

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';

// Apply security headers and CORS
SecurityHeaders::apply(isApi: true);
SecurityHeaders::cors(['POST', 'OPTIONS']);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    JsonResponse::error('Method not allowed', 405);
}

// Apply rate limiting (120 requests per minute - tracking can be frequent)
$rateLimiter = new RateLimiter();
$rateLimiter->enforce(maxRequests: 120, windowSeconds: 60);

// Get and validate JSON input
$input = file_get_contents('php://input');
$data = InputValidator::json($input) ?? [];

// Normalize client hints payload
$clientHints = $data['clientHints'] ?? null;
if (is_array($clientHints)) {
    $clientHints = json_encode($clientHints, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} elseif (!is_string($clientHints) || trim($clientHints) === '') {
    $clientHints = null;
}

// Normalize optional identity fields
$age = normalizeInt($data['age'] ?? null);
$lastPurchaseValue = normalizeFloat($data['lastPurchaseValue'] ?? null);
$latitude = normalizeFloat($data['latitude'] ?? null);
$longitude = normalizeFloat($data['longitude'] ?? null);
$geoAccuracy = normalizeInt($data['geoAccuracy'] ?? null);

// Get or create session ID
$sessionId = $data['sessionId'] ?? uniqid('sess_', true);

// Collect comprehensive visitor data
$visitorData = [
    'session_id' => $sessionId,
    'ip' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'browser' => $data['browser'] ?? null,
    'browser_version' => $data['browserVersion'] ?? null,
    'os' => $data['os'] ?? null,
    'os_version' => $data['osVersion'] ?? null,
    'device_type' => detectDeviceType($_SERVER['HTTP_USER_AGENT'] ?? ''),
    'screen_width' => $data['screenWidth'] ?? null,
    'screen_height' => $data['screenHeight'] ?? null,
    'viewport_width' => $data['viewportWidth'] ?? null,
    'viewport_height' => $data['viewportHeight'] ?? null,
    'color_depth' => $data['colorDepth'] ?? null,
    'pixel_ratio' => $data['pixelRatio'] ?? null,
    'timezone' => $data['tz'] ?? $data['timezone'] ?? null,
    'timezone_offset' => $data['timezoneOffset'] ?? null,
    'language' => $data['lang'] ?? $data['language'] ?? null,
    'languages' => is_array($data['languages'] ?? null) ? implode(',', $data['languages']) : ($data['languages'] ?? null),
    'theme' => $data['theme'] ?? null,
    'cookies_enabled' => isset($data['cookiesEnabled']) ? ($data['cookiesEnabled'] ? 1 : 0) : 1,
    'js_enabled' => 1,
    'do_not_track' => isset($_SERVER['HTTP_DNT']) && $_SERVER['HTTP_DNT'] === '1' ? 1 : 0,
    'referrer' => $_SERVER['HTTP_REFERER'] ?? $data['referrer'] ?? null,
    'referrer_domain' => extractDomain($_SERVER['HTTP_REFERER'] ?? $data['referrer'] ?? ''),
    'utm_source' => $data['utmSource'] ?? null,
    'utm_medium' => $data['utmMedium'] ?? null,
    'utm_campaign' => $data['utmCampaign'] ?? null,
    'utm_term' => $data['utmTerm'] ?? null,
    'utm_content' => $data['utmContent'] ?? null,
    'landing_page' => $data['landingPage'] ?? $data['page'] ?? null,
    'first_name' => normalizeString($data['firstName'] ?? $data['first_name'] ?? null),
    'last_name' => normalizeString($data['lastName'] ?? $data['last_name'] ?? null),
    'full_name' => normalizeString($data['fullName'] ?? $data['full_name'] ?? null),
    'email' => normalizeString($data['email'] ?? null),
    'phone' => normalizeString($data['phone'] ?? null),
    'gender' => normalizeString($data['gender'] ?? null),
    'age' => $age,
    'nationality' => normalizeString($data['nationality'] ?? null),
    'current_location' => normalizeString($data['currentLocation'] ?? null),
    'last_purchase' => normalizeString($data['lastPurchase'] ?? null),
    'last_purchase_value' => $lastPurchaseValue,
    'last_purchase_currency' => normalizeString($data['lastPurchaseCurrency'] ?? null),
    'last_visited_site' => normalizeString($data['lastVisitedSite'] ?? null),
    'social_network' => normalizeString($data['socialNetwork'] ?? null),
    'last_message' => normalizeString($data['lastMessage'] ?? null),
    'country' => normalizeString($data['country'] ?? null),
    'region' => normalizeString($data['region'] ?? null),
    'city' => normalizeString($data['city'] ?? null),
    'postal_code' => normalizeString($data['postalCode'] ?? null),
    'latitude' => $latitude,
    'longitude' => $longitude,
    'geo_accuracy' => $geoAccuracy,
    'connection_type' => $data['connectionType'] ?? $data['connectionEffectiveType'] ?? null,
    'client_hints' => $clientHints,
    'consent_given' => isset($data['consentGiven']) ? ($data['consentGiven'] ? 1 : 0) : 0,
    'consent_timestamp' => isset($data['consentGiven']) && $data['consentGiven'] ? date('Y-m-d H:i:s') : null
];

// Determine environment
$env = $data['env'] ?? 'prod';

try {
    $db = get_db_connection($env);
    
    // Check if visitor exists by session_id
    $existing = db_query($db, 
        "SELECT id, visit_count FROM visitors WHERE session_id = ? LIMIT 1", 
        's', 
        [$sessionId]
    );
    
    if (!empty($existing)) {
        // Update existing visitor
        $visitorId = $existing[0]['id'];
        $visitCount = $existing[0]['visit_count'] + 1;

        $updateData = [
            'last_visit' => date('Y-m-d H:i:s'),
            'visit_count' => $visitCount,
            'consent_given' => $visitorData['consent_given'],
            'consent_timestamp' => $visitorData['consent_timestamp']
        ];

        foreach ($visitorData as $key => $value) {
            if ($value !== null && $value !== '') {
                $updateData[$key] = $value;
            }
        }

        db_update($db, 'visitors', $updateData, 'id = ?', 'i', [$visitorId]);
    } else {
        // Insert new visitor
        $visitorId = db_insert($db, 'visitors', $visitorData);
    }
    
    // Log page view if page data provided
    if (!empty($data['page']) || !empty($data['pageUrl'])) {
        $pageViewData = [
            'visitor_id' => $visitorId,
            'session_id' => $sessionId,
            'page_url' => $data['pageUrl'] ?? $data['page'] ?? '',
            'page_path' => parse_url($data['pageUrl'] ?? $data['page'] ?? '', PHP_URL_PATH) ?: '/',
            'page_title' => $data['pageTitle'] ?? null,
            'query_string' => $data['queryString'] ?? null,
            'hash' => $data['hash'] ?? null,
            'referrer_url' => $data['referrerUrl'] ?? null,
            'time_on_page' => $data['timeOnPage'] ?? null,
            'scroll_depth' => $data['scrollDepth'] ?? null
        ];
        
        db_insert($db, 'page_views', $pageViewData);
    }
    
    // Log consent if given
    if (!empty($data['consentGiven'])) {
        $consentData = [
            'visitor_id' => $visitorId,
            'session_id' => $sessionId,
            'ip' => $visitorData['ip'],
            'user_agent' => $visitorData['user_agent'],
            'consent_type' => 'all',
            'consent_given' => 1,
            'consent_text' => $data['consentText'] ?? null,
            'consent_version' => $data['consentVersion'] ?? '1.0'
        ];
        
        db_insert($db, 'consents', $consentData);
    }
    
    db_close($db);
    
    // Also write to log file for backup
    $logDir = __DIR__ . '/conscent';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $pagePath = parse_url($data['pageUrl'] ?? $data['page'] ?? '', PHP_URL_PATH) ?: '/';
    $logRow = array_merge(
        [
            'timestamp' => date('Y-m-d H:i:s'),
            'session_id' => $sessionId,
            'visitor_id' => $visitorId
        ],
        $visitorData,
        [
            'page_url' => $data['pageUrl'] ?? $data['page'] ?? '',
            'page_path' => $pagePath,
            'page_title' => $data['pageTitle'] ?? null,
            'query_string' => $data['queryString'] ?? null,
            'hash' => $data['hash'] ?? null,
            'referrer_url' => $data['referrerUrl'] ?? null,
            'time_on_page' => $data['timeOnPage'] ?? null,
            'scroll_depth' => $data['scrollDepth'] ?? null,
            'server_headers' => json_encode(getallheaders() ?: []),
            'cookies' => json_encode($_COOKIE ?: []),
            'error' => null
        ]
    );
    
    writeConsentLog($logDir . '/conscent.log', $logRow);
    
    echo json_encode([
        'status' => 'ok',
        'sessionId' => $sessionId,
        'visitorId' => $visitorId
    ]);
    
} catch (Exception $e) {
    error_log("Tracking error: " . $e->getMessage());
    
    // Still write to log file even if DB fails
    $logDir = __DIR__ . '/conscent';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $pagePath = parse_url($data['pageUrl'] ?? $data['page'] ?? '', PHP_URL_PATH) ?: '/';
    $logRow = array_merge(
        [
            'timestamp' => date('Y-m-d H:i:s'),
            'session_id' => $sessionId,
            'visitor_id' => null
        ],
        $visitorData,
        [
            'page_url' => $data['pageUrl'] ?? $data['page'] ?? '',
            'page_path' => $pagePath,
            'page_title' => $data['pageTitle'] ?? null,
            'query_string' => $data['queryString'] ?? null,
            'hash' => $data['hash'] ?? null,
            'referrer_url' => $data['referrerUrl'] ?? null,
            'time_on_page' => $data['timeOnPage'] ?? null,
            'scroll_depth' => $data['scrollDepth'] ?? null,
            'server_headers' => json_encode(getallheaders() ?: []),
            'cookies' => json_encode($_COOKIE ?: []),
            'error' => $e->getMessage()
        ]
    );
    
    writeConsentLog($logDir . '/conscent.log', $logRow);
    
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId]);
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(string $userAgent): string {
    $userAgent = strtolower($userAgent);
    
    // Check for bots
    if (preg_match('/(bot|crawl|spider|slurp|bingpreview)/i', $userAgent)) {
        return 'bot';
    }
    
    // Check for mobile
    if (preg_match('/(mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop)/i', $userAgent)) {
        return 'mobile';
    }
    
    // Check for tablet
    if (preg_match('/(tablet|ipad|playbook|silk)/i', $userAgent)) {
        return 'tablet';
    }
    
    // Check for desktop indicators
    if (preg_match('/(windows|macintosh|linux)/i', $userAgent) && !preg_match('/mobile/i', $userAgent)) {
        return 'desktop';
    }
    
    return 'unknown';
}

/**
 * Extract domain from URL
 */
function extractDomain(string $url): ?string {
    if (empty($url)) {
        return null;
    }
    
    $parsed = parse_url($url);
    return $parsed['host'] ?? null;
}

/**
 * Normalize string input
 */
function normalizeString($value): ?string {
    if (is_null($value)) {
        return null;
    }
    $text = trim((string)$value);
    return $text === '' ? null : $text;
}

/**
 * Normalize integer input
 */
function normalizeInt($value): ?int {
    if ($value === null || $value === '') {
        return null;
    }
    if (is_numeric($value)) {
        return (int)$value;
    }
    return null;
}

/**
 * Normalize float input
 */
function normalizeFloat($value): ?float {
    if ($value === null || $value === '') {
        return null;
    }
    if (is_numeric($value)) {
        return (float)$value;
    }
    return null;
}

/**
 * Write consent log as a grid (header + rows)
 */
function writeConsentLog(string $logFile, array $row): void {
    $columns = [
        'timestamp', 'session_id', 'visitor_id',
        'ip', 'user_agent', 'browser', 'browser_version', 'os', 'os_version', 'device_type',
        'screen_width', 'screen_height', 'viewport_width', 'viewport_height', 'color_depth',
        'pixel_ratio', 'timezone', 'timezone_offset', 'language', 'languages', 'theme',
        'cookies_enabled', 'js_enabled', 'do_not_track', 'referrer', 'referrer_domain',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'landing_page',
        'first_name', 'last_name', 'full_name', 'email', 'phone', 'gender', 'age', 'nationality',
        'current_location', 'last_purchase', 'last_purchase_value', 'last_purchase_currency',
        'last_visited_site', 'social_network', 'last_message',
        'country', 'region', 'city', 'postal_code', 'latitude', 'longitude', 'geo_accuracy',
        'isp', 'connection_type', 'client_hints', 'consent_given', 'consent_timestamp',
        'page_url', 'page_path', 'page_title', 'query_string', 'hash', 'referrer_url',
        'time_on_page', 'scroll_depth', 'server_headers', 'cookies', 'error'
    ];
    
    $handle = fopen($logFile, 'a');
    if ($handle === false) {
        return;
    }
    if (filesize($logFile) === 0) {
        fputcsv($handle, $columns, "\t");
    }
    $rowData = [];
    foreach ($columns as $col) {
        $rowData[] = isset($row[$col]) ? $row[$col] : '';
    }
    fputcsv($handle, $rowData, "\t");
    fclose($handle);
}
