<?php
/**
 * Déboucheur Expert - Chat Forwarding API
 * Forwards AI chat conversations to owner via SMS and Email
 * 
 * Receives: sessionId, userMessage, aiResponse, conversationHistory, timestamp, pageUrl
 * Actions: Store conversation, send SMS via Twilio, send email via SMTP
 * 
 * Owner can reply via:
 * - Email: Reply with subject containing REPLY:{sessionId}
 * - SMS: Send "REPLY:{sessionId} Your message" to Twilio number
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
require_once __DIR__ . '/email-service.php';

// Parse input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['sessionId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing sessionId']);
    exit;
}

$sessionId = $data['sessionId'];
$userMessage = $data['userMessage'] ?? '';
$aiResponse = $data['aiResponse'] ?? '';
$conversationHistory = $data['conversationHistory'] ?? [];
$timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');
$pageUrl = $data['pageUrl'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// Get configuration from secure credentials
$twilioConfig = SecureCredentials::getTwilioConfig();

try {
    $db = get_db_connection('prod');
    
    // Create chat_sessions table if not exists
    $db->query("CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        role ENUM('user', 'assistant', 'owner') NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        ip VARCHAR(45),
        user_agent VARCHAR(512),
        page_url VARCHAR(512),
        forwarded_sms TINYINT(1) DEFAULT 0,
        forwarded_email TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Store user message
    if (!empty($userMessage)) {
        $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, ip, user_agent, page_url) VALUES (?, 'user', ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssssss', $sessionId, $userMessage, $timestamp, $ip, $userAgent, $pageUrl);
        $stmt->execute();
        $stmt->close();
    }
    
    // Store AI response
    if (!empty($aiResponse)) {
        $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, ip, user_agent, page_url) VALUES (?, 'assistant', ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssssss', $sessionId, $aiResponse, $timestamp, $ip, $userAgent, $pageUrl);
        $stmt->execute();
        $stmt->close();
    }
    
    // Count messages in session to avoid spamming
    $sessionIdEscaped = $db->real_escape_string($sessionId);
    $countResult = $db->query("SELECT COUNT(*) as cnt FROM chat_conversations WHERE session_id = '$sessionIdEscaped' AND role = 'user'");
    $messageCount = $countResult->fetch_assoc()['cnt'];
    
    $emailSent = false;
    $smsSent = false;
    
    // Send notification on first message or every 5th message
    if ($messageCount == 1 || $messageCount % 5 == 0) {
        
        // ========== EMAIL NOTIFICATION (via SMTP) ==========
        try {
            $emailService = new EmailService();
            $emailResult = $emailService->sendChatNotification(
                $sessionId,
                htmlspecialchars($userMessage),
                htmlspecialchars($aiResponse),
                $pageUrl,
                $timestamp
            );
            
            if ($emailResult['primary']['success'] || $emailResult['secondary']['success']) {
                $emailSent = true;
                $db->query("UPDATE chat_conversations SET forwarded_email = 1 WHERE session_id = '$sessionIdEscaped'");
            }
        } catch (Exception $emailError) {
            error_log("Email notification error: " . $emailError->getMessage());
        }
        
        // ========== SMS NOTIFICATION (via Twilio) ==========
        $twilioSid = $twilioConfig['account_sid'];
        $twilioToken = $twilioConfig['auth_token'];
        $twilioFrom = $twilioConfig['from_number'];
        $ownerPhone = $twilioConfig['owner_phone'];
        
        if (!empty($twilioSid) && !empty($twilioToken) && !empty($twilioFrom)) {
            // Prepare SMS content with reply instructions
            $smsContent = "💬 Nouveau chat Déboucheur\n";
            $smsContent .= "📅 " . date('H:i d/m') . "\n";
            $smsContent .= "👤 " . mb_substr($userMessage, 0, 80) . "...\n";
            $smsContent .= "🤖 " . mb_substr($aiResponse, 0, 60) . "...\n";
            $smsContent .= "📱 Pour répondre:\n";
            $smsContent .= "REPLY:" . $sessionId . " Votre message";
            
            try {
                $twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json";
                
                $smsData = [
                    'To' => $ownerPhone,
                    'From' => $twilioFrom,
                    'Body' => $smsContent,
                    'StatusCallback' => 'https://deboucheur.expert/api/sms-status.php' // Optional status webhook
                ];
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $twilioUrl);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($smsData));
                curl_setopt($ch, CURLOPT_USERPWD, "$twilioSid:$twilioToken");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                
                $twilioResponse = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    $smsSent = true;
                    $db->query("UPDATE chat_conversations SET forwarded_sms = 1 WHERE session_id = '$sessionIdEscaped'");
                    error_log("SMS sent successfully for session: $sessionId");
                } else {
                    error_log("Twilio SMS failed: HTTP $httpCode - $twilioResponse");
                }
                
                // Also send to secondary phone if configured
                $secondaryPhone = $twilioConfig['secondary_phone'];
                if (!empty($secondaryPhone) && $secondaryPhone !== $ownerPhone) {
                    $smsData['To'] = $secondaryPhone;
                    
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $twilioUrl);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($smsData));
                    curl_setopt($ch, CURLOPT_USERPWD, "$twilioSid:$twilioToken");
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                    curl_exec($ch);
                    curl_close($ch);
                }
                
            } catch (Exception $smsError) {
                error_log("SMS notification error: " . $smsError->getMessage());
            }
        }
    }
    
    db_close($db);
    
    echo json_encode([
        'status' => 'ok',
        'sessionId' => $sessionId,
        'notifications' => [
            'email' => $emailSent,
            'sms' => $smsSent
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Chat forward error: " . $e->getMessage());
    echo json_encode(['status' => 'ok']); // Don't expose errors to client
}
