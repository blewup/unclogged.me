<?php
/**
 * Déboucheur Expert - Email Service
 * Handles sending and receiving emails using SMTP/IMAP
 * 
 * Server: mail.privateemail.com (Namecheap Private Email)
 * IMAP: Port 993 (SSL/TLS)
 * SMTP: Port 465 (SSL/TLS)
 */

require_once __DIR__ . '/credentials.php';

class EmailService {
    private array $config;
    private string $lang;
    private $smtpConnection = null;
    
    public function __construct(string $lang = 'fr') {
        $this->lang = $lang;
        $this->config = SecureCredentials::getEmailConfig($lang);
    }
    
    /**
     * Send an email using SMTP with proper authentication
     */
    public function send(
        string $to,
        string $subject,
        string $body,
        bool $isHtml = true,
        ?string $replyTo = null,
        array $attachments = []
    ): array {
        $config = $this->config;
        
        if (empty($config['password'])) {
            return ['success' => false, 'error' => 'Email password not configured'];
        }
        
        try {
            // Create SMTP connection
            $socket = @fsockopen(
                'ssl://' . $config['smtp_host'],
                $config['smtp_port'],
                $errno,
                $errstr,
                30
            );
            
            if (!$socket) {
                throw new Exception("Could not connect to SMTP: $errstr ($errno)");
            }
            
            // Set timeout
            stream_set_timeout($socket, 30);
            
            // Read greeting
            $this->smtpRead($socket);
            
            // EHLO
            $this->smtpCommand($socket, "EHLO deboucheur.expert");
            
            // AUTH LOGIN
            $this->smtpCommand($socket, "AUTH LOGIN");
            $this->smtpCommand($socket, base64_encode($config['username']));
            $this->smtpCommand($socket, base64_encode($config['password']));
            
            // MAIL FROM
            $this->smtpCommand($socket, "MAIL FROM:<{$config['from_email']}>");
            
            // RCPT TO
            $this->smtpCommand($socket, "RCPT TO:<{$to}>");
            
            // DATA
            $this->smtpCommand($socket, "DATA");
            
            // Build message headers
            $boundary = md5(uniqid(time()));
            $headers = [];
            $headers[] = "Date: " . date('r');
            $headers[] = "From: {$config['from_name']} <{$config['from_email']}>";
            $headers[] = "To: {$to}";
            $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
            $headers[] = "Reply-To: " . ($replyTo ?: $config['reply_email']);
            $headers[] = "MIME-Version: 1.0";
            $headers[] = "X-Mailer: Deboucheur-Expert-Mailer/1.0";
            $headers[] = "Message-ID: <" . uniqid() . "@deboucheur.expert>";
            
            if (!empty($attachments)) {
                $headers[] = "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";
            } elseif ($isHtml) {
                $headers[] = "Content-Type: text/html; charset=UTF-8";
                $headers[] = "Content-Transfer-Encoding: 8bit";
            } else {
                $headers[] = "Content-Type: text/plain; charset=UTF-8";
                $headers[] = "Content-Transfer-Encoding: 8bit";
            }
            
            // Build message body
            $message = implode("\r\n", $headers) . "\r\n\r\n";
            
            if (!empty($attachments)) {
                // Multipart body with attachments
                $message .= "--{$boundary}\r\n";
                $message .= "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
                $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                $message .= $body . "\r\n\r\n";
                
                foreach ($attachments as $attachment) {
                    if (file_exists($attachment['path'])) {
                        $fileContent = base64_encode(file_get_contents($attachment['path']));
                        $fileName = $attachment['name'] ?? basename($attachment['path']);
                        $mimeType = $attachment['type'] ?? mime_content_type($attachment['path']);
                        
                        $message .= "--{$boundary}\r\n";
                        $message .= "Content-Type: {$mimeType}; name=\"{$fileName}\"\r\n";
                        $message .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n";
                        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
                        $message .= chunk_split($fileContent) . "\r\n";
                    }
                }
                
                $message .= "--{$boundary}--\r\n";
            } else {
                $message .= $body;
            }
            
            // Send message
            // Escape dots at beginning of lines
            $message = str_replace("\r\n.", "\r\n..", $message);
            fwrite($socket, $message . "\r\n.\r\n");
            $this->smtpRead($socket);
            
            // QUIT
            $this->smtpCommand($socket, "QUIT");
            
            fclose($socket);
            
            return ['success' => true, 'message' => 'Email sent successfully'];
            
        } catch (Exception $e) {
            error_log("SMTP Error: " . $e->getMessage());
            if (isset($socket) && is_resource($socket)) {
                fclose($socket);
            }
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Send SMTP command and read response
     */
    private function smtpCommand($socket, string $command): string {
        fwrite($socket, $command . "\r\n");
        return $this->smtpRead($socket);
    }
    
    /**
     * Read SMTP response
     */
    private function smtpRead($socket): string {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // Check if this is the last line (space after code)
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        
        // Check for error codes
        $code = (int)substr($response, 0, 3);
        if ($code >= 400) {
            throw new Exception("SMTP error: $response");
        }
        
        return $response;
    }
    
    /**
     * Check for new emails via IMAP
     * Used to poll for reply emails
     */
    public function checkForReplies(string $subjectPattern = 'REPLY:'): array {
        $config = $this->config;
        
        if (empty($config['password'])) {
            return ['success' => false, 'error' => 'Email password not configured', 'messages' => []];
        }
        
        $replies = [];
        
        try {
            // Connect to IMAP
            $mailbox = "{" . $config['imap_host'] . ":" . $config['imap_port'] . "/imap/ssl}INBOX";
            
            $imap = @imap_open($mailbox, $config['username'], $config['password']);
            
            if (!$imap) {
                throw new Exception("IMAP connection failed: " . imap_last_error());
            }
            
            // Search for unread emails with REPLY: in subject
            $emails = imap_search($imap, 'UNSEEN SUBJECT "' . $subjectPattern . '"');
            
            if ($emails) {
                foreach ($emails as $emailNum) {
                    $header = imap_headerinfo($imap, $emailNum);
                    $structure = imap_fetchstructure($imap, $emailNum);
                    
                    // Get subject
                    $subject = '';
                    if (isset($header->subject)) {
                        $subject = imap_utf8($header->subject);
                    }
                    
                    // Extract session ID from subject
                    $sessionId = '';
                    if (preg_match('/REPLY:([a-zA-Z0-9_-]+)/i', $subject, $matches)) {
                        $sessionId = $matches[1];
                    }
                    
                    // Get sender email
                    $fromEmail = '';
                    if (isset($header->from[0])) {
                        $fromEmail = $header->from[0]->mailbox . '@' . $header->from[0]->host;
                    }
                    
                    // Get body
                    $body = $this->getEmailBody($imap, $emailNum, $structure);
                    
                    if (!empty($sessionId) && !empty($body)) {
                        $replies[] = [
                            'sessionId' => $sessionId,
                            'fromEmail' => $fromEmail,
                            'subject' => $subject,
                            'body' => $body,
                            'date' => date('Y-m-d H:i:s', strtotime($header->date))
                        ];
                        
                        // Mark as read
                        imap_setflag_full($imap, (string)$emailNum, "\\Seen");
                    }
                }
            }
            
            imap_close($imap);
            
            return ['success' => true, 'messages' => $replies, 'count' => count($replies)];
            
        } catch (Exception $e) {
            error_log("IMAP Error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage(), 'messages' => []];
        }
    }
    
    /**
     * Extract email body from IMAP message
     */
    private function getEmailBody($imap, int $emailNum, $structure): string {
        $body = '';
        
        if (empty($structure->parts)) {
            // Simple message
            $body = imap_body($imap, $emailNum);
            if ($structure->encoding == 3) {
                $body = base64_decode($body);
            } elseif ($structure->encoding == 4) {
                $body = quoted_printable_decode($body);
            }
        } else {
            // Multipart - get text/plain part
            foreach ($structure->parts as $partNum => $part) {
                if ($part->subtype == 'PLAIN') {
                    $body = imap_fetchbody($imap, $emailNum, $partNum + 1);
                    if ($part->encoding == 3) {
                        $body = base64_decode($body);
                    } elseif ($part->encoding == 4) {
                        $body = quoted_printable_decode($body);
                    }
                    break;
                }
            }
        }
        
        // Clean up body
        $body = strip_tags($body);
        $body = preg_replace('/^>.*$/m', '', $body); // Remove quoted text
        $body = preg_replace('/--\s*\n.*$/s', '', $body); // Remove signature
        $body = trim($body);
        
        return $body;
    }
    
    /**
     * Send a chat notification email to owner
     */
    public function sendChatNotification(
        string $sessionId,
        string $userMessage,
        string $aiResponse,
        string $pageUrl = '',
        string $timestamp = ''
    ): array {
        if (empty($timestamp)) {
            $timestamp = date('Y-m-d H:i:s');
        }
        
        $subject = "💬 Nouveau chat client - REPLY:$sessionId";
        
        $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563EB, #1d4ed8); color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .info { background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .info strong { color: #374151; }
        .message-box { border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .user-msg { background: #e0f2fe; border-left: 4px solid #2563EB; }
        .ai-msg { background: #f0fdf4; border-left: 4px solid #22c55e; }
        .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; }
        .reply-box { background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; margin-top: 20px; }
        .reply-box a { color: #2563EB; font-weight: bold; text-decoration: none; }
        .footer { background: #1f2937; color: #9ca3af; padding: 16px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nouveau Message Chat</h1>
        </div>
        <div class="content">
            <div class="info">
                <p><strong>Session:</strong> {$sessionId}</p>
                <p><strong>Date:</strong> {$timestamp}</p>
                <p><strong>Page:</strong> {$pageUrl}</p>
            </div>
            
            <div class="label">👤 Message du client:</div>
            <div class="message-box user-msg">
                {$userMessage}
            </div>
            
            <div class="label">🤖 Réponse IA:</div>
            <div class="message-box ai-msg">
                {$aiResponse}
            </div>
            
            <div class="reply-box">
                <p><strong>📧 Pour répondre par email:</strong></p>
                <p>Répondez à cet email avec le sujet <code>REPLY:{$sessionId}</code></p>
                <p style="margin-top: 10px;"><strong>📱 Pour répondre par SMS:</strong></p>
                <p>Envoyez: <code>REPLY:{$sessionId} Votre message</code></p>
            </div>
        </div>
        <div class="footer">
            <p>Déboucheur Expert - unclogged.me</p>
            <p>Délai de réponse recommandé: 0-12 heures</p>
        </div>
    </div>
</body>
</html>
HTML;
        
        // Send to primary email
        $result1 = $this->send(
            'info@deboucheur.expert',
            $subject,
            $body,
            true,
            'info@deboucheur.expert'
        );
        
        // Send to secondary email
        $result2 = $this->send(
            'info@unclogged.me',
            $subject,
            $body,
            true,
            'info@deboucheur.expert'
        );
        
        return [
            'primary' => $result1,
            'secondary' => $result2
        ];
    }
}

/**
 * Cron job to check for email replies
 * Run this every 5 minutes: * /5 * * * * php /path/to/email-cron.php
 */
function processEmailReplies(): void {
    require_once __DIR__ . '/db.php';
    
    $emailService = new EmailService();
    $result = $emailService->checkForReplies();
    
    if ($result['success'] && !empty($result['messages'])) {
        $db = get_db_connection('prod');
        
        foreach ($result['messages'] as $reply) {
            // Store owner response
            $stmt = $db->prepare("INSERT INTO chat_conversations (session_id, role, content, timestamp, forwarded_email) VALUES (?, 'owner', ?, ?, 1)");
            $stmt->bind_param('sss', $reply['sessionId'], $reply['body'], $reply['date']);
            $stmt->execute();
            $stmt->close();
            
            error_log("Email reply processed for session: " . $reply['sessionId']);
        }
        
        db_close($db);
    }
}

// If called directly as cron job
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    processEmailReplies();
}
