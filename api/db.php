<?php
/**
 * Simple database helper for Déboucheur.  Provides a function to
 * establish a MySQLi connection using credentials for the appropriate
 * environment.  You can call get_db_connection('prod'),
 * get_db_connection('test') or get_db_connection('dev') to connect
 * to the respective database.  If the connection fails, the script
 * will halt with an error message.
 */

function get_db_connection(string $env = 'prod'): mysqli {
    $host = 'localhost';
    $user = 'deboucheur_shurukn';
    $pass = 'Christina4032';
    // Select database based on environment
    switch ($env) {
        case 'test':
            $db = 'deboucheur_test';
            break;
        case 'dev':
            $db = 'deboucheur_dev';
            break;
        case 'prod':
        default:
            $db = 'deboucheur_prod';
            break;
    }
    $mysqli = new mysqli($host, $user, $pass, $db);
    if ($mysqli->connect_errno) {
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed: ' . $mysqli->connect_error]));
    }
    $mysqli->set_charset('utf8mb4');
    return $mysqli;
}
