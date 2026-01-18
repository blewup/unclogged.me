/**
 * Déboucheur Expert - Components Loader
 * Loads reusable HTML components (navbar, footer, hero, banner, helper) into pages
 * 
 * Component Directory Structure:
 *   - pages/index/components/ → For root index.html (prefix: index-)
 *   - pages/components/ → For pages/*.html files (prefix: pages-)
 *   - pages/plumbing/components/ → For pages/plumbing/*.html files (prefix: plumbing-)
 *   - pages/errors/components/ → For pages/errors/*.html files (prefix: errors-)
 *   - pages/errors/codes/components/ → For pages/errors/codes/*.html files (prefix: codes-)
 * 
 * Each component directory contains versions with correct relative paths for its level.
 * Unique container IDs prevent mixing when multiple component contexts exist.
 * 
 * Container ID Schema:
 *   <div id="[prefix]-navbar-container"></div>
 *   <div id="[prefix]-footer-container"></div>
 *   <div id="[prefix]-hero-container"></div>
 *   <div id="[prefix]-banner-container"></div>
 *   <div id="[prefix]-helper-container"></div>
 *   <script src="[path]/assets/scripts/components/loader.js"></script>
 * 
 * Legacy Support: Also checks for non-prefixed containers for backward compatibility.
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

// Determine page context prefix for unique IDs
let pagePrefix;
if (isIndexPage) {
    pagePrefix = 'index';
} else if (isErrorCodesPage) {
    pagePrefix = 'codes';
} else if (isErrorPage) {
    pagePrefix = 'errors';
} else if (isPlumbingPage) {
    pagePrefix = 'plumbing';
} else {
    pagePrefix = 'pages';
}

// Calculate base paths based on page context
// Each level loads from its own components/ folder with pre-configured paths
let componentsBasePath;
let assetsBasePath;

if (isIndexPage) {
    // index.html uses pages/index/components/ for root-level paths
    componentsBasePath = 'pages/index/components/';
    assetsBasePath = '';
} else if (isErrorCodesPage) {
    // pages/errors/codes/*.html → uses components/ in same dir
    componentsBasePath = 'components/';
    assetsBasePath = '../../../';
} else if (isErrorPage) {
    // pages/errors/*.html → uses components/ in same dir
    componentsBasePath = 'components/';
    assetsBasePath = '../../';
} else if (isPlumbingPage) {
    // pages/plumbing/*.html → uses components/ in same dir
    componentsBasePath = 'components/';
    assetsBasePath = '../../';
} else {
    // pages/*.html → uses components/ in same dir
    componentsBasePath = 'components/';
    assetsBasePath = '../';
}

// Store paths globally for use by components
window.componentPaths = {
    components: componentsBasePath,
    assets: assetsBasePath,
    prefix: pagePrefix,
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
 * Get the container ID with proper prefix
 * @param {string} baseId - Base container name (e.g., 'navbar', 'footer')
 * @returns {string} - Prefixed container ID
 */
function getContainerId(baseId) {
    const prefixedId = `${pagePrefix}-${baseId}-container`;
    const legacyId = `${baseId}-container`;
    
    // Check for prefixed ID first, then fall back to legacy
    if (document.getElementById(prefixedId)) {
        return prefixedId;
    }
    if (document.getElementById(legacyId)) {
        return legacyId;
    }
    return prefixedId; // Default to prefixed
}

/**
 * Load all standard components (navbar, footer, hero, banner, helper)
 * Call this on DOMContentLoaded
 * Supports both prefixed IDs (e.g., index-navbar-container) and legacy IDs (navbar-container)
 */
function loadStandardComponents() {
    const componentTypes = ['navbar', 'footer', 'hero', 'banner', 'helper'];
    
    componentTypes.forEach(type => {
        const containerId = getContainerId(type);
        const container = document.getElementById(containerId);
        
        if (container) {
            loadComponent(containerId, componentsBasePath + type + '.html');
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

