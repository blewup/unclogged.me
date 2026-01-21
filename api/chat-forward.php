<?php
declare(strict_types=1);
/**
 * Déboucheur Expert - Chat Forwarding API
 * Forwards AI chat conversations to owner via SMS and Email
 * 
 * @version 2.1.0 - Modernized with security module
 * @requires PHP 8.2+
 */

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/credentials.php';
require_once __DIR__ . '/email-service.php';

// Apply security headers and CORS
SecurityHeaders::apply(isApi: true);
SecurityHeaders::cors(['POST', 'OPTIONS']);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    JsonResponse::error('Method not allowed', 405);
}

// Apply rate limiting (60 requests per minute)
$rateLimiter = new RateLimiter();
$rateLimiter->enforce(maxRequests: 60, windowSeconds: 60);

// Parse and validate input
$input = file_get_contents('php://input');
$data = InputValidator::json($input);

if (!$data || empty($data['sessionId'])) {
    JsonResponse::error('Missing sessionId', 400);
}

$sessionId = InputValidator::string($data['sessionId'] ?? '', 100);
$userMessage = InputValidator::string($data['userMessage'] ?? '', 5000);
$aiResponse = InputValidator::string($data['aiResponse'] ?? '', 10000);
$conversationHistory = $data['conversationHistory'] ?? [];
$timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');
$pageUrl = InputValidator::url($data['pageUrl'] ?? '') ?? '';
$isEscalation = (bool)($data['isEscalation'] ?? false);
$lang = InputValidator::string($data['lang'] ?? 'fr', 5);
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = InputValidator::string($_SERVER['HTTP_USER_AGENT'] ?? '', 512);

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
    
    // Send notification on first message, every 5th message, or on escalation request
    $shouldNotify = ($messageCount == 1 || $messageCount % 5 == 0 || $isEscalation);
    
    if ($shouldNotify) {
        
        // ========== EMAIL NOTIFICATION (via SMTP) ==========
        try {
            $emailSubject = $isEscalation 
                ? "🚨 URGENT: Client demande un expert - Déboucheur.Expert"
                : "💬 Nouveau chat - Déboucheur.Expert";
                
            $emailService = new EmailService();
            $emailResult = $emailService->sendChatNotification(
                $sessionId,
                htmlspecialchars($userMessage),
                htmlspecialchars($aiResponse),
                $pageUrl,
                $timestamp,
                $isEscalation
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
        $messagingServiceSid = $twilioConfig['messaging_service_sid'] ?? '';
        $twilioFrom = $twilioConfig['from_number'];
        $ownerPhone = $twilioConfig['owner_phone'];
        
        if (!empty($twilioSid) && !empty($twilioToken)) {
            // Prepare SMS content with reply instructions
            $urgentFlag = $isEscalation ? "🚨 URGENT - Client demande EXPERT\n" : "";
            $smsContent = $urgentFlag;
            $smsContent .= "💬 Chat Déboucheur\n";
            $smsContent .= "📅 " . date('H:i d/m') . "\n";
            $smsContent .= "👤 " . mb_substr($userMessage, 0, 80) . "...\n";
            if (!$isEscalation) {
                $smsContent .= "🤖 " . mb_substr($aiResponse, 0, 60) . "...\n";
            }
            $smsContent .= "📱 Pour répondre:\n";
            $smsContent .= "REPLY:" . $sessionId . " Votre message";
            
            try {
                $twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json";
                
                $smsData = [
                    'To' => $ownerPhone,
                    'Body' => $smsContent,
                    'StatusCallback' => $twilioConfig['status_callback'] ?? 'https://deboucheur.expert/api/sms-status.php'
                ];
                
                // Use MessagingServiceSid if available, otherwise use From number
                if (!empty($messagingServiceSid)) {
                    $smsData['MessagingServiceSid'] = $messagingServiceSid;
                } else {
                    $smsData['From'] = $twilioFrom;
                }
                
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
                    // Keep same MessagingServiceSid or From
                    
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
                SecurityLogger::warning('SMS notification error', ['error' => $smsError->getMessage()]);
            }
        }
    }
    
    db_close($db);
    
    JsonResponse::success([
        'sessionId' => $sessionId,
        'isEscalation' => $isEscalation,
        'notifications' => [
            'email' => $emailSent,
            'sms' => $smsSent
        ]
    ]);
    
} catch (Exception $e) {
    SecurityLogger::error('Chat forward error', ['error' => $e->getMessage()]);
    JsonResponse::success(); // Don't expose errors to client
}
