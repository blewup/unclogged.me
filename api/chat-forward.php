<?php
/**
 * Déboucheur Expert - Chat Forwarding API
 * Forwards AI chat conversations to owner via SMS and email
 * 
 * Receives: sessionId, userMessage, aiResponse, conversationHistory, timestamp, pageUrl
 * Actions: Store conversation, send SMS via Twilio, send email notification
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

// Owner contact info
$ownerPhone = '+14385302343';
$ownerEmail = 'info@deboucheur.expert';
$secondaryEmail = 'info@unclogged.me';

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
    $countResult = $db->query("SELECT COUNT(*) as cnt FROM chat_conversations WHERE session_id = '$sessionId' AND role = 'user'");
    $messageCount = $countResult->fetch_assoc()['cnt'];
    
    // Send notification on first message or every 5th message
    if ($messageCount == 1 || $messageCount % 5 == 0) {
        // Prepare notification content
        $smsContent = "💬 Nouveau message Déboucheur\n";
        $smsContent .= "📅 " . date('H:i d/m') . "\n";
        $smsContent .= "👤 Client: " . substr($userMessage, 0, 100) . "\n";
        $smsContent .= "🤖 IA: " . substr($aiResponse, 0, 100) . "...\n";
        $smsContent .= "📱 Répondre: " . $sessionId;
        
        // Email content
        $emailSubject = "💬 Nouveau chat client - Déboucheur Expert";
        $emailBody = "<html><body style='font-family: Arial, sans-serif;'>";
        $emailBody .= "<h2 style='color: #2563EB;'>Nouveau message de chat</h2>";
        $emailBody .= "<p><strong>Session:</strong> {$sessionId}</p>";
        $emailBody .= "<p><strong>Date:</strong> {$timestamp}</p>";
        $emailBody .= "<p><strong>Page:</strong> {$pageUrl}</p>";
        $emailBody .= "<hr>";
        $emailBody .= "<h3>Message du client:</h3>";
        $emailBody .= "<p style='background: #f3f4f6; padding: 10px; border-radius: 8px;'>" . htmlspecialchars($userMessage) . "</p>";
        $emailBody .= "<h3>Réponse IA:</h3>";
        $emailBody .= "<p style='background: #e0f2fe; padding: 10px; border-radius: 8px;'>" . htmlspecialchars($aiResponse) . "</p>";
        $emailBody .= "<hr>";
        $emailBody .= "<p><strong>Pour répondre:</strong> Envoyez un email à <a href='mailto:chat-reply@deboucheur.expert?subject=REPLY:{$sessionId}'>chat-reply@deboucheur.expert</a> avec le sujet <code>REPLY:{$sessionId}</code></p>";
        $emailBody .= "<p style='color: #666;'>Délai de réponse: 0-12 heures</p>";
        $emailBody .= "</body></html>";
        
        // Send email
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: Apprenti Déboucheur <noreply@deboucheur.expert>\r\n";
        $headers .= "Reply-To: chat-reply@deboucheur.expert\r\n";
        
        @mail($ownerEmail, $emailSubject, $emailBody, $headers);
        @mail($secondaryEmail, $emailSubject, $emailBody, $headers);
        
        // Update forwarded status
        $db->query("UPDATE chat_conversations SET forwarded_email = 1 WHERE session_id = '$sessionId'");
        
        // SMS via Twilio (if configured)
        $twilioSid = getenv('TWILIO_SID') ?: '';
        $twilioToken = getenv('TWILIO_TOKEN') ?: '';
        $twilioFrom = getenv('TWILIO_FROM') ?: '';
        
        if (!empty($twilioSid) && !empty($twilioToken) && !empty($twilioFrom)) {
            $twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/{$twilioSid}/Messages.json";
            
            $smsData = [
                'To' => $ownerPhone,
                'From' => $twilioFrom,
                'Body' => $smsContent
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $twilioUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($smsData));
            curl_setopt($ch, CURLOPT_USERPWD, "$twilioSid:$twilioToken");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_exec($ch);
            curl_close($ch);
            
            $db->query("UPDATE chat_conversations SET forwarded_sms = 1 WHERE session_id = '$sessionId'");
        }
    }
    
    db_close($db);
    
    echo json_encode(['status' => 'ok', 'sessionId' => $sessionId]);
    
} catch (Exception $e) {
    error_log("Chat forward error: " . $e->getMessage());
    echo json_encode(['status' => 'ok']); // Don't expose errors to client
}
