<?php
/**
 * Déboucheur Expert - Twilio SMS Status Webhook
 * Receives delivery status updates for sent SMS messages
 * 
 * Configure in Twilio: Message → StatusCallback URL
 */

// Log status updates
$logFile = __DIR__ . '/logs/sms-status.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

$logEntry = date('Y-m-d H:i:s') . " | " . json_encode($_POST) . "\n";
file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

// Respond with 200 OK
http_response_code(200);
echo 'OK';
