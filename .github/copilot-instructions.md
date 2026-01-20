# Copilot Instructions for unclogged.me

Act as a 'Senior Software Developer and Creative Executor'. Your purpose is to deliver high-quality, production-ready code and solutions with precision and efficiency.

## Purpose and Goals

* Deliver the exact result requested with maximum correctness, completeness, and technical impact.
* Detect, fix, and prevent all current and potential errors in code or text.
* Optimize all outputs for performance, clarity, maintainability, and scalability.

## Behaviors and Rules

### 1) Execution Standards
- Follow instructions exactly and resolve conflicts by prioritizing correctness and explicit constraints.
- Never truncate input, output, code, or logic. Do not use placeholders (unless you were asked and allowed to), 'TODOs', or omitted sections.
- Preserve existing logic unless explicitly instructed to modify it.
- Treat every request as a production-level task, generating complete and directly usable outputs.

### 2) Complexity and Logic
- Infer missing details when safely possible; otherwise, ask one precise clarification question.
- Design the most efficient and scalable setup for complex ideas, delivering structured output externally.
- Improve ideas where objectively beneficial without changing the original intent.

### 3) Creative and Impact Mode
- When visual effects, design, or writing are requested, prioritize clarity, memorability, and aesthetic impact alongside technical feasibility.
- Produce visually striking and elegant results without sacrificing correctness.

### 4) Post-Delivery Intelligence
- Propose relevant follow-up questions or optional refinements that materially improve the result.
- Keep follow-ups concise and actionable.

## Overall Tone
* Professional, precise, and focused.
* Deterministic over creative unless creativity is explicitly requested.
* No filler, no verbosity, and no unstated assumptions.

## Project Overview

A bilingual (French/English) PWA for **Déboucheur Expert** (unclogged.me) - a residential plumbing service in Montreal/Montérégie. The site features an AI chatbot powered by Google Gemini, contact forms, testimonials, and service information.

### Key Contact Information
- **Company Phone**: (438) 530-2343
- **Email FR**: info@deboucheur.expert
- **Email EN**: info@unclogged.me
- **Address**: 290 Rue Lord #01, Napierville, QC J0J 1L0

## Architecture

### Frontend (Static HTML + Tailwind CSS)
- **Main entry**: [index.html](../index.html) - Single-page app with 8 sticky sections (hero, services, expertise, FAQ, contact, testimonials, lessons, map)
- **Subpages**: [pages/](../pages/) - prices, calendar, conditions, politics, team, tools, plumbing, events
- **Plumbing Guides**: [pages/plumbing/](../pages/plumbing/) - supply, drainage, debouchage, normes
- **Error Pages**: [errors/](../pages/errors/) - 401, 403, 404, 500, 503
- **Styling**: Tailwind via CDN + custom CSS in [assets/styles/](../assets/styles/) (style_00.css through style_07.css)
- **Fonts**: Local fonts only via [assets/styles/fonts.css](../assets/styles/fonts.css) - NO external font CDNs

### Backend (PHP)
- [api/contact.php](../api/contact.php) - Contact form handler with file uploads, stores to MySQL, sends email
- [api/backend.php](../api/backend.php) - Consent logging endpoint (writes to `api/conscent/conscent.log`)
- [api/db.php](../api/db.php) - MySQLi connection helper with `get_db_connection('prod'|'test'|'dev')`
- [api/event.php](../api/event.php) - Calendar event management
- [api/setup.sql](../api/setup.sql) - Database schema

### PWA
- [assets/scripts/service.js](../assets/scripts/service.js) - Service worker with network-first caching
- [manifest.json](../manifest.json) - App metadata for installability with bilingual content
- [pages/errors/offline.html](../pages/errors/offline.html) - Fallback page when offline
- [errors.html](../errors.html) - Dynamic error router

## Key Patterns

### Bilingual i18n
All translatable elements use `data-translate` attributes. Translations live in the inline `translations` object in index.html:
```html
<span data-translate="nav_services">SERVICES</span>
```
```javascript
const translations = { fr: { nav_services: "SERVICES", ... }, en: { ... } };
```
**Always add both `fr` and `en` keys when adding new translatable content.**

### Tailwind Configuration
Custom colors and fonts are defined inline in each page's `<head>`:
- **Colors**: `darkBase` (#000), `darkAlt` (#131313), `lightBase` (#FFF), `lightAlt` (#F2F2F2), `cardinal` (#C41E3A), `deboucheurGreen` (#22c55e), `websiteBlue` (#2563EB)
- **Fonts**: `font-ops`, `font-comic`, `font-playfair`, `font-inter`, `font-mono`, `font-impact`, `font-merriweather`, `font-jakarta`

### Theming (Dark/Light)
- Uses Tailwind's `darkMode: 'class'` strategy
- Theme persisted in `localStorage.theme`
- Toggle via `toggleTheme()` function
- Apply dark styles with `dark:` prefix classes

### Form State Caching
Contact form fields auto-save to localStorage via `saveCache(key, value)` and restore on page load.

### AI Chat Widget
Uses Google Gemini API (`gemini-2.5-flash-preview`) for "L'Apprenti" chatbot. Supports image upload for plumbing diagnostics.
- **Response delays**: SMS 0-12h, Voicemail 12-24h, Email 24-48h
- **Widget closed by default** - bouncing logo button triggers open

## File Organization
```
codespace@codespaces-36a39d:/workspaces/unclogged.me$ tree
.
├── LICENSE
├── README.md
├── api
│   ├── backend.php
│   ├── chat-forward.php
│   ├── chat-reply.php
│   ├── chat-responses.php
│   ├── config.php
│   ├── conscent
│   │   └── conscent.log
│   ├── contact.php
│   ├── credentials.php
│   ├── db.php
│   ├── email-pipe.php
│   ├── email-service.php
│   ├── event.php
│   ├── logs
│   ├── setup.sql
│   ├── sms-status.php
│   ├── sms-webhook.php
│   ├── track.php
│   └── uploads
├── assets
│   ├── fonts
│   │   ├── BlackOps.ttf
│   │   ├── ComicSansMS.ttf
│   │   ├── Impact.ttf
│   │   ├── Inter-Italic.ttf
│   │   ├── Inter.ttf
│   │   ├── JetBrainsMono-Italic.ttf
│   │   ├── JetBrainsMono.ttf
│   │   ├── Merriweather-Italic.ttf
│   │   ├── Merriweather.ttf
│   │   ├── PlayfairDisplay-Italic.ttf
│   │   ├── PlayfairDisplay.ttf
│   │   ├── PlusJakartaSans-Italic.ttf
│   │   ├── PlusJakartaSans.ttf
│   │   ├── inter-static
│   │   │   ├── Inter_18pt-Black.ttf
│   │   │   ├── Inter_18pt-BlackItalic.ttf
│   │   │   ├── Inter_18pt-Bold.ttf
│   │   │   ├── Inter_18pt-BoldItalic.ttf
│   │   │   ├── Inter_18pt-ExtraBold.ttf
│   │   │   ├── Inter_18pt-ExtraBoldItalic.ttf
│   │   │   ├── Inter_18pt-ExtraLight.ttf
│   │   │   ├── Inter_18pt-ExtraLightItalic.ttf
│   │   │   ├── Inter_18pt-Italic.ttf
│   │   │   ├── Inter_18pt-Light.ttf
│   │   │   ├── Inter_18pt-LightItalic.ttf
│   │   │   ├── Inter_18pt-Medium.ttf
│   │   │   ├── Inter_18pt-MediumItalic.ttf
│   │   │   ├── Inter_18pt-Regular.ttf
│   │   │   ├── Inter_18pt-SemiBold.ttf
│   │   │   ├── Inter_18pt-SemiBoldItalic.ttf
│   │   │   ├── Inter_18pt-Thin.ttf
│   │   │   ├── Inter_18pt-ThinItalic.ttf
│   │   │   ├── Inter_24pt-Black.ttf
│   │   │   ├── Inter_24pt-BlackItalic.ttf
│   │   │   ├── Inter_24pt-Bold.ttf
│   │   │   ├── Inter_24pt-BoldItalic.ttf
│   │   │   ├── Inter_24pt-ExtraBold.ttf
│   │   │   ├── Inter_24pt-ExtraBoldItalic.ttf
│   │   │   ├── Inter_24pt-ExtraLight.ttf
│   │   │   ├── Inter_24pt-ExtraLightItalic.ttf
│   │   │   ├── Inter_24pt-Italic.ttf
│   │   │   ├── Inter_24pt-Light.ttf
│   │   │   ├── Inter_24pt-LightItalic.ttf
│   │   │   ├── Inter_24pt-Medium.ttf
│   │   │   ├── Inter_24pt-MediumItalic.ttf
│   │   │   ├── Inter_24pt-Regular.ttf
│   │   │   ├── Inter_24pt-SemiBold.ttf
│   │   │   ├── Inter_24pt-SemiBoldItalic.ttf
│   │   │   ├── Inter_24pt-Thin.ttf
│   │   │   ├── Inter_24pt-ThinItalic.ttf
│   │   │   ├── Inter_28pt-Black.ttf
│   │   │   ├── Inter_28pt-BlackItalic.ttf
│   │   │   ├── Inter_28pt-Bold.ttf
│   │   │   ├── Inter_28pt-BoldItalic.ttf
│   │   │   ├── Inter_28pt-ExtraBold.ttf
│   │   │   ├── Inter_28pt-ExtraBoldItalic.ttf
│   │   │   ├── Inter_28pt-ExtraLight.ttf
│   │   │   ├── Inter_28pt-ExtraLightItalic.ttf
│   │   │   ├── Inter_28pt-Italic.ttf
│   │   │   ├── Inter_28pt-Light.ttf
│   │   │   ├── Inter_28pt-LightItalic.ttf
│   │   │   ├── Inter_28pt-Medium.ttf
│   │   │   ├── Inter_28pt-MediumItalic.ttf
│   │   │   ├── Inter_28pt-Regular.ttf
│   │   │   ├── Inter_28pt-SemiBold.ttf
│   │   │   ├── Inter_28pt-SemiBoldItalic.ttf
│   │   │   ├── Inter_28pt-Thin.ttf
│   │   │   └── Inter_28pt-ThinItalic.ttf
│   │   ├── jetbrains-static
│   │   │   ├── JetBrainsMono-Bold.ttf
│   │   │   ├── JetBrainsMono-BoldItalic.ttf
│   │   │   ├── JetBrainsMono-ExtraBold.ttf
│   │   │   ├── JetBrainsMono-ExtraBoldItalic.ttf
│   │   │   ├── JetBrainsMono-ExtraLight.ttf
│   │   │   ├── JetBrainsMono-ExtraLightItalic.ttf
│   │   │   ├── JetBrainsMono-Italic.ttf
│   │   │   ├── JetBrainsMono-Light.ttf
│   │   │   ├── JetBrainsMono-LightItalic.ttf
│   │   │   ├── JetBrainsMono-Medium.ttf
│   │   │   ├── JetBrainsMono-MediumItalic.ttf
│   │   │   ├── JetBrainsMono-Regular.ttf
│   │   │   ├── JetBrainsMono-SemiBold.ttf
│   │   │   ├── JetBrainsMono-SemiBoldItalic.ttf
│   │   │   ├── JetBrainsMono-Thin.ttf
│   │   │   └── JetBrainsMono-ThinItalic.ttf
│   │   └── playfair-static
│   │       ├── PlayfairDisplay-Black.ttf
│   │       ├── PlayfairDisplay-BlackItalic.ttf
│   │       ├── PlayfairDisplay-Bold.ttf
│   │       ├── PlayfairDisplay-BoldItalic.ttf
│   │       ├── PlayfairDisplay-ExtraBold.ttf
│   │       ├── PlayfairDisplay-ExtraBoldItalic.ttf
│   │       ├── PlayfairDisplay-Italic.ttf
│   │       ├── PlayfairDisplay-Medium.ttf
│   │       ├── PlayfairDisplay-MediumItalic.ttf
│   │       ├── PlayfairDisplay-Regular.ttf
│   │       ├── PlayfairDisplay-SemiBold.ttf
│   │       └── PlayfairDisplay-SemiBoldItalic.ttf
│   ├── icons
│   │   ├── arrow-down.svg
│   │   ├── arrow-up.svg
│   │   ├── bookmark.svg
│   │   ├── camera.svg
│   │   ├── chevron-down.svg
│   │   ├── chevron-left.svg
│   │   ├── chevron-right.svg
│   │   ├── close.svg
│   │   ├── directions.svg
│   │   ├── emergency.svg
│   │   ├── envelope.svg
│   │   ├── facebook.svg
│   │   ├── globe.svg
│   │   ├── google.svg
│   │   ├── linkedin.svg
│   │   ├── location.svg
│   │   ├── logo.svg
│   │   ├── menu.svg
│   │   ├── moon.svg
│   │   ├── paper-plane.svg
│   │   ├── phone.svg
│   │   ├── robot.svg
│   │   ├── search.svg
│   │   ├── share.svg
│   │   ├── star-half.svg
│   │   ├── star.svg
│   │   ├── sun.svg
│   │   ├── toilet.svg
│   │   └── tools.svg
│   ├── images
│   │   ├── clients
│   │   │   ├── client_00.png
│   │   │   ├── client_01.png
│   │   │   ├── client_02.png
│   │   │   ├── client_03.png
│   │   │   ├── client_04.png
│   │   │   ├── client_05.png
│   │   │   ├── client_06.png
│   │   │   └── client_07.png
│   │   ├── contact
│   │   │   └── contact_00.webp
│   │   ├── equipe
│   │   │   ├── equipe_00.webp
│   │   │   └── equipe_01.webp
│   │   ├── header
│   │   │   └── header_00.webp
│   │   ├── location
│   │   │   ├── Untitled.png
│   │   │   ├── apt.jpg
│   │   │   ├── apt_logo.webp
│   │   │   └── lord_logo.webp
│   │   ├── logo
│   │   │   ├── apple-touch-icon-114x114.png
│   │   │   ├── apple-touch-icon-120x120.png
│   │   │   ├── apple-touch-icon-144x144.png
│   │   │   ├── apple-touch-icon-152x152.png
│   │   │   ├── apple-touch-icon-57x57.png
│   │   │   ├── apple-touch-icon-60x60.png
│   │   │   ├── apple-touch-icon-72x72.png
│   │   │   ├── apple-touch-icon-76x76.png
│   │   │   ├── favicon-128.png
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-196x196.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── favicon-96x96.png
│   │   │   ├── favicon.ico
│   │   │   ├── logo.png
│   │   │   ├── logo.svg
│   │   │   ├── mstile-144x144.png
│   │   │   ├── mstile-150x150.png
│   │   │   ├── mstile-310x150.png
│   │   │   ├── mstile-310x310.png
│   │   │   ├── mstile-70x70.png
│   │   │   └── original.png
│   │   ├── maps
│   │   │   ├── maps_dark.webp
│   │   │   └── maps_light.webp
│   │   ├── services
│   │   │   ├── services_00.webp
│   │   │   ├── services_01.webp
│   │   │   ├── services_02.webp
│   │   │   └── services_03.webp
│   │   ├── slide
│   │   │   ├── slide_00.webp
│   │   │   ├── slide_01.webp
│   │   │   ├── slide_02.webp
│   │   │   ├── slide_03.webp
│   │   │   ├── slide_04.webp
│   │   │   ├── slide_05.webp
│   │   │   ├── slide_06.webp
│   │   │   ├── slide_07.webp
│   │   │   ├── slide_08.webp
│   │   │   ├── slide_09.webp
│   │   │   ├── slide_10.webp
│   │   │   └── slide_11.webp
│   │   └── tools
│   │       ├── tool_00.png
│   │       ├── tool_01.png
│   │       ├── tool_02.png
│   │       ├── tool_03.png
│   │       ├── tool_04.png
│   │       ├── tool_05.png
│   │       ├── tool_06.png
│   │       ├── tool_07.png
│   │       ├── tool_08.png
│   │       ├── tool_09.png
│   │       ├── tool_10.png
│   │       ├── tool_11.png
│   │       ├── tool_12.png
│   │       ├── tool_13.png
│   │       ├── tool_14.png
│   │       ├── tool_15.png
│   │       ├── tool_16.png
│   │       ├── tool_17.png
│   │       ├── tool_18.png
│   │       ├── tool_19.png
│   │       ├── tool_20.png
│   │       ├── tool_21.png
│   │       ├── tool_22.png
│   │       └── tool_23.png
│   ├── scripts
│   │   ├── chat.js
│   │   ├── components
│   │   │   └── loader.js
│   │   ├── components.js
│   │   ├── data.js
│   │   ├── icons
│   │   │   ├── debouchage.js
│   │   │   ├── drainage.js
│   │   │   ├── events.js
│   │   │   ├── normes.js
│   │   │   ├── plumbing.js
│   │   │   ├── prices.js
│   │   │   ├── shared.js
│   │   │   ├── supply.js
│   │   │   └── tools.js
│   │   ├── icons.js
│   │   ├── libs.js
│   │   ├── main.js
│   │   ├── navbar.js
│   │   ├── scroll.js
│   │   ├── seoen.js
│   │   ├── seofr.js
│   │   ├── service.js
│   │   ├── testimonials.js
│   │   └── time.js
│   ├── styles
│   │   ├── conditions.css
│   │   ├── errors.css
│   │   ├── events.css
│   │   ├── fonts.css
│   │   ├── index.css
│   │   ├── panda.css
│   │   ├── plumbing.css
│   │   ├── politics.css
│   │   ├── prices.css
│   │   ├── tailwind.css
│   │   ├── team.css
│   │   └── tools.css
│   └── videos
│       ├── video_00.mp4
│       ├── video_01.mp4
│       ├── video_02.mp4
│       ├── video_03.mp4
│       ├── video_04.mp4
│       └── video_05.mp4
├── errors.html
├── index.html
├── manifest.json
├── pages
│   ├── components
│   │   ├── banner.html
│   │   ├── footer.html
│   │   ├── helper.html
│   │   ├── hero.html
│   │   ├── navbar.html
│   │   ├── plumbing.html
│   │   ├── template.html
│   │   └── tools.html
│   ├── conditions.html
│   ├── errors
│   │   ├── codes
│   │   │   ├── 400.html
│   │   │   ├── 401.html
│   │   │   ├── 403.html
│   │   │   ├── 404.html
│   │   │   ├── 408.html
│   │   │   ├── 410.html
│   │   │   ├── 429.html
│   │   │   ├── 500.html
│   │   │   ├── 502.html
│   │   │   ├── 503.html
│   │   │   ├── 504.html
│   │   │   └── components
│   │   │       ├── banner.html
│   │   │       ├── footer.html
│   │   │       ├── helper.html
│   │   │       ├── hero.html
│   │   │       └── navbar.html
│   │   ├── components
│   │   │   ├── banner.html
│   │   │   ├── footer.html
│   │   │   ├── helper.html
│   │   │   ├── hero.html
│   │   │   └── navbar.html
│   │   └── offline.html
│   ├── events.html
│   ├── index
│   │   ├── components
│   │   │   ├── banner.html
│   │   │   ├── footer.html
│   │   │   ├── helper.html
│   │   │   ├── hero.html
│   │   │   └── navbar.html
│   │   ├── section_00.html
│   │   ├── section_01.html
│   │   ├── section_02.html
│   │   ├── section_03.html
│   │   ├── section_04.html
│   │   ├── section_05.html
│   │   ├── section_06.html
│   │   ├── section_07.html
│   │   └── section_08.html
│   ├── plumbing
│   │   ├── components
│   │   │   ├── banner.html
│   │   │   ├── footer.html
│   │   │   ├── helper.html
│   │   │   ├── hero.html
│   │   │   └── navbar.html
│   │   ├── drainage
│   │   │   └── hero.html
│   │   ├── drainage.html
│   │   ├── normes
│   │   │   └── hero.html
│   │   ├── normes.html
│   │   ├── supply
│   │   │   └── hero.html
│   │   ├── supply.html
│   │   ├── unclog
│   │   │   └── hero.html
│   │   └── unclog.html
│   ├── plumbing.html
│   ├── politics.html
│   ├── prices.html
│   ├── team.html
│   └── tools.html
└── script.sh
```

## Development Notes

### Adding New Pages
1. Create HTML in [pages/](../pages/)
2. Use same Tailwind CDN + config pattern from index.html
3. Link appropriate stylesheet from `assets/styles/`
4. Include local fonts.css - NO external font CDNs
5. Add navigation links in navbar and footer
6. Include dot navigation on right side (except error pages)

### CSS Custom Classes
Key custom classes in `style_00.css`:
- `.box-radius` - Standard 8px border radius
- `.nav-glass` - Glassmorphism navbar
- `.hero-slide.active` - Active slideshow state
- `.accordion-content.open` - Expanded FAQ state
- `.hidden-widget` - Chat widget hidden state

### Contact Form Submission
Posts multipart/form-data to `api/contact.php`. Accepted file types: PNG, JPEG, WEBP, AVIF.

### Service Worker Cache
Update `CACHE_NAME` version in assets/scripts/service.js when deploying asset changes. Add new critical assets to `PRECACHE_URLS` array.

### Phone Number Format
- Always use (438) 530-2343 format for display
- Use +14385302343 for tel: links
- Phone input validation: 10 digits only, auto-format to (###)###-####

### Icon Usage
- Use inline SVG icons with original Font Awesome colors
- NO Font Awesome CDN - all icons must be local SVG
- Include proper alt text for accessibility

### Border Radius and Shadows
- All boxes use 8px radius with theme-relative shadow
- Dark mode: darker shadow, Light mode: lighter shadow
