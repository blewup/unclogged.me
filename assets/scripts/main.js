/**
 * Déboucheur Expert - Main JavaScript Module
 * Enhanced navigation, tracking, theming, and core functionality
 * @version 2.0.0
 * @author Déboucheur Expert Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = Object.freeze({
    apiBase: '/api',
    autoRotateInterval: 18000,       // 18 seconds for section auto-scroll
    slideInterval: 8000,             // 8 seconds for hero slideshow
    pauseDuration: 120000,           // 2 minutes pause on user interaction
    testimonialInterval: 12000,      // 12 seconds
    overlayRotateInterval: 30000,    // 30 seconds
    trackingEnabled: true,
    debounceDelay: 150,              // Debounce delay for scroll events
    animationDuration: 300,          // Default animation duration
    phone: {
        primary: '438-530-2343',
        secondary: '438-765-7040',
        formatted: '(438) 530-2343'
    },
    email: {
        fr: 'info@deboucheur.expert',
        en: 'info@unclogged.me'
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
    debounce(func, wait = CONFIG.debounceDelay) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit = 16) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    $(selector) { return document.querySelector(selector); },
    $$(selector) { return document.querySelectorAll(selector); },

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    },

    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10 
            ? \`(\${cleaned.slice(0,3)}) \${cleaned.slice(3,6)}-\${cleaned.slice(6)}\`
            : phone;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    generateId(prefix = 'id') {
        return \`\${prefix}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    },

    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    scrollTo(target, offset = 0) {
        const element = typeof target === 'string' ? Utils.$(target) : target;
        if (!element) return;
        const behavior = Utils.prefersReducedMotion() ? 'auto' : 'smooth';
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior });
    }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const Session = {
    id: null,
    storageKey: 'deboucheur_session',
    
    init() {
        this.id = localStorage.getItem(this.storageKey);
        if (!this.id || this.isExpired()) {
            this.id = this.generateId();
            this.save();
        }
        return this.id;
    },
    
    generateId() { return \`ses_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`; },
    
    save() {
        localStorage.setItem(this.storageKey, this.id);
        localStorage.setItem(\`\${this.storageKey}_timestamp\`, Date.now().toString());
    },
    
    isExpired() {
        const timestamp = localStorage.getItem(\`\${this.storageKey}_timestamp\`);
        return !timestamp || Date.now() - parseInt(timestamp) > 86400000;
    },
    
    get() { return this.id || this.init(); },
    
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(\`\${this.storageKey}_timestamp\`);
        this.id = null;
    }
};

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

const Language = {
    current: localStorage.getItem('language') || (navigator.language?.startsWith('fr') ? 'fr' : 'fr'),
    
    translations: {
        fr: {
            nav_services: "SERVICES", nav_answers: "REPONSES", nav_contact: "CONTACT",
            nav_location: "LOCALISATION", nav_tarifs: "TARIFICATION", nav_calendar: "DISPONIBILITÉS",
            nav_guide: "GUIDE", nav_team: "ÉQUIPE", nav_more: "PLUS", urgence: "URGENCE 24/7",
            hero_l1: "BIENVENU CHEZ", hero_l3: "LE DEBOUCHEUR",
            hero_text: "Avec plus de 15 ans d'expérience en plomberie, 10 ans comme compagnon. Billy St-Hilaire est à votre service et vous offre le meilleur service garanti.",
            btn_rdv: "PRENDRE RENDEZ-VOUS", services_title: "NOS SERVICES", services_sub: "DE PLOMBERIE",
            srv_urgence: "URGENCE 24/7", srv_urgence_desc: "Intervention rapide. Nuit et jour.",
            srv_reno: "RÉNOVATION", srv_reno_desc: "Salle de bain, cuisine, tuyauterie neuve.",
            srv_insp: "INSPECTION", srv_insp_desc: "Caméra HD. Rapport précis.",
            srv_debouch: "DEBOUCHAGE", srv_debouch_desc: "Égouts, lavabos et toilettes.",
            exp_title1: "POURQUOI", exp_title2: "CHOISIR NOTRE", exp_title3: "EXPERTISE ?",
            exp_intro: "Avec Billy St-Hilaire, le savoir-faire traditionnel et les différentes technologies modernes sont combinées.",
            exp_comp_title: "COMPÉTENCES VARIÉES",
            exp_comp_text: "Soudure MIG, TIG et SMAW. Compagnon Plombier, Chauffagiste. De l'expérience à revendre.",
            exp_ponc_title: "PONCTUEL ET ASSIDU",
            exp_ponc_text: "Un appel de confirmation est fait 24h avant. *Frais en cas d'annulation tardive.",
            faq_title: "FOIRE AUX QUESTIONS",
            faq_q1: "QUELS SONT VOS TARIFS ?", faq_a1: "Contactez-nous pour une estimation gratuite.",
            faq_q2: "URGENCE DÉBOUCHAGE ?", faq_a2: "Ligne d'urgence 24/7 disponible.",
            faq_q3: "DÉPLACEMENT SUR LA RIVE-NORD ?", faq_a3: "Principalement Rive-Sud et Montréal.",
            faq_q4: "GARANTIE SUR LES TRAVAUX ?", faq_a4: "Oui, tous nos travaux sont garantis.",
            faq_q5: "ACCEPTEZ-VOUS LES CARTES ?", faq_a5: "Oui, crédit, débit et virements acceptés.",
            contact_send: "ENVOYEZ", contact_info: "INFOS", btn_send: "ENVOYER",
            testimonials_title: "TÉMOIGNAGES", phone_title: "TELEPHONE",
            cookie_msg: "En poursuivant votre navigation, vous acceptez l'utilisation de cookies afin d'améliorer votre expérience.",
            cookie_accept: "Accepter", cookie_learn: "En savoir plus",
            ped_man: "L'HOMME :", ped_exp: "EXPÉRIENCES :", ped_bio: "BIOGRAPHIE :",
            lessons_title: "Leçons Interactives",
            lessons_desc: "Découvrez des conseils pratiques de plomberie avec Billy et apprenez à mieux comprendre votre système de drainage.",
            lessons_btn: "ENCORE PLUS",
            form_required: "Veuillez remplir tous les champs obligatoires.",
            form_sending: "Envoi en cours…",
            form_success: "Merci ! Votre message a été envoyé.",
            form_error: "Erreur : impossible d'envoyer. Réessayez plus tard.",
            form_invalid_email: "Veuillez entrer une adresse courriel valide.",
            form_invalid_phone: "Veuillez entrer un numéro de téléphone valide."
        },
        en: {
            nav_services: "SERVICES", nav_answers: "ANSWERS", nav_contact: "CONTACT",
            nav_location: "LOCATION", nav_tarifs: "PRICING", nav_calendar: "AVAILABILITY",
            nav_guide: "GUIDE", nav_team: "TEAM", nav_more: "MORE", urgence: "EMERGENCY 24/7",
            hero_l1: "WELCOME TO", hero_l3: "THE UNCLOGGER",
            hero_text: "With over 15 years of plumbing experience, 10 years as a journeyman. Billy St-Hilaire is at your service with guaranteed satisfaction.",
            btn_rdv: "BOOK APPOINTMENT", services_title: "OUR SERVICES", services_sub: "PLUMBING",
            srv_urgence: "EMERGENCY 24/7", srv_urgence_desc: "Quick intervention. Day and night.",
            srv_reno: "RENOVATION", srv_reno_desc: "Bathroom, kitchen, new piping.",
            srv_insp: "INSPECTION", srv_insp_desc: "HD Camera. Detailed report.",
            srv_debouch: "UNCLOGGING", srv_debouch_desc: "Sewers, sinks and toilets.",
            exp_title1: "WHY", exp_title2: "CHOOSE OUR", exp_title3: "EXPERTISE ?",
            exp_intro: "With Billy St-Hilaire, traditional know-how and modern technologies are combined.",
            exp_comp_title: "VARIED SKILLS",
            exp_comp_text: "MIG, TIG and SMAW welding. Journeyman Plumber, HVAC Tech. Experience to spare.",
            exp_ponc_title: "PUNCTUAL AND DEDICATED",
            exp_ponc_text: "Confirmation call made 24h before. *Late cancellation fees apply.",
            faq_title: "FREQUENTLY ASKED QUESTIONS",
            faq_q1: "WHAT ARE YOUR RATES?", faq_a1: "Contact us for a free estimate.",
            faq_q2: "UNCLOGGING EMERGENCY?", faq_a2: "24/7 emergency line available.",
            faq_q3: "DO YOU SERVICE NORTH SHORE?", faq_a3: "Mainly South Shore and Montreal.",
            faq_q4: "WARRANTY ON WORK?", faq_a4: "Yes, all our work is guaranteed.",
            faq_q5: "DO YOU ACCEPT CARDS?", faq_a5: "Yes, credit, debit and transfers accepted.",
            contact_send: "SEND", contact_info: "INFO", btn_send: "SEND",
            testimonials_title: "TESTIMONIALS", phone_title: "PHONE",
            cookie_msg: "By continuing to browse, you accept the use of cookies to improve your experience.",
            cookie_accept: "Accept", cookie_learn: "Learn more",
            ped_man: "THE MAN:", ped_exp: "EXPERIENCE:", ped_bio: "BIOGRAPHY:",
            lessons_title: "Interactive Lessons",
            lessons_desc: "Discover practical plumbing tips with Billy and learn to better understand your drainage system.",
            lessons_btn: "EVEN MORE",
            form_required: "Please fill in all required fields.",
            form_sending: "Sending…",
            form_success: "Thank you! Your message has been sent.",
            form_error: "Error: could not send. Please try again later.",
            form_invalid_email: "Please enter a valid email address.",
            form_invalid_phone: "Please enter a valid phone number."
        }
    },

    toggle() {
        this.current = this.current === 'fr' ? 'en' : 'fr';
        this.apply();
        localStorage.setItem('language', this.current);
        const langDisplay = Utils.$('#lang-display');
        if (langDisplay) langDisplay.innerText = this.current === 'fr' ? 'EN' : 'FR';
        document.documentElement.lang = this.current;
        Tracking.event('language_change', { language: this.current });
    },

    apply() {
        Utils.$$('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.translations[this.current]?.[key];
            if (translation) el.innerText = translation;
        });
    },

    t(key) { return this.translations[this.current]?.[key] || key; },

    init() {
        document.documentElement.lang = this.current;
        const langDisplay = Utils.$('#lang-display');
        if (langDisplay) langDisplay.innerText = this.current === 'fr' ? 'EN' : 'FR';
        this.apply();
    }
};

const t = (key) => Language.t(key);

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

const Theme = {
    current: localStorage.getItem('theme') || 'dark',
    
    toggle() {
        document.documentElement.classList.toggle('dark');
        this.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', this.current);
        Tracking.event('theme_change', { theme: this.current });
    },

    init() {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') document.documentElement.classList.remove('dark');
        else if (saved === 'dark') document.documentElement.classList.add('dark');
        else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.classList.remove('dark');
            this.current = 'light';
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
                this.current = e.matches ? 'dark' : 'light';
            }
        });
    },

    isDark() { return document.documentElement.classList.contains('dark'); }
};

// ============================================================================
// TRACKING
// ============================================================================

const Tracking = {
    queue: [],
    processing: false,

    async event(eventType, data = {}) {
        if (!CONFIG.trackingEnabled) return;
        const payload = { sessionId: Session.get(), eventType, pageUrl: window.location.href, timestamp: Date.now(), ...data };
        this.queue.push(payload);
        this.processQueue();
    },

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        while (this.queue.length > 0) {
            const payload = this.queue.shift();
            try {
                await fetch(\`\${CONFIG.apiBase}/event.php\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.debug('Tracking error:', e);
                if (!payload._retries || payload._retries < 3) {
                    payload._retries = (payload._retries || 0) + 1;
                    this.queue.push(payload);
                }
            }
        }
        this.processing = false;
    },

    async pageView() {
        try {
            const data = {
                sessionId: Session.get(), page: window.location.pathname,
                referrer: document.referrer, screenWidth: window.innerWidth,
                screenHeight: window.innerHeight, language: Language.current,
                theme: Theme.current, userAgent: navigator.userAgent, timestamp: Date.now()
            };
            await fetch(\`\${CONFIG.apiBase}/track.php\`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) { console.debug('Page view tracking error:', e); }
    },

    trackClicks() {
        Utils.$$('a[href^="tel:"]').forEach(el => {
            el.addEventListener('click', () => this.event('phone_click', { phone: el.href }));
        });
        Utils.$$('a[href^="mailto:"]').forEach(el => {
            el.addEventListener('click', () => this.event('email_click', { email: el.href }));
        });
        Utils.$$('[data-track]').forEach(el => {
            el.addEventListener('click', () => this.event('cta_click', { action: el.dataset.track, text: el.innerText?.slice(0, 50) }));
        });
    }
};

// ============================================================================
// FORM HANDLING
// ============================================================================

const Form = {
    validators: {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value.replace(/\D/g, '')),
        required: (value) => value.trim().length > 0,
        minLength: (value, length) => value.trim().length >= length
    },

    saveCache(key, value) { localStorage.setItem(\`form_\${key}\`, value); },
    getCache(key) { return localStorage.getItem(\`form_\${key}\`) || ''; },
    clearCache(keys) { keys.forEach(key => localStorage.removeItem(\`form_\${key}\`)); },

    restoreCache() {
        ['fname', 'lname', 'email', 'phone', 'msg'].forEach(key => {
            const val = this.getCache(key);
            const el = Utils.$(\`#\${key}\`);
            if (val && el) el.value = val;
        });
    },

    formatPhone(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        if (value.length >= 6) input.value = \`(\${value.slice(0,3)}) \${value.slice(3,6)}-\${value.slice(6)}\`;
        else if (value.length >= 3) input.value = \`(\${value.slice(0,3)}) \${value.slice(3)}\`;
        else input.value = value;
    },

    highlightInput(el, state = 'focus') {
        el.classList.remove('input-focus', 'input-valid', 'input-error');
        if (state === 'focus') el.classList.add('input-focus');
        else if (state === 'valid') el.classList.add('input-valid');
        else if (state === 'error') el.classList.add('input-error');
    },

    validateInput(el) {
        const value = el.value.trim();
        const type = el.type || el.tagName.toLowerCase();
        el.classList.remove('input-focus');
        if (value.length === 0) { el.classList.remove('input-valid', 'input-error'); return null; }
        
        let isValid = true;
        if (type === 'email') isValid = this.validators.email(value);
        else if (type === 'tel') isValid = this.validators.phone(value);
        else isValid = this.validators.minLength(value, 2);
        
        this.highlightInput(el, isValid ? 'valid' : 'error');
        return isValid;
    },

    async submit() {
        const fields = {
            fname: Utils.$('#fname')?.value.trim(),
            lname: Utils.$('#lname')?.value.trim(),
            email: Utils.$('#email')?.value.trim(),
            phone: Utils.$('#phone')?.value.trim(),
            msg: Utils.$('#msg')?.value.trim()
        };
        const statusDiv = Utils.$('#contact-status');
        if (!statusDiv) return;
        
        statusDiv.className = 'text-xs md:text-sm font-bold mt-2';
        
        if (!fields.fname || !fields.lname || !fields.email || !fields.msg) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_required');
            return;
        }
        
        if (!this.validators.email(fields.email)) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_invalid_email');
            return;
        }
        
        if (fields.phone && !this.validators.phone(fields.phone)) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_invalid_phone');
            return;
        }
        
        statusDiv.classList.remove('hidden');
        statusDiv.classList.add('text-websiteBlue');
        statusDiv.innerText = t('form_sending');
        Tracking.event('form_submit', { formId: 'contact' });
        
        try {
            const formData = new FormData();
            Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
            formData.append('lang', Language.current);
            formData.append('env', 'prod');
            
            const fileInput = Utils.$('#attachment');
            if (fileInput?.files?.length > 0) formData.append('attachment', fileInput.files[0]);
            
            const res = await fetch(\`\${CONFIG.apiBase}/contact.php\`, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data?.status === 'ok') {
                statusDiv.classList.remove('text-websiteBlue');
                statusDiv.classList.add('text-green-600');
                statusDiv.innerText = t('form_success');
                ['fname', 'lname', 'email', 'phone', 'msg'].forEach(key => {
                    this.clearCache([key]);
                    const el = Utils.$(\`#\${key}\`);
                    if (el) { el.value = ''; el.classList.remove('input-valid', 'input-error'); }
                });
                if (fileInput) fileInput.value = '';
                Tracking.event('form_success', { formId: 'contact' });
            } else throw new Error('Bad response');
        } catch (err) {
            statusDiv.classList.remove('text-websiteBlue');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_error');
            Tracking.event('form_error', { formId: 'contact', error: err.message });
        }
    },

    init() {
        this.restoreCache();
        ['fname', 'lname', 'email', 'phone', 'msg'].forEach(id => {
            const el = Utils.$(\`#\${id}\`);
            if (el) {
                el.addEventListener('input', () => this.saveCache(id, el.value));
                el.addEventListener('focus', () => this.highlightInput(el, 'focus'));
                el.addEventListener('blur', () => this.validateInput(el));
            }
        });
        const phoneInput = Utils.$('#phone');
        if (phoneInput) phoneInput.addEventListener('input', () => this.formatPhone(phoneInput));
    }
};

// ============================================================================
// NAVIGATION
// ============================================================================

const Navigation = {
    autoRotateTimer: null,
    isPaused: false,
    currentSection: 0,
    totalSections: 8,

    scrollToSection(index, smooth = true) {
        const h = window.innerHeight;
        const behavior = smooth && !Utils.prefersReducedMotion() ? 'smooth' : 'auto';
        window.scrollTo({ top: index * h, behavior });
        this.currentSection = index;
        this.pause();
    },

    pause() {
        this.isPaused = true;
        clearInterval(this.autoRotateTimer);
        if (CONFIG.pauseDuration > 0) {
            setTimeout(() => { this.isPaused = false; this.startAutoRotate(); }, CONFIG.pauseDuration);
        }
    },

    startAutoRotate() {
        if (this.isPaused || Utils.prefersReducedMotion()) return;
        clearInterval(this.autoRotateTimer);
        this.autoRotateTimer = setInterval(() => {
            if (!this.isPaused) {
                this.currentSection = (this.currentSection + 1) % 3;
                this.scrollToSection(this.currentSection);
            }
        }, CONFIG.autoRotateInterval);
    },

    updateDots() {
        const scrollPos = window.scrollY;
        const h = window.innerHeight;
        const dots = Utils.$$('.nav-dot');
        dots.forEach(d => d.classList.remove('active'));
        const activeIndex = Math.round(scrollPos / h);
        if (dots[activeIndex]) {
            dots[activeIndex].classList.add('active');
            this.currentSection = activeIndex;
        }
    },

    toggleMobileMenu() {
        const menu = Utils.$('#mobile-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    toggleDropdown() {
        const dropdown = Utils.$('#dropdown-menu');
        const icon = Utils.$('.dropdown-icon');
        if (!dropdown) return;
        dropdown.classList.toggle('dropdown-closed');
        dropdown.classList.toggle('dropdown-open');
        icon?.classList.toggle('rotate-180');
        Tracking.event('dropdown_toggle', { open: dropdown.classList.contains('dropdown-open') });
    },

    handleOutsideClick(e) {
        const container = Utils.$('#dropdown-container');
        const dropdown = Utils.$('#dropdown-menu');
        if (container && dropdown && !container.contains(e.target)) {
            dropdown.classList.add('dropdown-closed');
            dropdown.classList.remove('dropdown-open');
            Utils.$('.dropdown-icon')?.classList.remove('rotate-180');
        }
    },

    init() {
        Utils.$$('.nav-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => this.scrollToSection(index, true));
        });
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        this.startAutoRotate();
    }
};

// ============================================================================
// ACCORDION & CONTACT SLIDER
// ============================================================================

const Accordion = {
    toggle(btn) {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('.rotate-icon');
        content.classList.toggle('open');
        icon?.classList.toggle('active');
        Tracking.event('accordion_toggle', { question: btn.querySelector('[data-translate]')?.getAttribute('data-translate') });
    }
};

const ContactSlider = {
    slide(index) {
        const track = Utils.$('#contact-slider-track');
        if (track) track.style.transform = index === 1 ? 'translateX(-50%)' : 'translateX(0%)';
    }
};

// ============================================================================
// SCROLL HANDLING
// ============================================================================

const ScrollHandler = {
    lastScrollY: 0,
    
    init() {
        const handler = Utils.throttle(() => this.onScroll(), 16);
        window.addEventListener('scroll', handler, { passive: true });
        
        const scrollBtn = Utils.$('#scroll-top-btn');
        if (scrollBtn) scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    },

    onScroll() {
        const scrollPos = window.scrollY;
        const navbar = Utils.$('#navbar');
        
        if (navbar) {
            if (scrollPos > this.lastScrollY && scrollPos > 100) navbar.style.transform = 'translateY(-40vh)';
            else if (scrollPos < this.lastScrollY - 15 || scrollPos < 50) navbar.style.transform = 'translateY(0)';
        }
        
        this.lastScrollY = scrollPos;
        Navigation.updateDots();
        
        const progressBar = Utils.$('#scroll-progress');
        if (progressBar) {
            const doc = document.documentElement;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const progress = scrollHeight > 0 ? (scrollPos / scrollHeight) * 100 : 0;
            progressBar.style.width = \`\${progress}%\`;
        }
        
        const scrollBtn = Utils.$('#scroll-top-btn');
        if (scrollBtn) scrollBtn.classList.toggle('hidden', scrollPos <= window.innerHeight);
    }
};

// ============================================================================
// SERVICE WORKER
// ============================================================================

const ServiceWorker = {
    register() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/assets/scripts/service.js')
                    .then(reg => console.debug('SW registered:', reg.scope))
                    .catch(err => console.warn('SW registration failed:', err));
            });
        }
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    Session.init();
    Theme.init();
    Language.init();
    Form.init();
    Navigation.init();
    ScrollHandler.init();
    Tracking.trackClicks();
    Tracking.pageView();
    ServiceWorker.register();
    console.info('🔧 Déboucheur Expert loaded | v2.0.0');
});

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.DeboucheurApp = {
    toggleLanguage: () => Language.toggle(),
    t, currentLang: () => Language.current,
    toggleTheme: () => Theme.toggle(),
    isDark: () => Theme.isDark(),
    toggleMobileMenu: () => Navigation.toggleMobileMenu(),
    toggleDropdown: () => Navigation.toggleDropdown(),
    scrollToSection: (index) => Navigation.scrollToSection(index, true),
    toggleAccordion: (btn) => Accordion.toggle(btn),
    slideContact: (index) => ContactSlider.slide(index),
    submitContact: () => Form.submit(),
    saveCache: (key, value) => Form.saveCache(key, value),
    highlightInput: (el) => Form.highlightInput(el, 'focus'),
    validateInput: (el) => Form.validateInput(el),
    formatPhone: (el) => Form.formatPhone(el),
    trackEvent: (type, data) => Tracking.event(type, data),
    Utils, CONFIG
};

// Legacy compatibility aliases
window.toggleLanguage = () => Language.toggle();
window.toggleTheme = () => Theme.toggle();
window.toggleMobileMenu = () => Navigation.toggleMobileMenu();
window.toggleDropdown = () => Navigation.toggleDropdown();
window.toggleAccordion = (btn) => Accordion.toggle(btn);
window.scrollToSection = (index) => Navigation.scrollToSection(index, true);
window.slideContact = (index) => ContactSlider.slide(index);
window.submitContact = () => Form.submit();
window.saveCache = (key, value) => Form.saveCache(key, value);
window.highlightInput = (el) => Form.highlightInput(el, 'focus');
window.validateInput = (el) => Form.validateInput(el);
window.formatPhone = (el) => Form.formatPhone(el);
