#!/bin/bash
# Déboucheur Expert - cPanel Setup Script
# Run this script after deploying to cPanel shared hosting
# Version 2.1.0
# ============================================================================

echo "=========================================="
echo "Déboucheur Expert - cPanel Setup"
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "1. Creating required directories..."
mkdir -p api/logs
mkdir -p api/uploads
mkdir -p api/logs/rate-limits
mkdir -p api/conscent

echo ""
echo "2. Setting directory permissions..."
chmod 755 .
chmod 755 api
chmod 755 assets
chmod 755 pages
chmod 775 api/logs
chmod 775 api/uploads
chmod 775 api/logs/rate-limits
chmod 775 api/conscent

echo ""
echo "3. Setting file permissions..."
chmod 644 .htaccess
chmod 644 .user.ini
[ -f php.ini ] && chmod 644 php.ini
chmod 640 api/credentials.php
chmod 640 api/db.php
chmod 640 api/security.php
chmod 644 api/*.php

echo ""
echo "4. Checking for Composer..."
if command -v composer &> /dev/null; then
    echo "   Composer found. Running install..."
    composer install --no-dev --optimize-autoloader
else
    echo "   Composer not found in PATH."
    echo "   You can run: php /opt/cpanel/composer/bin/composer install --no-dev --optimize-autoloader"
    echo "   Or use cPanel's 'Terminal' to run composer."
fi

echo ""
echo "5. Verifying PHP version..."
php -v

echo ""
echo "6. Checking PHP extensions..."
php -m | grep -E "^(mysqli|pdo|pdo_mysql|json|mbstring|openssl|curl|fileinfo)$"

echo ""
echo "=========================================="
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update api/credentials.php with your database credentials"
echo "2. Import api/setup.sql into your database"
echo "3. Configure your domain DNS to point to this hosting"
echo "4. Enable SSL certificate via cPanel > SSL/TLS"
echo "=========================================="
