<?php
/**
 * Déboucheur Expert - Owner Reply Webhook
 * Processes EMAIL and SMS replies from owner and stores them in chat_conversations
 * 
 * REPLY METHODS:
 * 1. Email: Subject must contain REPLY:{sessionId}
 * 2. SMS: Text format "REPLY:sessionId Your message"
 * 3. Direct POST: { sessionId, message, sender }
 * 
 * TRIGGERS:
 * 1. Email pipe forwarding (cPanel email routing)
 * 2. Twilio SMS webhook (see sms-webhook.php)
 * 3. Webhook from email service (SendGrid, Mailgun)
 * 4. Manual POST with sessionId and message
 * 5. IMAP cron job polling (email-service.php)
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
require_once __DIR__ . '/credentials.php';

// Get authorized contacts from credentials
$twilioConfig = SecureCredentials::getTwilioConfig();

// Authorized owner contacts
$authorizedEmails = [
    'info@deboucheur.expert',
    'info@unclogged.me',
    'billy@deboucheur.expert'
];

$authorizedPhones = [
    $twilioConfig['owner_phone'],      // +14385302343
    $twilioConfig['secondary_phone'],  // +14387657040
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
    
    storeOwnerResponse($sessionId, trim($text), 'Billy', 'email');
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId, 'via' => 'email']);
    exit;
}

// Mode 4: SMS reply (Twilio webhook format)
// Note: Primary SMS handling is in sms-webhook.php
// This is a backup/alternative endpoint
if (!empty($data['From']) && !empty($data['Body'])) {
    $fromPhone = normalizePhone($data['From']);
    $body = trim($data['Body']);
    
    // Verify authorized phone
    if (!in_array($fromPhone, $authorizedPhones)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized phone number']);
        exit;
    }
    
    // Parse SMS format: REPLY:sessionId message
    $sessionId = '';
    $message = $body;
    
    if (preg_match('/^(?:REPLY|R|REP):?\s*([a-zA-Z0-9_-]+)\s+(.+)$/is', $body, $matches)) {
        $sessionId = $matches[1];
        $message = trim($matches[2]);
    } elseif (preg_match('/^LAST\s+(.+)$/is', $body, $matches)) {
        // Reply to last conversation
        $message = trim($matches[1]);
        try {
            $db = get_db_connection('prod');
            $result = $db->query("SELECT session_id FROM chat_conversations WHERE role = 'user' ORDER BY created_at DESC LIMIT 1");
            $row = $result->fetch_assoc();
            $sessionId = $row['session_id'] ?? '';
            db_close($db);
        } catch (Exception $e) {
            error_log("Get last session error: " . $e->getMessage());
        }
    }
    
    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'No session ID in SMS. Format: REPLY:sessionId Your message']);
        exit;
    }
    
    storeOwnerResponse($sessionId, $message, 'Billy', 'sms');
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId, 'via' => 'sms']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request format']);

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(string $phone): string {
    $phone = preg_replace('/[\s\-\(\)]/', '', $phone);
    if (!str_starts_with($phone, '+')) {
        if (strlen($phone) === 10) {
            $phone = '+1' . $phone;
        } elseif (strlen($phone) === 11 && str_starts_with($phone, '1')) {
            $phone = '+' . $phone;
        }
    }
    return $phone;
}

/**
 * Store owner response in database
 */
function storeOwnerResponse(string $sessionId, string $message, string $sender = 'Billy', string $via = 'direct'): void {
    try {
        $db = get_db_connection('prod');
        
        // Set forwarded flags based on reply method
        $forwardedEmail = ($via === 'email') ? 1 : 0;
        $forwardedSms = ($via === 'sms') ? 1 : 0;
        
        $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, forwarded_email, forwarded_sms) VALUES (?, 'owner', ?, NOW(), ?, ?)");
        $stmt->bind_param('ssii', $sessionId, $message, $forwardedEmail, $forwardedSms);
        $stmt->execute();
        $stmt->close();
        
        db_close($db);
        
        error_log("Owner response stored via $via for session: $sessionId");
        
    } catch (Exception $e) {
        error_log("Store owner response error: " . $e->getMessage());
    }
}
