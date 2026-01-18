import os

# --- Configuration ---
TARGET_DIR = './pages' 
EXTENSIONS = ('.html')

# TRIPLE QUOTES (""") allow us to paste the exact multi-line HTML block safely.
# This block must match your files EXACTLY (spaces, newlines, indentation).
SEARCH_TEXT = '''    <!-- Structured Data for Search Engines (English) -->
    <script lang="en" type="application/ld+json">
    {
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
    }
    </script>
    
    <!-- Structured Data for Search Engines (French) -->
    <script lang="fr" type="application/ld+json">
    {
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
    }
    </script>'''

# The replacement text (using triple quotes for safety)
REPLACE_TEXT = '''<script src="assets/scripts/navbar.js" defer></script>
    <script src="assets/scripts/seofr.js" defer></script>
    <script src="assets/scripts/seoen.js" defer></script>'''

def process_files():
    count = 0
    print(f"Scanning directory: {os.path.abspath(TARGET_DIR)}...\n")

    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.lower().endswith(EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    # Read the file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check for Exact Match
                    if SEARCH_TEXT in content:
                        print(f"[MODIFYING] {file_path}")
                        
                        # Perform replacement
                        new_content = content.replace(SEARCH_TEXT, REPLACE_TEXT)
                        
                        # Write changes
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        count += 1
                        
                except Exception as e:
                    print(f"[ERROR] Could not read {file_path}: {e}")

    print(f"\nDone. Updated {count} files.")

if __name__ == "__main__":
    process_files()
