/**
 * Déboucheur Expert - Shared Components Module
 * Reusable HTML components for navbar, hero, and footer
 * @version 2.0.0
 * @author Déboucheur Expert Team
 */

const SharedComponents = (() => {
    // Configuration
    const CONFIG = Object.freeze({
        siteName: 'Déboucheur Expert',
        siteNameEn: 'Unclogged.me',
        phone: {
            primary: '(438) 530-2343',
            primaryTel: '+14385302343',
            secondary: '(438) 765-7040',
            secondaryTel: '+14387657040'
        },
        email: {
            fr: 'info@deboucheur.expert',
            en: 'info@unclogged.me'
        },
        address: '290 Rue Lord #01, Napierville, QC J0J 1L0',
        social: {
            facebook: '#',
            linkedin: '#',
            google: '#'
        }
    });

    // Determine path prefix based on current location
    const getPathPrefix = () => {
        const path = window.location.pathname;
        if (path.includes('/pages/plumbing/')) return '../../';
        if (path.includes('/pages/') || path.includes('/errors/')) return '../';
        return '';
    };

    // SVG Icons
    const Icons = {
        sun: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>`,
        moon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`,
        bars: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`,
        chevronDown: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`,
        phone: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>`,
        facebook: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
        linkedin: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
        google: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`
    };

    // Generate navbar HTML
    const getNavbar = (options = {}) => {
        const prefix = getPathPrefix();
        const indexPath = prefix || './';
        
        return `
        <nav id="navbar" class="fixed z-50 rounded-l-xl border-l border-b border-white/10 shadow-2xl nav-glass bg-lightBase/90 dark:bg-darkBase/90 transition-transform duration-300"
             style="height: 12vh; left: 6vw; top: 2vh; right: 0;">
            <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div class="flex items-center justify-between h-full">
                    <div class="hidden md:flex items-center justify-start space-x-8 w-full pl-4">
                        <a href="${prefix}pages/prices.html" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all" data-translate="nav_tarifs">TARIFICATION</a>
                        <a href="${prefix}pages/plumbing.html" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all" data-translate="nav_guide">GUIDE</a>
                        <a href="${prefix}pages/events.html" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all" data-translate="nav_calendar">CALENDRIER</a>
                        <a href="${prefix}pages/team.html" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all" data-translate="nav_team">ÉQUIPE</a>
                        <a href="${indexPath}index.html#contact" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all" data-translate="nav_contact">CONTACT</a>
                        <div class="relative" id="dropdown-container">
                            <button onclick="toggleDropdown()" class="nav-link font-ops text-xl text-gray-600 dark:text-gray-300 hover:text-blue hover:scale-[1.025] transition-all flex items-center gap-2">
                                <span data-translate="nav_more">PLUS</span>
                                ${Icons.chevronDown}
                            </button>
                            <div id="dropdown-menu" class="absolute top-full right-0 mt-2 w-[20vw] min-w-[200px] bg-lightBase dark:bg-darkAlt border border-white/10 rounded-xl shadow-2xl overflow-hidden dropdown-closed">
                                <div class="dropdown-content py-2">
                                    <a href="${prefix}pages/tools.html" class="block px-6 py-3 font-ops text-sm text-gray-700 dark:text-gray-200 hover:bg-blue/10 hover:text-blue transition-all">OUTILS</a>
                                    <a href="${prefix}pages/politics.html" class="block px-6 py-3 font-ops text-sm text-gray-700 dark:text-gray-200 hover:bg-blue/10 hover:text-blue transition-all">CONFIDENTIALITÉ</a>
                                    <a href="${prefix}pages/conditions.html" class="block px-6 py-3 font-ops text-sm text-gray-700 dark:text-gray-200 hover:bg-blue/10 hover:text-blue transition-all">CONDITIONS</a>
                                    <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                    <a href="${indexPath}index.html#map-section" class="block px-6 py-3 font-ops text-sm text-gray-700 dark:text-gray-200 hover:bg-blue/10 hover:text-blue transition-all">${Icons.phone} LOCALISATION</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-center justify-center space-y-2 ml-4 shrink-0">
                        <button onclick="toggleTheme()" class="hover:scale-110 transition-transform" aria-label="Toggle theme">
                            <span class="hidden dark:block text-yellow-400">${Icons.sun}</span>
                            <span class="block dark:hidden text-purple-600">${Icons.moon}</span>
                        </button>
                        <button onclick="toggleLanguage()" class="text-gray-600 dark:text-white font-ops text-xs hover:scale-110 transition-transform">
                            <span id="lang-display">EN</span>
                        </button>
                    </div>
                    <div class="md:hidden flex items-center ml-4">
                        <button onclick="toggleMobileMenu()" class="text-gray-600 dark:text-white hover:text-blue focus:outline-none" aria-label="Menu">
                            ${Icons.bars}
                        </button>
                    </div>
                </div>
            </div>
            <div class="hidden md:hidden bg-lightBase dark:bg-darkBase border-t border-gray-700 absolute right-0 top-[12vh] box-radius shadow-lg w-auto min-w-[200px]" id="mobile-menu">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <a href="${prefix}pages/prices.html" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">TARIFICATION</a>
                    <a href="${prefix}pages/plumbing.html" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">GUIDE</a>
                    <a href="${prefix}pages/events.html" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">CALENDRIER</a>
                    <a href="${indexPath}index.html#contact" class="font-ops text-blue block px-3 py-2 text-lg">CONTACT</a>
                    <a href="${prefix}pages/team.html" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">ÉQUIPE</a>
                    <a href="${prefix}pages/tools.html" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">OUTILS</a>
                    <a href="${indexPath}index.html#map-section" class="font-ops text-gray-700 dark:text-gray-200 block px-3 py-2 text-lg hover:text-blue">LOCALISATION</a>
                </div>
            </div>
        </nav>`;
    };

    // Generate hero slideshow HTML
    const getHero = (options = {}) => {
        const prefix = getPathPrefix();
        const slides = options.slides || [11, 12, 13, 14, 15, 16];
        
        return `
        <div id="hero-slideshow" class="absolute inset-0 z-0">
            ${slides.map((num, i) => `
                <div class="hero-slide ${i === 0 ? 'active' : ''}" 
                     style="background-image: url('${prefix}assets/images/slide/slide_${String(num).padStart(2, '0')}.webp')"></div>
            `).join('')}
        </div>
        <div class="absolute inset-0 bg-black/50 z-10"></div>`;
    };

    // Generate footer HTML
    const getFooter = (options = {}) => {
        const prefix = getPathPrefix();
        const indexPath = prefix || './';
        
        return `
        <footer class="bg-lightBase dark:bg-darkBase border-t border-gray-800 text-gray-600 dark:text-gray-400 relative" style="height: 10vh;">
            <div class="max-w-full mx-auto px-4 h-full flex flex-col md:flex-row items-center justify-between text-xs md:text-sm relative">
                <div class="md:absolute md:left-4 md:bottom-2 text-left z-10 hidden md:block">
                    <h4 class="font-impact text-gray-900 dark:text-white text-[2.16rem]">BILLY ST-HILAIRE</h4>
                    <p class="mt-1 text-[10px]">&copy; ${new Date().getFullYear()} Billy le deboucheur</p>
                </div>
                <div class="flex-grow flex justify-center gap-6 pr-[8vw]">
                    <a href="${CONFIG.social.facebook}" class="text-blue-600 hover:scale-125 transition-transform" aria-label="Facebook">${Icons.facebook}</a>
                    <a href="${CONFIG.social.linkedin}" class="text-blue-400 hover:scale-125 transition-transform" aria-label="LinkedIn">${Icons.linkedin}</a>
                    <a href="${CONFIG.social.google}" class="text-red-500 hover:scale-125 transition-transform" aria-label="Google">${Icons.google}</a>
                </div>
                <div class="md:absolute md:right-[5px] flex items-center gap-4">
                    <a href="${prefix}pages/politics.html" class="hover:text-blue transition-colors">Politique de confidentialité</a>
                    <a href="${prefix}pages/conditions.html" class="hover:text-blue transition-colors">Conditions</a>
                    <a href="${prefix}pages/team.html" class="hover:text-blue transition-colors">Équipe</a>
                    <a href="${prefix}pages/tools.html" class="hover:text-blue transition-colors">Outils</a>
                    <a href="${prefix}pages/calendar.html" class="hover:text-blue transition-colors">Disponibilités</a>
                    <a href="${prefix}pages/plumbing.html" class="hover:text-blue transition-colors">Plomberie</a>
                </div>
            </div>
        </footer>`;
    };

    // Initialize components
    const init = () => {
        // Inject navbar if placeholder exists
        const navbarPlaceholder = document.getElementById('navbar-placeholder');
        if (navbarPlaceholder) navbarPlaceholder.outerHTML = getNavbar();

        // Inject hero if placeholder exists
        const heroPlaceholder = document.getElementById('hero-placeholder');
        if (heroPlaceholder) heroPlaceholder.outerHTML = getHero();

        // Inject footer if placeholder exists
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) footerPlaceholder.outerHTML = getFooter();

        console.debug('SharedComponents initialized');
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init,
        getNavbar,
        getHero,
        getFooter,
        getPathPrefix,
        CONFIG,
        Icons
    };
})();

// Global export
window.SharedComponents = SharedComponents;
