/**
 * Déboucheur Expert - French Structured Data (JSON-LD)
 * SEO Schema.org LocalBusiness markup for French version
 */

const StructuredDataFR = {
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
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "08:00",
            "closes": "18:00"
        },
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Saturday", "Sunday"],
            "opens": "08:00",
            "closes": "17:00"
        }
    ]
};

/**
 * Inject French structured data into the document head
 */
function injectStructuredDataFR() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(StructuredDataFR);
    document.head.appendChild(script);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StructuredDataFR, injectStructuredDataFR };
}

// Global export
window.StructuredDataFR = StructuredDataFR;
window.injectStructuredDataFR = injectStructuredDataFR;