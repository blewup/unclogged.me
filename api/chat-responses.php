<?php
/**
 * Déboucheur Expert - Chat Responses API
 * Returns owner responses for a chat session
 * 
 * Client polls this endpoint to check for owner replies
 * Owner can reply via email with subject REPLY:{sessionId}
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
$lastCheck = $_GET['lastCheck'] ?? $_POST['lastCheck'] ?? '';

if (empty($sessionId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing sessionId']);
    exit;
}

try {
    $db = get_db_connection('prod');
    
    // Build query to get owner responses
    $sessionId = $db->real_escape_string($sessionId);
    
    $sql = "SELECT id, content, timestamp 
            FROM chat_conversations 
            WHERE session_id = '$sessionId' 
            AND role = 'owner'";
    
    // If lastCheck provided, only get newer messages
    if (!empty($lastCheck)) {
        $lastCheck = $db->real_escape_string($lastCheck);
        $sql .= " AND timestamp > '$lastCheck'";
    }
    
    $sql .= " ORDER BY timestamp ASC";
    
    $result = $db->query($sql);
    
    $responses = [];
    while ($row = $result->fetch_assoc()) {
        $responses[] = [
            'id' => (int)$row['id'],
            'content' => $row['content'],
            'timestamp' => $row['timestamp'],
            'sender' => 'Billy'
        ];
    }
    
    db_close($db);
    
    echo json_encode([
        'status' => 'ok',
        'responses' => $responses,
        'count' => count($responses),
        'serverTime' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("Chat responses error: " . $e->getMessage());
    echo json_encode([
        'status' => 'ok',
        'responses' => [],
        'count' => 0
    ]);
}
