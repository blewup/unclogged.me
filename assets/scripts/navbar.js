/**
 * Déboucheur Expert - Navbar Scroll Hide/Show Logic
 * Hides navbar on scroll down, shows on scroll up
 * 
 * Usage: Import this script after the navbar component is loaded
 * <script src="assets/scripts/navbar.js" defer></script>
 */

const NavbarModule = (function() {
    'use strict';
    
    // Configuration
    const config = {
        navbarId: 'navbar',
        scrollThreshold: 50,       // Minimum scroll before hide/show triggers
        hideClass: '-translate-y-full',
        showClass: 'translate-y-0',
        transitionDuration: 300,   // ms - matches CSS transition
        debounceDelay: 10          // ms - debounce scroll events
    };
    
    // State
    let navbar = null;
    let lastScrollY = 0;
    let isHidden = false;
    let ticking = false;
    let scrollContainer = null;
    
    /**
     * Initialize the navbar scroll behavior
     */
    const init = () => {
        // Find navbar element - retry if not found (for dynamic loading)
        navbar = document.getElementById(config.navbarId);
        
        if (!navbar) {
            // Retry after delay for dynamically loaded navbar
            setTimeout(init, 200);
            return;
        }
        
        // Find the scroll container (main-content for snap scroll, or window)
        scrollContainer = document.getElementById('main-content') || window;
        
        // Ensure navbar has transition classes
        navbar.classList.add('transition-transform', 'duration-300');
        
        // Bind scroll listener
        if (scrollContainer === window) {
            window.addEventListener('scroll', onScroll, { passive: true });
        } else {
            scrollContainer.addEventListener('scroll', onScroll, { passive: true });
        }
        
        // Initial state
        lastScrollY = getScrollY();
        
        console.debug('NavbarModule initialized');
    };
    
    /**
     * Get current scroll position
     */
    const getScrollY = () => {
        if (scrollContainer === window) {
            return window.scrollY || window.pageYOffset || 0;
        }
        return scrollContainer.scrollTop || 0;
    };
    
    /**
     * Handle scroll event with requestAnimationFrame for performance
     */
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    };
    
    /**
     * Update navbar visibility based on scroll direction
     */
    const updateNavbar = () => {
        ticking = false;
        
        if (!navbar) return;
        
        const currentScrollY = getScrollY();
        const scrollDelta = currentScrollY - lastScrollY;
        
        // Only trigger if scrolled past threshold
        if (Math.abs(scrollDelta) < config.scrollThreshold) {
            return;
        }
        
        // At top of page - always show
        if (currentScrollY < config.scrollThreshold) {
            show();
            lastScrollY = currentScrollY;
            return;
        }
        
        // Scrolling down - hide navbar
        if (scrollDelta > 0 && !isHidden) {
            hide();
        }
        // Scrolling up - show navbar
        else if (scrollDelta < 0 && isHidden) {
            show();
        }
        
        lastScrollY = currentScrollY;
    };
    
    /**
     * Hide the navbar
     */
    const hide = () => {
        if (!navbar || isHidden) return;
        
        navbar.classList.remove(config.showClass);
        navbar.classList.add(config.hideClass);
        isHidden = true;
    };
    
    /**
     * Show the navbar
     */
    const show = () => {
        if (!navbar || !isHidden) return;
        
        navbar.classList.remove(config.hideClass);
        navbar.classList.add(config.showClass);
        isHidden = false;
    };
    
    /**
     * Force show navbar (for external calls)
     */
    const forceShow = () => {
        show();
        lastScrollY = getScrollY();
    };
    
    /**
     * Force hide navbar (for external calls)
     */
    const forceHide = () => {
        hide();
    };
    
    /**
     * Destroy the module and remove listeners
     */
    const destroy = () => {
        if (scrollContainer === window) {
            window.removeEventListener('scroll', onScroll);
        } else if (scrollContainer) {
            scrollContainer.removeEventListener('scroll', onScroll);
        }
        navbar = null;
        scrollContainer = null;
    };
    
    // Auto-initialize when DOM is ready or after delay for dynamic content
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    } else {
        setTimeout(init, 500);
    }
    
    // Public API
    return {
        init,
        show: forceShow,
        hide: forceHide,
        destroy,
        isHidden: () => isHidden
    };
})();

// Global export
window.NavbarModule = NavbarModule;
