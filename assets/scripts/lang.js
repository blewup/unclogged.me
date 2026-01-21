// ============================================================================
// LANGUAGE / TRANSLATION MODULE
// Déboucheur Expert - Bilingual Support (FR/EN)
// Version 1.0.0
// ============================================================================
// This module handles all translation logic for the website.
// It uses data-translate attributes on HTML elements to apply translations.
// ============================================================================

(function() {
    'use strict';

    // ========================================================================
    // LANGUAGE CONFIGURATION
    // ========================================================================
    
    const Language = {
        current: 'fr',
        
        translations: {
            // ================================================================
            // FRENCH TRANSLATIONS (Default)
            // ================================================================
            fr: {
                // Hero Section
                hero_title: "DÉBOUCHEUR EXPERT",
                hero_subtitle: "Drain et égout",
                hero_cta: "BESOIN D'AIDE?",
                hero_tag_pro: "SERVICE PROFESSIONNEL",
                hero_tag_avail: "DISPONIBLE 24/7",
                hero_tag_zone: "MONTRÉAL ET RIVE-SUD",
                hero_scroll: "Défiler pour découvrir nos services",
                
                // Navigation
                nav_services: "SERVICES",
                nav_expertise: "EXPERTISE",
                nav_faq: "FAQ",
                nav_contact: "CONTACT",
                nav_testimonials: "TÉMOIGNAGES",
                nav_lessons: "LEÇONS",
                nav_map: "CARTE",
                nav_prices: "TARIFS",
                nav_plumbing: "PLOMBERIE",
                nav_tools: "ÉQUIPEMENTS",
                nav_events: "CALENDRIER",
                nav_team: "ÉQUIPE",
                nav_politics: "POLITIQUE",
                nav_conditions: "CONDITIONS",
                
                // Buttons & Actions
                btn_call: "APPELER",
                btn_message: "MESSAGE",
                btn_directions: "ITINÉRAIRE",
                btn_submit: "ENVOYER",
                btn_close: "FERMER",
                btn_more: "EN SAVOIR PLUS",
                btn_back: "RETOUR",
                btn_view_all: "TOUT VOIR",
                
                // Services Section
                services_title: "SERVICES",
                services_subtitle: "Solutions professionnelles de débouchage",
                service_1_title: "DÉBOUCHAGE",
                service_1_desc: "Intervention rapide pour tous types de drains bouchés",
                service_2_title: "URGENCES 24/7",
                service_2_desc: "Disponible jour et nuit pour les situations urgentes",
                service_3_title: "ENTRETIEN",
                service_3_desc: "Maintenance préventive pour éviter les problèmes",
                service_4_title: "INSPECTION",
                service_4_desc: "Caméra d'inspection pour diagnostic précis",
                
                // Expertise Section
                expertise_title: "EXPERTISE",
                expertise_subtitle: "Plus de 15 ans d'expérience en plomberie",
                expertise_desc: "Notre équipe qualifiée intervient rapidement avec le matériel professionnel adapté à chaque situation.",
                
                // FAQ Section
                faq_title: "QUESTIONS FRÉQUENTES",
                faq_subtitle: "Trouvez rapidement vos réponses",
                faq_1_q: "Quels sont vos délais d'intervention?",
                faq_1_a: "Nous intervenons généralement dans l'heure pour les urgences, et dans la journée pour les demandes standards.",
                faq_2_q: "Quelles zones desservez-vous?",
                faq_2_a: "Nous couvrons Montréal, la Rive-Sud, et la Montérégie.",
                faq_3_q: "Acceptez-vous les cartes de crédit?",
                faq_3_a: "Oui, nous acceptons Visa, Mastercard, et les paiements par virement.",
                faq_4_q: "Offrez-vous des garanties?",
                faq_4_a: "Oui, tous nos travaux sont garantis pour votre tranquillité d'esprit.",
                
                // Contact Section
                contact_title: "CONTACT",
                contact_subtitle: "Demandez une soumission gratuite",
                contact_phone: "Téléphone",
                contact_email: "Courriel",
                contact_address: "Adresse",
                contact_hours: "Heures d'ouverture",
                contact_available: "Disponible 24/7 pour les urgences",
                
                // Form Fields
                form_fname: "Prénom",
                form_lname: "Nom",
                form_email: "Courriel",
                form_phone: "Téléphone",
                form_message: "Message",
                form_attachment: "Pièce jointe",
                form_required: "Veuillez remplir tous les champs obligatoires.",
                form_invalid_email: "Veuillez entrer une adresse courriel valide.",
                form_invalid_phone: "Veuillez entrer un numéro de téléphone valide.",
                form_sending: "Envoi en cours...",
                form_success: "Message envoyé avec succès!",
                form_error: "Erreur lors de l'envoi. Veuillez réessayer.",
                
                // Testimonials Section
                testimonials_title: "TÉMOIGNAGES",
                testimonials_subtitle: "Ce que nos clients disent",
                
                // Lessons Section
                lessons_title: "LEÇONS",
                lessons_subtitle: "Conseils et astuces de plomberie",
                
                // Map Section
                map_title: "NOTRE EMPLACEMENT",
                map_subtitle: "Trouvez-nous facilement",
                
                // Footer
                footer_copyright: "© 2025 Déboucheur Expert. Tous droits réservés.",
                footer_privacy: "Politique de confidentialité",
                footer_terms: "Conditions d'utilisation",
                footer_team: "Équipe",
                
                // Chat Widget
                chat_title: "L'Apprenti",
                chat_subtitle: "Assistant IA",
                chat_placeholder: "Posez votre question...",
                chat_send: "Envoyer",
                chat_thinking: "Réflexion...",
                chat_error: "Erreur de connexion",
                chat_welcome: "Bonjour! Comment puis-je vous aider aujourd'hui?",
                helper_talk_to_expert: "Parler à un expert",
                helper_waiting_for_agent: "En attente de Billy...",
                helper_agent_connected: "Billy est connecté!",
                
                // Prices Page
                prices_title: "TARIFICATION",
                prices_subtitle: "Nos tarifs transparents",
                price_base: "Tarif de base",
                price_weekend: "Fin de semaine (×2)",
                price_holiday: "Jour férié (×3)",
                price_per_hour: "/heure",
                price_minimum: "Minimum 1 heure",
                price_travel: "Frais de déplacement inclus",
                price_note: "* Les prix peuvent varier selon la complexité du travail",
                
                // Tools Page
                tools_title: "ÉQUIPEMENTS",
                tools_subtitle: "Nos outils professionnels",
                tools_grid_title: "NOS ÉQUIPEMENTS",
                
                // Events Page
                events_title: "CALENDRIER",
                events_subtitle: "Calendrier et disponibilités",
                calendar_title: "DISPONIBILITÉS",
                view_calendar: "Voir le calendrier",
                calendar_months: [
                    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
                ],
                calendar_days: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
                calendar_tooltip_holiday: "{name} (X3)",
                calendar_tooltip_weekend: "Fin de semaine (X2)",
                calendar_tooltip_standard: "Standard (X1)",
                calendar_holiday_rate: "Tarif X3",
                calendar_no_holidays: "Aucun jour férié dans les 6 prochains mois",
                
                // Team Page
                team_title: "NOTRE ÉQUIPE",
                billy_role: "Plombier retraité & Propriétaire",
                billy_bio: "Billy St‑Hilaire est un plombier retraité comptant plus de quinze années d'expérience. Après une carrière réussie, il se consacre maintenant à offrir son expertise en tant que propriétaire de Déboucheur Expert. Passionné par les nouvelles technologies et la mécanique, il veille à ce que chaque intervention soit réalisée avec la même précision et rigueur que durant sa carrière de plombier.",
                nancy_role: "Conductrice & Partenaire",
                nancy_bio: "Nancy Boulianne est la conductrice et partenaire de l'entreprise. Elle accompagne Billy lors des appels de service et s'assure que l'équipe arrive rapidement et en toute sécurité. Organisée et accueillante, elle joue un rôle clé dans la prestation d'un service exceptionnel.",
                
                // Plumbing Guides
                plumbing_title: "PLOMBERIE",
                plumbing_subtitle: "Guides et ressources",
                toc_quick: "Guide rapide",
                toc_detailed: "GUIDES DÉTAILLÉS",
                toc_supply: "Alimentation en eau",
                toc_drainage: "Système d'évacuation",
                toc_debouchage: "Débouchage",
                toc_normes: "Normes de plomberie",
                supply_title: "ALIMENTATION EN EAU",
                supply_subtitle: "Comprendre votre système d'eau potable",
                drainage_title: "SYSTÈME D'ÉVACUATION",
                drainage_subtitle: "Comment fonctionne votre drainage",
                unclog_title: "DÉBOUCHAGE",
                unclog_subtitle: "Techniques et solutions",
                normes_title: "CODES ET RÈGLEMENTS",
                normes_subtitle: "Conformité et sécurité",
                
                // Debouchage Section
                title_debouchage: "DÉBOUCHAGE",
                title_urgences: "URGENCES",
                title_entretien: "ENTRETIEN",
                title_inspection: "INSPECTION",
                title_conseils: "CONSEILS",
                sec_debouchage: "Débouchage",
                sec_urgences: "Urgences",
                sec_entretien: "Entretien",
                sec_inspection: "Inspection",
                sec_conseils: "Conseils",
                tech_cable: "Câble mécanique",
                tech_cable_desc: "Le câble rotatif dégage les blocages solides.",
                tech_hydro: "Jet haute pression",
                tech_hydro_desc: "L'hydrocurage nettoie les parois des tuyaux.",
                hydro_1: "Nettoyage en profondeur",
                hydro_2: "Élimine graisse et résidus",
                hydro_3: "Préventif et curatif",
                
                // Urgency Section
                urg_when: "Quand appeler en urgence?",
                urg_1: "Eau remontant par les drains",
                urg_2: "Toilettes complètement bouchées",
                urg_3: "Odeurs d'égout persistantes",
                urg_4: "Inondation au sous-sol",
                urg_5: "Drain principal obstrué",
                urg_6: "Fuite d'eau majeure",
                urg_wait: "En attendant notre arrivée:",
                urg_step1: "Fermez l'alimentation d'eau si possible",
                urg_step2: "Ne tirez pas la chasse d'eau",
                urg_step3: "Évitez d'utiliser les drains",
                urg_step4: "Préparez l'accès aux tuyaux",
                
                // Entretien Section
                ent_drains: "Entretien des drains",
                ent_drains_desc: "Nettoyez régulièrement les crépines.",
                ent_drains_tip: "Versez de l'eau bouillante une fois par semaine.",
                ent_ext: "Entretien extérieur",
                ent_ext_desc: "Vérifiez les drains de fondation.",
                ent_ext_tip: "Dégagez les feuilles et débris à l'automne.",
                
                // Inspection Section
                insp_desc: "Nos inspections caméra diagnostiquent les problèmes sans excavation.",
                insp_diag: "Diagnostic précis",
                insp_diag_sub: "Identification des blocages et fissures.",
                insp_rec: "Recommandations",
                insp_rec_sub: "Solutions adaptées à votre situation.",
                insp_mes: "Mesures préventives",
                insp_mes_sub: "Évitez les problèmes futurs.",
                
                // Tips Section
                tip_filters: "Utilisez des filtres",
                tip_filters_desc: "Installez des crépines sur tous vos drains.",
                tip_never: "Ne jamais jeter",
                tip_never_desc: "Graisse, lingettes, cotons-tiges dans les drains.",
                tip_winter: "Préparation hivernale",
                tip_winter_desc: "Protégez vos tuyaux du gel.",
                
                // Drainage Slope Section
                drainage_slope_title: "PENTE DES TUYAUX D'ÉVACUATION",
                drainage_slope_intro: "La pente des tuyaux d'évacuation est cruciale pour un bon écoulement des eaux usées. Une pente incorrecte cause des blocages récurrents et des odeurs. Les codes de plomberie spécifient différentes pentes selon le diamètre des tuyaux.",
                drainage_small_pipes: "Tuyaux ≤ 3\" <span class=\"text-sm opacity-70\">(≤ 76 mm)</span>",
                drainage_large_pipes: "Tuyaux ≥ 4\" <span class=\"text-sm opacity-70\">(≥ 100 mm)</span>",
                slope_ideal: "Pente idéale",
                slope_minimum: "Minimum acceptable",
                slope_stagnation: "Stagnation",
                drainage_slope_warning: "<strong>⚠️ Attention:</strong> Une pente trop faible cause la stagnation des solides, tandis qu'une pente trop forte peut vider prématurément les siphons (effet de siphonage).",
                
                // Index Sections
                idx_1: "ACCUEIL",
                idx_2: "SERVICES",
                idx_3: "EXPERTISE",
                idx_4: "FAQ",
                idx_5: "CONTACT",
                idx_6: "TÉMOIGNAGES",
                idx_7: "LEÇONS",
                idx_8: "CARTE",
                idx_9: "PIED DE PAGE",
                
                // Offline Page
                offline_title: "HORS LIGNE",
                offline_msg: "Vous n'êtes pas connecté à Internet. Le site fonctionne en mode hors ligne.",
                
                // Conditions Page
                conditions_title: "CONDITIONS D'UTILISATION",
                
                // Politics Page
                politics_title: "POLITIQUE DE CONFIDENTIALITÉ",
                politics_index: "Index",
                pol_1: "Introduction",
                pol_2: "Informations",
                pol_3: "Finalités",
                pol_4: "Partage",
                pol_5: "Sécurité",
                pol_6: "Vos droits",
                pol_7: "Cookies",
                pol_8: "Modifications",
                pol_9: "Contact",
                
                // Search Placeholder
                search_placeholder: "Rechercher un outil...",
                
                // Page title
                page_title: "Déboucheur Expert"
            },
            
            // ================================================================
            // ENGLISH TRANSLATIONS
            // ================================================================
            en: {
                // Hero Section
                hero_title: "UNCLOGGER EXPERT",
                hero_subtitle: "Drain and sewer",
                hero_cta: "NEED HELP?",
                hero_tag_pro: "PROFESSIONAL SERVICE",
                hero_tag_avail: "AVAILABLE 24/7",
                hero_tag_zone: "MONTREAL AND SOUTH SHORE",
                hero_scroll: "Scroll to discover our services",
                
                // Navigation
                nav_services: "SERVICES",
                nav_expertise: "EXPERTISE",
                nav_faq: "FAQ",
                nav_contact: "CONTACT",
                nav_testimonials: "TESTIMONIALS",
                nav_lessons: "LESSONS",
                nav_map: "MAP",
                nav_prices: "PRICES",
                nav_plumbing: "PLUMBING",
                nav_tools: "EQUIPMENT",
                nav_events: "CALENDAR",
                nav_team: "TEAM",
                nav_politics: "POLICY",
                nav_conditions: "CONDITIONS",
                
                // Buttons & Actions
                btn_call: "CALL",
                btn_message: "MESSAGE",
                btn_directions: "DIRECTIONS",
                btn_submit: "SUBMIT",
                btn_close: "CLOSE",
                btn_more: "LEARN MORE",
                btn_back: "BACK",
                btn_view_all: "VIEW ALL",
                
                // Services Section
                services_title: "SERVICES",
                services_subtitle: "Professional drain unclogging solutions",
                service_1_title: "UNCLOGGING",
                service_1_desc: "Fast intervention for all types of clogged drains",
                service_2_title: "24/7 EMERGENCIES",
                service_2_desc: "Available day and night for urgent situations",
                service_3_title: "MAINTENANCE",
                service_3_desc: "Preventive maintenance to avoid problems",
                service_4_title: "INSPECTION",
                service_4_desc: "Camera inspection for accurate diagnosis",
                
                // Expertise Section
                expertise_title: "EXPERTISE",
                expertise_subtitle: "Over 15 years of plumbing experience",
                expertise_desc: "Our qualified team responds quickly with professional equipment adapted to each situation.",
                
                // FAQ Section
                faq_title: "FREQUENTLY ASKED QUESTIONS",
                faq_subtitle: "Find your answers quickly",
                faq_1_q: "What are your response times?",
                faq_1_a: "We generally respond within the hour for emergencies, and same day for standard requests.",
                faq_2_q: "What areas do you serve?",
                faq_2_a: "We cover Montreal, the South Shore, and Montérégie.",
                faq_3_q: "Do you accept credit cards?",
                faq_3_a: "Yes, we accept Visa, Mastercard, and e-transfer payments.",
                faq_4_q: "Do you offer guarantees?",
                faq_4_a: "Yes, all our work is guaranteed for your peace of mind.",
                
                // Contact Section
                contact_title: "CONTACT",
                contact_subtitle: "Request a free estimate",
                contact_phone: "Phone",
                contact_email: "Email",
                contact_address: "Address",
                contact_hours: "Business hours",
                contact_available: "Available 24/7 for emergencies",
                
                // Form Fields
                form_fname: "First name",
                form_lname: "Last name",
                form_email: "Email",
                form_phone: "Phone",
                form_message: "Message",
                form_attachment: "Attachment",
                form_required: "Please fill in all required fields.",
                form_invalid_email: "Please enter a valid email address.",
                form_invalid_phone: "Please enter a valid phone number.",
                form_sending: "Sending...",
                form_success: "Message sent successfully!",
                form_error: "Error sending. Please try again.",
                
                // Testimonials Section
                testimonials_title: "TESTIMONIALS",
                testimonials_subtitle: "What our clients say",
                
                // Lessons Section
                lessons_title: "LESSONS",
                lessons_subtitle: "Plumbing tips and tricks",
                
                // Map Section
                map_title: "OUR LOCATION",
                map_subtitle: "Find us easily",
                
                // Footer
                footer_copyright: "© 2025 Unclogger Expert. All rights reserved.",
                footer_privacy: "Privacy Policy",
                footer_terms: "Terms of Use",
                footer_team: "Team",
                
                // Chat Widget
                chat_title: "The Apprentice",
                chat_subtitle: "AI Assistant",
                chat_placeholder: "Ask your question...",
                chat_send: "Send",
                chat_thinking: "Thinking...",
                chat_error: "Connection error",
                chat_welcome: "Hello! How can I help you today?",
                helper_talk_to_expert: "Talk to an expert",
                helper_waiting_for_agent: "Waiting for Billy...",
                helper_agent_connected: "Billy is connected!",
                
                // Prices Page
                prices_title: "PRICING",
                prices_subtitle: "Our transparent rates",
                price_base: "Base rate",
                price_weekend: "Weekend (×2)",
                price_holiday: "Holiday (×3)",
                price_per_hour: "/hour",
                price_minimum: "1 hour minimum",
                price_travel: "Travel fees included",
                price_note: "* Prices may vary depending on job complexity",
                
                // Tools Page
                tools_title: "EQUIPMENT",
                tools_subtitle: "Our professional tools",
                tools_grid_title: "OUR EQUIPMENT",
                
                // Events Page
                events_title: "CALENDAR",
                events_subtitle: "Calendar and availability",
                calendar_title: "AVAILABILITY",
                view_calendar: "View calendar",
                calendar_months: [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ],
                calendar_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                calendar_tooltip_holiday: "{name} (X3)",
                calendar_tooltip_weekend: "Weekend (X2)",
                calendar_tooltip_standard: "Standard (X1)",
                calendar_holiday_rate: "Rate X3",
                calendar_no_holidays: "No holidays in the next 6 months",
                
                // Team Page
                team_title: "OUR TEAM",
                billy_role: "Retired Plumber & Owner",
                billy_bio: "Billy St‑Hilaire is a retired plumber with more than fifteen years of experience. After a successful career he now dedicates himself to offering his expertise as the owner of Déboucheur Expert. Passionate about new technologies and mechanics, he ensures that every intervention is carried out with the same precision and rigour as during his plumbing career.",
                nancy_role: "Driver & Partner",
                nancy_bio: "Nancy Boulianne is the driver and partner in the business. She accompanies Billy on service calls and makes sure the team arrives quickly and safely. Well organised and friendly, she plays a key role in delivering an exceptional service.",
                
                // Plumbing Guides
                plumbing_title: "PLUMBING",
                plumbing_subtitle: "Guides and resources",
                toc_quick: "Quick Guide",
                toc_detailed: "DETAILED GUIDES",
                toc_supply: "Water supply",
                toc_drainage: "Drainage system",
                toc_debouchage: "Unclogging",
                toc_normes: "Plumbing codes",
                supply_title: "WATER SUPPLY",
                supply_subtitle: "Understanding your potable water system",
                drainage_title: "DRAINAGE SYSTEM",
                drainage_subtitle: "How your drainage works",
                unclog_title: "UNCLOGGING",
                unclog_subtitle: "Techniques and solutions",
                normes_title: "CODES AND REGULATIONS",
                normes_subtitle: "Compliance and safety",
                
                // Debouchage Section
                title_debouchage: "UNCLOGGING",
                title_urgences: "EMERGENCIES",
                title_entretien: "MAINTENANCE",
                title_inspection: "INSPECTION",
                title_conseils: "TIPS",
                sec_debouchage: "Unclogging",
                sec_urgences: "Emergencies",
                sec_entretien: "Maintenance",
                sec_inspection: "Inspection",
                sec_conseils: "Tips",
                tech_cable: "Mechanical cable",
                tech_cable_desc: "The rotating cable clears solid blockages.",
                tech_hydro: "High pressure jet",
                tech_hydro_desc: "Hydro-jetting cleans pipe walls.",
                hydro_1: "Deep cleaning",
                hydro_2: "Removes grease and residue",
                hydro_3: "Preventive and curative",
                
                // Urgency Section
                urg_when: "When to call for emergency?",
                urg_1: "Water backing up through drains",
                urg_2: "Completely clogged toilets",
                urg_3: "Persistent sewer odors",
                urg_4: "Basement flooding",
                urg_5: "Main drain obstructed",
                urg_6: "Major water leak",
                urg_wait: "While waiting for our arrival:",
                urg_step1: "Shut off water supply if possible",
                urg_step2: "Do not flush the toilet",
                urg_step3: "Avoid using drains",
                urg_step4: "Prepare access to pipes",
                
                // Entretien Section
                ent_drains: "Drain maintenance",
                ent_drains_desc: "Regularly clean the strainers.",
                ent_drains_tip: "Pour boiling water once a week.",
                ent_ext: "Outdoor maintenance",
                ent_ext_desc: "Check foundation drains.",
                ent_ext_tip: "Clear leaves and debris in fall.",
                
                // Inspection Section
                insp_desc: "Our camera inspections diagnose problems without excavation.",
                insp_diag: "Precise diagnosis",
                insp_diag_sub: "Identification of blockages and cracks.",
                insp_rec: "Recommendations",
                insp_rec_sub: "Solutions tailored to your situation.",
                insp_mes: "Preventive measures",
                insp_mes_sub: "Avoid future problems.",
                
                // Tips Section
                tip_filters: "Use filters",
                tip_filters_desc: "Install strainers on all your drains.",
                tip_never: "Never throw",
                tip_never_desc: "Grease, wipes, cotton swabs in drains.",
                tip_winter: "Winter preparation",
                tip_winter_desc: "Protect your pipes from freezing.",
                
                // Drainage Slope Section
                drainage_slope_title: "DRAIN PIPE SLOPE",
                drainage_slope_intro: "The slope of drain pipes is crucial for proper wastewater flow. Incorrect slope causes recurring blockages and odors. Plumbing codes specify different slopes depending on pipe diameter.",
                drainage_small_pipes: "Pipes ≤ 3\" <span class=\"text-sm opacity-70\">(≤ 76 mm)</span>",
                drainage_large_pipes: "Pipes ≥ 4\" <span class=\"text-sm opacity-70\">(≥ 100 mm)</span>",
                slope_ideal: "Ideal slope",
                slope_minimum: "Minimum acceptable",
                slope_stagnation: "Stagnation",
                drainage_slope_warning: "<strong>⚠️ Warning:</strong> A slope that's too shallow causes solids to stagnate, while a slope that's too steep can prematurely empty trap seals (siphoning effect).",
                
                // Index Sections
                idx_1: "HOME",
                idx_2: "SERVICES",
                idx_3: "EXPERTISE",
                idx_4: "FAQ",
                idx_5: "CONTACT",
                idx_6: "TESTIMONIALS",
                idx_7: "LESSONS",
                idx_8: "MAP",
                idx_9: "FOOTER",
                
                // Offline Page
                offline_title: "OFFLINE",
                offline_msg: "You are not connected to the Internet. The site is running in offline mode.",
                
                // Conditions Page
                conditions_title: "TERMS & CONDITIONS",
                
                // Politics Page
                politics_title: "PRIVACY POLICY",
                politics_index: "Index",
                pol_1: "Introduction",
                pol_2: "Information",
                pol_3: "Purposes",
                pol_4: "Sharing",
                pol_5: "Security",
                pol_6: "Your Rights",
                pol_7: "Cookies",
                pol_8: "Modifications",
                pol_9: "Contact",
                
                // Search Placeholder
                search_placeholder: "Search for a tool...",
                
                // Page title
                page_title: "Unclogger Expert"
            }
        },

        // ====================================================================
        // TOGGLE LANGUAGE
        // ====================================================================
        toggle() {
            this.current = this.current === 'fr' ? 'en' : 'fr';
            localStorage.setItem('language', this.current);
            document.documentElement.lang = this.current;
            
            // Update all lang-display buttons (may be multiple on page)
            // Show target language (EN when French is active, FR when English is active)
            this._updateLangButtons();
            this.apply();
            
            // Dispatch custom event for pages with local translations (e.g., tools page)
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: this.current } }));
            
            // Track event if Tracking module exists
            if (typeof Tracking !== 'undefined' && Tracking.event) {
                Tracking.event('language_change', { language: this.current });
            }
        },

        // ====================================================================
        // APPLY TRANSLATIONS
        // ====================================================================
        apply() {
            const lang = this.current;
            const trans = this.translations[lang];
            if (!trans) return;
            
            // Apply translations to all elements with data-translate attribute
            const elements = document.querySelectorAll('[data-translate]');
            elements.forEach(el => {
                const key = el.getAttribute('data-translate');
                const translation = trans[key];
                if (translation) {
                    // Use innerHTML for translations containing HTML, innerText otherwise
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translation;
                    } else if (typeof translation === 'string' && translation.includes('<') && translation.includes('>')) {
                        el.innerHTML = translation;
                    } else {
                        el.innerText = translation;
                    }
                }
            });
            
            // Update page title if translation exists
            if (trans.page_title) {
                const baseTitle = document.title.includes('|') 
                    ? document.title.split('|')[1].trim()
                    : 'Déboucheur Expert';
                document.title = `${trans.page_title} | ${baseTitle}`;
            }
        },

        // ====================================================================
        // GET TRANSLATION
        // ====================================================================
        t(key) {
            return this.translations[this.current]?.[key] || key;
        },

        // ====================================================================
        // UPDATE LANGUAGE BUTTONS
        // ====================================================================
        _updateLangButtons() {
            const buttons = document.querySelectorAll('#lang-display, #mobile-lang-display, [data-lang-display]');
            buttons.forEach(el => {
                el.innerText = this.current === 'fr' ? 'EN' : 'FR';
            });
        },

        // ====================================================================
        // INITIALIZE
        // ====================================================================
        init() {
            // Read from localStorage
            this.current = localStorage.getItem('language') || 'fr';
            document.documentElement.lang = this.current;
            
            // Update lang display button (desktop and mobile)
            this._updateLangButtons();
            
            // Apply translations after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.apply());
            } else {
                this.apply();
            }
            window.addEventListener('load', () => this.apply());
            
            // Re-apply translations when components are loaded (they load async)
            document.addEventListener('componentLoaded', () => this.apply(), true);
            
            // MutationObserver for dynamically added content with data-translate
            const observer = new MutationObserver((mutations) => {
                let needsApply = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.hasAttribute?.('data-translate') || node.querySelector?.('[data-translate]')) {
                                    needsApply = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (needsApply) break;
                }
                if (needsApply) {
                    // Debounce to avoid multiple rapid calls
                    clearTimeout(this._applyTimeout);
                    this._applyTimeout = setTimeout(() => this.apply(), 50);
                }
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }
            
            // Also apply after delays to catch late-loading components
            setTimeout(() => this.apply(), 500);
            setTimeout(() => this.apply(), 1500);
            setTimeout(() => this.apply(), 3000);
            setTimeout(() => this.apply(), 5000);
            setInterval(() => this.apply(), 8000);
        },

        // ====================================================================
        // ADD CUSTOM TRANSLATIONS
        // ====================================================================
        addTranslations(lang, translations) {
            if (this.translations[lang]) {
                Object.assign(this.translations[lang], translations);
            }
        }
    };

    // ========================================================================
    // GLOBAL SHORTCUT FUNCTION
    // ========================================================================
    const t = (key) => Language.t(key);

    // ========================================================================
    // EXPOSE TO GLOBAL SCOPE
    // ========================================================================
    window.Language = Language;
    window.t = t;

    // ========================================================================
    // AUTO-INITIALIZE
    // ========================================================================
    Language.init();

})();
