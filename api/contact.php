<?php
/**
 * Déboucheur Expert - Contact Form Handler
 * 
 * Accepts multipart/form-data submissions with user details (fname, lname, 
 * email, phone, msg), preferred language (lang) and optional file attachment.
 * 
 * Required PHP modules: json, mysqli, fileinfo, mbstring
 * 
 * Actions performed:
 * 1. Saves uploaded file (if any) to uploads directory (PNG, JPEG, WEBP, AVIF)
 * 2. Inserts record into contacts table via MariaDB
 * 3. Sends email notification via EmailService (SMTP)
 *    - French: info@deboucheur.expert
 *    - English: info@unclogged.me
 * 
 * Returns JSON {status: 'ok'} on success, {error: '...'} on failure.
 */

header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/email-service.php';

// Determine environment (prod/test/dev) from POST; default prod
$env = $_POST['env'] ?? 'prod';

// Gather fields
$fname = trim($_POST['fname'] ?? '');
$lname = trim($_POST['lname'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$msg = trim($_POST['msg'] ?? '');
$lang = strtolower(trim($_POST['lang'] ?? 'fr'));
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// Validate required fields
if (!$fname || !$lname || !$email || !$msg) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
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
    error_log("Contact form email failed: " . $e->getMessage());
}

// Respond with success
echo json_encode(['status' => 'ok']);
exit;
