<?php
/**
 * Déboucheur Expert - Email Reply Cron Job
 * Polls IMAP for owner reply emails and stores them in database
 * 
 * CRON SETUP (run every 5 minutes):
 * */5 * * * * php /path/to/api/cron-email-replies.php >> /path/to/api/logs/email-cron.log 2>&1
 * 
 * Or use cPanel Cron Jobs interface
 */

// Set timezone
date_default_timezone_set('America/Toronto');

// Error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/email-cron-errors.log');

// Ensure logs directory exists
$logsDir = __DIR__ . '/logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/credentials.php';
require_once __DIR__ . '/email-service.php';

echo "[" . date('Y-m-d H:i:s') . "] Starting email reply check...\n";

try {
    $emailService = new EmailService();
    $result = $emailService->checkForReplies('REPLY:');
    
    if (!$result['success']) {
        echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . ($result['error'] ?? 'Unknown error') . "\n";
        exit(1);
    }
    
    $count = $result['count'] ?? 0;
    echo "[" . date('Y-m-d H:i:s') . "] Found $count reply email(s)\n";
    
    if ($count > 0 && !empty($result['messages'])) {
        $db = get_db_connection('prod');
        
        foreach ($result['messages'] as $reply) {
            $sessionId = $reply['sessionId'];
            $body = $reply['body'];
            $date = $reply['date'];
            $fromEmail = $reply['fromEmail'];
            
            // Verify session exists
            $checkSession = $db->prepare("SELECT COUNT(*) as cnt FROM chat_conversations WHERE session_id = ?");
            $checkSession->bind_param('s', $sessionId);
            $checkSession->execute();
            $checkResult = $checkSession->get_result()->fetch_assoc();
            $checkSession->close();
            
            if ($checkResult['cnt'] > 0) {
                // Store owner response
                $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, forwarded_email) VALUES (?, 'owner', ?, ?, 1)");
                $stmt->bind_param('sss', $sessionId, $body, $date);
                $stmt->execute();
                $stmt->close();
                
                echo "[" . date('Y-m-d H:i:s') . "] ✅ Stored reply for session: $sessionId (from: $fromEmail)\n";
            } else {
                echo "[" . date('Y-m-d H:i:s') . "] ⚠️ Session not found: $sessionId (from: $fromEmail)\n";
            }
        }
        
        db_close($db);
    }
    
    echo "[" . date('Y-m-d H:i:s') . "] Email check complete.\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] EXCEPTION: " . $e->getMessage() . "\n";
    error_log("Email cron exception: " . $e->getMessage());
    exit(1);
}
