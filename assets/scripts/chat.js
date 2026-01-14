/**
 * Déboucheur Expert - AI Chat Module
 * Enhanced chatbot with Gemini AI integration
 * @version 2.0.0
 * @author Déboucheur Expert Team
 */

const ChatModule = (() => {
    // Configuration
    const CONFIG = Object.freeze({
        apiKey: 'AIzaSyCShzljUGrqSmhLDisfdliIitd9cXFRQZ0',
        model: 'gemini-2.5-flash-preview-09-2025',
        maxRetries: 3,
        retryDelay: 1000,
        maxMessageLength: 2000,
        acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maxImageSize: 5 * 1024 * 1024 // 5MB
    });

    const SYSTEM_PROMPT = `Tu es 'L'Apprenti de Billy', un assistant virtuel expert en plomberie résidentielle pour Billy St-Hilaire, Déboucheur Expert basé à Montréal et Montérégie.

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
- Réponds en français par défaut, en anglais si demandé
- Pour les urgences, incite à appeler (438) 530-2343
- Dirige vers unclogged.me ou deboucheur.expert pour plus d'infos
- Si une photo est envoyée, analyse le problème de plomberie visible
- Ne donne pas de conseils dangereux (électricité, gaz)`;

    // State
    let uploadedImageBase64 = null;
    let isProcessing = false;
    let messageHistory = [];

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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
        const input = $('#chat-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        const imageInput = $('#image-upload');
        if (imageInput) {
            imageInput.addEventListener('change', function() {
                handleImageUpload(this);
            });
        }

        console.debug('ChatModule initialized');
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
