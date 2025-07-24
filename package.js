// Package Modal Management System

// Packages Swiper Management System - Integrated with UniversalSwiperManager
let PackagesSwiperManager;

// Single function to check if packages swipers exist or are likely to exist
const shouldInitializePackagesSwipers = () => {
  const hasExistingPackages = document.querySelectorAll(".swiper.is-packages").length > 0;
  const mightGetPackages = document.querySelector('.exp_card_wrap, .package_modal_wrap, [data-package-card]') !== null;
  return hasExistingPackages || mightGetPackages;
};

// Create packages swiper manager that handles multiple .is-packages instances
const createPackagesSwiperManager = () => {
  // Ensure UniversalSwiperManager is available
  if (!window.UniversalSwiperManager) {
    return {
      manageSwipers: () => {},
      setupResizeListener: () => {},
      swiperInstances: [],
      refresh: () => {},
      destroy: () => {}
    };
  }

  let swiperInstances = [];
  
  // Simple swiper initialization for packages
  const initializePackageSwiper = ({
    selector,
    comboClass,
    slidesPerView,
    breakpoints,
    grid,
    speed,
    spaceBetween
  }) => {
    const swiperConfig = {
      speed: speed || 400,
      slidesPerView,
      spaceBetween: spaceBetween || 0,
      navigation: {
        nextEl: `[data-swiper-button-next="${comboClass}"]`,
        prevEl: `[data-swiper-button-prev="${comboClass}"]`,
      },
      breakpoints,
      on: {
        init() {
          // Basic init logic
        },
        slideChange() {
          // Basic slideChange logic
        },
        resize() {
          // Basic resize logic
        },
      },
    };

    // Add grid configuration if provided
    if (grid) {
      swiperConfig.grid = grid;
    }

    const swiper = new Swiper(selector, swiperConfig);
    return swiper;
  };

  // Create a base manager for packages
  const createBaseManager = () => {
    return window.UniversalSwiperManager.createManager({
      name: 'Packages',
      swiperConfigs: [], // Will be populated dynamically
      initializeSwiper: initializePackageSwiper,
      desktopBreakpoint: 991,
      initDelay: 50,
      verificationDelay: 100
    });
  };

  const baseManager = createBaseManager();

  // Enhanced packages swiper management with smart instance tracking
  const managePackagesSwipers = () => {
    // Check for packages swipers each time this runs (they may be added/removed dynamically)
    const packageSwipers = document.querySelectorAll(".swiper.is-packages");
    const isSwiperEnabled = window.innerWidth > 991;
    
    // Create a set of existing swiper unique IDs for comparison
    const existingSwiperIds = new Set(
      swiperInstances
        .filter(swiper => swiper && swiper.comboClass)
        .map(swiper => swiper.comboClass)
    );
    
    // Track current DOM swipers by their unique IDs
    const currentDOMSwiperIds = new Set();
    
    if (packageSwipers.length === 0) {
      // Clean up all instances if no packages swipers found
      if (swiperInstances.length > 0) {
        swiperInstances.forEach(swiper => {
          if (swiper && swiper.destroy) {
            swiper.destroy(true, true);
          }
        });
        swiperInstances.length = 0;
        
        // Reset all button wrappers
        const packageButtonWrappers = document.querySelectorAll('[data-swiper-combo*="is-packages"]');
        packageButtonWrappers.forEach((btnWrap) => {
          btnWrap.style.display = "none";
        });
      }
      return;
    }

    if (isSwiperEnabled) {
      // Process each swiper container
      packageSwipers.forEach((swiperContainer) => {
        const slides = swiperContainer.querySelectorAll(".swiper-slide");
        if (slides.length === 0) return;
        
        // Check if this swiper already has a unique ID
        let uniqueCombo = swiperContainer.getAttribute('data-swiper-unique');
        
        // If no unique ID exists, create one
        if (!uniqueCombo) {
          uniqueCombo = `is-packages-${Math.random().toString(36).substr(2, 9)}`;
          swiperContainer.setAttribute('data-swiper-unique', uniqueCombo);
        }
        
        currentDOMSwiperIds.add(uniqueCombo);
        
        // Check if this swiper instance already exists
        const existingSwiper = swiperInstances.find(swiper => 
          swiper && swiper.comboClass === uniqueCombo
        );
        
        if (!existingSwiper) {
          // This is a new swiper - initialize it
          
          // Reset button wrapper display first
          const packageButtonWrappers = document.querySelectorAll(`[data-swiper-combo="${uniqueCombo}"]`);
          packageButtonWrappers.forEach((btnWrap) => {
            btnWrap.style.display = "none";
          });
          
          // Update nav button wrappers for this instance
          const btnWrap = swiperContainer.closest('.exp_card_accordion_content')?.querySelector('[data-swiper-combo="is-packages"]');
          if (btnWrap && btnWrap.getAttribute('data-swiper-combo') === 'is-packages') {
            btnWrap.setAttribute('data-swiper-combo', uniqueCombo);
          }
          
          // Update nav buttons for this instance
          const nextBtn = btnWrap?.querySelector('[data-swiper-button-next="is-packages"]');
          const prevBtn = btnWrap?.querySelector('[data-swiper-button-prev="is-packages"]');
          if (nextBtn && nextBtn.getAttribute('data-swiper-button-next') === 'is-packages') {
            nextBtn.setAttribute('data-swiper-button-next', uniqueCombo);
          }
          if (prevBtn && prevBtn.getAttribute('data-swiper-button-prev') === 'is-packages') {
            prevBtn.setAttribute('data-swiper-button-prev', uniqueCombo);
          }
          
          // Create config for this instance
          const instanceConfig = {
            selector: `[data-swiper-unique='${uniqueCombo}']`,
            comboClass: uniqueCombo,
            slidesPerView: "auto",
          };
          
          // Use the enhanced initializer from base manager
          const enhancedInitializer = baseManager.createInitializeSwiper(initializePackageSwiper);
          const swiper = enhancedInitializer(instanceConfig);
          if (swiper) {
            swiperInstances.push(swiper);
          }
        }
      });
      
      // Remove swipers that no longer exist in DOM
      swiperInstances = swiperInstances.filter(swiper => {
        if (!swiper || !swiper.comboClass) return false;
        
        if (!currentDOMSwiperIds.has(swiper.comboClass)) {
          // This swiper no longer exists in DOM - destroy it
          if (swiper.destroy) {
            swiper.destroy(true, true);
          }
          return false;
        }
        return true;
      });
      
      // Final verification step for all current swipers
      setTimeout(() => {
        swiperInstances.forEach((swiper) => {
          if (swiper && swiper.comboClass && baseManager.toggleButtonWrapper) {
            baseManager.toggleButtonWrapper(swiper);
          }
        });
      }, 100);
      
    } else {
      // Mobile: Reset button wrappers and destroy all swipers
      const packageButtonWrappers = document.querySelectorAll('[data-swiper-combo*="is-packages"]');
      packageButtonWrappers.forEach((btnWrap) => {
        btnWrap.style.display = "none";
      });
      
      // Destroy all swipers
      while (swiperInstances.length > 0) {
        const swiper = swiperInstances.pop();
        if (swiper && swiper.destroy) {
          swiper.destroy(true, true);
        }
      }
    }
  };

  return {
    manageSwipers: managePackagesSwipers,
    swiperInstances,
    setupResizeListener: () => {
      const debouncedManagePackagesSwipers = (typeof Utils !== 'undefined' && Utils.debounce) 
        ? Utils.debounce(managePackagesSwipers, 200)
        : (() => {
            let timeout;
            return () => {
              clearTimeout(timeout);
              timeout = setTimeout(managePackagesSwipers, 200);
            };
          })();
      
      window.addEventListener("resize", debouncedManagePackagesSwipers);
      
      // Initial call
      managePackagesSwipers();
    },
    refresh: managePackagesSwipers,
    destroy: () => {
      swiperInstances.forEach(swiper => {
        if (swiper) {
          swiper.destroy(true, true);
        }
      });
      swiperInstances.length = 0;
    }
  };
};

// Function to initialize packages swiper manager
const initializePackagesSwiperManager = () => {
  if (window.UniversalSwiperManager) {
    PackagesSwiperManager = createPackagesSwiperManager();
    PackagesSwiperManager.setupResizeListener();
    return true;
  }
  return false;
};

// Try to initialize packages swiper manager
const initializePackagesSwipers = () => {
  if (!initializePackagesSwiperManager()) {
    // If not available, wait for DOM content loaded and try again
    document.addEventListener('DOMContentLoaded', () => {
      if (!initializePackagesSwiperManager()) {
        // If still not available, wait a bit more
        setTimeout(() => {
          initializePackagesSwiperManager();
        }, 100);
      }
    });
  }
};

// Only initialize if packages swipers exist or are likely to exist
if (shouldInitializePackagesSwipers()) {
  initializePackagesSwipers();
}

// Public API for refreshing packages swipers when new packages are added
window.refreshPackagesSwipers = () => {
  if (PackagesSwiperManager && PackagesSwiperManager.refresh) {
    PackagesSwiperManager.refresh();
  } else if (shouldInitializePackagesSwipers()) {
    // Try to initialize if manager doesn't exist but packages do
    initializePackagesSwipers();
  }
};

// Enhanced DOM monitoring for new .is-packages swipers
const watchForNewPackagesSwipers = () => {
  // Ensure we only create one observer
  if (window.packagesObserver) {
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    let hasNewPackages = false;
    let hasRemovedPackages = false;
    
    mutations.forEach((mutation) => {
      // Check for added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is a packages swiper or contains one
          if (node.classList && node.classList.contains('is-packages')) {
            hasNewPackages = true;
          } else if (node.querySelector && node.querySelector('.swiper.is-packages')) {
            hasNewPackages = true;
          }
          // Also check for elements that might contain package cards that create swipers
          else if (node.querySelector && node.querySelector('.exp_card_wrap, .package_modal_wrap, [data-package-card]')) {
            hasNewPackages = true;
          }
        }
      });
      
      // Check for removed nodes
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList && node.classList.contains('is-packages')) {
            hasRemovedPackages = true;
          } else if (node.querySelector && node.querySelector('.swiper.is-packages')) {
            hasRemovedPackages = true;
          }
        }
      });
    });
    
    // Handle changes with debouncing
    if (hasNewPackages || hasRemovedPackages) {
      clearTimeout(window.packagesRefreshTimeout);
      window.packagesRefreshTimeout = setTimeout(() => {
        // Always try to refresh if manager exists
        if (PackagesSwiperManager && PackagesSwiperManager.refresh) {
          PackagesSwiperManager.refresh();
        }
        // Initialize if manager doesn't exist but packages are detected
        else if (!PackagesSwiperManager && shouldInitializePackagesSwipers()) {
          initializePackagesSwipers();
        }
        // If packages were removed and no longer exist, clean up
        else if (hasRemovedPackages && !shouldInitializePackagesSwipers() && PackagesSwiperManager) {
          if (PackagesSwiperManager.destroy) {
            PackagesSwiperManager.destroy();
          }
          PackagesSwiperManager = null;
        }
      }, 200);
    }
  });
  
  // Store observer reference for cleanup
  window.packagesObserver = observer;
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false, // Don't watch attribute changes for better performance
    characterData: false
  });
  
  // Cleanup function
  return () => {
    observer.disconnect();
    window.packagesObserver = null;
    clearTimeout(window.packagesRefreshTimeout);
  };
};

// Enhanced initialization with better monitoring
const startPackagesMonitoring = () => {
  // Always start monitoring regardless of initial state
  // This ensures we catch packages added dynamically later
  const cleanup = watchForNewPackagesSwipers();
  
  // Store cleanup function globally for potential cleanup
  window.cleanupPackagesMonitoring = cleanup;
  
  // Initial check and setup
  if (shouldInitializePackagesSwipers()) {
    initializePackagesSwipers();
  }
};

// Start monitoring immediately when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure other scripts have loaded
  setTimeout(() => {
    startPackagesMonitoring();
  }, 100);
});

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
      bars: this.modalTarget.querySelectorAll('[data-modal-element="bar"][data-modal-group="package"]'),
      content: this.modalTarget.querySelector('[data-tab-element="content"][data-modal-group="package"]')
    };
    return this.elements;
  }
  
  handleResize() {
    // Update mobile status
    const wasMobile = this.isMobile;
    this.isMobile = typeof Utils !== 'undefined' && Utils.isMobile ? Utils.isMobile() : window.innerWidth <= 767;
  }

  setInitialState() {
    // Initial states are now handled by CSS with body:not([data-page="package"]) selectors
    // Only trigger a reflow to ensure CSS has been applied
    this.modalTarget.offsetHeight;
  }

  createTimeline() {
    const elements = this.getElements();
    this.timeline = gsap.timeline({
      onComplete: () => {
        // Performance cleanup: remove will-change after animation
        if (typeof Utils !== 'undefined' && Utils.PerformanceUtils) {
          const allElements = [
            elements.bar,
            elements.content
          ].filter(Boolean);
          
          Utils.PerformanceUtils.cleanupWillChange(allElements);
        }
      }
    });

    // Use performance-optimized animation properties
    const getOptimizedProps = (props) => {
      return typeof Utils !== 'undefined' && Utils.PerformanceUtils 
        ? Utils.PerformanceUtils.getOptimizedAnimProps(props)
        : { ...props, force3D: true };
    };

        if (elements.bars && elements.bars.length > 0) {
      this.timeline.to(elements.bars, getOptimizedProps({
        opacity: 1,
        duration: 0.2,
        ease: "power1.out"
      }), 0);
    }

    if (elements.content) {
      this.timeline.to(elements.content, getOptimizedProps({
        opacity: 1,
        duration: 0.2,
        ease: "power1.out"
      }), 0);
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
    // Initial states are now handled by CSS with body:not([data-page="package"]) selectors
    // No GSAP initial state setting needed
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
            targets: elements.bars,
            props: { opacity: 1 }
        },
        {
            targets: elements.content,
            props: { opacity: 1 }
        }
    ];

    animations.forEach(({ targets, props }) => {
        if (!targets || (targets.length !== undefined && targets.length === 0)) return;
        timeline.to(targets, {
            ...props,
            duration: 0.2,
            ease: "power1.out"
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
      // Clean up existing drag functionality before replacing content
      if (packageModalTarget._dragCleanup) {
        packageModalTarget._dragCleanup();
      }
      
      packageModalTarget.innerHTML = "";
      packageModalTarget.setAttribute('data-current-url', url);
      
      const contentClone = content.cloneNode(true);
      prepareContentForInsertion(contentClone);
      
      const elements = {
        bar: contentClone.querySelector('[data-modal-element="bar"][data-modal-group="package"]'),
        content: contentClone.querySelector('[data-tab-element="content"][data-modal-group="package"]')
      };
      
      // Single setInitialStates function that only runs once
      const setInitialStatesOnce = (() => {
        let hasRun = false;
        return () => {
          if (hasRun) {
            return;
          }
          hasRun = true;
          
          // Initial states are now handled by CSS with body:not([data-page="package"]) selectors
          // Only trigger a reflow to ensure CSS has been applied
          packageModalTarget.offsetHeight; // This forces a layout
        };
      })();
      
      packageModalTarget.appendChild(contentClone);
      
      // Set initial states only once
      setInitialStatesOnce();

      // Initialize content IMMEDIATELY in parallel with base animations
      const contentInitResult = await initializeModalContent(contentClone);

              // Wait for BOTH base animation AND content initialization to complete
        // Handle both old return format (Promise) and new format ({ cmsNestPromise, deferredOperations })
        const cmsPromise = contentInitResult && typeof contentInitResult === 'object' && contentInitResult.cmsNestPromise 
          ? contentInitResult.cmsNestPromise 
          : (contentInitResult || Promise.resolve());
          
        Promise.all([modalAnimationComplete, cmsPromise]).then(() => {
          // Content is now ready - animate immediately with no delay
          requestAnimationFrame(() => {
            // Check if required elements exist before animating - use querySelectorAll for multiple bars
            const bars = packageModalTarget.querySelectorAll('[data-modal-element="bar"][data-modal-group="package"]');
            const content = packageModalTarget.querySelector('[data-tab-element="content"][data-modal-group="package"]');
            const closeBtn = packageModalTarget.querySelector('[data-modal-element="close-btn"][data-modal-group="package"]');
            
            const contentTl = gsap.timeline({
              onComplete: () => {
                // Run heavy operations AFTER animations complete
                if (contentInitResult && contentInitResult.deferredOperations) {
                  // Use requestIdleCallback for heavy operations or setTimeout fallback
                  if ('requestIdleCallback' in window) {
                    requestIdleCallback(contentInitResult.deferredOperations, { timeout: 100 });
                  } else {
                    setTimeout(contentInitResult.deferredOperations, 16); // ~1 frame delay
                  }
                }
              }
            });
            
            // Animate all bar elements
            if (bars.length > 0) {
              contentTl.to(bars, { 
                opacity: 1, 
                duration: 0.2, 
                ease: "power1.out" 
              }, 0);
            }
            
            if (closeBtn) {
              contentTl.to(closeBtn, { 
                opacity: 1, 
                duration: 0.2, 
                ease: "power1.out" 
              }, 0);
            }
            
            if (content) {
              contentTl.to(content, {
                opacity: 1, 
                duration: 0.2, 
                ease: "power1.out"
              }, 0.05);
            }
            
            // If no elements found, complete immediately
            if (bars.length === 0 && !content && !closeBtn) {
              contentTl.set({}, {}, 0.2); // Dummy animation to trigger onComplete
            }
          });
        });
    }
  } else {
    const elements = {
      bar: packageModalTarget.querySelector('[data-modal-element="bar"][data-modal-group="package"]'),
      content: packageModalTarget.querySelector('[data-tab-element="content"][data-modal-group="package"]')
    };
    
    // Single setInitialStates for existing content
    const setInitialStatesExisting = () => {
      // Initial states are now handled by CSS with body:not([data-page="package"]) selectors
      // Only trigger a reflow to ensure CSS has been applied
      packageModalTarget.offsetHeight;
    };
    
    setInitialStatesExisting();
    
    modalAnimationComplete.then(() => {
      requestAnimationFrame(() => {
        // Check if required elements exist for existing content - use querySelectorAll for multiple bars
        const bars = packageModalTarget.querySelectorAll('[data-modal-element="bar"][data-modal-group="package"]');
        const content = packageModalTarget.querySelector('[data-tab-element="content"][data-modal-group="package"]');
        const closeBtn = packageModalTarget.querySelector('[data-modal-element="close-btn"][data-modal-group="package"]');
        
        const contentTl = gsap.timeline();
        
        // Animate all bar elements
        if (bars.length > 0) {
          contentTl.to(bars, { 
            opacity: 1, 
            duration: 0.2, 
            ease: "power1.out" 
          }, 0);
        }
        
        if (closeBtn) {
          contentTl.to(closeBtn, { 
            opacity: 1, 
            duration: 0.2, 
            ease: "power1.out" 
          }, 0);
        }
        
        if (content) {
          contentTl.to(content, {
            opacity: 1, 
            duration: 0.2, 
            ease: "power1.out"
          }, 0);
        }
        
        // If no elements found, complete immediately
        if (bars.length === 0 && !content && !closeBtn) {
          contentTl.set({}, {}, 0.2); // Dummy animation to trigger onComplete
        }
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
    
    // Force main thread processing - web worker was causing failures
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const content = doc.querySelector(contentSelector);
    
    if (!content) {
      throw new Error("Content not found in fetched document");
    }
    
    return content;
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
  if (typeof Swiper === 'undefined') {
    return;
  }

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
        loop: slideCount > 1,
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
  
  // Fallback: If no data-counter-element groups found, try to initialize based on HTML structure
  if (counterGroups.size === 0) {
    initializeCountersByStructure(scope);
  }
};

// Alternative counter initialization based on actual HTML structure
const initializeCountersByStructure = (scope) => {
  if (!scope) return;
  
  const counterWraps = scope.querySelectorAll('.form_field_counter_wrap');
  
  counterWraps.forEach((wrap) => {
    // Find the input field
    const input = wrap.querySelector('.form_field_input.is-counter, input[type="number"]');
    
    if (!input) return;
    
    // Find minus button (first .btn_counter_wrap)
    const minusBtn = wrap.querySelector('.form_field_button_wrap:not(.is-right) .btn_counter_wrap');
    
    // Find plus button (.btn_counter_wrap inside .is-right)
    const plusBtn = wrap.querySelector('.form_field_button_wrap.is-right .btn_counter_wrap');
    
    if (!minusBtn || !plusBtn) return;
    
    // Get min/max values from input attributes
    const minValue = parseInt(input.getAttribute('min')) || 0;
    const maxValue = parseInt(input.getAttribute('max')) || 99;
    
    // Initialize current value
    let currentValue = parseInt(input.value) || parseInt(input.getAttribute('placeholder')) || minValue;
    
    const updateValue = (newValue) => {
      currentValue = Math.max(minValue, Math.min(maxValue, newValue));
      input.value = currentValue;
      
      // Update button states
      minusBtn.disabled = currentValue <= minValue;
      plusBtn.disabled = currentValue >= maxValue;
      
      // Trigger input event for any listeners
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    };
    
    // Add event listeners
    minusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateValue(currentValue - 1);
    });
    
    plusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateValue(currentValue + 1);
    });
    
    // Initialize state
    updateValue(currentValue);
  });
}; 

// Initializes drag-to-scroll for amenities grids on desktop
const initializeAmenitiesGridDrag = (scope) => {
    if (!scope || window.innerWidth <= 992) return;
    
    const amenitiesGrids = scope.querySelectorAll('.package_amenities_grid');
    
    amenitiesGrids.forEach((grid, index) => {
        // Skip if already initialized
        if (grid.hasAttribute('data-drag-initialized')) return;
        grid.setAttribute('data-drag-initialized', 'true');
        
        // State variables for drag interaction
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;
        let velocityTracker = [];
        let animationId = null;
        let originalScrollSnapType = null;
        
        // Enhanced easing function from the article
        const easeOutQuad = (t) => t * (2 - t);
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        
        // Setup grid for dragging
        grid.style.cursor = 'grab';
        grid.style.userSelect = 'none';
        grid.style.overflowX = 'auto';
        grid.style.scrollBehavior = 'auto'; // Disable native smooth scrolling during drag
        
        // Store original scroll-snap-type for toggling
        const computedStyle = getComputedStyle(grid);
        originalScrollSnapType = computedStyle.scrollSnapType || 'x mandatory';
        
        // Calculate snap points based on visible items
        const calculateSnapPoints = () => {
            const items = grid.querySelectorAll('.package_amenities_item, .amenity-item, .grid-item, .amenity_item');
            if (items.length === 0) return [0];
            
            const snapPoints = [0];
            const containerWidth = grid.clientWidth;
            const itemMargin = parseInt(getComputedStyle(items[0]).marginRight || 0);
            
            items.forEach((item, i) => {
                if (i > 0) {
                    const itemWidth = item.offsetWidth + itemMargin;
                    const position = snapPoints[i - 1] + itemWidth;
                    const maxScroll = grid.scrollWidth - containerWidth;
                    
                    if (position <= maxScroll) {
                        snapPoints.push(position);
                    }
                }
            });
            
            // Always include the end position
            snapPoints.push(grid.scrollWidth - containerWidth);
            return [...new Set(snapPoints)].filter(point => point >= 0).sort((a, b) => a - b);
        };
        
        // Find nearest snap point using article's approach
        const getNearestSnapPoint = (position) => {
            const snapPoints = calculateSnapPoints();
            return snapPoints.reduce((nearest, snap) => 
                Math.abs(snap - position) < Math.abs(nearest - position) ? snap : nearest
            );
        };
        
        // Velocity-based momentum scrolling with requestAnimationFrame
        const animateScroll = (startPos, targetPos, duration = 800) => {
            const startTime = performance.now();
            const distance = targetPos - startPos;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Use easing function from the article
                const easedProgress = easeOutCubic(progress);
                const currentPos = startPos + (distance * easedProgress);
                
                grid.scrollLeft = currentPos;
                
                if (progress < 1) {
                    animationId = requestAnimationFrame(animate);
                } else {
                    // Re-enable scroll-snap after animation completes
                    grid.style.scrollSnapType = originalScrollSnapType;
                    grid.style.scrollBehavior = 'smooth';
                }
            };
            
            // Cancel any existing animation
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        // Calculate velocity using performance.now() for accuracy
        const updateVelocity = (currentX) => {
            const now = performance.now();
            velocityTracker.push({ x: currentX, time: now });
            
            // Keep only recent samples for velocity calculation (last 100ms)
            velocityTracker = velocityTracker.filter(sample => now - sample.time < 100);
        };
        
        // Get current velocity based on recent samples
        const getCurrentVelocity = () => {
            if (velocityTracker.length < 2) return 0;
            
            const recent = velocityTracker.slice(-5); // Use last 5 samples
            const timeDelta = recent[recent.length - 1].time - recent[0].time;
            const positionDelta = recent[recent.length - 1].x - recent[0].x;
            
            return timeDelta > 0 ? (positionDelta / timeDelta) * 1000 : 0; // pixels per second
        };
        
        // Mouse down - start dragging
        const handleMouseDown = (e) => {
            isDragging = true;
            startX = e.pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
            velocityTracker = [];
            
            // Disable scroll-snap during dragging as per article
            grid.style.scrollSnapType = 'none';
            grid.style.scrollBehavior = 'auto';
            grid.style.cursor = 'grabbing';
            grid.classList.add('dragging');
            
            // Cancel any ongoing animations
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            updateVelocity(e.pageX);
            e.preventDefault();
        };
        
        // Mouse move - handle dragging
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentX = e.pageX - grid.offsetLeft;
            const walk = (currentX - startX) * 1.5; // Speed multiplier
            const newScrollLeft = scrollLeft - walk;
            
            // Apply overscroll resistance
            const maxScroll = grid.scrollWidth - grid.clientWidth;
            let finalScrollLeft;
            
            if (newScrollLeft < 0) {
                // Left overscroll with resistance
                finalScrollLeft = newScrollLeft * 0.3;
            } else if (newScrollLeft > maxScroll) {
                // Right overscroll with resistance  
                const excess = newScrollLeft - maxScroll;
                finalScrollLeft = maxScroll + (excess * 0.3);
            } else {
                finalScrollLeft = newScrollLeft;
            }
            
            grid.scrollLeft = finalScrollLeft;
            updateVelocity(e.pageX);
        };
        
        // Mouse up - handle momentum and snapping
        const handleMouseUp = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            grid.style.cursor = 'grab';
            grid.classList.remove('dragging');
            
            const currentScroll = grid.scrollLeft;
            const maxScroll = grid.scrollWidth - grid.clientWidth;
            const velocity = getCurrentVelocity();
            
            // Handle overscroll bounce-back
            if (currentScroll < 0 || currentScroll > maxScroll) {
                const bounceTarget = Math.max(0, Math.min(maxScroll, currentScroll));
                const snapTarget = getNearestSnapPoint(bounceTarget);
                
                animateScroll(currentScroll, snapTarget, 600);
                return;
            }
            
            // Calculate momentum-based target position
            const momentum = velocity * 0.3; // Momentum factor
            let targetPosition = currentScroll - momentum;
            
            // Clamp to valid range
            targetPosition = Math.max(0, Math.min(maxScroll, targetPosition));
            
            // Find nearest snap point
            const snapTarget = getNearestSnapPoint(targetPosition);
            const distanceToSnap = Math.abs(snapTarget - currentScroll);
            
            // Determine animation duration based on distance and velocity
            let duration = Math.max(300, Math.min(1200, distanceToSnap * 2));
            
            if (Math.abs(velocity) > 100) {
                // High velocity - use momentum + snap
                animateScroll(currentScroll, snapTarget, duration);
            } else if (distanceToSnap > 10) {
                // Low velocity - gentle snap
                animateScroll(currentScroll, snapTarget, 400);
            } else {
                // Very close - just re-enable scroll-snap
                grid.style.scrollSnapType = originalScrollSnapType;
                grid.style.scrollBehavior = 'smooth';
            }
        };
        
        // Mouse leave - handle edge case
        const handleMouseLeave = () => {
            if (isDragging) {
                handleMouseUp({ pageX: startX }); // End drag without momentum
            }
        };
        
        // Add event listeners following article's pattern
        grid.addEventListener('mousedown', handleMouseDown);
        grid.addEventListener('mousemove', handleMouseMove);
        grid.addEventListener('mouseup', handleMouseUp);
        grid.addEventListener('mouseleave', handleMouseLeave);
        
        // Prevent context menu during drag
        grid.addEventListener('contextmenu', (e) => {
            if (isDragging) {
                e.preventDefault();
            }
        });
        
        // Prevent text selection during drag as mentioned in article
        grid.addEventListener('selectstart', (e) => {
            if (isDragging) e.preventDefault();
        });
        
        // Store cleanup function for proper memory management
        grid._dragCleanup = () => {
            // Cancel any running animations
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            // Remove all event listeners
            grid.removeEventListener('mousedown', handleMouseDown);
            grid.removeEventListener('mousemove', handleMouseMove);
            grid.removeEventListener('mouseup', handleMouseUp);
            grid.removeEventListener('mouseleave', handleMouseLeave);
            grid.removeEventListener('contextmenu', (e) => {
                if (isDragging) e.preventDefault();
            });
            grid.removeEventListener('selectstart', (e) => {
                if (isDragging) e.preventDefault();
            });
            
            // Reset attributes and styles
            grid.removeAttribute('data-drag-initialized');
            grid.classList.remove('dragging');
            grid.style.cursor = '';
            grid.style.userSelect = '';
            grid.style.scrollSnapType = originalScrollSnapType;
            grid.style.scrollBehavior = '';
            
            // Reset state
            isDragging = false;
            velocityTracker = [];
        };
    });
};



/**
 * Cloud animations using GSAP for mobile devices
 * Handles modal display issues and provides better mobile performance
 */
class CloudAnimationController {
  constructor() {
    this.animations = [];
    this.isMobile = typeof Utils !== 'undefined' && Utils.isMobile ? Utils.isMobile() : window.innerWidth <= 768;
    this.isAnimating = false;
    
    // Initialize only on mobile
    if (this.isMobile && typeof gsap !== 'undefined') {
      this.init();
    }
  }

  init() {
    // Set initial positions without animation
    this.setInitialPositions();
    
    // Create animations but don't start them yet
    this.createAnimations();
  }

  setInitialPositions() {
    if (typeof gsap === 'undefined') return;
    
    gsap.set('.package_flight_cloud.is-1', {
      x: '-120%',
      opacity: 1,
      force3D: true
    });

    gsap.set('.package_flight_cloud.is-2', {
      x: '0%',
      rotationX: -180,
      rotationY: -180,
      opacity: 1,
      force3D: true
    });

    gsap.set('.package_flight_cloud.is-3', {
      x: '-60%',
      rotationX: -180,
      opacity: 1,
      force3D: true
    });

    gsap.set('.package_flight_cloud.is-4', {
      x: '60%',
      rotationY: 180,
      opacity: 1,
      force3D: true
    });
  }

  createAnimations() {
    if (typeof gsap === 'undefined') return;
    
    // Cloud 1 animation
    const cloud1Timeline = gsap.timeline({ repeat: -1, paused: true });
    cloud1Timeline
      .set('.package_flight_cloud.is-1', { x: '-120%', opacity: 0 })
      .to('.package_flight_cloud.is-1', { 
        duration: 0.4, 
        x: '120%', 
        opacity: 0, 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-1', { 
        duration: 0.4, 
        opacity: 1, 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-1', { 
        duration: 19.2, 
        x: '0%', 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-1', { 
        duration: 20, 
        x: '-120%', 
        ease: 'none' 
      });

    // Cloud 2 animation
    const cloud2Timeline = gsap.timeline({ repeat: -1, paused: true });
    cloud2Timeline
      .set('.package_flight_cloud.is-2', { 
        x: '0%', 
        rotationX: -180, 
        rotationY: -180, 
        opacity: 1 
      })
      .to('.package_flight_cloud.is-2', { 
        duration: 16.8, 
        x: '-120%', 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-2', { 
        duration: 0.35, 
        opacity: 0, 
        ease: 'none' 
      })
      .set('.package_flight_cloud.is-2', { x: '120%' })
      .to('.package_flight_cloud.is-2', { 
        duration: 0.35, 
        opacity: 1, 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-2', { 
        duration: 17.5, 
        x: '0%', 
        ease: 'none' 
      });

    // Cloud 3 animation
    const cloud3Timeline = gsap.timeline({ repeat: -1, paused: true });
    cloud3Timeline
      .set('.package_flight_cloud.is-3', { 
        x: '-60%', 
        rotationX: -180, 
        opacity: 1 
      })
      .to('.package_flight_cloud.is-3', { 
        duration: 10.8, 
        x: '-120%', 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-3', { 
        duration: 0.45, 
        opacity: 0, 
        ease: 'none' 
      })
      .set('.package_flight_cloud.is-3', { x: '120%' })
      .to('.package_flight_cloud.is-3', { 
        duration: 0.45, 
        opacity: 1, 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-3', { 
        duration: 33.3, 
        x: '-60%', 
        ease: 'none' 
      });

    // Cloud 4 animation
    const cloud4Timeline = gsap.timeline({ repeat: -1, paused: true });
    cloud4Timeline
      .set('.package_flight_cloud.is-4', { 
        x: '60%', 
        rotationY: 180, 
        opacity: 1 
      })
      .to('.package_flight_cloud.is-4', { 
        duration: 25.6, 
        x: '-120%', 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-4', { 
        duration: 0.4, 
        opacity: 0, 
        ease: 'none' 
      })
      .set('.package_flight_cloud.is-4', { x: '120%' })
      .to('.package_flight_cloud.is-4', { 
        duration: 0.4, 
        opacity: 1, 
        ease: 'none' 
      })
      .to('.package_flight_cloud.is-4', { 
        duration: 13.6, 
        x: '60%', 
        ease: 'none' 
      });

    // Store animations
    this.animations = [cloud1Timeline, cloud2Timeline, cloud3Timeline, cloud4Timeline];
  }

  // Call this when modal opens
  startAnimations() {
    if (!this.isMobile || this.isAnimating || typeof gsap === 'undefined') return;
    
    this.isAnimating = true;
    
    // Small delay to ensure modal is visible
    gsap.delayedCall(0.1, () => {
      this.animations.forEach(animation => {
        animation.play();
      });
    });
  }

  // Call this when modal closes
  stopAnimations() {
    if (!this.isMobile || typeof gsap === 'undefined') return;
    
    this.isAnimating = false;
    
    this.animations.forEach(animation => {
      animation.pause();
    });
    
    // Reset to initial positions
    this.setInitialPositions();
  }

  // Call this if window resizes
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = typeof Utils !== 'undefined' && Utils.isMobile ? Utils.isMobile() : window.innerWidth <= 768;
    
    // If switching from desktop to mobile, initialize
    if (!wasMobile && this.isMobile && typeof gsap !== 'undefined') {
      this.init();
    }
    // If switching from mobile to desktop, clean up
    else if (wasMobile && !this.isMobile) {
      this.stopAnimations();
    }
  }

  // Cleanup function
  destroy() {
    this.stopAnimations();
    this.animations = [];
  }
}

// Initialize cloud controller
let cloudController = null;

// Initializes modal content with all needed functionality
const initializeModalContent = async (contentElement) => {
    let availabilitySyncCleanup = null; // Store cleanup function
    
    // Split initialization into critical and deferred phases
    const criticalInitSequence = [
        () => {
            initializePackageAccordion();
        },
        () => {
            initializeDataCountersInScope(packageModalTarget);
            initializePackageForm(packageModalTarget);
            initializeTabButtons(packageModalTarget);
            
            // Initialize availability checkbox sync
            availabilitySyncCleanup = initializeAvailabilitySync(packageModalTarget);
        },

    ];

    // Run critical initialization synchronously but efficiently
    for (const init of criticalInitSequence) {
        init(); // Run synchronously for speed
    }

    // Defer ALL heavy operations until after animations complete
    const deferredOperations = () => {
        // These operations can be deferred as they don't affect initial layout
        const deferredSequence = [
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
                        // Silent error handling
                    }
                }
            }
        ];

        // Run deferred operations efficiently
        deferredSequence.forEach(operation => operation());
    };

    // Handle SVG and CMS operations efficiently
    // Check for SVG elements before CMS nesting - defer if not critical
    const hasSVGElements = processSVGElements(packageModalTarget);
    
    // Start CMS nesting immediately but don't block
    cmsNest();

    initializeTabGroupsInScope(packageModalTarget);
    
    // Initialize cloud animations for mobile after tab groups are set up
    if (!cloudController) {
        cloudController = new CloudAnimationController();
    }
    
    // Start cloud animations when modal opens (mobile only)
    if (cloudController && cloudController.isMobile) {
        cloudController.startAnimations();
    }
    
    // Don't await CMS nest completion - let it happen in background
    const cmsNestPromise = new Promise(resolve => {
        let eventFired = false;
        
        document.addEventListener("cmsNestComplete", (event) => {
            eventFired = true;
            
            // Process SVG and cleanup in the background
            requestAnimationFrame(() => {
                if (typeof insertSVGFromCMS === 'function') {
                    insertSVGFromCMS(packageModalTarget);
                }
                hideEmptyDivs();
                
                // Initialize drag-to-scroll for amenities grids after CMS Nest completes
                initializeAmenitiesGridDrag(packageModalTarget);
                
                resolve();
            });
        }, { once: true });
        
        // Fallback timeout - much shorter since we're not blocking
        setTimeout(() => {
            if (!eventFired) {
                // Handle fallback in background without blocking
                requestAnimationFrame(() => {
                    if (packageModalTarget) {
                        const markedElements = packageModalTarget.querySelectorAll("[data-svg-needs-processing='true']");
                        const svgElements = packageModalTarget.querySelectorAll(".svg-code");
                        
                        if (markedElements.length > 0 || svgElements.length > 0) {
                            if (typeof insertSVGFromCMS === 'function') {
                                insertSVGFromCMS(packageModalTarget);
                            }
                        }
                        
                        hideEmptyDivs();
                    }
                    
                    // Initialize drag-to-scroll for amenities grids after fallback timeout
                    initializeAmenitiesGridDrag(packageModalTarget);
                    
                    resolve();
                });
            }
        }, 500); // Much shorter timeout since we're non-blocking
    });

    // Store cleanup function for destruction when modal content changes
    if (availabilitySyncCleanup && packageModalTarget) {
        packageModalTarget._availabilitySyncCleanup = availabilitySyncCleanup;
    }
    
    // Store drag cleanup function
    if (packageModalTarget) {
        packageModalTarget._dragCleanup = () => {
            const amenitiesGrids = packageModalTarget.querySelectorAll('.package_amenities_grid[data-drag-initialized]');
            amenitiesGrids.forEach(grid => {
                if (grid._dragCleanup) {
                    grid._dragCleanup();
                }
            });
        };
    }
    
    // Return both the completion promise AND deferred operations function
    // This allows the caller to decide when to run heavy operations
    return {
        cmsNestPromise,
        deferredOperations
    };
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

// Clean up drag functionality and cloud animations when package modal closes
document.addEventListener('packageModalClosed', () => {
  if (packageModalTarget && packageModalTarget._dragCleanup) {
    packageModalTarget._dragCleanup();
  }
  
  // Stop cloud animations when modal closes
  if (cloudController) {
    cloudController.stopAnimations();
  }
});

// Handle window resize for drag functionality and cloud animations
const handleResize = () => {
  if (packageModalTarget) {
    const isDesktop = window.innerWidth > 992;
    const hasInitializedGrids = packageModalTarget.querySelectorAll('.package_amenities_grid[data-drag-initialized]').length > 0;
    
    if (!isDesktop && hasInitializedGrids) {
      // Clean up drag functionality on mobile
      if (packageModalTarget._dragCleanup) {
        packageModalTarget._dragCleanup();
      }
    } else if (isDesktop && !hasInitializedGrids) {
      // Initialize drag functionality on desktop
      const amenitiesGrids = packageModalTarget.querySelectorAll('.package_amenities_grid');
      if (amenitiesGrids.length > 0) {
        initializeAmenitiesGridDrag(packageModalTarget);
      }
    }
  }
  
  // Handle cloud animation resize
  if (cloudController) {
    cloudController.handleResize();
  }
};

// Use Utils.debounce if available, otherwise fallback to manual debouncing
const debouncedResize = (typeof Utils !== 'undefined' && Utils.debounce) 
  ? Utils.debounce(handleResize, 150)
  : (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(handleResize, 150);
      };
    })();

window.addEventListener('resize', debouncedResize);

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