/**
 * Déboucheur Expert - Main JavaScript Module
 * Enhanced navigation, tracking, theming, and core functionality
 * Integrated with Alpine.js, Day.js (Montreal timezone), and Panda CSS effects
 * @version 3.0.0
 * @author Déboucheur Expert Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = Object.freeze({
    apiBase: '/api',
    autoRotateInterval: 18000,       // 18 seconds for section auto-scroll
    slideInterval: 8000,             // 8 seconds for hero slideshow
    pauseDuration: 120000,           // 2 minutes pause on user interaction
    testimonialInterval: 12000,      // 12 seconds
    overlayRotateInterval: 30000,    // 30 seconds
    trackingEnabled: true,
    debounceDelay: 150,              // Debounce delay for scroll events
    animationDuration: 300,          // Default animation duration
    phone: {
        primary: '438-530-2343',
        secondary: '438-765-7040',
        formatted: '(438) 530-2343'
    },
    email: {
        fr: 'info@deboucheur.expert',
        en: 'info@unclogged.me'
    }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const Utils = {
    debounce(func, wait = CONFIG.debounceDelay) {
        let timeout;
        // Defensive guard: ensure func is a function before returning a wrapper that will call it.
        if (typeof func !== 'function') {
            console.warn('Utils.debounce expected a function but received:', func);
            // Return a no-op function to avoid runtime TypeErrors in callers.
            return function() { /* no-op */ };
        }
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                try {
                    func(...args);
                } catch (e) {
                    // Catch errors from func to avoid bubbling to global runtime
                    console.error('Error in debounced function:', e);
                }
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit = 16) {
        let inThrottle;
        // Defensive guard: ensure func is a function before returning a wrapper that will call it.
        if (typeof func !== 'function') {
            console.warn('Utils.throttle expected a function but received:', func);
            // Return a no-op function to avoid runtime TypeErrors in callers.
            return function() { /* no-op */ };
        }
        return function(...args) {
            if (!inThrottle) {
                try {
                    func.apply(this, args);
                } catch (e) {
                    console.error('Error in throttled function:', e);
                }
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    $(selector) { return document.querySelector(selector); },
    $$(selector) { return document.querySelectorAll(selector); },

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    },

    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10 
            ? `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
            : phone;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    scrollTo(target, offset = 0) {
        const element = typeof target === 'string' ? Utils.$(target) : target;
        if (!element) return;
        const behavior = Utils.prefersReducedMotion() ? 'auto' : 'smooth';
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior });
    }
};

// ============================================================================
 // SESSION MANAGEMENT
 // ============================================================================

const Session = {
    id: null,
    storageKey: 'deboucheur_session',
    
    init() {
        this.id = localStorage.getItem(this.storageKey);
        if (!this.id || this.isExpired()) {
            this.id = this.generateId();
            this.save();
        }
        return this.id;
    },
    
    generateId() { return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; },
    
    save() {
        localStorage.setItem(this.storageKey, this.id);
        localStorage.setItem(`${this.storageKey}_timestamp`, Date.now().toString());
    },
    
    isExpired() {
        const timestamp = localStorage.getItem(`${this.storageKey}_timestamp`);
        return !timestamp || Date.now() - parseInt(timestamp) > 86400000;
    },
    
    get() { return this.id || this.init(); },
    
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(`${this.storageKey}_timestamp`);
        this.id = null;
    }
};

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

const Language = {
    current: localStorage.getItem('language') || 'fr',
    
    translations: {
        fr: {
            // Navigation
            nav_home: "ACCUEIL", nav_services: "SERVICES", nav_answers: "REPONSES", 
            nav_contact: "OUTILS", nav_location: "LOCALISATION", nav_tarifs: "TARIFICATION", 
            nav_calendar: "EVENEMENTS", nav_guide: "GUIDE", nav_team: "ÉQUIPE", nav_more: "PLUS",
            urgence: "URGENCE 24/7",
            
            // Hero Section
            hero_l1: "BIENVENU CHEZ", hero_l3: "LE DEBOUCHEUR EXPERT", hero_title: "DÉBOUCHEUR EXPERT",
            hero_title_fr: "DÉBOUCHEUR EXPERT", index_title: "DÉBOUCHEUR EXPERT",
            hero_text: "Avec plus de 15 ans d'expérience en plomberie, 10 ans comme compagnon. Billy St-Hilaire est à votre service et vous offre le meilleur service garanti.",
            btn_rdv: "PRENDRE RENDEZ-VOUS",
            
            // Services Section
            services_title: "NOS SERVICES", services_sub: "DE PLOMBERIE",
            srv_urgence: "URGENCE 24/7", srv_urgence_desc: "Intervention rapide. Nuit et jour.",
            srv_reno: "RÉNOVATION", srv_reno_desc: "Salle de bain, cuisine, tuyauterie neuve.",
            srv_insp: "INSPECTION", srv_insp_desc: "Caméra HD. Rapport précis.",
            srv_debouch: "DEBOUCHAGE", srv_debouch_desc: "Égouts, lavabos et toilettes.",
            
            // Expertise Section
            exp_title1: "POURQUOI", exp_title2: "CHOISIR NOTRE", exp_title3: "EXPERTISE ?",
            exp_intro: "Avec Billy St-Hilaire, le savoir-faire traditionnel et les différentes technologies modernes sont combinées.",
            exp_comp_title: "COMPÉTENCES VARIÉES",
            exp_comp_text: "Soudure MIG, TIG et SMAW. Compagnon Plombier, Chauffagiste. De l'expérience à revendre.",
            exp_ponc_title: "PONCTUEL ET ASSIDU",
            exp_ponc_text: "Un appel de confirmation est fait 24h avant. *Frais en cas d'annulation tardive.",
            
            // FAQ Section
            faq_title: "FOIRE AUX QUESTIONS",
            faq_q1: "QUELS SONT VOS TARIFS ?", faq_a1: "Contactez-nous pour une estimation gratuite.",
            faq_q2: "URGENCE DÉBOUCHAGE ?", faq_a2: "Ligne d'urgence 24/7 disponible.",
            faq_q3: "DÉPLACEMENT SUR LA RIVE-NORD ?", faq_a3: "Principalement Rive-Sud et Montréal.",
            faq_q4: "GARANTIE SUR LES TRAVAUX ?", faq_a4: "Oui, tous nos travaux sont garantis.",
            faq_q5: "ACCEPTEZ-VOUS LES CARTES ?", faq_a5: "Oui, crédit, débit et virements acceptés.",
            
            // Contact Section
            contact_send: "ENVOYEZ", contact_info: "INFOS", btn_send: "ENVOYER",
            cta_title: "BESOIN D'AIDE ?", cta_subtitle: "Contactez-nous dès maintenant",
            cta_desc: "Notre équipe est disponible pour répondre à toutes vos questions.",
            cta_contact: "NOUS CONTACTER", cta_form: "FORMULAIRE",
            
            // Form placeholders
            form_fname: "Prénom",
            form_lname: "Nom",
            form_email: "Email",
            form_phone: "(###)###-####",
            form_message: "Message",
            
            // Billy's info
            billy_age: "Billy St-Hilaire, 35 ans,",
            billy_school_1: "Diplômé de l'École des Métiers,",
            billy_school_2: "de la Construction de Montréal,",
            billy_exp_1: "10 ans pour le groupe Centco inc,",
            billy_exp_2: "Contrats multiples avec le local 144,",
            billy_exp_3: "Fier supporteur et employé de",
            billy_exp_4: "Plomberie Martin Boisvert enr.",
            billy_bio_1: "Toujours actif pour répondre aux",
            billy_bio_2: "diverses appels de services.",
            billy_bio_3: "Que ce soit pour changer une valve",
            billy_bio_4: "ou réparer un tuyau qui coule.",
            billy_bio_5: "Le déboucheur sait s'y prendre.",
            billy_note: "*Aucune construction neuve",
            
            // Testimonials & Lessons
            testimonials_title: "TÉMOIGNAGES", phone_title: "TELEPHONE",
            lessons_title: "Leçons Interactives",
            lessons_desc: "Découvrez des conseils pratiques de plomberie avec Billy et apprenez à mieux comprendre votre système de drainage.",
            lessons_btn: "ENCORE PLUS",
            
            // Map Section
            map_call: "APPELER", map_directions: "ITINÉRAIRE", map_save: "SAUVER", map_share: "PARTAGER",
            
            // Cookie Banner
            cookie_msg: "En poursuivant votre navigation, vous acceptez l'utilisation de cookies afin d'améliorer votre expérience.",
            cookie_accept: "Accepter", cookie_learn: "En savoir plus",
            
            // Team Page
            ped_man: "L'HOMME :", ped_exp: "EXPÉRIENCES :", ped_bio: "BIOGRAPHIE :",
            billy_role: "Fondateur & Plombier Compagnon", billy_bio: "15+ ans d'expérience en plomberie résidentielle.",
            nancy_role: "Administration & Service Client", nancy_bio: "Gestion des rendez-vous et suivi client.",
            
            // Form Messages
            form_required: "Veuillez remplir tous les champs obligatoires.",
            form_sending: "Envoi en cours…",
            form_success: "Merci ! Votre message a été envoyé.",
            form_error: "Erreur : impossible d'envoyer. Réessayez plus tard.",
            form_invalid_email: "Veuillez entrer une adresse courriel valide.",
            form_invalid_phone: "Veuillez entrer un numéro de téléphone valide.",
            
            // Error Pages
            err_title: "PAGE NON TROUVÉE", err_msg: "Oups ! La page que vous cherchez semble avoir fui... comme un tuyau mal joint.",
            err_home: "Retour à l'accueil", err_call: "Appelez Billy!", err_help: "Besoin d'aide?",
            back_home: "Retour à l'accueil", call_us: "Appelez-nous", need_help: "Besoin d'aide ?",
            
            // Prices Page
            prices_subtitle: "Des prix transparents pour un service de qualité",
            prices_section_title: "NOS TARIFS", per_hour: "/1ère heure", starting_from: "à partir de",
            emergency_available: "24/7 Urgence disponible",
            cable_standard: "CÂBLE STANDARD", cable_medium: "CÂBLE MOYEN", cable_large: "GROS CÂBLE",
            cable_1: "Câble 1/4\" à 3/8\"", cable_2: "Câble 1/2\"", cable_3: "Câble 5/8\" à 3/4\"",
            for_sinks: "Lavabos et éviers", for_baths: "Baignoires", for_small_pipes: "Petites conduites",
            for_toilets: "Toilettes", for_floor_drains: "Drains de plancher", for_med_pipes: "Conduites moyennes",
            for_main_sewer: "Égouts principaux", for_entry_pipes: "Conduites d'entrée", for_major_blocks: "Blocages majeurs",
            popular: "POPULAIRE", full_pricing_grid: "GRILLE TARIFAIRE COMPLÈTE",
            service_diameter: "Service / Diamètre", weekdays: "Jours ouvrables",
            nights_weekends: "Nuit & Week-ends", holidays: "Jours fériés", holidays_title: "Jours fériés",
            tax_note: "Taxes en sus. Prix sujets à changement.",
            travel: "DÉPLACEMENT", travel_desc: "Frais de déplacement selon la distance.",
            additional_services: "SERVICES ADDITIONNELS",
            camera_inspection: "Inspection caméra", camera_inspection_desc: "Diagnostic visuel HD des conduites.",
            detailed_report: "Rapport détaillé", detailed_report_desc: "Documentation complète avec recommandations.",
            hydro_jet: "Jet haute pression", hydro_jet_desc: "Nettoyage en profondeur des conduites.",
            extended_hours: "Heures prolongées", extended_hours_desc: "Intervention après 18h.",
            extended_warranty: "Garantie prolongée", extended_warranty_desc: "Couverture supplémentaire disponible.",
            extra_hours: "Heures supplémentaires", extra_hours_desc: "80$/heure après la première heure.",
            base_rate_info: "Tarif de base inclut la première heure de service.",
            base_rate_note: "Le tarif peut varier selon la complexité du travail.",
            pricing_legend_title: "Légende des tarifs",
            rate_standard: "TARIF STANDARD", rate_standard_desc: "Heures régulières de travail.", rate_standard_hours: "Lun-Ven 8h-18h",
            rate_extended: "TARIF PROLONGÉ", rate_extended_desc: "Soirs et fins de semaine.", rate_extended_hours: "18h-8h, Sam-Dim",
            rate_emergency: "TARIF URGENCE", rate_emergency_desc: "Intervention immédiate.", rate_emergency_hours: "Sur appel 24/7",
            rate_premium: "TARIF PREMIUM", rate_premium_desc: "Jours fériés.", rate_premium_hours: "Fêtes nationales",
            
            // Plumbing Guide
            plumbing_hero_title: "GUIDE PRATIQUE DE PLOMBERIE", plumbing_hero_subtitle: "Tout savoir sur la plomberie résidentielle",
            toc_supply: "Alimentation en eau", toc_drainage: "Système de drainage",
            toc_debouchage: "Débouchage", toc_normes: "Normes et règlements",
            toc_quick: "Guide rapide", toc_detailed: "Guide détaillé",
            supply_title: "ALIMENTATION EN EAU", supply_subtitle: "Comprendre votre système d'eau potable",
            drainage_title: "SYSTÈME DE DRAINAGE", drainage_subtitle: "Comment fonctionne votre évacuation",
            unclog_title: "DÉBOUCHAGE", unclog_subtitle: "Techniques et solutions",
            normes_title: "NORMES ET RÈGLEMENTS", normes_subtitle: "Conformité et sécurité",
            
            // Debouchage Section
            title_debouchage: "DÉBOUCHAGE", title_urgences: "URGENCES", title_entretien: "ENTRETIEN",
            title_inspection: "INSPECTION", title_conseils: "CONSEILS",
            sec_debouchage: "Débouchage", sec_urgences: "Urgences", sec_entretien: "Entretien",
            sec_inspection: "Inspection", sec_conseils: "Conseils",
            tech_cable: "Câble mécanique", tech_cable_desc: "Le câble rotatif dégage les obstructions solides.",
            tech_hydro: "Jet haute pression", tech_hydro_desc: "L'hydrocurage nettoie les parois des conduites.",
            hydro_1: "Nettoyage en profondeur", hydro_2: "Élimine graisse et résidus", hydro_3: "Préventif et curatif",
            
            // Urgency Section
            urg_when: "Quand appeler en urgence ?",
            urg_1: "Eau qui remonte par les drains",
            urg_2: "Toilettes complètement bouchées",
            urg_3: "Odeurs d'égout persistantes",
            urg_4: "Inondation dans le sous-sol",
            urg_5: "Drain principal obstrué",
            urg_6: "Fuite d'eau majeure",
            urg_wait: "En attendant notre arrivée :",
            urg_step1: "Fermez l'alimentation d'eau si possible",
            urg_step2: "Ne tirez plus la chasse d'eau",
            urg_step3: "Évitez d'utiliser les drains",
            urg_step4: "Préparez l'accès aux conduites",
            
            // Entretien Section
            ent_drains: "Entretien des drains", ent_drains_desc: "Nettoyez régulièrement les crépines.",
            ent_drains_tip: "Versez de l'eau bouillante une fois par semaine.",
            ent_ext: "Entretien extérieur", ent_ext_desc: "Vérifiez les drains de fondation.",
            ent_ext_tip: "Dégagez les feuilles et débris à l'automne.",
            
            // Inspection Section
            insp_desc: "Nos inspections par caméra permettent de diagnostiquer les problèmes sans excavation.",
            insp_diag: "Diagnostic précis", insp_diag_sub: "Identification des obstructions et fissures.",
            insp_rec: "Recommandations", insp_rec_sub: "Solutions adaptées à votre situation.",
            insp_mes: "Mesures préventives", insp_mes_sub: "Évitez les problèmes futurs.",
            
            // Tips Section
            tip_filters: "Utilisez des filtres", tip_filters_desc: "Installez des crépines sur tous vos drains.",
            tip_never: "Ne jamais jeter", tip_never_desc: "Graisses, lingettes, cotons-tiges dans les drains.",
            tip_winter: "Préparation hivernale", tip_winter_desc: "Protégez vos tuyaux du gel.",
            
            // Drainage Slope Section
            drainage_slope_title: "LA PENTE D'ÉVACUATION",
            drainage_slope_intro: "La pente des conduites d'évacuation est cruciale pour le bon écoulement des eaux usées. Une pente incorrecte cause des blocages récurrents et des odeurs. Les codes de plomberie spécifient des pentes différentes selon le diamètre du tuyau.",
            drainage_small_pipes: "Tuyaux ≤ 3\" <span class=\"text-sm opacity-70\">(≤ 76 mm)</span>",
            drainage_large_pipes: "Tuyaux ≥ 4\" <span class=\"text-sm opacity-70\">(≥ 100 mm)</span>",
            slope_ideal: "Pente idéale",
            slope_minimum: "Minimum acceptable",
            slope_stagnation: "Stagnation",
            drainage_slope_warning: "<strong>⚠️ Attention :</strong> Une pente trop faible provoque la stagnation des solides, une pente trop forte peut vider prématurément les siphons (effet de siphonnage).",
            
            // Tools Page
            tools_grid_title: "NOTRE ÉQUIPEMENT",
            
            // Events Page
            events_subtitle: "Calendrier et disponibilités",
            calendar_title: "DISPONIBILITÉS", view_calendar: "Voir le calendrier",
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
            toc_detailed: "GUIDES DÉTAILLÉS",
            toc_supply: "Alimentation en eau",
            toc_drainage: "Système de drainage",
            toc_debouchage: "Débouchage",
            toc_normes: "Normes plomberie",
            toc_quick: "SECTIONS RAPIDES",
            sec_debouchage: "Débouchage",
            sec_inspection: "Inspection",
            sec_entretien: "Entretien",
            sec_urgences: "Urgences",
            sec_conseils: "Conseils",
            
            // Team Page
            team_title: "NOTRE ÉQUIPE",
            billy_role: "Plombier retraité & Propriétaire",
            billy_bio: "Billy St‑Hilaire est un ancien plombier possédant plus de quinze années d'expérience. Après une carrière bien remplie, il se consacre désormais à offrir son expertise comme propriétaire de Déboucheur Expert. Passionné par les nouvelles technologies et la mécanique, il veille à ce que chaque intervention soit réalisée avec la même précision et la même rigueur que celles de sa carrière de plombier.",
            nancy_role: "Conductrice & Associée",
            nancy_bio: "Nancy Boulianne est conductrice et associée au sein de l'entreprise. Elle accompagne Billy lors des interventions et s'assure que l'équipe arrive à destination rapidement et en toute sécurité. Fortement organisée et chaleureuse, elle joue un rôle clé pour offrir un service incomparable.",
            
            // Offline Page
            offline_title: "HORS LIGNE",
            offline_msg: "Vous n'êtes pas connecté à Internet. Le site fonctionne en mode hors ligne.",
            
            // Conditions Page
            conditions_title: "CONDITIONS GÉNÉRALES",
            
            // Politics Page
            politics_title: "POLITIQUE DE CONFIDENTIALITÉ",
            politics_index: "Index",
            pol_1: "Introduction", pol_2: "Renseignements", pol_3: "Finalités", pol_4: "Communication",
            pol_5: "Sécurité", pol_6: "Vos droits", pol_7: "Cookies", pol_8: "Modifications", pol_9: "Contact",
            
            // Index Sections
            idx_1: "ACCUEIL", idx_2: "SERVICES", idx_3: "EXPERTISE", idx_4: "FAQ",
            idx_5: "CONTACT", idx_6: "TÉMOIGNAGES", idx_7: "LEÇONS", idx_8: "CARTE", idx_9: "PIED DE PAGE",
            
            // Footer Links
            footer_privacy: "Politique de confidentialité",
            footer_terms: "Conditions d'utilisation",
            footer_team: "Équipe",
            
            // Search Placeholder
            search_placeholder: "Rechercher un outil...",
            
            // Page title
            page_title: "Déboucheur Expert"
        },
        en: {
            // Navigation
            nav_home: "HOME", nav_services: "SERVICES", nav_answers: "ANSWERS", 
            nav_contact: "TOOLS", nav_location: "LOCATION", nav_tarifs: "PRICING", 
            nav_calendar: "EVENTS", nav_guide: "GUIDE", nav_team: "TEAM", nav_more: "MORE",
            urgence: "EMERGENCY 24/7",
            
            // Hero Section
            hero_l1: "WELCOME TO", hero_l3: "THE UNCLOGGER EXPERT", hero_title: "UNCLOGGER EXPERT",
            hero_title_fr: "DÉBOUCHEUR EXPERT", index_title: "UNCLOGGER EXPERT",
            hero_text: "With over 15 years of plumbing experience, 10 years as a journeyman. Billy St-Hilaire is at your service with guaranteed satisfaction.",
            btn_rdv: "BOOK APPOINTMENT",
            
            // Services Section
            services_title: "OUR SERVICES", services_sub: "PLUMBING",
            srv_urgence: "EMERGENCY 24/7", srv_urgence_desc: "Quick intervention. Day and night.",
            srv_reno: "RENOVATION", srv_reno_desc: "Bathroom, kitchen, new piping.",
            srv_insp: "INSPECTION", srv_insp_desc: "HD Camera. Detailed report.",
            srv_debouch: "UNCLOGGING", srv_debouch_desc: "Sewers, sinks and toilets.",
            
            // Expertise Section
            exp_title1: "WHY", exp_title2: "CHOOSE OUR", exp_title3: "EXPERTISE ?",
            exp_intro: "With Billy St-Hilaire, traditional know-how and modern technologies are combined.",
            exp_comp_title: "VARIED SKILLS",
            exp_comp_text: "MIG, TIG and SMAW welding. Journeyman Plumber, HVAC Tech. Experience to spare.",
            exp_ponc_title: "PUNCTUAL AND DEDICATED",
            exp_ponc_text: "Confirmation call made 24h before. *Late cancellation fees apply.",
            
            // FAQ Section
            faq_title: "FREQUENTLY ASKED QUESTIONS",
            faq_q1: "WHAT ARE YOUR RATES?", faq_a1: "Contact us for a free estimate.",
            faq_q2: "UNCLOGGING EMERGENCY?", faq_a2: "24/7 emergency line available.",
            faq_q3: "DO YOU SERVICE NORTH SHORE?", faq_a3: "Mainly South Shore and Montreal.",
            faq_q4: "WARRANTY ON WORK?", faq_a4: "Yes, all our work is guaranteed.",
            faq_q5: "DO YOU ACCEPT CARDS?", faq_a5: "Yes, credit, debit and transfers accepted.",
            
            // Contact Section
            contact_send: "SEND", contact_info: "INFO", btn_send: "SEND",
            cta_title: "NEED HELP?", cta_subtitle: "Contact us now",
            cta_desc: "Our team is available to answer all your questions.",
            cta_contact: "CONTACT US", cta_form: "FORM",
            
            // Form placeholders
            form_fname: "First Name",
            form_lname: "Last Name",
            form_email: "Email",
            form_phone: "(###)###-####",
            form_message: "Message",
            
            // Billy's info
            billy_age: "Billy St-Hilaire, 35 years old,",
            billy_school_1: "Graduate of École des Métiers,",
            billy_school_2: "de la Construction de Montréal,",
            billy_exp_1: "10 years with Centco inc group,",
            billy_exp_2: "Multiple contracts with local 144,",
            billy_exp_3: "Proud supporter and employee of",
            billy_exp_4: "Plomberie Martin Boisvert inc.",
            billy_bio_1: "Always ready to answer",
            billy_bio_2: "various service calls.",
            billy_bio_3: "Whether changing a valve",
            billy_bio_4: "or fixing a leaking pipe.",
            billy_bio_5: "The unclogger knows how to do it.",
            billy_note: "*No new construction",
            
            // Testimonials & Lessons
            testimonials_title: "TESTIMONIALS", phone_title: "PHONE",
            lessons_title: "Interactive Lessons",
            lessons_desc: "Discover practical plumbing tips with Billy and learn to better understand your drainage system.",
            lessons_btn: "EVEN MORE",
            
            // Map Section
            map_call: "CALL", map_directions: "DIRECTIONS", map_save: "SAVE", map_share: "SHARE",
            
            // Cookie Banner
            cookie_msg: "By continuing to browse, you accept the use of cookies to improve your experience.",
            cookie_accept: "Accept", cookie_learn: "Learn more",
            
            // Team Page
            ped_man: "THE MAN:", ped_exp: "EXPERIENCE:", ped_bio: "BIOGRAPHY:",
            billy_role: "Founder & Journeyman Plumber", billy_bio: "15+ years of residential plumbing experience.",
            nancy_role: "Administration & Customer Service", nancy_bio: "Appointment scheduling and client follow-up.",
            
            // Form Messages
            form_required: "Please fill in all required fields.",
            form_sending: "Sending…",
            form_success: "Thank you! Your message has been sent.",
            form_error: "Error: could not send. Please try again later.",
            form_invalid_email: "Please enter a valid email address.",
            form_invalid_phone: "Please enter a valid phone number.",
            
            // Error Pages
            err_title: "PAGE NOT FOUND", err_msg: "Oops! The page you're looking for seems to have leaked away... like a poorly sealed pipe.",
            err_home: "Back to Home", err_call: "Call Billy!", err_help: "Need help?",
            back_home: "Back to Home", call_us: "Call Us", need_help: "Need Help?",
            
            // Prices Page
            prices_subtitle: "Transparent pricing for quality service",
            prices_section_title: "OUR RATES", per_hour: "/1st hour", starting_from: "starting from",
            emergency_available: "24/7 Emergency available",
            cable_standard: "STANDARD CABLE", cable_medium: "MEDIUM CABLE", cable_large: "LARGE CABLE",
            cable_1: "Cable 1/4\" to 3/8\"", cable_2: "Cable 1/2\"", cable_3: "Cable 5/8\" to 3/4\"",
            for_sinks: "Sinks and basins", for_baths: "Bathtubs", for_small_pipes: "Small pipes",
            for_toilets: "Toilets", for_floor_drains: "Floor drains", for_med_pipes: "Medium pipes",
            for_main_sewer: "Main sewers", for_entry_pipes: "Entry pipes", for_major_blocks: "Major blockages",
            popular: "POPULAR", full_pricing_grid: "COMPLETE PRICING GRID",
            service_diameter: "Service / Diameter", weekdays: "Weekdays",
            nights_weekends: "Nights & Weekends", holidays: "Holidays", holidays_title: "Holidays",
            tax_note: "Taxes extra. Prices subject to change.",
            travel: "TRAVEL", travel_desc: "Travel fees based on distance.",
            additional_services: "ADDITIONAL SERVICES",
            camera_inspection: "Camera inspection", camera_inspection_desc: "HD visual diagnostic of pipes.",
            detailed_report: "Detailed report", detailed_report_desc: "Complete documentation with recommendations.",
            hydro_jet: "High pressure jet", hydro_jet_desc: "Deep cleaning of pipes.",
            extended_hours: "Extended hours", extended_hours_desc: "Service after 6pm.",
            extended_warranty: "Extended warranty", extended_warranty_desc: "Additional coverage available.",
            extra_hours: "Extra hours", extra_hours_desc: "$80/hour after the first hour.",
            base_rate_info: "Base rate includes first hour of service.",
            base_rate_note: "Rate may vary based on job complexity.",
            pricing_legend_title: "Rate Legend",
            rate_standard: "STANDARD RATE", rate_standard_desc: "Regular working hours.", rate_standard_hours: "Mon-Fri 8am-6pm",
            rate_extended: "EXTENDED RATE", rate_extended_desc: "Evenings and weekends.", rate_extended_hours: "6pm-8am, Sat-Sun",
            rate_emergency: "EMERGENCY RATE", rate_emergency_desc: "Immediate intervention.", rate_emergency_hours: "On call 24/7",
            rate_premium: "PREMIUM RATE", rate_premium_desc: "Holidays.", rate_premium_hours: "National holidays",
            
            // Plumbing Guide
            plumbing_hero_title: "PLUMBING GUIDE", plumbing_hero_subtitle: "Everything about residential plumbing",
            toc_supply: "Water Supply", toc_drainage: "Drainage System",
            toc_debouchage: "Unclogging", toc_normes: "Codes and Regulations",
            toc_quick: "Quick Guide", toc_detailed: "Detailed Guide",
            supply_title: "WATER SUPPLY", supply_subtitle: "Understanding your potable water system",
            drainage_title: "DRAINAGE SYSTEM", drainage_subtitle: "How your drainage works",
            unclog_title: "UNCLOGGING", unclog_subtitle: "Techniques and solutions",
            normes_title: "CODES AND REGULATIONS", normes_subtitle: "Compliance and safety",
            
            // Debouchage Section
            title_debouchage: "UNCLOGGING", title_urgences: "EMERGENCIES", title_entretien: "MAINTENANCE",
            title_inspection: "INSPECTION", title_conseils: "TIPS",
            sec_debouchage: "Unclogging", sec_urgences: "Emergencies", sec_entretien: "Maintenance",
            sec_inspection: "Inspection", sec_conseils: "Tips",
            tech_cable: "Mechanical cable", tech_cable_desc: "The rotating cable clears solid blockages.",
            tech_hydro: "High pressure jet", tech_hydro_desc: "Hydro-jetting cleans pipe walls.",
            hydro_1: "Deep cleaning", hydro_2: "Removes grease and residue", hydro_3: "Preventive and curative",
            
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
            ent_drains: "Drain maintenance", ent_drains_desc: "Regularly clean the strainers.",
            ent_drains_tip: "Pour boiling water once a week.",
            ent_ext: "Outdoor maintenance", ent_ext_desc: "Check foundation drains.",
            ent_ext_tip: "Clear leaves and debris in fall.",
            
            // Inspection Section
            insp_desc: "Our camera inspections diagnose problems without excavation.",
            insp_diag: "Precise diagnosis", insp_diag_sub: "Identification of blockages and cracks.",
            insp_rec: "Recommendations", insp_rec_sub: "Solutions tailored to your situation.",
            insp_mes: "Preventive measures", insp_mes_sub: "Avoid future problems.",
            
            // Tips Section
            tip_filters: "Use filters", tip_filters_desc: "Install strainers on all your drains.",
            tip_never: "Never throw", tip_never_desc: "Grease, wipes, cotton swabs in drains.",
            tip_winter: "Winter preparation", tip_winter_desc: "Protect your pipes from freezing.",
            
            // Drainage Slope Section
            drainage_slope_title: "DRAIN PIPE SLOPE",
            drainage_slope_intro: "The slope of drain pipes is crucial for proper wastewater flow. Incorrect slope causes recurring blockages and odors. Plumbing codes specify different slopes depending on pipe diameter.",
            drainage_small_pipes: "Pipes ≤ 3\" <span class=\"text-sm opacity-70\">(≤ 76 mm)</span>",
            drainage_large_pipes: "Pipes ≥ 4\" <span class=\"text-sm opacity-70\">(≥ 100 mm)</span>",
            slope_ideal: "Ideal slope",
            slope_minimum: "Minimum acceptable",
            slope_stagnation: "Stagnation",
            drainage_slope_warning: "<strong>⚠️ Warning:</strong> A slope that's too shallow causes solids to stagnate, while a slope that's too steep can prematurely empty trap seals (siphoning effect).",
            
            // Tools Page
            tools_grid_title: "OUR EQUIPMENT",
            
            // Events Page
            events_subtitle: "Calendar and availability",
            calendar_title: "AVAILABILITY", view_calendar: "View calendar",
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
            toc_detailed: "DETAILED GUIDES",
            toc_supply: "Water supply",
            toc_drainage: "Drainage system",
            toc_debouchage: "Unclogging",
            toc_normes: "Plumbing codes",
            toc_quick: "QUICK SECTIONS",
            sec_debouchage: "Unclogging",
            sec_inspection: "Inspection",
            sec_entretien: "Maintenance",
            sec_urgences: "Emergencies",
            sec_conseils: "Tips",
            
            // Team Page
            team_title: "OUR TEAM",
            billy_role: "Retired Plumber & Owner",
            billy_bio: "Billy St‑Hilaire is a retired plumber with more than fifteen years of experience. After a successful career he now dedicates himself to offering his expertise as the owner of Déboucheur Expert. Passionate about new technologies and mechanics, he ensures that every intervention is carried out with the same precision and rigour as during his plumbing career.",
            nancy_role: "Driver & Partner",
            nancy_bio: "Nancy Boulianne is the driver and partner in the business. She accompanies Billy on service calls and makes sure the team arrives quickly and safely. Well organised and friendly, she plays a key role in delivering an exceptional service.",
            
            // Offline Page
            offline_title: "OFFLINE",
            offline_msg: "You are not connected to the Internet. The site is running in offline mode.",
            
            // Conditions Page
            conditions_title: "TERMS & CONDITIONS",
            
            // Politics Page  
            politics_title: "PRIVACY POLICY",
            politics_index: "Index",
            pol_1: "Introduction", pol_2: "Information", pol_3: "Purposes", pol_4: "Sharing",
            pol_5: "Security", pol_6: "Your Rights", pol_7: "Cookies", pol_8: "Modifications", pol_9: "Contact",
            
            // Index Sections
            idx_1: "HOME", idx_2: "SERVICES", idx_3: "EXPERTISE", idx_4: "FAQ",
            idx_5: "CONTACT", idx_6: "TESTIMONIALS", idx_7: "LESSONS", idx_8: "MAP", idx_9: "FOOTER",
            
            // Footer Links
            footer_privacy: "Privacy Policy",
            footer_terms: "Terms of Use",
            footer_team: "Team",
            
            // Search Placeholder
            search_placeholder: "Search for a tool...",
            
            // Page title
            page_title: "Unclogger Expert"
        }
    },

    toggle() {
        this.current = this.current === 'fr' ? 'en' : 'fr';
        localStorage.setItem('language', this.current);
        document.documentElement.lang = this.current;
        
        // Update all lang-display buttons (may be multiple on page)
        // Show target language (EN when French is active, FR when English is active)
        Utils.$$('#lang-display, #mobile-lang-display, [data-lang-display]').forEach(el => {
            el.innerText = this.current === 'fr' ? 'EN' : 'FR';
        });
        
        this.apply();
        
        // Dispatch custom event for pages with local translations (e.g., tools page)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: this.current } }));
        
        Tracking.event('language_change', { language: this.current });
    },

    apply() {
        const lang = this.current;
        const trans = this.translations[lang];
        if (!trans) return;
        
        Utils.$$('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = trans[key];
            if (translation) {
                // Use innerHTML for translations containing HTML, innerText otherwise
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else if (translation.includes('<') && translation.includes('>')) {
                    el.innerHTML = translation;
                } else {
                    el.innerText = translation;
                }
            }
        });
        
        // Handle data-translate-placeholder for form inputs
        Utils.$$('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            const translation = trans[key];
            if (translation) {
                el.placeholder = translation;
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

    t(key) { return this.translations[this.current]?.[key] || key; },

    init() {
        // Read from localStorage
        this.current = localStorage.getItem('language') || 'fr';
        document.documentElement.lang = this.current;
        
        // Update lang display button (desktop and mobile)
        // Show target language on button (EN when French is active, FR when English is active)
        Utils.$$('#lang-display, #mobile-lang-display, [data-lang-display]').forEach(el => {
            el.innerText = this.current === 'fr' ? 'EN' : 'FR';
        });
        
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
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Also apply after delays to catch late-loading components
        setTimeout(() => this.apply(), 500);
        setTimeout(() => this.apply(), 1500);
        setTimeout(() => this.apply(), 3000);
        setTimeout(() => this.apply(), 5000);
        setInterval(() => this.apply(), 8000);
    }
};

// Language module is now loaded from lang.js (loaded before main.js)
// This block provides fallback compatibility if lang.js is not loaded

// Use Language from lang.js if available, otherwise create minimal fallback
if (typeof Language === 'undefined' || !window.Language) {
    console.warn('lang.js not loaded - using fallback Language object');
    window.Language = {
        current: localStorage.getItem('language') || 'fr',
        translations: { fr: {}, en: {} },
        toggle() {
            this.current = this.current === 'fr' ? 'en' : 'fr';
            localStorage.setItem('language', this.current);
            document.documentElement.lang = this.current;
        },
        apply() {},
        t(key) { return key; },
        init() { document.documentElement.lang = this.current; }
    };
}

// Ensure Language is available as const for this module
const Language = window.Language;
const t = (key) => Language.t(key);

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

const Theme = {
    current: localStorage.getItem('theme') || 'dark',
    
    toggle() {
        document.documentElement.classList.toggle('dark');
        this.current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', this.current);
        Tracking.event('theme_change', { theme: this.current });
    },

    init() {
        const saved = localStorage.getItem('theme');
        if (saved === 'light') document.documentElement.classList.remove('dark');
        else if (saved === 'dark') document.documentElement.classList.add('dark');
        else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.classList.remove('dark');
            this.current = 'light';
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
                this.current = e.matches ? 'dark' : 'light';
            }
        });
    },

    isDark() { return document.documentElement.classList.contains('dark'); }
};


// ============================================================================
// TRACKING
// ============================================================================

const Tracking = {

    queue: [],
    processing: false,

    async event(eventType, data = {}) {
        if (!CONFIG.trackingEnabled) return;
        const payload = { sessionId: Session.get(), eventType, pageUrl: window.location.href, timestamp: Date.now(), ...data };
        this.queue.push(payload);
        this.processQueue();
    },

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        while (this.queue.length > 0) {
            const payload = this.queue.shift();
            try {
                await fetch(\`\${CONFIG.apiBase}/event.php\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                console.debug('Tracking error:', e);
                if (!payload._retries || payload._retries < 3) {
                    payload._retries = (payload._retries || 0) + 1;
                    this.queue.push(payload);
                }
            }
        }
        this.processing = false;
    },

    async pageView() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
        const screenInfo = window.screen || {};
        const languages = Array.isArray(navigator.languages) ? navigator.languages : (navigator.languages ? [navigator.languages] : []);
        let uaDataPayload = null;
        if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
            try {
                uaDataPayload = await navigator.userAgentData.getHighEntropyValues([
                    'architecture', 'model', 'platform', 'platformVersion', 'uaFullVersion', 'fullVersionList', 'bitness'
                ]);
                uaDataPayload.brands = navigator.userAgentData.brands || navigator.userAgentData.uaList || [];
                uaDataPayload.mobile = navigator.userAgentData.mobile || false;
            } catch (_) {
                uaDataPayload = {
                    brands: navigator.userAgentData.brands || navigator.userAgentData.uaList || [],
                    mobile: navigator.userAgentData.mobile || false
                };
            }
        }
        try {
            const data = {
                sessionId: Session.get(),
                page: window.location.pathname,
                pageUrl: window.location.href,
                pageTitle: document.title,
                hash: window.location.hash,
                queryString: window.location.search,
                referrer: document.referrer,
                screenWidth: screenInfo.width || window.innerWidth,
                screenHeight: screenInfo.height || window.innerHeight,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                colorDepth: screenInfo.colorDepth || null,
                pixelRatio: window.devicePixelRatio || 1,
                language: Language.current,
                lang: Language.current,
                languages,
                theme: Theme.current,
                tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
                timezoneOffset: new Date().getTimezoneOffset(),
                cookiesEnabled: navigator.cookieEnabled ? 1 : 0,
                doNotTrack: navigator.doNotTrack || navigator.msDoNotTrack || window.doNotTrack || null,
                deviceMemory: navigator.deviceMemory || null,
                hardwareConcurrency: navigator.hardwareConcurrency || null,
                maxTouchPoints: navigator.maxTouchPoints || 0,
                platform: navigator.platform || null,
                vendor: navigator.vendor || null,
                connectionType: conn.effectiveType || null,
                connectionDownlink: typeof conn.downlink === 'number' ? conn.downlink : null,
                connectionRtt: typeof conn.rtt === 'number' ? conn.rtt : null,
                saveData: !!conn.saveData,
                userAgent: navigator.userAgent,
                clientHints: {
                    uaData: uaDataPayload,
                    connection: {
                        effectiveType: conn.effectiveType || null,
                        downlink: typeof conn.downlink === 'number' ? conn.downlink : null,
                        rtt: typeof conn.rtt === 'number' ? conn.rtt : null,
                        saveData: !!conn.saveData
                    },
                    storageSupport: {
                        localStorage: (() => { try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return true; } catch(_) { return false; } })(),
                        sessionStorage: (() => { try { sessionStorage.setItem('_t','1'); sessionStorage.removeItem('_t'); return true; } catch(_) { return false; } })(),
                        indexedDb: !!window.indexedDB
                    }
                },
                timestamp: Date.now()
            };
            await fetch(\`\${CONFIG.apiBase}/track.php\`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) { console.debug('Page view tracking error:', e); }
    },

    trackClicks() {
        Utils.$$('a[href^="tel:"]').forEach(el => {
            el.addEventListener('click', () => this.event('phone_click', { phone: el.href }));
        });
        Utils.$$('a[href^="mailto:"]').forEach(el => {
            el.addEventListener('click', () => this.event('email_click', { email: el.href }));
        });
        Utils.$$('[data-track]').forEach(el => {
            el.addEventListener('click', () => this.event('cta_click', { action: el.dataset.track, text: el.innerText?.slice(0, 50) }));
        });
    }
};

// ============================================================================
// FORM HANDLING
// ============================================================================

const Form = {
    validators: {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value.replace(/\D/g, '')),
        required: (value) => value.trim().length > 0,
        minLength: (value, length) => value.trim().length >= length
    },

    saveCache(key, value) { localStorage.setItem(\`form_\${key}\`, value); },
    getCache(key) { return localStorage.getItem(\`form_\${key}\`) || ''; },
    clearCache(keys) { keys.forEach(key => localStorage.removeItem(\`form_\${key}\`)); },

    restoreCache() {
        ['fname', 'lname', 'email', 'phone', 'msg'].forEach(key => {
            const val = this.getCache(key);
            const el = Utils.$(\`#\${key}\`);
            if (val && el) el.value = val;
        });
    },

    formatPhone(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        if (value.length >= 6) input.value = \`(\${value.slice(0,3)}) \${value.slice(3,6)}-\${value.slice(6)}\`;
        else if (value.length >= 3) input.value = \`(\${value.slice(0,3)}) \${value.slice(3)}\`;
        else input.value = value;
    },

    highlightInput(el, state = 'focus') {
        el.classList.remove('input-focus', 'input-valid', 'input-error');
        if (state === 'focus') el.classList.add('input-focus');
        else if (state === 'valid') el.classList.add('input-valid');
        else if (state === 'error') el.classList.add('input-error');
    },

    validateInput(el) {
        const value = el.value.trim();
        const type = el.type || el.tagName.toLowerCase();
        el.classList.remove('input-focus');
        if (value.length === 0) { el.classList.remove('input-valid', 'input-error'); return null; }
        
        let isValid = true;
        if (type === 'email') isValid = this.validators.email(value);
        else if (type === 'tel') isValid = this.validators.phone(value);
        else isValid = this.validators.minLength(value, 2);
        
        this.highlightInput(el, isValid ? 'valid' : 'error');
        return isValid;
    },

    async submit() {
        const fields = {
            fname: Utils.$('#fname')?.value.trim(),
            lname: Utils.$('#lname')?.value.trim(),
            email: Utils.$('#email')?.value.trim(),
            phone: Utils.$('#phone')?.value.trim(),
            msg: Utils.$('#msg')?.value.trim()
        };
        const statusDiv = Utils.$('#contact-status');
        if (!statusDiv) return;
        
        statusDiv.className = 'text-xs md:text-sm font-bold mt-2';
        
        if (!fields.fname || !fields.lname || !fields.email || !fields.msg) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_required');
            return;
        }
        
        if (!this.validators.email(fields.email)) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_invalid_email');
            return;
        }
        
        if (fields.phone && !this.validators.phone(fields.phone)) {
            statusDiv.classList.remove('hidden');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_invalid_phone');
            return;
        }
        
        statusDiv.classList.remove('hidden');
        statusDiv.classList.add('text-blue');
        statusDiv.innerText = t('form_sending');
        Tracking.event('form_submit', { formId: 'contact' });
        
        try {
            const formData = new FormData();
            Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
            formData.append('lang', Language.current);
            formData.append('env', 'prod');
            
            const fileInput = Utils.$('#attachment');
            if (fileInput?.files?.length > 0) formData.append('attachment', fileInput.files[0]);
            
            const res = await fetch(\`\${CONFIG.apiBase}/contact.php\`, { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data?.status === 'ok') {
                statusDiv.classList.remove('text-blue');
                statusDiv.classList.add('text-green-600');
                statusDiv.innerText = t('form_success');
                ['fname', 'lname', 'email', 'phone', 'msg'].forEach(key => {
                    this.clearCache([key]);
                    const el = Utils.$(\`#\${key}\`);
                    if (el) { el.value = ''; el.classList.remove('input-valid', 'input-error'); }
                });
                if (fileInput) fileInput.value = '';
                Tracking.event('form_success', { formId: 'contact' });
            } else throw new Error('Bad response');
        } catch (err) {
            statusDiv.classList.remove('text-blue');
            statusDiv.classList.add('text-red-600');
            statusDiv.innerText = t('form_error');
            Tracking.event('form_error', { formId: 'contact', error: err.message });
        }
    },

    init() {
        this.restoreCache();
        ['fname', 'lname', 'email', 'phone', 'msg'].forEach(id => {
            const el = Utils.$(\`#\${id}\`);
            if (el) {
                el.addEventListener('input', () => this.saveCache(id, el.value));
                el.addEventListener('focus', () => this.highlightInput(el, 'focus'));
                el.addEventListener('blur', () => this.validateInput(el));
            }
        });
        const phoneInput = Utils.$('#phone');
        if (phoneInput) phoneInput.addEventListener('input', () => this.formatPhone(phoneInput));
    }
};

// ============================================================================
// NAVIGATION
// ============================================================================

const Navigation = {
    autoRotateTimer: null,
    isPaused: false,
    currentSection: 0,
    totalSections: 8,

    scrollToSection(index, smooth = true) {
        const h = window.innerHeight;
        const behavior = smooth && !Utils.prefersReducedMotion() ? 'smooth' : 'auto';
        window.scrollTo({ top: index * h, behavior });
        this.currentSection = index;
        this.pause();
    },

    pause() {
        this.isPaused = true;
        clearInterval(this.autoRotateTimer);
        if (CONFIG.pauseDuration > 0) {
            setTimeout(() => { this.isPaused = false; this.startAutoRotate(); }, CONFIG.pauseDuration);
        }
    },

    startAutoRotate() {
        if (this.isPaused || Utils.prefersReducedMotion()) return;
        clearInterval(this.autoRotateTimer);
        this.autoRotateTimer = setInterval(() => {
            if (!this.isPaused) {
                this.currentSection = (this.currentSection + 1) % 3;
                this.scrollToSection(this.currentSection);
            }
        }, CONFIG.autoRotateInterval);
    },

    updateDots() {
        const scrollPos = window.scrollY;
        const h = window.innerHeight;
        const dots = Utils.$$('.nav-dot');
        dots.forEach(d => d.classList.remove('active'));
        const activeIndex = Math.round(scrollPos / h);
        if (dots[activeIndex]) {
            dots[activeIndex].classList.add('active');
            this.currentSection = activeIndex;
        }
    },

    toggleMobileMenu() {
        const menu = Utils.$('#mobile-menu');
        if (menu) menu.classList.toggle('hidden');
    },

    toggleDropdown() {
        const dropdown = Utils.$('#dropdown-menu');
        const icon = Utils.$('.dropdown-icon');
        if (!dropdown) return;
        dropdown.classList.toggle('dropdown-closed');
        dropdown.classList.toggle('dropdown-open');
        icon?.classList.toggle('rotate-180');
        Tracking.event('dropdown_toggle', { open: dropdown.classList.contains('dropdown-open') });
    },

    handleOutsideClick(e) {
        const container = Utils.$('#dropdown-container');
        const dropdown = Utils.$('#dropdown-menu');
        if (container && dropdown && !container.contains(e.target)) {
            dropdown.classList.add('dropdown-closed');
            dropdown.classList.remove('dropdown-open');
            Utils.$('.dropdown-icon')?.classList.remove('rotate-180');
        }
    },

    init() {
        Utils.$$('.nav-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => this.scrollToSection(index, true));
        });
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        this.startAutoRotate();
    }
};

// ============================================================================
// ACCORDION & CONTACT SLIDER
// ============================================================================

const Accordion = {
    toggle(btn) {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('.rotate-icon');
        content.classList.toggle('open');
        icon?.classList.toggle('active');
        Tracking.event('accordion_toggle', { question: btn.querySelector('[data-translate]')?.getAttribute('data-translate') });
    }
};

const ContactSlider = {
    slide(index) {
        const track = Utils.$('#contact-slider-track');
        if (track) track.style.transform = index === 1 ? 'translateX(-50%)' : 'translateX(0%)';
    }
};

// ============================================================================
// SCROLL HANDLING
// ============================================================================

const ScrollHandler = {
    lastScrollY: 0,
    
    init() {
        const handler = Utils.throttle(() => this.onScroll(), 16);
        window.addEventListener('scroll', handler, { passive: true });
        
        const scrollBtn = Utils.$('#scroll-top-btn');
        if (scrollBtn) scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    },

    onScroll() {
        const scrollPos = window.scrollY;
        const navbar = Utils.$('#navbar');
        
        if (navbar) {
            if (scrollPos > this.lastScrollY && scrollPos > 100) navbar.style.transform = 'translateY(-40vh)';
            else if (scrollPos < this.lastScrollY - 15 || scrollPos < 50) navbar.style.transform = 'translateY(0)';
        }
        
        this.lastScrollY = scrollPos;
        Navigation.updateDots();
        
        const progressBar = Utils.$('#scroll-progress');
        if (progressBar) {
            const doc = document.documentElement;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const progress = scrollHeight > 0 ? (scrollPos / scrollHeight) * 100 : 0;
            progressBar.style.width = \`\${progress}%\`;
        }
        
        const scrollBtn = Utils.$('#scroll-top-btn');
        if (scrollBtn) scrollBtn.classList.toggle('hidden', scrollPos <= window.innerHeight);
    }
};

// ============================================================================
// SERVICE WORKER
// ============================================================================

const ServiceWorker = {
    register() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/assets/scripts/service.js')
                    .then(reg => console.debug('SW registered:', reg.scope))
                    .catch(err => console.warn('SW registration failed:', err));
            });
        }
    }
};

// ============================================================================
// LIBRARIES INTEGRATION (Alpine.js, Day.js, Panda Effects)
// ============================================================================

const LibsIntegration = {
    initialized: false,
    
    /**
     * Initialize integration with libs.js modules
     */
    init() {
        if (this.initialized) return;
        
        // Wait for libs to be ready, or init immediately if already loaded
        if (window.Libs?.initialized) {
            this.connect();
        } else {
            document.addEventListener('libs-ready', () => this.connect(), { once: true });
            // Fallback: also listen for Alpine ready
            document.addEventListener('alpine:init', () => this.syncAlpineStores());
        }
        
        // Initialize scroll animations for Panda CSS effects
        this.initScrollAnimations();
        
        this.initialized = true;
    },
    
    /**
     * Connect main.js modules with libs.js
     */
    connect() {
        this.syncAlpineStores();
        this.initTimeWidget();
        console.debug('🔗 Libraries integration connected');
    },
    
    /**
     * Sync Theme and Language modules with Alpine stores
     */
    syncAlpineStores() {
        if (!window.Alpine) return;
        
        // Sync theme store
        const themeStore = Alpine.store('theme');
        if (themeStore) {
            themeStore.current = Theme.isDark() ? 'dark' : 'light';
        }
        
        // Sync language store
        const langStore = Alpine.store('lang');
        if (langStore) {
            langStore.current = Language.current;
            langStore.translations = Language.translations;
        }
        
        // Listen for Alpine theme changes
        Alpine.effect(() => {
            const alpineTheme = Alpine.store('theme')?.current;
            if (alpineTheme && alpineTheme !== Theme.current) {
                if (alpineTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                Theme.current = alpineTheme;
            }
        });
    },
    
    /**
     * Initialize Montreal time widget if TimeWidget is available
     */
    initTimeWidget() {
        if (!window.TimeWidget) return;
        
        // Check if there's a container for the time widget
        const timeContainer = Utils.$('#montreal-time-widget');
        if (timeContainer) {
            TimeWidget.init('#montreal-time-widget');
        }
        
        // Expose time info for other modules
        window.DeboucheurApp.getMontrealTime = () => window.MontrealTime?.now?.() || new Date();
        window.DeboucheurApp.isBusinessOpen = () => window.MontrealTime?.isBusinessOpen?.() || false;
    },
    
    /**
     * Initialize scroll animations for elements with data-animate attribute
     */
    initScrollAnimations() {
        if (Utils.prefersReducedMotion()) return;
        
        const animatedElements = Utils.$$('[data-animate]');
        if (animatedElements.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Apply stagger delay for children if present
                    const staggerChildren = entry.target.querySelectorAll('[data-stagger]');
                    staggerChildren.forEach((child, index) => {
                        child.style.animationDelay = `${index * 0.1}s`;
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(el => observer.observe(el));
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    Session.init();
    Theme.init();
    Language.init();
    Form.init();
    Navigation.init();
    ScrollHandler.init();
    Tracking.trackClicks();
    Tracking.pageView();
    ServiceWorker.register();
    LibsIntegration.init();
    console.info('🔧 Déboucheur Expert loaded | v3.0.0 | Alpine.js + Day.js + Panda');
});

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.DeboucheurApp = {
    toggleLanguage: () => Language.toggle(),
    t, currentLang: () => Language.current,
    toggleTheme: () => Theme.toggle(),
    isDark: () => Theme.isDark(),
    toggleMobileMenu: () => Navigation.toggleMobileMenu(),
    toggleDropdown: () => Navigation.toggleDropdown(),
    scrollToSection: (index) => Navigation.scrollToSection(index, true),
    toggleAccordion: (btn) => Accordion.toggle(btn),
    slideContact: (index) => ContactSlider.slide(index),
    submitContact: () => Form.submit(),
    saveCache: (key, value) => Form.saveCache(key, value),
    highlightInput: (el) => Form.highlightInput(el, 'focus'),
    validateInput: (el) => Form.validateInput(el),
    formatPhone: (el) => Form.formatPhone(el),
    trackEvent: (type, data) => Tracking.event(type, data),
    Utils, CONFIG
};

// Legacy compatibility aliases
window.toggleLanguage = () => Language.toggle();
window.toggleTheme = () => Theme.toggle();
window.toggleMobileMenu = () => Navigation.toggleMobileMenu();
window.toggleDropdown = () => Navigation.toggleDropdown();
window.toggleAccordion = (btn) => Accordion.toggle(btn);
window.scrollToSection = (index) => Navigation.scrollToSection(index, true);
window.slideContact = (index) => ContactSlider.slide(index);
window.submitContact = () => Form.submit();
window.saveCache = (key, value) => Form.saveCache(key, value);
window.highlightInput = (el) => Form.highlightInput(el, 'focus');
window.validateInput = (el) => Form.validateInput(el);
window.formatPhone = (el) => Form.formatPhone(el);

/* Auto-generated translation merges (apply-i18n.js) */
if (typeof Language !== 'undefined' && Language.translations) {
  try {
    Object.assign(Language.translations.fr, {
  'pages_index_section_08.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_index_section_08.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_index_section_07.html_uncloggedme': 'unclogged.me',
  'pages_index_section_07.html_1-438-5302343': '+1 (438) 530‑2343',
  'pages_index_section_07.html_1-438-7657040': '+1 (438) 765‑7040',
  'pages_index_section_07.html_infodeboucheurexpert': 'info@deboucheur.expert',
  'pages_index_section_07.html_infouncloggedme': 'info@unclogged.me',
  'pages_index_section_07.html_deboucheur-expert': 'Déboucheur Expert',
  'pages_index_section_07.html_satellite': 'Satellite',
  'pages_index_section_07.html_itineraire': 'Itinéraire',
  'pages_index_section_07.html_sauver': 'Sauver',
  'pages_index_section_07.html_appeler': 'Appeler',
  'pages_index_section_07.html_partager': 'Partager',
  'pages_index_section_07.html_290-rue-lord-01-napierville-qc-j0j-1l': '290 Rue Lord #01, Napierville, QC J0J 1L0',
  'pages_index_section_07.html_plombier-montreal-and-monteregie': 'Plombier · Montréal & Montérégie',
  'pages_index_section_04.html_phprenom': 'Prénom',
  'pages_index_section_04.html_phnom': 'Nom',
  'pages_index_section_04.html_phemail': 'Email',
  'pages_index_section_04.html_ph': '(###)###-####',
  'pages_index_section_04.html_phmessage': 'Message',
  'pages_index_section_04.html_billy-st-hilaire-35-ans': 'Billy St-Hilaire, 35 ans,',
  'pages_index_section_04.html_diplome-de-lecole-des-metiers': 'Diplômé de l\'École des Métiers,',
  'pages_index_section_04.html_de-la-construction-de-montreal': 'de la Construction de Montréal,',
  'pages_index_section_04.html_10-ans-pour-le-groupe-centco-inc': '10 ans pour le groupe Centco inc,',
  'pages_index_section_04.html_contrats-multiples-avec-le-local-144': 'Contrats multiples avec le local 144,',
  'pages_index_section_04.html_fier-supporteur-et-employe-de': 'Fier supporteur et employé de',
  'pages_index_section_04.html_plomberie-martin-boisvert-enr': 'Plomberie Martin Boisvert enr.',
  'pages_index_section_04.html_toujours-actif-pour-repondre-aux': 'Toujours actif pour répondre aux',
  'pages_index_section_04.html_diverses-appels-de-services': 'diverses appels de services.',
  'pages_index_section_04.html_que-ce-soit-pour-changer-une-valve': 'Que ce soit pour changer une valve',
  'pages_index_section_04.html_ou-reparer-un-tuyau-qui-coule': 'ou réparer un tuyau qui coule.',
  'pages_index_section_04.html_le-deboucheur-sait-sy-prendre': 'Le déboucheur sait s\'y prendre.',
  'pages_index_section_04.html_aucune-construction-neuve': '*Aucune construction neuve',
  'pages_index_section_01.html_nos-services-de-plomberie': 'NOS SERVICES DE PLOMBERIE',
  'pages_index_section_00.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
  'pages_tools.html_phrechercher-un-outil': 'Rechercher un outil...',
  'pages_tools.html_outils-de-plomberie-or-deboucheur-expert': 'Outils de plomberie | Déboucheur Expert',
  'pages_team.html_billy-sthilaire': 'Billy St‑Hilaire',
  'pages_team.html_nancy-boulianne': 'Nancy Boulianne',
  'pages_team.html_notre-equipe-or-deboucheur-expert': 'Notre Équipe | Déboucheur Expert',
  'pages_prices.html_14-a-38': '1/4" à 3/8"',
  'pages_prices.html_12': '1/2"',
  'pages_prices.html_58-a-34': '5/8" à 3/4"',
  'pages_prices.html_320dollar': '320$',
  'pages_prices.html_480dollar': '480$',
  'pages_prices.html_560dollar': '560$',
  'pages_prices.html_8h-18h': '8h-18h',
  'pages_prices.html_18h-8h': '18h-8h',
  'pages_prices.html_24h': '24h',
  'pages_prices.html_15': '×1.5',
  'pages_prices.html_175': '×1.75',
  'pages_prices.html_tarification-or-deboucheur-expert': 'Tarification | Déboucheur Expert',
  'pages_prices.html_cable-14-a-38': 'Câble 1/4" à 3/8"',
  'pages_prices.html_1ere-heure': '1ère heure',
  'pages_prices.html_1ere-heure_1': '1ère heure',
  'pages_prices.html_1ere-heure_2': '1ère heure',
  'pages_prices.html_cable-12': 'Câble 1/2"',
  'pages_prices.html_1ere-heure_3': '1ère heure',
  'pages_prices.html_1ere-heure_4': '1ère heure',
  'pages_prices.html_1ere-heure_5': '1ère heure',
  'pages_prices.html_cable-58-and-34': 'Câble 5/8" & 3/4"',
  'pages_prices.html_1ere-heure_6': '1ère heure',
  'pages_prices.html_1ere-heure_7': '1ère heure',
  'pages_prices.html_1ere-heure_8': '1ère heure',
  'pages_politics.html_1-introduction': '1 Introduction',
  'pages_politics.html_2-renseignements': '2 Renseignements',
  'pages_politics.html_3-finalites': '3 Finalités',
  'pages_politics.html_4-communication': '4 Communication',
  'pages_politics.html_5-securite': '5 Sécurité',
  'pages_politics.html_6-vos-droits': '6 Vos droits',
  'pages_politics.html_7-cookies': '7 Cookies',
  'pages_politics.html_8-modifications': '8 Modifications',
  'pages_politics.html_9-contact': '9 Contact',
  'pages_politics.html_the-collection-aggregation-and-analysi': 'The collection, aggregation, and analysis of any and all user-provided information are stored securely to serve the exclusive operational objective of enabling the Company, in its sole and absolute discretion, to precisely align, tailor, and optimize its product offerings for the most suitable clientele demographics.',
  'pages_politics.html_politique-de-confidentialite-or-deboucheu': 'Politique de Confidentialité | Déboucheur Expert',
  'pages_plumbing.html_astuce': 'Astuce:',
  'pages_plumbing.html_recommandation': 'Recommandation:',
  'pages_plumbing.html_guide-pratique-de-plomberie-residentiell': 'Guide Pratique de Plomberie Résidentielle | Déboucheur Expert',
  'pages_events.html_calendrier-and-disponibilites-or-deboucheur': 'Calendrier & Disponibilités | Déboucheur Expert',
  'pages_events.html_x1': 'X1',
  'pages_events.html_x15': 'X1.5',
  'pages_events.html_x2': 'X2',
  'pages_events.html_x3': 'X3',
  'pages_conditions.html_while-the-company-employs-commercially-r': 'While the Company employs commercially reasonable standards for data retention, all collected user information is utilized to facilitate and drive proprietary, targeted advertising initiatives and predictive modeling aimed at anticipating prospective consumer acquisitions; continued use of the service constitutes express consent to such utilization.',
  'pages_conditions.html_conditions-dutilisation-or-deboucheur-ex': 'Conditions d\'Utilisation | Déboucheur Expert',
  'pages_plumbing_unclog.html_causes-dengorgement': 'Causes d\'engorgement',
  'pages_plumbing_unclog.html_methodes-naturelles': 'Méthodes naturelles',
  'pages_plumbing_unclog.html_outils-a-portee-de-main': 'Outils à portée de main',
  'pages_plumbing_unclog.html_calcaire': 'Calcaire',
  'pages_plumbing_unclog.html_types-de-curage': 'Types de curage',
  'pages_plumbing_unclog.html_bouchons-par-racines': 'Bouchons par racines',
  'pages_plumbing_unclog.html_camion-hydrocureur': 'Camion hydrocureur',
  'pages_plumbing_unclog.html_debouchage-par-acide': 'Débouchage par acide',
  'pages_plumbing_unclog.html_probleme-de-pente': 'Problème de pente',
  'pages_plumbing_unclog.html_diametres-a-respecter': 'Diamètres à respecter',
  'pages_plumbing_unclog.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_unclog.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_unclog.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_unclog.html_urgence-247': '📞 URGENCE 24/7',
  'pages_plumbing_unclog.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_unclog.html_causes-dengorgement_1': '?\n                        CAUSES D\'ENGORGEMENT',
  'pages_plumbing_unclog.html_methodes-naturelles_1': '🌿\n                        MÉTHODES NATURELLES',
  'pages_plumbing_unclog.html_outils-a-portee-de-main_1': '🔧\n                        OUTILS À PORTÉE DE MAIN',
  'pages_plumbing_unclog.html_le-calcaire-et-la-canalisation': 'LE CALCAIRE ET LA CANALISATION',
  'pages_plumbing_unclog.html_2-types-de-curage': '2\n                        TYPES DE CURAGE',
  'pages_plumbing_unclog.html_engorgement-par-racines': '🌳\n                        ENGORGEMENT PAR RACINES',
  'pages_plumbing_unclog.html_camion-hydrocureur_1': '🚛\n                        CAMION HYDROCUREUR',
  'pages_plumbing_unclog.html_debouchage-par-acide_1': '⚗️\n                        DÉBOUCHAGE PAR ACIDE',
  'pages_plumbing_unclog.html_probleme-de-pente_1': '📐\n                        PROBLÈME DE PENTE',
  'pages_plumbing_unclog.html_diametres-a-respecter_1': '📏\n                        DIAMÈTRES À RESPECTER',
  'pages_plumbing_unclog.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_unclog.html_eau-bouillante': 'EAU BOUILLANTE',
  'pages_plumbing_unclog.html_bicarbonate-sel': 'BICARBONATE + SEL',
  'pages_plumbing_unclog.html_vinaigre-blanc': 'VINAIGRE BLANC',
  'pages_plumbing_unclog.html_ventouse': '🪠 VENTOUSE',
  'pages_plumbing_unclog.html_furet': '🐍 FURET',
  'pages_plumbing_unclog.html_curage-technique': 'CURAGE TECHNIQUE',
  'pages_plumbing_unclog.html_curage-biologique': 'CURAGE BIOLOGIQUE',
  'pages_plumbing_unclog.html_canalisation-bouchee': 'CANALISATION BOUCHÉE ?',
  'pages_plumbing_unclog.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_unclog.html_quand-agir': 'QUAND AGIR ?',
  'pages_plumbing_unclog.html_intervention-professionnelle-requise': 'INTERVENTION PROFESSIONNELLE REQUISE',
  'pages_plumbing_unclog.html_capacites': '✓ Capacités :',
  'pages_plumbing_unclog.html_manipulation-professionnelle-uniqueme': '⚠️ MANIPULATION PROFESSIONNELLE UNIQUEMENT',
  'pages_plumbing_unclog.html_regle-fondamentale': 'Règle fondamentale :',
  'pages_plumbing_unclog.html_maison-de-plain-pied': '🏠 MAISON DE PLAIN-PIED',
  'pages_plumbing_unclog.html_maison-a-etages': '🏢 MAISON À ÉTAGES',
  'pages_plumbing_unclog.html_acide-sulfurique': 'Acide Sulfurique',
  'pages_plumbing_unclog.html_acide-chlorhydrique': 'Acide Chlorhydrique',
  'pages_plumbing_unclog.html_un-desengorgement-est-necessaire-quand-d': 'Un désengorgement est nécessaire quand de mauvaises odeurs ou un refoulement sont constatés au niveau de la canalisation. On peut aussi faire appel à ce genre de système quand l\'évacuation d\'eau ralentit au niveau du système de plomberie.',
  'pages_plumbing_unclog.html_dans-la-plupart-des-cas-lengorgement-p': 'Dans la plupart des cas, l\'engorgement provient d\'une obstruction causée par des débris ou des corps étrangers :',
  'pages_plumbing_unclog.html_autres-causes-le-bouchon-peut-aussi-pr': 'Autres causes : Le bouchon peut aussi provenir d\'une racine qui bloque la circulation des eaux, ou d\'un système de plomberie mal effectué (pente insuffisante, coudes mal placés).',
  'pages_plumbing_unclog.html_dissout-la-graisse-le-savon-etc-verse': 'Dissout la graisse, le savon, etc. Verser directement dans le lavabo, l\'évier ou la douche.',
  'pages_plumbing_unclog.html_melanger-bicarbonate-de-soude-avec-du-se': 'Mélanger bicarbonate de soude avec du sel, verser et rincer à l\'eau chaude.',
  'pages_plumbing_unclog.html_eau-chaude-vinaigre-blanc-reaction-e': 'Eau chaude + vinaigre blanc : réaction effervescente qui aide à dissoudre les dépôts.',
  'pages_plumbing_unclog.html_la-methode-classique-et-efficace-pour-le': 'La méthode classique et efficace pour les petits bouchons. Créer une pression/dépression pour déloger l\'obstruction.',
  'pages_plumbing_unclog.html_outil-flexible-a-manivelle-pour-atteindr': 'Outil flexible à manivelle pour atteindre les bouchons profonds :',
  'pages_plumbing_unclog.html_le-calcaire-est-egalement-un-element-qui': 'Le calcaire est également un élément qui crée l\'engorgement de la canalisation. Ce dernier provient de l\'eau qui circule dans le système. Quand l\'eau est riche en calcaire, elle cause un entartrage des tuyaux.',
  'pages_plumbing_unclog.html_double-probleme-en-plus-de-bloquer-la': 'Double problème : En plus de bloquer la canalisation, le calcaire retient également les débris et déchets qui se glissent dans la tuyauterie.',
  'pages_plumbing_unclog.html_pour-un-debouchage-en-profondeur-le-mie': 'Pour un débouchage en profondeur, le mieux est de curer la canalisation avec l\'aide d\'un professionnel.',
  'pages_plumbing_unclog.html_concernant-les-bouchons-causes-par-une-r': 'Concernant les bouchons causés par une racine, la solution doit être technique et non manuelle. On ne peut pas résoudre le bouchon soi-même.',
  'pages_plumbing_unclog.html_methode-inspection-par-camera-camion': 'Méthode : Inspection par caméra → Camion hydrocurage avec buse → Déracinement si nécessaire → Réparations',
  'pages_plumbing_unclog.html_le-camion-hydrocureur-ou-camion-a-pompe': 'Le camion hydrocureur (ou camion à pompe/haute pression) est un équipement utilisé quand un bouchon persiste dans le système des eaux usées.',
  'pages_plumbing_unclog.html_psi-de-pression': 'PSI de pression',
  'pages_plumbing_unclog.html_camera-dinspection-integree': 'Caméra d\'inspection intégrée',
  'pages_plumbing_unclog.html_aspiration-nettoyage': 'Aspiration + Nettoyage',
  'pages_plumbing_unclog.html_le-debouchage-par-acide-est-efficace-mai': 'Le débouchage par acide est efficace mais dangereux pour la santé et la peau. Seuls des professionnels peuvent manipuler ces produits.',
  'pages_plumbing_unclog.html_utilise-pour-les-toilettes-bouchees-eli': 'Utilisé pour les toilettes bouchées. Élimine serviettes hygiéniques, papiers toilettes, etc.',
  'pages_plumbing_unclog.html_pour-canalisations-en-beton-ou-brique-a': 'Pour canalisations en béton ou brique. Aussi appelé acide muriatique.',
  'pages_plumbing_unclog.html_ce-type-de-debouchage-est-souvent-associ': 'Ce type de débouchage est souvent associé à un désengorgement par furet ou à un curage pour éliminer les débris restants.',
  'pages_plumbing_unclog.html_si-la-canalisation-est-engorgee-a-cause': 'Si la canalisation est engorgée à cause de la pente, il faut revoir les normes de l\'installation. Le réseau d\'évacuation doit suivre des règles précises pour un écoulement naturel.',
  'pages_plumbing_unclog.html_chaque-equipement-doit-avoir-son-propre': 'Chaque équipement doit avoir son propre conduit d\'évacuation. L\'évier ne doit pas avoir le même conduit que le lavabo. La douche ne doit pas adopter le même conduit que les toilettes, etc.',
  'pages_plumbing_unclog.html_dans-la-plupart-des-cas-les-engorgement': 'Dans la plupart des cas, les engorgements proviennent de normes de tuyauterie non respectées. Voici les diamètres recommandés :',
  'pages_plumbing_unclog.html_ces-regles-sont-inscrites-dans-les-norme': 'Ces règles sont inscrites dans les normes de plomberie et sont parfois difficiles à suivre pour les particuliers. Le mieux est de faire appel à un professionnel.',
  'pages_plumbing_unclog.html_ne-laissez-pas-un-bouchon-devenir-un-pro': 'Ne laissez pas un bouchon devenir un problème majeur. Contactez nos experts pour une intervention rapide et efficace.',
  'pages_plumbing_unclog.html_cheveux': 'Cheveux',
  'pages_plumbing_unclog.html_savon': 'Savon',
  'pages_plumbing_unclog.html_graisse': 'Graisse',
  'pages_plumbing_unclog.html_calcaire_1': 'Calcaire',
  'pages_plumbing_unclog.html': '🌿',
  'pages_plumbing_unclog.html_1': '♨️',
  'pages_plumbing_unclog.html_2': '🧂',
  'pages_plumbing_unclog.html_3': '🍶',
  'pages_plumbing_unclog.html_4': '🔧',
  'pages_plumbing_unclog.html_5': '🪠',
  'pages_plumbing_unclog.html_6': '🐍',
  'pages_plumbing_unclog.html_inspection-de-la-canalisation-pour-local': 'Inspection de la canalisation pour localiser le bouchon',
  'pages_plumbing_unclog.html_nettoyage-avec-jet-deau-a-haute-pressio': 'Nettoyage avec jet d\'eau à haute pression',
  'pages_plumbing_unclog.html_parfois-associe-a-un-debouchage-a-buse': 'Parfois associé à un débouchage à buse',
  'pages_plumbing_unclog.html_traitement-avec-solution-dazote-phosp': 'Traitement avec solution d\'azote + phosphore',
  'pages_plumbing_unclog.html_insertion-de-bacteries-qui-eliminent-les': 'Insertion de bactéries qui éliminent les dépôts',
  'pages_plumbing_unclog.html_ideal-pour-canalisations-fragiles': 'Idéal pour canalisations fragiles',
  'pages_plumbing_unclog.html_7': '🌳',
  'pages_plumbing_unclog.html_peut-bloquer-completement-levacuation-d': 'Peut bloquer complètement l\'évacuation des eaux usées',
  'pages_plumbing_unclog.html_peut-endommager-la-structure-de-la-canal': 'Peut endommager la structure de la canalisation',
  'pages_plumbing_unclog.html_necessite-souvent-des-travaux-de-reparat': 'Nécessite souvent des travaux de réparation après intervention',
  'pages_plumbing_unclog.html_8': '🚛',
  'pages_plumbing_unclog.html_9': '⚗️',
  'pages_plumbing_unclog.html_10': '📐',
  'pages_plumbing_unclog.html_1-2percent': '(1-2%)',
  'pages_plumbing_unclog.html_2-m': '(2 m)',
  'pages_plumbing_unclog.html_2-3percent': '(2-3%)',
  'pages_plumbing_unclog.html_2-m_1': '(2 m)',
  'pages_plumbing_unclog.html_11': '📏',
  'pages_plumbing_unclog.html_75-100-mm': '(75-100 mm)',
  'pages_plumbing_unclog.html_1percent': '(1%)',
  'pages_plumbing_unclog.html_32-mm': '(32 mm)',
  'pages_plumbing_unclog.html_38-mm': '(38 mm)',
  'pages_plumbing_unclog.html_91-cm': '(91 cm)',
  'pages_plumbing_unclog.html_38-mm_1': '(38 mm)',
  'pages_plumbing_unclog.html_91-cm_1': '(91 cm)',
  'pages_plumbing_unclog.html_50-mm': '(50 mm)',
  'pages_plumbing_unclog.html_introduire-le-furet-petit-a-petit': 'Introduire le furet petit à petit',
  'pages_plumbing_unclog.html_sentir-le-bouchon-a-linterieur-du-tuyau': 'Sentir le bouchon à l\'intérieur du tuyau',
  'pages_plumbing_unclog.html_activer-la-manivelle-et-tourner': 'Activer la manivelle et tourner',
  'pages_plumbing_unclog.html_retirer-et-rincer-a-leau': 'Retirer et rincer à l\'eau',
  'pages_plumbing_unclog.html_1-inspection-de-la-canalisation-pour-loc': '1\n                                    Inspection de la canalisation pour localiser le bouchon',
  'pages_plumbing_unclog.html_2-nettoyage-avec-jet-deau-a-haute-press': '2\n                                    Nettoyage avec jet d\'eau à haute pression',
  'pages_plumbing_unclog.html_3-parfois-associe-a-un-debouchage-a-buse': '3\n                                    Parfois associé à un débouchage à buse',
  'pages_plumbing_unclog.html_1-traitement-avec-solution-dazote-pho': '1\n                                    Traitement avec solution d\'azote + phosphore',
  'pages_plumbing_unclog.html_2-insertion-de-bacteries-qui-eliminent-l': '2\n                                    Insertion de bactéries qui éliminent les dépôts',
  'pages_plumbing_unclog.html_3-ideal-pour-canalisations-fragiles': '3\n                                    Idéal pour canalisations fragiles',
  'pages_plumbing_unclog.html_aspirer-la-boue-et-les-dechets': '• Aspirer la boue et les déchets',
  'pages_plumbing_unclog.html_deboucher-les-canalisations-tenaces': '• Déboucher les canalisations tenaces',
  'pages_plumbing_unclog.html_curage-a-haute-pression': '• Curage à haute pression',
  'pages_plumbing_unclog.html_nettoyage-complet-du-drain': '• Nettoyage complet du drain',
  'pages_plumbing_unclog.html_canalisation-a-lhorizontale': '• Canalisation à l\'horizontale',
  'pages_plumbing_unclog.html_collecteur-regroupant-tous-les-conduit': '• Collecteur regroupant tous les conduits',
  'pages_plumbing_unclog.html_collecteur-enfoui-ou-dans-la-dalle': '• Collecteur enfoui ou dans la dalle',
  'pages_plumbing_unclog.html_pente-18-14ft-1-2percent-jusqua-65': '• Pente: 1/8-1/4"/ft (1-2%) (jusqu\'à 6.5 pi (2 m))',
  'pages_plumbing_unclog.html_pente-14-38ft-2-3percent-au-dela-de': '• Pente: 1/4-3/8"/ft (2-3%) (au-delà de 6.5 pi (2 m))',
  'pages_plumbing_unclog.html_collecteur-dispose-verticalement': '• Collecteur disposé verticalement',
  'pages_plumbing_unclog.html_conduits-avec-clapet-aerateur': '• Conduits avec clapet aérateur',
  'pages_plumbing_unclog.html_reduit-les-odeurs': '• Réduit les odeurs',
  'pages_plumbing_unclog.html_diminue-le-bruit-devacuation': '• Diminue le bruit d\'évacuation',
  'pages_plumbing_unclog.html_evite-laspiration-deau-entre-conduit': '• Évite l\'aspiration d\'eau entre conduits',
  'pages_plumbing_unclog.html_mauvaises-odeurs': 'mauvaises odeurs',
  'pages_plumbing_unclog.html_refoulement': 'refoulement',
  'pages_plumbing_unclog.html_ralentit': 'ralentit',
  'pages_plumbing_unclog.html_autres-causes': 'Autres causes :',
  'pages_plumbing_unclog.html_racine': 'racine',
  'pages_plumbing_unclog.html_entartrage-des-tuyaux': 'entartrage des tuyaux',
  'pages_plumbing_unclog.html_double-probleme': 'Double problème :',
  'pages_plumbing_unclog.html_curer-la-canalisation': 'curer la canalisation',
  'pages_plumbing_unclog.html_technique-et-non-manuelle': 'technique et non manuelle',
  'pages_plumbing_unclog.html_methode': 'Méthode :',
  'pages_plumbing_unclog.html_dangereux-pour-la-sante-et-la-peau': 'dangereux pour la santé et la peau',
  'pages_plumbing_unclog.html_normes-de-plomberie': 'normes de plomberie',
  'pages_plumbing_unclog.html_debouchage-de-canalisations-or-guide-prat': 'Débouchage de Canalisations | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_unclog.html_drainage-pipe-unclogging-or-practical-plu': 'Drainage Pipe Unclogging | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_unclog.html_2en1': '2en1',
  'pages_plumbing_unclog.html_equipement': 'Équipement',
  'pages_plumbing_unclog.html_diametre-ext': 'Diamètre ext.',
  'pages_plumbing_unclog.html_pente-min': 'Pente min.',
  'pages_plumbing_unclog.html_toilettes': '🚽 Toilettes',
  'pages_plumbing_unclog.html_18ft': '1/8"/ft',
  'pages_plumbing_unclog.html_lavabo-avec-siphon': '🚿 Lavabo (avec siphon)',
  'pages_plumbing_unclog.html_evier': '🍽️ Évier',
  'pages_plumbing_unclog.html_baignoire-less3-pi': '🛁 Baignoire (<3 pi',
  'pages_plumbing_unclog.html_baignoire-greater3-pi': '🛁 Baignoire (>3 pi',
  'pages_plumbing_supply.html_introduction': 'Introduction',
  'pages_plumbing_supply.html_le-reseau-dalimentation': 'Le réseau d\'alimentation',
  'pages_plumbing_supply.html_pose-du-collecteur': 'Pose du collecteur',
  'pages_plumbing_supply.html_precautions-de-pose': 'Précautions de pose',
  'pages_plumbing_supply.html_choix-des-raccords': 'Choix des raccords',
  'pages_plumbing_supply.html_types-de-tuyaux': 'Types de tuyaux',
  'pages_plumbing_supply.html_cuivre': '→ Cuivre',
  'pages_plumbing_supply.html_pex': '→ PEX',
  'pages_plumbing_supply.html_multicouche': '→ Multicouche',
  'pages_plumbing_supply.html_diametres-a-respecter': 'Diamètres à respecter',
  'pages_plumbing_supply.html_regulation-de-pression': 'Régulation de pression',
  'pages_plumbing_supply.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_supply.html_debouchage': '→ Débouchage',
  'pages_plumbing_supply.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_supply.html_1-514-972-2078': '📞 +1 (514) 972-2078',
  'pages_plumbing_supply.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_supply.html_1-le-reseau-dalimentation': '1\n                        LE RÉSEAU D\'ALIMENTATION',
  'pages_plumbing_supply.html_2-pose-du-collecteur': '2\n                        POSE DU COLLECTEUR',
  'pages_plumbing_supply.html_precautions-de-pose_1': '!\n                        PRÉCAUTIONS DE POSE',
  'pages_plumbing_supply.html_3-types-de-tuyaux': '3\n                        TYPES DE TUYAUX',
  'pages_plumbing_supply.html_4-diametres-a-respecter': '4\n                        DIAMÈTRES À RESPECTER',
  'pages_plumbing_supply.html_5-regulation-de-la-pression': '5\n                        RÉGULATION DE LA PRESSION',
  'pages_plumbing_supply.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_supply.html_pose-encastree': 'POSE ENCASTRÉE',
  'pages_plumbing_supply.html_pose-apparente': 'POSE APPARENTE',
  'pages_plumbing_supply.html_tuyaux-en-cuivre': '🔶 TUYAUX EN CUIVRE',
  'pages_plumbing_supply.html_tuyaux-en-pex': '🔵 TUYAUX EN PEX',
  'pages_plumbing_supply.html_tuyaux-multicouches': '🟢 TUYAUX MULTICOUCHES',
  'pages_plumbing_supply.html_besoin-dun-professionnel': 'BESOIN D\'UN PROFESSIONNEL ?',
  'pages_plumbing_supply.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_supply.html_a-savoir-avant-de-commencer': 'À SAVOIR AVANT DE COMMENCER',
  'pages_plumbing_supply.html_tuyaux': 'TUYAUX',
  'pages_plumbing_supply.html_raccords': 'RACCORDS',
  'pages_plumbing_supply.html_collecteurs': 'COLLECTEURS',
  'pages_plumbing_supply.html_securite-importante': 'SÉCURITÉ IMPORTANTE',
  'pages_plumbing_supply.html_cuivre-recuit': 'Cuivre Recuit',
  'pages_plumbing_supply.html_cuivre-ecroui': 'Cuivre Écroui',
  'pages_plumbing_supply.html_types-de-raccords-pex': 'Types de raccords PEX :',
  'pages_plumbing_supply.html_avantages': '✓ Avantages :',
  'pages_plumbing_supply.html_comment-tester-la-pression': '📏 Comment tester la pression ?',
  'pages_plumbing_supply.html_avant-la-pose': 'Avant la pose :',
  'pages_plumbing_supply.html_en-cas-de-soudure': 'En cas de soudure :',
  'pages_plumbing_supply.html_pour-alimenter-le-foyer-et-les-equipemen': 'Pour alimenter le foyer et les équipements en eau courante, il faut installer un réseau d\'alimentation d\'eau. Ce guide vous accompagne pas à pas dans la compréhension et l\'installation de votre système.',
  'pages_plumbing_supply.html_on-utilise-leau-courante-tous-les-jours': 'On utilise l\'eau courante tous les jours, pour des questions d\'hygiène et de confort. De ce fait, si vous songez à installer votre plomberie, vous devez penser à l\'alimentation en eau du bâtiment. L\'eau doit parvenir à tout le réseau de plomberie, pour alimenter la douche, la baignoire, les toilettes, l\'évier, le chauffe-eau, etc.',
  'pages_plumbing_supply.html_le-reseau-dalimentation-deau-est-gener': 'Le réseau d\'alimentation d\'eau est généralement composé de tuyaux, de raccords et de collecteurs. Les collecteurs sont utilisés pour que tous les équipements puissent bénéficier d\'eau courante. Ils sont donc des éléments principaux pour la distribution d\'eau.',
  'pages_plumbing_supply.html_transport-de-leau': 'Transport de l\'eau',
  'pages_plumbing_supply.html_connexions': 'Connexions',
  'pages_plumbing_supply.html_distribution': 'Distribution',
  'pages_plumbing_supply.html_un-collecteur-est-compose-de-plusieurs-s': 'Un collecteur est composé de plusieurs sorties d\'eau, suivant le nombre d\'équipements utilisés. Le nombre de collecteurs à utiliser dépend du nombre de pièces à alimenter et des étages du bâtiment.',
  'pages_plumbing_supply.html_note-historique-auparavant-seuls-les': 'Note historique : Auparavant, seuls les tuyaux en plomb étaient utilisés. De nos jours, ce matériau est interdit. On utilise désormais le cuivre, le PEX et le multicouche.',
  'pages_plumbing_supply.html_le-cuivre-remplace-principalement-la-tuy': 'Le cuivre remplace principalement la tuyauterie traditionnelle en plomb. Il n\'est pas sensible à la corrosion, se dilate rarement et résiste à la pression.',
  'pages_plumbing_supply.html_les-plus-pratiques-car-ils-nont-pas-bes': 'Les plus pratiques car ils n\'ont pas besoin de raccords par soudure. Cependant, ils nécessitent plusieurs guides pour la fixation.',
  'pages_plumbing_supply.html_petits-projets-montage-par-vissage': 'Petits projets, montage par vissage',
  'pages_plumbing_supply.html_complexe-mais-fiable-professionnel': 'Complexe mais fiable, professionnel',
  'pages_plumbing_supply.html_installations-neuves-durable': 'Installations neuves, durable',
  'pages_plumbing_supply.html_un-bon-compromis-entre-le-cuivre-et-le-p': 'Un bon compromis entre le cuivre et le PEX. Composés de couches de polyéthylène réticulé, ils supportent la chaleur, sont silencieux et ne nécessitent aucune soudure.',
  'pages_plumbing_supply.html_pour-une-distribution-correcte-de-leau': 'Pour une distribution correcte de l\'eau, il faut suivre des normes concernant le diamètre de la tuyauterie selon le débit souhaité.',
  'pages_plumbing_supply.html_regle-generale-un-tuyau-de-grand-diame': 'Règle générale : Un tuyau de grand diamètre offrira un débit élevé tandis qu\'un tuyau de petite taille sera limité côté débit.',
  'pages_plumbing_supply.html_pression-standard-du-reseau-public': 'Pression standard du réseau public',
  'pages_plumbing_supply.html_installer-un-suppresseur': 'Installer un suppresseur',
  'pages_plumbing_supply.html_installer-un-reducteur': 'Installer un réducteur',
  'pages_plumbing_supply.html_utilisez-un-manometre-pour-mesurer-la-pr': 'Utilisez un manomètre pour mesurer la pression. Le réducteur de pression s\'installe à la sortie du compteur pour éviter la détérioration de la tuyauterie.',
  'pages_plumbing_supply.html_vu-la-complexite-du-reseau-dalimentatio': 'Vu la complexité du réseau d\'alimentation en eau courante, il est conseillé de faire appel à un professionnel de la plomberie qui maîtrise ce domaine.',
  'pages_plumbing_supply.html_necessite-deux-collecteurs-eau-froide': 'Nécessite deux collecteurs (eau froide + eau chaude)',
  'pages_plumbing_supply.html_raccordement-au-chauffe-eau-pour-leau-c': 'Raccordement au chauffe-eau pour l\'eau chaude',
  'pages_plumbing_supply.html_tuyaux-multicouches-ou-pex-recommandes': 'Tuyaux multicouches ou PEX recommandés',
  'pages_plumbing_supply.html_pose-sous-fourreau-pour-dalle-ou-plaque': 'Pose sous fourreau pour dalle ou plaque de plâtre',
  'pages_plumbing_supply.html_tuyaux-en-cuivre-ou-multicouches-recomma': 'Tuyaux en cuivre ou multicouches recommandés',
  'pages_plumbing_supply.html_solides-et-resistants-aux-uv': 'Solides et résistants aux UV',
  'pages_plumbing_supply.html_fixation-a-6-15-cm-du-sol': 'Fixation à ~6" (15 cm) du sol',
  'pages_plumbing_supply.html_15-cm': '(15 cm)',
  'pages_plumbing_supply.html_raccordement-parfait-pour-eviter-les-fui': 'Raccordement parfait pour éviter les fuites',
  'pages_plumbing_supply.html_bleu-eau-froide': 'Bleu = Eau Froide',
  'pages_plumbing_supply.html_rouge-eau-chaude': 'Rouge = Eau Chaude',
  'pages_plumbing_supply.html_10-mm': '(10 mm)',
  'pages_plumbing_supply.html_16-mm': '(16 mm)',
  'pages_plumbing_supply.html_20-mm': '(20 mm)',
  'pages_plumbing_supply.html_3-bar': '(3 bar)',
  'pages_plumbing_supply.html_3-bar_1': '(3 bar)',
  'pages_plumbing_supply.html_5-bar': '(5 bar)',
  'pages_plumbing_supply.html_fermer-la-vanne-qui-ouvre-et-ferme-la': '• Fermer la vanne qui ouvre et ferme la canalisation',
  'pages_plumbing_supply.html_choisir-le-type-de-raccordement-avec': '• Choisir le type de raccordement (avec ou sans soudure)',
  'pages_plumbing_supply.html_porter-des-gants-de-protection': '• Porter des gants de protection',
  'pages_plumbing_supply.html_porter-des-lunettes-de-securite': '• Porter des lunettes de sécurité',
  'pages_plumbing_supply.html_ventiler-la-zone-de-travail': '• Ventiler la zone de travail',
  'pages_plumbing_supply.html_peu-de-raccords-necessaires': '• Peu de raccords nécessaires',
  'pages_plumbing_supply.html_fixation-a-froid': '• Fixation à froid',
  'pages_plumbing_supply.html_encastrable': '• Encastrable',
  'pages_plumbing_supply.html_fixation-a-chaud': '• Fixation à chaud',
  'pages_plumbing_supply.html_non-encastrable': '• Non encastrable',
  'pages_plumbing_supply.html_installation-murale': '• Installation murale',
  'pages_plumbing_supply.html_resistance-a-la-chaleur': '• Résistance à la chaleur',
  'pages_plumbing_supply.html_silencieux': '• Silencieux',
  'pages_plumbing_supply.html_pas-de-soudure': '• Pas de soudure',
  'pages_plumbing_supply.html_fixation-par-sertissage': '• Fixation par sertissage',
  'pages_plumbing_supply.html_tuyaux_1': 'tuyaux',
  'pages_plumbing_supply.html_raccords_1': 'raccords',
  'pages_plumbing_supply.html_collecteurs_1': 'collecteurs',
  'pages_plumbing_supply.html_note-historique': 'Note historique :',
  'pages_plumbing_supply.html_note': '⚠️ Note :',
  'pages_plumbing_supply.html_attention': '⚠️ Attention :',
  'pages_plumbing_supply.html_a-compression': 'À compression',
  'pages_plumbing_supply.html_a-glissement': 'À glissement',
  'pages_plumbing_supply.html_a-sertir': 'À sertir',
  'pages_plumbing_supply.html_regle-generale': 'Règle générale :',
  'pages_plumbing_supply.html_suppresseur': 'suppresseur',
  'pages_plumbing_supply.html_reducteur': 'réducteur',
  'pages_plumbing_supply.html_manometre': 'manomètre',
  'pages_plumbing_supply.html_alimentation-deau-or-guide-pratique-de-p': 'Alimentation d\'Eau | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_supply.html_water-supply-or-practical-plumbing-guide': 'Water Supply | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_supply.html_la-pose-est-dordre-professionnel-car-le': 'La pose est d\'ordre professionnel car le raccordement et l\'installation sont techniques.',
  'pages_plumbing_supply.html_les-tuyaux-pex-ne-supportent-pas-les-uv': 'Les tuyaux PEX ne supportent pas les UV. Ils doivent être encastrés ou protégés.',
  'pages_plumbing_supply.html_debit-souhaite': 'Débit souhaité',
  'pages_plumbing_supply.html_diametre-recommande': 'Diamètre recommandé',
  'pages_plumbing_supply.html_50-lmin': '50 L/min',
  'pages_plumbing_supply.html_160-lmin': '160 L/min',
  'pages_plumbing_supply.html_250-lmin': '250 L/min',
  'pages_plumbing_supply.html_44-psi': '44 PSI',
  'pages_plumbing_supply.html_less-44-psi': '< 44 PSI',
  'pages_plumbing_supply.html_greater-73-psi': '> 73 PSI',
  'pages_plumbing_normes.html_introduction': 'Introduction',
  'pages_plumbing_normes.html_diametre-nominal-dn': 'Diamètre nominal (DN)',
  'pages_plumbing_normes.html_tableau-des-dn': 'Tableau des DN',
  'pages_plumbing_normes.html_debits-devacuation': 'Débits d\'évacuation',
  'pages_plumbing_normes.html_pentes-recommandees': 'Pentes recommandées',
  'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux': 'Tuyaux sanitaires et pluviaux',
  'pages_plumbing_normes.html_conformite': 'Conformité',
  'pages_plumbing_normes.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_normes.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_normes.html_debouchage': '→ Débouchage',
  'pages_plumbing_normes.html_appeler-maintenant': '📞 APPELER MAINTENANT',
  'pages_plumbing_normes.html_demander-une-inspection': 'DEMANDER UNE INSPECTION',
  'pages_plumbing_normes.html_o-diametre-nominal-nps': 'Ø\n                        DIAMÈTRE NOMINAL (NPS)',
  'pages_plumbing_normes.html_tableau-des-nps-par-appareil': '📊\n                        TABLEAU DES NPS PAR APPAREIL',
  'pages_plumbing_normes.html_debits-devacuation_1': '💧\n                        DÉBITS D\'ÉVACUATION',
  'pages_plumbing_normes.html_pentes-recommandees_1': '📐\n                        PENTES RECOMMANDÉES',
  'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux_1': '🚧\n                        TUYAUX SANITAIRES ET PLUVIAUX',
  'pages_plumbing_normes.html_conformite-et-reglementation': '✓\n                        CONFORMITÉ ET RÉGLEMENTATION',
  'pages_plumbing_normes.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_normes.html_3-tuyaux-3-76-mm': '≤3"\n                                TUYAUX ≤ 3" (≤ 76 mm)',
  'pages_plumbing_normes.html_4-tuyaux-4-100-mm': '≥4"\n                                TUYAUX ≥ 4" (≥ 100 mm)',
  'pages_plumbing_normes.html_limites-de-pente': 'LIMITES DE PENTE',
  'pages_plumbing_normes.html_besoin-dune-verification': 'BESOIN D\'UNE VÉRIFICATION ?',
  'pages_plumbing_normes.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_normes.html_pourquoi-respecter-les-normes': 'POURQUOI RESPECTER LES NORMES ?',
  'pages_plumbing_normes.html_regle-importante-pente-et-longueur': '⚠️ RÈGLE IMPORTANTE : PENTE ET LONGUEUR',
  'pages_plumbing_normes.html_eaux-sanitaires': '🚽 EAUX SANITAIRES',
  'pages_plumbing_normes.html_eaux-pluviales': '🌧️ EAUX PLUVIALES',
  'pages_plumbing_normes.html_points-de-conformite-a-verifier': 'POINTS DE CONFORMITÉ À VÉRIFIER',
  'pages_plumbing_normes.html_travaux-necessitant-un-permis': '⚠️ TRAVAUX NÉCESSITANT UN PERMIS',
  'pages_plumbing_normes.html_le-respect-des-normes-de-plomberie-garan': 'Le respect des normes de plomberie garantit le bon fonctionnement de votre système d\'évacuation, prévient les engorgements et assure la conformité avec le code du bâtiment du Québec.',
  'pages_plumbing_normes.html_le-nps-nominal-pipe-size-est-la-mesure': 'Le NPS (Nominal Pipe Size) est la mesure standard utilisée pour désigner le diamètre des tuyaux d\'évacuation en Amérique du Nord. Il correspond approximativement au diamètre intérieur du tuyau en pouces.',
  'pages_plumbing_normes.html_important-le-diametre-exterieur-peut-v': 'Important : Le diamètre extérieur peut varier selon le matériau (PVC, fonte, cuivre). Le NPS indique la capacité de débit, pas les dimensions exactes.',
  'pages_plumbing_normes.html_chaque-appareil-sanitaire-necessite-un-d': 'Chaque appareil sanitaire nécessite un diamètre minimum pour assurer une évacuation correcte :',
  'pages_plumbing_normes.html_le-debit-devacuation-represente-la-quan': 'Le débit d\'évacuation représente la quantité d\'eau que chaque appareil peut évacuer par seconde. Cette valeur est essentielle pour dimensionner correctement les canalisations.',
  'pages_plumbing_normes.html_ue-unite-devacuation-valeur-normal': '*UE = Unité d\'Évacuation : Valeur normalisée utilisée pour calculer la charge totale d\'un système de plomberie.',
  'pages_plumbing_normes.html_la-pente-cumulee-ne-doit-jamais-depasser': 'La pente cumulée ne doit jamais dépasser le diamètre du tuyau en hauteur, sauf si le tuyau est ventilé. Cette règle détermine la longueur maximale d\'un tuyau horizontal.',
  'pages_plumbing_normes.html_conseil-pour-un-tuyau-de-2-avec-une-p': 'Conseil : Pour un tuyau de 2" avec une pente idéale de 1/4"/pi, ne pas dépasser 8 pieds de longueur. Avec une pente minimale de 1/8"/pi, vous pouvez aller jusqu\'à 16 pieds, mais c\'est moins recommandé.',
  'pages_plumbing_normes.html_pente-maximale-globale-21-mmm': 'Pente maximale globale (21 mm/m)',
  'pages_plumbing_normes.html_au-dela-leau-secoule-trop-vite-et-lai': 'Au-delà, l\'eau s\'écoule trop vite et laisse les solides derrière',
  'pages_plumbing_normes.html_pente-minimale-globale-5-mmm': 'Pente minimale globale (5 mm/m)',
  'pages_plumbing_normes.html_en-dessous-stagnation-des-eaux-et-depot': 'En dessous, stagnation des eaux et dépôts',
  'pages_plumbing_normes.html_astuce-une-pente-trop-forte-est-aus': '💡 Astuce : Une pente trop forte est aussi problématique qu\'une pente trop faible. L\'eau s\'écoule trop rapidement et laisse les matières solides s\'accumuler, causant des engorgements à long terme.',
  'pages_plumbing_normes.html_en-plomberie-residentielle-nous-travail': 'En plomberie résidentielle, nous travaillons principalement avec deux types de réseaux d\'évacuation : les eaux sanitaires (eaux usées) et les eaux pluviales (eau de pluie). Ces réseaux sont généralement séparés.',
  'pages_plumbing_normes.html_proviennent-des-appareils-sanitaires-to': 'Proviennent des appareils sanitaires (toilettes, lavabos, douches, éviers, etc.)',
  'pages_plumbing_normes.html_proviennent-de-la-collecte-des-eaux-de-p': 'Proviennent de la collecte des eaux de pluie sur le toit et autour du bâtiment.',
  'pages_plumbing_normes.html_note-importante-les-eaux-pluviales': '💧 Note importante : Les eaux pluviales doivent être évacuées séparément des eaux sanitaires dans la plupart des municipalités du Québec. Le raccordement des descentes pluviales au réseau sanitaire est généralement interdit.',
  'pages_plumbing_normes.html_attention-les-gouttieres-ne-font-pa': '⚠️ Attention : Les gouttières ne font pas partie du travail du plombier. Les plombiers travaillent sur les tuyaux de descente pluviale à partir du point d\'entrée dans le bâtiment jusqu\'au raccordement au réseau municipal ou au système de drainage.',
  'pages_plumbing_normes.html_certains-travaux-de-plomberie-necessiten': 'Certains travaux de plomberie nécessitent un permis de la municipalité et l\'intervention d\'un maître-plombier :',
  'pages_plumbing_normes.html_nos-experts-peuvent-inspecter-votre-syst': 'Nos experts peuvent inspecter votre système de plomberie et vérifier sa conformité aux normes en vigueur.',
  'pages_plumbing_normes.html_nominal-pipe-size': 'Nominal Pipe Size',
  'pages_plumbing_normes.html_inches': 'Inches',
  'pages_plumbing_normes.html_o-interieur': 'Ø intérieur',
  'pages_plumbing_normes.html': '📊',
  'pages_plumbing_normes.html_1': '🚽',
  'pages_plumbing_normes.html_76-mm': '(76 mm)',
  'pages_plumbing_normes.html_76-mm_1': '(76 mm)',
  'pages_plumbing_normes.html_2': '🚿',
  'pages_plumbing_normes.html_50-mm': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_1': '(50 mm)',
  'pages_plumbing_normes.html_3': '🧼',
  'pages_plumbing_normes.html_38-mm': '(38 mm)',
  'pages_plumbing_normes.html_38-mm_1': '(38 mm)',
  'pages_plumbing_normes.html_4': '🍽️',
  'pages_plumbing_normes.html_50-mm_2': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_3': '(50 mm)',
  'pages_plumbing_normes.html_5': '🧺',
  'pages_plumbing_normes.html_50-mm_4': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_5': '(50 mm)',
  'pages_plumbing_normes.html_6': '🍴',
  'pages_plumbing_normes.html_50-mm_6': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_7': '(50 mm)',
  'pages_plumbing_normes.html_7': '🔧',
  'pages_plumbing_normes.html_38-mm_2': '(38 mm)',
  'pages_plumbing_normes.html_38-mm_3': '(38 mm)',
  'pages_plumbing_normes.html_8': '🏠',
  'pages_plumbing_normes.html_100-mm': '(100 mm)',
  'pages_plumbing_normes.html_100-125-mm': '(100-125 mm)',
  'pages_plumbing_normes.html_9': '💧',
  'pages_plumbing_normes.html_10': '📐',
  'pages_plumbing_normes.html_3_1': '≤3"',
  'pages_plumbing_normes.html_76-mm_2': '(≤ 76 mm)',
  'pages_plumbing_normes.html_pente-ideale': 'Pente idéale',
  'pages_plumbing_normes.html_14pi-21-mmm': '1/4"/pi (21 mm/m)',
  'pages_plumbing_normes.html_21-mmm': '(21 mm/m)',
  'pages_plumbing_normes.html_minimum-acceptable': 'Minimum acceptable',
  'pages_plumbing_normes.html_18pi-10-mmm': '1/8"/pi (10 mm/m)',
  'pages_plumbing_normes.html_10-mmm': '(10 mm/m)',
  'pages_plumbing_normes.html_4_1': '≥4"',
  'pages_plumbing_normes.html_100-mm_1': '(≥ 100 mm)',
  'pages_plumbing_normes.html_pente-ideale_1': 'Pente idéale',
  'pages_plumbing_normes.html_18pi-10-mmm_1': '1/8"/pi (10 mm/m)',
  'pages_plumbing_normes.html_10-mmm_1': '(10 mm/m)',
  'pages_plumbing_normes.html_minimum-acceptable_1': 'Minimum acceptable',
  'pages_plumbing_normes.html_116pi-5-mmm': '1/16"/pi (5 mm/m)',
  'pages_plumbing_normes.html_5-mmm': '(5 mm/m)',
  'pages_plumbing_normes.html_38-mm_4': '(38 mm)',
  'pages_plumbing_normes.html_18-m': '(1.8 m)',
  'pages_plumbing_normes.html_36-m': '(3.6 m)',
  'pages_plumbing_normes.html_50-mm_8': '(50 mm)',
  'pages_plumbing_normes.html_24-m-recommande': '(2.4 m) ★ Recommandé',
  'pages_plumbing_normes.html_48-m': '(4.8 m)',
  'pages_plumbing_normes.html_76-mm_3': '(76 mm)',
  'pages_plumbing_normes.html_36-m_1': '(3.6 m)',
  'pages_plumbing_normes.html_73-m': '(7.3 m)',
  'pages_plumbing_normes.html_21-mmm_1': '(21 mm/m)',
  'pages_plumbing_normes.html_5-mmm_1': '(5 mm/m)',
  'pages_plumbing_normes.html_11': '🚧',
  'pages_plumbing_normes.html_12': '🚽',
  'pages_plumbing_normes.html_1-12': '1-1/2"',
  'pages_plumbing_normes.html_lavabo-bidet': 'Lavabo, bidet',
  'pages_plumbing_normes.html_2_1': '2"',
  'pages_plumbing_normes.html_douche-baignoire-evier-lave-linge': 'Douche, baignoire, évier, lave-linge',
  'pages_plumbing_normes.html_3_2': '3"',
  'pages_plumbing_normes.html_toilettes': 'Toilettes',
  'pages_plumbing_normes.html_4_2': '4"',
  'pages_plumbing_normes.html_collecteur-principal': 'Collecteur principal',
  'pages_plumbing_normes.html_13': '🌧️',
  'pages_plumbing_normes.html_3_3': '3"',
  'pages_plumbing_normes.html_descente-pluviale-standard': 'Descente pluviale standard',
  'pages_plumbing_normes.html_4_3': '4"',
  'pages_plumbing_normes.html_grande-surface-de-toiture': 'Grande surface de toiture',
  'pages_plumbing_normes.html_4_4': '4"+',
  'pages_plumbing_normes.html_collecteur-pluvial-principal': 'Collecteur pluvial principal',
  'pages_plumbing_normes.html_diametres-conformes-aux-normes-nps': 'Diamètres conformes aux normes NPS',
  'pages_plumbing_normes.html_pentes-adequates-18-38pi': 'Pentes adéquates (1/8-3/8"/pi)',
  'pages_plumbing_normes.html_ventilation-primaire-et-secondaire': 'Ventilation primaire et secondaire',
  'pages_plumbing_normes.html_siphons-aux-points-requis': 'Siphons aux points requis',
  'pages_plumbing_normes.html_raccords-etanches': 'Raccords étanches',
  'pages_plumbing_normes.html_separation-eaux-usees-pluviales': 'Séparation eaux usées / pluviales',
  'pages_plumbing_normes.html_regard-de-visite-accessible': 'Regard de visite accessible',
  'pages_plumbing_normes.html_clapet-anti-refoulement-si-requis': 'Clapet anti-refoulement si requis',
  'pages_plumbing_normes.html_1-12-lavabo-bidet': '1-1/2"\n                                        Lavabo, bidet',
  'pages_plumbing_normes.html_2-douche-baignoire-evier-lave-linge': '2"\n                                        Douche, baignoire, évier, lave-linge',
  'pages_plumbing_normes.html_3-toilettes': '3"\n                                        Toilettes',
  'pages_plumbing_normes.html_4-collecteur-principal': '4"\n                                        Collecteur principal',
  'pages_plumbing_normes.html_3-descente-pluviale-standard': '3"\n                                        Descente pluviale standard',
  'pages_plumbing_normes.html_4-grande-surface-de-toiture': '4"\n                                        Grande surface de toiture',
  'pages_plumbing_normes.html_4-collecteur-pluvial-principal': '4"+\n                                        Collecteur pluvial principal',
  'pages_plumbing_normes.html_remplacement-de-la-valve-dentree-prin': '• Remplacement de la valve d\'entrée principale',
  'pages_plumbing_normes.html_raccordement-au-reseau-daqueduc': '• Raccordement au réseau d\'aqueduc',
  'pages_plumbing_normes.html_modification-majeure-du-systeme-devac': '• Modification majeure du système d\'évacuation',
  'pages_plumbing_normes.html_installation-de-nouvelles-conduites': '• Installation de nouvelles conduites',
  'pages_plumbing_normes.html_travaux-touchant-le-collecteur-princip': '• Travaux touchant le collecteur principal',
  'pages_plumbing_normes.html_branchement-au-reseau-degout-municipa': '• Branchement au réseau d\'égout municipal',
  'pages_plumbing_normes.html_bon-fonctionnement': 'bon fonctionnement',
  'pages_plumbing_normes.html_engorgements': 'engorgements',
  'pages_plumbing_normes.html_conformite_1': 'conformité',
  'pages_plumbing_normes.html_nps-nominal-pipe-size': 'NPS (Nominal Pipe Size)',
  'pages_plumbing_normes.html_important': 'Important :',
  'pages_plumbing_normes.html_diametre-minimum': 'diamètre minimum',
  'pages_plumbing_normes.html_debit-devacuation': 'débit d\'évacuation',
  'pages_plumbing_normes.html_ue-unite-devacuation': '*UE = Unité d\'Évacuation',
  'pages_plumbing_normes.html_jamais-depasser-le-diametre-du-tuyau-en': 'jamais dépasser le diamètre du tuyau en hauteur',
  'pages_plumbing_normes.html_6_1': '6\'',
  'pages_plumbing_normes.html_12_1': '12\'',
  'pages_plumbing_normes.html_8_1': '8\'',
  'pages_plumbing_normes.html_16': '16\'',
  'pages_plumbing_normes.html_12_2': '12\'',
  'pages_plumbing_normes.html_24': '24\'',
  'pages_plumbing_normes.html_conseil': 'Conseil :',
  'pages_plumbing_normes.html_astuce': '💡 Astuce :',
  'pages_plumbing_normes.html_eaux-sanitaires_1': 'eaux sanitaires',
  'pages_plumbing_normes.html_eaux-pluviales_1': 'eaux pluviales',
  'pages_plumbing_normes.html_note-importante': '💧 Note importante :',
  'pages_plumbing_normes.html_separement': 'séparément',
  'pages_plumbing_normes.html_attention': '⚠️ Attention :',
  'pages_plumbing_normes.html_normes-de-plomberie-or-guide-pratique-de': 'Normes de Plomberie | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_normes.html_plumbing-standards-or-practical-plumbing': 'Plumbing Standards | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_normes.html_nps': 'NPS',
  'pages_plumbing_normes.html_pouces': 'pouces',
  'pages_plumbing_normes.html_appareil-sanitaire': 'Appareil sanitaire',
  'pages_plumbing_normes.html_nps-min': 'NPS min.',
  'pages_plumbing_normes.html_nps-recommande': 'NPS recommandé',
  'pages_plumbing_normes.html_wc-toilettes': 'WC (toilettes)',
  'pages_plumbing_normes.html_douche-baignoire': 'Douche / Baignoire',
  'pages_plumbing_normes.html_lavabo': 'Lavabo',
  'pages_plumbing_normes.html_evier-de-cuisine': 'Évier de cuisine',
  'pages_plumbing_normes.html_lave-linge': 'Lave-linge',
  'pages_plumbing_normes.html_lave-vaisselle': 'Lave-vaisselle',
  'pages_plumbing_normes.html_bidet': 'Bidet',
  'pages_plumbing_normes.html_collecteur-principal_1': 'Collecteur principal',
  'pages_plumbing_normes.html_appareil': 'Appareil',
  'pages_plumbing_normes.html_debit-ls': 'Débit (L/s)',
  'pages_plumbing_normes.html_ue': 'UE*',
  'pages_plumbing_normes.html_wc-avec-reservoir': '🚽 WC avec réservoir',
  'pages_plumbing_normes.html_15-ls': '1.5 L/s',
  'pages_plumbing_normes.html_4-ue': '4 UE',
  'pages_plumbing_normes.html_baignoire': '🛁 Baignoire',
  'pages_plumbing_normes.html_09-ls': '0.9 L/s',
  'pages_plumbing_normes.html_2-ue': '2 UE',
  'pages_plumbing_normes.html_douche': '🚿 Douche',
  'pages_plumbing_normes.html_05-ls': '0.5 L/s',
  'pages_plumbing_normes.html_2-ue_1': '2 UE',
  'pages_plumbing_normes.html_lavabo_1': '🧼 Lavabo',
  'pages_plumbing_normes.html_05-ls_1': '0.5 L/s',
  'pages_plumbing_normes.html_1-ue': '1 UE',
  'pages_plumbing_normes.html_evier-de-cuisine_1': '🍽️ Évier de cuisine',
  'pages_plumbing_normes.html_075-ls': '0.75 L/s',
  'pages_plumbing_normes.html_2-ue_2': '2 UE',
  'pages_plumbing_normes.html_lave-linge_1': '🧺 Lave-linge',
  'pages_plumbing_normes.html_08-ls': '0.8 L/s',
  'pages_plumbing_normes.html_3-ue': '3 UE',
  'pages_plumbing_normes.html_lave-vaisselle_1': '🍴 Lave-vaisselle',
  'pages_plumbing_normes.html_06-ls': '0.6 L/s',
  'pages_plumbing_normes.html_2-ue_3': '2 UE',
  'pages_plumbing_normes.html_diametre': 'Diamètre',
  'pages_plumbing_normes.html_pente-14pi-ideale': 'Pente 1/4"/pi (idéale)',
  'pages_plumbing_normes.html_pente-18pi-min': 'Pente 1/8"/pi (min)',
  'pages_plumbing_normes.html_max': 'Max',
  'pages_plumbing_normes.html_max_1': 'Max',
  'pages_plumbing_normes.html_max_2': 'Max',
  'pages_plumbing_normes.html_max_3': 'Max',
  'pages_plumbing_normes.html_max_4': 'Max',
  'pages_plumbing_normes.html_max_5': 'Max',
  'pages_plumbing_normes.html_14pi-max': '1/4"/pi max',
  'pages_plumbing_normes.html_116pi-min': '1/16"/pi min',
  'pages_plumbing_drainage.html_introduction': 'Introduction',
  'pages_plumbing_drainage.html_les-4-circuits': 'Les 4 circuits',
  'pages_plumbing_drainage.html_systeme-dalimentation': 'Système d\'alimentation',
  'pages_plumbing_drainage.html_compteur-et-vanne': 'Compteur et vanne',
  'pages_plumbing_drainage.html_evacuation': 'Évacuation',
  'pages_plumbing_drainage.html_role-des-siphons': 'Rôle des siphons',
  'pages_plumbing_drainage.html_pente-devacuation': 'Pente d\'évacuation',
  'pages_plumbing_drainage.html_ventilation': 'Ventilation',
  'pages_plumbing_drainage.html_reperer-vos-circuits': 'Repérer vos circuits',
  'pages_plumbing_drainage.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_drainage.html_debouchage': '→ Débouchage',
  'pages_plumbing_drainage.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_drainage.html_1-514-972-2078': '📞 +1 (514) 972-2078',
  'pages_plumbing_drainage.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_drainage.html_les-4-circuits-de-votre-plomberie': 'LES 4 CIRCUITS DE VOTRE PLOMBERIE',
  'pages_plumbing_drainage.html_1-systeme-dalimentation': '1\n                        SYSTÈME D\'ALIMENTATION',
  'pages_plumbing_drainage.html_compteur-et-vanne-darret': '!\n                        COMPTEUR ET VANNE D\'ARRÊT',
  'pages_plumbing_drainage.html_2-systeme-devacuation': '2\n                        SYSTÈME D\'ÉVACUATION',
  'pages_plumbing_drainage.html_le-role-des-siphons': 'LE RÔLE DES SIPHONS',
  'pages_plumbing_drainage.html_3-systeme-de-ventilation': '3\n                        SYSTÈME DE VENTILATION',
  'pages_plumbing_drainage.html_4-reperer-vos-circuits': '4\n                        REPÉRER VOS CIRCUITS',
  'pages_plumbing_drainage.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_drainage.html_eau-froide': 'EAU FROIDE',
  'pages_plumbing_drainage.html_eau-chaude': 'EAU CHAUDE',
  'pages_plumbing_drainage.html_evacuation_1': 'ÉVACUATION',
  'pages_plumbing_drainage.html_ventilation_1': 'VENTILATION',
  'pages_plumbing_drainage.html_localiser-le-compteur-et-la-vanne-pri': '📍 Localiser le compteur et la vanne principale',
  'pages_plumbing_drainage.html_identifier-les-colonnes-montantes': '📍 Identifier les colonnes montantes',
  'pages_plumbing_drainage.html_reperer-les-evacuations': '📍 Repérer les évacuations',
  'pages_plumbing_drainage.html_avant-deffectuer-des-travaux': '🔧 AVANT D\'EFFECTUER DES TRAVAUX',
  'pages_plumbing_drainage.html_besoin-dun-professionnel': 'BESOIN D\'UN PROFESSIONNEL ?',
  'pages_plumbing_drainage.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_drainage.html_a-retenir': 'À RETENIR',
  'pages_plumbing_drainage.html_cas-particulier-double-circuit-dea': '💧 Cas particulier : double circuit d\'eau froide',
  'pages_plumbing_drainage.html_points-de-controle-essentiels': 'POINTS DE CONTRÔLE ESSENTIELS',
  'pages_plumbing_drainage.html_3-tuyaux-3-76-mm': '≤3"\n                                Tuyaux ≤ 3" (≤ 76 mm)',
  'pages_plumbing_drainage.html_4-tuyaux-4-100-mm': '≥4"\n                                Tuyaux ≥ 4" (≥ 100 mm)',
  'pages_plumbing_drainage.html_pourquoi-la-ventilation-est-elle-ind': '🌬️ Pourquoi la ventilation est-elle indispensable ?',
  'pages_plumbing_drainage.html_ventilation-primaire': 'VENTILATION PRIMAIRE',
  'pages_plumbing_drainage.html_ventilation-secondaire': 'VENTILATION SECONDAIRE',
  'pages_plumbing_drainage.html_en-maison-individuelle': '🏠 En maison individuelle',
  'pages_plumbing_drainage.html_en-appartement': '🏢 En appartement',
  'pages_plumbing_drainage.html_le-compteur': '📊 Le Compteur',
  'pages_plumbing_drainage.html_la-vanne-darret': '🔴 La Vanne d\'arrêt',
  'pages_plumbing_drainage.html_avant-de-se-lancer-dans-des-travaux-de-p': 'Avant de se lancer dans des travaux de plomberie, il est important de bien connaître son système de plomberie. Où vont ces canalisations ? Lesquelles contiennent les eaux propres et lesquelles rejettent les eaux usées ?',
  'pages_plumbing_drainage.html_cette-connaissance-devient-cruciale-en-c': 'Cette connaissance devient cruciale en cas de fuite ou d\'urgence. Dans une maison, quatre circuits permettent à l\'eau de circuler : distribution d\'eau froide et d\'eau chaude, ventilation des tuyaux et évacuation des eaux usées.',
  'pages_plumbing_drainage.html_distribution-de-leau-potable-froide-dep': 'Distribution de l\'eau potable froide depuis le réseau public vers tous les points d\'eau de la maison.',
  'pages_plumbing_drainage.html_apres-passage-par-le-chauffe-eau-leau': 'Après passage par le chauffe-eau, l\'eau chaude est distribuée aux robinets, douches et appareils.',
  'pages_plumbing_drainage.html_collecte-et-acheminement-des-eaux-usees': 'Collecte et acheminement des eaux usées vers les égouts ou la fosse septique.',
  'pages_plumbing_drainage.html_circulation-dair-dans-les-canalisations': 'Circulation d\'air dans les canalisations pour maintenir la pression et évacuer les odeurs.',
  'pages_plumbing_drainage.html_generalement-les-habitations-sont-racco': 'Généralement, les habitations sont raccordées au système d\'alimentation de la ville. L\'eau, acheminée via la canalisation de branchement, est ensuite répartie grâce aux colonnes d\'eau à tous les raccordements des différentes pièces.',
  'pages_plumbing_drainage.html_apres-raccordement-au-systeme-de-chauffe': 'Après raccordement au système de chauffe-eau, les tuyaux se scindent en système d\'eau chaude et en système d\'eau froide.',
  'pages_plumbing_drainage.html_il-existe-parfois-deux-circuits-deau-fr': 'Il existe parfois deux circuits d\'eau froide, qui permettent de séparer l\'eau potable de l\'eau courante (pour l\'arrosage ou les toilettes par exemple), mais ce cas de figure reste rare dans les habitations résidentielles.',
  'pages_plumbing_drainage.html_cest-au-niveau-du-raccordement-entre-le': 'C\'est au niveau du raccordement entre le système général et celui du bâtiment que se trouvent deux éléments essentiels :',
  'pages_plumbing_drainage.html_mesure-votre-consommation-deau-il-appa': 'Mesure votre consommation d\'eau. Il appartient à votre compagnie des eaux et permet de calculer votre facture.',
  'pages_plumbing_drainage.html_generalement-situee-juste-apres-le-compt': 'Généralement située juste après le compteur, se présente sous la forme d\'un robinet ou d\'une manette à tourner d\'un quart de tour.',
  'pages_plumbing_drainage.html_en-cas-de-fuite-importante-savoir-lo': '⚠️ En cas de fuite importante, savoir localiser cette vanne peut vous éviter une inondation. Chaque seconde compte !',
  'pages_plumbing_drainage.html_a-la-sortie-des-appareils-machines-a-la': 'À la sortie des appareils (machines à laver, éviers, toilettes, etc.) les canalisations collectent les eaux usées. Toutes les canalisations d\'eaux usées débouchent dans une même colonne du système de plomberie afin d\'être acheminées vers le collecteur principal d\'évacuation, et enfin rejetées dans le système d\'égout de la ville.',
  'pages_plumbing_drainage.html_chaque-appareil-sanitaire-est-equipe-du': 'Chaque appareil sanitaire est équipé d\'un siphon, en forme de « U ». Il retient une certaine quantité d\'eau pour empêcher la remontée de l\'air vicié.',
  'pages_plumbing_drainage.html_cette-garde-deau-forme-une-barriere-con': 'Cette garde d\'eau forme une barrière contre les odeurs d\'égout.',
  'pages_plumbing_drainage.html_21-mmm': '(21 mm/m)',
  'pages_plumbing_drainage.html_10-mmm': '(10 mm/m)',
  'pages_plumbing_drainage.html_less-10-mmm': '(< 10 mm/m)',
  'pages_plumbing_drainage.html_10-mmm_1': '(10 mm/m)',
  'pages_plumbing_drainage.html_5-mmm': '(5 mm/m)',
  'pages_plumbing_drainage.html_less-5-mmm': '(< 5 mm/m)',
  'pages_plumbing_drainage.html_une-colonne-de-ventilation-permet-la-cir': 'Une colonne de ventilation permet la circulation de l\'air et le maintien d\'une pression constante dans tout le circuit d\'évacuation. Ce tuyau vertical débouche sur le toit et permet de créer une circulation d\'air dans le circuit et d\'expulser l\'air vicié.',
  'pages_plumbing_drainage.html_il-ny-a-pas-de-bonne-evacuation-des-eau': 'Il n\'y a pas de bonne évacuation des eaux usées sans une ventilation primaire efficace. Son objectif est de prévenir les variations de pression dans les colonnes de chute des eaux usées.',
  'pages_plumbing_drainage.html_sans-ventilation-adequate-le-passage-d': 'Sans ventilation adéquate : le passage d\'une grosse masse d\'eau crée une forte dépression qui aspire la garde d\'eau du siphon, ce qui remonte et répand des mauvaises odeurs dans la pièce.',
  'pages_plumbing_drainage.html_les-colonnes-de-chute-doivent-etre-prolo': 'Les colonnes de chute doivent être prolongées en toiture jusqu\'à l\'air libre. Elle favorise le bon écoulement et évite l\'effet de siphonnement.',
  'pages_plumbing_drainage.html_dans-certaines-configurations-complexes': 'Dans certaines configurations complexes, une ventilation secondaire peut être ajoutée pour desservir des appareils éloignés de la colonne principale.',
  'pages_plumbing_drainage.html_identifiez-la-vanne-darret-des-maint': '⚠️ Identifiez la vanne d\'arrêt dès maintenant et vérifiez qu\'elle fonctionne !',
  'pages_plumbing_drainage.html_dans-les-habitations-a-etages-les-colon': 'Dans les habitations à étages, les colonnes montantes sont des tuyaux verticaux qui distribuent l\'eau ou collectent les eaux usées. Elles sont souvent dissimulées dans les cloisons, mais vous pouvez les repérer :',
  'pages_plumbing_drainage.html_les-evacuations-partent-horizontalement': 'Les évacuations partent horizontalement de chaque appareil et rejoignent une colonne verticale. Les tuyaux d\'évacuation sont généralement en PVC gris ou blanc, plus larges que les tuyaux d\'alimentation (diamètres de 1-1/4" à 4" (32 à 100 mm)).',
  'pages_plumbing_drainage.html_de-nos-jours-les-canalisations-devacua': 'De nos jours, les canalisations d\'évacuation sont constituées de matériaux plastiques, la plupart du temps en PVC ou en ABS dans le résidentiel léger, et non plus en plomb.',
  'pages_plumbing_drainage.html_les-arrivees-deau-peuvent-etre-faites-d': 'Les arrivées d\'eau peuvent être faites de polyéthylène ou de polypropylène, légers et peu onéreux. Les tuyaux de cuivre, très résistants et moins bruyants, sont plus lourds et difficiles à manier.',
  'pages_plumbing_drainage.html_noubliez-pas-de-couper-larrivee-gen': '⚠️ N\'oubliez pas de couper l\'arrivée générale d\'eau avant tout travail, au niveau de votre cave ou de l\'entrée de votre appartement.',
  'pages_plumbing_drainage.html_pour-plus-de-serenite-lors-de-vos-travau': 'Pour plus de sérénité lors de vos travaux, contactez un artisan plombier qualifié.',
  'pages_plumbing_drainage.html_votre-plomberie-comprend-4-circuits-dist': 'Votre plomberie comprend 4 circuits distincts : eau froide, eau chaude, évacuation et ventilation.',
  'pages_plumbing_drainage.html_la-vanne-darret-generale-coupe-toute-l': 'La vanne d\'arrêt générale coupe toute l\'eau de la maison en cas d\'urgence.',
  'pages_plumbing_drainage.html_la-ventilation-primaire-debouchant-sur-l': 'La ventilation primaire débouchant sur le toit évite les remontées d\'odeurs.',
  'pages_plumbing_drainage.html_savoir-localiser-vos-circuits-facilite-l': 'Savoir localiser vos circuits facilite les interventions.',
  'pages_plumbing_drainage.html_3': '≤3"',
  'pages_plumbing_drainage.html_76-mm': '(≤ 76 mm)',
  'pages_plumbing_drainage.html_4': '≥4"',
  'pages_plumbing_drainage.html_100-mm': '(≥ 100 mm)',
  'pages_plumbing_drainage.html_32-a-100-mm': '(32 à 100 mm)',
  'pages_plumbing_drainage.html_au-sous-sol': '• Au sous-sol',
  'pages_plumbing_drainage.html_dans-le-garage': '• Dans le garage',
  'pages_plumbing_drainage.html_dans-un-regard-exterieur-pres-de-la-ru': '• Dans un regard extérieur près de la rue',
  'pages_plumbing_drainage.html_dans-les-parties-communes-cave-local': '• Dans les parties communes (cave, local technique)',
  'pages_plumbing_drainage.html_parfois-dans-lappartement-pres-de-le': '• Parfois dans l\'appartement près de l\'entrée',
  'pages_plumbing_drainage.html_dans-les-gaines-techniques-souvent-da': '→\n                                    Dans les gaines techniques (souvent dans la salle de bain ou la cuisine)',
  'pages_plumbing_drainage.html_le-long-des-murs-dans-les-caves-ou-sou': '→\n                                    Le long des murs dans les caves ou sous-sols',
  'pages_plumbing_drainage.html_par-le-bruit-de-leau-qui-circule-quan': '→\n                                    Par le bruit de l\'eau qui circule quand vous ouvrez un robinet à l\'étage',
  'pages_plumbing_drainage.html_4-circuits-distincts': '4 circuits distincts',
  'pages_plumbing_drainage.html_vanne-darret-generale': 'vanne d\'arrêt générale',
  'pages_plumbing_drainage.html_ventilation-primaire_1': 'ventilation primaire',
  'pages_plumbing_drainage.html_localiser-vos-circuits': 'localiser vos circuits',
  'pages_plumbing_drainage.html_quatre-circuits': 'quatre circuits',
  'pages_plumbing_drainage.html_canalisation-de-branchement': 'canalisation de branchement',
  'pages_plumbing_drainage.html_colonnes-deau': 'colonnes d\'eau',
  'pages_plumbing_drainage.html_colonne-du-systeme-de-plomberie': 'colonne du système de plomberie',
  'pages_plumbing_drainage.html_siphon': 'siphon',
  'pages_plumbing_drainage.html_garde-deau': 'garde d\'eau',
  'pages_plumbing_drainage.html_important': '⚠️ Important :',
  'pages_plumbing_drainage.html_pente-minimale': 'pente minimale',
  'pages_plumbing_drainage.html_attention': '⚠️ Attention :',
  'pages_plumbing_drainage.html_colonne-de-ventilation': 'colonne de ventilation',
  'pages_plumbing_drainage.html_sans-ventilation-adequate': 'Sans ventilation adéquate :',
  'pages_plumbing_drainage.html_pvc-gris-ou-blanc': 'PVC gris ou blanc',
  'pages_plumbing_drainage.html_pvc-ou-en-abs': 'PVC ou en ABS',
  'pages_plumbing_drainage.html_polyethylene-ou-de-polypropylene': 'polyéthylène ou de polypropylène',
  'pages_plumbing_drainage.html_systeme-de-drainage-or-guide-pratique-de': 'Système de Drainage | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_drainage.html_drainage-system-or-practical-plumbing-gui': 'Drainage System | Practical Plumbing Guide | Uncloged Me',
  'pages_plumbing_drainage.html_sans-siphon-fonctionnel-votre-salle-de': 'Sans siphon fonctionnel, votre salle de bain empesterait rapidement !',
  'pages_plumbing_drainage.html_14ft': '1/4"/ft',
  'pages_plumbing_drainage.html_18ft': '1/8"/ft',
  'pages_plumbing_drainage.html_less-18ft': '< 1/8"/ft',
  'pages_plumbing_drainage.html_18ft_1': '1/8"/ft',
  'pages_plumbing_drainage.html_116ft': '1/16"/ft',
  'pages_plumbing_drainage.html_less-116ft': '< 1/16"/ft',
  'pages_plumbing_components_navbar.html_accueil': 'ACCUEIL',
  'pages_plumbing_components_navbar.html_tarification': 'TARIFICATION',
  'pages_plumbing_components_navbar.html_guide': 'GUIDE',
  'pages_plumbing_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_plumbing_components_navbar.html_outils': 'OUTILS',
  'pages_plumbing_components_navbar.html_en': 'EN',
  'pages_plumbing_components_navbar.html_en_1': 'EN',
  'pages_plumbing_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_plumbing_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_plumbing_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_plumbing_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_plumbing_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_plumbing_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_plumbing_components_footer.html_equipe': 'Équipe',
  'pages_plumbing_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_plumbing_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_index_components_navbar.html_en': 'EN',
  'pages_index_components_navbar.html_en_1': 'EN',
  'pages_index_components_hero.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
  'pages_index_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_index_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_index_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_index_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_index_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_index_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_index_components_footer.html_equipe': 'Équipe',
  'pages_index_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_index_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_errors_offline.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_offline.html_offline': 'OFFLINE',
  'pages_errors_offline.html_hors-ligne-or-deboucheur-expert': 'HORS LIGNE | Déboucheur Expert',
  'pages_errors_components_navbar.html_accueil': 'ACCUEIL',
  'pages_errors_components_navbar.html_tarification': 'TARIFICATION',
  'pages_errors_components_navbar.html_guide': 'GUIDE',
  'pages_errors_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_errors_components_navbar.html_outils': 'OUTILS',
  'pages_errors_components_navbar.html_en': 'EN',
  'pages_errors_components_navbar.html_en_1': 'EN',
  'pages_errors_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_errors_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_errors_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_errors_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_errors_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_errors_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_errors_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_errors_components_footer.html_equipe': 'Équipe',
  'pages_errors_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_errors_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_errors_codes_504.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_504.html_504-delai-passerelle-or-deboucheur-expe': '504 - DÉLAI PASSERELLE | Déboucheur Expert',
  'pages_errors_codes_503.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_503.html_503-service-indisponible-or-deboucheur': '503 - SERVICE INDISPONIBLE | Déboucheur Expert',
  'pages_errors_codes_502.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_502.html_502-mauvaise-passerelle-or-deboucheur-e': '502 - MAUVAISE PASSERELLE | Déboucheur Expert',
  'pages_errors_codes_500.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_500.html_500-erreur-serveur-or-deboucheur-expert': '500 - ERREUR SERVEUR | Déboucheur Expert',
  'pages_errors_codes_429.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_429.html_429-trop-de-requetes-or-deboucheur-expe': '429 - TROP DE REQUÊTES | Déboucheur Expert',
  'pages_errors_codes_410.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_410.html_410-ressource-supprimee-or-deboucheur-e': '410 - RESSOURCE SUPPRIMÉE | Déboucheur Expert',
  'pages_errors_codes_408.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_408.html_408-delai-depasse-or-deboucheur-expert': '408 - DÉLAI DÉPASSÉ | Déboucheur Expert',
  'pages_errors_codes_404.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_404.html_404-page-introuvable-or-deboucheur-expe': '404 - PAGE INTROUVABLE | Déboucheur Expert',
  'pages_errors_codes_403.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_403.html_403-acces-interdit-or-deboucheur-expert': '403 - ACCÈS INTERDIT | Déboucheur Expert',
  'pages_errors_codes_401.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_401.html_401-non-autorise-or-deboucheur-expert': '401 - NON AUTORISÉ | Déboucheur Expert',
  'pages_errors_codes_400.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_400.html_400-requete-invalide-or-deboucheur-expe': '400 - REQUÊTE INVALIDE | Déboucheur Expert',
  'pages_errors_codes_components_navbar.html_accueil': 'ACCUEIL',
  'pages_errors_codes_components_navbar.html_tarification': 'TARIFICATION',
  'pages_errors_codes_components_navbar.html_guide': 'GUIDE',
  'pages_errors_codes_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_errors_codes_components_navbar.html_outils': 'OUTILS',
  'pages_errors_codes_components_navbar.html_en': 'EN',
  'pages_errors_codes_components_navbar.html_en_1': 'EN',
  'pages_errors_codes_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_errors_codes_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_errors_codes_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_errors_codes_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_errors_codes_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_errors_codes_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_errors_codes_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_errors_codes_components_footer.html_equipe': 'Équipe',
  'pages_errors_codes_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_errors_codes_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_components_template.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_components_navbar.html_accueil': 'ACCUEIL',
  'pages_components_navbar.html_tarification': 'TARIFICATION',
  'pages_components_navbar.html_guide': 'GUIDE',
  'pages_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_components_navbar.html_outils': 'OUTILS',
  'pages_components_navbar.html_en': 'EN',
  'pages_components_navbar.html_en_1': 'EN',
  'pages_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_components_footer.html_equipe': 'Équipe',
  'pages_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert'
    });
    Object.assign(Language.translations.en, {
  'pages_index_section_08.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_index_section_08.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_index_section_07.html_uncloggedme': 'unclogged.me',
  'pages_index_section_07.html_1-438-5302343': '+1 (438) 530‑2343',
  'pages_index_section_07.html_1-438-7657040': '+1 (438) 765‑7040',
  'pages_index_section_07.html_infodeboucheurexpert': 'info@deboucheur.expert',
  'pages_index_section_07.html_infouncloggedme': 'info@unclogged.me',
  'pages_index_section_07.html_deboucheur-expert': 'Déboucheur Expert',
  'pages_index_section_07.html_satellite': 'Satellite',
  'pages_index_section_07.html_itineraire': 'Itinéraire',
  'pages_index_section_07.html_sauver': 'Sauver',
  'pages_index_section_07.html_appeler': 'Appeler',
  'pages_index_section_07.html_partager': 'Partager',
  'pages_index_section_07.html_290-rue-lord-01-napierville-qc-j0j-1l': '290 Rue Lord #01, Napierville, QC J0J 1L0',
  'pages_index_section_07.html_plombier-montreal-and-monteregie': 'Plombier · Montréal & Montérégie',
  'pages_index_section_04.html_phprenom': 'Prénom',
  'pages_index_section_04.html_phnom': 'Nom',
  'pages_index_section_04.html_phemail': 'Email',
  'pages_index_section_04.html_ph': '(###)###-####',
  'pages_index_section_04.html_phmessage': 'Message',
  'pages_index_section_04.html_billy-st-hilaire-35-ans': 'Billy St-Hilaire, 35 ans,',
  'pages_index_section_04.html_diplome-de-lecole-des-metiers': 'Diplômé de l\'École des Métiers,',
  'pages_index_section_04.html_de-la-construction-de-montreal': 'de la Construction de Montréal,',
  'pages_index_section_04.html_10-ans-pour-le-groupe-centco-inc': '10 ans pour le groupe Centco inc,',
  'pages_index_section_04.html_contrats-multiples-avec-le-local-144': 'Contrats multiples avec le local 144,',
  'pages_index_section_04.html_fier-supporteur-et-employe-de': 'Fier supporteur et employé de',
  'pages_index_section_04.html_plomberie-martin-boisvert-enr': 'Plomberie Martin Boisvert enr.',
  'pages_index_section_04.html_toujours-actif-pour-repondre-aux': 'Toujours actif pour répondre aux',
  'pages_index_section_04.html_diverses-appels-de-services': 'diverses appels de services.',
  'pages_index_section_04.html_que-ce-soit-pour-changer-une-valve': 'Que ce soit pour changer une valve',
  'pages_index_section_04.html_ou-reparer-un-tuyau-qui-coule': 'ou réparer un tuyau qui coule.',
  'pages_index_section_04.html_le-deboucheur-sait-sy-prendre': 'Le déboucheur sait s\'y prendre.',
  'pages_index_section_04.html_aucune-construction-neuve': '*Aucune construction neuve',
  'pages_index_section_01.html_nos-services-de-plomberie': 'NOS SERVICES DE PLOMBERIE',
  'pages_index_section_00.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
  'pages_tools.html_phrechercher-un-outil': 'Rechercher un outil...',
  'pages_tools.html_outils-de-plomberie-or-deboucheur-expert': 'Outils de plomberie | Déboucheur Expert',
  'pages_team.html_billy-sthilaire': 'Billy St‑Hilaire',
  'pages_team.html_nancy-boulianne': 'Nancy Boulianne',
  'pages_team.html_notre-equipe-or-deboucheur-expert': 'Notre Équipe | Déboucheur Expert',
  'pages_prices.html_14-a-38': '1/4" à 3/8"',
  'pages_prices.html_12': '1/2"',
  'pages_prices.html_58-a-34': '5/8" à 3/4"',
  'pages_prices.html_320dollar': '320$',
  'pages_prices.html_480dollar': '480$',
  'pages_prices.html_560dollar': '560$',
  'pages_prices.html_8h-18h': '8h-18h',
  'pages_prices.html_18h-8h': '18h-8h',
  'pages_prices.html_24h': '24h',
  'pages_prices.html_15': '×1.5',
  'pages_prices.html_175': '×1.75',
  'pages_prices.html_tarification-or-deboucheur-expert': 'Tarification | Déboucheur Expert',
  'pages_prices.html_cable-14-a-38': 'Câble 1/4" à 3/8"',
  'pages_prices.html_1ere-heure': '1ère heure',
  'pages_prices.html_1ere-heure_1': '1ère heure',
  'pages_prices.html_1ere-heure_2': '1ère heure',
  'pages_prices.html_cable-12': 'Câble 1/2"',
  'pages_prices.html_1ere-heure_3': '1ère heure',
  'pages_prices.html_1ere-heure_4': '1ère heure',
  'pages_prices.html_1ere-heure_5': '1ère heure',
  'pages_prices.html_cable-58-and-34': 'Câble 5/8" & 3/4"',
  'pages_prices.html_1ere-heure_6': '1ère heure',
  'pages_prices.html_1ere-heure_7': '1ère heure',
  'pages_prices.html_1ere-heure_8': '1ère heure',
  'pages_politics.html_1-introduction': '1 Introduction',
  'pages_politics.html_2-renseignements': '2 Renseignements',
  'pages_politics.html_3-finalites': '3 Finalités',
  'pages_politics.html_4-communication': '4 Communication',
  'pages_politics.html_5-securite': '5 Sécurité',
  'pages_politics.html_6-vos-droits': '6 Vos droits',
  'pages_politics.html_7-cookies': '7 Cookies',
  'pages_politics.html_8-modifications': '8 Modifications',
  'pages_politics.html_9-contact': '9 Contact',
  'pages_politics.html_the-collection-aggregation-and-analysi': 'The collection, aggregation, and analysis of any and all user-provided information are stored securely to serve the exclusive operational objective of enabling the Company, in its sole and absolute discretion, to precisely align, tailor, and optimize its product offerings for the most suitable clientele demographics.',
  'pages_politics.html_politique-de-confidentialite-or-deboucheu': 'Politique de Confidentialité | Déboucheur Expert',
  'pages_plumbing.html_astuce': 'Astuce:',
  'pages_plumbing.html_recommandation': 'Recommandation:',
  'pages_plumbing.html_guide-pratique-de-plomberie-residentiell': 'Guide Pratique de Plomberie Résidentielle | Déboucheur Expert',
  'pages_events.html_calendrier-and-disponibilites-or-deboucheur': 'Calendrier & Disponibilités | Déboucheur Expert',
  'pages_events.html_x1': 'X1',
  'pages_events.html_x15': 'X1.5',
  'pages_events.html_x2': 'X2',
  'pages_events.html_x3': 'X3',
  'pages_conditions.html_while-the-company-employs-commercially-r': 'While the Company employs commercially reasonable standards for data retention, all collected user information is utilized to facilitate and drive proprietary, targeted advertising initiatives and predictive modeling aimed at anticipating prospective consumer acquisitions; continued use of the service constitutes express consent to such utilization.',
  'pages_conditions.html_conditions-dutilisation-or-deboucheur-ex': 'Conditions d\'Utilisation | Déboucheur Expert',
  'pages_plumbing_unclog.html_causes-dengorgement': 'Causes d\'engorgement',
  'pages_plumbing_unclog.html_methodes-naturelles': 'Méthodes naturelles',
  'pages_plumbing_unclog.html_outils-a-portee-de-main': 'Outils à portée de main',
  'pages_plumbing_unclog.html_calcaire': 'Calcaire',
  'pages_plumbing_unclog.html_types-de-curage': 'Types de curage',
  'pages_plumbing_unclog.html_bouchons-par-racines': 'Bouchons par racines',
  'pages_plumbing_unclog.html_camion-hydrocureur': 'Camion hydrocureur',
  'pages_plumbing_unclog.html_debouchage-par-acide': 'Débouchage par acide',
  'pages_plumbing_unclog.html_probleme-de-pente': 'Problème de pente',
  'pages_plumbing_unclog.html_diametres-a-respecter': 'Diamètres à respecter',
  'pages_plumbing_unclog.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_unclog.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_unclog.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_unclog.html_urgence-247': '📞 URGENCE 24/7',
  'pages_plumbing_unclog.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_unclog.html_causes-dengorgement_1': '?\n                        CAUSES D\'ENGORGEMENT',
  'pages_plumbing_unclog.html_methodes-naturelles_1': '🌿\n                        MÉTHODES NATURELLES',
  'pages_plumbing_unclog.html_outils-a-portee-de-main_1': '🔧\n                        OUTILS À PORTÉE DE MAIN',
  'pages_plumbing_unclog.html_le-calcaire-et-la-canalisation': 'LE CALCAIRE ET LA CANALISATION',
  'pages_plumbing_unclog.html_2-types-de-curage': '2\n                        TYPES DE CURAGE',
  'pages_plumbing_unclog.html_engorgement-par-racines': '🌳\n                        ENGORGEMENT PAR RACINES',
  'pages_plumbing_unclog.html_camion-hydrocureur_1': '🚛\n                        CAMION HYDROCUREUR',
  'pages_plumbing_unclog.html_debouchage-par-acide_1': '⚗️\n                        DÉBOUCHAGE PAR ACIDE',
  'pages_plumbing_unclog.html_probleme-de-pente_1': '📐\n                        PROBLÈME DE PENTE',
  'pages_plumbing_unclog.html_diametres-a-respecter_1': '📏\n                        DIAMÈTRES À RESPECTER',
  'pages_plumbing_unclog.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_unclog.html_eau-bouillante': 'EAU BOUILLANTE',
  'pages_plumbing_unclog.html_bicarbonate-sel': 'BICARBONATE + SEL',
  'pages_plumbing_unclog.html_vinaigre-blanc': 'VINAIGRE BLANC',
  'pages_plumbing_unclog.html_ventouse': '🪠 VENTOUSE',
  'pages_plumbing_unclog.html_furet': '🐍 FURET',
  'pages_plumbing_unclog.html_curage-technique': 'CURAGE TECHNIQUE',
  'pages_plumbing_unclog.html_curage-biologique': 'CURAGE BIOLOGIQUE',
  'pages_plumbing_unclog.html_canalisation-bouchee': 'CANALISATION BOUCHÉE ?',
  'pages_plumbing_unclog.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_unclog.html_quand-agir': 'QUAND AGIR ?',
  'pages_plumbing_unclog.html_intervention-professionnelle-requise': 'INTERVENTION PROFESSIONNELLE REQUISE',
  'pages_plumbing_unclog.html_capacites': '✓ Capacités :',
  'pages_plumbing_unclog.html_manipulation-professionnelle-uniqueme': '⚠️ MANIPULATION PROFESSIONNELLE UNIQUEMENT',
  'pages_plumbing_unclog.html_regle-fondamentale': 'Règle fondamentale :',
  'pages_plumbing_unclog.html_maison-de-plain-pied': '🏠 MAISON DE PLAIN-PIED',
  'pages_plumbing_unclog.html_maison-a-etages': '🏢 MAISON À ÉTAGES',
  'pages_plumbing_unclog.html_acide-sulfurique': 'Acide Sulfurique',
  'pages_plumbing_unclog.html_acide-chlorhydrique': 'Acide Chlorhydrique',
  'pages_plumbing_unclog.html_un-desengorgement-est-necessaire-quand-d': 'Un désengorgement est nécessaire quand de mauvaises odeurs ou un refoulement sont constatés au niveau de la canalisation. On peut aussi faire appel à ce genre de système quand l\'évacuation d\'eau ralentit au niveau du système de plomberie.',
  'pages_plumbing_unclog.html_dans-la-plupart-des-cas-lengorgement-p': 'Dans la plupart des cas, l\'engorgement provient d\'une obstruction causée par des débris ou des corps étrangers :',
  'pages_plumbing_unclog.html_autres-causes-le-bouchon-peut-aussi-pr': 'Autres causes : Le bouchon peut aussi provenir d\'une racine qui bloque la circulation des eaux, ou d\'un système de plomberie mal effectué (pente insuffisante, coudes mal placés).',
  'pages_plumbing_unclog.html_dissout-la-graisse-le-savon-etc-verse': 'Dissout la graisse, le savon, etc. Verser directement dans le lavabo, l\'évier ou la douche.',
  'pages_plumbing_unclog.html_melanger-bicarbonate-de-soude-avec-du-se': 'Mélanger bicarbonate de soude avec du sel, verser et rincer à l\'eau chaude.',
  'pages_plumbing_unclog.html_eau-chaude-vinaigre-blanc-reaction-e': 'Eau chaude + vinaigre blanc : réaction effervescente qui aide à dissoudre les dépôts.',
  'pages_plumbing_unclog.html_la-methode-classique-et-efficace-pour-le': 'La méthode classique et efficace pour les petits bouchons. Créer une pression/dépression pour déloger l\'obstruction.',
  'pages_plumbing_unclog.html_outil-flexible-a-manivelle-pour-atteindr': 'Outil flexible à manivelle pour atteindre les bouchons profonds :',
  'pages_plumbing_unclog.html_le-calcaire-est-egalement-un-element-qui': 'Le calcaire est également un élément qui crée l\'engorgement de la canalisation. Ce dernier provient de l\'eau qui circule dans le système. Quand l\'eau est riche en calcaire, elle cause un entartrage des tuyaux.',
  'pages_plumbing_unclog.html_double-probleme-en-plus-de-bloquer-la': 'Double problème : En plus de bloquer la canalisation, le calcaire retient également les débris et déchets qui se glissent dans la tuyauterie.',
  'pages_plumbing_unclog.html_pour-un-debouchage-en-profondeur-le-mie': 'Pour un débouchage en profondeur, le mieux est de curer la canalisation avec l\'aide d\'un professionnel.',
  'pages_plumbing_unclog.html_concernant-les-bouchons-causes-par-une-r': 'Concernant les bouchons causés par une racine, la solution doit être technique et non manuelle. On ne peut pas résoudre le bouchon soi-même.',
  'pages_plumbing_unclog.html_methode-inspection-par-camera-camion': 'Méthode : Inspection par caméra → Camion hydrocurage avec buse → Déracinement si nécessaire → Réparations',
  'pages_plumbing_unclog.html_le-camion-hydrocureur-ou-camion-a-pompe': 'Le camion hydrocureur (ou camion à pompe/haute pression) est un équipement utilisé quand un bouchon persiste dans le système des eaux usées.',
  'pages_plumbing_unclog.html_psi-de-pression': 'PSI de pression',
  'pages_plumbing_unclog.html_camera-dinspection-integree': 'Caméra d\'inspection intégrée',
  'pages_plumbing_unclog.html_aspiration-nettoyage': 'Aspiration + Nettoyage',
  'pages_plumbing_unclog.html_le-debouchage-par-acide-est-efficace-mai': 'Le débouchage par acide est efficace mais dangereux pour la santé et la peau. Seuls des professionnels peuvent manipuler ces produits.',
  'pages_plumbing_unclog.html_utilise-pour-les-toilettes-bouchees-eli': 'Utilisé pour les toilettes bouchées. Élimine serviettes hygiéniques, papiers toilettes, etc.',
  'pages_plumbing_unclog.html_pour-canalisations-en-beton-ou-brique-a': 'Pour canalisations en béton ou brique. Aussi appelé acide muriatique.',
  'pages_plumbing_unclog.html_ce-type-de-debouchage-est-souvent-associ': 'Ce type de débouchage est souvent associé à un désengorgement par furet ou à un curage pour éliminer les débris restants.',
  'pages_plumbing_unclog.html_si-la-canalisation-est-engorgee-a-cause': 'Si la canalisation est engorgée à cause de la pente, il faut revoir les normes de l\'installation. Le réseau d\'évacuation doit suivre des règles précises pour un écoulement naturel.',
  'pages_plumbing_unclog.html_chaque-equipement-doit-avoir-son-propre': 'Chaque équipement doit avoir son propre conduit d\'évacuation. L\'évier ne doit pas avoir le même conduit que le lavabo. La douche ne doit pas adopter le même conduit que les toilettes, etc.',
  'pages_plumbing_unclog.html_dans-la-plupart-des-cas-les-engorgement': 'Dans la plupart des cas, les engorgements proviennent de normes de tuyauterie non respectées. Voici les diamètres recommandés :',
  'pages_plumbing_unclog.html_ces-regles-sont-inscrites-dans-les-norme': 'Ces règles sont inscrites dans les normes de plomberie et sont parfois difficiles à suivre pour les particuliers. Le mieux est de faire appel à un professionnel.',
  'pages_plumbing_unclog.html_ne-laissez-pas-un-bouchon-devenir-un-pro': 'Ne laissez pas un bouchon devenir un problème majeur. Contactez nos experts pour une intervention rapide et efficace.',
  'pages_plumbing_unclog.html_cheveux': 'Cheveux',
  'pages_plumbing_unclog.html_savon': 'Savon',
  'pages_plumbing_unclog.html_graisse': 'Graisse',
  'pages_plumbing_unclog.html_calcaire_1': 'Calcaire',
  'pages_plumbing_unclog.html': '🌿',
  'pages_plumbing_unclog.html_1': '♨️',
  'pages_plumbing_unclog.html_2': '🧂',
  'pages_plumbing_unclog.html_3': '🍶',
  'pages_plumbing_unclog.html_4': '🔧',
  'pages_plumbing_unclog.html_5': '🪠',
  'pages_plumbing_unclog.html_6': '🐍',
  'pages_plumbing_unclog.html_inspection-de-la-canalisation-pour-local': 'Inspection de la canalisation pour localiser le bouchon',
  'pages_plumbing_unclog.html_nettoyage-avec-jet-deau-a-haute-pressio': 'Nettoyage avec jet d\'eau à haute pression',
  'pages_plumbing_unclog.html_parfois-associe-a-un-debouchage-a-buse': 'Parfois associé à un débouchage à buse',
  'pages_plumbing_unclog.html_traitement-avec-solution-dazote-phosp': 'Traitement avec solution d\'azote + phosphore',
  'pages_plumbing_unclog.html_insertion-de-bacteries-qui-eliminent-les': 'Insertion de bactéries qui éliminent les dépôts',
  'pages_plumbing_unclog.html_ideal-pour-canalisations-fragiles': 'Idéal pour canalisations fragiles',
  'pages_plumbing_unclog.html_7': '🌳',
  'pages_plumbing_unclog.html_peut-bloquer-completement-levacuation-d': 'Peut bloquer complètement l\'évacuation des eaux usées',
  'pages_plumbing_unclog.html_peut-endommager-la-structure-de-la-canal': 'Peut endommager la structure de la canalisation',
  'pages_plumbing_unclog.html_necessite-souvent-des-travaux-de-reparat': 'Nécessite souvent des travaux de réparation après intervention',
  'pages_plumbing_unclog.html_8': '🚛',
  'pages_plumbing_unclog.html_9': '⚗️',
  'pages_plumbing_unclog.html_10': '📐',
  'pages_plumbing_unclog.html_1-2percent': '(1-2%)',
  'pages_plumbing_unclog.html_2-m': '(2 m)',
  'pages_plumbing_unclog.html_2-3percent': '(2-3%)',
  'pages_plumbing_unclog.html_2-m_1': '(2 m)',
  'pages_plumbing_unclog.html_11': '📏',
  'pages_plumbing_unclog.html_75-100-mm': '(75-100 mm)',
  'pages_plumbing_unclog.html_1percent': '(1%)',
  'pages_plumbing_unclog.html_32-mm': '(32 mm)',
  'pages_plumbing_unclog.html_38-mm': '(38 mm)',
  'pages_plumbing_unclog.html_91-cm': '(91 cm)',
  'pages_plumbing_unclog.html_38-mm_1': '(38 mm)',
  'pages_plumbing_unclog.html_91-cm_1': '(91 cm)',
  'pages_plumbing_unclog.html_50-mm': '(50 mm)',
  'pages_plumbing_unclog.html_introduire-le-furet-petit-a-petit': 'Introduire le furet petit à petit',
  'pages_plumbing_unclog.html_sentir-le-bouchon-a-linterieur-du-tuyau': 'Sentir le bouchon à l\'intérieur du tuyau',
  'pages_plumbing_unclog.html_activer-la-manivelle-et-tourner': 'Activer la manivelle et tourner',
  'pages_plumbing_unclog.html_retirer-et-rincer-a-leau': 'Retirer et rincer à l\'eau',
  'pages_plumbing_unclog.html_1-inspection-de-la-canalisation-pour-loc': '1\n                                    Inspection de la canalisation pour localiser le bouchon',
  'pages_plumbing_unclog.html_2-nettoyage-avec-jet-deau-a-haute-press': '2\n                                    Nettoyage avec jet d\'eau à haute pression',
  'pages_plumbing_unclog.html_3-parfois-associe-a-un-debouchage-a-buse': '3\n                                    Parfois associé à un débouchage à buse',
  'pages_plumbing_unclog.html_1-traitement-avec-solution-dazote-pho': '1\n                                    Traitement avec solution d\'azote + phosphore',
  'pages_plumbing_unclog.html_2-insertion-de-bacteries-qui-eliminent-l': '2\n                                    Insertion de bactéries qui éliminent les dépôts',
  'pages_plumbing_unclog.html_3-ideal-pour-canalisations-fragiles': '3\n                                    Idéal pour canalisations fragiles',
  'pages_plumbing_unclog.html_aspirer-la-boue-et-les-dechets': '• Aspirer la boue et les déchets',
  'pages_plumbing_unclog.html_deboucher-les-canalisations-tenaces': '• Déboucher les canalisations tenaces',
  'pages_plumbing_unclog.html_curage-a-haute-pression': '• Curage à haute pression',
  'pages_plumbing_unclog.html_nettoyage-complet-du-drain': '• Nettoyage complet du drain',
  'pages_plumbing_unclog.html_canalisation-a-lhorizontale': '• Canalisation à l\'horizontale',
  'pages_plumbing_unclog.html_collecteur-regroupant-tous-les-conduit': '• Collecteur regroupant tous les conduits',
  'pages_plumbing_unclog.html_collecteur-enfoui-ou-dans-la-dalle': '• Collecteur enfoui ou dans la dalle',
  'pages_plumbing_unclog.html_pente-18-14ft-1-2percent-jusqua-65': '• Pente: 1/8-1/4"/ft (1-2%) (jusqu\'à 6.5 pi (2 m))',
  'pages_plumbing_unclog.html_pente-14-38ft-2-3percent-au-dela-de': '• Pente: 1/4-3/8"/ft (2-3%) (au-delà de 6.5 pi (2 m))',
  'pages_plumbing_unclog.html_collecteur-dispose-verticalement': '• Collecteur disposé verticalement',
  'pages_plumbing_unclog.html_conduits-avec-clapet-aerateur': '• Conduits avec clapet aérateur',
  'pages_plumbing_unclog.html_reduit-les-odeurs': '• Réduit les odeurs',
  'pages_plumbing_unclog.html_diminue-le-bruit-devacuation': '• Diminue le bruit d\'évacuation',
  'pages_plumbing_unclog.html_evite-laspiration-deau-entre-conduit': '• Évite l\'aspiration d\'eau entre conduits',
  'pages_plumbing_unclog.html_mauvaises-odeurs': 'mauvaises odeurs',
  'pages_plumbing_unclog.html_refoulement': 'refoulement',
  'pages_plumbing_unclog.html_ralentit': 'ralentit',
  'pages_plumbing_unclog.html_autres-causes': 'Autres causes :',
  'pages_plumbing_unclog.html_racine': 'racine',
  'pages_plumbing_unclog.html_entartrage-des-tuyaux': 'entartrage des tuyaux',
  'pages_plumbing_unclog.html_double-probleme': 'Double problème :',
  'pages_plumbing_unclog.html_curer-la-canalisation': 'curer la canalisation',
  'pages_plumbing_unclog.html_technique-et-non-manuelle': 'technique et non manuelle',
  'pages_plumbing_unclog.html_methode': 'Méthode :',
  'pages_plumbing_unclog.html_dangereux-pour-la-sante-et-la-peau': 'dangereux pour la santé et la peau',
  'pages_plumbing_unclog.html_normes-de-plomberie': 'normes de plomberie',
  'pages_plumbing_unclog.html_debouchage-de-canalisations-or-guide-prat': 'Débouchage de Canalisations | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_unclog.html_drainage-pipe-unclogging-or-practical-plu': 'Drainage Pipe Unclogging | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_unclog.html_2en1': '2en1',
  'pages_plumbing_unclog.html_equipement': 'Équipement',
  'pages_plumbing_unclog.html_diametre-ext': 'Diamètre ext.',
  'pages_plumbing_unclog.html_pente-min': 'Pente min.',
  'pages_plumbing_unclog.html_toilettes': '🚽 Toilettes',
  'pages_plumbing_unclog.html_18ft': '1/8"/ft',
  'pages_plumbing_unclog.html_lavabo-avec-siphon': '🚿 Lavabo (avec siphon)',
  'pages_plumbing_unclog.html_evier': '🍽️ Évier',
  'pages_plumbing_unclog.html_baignoire-less3-pi': '🛁 Baignoire (<3 pi',
  'pages_plumbing_unclog.html_baignoire-greater3-pi': '🛁 Baignoire (>3 pi',
  'pages_plumbing_supply.html_introduction': 'Introduction',
  'pages_plumbing_supply.html_le-reseau-dalimentation': 'Le réseau d\'alimentation',
  'pages_plumbing_supply.html_pose-du-collecteur': 'Pose du collecteur',
  'pages_plumbing_supply.html_precautions-de-pose': 'Précautions de pose',
  'pages_plumbing_supply.html_choix-des-raccords': 'Choix des raccords',
  'pages_plumbing_supply.html_types-de-tuyaux': 'Types de tuyaux',
  'pages_plumbing_supply.html_cuivre': '→ Cuivre',
  'pages_plumbing_supply.html_pex': '→ PEX',
  'pages_plumbing_supply.html_multicouche': '→ Multicouche',
  'pages_plumbing_supply.html_diametres-a-respecter': 'Diamètres à respecter',
  'pages_plumbing_supply.html_regulation-de-pression': 'Régulation de pression',
  'pages_plumbing_supply.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_supply.html_debouchage': '→ Débouchage',
  'pages_plumbing_supply.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_supply.html_1-514-972-2078': '📞 +1 (514) 972-2078',
  'pages_plumbing_supply.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_supply.html_1-le-reseau-dalimentation': '1\n                        LE RÉSEAU D\'ALIMENTATION',
  'pages_plumbing_supply.html_2-pose-du-collecteur': '2\n                        POSE DU COLLECTEUR',
  'pages_plumbing_supply.html_precautions-de-pose_1': '!\n                        PRÉCAUTIONS DE POSE',
  'pages_plumbing_supply.html_3-types-de-tuyaux': '3\n                        TYPES DE TUYAUX',
  'pages_plumbing_supply.html_4-diametres-a-respecter': '4\n                        DIAMÈTRES À RESPECTER',
  'pages_plumbing_supply.html_5-regulation-de-la-pression': '5\n                        RÉGULATION DE LA PRESSION',
  'pages_plumbing_supply.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_supply.html_pose-encastree': 'POSE ENCASTRÉE',
  'pages_plumbing_supply.html_pose-apparente': 'POSE APPARENTE',
  'pages_plumbing_supply.html_tuyaux-en-cuivre': '🔶 TUYAUX EN CUIVRE',
  'pages_plumbing_supply.html_tuyaux-en-pex': '🔵 TUYAUX EN PEX',
  'pages_plumbing_supply.html_tuyaux-multicouches': '🟢 TUYAUX MULTICOUCHES',
  'pages_plumbing_supply.html_besoin-dun-professionnel': 'BESOIN D\'UN PROFESSIONNEL ?',
  'pages_plumbing_supply.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_supply.html_a-savoir-avant-de-commencer': 'À SAVOIR AVANT DE COMMENCER',
  'pages_plumbing_supply.html_tuyaux': 'TUYAUX',
  'pages_plumbing_supply.html_raccords': 'RACCORDS',
  'pages_plumbing_supply.html_collecteurs': 'COLLECTEURS',
  'pages_plumbing_supply.html_securite-importante': 'SÉCURITÉ IMPORTANTE',
  'pages_plumbing_supply.html_cuivre-recuit': 'Cuivre Recuit',
  'pages_plumbing_supply.html_cuivre-ecroui': 'Cuivre Écroui',
  'pages_plumbing_supply.html_types-de-raccords-pex': 'Types de raccords PEX :',
  'pages_plumbing_supply.html_avantages': '✓ Avantages :',
  'pages_plumbing_supply.html_comment-tester-la-pression': '📏 Comment tester la pression ?',
  'pages_plumbing_supply.html_avant-la-pose': 'Avant la pose :',
  'pages_plumbing_supply.html_en-cas-de-soudure': 'En cas de soudure :',
  'pages_plumbing_supply.html_pour-alimenter-le-foyer-et-les-equipemen': 'Pour alimenter le foyer et les équipements en eau courante, il faut installer un réseau d\'alimentation d\'eau. Ce guide vous accompagne pas à pas dans la compréhension et l\'installation de votre système.',
  'pages_plumbing_supply.html_on-utilise-leau-courante-tous-les-jours': 'On utilise l\'eau courante tous les jours, pour des questions d\'hygiène et de confort. De ce fait, si vous songez à installer votre plomberie, vous devez penser à l\'alimentation en eau du bâtiment. L\'eau doit parvenir à tout le réseau de plomberie, pour alimenter la douche, la baignoire, les toilettes, l\'évier, le chauffe-eau, etc.',
  'pages_plumbing_supply.html_le-reseau-dalimentation-deau-est-gener': 'Le réseau d\'alimentation d\'eau est généralement composé de tuyaux, de raccords et de collecteurs. Les collecteurs sont utilisés pour que tous les équipements puissent bénéficier d\'eau courante. Ils sont donc des éléments principaux pour la distribution d\'eau.',
  'pages_plumbing_supply.html_transport-de-leau': 'Transport de l\'eau',
  'pages_plumbing_supply.html_connexions': 'Connexions',
  'pages_plumbing_supply.html_distribution': 'Distribution',
  'pages_plumbing_supply.html_un-collecteur-est-compose-de-plusieurs-s': 'Un collecteur est composé de plusieurs sorties d\'eau, suivant le nombre d\'équipements utilisés. Le nombre de collecteurs à utiliser dépend du nombre de pièces à alimenter et des étages du bâtiment.',
  'pages_plumbing_supply.html_note-historique-auparavant-seuls-les': 'Note historique : Auparavant, seuls les tuyaux en plomb étaient utilisés. De nos jours, ce matériau est interdit. On utilise désormais le cuivre, le PEX et le multicouche.',
  'pages_plumbing_supply.html_le-cuivre-remplace-principalement-la-tuy': 'Le cuivre remplace principalement la tuyauterie traditionnelle en plomb. Il n\'est pas sensible à la corrosion, se dilate rarement et résiste à la pression.',
  'pages_plumbing_supply.html_les-plus-pratiques-car-ils-nont-pas-bes': 'Les plus pratiques car ils n\'ont pas besoin de raccords par soudure. Cependant, ils nécessitent plusieurs guides pour la fixation.',
  'pages_plumbing_supply.html_petits-projets-montage-par-vissage': 'Petits projets, montage par vissage',
  'pages_plumbing_supply.html_complexe-mais-fiable-professionnel': 'Complexe mais fiable, professionnel',
  'pages_plumbing_supply.html_installations-neuves-durable': 'Installations neuves, durable',
  'pages_plumbing_supply.html_un-bon-compromis-entre-le-cuivre-et-le-p': 'Un bon compromis entre le cuivre et le PEX. Composés de couches de polyéthylène réticulé, ils supportent la chaleur, sont silencieux et ne nécessitent aucune soudure.',
  'pages_plumbing_supply.html_pour-une-distribution-correcte-de-leau': 'Pour une distribution correcte de l\'eau, il faut suivre des normes concernant le diamètre de la tuyauterie selon le débit souhaité.',
  'pages_plumbing_supply.html_regle-generale-un-tuyau-de-grand-diame': 'Règle générale : Un tuyau de grand diamètre offrira un débit élevé tandis qu\'un tuyau de petite taille sera limité côté débit.',
  'pages_plumbing_supply.html_pression-standard-du-reseau-public': 'Pression standard du réseau public',
  'pages_plumbing_supply.html_installer-un-suppresseur': 'Installer un suppresseur',
  'pages_plumbing_supply.html_installer-un-reducteur': 'Installer un réducteur',
  'pages_plumbing_supply.html_utilisez-un-manometre-pour-mesurer-la-pr': 'Utilisez un manomètre pour mesurer la pression. Le réducteur de pression s\'installe à la sortie du compteur pour éviter la détérioration de la tuyauterie.',
  'pages_plumbing_supply.html_vu-la-complexite-du-reseau-dalimentatio': 'Vu la complexité du réseau d\'alimentation en eau courante, il est conseillé de faire appel à un professionnel de la plomberie qui maîtrise ce domaine.',
  'pages_plumbing_supply.html_necessite-deux-collecteurs-eau-froide': 'Nécessite deux collecteurs (eau froide + eau chaude)',
  'pages_plumbing_supply.html_raccordement-au-chauffe-eau-pour-leau-c': 'Raccordement au chauffe-eau pour l\'eau chaude',
  'pages_plumbing_supply.html_tuyaux-multicouches-ou-pex-recommandes': 'Tuyaux multicouches ou PEX recommandés',
  'pages_plumbing_supply.html_pose-sous-fourreau-pour-dalle-ou-plaque': 'Pose sous fourreau pour dalle ou plaque de plâtre',
  'pages_plumbing_supply.html_tuyaux-en-cuivre-ou-multicouches-recomma': 'Tuyaux en cuivre ou multicouches recommandés',
  'pages_plumbing_supply.html_solides-et-resistants-aux-uv': 'Solides et résistants aux UV',
  'pages_plumbing_supply.html_fixation-a-6-15-cm-du-sol': 'Fixation à ~6" (15 cm) du sol',
  'pages_plumbing_supply.html_15-cm': '(15 cm)',
  'pages_plumbing_supply.html_raccordement-parfait-pour-eviter-les-fui': 'Raccordement parfait pour éviter les fuites',
  'pages_plumbing_supply.html_bleu-eau-froide': 'Bleu = Eau Froide',
  'pages_plumbing_supply.html_rouge-eau-chaude': 'Rouge = Eau Chaude',
  'pages_plumbing_supply.html_10-mm': '(10 mm)',
  'pages_plumbing_supply.html_16-mm': '(16 mm)',
  'pages_plumbing_supply.html_20-mm': '(20 mm)',
  'pages_plumbing_supply.html_3-bar': '(3 bar)',
  'pages_plumbing_supply.html_3-bar_1': '(3 bar)',
  'pages_plumbing_supply.html_5-bar': '(5 bar)',
  'pages_plumbing_supply.html_fermer-la-vanne-qui-ouvre-et-ferme-la': '• Fermer la vanne qui ouvre et ferme la canalisation',
  'pages_plumbing_supply.html_choisir-le-type-de-raccordement-avec': '• Choisir le type de raccordement (avec ou sans soudure)',
  'pages_plumbing_supply.html_porter-des-gants-de-protection': '• Porter des gants de protection',
  'pages_plumbing_supply.html_porter-des-lunettes-de-securite': '• Porter des lunettes de sécurité',
  'pages_plumbing_supply.html_ventiler-la-zone-de-travail': '• Ventiler la zone de travail',
  'pages_plumbing_supply.html_peu-de-raccords-necessaires': '• Peu de raccords nécessaires',
  'pages_plumbing_supply.html_fixation-a-froid': '• Fixation à froid',
  'pages_plumbing_supply.html_encastrable': '• Encastrable',
  'pages_plumbing_supply.html_fixation-a-chaud': '• Fixation à chaud',
  'pages_plumbing_supply.html_non-encastrable': '• Non encastrable',
  'pages_plumbing_supply.html_installation-murale': '• Installation murale',
  'pages_plumbing_supply.html_resistance-a-la-chaleur': '• Résistance à la chaleur',
  'pages_plumbing_supply.html_silencieux': '• Silencieux',
  'pages_plumbing_supply.html_pas-de-soudure': '• Pas de soudure',
  'pages_plumbing_supply.html_fixation-par-sertissage': '• Fixation par sertissage',
  'pages_plumbing_supply.html_tuyaux_1': 'tuyaux',
  'pages_plumbing_supply.html_raccords_1': 'raccords',
  'pages_plumbing_supply.html_collecteurs_1': 'collecteurs',
  'pages_plumbing_supply.html_note-historique': 'Note historique :',
  'pages_plumbing_supply.html_note': '⚠️ Note :',
  'pages_plumbing_supply.html_attention': '⚠️ Attention :',
  'pages_plumbing_supply.html_a-compression': 'À compression',
  'pages_plumbing_supply.html_a-glissement': 'À glissement',
  'pages_plumbing_supply.html_a-sertir': 'À sertir',
  'pages_plumbing_supply.html_regle-generale': 'Règle générale :',
  'pages_plumbing_supply.html_suppresseur': 'suppresseur',
  'pages_plumbing_supply.html_reducteur': 'réducteur',
  'pages_plumbing_supply.html_manometre': 'manomètre',
  'pages_plumbing_supply.html_alimentation-deau-or-guide-pratique-de-p': 'Alimentation d\'Eau | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_supply.html_water-supply-or-practical-plumbing-guide': 'Water Supply | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_supply.html_la-pose-est-dordre-professionnel-car-le': 'La pose est d\'ordre professionnel car le raccordement et l\'installation sont techniques.',
  'pages_plumbing_supply.html_les-tuyaux-pex-ne-supportent-pas-les-uv': 'Les tuyaux PEX ne supportent pas les UV. Ils doivent être encastrés ou protégés.',
  'pages_plumbing_supply.html_debit-souhaite': 'Débit souhaité',
  'pages_plumbing_supply.html_diametre-recommande': 'Diamètre recommandé',
  'pages_plumbing_supply.html_50-lmin': '50 L/min',
  'pages_plumbing_supply.html_160-lmin': '160 L/min',
  'pages_plumbing_supply.html_250-lmin': '250 L/min',
  'pages_plumbing_supply.html_44-psi': '44 PSI',
  'pages_plumbing_supply.html_less-44-psi': '< 44 PSI',
  'pages_plumbing_supply.html_greater-73-psi': '> 73 PSI',
  'pages_plumbing_normes.html_introduction': 'Introduction',
  'pages_plumbing_normes.html_diametre-nominal-dn': 'Diamètre nominal (DN)',
  'pages_plumbing_normes.html_tableau-des-dn': 'Tableau des DN',
  'pages_plumbing_normes.html_debits-devacuation': 'Débits d\'évacuation',
  'pages_plumbing_normes.html_pentes-recommandees': 'Pentes recommandées',
  'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux': 'Tuyaux sanitaires et pluviaux',
  'pages_plumbing_normes.html_conformite': 'Conformité',
  'pages_plumbing_normes.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_normes.html_systeme-de-drainage': '→ Système de drainage',
  'pages_plumbing_normes.html_debouchage': '→ Débouchage',
  'pages_plumbing_normes.html_appeler-maintenant': '📞 APPELER MAINTENANT',
  'pages_plumbing_normes.html_demander-une-inspection': 'DEMANDER UNE INSPECTION',
  'pages_plumbing_normes.html_o-diametre-nominal-nps': 'Ø\n                        DIAMÈTRE NOMINAL (NPS)',
  'pages_plumbing_normes.html_tableau-des-nps-par-appareil': '📊\n                        TABLEAU DES NPS PAR APPAREIL',
  'pages_plumbing_normes.html_debits-devacuation_1': '💧\n                        DÉBITS D\'ÉVACUATION',
  'pages_plumbing_normes.html_pentes-recommandees_1': '📐\n                        PENTES RECOMMANDÉES',
  'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux_1': '🚧\n                        TUYAUX SANITAIRES ET PLUVIAUX',
  'pages_plumbing_normes.html_conformite-et-reglementation': '✓\n                        CONFORMITÉ ET RÉGLEMENTATION',
  'pages_plumbing_normes.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_normes.html_3-tuyaux-3-76-mm': '≤3"\n                                TUYAUX ≤ 3" (≤ 76 mm)',
  'pages_plumbing_normes.html_4-tuyaux-4-100-mm': '≥4"\n                                TUYAUX ≥ 4" (≥ 100 mm)',
  'pages_plumbing_normes.html_limites-de-pente': 'LIMITES DE PENTE',
  'pages_plumbing_normes.html_besoin-dune-verification': 'BESOIN D\'UNE VÉRIFICATION ?',
  'pages_plumbing_normes.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_normes.html_pourquoi-respecter-les-normes': 'POURQUOI RESPECTER LES NORMES ?',
  'pages_plumbing_normes.html_regle-importante-pente-et-longueur': '⚠️ RÈGLE IMPORTANTE : PENTE ET LONGUEUR',
  'pages_plumbing_normes.html_eaux-sanitaires': '🚽 EAUX SANITAIRES',
  'pages_plumbing_normes.html_eaux-pluviales': '🌧️ EAUX PLUVIALES',
  'pages_plumbing_normes.html_points-de-conformite-a-verifier': 'POINTS DE CONFORMITÉ À VÉRIFIER',
  'pages_plumbing_normes.html_travaux-necessitant-un-permis': '⚠️ TRAVAUX NÉCESSITANT UN PERMIS',
  'pages_plumbing_normes.html_le-respect-des-normes-de-plomberie-garan': 'Le respect des normes de plomberie garantit le bon fonctionnement de votre système d\'évacuation, prévient les engorgements et assure la conformité avec le code du bâtiment du Québec.',
  'pages_plumbing_normes.html_le-nps-nominal-pipe-size-est-la-mesure': 'Le NPS (Nominal Pipe Size) est la mesure standard utilisée pour désigner le diamètre des tuyaux d\'évacuation en Amérique du Nord. Il correspond approximativement au diamètre intérieur du tuyau en pouces.',
  'pages_plumbing_normes.html_important-le-diametre-exterieur-peut-v': 'Important : Le diamètre extérieur peut varier selon le matériau (PVC, fonte, cuivre). Le NPS indique la capacité de débit, pas les dimensions exactes.',
  'pages_plumbing_normes.html_chaque-appareil-sanitaire-necessite-un-d': 'Chaque appareil sanitaire nécessite un diamètre minimum pour assurer une évacuation correcte :',
  'pages_plumbing_normes.html_le-debit-devacuation-represente-la-quan': 'Le débit d\'évacuation représente la quantité d\'eau que chaque appareil peut évacuer par seconde. Cette valeur est essentielle pour dimensionner correctement les canalisations.',
  'pages_plumbing_normes.html_ue-unite-devacuation-valeur-normal': '*UE = Unité d\'Évacuation : Valeur normalisée utilisée pour calculer la charge totale d\'un système de plomberie.',
  'pages_plumbing_normes.html_la-pente-cumulee-ne-doit-jamais-depasser': 'La pente cumulée ne doit jamais dépasser le diamètre du tuyau en hauteur, sauf si le tuyau est ventilé. Cette règle détermine la longueur maximale d\'un tuyau horizontal.',
  'pages_plumbing_normes.html_conseil-pour-un-tuyau-de-2-avec-une-p': 'Conseil : Pour un tuyau de 2" avec une pente idéale de 1/4"/pi, ne pas dépasser 8 pieds de longueur. Avec une pente minimale de 1/8"/pi, vous pouvez aller jusqu\'à 16 pieds, mais c\'est moins recommandé.',
  'pages_plumbing_normes.html_pente-maximale-globale-21-mmm': 'Pente maximale globale (21 mm/m)',
  'pages_plumbing_normes.html_au-dela-leau-secoule-trop-vite-et-lai': 'Au-delà, l\'eau s\'écoule trop vite et laisse les solides derrière',
  'pages_plumbing_normes.html_pente-minimale-globale-5-mmm': 'Pente minimale globale (5 mm/m)',
  'pages_plumbing_normes.html_en-dessous-stagnation-des-eaux-et-depot': 'En dessous, stagnation des eaux et dépôts',
  'pages_plumbing_normes.html_astuce-une-pente-trop-forte-est-aus': '💡 Astuce : Une pente trop forte est aussi problématique qu\'une pente trop faible. L\'eau s\'écoule trop rapidement et laisse les matières solides s\'accumuler, causant des engorgements à long terme.',
  'pages_plumbing_normes.html_en-plomberie-residentielle-nous-travail': 'En plomberie résidentielle, nous travaillons principalement avec deux types de réseaux d\'évacuation : les eaux sanitaires (eaux usées) et les eaux pluviales (eau de pluie). Ces réseaux sont généralement séparés.',
  'pages_plumbing_normes.html_proviennent-des-appareils-sanitaires-to': 'Proviennent des appareils sanitaires (toilettes, lavabos, douches, éviers, etc.)',
  'pages_plumbing_normes.html_proviennent-de-la-collecte-des-eaux-de-p': 'Proviennent de la collecte des eaux de pluie sur le toit et autour du bâtiment.',
  'pages_plumbing_normes.html_note-importante-les-eaux-pluviales': '💧 Note importante : Les eaux pluviales doivent être évacuées séparément des eaux sanitaires dans la plupart des municipalités du Québec. Le raccordement des descentes pluviales au réseau sanitaire est généralement interdit.',
  'pages_plumbing_normes.html_attention-les-gouttieres-ne-font-pa': '⚠️ Attention : Les gouttières ne font pas partie du travail du plombier. Les plombiers travaillent sur les tuyaux de descente pluviale à partir du point d\'entrée dans le bâtiment jusqu\'au raccordement au réseau municipal ou au système de drainage.',
  'pages_plumbing_normes.html_certains-travaux-de-plomberie-necessiten': 'Certains travaux de plomberie nécessitent un permis de la municipalité et l\'intervention d\'un maître-plombier :',
  'pages_plumbing_normes.html_nos-experts-peuvent-inspecter-votre-syst': 'Nos experts peuvent inspecter votre système de plomberie et vérifier sa conformité aux normes en vigueur.',
  'pages_plumbing_normes.html_nominal-pipe-size': 'Nominal Pipe Size',
  'pages_plumbing_normes.html_inches': 'Inches',
  'pages_plumbing_normes.html_o-interieur': 'Ø intérieur',
  'pages_plumbing_normes.html': '📊',
  'pages_plumbing_normes.html_1': '🚽',
  'pages_plumbing_normes.html_76-mm': '(76 mm)',
  'pages_plumbing_normes.html_76-mm_1': '(76 mm)',
  'pages_plumbing_normes.html_2': '🚿',
  'pages_plumbing_normes.html_50-mm': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_1': '(50 mm)',
  'pages_plumbing_normes.html_3': '🧼',
  'pages_plumbing_normes.html_38-mm': '(38 mm)',
  'pages_plumbing_normes.html_38-mm_1': '(38 mm)',
  'pages_plumbing_normes.html_4': '🍽️',
  'pages_plumbing_normes.html_50-mm_2': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_3': '(50 mm)',
  'pages_plumbing_normes.html_5': '🧺',
  'pages_plumbing_normes.html_50-mm_4': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_5': '(50 mm)',
  'pages_plumbing_normes.html_6': '🍴',
  'pages_plumbing_normes.html_50-mm_6': '(50 mm)',
  'pages_plumbing_normes.html_50-mm_7': '(50 mm)',
  'pages_plumbing_normes.html_7': '🔧',
  'pages_plumbing_normes.html_38-mm_2': '(38 mm)',
  'pages_plumbing_normes.html_38-mm_3': '(38 mm)',
  'pages_plumbing_normes.html_8': '🏠',
  'pages_plumbing_normes.html_100-mm': '(100 mm)',
  'pages_plumbing_normes.html_100-125-mm': '(100-125 mm)',
  'pages_plumbing_normes.html_9': '💧',
  'pages_plumbing_normes.html_10': '📐',
  'pages_plumbing_normes.html_3_1': '≤3"',
  'pages_plumbing_normes.html_76-mm_2': '(≤ 76 mm)',
  'pages_plumbing_normes.html_pente-ideale': 'Pente idéale',
  'pages_plumbing_normes.html_14pi-21-mmm': '1/4"/pi (21 mm/m)',
  'pages_plumbing_normes.html_21-mmm': '(21 mm/m)',
  'pages_plumbing_normes.html_minimum-acceptable': 'Minimum acceptable',
  'pages_plumbing_normes.html_18pi-10-mmm': '1/8"/pi (10 mm/m)',
  'pages_plumbing_normes.html_10-mmm': '(10 mm/m)',
  'pages_plumbing_normes.html_4_1': '≥4"',
  'pages_plumbing_normes.html_100-mm_1': '(≥ 100 mm)',
  'pages_plumbing_normes.html_pente-ideale_1': 'Pente idéale',
  'pages_plumbing_normes.html_18pi-10-mmm_1': '1/8"/pi (10 mm/m)',
  'pages_plumbing_normes.html_10-mmm_1': '(10 mm/m)',
  'pages_plumbing_normes.html_minimum-acceptable_1': 'Minimum acceptable',
  'pages_plumbing_normes.html_116pi-5-mmm': '1/16"/pi (5 mm/m)',
  'pages_plumbing_normes.html_5-mmm': '(5 mm/m)',
  'pages_plumbing_normes.html_38-mm_4': '(38 mm)',
  'pages_plumbing_normes.html_18-m': '(1.8 m)',
  'pages_plumbing_normes.html_36-m': '(3.6 m)',
  'pages_plumbing_normes.html_50-mm_8': '(50 mm)',
  'pages_plumbing_normes.html_24-m-recommande': '(2.4 m) ★ Recommandé',
  'pages_plumbing_normes.html_48-m': '(4.8 m)',
  'pages_plumbing_normes.html_76-mm_3': '(76 mm)',
  'pages_plumbing_normes.html_36-m_1': '(3.6 m)',
  'pages_plumbing_normes.html_73-m': '(7.3 m)',
  'pages_plumbing_normes.html_21-mmm_1': '(21 mm/m)',
  'pages_plumbing_normes.html_5-mmm_1': '(5 mm/m)',
  'pages_plumbing_normes.html_11': '🚧',
  'pages_plumbing_normes.html_12': '🚽',
  'pages_plumbing_normes.html_1-12': '1-1/2"',
  'pages_plumbing_normes.html_lavabo-bidet': 'Lavabo, bidet',
  'pages_plumbing_normes.html_2_1': '2"',
  'pages_plumbing_normes.html_douche-baignoire-evier-lave-linge': 'Douche, baignoire, évier, lave-linge',
  'pages_plumbing_normes.html_3_2': '3"',
  'pages_plumbing_normes.html_toilettes': 'Toilettes',
  'pages_plumbing_normes.html_4_2': '4"',
  'pages_plumbing_normes.html_collecteur-principal': 'Collecteur principal',
  'pages_plumbing_normes.html_13': '🌧️',
  'pages_plumbing_normes.html_3_3': '3"',
  'pages_plumbing_normes.html_descente-pluviale-standard': 'Descente pluviale standard',
  'pages_plumbing_normes.html_4_3': '4"',
  'pages_plumbing_normes.html_grande-surface-de-toiture': 'Grande surface de toiture',
  'pages_plumbing_normes.html_4_4': '4"+',
  'pages_plumbing_normes.html_collecteur-pluvial-principal': 'Collecteur pluvial principal',
  'pages_plumbing_normes.html_diametres-conformes-aux-normes-nps': 'Diamètres conformes aux normes NPS',
  'pages_plumbing_normes.html_pentes-adequates-18-38pi': 'Pentes adéquates (1/8-3/8"/pi)',
  'pages_plumbing_normes.html_ventilation-primaire-et-secondaire': 'Ventilation primaire et secondaire',
  'pages_plumbing_normes.html_siphons-aux-points-requis': 'Siphons aux points requis',
  'pages_plumbing_normes.html_raccords-etanches': 'Raccords étanches',
  'pages_plumbing_normes.html_separation-eaux-usees-pluviales': 'Séparation eaux usées / pluviales',
  'pages_plumbing_normes.html_regard-de-visite-accessible': 'Regard de visite accessible',
  'pages_plumbing_normes.html_clapet-anti-refoulement-si-requis': 'Clapet anti-refoulement si requis',
  'pages_plumbing_normes.html_1-12-lavabo-bidet': '1-1/2"\n                                        Lavabo, bidet',
  'pages_plumbing_normes.html_2-douche-baignoire-evier-lave-linge': '2"\n                                        Douche, baignoire, évier, lave-linge',
  'pages_plumbing_normes.html_3-toilettes': '3"\n                                        Toilettes',
  'pages_plumbing_normes.html_4-collecteur-principal': '4"\n                                        Collecteur principal',
  'pages_plumbing_normes.html_3-descente-pluviale-standard': '3"\n                                        Descente pluviale standard',
  'pages_plumbing_normes.html_4-grande-surface-de-toiture': '4"\n                                        Grande surface de toiture',
  'pages_plumbing_normes.html_4-collecteur-pluvial-principal': '4"+\n                                        Collecteur pluvial principal',
  'pages_plumbing_normes.html_remplacement-de-la-valve-dentree-prin': '• Remplacement de la valve d\'entrée principale',
  'pages_plumbing_normes.html_raccordement-au-reseau-daqueduc': '• Raccordement au réseau d\'aqueduc',
  'pages_plumbing_normes.html_modification-majeure-du-systeme-devac': '• Modification majeure du système d\'évacuation',
  'pages_plumbing_normes.html_installation-de-nouvelles-conduites': '• Installation de nouvelles conduites',
  'pages_plumbing_normes.html_travaux-touchant-le-collecteur-princip': '• Travaux touchant le collecteur principal',
  'pages_plumbing_normes.html_branchement-au-reseau-degout-municipa': '• Branchement au réseau d\'égout municipal',
  'pages_plumbing_normes.html_bon-fonctionnement': 'bon fonctionnement',
  'pages_plumbing_normes.html_engorgements': 'engorgements',
  'pages_plumbing_normes.html_conformite_1': 'conformité',
  'pages_plumbing_normes.html_nps-nominal-pipe-size': 'NPS (Nominal Pipe Size)',
  'pages_plumbing_normes.html_important': 'Important :',
  'pages_plumbing_normes.html_diametre-minimum': 'diamètre minimum',
  'pages_plumbing_normes.html_debit-devacuation': 'débit d\'évacuation',
  'pages_plumbing_normes.html_ue-unite-devacuation': '*UE = Unité d\'Évacuation',
  'pages_plumbing_normes.html_jamais-depasser-le-diametre-du-tuyau-en': 'jamais dépasser le diamètre du tuyau en hauteur',
  'pages_plumbing_normes.html_6_1': '6\'',
  'pages_plumbing_normes.html_12_1': '12\'',
  'pages_plumbing_normes.html_8_1': '8\'',
  'pages_plumbing_normes.html_16': '16\'',
  'pages_plumbing_normes.html_12_2': '12\'',
  'pages_plumbing_normes.html_24': '24\'',
  'pages_plumbing_normes.html_conseil': 'Conseil :',
  'pages_plumbing_normes.html_astuce': '💡 Astuce :',
  'pages_plumbing_normes.html_eaux-sanitaires_1': 'eaux sanitaires',
  'pages_plumbing_normes.html_eaux-pluviales_1': 'eaux pluviales',
  'pages_plumbing_normes.html_note-importante': '💧 Note importante :',
  'pages_plumbing_normes.html_separement': 'séparément',
  'pages_plumbing_normes.html_attention': '⚠️ Attention :',
  'pages_plumbing_normes.html_normes-de-plomberie-or-guide-pratique-de': 'Normes de Plomberie | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_normes.html_plumbing-standards-or-practical-plumbing': 'Plumbing Standards | Practical Plumbing Guide | Unclogged Me',
  'pages_plumbing_normes.html_nps': 'NPS',
  'pages_plumbing_normes.html_pouces': 'pouces',
  'pages_plumbing_normes.html_appareil-sanitaire': 'Appareil sanitaire',
  'pages_plumbing_normes.html_nps-min': 'NPS min.',
  'pages_plumbing_normes.html_nps-recommande': 'NPS recommandé',
  'pages_plumbing_normes.html_wc-toilettes': 'WC (toilettes)',
  'pages_plumbing_normes.html_douche-baignoire': 'Douche / Baignoire',
  'pages_plumbing_normes.html_lavabo': 'Lavabo',
  'pages_plumbing_normes.html_evier-de-cuisine': 'Évier de cuisine',
  'pages_plumbing_normes.html_lave-linge': 'Lave-linge',
  'pages_plumbing_normes.html_lave-vaisselle': 'Lave-vaisselle',
  'pages_plumbing_normes.html_bidet': 'Bidet',
  'pages_plumbing_normes.html_collecteur-principal_1': 'Collecteur principal',
  'pages_plumbing_normes.html_appareil': 'Appareil',
  'pages_plumbing_normes.html_debit-ls': 'Débit (L/s)',
  'pages_plumbing_normes.html_ue': 'UE*',
  'pages_plumbing_normes.html_wc-avec-reservoir': '🚽 WC avec réservoir',
  'pages_plumbing_normes.html_15-ls': '1.5 L/s',
  'pages_plumbing_normes.html_4-ue': '4 UE',
  'pages_plumbing_normes.html_baignoire': '🛁 Baignoire',
  'pages_plumbing_normes.html_09-ls': '0.9 L/s',
  'pages_plumbing_normes.html_2-ue': '2 UE',
  'pages_plumbing_normes.html_douche': '🚿 Douche',
  'pages_plumbing_normes.html_05-ls': '0.5 L/s',
  'pages_plumbing_normes.html_2-ue_1': '2 UE',
  'pages_plumbing_normes.html_lavabo_1': '🧼 Lavabo',
  'pages_plumbing_normes.html_05-ls_1': '0.5 L/s',
  'pages_plumbing_normes.html_1-ue': '1 UE',
  'pages_plumbing_normes.html_evier-de-cuisine_1': '🍽️ Évier de cuisine',
  'pages_plumbing_normes.html_075-ls': '0.75 L/s',
  'pages_plumbing_normes.html_2-ue_2': '2 UE',
  'pages_plumbing_normes.html_lave-linge_1': '🧺 Lave-linge',
  'pages_plumbing_normes.html_08-ls': '0.8 L/s',
  'pages_plumbing_normes.html_3-ue': '3 UE',
  'pages_plumbing_normes.html_lave-vaisselle_1': '🍴 Lave-vaisselle',
  'pages_plumbing_normes.html_06-ls': '0.6 L/s',
  'pages_plumbing_normes.html_2-ue_3': '2 UE',
  'pages_plumbing_normes.html_diametre': 'Diamètre',
  'pages_plumbing_normes.html_pente-14pi-ideale': 'Pente 1/4"/pi (idéale)',
  'pages_plumbing_normes.html_pente-18pi-min': 'Pente 1/8"/pi (min)',
  'pages_plumbing_normes.html_max': 'Max',
  'pages_plumbing_normes.html_max_1': 'Max',
  'pages_plumbing_normes.html_max_2': 'Max',
  'pages_plumbing_normes.html_max_3': 'Max',
  'pages_plumbing_normes.html_max_4': 'Max',
  'pages_plumbing_normes.html_max_5': 'Max',
  'pages_plumbing_normes.html_14pi-max': '1/4"/pi max',
  'pages_plumbing_normes.html_116pi-min': '1/16"/pi min',
  'pages_plumbing_drainage.html_introduction': 'Introduction',
  'pages_plumbing_drainage.html_les-4-circuits': 'Les 4 circuits',
  'pages_plumbing_drainage.html_systeme-dalimentation': 'Système d\'alimentation',
  'pages_plumbing_drainage.html_compteur-et-vanne': 'Compteur et vanne',
  'pages_plumbing_drainage.html_evacuation': 'Évacuation',
  'pages_plumbing_drainage.html_role-des-siphons': 'Rôle des siphons',
  'pages_plumbing_drainage.html_pente-devacuation': 'Pente d\'évacuation',
  'pages_plumbing_drainage.html_ventilation': 'Ventilation',
  'pages_plumbing_drainage.html_reperer-vos-circuits': 'Repérer vos circuits',
  'pages_plumbing_drainage.html_alimentation-en-eau': '→ Alimentation en eau',
  'pages_plumbing_drainage.html_debouchage': '→ Débouchage',
  'pages_plumbing_drainage.html_normes-plomberie': '→ Normes plomberie',
  'pages_plumbing_drainage.html_1-514-972-2078': '📞 +1 (514) 972-2078',
  'pages_plumbing_drainage.html_demander-un-devis': 'DEMANDER UN DEVIS',
  'pages_plumbing_drainage.html_les-4-circuits-de-votre-plomberie': 'LES 4 CIRCUITS DE VOTRE PLOMBERIE',
  'pages_plumbing_drainage.html_1-systeme-dalimentation': '1\n                        SYSTÈME D\'ALIMENTATION',
  'pages_plumbing_drainage.html_compteur-et-vanne-darret': '!\n                        COMPTEUR ET VANNE D\'ARRÊT',
  'pages_plumbing_drainage.html_2-systeme-devacuation': '2\n                        SYSTÈME D\'ÉVACUATION',
  'pages_plumbing_drainage.html_le-role-des-siphons': 'LE RÔLE DES SIPHONS',
  'pages_plumbing_drainage.html_3-systeme-de-ventilation': '3\n                        SYSTÈME DE VENTILATION',
  'pages_plumbing_drainage.html_4-reperer-vos-circuits': '4\n                        REPÉRER VOS CIRCUITS',
  'pages_plumbing_drainage.html_table-des-matieres': 'TABLE DES MATIÈRES',
  'pages_plumbing_drainage.html_eau-froide': 'EAU FROIDE',
  'pages_plumbing_drainage.html_eau-chaude': 'EAU CHAUDE',
  'pages_plumbing_drainage.html_evacuation_1': 'ÉVACUATION',
  'pages_plumbing_drainage.html_ventilation_1': 'VENTILATION',
  'pages_plumbing_drainage.html_localiser-le-compteur-et-la-vanne-pri': '📍 Localiser le compteur et la vanne principale',
  'pages_plumbing_drainage.html_identifier-les-colonnes-montantes': '📍 Identifier les colonnes montantes',
  'pages_plumbing_drainage.html_reperer-les-evacuations': '📍 Repérer les évacuations',
  'pages_plumbing_drainage.html_avant-deffectuer-des-travaux': '🔧 AVANT D\'EFFECTUER DES TRAVAUX',
  'pages_plumbing_drainage.html_besoin-dun-professionnel': 'BESOIN D\'UN PROFESSIONNEL ?',
  'pages_plumbing_drainage.html_autres-sections': 'AUTRES SECTIONS',
  'pages_plumbing_drainage.html_a-retenir': 'À RETENIR',
  'pages_plumbing_drainage.html_cas-particulier-double-circuit-dea': '💧 Cas particulier : double circuit d\'eau froide',
  'pages_plumbing_drainage.html_points-de-controle-essentiels': 'POINTS DE CONTRÔLE ESSENTIELS',
  'pages_plumbing_drainage.html_3-tuyaux-3-76-mm': '≤3"\n                                Tuyaux ≤ 3" (≤ 76 mm)',
  'pages_plumbing_drainage.html_4-tuyaux-4-100-mm': '≥4"\n                                Tuyaux ≥ 4" (≥ 100 mm)',
  'pages_plumbing_drainage.html_pourquoi-la-ventilation-est-elle-ind': '🌬️ Pourquoi la ventilation est-elle indispensable ?',
  'pages_plumbing_drainage.html_ventilation-primaire': 'VENTILATION PRIMAIRE',
  'pages_plumbing_drainage.html_ventilation-secondaire': 'VENTILATION SECONDAIRE',
  'pages_plumbing_drainage.html_en-maison-individuelle': '🏠 En maison individuelle',
  'pages_plumbing_drainage.html_en-appartement': '🏢 En appartement',
  'pages_plumbing_drainage.html_le-compteur': '📊 Le Compteur',
  'pages_plumbing_drainage.html_la-vanne-darret': '🔴 La Vanne d\'arrêt',
  'pages_plumbing_drainage.html_avant-de-se-lancer-dans-des-travaux-de-p': 'Avant de se lancer dans des travaux de plomberie, il est important de bien connaître son système de plomberie. Où vont ces canalisations ? Lesquelles contiennent les eaux propres et lesquelles rejettent les eaux usées ?',
  'pages_plumbing_drainage.html_cette-connaissance-devient-cruciale-en-c': 'Cette connaissance devient cruciale en cas de fuite ou d\'urgence. Dans une maison, quatre circuits permettent à l\'eau de circuler : distribution d\'eau froide et d\'eau chaude, ventilation des tuyaux et évacuation des eaux usées.',
  'pages_plumbing_drainage.html_distribution-de-leau-potable-froide-dep': 'Distribution de l\'eau potable froide depuis le réseau public vers tous les points d\'eau de la maison.',
  'pages_plumbing_drainage.html_apres-passage-par-le-chauffe-eau-leau': 'Après passage par le chauffe-eau, l\'eau chaude est distribuée aux robinets, douches et appareils.',
  'pages_plumbing_drainage.html_collecte-et-acheminement-des-eaux-usees': 'Collecte et acheminement des eaux usées vers les égouts ou la fosse septique.',
  'pages_plumbing_drainage.html_circulation-dair-dans-les-canalisations': 'Circulation d\'air dans les canalisations pour maintenir la pression et évacuer les odeurs.',
  'pages_plumbing_drainage.html_generalement-les-habitations-sont-racco': 'Généralement, les habitations sont raccordées au système d\'alimentation de la ville. L\'eau, acheminée via la canalisation de branchement, est ensuite répartie grâce aux colonnes d\'eau à tous les raccordements des différentes pièces.',
  'pages_plumbing_drainage.html_apres-raccordement-au-systeme-de-chauffe': 'Après raccordement au système de chauffe-eau, les tuyaux se scindent en système d\'eau chaude et en système d\'eau froide.',
  'pages_plumbing_drainage.html_il-existe-parfois-deux-circuits-deau-fr': 'Il existe parfois deux circuits d\'eau froide, qui permettent de séparer l\'eau potable de l\'eau courante (pour l\'arrosage ou les toilettes par exemple), mais ce cas de figure reste rare dans les habitations résidentielles.',
  'pages_plumbing_drainage.html_cest-au-niveau-du-raccordement-entre-le': 'C\'est au niveau du raccordement entre le système général et celui du bâtiment que se trouvent deux éléments essentiels :',
  'pages_plumbing_drainage.html_mesure-votre-consommation-deau-il-appa': 'Mesure votre consommation d\'eau. Il appartient à votre compagnie des eaux et permet de calculer votre facture.',
  'pages_plumbing_drainage.html_generalement-situee-juste-apres-le-compt': 'Généralement située juste après le compteur, se présente sous la forme d\'un robinet ou d\'une manette à tourner d\'un quart de tour.',
  'pages_plumbing_drainage.html_en-cas-de-fuite-importante-savoir-lo': '⚠️ En cas de fuite importante, savoir localiser cette vanne peut vous éviter une inondation. Chaque seconde compte !',
  'pages_plumbing_drainage.html_a-la-sortie-des-appareils-machines-a-la': 'À la sortie des appareils (machines à laver, éviers, toilettes, etc.) les canalisations collectent les eaux usées. Toutes les canalisations d\'eaux usées débouchent dans une même colonne du système de plomberie afin d\'être acheminées vers le collecteur principal d\'évacuation, et enfin rejetées dans le système d\'égout de la ville.',
  'pages_plumbing_drainage.html_chaque-appareil-sanitaire-est-equipe-du': 'Chaque appareil sanitaire est équipé d\'un siphon, en forme de « U ». Il retient une certaine quantité d\'eau pour empêcher la remontée de l\'air vicié.',
  'pages_plumbing_drainage.html_cette-garde-deau-forme-une-barriere-con': 'Cette garde d\'eau forme une barrière contre les odeurs d\'égout.',
  'pages_plumbing_drainage.html_21-mmm': '(21 mm/m)',
  'pages_plumbing_drainage.html_10-mmm': '(10 mm/m)',
  'pages_plumbing_drainage.html_less-10-mmm': '(< 10 mm/m)',
  'pages_plumbing_drainage.html_10-mmm_1': '(10 mm/m)',
  'pages_plumbing_drainage.html_5-mmm': '(5 mm/m)',
  'pages_plumbing_drainage.html_less-5-mmm': '(< 5 mm/m)',
  'pages_plumbing_drainage.html_une-colonne-de-ventilation-permet-la-cir': 'Une colonne de ventilation permet la circulation de l\'air et le maintien d\'une pression constante dans tout le circuit d\'évacuation. Ce tuyau vertical débouche sur le toit et permet de créer une circulation d\'air dans le circuit et d\'expulser l\'air vicié.',
  'pages_plumbing_drainage.html_il-ny-a-pas-de-bonne-evacuation-des-eau': 'Il n\'y a pas de bonne évacuation des eaux usées sans une ventilation primaire efficace. Son objectif est de prévenir les variations de pression dans les colonnes de chute des eaux usées.',
  'pages_plumbing_drainage.html_sans-ventilation-adequate-le-passage-d': 'Sans ventilation adéquate : le passage d\'une grosse masse d\'eau crée une forte dépression qui aspire la garde d\'eau du siphon, ce qui remonte et répand des mauvaises odeurs dans la pièce.',
  'pages_plumbing_drainage.html_les-colonnes-de-chute-doivent-etre-prolo': 'Les colonnes de chute doivent être prolongées en toiture jusqu\'à l\'air libre. Elle favorise le bon écoulement et évite l\'effet de siphonnement.',
  'pages_plumbing_drainage.html_dans-certaines-configurations-complexes': 'Dans certaines configurations complexes, une ventilation secondaire peut être ajoutée pour desservir des appareils éloignés de la colonne principale.',
  'pages_plumbing_drainage.html_identifiez-la-vanne-darret-des-maint': '⚠️ Identifiez la vanne d\'arrêt dès maintenant et vérifiez qu\'elle fonctionne !',
  'pages_plumbing_drainage.html_dans-les-habitations-a-etages-les-colon': 'Dans les habitations à étages, les colonnes montantes sont des tuyaux verticaux qui distribuent l\'eau ou collectent les eaux usées. Elles sont souvent dissimulées dans les cloisons, mais vous pouvez les repérer :',
  'pages_plumbing_drainage.html_les-evacuations-partent-horizontalement': 'Les évacuations partent horizontalement de chaque appareil et rejoignent une colonne verticale. Les tuyaux d\'évacuation sont généralement en PVC gris ou blanc, plus larges que les tuyaux d\'alimentation (diamètres de 1-1/4" à 4" (32 à 100 mm)).',
  'pages_plumbing_drainage.html_de-nos-jours-les-canalisations-devacua': 'De nos jours, les canalisations d\'évacuation sont constituées de matériaux plastiques, la plupart du temps en PVC ou en ABS dans le résidentiel léger, et non plus en plomb.',
  'pages_plumbing_drainage.html_les-arrivees-deau-peuvent-etre-faites-d': 'Les arrivées d\'eau peuvent être faites de polyéthylène ou de polypropylène, légers et peu onéreux. Les tuyaux de cuivre, très résistants et moins bruyants, sont plus lourds et difficiles à manier.',
  'pages_plumbing_drainage.html_noubliez-pas-de-couper-larrivee-gen': '⚠️ N\'oubliez pas de couper l\'arrivée générale d\'eau avant tout travail, au niveau de votre cave ou de l\'entrée de votre appartement.',
  'pages_plumbing_drainage.html_pour-plus-de-serenite-lors-de-vos-travau': 'Pour plus de sérénité lors de vos travaux, contactez un artisan plombier qualifié.',
  'pages_plumbing_drainage.html_votre-plomberie-comprend-4-circuits-dist': 'Votre plomberie comprend 4 circuits distincts : eau froide, eau chaude, évacuation et ventilation.',
  'pages_plumbing_drainage.html_la-vanne-darret-generale-coupe-toute-l': 'La vanne d\'arrêt générale coupe toute l\'eau de la maison en cas d\'urgence.',
  'pages_plumbing_drainage.html_la-ventilation-primaire-debouchant-sur-l': 'La ventilation primaire débouchant sur le toit évite les remontées d\'odeurs.',
  'pages_plumbing_drainage.html_savoir-localiser-vos-circuits-facilite-l': 'Savoir localiser vos circuits facilite les interventions.',
  'pages_plumbing_drainage.html_3': '≤3"',
  'pages_plumbing_drainage.html_76-mm': '(≤ 76 mm)',
  'pages_plumbing_drainage.html_4': '≥4"',
  'pages_plumbing_drainage.html_100-mm': '(≥ 100 mm)',
  'pages_plumbing_drainage.html_32-a-100-mm': '(32 à 100 mm)',
  'pages_plumbing_drainage.html_au-sous-sol': '• Au sous-sol',
  'pages_plumbing_drainage.html_dans-le-garage': '• Dans le garage',
  'pages_plumbing_drainage.html_dans-un-regard-exterieur-pres-de-la-ru': '• Dans un regard extérieur près de la rue',
  'pages_plumbing_drainage.html_dans-les-parties-communes-cave-local': '• Dans les parties communes (cave, local technique)',
  'pages_plumbing_drainage.html_parfois-dans-lappartement-pres-de-le': '• Parfois dans l\'appartement près de l\'entrée',
  'pages_plumbing_drainage.html_dans-les-gaines-techniques-souvent-da': '→\n                                    Dans les gaines techniques (souvent dans la salle de bain ou la cuisine)',
  'pages_plumbing_drainage.html_le-long-des-murs-dans-les-caves-ou-sou': '→\n                                    Le long des murs dans les caves ou sous-sols',
  'pages_plumbing_drainage.html_par-le-bruit-de-leau-qui-circule-quan': '→\n                                    Par le bruit de l\'eau qui circule quand vous ouvrez un robinet à l\'étage',
  'pages_plumbing_drainage.html_4-circuits-distincts': '4 circuits distincts',
  'pages_plumbing_drainage.html_vanne-darret-generale': 'vanne d\'arrêt générale',
  'pages_plumbing_drainage.html_ventilation-primaire_1': 'ventilation primaire',
  'pages_plumbing_drainage.html_localiser-vos-circuits': 'localiser vos circuits',
  'pages_plumbing_drainage.html_quatre-circuits': 'quatre circuits',
  'pages_plumbing_drainage.html_canalisation-de-branchement': 'canalisation de branchement',
  'pages_plumbing_drainage.html_colonnes-deau': 'colonnes d\'eau',
  'pages_plumbing_drainage.html_colonne-du-systeme-de-plomberie': 'colonne du système de plomberie',
  'pages_plumbing_drainage.html_siphon': 'siphon',
  'pages_plumbing_drainage.html_garde-deau': 'garde d\'eau',
  'pages_plumbing_drainage.html_important': '⚠️ Important :',
  'pages_plumbing_drainage.html_pente-minimale': 'pente minimale',
  'pages_plumbing_drainage.html_attention': '⚠️ Attention :',
  'pages_plumbing_drainage.html_colonne-de-ventilation': 'colonne de ventilation',
  'pages_plumbing_drainage.html_sans-ventilation-adequate': 'Sans ventilation adéquate :',
  'pages_plumbing_drainage.html_pvc-gris-ou-blanc': 'PVC gris ou blanc',
  'pages_plumbing_drainage.html_pvc-ou-en-abs': 'PVC ou en ABS',
  'pages_plumbing_drainage.html_polyethylene-ou-de-polypropylene': 'polyéthylène ou de polypropylène',
  'pages_plumbing_drainage.html_systeme-de-drainage-or-guide-pratique-de': 'Système de Drainage | Guide Pratique de Plomberie | Déboucheur Expert',
  'pages_plumbing_drainage.html_drainage-system-or-practical-plumbing-gui': 'Drainage System | Practical Plumbing Guide | Uncloged Me',
  'pages_plumbing_drainage.html_sans-siphon-fonctionnel-votre-salle-de': 'Sans siphon fonctionnel, votre salle de bain empesterait rapidement !',
  'pages_plumbing_drainage.html_14ft': '1/4"/ft',
  'pages_plumbing_drainage.html_18ft': '1/8"/ft',
  'pages_plumbing_drainage.html_less-18ft': '< 1/8"/ft',
  'pages_plumbing_drainage.html_18ft_1': '1/8"/ft',
  'pages_plumbing_drainage.html_116ft': '1/16"/ft',
  'pages_plumbing_drainage.html_less-116ft': '< 1/16"/ft',
  'pages_plumbing_components_navbar.html_accueil': 'ACCUEIL',
  'pages_plumbing_components_navbar.html_tarification': 'TARIFICATION',
  'pages_plumbing_components_navbar.html_guide': 'GUIDE',
  'pages_plumbing_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_plumbing_components_navbar.html_outils': 'OUTILS',
  'pages_plumbing_components_navbar.html_en': 'EN',
  'pages_plumbing_components_navbar.html_en_1': 'EN',
  'pages_plumbing_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_plumbing_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_plumbing_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_plumbing_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_plumbing_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_plumbing_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_plumbing_components_footer.html_equipe': 'Équipe',
  'pages_plumbing_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_plumbing_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_index_components_navbar.html_en': 'EN',
  'pages_index_components_navbar.html_en_1': 'EN',
  'pages_index_components_hero.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
  'pages_index_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_index_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_index_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_index_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_index_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_index_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_index_components_footer.html_equipe': 'Équipe',
  'pages_index_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_index_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_errors_offline.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_offline.html_offline': 'OFFLINE',
  'pages_errors_offline.html_hors-ligne-or-deboucheur-expert': 'HORS LIGNE | Déboucheur Expert',
  'pages_errors_components_navbar.html_accueil': 'ACCUEIL',
  'pages_errors_components_navbar.html_tarification': 'TARIFICATION',
  'pages_errors_components_navbar.html_guide': 'GUIDE',
  'pages_errors_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_errors_components_navbar.html_outils': 'OUTILS',
  'pages_errors_components_navbar.html_en': 'EN',
  'pages_errors_components_navbar.html_en_1': 'EN',
  'pages_errors_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_errors_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_errors_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_errors_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_errors_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_errors_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_errors_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_errors_components_footer.html_equipe': 'Équipe',
  'pages_errors_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_errors_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_errors_codes_504.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_504.html_504-delai-passerelle-or-deboucheur-expe': '504 - DÉLAI PASSERELLE | Déboucheur Expert',
  'pages_errors_codes_503.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_503.html_503-service-indisponible-or-deboucheur': '503 - SERVICE INDISPONIBLE | Déboucheur Expert',
  'pages_errors_codes_502.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_502.html_502-mauvaise-passerelle-or-deboucheur-e': '502 - MAUVAISE PASSERELLE | Déboucheur Expert',
  'pages_errors_codes_500.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_500.html_500-erreur-serveur-or-deboucheur-expert': '500 - ERREUR SERVEUR | Déboucheur Expert',
  'pages_errors_codes_429.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_429.html_429-trop-de-requetes-or-deboucheur-expe': '429 - TROP DE REQUÊTES | Déboucheur Expert',
  'pages_errors_codes_410.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_410.html_410-ressource-supprimee-or-deboucheur-e': '410 - RESSOURCE SUPPRIMÉE | Déboucheur Expert',
  'pages_errors_codes_408.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_408.html_408-delai-depasse-or-deboucheur-expert': '408 - DÉLAI DÉPASSÉ | Déboucheur Expert',
  'pages_errors_codes_404.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_404.html_404-page-introuvable-or-deboucheur-expe': '404 - PAGE INTROUVABLE | Déboucheur Expert',
  'pages_errors_codes_403.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_403.html_403-acces-interdit-or-deboucheur-expert': '403 - ACCÈS INTERDIT | Déboucheur Expert',
  'pages_errors_codes_401.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_401.html_401-non-autorise-or-deboucheur-expert': '401 - NON AUTORISÉ | Déboucheur Expert',
  'pages_errors_codes_400.html_438-530-2343': '📞 (438) 530-2343',
  'pages_errors_codes_400.html_400-requete-invalide-or-deboucheur-expe': '400 - REQUÊTE INVALIDE | Déboucheur Expert',
  'pages_errors_codes_components_navbar.html_accueil': 'ACCUEIL',
  'pages_errors_codes_components_navbar.html_tarification': 'TARIFICATION',
  'pages_errors_codes_components_navbar.html_guide': 'GUIDE',
  'pages_errors_codes_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_errors_codes_components_navbar.html_outils': 'OUTILS',
  'pages_errors_codes_components_navbar.html_en': 'EN',
  'pages_errors_codes_components_navbar.html_en_1': 'EN',
  'pages_errors_codes_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_errors_codes_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_errors_codes_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_errors_codes_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_errors_codes_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_errors_codes_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_errors_codes_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_errors_codes_components_footer.html_equipe': 'Équipe',
  'pages_errors_codes_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_errors_codes_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert',
  'pages_components_template.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_components_navbar.html_accueil': 'ACCUEIL',
  'pages_components_navbar.html_tarification': 'TARIFICATION',
  'pages_components_navbar.html_guide': 'GUIDE',
  'pages_components_navbar.html_evenements': 'EVENEMENTS',
  'pages_components_navbar.html_outils': 'OUTILS',
  'pages_components_navbar.html_en': 'EN',
  'pages_components_navbar.html_en_1': 'EN',
  'pages_components_hero.html_deboucheur-expert': 'DÉBOUCHEUR EXPERT',
  'pages_components_helper.html_phposez-une-question': 'Posez une question...',
  'pages_components_helper.html_apprenti-deboucheur': 'Apprenti Déboucheur',
  'pages_components_helper.html_assistant-ia-and-diagnostic': 'Assistant IA & Diagnostic',
  'pages_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Bonjour! Je suis l\'assistant virtuel de Billy. Je peux répondre à vos questions ou analyser une photo de votre problème de plomberie! 🛠️📸',
  'pages_components_footer.html_politique-de-confidentialite': 'Politique de confidentialité',
  'pages_components_footer.html_conditions-dutilisation': 'Conditions d\'utilisation',
  'pages_components_footer.html_equipe': 'Équipe',
  'pages_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
  'pages_components_footer.html_c-2025-deboucheur-expert': '© 2025 deboucheur expert'
    });
    if (Language.apply) setTimeout(()=>{ try{ Language.apply(); }catch(e){console.error('apply error',e);} }, 200);
  } catch(e) { console.error('merge failed', e); }
}

// ============================================================================
// COMPLETE FR→EN TRANSLATIONS - Auto-generated by full-patch.sh
// ============================================================================
if (typeof Language !== 'undefined' && Language.translations) {
  try {
    // Complete English translations for all dynamic content
    Object.assign(Language.translations.en, {
      // Index Section 00 - Hero
      'pages_index_section_00.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
      
      // Index Section 01 - Services
      'pages_index_section_01.html_nos-services-de-plomberie': 'OUR PLUMBING SERVICES',
      
      // Index Section 04 - Contact
      'pages_index_section_04.html_phprenom': 'First Name',
      'pages_index_section_04.html_phnom': 'Last Name',
      'pages_index_section_04.html_phemail': 'Email',
      'pages_index_section_04.html_ph': '(###)###-####',
      'pages_index_section_04.html_phmessage': 'Message',
      'pages_index_section_04.html_billy-st-hilaire-35-ans': 'Billy St-Hilaire, 35 years old,',
      'pages_index_section_04.html_diplome-de-lecole-des-metiers': 'Graduate of École des Métiers,',
      'pages_index_section_04.html_de-la-construction-de-montreal': 'de la Construction de Montréal,',
      'pages_index_section_04.html_10-ans-pour-le-groupe-centco-inc': '10 years with Centco inc.,',
      'pages_index_section_04.html_contrats-multiples-avec-le-local-144': 'Multiple contracts with local 144,',
      'pages_index_section_04.html_fier-supporteur-et-employe-de': 'Proud supporter and employee of',
      'pages_index_section_04.html_plomberie-martin-boisvert-enr': 'Plomberie Martin Boisvert inc.',
      'pages_index_section_04.html_toujours-actif-pour-repondre-aux': 'Always ready to respond to',
      'pages_index_section_04.html_diverses-appels-de-services': 'various service calls.',
      'pages_index_section_04.html_que-ce-soit-pour-changer-une-valve': 'Whether changing a valve',
      'pages_index_section_04.html_ou-reparer-un-tuyau-qui-coule': 'or fixing a leaking pipe.',
      'pages_index_section_04.html_le-deboucheur-sait-sy-prendre': 'The unclogger knows how to do it.',
      'pages_index_section_04.html_aucune-construction-neuve': '*No new construction',
      
      // Index Section 07 - Map
      'pages_index_section_07.html_uncloggedme': 'unclogged.me',
      'pages_index_section_07.html_1-438-5302343': '+1 (438) 530-2343',
      'pages_index_section_07.html_1-438-7657040': '+1 (438) 765-7040',
      'pages_index_section_07.html_infodeboucheurexpert': 'info@deboucheur.expert',
      'pages_index_section_07.html_infouncloggedme': 'info@unclogged.me',
      'pages_index_section_07.html_deboucheur-expert': 'Unclogger Expert',
      'pages_index_section_07.html_satellite': 'Satellite',
      'pages_index_section_07.html_itineraire': 'Directions',
      'pages_index_section_07.html_sauver': 'Save',
      'pages_index_section_07.html_appeler': 'Call',
      'pages_index_section_07.html_partager': 'Share',
      'pages_index_section_07.html_290-rue-lord-01-napierville-qc-j0j-1l': '290 Rue Lord #01, Napierville, QC J0J 1L0',
      'pages_index_section_07.html_plombier-montreal-and-monteregie': 'Plumber · Montreal & Montérégie',
      
      // Index Section 08 - Footer
      'pages_index_section_08.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_index_section_08.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      
      // Tools Page
      'pages_tools.html_phrechercher-un-outil': 'Search for a tool...',
      'pages_tools.html_outils-de-plomberie-or-deboucheur-expert': 'Plumbing Tools | Unclogger Expert',
      
      // Team Page
      'pages_team.html_billy-sthilaire': 'Billy St-Hilaire',
      'pages_team.html_nancy-boulianne': 'Nancy Boulianne',
      'pages_team.html_notre-equipe-or-deboucheur-expert': 'Our Team | Unclogger Expert',
      
      // Prices Page
      'pages_prices.html_14-a-38': '1/4" to 3/8"',
      'pages_prices.html_12': '1/2"',
      'pages_prices.html_58-a-34': '5/8" to 3/4"',
      'pages_prices.html_320dollar': '$320',
      'pages_prices.html_480dollar': '$480',
      'pages_prices.html_560dollar': '$560',
      'pages_prices.html_8h-18h': '8am-6pm',
      'pages_prices.html_18h-8h': '6pm-8am',
      'pages_prices.html_24h': '24h',
      'pages_prices.html_15': '×1.5',
      'pages_prices.html_175': '×1.75',
      'pages_prices.html_tarification-or-deboucheur-expert': 'Pricing | Unclogger Expert',
      'pages_prices.html_cable-14-a-38': 'Cable 1/4" to 3/8"',
      'pages_prices.html_1ere-heure': '1st hour',
      'pages_prices.html_1ere-heure_1': '1st hour',
      'pages_prices.html_1ere-heure_2': '1st hour',
      'pages_prices.html_cable-12': 'Cable 1/2"',
      'pages_prices.html_1ere-heure_3': '1st hour',
      'pages_prices.html_1ere-heure_4': '1st hour',
      'pages_prices.html_1ere-heure_5': '1st hour',
      'pages_prices.html_cable-58-and-34': 'Cable 5/8" & 3/4"',
      'pages_prices.html_1ere-heure_6': '1st hour',
      'pages_prices.html_1ere-heure_7': '1st hour',
      'pages_prices.html_1ere-heure_8': '1st hour',
      
      // Politics Page
      'pages_politics.html_1-introduction': '1 Introduction',
      'pages_politics.html_2-renseignements': '2 Information',
      'pages_politics.html_3-finalites': '3 Purposes',
      'pages_politics.html_4-communication': '4 Sharing',
      'pages_politics.html_5-securite': '5 Security',
      'pages_politics.html_6-vos-droits': '6 Your Rights',
      'pages_politics.html_7-cookies': '7 Cookies',
      'pages_politics.html_8-modifications': '8 Modifications',
      'pages_politics.html_9-contact': '9 Contact',
      'pages_politics.html_the-collection-aggregation-and-analysi': 'The collection, aggregation, and analysis of any and all user-provided information are stored securely to serve the exclusive operational objective of enabling the Company, in its sole and absolute discretion, to precisely align, tailor, and optimize its product offerings for the most suitable clientele demographics.',
      'pages_politics.html_politique-de-confidentialite-or-deboucheu': 'Privacy Policy | Unclogger Expert',
      
      // Plumbing Guide
      'pages_plumbing.html_astuce': 'Tip:',
      'pages_plumbing.html_recommandation': 'Recommendation:',
      'pages_plumbing.html_guide-pratique-de-plomberie-residentiell': 'Practical Residential Plumbing Guide | Unclogger Expert',
      
      // Events Page
      'pages_events.html_calendrier-and-disponibilites-or-deboucheur': 'Calendar & Availability | Unclogger Expert',
      'pages_events.html_x1': 'X1',
      'pages_events.html_x15': 'X1.5',
      'pages_events.html_x2': 'X2',
      'pages_events.html_x3': 'X3',
      
      // Conditions Page
      'pages_conditions.html_while-the-company-employs-commercially-r': 'While the Company employs commercially reasonable standards for data retention, all collected user information is utilized to facilitate and drive proprietary, targeted advertising initiatives and predictive modeling aimed at anticipating prospective consumer acquisitions; continued use of the service constitutes express consent to such utilization.',
      'pages_conditions.html_conditions-dutilisation-or-deboucheur-ex': 'Terms of Use | Unclogger Expert',
      
      // Plumbing Unclog Section
      'pages_plumbing_unclog.html_causes-dengorgement': 'Causes of Clogging',
      'pages_plumbing_unclog.html_methodes-naturelles': 'Natural Methods',
      'pages_plumbing_unclog.html_outils-a-portee-de-main': 'Handy Tools',
      'pages_plumbing_unclog.html_calcaire': 'Limescale',
      'pages_plumbing_unclog.html_types-de-curage': 'Types of Cleaning',
      'pages_plumbing_unclog.html_bouchons-par-racines': 'Root Blockages',
      'pages_plumbing_unclog.html_camion-hydrocureur': 'Hydro-jetting Truck',
      'pages_plumbing_unclog.html_debouchage-par-acide': 'Acid Unclogging',
      'pages_plumbing_unclog.html_probleme-de-pente': 'Slope Problem',
      'pages_plumbing_unclog.html_diametres-a-respecter': 'Required Diameters',
      'pages_plumbing_unclog.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_unclog.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_unclog.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_unclog.html_urgence-247': '📞 24/7 EMERGENCY',
      'pages_plumbing_unclog.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_unclog.html_causes-dengorgement_1': '?\n                        CAUSES OF CLOGGING',
      'pages_plumbing_unclog.html_methodes-naturelles_1': '🌿\n                        NATURAL METHODS',
      'pages_plumbing_unclog.html_outils-a-portee-de-main_1': '🔧\n                        HANDY TOOLS',
      'pages_plumbing_unclog.html_le-calcaire-et-la-canalisation': 'LIMESCALE AND PIPES',
      'pages_plumbing_unclog.html_2-types-de-curage': '2\n                        TYPES OF CLEANING',
      'pages_plumbing_unclog.html_engorgement-par-racines': '🌳\n                        ROOT BLOCKAGE',
      'pages_plumbing_unclog.html_camion-hydrocureur_1': '🚛\n                        HYDRO-JETTING TRUCK',
      'pages_plumbing_unclog.html_debouchage-par-acide_1': '⚗️\n                        ACID UNCLOGGING',
      'pages_plumbing_unclog.html_probleme-de-pente_1': '📐\n                        SLOPE PROBLEM',
      'pages_plumbing_unclog.html_diametres-a-respecter_1': '📏\n                        REQUIRED DIAMETERS',
      'pages_plumbing_unclog.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_unclog.html_eau-bouillante': 'BOILING WATER',
      'pages_plumbing_unclog.html_bicarbonate-sel': 'BAKING SODA + SALT',
      'pages_plumbing_unclog.html_vinaigre-blanc': 'WHITE VINEGAR',
      'pages_plumbing_unclog.html_ventouse': '🪠 PLUNGER',
      'pages_plumbing_unclog.html_furet': '🐍 DRAIN SNAKE',
      'pages_plumbing_unclog.html_curage-technique': 'TECHNICAL CLEANING',
      'pages_plumbing_unclog.html_curage-biologique': 'BIOLOGICAL CLEANING',
      'pages_plumbing_unclog.html_canalisation-bouchee': 'CLOGGED PIPE?',
      'pages_plumbing_unclog.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_unclog.html_quand-agir': 'WHEN TO ACT?',
      'pages_plumbing_unclog.html_intervention-professionnelle-requise': 'PROFESSIONAL INTERVENTION REQUIRED',
      'pages_plumbing_unclog.html_capacites': '✓ Capabilities:',
      'pages_plumbing_unclog.html_manipulation-professionnelle-uniqueme': '⚠️ PROFESSIONAL HANDLING ONLY',
      'pages_plumbing_unclog.html_regle-fondamentale': 'Fundamental Rule:',
      'pages_plumbing_unclog.html_maison-de-plain-pied': '🏠 SINGLE-STORY HOUSE',
      'pages_plumbing_unclog.html_maison-a-etages': '🏢 MULTI-STORY HOUSE',
      'pages_plumbing_unclog.html_acide-sulfurique': 'Sulfuric Acid',
      'pages_plumbing_unclog.html_acide-chlorhydrique': 'Hydrochloric Acid',
      'pages_plumbing_unclog.html_un-desengorgement-est-necessaire-quand-d': 'Unclogging is necessary when bad odors or backup are observed in the pipes. You can also call for this type of service when water drainage slows down in the plumbing system.',
      'pages_plumbing_unclog.html_dans-la-plupart-des-cas-lengorgement-p': 'In most cases, the blockage comes from an obstruction caused by debris or foreign objects:',
      'pages_plumbing_unclog.html_autres-causes-le-bouchon-peut-aussi-pr': 'Other causes: The blockage can also come from a root blocking water flow, or from poorly done plumbing (insufficient slope, misplaced elbows).',
      'pages_plumbing_unclog.html_dissout-la-graisse-le-savon-etc-verse': 'Dissolves grease, soap, etc. Pour directly into the sink, basin or shower.',
      'pages_plumbing_unclog.html_melanger-bicarbonate-de-soude-avec-du-se': 'Mix baking soda with salt, pour and rinse with hot water.',
      'pages_plumbing_unclog.html_eau-chaude-vinaigre-blanc-reaction-e': 'Hot water + white vinegar: effervescent reaction that helps dissolve deposits.',
      'pages_plumbing_unclog.html_la-methode-classique-et-efficace-pour-le': 'The classic and effective method for small clogs. Create pressure/suction to dislodge the obstruction.',
      'pages_plumbing_unclog.html_outil-flexible-a-manivelle-pour-atteindr': 'Flexible crank tool to reach deep clogs:',
      'pages_plumbing_unclog.html_le-calcaire-est-egalement-un-element-qui': 'Limescale is also a factor that causes pipe blockage. It comes from the water circulating in the system. When water is rich in limescale, it causes pipe scaling.',
      'pages_plumbing_unclog.html_double-probleme-en-plus-de-bloquer-la': 'Double problem: In addition to blocking the pipe, limescale also retains debris and waste that slip into the pipes.',
      'pages_plumbing_unclog.html_pour-un-debouchage-en-profondeur-le-mie': 'For deep unclogging, it is best to clean the pipe with the help of a professional.',
      'pages_plumbing_unclog.html_concernant-les-bouchons-causes-par-une-r': 'Regarding blockages caused by roots, the solution must be technical and not manual. You cannot solve the blockage yourself.',
      'pages_plumbing_unclog.html_methode-inspection-par-camera-camion': 'Method: Camera inspection → Hydro-jetting truck with nozzle → Root removal if necessary → Repairs',
      'pages_plumbing_unclog.html_le-camion-hydrocureur-ou-camion-a-pompe': 'The hydro-jetting truck (or pump/high-pressure truck) is equipment used when a blockage persists in the wastewater system.',
      'pages_plumbing_unclog.html_psi-de-pression': 'PSI of pressure',
      'pages_plumbing_unclog.html_camera-dinspection-integree': 'Integrated inspection camera',
      'pages_plumbing_unclog.html_aspiration-nettoyage': 'Suction + Cleaning',
      'pages_plumbing_unclog.html_le-debouchage-par-acide-est-efficace-mai': 'Acid unclogging is effective but dangerous for health and skin. Only professionals can handle these products.',
      'pages_plumbing_unclog.html_utilise-pour-les-toilettes-bouchees-eli': 'Used for clogged toilets. Removes sanitary napkins, toilet paper, etc.',
      'pages_plumbing_unclog.html_pour-canalisations-en-beton-ou-brique-a': 'For concrete or brick pipes. Also called muriatic acid.',
      'pages_plumbing_unclog.html_ce-type-de-debouchage-est-souvent-associ': 'This type of unclogging is often combined with snake unclogging or cleaning to remove remaining debris.',
      'pages_plumbing_unclog.html_si-la-canalisation-est-engorgee-a-cause': 'If the pipe is clogged due to slope, the installation standards must be reviewed. The drainage network must follow precise rules for natural flow.',
      'pages_plumbing_unclog.html_chaque-equipement-doit-avoir-son-propre': 'Each fixture must have its own drain pipe. The sink should not have the same pipe as the basin. The shower should not use the same pipe as the toilet, etc.',
      'pages_plumbing_unclog.html_dans-la-plupart-des-cas-les-engorgement': 'In most cases, blockages come from non-compliance with piping standards. Here are the recommended diameters:',
      'pages_plumbing_unclog.html_ces-regles-sont-inscrites-dans-les-norme': 'These rules are written in plumbing codes and are sometimes difficult for individuals to follow. It is best to call a professional.',
      'pages_plumbing_unclog.html_ne-laissez-pas-un-bouchon-devenir-un-pro': 'Don\'t let a clog become a major problem. Contact our experts for quick and effective service.',
      'pages_plumbing_unclog.html_cheveux': 'Hair',
      'pages_plumbing_unclog.html_savon': 'Soap',
      'pages_plumbing_unclog.html_graisse': 'Grease',
      'pages_plumbing_unclog.html_calcaire_1': 'Limescale',
      'pages_plumbing_unclog.html_inspection-de-la-canalisation-pour-local': 'Pipe inspection to locate the blockage',
      'pages_plumbing_unclog.html_nettoyage-avec-jet-deau-a-haute-pressio': 'Cleaning with high-pressure water jet',
      'pages_plumbing_unclog.html_parfois-associe-a-un-debouchage-a-buse': 'Sometimes combined with nozzle unclogging',
      'pages_plumbing_unclog.html_traitement-avec-solution-dazote-phosp': 'Treatment with nitrogen + phosphorus solution',
      'pages_plumbing_unclog.html_insertion-de-bacteries-qui-eliminent-les': 'Insertion of bacteria that eliminate deposits',
      'pages_plumbing_unclog.html_ideal-pour-canalisations-fragiles': 'Ideal for fragile pipes',
      'pages_plumbing_unclog.html_peut-bloquer-completement-levacuation-d': 'Can completely block wastewater drainage',
      'pages_plumbing_unclog.html_peut-endommager-la-structure-de-la-canal': 'Can damage pipe structure',
      'pages_plumbing_unclog.html_necessite-souvent-des-travaux-de-reparat': 'Often requires repair work after intervention',
      'pages_plumbing_unclog.html_introduire-le-furet-petit-a-petit': 'Insert the snake little by little',
      'pages_plumbing_unclog.html_sentir-le-bouchon-a-linterieur-du-tuyau': 'Feel the clog inside the pipe',
      'pages_plumbing_unclog.html_activer-la-manivelle-et-tourner': 'Activate the crank and turn',
      'pages_plumbing_unclog.html_retirer-et-rincer-a-leau': 'Remove and rinse with water',
      'pages_plumbing_unclog.html_1-inspection-de-la-canalisation-pour-loc': '1\n                                    Pipe inspection to locate the blockage',
      'pages_plumbing_unclog.html_2-nettoyage-avec-jet-deau-a-haute-press': '2\n                                    Cleaning with high-pressure water jet',
      'pages_plumbing_unclog.html_3-parfois-associe-a-un-debouchage-a-buse': '3\n                                    Sometimes combined with nozzle unclogging',
      'pages_plumbing_unclog.html_1-traitement-avec-solution-dazote-pho': '1\n                                    Treatment with nitrogen + phosphorus solution',
      'pages_plumbing_unclog.html_2-insertion-de-bacteries-qui-eliminent-l': '2\n                                    Insertion of bacteria that eliminate deposits',
      'pages_plumbing_unclog.html_3-ideal-pour-canalisations-fragiles': '3\n                                    Ideal for fragile pipes',
      'pages_plumbing_unclog.html_aspirer-la-boue-et-les-dechets': '• Suction of mud and waste',
      'pages_plumbing_unclog.html_deboucher-les-canalisations-tenaces': '• Unclog stubborn pipes',
      'pages_plumbing_unclog.html_curage-a-haute-pression': '• High-pressure cleaning',
      'pages_plumbing_unclog.html_nettoyage-complet-du-drain': '• Complete drain cleaning',
      'pages_plumbing_unclog.html_canalisation-a-lhorizontale': '• Horizontal piping',
      'pages_plumbing_unclog.html_collecteur-regroupant-tous-les-conduit': '• Collector grouping all conduits',
      'pages_plumbing_unclog.html_collecteur-enfoui-ou-dans-la-dalle': '• Buried collector or in slab',
      'pages_plumbing_unclog.html_pente-18-14ft-1-2percent-jusqua-65': '• Slope: 1/8-1/4"/ft (1-2%) (up to 6.5 ft (2 m))',
      'pages_plumbing_unclog.html_pente-14-38ft-2-3percent-au-dela-de': '• Slope: 1/4-3/8"/ft (2-3%) (beyond 6.5 ft (2 m))',
      'pages_plumbing_unclog.html_collecteur-dispose-verticalement': '• Vertically arranged collector',
      'pages_plumbing_unclog.html_conduits-avec-clapet-aerateur': '• Conduits with air valve',
      'pages_plumbing_unclog.html_reduit-les-odeurs': '• Reduces odors',
      'pages_plumbing_unclog.html_diminue-le-bruit-devacuation': '• Reduces drainage noise',
      'pages_plumbing_unclog.html_evite-laspiration-deau-entre-conduit': '• Prevents water suction between conduits',
      'pages_plumbing_unclog.html_mauvaises-odeurs': 'bad odors',
      'pages_plumbing_unclog.html_refoulement': 'backup',
      'pages_plumbing_unclog.html_ralentit': 'slows down',
      'pages_plumbing_unclog.html_autres-causes': 'Other causes:',
      'pages_plumbing_unclog.html_racine': 'root',
      'pages_plumbing_unclog.html_entartrage-des-tuyaux': 'pipe scaling',
      'pages_plumbing_unclog.html_double-probleme': 'Double problem:',
      'pages_plumbing_unclog.html_curer-la-canalisation': 'clean the pipe',
      'pages_plumbing_unclog.html_technique-et-non-manuelle': 'technical and not manual',
      'pages_plumbing_unclog.html_methode': 'Method:',
      'pages_plumbing_unclog.html_dangereux-pour-la-sante-et-la-peau': 'dangerous for health and skin',
      'pages_plumbing_unclog.html_normes-de-plomberie': 'plumbing codes',
      'pages_plumbing_unclog.html_debouchage-de-canalisations-or-guide-prat': 'Pipe Unclogging | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_unclog.html_drainage-pipe-unclogging-or-practical-plu': 'Drainage Pipe Unclogging | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_unclog.html_2en1': '2in1',
      'pages_plumbing_unclog.html_equipement': 'Equipment',
      'pages_plumbing_unclog.html_diametre-ext': 'Ext. Diameter',
      'pages_plumbing_unclog.html_pente-min': 'Min. Slope',
      'pages_plumbing_unclog.html_toilettes': '🚽 Toilets',
      'pages_plumbing_unclog.html_lavabo-avec-siphon': '🚿 Sink (with trap)',
      'pages_plumbing_unclog.html_evier': '🍽️ Kitchen Sink',
      'pages_plumbing_unclog.html_baignoire-less3-pi': '🛁 Bathtub (<3 ft',
      'pages_plumbing_unclog.html_baignoire-greater3-pi': '🛁 Bathtub (>3 ft',
      
      // Plumbing Supply Section
      'pages_plumbing_supply.html_introduction': 'Introduction',
      'pages_plumbing_supply.html_le-reseau-dalimentation': 'The Supply Network',
      'pages_plumbing_supply.html_pose-du-collecteur': 'Manifold Installation',
      'pages_plumbing_supply.html_precautions-de-pose': 'Installation Precautions',
      'pages_plumbing_supply.html_choix-des-raccords': 'Fitting Selection',
      'pages_plumbing_supply.html_types-de-tuyaux': 'Pipe Types',
      'pages_plumbing_supply.html_cuivre': '→ Copper',
      'pages_plumbing_supply.html_pex': '→ PEX',
      'pages_plumbing_supply.html_multicouche': '→ Multilayer',
      'pages_plumbing_supply.html_diametres-a-respecter': 'Required Diameters',
      'pages_plumbing_supply.html_regulation-de-pression': 'Pressure Regulation',
      'pages_plumbing_supply.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_supply.html_debouchage': '→ Unclogging',
      'pages_plumbing_supply.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_supply.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_supply.html_1-le-reseau-dalimentation': '1\n                        THE SUPPLY NETWORK',
      'pages_plumbing_supply.html_2-pose-du-collecteur': '2\n                        MANIFOLD INSTALLATION',
      'pages_plumbing_supply.html_precautions-de-pose_1': '!\n                        INSTALLATION PRECAUTIONS',
      'pages_plumbing_supply.html_3-types-de-tuyaux': '3\n                        PIPE TYPES',
      'pages_plumbing_supply.html_4-diametres-a-respecter': '4\n                        REQUIRED DIAMETERS',
      'pages_plumbing_supply.html_5-regulation-de-la-pression': '5\n                        PRESSURE REGULATION',
      'pages_plumbing_supply.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_supply.html_pose-encastree': 'RECESSED INSTALLATION',
      'pages_plumbing_supply.html_pose-apparente': 'EXPOSED INSTALLATION',
      'pages_plumbing_supply.html_tuyaux-en-cuivre': '🔶 COPPER PIPES',
      'pages_plumbing_supply.html_tuyaux-en-pex': '🔵 PEX PIPES',
      'pages_plumbing_supply.html_tuyaux-multicouches': '🟢 MULTILAYER PIPES',
      'pages_plumbing_supply.html_besoin-dun-professionnel': 'NEED A PROFESSIONAL?',
      'pages_plumbing_supply.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_supply.html_a-savoir-avant-de-commencer': 'BEFORE YOU START',
      'pages_plumbing_supply.html_tuyaux': 'PIPES',
      'pages_plumbing_supply.html_raccords': 'FITTINGS',
      'pages_plumbing_supply.html_collecteurs': 'MANIFOLDS',
      'pages_plumbing_supply.html_securite-importante': 'IMPORTANT SAFETY',
      'pages_plumbing_supply.html_cuivre-recuit': 'Annealed Copper',
      'pages_plumbing_supply.html_cuivre-ecroui': 'Hard Copper',
      'pages_plumbing_supply.html_types-de-raccords-pex': 'PEX Fitting Types:',
      'pages_plumbing_supply.html_avantages': '✓ Advantages:',
      'pages_plumbing_supply.html_comment-tester-la-pression': '📏 How to test pressure?',
      'pages_plumbing_supply.html_avant-la-pose': 'Before installation:',
      'pages_plumbing_supply.html_en-cas-de-soudure': 'When soldering:',
      'pages_plumbing_supply.html_pour-alimenter-le-foyer-et-les-equipemen': 'To supply the home and equipment with running water, a water supply network must be installed. This guide walks you through understanding and installing your system.',
      'pages_plumbing_supply.html_on-utilise-leau-courante-tous-les-jours': 'We use running water every day, for hygiene and comfort. Therefore, if you are considering installing your plumbing, you must think about the building\'s water supply. Water must reach the entire plumbing network to supply the shower, bathtub, toilets, sink, water heater, etc.',
      'pages_plumbing_supply.html_le-reseau-dalimentation-deau-est-gener': 'The water supply network generally consists of pipes, fittings and manifolds. Manifolds are used so that all equipment can benefit from running water. They are therefore main elements for water distribution.',
      'pages_plumbing_supply.html_transport-de-leau': 'Water Transport',
      'pages_plumbing_supply.html_connexions': 'Connections',
      'pages_plumbing_supply.html_distribution': 'Distribution',
      'pages_plumbing_supply.html_un-collecteur-est-compose-de-plusieurs-s': 'A manifold is composed of several water outlets, depending on the number of equipment used. The number of manifolds to use depends on the number of rooms to supply and the floors of the building.',
      'pages_plumbing_supply.html_note-historique-auparavant-seuls-les': 'Historical note: Previously, only lead pipes were used. Nowadays, this material is prohibited. Copper, PEX and multilayer are now used.',
      'pages_plumbing_supply.html_le-cuivre-remplace-principalement-la-tuy': 'Copper mainly replaces traditional lead piping. It is not sensitive to corrosion, rarely expands and resists pressure.',
      'pages_plumbing_supply.html_les-plus-pratiques-car-ils-nont-pas-bes': 'The most practical because they don\'t need soldered fittings. However, they require several guides for fastening.',
      'pages_plumbing_supply.html_petits-projets-montage-par-vissage': 'Small projects, screw assembly',
      'pages_plumbing_supply.html_complexe-mais-fiable-professionnel': 'Complex but reliable, professional',
      'pages_plumbing_supply.html_installations-neuves-durable': 'New installations, durable',
      'pages_plumbing_supply.html_un-bon-compromis-entre-le-cuivre-et-le-p': 'A good compromise between copper and PEX. Composed of cross-linked polyethylene layers, they withstand heat, are quiet and require no soldering.',
      'pages_plumbing_supply.html_pour-une-distribution-correcte-de-leau': 'For proper water distribution, standards must be followed regarding pipe diameter according to desired flow.',
      'pages_plumbing_supply.html_regle-generale-un-tuyau-de-grand-diame': 'General rule: A large diameter pipe will offer high flow while a small pipe will be limited in flow.',
      'pages_plumbing_supply.html_pression-standard-du-reseau-public': 'Standard public network pressure',
      'pages_plumbing_supply.html_installer-un-suppresseur': 'Install a booster pump',
      'pages_plumbing_supply.html_installer-un-reducteur': 'Install a pressure reducer',
      'pages_plumbing_supply.html_utilisez-un-manometre-pour-mesurer-la-pr': 'Use a pressure gauge to measure pressure. The pressure reducer is installed at the meter outlet to prevent pipe deterioration.',
      'pages_plumbing_supply.html_vu-la-complexite-du-reseau-dalimentatio': 'Given the complexity of the running water supply network, it is advisable to call a professional plumber who masters this field.',
      'pages_plumbing_supply.html_necessite-deux-collecteurs-eau-froide': 'Requires two manifolds (cold water + hot water)',
      'pages_plumbing_supply.html_raccordement-au-chauffe-eau-pour-leau-c': 'Connection to water heater for hot water',
      'pages_plumbing_supply.html_tuyaux-multicouches-ou-pex-recommandes': 'Multilayer or PEX pipes recommended',
      'pages_plumbing_supply.html_pose-sous-fourreau-pour-dalle-ou-plaque': 'Installation under conduit for slab or drywall',
      'pages_plumbing_supply.html_tuyaux-en-cuivre-ou-multicouches-recomma': 'Copper or multilayer pipes recommended',
      'pages_plumbing_supply.html_solides-et-resistants-aux-uv': 'Solid and UV resistant',
      'pages_plumbing_supply.html_fixation-a-6-15-cm-du-sol': 'Fastening at ~6" (15 cm) from floor',
      'pages_plumbing_supply.html_raccordement-parfait-pour-eviter-les-fui': 'Perfect connection to avoid leaks',
      'pages_plumbing_supply.html_bleu-eau-froide': 'Blue = Cold Water',
      'pages_plumbing_supply.html_rouge-eau-chaude': 'Red = Hot Water',
      'pages_plumbing_supply.html_fermer-la-vanne-qui-ouvre-et-ferme-la': '• Close the valve that opens and closes the pipe',
      'pages_plumbing_supply.html_choisir-le-type-de-raccordement-avec': '• Choose the connection type (with or without soldering)',
      'pages_plumbing_supply.html_porter-des-gants-de-protection': '• Wear protective gloves',
      'pages_plumbing_supply.html_porter-des-lunettes-de-securite': '• Wear safety glasses',
      'pages_plumbing_supply.html_ventiler-la-zone-de-travail': '• Ventilate the work area',
      'pages_plumbing_supply.html_peu-de-raccords-necessaires': '• Few fittings needed',
      'pages_plumbing_supply.html_fixation-a-froid': '• Cold fastening',
      'pages_plumbing_supply.html_encastrable': '• Recessed',
      'pages_plumbing_supply.html_fixation-a-chaud': '• Hot fastening',
      'pages_plumbing_supply.html_non-encastrable': '• Not recessed',
      'pages_plumbing_supply.html_installation-murale': '• Wall installation',
      'pages_plumbing_supply.html_resistance-a-la-chaleur': '• Heat resistance',
      'pages_plumbing_supply.html_silencieux': '• Quiet',
      'pages_plumbing_supply.html_pas-de-soudure': '• No soldering',
      'pages_plumbing_supply.html_fixation-par-sertissage': '• Crimp fastening',
      'pages_plumbing_supply.html_tuyaux_1': 'pipes',
      'pages_plumbing_supply.html_raccords_1': 'fittings',
      'pages_plumbing_supply.html_collecteurs_1': 'manifolds',
      'pages_plumbing_supply.html_note-historique': 'Historical note:',
      'pages_plumbing_supply.html_note': '⚠️ Note:',
      'pages_plumbing_supply.html_attention': '⚠️ Warning:',
      'pages_plumbing_supply.html_a-compression': 'Compression',
      'pages_plumbing_supply.html_a-glissement': 'Push-fit',
      'pages_plumbing_supply.html_a-sertir': 'Crimp',
      'pages_plumbing_supply.html_regle-generale': 'General rule:',
      'pages_plumbing_supply.html_suppresseur': 'booster pump',
      'pages_plumbing_supply.html_reducteur': 'reducer',
      'pages_plumbing_supply.html_manometre': 'pressure gauge',
      'pages_plumbing_supply.html_alimentation-deau-or-guide-pratique-de-p': 'Water Supply | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_supply.html_water-supply-or-practical-plumbing-guide': 'Water Supply | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_supply.html_la-pose-est-dordre-professionnel-car-le': 'Installation is professional-level because connection and installation are technical.',
      'pages_plumbing_supply.html_les-tuyaux-pex-ne-supportent-pas-les-uv': 'PEX pipes do not withstand UV. They must be recessed or protected.',
      'pages_plumbing_supply.html_debit-souhaite': 'Desired Flow',
      'pages_plumbing_supply.html_diametre-recommande': 'Recommended Diameter',
      'pages_plumbing_supply.html_50-lmin': '50 L/min',
      'pages_plumbing_supply.html_160-lmin': '160 L/min',
      'pages_plumbing_supply.html_250-lmin': '250 L/min',
      'pages_plumbing_supply.html_44-psi': '44 PSI',
      'pages_plumbing_supply.html_less-44-psi': '< 44 PSI',
      'pages_plumbing_supply.html_greater-73-psi': '> 73 PSI',
      
      // Plumbing Normes Section
      'pages_plumbing_normes.html_introduction': 'Introduction',
      'pages_plumbing_normes.html_diametre-nominal-dn': 'Nominal Diameter (DN)',
      'pages_plumbing_normes.html_tableau-des-dn': 'DN Table',
      'pages_plumbing_normes.html_debits-devacuation': 'Drainage Flow Rates',
      'pages_plumbing_normes.html_pentes-recommandees': 'Recommended Slopes',
      'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux': 'Sanitary and Storm Pipes',
      'pages_plumbing_normes.html_conformite': 'Compliance',
      'pages_plumbing_normes.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_normes.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_normes.html_debouchage': '→ Unclogging',
      'pages_plumbing_normes.html_appeler-maintenant': '📞 CALL NOW',
      'pages_plumbing_normes.html_demander-une-inspection': 'REQUEST AN INSPECTION',
      'pages_plumbing_normes.html_o-diametre-nominal-nps': 'Ø\n                        NOMINAL DIAMETER (NPS)',
      'pages_plumbing_normes.html_tableau-des-nps-par-appareil': '📊\n                        NPS TABLE BY FIXTURE',
      'pages_plumbing_normes.html_debits-devacuation_1': '💧\n                        DRAINAGE FLOW RATES',
      'pages_plumbing_normes.html_pentes-recommandees_1': '📐\n                        RECOMMENDED SLOPES',
      'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux_1': '🚧\n                        SANITARY AND STORM PIPES',
      'pages_plumbing_normes.html_conformite-et-reglementation': '✓\n                        COMPLIANCE AND REGULATIONS',
      'pages_plumbing_normes.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_normes.html_3-tuyaux-3-76-mm': '≤3"\n                                PIPES ≤ 3" (≤ 76 mm)',
      'pages_plumbing_normes.html_4-tuyaux-4-100-mm': '≥4"\n                                PIPES ≥ 4" (≥ 100 mm)',
      'pages_plumbing_normes.html_limites-de-pente': 'SLOPE LIMITS',
      'pages_plumbing_normes.html_besoin-dune-verification': 'NEED A CHECK?',
      'pages_plumbing_normes.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_normes.html_pourquoi-respecter-les-normes': 'WHY FOLLOW STANDARDS?',
      'pages_plumbing_normes.html_regle-importante-pente-et-longueur': '⚠️ IMPORTANT RULE: SLOPE AND LENGTH',
      'pages_plumbing_normes.html_eaux-sanitaires': '🚽 SANITARY WATER',
      'pages_plumbing_normes.html_eaux-pluviales': '🌧️ STORMWATER',
      'pages_plumbing_normes.html_points-de-conformite-a-verifier': 'COMPLIANCE POINTS TO CHECK',
      'pages_plumbing_normes.html_travaux-necessitant-un-permis': '⚠️ WORK REQUIRING A PERMIT',
      'pages_plumbing_normes.html_le-respect-des-normes-de-plomberie-garan': 'Compliance with plumbing standards ensures proper operation of your drainage system, prevents blockages and ensures compliance with Quebec building code.',
      'pages_plumbing_normes.html_le-nps-nominal-pipe-size-est-la-mesure': 'NPS (Nominal Pipe Size) is the standard measurement used to designate drain pipe diameter in North America. It corresponds approximately to the inside diameter of the pipe in inches.',
      'pages_plumbing_normes.html_important-le-diametre-exterieur-peut-v': 'Important: The outside diameter may vary depending on material (PVC, cast iron, copper). NPS indicates flow capacity, not exact dimensions.',
      'pages_plumbing_normes.html_chaque-appareil-sanitaire-necessite-un-d': 'Each sanitary fixture requires a minimum diameter to ensure proper drainage:',
      'pages_plumbing_normes.html_le-debit-devacuation-represente-la-quan': 'Drainage flow represents the amount of water each fixture can drain per second. This value is essential for properly sizing pipes.',
      'pages_plumbing_normes.html_ue-unite-devacuation-valeur-normal': '*DFU = Drainage Fixture Unit: Standardized value used to calculate total load of a plumbing system.',
      'pages_plumbing_normes.html_la-pente-cumulee-ne-doit-jamais-depasser': 'The cumulative slope should never exceed the pipe diameter in height, unless the pipe is vented. This rule determines the maximum length of a horizontal pipe.',
      'pages_plumbing_normes.html_conseil-pour-un-tuyau-de-2-avec-une-p': 'Tip: For a 2" pipe with an ideal slope of 1/4"/ft, do not exceed 8 feet in length. With a minimum slope of 1/8"/ft, you can go up to 16 feet, but it is less recommended.',
      'pages_plumbing_normes.html_pente-maximale-globale-21-mmm': 'Maximum overall slope (21 mm/m)',
      'pages_plumbing_normes.html_au-dela-leau-secoule-trop-vite-et-lai': 'Beyond this, water flows too fast and leaves solids behind',
      'pages_plumbing_normes.html_pente-minimale-globale-5-mmm': 'Minimum overall slope (5 mm/m)',
      'pages_plumbing_normes.html_en-dessous-stagnation-des-eaux-et-depot': 'Below this, water stagnation and deposits',
      'pages_plumbing_normes.html_astuce-une-pente-trop-forte-est-aus': '💡 Tip: A slope that is too steep is as problematic as one that is too shallow. Water flows too quickly and leaves solid matter to accumulate, causing long-term blockages.',
      'pages_plumbing_normes.html_en-plomberie-residentielle-nous-travail': 'In residential plumbing, we mainly work with two types of drainage networks: sanitary water (wastewater) and stormwater (rainwater). These networks are generally separate.',
      'pages_plumbing_normes.html_proviennent-des-appareils-sanitaires-to': 'Come from sanitary fixtures (toilets, sinks, showers, basins, etc.)',
      'pages_plumbing_normes.html_proviennent-de-la-collecte-des-eaux-de-p': 'Come from rainwater collection on the roof and around the building.',
      'pages_plumbing_normes.html_note-importante-les-eaux-pluviales': '💧 Important note: Stormwater must be drained separately from sanitary water in most Quebec municipalities. Connecting rain gutters to the sanitary network is generally prohibited.',
      'pages_plumbing_normes.html_attention-les-gouttieres-ne-font-pa': '⚠️ Warning: Gutters are not part of plumber\'s work. Plumbers work on storm drain pipes from the building entry point to the municipal network connection or drainage system.',
      'pages_plumbing_normes.html_certains-travaux-de-plomberie-necessiten': 'Some plumbing work requires a municipal permit and intervention by a master plumber:',
      'pages_plumbing_normes.html_nos-experts-peuvent-inspecter-votre-syst': 'Our experts can inspect your plumbing system and verify its compliance with current standards.',
      'pages_plumbing_normes.html_nominal-pipe-size': 'Nominal Pipe Size',
      'pages_plumbing_normes.html_inches': 'Inches',
      'pages_plumbing_normes.html_o-interieur': 'Inside Ø',
      'pages_plumbing_normes.html_pente-ideale': 'Ideal slope',
      'pages_plumbing_normes.html_14pi-21-mmm': '1/4"/ft (21 mm/m)',
      'pages_plumbing_normes.html_minimum-acceptable': 'Minimum acceptable',
      'pages_plumbing_normes.html_18pi-10-mmm': '1/8"/ft (10 mm/m)',
      'pages_plumbing_normes.html_pente-ideale_1': 'Ideal slope',
      'pages_plumbing_normes.html_18pi-10-mmm_1': '1/8"/ft (10 mm/m)',
      'pages_plumbing_normes.html_minimum-acceptable_1': 'Minimum acceptable',
      'pages_plumbing_normes.html_116pi-5-mmm': '1/16"/ft (5 mm/m)',
      'pages_plumbing_normes.html_diametres-conformes-aux-normes-nps': 'Diameters comply with NPS standards',
      'pages_plumbing_normes.html_pentes-adequates-18-38pi': 'Adequate slopes (1/8-3/8"/ft)',
      'pages_plumbing_normes.html_ventilation-primaire-et-secondaire': 'Primary and secondary ventilation',
      'pages_plumbing_normes.html_siphons-aux-points-requis': 'Traps at required points',
      'pages_plumbing_normes.html_raccords-etanches': 'Watertight connections',
      'pages_plumbing_normes.html_separation-eaux-usees-pluviales': 'Separation of wastewater/stormwater',
      'pages_plumbing_normes.html_regard-de-visite-accessible': 'Accessible inspection port',
      'pages_plumbing_normes.html_clapet-anti-refoulement-si-requis': 'Backflow preventer if required',
      'pages_plumbing_normes.html_1-12-lavabo-bidet': '1-1/2"\n                                        Sink, bidet',
      'pages_plumbing_normes.html_2-douche-baignoire-evier-lave-linge': '2"\n                                        Shower, bathtub, basin, washing machine',
      'pages_plumbing_normes.html_3-toilettes': '3"\n                                        Toilets',
      'pages_plumbing_normes.html_4-collecteur-principal': '4"\n                                        Main collector',
      'pages_plumbing_normes.html_3-descente-pluviale-standard': '3"\n                                        Standard storm drain',
      'pages_plumbing_normes.html_4-grande-surface-de-toiture': '4"\n                                        Large roof area',
      'pages_plumbing_normes.html_4-collecteur-pluvial-principal': '4"+\n                                        Main storm collector',
      'pages_plumbing_normes.html_remplacement-de-la-valve-dentree-prin': '• Replacement of main inlet valve',
      'pages_plumbing_normes.html_raccordement-au-reseau-daqueduc': '• Connection to water main',
      'pages_plumbing_normes.html_modification-majeure-du-systeme-devac': '• Major modification to drainage system',
      'pages_plumbing_normes.html_installation-de-nouvelles-conduites': '• Installation of new pipes',
      'pages_plumbing_normes.html_travaux-touchant-le-collecteur-princip': '• Work affecting main collector',
      'pages_plumbing_normes.html_branchement-au-reseau-degout-municipa': '• Connection to municipal sewer system',
      'pages_plumbing_normes.html_bon-fonctionnement': 'proper operation',
      'pages_plumbing_normes.html_engorgements': 'blockages',
      'pages_plumbing_normes.html_conformite_1': 'compliance',
      'pages_plumbing_normes.html_nps-nominal-pipe-size': 'NPS (Nominal Pipe Size)',
      'pages_plumbing_normes.html_important': 'Important:',
      'pages_plumbing_normes.html_diametre-minimum': 'minimum diameter',
      'pages_plumbing_normes.html_debit-devacuation': 'drainage flow',
      'pages_plumbing_normes.html_ue-unite-devacuation': '*DFU = Drainage Fixture Unit',
      'pages_plumbing_normes.html_jamais-depasser-le-diametre-du-tuyau-en': 'never exceed pipe diameter in height',
      'pages_plumbing_normes.html_conseil': 'Tip:',
      'pages_plumbing_normes.html_astuce': '💡 Tip:',
      'pages_plumbing_normes.html_eaux-sanitaires_1': 'sanitary water',
      'pages_plumbing_normes.html_eaux-pluviales_1': 'stormwater',
      'pages_plumbing_normes.html_note-importante': '💧 Important note:',
      'pages_plumbing_normes.html_separement': 'separately',
      'pages_plumbing_normes.html_attention': '⚠️ Warning:',
      'pages_plumbing_normes.html_normes-de-plomberie-or-guide-pratique-de': 'Plumbing Standards | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_normes.html_plumbing-standards-or-practical-plumbing': 'Plumbing Standards | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_normes.html_nps': 'NPS',
      'pages_plumbing_normes.html_pouces': 'inches',
      'pages_plumbing_normes.html_appareil-sanitaire': 'Sanitary Fixture',
      'pages_plumbing_normes.html_nps-min': 'Min. NPS',
      'pages_plumbing_normes.html_nps-recommande': 'Recommended NPS',
      'pages_plumbing_normes.html_wc-toilettes': 'WC (toilets)',
      'pages_plumbing_normes.html_douche-baignoire': 'Shower / Bathtub',
      'pages_plumbing_normes.html_lavabo': 'Sink',
      'pages_plumbing_normes.html_evier-de-cuisine': 'Kitchen Sink',
      'pages_plumbing_normes.html_lave-linge': 'Washing Machine',
      'pages_plumbing_normes.html_lave-vaisselle': 'Dishwasher',
      'pages_plumbing_normes.html_bidet': 'Bidet',
      'pages_plumbing_normes.html_collecteur-principal_1': 'Main Collector',
      'pages_plumbing_normes.html_appareil': 'Fixture',
      'pages_plumbing_normes.html_debit-ls': 'Flow (L/s)',
      'pages_plumbing_normes.html_ue': 'DFU*',
      'pages_plumbing_normes.html_wc-avec-reservoir': '🚽 WC with tank',
      'pages_plumbing_normes.html_15-ls': '1.5 L/s',
      'pages_plumbing_normes.html_4-ue': '4 DFU',
      'pages_plumbing_normes.html_baignoire': '🛁 Bathtub',
      'pages_plumbing_normes.html_09-ls': '0.9 L/s',
      'pages_plumbing_normes.html_2-ue': '2 DFU',
      'pages_plumbing_normes.html_douche': '🚿 Shower',
      'pages_plumbing_normes.html_05-ls': '0.5 L/s',
      'pages_plumbing_normes.html_2-ue_1': '2 DFU',
      'pages_plumbing_normes.html_lavabo_1': '🧼 Sink',
      'pages_plumbing_normes.html_05-ls_1': '0.5 L/s',
      'pages_plumbing_normes.html_1-ue': '1 DFU',
      'pages_plumbing_normes.html_evier-de-cuisine_1': '🍽️ Kitchen sink',
      'pages_plumbing_normes.html_075-ls': '0.75 L/s',
      'pages_plumbing_normes.html_2-ue_2': '2 DFU',
      'pages_plumbing_normes.html_lave-linge_1': '🧺 Washing machine',
      'pages_plumbing_normes.html_08-ls': '0.8 L/s',
      'pages_plumbing_normes.html_3-ue': '3 DFU',
      'pages_plumbing_normes.html_lave-vaisselle_1': '🍴 Dishwasher',
      'pages_plumbing_normes.html_06-ls': '0.6 L/s',
      'pages_plumbing_normes.html_2-ue_3': '2 DFU',
      'pages_plumbing_normes.html_diametre': 'Diameter',
      'pages_plumbing_normes.html_pente-14pi-ideale': 'Slope 1/4"/ft (ideal)',
      'pages_plumbing_normes.html_pente-18pi-min': 'Slope 1/8"/ft (min)',
      'pages_plumbing_normes.html_max': 'Max',
      'pages_plumbing_normes.html_14pi-max': '1/4"/ft max',
      'pages_plumbing_normes.html_116pi-min': '1/16"/ft min',
      
      // Plumbing Drainage Section
      'pages_plumbing_drainage.html_introduction': 'Introduction',
      'pages_plumbing_drainage.html_les-4-circuits': 'The 4 Circuits',
      'pages_plumbing_drainage.html_systeme-dalimentation': 'Supply System',
      'pages_plumbing_drainage.html_compteur-et-vanne': 'Meter and Valve',
      'pages_plumbing_drainage.html_evacuation': 'Drainage',
      'pages_plumbing_drainage.html_role-des-siphons': 'Role of Traps',
      'pages_plumbing_drainage.html_pente-devacuation': 'Drainage Slope',
      'pages_plumbing_drainage.html_ventilation': 'Ventilation',
      'pages_plumbing_drainage.html_reperer-vos-circuits': 'Locate Your Circuits',
      'pages_plumbing_drainage.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_drainage.html_debouchage': '→ Unclogging',
      'pages_plumbing_drainage.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_drainage.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_drainage.html_les-4-circuits-de-votre-plomberie': 'YOUR PLUMBING\'S 4 CIRCUITS',
      'pages_plumbing_drainage.html_1-systeme-dalimentation': '1\n                        SUPPLY SYSTEM',
      'pages_plumbing_drainage.html_compteur-et-vanne-darret': '!\n                        METER AND SHUT-OFF VALVE',
      'pages_plumbing_drainage.html_2-systeme-devacuation': '2\n                        DRAINAGE SYSTEM',
      'pages_plumbing_drainage.html_le-role-des-siphons': 'THE ROLE OF TRAPS',
      'pages_plumbing_drainage.html_3-systeme-de-ventilation': '3\n                        VENTILATION SYSTEM',
      'pages_plumbing_drainage.html_4-reperer-vos-circuits': '4\n                        LOCATE YOUR CIRCUITS',
      'pages_plumbing_drainage.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_drainage.html_eau-froide': 'COLD WATER',
      'pages_plumbing_drainage.html_eau-chaude': 'HOT WATER',
      'pages_plumbing_drainage.html_evacuation_1': 'DRAINAGE',
      'pages_plumbing_drainage.html_ventilation_1': 'VENTILATION',
      'pages_plumbing_drainage.html_localiser-le-compteur-et-la-vanne-pri': '📍 Locate meter and main valve',
      'pages_plumbing_drainage.html_identifier-les-colonnes-montantes': '📍 Identify rising columns',
      'pages_plumbing_drainage.html_reperer-les-evacuations': '📍 Locate drains',
      'pages_plumbing_drainage.html_avant-deffectuer-des-travaux': '🔧 BEFORE DOING WORK',
      'pages_plumbing_drainage.html_besoin-dun-professionnel': 'NEED A PROFESSIONAL?',
      'pages_plumbing_drainage.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_drainage.html_a-retenir': 'KEY POINTS',
      'pages_plumbing_drainage.html_cas-particulier-double-circuit-dea': '💧 Special case: double cold water circuit',
      'pages_plumbing_drainage.html_points-de-controle-essentiels': 'ESSENTIAL CHECKPOINTS',
      'pages_plumbing_drainage.html_3-tuyaux-3-76-mm': '≤3"\n                                Pipes ≤ 3" (≤ 76 mm)',
      'pages_plumbing_drainage.html_4-tuyaux-4-100-mm': '≥4"\n                                Pipes ≥ 4" (≥ 100 mm)',
      'pages_plumbing_drainage.html_pourquoi-la-ventilation-est-elle-ind': '🌬️ Why is ventilation essential?',
      'pages_plumbing_drainage.html_ventilation-primaire': 'PRIMARY VENTILATION',
      'pages_plumbing_drainage.html_ventilation-secondaire': 'SECONDARY VENTILATION',
      'pages_plumbing_drainage.html_en-maison-individuelle': '🏠 In single-family home',
      'pages_plumbing_drainage.html_en-appartement': '🏢 In apartment',
      'pages_plumbing_drainage.html_le-compteur': '📊 The Meter',
      'pages_plumbing_drainage.html_la-vanne-darret': '🔴 The Shut-off Valve',
      'pages_plumbing_drainage.html_avant-de-se-lancer-dans-des-travaux-de-p': 'Before starting plumbing work, it is important to know your plumbing system well. Where do these pipes go? Which ones contain clean water and which ones discharge wastewater?',
      'pages_plumbing_drainage.html_cette-connaissance-devient-cruciale-en-c': 'This knowledge becomes crucial in case of leak or emergency. In a house, four circuits allow water to circulate: cold and hot water distribution, pipe ventilation and wastewater drainage.',
      'pages_plumbing_drainage.html_distribution-de-leau-potable-froide-dep': 'Distribution of cold potable water from public network to all water points in the house.',
      'pages_plumbing_drainage.html_apres-passage-par-le-chauffe-eau-leau': 'After passing through water heater, hot water is distributed to faucets, showers and appliances.',
      'pages_plumbing_drainage.html_collecte-et-acheminement-des-eaux-usees': 'Collection and transport of wastewater to sewers or septic tank.',
      'pages_plumbing_drainage.html_circulation-dair-dans-les-canalisations': 'Air circulation in pipes to maintain pressure and evacuate odors.',
      'pages_plumbing_drainage.html_generalement-les-habitations-sont-racco': 'Generally, homes are connected to the city supply system. Water, transported via the service pipe, is then distributed through water columns to all connections in different rooms.',
      'pages_plumbing_drainage.html_apres-raccordement-au-systeme-de-chauffe': 'After connection to the water heater system, pipes split into hot water and cold water systems.',
      'pages_plumbing_drainage.html_il-existe-parfois-deux-circuits-deau-fr': 'Sometimes there are two cold water circuits, which separate potable water from utility water (for watering or toilets for example), but this is rare in residential homes.',
      'pages_plumbing_drainage.html_cest-au-niveau-du-raccordement-entre-le': 'It is at the connection between the general system and the building\'s that two essential elements are found:',
      'pages_plumbing_drainage.html_mesure-votre-consommation-deau-il-appa': 'Measures your water consumption. It belongs to your water company and is used to calculate your bill.',
      'pages_plumbing_drainage.html_generalement-situee-juste-apres-le-compt': 'Generally located just after the meter, it comes in the form of a faucet or a quarter-turn handle.',
      'pages_plumbing_drainage.html_en-cas-de-fuite-importante-savoir-lo': '⚠️ In case of major leak, knowing where to find this valve can save you from flooding. Every second counts!',
      'pages_plumbing_drainage.html_a-la-sortie-des-appareils-machines-a-la': 'At the outlet of appliances (washing machines, sinks, toilets, etc.) pipes collect wastewater. All wastewater pipes discharge into the same column of the plumbing system to be transported to the main drain collector, and finally discharged into the city sewer system.',
      'pages_plumbing_drainage.html_chaque-appareil-sanitaire-est-equipe-du': 'Each sanitary fixture is equipped with a trap, in a "U" shape. It retains a certain amount of water to prevent foul air from rising.',
      'pages_plumbing_drainage.html_cette-garde-deau-forme-une-barriere-con': 'This water seal forms a barrier against sewer odors.',
      'pages_plumbing_drainage.html_une-colonne-de-ventilation-permet-la-cir': 'A vent stack allows air circulation and maintains constant pressure throughout the drainage circuit. This vertical pipe opens onto the roof and creates air circulation in the circuit and expels foul air.',
      'pages_plumbing_drainage.html_il-ny-a-pas-de-bonne-evacuation-des-eau': 'There is no proper wastewater drainage without effective primary ventilation. Its purpose is to prevent pressure variations in wastewater drain columns.',
      'pages_plumbing_drainage.html_sans-ventilation-adequate-le-passage-d': 'Without adequate ventilation: the passage of a large mass of water creates strong suction that sucks out the trap\'s water seal, which rises and spreads bad odors in the room.',
      'pages_plumbing_drainage.html_les-colonnes-de-chute-doivent-etre-prolo': 'Drain columns must extend through the roof to open air. It promotes proper flow and prevents siphoning effect.',
      'pages_plumbing_drainage.html_dans-certaines-configurations-complexes': 'In some complex configurations, secondary ventilation can be added to serve fixtures far from the main column.',
      'pages_plumbing_drainage.html_identifiez-la-vanne-darret-des-maint': '⚠️ Identify the shut-off valve now and check that it works!',
      'pages_plumbing_drainage.html_dans-les-habitations-a-etages-les-colon': 'In multi-story homes, rising columns are vertical pipes that distribute water or collect wastewater. They are often hidden in partitions, but you can spot them:',
      'pages_plumbing_drainage.html_les-evacuations-partent-horizontalement': 'Drains run horizontally from each fixture and join a vertical column. Drain pipes are usually gray or white PVC, wider than supply pipes (diameters from 1-1/4" to 4" (32 to 100 mm)).',
      'pages_plumbing_drainage.html_de-nos-jours-les-canalisations-devacua': 'Nowadays, drain pipes are made of plastic materials, most often PVC or ABS in light residential, and no longer lead.',
      'pages_plumbing_drainage.html_les-arrivees-deau-peuvent-etre-faites-d': 'Water supply lines can be made of polyethylene or polypropylene, light and inexpensive. Copper pipes, very resistant and less noisy, are heavier and harder to handle.',
      'pages_plumbing_drainage.html_noubliez-pas-de-couper-larrivee-gen': '⚠️ Don\'t forget to shut off the main water supply before any work, at your basement level or apartment entrance.',
      'pages_plumbing_drainage.html_pour-plus-de-serenite-lors-de-vos-travau': 'For peace of mind during your work, contact a qualified plumber.',
      'pages_plumbing_drainage.html_votre-plomberie-comprend-4-circuits-dist': 'Your plumbing includes 4 distinct circuits: cold water, hot water, drainage and ventilation.',
      'pages_plumbing_drainage.html_la-vanne-darret-generale-coupe-toute-l': 'The main shut-off valve cuts all water to the house in case of emergency.',
      'pages_plumbing_drainage.html_la-ventilation-primaire-debouchant-sur-l': 'The primary vent opening onto the roof prevents odor backups.',
      'pages_plumbing_drainage.html_savoir-localiser-vos-circuits-facilite-l': 'Knowing how to locate your circuits facilitates interventions.',
      'pages_plumbing_drainage.html_au-sous-sol': '• In basement',
      'pages_plumbing_drainage.html_dans-le-garage': '• In garage',
      'pages_plumbing_drainage.html_dans-un-regard-exterieur-pres-de-la-ru': '• In outdoor pit near street',
      'pages_plumbing_drainage.html_dans-les-parties-communes-cave-local': '• In common areas (basement, mechanical room)',
      'pages_plumbing_drainage.html_parfois-dans-lappartement-pres-de-le': '• Sometimes in apartment near entrance',
      'pages_plumbing_drainage.html_dans-les-gaines-techniques-souvent-da': '→\n                                    In technical shafts (often in bathroom or kitchen)',
      'pages_plumbing_drainage.html_le-long-des-murs-dans-les-caves-ou-sou': '→\n                                    Along walls in basements or cellars',
      'pages_plumbing_drainage.html_par-le-bruit-de-leau-qui-circule-quan': '→\n                                    By the sound of water flowing when you open a faucet upstairs',
      'pages_plumbing_drainage.html_4-circuits-distincts': '4 distinct circuits',
      'pages_plumbing_drainage.html_vanne-darret-generale': 'main shut-off valve',
      'pages_plumbing_drainage.html_ventilation-primaire_1': 'primary ventilation',
      'pages_plumbing_drainage.html_localiser-vos-circuits': 'locate your circuits',
      'pages_plumbing_drainage.html_quatre-circuits': 'four circuits',
      'pages_plumbing_drainage.html_canalisation-de-branchement': 'service pipe',
      'pages_plumbing_drainage.html_colonnes-deau': 'water columns',
      'pages_plumbing_drainage.html_colonne-du-systeme-de-plomberie': 'plumbing system column',
      'pages_plumbing_drainage.html_siphon': 'trap',
      'pages_plumbing_drainage.html_garde-deau': 'water seal',
      'pages_plumbing_drainage.html_important': '⚠️ Important:',
      'pages_plumbing_drainage.html_pente-minimale': 'minimum slope',
      'pages_plumbing_drainage.html_attention': '⚠️ Warning:',
      'pages_plumbing_drainage.html_colonne-de-ventilation': 'vent stack',
      'pages_plumbing_drainage.html_sans-ventilation-adequate': 'Without adequate ventilation:',
      'pages_plumbing_drainage.html_pvc-gris-ou-blanc': 'gray or white PVC',
      'pages_plumbing_drainage.html_pvc-ou-en-abs': 'PVC or ABS',
      'pages_plumbing_drainage.html_polyethylene-ou-de-polypropylene': 'polyethylene or polypropylene',
      'pages_plumbing_drainage.html_systeme-de-drainage-or-guide-pratique-de': 'Drainage System | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_drainage.html_drainage-system-or-practical-plumbing-gui': 'Drainage System | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_drainage.html_sans-siphon-fonctionnel-votre-salle-de': 'Without a functioning trap, your bathroom would quickly stink!',
      
      // Common Components - Navbar
      'pages_plumbing_components_navbar.html_accueil': 'HOME',
      'pages_plumbing_components_navbar.html_tarification': 'PRICING',
      'pages_plumbing_components_navbar.html_guide': 'GUIDE',
      'pages_plumbing_components_navbar.html_evenements': 'EVENTS',
      'pages_plumbing_components_navbar.html_outils': 'TOOLS',
      'pages_components_navbar.html_accueil': 'HOME',
      'pages_components_navbar.html_tarification': 'PRICING',
      'pages_components_navbar.html_guide': 'GUIDE',
      'pages_components_navbar.html_evenements': 'EVENTS',
      'pages_components_navbar.html_outils': 'TOOLS',
      'pages_errors_components_navbar.html_accueil': 'HOME',
      'pages_errors_components_navbar.html_tarification': 'PRICING',
      'pages_errors_components_navbar.html_guide': 'GUIDE',
      'pages_errors_components_navbar.html_evenements': 'EVENTS',
      'pages_errors_components_navbar.html_outils': 'TOOLS',
      'pages_errors_codes_components_navbar.html_accueil': 'HOME',
      'pages_errors_codes_components_navbar.html_tarification': 'PRICING',
      'pages_errors_codes_components_navbar.html_guide': 'GUIDE',
      'pages_errors_codes_components_navbar.html_evenements': 'EVENTS',
      'pages_errors_codes_components_navbar.html_outils': 'TOOLS',
      
      // Common Components - Helper (AI Chat)
      'pages_plumbing_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_plumbing_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_plumbing_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_plumbing_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_index_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_index_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_index_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_index_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_errors_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_errors_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_errors_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_errors_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_errors_codes_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_errors_codes_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_errors_codes_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_errors_codes_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      
      // Common Components - Footer
      'pages_plumbing_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_plumbing_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_plumbing_components_footer.html_equipe': 'Team',
      'pages_plumbing_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_plumbing_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_components_footer.html_equipe': 'Team',
      'pages_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_index_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_index_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_index_components_footer.html_equipe': 'Team',
      'pages_index_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_index_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_errors_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_errors_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_errors_components_footer.html_equipe': 'Team',
      'pages_errors_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_errors_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_errors_codes_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_errors_codes_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_errors_codes_components_footer.html_equipe': 'Team',
      'pages_errors_codes_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_errors_codes_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      
      // Common Components - Hero
      'pages_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_errors_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_errors_codes_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_components_template.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_index_components_hero.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
      
      // Error Pages
      'pages_errors_offline.html_hors-ligne-or-deboucheur-expert': 'OFFLINE | Unclogger Expert',
      'pages_errors_offline.html_offline': 'OFFLINE',
      'pages_errors_codes_504.html_504-delai-passerelle-or-deboucheur-expe': '504 - GATEWAY TIMEOUT | Unclogger Expert',
      'pages_errors_codes_503.html_503-service-indisponible-or-deboucheur': '503 - SERVICE UNAVAILABLE | Unclogger Expert',
      'pages_errors_codes_502.html_502-mauvaise-passerelle-or-deboucheur-e': '502 - BAD GATEWAY | Unclogger Expert',
      'pages_errors_codes_500.html_500-erreur-serveur-or-deboucheur-expert': '500 - SERVER ERROR | Unclogger Expert',
      'pages_errors_codes_429.html_429-trop-de-requetes-or-deboucheur-expe': '429 - TOO MANY REQUESTS | Unclogger Expert',
      'pages_errors_codes_410.html_410-ressource-supprimee-or-deboucheur-e': '410 - RESOURCE GONE | Unclogger Expert',
      'pages_errors_codes_408.html_408-delai-depasse-or-deboucheur-expert': '408 - REQUEST TIMEOUT | Unclogger Expert',
      'pages_errors_codes_404.html_404-page-introuvable-or-deboucheur-expe': '404 - PAGE NOT FOUND | Unclogger Expert',
      'pages_errors_codes_403.html_403-acces-interdit-or-deboucheur-expert': '403 - ACCESS FORBIDDEN | Unclogger Expert',
      'pages_errors_codes_401.html_401-non-autorise-or-deboucheur-expert': '401 - UNAUTHORIZED | Unclogger Expert',
      'pages_errors_codes_400.html_400-requete-invalide-or-deboucheur-expe': '400 - INVALID REQUEST | Unclogger Expert'
    });

    // Apply translations after merge
    if (Language.apply) {
      setTimeout(() => {
        try { Language.apply(); } catch(e) { console.error('Apply error:', e); }
      }, 200);
    }
  } catch(e) {
    console.error('Translation merge failed:', e);
  }
}

// Language.apply override for robust translation handling
if (typeof Language !== 'undefined') {
  Language.apply = (function(original) {
    return function() {
      const lang = this.current || (localStorage && localStorage.getItem('language')) || 'fr';
      const trans = (this.translations && this.translations[lang]) || {};

      // Handle data-translate elements
      try {
        document.querySelectorAll('[data-translate]').forEach(el => {
          const key = el.getAttribute('data-translate');
          if (!key) return;
          const value = trans[key];
          if (!value) return;

          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
              el.placeholder = value;
            } else {
              el.value = value;
            }
          } else {
            if (typeof value === 'string' && value.includes('<') && value.includes('>')) {
              el.innerHTML = value;
            } else {
              el.innerText = value;
            }
          }
        });
      } catch(e) {
        console.error('data-translate error:', e);
      }

      // Handle data-translate-placeholder
      try {
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
          const key = el.getAttribute('data-translate-placeholder');
          if (!key) return;
          const value = trans[key];
          if (value && el.placeholder !== undefined) {
            el.placeholder = value;
          }
        });
      } catch(e) {
        console.error('placeholder translation error:', e);
      }

      // Update page title
      try {
        if (trans.page_title) {
          const baseTitle = document.title.includes('|') 
            ? document.title.split('|')[1].trim() 
            : document.title;
          document.title = trans.page_title + ' | ' + baseTitle;
        }
      } catch(e) {
        console.error('title translation error:', e);
      }

      // Call original apply if it existed
      if (typeof original === 'function') {
        try { original.call(this); } catch(e) {}
      }
    };
  })(Language.apply);
}

// ============================================================================
// COMPLETE FR→EN TRANSLATIONS - Auto-generated by full-patch.sh
// ============================================================================
if (typeof Language !== 'undefined' && Language.translations) {
  try {
    // Complete English translations for all dynamic content
    Object.assign(Language.translations.en, {
      // Index Section 00 - Hero
      'pages_index_section_00.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
      
      // Index Section 01 - Services
      'pages_index_section_01.html_nos-services-de-plomberie': 'OUR PLUMBING SERVICES',
      
      // Index Section 04 - Contact
      'pages_index_section_04.html_phprenom': 'First Name',
      'pages_index_section_04.html_phnom': 'Last Name',
      'pages_index_section_04.html_phemail': 'Email',
      'pages_index_section_04.html_ph': '(###)###-####',
      'pages_index_section_04.html_phmessage': 'Message',
      'pages_index_section_04.html_billy-st-hilaire-35-ans': 'Billy St-Hilaire, 35 years old,',
      'pages_index_section_04.html_diplome-de-lecole-des-metiers': 'Graduate of École des Métiers,',
      'pages_index_section_04.html_de-la-construction-de-montreal': 'de la Construction de Montréal,',
      'pages_index_section_04.html_10-ans-pour-le-groupe-centco-inc': '10 years with Centco inc.,',
      'pages_index_section_04.html_contrats-multiples-avec-le-local-144': 'Multiple contracts with local 144,',
      'pages_index_section_04.html_fier-supporteur-et-employe-de': 'Proud supporter and employee of',
      'pages_index_section_04.html_plomberie-martin-boisvert-enr': 'Plomberie Martin Boisvert inc.',
      'pages_index_section_04.html_toujours-actif-pour-repondre-aux': 'Always ready to respond to',
      'pages_index_section_04.html_diverses-appels-de-services': 'various service calls.',
      'pages_index_section_04.html_que-ce-soit-pour-changer-une-valve': 'Whether changing a valve',
      'pages_index_section_04.html_ou-reparer-un-tuyau-qui-coule': 'or fixing a leaking pipe.',
      'pages_index_section_04.html_le-deboucheur-sait-sy-prendre': 'The unclogger knows how to do it.',
      'pages_index_section_04.html_aucune-construction-neuve': '*No new construction',
      
      // Index Section 07 - Map
      'pages_index_section_07.html_uncloggedme': 'unclogged.me',
      'pages_index_section_07.html_1-438-5302343': '+1 (438) 530-2343',
      'pages_index_section_07.html_1-438-7657040': '+1 (438) 765-7040',
      'pages_index_section_07.html_infodeboucheurexpert': 'info@deboucheur.expert',
      'pages_index_section_07.html_infouncloggedme': 'info@unclogged.me',
      'pages_index_section_07.html_deboucheur-expert': 'Unclogger Expert',
      'pages_index_section_07.html_satellite': 'Satellite',
      'pages_index_section_07.html_itineraire': 'Directions',
      'pages_index_section_07.html_sauver': 'Save',
      'pages_index_section_07.html_appeler': 'Call',
      'pages_index_section_07.html_partager': 'Share',
      'pages_index_section_07.html_290-rue-lord-01-napierville-qc-j0j-1l': '290 Rue Lord #01, Napierville, QC J0J 1L0',
      'pages_index_section_07.html_plombier-montreal-and-monteregie': 'Plumber · Montreal & Montérégie',
      
      // Index Section 08 - Footer
      'pages_index_section_08.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_index_section_08.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      
      // Tools Page
      'pages_tools.html_phrechercher-un-outil': 'Search for a tool...',
      'pages_tools.html_outils-de-plomberie-or-deboucheur-expert': 'Plumbing Tools | Unclogger Expert',
      
      // Team Page
      'pages_team.html_billy-sthilaire': 'Billy St-Hilaire',
      'pages_team.html_nancy-boulianne': 'Nancy Boulianne',
      'pages_team.html_notre-equipe-or-deboucheur-expert': 'Our Team | Unclogger Expert',
      
      // Prices Page
      'pages_prices.html_14-a-38': '1/4" to 3/8"',
      'pages_prices.html_12': '1/2"',
      'pages_prices.html_58-a-34': '5/8" to 3/4"',
      'pages_prices.html_320dollar': '$320',
      'pages_prices.html_480dollar': '$480',
      'pages_prices.html_560dollar': '$560',
      'pages_prices.html_8h-18h': '8am-6pm',
      'pages_prices.html_18h-8h': '6pm-8am',
      'pages_prices.html_24h': '24h',
      'pages_prices.html_15': '×1.5',
      'pages_prices.html_175': '×1.75',
      'pages_prices.html_tarification-or-deboucheur-expert': 'Pricing | Unclogger Expert',
      'pages_prices.html_cable-14-a-38': 'Cable 1/4" to 3/8"',
      'pages_prices.html_1ere-heure': '1st hour',
      'pages_prices.html_1ere-heure_1': '1st hour',
      'pages_prices.html_1ere-heure_2': '1st hour',
      'pages_prices.html_cable-12': 'Cable 1/2"',
      'pages_prices.html_1ere-heure_3': '1st hour',
      'pages_prices.html_1ere-heure_4': '1st hour',
      'pages_prices.html_1ere-heure_5': '1st hour',
      'pages_prices.html_cable-58-and-34': 'Cable 5/8" & 3/4"',
      'pages_prices.html_1ere-heure_6': '1st hour',
      'pages_prices.html_1ere-heure_7': '1st hour',
      'pages_prices.html_1ere-heure_8': '1st hour',
      
      // Politics Page
      'pages_politics.html_1-introduction': '1 Introduction',
      'pages_politics.html_2-renseignements': '2 Information',
      'pages_politics.html_3-finalites': '3 Purposes',
      'pages_politics.html_4-communication': '4 Sharing',
      'pages_politics.html_5-securite': '5 Security',
      'pages_politics.html_6-vos-droits': '6 Your Rights',
      'pages_politics.html_7-cookies': '7 Cookies',
      'pages_politics.html_8-modifications': '8 Modifications',
      'pages_politics.html_9-contact': '9 Contact',
      'pages_politics.html_the-collection-aggregation-and-analysi': 'The collection, aggregation, and analysis of any and all user-provided information are stored securely to serve the exclusive operational objective of enabling the Company, in its sole and absolute discretion, to precisely align, tailor, and optimize its product offerings for the most suitable clientele demographics.',
      'pages_politics.html_politique-de-confidentialite-or-deboucheu': 'Privacy Policy | Unclogger Expert',
      
      // Plumbing Guide
      'pages_plumbing.html_astuce': 'Tip:',
      'pages_plumbing.html_recommandation': 'Recommendation:',
      'pages_plumbing.html_guide-pratique-de-plomberie-residentiell': 'Practical Residential Plumbing Guide | Unclogger Expert',
      
      // Events Page
      'pages_events.html_calendrier-and-disponibilites-or-deboucheur': 'Calendar & Availability | Unclogger Expert',
      'pages_events.html_x1': 'X1',
      'pages_events.html_x15': 'X1.5',
      'pages_events.html_x2': 'X2',
      'pages_events.html_x3': 'X3',
      
      // Conditions Page
      'pages_conditions.html_while-the-company-employs-commercially-r': 'While the Company employs commercially reasonable standards for data retention, all collected user information is utilized to facilitate and drive proprietary, targeted advertising initiatives and predictive modeling aimed at anticipating prospective consumer acquisitions; continued use of the service constitutes express consent to such utilization.',
      'pages_conditions.html_conditions-dutilisation-or-deboucheur-ex': 'Terms of Use | Unclogger Expert',
      
      // Plumbing Unclog Section
      'pages_plumbing_unclog.html_causes-dengorgement': 'Causes of Clogging',
      'pages_plumbing_unclog.html_methodes-naturelles': 'Natural Methods',
      'pages_plumbing_unclog.html_outils-a-portee-de-main': 'Handy Tools',
      'pages_plumbing_unclog.html_calcaire': 'Limescale',
      'pages_plumbing_unclog.html_types-de-curage': 'Types of Cleaning',
      'pages_plumbing_unclog.html_bouchons-par-racines': 'Root Blockages',
      'pages_plumbing_unclog.html_camion-hydrocureur': 'Hydro-jetting Truck',
      'pages_plumbing_unclog.html_debouchage-par-acide': 'Acid Unclogging',
      'pages_plumbing_unclog.html_probleme-de-pente': 'Slope Problem',
      'pages_plumbing_unclog.html_diametres-a-respecter': 'Required Diameters',
      'pages_plumbing_unclog.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_unclog.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_unclog.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_unclog.html_urgence-247': '📞 24/7 EMERGENCY',
      'pages_plumbing_unclog.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_unclog.html_causes-dengorgement_1': '?\n                        CAUSES OF CLOGGING',
      'pages_plumbing_unclog.html_methodes-naturelles_1': '🌿\n                        NATURAL METHODS',
      'pages_plumbing_unclog.html_outils-a-portee-de-main_1': '🔧\n                        HANDY TOOLS',
      'pages_plumbing_unclog.html_le-calcaire-et-la-canalisation': 'LIMESCALE AND PIPES',
      'pages_plumbing_unclog.html_2-types-de-curage': '2\n                        TYPES OF CLEANING',
      'pages_plumbing_unclog.html_engorgement-par-racines': '🌳\n                        ROOT BLOCKAGE',
      'pages_plumbing_unclog.html_camion-hydrocureur_1': '🚛\n                        HYDRO-JETTING TRUCK',
      'pages_plumbing_unclog.html_debouchage-par-acide_1': '⚗️\n                        ACID UNCLOGGING',
      'pages_plumbing_unclog.html_probleme-de-pente_1': '📐\n                        SLOPE PROBLEM',
      'pages_plumbing_unclog.html_diametres-a-respecter_1': '📏\n                        REQUIRED DIAMETERS',
      'pages_plumbing_unclog.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_unclog.html_eau-bouillante': 'BOILING WATER',
      'pages_plumbing_unclog.html_bicarbonate-sel': 'BAKING SODA + SALT',
      'pages_plumbing_unclog.html_vinaigre-blanc': 'WHITE VINEGAR',
      'pages_plumbing_unclog.html_ventouse': '🪠 PLUNGER',
      'pages_plumbing_unclog.html_furet': '🐍 DRAIN SNAKE',
      'pages_plumbing_unclog.html_curage-technique': 'TECHNICAL CLEANING',
      'pages_plumbing_unclog.html_curage-biologique': 'BIOLOGICAL CLEANING',
      'pages_plumbing_unclog.html_canalisation-bouchee': 'CLOGGED PIPE?',
      'pages_plumbing_unclog.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_unclog.html_quand-agir': 'WHEN TO ACT?',
      'pages_plumbing_unclog.html_intervention-professionnelle-requise': 'PROFESSIONAL INTERVENTION REQUIRED',
      'pages_plumbing_unclog.html_capacites': '✓ Capabilities:',
      'pages_plumbing_unclog.html_manipulation-professionnelle-uniqueme': '⚠️ PROFESSIONAL HANDLING ONLY',
      'pages_plumbing_unclog.html_regle-fondamentale': 'Fundamental Rule:',
      'pages_plumbing_unclog.html_maison-de-plain-pied': '🏠 SINGLE-STORY HOUSE',
      'pages_plumbing_unclog.html_maison-a-etages': '🏢 MULTI-STORY HOUSE',
      'pages_plumbing_unclog.html_acide-sulfurique': 'Sulfuric Acid',
      'pages_plumbing_unclog.html_acide-chlorhydrique': 'Hydrochloric Acid',
      'pages_plumbing_unclog.html_un-desengorgement-est-necessaire-quand-d': 'Unclogging is necessary when bad odors or backup are observed in the pipes. You can also call for this type of service when water drainage slows down in the plumbing system.',
      'pages_plumbing_unclog.html_dans-la-plupart-des-cas-lengorgement-p': 'In most cases, the blockage comes from an obstruction caused by debris or foreign objects:',
      'pages_plumbing_unclog.html_autres-causes-le-bouchon-peut-aussi-pr': 'Other causes: The blockage can also come from a root blocking water flow, or from poorly done plumbing (insufficient slope, misplaced elbows).',
      'pages_plumbing_unclog.html_dissout-la-graisse-le-savon-etc-verse': 'Dissolves grease, soap, etc. Pour directly into the sink, basin or shower.',
      'pages_plumbing_unclog.html_melanger-bicarbonate-de-soude-avec-du-se': 'Mix baking soda with salt, pour and rinse with hot water.',
      'pages_plumbing_unclog.html_eau-chaude-vinaigre-blanc-reaction-e': 'Hot water + white vinegar: effervescent reaction that helps dissolve deposits.',
      'pages_plumbing_unclog.html_la-methode-classique-et-efficace-pour-le': 'The classic and effective method for small clogs. Create pressure/suction to dislodge the obstruction.',
      'pages_plumbing_unclog.html_outil-flexible-a-manivelle-pour-atteindr': 'Flexible crank tool to reach deep clogs:',
      'pages_plumbing_unclog.html_le-calcaire-est-egalement-un-element-qui': 'Limescale is also a factor that causes pipe blockage. It comes from the water circulating in the system. When water is rich in limescale, it causes pipe scaling.',
      'pages_plumbing_unclog.html_double-probleme-en-plus-de-bloquer-la': 'Double problem: In addition to blocking the pipe, limescale also retains debris and waste that slip into the pipes.',
      'pages_plumbing_unclog.html_pour-un-debouchage-en-profondeur-le-mie': 'For deep unclogging, it is best to clean the pipe with the help of a professional.',
      'pages_plumbing_unclog.html_concernant-les-bouchons-causes-par-une-r': 'Regarding blockages caused by roots, the solution must be technical and not manual. You cannot solve the blockage yourself.',
      'pages_plumbing_unclog.html_methode-inspection-par-camera-camion': 'Method: Camera inspection → Hydro-jetting truck with nozzle → Root removal if necessary → Repairs',
      'pages_plumbing_unclog.html_le-camion-hydrocureur-ou-camion-a-pompe': 'The hydro-jetting truck (or pump/high-pressure truck) is equipment used when a blockage persists in the wastewater system.',
      'pages_plumbing_unclog.html_psi-de-pression': 'PSI of pressure',
      'pages_plumbing_unclog.html_camera-dinspection-integree': 'Integrated inspection camera',
      'pages_plumbing_unclog.html_aspiration-nettoyage': 'Suction + Cleaning',
      'pages_plumbing_unclog.html_le-debouchage-par-acide-est-efficace-mai': 'Acid unclogging is effective but dangerous for health and skin. Only professionals can handle these products.',
      'pages_plumbing_unclog.html_utilise-pour-les-toilettes-bouchees-eli': 'Used for clogged toilets. Removes sanitary napkins, toilet paper, etc.',
      'pages_plumbing_unclog.html_pour-canalisations-en-beton-ou-brique-a': 'For concrete or brick pipes. Also called muriatic acid.',
      'pages_plumbing_unclog.html_ce-type-de-debouchage-est-souvent-associ': 'This type of unclogging is often combined with snake unclogging or cleaning to remove remaining debris.',
      'pages_plumbing_unclog.html_si-la-canalisation-est-engorgee-a-cause': 'If the pipe is clogged due to slope, the installation standards must be reviewed. The drainage network must follow precise rules for natural flow.',
      'pages_plumbing_unclog.html_chaque-equipement-doit-avoir-son-propre': 'Each fixture must have its own drain pipe. The sink should not have the same pipe as the basin. The shower should not use the same pipe as the toilet, etc.',
      'pages_plumbing_unclog.html_dans-la-plupart-des-cas-les-engorgement': 'In most cases, blockages come from non-compliance with piping standards. Here are the recommended diameters:',
      'pages_plumbing_unclog.html_ces-regles-sont-inscrites-dans-les-norme': 'These rules are written in plumbing codes and are sometimes difficult for individuals to follow. It is best to call a professional.',
      'pages_plumbing_unclog.html_ne-laissez-pas-un-bouchon-devenir-un-pro': 'Don\'t let a clog become a major problem. Contact our experts for quick and effective service.',
      'pages_plumbing_unclog.html_cheveux': 'Hair',
      'pages_plumbing_unclog.html_savon': 'Soap',
      'pages_plumbing_unclog.html_graisse': 'Grease',
      'pages_plumbing_unclog.html_calcaire_1': 'Limescale',
      'pages_plumbing_unclog.html_inspection-de-la-canalisation-pour-local': 'Pipe inspection to locate the blockage',
      'pages_plumbing_unclog.html_nettoyage-avec-jet-deau-a-haute-pressio': 'Cleaning with high-pressure water jet',
      'pages_plumbing_unclog.html_parfois-associe-a-un-debouchage-a-buse': 'Sometimes combined with nozzle unclogging',
      'pages_plumbing_unclog.html_traitement-avec-solution-dazote-phosp': 'Treatment with nitrogen + phosphorus solution',
      'pages_plumbing_unclog.html_insertion-de-bacteries-qui-eliminent-les': 'Insertion of bacteria that eliminate deposits',
      'pages_plumbing_unclog.html_ideal-pour-canalisations-fragiles': 'Ideal for fragile pipes',
      'pages_plumbing_unclog.html_peut-bloquer-completement-levacuation-d': 'Can completely block wastewater drainage',
      'pages_plumbing_unclog.html_peut-endommager-la-structure-de-la-canal': 'Can damage pipe structure',
      'pages_plumbing_unclog.html_necessite-souvent-des-travaux-de-reparat': 'Often requires repair work after intervention',
      'pages_plumbing_unclog.html_introduire-le-furet-petit-a-petit': 'Insert the snake little by little',
      'pages_plumbing_unclog.html_sentir-le-bouchon-a-linterieur-du-tuyau': 'Feel the clog inside the pipe',
      'pages_plumbing_unclog.html_activer-la-manivelle-et-tourner': 'Activate the crank and turn',
      'pages_plumbing_unclog.html_retirer-et-rincer-a-leau': 'Remove and rinse with water',
      'pages_plumbing_unclog.html_1-inspection-de-la-canalisation-pour-loc': '1\n                                    Pipe inspection to locate the blockage',
      'pages_plumbing_unclog.html_2-nettoyage-avec-jet-deau-a-haute-press': '2\n                                    Cleaning with high-pressure water jet',
      'pages_plumbing_unclog.html_3-parfois-associe-a-un-debouchage-a-buse': '3\n                                    Sometimes combined with nozzle unclogging',
      'pages_plumbing_unclog.html_1-traitement-avec-solution-dazote-pho': '1\n                                    Treatment with nitrogen + phosphorus solution',
      'pages_plumbing_unclog.html_2-insertion-de-bacteries-qui-eliminent-l': '2\n                                    Insertion of bacteria that eliminate deposits',
      'pages_plumbing_unclog.html_3-ideal-pour-canalisations-fragiles': '3\n                                    Ideal for fragile pipes',
      'pages_plumbing_unclog.html_aspirer-la-boue-et-les-dechets': '• Suction of mud and waste',
      'pages_plumbing_unclog.html_deboucher-les-canalisations-tenaces': '• Unclog stubborn pipes',
      'pages_plumbing_unclog.html_curage-a-haute-pression': '• High-pressure cleaning',
      'pages_plumbing_unclog.html_nettoyage-complet-du-drain': '• Complete drain cleaning',
      'pages_plumbing_unclog.html_canalisation-a-lhorizontale': '• Horizontal piping',
      'pages_plumbing_unclog.html_collecteur-regroupant-tous-les-conduit': '• Collector grouping all conduits',
      'pages_plumbing_unclog.html_collecteur-enfoui-ou-dans-la-dalle': '• Buried collector or in slab',
      'pages_plumbing_unclog.html_pente-18-14ft-1-2percent-jusqua-65': '• Slope: 1/8-1/4"/ft (1-2%) (up to 6.5 ft (2 m))',
      'pages_plumbing_unclog.html_pente-14-38ft-2-3percent-au-dela-de': '• Slope: 1/4-3/8"/ft (2-3%) (beyond 6.5 ft (2 m))',
      'pages_plumbing_unclog.html_collecteur-dispose-verticalement': '• Vertically arranged collector',
      'pages_plumbing_unclog.html_conduits-avec-clapet-aerateur': '• Conduits with air valve',
      'pages_plumbing_unclog.html_reduit-les-odeurs': '• Reduces odors',
      'pages_plumbing_unclog.html_diminue-le-bruit-devacuation': '• Reduces drainage noise',
      'pages_plumbing_unclog.html_evite-laspiration-deau-entre-conduit': '• Prevents water suction between conduits',
      'pages_plumbing_unclog.html_mauvaises-odeurs': 'bad odors',
      'pages_plumbing_unclog.html_refoulement': 'backup',
      'pages_plumbing_unclog.html_ralentit': 'slows down',
      'pages_plumbing_unclog.html_autres-causes': 'Other causes:',
      'pages_plumbing_unclog.html_racine': 'root',
      'pages_plumbing_unclog.html_entartrage-des-tuyaux': 'pipe scaling',
      'pages_plumbing_unclog.html_double-probleme': 'Double problem:',
      'pages_plumbing_unclog.html_curer-la-canalisation': 'clean the pipe',
      'pages_plumbing_unclog.html_technique-et-non-manuelle': 'technical and not manual',
      'pages_plumbing_unclog.html_methode': 'Method:',
      'pages_plumbing_unclog.html_dangereux-pour-la-sante-et-la-peau': 'dangerous for health and skin',
      'pages_plumbing_unclog.html_normes-de-plomberie': 'plumbing codes',
      'pages_plumbing_unclog.html_debouchage-de-canalisations-or-guide-prat': 'Pipe Unclogging | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_unclog.html_drainage-pipe-unclogging-or-practical-plu': 'Drainage Pipe Unclogging | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_unclog.html_2en1': '2in1',
      'pages_plumbing_unclog.html_equipement': 'Equipment',
      'pages_plumbing_unclog.html_diametre-ext': 'Ext. Diameter',
      'pages_plumbing_unclog.html_pente-min': 'Min. Slope',
      'pages_plumbing_unclog.html_toilettes': '🚽 Toilets',
      'pages_plumbing_unclog.html_lavabo-avec-siphon': '🚿 Sink (with trap)',
      'pages_plumbing_unclog.html_evier': '🍽️ Kitchen Sink',
      'pages_plumbing_unclog.html_baignoire-less3-pi': '🛁 Bathtub (<3 ft',
      'pages_plumbing_unclog.html_baignoire-greater3-pi': '🛁 Bathtub (>3 ft',
      
      // Plumbing Supply Section
      'pages_plumbing_supply.html_introduction': 'Introduction',
      'pages_plumbing_supply.html_le-reseau-dalimentation': 'The Supply Network',
      'pages_plumbing_supply.html_pose-du-collecteur': 'Manifold Installation',
      'pages_plumbing_supply.html_precautions-de-pose': 'Installation Precautions',
      'pages_plumbing_supply.html_choix-des-raccords': 'Fitting Selection',
      'pages_plumbing_supply.html_types-de-tuyaux': 'Pipe Types',
      'pages_plumbing_supply.html_cuivre': '→ Copper',
      'pages_plumbing_supply.html_pex': '→ PEX',
      'pages_plumbing_supply.html_multicouche': '→ Multilayer',
      'pages_plumbing_supply.html_diametres-a-respecter': 'Required Diameters',
      'pages_plumbing_supply.html_regulation-de-pression': 'Pressure Regulation',
      'pages_plumbing_supply.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_supply.html_debouchage': '→ Unclogging',
      'pages_plumbing_supply.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_supply.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_supply.html_1-le-reseau-dalimentation': '1\n                        THE SUPPLY NETWORK',
      'pages_plumbing_supply.html_2-pose-du-collecteur': '2\n                        MANIFOLD INSTALLATION',
      'pages_plumbing_supply.html_precautions-de-pose_1': '!\n                        INSTALLATION PRECAUTIONS',
      'pages_plumbing_supply.html_3-types-de-tuyaux': '3\n                        PIPE TYPES',
      'pages_plumbing_supply.html_4-diametres-a-respecter': '4\n                        REQUIRED DIAMETERS',
      'pages_plumbing_supply.html_5-regulation-de-la-pression': '5\n                        PRESSURE REGULATION',
      'pages_plumbing_supply.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_supply.html_pose-encastree': 'RECESSED INSTALLATION',
      'pages_plumbing_supply.html_pose-apparente': 'EXPOSED INSTALLATION',
      'pages_plumbing_supply.html_tuyaux-en-cuivre': '🔶 COPPER PIPES',
      'pages_plumbing_supply.html_tuyaux-en-pex': '🔵 PEX PIPES',
      'pages_plumbing_supply.html_tuyaux-multicouches': '🟢 MULTILAYER PIPES',
      'pages_plumbing_supply.html_besoin-dun-professionnel': 'NEED A PROFESSIONAL?',
      'pages_plumbing_supply.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_supply.html_a-savoir-avant-de-commencer': 'BEFORE YOU START',
      'pages_plumbing_supply.html_tuyaux': 'PIPES',
      'pages_plumbing_supply.html_raccords': 'FITTINGS',
      'pages_plumbing_supply.html_collecteurs': 'MANIFOLDS',
      'pages_plumbing_supply.html_securite-importante': 'IMPORTANT SAFETY',
      'pages_plumbing_supply.html_cuivre-recuit': 'Annealed Copper',
      'pages_plumbing_supply.html_cuivre-ecroui': 'Hard Copper',
      'pages_plumbing_supply.html_types-de-raccords-pex': 'PEX Fitting Types:',
      'pages_plumbing_supply.html_avantages': '✓ Advantages:',
      'pages_plumbing_supply.html_comment-tester-la-pression': '📏 How to test pressure?',
      'pages_plumbing_supply.html_avant-la-pose': 'Before installation:',
      'pages_plumbing_supply.html_en-cas-de-soudure': 'When soldering:',
      'pages_plumbing_supply.html_pour-alimenter-le-foyer-et-les-equipemen': 'To supply the home and equipment with running water, a water supply network must be installed. This guide walks you through understanding and installing your system.',
      'pages_plumbing_supply.html_on-utilise-leau-courante-tous-les-jours': 'We use running water every day, for hygiene and comfort. Therefore, if you are considering installing your plumbing, you must think about the building\'s water supply. Water must reach the entire plumbing network to supply the shower, bathtub, toilets, sink, water heater, etc.',
      'pages_plumbing_supply.html_le-reseau-dalimentation-deau-est-gener': 'The water supply network generally consists of pipes, fittings and manifolds. Manifolds are used so that all equipment can benefit from running water. They are therefore main elements for water distribution.',
      'pages_plumbing_supply.html_transport-de-leau': 'Water Transport',
      'pages_plumbing_supply.html_connexions': 'Connections',
      'pages_plumbing_supply.html_distribution': 'Distribution',
      'pages_plumbing_supply.html_un-collecteur-est-compose-de-plusieurs-s': 'A manifold is composed of several water outlets, depending on the number of equipment used. The number of manifolds to use depends on the number of rooms to supply and the floors of the building.',
      'pages_plumbing_supply.html_note-historique-auparavant-seuls-les': 'Historical note: Previously, only lead pipes were used. Nowadays, this material is prohibited. Copper, PEX and multilayer are now used.',
      'pages_plumbing_supply.html_le-cuivre-remplace-principalement-la-tuy': 'Copper mainly replaces traditional lead piping. It is not sensitive to corrosion, rarely expands and resists pressure.',
      'pages_plumbing_supply.html_les-plus-pratiques-car-ils-nont-pas-bes': 'The most practical because they don\'t need soldered fittings. However, they require several guides for fastening.',
      'pages_plumbing_supply.html_petits-projets-montage-par-vissage': 'Small projects, screw assembly',
      'pages_plumbing_supply.html_complexe-mais-fiable-professionnel': 'Complex but reliable, professional',
      'pages_plumbing_supply.html_installations-neuves-durable': 'New installations, durable',
      'pages_plumbing_supply.html_un-bon-compromis-entre-le-cuivre-et-le-p': 'A good compromise between copper and PEX. Composed of cross-linked polyethylene layers, they withstand heat, are quiet and require no soldering.',
      'pages_plumbing_supply.html_pour-une-distribution-correcte-de-leau': 'For proper water distribution, standards must be followed regarding pipe diameter according to desired flow.',
      'pages_plumbing_supply.html_regle-generale-un-tuyau-de-grand-diame': 'General rule: A large diameter pipe will offer high flow while a small pipe will be limited in flow.',
      'pages_plumbing_supply.html_pression-standard-du-reseau-public': 'Standard public network pressure',
      'pages_plumbing_supply.html_installer-un-suppresseur': 'Install a booster pump',
      'pages_plumbing_supply.html_installer-un-reducteur': 'Install a pressure reducer',
      'pages_plumbing_supply.html_utilisez-un-manometre-pour-mesurer-la-pr': 'Use a pressure gauge to measure pressure. The pressure reducer is installed at the meter outlet to prevent pipe deterioration.',
      'pages_plumbing_supply.html_vu-la-complexite-du-reseau-dalimentatio': 'Given the complexity of the running water supply network, it is advisable to call a professional plumber who masters this field.',
      'pages_plumbing_supply.html_necessite-deux-collecteurs-eau-froide': 'Requires two manifolds (cold water + hot water)',
      'pages_plumbing_supply.html_raccordement-au-chauffe-eau-pour-leau-c': 'Connection to water heater for hot water',
      'pages_plumbing_supply.html_tuyaux-multicouches-ou-pex-recommandes': 'Multilayer or PEX pipes recommended',
      'pages_plumbing_supply.html_pose-sous-fourreau-pour-dalle-ou-plaque': 'Installation under conduit for slab or drywall',
      'pages_plumbing_supply.html_tuyaux-en-cuivre-ou-multicouches-recomma': 'Copper or multilayer pipes recommended',
      'pages_plumbing_supply.html_solides-et-resistants-aux-uv': 'Solid and UV resistant',
      'pages_plumbing_supply.html_fixation-a-6-15-cm-du-sol': 'Fastening at ~6" (15 cm) from floor',
      'pages_plumbing_supply.html_raccordement-parfait-pour-eviter-les-fui': 'Perfect connection to avoid leaks',
      'pages_plumbing_supply.html_bleu-eau-froide': 'Blue = Cold Water',
      'pages_plumbing_supply.html_rouge-eau-chaude': 'Red = Hot Water',
      'pages_plumbing_supply.html_fermer-la-vanne-qui-ouvre-et-ferme-la': '• Close the valve that opens and closes the pipe',
      'pages_plumbing_supply.html_choisir-le-type-de-raccordement-avec': '• Choose the connection type (with or without soldering)',
      'pages_plumbing_supply.html_porter-des-gants-de-protection': '• Wear protective gloves',
      'pages_plumbing_supply.html_porter-des-lunettes-de-securite': '• Wear safety glasses',
      'pages_plumbing_supply.html_ventiler-la-zone-de-travail': '• Ventilate the work area',
      'pages_plumbing_supply.html_peu-de-raccords-necessaires': '• Few fittings needed',
      'pages_plumbing_supply.html_fixation-a-froid': '• Cold fastening',
      'pages_plumbing_supply.html_encastrable': '• Recessed',
      'pages_plumbing_supply.html_fixation-a-chaud': '• Hot fastening',
      'pages_plumbing_supply.html_non-encastrable': '• Not recessed',
      'pages_plumbing_supply.html_installation-murale': '• Wall installation',
      'pages_plumbing_supply.html_resistance-a-la-chaleur': '• Heat resistance',
      'pages_plumbing_supply.html_silencieux': '• Quiet',
      'pages_plumbing_supply.html_pas-de-soudure': '• No soldering',
      'pages_plumbing_supply.html_fixation-par-sertissage': '• Crimp fastening',
      'pages_plumbing_supply.html_tuyaux_1': 'pipes',
      'pages_plumbing_supply.html_raccords_1': 'fittings',
      'pages_plumbing_supply.html_collecteurs_1': 'manifolds',
      'pages_plumbing_supply.html_note-historique': 'Historical note:',
      'pages_plumbing_supply.html_note': '⚠️ Note:',
      'pages_plumbing_supply.html_attention': '⚠️ Warning:',
      'pages_plumbing_supply.html_a-compression': 'Compression',
      'pages_plumbing_supply.html_a-glissement': 'Push-fit',
      'pages_plumbing_supply.html_a-sertir': 'Crimp',
      'pages_plumbing_supply.html_regle-generale': 'General rule:',
      'pages_plumbing_supply.html_suppresseur': 'booster pump',
      'pages_plumbing_supply.html_reducteur': 'reducer',
      'pages_plumbing_supply.html_manometre': 'pressure gauge',
      'pages_plumbing_supply.html_alimentation-deau-or-guide-pratique-de-p': 'Water Supply | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_supply.html_water-supply-or-practical-plumbing-guide': 'Water Supply | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_supply.html_la-pose-est-dordre-professionnel-car-le': 'Installation is professional-level because connection and installation are technical.',
      'pages_plumbing_supply.html_les-tuyaux-pex-ne-supportent-pas-les-uv': 'PEX pipes do not withstand UV. They must be recessed or protected.',
      'pages_plumbing_supply.html_debit-souhaite': 'Desired Flow',
      'pages_plumbing_supply.html_diametre-recommande': 'Recommended Diameter',
      'pages_plumbing_supply.html_50-lmin': '50 L/min',
      'pages_plumbing_supply.html_160-lmin': '160 L/min',
      'pages_plumbing_supply.html_250-lmin': '250 L/min',
      'pages_plumbing_supply.html_44-psi': '44 PSI',
      'pages_plumbing_supply.html_less-44-psi': '< 44 PSI',
      'pages_plumbing_supply.html_greater-73-psi': '> 73 PSI',
      
      // Plumbing Normes Section
      'pages_plumbing_normes.html_introduction': 'Introduction',
      'pages_plumbing_normes.html_diametre-nominal-dn': 'Nominal Diameter (DN)',
      'pages_plumbing_normes.html_tableau-des-dn': 'DN Table',
      'pages_plumbing_normes.html_debits-devacuation': 'Drainage Flow Rates',
      'pages_plumbing_normes.html_pentes-recommandees': 'Recommended Slopes',
      'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux': 'Sanitary and Storm Pipes',
      'pages_plumbing_normes.html_conformite': 'Compliance',
      'pages_plumbing_normes.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_normes.html_systeme-de-drainage': '→ Drainage System',
      'pages_plumbing_normes.html_debouchage': '→ Unclogging',
      'pages_plumbing_normes.html_appeler-maintenant': '📞 CALL NOW',
      'pages_plumbing_normes.html_demander-une-inspection': 'REQUEST AN INSPECTION',
      'pages_plumbing_normes.html_o-diametre-nominal-nps': 'Ø\n                        NOMINAL DIAMETER (NPS)',
      'pages_plumbing_normes.html_tableau-des-nps-par-appareil': '📊\n                        NPS TABLE BY FIXTURE',
      'pages_plumbing_normes.html_debits-devacuation_1': '💧\n                        DRAINAGE FLOW RATES',
      'pages_plumbing_normes.html_pentes-recommandees_1': '📐\n                        RECOMMENDED SLOPES',
      'pages_plumbing_normes.html_tuyaux-sanitaires-et-pluviaux_1': '🚧\n                        SANITARY AND STORM PIPES',
      'pages_plumbing_normes.html_conformite-et-reglementation': '✓\n                        COMPLIANCE AND REGULATIONS',
      'pages_plumbing_normes.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_normes.html_3-tuyaux-3-76-mm': '≤3"\n                                PIPES ≤ 3" (≤ 76 mm)',
      'pages_plumbing_normes.html_4-tuyaux-4-100-mm': '≥4"\n                                PIPES ≥ 4" (≥ 100 mm)',
      'pages_plumbing_normes.html_limites-de-pente': 'SLOPE LIMITS',
      'pages_plumbing_normes.html_besoin-dune-verification': 'NEED A CHECK?',
      'pages_plumbing_normes.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_normes.html_pourquoi-respecter-les-normes': 'WHY FOLLOW STANDARDS?',
      'pages_plumbing_normes.html_regle-importante-pente-et-longueur': '⚠️ IMPORTANT RULE: SLOPE AND LENGTH',
      'pages_plumbing_normes.html_eaux-sanitaires': '🚽 SANITARY WATER',
      'pages_plumbing_normes.html_eaux-pluviales': '🌧️ STORMWATER',
      'pages_plumbing_normes.html_points-de-conformite-a-verifier': 'COMPLIANCE POINTS TO CHECK',
      'pages_plumbing_normes.html_travaux-necessitant-un-permis': '⚠️ WORK REQUIRING A PERMIT',
      'pages_plumbing_normes.html_le-respect-des-normes-de-plomberie-garan': 'Compliance with plumbing standards ensures proper operation of your drainage system, prevents blockages and ensures compliance with Quebec building code.',
      'pages_plumbing_normes.html_le-nps-nominal-pipe-size-est-la-mesure': 'NPS (Nominal Pipe Size) is the standard measurement used to designate drain pipe diameter in North America. It corresponds approximately to the inside diameter of the pipe in inches.',
      'pages_plumbing_normes.html_important-le-diametre-exterieur-peut-v': 'Important: The outside diameter may vary depending on material (PVC, cast iron, copper). NPS indicates flow capacity, not exact dimensions.',
      'pages_plumbing_normes.html_chaque-appareil-sanitaire-necessite-un-d': 'Each sanitary fixture requires a minimum diameter to ensure proper drainage:',
      'pages_plumbing_normes.html_le-debit-devacuation-represente-la-quan': 'Drainage flow represents the amount of water each fixture can drain per second. This value is essential for properly sizing pipes.',
      'pages_plumbing_normes.html_ue-unite-devacuation-valeur-normal': '*DFU = Drainage Fixture Unit: Standardized value used to calculate total load of a plumbing system.',
      'pages_plumbing_normes.html_la-pente-cumulee-ne-doit-jamais-depasser': 'The cumulative slope should never exceed the pipe diameter in height, unless the pipe is vented. This rule determines the maximum length of a horizontal pipe.',
      'pages_plumbing_normes.html_conseil-pour-un-tuyau-de-2-avec-une-p': 'Tip: For a 2" pipe with an ideal slope of 1/4"/ft, do not exceed 8 feet in length. With a minimum slope of 1/8"/ft, you can go up to 16 feet, but it is less recommended.',
      'pages_plumbing_normes.html_pente-maximale-globale-21-mmm': 'Maximum overall slope (21 mm/m)',
      'pages_plumbing_normes.html_au-dela-leau-secoule-trop-vite-et-lai': 'Beyond this, water flows too fast and leaves solids behind',
      'pages_plumbing_normes.html_pente-minimale-globale-5-mmm': 'Minimum overall slope (5 mm/m)',
      'pages_plumbing_normes.html_en-dessous-stagnation-des-eaux-et-depot': 'Below this, water stagnation and deposits',
      'pages_plumbing_normes.html_astuce-une-pente-trop-forte-est-aus': '💡 Tip: A slope that is too steep is as problematic as one that is too shallow. Water flows too quickly and leaves solid matter to accumulate, causing long-term blockages.',
      'pages_plumbing_normes.html_en-plomberie-residentielle-nous-travail': 'In residential plumbing, we mainly work with two types of drainage networks: sanitary water (wastewater) and stormwater (rainwater). These networks are generally separate.',
      'pages_plumbing_normes.html_proviennent-des-appareils-sanitaires-to': 'Come from sanitary fixtures (toilets, sinks, showers, basins, etc.)',
      'pages_plumbing_normes.html_proviennent-de-la-collecte-des-eaux-de-p': 'Come from rainwater collection on the roof and around the building.',
      'pages_plumbing_normes.html_note-importante-les-eaux-pluviales': '💧 Important note: Stormwater must be drained separately from sanitary water in most Quebec municipalities. Connecting rain gutters to the sanitary network is generally prohibited.',
      'pages_plumbing_normes.html_attention-les-gouttieres-ne-font-pa': '⚠️ Warning: Gutters are not part of plumber\'s work. Plumbers work on storm drain pipes from the building entry point to the municipal network connection or drainage system.',
      'pages_plumbing_normes.html_certains-travaux-de-plomberie-necessiten': 'Some plumbing work requires a municipal permit and intervention by a master plumber:',
      'pages_plumbing_normes.html_nos-experts-peuvent-inspecter-votre-syst': 'Our experts can inspect your plumbing system and verify its compliance with current standards.',
      'pages_plumbing_normes.html_nominal-pipe-size': 'Nominal Pipe Size',
      'pages_plumbing_normes.html_inches': 'Inches',
      'pages_plumbing_normes.html_o-interieur': 'Inside Ø',
      'pages_plumbing_normes.html_pente-ideale': 'Ideal slope',
      'pages_plumbing_normes.html_14pi-21-mmm': '1/4"/ft (21 mm/m)',
      'pages_plumbing_normes.html_minimum-acceptable': 'Minimum acceptable',
      'pages_plumbing_normes.html_18pi-10-mmm': '1/8"/ft (10 mm/m)',
      'pages_plumbing_normes.html_pente-ideale_1': 'Ideal slope',
      'pages_plumbing_normes.html_18pi-10-mmm_1': '1/8"/ft (10 mm/m)',
      'pages_plumbing_normes.html_minimum-acceptable_1': 'Minimum acceptable',
      'pages_plumbing_normes.html_116pi-5-mmm': '1/16"/ft (5 mm/m)',
      'pages_plumbing_normes.html_diametres-conformes-aux-normes-nps': 'Diameters comply with NPS standards',
      'pages_plumbing_normes.html_pentes-adequates-18-38pi': 'Adequate slopes (1/8-3/8"/ft)',
      'pages_plumbing_normes.html_ventilation-primaire-et-secondaire': 'Primary and secondary ventilation',
      'pages_plumbing_normes.html_siphons-aux-points-requis': 'Traps at required points',
      'pages_plumbing_normes.html_raccords-etanches': 'Watertight connections',
      'pages_plumbing_normes.html_separation-eaux-usees-pluviales': 'Separation of wastewater/stormwater',
      'pages_plumbing_normes.html_regard-de-visite-accessible': 'Accessible inspection port',
      'pages_plumbing_normes.html_clapet-anti-refoulement-si-requis': 'Backflow preventer if required',
      'pages_plumbing_normes.html_1-12-lavabo-bidet': '1-1/2"\n                                        Sink, bidet',
      'pages_plumbing_normes.html_2-douche-baignoire-evier-lave-linge': '2"\n                                        Shower, bathtub, basin, washing machine',
      'pages_plumbing_normes.html_3-toilettes': '3"\n                                        Toilets',
      'pages_plumbing_normes.html_4-collecteur-principal': '4"\n                                        Main collector',
      'pages_plumbing_normes.html_3-descente-pluviale-standard': '3"\n                                        Standard storm drain',
      'pages_plumbing_normes.html_4-grande-surface-de-toiture': '4"\n                                        Large roof area',
      'pages_plumbing_normes.html_4-collecteur-pluvial-principal': '4"+\n                                        Main storm collector',
      'pages_plumbing_normes.html_remplacement-de-la-valve-dentree-prin': '• Replacement of main inlet valve',
      'pages_plumbing_normes.html_raccordement-au-reseau-daqueduc': '• Connection to water main',
      'pages_plumbing_normes.html_modification-majeure-du-systeme-devac': '• Major modification to drainage system',
      'pages_plumbing_normes.html_installation-de-nouvelles-conduites': '• Installation of new pipes',
      'pages_plumbing_normes.html_travaux-touchant-le-collecteur-princip': '• Work affecting main collector',
      'pages_plumbing_normes.html_branchement-au-reseau-degout-municipa': '• Connection to municipal sewer system',
      'pages_plumbing_normes.html_bon-fonctionnement': 'proper operation',
      'pages_plumbing_normes.html_engorgements': 'blockages',
      'pages_plumbing_normes.html_conformite_1': 'compliance',
      'pages_plumbing_normes.html_nps-nominal-pipe-size': 'NPS (Nominal Pipe Size)',
      'pages_plumbing_normes.html_important': 'Important:',
      'pages_plumbing_normes.html_diametre-minimum': 'minimum diameter',
      'pages_plumbing_normes.html_debit-devacuation': 'drainage flow',
      'pages_plumbing_normes.html_ue-unite-devacuation': '*DFU = Drainage Fixture Unit',
      'pages_plumbing_normes.html_jamais-depasser-le-diametre-du-tuyau-en': 'never exceed pipe diameter in height',
      'pages_plumbing_normes.html_conseil': 'Tip:',
      'pages_plumbing_normes.html_astuce': '💡 Tip:',
      'pages_plumbing_normes.html_eaux-sanitaires_1': 'sanitary water',
      'pages_plumbing_normes.html_eaux-pluviales_1': 'stormwater',
      'pages_plumbing_normes.html_note-importante': '💧 Important note:',
      'pages_plumbing_normes.html_separement': 'separately',
      'pages_plumbing_normes.html_attention': '⚠️ Warning:',
      'pages_plumbing_normes.html_normes-de-plomberie-or-guide-pratique-de': 'Plumbing Standards | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_normes.html_plumbing-standards-or-practical-plumbing': 'Plumbing Standards | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_normes.html_nps': 'NPS',
      'pages_plumbing_normes.html_pouces': 'inches',
      'pages_plumbing_normes.html_appareil-sanitaire': 'Sanitary Fixture',
      'pages_plumbing_normes.html_nps-min': 'Min. NPS',
      'pages_plumbing_normes.html_nps-recommande': 'Recommended NPS',
      'pages_plumbing_normes.html_wc-toilettes': 'WC (toilets)',
      'pages_plumbing_normes.html_douche-baignoire': 'Shower / Bathtub',
      'pages_plumbing_normes.html_lavabo': 'Sink',
      'pages_plumbing_normes.html_evier-de-cuisine': 'Kitchen Sink',
      'pages_plumbing_normes.html_lave-linge': 'Washing Machine',
      'pages_plumbing_normes.html_lave-vaisselle': 'Dishwasher',
      'pages_plumbing_normes.html_bidet': 'Bidet',
      'pages_plumbing_normes.html_collecteur-principal_1': 'Main Collector',
      'pages_plumbing_normes.html_appareil': 'Fixture',
      'pages_plumbing_normes.html_debit-ls': 'Flow (L/s)',
      'pages_plumbing_normes.html_ue': 'DFU*',
      'pages_plumbing_normes.html_wc-avec-reservoir': '🚽 WC with tank',
      'pages_plumbing_normes.html_15-ls': '1.5 L/s',
      'pages_plumbing_normes.html_4-ue': '4 DFU',
      'pages_plumbing_normes.html_baignoire': '🛁 Bathtub',
      'pages_plumbing_normes.html_09-ls': '0.9 L/s',
      'pages_plumbing_normes.html_2-ue': '2 DFU',
      'pages_plumbing_normes.html_douche': '🚿 Shower',
      'pages_plumbing_normes.html_05-ls': '0.5 L/s',
      'pages_plumbing_normes.html_2-ue_1': '2 DFU',
      'pages_plumbing_normes.html_lavabo_1': '🧼 Sink',
      'pages_plumbing_normes.html_05-ls_1': '0.5 L/s',
      'pages_plumbing_normes.html_1-ue': '1 DFU',
      'pages_plumbing_normes.html_evier-de-cuisine_1': '🍽️ Kitchen sink',
      'pages_plumbing_normes.html_075-ls': '0.75 L/s',
      'pages_plumbing_normes.html_2-ue_2': '2 DFU',
      'pages_plumbing_normes.html_lave-linge_1': '🧺 Washing machine',
      'pages_plumbing_normes.html_08-ls': '0.8 L/s',
      'pages_plumbing_normes.html_3-ue': '3 DFU',
      'pages_plumbing_normes.html_lave-vaisselle_1': '🍴 Dishwasher',
      'pages_plumbing_normes.html_06-ls': '0.6 L/s',
      'pages_plumbing_normes.html_2-ue_3': '2 DFU',
      'pages_plumbing_normes.html_diametre': 'Diameter',
      'pages_plumbing_normes.html_pente-14pi-ideale': 'Slope 1/4"/ft (ideal)',
      'pages_plumbing_normes.html_pente-18pi-min': 'Slope 1/8"/ft (min)',
      'pages_plumbing_normes.html_max': 'Max',
      'pages_plumbing_normes.html_14pi-max': '1/4"/ft max',
      'pages_plumbing_normes.html_116pi-min': '1/16"/ft min',
      
      // Plumbing Drainage Section
      'pages_plumbing_drainage.html_introduction': 'Introduction',
      'pages_plumbing_drainage.html_les-4-circuits': 'The 4 Circuits',
      'pages_plumbing_drainage.html_systeme-dalimentation': 'Supply System',
      'pages_plumbing_drainage.html_compteur-et-vanne': 'Meter and Valve',
      'pages_plumbing_drainage.html_evacuation': 'Drainage',
      'pages_plumbing_drainage.html_role-des-siphons': 'Role of Traps',
      'pages_plumbing_drainage.html_pente-devacuation': 'Drainage Slope',
      'pages_plumbing_drainage.html_ventilation': 'Ventilation',
      'pages_plumbing_drainage.html_reperer-vos-circuits': 'Locate Your Circuits',
      'pages_plumbing_drainage.html_alimentation-en-eau': '→ Water Supply',
      'pages_plumbing_drainage.html_debouchage': '→ Unclogging',
      'pages_plumbing_drainage.html_normes-plomberie': '→ Plumbing Codes',
      'pages_plumbing_drainage.html_demander-un-devis': 'REQUEST A QUOTE',
      'pages_plumbing_drainage.html_les-4-circuits-de-votre-plomberie': 'YOUR PLUMBING\'S 4 CIRCUITS',
      'pages_plumbing_drainage.html_1-systeme-dalimentation': '1\n                        SUPPLY SYSTEM',
      'pages_plumbing_drainage.html_compteur-et-vanne-darret': '!\n                        METER AND SHUT-OFF VALVE',
      'pages_plumbing_drainage.html_2-systeme-devacuation': '2\n                        DRAINAGE SYSTEM',
      'pages_plumbing_drainage.html_le-role-des-siphons': 'THE ROLE OF TRAPS',
      'pages_plumbing_drainage.html_3-systeme-de-ventilation': '3\n                        VENTILATION SYSTEM',
      'pages_plumbing_drainage.html_4-reperer-vos-circuits': '4\n                        LOCATE YOUR CIRCUITS',
      'pages_plumbing_drainage.html_table-des-matieres': 'TABLE OF CONTENTS',
      'pages_plumbing_drainage.html_eau-froide': 'COLD WATER',
      'pages_plumbing_drainage.html_eau-chaude': 'HOT WATER',
      'pages_plumbing_drainage.html_evacuation_1': 'DRAINAGE',
      'pages_plumbing_drainage.html_ventilation_1': 'VENTILATION',
      'pages_plumbing_drainage.html_localiser-le-compteur-et-la-vanne-pri': '📍 Locate meter and main valve',
      'pages_plumbing_drainage.html_identifier-les-colonnes-montantes': '📍 Identify rising columns',
      'pages_plumbing_drainage.html_reperer-les-evacuations': '📍 Locate drains',
      'pages_plumbing_drainage.html_avant-deffectuer-des-travaux': '🔧 BEFORE DOING WORK',
      'pages_plumbing_drainage.html_besoin-dun-professionnel': 'NEED A PROFESSIONAL?',
      'pages_plumbing_drainage.html_autres-sections': 'OTHER SECTIONS',
      'pages_plumbing_drainage.html_a-retenir': 'KEY POINTS',
      'pages_plumbing_drainage.html_cas-particulier-double-circuit-dea': '💧 Special case: double cold water circuit',
      'pages_plumbing_drainage.html_points-de-controle-essentiels': 'ESSENTIAL CHECKPOINTS',
      'pages_plumbing_drainage.html_3-tuyaux-3-76-mm': '≤3"\n                                Pipes ≤ 3" (≤ 76 mm)',
      'pages_plumbing_drainage.html_4-tuyaux-4-100-mm': '≥4"\n                                Pipes ≥ 4" (≥ 100 mm)',
      'pages_plumbing_drainage.html_pourquoi-la-ventilation-est-elle-ind': '🌬️ Why is ventilation essential?',
      'pages_plumbing_drainage.html_ventilation-primaire': 'PRIMARY VENTILATION',
      'pages_plumbing_drainage.html_ventilation-secondaire': 'SECONDARY VENTILATION',
      'pages_plumbing_drainage.html_en-maison-individuelle': '🏠 In single-family home',
      'pages_plumbing_drainage.html_en-appartement': '🏢 In apartment',
      'pages_plumbing_drainage.html_le-compteur': '📊 The Meter',
      'pages_plumbing_drainage.html_la-vanne-darret': '🔴 The Shut-off Valve',
      'pages_plumbing_drainage.html_avant-de-se-lancer-dans-des-travaux-de-p': 'Before starting plumbing work, it is important to know your plumbing system well. Where do these pipes go? Which ones contain clean water and which ones discharge wastewater?',
      'pages_plumbing_drainage.html_cette-connaissance-devient-cruciale-en-c': 'This knowledge becomes crucial in case of leak or emergency. In a house, four circuits allow water to circulate: cold and hot water distribution, pipe ventilation and wastewater drainage.',
      'pages_plumbing_drainage.html_distribution-de-leau-potable-froide-dep': 'Distribution of cold potable water from public network to all water points in the house.',
      'pages_plumbing_drainage.html_apres-passage-par-le-chauffe-eau-leau': 'After passing through water heater, hot water is distributed to faucets, showers and appliances.',
      'pages_plumbing_drainage.html_collecte-et-acheminement-des-eaux-usees': 'Collection and transport of wastewater to sewers or septic tank.',
      'pages_plumbing_drainage.html_circulation-dair-dans-les-canalisations': 'Air circulation in pipes to maintain pressure and evacuate odors.',
      'pages_plumbing_drainage.html_generalement-les-habitations-sont-racco': 'Generally, homes are connected to the city supply system. Water, transported via the service pipe, is then distributed through water columns to all connections in different rooms.',
      'pages_plumbing_drainage.html_apres-raccordement-au-systeme-de-chauffe': 'After connection to the water heater system, pipes split into hot water and cold water systems.',
      'pages_plumbing_drainage.html_il-existe-parfois-deux-circuits-deau-fr': 'Sometimes there are two cold water circuits, which separate potable water from utility water (for watering or toilets for example), but this is rare in residential homes.',
      'pages_plumbing_drainage.html_cest-au-niveau-du-raccordement-entre-le': 'It is at the connection between the general system and the building\'s that two essential elements are found:',
      'pages_plumbing_drainage.html_mesure-votre-consommation-deau-il-appa': 'Measures your water consumption. It belongs to your water company and is used to calculate your bill.',
      'pages_plumbing_drainage.html_generalement-situee-juste-apres-le-compt': 'Generally located just after the meter, it comes in the form of a faucet or a quarter-turn handle.',
      'pages_plumbing_drainage.html_en-cas-de-fuite-importante-savoir-lo': '⚠️ In case of major leak, knowing where to find this valve can save you from flooding. Every second counts!',
      'pages_plumbing_drainage.html_a-la-sortie-des-appareils-machines-a-la': 'At the outlet of appliances (washing machines, sinks, toilets, etc.) pipes collect wastewater. All wastewater pipes discharge into the same column of the plumbing system to be transported to the main drain collector, and finally discharged into the city sewer system.',
      'pages_plumbing_drainage.html_chaque-appareil-sanitaire-est-equipe-du': 'Each sanitary fixture is equipped with a trap, in a "U" shape. It retains a certain amount of water to prevent foul air from rising.',
      'pages_plumbing_drainage.html_cette-garde-deau-forme-une-barriere-con': 'This water seal forms a barrier against sewer odors.',
      'pages_plumbing_drainage.html_une-colonne-de-ventilation-permet-la-cir': 'A vent stack allows air circulation and maintains constant pressure throughout the drainage circuit. This vertical pipe opens onto the roof and creates air circulation in the circuit and expels foul air.',
      'pages_plumbing_drainage.html_il-ny-a-pas-de-bonne-evacuation-des-eau': 'There is no proper wastewater drainage without effective primary ventilation. Its purpose is to prevent pressure variations in wastewater drain columns.',
      'pages_plumbing_drainage.html_sans-ventilation-adequate-le-passage-d': 'Without adequate ventilation: the passage of a large mass of water creates strong suction that sucks out the trap\'s water seal, which rises and spreads bad odors in the room.',
      'pages_plumbing_drainage.html_les-colonnes-de-chute-doivent-etre-prolo': 'Drain columns must extend through the roof to open air. It promotes proper flow and prevents siphoning effect.',
      'pages_plumbing_drainage.html_dans-certaines-configurations-complexes': 'In some complex configurations, secondary ventilation can be added to serve fixtures far from the main column.',
      'pages_plumbing_drainage.html_identifiez-la-vanne-darret-des-maint': '⚠️ Identify the shut-off valve now and check that it works!',
      'pages_plumbing_drainage.html_dans-les-habitations-a-etages-les-colon': 'In multi-story homes, rising columns are vertical pipes that distribute water or collect wastewater. They are often hidden in partitions, but you can spot them:',
      'pages_plumbing_drainage.html_les-evacuations-partent-horizontalement': 'Drains run horizontally from each fixture and join a vertical column. Drain pipes are usually gray or white PVC, wider than supply pipes (diameters from 1-1/4" to 4" (32 to 100 mm)).',
      'pages_plumbing_drainage.html_de-nos-jours-les-canalisations-devacua': 'Nowadays, drain pipes are made of plastic materials, most often PVC or ABS in light residential, and no longer lead.',
      'pages_plumbing_drainage.html_les-arrivees-deau-peuvent-etre-faites-d': 'Water supply lines can be made of polyethylene or polypropylene, light and inexpensive. Copper pipes, very resistant and less noisy, are heavier and harder to handle.',
      'pages_plumbing_drainage.html_noubliez-pas-de-couper-larrivee-gen': '⚠️ Don\'t forget to shut off the main water supply before any work, at your basement level or apartment entrance.',
      'pages_plumbing_drainage.html_pour-plus-de-serenite-lors-de-vos-travau': 'For peace of mind during your work, contact a qualified plumber.',
      'pages_plumbing_drainage.html_votre-plomberie-comprend-4-circuits-dist': 'Your plumbing includes 4 distinct circuits: cold water, hot water, drainage and ventilation.',
      'pages_plumbing_drainage.html_la-vanne-darret-generale-coupe-toute-l': 'The main shut-off valve cuts all water to the house in case of emergency.',
      'pages_plumbing_drainage.html_la-ventilation-primaire-debouchant-sur-l': 'The primary vent opening onto the roof prevents odor backups.',
      'pages_plumbing_drainage.html_savoir-localiser-vos-circuits-facilite-l': 'Knowing how to locate your circuits facilitates interventions.',
      'pages_plumbing_drainage.html_au-sous-sol': '• In basement',
      'pages_plumbing_drainage.html_dans-le-garage': '• In garage',
      'pages_plumbing_drainage.html_dans-un-regard-exterieur-pres-de-la-ru': '• In outdoor pit near street',
      'pages_plumbing_drainage.html_dans-les-parties-communes-cave-local': '• In common areas (basement, mechanical room)',
      'pages_plumbing_drainage.html_parfois-dans-lappartement-pres-de-le': '• Sometimes in apartment near entrance',
      'pages_plumbing_drainage.html_dans-les-gaines-techniques-souvent-da': '→\n                                    In technical shafts (often in bathroom or kitchen)',
      'pages_plumbing_drainage.html_le-long-des-murs-dans-les-caves-ou-sou': '→\n                                    Along walls in basements or cellars',
      'pages_plumbing_drainage.html_par-le-bruit-de-leau-qui-circule-quan': '→\n                                    By the sound of water flowing when you open a faucet upstairs',
      'pages_plumbing_drainage.html_4-circuits-distincts': '4 distinct circuits',
      'pages_plumbing_drainage.html_vanne-darret-generale': 'main shut-off valve',
      'pages_plumbing_drainage.html_ventilation-primaire_1': 'primary ventilation',
      'pages_plumbing_drainage.html_localiser-vos-circuits': 'locate your circuits',
      'pages_plumbing_drainage.html_quatre-circuits': 'four circuits',
      'pages_plumbing_drainage.html_canalisation-de-branchement': 'service pipe',
      'pages_plumbing_drainage.html_colonnes-deau': 'water columns',
      'pages_plumbing_drainage.html_colonne-du-systeme-de-plomberie': 'plumbing system column',
      'pages_plumbing_drainage.html_siphon': 'trap',
      'pages_plumbing_drainage.html_garde-deau': 'water seal',
      'pages_plumbing_drainage.html_important': '⚠️ Important:',
      'pages_plumbing_drainage.html_pente-minimale': 'minimum slope',
      'pages_plumbing_drainage.html_attention': '⚠️ Warning:',
      'pages_plumbing_drainage.html_colonne-de-ventilation': 'vent stack',
      'pages_plumbing_drainage.html_sans-ventilation-adequate': 'Without adequate ventilation:',
      'pages_plumbing_drainage.html_pvc-gris-ou-blanc': 'gray or white PVC',
      'pages_plumbing_drainage.html_pvc-ou-en-abs': 'PVC or ABS',
      'pages_plumbing_drainage.html_polyethylene-ou-de-polypropylene': 'polyethylene or polypropylene',
      'pages_plumbing_drainage.html_systeme-de-drainage-or-guide-pratique-de': 'Drainage System | Practical Plumbing Guide | Unclogger Expert',
      'pages_plumbing_drainage.html_drainage-system-or-practical-plumbing-gui': 'Drainage System | Practical Plumbing Guide | Unclogged Me',
      'pages_plumbing_drainage.html_sans-siphon-fonctionnel-votre-salle-de': 'Without a functioning trap, your bathroom would quickly stink!',
      
      // Common Components - Navbar
      'pages_plumbing_components_navbar.html_accueil': 'HOME',
      'pages_plumbing_components_navbar.html_tarification': 'PRICING',
      'pages_plumbing_components_navbar.html_guide': 'GUIDE',
      'pages_plumbing_components_navbar.html_evenements': 'EVENTS',
      'pages_plumbing_components_navbar.html_outils': 'TOOLS',
      'pages_components_navbar.html_accueil': 'HOME',
      'pages_components_navbar.html_tarification': 'PRICING',
      'pages_components_navbar.html_guide': 'GUIDE',
      'pages_components_navbar.html_evenements': 'EVENTS',
      'pages_components_navbar.html_outils': 'TOOLS',
      'pages_errors_components_navbar.html_accueil': 'HOME',
      'pages_errors_components_navbar.html_tarification': 'PRICING',
      'pages_errors_components_navbar.html_guide': 'GUIDE',
      'pages_errors_components_navbar.html_evenements': 'EVENTS',
      'pages_errors_components_navbar.html_outils': 'TOOLS',
      'pages_errors_codes_components_navbar.html_accueil': 'HOME',
      'pages_errors_codes_components_navbar.html_tarification': 'PRICING',
      'pages_errors_codes_components_navbar.html_guide': 'GUIDE',
      'pages_errors_codes_components_navbar.html_evenements': 'EVENTS',
      'pages_errors_codes_components_navbar.html_outils': 'TOOLS',
      
      // Common Components - Helper (AI Chat)
      'pages_plumbing_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_plumbing_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_plumbing_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_plumbing_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_index_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_index_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_index_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_index_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_errors_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_errors_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_errors_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_errors_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      'pages_errors_codes_components_helper.html_phposez-une-question': 'Ask a question...',
      'pages_errors_codes_components_helper.html_apprenti-deboucheur': 'Apprentice Unclogger',
      'pages_errors_codes_components_helper.html_assistant-ia-and-diagnostic': 'AI Assistant & Diagnostics',
      'pages_errors_codes_components_helper.html_bonjour-je-suis-lassistant-virtuel-de': 'Hello! I am Billy\'s virtual assistant. I can answer your questions or analyze a photo of your plumbing problem! 🛠️📸',
      
      // Common Components - Footer
      'pages_plumbing_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_plumbing_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_plumbing_components_footer.html_equipe': 'Team',
      'pages_plumbing_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_plumbing_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_components_footer.html_equipe': 'Team',
      'pages_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_index_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_index_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_index_components_footer.html_equipe': 'Team',
      'pages_index_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_index_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_errors_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_errors_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_errors_components_footer.html_equipe': 'Team',
      'pages_errors_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_errors_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      'pages_errors_codes_components_footer.html_politique-de-confidentialite': 'Privacy Policy',
      'pages_errors_codes_components_footer.html_conditions-dutilisation': 'Terms of Use',
      'pages_errors_codes_components_footer.html_equipe': 'Team',
      'pages_errors_codes_components_footer.html_billy-st-hilaire': 'BILLY ST-HILAIRE',
      'pages_errors_codes_components_footer.html_c-2025-deboucheur-expert': '© 2025 Unclogger Expert',
      
      // Common Components - Hero
      'pages_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_errors_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_errors_codes_components_hero.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_components_template.html_deboucheur-expert': 'UNCLOGGER EXPERT',
      'pages_index_components_hero.html_billy-st-hilaire': 'BILLY ST-HILAIRE,',
      
      // Error Pages
      'pages_errors_offline.html_hors-ligne-or-deboucheur-expert': 'OFFLINE | Unclogger Expert',
      'pages_errors_offline.html_offline': 'OFFLINE',
      'pages_errors_codes_504.html_504-delai-passerelle-or-deboucheur-expe': '504 - GATEWAY TIMEOUT | Unclogger Expert',
      'pages_errors_codes_503.html_503-service-indisponible-or-deboucheur': '503 - SERVICE UNAVAILABLE | Unclogger Expert',
      'pages_errors_codes_502.html_502-mauvaise-passerelle-or-deboucheur-e': '502 - BAD GATEWAY | Unclogger Expert',
      'pages_errors_codes_500.html_500-erreur-serveur-or-deboucheur-expert': '500 - SERVER ERROR | Unclogger Expert',
      'pages_errors_codes_429.html_429-trop-de-requetes-or-deboucheur-expe': '429 - TOO MANY REQUESTS | Unclogger Expert',
      'pages_errors_codes_410.html_410-ressource-supprimee-or-deboucheur-e': '410 - RESOURCE GONE | Unclogger Expert',
      'pages_errors_codes_408.html_408-delai-depasse-or-deboucheur-expert': '408 - REQUEST TIMEOUT | Unclogger Expert',
      'pages_errors_codes_404.html_404-page-introuvable-or-deboucheur-expe': '404 - PAGE NOT FOUND | Unclogger Expert',
      'pages_errors_codes_403.html_403-acces-interdit-or-deboucheur-expert': '403 - ACCESS FORBIDDEN | Unclogger Expert',
      'pages_errors_codes_401.html_401-non-autorise-or-deboucheur-expert': '401 - UNAUTHORIZED | Unclogger Expert',
      'pages_errors_codes_400.html_400-requete-invalide-or-deboucheur-expe': '400 - INVALID REQUEST | Unclogger Expert'
    });

    // Apply translations after merge
    if (Language.apply) {
      setTimeout(() => {
        try { Language.apply(); } catch(e) { console.error('Apply error:', e); }
      }, 200);
    }
  } catch(e) {
    console.error('Translation merge failed:', e);
  }
}

// Language.apply override for robust translation handling
if (typeof Language !== 'undefined') {
  Language.apply = (function(original) {
    return function() {
      const lang = this.current || (localStorage && localStorage.getItem('language')) || 'fr';
      const trans = (this.translations && this.translations[lang]) || {};

      // Handle data-translate elements
      try {
        document.querySelectorAll('[data-translate]').forEach(el => {
          const key = el.getAttribute('data-translate');
          if (!key) return;
          const value = trans[key];
          if (!value) return;

          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
              el.placeholder = value;
            } else {
              el.value = value;
            }
          } else {
            if (typeof value === 'string' && value.includes('<') && value.includes('>')) {
              el.innerHTML = value;
            } else {
              el.innerText = value;
            }
          }
        });
      } catch(e) {
        console.error('data-translate error:', e);
      }

      // Handle data-translate-placeholder
      try {
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
          const key = el.getAttribute('data-translate-placeholder');
          if (!key) return;
          const value = trans[key];
          if (value && el.placeholder !== undefined) {
            el.placeholder = value;
          }
        });
      } catch(e) {
        console.error('placeholder translation error:', e);
      }

      // Update page title
      try {
        if (trans.page_title) {
          const baseTitle = document.title.includes('|') 
            ? document.title.split('|')[1].trim() 
            : document.title;
          document.title = trans.page_title + ' | ' + baseTitle;
        }
      } catch(e) {
        console.error('title translation error:', e);
      }

      // Call original apply if it existed
      if (typeof original === 'function') {
        try { original.call(this); } catch(e) {}
      }
    };
  })(Language.apply);
}
