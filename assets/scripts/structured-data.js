/**
 * Déboucheur Expert - Structured Data Injector
 * Automatically injects bilingual JSON-LD structured data for SEO
 * Include this script in the <head> section of all pages
 */
(function() {
    // English structured data
    const structuredDataEN = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Unclogged by Déboucheur Expert",
        "alternateName": "unclogged.me",
        "description": "Anything related to residential plumbing service calls: unclogging drains, fixing leaks, troubleshooting water loss. Certain tasks require the city and a certified master plumber. No new construction; our service focuses on maintenance and emergency repairs.",
        "url": "https://unclogged.me",
        "logo": "https://unclogged.me/assets/images/logo/logo.png",
        "image": "https://unclogged.me/assets/images/slide/slide_01.webp",
        "telephone": "+1-438-530-2343",
        "priceRange": "200$ - 640$/h CAD +tx",
        "areaServed": ["Montreal", "Montérégie"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "290 Rue Lord #01",
            "addressLocality": "Napierville",
            "addressRegion": "QC",
            "postalCode": "J0J 1L0",
            "addressCountry": "CA"
        },
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "08:00", "closes": "18:00"},
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday","Sunday"], "opens": "08:00", "closes": "17:00"}
        ]
    };

    // French structured data
    const structuredDataFR = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Déboucheur Expert (unclogged.me)",
        "alternateName": "Déboucheur",
        "description": "Tout ce qui concerne les appels de service de plomberie résidentielle : débouchage des drains, réparation des fuites, dépannage des pertes d'eau. Certaines tâches nécessitent la ville et un maître plombier certifié. Pas de nouvelle construction ; notre service se concentre sur l'entretien et les réparations d'urgence.",
        "url": "https://deboucheur.expert",
        "logo": "https://deboucheur.expert/assets/images/logo/logo.png",
        "image": "https://deboucheur.expert/assets/images/slide/slide_01.webp",
        "telephone": "+1-438-530-2343",
        "priceRange": "200$ - 640$/h CAD +tx",
        "areaServed": ["Montreal", "Montérégie"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "290 Rue Lord #01",
            "addressLocality": "Napierville",
            "addressRegion": "QC",
            "postalCode": "J0J 1L0",
            "addressCountry": "CA"
        },
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "08:00", "closes": "18:00"},
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday","Sunday"], "opens": "08:00", "closes": "17:00"}
        ]
    };

    // Inject structured data scripts
    function injectStructuredData() {
        const head = document.head || document.getElementsByTagName('head')[0];
        
        // Create English script
        const scriptEN = document.createElement('script');
        scriptEN.type = 'application/ld+json';
        scriptEN.setAttribute('lang', 'en');
        scriptEN.textContent = JSON.stringify(structuredDataEN, null, 2);
        head.appendChild(scriptEN);
        
        // Create French script
        const scriptFR = document.createElement('script');
        scriptFR.type = 'application/ld+json';
        scriptFR.setAttribute('lang', 'fr');
        scriptFR.textContent = JSON.stringify(structuredDataFR, null, 2);
        head.appendChild(scriptFR);
    }

    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStructuredData);
    } else {
        injectStructuredData();
    }
})();
