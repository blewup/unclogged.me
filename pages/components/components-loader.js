/**
 * Déboucheur Expert - Components Loader
 * Loads reusable HTML components (navbar, footer, hero) into pages
 * 
 * Usage:
 *   <div id="navbar-container"></div>
 *   <script src="components/components-loader.js"></script>
 *   
 * For index.html:
 *   <div id="navbar-container"></div>
 *   <script src="pages/components/components-loader.js"></script>
 */

// Determine if we're on index.html or a subpage
const isIndexPage = window.location.pathname.endsWith('index.html') || 
                    window.location.pathname.endsWith('/') ||
                    window.location.pathname === '';

// Base path for components
const componentsBasePath = isIndexPage ? 'pages/components/' : 'components/';

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
 * Load all standard components (navbar and footer)
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
    
    // Load hero slideshow if container exists (only for pages that need it)
    if (document.getElementById('hero-container')) {
        loadComponent('hero-container', componentsBasePath + 'hero-slide.html');
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
