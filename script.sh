#!/bin/bash
# =============================================================================
# Déboucheur Expert - cPanel Deployment Script
# Automatic deployment from GitHub to /home/deboucheur/public_html
# =============================================================================
# Usage: Run this script from cPanel Terminal or SSH
#   chmod +x script.sh
#   ./script.sh
# =============================================================================

set -e  # Exit on any error

# Configuration
GITHUB_REPO="https://github.com/blewup/unclogged.me.git"
DEPLOY_DIR="/home/deboucheur/public_html"
BACKUP_DIR="/home/deboucheur/backups"
TEMP_DIR="/home/deboucheur/tmp"
LOG_FILE="/home/deboucheur/logs/deploy.log"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# =============================================================================
# STEP 0: Pre-flight checks
# =============================================================================
log "================================================"
log "🚀 Starting Déboucheur Expert Deployment"
log "================================================"

# Check if git is available
if ! command -v git &> /dev/null; then
    error "Git is not installed. Please install git first."
fi

# Check if deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    error "Deploy directory does not exist: $DEPLOY_DIR"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# =============================================================================
# STEP 1: Create backup of current deployment
# =============================================================================
log "📦 Creating backup of current deployment..."

BACKUP_NAME="backup_$(date '+%Y%m%d_%H%M%S').tar.gz"
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
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

# Remove unnecessary files
rm -rf .git .github backup *.bak README.md LICENSE .gitignore

# Update service worker cache version
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

# Make PHP files readable
find . -name "*.php" -exec chmod 644 {} \;

# Ensure api/uploads is writable
if [ -d "api" ]; then
    mkdir -p "api/uploads"
    mkdir -p "api/conscent"
    chmod 755 api/uploads
    chmod 755 api/conscent
fi

success "Permissions set"

# =============================================================================
# STEP 5: Deploy to public_html
# =============================================================================
log "🚀 Deploying to $DEPLOY_DIR..."

# Remove old files (except .htaccess and critical configs)
if [ -f "$DEPLOY_DIR/.htaccess" ]; then
    cp "$DEPLOY_DIR/.htaccess" "$TEMP_DIR/.htaccess.bak" 2>/dev/null || true
fi

# Sync files to deploy directory
rsync -av --delete \
    --exclude='.htaccess.bak' \
    --exclude='api/uploads/*' \
    --exclude='api/conscent/*' \
    "$TEMP_DIR/" "$DEPLOY_DIR/" 2>&1 | tee -a "$LOG_FILE"

# Restore .htaccess if it was backed up
if [ -f "$TEMP_DIR/.htaccess.bak" ] && [ ! -f "$DEPLOY_DIR/.htaccess" ]; then
    mv "$TEMP_DIR/.htaccess.bak" "$DEPLOY_DIR/.htaccess"
    log "Restored .htaccess file"
fi

success "Files deployed to $DEPLOY_DIR"

# =============================================================================
# STEP 6: Verify deployment
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
    "assets/scripts/service.js"
    "api/contact.php"
    "api/db.php"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$DEPLOY_DIR/$file" ]; then
        log "   ✅ $file exists"
    else
        warning "   ⚠️ $file is missing!"
    fi
done

# =============================================================================
# STEP 7: PHP syntax check
# =============================================================================
log "🔍 Checking PHP syntax..."

PHP_ERRORS=0
while IFS= read -r phpfile; do
    if ! php -l "$phpfile" > /dev/null 2>&1; then
        warning "PHP syntax error in: $phpfile"
        PHP_ERRORS=$((PHP_ERRORS + 1))
    fi
done < <(find "$DEPLOY_DIR" -name "*.php")

if [ $PHP_ERRORS -eq 0 ]; then
    success "All PHP files passed syntax check"
else
    warning "$PHP_ERRORS PHP file(s) have syntax errors"
fi

# =============================================================================
# STEP 8: Cleanup
# =============================================================================
log "🧹 Cleaning up..."

rm -rf "$TEMP_DIR"

success "Cleanup complete"

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
log "================================================"
log "🎉 DEPLOYMENT COMPLETE!"
log "================================================"
log "📅 Date: $(date)"
log "🌐 Sites:"
log "   - https://unclogged.me (EN)"
log "   - https://deboucheur.expert (FR)"
log "📦 Backup: $BACKUP_DIR/$BACKUP_NAME"
log "📋 Log: $LOG_FILE"
log "================================================"

success "Deployment finished successfully!"

# Verify website is accessible
log "🌐 Testing website accessibility..."
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://unclogged.me" 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        success "Website is online! (HTTP $HTTP_STATUS)"
    else
        warning "Website returned HTTP $HTTP_STATUS - please verify manually"
    fi
else
    log "curl not available, skipping website test"
fi

exit 0
