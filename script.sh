#!/bin/bash
# =============================================================================
# Déboucheur Expert - Complete cPanel Deployment Script
# For Namecheap shared hosting - ZIP extraction + full setup
# =============================================================================
# 
# USAGE OPTIONS:
#   Option 1: Upload this script + site.zip to public_html, then run:
#             chmod +x script.sh && ./script.sh
#
#   Option 2: Clone from GitHub (if git is available):
#             chmod +x script.sh && ./script.sh --git
#
#   Option 3: Extract existing ZIP file:
#             chmod +x script.sh && ./script.sh --zip site.zip
#
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}"
BACKUP_DIR="/home/deboucheur/backups"
LOG_DIR="/home/deboucheur/logs"
TEMP_DIR="/home/deboucheur/tmp_deploy"
LOG_FILE="${LOG_DIR}/deploy_$(date '+%Y%m%d_%H%M%S').log"

# GitHub configuration (for --git mode)
GITHUB_REPO="https://github.com/blewup/unclogged.me.git"
BRANCH="main"

# Database configuration
DB_USER="deboucheur_shurukn"
DB_NAME_PROD="deboucheur_prod"
DB_NAME_TEST="deboucheur_test"
DB_NAME_DEV="deboucheur_dev"

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
    mkdir -p "$BACKUP_DIR" 2>/dev/null || true
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
    echo "║       🔧 DÉBOUCHEUR EXPERT - Complete Deployment Script 🔧            ║"
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
    info "Script location: $SCRIPT_DIR"
    info "Deploy target: $DEPLOY_DIR"
    
    # Check if we're likely in public_html
    if [[ "$DEPLOY_DIR" == *"public_html"* ]]; then
        success "Running from public_html directory"
    else
        warning "Not in public_html - files will deploy to: $DEPLOY_DIR"
    fi
    
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
    
    # Check for unzip utility
    if command -v unzip &> /dev/null; then
        success "unzip utility available"
    else
        warning "unzip not available - ZIP extraction may fail"
    fi
    
    echo ""
}

# =============================================================================
# BACKUP EXISTING DEPLOYMENT
# =============================================================================
create_backup() {
    log "━━━ Creating Backup ━━━"
    
    mkdir -p "$BACKUP_DIR" 2>/dev/null || true
    
    BACKUP_NAME="backup_$(date '+%Y%m%d_%H%M%S').tar.gz"
    
    # Check if there are files to backup
    if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR 2>/dev/null | grep -v '^script.sh$' | grep -v '\.zip$' | head -1)" ]; then
        cd "$DEPLOY_DIR"
        
        # Create backup excluding the script itself and any zip files
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
            --exclude='*.zip' \
            --exclude='script.sh' \
            --exclude='backup*' \
            --exclude='*.tar.gz' \
            . 2>/dev/null || warning "Backup had warnings"
        
        success "Backup created: $BACKUP_NAME"
        
        # Show backup size
        if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
            info "Backup size: $BACKUP_SIZE"
        fi
    else
        info "No existing files to backup"
    fi
    
    # Keep only last 5 backups
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f 2>/dev/null || true
        success "Old backups cleaned (keeping last 5)"
    fi
    
    echo ""
}

# =============================================================================
# EXTRACT ZIP FILE
# =============================================================================
extract_zip() {
    local ZIP_FILE="$1"
    
    log "━━━ Extracting ZIP Archive ━━━"
    
    if [ -z "$ZIP_FILE" ]; then
        # Find ZIP file in current directory
        ZIP_FILE=$(ls -t *.zip 2>/dev/null | head -1)
    fi
    
    if [ -z "$ZIP_FILE" ] || [ ! -f "$ZIP_FILE" ]; then
        error "No ZIP file found. Please upload your site.zip file."
    fi
    
    info "ZIP file: $ZIP_FILE"
    info "Extracting to: $DEPLOY_DIR"
    
    # Create temp directory for extraction
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    mkdir -p "$TEMP_DIR"
    
    # Extract ZIP
    cd "$TEMP_DIR"
    unzip -o "$DEPLOY_DIR/$ZIP_FILE" -d "$TEMP_DIR" 2>&1 | tail -5
    
    # Check if files are in a subdirectory (common with GitHub downloads)
    EXTRACTED_DIR=$(ls -d */ 2>/dev/null | head -1)
    if [ -n "$EXTRACTED_DIR" ] && [ -f "${EXTRACTED_DIR}index.html" ]; then
        info "Files in subdirectory: $EXTRACTED_DIR"
        mv "$TEMP_DIR/${EXTRACTED_DIR}"* "$TEMP_DIR/" 2>/dev/null || true
        rmdir "$TEMP_DIR/${EXTRACTED_DIR}" 2>/dev/null || true
    fi
    
    success "ZIP extracted successfully"
    
    # Count extracted files
    FILE_COUNT=$(find "$TEMP_DIR" -type f | wc -l)
    info "Extracted $FILE_COUNT files"
    
    echo ""
}

# =============================================================================
# CLONE FROM GITHUB
# =============================================================================
clone_github() {
    log "━━━ Cloning from GitHub ━━━"
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Use ZIP extraction instead."
    fi
    
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    mkdir -p "$TEMP_DIR"
    
    cd "$TEMP_DIR"
    git clone --depth 1 --branch "$BRANCH" "$GITHUB_REPO" . 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        error "Failed to clone repository"
    fi
    
    success "Repository cloned successfully"
    echo ""
}

# =============================================================================
# PREPARE FILES
# =============================================================================
prepare_files() {
    log "━━━ Preparing Files ━━━"
    
    cd "$TEMP_DIR"
    
    # Remove development/version control files
    rm -rf .git .github .gitignore .devcontainer .vscode 2>/dev/null || true
    rm -rf backup *.bak README.md LICENSE move.py 2>/dev/null || true
    rm -f script.sh 2>/dev/null || true  # Remove script from extracted files
    
    # Update service worker cache version
    if [ -f "assets/scripts/service.js" ]; then
        sed -i "s/const CACHE_NAME = '[^']*'/const CACHE_NAME = '$CACHE_VERSION'/" assets/scripts/service.js 2>/dev/null || \
        sed -i "s/deboucheur-cache-v[0-9]*/deboucheur-cache-v$(date '+%s')/" assets/scripts/service.js 2>/dev/null || true
        success "Service worker cache updated: $CACHE_VERSION"
    fi
    
    # Ensure required directories exist
    mkdir -p api/uploads api/logs api/conscent 2>/dev/null || true
    
    success "Files prepared"
    echo ""
}

# =============================================================================
# SET PERMISSIONS
# =============================================================================
set_permissions() {
    log "━━━ Setting Permissions ━━━"
    
    cd "$TEMP_DIR"
    
    # Set directory permissions to 755
    find . -type d -exec chmod 755 {} \; 2>/dev/null || true
    success "Directories: 755"
    
    # Set file permissions to 644
    find . -type f -exec chmod 644 {} \; 2>/dev/null || true
    success "Files: 644"
    
    # Make email-pipe.php executable (required for cPanel email piping)
    if [ -f "api/email-pipe.php" ]; then
        chmod 755 api/email-pipe.php
        success "api/email-pipe.php: 755 (executable)"
    fi
    
    # Secure credentials file
    if [ -f "api/credentials.php" ]; then
        chmod 600 api/credentials.php
        success "api/credentials.php: 600 (owner only)"
    fi
    
    # Ensure writable directories
    chmod 755 api/uploads api/logs api/conscent 2>/dev/null || true
    success "Writable directories configured"
    
    echo ""
}

# =============================================================================
# CREATE .HTACCESS
# =============================================================================
create_htaccess() {
    log "━━━ Creating .htaccess ━━━"
    
    cd "$TEMP_DIR"
    
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
<FilesMatch "(^\.htaccess|\.env|credentials\.php|\.log$|\.sql$)">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
    AddOutputFilterByType DEFLATE application/javascript text/javascript
    AddOutputFilterByType DEFLATE text/xml application/xml image/svg+xml
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
    
    # CSS/JS - 1 month
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # HTML - 1 hour (allows quick updates)
    ExpiresByType text/html "access plus 1 hour"
    
    # JSON - no cache (API responses should be fresh)
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS for API endpoints
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

# Protect logs directory
<Directory "api/logs">
    Order Allow,Deny
    Deny from all
</Directory>

<Directory "api/conscent">
    Order Allow,Deny
    Deny from all
</Directory>
HTACCESS_EOF

    success ".htaccess created with full configuration"
    echo ""
}

# =============================================================================
# DEPLOY FILES
# =============================================================================
deploy_files() {
    log "━━━ Deploying Files ━━━"
    
    # Preserve existing user data
    PRESERVE_UPLOADS=false
    PRESERVE_LOGS=false
    PRESERVE_CONSCENT=false
    
    if [ -d "$DEPLOY_DIR/api/uploads" ] && [ "$(ls -A $DEPLOY_DIR/api/uploads 2>/dev/null)" ]; then
        cp -r "$DEPLOY_DIR/api/uploads" "$TEMP_DIR/api/uploads_backup" 2>/dev/null || true
        PRESERVE_UPLOADS=true
        info "Preserving existing uploads"
    fi
    
    if [ -d "$DEPLOY_DIR/api/logs" ] && [ "$(ls -A $DEPLOY_DIR/api/logs 2>/dev/null)" ]; then
        cp -r "$DEPLOY_DIR/api/logs" "$TEMP_DIR/api/logs_backup" 2>/dev/null || true
        PRESERVE_LOGS=true
        info "Preserving existing logs"
    fi
    
    if [ -d "$DEPLOY_DIR/api/conscent" ] && [ "$(ls -A $DEPLOY_DIR/api/conscent 2>/dev/null)" ]; then
        cp -r "$DEPLOY_DIR/api/conscent" "$TEMP_DIR/api/conscent_backup" 2>/dev/null || true
        PRESERVE_CONSCENT=true
        info "Preserving existing consent data"
    fi
    
    # Keep credentials file if it exists
    if [ -f "$DEPLOY_DIR/api/credentials.php" ]; then
        cp "$DEPLOY_DIR/api/credentials.php" "$TEMP_DIR/api/credentials_backup.php" 2>/dev/null || true
        info "Preserving existing credentials"
    fi
    
    # Sync files to deploy directory
    cd "$TEMP_DIR"
    
    # Copy all files (excluding backups we just made)
    find . -maxdepth 1 ! -name '.' ! -name 'api' | while read -r item; do
        cp -rf "$item" "$DEPLOY_DIR/" 2>/dev/null || true
    done
    
    # Handle api directory specially
    mkdir -p "$DEPLOY_DIR/api"
    find ./api -maxdepth 1 ! -name 'api' ! -name '*_backup*' | while read -r item; do
        cp -rf "$item" "$DEPLOY_DIR/api/" 2>/dev/null || true
    done
    
    # Restore preserved data
    if [ "$PRESERVE_UPLOADS" = true ]; then
        cp -rf "$TEMP_DIR/api/uploads_backup/"* "$DEPLOY_DIR/api/uploads/" 2>/dev/null || true
        success "Uploads restored"
    fi
    
    if [ "$PRESERVE_LOGS" = true ]; then
        cp -rf "$TEMP_DIR/api/logs_backup/"* "$DEPLOY_DIR/api/logs/" 2>/dev/null || true
        success "Logs restored"
    fi
    
    if [ "$PRESERVE_CONSCENT" = true ]; then
        cp -rf "$TEMP_DIR/api/conscent_backup/"* "$DEPLOY_DIR/api/conscent/" 2>/dev/null || true
        success "Consent data restored"
    fi
    
    if [ -f "$TEMP_DIR/api/credentials_backup.php" ]; then
        cp "$TEMP_DIR/api/credentials_backup.php" "$DEPLOY_DIR/api/credentials.php" 2>/dev/null || true
        success "Credentials restored"
    fi
    
    success "Files deployed to $DEPLOY_DIR"
    echo ""
}

# =============================================================================
# VERIFY DEPLOYMENT
# =============================================================================
verify_deployment() {
    log "━━━ Verifying Deployment ━━━"
    
    cd "$DEPLOY_DIR"
    
    # Count deployed files
    HTML_COUNT=$(find . -name "*.html" -type f 2>/dev/null | wc -l)
    CSS_COUNT=$(find . -name "*.css" -type f 2>/dev/null | wc -l)
    JS_COUNT=$(find . -name "*.js" -type f 2>/dev/null | wc -l)
    PHP_COUNT=$(find . -name "*.php" -type f 2>/dev/null | wc -l)
    IMG_COUNT=$(find ./assets/images -type f 2>/dev/null | wc -l)
    
    echo ""
    echo -e "${BOLD}📊 Deployed Files:${NC}"
    echo "   ├─ HTML: $HTML_COUNT files"
    echo "   ├─ CSS:  $CSS_COUNT files"
    echo "   ├─ JS:   $JS_COUNT files"
    echo "   ├─ PHP:  $PHP_COUNT files"
    echo "   └─ Images: $IMG_COUNT files"
    echo ""
    
    # Verify critical files
    echo -e "${BOLD}📋 Critical Files:${NC}"
    
    CRITICAL_FILES=(
        "index.html"
        "manifest.json"
        "errors.html"
        ".htaccess"
        "assets/scripts/main.js"
        "assets/scripts/service.js"
        "assets/styles/index.css"
        "api/contact.php"
        "api/db.php"
        "api/credentials.php"
        "api/email-service.php"
    )
    
    MISSING=0
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$DEPLOY_DIR/$file" ]; then
            echo -e "   ${GREEN}✓${NC} $file"
        else
            echo -e "   ${RED}✗${NC} $file ${RED}MISSING${NC}"
            MISSING=$((MISSING + 1))
        fi
    done
    
    echo ""
    
    # PHP syntax check
    if command -v php &> /dev/null; then
        echo -e "${BOLD}🔍 PHP Syntax Check:${NC}"
        PHP_ERRORS=0
        while IFS= read -r phpfile; do
            if ! php -l "$phpfile" > /dev/null 2>&1; then
                echo -e "   ${RED}✗${NC} $phpfile"
                PHP_ERRORS=$((PHP_ERRORS + 1))
            fi
        done < <(find "$DEPLOY_DIR/api" -name "*.php" 2>/dev/null)
        
        if [ $PHP_ERRORS -eq 0 ]; then
            success "All PHP files passed syntax check"
        else
            warning "$PHP_ERRORS PHP file(s) have syntax errors"
        fi
    fi
    
    echo ""
    
    if [ $MISSING -gt 0 ]; then
        warning "$MISSING critical file(s) missing!"
    else
        success "All critical files present"
    fi
    
    echo ""
}

# =============================================================================
# CLEANUP
# =============================================================================
cleanup() {
    log "━━━ Cleanup ━━━"
    
    # Remove temp directory
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    
    # Remove ZIP file if deployment was successful
    if [ -n "$ZIP_FILE" ] && [ -f "$DEPLOY_DIR/$ZIP_FILE" ]; then
        rm -f "$DEPLOY_DIR/$ZIP_FILE" 2>/dev/null || true
        info "Removed ZIP file: $ZIP_FILE"
    fi
    
    success "Cleanup complete"
    echo ""
}

# =============================================================================
# POST-DEPLOYMENT CHECKLIST
# =============================================================================
show_checklist() {
    echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                     🎉 DEPLOYMENT COMPLETE! 🎉                         ║${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log "📅 Deployed: $(date)"
    echo ""
    
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    📋 POST-DEPLOYMENT CHECKLIST                        ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}1. DATABASE SETUP (if not already done)${NC}"
    echo "   └─ cPanel → Databases → MySQL Databases"
    echo "   └─ Create: $DB_NAME_PROD, $DB_NAME_TEST, $DB_NAME_DEV"
    echo "   └─ Assign user: $DB_USER"
    echo "   └─ Import: api/setup.sql via phpMyAdmin"
    echo ""
    
    echo -e "${YELLOW}2. PHP VERSION (cPanel → Software → Select PHP Version)${NC}"
    echo "   └─ Select PHP 8.1+ (8.2 or 8.3 recommended)"
    echo "   └─ Required extensions: mysqli, curl, json, mbstring, fileinfo, imap"
    echo ""
    
    echo -e "${YELLOW}3. EMAIL PIPING (for SMS replies via email)${NC}"
    echo "   └─ cPanel → Email → Forwarders → Add Forwarder"
    echo "   └─ Address: reply@deboucheur.expert"
    echo "   └─ Destination: Pipe to /home/deboucheur/public_html/api/email-pipe.php"
    echo ""
    
    echo -e "${YELLOW}4. TWILIO WEBHOOK (for SMS)${NC}"
    echo "   └─ console.twilio.com → Phone Numbers → Your Number"
    echo "   └─ Messaging Webhook: https://deboucheur.expert/api/sms-webhook.php"
    echo ""
    
    echo -e "${YELLOW}5. VERIFY SITES${NC}"
    echo "   └─ 🇫🇷 French: https://deboucheur.expert"
    echo "   └─ 🇬🇧 English: https://unclogged.me"
    echo ""
    
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                      ✅ READY FOR PRODUCTION! ✅                       ║${NC}"
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
    
    # Parse arguments
    MODE="zip"
    ZIP_FILE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --git|-g)
                MODE="git"
                shift
                ;;
            --zip|-z)
                MODE="zip"
                if [ -n "$2" ] && [ ! "${2:0:1}" = "-" ]; then
                    ZIP_FILE="$2"
                    shift
                fi
                shift
                ;;
            --help|-h)
                echo "Usage: ./script.sh [options]"
                echo ""
                echo "Options:"
                echo "  --zip, -z [file]    Extract from ZIP file (default)"
                echo "  --git, -g           Clone from GitHub"
                echo "  --help, -h          Show this help"
                echo ""
                echo "Examples:"
                echo "  ./script.sh                    # Auto-detect ZIP file"
                echo "  ./script.sh --zip site.zip    # Use specific ZIP"
                echo "  ./script.sh --git             # Clone from GitHub"
                exit 0
                ;;
            *)
                # Assume it's a ZIP file name
                if [ -f "$1" ]; then
                    ZIP_FILE="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Run deployment steps
    preflight_checks
    create_backup
    
    if [ "$MODE" = "git" ]; then
        clone_github
    else
        extract_zip "$ZIP_FILE"
    fi
    
    prepare_files
    set_permissions
    create_htaccess
    deploy_files
    verify_deployment
    cleanup
    show_checklist
    
    exit 0
}

# Run main function with all arguments
main "$@"
