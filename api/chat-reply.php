<?php
/**
 * Déboucheur Expert - Owner Reply Webhook
 * Processes email replies from owner and stores them in chat_conversations
 * 
 * Email parsing: Subject must contain REPLY:{sessionId}
 * Body becomes the owner response
 * 
 * This can be triggered via:
 * 1. Email pipe forwarding (cPanel email routing)
 * 2. Webhook from email service (SendGrid, Mailgun)
 * 3. Manual POST with sessionId and message
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

// Authorized owner contacts
$authorizedEmails = [
    'info@deboucheur.expert',
    'info@unclogged.me',
    'billy@deboucheur.expert'
];

$authorizedPhones = [
    '+14385302343',
    '+14387657040'
];

// Parse input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Mode 1: Direct POST with sessionId and message
if (!empty($data['sessionId']) && !empty($data['message'])) {
    $sessionId = $data['sessionId'];
    $message = $data['message'];
    $sender = $data['sender'] ?? 'Billy';
    
    // Optional: Verify sender authorization
    $fromEmail = $data['fromEmail'] ?? '';
    $fromPhone = $data['fromPhone'] ?? '';
    
    $authorized = false;
    if (!empty($fromEmail) && in_array(strtolower($fromEmail), array_map('strtolower', $authorizedEmails))) {
        $authorized = true;
    }
    if (!empty($fromPhone) && in_array($fromPhone, $authorizedPhones)) {
        $authorized = true;
    }
    // Allow if no verification provided (for testing)
    if (empty($fromEmail) && empty($fromPhone)) {
        $authorized = true;
    }
    
    if (!$authorized) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized sender']);
        exit;
    }
    
    storeOwnerResponse($sessionId, $message, $sender);
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId]);
    exit;
}

// Mode 2: Parse raw email (piped from mail server)
if (!empty($data['rawEmail'])) {
    $rawEmail = $data['rawEmail'];
    
    // Extract subject
    preg_match('/Subject:\s*(.+)/i', $rawEmail, $subjectMatch);
    $subject = $subjectMatch[1] ?? '';
    
    // Extract sessionId from subject
    preg_match('/REPLY:([a-zA-Z0-9_-]+)/i', $subject, $sessionMatch);
    $sessionId = $sessionMatch[1] ?? '';
    
    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'No session ID in subject']);
        exit;
    }
    
    // Extract From
    preg_match('/From:\s*.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i', $rawEmail, $fromMatch);
    $fromEmail = $fromMatch[1] ?? '';
    
    // Verify sender
    if (!in_array(strtolower($fromEmail), array_map('strtolower', $authorizedEmails))) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized email sender']);
        exit;
    }
    
    // Extract body (after headers)
    $parts = preg_split('/\r?\n\r?\n/', $rawEmail, 2);
    $body = $parts[1] ?? '';
    
    // Clean up body
    $body = strip_tags($body);
    $body = preg_replace('/^>.*$/m', '', $body); // Remove quoted text
    $body = preg_replace('/--\s*\n.*$/s', '', $body); // Remove signature
    $body = trim($body);
    
    if (empty($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Empty message body']);
        exit;
    }
    
    storeOwnerResponse($sessionId, $body, 'Billy');
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId]);
    exit;
}

// Mode 3: Webhook format (SendGrid, Mailgun style)
if (!empty($data['subject']) || !empty($data['text'])) {
    $subject = $data['subject'] ?? '';
    $text = $data['text'] ?? $data['body'] ?? '';
    $from = $data['from'] ?? $data['sender'] ?? '';
    
    // Extract sessionId from subject
    preg_match('/REPLY:([a-zA-Z0-9_-]+)/i', $subject, $sessionMatch);
    $sessionId = $sessionMatch[1] ?? '';
    
    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'No session ID in subject']);
        exit;
    }
    
    // Extract email from from field
    preg_match('/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i', $from, $fromMatch);
    $fromEmail = $fromMatch[1] ?? '';
    
    // Verify sender
    if (!in_array(strtolower($fromEmail), array_map('strtolower', $authorizedEmails))) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized sender']);
        exit;
    }
    
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(['error' => 'Empty message']);
        exit;
    }
    
    storeOwnerResponse($sessionId, trim($text), 'Billy');
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request format']);

/**
 * Store owner response in database
 */
function storeOwnerResponse(string $sessionId, string $message, string $sender = 'Billy'): void {
    try {
        $db = get_db_connection('prod');
        
        $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp) VALUES (?, 'owner', ?, NOW())");
        $stmt->bind_param('ss', $sessionId, $message);
        $stmt->execute();
        $stmt->close();
        
        db_close($db);
    } catch (Exception $e) {
        error_log("Store owner response error: " . $e->getMessage());
    }
}
