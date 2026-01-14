<?php
/**
 * Déboucheur Expert - Enhanced Visitor Tracking
 * Comprehensive user data collection for client analysis
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

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
    'connection_type' => $data['connectionType'] ?? null,
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
        
        db_update($db, 'visitors', [
            'last_visit' => date('Y-m-d H:i:s'),
            'visit_count' => $visitCount,
            'consent_given' => $visitorData['consent_given'],
            'consent_timestamp' => $visitorData['consent_timestamp']
        ], 'id = ?', 'i', [$visitorId]);
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
            'consent_given' => 1
        ];
        
        db_insert($db, 'consents', $consentData);
    }
    
    db_close($db);
    
    // Also write to log file for backup
    $logDir = __DIR__ . '/conscent';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'session_id' => $sessionId,
        'visitor_id' => $visitorId,
        'ip' => $visitorData['ip'],
        'user_agent' => $visitorData['user_agent'],
        'data' => $data
    ];
    
    file_put_contents(
        $logDir . '/conscent.log',
        json_encode($logEntry) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
    
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
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'session_id' => $sessionId,
        'ip' => $visitorData['ip'],
        'user_agent' => $visitorData['user_agent'],
        'data' => $data,
        'error' => $e->getMessage()
    ];
    
    file_put_contents(
        $logDir . '/conscent.log',
        json_encode($logEntry) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
    
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
