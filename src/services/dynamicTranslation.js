// Dynamic page translation service
class DynamicTranslationService {
  constructor() {
    this.cache = new Map();
    this.currentLanguage = 'en';
    this.isTranslating = false;
    this.isInitialized = false;
    this.observer = null;
    this.translationQueue = new Set();
    this.isProcessingQueue = false;
    
    // Load cache from sessionStorage on initialization
    this.loadCache();
  }

  // Translate text using LibreTranslate API
  async translateText(text, targetLanguage) {
    if (!text || !text.trim() || targetLanguage === 'en') {
      return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try LibreTranslate first
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLanguage,
          format: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translatedText = data.translatedText;
        this.cache.set(cacheKey, translatedText);
        this.saveCache(); // Save cache after successful translation
        return translatedText;
      }
    } catch (error) {
      console.warn('LibreTranslate failed:', error);
    }

    // Fallback to MyMemory API
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200) {
          const translatedText = data.responseData.translatedText;
          this.cache.set(cacheKey, translatedText);
          this.saveCache(); // Save cache after successful translation
          return translatedText;
        }
      }
    } catch (error) {
      console.warn('MyMemory API failed:', error);
    }

    // Return original text if all translations fail
    return text;
  }

  // Find all text nodes in the document
  getTextNodes(element = document.body) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty nodes, script/style content, and input elements
          const text = node.nodeValue.trim();
          if (!text) return NodeFilter.FILTER_REJECT;
          
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName?.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip input placeholders and values (we'll handle them separately)
          if (['input', 'textarea'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if the text contains only numbers, currency symbols, or dates
          if (/^[\d\s$€£₹৳.,-/:% ]+$/.test(text)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip very short text (less than 2 characters) unless it's common words
          if (text.length < 2 && !['I', 'a', 'A', 'is', 'to'].includes(text)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    return textNodes;
  }

  // Get placeholder and title attributes that need translation
  getAttributeElements(element = document.body) {
    const elements = [];
    
    // Find elements with placeholder attributes
    const placeholderElements = element.querySelectorAll('[placeholder]');
    placeholderElements.forEach(el => {
      elements.push({ element: el, attribute: 'placeholder', text: el.getAttribute('placeholder') });
    });

    // Find elements with title attributes
    const titleElements = element.querySelectorAll('[title]');
    titleElements.forEach(el => {
      elements.push({ element: el, attribute: 'title', text: el.getAttribute('title') });
    });

    return elements;
  }

  // Translate all text on the page
  async translatePage(targetLanguage) {
    if (this.isTranslating || targetLanguage === this.currentLanguage) {
      return;
    }

    this.isTranslating = true;
    console.log(`Translating page to ${targetLanguage}...`);

    // Show visual indicator
    document.body.style.cursor = 'wait';

    // Wait a bit for React components to finish rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Store original content before translation (first time only)
    this.storeOriginalContent();

    try {
      // Get all text nodes
      const textNodes = this.getTextNodes();
      
      // Get all attribute elements
      const attributeElements = this.getAttributeElements();

      // Translate text nodes
      for (const node of textNodes) {
        const originalText = node.nodeValue.trim();
        if (originalText) {
          // Handle text that contains numbers/currency mixed with words
          if (/\d/.test(originalText) && /[a-zA-Z]/.test(originalText)) {
            // Extract just the text parts for translation
            const textParts = originalText.match(/[a-zA-Z][a-zA-Z\s]*/g);
            if (textParts && textParts.length > 0) {
              let translatedText = originalText;
              for (const textPart of textParts) {
                const cleanPart = textPart.trim();
                if (cleanPart.length > 1) {
                  const translated = await this.translateText(cleanPart, targetLanguage);
                  if (translated !== cleanPart) {
                    translatedText = translatedText.replace(cleanPart, translated);
                  }
                }
              }
              if (translatedText !== originalText) {
                node.nodeValue = translatedText;
              }
            }
          } else {
            // Regular text translation
            const translatedText = await this.translateText(originalText, targetLanguage);
            if (translatedText !== originalText) {
              node.nodeValue = translatedText;
            }
          }
        }
      }

      // Translate attributes
      for (const { element, attribute, text } of attributeElements) {
        if (text) {
          const translatedText = await this.translateText(text, targetLanguage);
          if (translatedText !== text) {
            element.setAttribute(attribute, translatedText);
          }
        }
      }

      this.currentLanguage = targetLanguage;
      console.log(`Page translation to ${targetLanguage} completed`);

      // Start observing DOM changes for dynamic content
      this.startObserving();

      // Do a second pass after a short delay to catch dynamically generated content
      setTimeout(async () => {
        if (!this.isTranslating && this.currentLanguage === targetLanguage) {
          console.log('Second pass translation scan...');
          await this.scanAndTranslateNew(targetLanguage);
        }
      }, 500);
      
    } catch (error) {
      console.error('Page translation failed:', error);
    } finally {
      this.isTranslating = false;
      // Remove visual indicator
      document.body.style.cursor = 'default';
    }
  }

  // Scan for new/updated text nodes and translate them
  async scanAndTranslateNew(targetLanguage) {
    try {
      const textNodes = this.getTextNodes();
      console.log(`Second pass: found ${textNodes.length} text nodes`);

      for (const node of textNodes) {
        const originalText = node.nodeValue.trim();
        if (originalText && originalText.length > 1) {
          // Only translate if it looks like English text (contains common English words)
          const englishWords = /\b(the|and|or|to|for|of|in|on|at|with|by|from|about|spent|left|welcome|back|quick|snapshot|earned|expended|given|took|credit|loan|month|budget|alerts|currency|language|settings|save|export|delete|account|data|light|dark|system|theme|appearance)\b/i;
          
          if (englishWords.test(originalText)) {
            // Handle mixed text (with numbers/currency)
            if (/\d/.test(originalText) && /[a-zA-Z]/.test(originalText)) {
              const textParts = originalText.match(/[a-zA-Z][a-zA-Z\s]*/g);
              if (textParts && textParts.length > 0) {
                let translatedText = originalText;
                for (const textPart of textParts) {
                  const cleanPart = textPart.trim();
                  if (cleanPart.length > 1) {
                    const translated = await this.translateText(cleanPart, targetLanguage);
                    if (translated !== cleanPart) {
                      translatedText = translatedText.replace(cleanPart, translated);
                    }
                  }
                }
                if (translatedText !== originalText) {
                  node.nodeValue = translatedText;
                }
              }
            } else {
              // Regular text translation
              const translatedText = await this.translateText(originalText, targetLanguage);
              if (translatedText !== originalText) {
                node.nodeValue = translatedText;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Second pass translation failed:', error);
    }
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Load cache from sessionStorage
  loadCache() {
    try {
      const cachedData = sessionStorage.getItem('translationCache');
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        this.cache = new Map(parsedCache);
        console.log('Loaded translation cache:', this.cache.size, 'entries');
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
    }
  }

  // Save cache to sessionStorage
  saveCache() {
    try {
      const cacheArray = Array.from(this.cache.entries());
      sessionStorage.setItem('translationCache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }

  // Initialize translation for user's preferred language
  async initializeForUser(userLanguage) {
    if (this.isInitialized && this.currentLanguage === userLanguage) {
      return;
    }

    console.log('Initializing translation for user language:', userLanguage);
    
    if (userLanguage && userLanguage !== 'en') {
      await this.translatePage(userLanguage);
    }
    
    this.isInitialized = true;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    sessionStorage.removeItem('translationCache');
  }

  // Reset page back to English
  async resetToEnglish() {
    console.log('Resetting page to English...');
    
    // Stop observing DOM changes
    this.stopObserving();
    
    // Clear the queue
    this.translationQueue.clear();
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
    }
    
    // Clear current language state
    this.currentLanguage = 'en';
    this.isTranslating = false;
    
    // Show loading indicator
    document.body.style.cursor = 'wait';
    
    try {
      // Store original content if not already stored
      if (!this.originalContent) {
        // If we don't have original content, reload the page
        window.location.reload();
        return;
      }
      
      // Restore all original text nodes
      this.originalContent.textNodes.forEach((originalText, node) => {
        if (node.parentNode && originalText !== node.nodeValue) {
          node.nodeValue = originalText;
        }
      });
      
      // Restore all original attributes
      this.originalContent.attributes.forEach((originalValue, element, attribute) => {
        if (element && element.hasAttribute && element.hasAttribute(attribute)) {
          element.setAttribute(attribute, originalValue);
        }
      });
      
      // Clear translation cache for this session
      this.cache.clear();
      this.clearCache();
      
      console.log('Successfully reset to English');
    } catch (error) {
      console.error('Error resetting to English:', error);
      // Fallback to page reload
      window.location.reload();
    } finally {
      document.body.style.cursor = 'default';
    }
  }

  // Store original content before translation
  storeOriginalContent() {
    if (this.originalContent) return; // Already stored
    
    this.originalContent = {
      textNodes: new Map(),
      attributes: new Map()
    };
    
    // Store original text nodes
    const textNodes = this.getTextNodes();
    textNodes.forEach(node => {
      this.originalContent.textNodes.set(node, node.nodeValue);
    });
    
    // Store original attributes
    const attributeElements = this.getAttributeElements();
    attributeElements.forEach(({ element, attribute }) => {
      const key = `${element}_${attribute}`;
      const value = element.getAttribute(attribute);
      this.originalContent.attributes.set(key, { element, attribute, value });
    });
  }

  // Start observing DOM changes for dynamic content translation
  startObserving() {
    if (this.observer || this.currentLanguage === 'en') {
      return;
    }

    console.log('[Translation] Starting DOM mutation observer');

    this.observer = new MutationObserver((mutations) => {
      // Add mutations to queue
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              this.translationQueue.add(node);
            }
          });
        } else if (mutation.type === 'characterData') {
          this.translationQueue.add(mutation.target);
        } else if (mutation.type === 'attributes' && 
                   (mutation.attributeName === 'placeholder' || mutation.attributeName === 'title')) {
          this.translationQueue.add(mutation.target);
        }
      });

      // Process queue with debounce
      this.processQueueDebounced();
    });

    // Observe the entire document for changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title']
    });
  }

  // Stop observing DOM changes
  stopObserving() {
    if (this.observer) {
      console.log('[Translation] Stopping DOM mutation observer');
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // Debounced queue processing
  processQueueDebounced() {
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
    }

    this.queueTimer = setTimeout(() => {
      this.processQueue();
    }, 100); // 100ms debounce
  }

  // Process the translation queue
  async processQueue() {
    if (this.isProcessingQueue || this.translationQueue.size === 0 || this.currentLanguage === 'en') {
      return;
    }

    this.isProcessingQueue = true;
    const nodesToProcess = Array.from(this.translationQueue);
    this.translationQueue.clear();

    console.log(`[Translation] Processing ${nodesToProcess.length} queued nodes`);

    try {
      for (const node of nodesToProcess) {
        await this.translateNode(node, this.currentLanguage);
      }
    } catch (error) {
      console.warn('[Translation] Queue processing error:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Translate a single node (text node or element)
  async translateNode(node, targetLanguage) {
    try {
      if (node.nodeType === Node.TEXT_NODE) {
        const originalText = node.nodeValue?.trim();
        if (originalText && originalText.length > 1) {
          // Skip numbers-only text
          if (/^[\d\s$€£₹৳.,-/:% ]+$/.test(originalText)) {
            return;
          }

          // Check if it looks like English text
          const englishWords = /\b(the|and|or|to|for|of|in|on|at|with|by|from|about|spent|left|welcome|back|quick|snapshot|earned|expended|given|took|credit|loan|month|budget|alerts|currency|language|settings|save|export|delete|account|data|light|dark|system|theme|appearance|add|edit|remove|transaction|balance|income|expense|total|search|filter|category|date|amount|description|confirm|cancel|close|help|logout|profile|sign|login|password|email|name|phone|address|country|city|state|zip|code)\b/i;
          
          if (!englishWords.test(originalText)) {
            return; // Skip if doesn't look like English
          }

          // Handle mixed text (with numbers/currency)
          if (/\d/.test(originalText) && /[a-zA-Z]/.test(originalText)) {
            const textParts = originalText.match(/[a-zA-Z][a-zA-Z\s]*/g);
            if (textParts && textParts.length > 0) {
              let translatedText = originalText;
              for (const textPart of textParts) {
                const cleanPart = textPart.trim();
                if (cleanPart.length > 1) {
                  const translated = await this.translateText(cleanPart, targetLanguage);
                  if (translated !== cleanPart) {
                    translatedText = translatedText.replace(cleanPart, translated);
                  }
                }
              }
              if (translatedText !== originalText) {
                node.nodeValue = translatedText;
              }
            }
          } else {
            // Regular text translation
            const translatedText = await this.translateText(originalText, targetLanguage);
            if (translatedText && translatedText !== originalText) {
              node.nodeValue = translatedText;
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Translate element's text nodes
        const textNodes = this.getTextNodes(node);
        for (const textNode of textNodes) {
          await this.translateNode(textNode, targetLanguage);
        }

        // Translate element's attributes (placeholder, title)
        if (node.hasAttribute('placeholder')) {
          const placeholder = node.getAttribute('placeholder');
          if (placeholder) {
            const translated = await this.translateText(placeholder, targetLanguage);
            if (translated && translated !== placeholder) {
              node.setAttribute('placeholder', translated);
            }
          }
        }

        if (node.hasAttribute('title')) {
          const title = node.getAttribute('title');
          if (title) {
            const translated = await this.translateText(title, targetLanguage);
            if (translated && translated !== title) {
              node.setAttribute('title', translated);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Translation] Node translation error:', error);
    }
  }
}

// Create singleton instance
const dynamicTranslator = new DynamicTranslationService();

export default dynamicTranslator;