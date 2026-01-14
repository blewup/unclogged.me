-- ============================================================================
-- Déboucheur Expert Database Setup Script
-- For Namecheap cPanel MySQL (Compatible with phpMyAdmin)
-- ============================================================================
-- Run this script to create all required tables in your databases:
-- deboucheur_prod, deboucheur_test, deboucheur_dev
-- User: deboucheur_shurukn | Password: Christina4032
-- ============================================================================

-- Create databases (if running with root privileges on cPanel)
-- Note: On Namecheap, databases are prefixed with your username
-- CREATE DATABASE IF NOT EXISTS deboucheur_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE DATABASE IF NOT EXISTS deboucheur_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE DATABASE IF NOT EXISTS deboucheur_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- CONTACTS TABLE - Stores contact form submissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(100) NOT NULL COMMENT 'First name',
    lname VARCHAR(100) NOT NULL COMMENT 'Last name',
    email VARCHAR(255) NOT NULL COMMENT 'Email address',
    phone VARCHAR(50) DEFAULT NULL COMMENT 'Phone number',
    message TEXT NOT NULL COMMENT 'Message content',
    attachment_path VARCHAR(255) DEFAULT NULL COMMENT 'Path to uploaded file',
    lang VARCHAR(10) DEFAULT 'fr' COMMENT 'Preferred language (fr/en)',
    ip VARCHAR(45) NOT NULL COMMENT 'Client IP address (IPv4/IPv6)',
    user_agent VARCHAR(512) DEFAULT NULL COMMENT 'Browser user agent',
    referrer VARCHAR(512) DEFAULT NULL COMMENT 'HTTP referrer',
    status ENUM('new', 'read', 'replied', 'archived', 'spam') DEFAULT 'new' COMMENT 'Contact status',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT 'Priority level',
    assigned_to VARCHAR(100) DEFAULT NULL COMMENT 'Staff member assigned',
    notes TEXT DEFAULT NULL COMMENT 'Internal notes',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISITORS TABLE - Comprehensive visitor tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL COMMENT 'Unique session identifier',
    ip VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    user_agent VARCHAR(512) DEFAULT NULL COMMENT 'Full user agent string',
    browser VARCHAR(50) DEFAULT NULL COMMENT 'Browser name',
    browser_version VARCHAR(20) DEFAULT NULL COMMENT 'Browser version',
    os VARCHAR(50) DEFAULT NULL COMMENT 'Operating system',
    os_version VARCHAR(20) DEFAULT NULL COMMENT 'OS version',
    device_type ENUM('desktop', 'tablet', 'mobile', 'bot', 'unknown') DEFAULT 'unknown',
    screen_width INT DEFAULT NULL COMMENT 'Screen width in pixels',
    screen_height INT DEFAULT NULL COMMENT 'Screen height in pixels',
    viewport_width INT DEFAULT NULL COMMENT 'Viewport width',
    viewport_height INT DEFAULT NULL COMMENT 'Viewport height',
    color_depth INT DEFAULT NULL COMMENT 'Screen color depth',
    pixel_ratio DECIMAL(4,2) DEFAULT NULL COMMENT 'Device pixel ratio',
    timezone VARCHAR(100) DEFAULT NULL COMMENT 'User timezone',
    timezone_offset INT DEFAULT NULL COMMENT 'Timezone offset in minutes',
    language VARCHAR(20) DEFAULT NULL COMMENT 'Browser language',
    languages VARCHAR(255) DEFAULT NULL COMMENT 'All accepted languages',
    theme VARCHAR(20) DEFAULT NULL COMMENT 'Light/dark theme preference',
    cookies_enabled TINYINT(1) DEFAULT 1 COMMENT 'Cookies enabled',
    js_enabled TINYINT(1) DEFAULT 1 COMMENT 'JavaScript enabled',
    do_not_track TINYINT(1) DEFAULT 0 COMMENT 'DNT header present',
    referrer VARCHAR(512) DEFAULT NULL COMMENT 'HTTP referrer',
    referrer_domain VARCHAR(255) DEFAULT NULL COMMENT 'Referrer domain only',
    utm_source VARCHAR(100) DEFAULT NULL COMMENT 'UTM source',
    utm_medium VARCHAR(100) DEFAULT NULL COMMENT 'UTM medium',
    utm_campaign VARCHAR(100) DEFAULT NULL COMMENT 'UTM campaign',
    utm_term VARCHAR(100) DEFAULT NULL COMMENT 'UTM term',
    utm_content VARCHAR(100) DEFAULT NULL COMMENT 'UTM content',
    landing_page VARCHAR(512) DEFAULT NULL COMMENT 'First page visited',
    country VARCHAR(100) DEFAULT NULL COMMENT 'Geo: Country',
    region VARCHAR(100) DEFAULT NULL COMMENT 'Geo: Region/Province',
    city VARCHAR(100) DEFAULT NULL COMMENT 'Geo: City',
    postal_code VARCHAR(20) DEFAULT NULL COMMENT 'Geo: Postal code',
    latitude DECIMAL(10,8) DEFAULT NULL COMMENT 'Geo: Latitude',
    longitude DECIMAL(11,8) DEFAULT NULL COMMENT 'Geo: Longitude',
    isp VARCHAR(255) DEFAULT NULL COMMENT 'Internet Service Provider',
    connection_type VARCHAR(50) DEFAULT NULL COMMENT 'Connection type',
    consent_given TINYINT(1) DEFAULT 0 COMMENT 'GDPR consent given',
    consent_timestamp DATETIME DEFAULT NULL COMMENT 'When consent was given',
    first_visit DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_visit DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    visit_count INT DEFAULT 1 COMMENT 'Total visits',
    total_time_spent INT DEFAULT 0 COMMENT 'Total time in seconds',
    INDEX idx_session (session_id),
    INDEX idx_ip (ip),
    INDEX idx_device (device_type),
    INDEX idx_country (country),
    INDEX idx_first_visit (first_visit),
    INDEX idx_consent (consent_given)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PAGE_VIEWS TABLE - Track individual page visits
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL COMMENT 'Reference to visitors table',
    session_id VARCHAR(128) NOT NULL COMMENT 'Session identifier',
    page_url VARCHAR(512) NOT NULL COMMENT 'Full page URL',
    page_path VARCHAR(255) NOT NULL COMMENT 'URL path only',
    page_title VARCHAR(255) DEFAULT NULL COMMENT 'Page title',
    query_string VARCHAR(512) DEFAULT NULL COMMENT 'URL query parameters',
    hash VARCHAR(100) DEFAULT NULL COMMENT 'URL hash/anchor',
    referrer_url VARCHAR(512) DEFAULT NULL COMMENT 'Previous page URL',
    time_on_page INT DEFAULT NULL COMMENT 'Time spent in seconds',
    scroll_depth INT DEFAULT NULL COMMENT 'Max scroll depth percentage',
    exit_page TINYINT(1) DEFAULT 0 COMMENT 'Was this the exit page',
    bounce TINYINT(1) DEFAULT 0 COMMENT 'Single page visit',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_session (session_id),
    INDEX idx_page (page_path),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- EVENTS TABLE - Track user interactions and events
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL COMMENT 'Reference to visitors table',
    session_id VARCHAR(128) NOT NULL COMMENT 'Session identifier',
    event_type VARCHAR(50) NOT NULL COMMENT 'Event type (click, scroll, submit, etc.)',
    event_category VARCHAR(100) DEFAULT NULL COMMENT 'Event category',
    event_action VARCHAR(100) DEFAULT NULL COMMENT 'Event action',
    event_label VARCHAR(255) DEFAULT NULL COMMENT 'Event label',
    event_value DECIMAL(10,2) DEFAULT NULL COMMENT 'Event numeric value',
    element_id VARCHAR(100) DEFAULT NULL COMMENT 'DOM element ID',
    element_class VARCHAR(255) DEFAULT NULL COMMENT 'DOM element classes',
    element_tag VARCHAR(50) DEFAULT NULL COMMENT 'DOM element tag',
    element_text VARCHAR(255) DEFAULT NULL COMMENT 'Element text content',
    page_url VARCHAR(512) DEFAULT NULL COMMENT 'Page where event occurred',
    position_x INT DEFAULT NULL COMMENT 'Click X position',
    position_y INT DEFAULT NULL COMMENT 'Click Y position',
    metadata JSON DEFAULT NULL COMMENT 'Additional event data',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_session (session_id),
    INDEX idx_type (event_type),
    INDEX idx_category (event_category),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CONSENTS TABLE - GDPR/Privacy consent tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS consents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL COMMENT 'Reference to visitors table',
    session_id VARCHAR(128) NOT NULL COMMENT 'Session identifier',
    ip VARCHAR(45) NOT NULL COMMENT 'Client IP at consent time',
    user_agent VARCHAR(512) DEFAULT NULL COMMENT 'User agent at consent time',
    consent_type ENUM('cookies', 'analytics', 'marketing', 'all') NOT NULL,
    consent_given TINYINT(1) NOT NULL DEFAULT 0,
    consent_text TEXT DEFAULT NULL COMMENT 'Exact text shown to user',
    consent_version VARCHAR(20) DEFAULT '1.0' COMMENT 'Privacy policy version',
    withdrawal_date DATETIME DEFAULT NULL COMMENT 'When consent was withdrawn',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_session (session_id),
    INDEX idx_type (consent_type),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FORM_SUBMISSIONS TABLE - Track all form interactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS form_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL COMMENT 'Reference to visitors table',
    session_id VARCHAR(128) NOT NULL,
    form_id VARCHAR(100) DEFAULT NULL COMMENT 'Form identifier',
    form_name VARCHAR(100) DEFAULT NULL COMMENT 'Form name',
    page_url VARCHAR(512) DEFAULT NULL COMMENT 'Page with form',
    fields_filled INT DEFAULT 0 COMMENT 'Number of fields filled',
    fields_total INT DEFAULT 0 COMMENT 'Total fields in form',
    time_to_complete INT DEFAULT NULL COMMENT 'Seconds to complete form',
    submission_success TINYINT(1) DEFAULT 0 COMMENT 'Form submitted successfully',
    error_message VARCHAR(512) DEFAULT NULL COMMENT 'Error if submission failed',
    field_data JSON DEFAULT NULL COMMENT 'Non-sensitive field data',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_form (form_id),
    INDEX idx_success (submission_success),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHAT_SESSIONS TABLE - AI chatbot interactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL COMMENT 'Reference to visitors table',
    session_id VARCHAR(128) NOT NULL,
    chat_started DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chat_ended DATETIME DEFAULT NULL,
    messages_count INT DEFAULT 0 COMMENT 'Total messages in session',
    images_uploaded INT DEFAULT 0 COMMENT 'Images sent for analysis',
    lead_qualified TINYINT(1) DEFAULT 0 COMMENT 'Identified as potential lead',
    issue_category VARCHAR(100) DEFAULT NULL COMMENT 'Plumbing issue category',
    urgency_level ENUM('low', 'medium', 'high', 'emergency') DEFAULT NULL,
    callback_requested TINYINT(1) DEFAULT 0,
    INDEX idx_visitor (visitor_id),
    INDEX idx_session (session_id),
    INDEX idx_started (chat_started),
    INDEX idx_qualified (lead_qualified),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CHAT_MESSAGES TABLE - Individual chat messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_session_id INT NOT NULL COMMENT 'Reference to chat_sessions',
    sender ENUM('user', 'ai') NOT NULL COMMENT 'Message sender',
    message_type ENUM('text', 'image', 'system') DEFAULT 'text',
    content TEXT DEFAULT NULL COMMENT 'Message content',
    image_path VARCHAR(255) DEFAULT NULL COMMENT 'Path to uploaded image',
    ai_analysis TEXT DEFAULT NULL COMMENT 'AI image analysis result',
    tokens_used INT DEFAULT 0 COMMENT 'API tokens consumed',
    response_time_ms INT DEFAULT NULL COMMENT 'AI response time',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (chat_session_id),
    INDEX idx_sender (sender),
    INDEX idx_created (created_at),
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ERROR_LOGS TABLE - Track client-side and server errors
-- ============================================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL,
    session_id VARCHAR(128) DEFAULT NULL,
    error_type VARCHAR(50) NOT NULL COMMENT 'Error type (js, php, http)',
    error_code VARCHAR(20) DEFAULT NULL COMMENT 'HTTP status or error code',
    error_message TEXT NOT NULL COMMENT 'Error message',
    error_stack TEXT DEFAULT NULL COMMENT 'Stack trace if available',
    page_url VARCHAR(512) DEFAULT NULL COMMENT 'Page where error occurred',
    file_name VARCHAR(255) DEFAULT NULL COMMENT 'File causing error',
    line_number INT DEFAULT NULL COMMENT 'Line number',
    column_number INT DEFAULT NULL COMMENT 'Column number',
    user_agent VARCHAR(512) DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'error',
    resolved TINYINT(1) DEFAULT 0 COMMENT 'Has error been addressed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (error_type),
    INDEX idx_code (error_code),
    INDEX idx_severity (severity),
    INDEX idx_resolved (resolved),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LEADS TABLE - Potential customers identified through behavior
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL COMMENT 'Reference to visitors table',
    contact_id INT DEFAULT NULL COMMENT 'Reference to contacts if form submitted',
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    name VARCHAR(200) DEFAULT NULL,
    source VARCHAR(100) DEFAULT NULL COMMENT 'Lead source',
    score INT DEFAULT 0 COMMENT 'Lead scoring (0-100)',
    status ENUM('new', 'contacted', 'qualified', 'proposal', 'won', 'lost') DEFAULT 'new',
    service_interest VARCHAR(255) DEFAULT NULL COMMENT 'Services interested in',
    estimated_value DECIMAL(10,2) DEFAULT NULL COMMENT 'Potential job value',
    location VARCHAR(255) DEFAULT NULL COMMENT 'Service location',
    urgency ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium',
    notes TEXT DEFAULT NULL COMMENT 'Lead notes',
    next_action VARCHAR(255) DEFAULT NULL COMMENT 'Next follow-up action',
    next_action_date DATE DEFAULT NULL COMMENT 'Follow-up date',
    converted_date DATETIME DEFAULT NULL COMMENT 'When lead became customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_contact (contact_id),
    INDEX idx_status (status),
    INDEX idx_score (score),
    INDEX idx_urgency (urgency),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- APPOINTMENTS TABLE - Scheduled service appointments
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT DEFAULT NULL COMMENT 'Reference to leads table',
    contact_id INT DEFAULT NULL COMMENT 'Reference to contacts table',
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(255) DEFAULT NULL,
    client_phone VARCHAR(50) NOT NULL,
    service_address TEXT NOT NULL,
    service_type VARCHAR(100) DEFAULT NULL COMMENT 'Type of service requested',
    description TEXT DEFAULT NULL COMMENT 'Problem description',
    preferred_date DATE NOT NULL,
    preferred_time_start TIME DEFAULT NULL,
    preferred_time_end TIME DEFAULT NULL,
    confirmed_date DATE DEFAULT NULL,
    confirmed_time TIME DEFAULT NULL,
    status ENUM('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
    estimated_duration INT DEFAULT 60 COMMENT 'Duration in minutes',
    estimated_cost DECIMAL(10,2) DEFAULT NULL,
    actual_cost DECIMAL(10,2) DEFAULT NULL,
    technician VARCHAR(100) DEFAULT NULL COMMENT 'Assigned technician',
    notes TEXT DEFAULT NULL,
    reminder_sent TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lead (lead_id),
    INDEX idx_contact (contact_id),
    INDEX idx_date (preferred_date),
    INDEX idx_status (status),
    INDEX idx_technician (technician),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PERFORMANCE_METRICS TABLE - Site performance tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT DEFAULT NULL,
    session_id VARCHAR(128) DEFAULT NULL,
    page_url VARCHAR(512) NOT NULL,
    dns_time INT DEFAULT NULL COMMENT 'DNS lookup time (ms)',
    connect_time INT DEFAULT NULL COMMENT 'Connection time (ms)',
    ttfb INT DEFAULT NULL COMMENT 'Time to first byte (ms)',
    dom_load_time INT DEFAULT NULL COMMENT 'DOM content loaded (ms)',
    page_load_time INT DEFAULT NULL COMMENT 'Full page load (ms)',
    first_paint INT DEFAULT NULL COMMENT 'First paint (ms)',
    first_contentful_paint INT DEFAULT NULL COMMENT 'FCP (ms)',
    largest_contentful_paint INT DEFAULT NULL COMMENT 'LCP (ms)',
    cumulative_layout_shift DECIMAL(6,4) DEFAULT NULL COMMENT 'CLS score',
    first_input_delay INT DEFAULT NULL COMMENT 'FID (ms)',
    time_to_interactive INT DEFAULT NULL COMMENT 'TTI (ms)',
    resource_count INT DEFAULT NULL COMMENT 'Number of resources loaded',
    transfer_size INT DEFAULT NULL COMMENT 'Total bytes transferred',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visitor (visitor_id),
    INDEX idx_page (page_url(255)),
    INDEX idx_created (created_at),
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SETTINGS TABLE - Application settings storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255) DEFAULT NULL,
    is_public TINYINT(1) DEFAULT 0 COMMENT 'Can be exposed to frontend',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Insert default settings
-- ============================================================================
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Déboucheur Expert', 'string', 'Site name', 1),
('site_url', 'https://unclogged.me', 'string', 'Primary site URL', 1),
('contact_email_fr', 'info@deboucheur.expert', 'string', 'French contact email', 1),
('contact_email_en', 'info@unclogged.me', 'string', 'English contact email', 1),
('phone_primary', '+15149722078', 'string', 'Primary phone number', 1),
('phone_secondary', '+14387657040', 'string', 'Secondary phone number', 1),
('address', '290 Rue Lord #01, Napierville, QC J0J 1L0, Canada', 'string', 'Business address', 1),
('business_hours', '{"weekday": "08:00-18:00", "weekend": "08:00-17:00"}', 'json', 'Business hours', 1),
('emergency_available', 'true', 'boolean', '24/7 emergency service available', 1),
('default_language', 'fr', 'string', 'Default site language', 1),
('analytics_enabled', 'true', 'boolean', 'Enable visitor analytics', 0),
('chat_enabled', 'true', 'boolean', 'Enable AI chat widget', 1),
('maintenance_mode', 'false', 'boolean', 'Site in maintenance mode', 0)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ============================================================================
-- Create views for common queries
-- ============================================================================

-- Daily visitor summary
CREATE OR REPLACE VIEW v_daily_visitors AS
SELECT 
    DATE(first_visit) as visit_date,
    COUNT(*) as total_visitors,
    SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile_visitors,
    SUM(CASE WHEN device_type = 'desktop' THEN 1 ELSE 0 END) as desktop_visitors,
    SUM(CASE WHEN consent_given = 1 THEN 1 ELSE 0 END) as consented_visitors,
    AVG(visit_count) as avg_visits_per_user
FROM visitors
GROUP BY DATE(first_visit)
ORDER BY visit_date DESC;

-- Lead conversion funnel
CREATE OR REPLACE VIEW v_lead_funnel AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(score) as avg_score,
    SUM(estimated_value) as total_potential_value
FROM leads
GROUP BY status;

-- Contact form summary
CREATE OR REPLACE VIEW v_contact_summary AS
SELECT 
    DATE(created_at) as submit_date,
    COUNT(*) as total_submissions,
    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied,
    SUM(CASE WHEN lang = 'fr' THEN 1 ELSE 0 END) as french,
    SUM(CASE WHEN lang = 'en' THEN 1 ELSE 0 END) as english
FROM contacts
GROUP BY DATE(created_at)
ORDER BY submit_date DESC;

-- ============================================================================
-- Grant permissions (run as root/admin if needed)
-- ============================================================================
-- GRANT ALL PRIVILEGES ON deboucheur_prod.* TO 'deboucheur_shurukn'@'localhost';
-- GRANT ALL PRIVILEGES ON deboucheur_test.* TO 'deboucheur_shurukn'@'localhost';
-- GRANT ALL PRIVILEGES ON deboucheur_dev.* TO 'deboucheur_shurukn'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- End of setup script
-- ============================================================================
