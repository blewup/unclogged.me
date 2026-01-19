# Déboucheur Expert / unclogged.me

A bilingual (French/English) Progressive Web App for **Déboucheur Expert** — a residential plumbing service in Montreal and Montérégie, Quebec, Canada.

## 🔧 About

Billy St-Hilaire offers professional residential plumbing services including:
- **Emergency 24/7** — Drain unclogging, urgent repairs
- **Renovations** — Bathroom, kitchen, new piping
- **HD Camera Inspection** — Precise diagnostic reports
- **Unclogging** — Sewers, sinks, toilets

## 🌐 Domains

| Domain | Language | Theme |
|--------|----------|-------|
| [unclogged.me](https://unclogged.me) | English | Light |
| [deboucheur.expert](https://deboucheur.expert) | French | Light |

## 📱 Contact

- **Phone**: [(438) 530-2343](tel:+14385302343)
- **Email**: info@unclogged.me / info@deboucheur.expert
- **Location**: 290 Rue Lord #01, Napierville, QC J0J 1L0

## 🛠️ Tech Stack

### Frontend
- **HTML5** + **Tailwind CSS** (CDN)
- **Custom CSS** — `assets/styles/style_00.css` through `style_07.css`
- **Local Fonts** — Inter, JetBrains Mono, Playfair Display, Black Ops One, Merriweather, Plus Jakarta Sans

### Backend
- **PHP 7+** with MySQLi
- **Database**: MySQL on Namecheap cPanel

### PWA
- **Service Worker** — Network-first caching strategy
- **Web App Manifest** — Full PWA installability

### AI Integration
- **Google Gemini API** — AI chatbot "L'Apprenti" for plumbing diagnostics

## 📂 Project Structure

```
├── index.html              # Main landing page (8 sticky sections)
├── manifest.json           # PWA manifest
├── errors.html             # Dynamic error router
├── api/
│   ├── contact.php         # Form handler with file uploads
│   ├── backend.php         # Consent logging
│   ├── db.php              # Database connection helper
│   ├── event.php           # Calendar events
│   └── setup.sql           # Database schema
├── assets/
│   ├── fonts/              # Local font files
│   ├── images/             # Slides, logos, services, clients
│   ├── scripts/
│   │   ├── service.js      # Service Worker for offline caching
│   │   ├── icons.js        # FA to SVG icon conversion
│   │   ├── data.js         # Structured data definitions
│   │   ├── chat.js         # AI chat widget
│   │   ├── main.js         # Main scripts
│   │   └── icons/          # Icon definitions by category
│   ├── styles/             # CSS files (style_00.css - style_08.css)
│   └── videos/             # Tutorial videos
├── pages/
│   ├── prices.html         # Pricing page
│   ├── plumbing.html       # Plumbing guide hub
│   ├── events.html         # Calendar/availability
│   ├── team.html           # Team members
│   ├── tools.html          # Tools and equipment
│   ├── conditions.html     # Terms and conditions
│   ├── politics.html       # Privacy policy
│   ├── plumbing/           # Detailed guides
│   │   ├── supply.html
│   │   ├── drainage.html
│   │   ├── debouchage.html
│   │   └── normes.html
│   └── errors/             # Error pages
│       ├── offline.html    # Offline fallback page
│       └── codes/          # HTTP error pages
│           ├── 400.html, 401.html, 403.html, 404.html
│           ├── 408.html, 410.html, 429.html
│           └── 500.html, 502.html, 503.html, 504.html
```

## 🚀 Deployment (Namecheap cPanel)

### Quick Start with `script.sh`

The included deployment script automates the entire setup process. Upload `script.sh` along with your site ZIP file to `public_html`, then run:

```bash
chmod +x script.sh && ./script.sh
```

#### Environment Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Bash** | 4.0+ | 5.0+ |
| **PHP** | 7.4+ | 8.2+ |
| **unzip** | Any | Latest |
| **curl** | 7.0+ | Latest |
| **tar** | Any | GNU tar |

**Required PHP Extensions:**
- `mysqli` — Database connectivity
- `curl` — HTTP requests (webhooks, APIs)
- `json` — JSON parsing
- `mbstring` — Multibyte string handling
- `fileinfo` — MIME type detection for uploads
- `imap` — Email piping (optional, for SMS replies)

#### Script Usage Options

```bash
# Option 1: Auto-detect ZIP file in current directory
./script.sh

# Option 2: Specify a ZIP file
./script.sh --zip unclogged-me-main.zip
./script.sh -z site.zip

# Option 3: Clone directly from GitHub (requires git)
./script.sh --git
./script.sh -g

# Show help
./script.sh --help
```

#### What the Script Does

| Step | Description |
|------|-------------|
| **1. Pre-flight Checks** | Validates PHP version, required extensions, and available utilities |
| **2. Backup** | Creates timestamped `.tar.gz` backup of existing deployment (keeps last 5) |
| **3. Extract/Clone** | Extracts ZIP or clones from GitHub to temp directory |
| **4. Prepare Files** | Removes dev files (`.git`, `README`, etc.), updates service worker cache version |
| **5. Set Permissions** | Directories: 755, Files: 644, `credentials.php`: 600, `email-pipe.php`: 755 |
| **6. Create .htaccess** | HTTPS redirect, GZIP compression, browser caching, security headers, error pages |
| **7. Deploy** | Syncs files to `public_html`, preserving `uploads/`, `logs/`, `conscent/`, `credentials.php` |
| **8. Verify** | Counts deployed files, checks critical files, validates PHP syntax |
| **9. Cleanup** | Removes temp directory and ZIP file |
| **10. Checklist** | Shows post-deployment steps and tests website accessibility |

#### Script Output Files

| Location | Purpose |
|----------|---------|
| `/home/deboucheur/logs/deploy_*.log` | Timestamped deployment logs |
| `/home/deboucheur/backups/backup_*.tar.gz` | Deployment backups (last 5 kept) |

### Manual Deployment Steps

If you prefer manual setup:

#### 1. Upload Files
Upload all files to `public_html` via File Manager or FTP.

#### 2. Database Setup
```sql
-- Run in phpMyAdmin:
CREATE DATABASE IF NOT EXISTS deboucheur_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE deboucheur_prod;
SOURCE setup.sql;
```

#### 3. Configure Database
Edit `api/credentials.php` with your database credentials.

#### 4. File Permissions
```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 600 api/credentials.php
chmod 755 api/email-pipe.php
chmod 755 api/uploads api/logs api/conscent
```

#### 5. SSL/HTTPS
Enable SSL certificate in cPanel → SSL/TLS. The `.htaccess` created by the script handles HTTPS redirect.

#### 6. Email Configuration
Set up email accounts:
- info@unclogged.me
- info@deboucheur.expert

For SMS reply handling via email piping:
- cPanel → Email → Forwarders → Add Forwarder
- Address: `reply@deboucheur.expert`
- Pipe to: `/home/deboucheur/public_html/api/email-pipe.php`

## 🎨 Theming

### Colors
| Color | Hex | Usage |
|-------|-----|-------|
| darkBase | #000000 | Dark theme background |
| darkAlt | #131313 | Dark theme alternate |
| lightBase | #FFFFFF | Light theme background |
| lightAlt | #F2F2F2 | Light theme alternate |
| cardinal | #C41E3A | Emergency/urgency |
| websiteBlue | #2563EB | Primary accent |
| deboucheurGreen | #22c55e | Success states |

### Fonts
- **Titles**: Black Ops One
- **Body**: Comic Sans MS
- **Code**: JetBrains Mono
- **Elegant**: Playfair Display

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

## 👤 Author

**Billy St-Hilaire** — Déboucheur Expert
- GitHub: [@shurukn](https://github.com/shurukn)
- Website: [unclogged.me](https://unclogged.me)

---

*© 2024 Billy le deboucheur. All rights reserved.*
