/**
 * Déboucheur Expert - Components Loader
 * Loads reusable HTML components (navbar, footer, hero, banner, helper) into pages
 * 
 * Usage:
 *   <div id="navbar-container"></div>
 *   <div id="footer-container"></div>
 *   <div id="banner-container"></div>
 *   <div id="helper-container"></div>
 *   <script src="../assets/scripts/components/loader.js"></script>
 *   
 * For index.html:
 *   <script src="assets/scripts/components/loader.js"></script>
 */

// Determine if we're on index.html or a subpage
const isIndexPage = window.location.pathname.endsWith('index.html') || 
                    window.location.pathname.endsWith('/') ||
                    window.location.pathname === '';

// Determine if we're in errors folder
const isErrorPage = window.location.pathname.includes('/errors/');

// Base path for components based on current location
let componentsBasePath;
if (isIndexPage) {
    componentsBasePath = 'pages/components/';
} else if (isErrorPage) {
    componentsBasePath = '../pages/components/';
} else {
    componentsBasePath = 'components/';
}

/**
 * Load an HTML component into a container
 * @param {string} containerId - ID of the container element
 * @param {string} componentPath - Path to the component HTML file
 * @returns {Promise<void>}
 */
async function loadComponent(containerId, componentPath) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container #${containerId} not found`);
        return;
    }
    
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Execute any inline scripts in the loaded component
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
            script.remove();
        });
        
        // Apply translations if available
        if (typeof translations !== 'undefined' && typeof currentLang !== 'undefined') {
            container.querySelectorAll('[data-translate]').forEach(el => {
                const key = el.getAttribute('data-translate');
                if (translations[currentLang] && translations[currentLang][key]) {
                    el.innerText = translations[currentLang][key];
                }
            });
        }
        
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

/**
 * Load all standard components (navbar, footer, banner, helper)
 * Call this on DOMContentLoaded
 */
function loadStandardComponents() {
    // Load navbar if container exists
    if (document.getElementById('navbar-container')) {
        loadComponent('navbar-container', componentsBasePath + 'navbar.html');
    }
    
    // Load footer if container exists
    if (document.getElementById('footer-container')) {
        loadComponent('footer-container', componentsBasePath + 'footer.html');
    }
    
    // Load hero slideshow if container exists (uses hero.html now)
    if (document.getElementById('hero-container')) {
        loadComponent('hero-container', componentsBasePath + 'hero.html');
    }
    
    // Load cookie banner if container exists
    if (document.getElementById('banner-container')) {
        loadComponent('banner-container', componentsBasePath + 'banner.html');
    }
    
    // Load AI helper chat widget if container exists
    if (document.getElementById('helper-container')) {
        loadComponent('helper-container', componentsBasePath + 'helper.html');
    }
}

// Auto-load components when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStandardComponents);
} else {
    loadStandardComponents();
}

// Export for manual use
window.loadComponent = loadComponent;
window.loadStandardComponents = loadStandardComponents;

