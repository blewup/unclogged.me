/**
 * Déboucheur Expert - Scroll Navigation Module
 * Handles dots navigation, auto-scrolling, navbar hide/show
 * @version 1.0.0
 * @author Déboucheur Expert Team
 */

const ScrollModule = (() => {
    // Configuration
    const CONFIG = Object.freeze({
        autoScrollInterval: 12000,      // 12 seconds between auto-scroll
        pauseDuration: 120000,          // 120 seconds (2 min) pause after user interaction
        navbarHideThreshold: 100,       // Pixels scrolled before hiding navbar
        navbarShowThreshold: 15,        // Pixels scrolled up to show navbar
        totalSections: 8,               // Total number of sections (0-7)
        debounceDelay: 100
    });

    // State
    let currentSectionIndex = 0;
    let autoScrollTimer = null;
    let isPaused = false;
    let lastScrollY = 0;
    let mainContent = null;
    let navbar = null;
    let dots = [];

    // DOM helpers
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    /**
     * Debounce utility
     */
    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    /**
     * Scroll to a specific section by index
     */
    const scrollToSection = (index) => {
        const section = $(`#section-${index}`);
        if (section && mainContent) {
            currentSectionIndex = index;
            section.scrollIntoView({ behavior: 'smooth' });
            updateDots(index);
            pauseAutoScroll(); // Pause auto-scroll when user clicks a dot
        }
    };

    /**
     * Update dot navigation active state
     */
    const updateDots = (activeIndex) => {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
    };

    /**
     * Auto-scroll to next section
     */
    const autoScrollNext = () => {
        if (isPaused) return;
        currentSectionIndex = (currentSectionIndex + 1) % CONFIG.totalSections;
        const section = $(`#section-${currentSectionIndex}`);
        if (section && mainContent) {
            section.scrollIntoView({ behavior: 'smooth' });
            updateDots(currentSectionIndex);
        }
    };

    /**
     * Start auto-scroll timer
     */
    const startAutoScroll = () => {
        stopAutoScroll();
        if (!isPaused) {
            autoScrollTimer = setInterval(autoScrollNext, CONFIG.autoScrollInterval);
        }
    };

    /**
     * Stop auto-scroll timer
     */
    const stopAutoScroll = () => {
        if (autoScrollTimer) {
            clearInterval(autoScrollTimer);
            autoScrollTimer = null;
        }
    };

    /**
     * Pause auto-scroll for the configured duration (120 seconds)
     */
    const pauseAutoScroll = () => {
        isPaused = true;
        stopAutoScroll();
        console.debug('Auto-scroll paused for 120 seconds');
        setTimeout(() => {
            isPaused = false;
            startAutoScroll();
            console.debug('Auto-scroll resumed');
        }, CONFIG.pauseDuration);
    };

    /**
     * Handle scroll reveal effects for elements with .reveal-on-scroll class
     */
    const handleScrollReveal = () => {
        const revealElements = $$('.reveal-on-scroll');
        const scrollFadeElements = $$('.scroll-fade');
        const windowHeight = window.innerHeight;
        
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const revealPoint = windowHeight * 0.85;
            
            if (elementTop < revealPoint) {
                el.classList.add('revealed');
            }
        });
        
        scrollFadeElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementBottom = el.getBoundingClientRect().bottom;
            const viewCenter = windowHeight * 0.5;
            
            // Element is in center of viewport
            if (elementTop < viewCenter && elementBottom > viewCenter) {
                el.classList.add('in-view');
            } else {
                el.classList.remove('in-view');
            }
        });
    };

    /**
     * Handle scroll events on main content
     */
    const handleScroll = () => {
        if (!mainContent) return;

        const scrollPos = mainContent.scrollTop;
        const sectionHeight = window.innerHeight;

        // Update current section index based on scroll position
        const newIndex = Math.round(scrollPos / sectionHeight);
        if (newIndex !== currentSectionIndex && newIndex >= 0 && newIndex < CONFIG.totalSections) {
            currentSectionIndex = newIndex;
            updateDots(currentSectionIndex);
        }

        // Navbar hide/show logic
        handleNavbarVisibility(scrollPos);
        
        // Scroll reveal effects
        handleScrollReveal();

        lastScrollY = scrollPos;
    };

    /**
     * Handle navbar visibility based on scroll direction
     */
    const handleNavbarVisibility = (scrollPos) => {
        if (!navbar) return;

        // Scrolling down - hide navbar
        if (scrollPos > lastScrollY && scrollPos > CONFIG.navbarHideThreshold) {
            navbar.style.transform = 'translateY(-100%)';
        }
        // Scrolling up - show navbar
        else if (scrollPos < lastScrollY - CONFIG.navbarShowThreshold || scrollPos < 50) {
            navbar.style.transform = 'translateY(0)';
        }
    };

    /**
     * Handle wheel event to detect user scrolling
     */
    const handleWheel = () => {
        pauseAutoScroll();
    };

    /**
     * Handle touch events for mobile
     */
    const handleTouchStart = () => {
        pauseAutoScroll();
    };

    /**
     * Initialize the scroll module
     */
    const init = () => {
        mainContent = $('#main-content');
        navbar = $('#navbar');
        dots = Array.from($$('.dot-btn'));

        if (!mainContent) {
            console.warn('ScrollModule: #main-content not found');
            return;
        }

        // Add scroll listener with debounce
        mainContent.addEventListener('scroll', debounce(handleScroll, CONFIG.debounceDelay));

        // Add wheel listener to detect manual scrolling
        mainContent.addEventListener('wheel', handleWheel, { passive: true });

        // Add touch listener for mobile
        mainContent.addEventListener('touchstart', handleTouchStart, { passive: true });

        // Add click handlers to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                scrollToSection(index);
            });
        });

        // Start auto-scroll
        startAutoScroll();

        console.debug('ScrollModule initialized');
    };

    // Expose scrollToSection globally for onclick handlers
    window.scrollToSection = scrollToSection;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for components to load
            setTimeout(init, 500);
        });
    } else {
        setTimeout(init, 500);
    }

    // Public API
    return {
        init,
        scrollToSection,
        pauseAutoScroll,
        startAutoScroll,
        stopAutoScroll,
        getCurrentSection: () => currentSectionIndex
    };
})();

// Global export
window.ScrollModule = ScrollModule;
