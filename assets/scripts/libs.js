/**
 * Déboucheur Expert - Core Libraries Loader
 * Lightweight library integrations: Alpine.js, Day.js, enhanced fetch
 * @version 1.0.0
 * @author Déboucheur Expert Team
 * 
 * Libraries included:
 * - Alpine.js 3.x (reactive components) ~15KB gzipped
 * - Day.js 1.x (date/time with timezone) ~2KB + plugins
 * - Native Fetch wrapper with retry logic
 * 
 * All libraries are loaded from CDN with fallback support
 */

// ============================================================================
// LIBRARY CONFIGURATION
// ============================================================================

const LibsConfig = Object.freeze({
    // Montreal timezone (Eastern Time)
    timezone: 'America/Montreal',
    timezoneOffset: -5, // EST (changes to -4 during EDT)
    
    // CDN URLs with SRI hashes for security
    cdn: {
        alpine: 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js',
        dayjs: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js',
        dayjsTimezone: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/plugin/timezone.js',
        dayjsUtc: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/plugin/utc.js',
        dayjsRelativeTime: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/plugin/relativeTime.js',
        dayjsLocaleFr: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/locale/fr.js'
    },
    
    // Load retry settings
    maxRetries: 3,
    retryDelay: 1000
});

// ============================================================================
// SCRIPT LOADER UTILITY
// ============================================================================

const ScriptLoader = {
    loaded: new Set(),
    loading: new Map(),
    
    /**
     * Load a script from URL with retry support
     * @param {string} url - Script URL
     * @param {object} options - Options (async, defer, id, integrity)
     * @returns {Promise<void>}
     */
    async load(url, options = {}) {
        // Return immediately if already loaded
        if (this.loaded.has(url)) {
            return Promise.resolve();
        }
        
        // Return existing promise if currently loading
        if (this.loading.has(url)) {
            return this.loading.get(url);
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = options.async !== false;
            if (options.defer) script.defer = true;
            if (options.id) script.id = options.id;
            if (options.integrity) {
                script.integrity = options.integrity;
                script.crossOrigin = 'anonymous';
            }
            
            script.onload = () => {
                this.loaded.add(url);
                this.loading.delete(url);
                resolve();
            };
            
            script.onerror = () => {
                this.loading.delete(url);
                reject(new Error(`Failed to load script: ${url}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loading.set(url, promise);
        return promise;
    },
    
    /**
     * Load script with retry logic
     */
    async loadWithRetry(url, options = {}, retries = LibsConfig.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.load(url, options);
                return;
            } catch (error) {
                if (attempt === retries) throw error;
                await new Promise(r => setTimeout(r, LibsConfig.retryDelay * attempt));
                console.warn(`Retry ${attempt}/${retries} for ${url}`);
            }
        }
    }
};

// ============================================================================
// ALPINE.JS INTEGRATION
// ============================================================================

const AlpineIntegration = {
    ready: false,
    
    /**
     * Initialize Alpine.js with custom data stores and components
     */
    async init() {
        try {
            // Load Alpine.js
            await ScriptLoader.loadWithRetry(LibsConfig.cdn.alpine, { defer: true });
            
            // Wait for Alpine to be available
            await this.waitForAlpine();
            
            // Register custom stores
            this.registerStores();
            
            // Register custom directives
            this.registerDirectives();
            
            this.ready = true;
            console.debug('Alpine.js initialized');
            return true;
        } catch (error) {
            console.error('Alpine.js initialization failed:', error);
            return false;
        }
    },
    
    waitForAlpine(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (window.Alpine) {
                resolve(window.Alpine);
                return;
            }
            
            const start = Date.now();
            const check = () => {
                if (window.Alpine) {
                    resolve(window.Alpine);
                } else if (Date.now() - start > timeout) {
                    reject(new Error('Alpine.js load timeout'));
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    },
    
    registerStores() {
        if (!window.Alpine) return;
        
        // Theme store
        Alpine.store('theme', {
            dark: document.documentElement.classList.contains('dark'),
            toggle() {
                this.dark = !this.dark;
                document.documentElement.classList.toggle('dark', this.dark);
                localStorage.setItem('theme', this.dark ? 'dark' : 'light');
            }
        });
        
        // Language store
        Alpine.store('lang', {
            current: localStorage.getItem('language') || 'fr',
            toggle() {
                this.current = this.current === 'fr' ? 'en' : 'fr';
                localStorage.setItem('language', this.current);
                document.documentElement.lang = this.current;
                // Trigger translation update
                window.dispatchEvent(new CustomEvent('language-changed', { detail: this.current }));
            }
        });
        
        // Montreal time store
        Alpine.store('time', {
            current: '',
            date: '',
            isOpen: false,
            init() {
                this.update();
                setInterval(() => this.update(), 1000);
            },
            update() {
                if (window.MontrealTime) {
                    const now = MontrealTime.now();
                    this.current = now.format('HH:mm:ss');
                    this.date = now.format('dddd, D MMMM YYYY');
                    this.isOpen = MontrealTime.isBusinessOpen();
                }
            }
        });
        
        // UI state store
        Alpine.store('ui', {
            mobileMenuOpen: false,
            dropdownOpen: false,
            chatOpen: false,
            modalOpen: false,
            
            toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; },
            toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; },
            toggleChat() { this.chatOpen = !this.chatOpen; },
            openModal() { this.modalOpen = true; },
            closeModal() { this.modalOpen = false; }
        });
    },
    
    registerDirectives() {
        if (!window.Alpine) return;
        
        // x-tooltip directive
        Alpine.directive('tooltip', (el, { expression }) => {
            el.setAttribute('title', expression);
            el.classList.add('cursor-help');
        });
        
        // x-animate directive for scroll-triggered animations
        Alpine.directive('animate', (el, { value, expression }) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        el.classList.add(expression || 'animate-fadeIn');
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.1 });
            observer.observe(el);
        });
    }
};

// ============================================================================
// DAY.JS INTEGRATION - MONTREAL TIMEZONE
// ============================================================================

const MontrealTime = {
    ready: false,
    dayjs: null,
    
    /**
     * Initialize Day.js with timezone support for Montreal
     */
    async init() {
        try {
            // Load Day.js core
            await ScriptLoader.loadWithRetry(LibsConfig.cdn.dayjs);
            
            // Load plugins in parallel
            await Promise.all([
                ScriptLoader.loadWithRetry(LibsConfig.cdn.dayjsUtc),
                ScriptLoader.loadWithRetry(LibsConfig.cdn.dayjsTimezone),
                ScriptLoader.loadWithRetry(LibsConfig.cdn.dayjsRelativeTime),
                ScriptLoader.loadWithRetry(LibsConfig.cdn.dayjsLocaleFr)
            ]);
            
            // Wait for dayjs to be available
            await this.waitForDayjs();
            
            // Configure Day.js
            this.configure();
            
            this.ready = true;
            console.debug('Day.js initialized with Montreal timezone');
            return true;
        } catch (error) {
            console.error('Day.js initialization failed:', error);
            return false;
        }
    },
    
    waitForDayjs(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (window.dayjs) {
                resolve(window.dayjs);
                return;
            }
            
            const start = Date.now();
            const check = () => {
                if (window.dayjs) {
                    resolve(window.dayjs);
                } else if (Date.now() - start > timeout) {
                    reject(new Error('Day.js load timeout'));
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    },
    
    configure() {
        this.dayjs = window.dayjs;
        
        // Extend with plugins
        if (window.dayjs_plugin_utc) dayjs.extend(window.dayjs_plugin_utc);
        if (window.dayjs_plugin_timezone) dayjs.extend(window.dayjs_plugin_timezone);
        if (window.dayjs_plugin_relativeTime) dayjs.extend(window.dayjs_plugin_relativeTime);
        
        // Set default timezone to Montreal
        dayjs.tz.setDefault(LibsConfig.timezone);
        
        // Set locale based on current language
        const lang = localStorage.getItem('language') || 'fr';
        dayjs.locale(lang);
    },
    
    /**
     * Get current Montreal time
     * @returns {dayjs.Dayjs}
     */
    now() {
        return this.dayjs ? this.dayjs().tz(LibsConfig.timezone) : null;
    },
    
    /**
     * Format a date in Montreal timezone
     * @param {Date|string|number} date - Date to format
     * @param {string} format - Output format
     * @returns {string}
     */
    format(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!this.dayjs) return '';
        return this.dayjs(date).tz(LibsConfig.timezone).format(format);
    },
    
    /**
     * Get relative time from now (e.g., "2 hours ago")
     * @param {Date|string|number} date 
     * @returns {string}
     */
    fromNow(date) {
        if (!this.dayjs) return '';
        return this.dayjs(date).tz(LibsConfig.timezone).fromNow();
    },
    
    /**
     * Check if current time is within business hours
     * Business hours: Mon-Fri 8:00-18:00, Sat-Sun 8:00-17:00
     * @returns {boolean}
     */
    isBusinessOpen() {
        const now = this.now();
        if (!now) return false;
        
        const day = now.day(); // 0 = Sunday, 6 = Saturday
        const hour = now.hour();
        
        // Sunday = 0, Saturday = 6
        if (day === 0 || day === 6) {
            return hour >= 8 && hour < 17;
        }
        
        // Weekdays
        return hour >= 8 && hour < 18;
    },
    
    /**
     * Get next available business time
     * @returns {string}
     */
    getNextOpenTime() {
        const now = this.now();
        if (!now) return '';
        
        const day = now.day();
        const hour = now.hour();
        
        // If currently open, return current time
        if (this.isBusinessOpen()) {
            const lang = localStorage.getItem('language') || 'fr';
            return lang === 'fr' ? 'Ouvert maintenant' : 'Open now';
        }
        
        // Calculate next open time
        let nextOpen;
        if (hour >= 18 || (hour >= 17 && (day === 0 || day === 6))) {
            // After hours today, open tomorrow
            nextOpen = now.add(1, 'day').hour(8).minute(0);
        } else if (hour < 8) {
            // Before opening today
            nextOpen = now.hour(8).minute(0);
        }
        
        const lang = localStorage.getItem('language') || 'fr';
        if (lang === 'fr') {
            return `Ouvre ${nextOpen.format('dddd')} à 8h00`;
        }
        return `Opens ${nextOpen.format('dddd')} at 8:00 AM`;
    },
    
    /**
     * Update locale when language changes
     */
    setLocale(locale) {
        if (this.dayjs) {
            this.dayjs.locale(locale);
        }
    }
};

// ============================================================================
// ENHANCED FETCH WRAPPER
// ============================================================================

const Http = {
    defaultOptions: {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        headers: {
            'Content-Type': 'application/json'
        }
    },
    
    /**
     * Fetch wrapper with timeout, retry, and error handling
     * @param {string} url - Request URL
     * @param {object} options - Fetch options plus timeout, retries
     * @returns {Promise<Response>}
     */
    async fetch(url, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const { timeout, retries, retryDelay, ...fetchOptions } = config;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok && attempt < retries) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                return response;
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                
                if (error.name === 'AbortError') {
                    console.warn(`Request timeout, retry ${attempt}/${retries}`);
                } else {
                    console.warn(`Request failed, retry ${attempt}/${retries}:`, error.message);
                }
                
                await new Promise(r => setTimeout(r, retryDelay * attempt));
            }
        }
    },
    
    /**
     * GET request with JSON parsing
     */
    async get(url, options = {}) {
        const response = await this.fetch(url, { ...options, method: 'GET' });
        return response.json();
    },
    
    /**
     * POST request with JSON body
     */
    async post(url, data, options = {}) {
        const response = await this.fetch(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    /**
     * POST with FormData (for file uploads)
     */
    async postForm(url, formData, options = {}) {
        const { headers, ...rest } = options;
        const response = await this.fetch(url, {
            ...rest,
            method: 'POST',
            body: formData,
            headers: { ...headers } // Remove Content-Type for FormData
        });
        delete response.headers?.['Content-Type']; // Let browser set multipart boundary
        return response.json();
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

const Libs = {
    ready: false,
    
    /**
     * Initialize all libraries
     */
    async init() {
        try {
            console.debug('Loading libraries...');
            
            // Load Day.js first (smaller, faster)
            await MontrealTime.init();
            
            // Initialize Alpine.js (deferred, runs after DOM ready)
            // Alpine auto-initializes when the script loads with defer
            await AlpineIntegration.init();
            
            this.ready = true;
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('libs-ready', {
                detail: {
                    alpine: AlpineIntegration.ready,
                    dayjs: MontrealTime.ready
                }
            }));
            
            console.info('📚 Libraries loaded successfully');
            return true;
        } catch (error) {
            console.error('Library initialization failed:', error);
            return false;
        }
    }
};

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.Libs = Libs;
window.MontrealTime = MontrealTime;
window.Http = Http;
window.ScriptLoader = ScriptLoader;
window.LibsConfig = LibsConfig;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Libs.init());
} else {
    Libs.init();
}
