#!/bin/bash
# =============================================================================
# Déboucheur Expert - Post-Setup Deployment Script
# For Namecheap shared hosting
# =============================================================================
# 
# PREREQUISITES (already completed before running this script):
#   1. Project files already unzipped in /home/deboucheur/public_html/
#   2. Database tables created via setup.sql in phpMyAdmin
#   3. Script executed from: /home/deboucheur/public_html/
#
# USAGE:
#   cd /home/deboucheur/public_html && chmod +x script.sh && ./script.sh
#
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================
DEPLOY_DIR="/home/deboucheur/public_html"
LOG_DIR="/home/deboucheur/logs"
LOG_FILE="${LOG_DIR}/deploy_$(date '+%Y%m%d_%H%M%S').log"

# Service Worker cache version (auto-generated)
CACHE_VERSION="deboucheur-cache-v$(date '+%s')"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================
ensure_log_dir() {
    mkdir -p "$LOG_DIR" 2>/dev/null || true
}

log() {
    ensure_log_dir
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    ensure_log_dir
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    ensure_log_dir
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    ensure_log_dir
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    ensure_log_dir
    echo -e "${CYAN}[i]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${CYAN}[i]${NC} $1"
}

# =============================================================================
# BANNER
# =============================================================================
show_banner() {
    echo -e "${MAGENTA}"
    echo "╔═══════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                       ║"
    echo "║       🔧 DÉBOUCHEUR EXPERT - Post-Setup Deployment Script 🔧         ║"
    echo "║                                                                       ║"
    echo "║           unclogged.me  |  deboucheur.expert                          ║"
    echo "║                                                                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================
preflight_checks() {
    log "━━━ Pre-flight Checks ━━━"
    
    # Check current directory
    if [[ "$(pwd)" != "$DEPLOY_DIR" ]]; then
        warning "Not in $DEPLOY_DIR - changing directory"
        cd "$DEPLOY_DIR" || error "Cannot access $DEPLOY_DIR"
    fi
    success "Working directory: $(pwd)"
    
    # Check index.html exists (project already unzipped)
    if [ ! -f "index.html" ]; then
        error "index.html not found. Please unzip project files first."
    fi
    success "Project files detected"
    
    # Check PHP version
    if command -v php &> /dev/null; then
        PHP_VERSION=$(php -v 2>/dev/null | head -n 1 | cut -d ' ' -f 2 | cut -d '.' -f 1,2)
        info "PHP Version: $PHP_VERSION"
        
        # Check required PHP extensions
        REQUIRED_EXTENSIONS=("mysqli" "curl" "json" "mbstring" "fileinfo")
        for ext in "${REQUIRED_EXTENSIONS[@]}"; do
            if php -m 2>/dev/null | grep -qi "^$ext$"; then
                success "PHP extension: $ext"
            else
                warning "PHP extension missing: $ext"
            fi
        done
    else
        warning "PHP not found in PATH"
    fi
    
    echo ""
}

# =============================================================================
# UPDATE SERVICE WORKER CACHE
# =============================================================================
update_service_worker() {
    log "━━━ Updating Service Worker Cache ━━━"
    
    if [ -f "assets/scripts/service.js" ]; then
        # Update cache version with timestamp
        sed -i "s/const CACHE_NAME = '[^']*'/const CACHE_NAME = '$CACHE_VERSION'/" assets/scripts/service.js 2>/dev/null || \
        sed -i "s/deboucheur-cache/deboucheur-cache-v$(date '+%s')/" assets/scripts/service.js 2>/dev/null || true
        success "Service worker cache updated: $CACHE_VERSION"
    else
        warning "Service worker file not found"
    fi
    
    echo ""
}

# =============================================================================
# SET PERMISSIONS
# =============================================================================
set_permissions() {
    log "━━━ Setting Permissions ━━━"
    
    cd "$DEPLOY_DIR"
    
    # Set directory permissions to 755
    find . -type d -exec chmod 755 {} \; 2>/dev/null || true
    success "Directories: 755"
    
    # Set file permissions to 644
    find . -type f -exec chmod 644 {} \; 2>/dev/null || true
    success "Files: 644"
    
    # Make PHP files executable by web server (644 is correct for PHP)
    find . -name "*.php" -exec chmod 644 {} \; 2>/dev/null || true
    success "PHP files: 644"
    
    # Ensure upload directories are writable
    mkdir -p api/uploads api/logs api/conscent 2>/dev/null || true
    chmod 755 api/uploads api/logs api/conscent 2>/dev/null || true
    success "API directories: 755 (writable)"
    
    echo ""
}

# =============================================================================
# CLEAN DEVELOPMENT FILES
# =============================================================================
clean_dev_files() {
    log "━━━ Cleaning Development Files ━━━"
    
    cd "$DEPLOY_DIR"
    
    # Remove development/version control files if they exist
    rm -rf .git .github .gitignore .devcontainer .vscode 2>/dev/null || true
    rm -rf backup *.bak README.md LICENSE move.py 2>/dev/null || true
    
    success "Development files cleaned"
    
    echo ""
}

# =============================================================================
# CREATE/UPDATE .HTACCESS
# =============================================================================
create_htaccess() {
    log "━━━ Creating .htaccess ━━━"
    
    cat > "$DEPLOY_DIR/.htaccess" << 'HTACCESS'
# Déboucheur Expert - Apache Configuration
# Generated by deployment script

# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove www (optional - adjust if you prefer www)
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# Error Documents
ErrorDocument 400 /errors.html?code=400
ErrorDocument 401 /errors.html?code=401
ErrorDocument 403 /errors.html?code=403
ErrorDocument 404 /errors.html?code=404
ErrorDocument 408 /errors.html?code=408
ErrorDocument 410 /errors.html?code=410
ErrorDocument 429 /errors.html?code=429
ErrorDocument 500 /errors.html?code=500
ErrorDocument 502 /errors.html?code=502
ErrorDocument 503 /errors.html?code=503
ErrorDocument 504 /errors.html?code=504

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Remove PHP version header
    Header unset X-Powered-By
</IfModule>

# Protect sensitive files
<FilesMatch "^(credentials\.php|\.env|\.htpasswd|setup\.sql)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block access to backup/log directories
<IfModule mod_rewrite.c>
    RewriteRule ^api/logs/ - [F,L]
    RewriteRule ^api/conscent/ - [F,L]
    RewriteRule ^backup/ - [F,L]
</IfModule>

# Enable GZIP Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
    AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    
    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/avif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # Fonts
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/ttf "access plus 1 year"
    
    # HTML
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# CORS for API endpoints
<IfModule mod_headers.c>
    <FilesMatch "\.php$">
        SetEnvIf Origin "^https://(deboucheur\.expert|unclogged\.me)$" ORIGIN=$0
        Header set Access-Control-Allow-Origin %{ORIGIN}e env=ORIGIN
        Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    </FilesMatch>
</IfModule>

# Prevent directory listing
Options -Indexes

# Default charset
AddDefaultCharset UTF-8

# PHP Settings (if allowed by host)
<IfModule mod_php.c>
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 60
    php_value memory_limit 128M
</IfModule>
HTACCESS

    success ".htaccess created with security and caching rules"
    echo ""
}

# =============================================================================
# VERIFY DEPLOYMENT
# =============================================================================
verify_deployment() {
    log "━━━ Verifying Deployment ━━━"
    
    cd "$DEPLOY_DIR"
    
    # Check critical files
    CRITICAL_FILES=("index.html" "manifest.json" "api/contact.php" "api/db.php" "assets/scripts/main.js")
    ALL_OK=true
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            success "Found: $file"
        else
            warning "Missing: $file"
            ALL_OK=false
        fi
    done
    
    # Check directories
    CRITICAL_DIRS=("assets/images" "assets/scripts" "assets/styles" "pages" "api")
    
    for dir in "${CRITICAL_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            FILE_COUNT=$(find "$dir" -type f | wc -l)
            success "Directory: $dir ($FILE_COUNT files)"
        else
            warning "Missing directory: $dir"
            ALL_OK=false
        fi
    done
    
    # Final count
    TOTAL_FILES=$(find . -type f | wc -l)
    TOTAL_DIRS=$(find . -type d | wc -l)
    info "Total: $TOTAL_FILES files in $TOTAL_DIRS directories"
    
    if [ "$ALL_OK" = true ]; then
        success "All critical files verified"
    else
        warning "Some files are missing - check manually"
    fi
    
    echo ""
}

# =============================================================================
# POST-DEPLOYMENT CHECKLIST
# =============================================================================
show_checklist() {
    echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                     🎉 DEPLOYMENT COMPLETE! 🎉                       ║${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log "📅 Deployed: $(date)"
    echo ""
    
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    📋 REMAINING SETUP TASKS 📋                       ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}1. PHP VERSION (cPanel → Software → Select PHP Version)${NC}"
    echo "   └─ Select PHP 8.1+ (8.2 or 8.3 recommended)"
    echo "   └─ Required extensions: mysqli, curl, json, mbstring, fileinfo, imap"
    echo ""
    
    echo -e "${YELLOW}2. EMAIL PIPING (for SMS replies via email)${NC}"
    echo "   └─ cPanel → Email → Forwarders → Add Forwarder"
    echo "   └─ Address: reply@deboucheur.expert"
    echo "   └─ Destination: Pipe to /home/deboucheur/public_html/api/email-pipe.php"
    echo ""
    
    echo -e "${YELLOW}3. TWILIO WEBHOOK (for SMS)${NC}"
    echo "   └─ console.twilio.com → Phone Numbers → Your Number"
    echo "   └─ Messaging Webhook: https://deboucheur.expert/api/sms-webhook.php"
    echo ""
    
    echo -e "${YELLOW}4. VERIFY SITES${NC}"
    echo "   └─ 🇫🇷 French: https://deboucheur.expert"
    echo "   └─ 🇬🇧 English: https://unclogged.me"
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                      ✅ READY FOR PRODUCTION! ✅                     ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Test website if curl is available
    if command -v curl &> /dev/null; then
        log "🌐 Testing website accessibility..."
        
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://deboucheur.expert" 2>/dev/null || echo "000")
        if [ "$HTTP_STATUS" = "200" ]; then
            success "deboucheur.expert is online (HTTP $HTTP_STATUS)"
        elif [ "$HTTP_STATUS" = "000" ]; then
            info "Could not reach deboucheur.expert (check DNS/SSL)"
        else
            warning "deboucheur.expert returned HTTP $HTTP_STATUS"
        fi
        
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://unclogged.me" 2>/dev/null || echo "000")
        if [ "$HTTP_STATUS" = "200" ]; then
            success "unclogged.me is online (HTTP $HTTP_STATUS)"
        elif [ "$HTTP_STATUS" = "000" ]; then
            info "Could not reach unclogged.me (check DNS/SSL)"
        else
            warning "unclogged.me returned HTTP $HTTP_STATUS"
        fi
    fi
    
    echo ""
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    show_banner
    
    # Show help if requested
    if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        echo "Usage: ./script.sh"
        echo ""
        echo "Prerequisites:"
        echo "  1. Project files already unzipped in /home/deboucheur/public_html/"
        echo "  2. Database tables created via setup.sql in phpMyAdmin"
        echo ""
        echo "This script will:"
        echo "  - Update service worker cache version"
        echo "  - Set correct file permissions"
        echo "  - Clean development files"
        echo "  - Create optimized .htaccess"
        echo "  - Verify deployment integrity"
        exit 0
    fi
    
    # Run deployment steps
    preflight_checks
    update_service_worker
    set_permissions
    clean_dev_files
    create_htaccess
    verify_deployment
    show_checklist
    
    exit 0
}

# Run main function
main "$@"
