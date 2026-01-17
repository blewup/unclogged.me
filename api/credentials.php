<?php
/**
 * Déboucheur Expert - Secure Credentials Manager
 * Uses Fernet-compatible encryption for sensitive data
 * 
 * IMPORTANT: This file should have restricted permissions (chmod 600)
 * and should be excluded from version control in production
 */

if (!defined('CREDENTIALS_ACCESS')) {
    define('CREDENTIALS_ACCESS', true);
}

/**
 * Fernet-compatible decryption using OpenSSL
 * Compatible with Python's cryptography.fernet.Fernet
 */
class SecureCredentials {
    // Base64-encoded Fernet key (32 bytes = 256 bits)
    private static string $key = 'Z4EHd01ACF3Oj3ivOJtxSqtnn_f_o9Fg4AY4c_We73M=';
    
    // Encrypted tokens (generated using Python Fernet)
    private static array $encryptedTokens = [
        'email_password' => 'gAAAAABpa0fK_5U0zQmk6CCwlPfbvD8WbvIbmD4les3ykgcIL2Anr-507Sg8zXYZvsKbxYlxNzY1MUwbUxn_ct7nhHYO84nPrQ==',
        'twilio_auth_token' => 'gAAAAABpa1F4uvWD1ktHYMgUPgNNobGbdZg9nPjsKWoCe44BO_AKVjSTEUPa4wZScwmTrWaw58s5DNo8qJ0z5CUERNW51eQicEPxBQ0fMiJneybP0ffVjSmBgoBbrQek5jNl0i3mjbjx',
        // Add more encrypted tokens as needed:
        // 'gemini_api_key' => 'encrypted_token_here',
    ];
    
    /**
     * Decrypt a Fernet-encrypted token
     * Fernet format: version (1) + timestamp (8) + IV (16) + ciphertext + HMAC (32)
     */
    public static function decrypt(string $encryptedToken): ?string {
        try {
            // Decode the key (URL-safe base64)
            $keyBytes = base64_decode(strtr(self::$key, '-_', '+/'));
            if (strlen($keyBytes) !== 32) {
                error_log("Invalid Fernet key length");
                return null;
            }
            
            // Split key: first 16 bytes for HMAC, last 16 bytes for AES
            $signingKey = substr($keyBytes, 0, 16);
            $encryptionKey = substr($keyBytes, 16, 16);
            
            // Decode the token (URL-safe base64)
            $tokenBytes = base64_decode(strtr($encryptedToken, '-_', '+/'));
            if (strlen($tokenBytes) < 57) { // 1 + 8 + 16 + min 1 + 32
                error_log("Token too short");
                return null;
            }
            
            // Parse Fernet token
            $version = ord($tokenBytes[0]);
            if ($version !== 0x80) {
                error_log("Invalid Fernet version");
                return null;
            }
            
            $timestamp = substr($tokenBytes, 1, 8);
            $iv = substr($tokenBytes, 9, 16);
            $hmac = substr($tokenBytes, -32);
            $ciphertext = substr($tokenBytes, 25, -32);
            
            // Verify HMAC (SHA256)
            $dataToVerify = substr($tokenBytes, 0, -32);
            $expectedHmac = hash_hmac('sha256', $dataToVerify, $signingKey, true);
            
            if (!hash_equals($expectedHmac, $hmac)) {
                error_log("HMAC verification failed");
                return null;
            }
            
            // Decrypt using AES-128-CBC
            $decrypted = openssl_decrypt(
                $ciphertext,
                'AES-128-CBC',
                $encryptionKey,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted === false) {
                error_log("Decryption failed: " . openssl_error_string());
                return null;
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log("Credential decryption error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Encrypt a value using Fernet-compatible format
     * Use this to generate new encrypted tokens
     */
    public static function encrypt(string $plaintext): ?string {
        try {
            $keyBytes = base64_decode(strtr(self::$key, '-_', '+/'));
            $signingKey = substr($keyBytes, 0, 16);
            $encryptionKey = substr($keyBytes, 16, 16);
            
            // Generate IV
            $iv = random_bytes(16);
            
            // Current timestamp (8 bytes, big-endian)
            $timestamp = pack('J', time());
            
            // Encrypt with AES-128-CBC
            $ciphertext = openssl_encrypt(
                $plaintext,
                'AES-128-CBC',
                $encryptionKey,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            // Build token: version + timestamp + IV + ciphertext
            $version = chr(0x80);
            $tokenData = $version . $timestamp . $iv . $ciphertext;
            
            // Add HMAC
            $hmac = hash_hmac('sha256', $tokenData, $signingKey, true);
            $fullToken = $tokenData . $hmac;
            
            // Return URL-safe base64
            return strtr(base64_encode($fullToken), '+/', '-_');
            
        } catch (Exception $e) {
            error_log("Encryption error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get a specific credential by name
     */
    public static function get(string $name): ?string {
        if (!isset(self::$encryptedTokens[$name])) {
            error_log("Unknown credential: $name");
            return null;
        }
        
        return self::decrypt(self::$encryptedTokens[$name]);
    }
    
    /**
     * Email configuration
     * Server: server385.web-hosting.com (Namecheap Shared Hosting)
     */
    public static function getEmailConfig(string $lang = 'fr'): array {
        // Language-specific email addresses
        $fromEmail = ($lang === 'en') ? 'info@unclogged.me' : 'info@deboucheur.expert';
        $fromName = ($lang === 'en') ? 'Unclogged by Déboucheur Expert' : 'Déboucheur Expert';
        
        return [
            'smtp_host' => 'server385.web-hosting.com',
            'smtp_port' => 465,
            'smtp_secure' => 'ssl',
            'imap_host' => 'server385.web-hosting.com',
            'imap_port' => 993,
            'imap_secure' => 'ssl',
            'pop3_host' => 'server385.web-hosting.com',
            'pop3_port' => 995,
            'username' => 'deboucheur@deboucheur.expert',
            'password' => self::get('email_password'),
            'from_email' => $fromEmail,
            'from_name' => $fromName,
            'reply_email' => $fromEmail,
            // Both notification addresses
            'notify_fr' => 'info@deboucheur.expert',
            'notify_en' => 'info@unclogged.me',
        ];
    }
    
    /**
     * Twilio SMS configuration
     * Credentials stored encrypted - no env vars needed
     */
    public static function getTwilioConfig(): array {
        return [
            'account_sid' => 'AC2a232bd5f87d8f272c490ef7951f8550',
            'auth_token' => self::get('twilio_auth_token'),
            'from_number' => '+18126489709',
            'owner_phone' => '+14385302343',
            'secondary_phone' => '+14387657040',
            'webhook_url' => 'https://deboucheur.expert/api/sms-webhook.php',
        ];
    }
    
    /**
     * Gemini AI configuration
     */
    public static function getGeminiConfig(): array {
        return [
            'api_key' => getenv('GEMINI_API_KEY') ?: '', // Or use: self::get('gemini_api_key')
            'model' => 'gemini-2.5-flash-preview-09-2025',
        ];
    }
}

// Quick test function (remove in production)
function testCredentials(): void {
    echo "Testing email password decryption...\n";
    $password = SecureCredentials::get('email_password');
    if ($password) {
        echo "✅ Decryption successful! Password length: " . strlen($password) . "\n";
        // Don't print the actual password in logs!
    } else {
        echo "❌ Decryption failed\n";
    }
}

// Uncomment to test: testCredentials();
