<?php
/**
 * Déboucheur Expert - SMS Webhook Handler
 * Receives incoming SMS replies via Twilio webhook
 * 
 * Configure in Twilio Console:
 * Phone Number → Messaging → A MESSAGE COMES IN
 * Webhook URL: https://deboucheur.expert/api/sms-webhook.php
 * HTTP Method: POST
 * 
 * SMS format from owner: REPLY:{sessionId} Your message here
 * Example: REPLY:abc123 Oui, je peux venir demain à 10h
 */

header('Content-Type: text/xml');

// Log all incoming webhooks for debugging
$logFile = __DIR__ . '/logs/sms-webhook.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$logEntry = date('Y-m-d H:i:s') . " | " . json_encode($_POST) . "\n";
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/credentials.php';

// Authorized phone numbers that can send replies
$twilioConfig = SecureCredentials::getTwilioConfig();
$authorizedPhones = [
    $twilioConfig['owner_phone'],      // +14385302343
    $twilioConfig['secondary_phone'],  // +14387657040
];

// Normalize phone number (remove spaces, dashes, ensure + prefix)
function normalizePhone(string $phone): string {
    $phone = preg_replace('/[\s\-\(\)]/', '', $phone);
    if (!str_starts_with($phone, '+')) {
        // Assume North American if 10 digits
        if (strlen($phone) === 10) {
            $phone = '+1' . $phone;
        } elseif (strlen($phone) === 11 && str_starts_with($phone, '1')) {
            $phone = '+' . $phone;
        }
    }
    return $phone;
}

// Get Twilio POST parameters
$from = normalizePhone($_POST['From'] ?? '');
$to = $_POST['To'] ?? '';
$body = trim($_POST['Body'] ?? '');
$messageSid = $_POST['MessageSid'] ?? '';

// Verify this is from an authorized number
if (!in_array($from, $authorizedPhones)) {
    // Log unauthorized attempt
    error_log("Unauthorized SMS reply attempt from: $from");
    
    // Send TwiML response (empty = no reply)
    echo '<?xml version="1.0" encoding="UTF-8"?>';
    echo '<Response></Response>';
    exit;
}

// Parse message format: REPLY:sessionId message
// Also accept: R:sessionId message, or just sessionId:message for convenience
$sessionId = '';
$message = $body;

// Try different patterns
if (preg_match('/^(?:REPLY|R|REP):?\s*([a-zA-Z0-9_-]+)\s+(.+)$/is', $body, $matches)) {
    $sessionId = $matches[1];
    $message = trim($matches[2]);
} elseif (preg_match('/^([a-zA-Z0-9_-]{8,}):?\s+(.+)$/is', $body, $matches)) {
    // Just sessionId followed by message
    $sessionId = $matches[1];
    $message = trim($matches[2]);
}

// Response TwiML
$responseMessage = '';

if (empty($sessionId)) {
    // No session ID - provide instructions
    $responseMessage = "Format: REPLY:sessionId votre message\n";
    $responseMessage .= "Ou répondez au dernier chat avec: LAST votre message";
    
    // Try to find the most recent chat session to auto-reply
    try {
        $db = get_db_connection('prod');
        $result = $db->query("SELECT session_id FROM chat_conversations WHERE role = 'user' ORDER BY created_at DESC LIMIT 1");
        $row = $result->fetch_assoc();
        
        if ($row && !empty($row['session_id'])) {
            // Check if message starts with LAST
            if (preg_match('/^LAST\s+(.+)$/is', $body, $lastMatch)) {
                $sessionId = $row['session_id'];
                $message = trim($lastMatch[1]);
            } else {
                $responseMessage .= "\n\nDernier chat: " . $row['session_id'];
            }
        }
        
        db_close($db);
    } catch (Exception $e) {
        error_log("SMS webhook DB error: " . $e->getMessage());
    }
}

if (!empty($sessionId) && !empty($message)) {
    // Store the owner's response
    try {
        $db = get_db_connection('prod');
        
        // Verify session exists
        $checkSession = $db->prepare("SELECT COUNT(*) as cnt FROM chat_conversations WHERE session_id = ?");
        $checkSession->bind_param('s', $sessionId);
        $checkSession->execute();
        $result = $checkSession->get_result()->fetch_assoc();
        $checkSession->close();
        
        if ($result['cnt'] > 0) {
            // Insert owner response
            $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, forwarded_sms) VALUES (?, 'owner', ?, NOW(), 1)");
            $stmt->bind_param('ss', $sessionId, $message);
            $stmt->execute();
            $stmt->close();
            
            $responseMessage = "✅ Réponse envoyée au client!\nSession: " . substr($sessionId, 0, 8) . "...";
            
            // Log successful reply
            error_log("SMS reply stored for session: $sessionId");
        } else {
            $responseMessage = "❌ Session non trouvée: $sessionId";
        }
        
        db_close($db);
        
    } catch (Exception $e) {
        error_log("SMS reply storage error: " . $e->getMessage());
        $responseMessage = "❌ Erreur: " . $e->getMessage();
    }
}

// Send TwiML response
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<Response>';
if (!empty($responseMessage)) {
    echo '<Message>' . htmlspecialchars($responseMessage) . '</Message>';
}
echo '</Response>';
