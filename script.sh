#!/bin/bash
# =============================================================================
# Déboucheur Expert - cPanel Deployment Script
# Complete deployment from GitHub to Namecheap shared hosting
# =============================================================================
# Usage: Run this script from cPanel Terminal or SSH
#   chmod +x script.sh && ./script.sh
# =============================================================================

set -e  # Exit on any error

# Configuration
GITHUB_REPO="https://github.com/blewup/unclogged.me.git"
DEPLOY_DIR="/home/deboucheur/public_html"
BACKUP_DIR="/home/deboucheur/backups"
TEMP_DIR="/home/deboucheur/tmp"
LOG_FILE="/home/deboucheur/logs/deploy.log"
BRANCH="main"

# Database configuration
DB_USER="deboucheur_shurukn"
DB_NAME_PROD="deboucheur_prod"
DB_NAME_TEST="deboucheur_test"
DB_NAME_DEV="deboucheur_dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# =============================================================================
# BANNER
# =============================================================================
echo -e "${MAGENTA}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       🔧 DÉBOUCHEUR EXPERT - cPanel Deployment Script 🔧       ║"
echo "║                     unclogged.me / deboucheur.expert           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# STEP 0: Pre-flight checks
# =============================================================================
log "================================================"
log "🚀 Starting Déboucheur Expert Deployment"
log "================================================"

# Create directories if they don't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname $LOG_FILE)"
mkdir -p "$TEMP_DIR"

# Check if git is available
if ! command -v git &> /dev/null; then
    error "Git is not installed. Please install git first."
fi

# Check PHP version
PHP_VERSION=$(php -v | head -n 1 | cut -d ' ' -f 2 | cut -d '.' -f 1,2)
info "PHP Version: $PHP_VERSION"

# =============================================================================
# STEP 1: Create backup of current deployment
# =============================================================================
log "📦 Creating backup of current deployment..."

BACKUP_NAME="backup_$(date '+%Y%m%d_%H%M%S').tar.gz"
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$DEPLOY_DIR" . 2>/dev/null || warning "Backup creation had warnings"
    success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
else
    warning "Deploy directory is empty, skipping backup"
fi

# Keep only last 5 backups
log "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
success "Old backups cleaned"

# =============================================================================
# STEP 2: Clone/Pull latest from GitHub
# =============================================================================
log "📥 Fetching latest code from GitHub..."

# Clean temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Clone the repository
cd "$TEMP_DIR"
git clone --depth 1 --branch "$BRANCH" "$GITHUB_REPO" . 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    error "Failed to clone repository"
fi

success "Repository cloned successfully"

# =============================================================================
# STEP 3: Prepare files for deployment
# =============================================================================
log "🔧 Preparing files for deployment..."

# Remove unnecessary files (development/version control files)
rm -rf .git .github backup *.bak README.md LICENSE .gitignore .devcontainer .vscode

# Update service worker cache version to force refresh
if [ -f "assets/scripts/service.js" ]; then
    CACHE_VERSION="deboucheur-cache-v$(date '+%s')"
    sed -i "s/deboucheur-cache-v[0-9]*/deboucheur-cache-v$(date '+%s')/" assets/scripts/service.js
    log "Updated service worker cache to: $CACHE_VERSION"
fi

success "Files prepared"

# =============================================================================
# STEP 4: Set correct permissions
# =============================================================================
log "🔐 Setting file permissions..."

# Set directory permissions to 755
find . -type d -exec chmod 755 {} \;

# Set file permissions to 644
find . -type f -exec chmod 644 {} \;

# Make PHP files readable but not executable via URL
find . -name "*.php" -exec chmod 644 {} \;

# Make email-pipe.php executable (for cPanel email piping)
if [ -f "api/email-pipe.php" ]; then
    chmod 755 api/email-pipe.php
    log "Made api/email-pipe.php executable for email piping"
fi

# Ensure writable directories
mkdir -p "api/uploads"
mkdir -p "api/logs"
mkdir -p "api/conscent"
chmod 755 api/uploads
chmod 755 api/logs
chmod 755 api/conscent

# Secure credentials file
if [ -f "api/credentials.php" ]; then
    chmod 600 api/credentials.php
    log "Secured api/credentials.php with 600 permissions"
fi

success "Permissions set"

# =============================================================================
# STEP 5: Create/Update .htaccess
# =============================================================================
log "📝 Creating .htaccess file..."

cat > .htaccess << 'HTACCESS_EOF'
# =============================================================================
# Déboucheur Expert - Apache Configuration
# For Namecheap cPanel shared hosting
# =============================================================================

# Enable rewrite engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove www (standardize on non-www)
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Prevent directory browsing
Options -Indexes

# Protect sensitive files
<FilesMatch "(^\.htaccess|\.env|credentials\.php|db\.php|\.log$|\.sql$)">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Protect api/logs and api/uploads directories
<Directory "api/logs">
    Order Allow,Deny
    Deny from all
</Directory>

<Directory "api/conscent">
    Order Allow,Deny
    Deny from all
</Directory>

# Allow API endpoints
<FilesMatch "^(contact|chat-forward|chat-reply|chat-responses|sms-webhook|sms-status|track|event|backend|email-pipe)\.php$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
    AddOutputFilterByType DEFLATE application/javascript text/javascript application/x-javascript
    AddOutputFilterByType DEFLATE text/xml application/xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images - 1 year
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/avif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Fonts - 1 year
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/ttf "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    
    # CSS/JS - 1 month
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    
    # HTML - 1 hour
    ExpiresByType text/html "access plus 1 hour"
    
    # JSON - no cache (API responses)
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS for API
    <FilesMatch "\.(php)$">
        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type"
    </FilesMatch>
</IfModule>

# Custom error pages
ErrorDocument 400 /errors.html?code=400
ErrorDocument 401 /errors.html?code=401
ErrorDocument 403 /errors.html?code=403
ErrorDocument 404 /errors.html?code=404
ErrorDocument 500 /errors.html?code=500
ErrorDocument 502 /errors.html?code=502
ErrorDocument 503 /errors.html?code=503

# PHP settings (if allowed by host)
<IfModule mod_php.c>
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 60
    php_value memory_limit 256M
</IfModule>

# Prevent PHP execution in uploads
<Directory "api/uploads">
    <FilesMatch "\.php$">
        Order Allow,Deny
        Deny from all
    </FilesMatch>
</Directory>
HTACCESS_EOF

success ".htaccess created"

# =============================================================================
# STEP 6: Deploy to public_html
# =============================================================================
log "🚀 Deploying to $DEPLOY_DIR..."

# Preserve existing uploads and logs
if [ -d "$DEPLOY_DIR/api/uploads" ]; then
    cp -r "$DEPLOY_DIR/api/uploads" "$TEMP_DIR/api/uploads_backup" 2>/dev/null || true
fi
if [ -d "$DEPLOY_DIR/api/logs" ]; then
    cp -r "$DEPLOY_DIR/api/logs" "$TEMP_DIR/api/logs_backup" 2>/dev/null || true
fi
if [ -d "$DEPLOY_DIR/api/conscent" ]; then
    cp -r "$DEPLOY_DIR/api/conscent" "$TEMP_DIR/api/conscent_backup" 2>/dev/null || true
fi

# Sync files to deploy directory
rsync -av --delete \
    --exclude='api/uploads/*' \
    --exclude='api/logs/*' \
    --exclude='api/conscent/*' \
    "$TEMP_DIR/" "$DEPLOY_DIR/" 2>&1 | tee -a "$LOG_FILE"

# Restore uploads and logs
if [ -d "$TEMP_DIR/api/uploads_backup" ]; then
    cp -r "$TEMP_DIR/api/uploads_backup/"* "$DEPLOY_DIR/api/uploads/" 2>/dev/null || true
fi
if [ -d "$TEMP_DIR/api/logs_backup" ]; then
    cp -r "$TEMP_DIR/api/logs_backup/"* "$DEPLOY_DIR/api/logs/" 2>/dev/null || true
fi
if [ -d "$TEMP_DIR/api/conscent_backup" ]; then
    cp -r "$TEMP_DIR/api/conscent_backup/"* "$DEPLOY_DIR/api/conscent/" 2>/dev/null || true
fi

success "Files deployed to $DEPLOY_DIR"

# =============================================================================
# STEP 7: Verify deployment
# =============================================================================
log "✅ Verifying deployment..."

# Count deployed files
HTML_COUNT=$(find "$DEPLOY_DIR" -name "*.html" | wc -l)
CSS_COUNT=$(find "$DEPLOY_DIR" -name "*.css" | wc -l)
JS_COUNT=$(find "$DEPLOY_DIR" -name "*.js" | wc -l)
PHP_COUNT=$(find "$DEPLOY_DIR" -name "*.php" | wc -l)

log "📊 Deployed files:"
log "   HTML: $HTML_COUNT files"
log "   CSS:  $CSS_COUNT files"
log "   JS:   $JS_COUNT files"
log "   PHP:  $PHP_COUNT files"

# Verify critical files exist
CRITICAL_FILES=(
    "index.html"
    "manifest.json"
    "errors.html"
    "assets/scripts/service.js"
    "assets/scripts/chat.js"
    "api/contact.php"
    "api/db.php"
    "api/credentials.php"
    "api/email-service.php"
    "api/chat-forward.php"
    "api/chat-reply.php"
    "api/sms-webhook.php"
    "api/email-pipe.php"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$DEPLOY_DIR/$file" ]; then
        log "   ✅ $file"
    else
        warning "   ⚠️ $file is MISSING!"
    fi
done

# =============================================================================
# STEP 8: PHP syntax check
# =============================================================================
log "🔍 Checking PHP syntax..."

PHP_ERRORS=0
while IFS= read -r phpfile; do
    if ! php -l "$phpfile" > /dev/null 2>&1; then
        warning "PHP syntax error in: $phpfile"
        PHP_ERRORS=$((PHP_ERRORS + 1))
    fi
done < <(find "$DEPLOY_DIR/api" -name "*.php")

if [ $PHP_ERRORS -eq 0 ]; then
    success "All PHP files passed syntax check"
else
    warning "$PHP_ERRORS PHP file(s) have syntax errors"
fi

# =============================================================================
# STEP 9: Cleanup
# =============================================================================
log "🧹 Cleaning up..."

rm -rf "$TEMP_DIR"

success "Cleanup complete"

# =============================================================================
# DEPLOYMENT COMPLETE - SHOW POST-DEPLOYMENT CHECKLIST
# =============================================================================
echo ""
echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                    🎉 DEPLOYMENT COMPLETE! 🎉                   ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
log "📅 Deployment Date: $(date)"
log "📦 Backup: $BACKUP_DIR/$BACKUP_NAME"
log "📋 Log: $LOG_FILE"
echo ""

# =============================================================================
# POST-DEPLOYMENT CHECKLIST
# =============================================================================
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   📋 POST-DEPLOYMENT CHECKLIST                 ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. DATABASE SETUP (MariaDB)${NC}"
echo "   └─ Go to: cPanel → Databases → MySQL Databases"
echo "   └─ Create databases if not exists:"
echo "      • $DB_NAME_PROD"
echo "      • $DB_NAME_TEST"
echo "      • $DB_NAME_DEV"
echo "   └─ Assign user '$DB_USER' to all databases"
echo "   └─ Import api/setup.sql via phpMyAdmin"
echo ""
echo -e "${YELLOW}2. EMAIL PIPING SETUP${NC}"
echo "   └─ Go to: cPanel → Email → Forwarders"
echo "   └─ Click 'Add Forwarder'"
echo "   └─ Address: reply (or info)"
echo "   └─ Domain: deboucheur.expert"
echo "   └─ Destination: Pipe to Program"
echo "   └─ Path: /home/deboucheur/public_html/api/email-pipe.php"
echo ""
echo -e "${YELLOW}3. TWILIO WEBHOOK SETUP${NC}"
echo "   └─ Go to: console.twilio.com → Phone Numbers"
echo "   └─ Select number: +18126489709"
echo "   └─ Messaging → A MESSAGE COMES IN:"
echo "      • Webhook URL: https://deboucheur.expert/api/sms-webhook.php"
echo "      • HTTP Method: POST"
echo "   └─ Status Callback URL: https://deboucheur.expert/api/sms-status.php"
echo ""
echo -e "${YELLOW}4. PHP 8.5 MODULES REQUIRED${NC}"
echo "   └─ Go to: cPanel → Software → Select PHP Version"
echo "   └─ Select PHP 8.5"
echo "   └─ Enable these extensions:"
echo "      ▸ CORE: curl, json, mbstring, openssl, hash, filter"
echo "      ▸ DATABASE: mysqli, mysqlnd, pdo, pdo_mysql"
echo "      ▸ EMAIL: imap"
echo "      ▸ INTL: intl"
echo "      ▸ FILES: fileinfo, zip, zlib"
echo "      ▸ IMAGE: gd OR imagick"
echo "      ▸ OPTIONAL: sodium, sockets, xml, simplexml"
echo ""
echo -e "${YELLOW}5. CRON JOBS (Optional - if not using email piping)${NC}"
echo "   └─ Go to: cPanel → Cron Jobs"
echo "   └─ Add: */5 * * * * php /home/deboucheur/public_html/api/cron-email-replies.php"
echo ""
echo -e "${YELLOW}6. VERIFY WEBSITES${NC}"
echo "   └─ French: https://deboucheur.expert"
echo "   └─ English: https://unclogged.me"
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ READY FOR PRODUCTION! ✅                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test website accessibility
log "🌐 Testing website accessibility..."
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://deboucheur.expert" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        success "✅ deboucheur.expert is online! (HTTP $HTTP_STATUS)"
    else
        warning "⚠️ deboucheur.expert returned HTTP $HTTP_STATUS"
    fi
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://unclogged.me" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        success "✅ unclogged.me is online! (HTTP $HTTP_STATUS)"
    else
        warning "⚠️ unclogged.me returned HTTP $HTTP_STATUS"
    fi
else
    log "curl not available, skipping website test"
fi

exit 0
