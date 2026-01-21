<?php
/**
 * Déboucheur Expert - Chat Responses API
 * Returns owner responses for a chat session
 * 
 * Client polls this endpoint to check for owner replies via SMS
 * Owner replies by SMS with format: REPLY:sessionId message
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

// Get sessionId from query or POST
$sessionId = $_GET['sessionId'] ?? $_POST['sessionId'] ?? '';
$lastId = intval($_GET['lastId'] ?? $_POST['lastId'] ?? 0);

if (empty($sessionId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing sessionId']);
    exit;
}

try {
    $db = get_db_connection('prod');
    
    // Build query to get owner responses not yet seen
    $stmt = $db->prepare("SELECT id, content, timestamp 
                          FROM chat_conversations 
                          WHERE session_id = ? 
                          AND role = 'owner'
                          AND id > ?
                          ORDER BY id ASC");
    $stmt->bind_param('si', $sessionId, $lastId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $responses = [];
    $maxId = $lastId;
    
    while ($row = $result->fetch_assoc()) {
        $responses[] = [
            'id' => (int)$row['id'],
            'message' => $row['content'],
            'timestamp' => $row['timestamp'],
            'sender' => 'Billy'
        ];
        $maxId = max($maxId, (int)$row['id']);
    }
    
    $stmt->close();
    db_close($db);
    
    echo json_encode([
        'status' => 'ok',
        'responses' => $responses,
        'count' => count($responses),
        'lastId' => $maxId,
        'serverTime' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("Chat responses error: " . $e->getMessage());
    echo json_encode([
        'status' => 'ok',
        'responses' => [],
        'count' => 0,
        'lastId' => $lastId
    ]);
}
