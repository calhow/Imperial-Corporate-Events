// Package Modal Management System

// Fetches and injects nested CMS content
function cmsNest() {
  const items = document.querySelectorAll("[data-cms-nest^='item']");

  if (items.length === 0) {
    document.dispatchEvent(
      new CustomEvent("cmsNestComplete", { detail: { found: false } })
    );
    return;
  }

  // Create a content cache namespace
  const CACHE_PREFIX = 'cms_nest_cache_';
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
  const isMobile = window.innerWidth < 768;
  
  // Check if we can use localStorage
  const storageAvailable = (() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })();
  
  // Get cached content
  const getCachedContent = (url) => {
    if (!storageAvailable) return null;
    
    try {
      const cacheKey = CACHE_PREFIX + url;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const { timestamp, content } = JSON.parse(cachedData);
      
      // Check if cache is still valid
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return content;
      } else {
        // Clear expired cache
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (e) {
      return null;
    }
  };
  
  // Set content in cache
  const setCachedContent = (url, content) => {
    if (!storageAvailable) return;
    
    try {
      const cacheKey = CACHE_PREFIX + url;
      const cacheData = {
        timestamp: Date.now(),
        content
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      // Handle quota exceeded or other storage errors
      try {
        // If we've exceeded quota, clear older caches
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        
        // Sort by timestamp and remove older ones first
        keysToRemove.sort((a, b) => {
          const aData = JSON.parse(localStorage.getItem(a));
          const bData = JSON.parse(localStorage.getItem(b));
          return aData.timestamp - bData.timestamp;
        });
        
        // Remove the oldest 50% of cached items
        const removeCount = Math.ceil(keysToRemove.length / 2);
        for (let i = 0; i < removeCount; i++) {
          localStorage.removeItem(keysToRemove[i]);
        }
        
        // Try again
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e2) {
        // If still failing, give up on caching for now
      }
    }
  };
  
  // Convert the items to an array for batch processing
  const itemsArray = Array.from(items);
  let contentFound = false;
  let processedCount = 0;
  
  // Create a queue system
  const queue = [];
  const BATCH_SIZE = isMobile ? 2 : 4; // Process fewer items at once on mobile
  let isProcessing = false;
  
  // Process dropzones with DocumentFragment
  const processDropzones = (item, parsedContent) => {
    const dropzones = item.querySelectorAll("[data-cms-nest^='dropzone-']");
    let foundContent = false;
    
    // Create a document fragment to minimize reflows
    dropzones.forEach((dropzone) => {
      const dropzoneNum = dropzone
        .getAttribute("data-cms-nest")
        .split("-")[1];
      const targetSelector = `[data-cms-nest='target-${dropzoneNum}']`;
      const target = parsedContent.querySelector(targetSelector);
      
      if (target) {
        // Use document fragment to batch DOM operations
        const fragment = document.createDocumentFragment();
        fragment.appendChild(target.cloneNode(true));
        
        // Clear and append in one operation
        dropzone.innerHTML = "";
        dropzone.appendChild(fragment);
        
        foundContent = true;
        contentFound = true;
      }
    });
    
    return foundContent;
  };
  
  // Process a batch of items from the queue
  const processBatch = async () => {
    if (isProcessing || queue.length === 0) return;
    
    isProcessing = true;
    const batch = queue.splice(0, BATCH_SIZE);
    const batchPromises = [];
    
    for (const { item, href } of batch) {
      const promise = new Promise(async (resolve) => {
        try {
          // First check cache
          const cachedContent = getCachedContent(href);
          
          if (cachedContent) {
            // Parse cached content
            const parser = new DOMParser();
            const parsedContent = parser.parseFromString(cachedContent, "text/html");
            
            // Process with the cached content
            const foundContent = processDropzones(item, parsedContent);
            
            item.dispatchEvent(
              new CustomEvent("cmsNestItemComplete", {
                detail: { found: foundContent, fromCache: true },
                bubbles: true,
              })
            );
            
            processedCount++;
            resolve();
            return;
          }
          
          // If not cached, fetch from network
          const url = new URL(href, window.location.origin);
          if (url.hostname !== window.location.hostname) {
            processedCount++;
            resolve();
            return;
          }
          
          try {
            const response = await Utils.fetchWithTimeout(href, {}, 5e3);
            const html = await response.text();
            
            // Cache the result
            setCachedContent(href, html);
            
            const parser = new DOMParser();
            const parsedContent = parser.parseFromString(html, "text/html");
            
            // Process the dropzones
            const foundContent = processDropzones(item, parsedContent);
            
            item.dispatchEvent(
              new CustomEvent("cmsNestItemComplete", {
                detail: { found: foundContent, fromCache: false },
                bubbles: true,
              })
            );
            
            processedCount++;
            resolve();
          } catch (error) {
            processedCount++;
            resolve();
          }
        } catch (error) {
          processedCount++;
          resolve();
        }
      });
      
      batchPromises.push(promise);
    }
    
    // Wait for all items in the batch to complete
    await Promise.all(batchPromises);
    
    // Process the next batch or complete
    isProcessing = false;
    
    if (queue.length > 0) {
      // Use requestIdleCallback if available, or setTimeout to not block the main thread
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => processBatch());
      } else {
        setTimeout(() => processBatch(), 0);
      }
    } else if (processedCount >= itemsArray.length) {
      // All items are processed
      document.dispatchEvent(
        new CustomEvent("cmsNestComplete", {
          detail: { found: contentFound },
        })
      );
    }
  };
  
  // Populate the queue and start processing
  itemsArray.forEach((item) => {
    const link = item.querySelector("[data-cms-nest='link']");
    if (!link) {
      processedCount++;
      return;
    }
    
    const href = link.getAttribute("href");
    if (!href) {
      processedCount++;
      return;
    }
    
    // Add to queue
    queue.push({ item, href });
  });
  
  // Start processing batches
  if (queue.length > 0) {
    processBatch();
  } else {
    document.dispatchEvent(
      new CustomEvent("cmsNestComplete", {
        detail: { found: contentFound },
      })
    );
  }
}

// Hides empty featured amenities divs in package modal
function hideEmptyDivs() {
  const modalWrap = document.querySelector(".package_modal_wrap");
  if (!modalWrap) return;
  const divs = modalWrap.querySelectorAll(
    "div.package_accordion_featured-amenities"
  );
  divs.forEach((div) => {
    if (div.textContent.trim() === "" && div.children.length === 0) {
      div.style.display = "none";
    }
  });
}

// Adjusts hotel star rating display
function adjustHotelStars() {
  const starWraps = document.querySelectorAll(".package_hotel_star_wrap");

  starWraps.forEach(function (wrap) {
    const hotelScore = parseInt(wrap.getAttribute("data-hotel-score"), 10);
    const stars = wrap.children;

    if (isNaN(hotelScore) || hotelScore < 1 || hotelScore > 5) {
      for (let i = 0; i < stars.length; i++)
        stars[i].style.display = "inline-block";
    } else {
      for (let i = 0; i < stars.length; i++) {
        stars[i].style.display = i < hotelScore ? "inline-block" : "none";
      }
    }
  });
} 

// Package modal content management
const cardsSelector = '[data-package-card="true"]';

const contentSelector = ".package_contain";

const packageModal = document.querySelector(".package_modal");
const packageModalTarget = packageModal?.querySelector(".package_modal_wrap");

const contentCache = new Map();
const pendingFetches = new Map();
const prefetchQueue = [];
const MAX_CONCURRENT_PREFETCHES = 4;

// Animation state manager for package modals
class AnimationStateManager {
  constructor(modalTarget) {
    this.modalTarget = modalTarget;
    this.timeline = null;
    this.elements = null;
    this.isMobile = typeof Utils !== 'undefined' && Utils.isMobile ? Utils.isMobile() : window.innerWidth <= 767;
    
    // Clear blur filters when viewport size changes
    this.handleResize = Utils.debounce(this.handleResize.bind(this), 150);
    window.addEventListener('resize', this.handleResize);
  }

  getElements() {
    this.elements = {
      headingWrap: this.modalTarget.querySelector('.package_heading_wrap'),
      contentChildren: this.modalTarget.querySelectorAll('.package_content > *'),
      contentGrandchildren: this.modalTarget.querySelectorAll('.package_content > * > *'),
      btnWrap: this.modalTarget.querySelector('.package_btn_wrap')
    };
    return this.elements;
  }
  
  handleResize() {
    // Update mobile status
    const wasMobile = this.isMobile;
    this.isMobile = typeof Utils !== 'undefined' && Utils.isMobile ? Utils.isMobile() : window.innerWidth <= 767;
    
    // If device switched to mobile, clear any blur filters
    if (!wasMobile && this.isMobile && this.elements?.contentGrandchildren?.length) {
      gsap.set(this.elements.contentGrandchildren, { filter: "none" });
    }
  }

  setInitialState() {
    const elements = this.getElements();
    
    const allElements = [
      elements.headingWrap,
      ...(elements.contentChildren || []),
      ...(elements.contentGrandchildren || []),
      elements.btnWrap
    ].filter(Boolean);
    
    gsap.set(allElements, { opacity: 0 });
    
    if (elements.headingWrap) gsap.set(elements.headingWrap, { opacity: 0, x: "0.5rem" });
    if (elements.contentChildren?.length) gsap.set(elements.contentChildren, { opacity: 0, x: "1rem" });
    if (elements.contentGrandchildren?.length) {
      gsap.set(elements.contentGrandchildren, { opacity: 0, x: "0.125rem", y: "-0.25rem" });
    }
    if (elements.btnWrap) gsap.set(elements.btnWrap, { opacity: 0, x: "0.5rem" });
    
    this.modalTarget.offsetHeight;
  }

  createTimeline() {
    const elements = this.getElements();
    this.timeline = gsap.timeline({
      onComplete: () => {
        // Timeline completed
      }
    });

    if (elements.headingWrap) {
      this.timeline.to(elements.headingWrap, {
        opacity: 1,
        x: "0rem",
        duration: 0.2,
        ease: "power1.out"
      }, 0);
    }

    if (elements.contentChildren?.length) {
      this.timeline.to(elements.contentChildren, {
        opacity: 1,
        x: "0rem",
        duration: 0.2,
        ease: "power1.out",
        stagger: 0.03
      }, 0);
    }

    if (elements.contentGrandchildren?.length) {
      this.timeline.to(elements.contentGrandchildren, {
        opacity: 1,
        x: "0rem",
        y: "0rem",
        duration: 0.2,
        ease: "power1.out",
        stagger: 0.015
      }, 0);
    }

    if (elements.btnWrap) {
      this.timeline.to(elements.btnWrap, {
        opacity: 1,
        x: "0rem",
        duration: 0.2,
        ease: "power1.out"
      }, 0);
    }
    
    return this.timeline;
  }

  animate() {
    this.setInitialState();
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.createTimeline();
      });
    });
  }

  cleanup() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    window.removeEventListener('resize', this.handleResize);
    this.elements = null;
  }
}

const packageAnimationManager = new AnimationStateManager(packageModalTarget);

// Memory management for GSAP timelines
const TimelineManager = {
    timelines: new Set(),
    
    add(timeline) {
        if (!timeline) return;
        this.timelines.add(timeline);
        timeline.eventCallback("onComplete", () => this.remove(timeline));
    },
    
    remove: timeline => timeline && (timeline.kill(), this.timelines.delete(timeline)),
    
    clearAll() {
        this.timelines.forEach(tl => tl.kill());
        this.timelines.clear();
    }
};

// Event listener management
const EventManager = {
    listeners: new Map(),
    
    add(element, type, handler, options = false) {
        if (!element || !type || !handler) return;
        element.addEventListener(type, handler, options);
        
        const elementMap = this.listeners.get(element) || new Map();
        const handlers = elementMap.get(type) || new Set();
        
        handlers.add(handler);
        elementMap.set(type, handlers);
        this.listeners.set(element, elementMap);
    },
    
    remove(element, type, handler) {
        if (!element || !type || !handler) return;
        element.removeEventListener(type, handler);
        
        const elementMap = this.listeners.get(element);
        const handlers = elementMap?.get(type);
        if (handlers) {
            handlers.delete(handler);
            if (!handlers.size) elementMap.delete(type);
            if (!elementMap.size) this.listeners.delete(element);
        }
    },
    
    removeAll(element) {
        if (!element) return;
        const elementMap = this.listeners.get(element);
        if (!elementMap) return;
        
        elementMap.forEach((handlers, type) => 
            handlers.forEach(handler => element.removeEventListener(type, handler))
        );
        this.listeners.delete(element);
    },
    
    clearAll() {
        this.listeners.forEach((elementMap, element) => this.removeAll(element));
        this.listeners.clear();
    }
};

// Checks if modal already contains the correct content
const isModalContentCorrect = (url) => {
    if (!packageModalTarget) return false;
    const currentUrl = packageModalTarget.getAttribute('data-current-url');
    return currentUrl === url;
};

// Prepares content before DOM insertion
const prepareContentForInsertion = (contentElement) => {
    contentElement.querySelectorAll('[data-temp-loading]').forEach(el => {
        el.removeAttribute('data-temp-loading');
    });
};

// Check for and pre-process SVG elements before CMS nesting
const processSVGElements = (container) => {
    if (!container) {
        return false;
    }
    
    const svgElements = container.querySelectorAll(".svg-code");
    
    if (svgElements.length > 0) {
        svgElements.forEach((element) => {
            const content = element.textContent;
            if (!content) return;
            
            // Add a data attribute to mark this element as needing processing
            element.setAttribute('data-svg-needs-processing', 'true');
        });
        return true;
    }
    
    return false;
}; 

// Attaches event handlers to package cards and initiates prefetching
const attachPackageCardHandlers = (cards) => {
  if (!cards || !cards.length) return;
  
  const cardsArray = Array.from(cards);
  cardsArray.sort((a, b) => {
    const aVisible = isElementInViewport(a);
    const bVisible = isElementInViewport(b);
    return (bVisible ? 1 : 0) - (aVisible ? 1 : 0);
  });
  
  cardsArray.forEach((card) => {
    if (card.hasAttribute('data-package-card-initialized')) return;
    
    card.setAttribute('data-package-card-initialized', 'true');
    
    card.addEventListener("click", handleCardClick);
    
    // Get package slug and construct URL
    const packageSlug = card.getAttribute("data-package-slug");
    
    if (packageSlug) {
      const url = `/package/${packageSlug}`;
      
      if (!contentCache.has(url) && !pendingFetches.has(url)) {
        prefetchPackageContent(url);
      }
    }
  });
};

// Checks if element is in viewport
function isElementInViewport(el) {
  if (typeof Utils !== 'undefined' && Utils.isInViewport) {
    return Utils.isInViewport(el);
  }
  
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Manages prefetching of package content
const prefetchPackageContent = (url) => {
  if (contentCache.has(url) || pendingFetches.has(url)) return;
  
  if (pendingFetches.size < MAX_CONCURRENT_PREFETCHES) {
    startPrefetch(url);
  } else {
    if (!prefetchQueue.includes(url)) {
      prefetchQueue.push(url);
    }
  }
};

// Starts content prefetch
const startPrefetch = (url) => {
  const fetchPromise = fetchContent(url).then(content => {
    if (content) {
      contentCache.set(url, content);
    }
    pendingFetches.delete(url);
    
    processNextQueuedFetch();
    
    return content;
  }).catch(error => {
    pendingFetches.delete(url);
    
    processNextQueuedFetch();
    
    return null;
  });
  
  pendingFetches.set(url, fetchPromise);
};

// Processes next URL in prefetch queue
const processNextQueuedFetch = () => {
  if (prefetchQueue.length > 0 && pendingFetches.size < MAX_CONCURRENT_PREFETCHES) {
    const nextUrl = prefetchQueue.shift();
    startPrefetch(nextUrl);
  }
};

// Handles package card click events
const handleCardClick = (event) => {
  event.preventDefault();
  
  const card = event.currentTarget;
  
  // Get package slug and construct URL
  const packageSlug = card.getAttribute("data-package-slug");
  
  if (!packageSlug) return;
  
  const url = `/package/${packageSlug}`;
  
  openModalForUrl(url);
};

// Sets initial animation states
const setInitialStates = (elements) => {
    const allElements = [
        elements.headingWrap,
        ...(elements.contentChildren || []),
        ...(elements.contentGrandchildren || []),
        elements.btnWrap
    ].filter(Boolean);
    
    gsap.set(allElements, { opacity: 0 });

    // Base states for all elements
    const states = {
        headingWrap: { opacity: 0, x: "0.5rem" },
        contentChildren: { opacity: 0, x: "1rem" },
        contentGrandchildren: { opacity: 0, x: "0.125rem", y: "-0.25rem" },
        btnWrap: { opacity: 0, x: "0.5rem" }
    };

    Object.entries(states).forEach(([key, props]) => {
        const target = elements[key];
        if (target) gsap.set(target, props);
    });
};

// Creates content animation timeline
const createContentAnimation = (elements) => {
    const timeline = gsap.timeline({
        paused: true,
        onComplete: () => TimelineManager.remove(timeline)
    });
    
    // Base animations
    const animations = [
        {
            targets: elements.headingWrap,
            props: { opacity: 1, x: "0rem" }
        },
        {
            targets: elements.contentChildren,
            props: { opacity: 1, x: "0rem" },
            stagger: 0.03
        },
        {
            targets: elements.contentGrandchildren,
            props: { opacity: 1, x: "0rem", y: "0rem" },
            stagger: 0.015
        },
        {
            targets: elements.btnWrap,
            props: { opacity: 1, x: "0rem" }
        }
    ];

    animations.forEach(({ targets, props, stagger }) => {
        if (!targets) return;
        timeline.to(targets, {
            ...props,
            duration: 0.2,
            ease: "power1.out",
            ...(stagger && { stagger })
        }, 0);
    });

    TimelineManager.add(timeline);
    return timeline;
}; 

// Triggers modal opening and content loading
const openModalForUrl = async (url) => {
  const modalAnimationComplete = new Promise(resolve => {
    document.addEventListener('packageModalAnimationComplete', () => {
      resolve();
    }, { once: true });
  });
  
  const btn = document.createElement('button');
  btn.setAttribute('data-modal-open', 'package');
  btn.style.position = 'absolute';
  btn.style.opacity = '0';
  btn.style.pointerEvents = 'none';
  document.body.appendChild(btn);
  btn.click();
  
  requestAnimationFrame(() => {
    document.body.removeChild(btn);
  });

  if (!isModalContentCorrect(url)) {
    let content = null;
    
    try {
      if (contentCache.has(url)) {
        content = contentCache.get(url);
      } else if (pendingFetches.has(url)) {
        content = await pendingFetches.get(url);
      } else {
        const fetchPromise = fetchContent(url);
        pendingFetches.set(url, fetchPromise);
        content = await fetchPromise;
        if (content) {
          contentCache.set(url, content);
        }
      }
    } catch (error) {
      return;
    }

    if (content) {
      packageModalTarget.innerHTML = "";
      packageModalTarget.setAttribute('data-current-url', url);
      
      const contentClone = content.cloneNode(true);
      prepareContentForInsertion(contentClone);
      
      const elements = {
        headingWrap: contentClone.querySelector('.package_heading_wrap'),
        contentChildren: contentClone.querySelectorAll('.package_content > *'),
        contentGrandchildren: contentClone.querySelectorAll('.package_content > * > *'),
        btnWrap: contentClone.querySelector('.package_btn_wrap')
      };
      
      const setInitialStates = () => {
        gsap.set([
          elements.headingWrap, 
          ...elements.contentChildren, 
          ...elements.contentGrandchildren, 
          elements.btnWrap
        ].filter(Boolean), { opacity: 0 });
        
        if (elements.headingWrap) gsap.set(elements.headingWrap, { opacity: 0, x: "0.5rem" });
        if (elements.contentChildren?.length) gsap.set(elements.contentChildren, { opacity: 0, x: "1rem" });
        if (elements.contentGrandchildren?.length) {
          gsap.set(elements.contentGrandchildren, { 
            opacity: 0, 
            x: "0.125rem", 
            y: "-0.25rem"
          });
        }
        if (elements.btnWrap) gsap.set(elements.btnWrap, { opacity: 0, x: "0.5rem" });
        
        packageModalTarget.offsetHeight;
      };
      
      packageModalTarget.appendChild(contentClone);
      
      setInitialStates();

      requestAnimationFrame(() => {
        initializeModalContent(contentClone);
        
        setInitialStates();
        
        modalAnimationComplete.then(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setInitialStates();
              
              const contentTl = gsap.timeline();
              
              if (elements.headingWrap) {
                contentTl.to(elements.headingWrap, { 
                  opacity: 1, 
                  x: "0rem", 
                  duration: 0.2, 
                  ease: "power1.out"
                }, 0);
              }
              
              if (elements.contentChildren?.length) {
                contentTl.to(elements.contentChildren, { 
                  opacity: 1, 
                  x: "0rem", 
                  duration: 0.2, 
                  ease: "power1.out",
                  stagger: 0.03
                }, 0); 
              }
              
              if (elements.contentGrandchildren?.length) {
                contentTl.to(elements.contentGrandchildren, { 
                  opacity: 1, 
                  x: "0rem", 
                  y: "0rem", 
                  duration: 0.2, 
                  ease: "power1.out",
                  stagger: 0.015
                }, 0);
              }
              
              if (elements.btnWrap) {
                contentTl.to(elements.btnWrap, { 
                  opacity: 1, 
                  x: "0rem", 
                  duration: 0.2, 
                  ease: "power1.out"
                }, 0);
              }
            });
          });
        });
      });
    }
  } else {
    const elements = {
      headingWrap: packageModalTarget.querySelector('.package_heading_wrap'),
      contentChildren: packageModalTarget.querySelectorAll('.package_content > *'),
      contentGrandchildren: packageModalTarget.querySelectorAll('.package_content > * > *'),
      btnWrap: packageModalTarget.querySelector('.package_btn_wrap')
    };
    
    const setInitialStates = () => {
      gsap.set([
        elements.headingWrap, 
        ...elements.contentChildren, 
        ...elements.contentGrandchildren, 
        elements.btnWrap
      ].filter(Boolean), { opacity: 0 });
      
      if (elements.headingWrap) gsap.set(elements.headingWrap, { opacity: 0, x: "0.5rem" });
      if (elements.contentChildren?.length) gsap.set(elements.contentChildren, { opacity: 0, x: "1rem" });
      if (elements.contentGrandchildren?.length) {
        gsap.set(elements.contentGrandchildren, { 
          opacity: 0, 
          x: "0.125rem", 
          y: "-0.25rem"
        });
      }
      if (elements.btnWrap) gsap.set(elements.btnWrap, { opacity: 0, x: "0.5rem" });
      
      packageModalTarget.offsetHeight;
    };
    
    setInitialStates();
    
    modalAnimationComplete.then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setInitialStates();
          
          const contentTl = gsap.timeline();
          
          if (elements.headingWrap) {
            contentTl.to(elements.headingWrap, { 
              opacity: 1, 
              x: "0rem", 
              duration: 0.2, 
              ease: "power1.out"
            }, 0);
          }
          
          if (elements.contentChildren?.length) {
            contentTl.to(elements.contentChildren, { 
              opacity: 1, 
              x: "0rem", 
              duration: 0.2, 
              ease: "power1.out",
              stagger: 0.03
            }, 0); 
          }
          
          if (elements.contentGrandchildren?.length) {
            contentTl.to(elements.contentGrandchildren, { 
              opacity: 1, 
              x: "0rem", 
              y: "0rem", 
              duration: 0.2, 
              ease: "power1.out",
              stagger: 0.015
            }, 0);
          }
          
          if (elements.btnWrap) {
            contentTl.to(elements.btnWrap, { 
              opacity: 1, 
              x: "0rem", 
              duration: 0.2, 
              ease: "power1.out"
            }, 0);
          }
        });
      });
    });
  }
};

// Function to fetch content from URL
const fetchContent = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Set up Web Worker for content processing if not already done
    if (!window.contentProcessorReady) {
      setupContentProcessor();
    }
    
    // Use the web worker if available, otherwise fall back to main thread processing
    if (window.contentProcessor) {
      return new Promise((resolve) => {
        // Set up one-time handler for this specific URL
        const messageHandler = (e) => {
          const { processedUrl, content, error } = e.data;
          
          if (processedUrl === url) {
            // Remove the event listener once we've received the right response
            window.contentProcessor.removeEventListener('message', messageHandler);
            
            if (error) {
              fallbackToMainThreadProcessing();
              return;
            }
            
            try {
              // Convert the processed content back to DOM nodes
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content || '';
              const processedContent = tempDiv.querySelector(contentSelector);
              
              if (!processedContent) {
                fallbackToMainThreadProcessing();
                return;
              }
              
              resolve(processedContent);
            } catch (e) {
              fallbackToMainThreadProcessing();
            }
          }
        };
        
        // Fallback function for when worker fails
        const fallbackToMainThreadProcessing = () => {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const content = doc.querySelector(contentSelector);
            
            if (!content) {
              resolve(null);
              return;
            }
            
            resolve(content);
          } catch (e) {
            resolve(null);
          }
        };
        
        window.contentProcessor.addEventListener('message', messageHandler);
        
        // Set timeout for worker response
        const timeoutId = setTimeout(() => {
          window.contentProcessor.removeEventListener('message', messageHandler);
          fallbackToMainThreadProcessing();
        }, 3000);
        
        // Send the HTML for processing
        try {
          window.contentProcessor.postMessage({ 
            action: 'processContent', 
            html: text, 
            url: url,
            selector: contentSelector
          });
        } catch (e) {
          clearTimeout(timeoutId);
          fallbackToMainThreadProcessing();
        }
      });
    } else {
      // Fallback to synchronous processing
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const content = doc.querySelector(contentSelector);
      
      if (!content) {
        throw new Error("Content not found in fetched document");
      }
      
      return content;
    }
  } catch (error) {
    return null;
  }
}; 

// Function to set up the Content Processor Web Worker
const setupContentProcessor = () => {
  // Only set up once
  if (window.contentProcessorReady) return;
  
  try {
    // Create the worker code as a blob
    const workerCode = `
      self.addEventListener('message', (e) => {
        const { action, html, url, selector } = e.data;
        
        if (action === 'processContent') {
          try {
            // Since DOMParser is not available in workers, use string manipulation instead
            // This is a simplified version that handles basic cases
            const findContent = (html, selector) => {
              try {
                // For selector like ".package_contain", look for class="package_contain"
                // This is a simplified approach and won't work for complex selectors
                const classMatch = selector.match(/\\.(\\w+)/);
                if (classMatch && classMatch[1]) {
                  const className = classMatch[1];
                  
                  // Find the opening tag with this class
                  const classPattern = new RegExp('<([^>]+)\\\\s+class="([^"]*\\\\s+)?' + className + '(\\\\s+[^"]*)?">');
                  const match = html.match(classPattern);
                  
                  if (match) {
                    // Get the tag name to help find the closing tag
                    const tagName = match[1].trim();
                    const startIndex = match.index;
                    
                    // Simple way to find the corresponding closing tag
                    // Note: This doesn't handle nested tags of the same type perfectly
                    let openTags = 1;
                    let endIndex = startIndex + match[0].length;
                    
                    const openPattern = new RegExp('<' + tagName + '\\\\b', 'g');
                    const closePattern = new RegExp('<\\\\/' + tagName + '\\\\s*>', 'g');
                    
                    openPattern.lastIndex = endIndex;
                    closePattern.lastIndex = endIndex;
                    
                    let openMatch, closeMatch;
                    
                    while (openTags > 0 && endIndex < html.length) {
                      openPattern.lastIndex = endIndex;
                      closePattern.lastIndex = endIndex;
                      
                      openMatch = openPattern.exec(html);
                      closeMatch = closePattern.exec(html);
                      
                      if (!closeMatch) break;
                      
                      if (openMatch && openMatch.index < closeMatch.index) {
                        openTags++;
                        endIndex = openMatch.index + openMatch[0].length;
                      } else {
                        openTags--;
                        endIndex = closeMatch.index + closeMatch[0].length;
                      }
                    }
                    
                    if (openTags === 0) {
                      return html.substring(startIndex, endIndex);
                    }
                  }
                }
                
                return null;
              } catch (e) {
                return null;
              }
            };
            
            const content = findContent(html, selector);
            
            if (content) {
              let processedContent = content.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');
              
              processedContent = processedContent.replace(/<img([^>]*)>/gi, (match, attributes) => {
                return '<img' + attributes + ' data-worker-processed="true">';
              });
              
              processedContent = processedContent.replace(/data-src=/gi, 'data-worker-lazy="true" data-src=');
              
              processedContent = processedContent.replace(/<(iframe|embed)([^>]*)>/gi, 
                (match, tag, attributes) => {
                  return '<' + tag + attributes + ' data-worker-embed="true">';
                }
              );
              
              self.postMessage({
                processedUrl: url,
                content: processedContent
              });
            } else {
              self.postMessage({
                processedUrl: url,
                error: 'Content not found',
                content: null
              });
            }
          } catch (error) {
            self.postMessage({
              processedUrl: url,
              error: error.message,
              content: null
            });
          }
        }
      });
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    window.contentProcessor = new Worker(workerUrl);
    
    window.contentProcessor.onerror = (error) => {
      window.contentProcessor = null;
      window.contentProcessorReady = false;
    };
    
    URL.revokeObjectURL(workerUrl);
    
    window.contentProcessorReady = true;
  } catch (error) {
    window.contentProcessor = null;
    window.contentProcessorReady = false;
  }
};

// Initialize package accordion
function initializePackageAccordion() {
    const accordionHeaders = document.querySelectorAll(
      ".package_accordion_header"
    );
    accordionHeaders.forEach((header) => {
      header.addEventListener("click", function () {
        const parentAccordion = header.closest(".package_accordion");
        if (parentAccordion) {
          parentAccordion.classList.toggle("is-active");
        }
      });
    });
  }
  

// Initializes swipers for all modal galleries
function initializeGallerySwipers() {
  const galleryTypes = [
    { class: "is-hotel-gallery", attr: "data-swiper-hotel" },
    { class: "is-room-gallery", attr: "data-swiper-room" },
    { class: "is-hospitality-gallery", attr: "data-swiper-hospitality" },
  ];

  galleryTypes.forEach(({ class: galleryClass, attr: dataAttr }) => {
    document.querySelectorAll(`.swiper.${galleryClass}`).forEach((gallery) => {
      const uniqueValue = gallery.getAttribute(dataAttr);
      if (!uniqueValue) return;

      const slideCount = gallery.querySelectorAll('.swiper-slide').length;

      new Swiper(gallery, {
        slidesPerView: 1,
        slideActiveClass: "is-active",
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        loop: true,
        preventClicks: false,
        preventClicksPropagation: false,
        navigation: {
          nextEl: `[data-swiper-button-next="${uniqueValue}"]`,
          prevEl: `[data-swiper-button-prev="${uniqueValue}"]`,
          disabledClass: "is-disabled",
        },
        pagination: {
          el: `.swiper-pagination[${dataAttr}="${uniqueValue}"]`,
          type: "bullets",
          dynamicBullets: true,
        },
        on: {
          init: function() {
            const btnWrap = gallery.closest(".package_gallery_contain")?.querySelector(".gallery_btn_wrap");
            const prevBtn = document.querySelector(`[data-swiper-button-prev="${uniqueValue}"]`);
            const nextBtn = document.querySelector(`[data-swiper-button-next="${uniqueValue}"]`);
            
            const hasMultipleSlides = slideCount > 1;
            
            if (btnWrap) {
              btnWrap.style.display = hasMultipleSlides ? "flex" : "none";
            }
            
            if (prevBtn && nextBtn) {
              const displayValue = hasMultipleSlides ? "block" : "none";
              prevBtn.style.display = displayValue;
              nextBtn.style.display = displayValue;
            }
          }
        }
      });
    });
  });
}



// Check for scope-specific counters init in experience modal and duplicate for package modal 
const initializeDataCountersInScope = (scope) => {
  if (!scope) return;
  
  const counterGroups = new Set();
  scope.querySelectorAll('[data-counter-element]').forEach(element => {
    if (element.dataset.counterGroup) {
      counterGroups.add(element.dataset.counterGroup);
    }
  });
  
  counterGroups.forEach(group => {
    const minusBtn = scope.querySelector(`[data-counter-element="minus"][data-counter-group="${group}"]`);
    const plusBtn = scope.querySelector(`[data-counter-element="plus"][data-counter-group="${group}"]`);
    const valueDisplay = scope.querySelector(`[data-counter-element="value"][data-counter-group="${group}"]`);
    const hiddenInput = scope.querySelector(`[data-counter-element="input"][data-counter-group="${group}"]`);
    
    if (!minusBtn || !plusBtn || !valueDisplay) return;
    
    let currentValue = parseInt(valueDisplay.textContent) || 0;
    const minValue = parseInt(minusBtn.dataset.counterMin) || 0;
    const maxValue = parseInt(plusBtn.dataset.counterMax) || 99;
    
    const updateValue = (newValue) => {
      currentValue = Math.max(minValue, Math.min(maxValue, newValue));
      valueDisplay.textContent = currentValue;
      if (hiddenInput) {
        hiddenInput.value = currentValue;
      }
      
      minusBtn.disabled = currentValue <= minValue;
      plusBtn.disabled = currentValue >= maxValue;
    };
    
    minusBtn.addEventListener('click', () => updateValue(currentValue - 1));
    plusBtn.addEventListener('click', () => updateValue(currentValue + 1));
    
    // Initialize state
    updateValue(currentValue);
  });
}; 

// Initializes modal content with all needed functionality
const initializeModalContent = async (contentElement) => {
    let availabilitySyncCleanup = null; // Store cleanup function
    
    const initSequence = [
        () => initializePackageAccordion(),
        // Setup paragraph toggles for the package modal content
        () => {
            if (packageModalTarget && typeof window.setupParagraphToggles === 'function') {
                window.setupParagraphToggles(packageModalTarget);
                
                // Observe paragraphs for resize events
                if (typeof window.observeParagraphsForResize === 'function') {
                    window.observeParagraphsForResize(packageModalTarget);
                }
            }
        },
        () => {
            initializeGallerySwipers();
            adjustHotelStars();
        },
        () => {
            initializeTabGroupsInScope(packageModalTarget);
            initializeDataCountersInScope(packageModalTarget);
            initializePackageForm(packageModalTarget);
            initializeTabButtons(packageModalTarget);
            
            // Initialize availability checkbox sync
            availabilitySyncCleanup = initializeAvailabilitySync(packageModalTarget);
        },
        () => {
            // Destroy and reinitialize Finsweet CMS Select
            if (typeof window.fsAttributes !== 'undefined' && window.fsAttributes.cmsselect) {
                try {
                    // Destroy existing instances
                    if (window.fsAttributes.cmsselect.destroy) {
                        window.fsAttributes.cmsselect.destroy();
                    }
                    
                    // Reinitialize for the modal content
                    if (window.fsAttributes.cmsselect.init) {
                        window.fsAttributes.cmsselect.init();
                    }
                } catch (error) {
                    console.warn('Failed to reinitialize Finsweet CMS Select:', error);
                }
            }
        },
        () => {
            // Check for SVG elements before CMS nesting
            processSVGElements(packageModalTarget);
            
            // Initialize videos if VideoManager is available
            if (typeof VideoManager !== 'undefined') {
                packageModalTarget.querySelectorAll('.video_contain')
                    .forEach(container => VideoManager.setupVideo(container));
            }
            cmsNest();
        }
    ];

    for (const init of initSequence) {
        await new Promise(resolve => requestAnimationFrame(() => {
            init();
            resolve();
        }));
    }

    await new Promise(resolve => {
        let eventFired = false;
        
        document.addEventListener("cmsNestComplete", (event) => {
            eventFired = true;
            
            requestAnimationFrame(() => {
                if (typeof insertSVGFromCMS === 'function') {
                    insertSVGFromCMS(packageModalTarget);
                }
                hideEmptyDivs();
                resolve();
            });
        }, { once: true });
        
        // Add a safety fallback in case the event never fires
        setTimeout(() => {
            if (!eventFired) {
                if (packageModalTarget) {
                    const markedElements = packageModalTarget.querySelectorAll("[data-svg-needs-processing='true']");
                    
                    const svgElements = packageModalTarget.querySelectorAll(".svg-code");
                    
                    const potentialContainers = packageModalTarget.querySelectorAll('[data-cms-nest^="dropzone-"]');
                    let nestedSvgCount = 0;
                    
                    potentialContainers.forEach(container => {
                        const nestedSvgs = container.querySelectorAll(".svg-code");
                        nestedSvgCount += nestedSvgs.length;
                    });
                    
                    if (markedElements.length > 0 || svgElements.length > 0 || nestedSvgCount > 0) {
                        if (typeof insertSVGFromCMS === 'function') {
                            insertSVGFromCMS(packageModalTarget);
                        }
                    }
                    
                    hideEmptyDivs();
                }
                
                resolve();
            }
        }, 2000);
    });
    
    // Store cleanup function for destruction when modal content changes
    if (availabilitySyncCleanup && packageModalTarget) {
        packageModalTarget._availabilitySyncCleanup = availabilitySyncCleanup;
    }
};

// Initializes and manages package form submission inside *any* modalTarget
const initializePackageForm = (modalTarget) => {
  if (!modalTarget) return;

  // (1) Grab the form by ID...
  const form = modalTarget.querySelector('#wf-form-Package');
  // (2) ...and *any* button with data-form-submit
  const submitBtn = modalTarget.querySelector('[data-form-submit]');
  const formWrapper = form?.closest('.w-form');
  if (!form || !submitBtn || !formWrapper) return;

  // when the form actually fires its submit event
  form.addEventListener('submit', () => {
    submitBtn.classList.add('is-loading');
    submitBtn.classList.remove('is-success');
    submitBtn.disabled = true;

    const btnText = submitBtn.querySelector('.btn_push_text');
    const btnIcon = submitBtn.querySelector('.btn_push_icon_mask');
    if (btnText) {
      btnText.textContent = 'Sending...';
      btnText.classList.remove('has-tick');
    }
    if (btnIcon) btnIcon.style.display = 'none';
  });

  // helper to stop loading; pass true on success
  const stopLoading = (isSuccess = false) => {
    submitBtn.classList.remove('is-loading');
    const btnText = submitBtn.querySelector('.btn_push_text');
    const btnIcon = submitBtn.querySelector('.btn_push_icon_mask');

    if (isSuccess) {
      submitBtn.classList.add('is-success');
      if (btnText) {
        btnText.textContent = 'Request sent';
        btnText.classList.add('has-tick');
      }
    } else {
      submitBtn.classList.remove('is-success');
      if (btnText) {
        btnText.textContent = 'Submit';
        btnText.classList.remove('has-tick');
      }
    }
    submitBtn.disabled = false;
    if (btnIcon) btnIcon.style.display = isSuccess ? 'none' : '';
  };

  // watch for Webflow's success/fail wrappers toggling inline styles
  const observer = new MutationObserver((mutations) => {
    const successWrap = formWrapper.querySelector('.w-form-done');
    const failWrap    = formWrapper.querySelector('.w-form-fail');

    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        if (successWrap?.style.display === 'block') {
          stopLoading(true);
        } else if (failWrap?.style.display === 'block') {
          stopLoading(false);
        }
      }
    });
  });
  observer.observe(formWrapper, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: true
  });

  // intercept the "real" submit button click so we can run our loading UI
  submitBtn.addEventListener('click', () => {
    const tempBtn = document.createElement('button');
    tempBtn.type = 'submit';
    tempBtn.style.display = 'none';
    form.appendChild(tempBtn);
    tempBtn.click();
    form.removeChild(tempBtn);
  });

  // re-init Webflow forms if needed
  if (window.Webflow && Webflow.require) {
    try {
      const forms = Webflow.require("forms");
      if (forms && typeof forms.ready === 'function') {
        forms.ready();
      }
    } catch (e) {
      // ignore
    }
  }
};

// Manages multi-step form tab buttons
const initializeTabButtons = (scope = document) => {
  const backBtn = scope.querySelector('.package_btn_tab_wrap.is-back');
  const forwardBtn = scope.querySelector('.package_btn_tab_wrap.is-forward');
  const submitBtn = scope.querySelector('.package_btn_tab_wrap.is-submit');
  
  if (!backBtn || !forwardBtn || !submitBtn) return;
  
  forwardBtn.addEventListener('click', function() {
    forwardBtn.classList.add('is-hidden');
    submitBtn.classList.remove('is-hidden');
    backBtn.classList.remove('is-hidden');
  });
  
  backBtn.addEventListener('click', function() {
    backBtn.classList.add('is-hidden');
    submitBtn.classList.add('is-hidden');
    forwardBtn.classList.remove('is-hidden');
  });
};

// Synchronizes availability checkboxes between forms
const initializeAvailabilitySync = (modalTarget) => {
  if (!modalTarget) return null;
  
  const availabilityForm = modalTarget.querySelector('#wf-form-Availability');
  const packageForm = modalTarget.querySelector('#wf-form-Package');
  
  if (!availabilityForm || !packageForm) return null;
  
  const availabilityCheckboxes = availabilityForm.querySelectorAll('input[name="date"]');
  const packageCheckboxes = packageForm.querySelectorAll('input[name="date"]');
  
  if (!availabilityCheckboxes.length || !packageCheckboxes.length) return null;
  
  const eventListeners = [];
  let isSyncing = false; // Prevent infinite loops
  
  // Helper function to find matching checkbox by value
  const findMatchingCheckbox = (value, checkboxes) => {
    return Array.from(checkboxes).find(cb => cb.value === value);
  };
  
  // Sync from availability form to package form
  availabilityCheckboxes.forEach(checkbox => {
    const handler = (event) => {
      if (isSyncing) return;
      
      const matchingCheckbox = findMatchingCheckbox(checkbox.value, packageCheckboxes);
      if (matchingCheckbox) {
        isSyncing = true;
        matchingCheckbox.checked = checkbox.checked;
        
        // Trigger change event on the target checkbox
        const changeEvent = new Event('change', { bubbles: true });
        matchingCheckbox.dispatchEvent(changeEvent);
        
        // Update parent label states
        const parentLabel = matchingCheckbox.closest('label');
        if (parentLabel) {
          parentLabel.classList.toggle('is-checked', checkbox.checked);
        }
        
        setTimeout(() => { isSyncing = false; }, 0);
      }
    };
    
    checkbox.addEventListener('change', handler);
    eventListeners.push({ element: checkbox, type: 'change', handler });
  });
  
  // Sync from package form to availability form
  packageCheckboxes.forEach(checkbox => {
    const handler = (event) => {
      if (isSyncing) return;
      
      const matchingCheckbox = findMatchingCheckbox(checkbox.value, availabilityCheckboxes);
      if (matchingCheckbox) {
        isSyncing = true;
        matchingCheckbox.checked = checkbox.checked;
        
        // Trigger change event on the target checkbox
        const changeEvent = new Event('change', { bubbles: true });
        matchingCheckbox.dispatchEvent(changeEvent);
        
        // Update parent label states
        const parentLabel = matchingCheckbox.closest('label');
        if (parentLabel) {
          parentLabel.classList.toggle('is-checked', checkbox.checked);
        }
        
        setTimeout(() => { isSyncing = false; }, 0);
      }
    };
    
    checkbox.addEventListener('change', handler);
    eventListeners.push({ element: checkbox, type: 'change', handler });
  });
  
  // Return cleanup function
  return () => {
    eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    eventListeners.length = 0;
  };
};



// Initialize package cards on page load    
document.addEventListener('DOMContentLoaded', () => {
  if (packageModalTarget) {
    const packageCards = document.querySelectorAll(cardsSelector);
    attachPackageCardHandlers(packageCards);
    
    // Initialize forms for both package and experience modals
    initializePackageForm(packageModalTarget);
    
    const experienceModalTarget = document.querySelector(
      '[data-modal-group="experience"][data-modal-element="tray-contain"]'
    );
    initializePackageForm(experienceModalTarget);
  }
}, { passive: true });

// Observer for new package cards added to the DOM
const packageCardObserver = new MutationObserver((mutations) => {
  setTimeout(() => {
    let newCards = [];
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node matches our card selector
            if (node.matches && node.matches(cardsSelector)) {
              newCards.push(node);
            }
            
            if (node.querySelectorAll) {
              const nestedCards = node.querySelectorAll(cardsSelector);
              if (nestedCards.length > 0) {
                newCards = newCards.concat(Array.from(nestedCards));
              }
            }
          }
        }
      }
    }
    
    if (newCards.length > 0) {
      attachPackageCardHandlers(newCards);
    }
  }, 0);
});

// Start observing for new package cards
if (packageModalTarget) {
  packageCardObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
} 