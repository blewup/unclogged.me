<?php
declare(strict_types=1);
/**
 * Déboucheur Expert - Contact Form Handler
 * 
 * @version 2.1.0 - Modernized with security module
 * @requires PHP 8.2+
 */

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/email-service.php';

// Apply security headers and CORS
SecurityHeaders::apply(isApi: true);
SecurityHeaders::cors(['POST', 'OPTIONS']);

header('Content-Type: application/json; charset=utf-8');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    JsonResponse::error('Method not allowed', 405);
}

// Apply rate limiting (10 submissions per hour)
$rateLimiter = new RateLimiter();
$rateLimiter->enforce(maxRequests: 10, windowSeconds: 3600);

// Determine environment (prod/test/dev) from POST; default prod
$env = InputValidator::string($_POST['env'] ?? 'prod', 10);
if (!in_array($env, ['prod', 'test', 'dev'], true)) {
    $env = 'prod';
}

// Gather and validate fields
$fname = InputValidator::string($_POST['fname'] ?? '', 100);
$lname = InputValidator::string($_POST['lname'] ?? '', 100);
$email = InputValidator::email($_POST['email'] ?? '');
$phone = InputValidator::phone($_POST['phone'] ?? '') ?? '';
$msg = InputValidator::string($_POST['msg'] ?? '', 5000);
$lang = InputValidator::language($_POST['lang'] ?? 'fr');
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = InputValidator::string($_SERVER['HTTP_USER_AGENT'] ?? '', 512);

// Validate required fields
$errors = [];
if (empty($fname)) $errors['fname'] = 'First name is required';
if (empty($lname)) $errors['lname'] = 'Last name is required';
if (!$email) $errors['email'] = 'Valid email is required';
if (empty($msg)) $errors['msg'] = 'Message is required';

if (!empty($errors)) {
    JsonResponse::validationError($errors);
}

// Handle optional file upload
$allowedMime = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/avif'
];
$attachmentPath = null;
$attachmentFullPath = null;
if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
    $tmpPath = $_FILES['attachment']['tmp_name'];
    $mimeType = mime_content_type($tmpPath);
    if (in_array($mimeType, $allowedMime)) {
        $uploadsDir = __DIR__ . '/uploads';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }
        $filename = uniqid('file_', true) . '_' . basename($_FILES['attachment']['name']);
        $destination = $uploadsDir . '/' . $filename;
        if (move_uploaded_file($tmpPath, $destination)) {
            $attachmentPath = 'api/uploads/' . $filename;
            $attachmentFullPath = $destination;
        }
    }
}

// Insert into database
$mysqli = get_db_connection($env);
$stmt = $mysqli->prepare('INSERT INTO contacts (fname, lname, email, phone, message, attachment_path, lang, ip, user_agent, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())');
if ($stmt) {
    $stmt->bind_param('sssssssss', $fname, $lname, $email, $phone, $msg, $attachmentPath, $lang, $ip, $userAgent);
    $stmt->execute();
    $stmt->close();
}
$mysqli->close();

// Send email via EmailService
try {
    $emailService = new EmailService();
    
    // Select recipient based on language
    $to = ($lang === 'en') ? 'info@unclogged.me' : 'info@deboucheur.expert';
    
    // Build subject
    $subject = ($lang === 'en') 
        ? 'New contact request from ' . $fname . ' ' . $lname
        : 'Nouvelle demande de contact de ' . $fname . ' ' . $lname;
    
    // Build HTML body
    $htmlBody = "<html><body>";
    $htmlBody .= "<h2>" . ($lang === 'en' ? 'New Contact Request' : 'Nouvelle Demande de Contact') . "</h2>";
    $htmlBody .= "<table style='border-collapse:collapse;width:100%;max-width:600px;'>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>" . ($lang === 'en' ? 'Name' : 'Nom') . "</td><td style='padding:8px;border:1px solid #ddd;'>" . htmlspecialchars($fname . ' ' . $lname) . "</td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>" . ($lang === 'en' ? 'Email' : 'Courriel') . "</td><td style='padding:8px;border:1px solid #ddd;'><a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>" . ($lang === 'en' ? 'Phone' : 'Téléphone') . "</td><td style='padding:8px;border:1px solid #ddd;'><a href='tel:" . htmlspecialchars($phone) . "'>" . htmlspecialchars($phone) . "</a></td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;'>" . ($lang === 'en' ? 'Language' : 'Langue') . "</td><td style='padding:8px;border:1px solid #ddd;'>" . strtoupper($lang) . "</td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;' colspan='2'>" . ($lang === 'en' ? 'Message' : 'Message') . "</td></tr>";
    $htmlBody .= "<tr><td style='padding:8px;border:1px solid #ddd;' colspan='2'>" . nl2br(htmlspecialchars($msg)) . "</td></tr>";
    $htmlBody .= "</table>";
    
    if ($attachmentPath) {
        $htmlBody .= "<p style='margin-top:15px;'><strong>" . ($lang === 'en' ? 'Attachment included' : 'Pièce jointe incluse') . "</strong></p>";
    }
    
    $htmlBody .= "<hr style='margin-top:20px;'>";
    $htmlBody .= "<p style='font-size:12px;color:#666;'>IP: " . htmlspecialchars($ip) . "<br>User Agent: " . htmlspecialchars(substr($userAgent, 0, 100)) . "</p>";
    $htmlBody .= "</body></html>";
    
    // Plain text version
    $textBody = ($lang === 'en' ? 'Name: ' : 'Nom: ') . $fname . ' ' . $lname . "\n";
    $textBody .= ($lang === 'en' ? 'Email: ' : 'Courriel: ') . $email . "\n";
    $textBody .= ($lang === 'en' ? 'Phone: ' : 'Téléphone: ') . $phone . "\n";
    $textBody .= ($lang === 'en' ? 'Language: ' : 'Langue: ') . strtoupper($lang) . "\n\n";
    $textBody .= ($lang === 'en' ? 'Message:' : 'Message:') . "\n" . $msg;
    
    // Send with attachment if present
    $attachments = [];
    if ($attachmentFullPath && file_exists($attachmentFullPath)) {
        $attachments[] = $attachmentFullPath;
    }
    
    $emailService->send($to, $subject, $htmlBody, $textBody, $email, $attachments);
    
} catch (Exception $e) {
    // Log error but don't fail the request - DB insert was successful
    SecurityLogger::warning('Contact form email failed', ['error' => $e->getMessage()]);
}

// Log successful submission
SecurityLogger::info('Contact form submitted', [
    'email' => $email,
    'lang' => $lang,
    'hasAttachment' => !empty($attachmentPath)
]);

// Respond with success
JsonResponse::success();
