# Déboucheur Expert - API Configuration Guide

This document explains how to configure the email and SMS notification system for the AI chat widget.

## Overview

When a visitor uses the AI chat on the website, the system:
1. Stores the conversation in the database
2. Sends notifications to the owner via **Email** and **SMS**
3. Allows the owner to reply via **Email** or **SMS**
4. Delivers the owner's reply back to the visitor

## Files Structure

```
api/
├── credentials.php        # Secure credential storage (encrypted)
├── email-service.php      # SMTP/IMAP email handling
├── chat-forward.php       # Forwards chat messages to owner
├── chat-reply.php         # Processes owner replies
├── chat-responses.php     # Returns owner responses to frontend
├── sms-webhook.php        # Receives SMS replies from Twilio
├── sms-status.php         # Twilio delivery status webhook
├── cron-email-replies.php # Cron job to poll email replies
└── logs/                  # Runtime logs (gitignored)
```

---

## 1. Email Configuration

### Server Settings (Namecheap Private Email)

| Setting | Value |
|---------|-------|
| **IMAP Server** | mail.privateemail.com |
| **IMAP Port** | 993 (SSL/TLS) |
| **SMTP Server** | mail.privateemail.com |
| **SMTP Port** | 465 (SSL/TLS) |
| **Username** | info@deboucheur.expert |
| **Password** | (encrypted in credentials.php) |

### How Email Works

1. **Outgoing (Notifications):**
   - Uses SMTP with SSL on port 465
   - Sends to `info@deboucheur.expert` and `info@unclogged.me`
   - Subject includes `REPLY:{sessionId}` for easy response

2. **Incoming (Replies):**
   - Cron job polls IMAP every 5 minutes
   - Looks for unread emails with `REPLY:` in subject
   - Extracts session ID and stores reply in database

### Cron Job Setup

Add this to cPanel → Cron Jobs:

```bash
*/5 * * * * php /home/YOUR_USER/public_html/api/cron-email-replies.php >> /home/YOUR_USER/public_html/api/logs/email-cron.log 2>&1
```

---

## 2. SMS Configuration (Twilio)

### Required Twilio Credentials

Set these as environment variables on your server:

```bash
export TWILIO_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_TOKEN="your_auth_token_here"
export TWILIO_FROM="+1234567890"  # Your Twilio phone number
```

Or add them encrypted to `credentials.php`.

### Twilio Console Setup

1. **Buy a Phone Number** in Twilio Console
2. **Configure Webhooks:**
   
   Go to: Phone Numbers → Manage → Active Numbers → Your Number

   | Setting | Value |
   |---------|-------|
   | A MESSAGE COMES IN | `https://deboucheur.expert/api/sms-webhook.php` |
   | HTTP Method | POST |
   | STATUS CALLBACK URL | `https://deboucheur.expert/api/sms-status.php` |

### How SMS Works

1. **Outgoing (Notifications):**
   - Sends to owner's phone (+14385302343)
   - Includes session ID and reply instructions
   - Format: `REPLY:{sessionId} Your message`

2. **Incoming (Replies):**
   - Twilio POSTs to `sms-webhook.php`
   - Owner texts: `REPLY:abc123 Oui, je peux venir demain`
   - Or: `LAST Je vous rappelle bientôt` (replies to last session)

### SMS Reply Formats

| Format | Example |
|--------|---------|
| Full | `REPLY:abc123def Message here` |
| Short | `R:abc123def Message here` |
| Last session | `LAST Your message here` |

---

## 3. Security - Encrypted Credentials

Passwords and API keys are encrypted using Fernet (AES-128-CBC + HMAC-SHA256).

### Encryption Key

The key is stored in `credentials.php`:
```php
private static string $key = 'Z4EHd01ACF3Oj3ivOJtxSqtnn_f_o9Fg4AY4c_We73M=';
```

### Encrypting New Secrets

Use the Python script to encrypt:

```python
from cryptography.fernet import Fernet

key = b"Z4EHd01ACF3Oj3ivOJtxSqtnn_f_o9Fg4AY4c_We73M="
f = Fernet(key)

# Encrypt a password
secret = b"your_secret_here"
encrypted = f.encrypt(secret)
print(encrypted.decode())
```

Or use PHP:
```php
require 'credentials.php';
$encrypted = SecureCredentials::encrypt('your_secret');
echo $encrypted;
```

### Adding Encrypted Tokens

Add to `credentials.php`:
```php
private static array $encryptedTokens = [
    'email_password' => 'gAAAAABp...existing...',
    'gemini_api_key' => 'gAAAAABp...new_token...',
    'twilio_auth_token' => 'gAAAAABp...new_token...',
];
```

---

## 4. Database Tables

The chat system uses the `chat_conversations` table:

```sql
CREATE TABLE chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    role ENUM('user', 'assistant', 'owner') NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(512),
    page_url VARCHAR(512),
    forwarded_sms TINYINT(1) DEFAULT 0,
    forwarded_email TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
);
```

---

## 5. Testing

### Test Email Sending

```bash
curl -X POST https://deboucheur.expert/api/chat-forward.php \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "userMessage": "Test message from client",
    "aiResponse": "Test AI response",
    "pageUrl": "https://deboucheur.expert/"
  }'
```

### Test SMS Reply

```bash
curl -X POST https://deboucheur.expert/api/sms-webhook.php \
  -d "From=+14385302343&Body=REPLY:test123 Test reply&MessageSid=test"
```

### Test Email Reply

```bash
curl -X POST https://deboucheur.expert/api/chat-reply.php \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "message": "Test reply from owner",
    "fromEmail": "info@deboucheur.expert"
  }'
```

---

## 6. File Permissions

```bash
chmod 600 api/credentials.php  # Restrict access to credentials
chmod 755 api/logs/            # Writable for logs
chmod 644 api/*.php            # Readable PHP files
```

---

## 7. Troubleshooting

### Check Logs

```bash
tail -f api/logs/sms-webhook.log
tail -f api/logs/email-cron.log
tail -f api/logs/sms-status.log
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Email not sending | Check SMTP credentials, verify port 465 not blocked |
| SMS not received | Verify Twilio credentials, check webhook URL |
| Replies not stored | Check database connection, verify session ID exists |
| Decryption failed | Verify key matches, check token format |

---

## 8. Response Times

| Channel | Expected Response |
|---------|-------------------|
| SMS | 0-12 hours |
| Email | 12-24 hours |
| Voicemail | 24-48 hours |

---

## Contact

- **Primary Phone:** (438) 530-2343
- **Secondary Phone:** (438) 765-7040
- **Email FR:** info@deboucheur.expert
- **Email EN:** info@unclogged.me
