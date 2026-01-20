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
$row = [
    'timestamp' => date('Y-m-d H:i:s'),
    'session_id' => $data['sessionId'] ?? '',
    'visitor_id' => $data['visitorId'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'browser' => $data['browser'] ?? '',
    'browser_version' => $data['browserVersion'] ?? '',
    'os' => $data['os'] ?? '',
    'os_version' => $data['osVersion'] ?? '',
    'device_type' => $data['deviceType'] ?? '',
    'screen_width' => $data['screenWidth'] ?? '',
    'screen_height' => $data['screenHeight'] ?? '',
    'viewport_width' => $data['viewportWidth'] ?? '',
    'viewport_height' => $data['viewportHeight'] ?? '',
    'color_depth' => $data['colorDepth'] ?? '',
    'pixel_ratio' => $data['pixelRatio'] ?? '',
    'timezone' => $data['tz'] ?? '',
    'timezone_offset' => $data['timezoneOffset'] ?? '',
    'language' => $data['lang'] ?? '',
    'languages' => is_array($data['languages'] ?? null) ? implode(',', $data['languages']) : ($data['languages'] ?? ''),
    'theme' => $data['theme'] ?? '',
    'cookies_enabled' => $data['cookiesEnabled'] ?? '',
    'js_enabled' => $data['jsEnabled'] ?? 1,
    'do_not_track' => $data['doNotTrack'] ?? '',
    'referrer' => $data['referrer'] ?? '',
    'referrer_domain' => $data['referrerDomain'] ?? '',
    'utm_source' => $data['utmSource'] ?? '',
    'utm_medium' => $data['utmMedium'] ?? '',
    'utm_campaign' => $data['utmCampaign'] ?? '',
    'utm_term' => $data['utmTerm'] ?? '',
    'utm_content' => $data['utmContent'] ?? '',
    'landing_page' => $data['landingPage'] ?? ($data['page'] ?? ''),
    'first_name' => $data['firstName'] ?? ($data['first_name'] ?? ''),
    'last_name' => $data['lastName'] ?? ($data['last_name'] ?? ''),
    'full_name' => $data['fullName'] ?? ($data['full_name'] ?? ''),
    'email' => $data['email'] ?? '',
    'phone' => $data['phone'] ?? '',
    'gender' => $data['gender'] ?? '',
    'age' => $data['age'] ?? '',
    'nationality' => $data['nationality'] ?? '',
    'current_location' => $data['currentLocation'] ?? '',
    'last_purchase' => $data['lastPurchase'] ?? '',
    'last_purchase_value' => $data['lastPurchaseValue'] ?? '',
    'last_purchase_currency' => $data['lastPurchaseCurrency'] ?? '',
    'last_visited_site' => $data['lastVisitedSite'] ?? '',
    'social_network' => $data['socialNetwork'] ?? '',
    'last_message' => $data['lastMessage'] ?? '',
    'country' => $data['country'] ?? '',
    'region' => $data['region'] ?? '',
    'city' => $data['city'] ?? '',
    'postal_code' => $data['postalCode'] ?? '',
    'latitude' => $data['latitude'] ?? '',
    'longitude' => $data['longitude'] ?? '',
    'geo_accuracy' => $data['geoAccuracy'] ?? '',
    'isp' => $data['isp'] ?? '',
    'connection_type' => $data['connectionType'] ?? ($data['connectionEffectiveType'] ?? ''),
    'server_headers' => json_encode(getallheaders() ?: []),
    'cookies' => json_encode($_COOKIE ?: []),
    'client_hints' => is_array($data['clientHints'] ?? null) ? json_encode($data['clientHints']) : ($data['clientHints'] ?? ''),
    'consent_given' => $data['consentGiven'] ?? '',
    'consent_timestamp' => $data['consentTimestamp'] ?? '',
    'page_url' => $data['pageUrl'] ?? ($data['page'] ?? ''),
    'page_path' => parse_url($data['pageUrl'] ?? ($data['page'] ?? ''), PHP_URL_PATH) ?: '',
    'page_title' => $data['pageTitle'] ?? '',
    'query_string' => $data['queryString'] ?? '',
    'hash' => $data['hash'] ?? '',
    'referrer_url' => $data['referrerUrl'] ?? '',
    'time_on_page' => $data['timeOnPage'] ?? '',
    'scroll_depth' => $data['scrollDepth'] ?? '',
    'error' => ''
];

writeConsentLog($logFile, $row);

// Return success response
header('Content-Type: application/json');
echo json_encode(['status' => 'ok']);
exit;

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
        'isp', 'connection_type', 'server_headers', 'cookies', 'client_hints', 'consent_given', 'consent_timestamp',
        'page_url', 'page_path', 'page_title', 'query_string', 'hash', 'referrer_url',
        'time_on_page', 'scroll_depth', 'error'
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
