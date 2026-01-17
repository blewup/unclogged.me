/**
 * Déboucheur Expert - AI Chat Module
 * Enhanced chatbot with Gemini AI integration
 * @version 2.1.0
 * @author Déboucheur Expert Team
 */

const ChatModule = (() => {
    // Configuration - API key loaded dynamically from backend
    const CONFIG = {
        apiKey: null, // Will be fetched from api/config.php
        model: 'gemini-2.5-flash-preview-09-2025',
        maxRetries: 3,
        retryDelay: 1000,
        maxMessageLength: 2000,
        acceptedImageTypes: ['image/jpeg', 'image/png'],
        maxImageSize: 5 * 1024 * 1024, // 5MB
        configEndpoint: 'api/config.php' // Backend config endpoint
    };
    
    // Fetch API configuration from backend
    let configLoaded = false;
    const loadConfig = async () => {
        if (configLoaded && CONFIG.apiKey) return true;
        
        try {
            // Determine base path (works from index.html or subpages)
            const isSubpage = window.location.pathname.includes('/pages/');
            const basePath = isSubpage ? '../' : '';
            
            const response = await fetch(`${basePath}${CONFIG.configEndpoint}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Config fetch failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.gemini?.apiKey) {
                CONFIG.apiKey = data.gemini.apiKey;
                CONFIG.model = data.gemini.model || CONFIG.model;
                configLoaded = true;
                console.log('Chat config loaded successfully');
                return true;
            }
            throw new Error('Invalid config response');
        } catch (error) {
            console.error('Failed to load chat config:', error);
            // Fallback for development only
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('Using fallback config for development');
                CONFIG.apiKey = 'AIzaSyCShzljUGrqSmhLDisfdliIitd9cXFRQZ0';
                return true;
            }
            return false;
        }
    };

    // Language-specific system prompts
    const SYSTEM_PROMPTS = {
        fr: `Tu es 'L'Apprenti de Billy', un assistant virtuel expert en plomberie résidentielle pour Billy St-Hilaire, Déboucheur Expert basé à Montréal et Montérégie.

SERVICES ET TARIFS:
- Débouchage: 200-640$/h selon complexité
- Rénovation plomberie (salle de bain, cuisine)
- Inspection caméra HD avec rapport détaillé
- Urgences 24/7 disponibles

OUTILS PROFESSIONNELS:
- Furet électrique professionnel
- Hydrocureur haute pression
- Caméra d'inspection HD
- Équipement de soudure (MIG, TIG, SMAW)

DÉLAIS DE RÉPONSE:
- SMS: 0-12 heures
- Messagerie vocale: 12-24 heures
- Courriel: 24-48 heures

COMPORTEMENT:
- Sois amical et professionnel
- Réponds TOUJOURS en français
- Pour les urgences, incite à appeler (438) 530-2343
- Dirige vers deboucheur.expert pour plus d'infos
- Si une photo est envoyée, analyse le problème de plomberie visible
- Ne donne pas de conseils dangereux (électricité, gaz)`,

        en: `You are 'Billy's Apprentice', a virtual assistant expert in residential plumbing for Billy St-Hilaire, Déboucheur Expert based in Montreal and Montérégie, Quebec, Canada.

SERVICES AND RATES:
- Drain unclogging: $200-640/h depending on complexity
- Plumbing renovation (bathroom, kitchen)
- HD camera inspection with detailed report
- 24/7 emergency service available

PROFESSIONAL TOOLS:
- Professional electric drain snake
- High-pressure hydro jetter
- HD inspection camera
- Welding equipment (MIG, TIG, SMAW)

RESPONSE TIMES:
- SMS: 0-12 hours
- Voicemail: 12-24 hours
- Email: 24-48 hours

BEHAVIOR:
- Be friendly and professional
- ALWAYS respond in English
- For emergencies, encourage calling (438) 530-2343
- Direct to unclogged.me for more info
- If a photo is sent, analyze the visible plumbing problem
- Do not give dangerous advice (electricity, gas)`
    };

    // Language-specific intro messages
    const INTRO_MESSAGES = {
        fr: "Bonjour! Je suis l'assistant virtuel de Billy. Je peux répondre à vos questions sur la plomberie ou analyser une photo de votre problème! 🛠️📸",
        en: "Hello! I'm Billy's virtual assistant. I can answer your plumbing questions or analyze a photo of your problem! 🛠️📸"
    };

    // Get current language from document or localStorage
    const getCurrentLang = () => {
        // Check localStorage first
        const storedLang = localStorage.getItem('language');
        if (storedLang && ['fr', 'en'].includes(storedLang)) return storedLang;
        
        // Check document lang attribute
        const docLang = document.documentElement.lang?.toLowerCase();
        if (docLang && docLang.startsWith('en')) return 'en';
        
        // Default to French
        return 'fr';
    };

    // State
    let uploadedImageBase64 = null;
    let isProcessing = false;
    let messageHistory = [];
    let currentLang = getCurrentLang();

    // DOM helpers
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // Utility functions
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const formatResponse = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded text-sm">$1</code>')
            .replace(/\n/g, '<br>');
    };

    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Widget control
    const toggleChat = () => {
        const widget = $('#ai-chat-widget');
        if (widget) {
            widget.classList.toggle('hidden-widget');
            if (!widget.classList.contains('hidden-widget')) {
                const input = $('#chat-input');
                if (input) setTimeout(() => input.focus(), 100);
            }
        }
    };

    const isOpen = () => {
        const widget = $('#ai-chat-widget');
        return widget && !widget.classList.contains('hidden-widget');
    };

    // Message display
    const addMessage = (content, type = 'ai', imageUrl = null) => {
        const messagesDiv = $('#chat-messages');
        if (!messagesDiv) return;

        const messageId = generateMessageId();
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = type === 'user' ? 'user-msg' : 'ai-msg';

        if (imageUrl) {
            messageDiv.innerHTML = `<img src="${imageUrl}" class="max-w-[150px] rounded-lg border border-white/20 mb-2" alt="Image envoyée">`;
            if (content) messageDiv.innerHTML += `<p>${escapeHtml(content)}</p>`;
        } else {
            messageDiv.innerHTML = type === 'ai' ? formatResponse(content) : escapeHtml(content);
        }

        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        messageHistory.push({ id: messageId, type, content, timestamp: Date.now() });
        return messageId;
    };

    const addLoadingIndicator = () => {
        const messagesDiv = $('#chat-messages');
        if (!messagesDiv) return null;

        const loadingId = `loading_${Date.now()}`;
        const loadingDiv = document.createElement('div');
        loadingDiv.id = loadingId;
        loadingDiv.className = 'ai-msg';
        loadingDiv.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;
        messagesDiv.appendChild(loadingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return loadingId;
    };

    const removeLoadingIndicator = (loadingId) => {
        if (loadingId) {
            const loading = document.getElementById(loadingId);
            if (loading) loading.remove();
        }
    };

    // Image handling
    const handleImageUpload = (input) => {
        const file = input.files?.[0];
        if (!file) return;

        // Validate file type
        if (!CONFIG.acceptedImageTypes.includes(file.type)) {
            addMessage('❌ Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.', 'ai');
            input.value = '';
            return;
        }

        // Validate file size
        if (file.size > CONFIG.maxImageSize) {
            addMessage('❌ Image trop grande. Maximum 5 MB.', 'ai');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            uploadedImageBase64 = reader.result.split(',')[1];
            addMessage('', 'user', reader.result);
            
            const fileNameSpan = $('#file-name');
            if (fileNameSpan) fileNameSpan.innerText = file.name;
        };
        reader.onerror = () => {
            addMessage('❌ Erreur lors du chargement de l\'image.', 'ai');
            input.value = '';
        };
        reader.readAsDataURL(file);
    };

    const clearUploadedImage = () => {
        uploadedImageBase64 = null;
        const fileNameSpan = $('#file-name');
        if (fileNameSpan) fileNameSpan.innerText = '';
        const imageInput = $('#image-upload');
        if (imageInput) imageInput.value = '';
    };

    // API call with retry
    const callGeminiAPI = async (parts, retries = 0) => {
        // Ensure config is loaded
        if (!CONFIG.apiKey) {
            const loaded = await loadConfig();
            if (!loaded) {
                throw new Error('Configuration not available');
            }
        }
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;
        const systemPrompt = SYSTEM_PROMPTS[currentLang] || SYSTEM_PROMPTS.fr;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.9,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (error) {
            console.error('Gemini API error:', error);
            if (retries < CONFIG.maxRetries) {
                await new Promise(r => setTimeout(r, CONFIG.retryDelay * (retries + 1)));
                return callGeminiAPI(parts, retries + 1);
            }
            throw error;
        }
    };

    // Send message
    const sendMessage = async () => {
        if (isProcessing) return;

        const input = $('#chat-input');
        const message = input?.value.trim() || '';

        if (!message && !uploadedImageBase64) return;

        isProcessing = true;

        // Display user message
        if (message) {
            addMessage(message, 'user');
            input.value = '';
        }

        // Build API parts
        const parts = [];
        if (message) {
            parts.push({ text: message.slice(0, CONFIG.maxMessageLength) });
        }
        if (uploadedImageBase64) {
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: uploadedImageBase64
                }
            });
            clearUploadedImage();
        }

        // Show loading
        const loadingId = addLoadingIndicator();

        try {
            const response = await callGeminiAPI(parts);
            removeLoadingIndicator(loadingId);

            if (response) {
                addMessage(response, 'ai');
            } else {
                addMessage('Désolé, je n\'ai pas pu générer une réponse. Veuillez réessayer.', 'ai');
            }
        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessage('❌ Erreur de connexion. Veuillez réessayer ou appeler directement au (438) 530-2343.', 'ai');
        } finally {
            isProcessing = false;
        }
    };

    // Initialize
    const init = () => {
        // Update language on init
        currentLang = getCurrentLang();
        
        // Preload API configuration
        loadConfig().then(success => {
            if (success) {
                console.debug('Chat API config preloaded');
            } else {
                console.warn('Chat API config failed to preload - will retry on first message');
            }
        });
        
        // Set language-appropriate intro message in chat
        const messagesDiv = $('#chat-messages');
        if (messagesDiv) {
            const introMsg = INTRO_MESSAGES[currentLang] || INTRO_MESSAGES.fr;
            messagesDiv.innerHTML = `<div class="ai-msg">${introMsg}</div>`;
        }
        
        const input = $('#chat-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            // Update placeholder based on language
            input.placeholder = currentLang === 'en' ? 'Ask a question...' : 'Posez une question...';
        }

        const imageInput = $('#image-upload');
        if (imageInput) {
            imageInput.addEventListener('change', function() {
                handleImageUpload(this);
            });
        }
        
        // Listen for language changes
        window.addEventListener('languageChange', () => {
            currentLang = getCurrentLang();
            const introMsg = INTRO_MESSAGES[currentLang] || INTRO_MESSAGES.fr;
            if (messagesDiv && messageHistory.length === 0) {
                messagesDiv.innerHTML = `<div class="ai-msg">${introMsg}</div>`;
            }
            if (input) {
                input.placeholder = currentLang === 'en' ? 'Ask a question...' : 'Posez une question...';
            }
        });

        console.debug('ChatModule initialized, lang:', currentLang);
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        toggle: toggleChat,
        send: sendMessage,
        handleImage: handleImageUpload,
        isOpen,
        addMessage,
        init
    };
})();

// Global exports for onclick handlers
window.toggleChat = () => ChatModule.toggle();
window.sendMessage = () => ChatModule.send();
window.handleImageUpload = (input) => ChatModule.handleImage(input);
