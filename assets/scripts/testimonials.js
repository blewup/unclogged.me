/**
 * Déboucheur Expert - Testimonials Module
 * Enhanced carousel with intersection observer
 * @version 2.0.0
 * @author Déboucheur Expert Team
 */

const TestimonialsModule = (() => {
    // Configuration
    const CONFIG = Object.freeze({
        autoRotateInterval: 12000,
        animationDuration: 700,
        minItemsPerPage: 2,
        maxItemsPerPage: 4,
        aspectRatioBreakpoints: {
            ultrawide: 1.7,
            wide: 0.9
        }
    });

    // Testimonial data
    const testimonials = Object.freeze([
        { name: "JEAN TREMBLAY", img: "assets/images/clients/client_00.png", stars: 5, text: "Service impeccable! Billy est arrivé rapidement et a réglé le problème en un rien de temps. Je recommande fortement pour tous vos besoins de plomberie résidentielle." },
        { name: "SOPHIE LAPOINTE", img: "assets/images/clients/client_01.png", stars: 5, text: "Très rapide et courtois. Le travail a été fait proprement, sans laisser de traces. Une expérience client fantastique du début à la fin. Merci encore!" },
        { name: "MARC GAGNON", img: "assets/images/clients/client_02.png", stars: 4, text: "Bon travail sur la tuyauterie de ma cuisine. Le prix était juste et le délai respecté. Je n'hésiterai pas à rappeler pour d'autres travaux." },
        { name: "PIERRETTE BOUCHER", img: "assets/images/clients/client_03.png", stars: 5, text: "Aucun frais caché, ce qui est rare de nos jours. Billy est honnête et compétent. Merci pour le service d'urgence un dimanche." },
        { name: "JULIE ROY", img: "assets/images/clients/client_04.png", stars: 5, text: "Courtois et professionnel. Il a pris le temps de m'expliquer le problème et la solution. Très satisfaite du résultat final." },
        { name: "LUC MARTIN", img: "assets/images/clients/client_05.png", stars: 4, text: "Efficace et rapide. Le débouchage a été fait en quelques minutes. Un vrai expert qui connait son métier sur le bout des doigts." },
        { name: "ISABELLE COTE", img: "assets/images/clients/client_06.png", stars: 5, text: "Je ne ferai affaire qu'avec lui dorénavant. Un service de qualité supérieure, une ponctualité exemplaire et un tarif très compétitif." },
        { name: "ERIC LAVOIE", img: "assets/images/clients/client_07.png", stars: 5, text: "Compétent et honnête. Une rareté dans le domaine de la construction. Il a réparé une fuite que d'autres n'avaient pas trouvée." }
    ]);

    // State
    let currentSlide = 0;
    let autoRotateTimer = null;
    let isPaused = false;
    let isVisible = false;

    // DOM helpers
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // Calculate items per page based on aspect ratio
    const getItemsPerPage = () => {
        const ratio = window.innerWidth / window.innerHeight;
        if (ratio >= CONFIG.aspectRatioBreakpoints.ultrawide) return 4;
        if (ratio >= CONFIG.aspectRatioBreakpoints.wide) return 3;
        return CONFIG.minItemsPerPage;
    };

    // SVG star icons for ratings (inline to avoid FA dependency)
    const STAR_ICONS = Object.freeze({
        full: '<svg class="w-4 h-4 md:w-5 md:h-5 inline-block" viewBox="0 0 576 512" fill="currentColor"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L380.9 150.3 316.9 18z"/></svg>',
        half: '<svg class="w-4 h-4 md:w-5 md:h-5 inline-block" viewBox="0 0 576 512" fill="currentColor"><path d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 136 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>',
        empty: '<svg class="w-4 h-4 md:w-5 md:h-5 inline-block opacity-30" viewBox="0 0 576 512" fill="currentColor"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L380.9 150.3 316.9 18z"/></svg>'
    });

    // Render star ratings with inline SVG
    const renderStars = (count) => {
        const fullStars = Math.floor(count);
        const halfStar = count % 1 >= 0.5;
        let html = '';
        for (let i = 0; i < fullStars; i++) html += STAR_ICONS.full;
        if (halfStar) html += STAR_ICONS.half;
        for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) html += STAR_ICONS.empty;
        return html;
    };

    // Create testimonial card HTML
    const createCard = (t, index, widthPercent) => {
        return `
            <div class="flex-shrink-0 p-4 testimonial-card h-[60vh]" style="width: ${widthPercent}%;" data-index="${index}">
                <div class="bg-white dark:bg-gray-800 p-4 box-radius shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center text-center overflow-hidden justify-between">
                    <img src="${t.img}" onerror="this.src='assets/images/clients/client_00.png'" 
                         class="w-20 h-20 box-radius object-cover mb-2 testimonial-img-shadow aspect-square" 
                         alt="Photo de ${t.name}" loading="lazy">
                    <div class="flex-grow flex flex-col justify-center">
                        <h4 class="font-impact text-base md:text-lg text-gray-900 dark:text-white truncate w-full">${t.name}</h4>
                        <div class="text-yellow-400 text-sm md:text-base mb-1">${renderStars(t.stars)}</div>
                        <p class="font-comic text-sm md:text-base text-gray-600 dark:text-gray-300 overflow-y-auto max-h-[30vh] scrollbar-thin">"${t.text}"</p>
                    </div>
                </div>
            </div>
        `;
    };

    // Render all testimonials
    const render = () => {
        const track = $('#testimonial-track');
        const dotsContainer = $('#testimonial-dots');
        if (!track || !dotsContainer) return;

        const itemsPerPage = getItemsPerPage();
        const widthPercent = 100 / itemsPerPage;

        // Triple the testimonials for infinite scroll effect
        const displayList = [...testimonials, ...testimonials, ...testimonials];
        track.innerHTML = displayList.map((t, i) => createCard(t, i % testimonials.length, widthPercent)).join('');

        // Create navigation dots
        dotsContainer.innerHTML = testimonials.map((_, i) => `
            <div class="w-2 h-2 rounded-full ${i === currentSlide % testimonials.length ? 'bg-websiteBlue' : 'bg-gray-400'} cursor-pointer transition-colors duration-300" 
                 data-slide="${i}" role="button" aria-label="Témoignage ${i + 1}"></div>
        `).join('');

        // Add click handlers to dots
        dotsContainer.querySelectorAll('[data-slide]').forEach(dot => {
            dot.addEventListener('click', () => {
                currentSlide = parseInt(dot.dataset.slide);
                update();
                pauseAutoRotate();
            });
        });

        updateActiveCard();
    };

    // Update carousel position
    const update = () => {
        const track = $('#testimonial-track');
        const dotsContainer = $('#testimonial-dots');
        if (!track) return;

        const itemsPerPage = getItemsPerPage();
        const widthPercent = 100 / itemsPerPage;
        track.style.transform = `translateX(-${currentSlide * widthPercent}%)`;

        // Update dots
        if (dotsContainer) {
            dotsContainer.querySelectorAll('[data-slide]').forEach((dot, i) => {
                dot.classList.toggle('bg-websiteBlue', i === currentSlide % testimonials.length);
                dot.classList.toggle('bg-gray-400', i !== currentSlide % testimonials.length);
            });
        }

        updateActiveCard();
    };

    // Update active card styling
    const updateActiveCard = () => {
        const cards = $$('.testimonial-card');
        const itemsPerPage = getItemsPerPage();
        const activeOffset = itemsPerPage === 2 ? 1 : 1;

        cards.forEach(card => card.classList.remove('active-card'));
        const activeCard = cards[currentSlide + activeOffset];
        if (activeCard) activeCard.classList.add('active-card');
    };

    // Auto-rotate functions
    const startAutoRotate = () => {
        if (isPaused || !isVisible) return;
        stopAutoRotate();
        autoRotateTimer = setInterval(() => {
            if (!isPaused && isVisible) {
                currentSlide++;
                if (currentSlide >= testimonials.length * 2) {
                    const track = $('#testimonial-track');
                    if (track) {
                        track.style.transition = 'none';
                        currentSlide = 0;
                        track.style.transform = 'translateX(0)';
                        setTimeout(() => {
                            track.style.transition = `transform ${CONFIG.animationDuration}ms ease-in-out`;
                        }, 50);
                    }
                } else {
                    update();
                }
            }
        }, CONFIG.autoRotateInterval);
    };

    const stopAutoRotate = () => {
        if (autoRotateTimer) {
            clearInterval(autoRotateTimer);
            autoRotateTimer = null;
        }
    };

    const pauseAutoRotate = () => {
        isPaused = true;
        stopAutoRotate();
        setTimeout(() => {
            isPaused = false;
            startAutoRotate();
        }, CONFIG.autoRotateInterval * 3);
    };

    // Intersection Observer for visibility
    const setupVisibilityObserver = () => {
        const section = $('#temoignages');
        if (!section || !('IntersectionObserver' in window)) {
            isVisible = true;
            startAutoRotate();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) startAutoRotate();
                else stopAutoRotate();
            });
        }, { threshold: 0.3 });

        observer.observe(section);
    };

    // Handle resize
    const handleResize = () => {
        render();
        update();
    };

    // Initialize
    const init = () => {
        render();
        setupVisibilityObserver();
        window.addEventListener('resize', handleResize);
        console.debug('TestimonialsModule initialized');
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init,
        render,
        update,
        goTo: (index) => { currentSlide = index; update(); },
        next: () => { currentSlide++; update(); },
        prev: () => { currentSlide = Math.max(0, currentSlide - 1); update(); },
        pause: pauseAutoRotate,
        getTestimonials: () => [...testimonials]
    };
})();

// Global export
window.TestimonialsModule = TestimonialsModule;
