<?php
/**
 * Advanced contact form handler for Déboucheur.
 *
 * This endpoint accepts multipart/form-data submissions containing
 * user details (fname, lname, email, phone, msg), the preferred
 * language (lang) and an optional file attachment.  On receipt it
 * performs the following actions:
 *
 * 1. Saves the uploaded file (if any) to the uploads directory and
 *    records its relative path.  Only images of certain types are
 *    accepted (PNG, JPEG, JPG, WEBP, AVIF).  If the file is not
 *    provided or is of an unsupported type, it is ignored.
 *
 * 2. Inserts a record into the contacts table of the appropriate
 *    database (prod/test/dev) using credentials defined in db.php.  The
 *    database is selected via the `env` POST parameter (defaults to
 *    prod).  You must create the contacts table with the following
 *    schema:
 *      CREATE TABLE contacts (
 *        id INT AUTO_INCREMENT PRIMARY KEY,
 *        fname VARCHAR(100),
 *        lname VARCHAR(100),
 *        email VARCHAR(255),
 *        phone VARCHAR(50),
 *        message TEXT,
 *        attachment_path VARCHAR(255),
 *        lang VARCHAR(10),
 *        ip VARCHAR(45),
 *        user_agent VARCHAR(255),
 *        created_at DATETIME
 *      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 *
 * 3. Sends an email notification to the appropriate support address
 *    depending on the selected language: `info@deboucheur.expert` for
 *    French (lang=fr) and `info@unclogged.me` for English (lang=en).
 *    The email includes the message body and, if present, attaches
 *    the uploaded file.  Adjust the sender address below as needed.
 *
 * On success, returns JSON {status: 'ok'}.  On failure, returns
 * JSON {error: '...'}.  This script uses the PHP mail() function; in
 * production, consider using a more robust library (e.g. PHPMailer)
 * configured with SMTP credentials.
 */

header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/db.php';

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

// Compose email
$to = ($lang === 'en') ? 'info@unclogged.me' : 'info@deboucheur.expert';
$subject = 'Nouvelle demande de contact de ' . $fname . ' ' . $lname;
$boundary = md5(uniqid(time()));
$headers = "From: " . $email . "\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

$body = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= "Nom: $fname $lname\n";
$body .= "Courriel: $email\n";
$body .= "Téléphone: $phone\n";
$body .= "Langue: $lang\n";
$body .= "Message:\n$msg\n\n";

// Attach file if available
if ($attachmentPath) {
    $fileContent = file_get_contents(__DIR__ . '/' . $attachmentPath);
    $fileContentEncoded = chunk_split(base64_encode($fileContent));
    $fileName = basename($attachmentPath);
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/octet-stream; name=\"$fileName\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"$fileName\"\r\n\r\n";
    $body .= $fileContentEncoded . "\r\n\r\n";
}
$body .= "--$boundary--";

// Attempt to send email (silently ignore failure)
@mail($to, $subject, $body, $headers);

// Respond with success
echo json_encode(['status' => 'ok']);
exit;
