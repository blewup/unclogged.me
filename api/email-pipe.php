#!/usr/bin/php
<?php
/**
 * Déboucheur Expert - Email Pipe Handler
 * 
 * This script is called by cPanel's email forwarder when an email arrives.
 * It reads the raw email from STDIN, parses it, and processes any chat replies.
 * 
 * CPANEL SETUP:
 * 1. Go to: cPanel → Email → Forwarders
 * 2. Click "Add Forwarder"
 * 3. Address: reply@deboucheur.expert (or info@)
 * 4. Destination: "Pipe to a Program"
 * 5. Path: /home/yourusername/public_html/api/email-pipe.php
 * 6. Save
 * 
 * Make sure this file is executable: chmod +x email-pipe.php
 * 
 * @author Billy St-Hilaire / GitHub Copilot
 * @version 1.0.0
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Log file for debugging
define('LOG_FILE', __DIR__ . '/logs/email-pipe.log');

// Ensure logs directory exists
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}

/**
 * Log message to file
 */
function logMessage(string $message, string $level = 'INFO'): void {
    $timestamp = date('Y-m-d H:i:s');
    $line = "[$timestamp] [$level] $message\n";
    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}

/**
 * Parse raw email and extract relevant parts
 */
function parseEmail(string $rawEmail): array {
    $result = [
        'from' => '',
        'to' => '',
        'subject' => '',
        'body' => '',
        'session_id' => null,
        'reply_text' => '',
    ];
    
    // Split headers and body
    $parts = preg_split('/\r?\n\r?\n/', $rawEmail, 2);
    $headerSection = $parts[0] ?? '';
    $bodySection = $parts[1] ?? '';
    
    // Parse headers
    $headers = [];
    $currentHeader = '';
    foreach (explode("\n", $headerSection) as $line) {
        if (preg_match('/^([A-Za-z0-9-]+):\s*(.*)$/', $line, $m)) {
            $currentHeader = strtolower($m[1]);
            $headers[$currentHeader] = trim($m[2]);
        } elseif (preg_match('/^\s+(.*)$/', $line, $m) && $currentHeader) {
            // Continuation of previous header
            $headers[$currentHeader] .= ' ' . trim($m[1]);
        }
    }
    
    $result['from'] = $headers['from'] ?? '';
    $result['to'] = $headers['to'] ?? '';
    $result['subject'] = $headers['subject'] ?? '';
    
    // Decode subject if encoded
    if (preg_match('/=\?([^?]+)\?([BQ])\?([^?]+)\?=/i', $result['subject'], $m)) {
        $charset = $m[1];
        $encoding = strtoupper($m[2]);
        $encoded = $m[3];
        
        if ($encoding === 'B') {
            $result['subject'] = base64_decode($encoded);
        } elseif ($encoding === 'Q') {
            $result['subject'] = quoted_printable_decode(str_replace('_', ' ', $encoded));
        }
    }
    
    // Handle MIME multipart
    $contentType = $headers['content-type'] ?? 'text/plain';
    
    if (stripos($contentType, 'multipart') !== false) {
        // Extract boundary
        if (preg_match('/boundary=["\']?([^"\';\s]+)["\']?/i', $contentType, $m)) {
            $boundary = $m[1];
            $bodyParts = explode('--' . $boundary, $bodySection);
            
            foreach ($bodyParts as $part) {
                // Look for text/plain part
                if (stripos($part, 'text/plain') !== false) {
                    $partParts = preg_split('/\r?\n\r?\n/', $part, 2);
                    if (isset($partParts[1])) {
                        $bodySection = trim($partParts[1]);
                        break;
                    }
                }
            }
        }
    }
    
    // Decode body if needed (quoted-printable or base64)
    $transferEncoding = $headers['content-transfer-encoding'] ?? '';
    if (stripos($transferEncoding, 'quoted-printable') !== false) {
        $bodySection = quoted_printable_decode($bodySection);
    } elseif (stripos($transferEncoding, 'base64') !== false) {
        $bodySection = base64_decode($bodySection);
    }
    
    $result['body'] = trim($bodySection);
    
    // Extract session ID from subject or body
    // Format: [Session: abc123] or REPLY:abc123 or R:abc123
    if (preg_match('/\[Session:\s*([a-zA-Z0-9_-]+)\]/i', $result['subject'], $m)) {
        $result['session_id'] = $m[1];
    } elseif (preg_match('/\[Session:\s*([a-zA-Z0-9_-]+)\]/i', $result['body'], $m)) {
        $result['session_id'] = $m[1];
    } elseif (preg_match('/^(?:REPLY|R):?\s*([a-zA-Z0-9_-]+)/im', $result['body'], $m)) {
        $result['session_id'] = $m[1];
    }
    
    // Extract reply text (everything before quoted content)
    $replyText = $result['body'];
    
    // Remove quoted replies (lines starting with >)
    $replyText = preg_replace('/^>.*$/m', '', $replyText);
    
    // Remove "On DATE, NAME wrote:" patterns
    $replyText = preg_replace('/On .+ wrote:\s*$/s', '', $replyText);
    $replyText = preg_replace('/Le .+ a écrit\s*:\s*$/s', '', $replyText);
    
    // Remove original message markers
    $replyText = preg_replace('/-----\s*Original Message\s*-----.*$/si', '', $replyText);
    $replyText = preg_replace('/-----\s*Message original\s*-----.*$/si', '', $replyText);
    
    // Remove REPLY:sessionId from the text
    $replyText = preg_replace('/^(?:REPLY|R):?\s*[a-zA-Z0-9_-]+\s*/im', '', $replyText);
    
    // Remove signatures
    $replyText = preg_replace('/^--\s*$.*/sm', '', $replyText);
    
    // Clean up
    $replyText = trim($replyText);
    $result['reply_text'] = $replyText;
    
    return $result;
}

/**
 * Send reply to chat session
 */
function sendReply(string $sessionId, string $message): bool {
    $url = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'deboucheur.expert') . '/api/chat-reply.php';
    
    $data = [
        'session_id' => $sessionId,
        'message' => $message,
        'from' => 'email-pipe',
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($data),
            'timeout' => 10,
        ],
    ];
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        logMessage("Failed to send reply to $url", 'ERROR');
        return false;
    }
    
    $result = json_decode($response, true);
    return ($result['status'] ?? '') === 'ok';
}

/**
 * Get the most recent active session
 */
function getLastSession(): ?string {
    require_once __DIR__ . '/db.php';
    
    try {
        $db = get_db_connection('prod');
        $result = db_query($db, 
            "SELECT session_id FROM chat_sessions 
             WHERE chat_ended IS NULL 
             ORDER BY chat_started DESC 
             LIMIT 1"
        );
        db_close($db);
        
        if (!empty($result)) {
            return $result[0]['session_id'];
        }
    } catch (Exception $e) {
        logMessage("Database error: " . $e->getMessage(), 'ERROR');
    }
    
    return null;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

logMessage("Email pipe triggered");

// Read raw email from STDIN
$rawEmail = '';
$stdin = fopen('php://stdin', 'r');
if ($stdin) {
    while (!feof($stdin)) {
        $rawEmail .= fread($stdin, 8192);
    }
    fclose($stdin);
}

if (empty($rawEmail)) {
    logMessage("No email content received", 'ERROR');
    exit(0);
}

logMessage("Received email: " . strlen($rawEmail) . " bytes");

// Parse the email
$email = parseEmail($rawEmail);

logMessage("From: {$email['from']}");
logMessage("Subject: {$email['subject']}");
logMessage("Session ID: " . ($email['session_id'] ?? 'NONE'));

// Verify sender is owner
$ownerEmails = [
    'info@deboucheur.expert',
    'info@unclogged.me',
    'billy@deboucheur.expert',
    'shurukn@gmail.com',
];

$fromEmail = '';
if (preg_match('/<([^>]+)>/', $email['from'], $m)) {
    $fromEmail = strtolower($m[1]);
} else {
    $fromEmail = strtolower(trim($email['from']));
}

$isOwner = false;
foreach ($ownerEmails as $allowed) {
    if (stripos($fromEmail, $allowed) !== false) {
        $isOwner = true;
        break;
    }
}

if (!$isOwner) {
    logMessage("Unauthorized sender: $fromEmail", 'WARNING');
    exit(0);
}

// Get session ID
$sessionId = $email['session_id'];

// Handle LAST command - reply to most recent session
if (!$sessionId && stripos($email['body'], 'LAST') !== false) {
    $sessionId = getLastSession();
    logMessage("Using LAST session: $sessionId");
}

if (!$sessionId) {
    logMessage("No session ID found in email", 'WARNING');
    exit(0);
}

// Get reply text
$replyText = $email['reply_text'];

if (empty($replyText)) {
    logMessage("No reply text found", 'WARNING');
    exit(0);
}

logMessage("Reply text: " . substr($replyText, 0, 100) . "...");

// Send the reply
if (sendReply($sessionId, $replyText)) {
    logMessage("Reply sent successfully to session: $sessionId");
} else {
    logMessage("Failed to send reply to session: $sessionId", 'ERROR');
}

exit(0);
