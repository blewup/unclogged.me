/**
 * Déboucheur Expert - Montreal Time Widget
 * Real-time clock widget showing Montreal/Eastern time
 * With business hours status indicator
 * @version 1.0.0
 * @author Déboucheur Expert Team
 */

const TimeWidget = (() => {
    // Configuration
    const CONFIG = {
        timezone: 'America/Montreal',
        updateInterval: 1000,
        businessHours: {
            weekday: { open: 8, close: 18 },
            weekend: { open: 8, close: 17 }
        }
    };
    
    // State
    let container = null;
    let intervalId = null;
    let currentLang = 'fr';
    
    // Translations
    const i18n = {
        fr: {
            open: 'Ouvert',
            closed: 'Fermé',
            openAt: 'Ouvre à',
            closesAt: 'Ferme à',
            tomorrow: 'demain',
            emergency: 'Urgence 24/7',
            days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
            months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        },
        en: {
            open: 'Open',
            closed: 'Closed',
            openAt: 'Opens at',
            closesAt: 'Closes at',
            tomorrow: 'tomorrow',
            emergency: 'Emergency 24/7',
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        }
    };
    
    /**
     * Get current Montreal time using Day.js or fallback
     */
    const getMontrealTime = () => {
        if (window.MontrealTime && window.MontrealTime.ready) {
            return window.MontrealTime.now();
        }
        
        // Fallback using native Date with timezone
        const now = new Date();
        const options = { timeZone: CONFIG.timezone };
        
        return {
            hour: () => parseInt(now.toLocaleString('en-US', { ...options, hour: 'numeric', hour12: false })),
            minute: () => parseInt(now.toLocaleString('en-US', { ...options, minute: 'numeric' })),
            second: () => parseInt(now.toLocaleString('en-US', { ...options, second: 'numeric' })),
            day: () => now.toLocaleString('en-US', { ...options, weekday: 'long' }) === 'Sunday' ? 0 :
                       now.toLocaleString('en-US', { ...options, weekday: 'long' }) === 'Saturday' ? 6 :
                       [1, 2, 3, 4, 5][['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(
                           now.toLocaleString('en-US', { ...options, weekday: 'long' })
                       )],
            date: () => parseInt(now.toLocaleString('en-US', { ...options, day: 'numeric' })),
            month: () => parseInt(now.toLocaleString('en-US', { ...options, month: 'numeric' })) - 1,
            year: () => parseInt(now.toLocaleString('en-US', { ...options, year: 'numeric' })),
            format: (fmt) => {
                const h = now.toLocaleString('en-US', { ...options, hour: '2-digit', hour12: false });
                const m = now.toLocaleString('en-US', { ...options, minute: '2-digit' });
                const s = now.toLocaleString('en-US', { ...options, second: '2-digit' });
                if (fmt === 'HH:mm:ss') return `${h}:${m}:${s}`;
                return `${h}:${m}`;
            }
        };
    };
    
    /**
     * Check if currently within business hours
     */
    const isBusinessOpen = () => {
        const now = getMontrealTime();
        const day = now.day();
        const hour = now.hour();
        
        const isWeekend = day === 0 || day === 6;
        const hours = isWeekend ? CONFIG.businessHours.weekend : CONFIG.businessHours.weekday;
        
        return hour >= hours.open && hour < hours.close;
    };
    
    /**
     * Get business status text
     */
    const getStatusText = () => {
        const t = i18n[currentLang];
        const now = getMontrealTime();
        const day = now.day();
        const hour = now.hour();
        
        const isWeekend = day === 0 || day === 6;
        const hours = isWeekend ? CONFIG.businessHours.weekend : CONFIG.businessHours.weekday;
        
        if (isBusinessOpen()) {
            return `${t.closesAt} ${hours.close}:00`;
        }
        
        if (hour < hours.open) {
            return `${t.openAt} ${hours.open}:00`;
        }
        
        return `${t.openAt} 8:00 ${t.tomorrow}`;
    };
    
    /**
     * Format date string
     */
    const formatDate = () => {
        const now = getMontrealTime();
        const t = i18n[currentLang];
        
        if (window.MontrealTime && window.MontrealTime.ready) {
            return now.format(currentLang === 'fr' ? 'dddd D MMMM YYYY' : 'dddd, MMMM D, YYYY');
        }
        
        // Fallback formatting
        const day = t.days[now.day()];
        const date = now.date();
        const month = t.months[now.month()];
        const year = now.year();
        
        return currentLang === 'fr' 
            ? `${day} ${date} ${month} ${year}`
            : `${day}, ${month} ${date}, ${year}`;
    };
    
    /**
     * Render the widget HTML
     */
    const render = () => {
        if (!container) return;
        
        const now = getMontrealTime();
        const time = now.format('HH:mm:ss');
        const date = formatDate();
        const isOpen = isBusinessOpen();
        const statusText = getStatusText();
        const t = i18n[currentLang];
        
        container.innerHTML = `
            <div class="montreal-clock flex flex-col items-center gap-1 text-center">
                <div class="montreal-clock-time text-blue dark:text-blue-400">
                    ${time}
                </div>
                <div class="montreal-clock-date text-gray-600 dark:text-gray-400 capitalize">
                    ${date}
                </div>
                <div class="business-status ${isOpen ? 'open' : 'closed'} mt-1">
                    ${isOpen ? t.open : t.closed}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    ${statusText}
                </div>
                <a href="tel:+14385302343" class="text-xs text-cardinal hover:underline font-bold mt-1">
                    📞 ${t.emergency}
                </a>
            </div>
        `;
    };
    
    /**
     * Initialize the widget
     * @param {string|HTMLElement} selector - Container selector or element
     * @param {object} options - Configuration options
     */
    const init = (selector, options = {}) => {
        // Get container
        container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
        
        if (!container) {
            console.warn('TimeWidget: Container not found');
            return false;
        }
        
        // Get current language
        currentLang = localStorage.getItem('language') || 
                      (document.documentElement.lang?.startsWith('en') ? 'en' : 'fr');
        
        // Initial render
        render();
        
        // Start update interval
        intervalId = setInterval(render, CONFIG.updateInterval);
        
        // Listen for language changes
        window.addEventListener('language-changed', (e) => {
            currentLang = e.detail || 'fr';
            render();
        });
        
        // Listen for libs ready event (Day.js)
        window.addEventListener('libs-ready', () => {
            if (window.MontrealTime) {
                window.MontrealTime.setLocale(currentLang);
            }
            render();
        });
        
        return true;
    };
    
    /**
     * Destroy the widget
     */
    const destroy = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (container) {
            container.innerHTML = '';
            container = null;
        }
    };
    
    /**
     * Create widget HTML for insertion
     */
    const createHTML = () => {
        return `
            <div id="montreal-time-widget" 
                 class="fixed top-[14vh] left-4 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-lg 
                        border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3
                        hidden lg:block transition-all hover:shadow-xl">
                <div id="montreal-clock-container"></div>
            </div>
        `;
    };
    
    /**
     * Auto-inject widget into page
     */
    const inject = () => {
        // Check if already injected
        if (document.getElementById('montreal-time-widget')) {
            init('#montreal-clock-container');
            return;
        }
        
        // Create widget element
        const wrapper = document.createElement('div');
        wrapper.innerHTML = createHTML();
        document.body.appendChild(wrapper.firstElementChild);
        
        // Initialize
        init('#montreal-clock-container');
    };
    
    // Public API
    return {
        init,
        destroy,
        inject,
        createHTML,
        isBusinessOpen,
        getStatusText,
        getMontrealTime
    };
})();

// Export to global scope
window.TimeWidget = TimeWidget;

// Auto-inject if data attribute is present on body
if (document.body?.hasAttribute('data-time-widget') || 
    document.querySelector('[data-time-widget]')) {
    document.addEventListener('DOMContentLoaded', () => TimeWidget.inject());
}

// Also update navbar clock elements if they exist
document.addEventListener('DOMContentLoaded', () => {
    const clockEl = document.getElementById('navbar-clock');
    const dateEl = document.getElementById('navbar-date');
    
    if (clockEl || dateEl) {
        const updateNavbarTime = () => {
            try {
                const now = TimeWidget.getMontrealTime();
                if (clockEl) {
                    clockEl.textContent = now.format('HH:mm');
                }
                if (dateEl) {
                    const lang = localStorage.getItem('language') || 'fr';
                    const options = { timeZone: 'America/Montreal', weekday: 'short', day: 'numeric', month: 'short' };
                    dateEl.textContent = new Date().toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', options);
                }
            } catch (e) {
                // Fallback if TimeWidget not ready
                const now = new Date();
                const options = { timeZone: 'America/Montreal' };
                if (clockEl) {
                    clockEl.textContent = now.toLocaleTimeString('en-US', { ...options, hour: '2-digit', minute: '2-digit', hour12: false });
                }
                if (dateEl) {
                    const lang = localStorage.getItem('language') || 'fr';
                    dateEl.textContent = now.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { ...options, weekday: 'short', day: 'numeric', month: 'short' });
                }
            }
        };
        
        updateNavbarTime();
        setInterval(updateNavbarTime, 1000);
    }
});
