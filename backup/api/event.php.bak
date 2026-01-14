<?php
/**
 * Déboucheur Expert - Event Tracking API
 * Tracks user interactions and events
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/db.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

if (empty($data['sessionId']) || empty($data['eventType'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: sessionId, eventType']);
    exit;
}

$env = $data['env'] ?? 'prod';

try {
    $db = get_db_connection($env);
    
    // Get visitor ID from session
    $visitor = db_query($db, 
        "SELECT id FROM visitors WHERE session_id = ? LIMIT 1",
        's',
        [$data['sessionId']]
    );
    
    $visitorId = !empty($visitor) ? $visitor[0]['id'] : null;
    
    // Prepare event data
    $eventData = [
        'visitor_id' => $visitorId,
        'session_id' => $data['sessionId'],
        'event_type' => $data['eventType'],
        'event_category' => $data['eventCategory'] ?? null,
        'event_action' => $data['eventAction'] ?? null,
        'event_label' => $data['eventLabel'] ?? null,
        'event_value' => $data['eventValue'] ?? null,
        'element_id' => $data['elementId'] ?? null,
        'element_class' => $data['elementClass'] ?? null,
        'element_tag' => $data['elementTag'] ?? null,
        'element_text' => isset($data['elementText']) ? substr($data['elementText'], 0, 255) : null,
        'page_url' => $data['pageUrl'] ?? null,
        'position_x' => $data['positionX'] ?? null,
        'position_y' => $data['positionY'] ?? null,
        'metadata' => isset($data['metadata']) ? json_encode($data['metadata']) : null
    ];
    
    $eventId = db_insert($db, 'events', $eventData);
    
    // Special handling for certain event types
    
    // Lead qualification events
    if (in_array($data['eventType'], ['form_start', 'chat_start', 'phone_click', 'email_click'])) {
        updateLeadScore($db, $visitorId, $data['eventType']);
    }
    
    // Form submission tracking
    if ($data['eventType'] === 'form_submit' || $data['eventType'] === 'form_start') {
        $formData = [
            'visitor_id' => $visitorId,
            'session_id' => $data['sessionId'],
            'form_id' => $data['formId'] ?? $data['elementId'] ?? null,
            'form_name' => $data['formName'] ?? null,
            'page_url' => $data['pageUrl'] ?? null,
            'fields_filled' => $data['fieldsFilled'] ?? 0,
            'fields_total' => $data['fieldsTotal'] ?? 0,
            'time_to_complete' => $data['timeToComplete'] ?? null,
            'submission_success' => $data['eventType'] === 'form_submit' ? 1 : 0
        ];
        
        db_insert($db, 'form_submissions', $formData);
    }
    
    db_close($db);
    
    echo json_encode([
        'status' => 'ok',
        'eventId' => $eventId
    ]);
    
} catch (Exception $e) {
    error_log("Event tracking error: " . $e->getMessage());
    echo json_encode(['status' => 'ok']);
}

/**
 * Update lead score based on user actions
 */
function updateLeadScore(mysqli $db, ?int $visitorId, string $eventType): void {
    if (!$visitorId) return;
    
    // Score weights for different actions
    $scores = [
        'form_start' => 10,
        'form_submit' => 30,
        'chat_start' => 15,
        'chat_message' => 5,
        'phone_click' => 25,
        'email_click' => 20,
        'page_view' => 1,
        'return_visit' => 10
    ];
    
    $scoreToAdd = $scores[$eventType] ?? 0;
    
    if ($scoreToAdd > 0) {
        // Check if lead exists
        $lead = db_query($db,
            "SELECT id, score FROM leads WHERE visitor_id = ? LIMIT 1",
            'i',
            [$visitorId]
        );
        
        if (!empty($lead)) {
            // Update existing lead
            $newScore = min(100, $lead[0]['score'] + $scoreToAdd);
            db_update($db, 'leads', ['score' => $newScore], 'id = ?', 'i', [$lead[0]['id']]);
        } else {
            // Create new lead
            db_insert($db, 'leads', [
                'visitor_id' => $visitorId,
                'score' => $scoreToAdd,
                'status' => 'new',
                'source' => $eventType
            ]);
        }
    }
}
