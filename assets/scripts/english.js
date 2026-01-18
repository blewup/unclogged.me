/**
 * Déboucheur Expert - English Structured Data (JSON-LD)
 * SEO Schema.org LocalBusiness markup for English version
 */

const StructuredDataEN = {
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
 * Inject English structured data into the document head
 */
function injectStructuredDataEN() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(StructuredDataEN);
    document.head.appendChild(script);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StructuredDataEN, injectStructuredDataEN };
}

// Global export
window.StructuredDataEN = StructuredDataEN;
window.injectStructuredDataEN = injectStructuredDataEN;
