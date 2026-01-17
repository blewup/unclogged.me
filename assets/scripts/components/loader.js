/**
 * Déboucheur Expert - Components Loader
 * Loads reusable HTML components (navbar, footer, hero, banner, helper) into pages
 * 
 * Supported page types:
 *   - index.html (root)
 *   - pages/*.html (subpages)
 *   - pages/plumbing/*.html (plumbing guides)
 *   - pages/errors/*.html (error pages)
 *   - pages/errors/codes/*.html (specific error codes)
 * 
 * Usage:
 *   <div id="navbar-container"></div>
 *   <div id="footer-container"></div>
 *   <div id="hero-container"></div>
 *   <div id="banner-container"></div>
 *   <div id="helper-container"></div>
 *   <script src="[path]/assets/scripts/components/loader.js"></script>
 */

// Determine page type and set correct paths
const pathname = window.location.pathname;

// Detect page context
const isIndexPage = pathname.endsWith('index.html') || 
                    pathname.endsWith('/') ||
                    pathname === '' ||
                    pathname === '/';

const isErrorCodesPage = pathname.includes('/errors/codes/');
const isErrorPage = pathname.includes('/errors/') && !isErrorCodesPage;
const isPlumbingPage = pathname.includes('/plumbing/');
const isSubpage = pathname.includes('/pages/') && !isErrorPage && !isErrorCodesPage && !isPlumbingPage;

// Calculate base paths based on page context
let componentsBasePath;
let assetsBasePath;

if (isIndexPage) {
    componentsBasePath = 'pages/components/';
    assetsBasePath = '';
} else if (isErrorCodesPage) {
    // pages/errors/codes/*.html → go up 3 levels
    componentsBasePath = '../../components/';
    assetsBasePath = '../../../';
} else if (isErrorPage) {
    // pages/errors/*.html → go up 2 levels
    componentsBasePath = '../components/';
    assetsBasePath = '../../';
} else if (isPlumbingPage) {
    // pages/plumbing/*.html → go up 1 level to pages/
    componentsBasePath = '../components/';
    assetsBasePath = '../../';
} else {
    // pages/*.html → same level as components/
    componentsBasePath = 'components/';
    assetsBasePath = '../';
}

// Store paths globally for use by components
window.componentPaths = {
    components: componentsBasePath,
    assets: assetsBasePath,
    isIndex: isIndexPage,
    isError: isErrorPage || isErrorCodesPage,
    isPlumbing: isPlumbingPage
};

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
        
        // Dispatch event when component is loaded
        container.dispatchEvent(new CustomEvent('componentLoaded', { 
            detail: { containerId, componentPath } 
        }));
        
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

/**
 * Load all standard components (navbar, footer, hero, banner, helper)
 * Call this on DOMContentLoaded
 */
function loadStandardComponents() {
    const components = [
        { id: 'navbar-container', file: 'navbar.html' },
        { id: 'footer-container', file: 'footer.html' },
        { id: 'hero-container', file: 'hero.html' },
        { id: 'banner-container', file: 'banner.html' },
        { id: 'helper-container', file: 'helper.html' }
    ];
    
    components.forEach(({ id, file }) => {
        if (document.getElementById(id)) {
            loadComponent(id, componentsBasePath + file);
        }
    });
}

/**
 * Load a section component for index page
 * @param {string} sectionId - Section container ID
 * @param {string} sectionFile - Section filename (e.g., 'section_00.html')
 */
async function loadSection(sectionId, sectionFile) {
    const basePath = isIndexPage ? 'pages/index/' : 'index/';
    await loadComponent(sectionId, basePath + sectionFile);
}

/**
 * Load multiple sections at once
 * @param {Array} sections - Array of {id, file} objects
 */
async function loadSections(sections) {
    await Promise.all(sections.map(({ id, file }) => loadSection(id, file)));
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
window.loadSection = loadSection;
window.loadSections = loadSections;

