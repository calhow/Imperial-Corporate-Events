// Set background color from data attributes
const setBgColor = (element) => {
  const bgColor = element.dataset.bgColor || "transparent"; // Fallback to transparent
  element.style.backgroundColor = bgColor;
};

document.querySelectorAll("[data-bg-color]").forEach(setBgColor);

// Global Utilities Module
const Utils = (() => {
  const debounce = (func, wait = 200) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const isInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };
  
  // Device detection utility
  const isMobile = () => window.innerWidth <= 767;


  // Timeout fetch utility
  const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  };

  // Performance optimization utilities
  const PerformanceUtils = {
    // Clean up will-change after animation
    cleanupWillChange: (elements) => {
      if (!elements) return;
      const elementsArray = Array.isArray(elements) ? elements : [elements];
      elementsArray.forEach(el => {
        if (el && el.style) {
          el.style.willChange = 'auto';
        }
      });
    },

    // Get optimized animation properties with GPU acceleration
    getOptimizedAnimProps: (props) => {
      return {
        ...props,
        force3D: true,
        ease: props.ease || "power1.out"
      };
    },

    // Batch DOM operations to minimize reflows
    batchDOMOperations: (operations) => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          operations.forEach(op => op());
          resolve();
        });
      });
    }
  };

  // Safe event handling utilities
  const safeClosest = (event, selector) => {
    if (!event?.target?.closest || typeof event.target.closest !== 'function') {
      return null;
    }
    try {
      return event.target.closest(selector);
    } catch (e) {
      return null;
    }
  };

  return {
    debounce,
    isInViewport,
    isMobile,
    fetchWithTimeout,
    PerformanceUtils,
    safeClosest
  };
})();

// Watch for elements with data-bg-color added dynamically
const observer = new MutationObserver((mutations) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (node.hasAttribute("data-bg-color")) {
        setBgColor(node);
      }

      node.querySelectorAll("[data-bg-color]").forEach(setBgColor);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Parse and fix SVG code from CMS
function insertSVGFromCMS(container = document) {
  // Find both standard SVG code elements and specially marked ones
  const svgElements = container.querySelectorAll(".svg-code, [data-svg-needs-processing='true']");
  let processedCount = 0;
  
  svgElements.forEach((element, index) => {
    const svgCode = element.textContent;
    
    // Skip if no content or already processed
    if (!svgCode || element.hasAttribute('data-svg-processed')) {
      return;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      const hasParserError = doc.querySelector('parsererror') !== null;
      
      if (svg && !hasParserError) {
        const invalidValueAttrs = Array.from(svg.attributes)
          .filter(attr => (attr.name === 'width' || attr.name === 'height') && attr.value === 'auto');
        
        invalidValueAttrs.forEach(attr => {
          svg.removeAttribute(attr.name);
        });
        
        const fixedSvg = svg.cloneNode(true);
        element.insertAdjacentElement("afterend", document.importNode(fixedSvg, true));
        processedCount++;
      } else {
        const wrapper = document.createElement('div');
        const cleanedSvgCode = svgCode.replace(/\s(width|height)="auto"/g, '');
        wrapper.innerHTML = cleanedSvgCode;
        
        if (wrapper.firstElementChild) {
          element.insertAdjacentElement("afterend", wrapper.firstElementChild);
          processedCount++;
        } else {
          element.insertAdjacentHTML("afterend", cleanedSvgCode);
          processedCount++;
        }
      }
      
      // Mark as processed to avoid duplicate processing
      element.setAttribute('data-svg-processed', 'true');
      
    } catch (e) {
      try {
        const cleanSvg = svgCode.replace(/\s(width|height)="auto"/g, '');
        element.insertAdjacentHTML("afterend", cleanSvg);
        element.setAttribute('data-svg-processed', 'true');
        processedCount++;
      } catch (err) {
        // Silent fallback to avoid breaking the page
      }
    }
  });
  return processedCount;
}

insertSVGFromCMS();

// Watch for new SVG elements added to the DOM
const svgObserver = new MutationObserver(mutations => {
  let hasNewSVGElements = false;
  
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // Skip if not an element
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      
      // Check if the added node itself needs SVG processing
      if (node.classList && (node.classList.contains('svg-code') || node.hasAttribute('data-svg-needs-processing'))) {
        hasNewSVGElements = true;
      }
      
      // Check for SVG elements within the added node
      if (node.querySelectorAll) {
        const newSVGElements = node.querySelectorAll(".svg-code, [data-svg-needs-processing='true']");
        if (newSVGElements.length > 0) {
          hasNewSVGElements = true;
        }
      }
    });
  });
  
  // Only process if we found new SVG elements
  if (hasNewSVGElements) {
    insertSVGFromCMS();
  }
});

// Start observing for SVG elements
svgObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Initialize smooth scrolling
const lenis = new Lenis({
  lerp: 0.1,
  smoothWheel: true,
  smoothTouch: false,
  overscroll: false,
  prevent: (node) => node.closest(".u-modal-prevent-scroll") !== null,
});

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);


// Initialize form field counters
const initializeCountersInScope = (scope = document) => {
  scope.querySelectorAll('.form_field_counter_wrap').forEach(wrapper => {
    const input = wrapper.querySelector('.form_field_input.is-counter');
    const buttons = wrapper.querySelectorAll('.btn_counter_wrap');
    if (!input || buttons.length !== 2) return;

    const min = +input.min || 2;
    const step = +input.step || 1;

    if (!input.value) input.value = min;

    const getValue = () => isNaN(+input.value) ? min : +input.value;

    buttons[0].onclick = () => input.value = Math.max(min, getValue() - step);
    buttons[1].onclick = () => input.value = getValue() + step;
  });
};

document.addEventListener('DOMContentLoaded', () => initializeCountersInScope());


// MODAL ANIMATION
const modalStates = {}; // Tracks state for each modal group
window.modalStates = modalStates; // Expose to window for other modules

function updateLiveChatVisibility() {
  const anyModalOpen = Object.values(modalStates).some((state) => state);
  
  if (!window.LiveChatWidget) return;

  try {
    if (typeof window.LiveChatWidget.get === 'function') {
      const state = window.LiveChatWidget.get("state");
      
      if (state && (state.visibility === "maximized" || state.visibility === "minimized")) {
        if (anyModalOpen) {
          window.LiveChatWidget.call("hide");
        } else {
          window.LiveChatWidget.call("minimize");
        }
      }
    } else {
      requestAnimationFrame(() => {
        if (typeof window.LiveChatWidget.get === 'function') {
          updateLiveChatVisibility();
        }
      });
    }
  } catch (e) {
    // Silently handle LiveChat errors during initialization
  }
}

function toggleBodyScrollAndAnimate(modalGroup) {
  const anyModalOpen = Object.values(modalStates).some((state) => state);
  if (anyModalOpen) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
}


// Helper function to add common BG & Tray animations
const addBgTrayAnimations = (timeline, modalGroup) => {
  return timeline
    .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, 
      Utils.PerformanceUtils.getOptimizedAnimProps({ 
        opacity: 1, 
        duration: 0.3, 
        ease: "power4.Out"
      }), 0)
    .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, 
      Utils.PerformanceUtils.getOptimizedAnimProps({ 
        x: "0%", 
        duration: 0.35, 
        ease: "power4.Out"
      }), 0.1);
};

// Helper function to add common BG & Tray exit animations
const addBgTrayExitAnimations = (timeline, modalGroup, startTime = 0) => {
  return timeline
    .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
      opacity: 0, 
      duration: 0.3, 
      ease: "power1.in" 
    }, startTime)
    .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { 
      x: "105%", 
      duration: 0.35, 
      ease: "power1.in" 
    }, startTime);
};

// Helper function to add common Bar & Close Button entry animations
const addBarCloseEntryAnimations = (timeline, modalGroup, barTime = 0.35, closeBtnTime = 0.35) => {
  return timeline
    .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { 
      opacity: 1, 
      duration: 0.2, 
      ease: "power1.out" 
    }, barTime)
    .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { 
      opacity: 1, 
      duration: 0.2, 
      ease: "power1.out" 
    }, closeBtnTime);
};

// Helper function to add common Bar & Close Button exit animations
const addBarCloseExitAnimations = (timeline, modalGroup, startTime = 0) => {
  return timeline
    .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { 
      opacity: 0, 
      duration: 0.2, 
      ease: "power1.in" 
    }, startTime)
    .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { 
      opacity: 0, 
      duration: 0.2, 
      ease: "power1.in" 
    }, startTime);
};

// Helper function to add content entry animation
const addContentEntryAnimation = (timeline, modalGroup, startTime = 0.3) => {
  return timeline
    .to(`[data-tab-element="content"][data-modal-group='${modalGroup}']`, Utils.PerformanceUtils.getOptimizedAnimProps({
      opacity: 1, 
      duration: 0.2, 
      ease: "power1.out"
    }), startTime);
};

// Helper function to add content exit animation
const addContentExitAnimation = (timeline, modalGroup, startTime = 0) => {
  return timeline
    .to(`[data-tab-element="content"][data-modal-group='${modalGroup}']`, { 
      opacity: 0, 
      duration: 0.2, 
      ease: "power1.out"
    }, startTime);
};

document.addEventListener("click", (event) => {
  const modalToggleBtn = Utils.safeClosest(event,
    "[data-modal-open], [data-modal-close]"
  );
  if (!modalToggleBtn) {
    return;
  }

  const modalGroup =
    modalToggleBtn.getAttribute("data-modal-open") ||
    modalToggleBtn.getAttribute("data-modal-close");
  const isOpening = modalToggleBtn.hasAttribute("data-modal-open");
  
  const isTrayModal = document.querySelector(`[data-modal-element='modal'][data-modal-group='${modalGroup}'][data-modal-type='tray']`) !== null;
  const trayModalType = isTrayModal ? modalGroup : null;



  let modalTl = gsap.timeline({
    onStart: () => {
      if (isOpening) {
        updateLiveChatVisibility();
        
        // Initialize paragraph toggles for modal content
        requestAnimationFrame(() => {
          // Different handling based on modal type
          if (trayModalType === 'reviews') {
            // For reviews tray modal, we need to target the reviews list specifically
            const reviewsModalWrap = document.querySelector('.reviews_modal_wrap');
            const reviewsList = document.querySelector('.reviews_modal_review_list');
            
            if (reviewsModalWrap && typeof window.setupParagraphToggles === 'function') {
              // Process the entire reviews modal first
              window.setupParagraphToggles(reviewsModalWrap);
              
              // Then explicitly process the reviews list and individual reviews
              if (reviewsList) {
                window.setupParagraphToggles(reviewsList);
                
                // Process each individual review item to ensure proper handling
                const reviewItems = reviewsList.children;
                if (reviewItems && reviewItems.length > 0) {
                  Array.from(reviewItems).forEach(item => {
                    window.setupParagraphToggles(item);
                  });
                }
              }
              
              // Observe paragraphs for resize events
              if (typeof window.observeParagraphsForResize === 'function') {
                window.observeParagraphsForResize(reviewsModalWrap);
              }
            }
          } else {
            // For standard modals, just process the content container
            const modalContent = document.querySelector(`[data-modal-element='content'][data-modal-group='${modalGroup}']`);
            if (modalContent && typeof window.setupParagraphToggles === 'function') {
              window.setupParagraphToggles(modalContent);
              
              // Observe paragraphs for resize events
              if (typeof window.observeParagraphsForResize === 'function') {
                window.observeParagraphsForResize(modalContent);
              }
            }
          }
        });
      }
    },
    onComplete: () => {
      if (!isOpening) {
        gsap.set(
          `[data-modal-element='modal'][data-modal-group='${modalGroup}']`,
          { display: "none" }
        );
        modalStates[modalGroup] = false;
        updateLiveChatVisibility();
        
        // Update filter display when filter modal closes
        if (modalGroup === 'filter' && typeof window.FilterSystem !== 'undefined') {
          window.FilterSystem.updateActiveFiltersDisplay();
        }
      }

      // Performance cleanup: remove will-change and clear filters
      Utils.PerformanceUtils.batchDOMOperations([
        () => {
          const modalElements = document.querySelectorAll(`[data-modal-group='${modalGroup}'] [style*="will-change"]`);
          Utils.PerformanceUtils.cleanupWillChange(modalElements);
        }
      ]);
    }
  });

  if (isOpening) {
    modalStates[modalGroup] = true;
    
    // Update filter display when filter modal opens
    if (modalGroup === 'filter' && typeof window.FilterSystem !== 'undefined') {
      window.FilterSystem.updateActiveFiltersDisplay();
    }
    
    modalTl
      .set(`[data-modal-element='modal'][data-modal-group='${modalGroup}']`, {
        display: "inline-flex"
      });
      
    if (isTrayModal) {
      if (trayModalType === 'nav') {
        addBgTrayAnimations(modalTl, modalGroup);
        addBarCloseEntryAnimations(modalTl, modalGroup, 0.35, 0.3);
        modalTl.to(".nav_modal_close_mob", { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.35);
        addContentEntryAnimation(modalTl, modalGroup, 0.3);

        modalTl
          // Keep separate menu link list animation
          .to(".menu_link_list > *", Utils.PerformanceUtils.getOptimizedAnimProps({ 
            opacity: 1, duration: 0.2, ease: "power1.out", stagger: 0.015 
          }), 0.30);

      } else if (trayModalType === 'package') {
        addBgTrayAnimations(modalTl, modalGroup)
          .add(() => {
            document.dispatchEvent(new CustomEvent('packageModalAnimationComplete'));
          }, 0.35);

      } else if (trayModalType === 'experience') {
        addBgTrayAnimations(modalTl, modalGroup);
        addBarCloseEntryAnimations(modalTl, modalGroup, 0.35, 0.35);
        addContentEntryAnimation(modalTl, modalGroup, 0.3);
          
      } else if (trayModalType === 'reviews') {
        addBgTrayAnimations(modalTl, modalGroup);
        addBarCloseEntryAnimations(modalTl, modalGroup, 0.35, 0.35);
        addContentEntryAnimation(modalTl, modalGroup, 0.35);
      }
    } else {
      // Regular modal animation
      modalTl
        .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
          opacity: 1, 
          duration: 0.3, 
          ease: "power1.inOut"
        }, 0)
        .fromTo(`[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`, 
          { opacity: 0, y: "1rem" }, 
          { 
            opacity: 1, 
            y: "0rem", 
            duration: 0.3, 
            ease: "power1.out", 
            stagger: 0.1
          }, 0.1);
    }
  } else {
    modalStates[modalGroup] = false;
    
    if (isTrayModal) {
      if (trayModalType === 'nav') {
        // Keep separate menu link list closing animation
        modalTl
          .to(".menu_link_list > *", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0)
          .to(".nav_modal_close_mob", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0);
        addContentExitAnimation(modalTl, modalGroup, 0);
        addBarCloseExitAnimations(modalTl, modalGroup, 0);
        addBgTrayExitAnimations(modalTl, modalGroup, 0);
      } else if (trayModalType === 'package') {
        addBarCloseExitAnimations(modalTl, modalGroup, 0);
        addContentExitAnimation(modalTl, modalGroup, 0);
        
        addBgTrayExitAnimations(modalTl, modalGroup, 0.1)
          .add(() => {
            document.dispatchEvent(new CustomEvent('packageModalClosed'));
          });
      } else if (trayModalType === 'reviews') {
        modalTl
        .to(".nav_modal_close_mob", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0);
        addContentExitAnimation(modalTl, modalGroup, 0);
        addBarCloseExitAnimations(modalTl, modalGroup, 0);
        addBgTrayExitAnimations(modalTl, modalGroup, 0);
      } else if (trayModalType === 'experience') {
        addContentExitAnimation(modalTl, modalGroup, 0);
        addBarCloseExitAnimations(modalTl, modalGroup, 0);
        addBgTrayExitAnimations(modalTl, modalGroup, 0);
      }
    } else {
      // Regular modal exit animation
      modalTl
        .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
          opacity: 0, 
          duration: 0.25
        }, 0)
        .to(`[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`, { 
          opacity: 0, 
          y: "-1rem", 
          duration: 0.2, 
          ease: "power1.in", 
          stagger: -0.05
        }, 0);
    }
  }

  toggleBodyScrollAndAnimate(modalGroup);
});

// Add focus styles to search input
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".form_field_input.is-search");
  const parentList = searchInput?.closest(".form_search_list");

  if (parentList && searchInput) {
    parentList.addEventListener("focusin", () => {
      parentList.classList.add("is-active");
    });

    parentList.addEventListener("focusout", () => {
      parentList.classList.remove("is-active");
    });
  }
  
});

// Tab switch animation system
const initializeTabGroup = (group, root = document) => {
  const tabs = root.querySelectorAll(
    `[data-tab-element="tab"][data-tab-group="${group}"]`
  );
  if (tabs.length === 0) {
    return;
  }

  // Check if this tab group is already initialized
  const existingInitialized = Array.from(tabs).some(tab => tab.hasAttribute('data-tab-initialized'));
  if (existingInitialized) {
    return;
  }

  const contentElements = root.querySelectorAll(
    `[data-tab-element="content"][data-tab-group="${group}"]`
  );
  if (contentElements.length === 0) {
    return;
  }

  const contentsContainer = contentElements[0].parentElement;

  const parent = root.querySelector(
    `[data-tab-element="tab-wrap"][data-tab-group="${group}"]`
  );
  if (!parent) {
    return;
  }

  const tabMode = parent.getAttribute("data-tab-mode");

  let highlight;
  if (tabMode === "highlight") {
    highlight = parent.querySelector(".g_switch_tabs_highlight");
    if (!highlight) {
      highlight = document.createElement("div");
      highlight.className = "g_switch_tabs_highlight";
      parent.appendChild(highlight);
    }
  }

  const positionHighlight = (target) => {
    if (!highlight) return;
    highlight.style.top = `${target.offsetTop}px`;
    highlight.style.left = `${target.offsetLeft}px`;
    highlight.style.width = `${target.offsetWidth}px`;
    highlight.style.height = `${target.offsetHeight}px`;
  };

  // Find any active tab or default to first tab
  const activeTab = Array.from(tabs).find(tab => tab.classList.contains("is-active")) || tabs[0];
  tabs.forEach(t => t.classList.remove("is-active"));
  activeTab.classList.add("is-active");

  const isInModal =
    parent.closest('.u-modal-prevent-scroll[data-modal-element="modal"]') !==
    null;

  if (tabMode === "highlight") {
    if (isInModal) {
      // Modal-scoped elements (package modal content) use packageModalAnimationComplete
      if (root !== document) {
        const handlePackageModalComplete = () => {
          requestAnimationFrame(() => {
            const currentTabs = root.querySelectorAll(`[data-tab-element="tab"][data-tab-group="${group}"]`);
            const currentActiveTab = Array.from(currentTabs).find(tab => tab.classList.contains("is-active"));
            if (currentActiveTab && highlight && highlight.parentNode) {
              positionHighlight(currentActiveTab);
            }
          });
        };
        
        document.addEventListener('packageModalAnimationComplete', handlePackageModalComplete, { once: true });
      } else {
        // Document-level elements (nav modal content) use click-based timing
        document.addEventListener("click", (event) => {
          const modalOpenBtn = event.target.closest("[data-modal-open]");
          if (modalOpenBtn) {
            const modalGroup = modalOpenBtn.getAttribute("data-modal-open");
            
            // Only handle non-package modals (nav, experience, reviews, etc.)
            if (modalGroup !== 'package' && parent.closest(`[data-modal-group='${modalGroup}']`)) {
              setTimeout(() => {
                const currentActiveTab = Array.from(tabs).find(tab => tab.classList.contains("is-active"));
                if (currentActiveTab && highlight && highlight.parentNode) {
                  positionHighlight(currentActiveTab);
                }
              }, 50);
            }
          }
        });
      }
    } else {
      window.addEventListener("load", () => {
        positionHighlight(activeTab);
      });
    }
  }

  tabs.forEach((tab, index) => {
    tab.dataset.index = index;

    tab.addEventListener("click", () => {
      if (tab.classList.contains("is-active")) {
        return;
      }

      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");

      if (tabMode === "highlight") {
        const state = Flip.getState(highlight);
        positionHighlight(tab);

        Flip.from(state, {
          duration: 0.5,
          ease: "power2.inOut",
          scale: true,
        });
      }

      gsap.to(contentsContainer, {
        xPercent: -100 * index,
        duration: 0.5,
        ease: "power2.inOut",
      });
    });
  });

  // Mark tabs as initialized
  tabs.forEach(tab => tab.setAttribute('data-tab-initialized', 'true'));
};

// Initialize all tab groups within a scope
const initializeTabGroupsInScope = (scope = document) => {
  const tabGroups = new Set();
  scope.querySelectorAll('[data-tab-element="tab"]').forEach((tab) => {
    if (tab.dataset.tabGroup) {
      tabGroups.add(tab.dataset.tabGroup);
    }
  });
  
  tabGroups.forEach((group) => initializeTabGroup(group, scope));
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize tabs using the tab group system
  initializeTabGroupsInScope();
});

// Wait for upcoming tab with retries
async function getUpcomingTab(retries = 5, delay = 100) {
  while (retries > 0) {
    const tab = document.querySelector(
      `[data-tab-element="tab"][data-tab-match="upcoming"][data-tab-group="menu"]`
    );
    if (tab) return tab;
    await new Promise((resolve) => setTimeout(resolve, delay));
    retries--;
  }
  return null;
}

// Handle menu navigation button clicks
document.addEventListener("click", async (event) => {
  const button = Utils.safeClosest(event, "[data-target-button]");
  if (!button) {
    return;
  }

  const targetValue = button.getAttribute("data-target-button");
  const modalGroup = button.getAttribute("data-modal-open");

  if (modalGroup !== "nav") {
    return;
  }

  const modalTl = gsap.timeline({
    onComplete: () => {
      document.dispatchEvent(
        new CustomEvent("modalOpenComplete", { detail: modalGroup })
      );
    },
  });

  if (targetValue === "menu-search") {
    const targetAnchor = document.querySelector(
      `[data-target-anchor="${targetValue}"]`
    );
    const targetField = document.querySelector(
      `[data-target-field="${targetValue}"]`
    );

    if (!targetAnchor || !targetField) {
      return;
    }

    // Mobile focus handling - capture the user interaction immediately
    const isMobileDevice = Utils.isMobile();
    let mobileFocusHandler = null;
    
    if (isMobileDevice) {
      // Create a mobile-specific focus handler that preserves user interaction context
      mobileFocusHandler = () => {
        targetField.focus();
        targetField.setSelectionRange(
          targetField.value.length,
          targetField.value.length
        );
      };
    }

    document.addEventListener(
      "modalOpenComplete",
      async (event) => {
        if (event.detail !== modalGroup) {
          return;
        }

        const upcomingTab = await getUpcomingTab();
        if (upcomingTab && !upcomingTab.classList.contains("is-active")) {
          upcomingTab.click();
        }

        targetAnchor.scrollIntoView({ behavior: "smooth", block: "start" });

        if (isMobileDevice && mobileFocusHandler) {
          // On mobile, focus immediately without setTimeout to preserve user interaction context
          requestAnimationFrame(() => {
            mobileFocusHandler();
          });
        } else {
          // Desktop behavior with original setTimeout
          setTimeout(() => {
            targetField.focus();
            targetField.setSelectionRange(
              targetField.value.length,
              targetField.value.length
            );
          }, 300);
        }
      },
      { once: true }
    );
  }

  if (targetValue === "menu-contact") {
    document.addEventListener(
      "modalOpenComplete",
      (event) => {
        if (event.detail !== modalGroup) {
          return;
        }

        const contactTab = document.querySelector(
          `[data-tab-element="tab"][data-tab-match="contact"][data-tab-group="menu"]`
        );

        if (contactTab && !contactTab.classList.contains("is-active")) {
          contactTab.click();
        }
      },
      { once: true }
    );
  }
});

// Paragraph toggle system
(function setupParagraphToggles() {
  // Store paragraph clamp states to avoid repeated calculations
  const clampStateCache = new WeakMap();
  
  // Check if element is clamped
  const isClamped = (el) => {
    if (clampStateCache.has(el)) {
      return clampStateCache.get(el);
    }
    
    const result = el.scrollHeight > el.clientHeight;
    clampStateCache.set(el, result);
    return result;
  };
  
  // Process a single paragraph toggle
  const processToggle = (wrapElement) => {
    const isClampedType = wrapElement.classList.contains('g_para_clamped_wrap');
    const paraElement = wrapElement.querySelector(
      isClampedType ? '.g_para_clamped' : '.g_para_hover'
    );
    const toggleBtn = wrapElement.querySelector(
      isClampedType ? '.g_para_clamped_btn' : '.g_para_hover_btn'
    );
    
    if (!paraElement || !toggleBtn) return;
    
    // Get expanded state
    const isExpanded = paraElement.classList.contains('is-expanded');
    
    // Show button if expanded or clamped
    if (isExpanded || isClamped(paraElement)) {
      toggleBtn.classList.remove("is-hidden");
      toggleBtn.innerText = isExpanded ? "less" : "more";
    } else {
      toggleBtn.classList.add("is-hidden");
    }
  };
  
  // Main function to process toggles in any container
  window.setupParagraphToggles = function(container = document) {
    // Find all toggle elements in the container
    const clampedWrappers = container.querySelectorAll('.g_para_clamped_wrap');
    const hoverWrappers = container.querySelectorAll('.g_para_hover_wrap');
    
    const total = clampedWrappers.length + hoverWrappers.length;
    
    // If no toggles found in direct children but container has children, try processing them
    if (total === 0 && container !== document && container.children && container.children.length > 0) {
      const children = Array.from(container.children);
      
      // Recursively process each child container
      requestAnimationFrame(() => {
        children.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            window.setupParagraphToggles(child);
          }
        });
      });
      return;
    }
    
    // Process each wrapper
    requestAnimationFrame(() => {
      clampedWrappers.forEach(processToggle);
      hoverWrappers.forEach(processToggle);
    });
  };
  
  // Handle toggle button clicks
  document.addEventListener("click", function(event) {
    // Check if click was on a toggle button
    const toggleBtn = event.target.closest(".g_para_clamped_btn, .g_para_hover_btn");
    if (!toggleBtn) {
      return;
    }
    
    // Find parent and paragraph element
    const wrapElement = toggleBtn.closest(".g_para_clamped_wrap, .g_para_hover_wrap");
    if (!wrapElement) {
      return;
    }
    
    // Determine which type of paragraph we're dealing with
    const isClampedType = toggleBtn.classList.contains('g_para_clamped_btn');
    const paraElement = wrapElement.querySelector(
      isClampedType ? '.g_para_clamped' : '.g_para_hover'
    );
    
    if (!paraElement) {
      return;
    }
    
    // Toggle expanded state
    paraElement.classList.toggle("is-expanded");
    const isNowExpanded = paraElement.classList.contains("is-expanded");
    
    // Set button text based on expanded state
    toggleBtn.innerText = isNowExpanded ? "less" : "more";
  });
  
  // Set up ResizeObserver to invalidate cache on resize
  if ('ResizeObserver' in window) {
    // Create a single observer for all paragraph elements 
    const resizeObserver = new ResizeObserver((entries) => {
      // Only invalidate cache for elements that changed
      entries.forEach(entry => {
        if (clampStateCache.has(entry.target)) {
          clampStateCache.delete(entry.target);
          
          // Find the paragraph's wrapper element
          const wrapElement = entry.target.closest('.g_para_clamped_wrap, .g_para_hover_wrap');
          if (wrapElement) {
            processToggle(wrapElement);
          }
        }
      });
    });
    
    // Function to observe paragraph elements
    const observeParagraphs = (container = document) => {
      // Find paragraph elements to observe
      const clampedParagraphs = container.querySelectorAll('.g_para_clamped');
      const hoverParagraphs = container.querySelectorAll('.g_para_hover');
      
      // Observe each paragraph element
      clampedParagraphs.forEach(para => resizeObserver.observe(para));
      hoverParagraphs.forEach(para => resizeObserver.observe(para));
    };
    
    // Observe paragraphs in the document
    observeParagraphs();
    
    // Also observe body for overall layout changes
    resizeObserver.observe(document.body);
    
    // Add the observer function to the window for use with modals
    window.observeParagraphsForResize = observeParagraphs;
  }
  
  // Handle click on reviews to ensure they're processed
  document.addEventListener("click", function(event) {
    const reviewItem = event.target.closest(".reviews_modal_review_item, .review-contain");
    if (reviewItem) {
      // Check if this review has any unprocessed paragraph toggles
      const unprocessedToggles = reviewItem.querySelectorAll('.g_para_clamped_wrap, .g_para_hover_wrap');
      if (unprocessedToggles.length > 0) {
        window.setupParagraphToggles(reviewItem);
      }
    }
  });
  
  // Defer initial setup to idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      window.setupParagraphToggles();
    });
  } else {
    setTimeout(() => {
      window.setupParagraphToggles();
    }, 100);
  }
})();

// Set review stars based on score
document.addEventListener("DOMContentLoaded", function () {
  const starWraps = document.querySelectorAll(".card_review_star_wrap");

  starWraps.forEach(function (wrap) {
    const reviewScore = parseInt(wrap.getAttribute("data-review-score"), 10);
    const stars = wrap.children;

    if (isNaN(reviewScore) || reviewScore < 1 || reviewScore > 5) {
      for (let i = 0; i < stars.length; i++)
        stars[i].style.display = "inline-block";
    } else {
      for (let i = 0; i < stars.length; i++) {
        stars[i].style.display = i < reviewScore ? "inline-block" : "none";
      }
    }
  });
});

// Toggle accordion on click
document.addEventListener("click", function (event) {
  const accordion = event.target.closest(".accordion_wrap");
  if (accordion) {
    accordion.classList.toggle("is-active");
  }
});



// Open LiveChat when button clicked
(() => {
  const openChatButtons = document.querySelectorAll('[data-live-chat="open"]');

  if (!openChatButtons.length) return;

  openChatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (window.LiveChatWidget) {
        window.LiveChatWidget.call("maximize");
      }
    });
  });
})();

// Set review score to one decimal place

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.one-decimal').forEach(div => {
    const n = parseFloat(div.textContent);
    if (!isNaN(n)) {
      div.textContent = n.toFixed(1);
    }
  });
});

// Iterates through review scores on experience cards and sets the star wrapper width 
document.querySelectorAll('.exp_card_reviews').forEach(el => {
  el.style.width = `${el.dataset.reviewScore * 0.75}rem`;
});

// Unified Video Manager - High Performance & Simple
const UnifiedVideoManager = (() => {
  // HLS instance pool for reuse
  const hlsPool = new Map();
  const activeVideos = new Set();
  let intersectionObserver = null;
  let currentDevice = null;
  
  // Simple configuration
  const config = {
    fadeInDuration: 0.5,
    fadeOutDuration: 0.3,
    playDelay: 150,
    hlsConfig: {
      capLevelToPlayerSize: true,
      startLevel: -1,
      maxBufferLength: 15,
      maxMaxBufferLength: 15
    }
  };
  
  // Get or create HLS instance
  const getHLSInstance = (video) => {
    const source = video.querySelector('source');
    const hlsUrl = source?.dataset.hlsSrc;
    
    if (!hlsUrl || !Hls.isSupported()) return null;
    
    if (hlsPool.has(video)) {
      return hlsPool.get(video);
    }
    
    const hls = new Hls(config.hlsConfig);
    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
    
    hlsPool.set(video, hls);
    return hls;
  };
  
  // Play video with fade in
  const playVideo = (video) => {
    if (!video || activeVideos.has(video)) return;
    
    const source = video.querySelector('source');
    if (!source?.dataset.hlsSrc) return;
    
    activeVideos.add(video);
    
    // Clear any existing timeout
    if (video._playTimeout) {
      clearTimeout(video._playTimeout);
    }
    
    video._playTimeout = setTimeout(() => {
      const hls = getHLSInstance(video);
      
      if (hls) {
        hls.startLoad();
      }
      
      video.play().then(() => {
        requestAnimationFrame(() => {
          gsap.to(video, { 
            opacity: 1, 
            duration: config.fadeInDuration, 
            ease: "power2.out" 
          });
        });
      }).catch(() => {
        // Silent error handling
        activeVideos.delete(video);
      });
    }, config.playDelay);
  };
  
  // Pause video with fade out
  const pauseVideo = (video) => {
    if (!video) return;
    
    activeVideos.delete(video);
    
    if (video._playTimeout) {
      clearTimeout(video._playTimeout);
      video._playTimeout = null;
    }
    
    if (!video.paused) {
      video.pause();
    }
    
    gsap.to(video, { 
      opacity: 0, 
      duration: config.fadeOutDuration, 
      ease: "power2.out" 
    });
  };
  
  // Desktop hover handlers using event delegation
  const handleMouseOver = (event) => {
    const card = Utils.safeClosest(event, '.exp_card_wrap');
    if (!card) return;
    
    // Check if we're coming from outside the card
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && card.contains(relatedTarget)) return;
    
    const video = card.querySelector('.exp_card_video');
    if (video && hasValidVideoSource(video)) {
      playVideo(video);
    }
  };
  
  const handleMouseOut = (event) => {
    const card = Utils.safeClosest(event, '.exp_card_wrap');
    if (!card) return;
    
    // Check if we're moving to another element within the same card
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && card.contains(relatedTarget)) return;
    
    const video = card.querySelector('.exp_card_video');
    if (video) {
      pauseVideo(video);
    }
  };
  
  // Mobile scroll detection - handles both vertical and horizontal scrolling
  const setupMobileObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    
    // Separate videos into horizontal scrollers and standalone videos
    const horizontalScrollerVideos = new Map();
    const standaloneVideos = [];
    
    document.querySelectorAll('.exp_card_video').forEach(video => {
      if (!hasValidVideoSource(video)) return;
      
      // Setup initial state for all videos
      video.isVisuallyActive = false;
      const poster = video.parentElement?.querySelector('.exp_card_poster');
      if (poster?.src) video.poster = poster.src;
      gsap.set(video, { opacity: 0 });
      
      // Add playing listener if not already added
      if (!video.hasPlayingListener) {
        video.addEventListener('playing', () => {
          if (gsap.getProperty(video, "opacity") < 1) {
            requestAnimationFrame(() => {
              gsap.to(video, { opacity: 1, duration: config.fadeInDuration, ease: "power2.out" });
            });
          }
        });
        video.hasPlayingListener = true;
      }
      
      // Check if video is in a horizontal scroller
      const card = video.closest('.exp_card_wrap');
      const scroller = card?.closest('.swiper-wrapper');
      
      if (scroller && scroller.scrollWidth > scroller.clientWidth) {
        if (!horizontalScrollerVideos.has(scroller)) {
          horizontalScrollerVideos.set(scroller, []);
        }
        horizontalScrollerVideos.get(scroller).push(video);
      } else {
        standaloneVideos.push(video);
      }
    });
    
    // Setup Intersection Observer for standalone videos (vertical scrolling)
    if (standaloneVideos.length > 0) {
      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          
          if (entry.isIntersecting) {
            video.isVisuallyActive = true;
            playVideo(video);
          } else {
            video.isVisuallyActive = false;
            pauseVideo(video);
          }
        });
      }, {
        threshold: 0.5,
        rootMargin: '0px 0px -72px 0px' // Account for sticky nav
      });
      
      standaloneVideos.forEach(video => {
        intersectionObserver.observe(video);
      });
    }
    
    // Setup horizontal scroll detection for swiper containers
    horizontalScrollerVideos.forEach((videos, scroller) => {
      setupHorizontalScrollDetection(scroller, videos);
    });
  };
  
  // Handle horizontal scroll detection within swiper containers
  const setupHorizontalScrollDetection = (scroller, videos) => {
    const checkHorizontalVisibility = Utils.debounce(() => {
      const viewportCenter = window.innerWidth / 2;
      
      videos.forEach(video => {
        const card = video.closest('.exp_card_wrap');
        if (!card) return;
        
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const tolerance = card.offsetWidth * 0.45;
        const isHorizontallyVisible = Math.abs(cardCenter - viewportCenter) < tolerance;
        
        if (isHorizontallyVisible && !video.isVisuallyActive) {
          video.isVisuallyActive = true;
          playVideo(video);
        } else if (!isHorizontallyVisible && video.isVisuallyActive) {
          video.isVisuallyActive = false;
          pauseVideo(video);
        }
      });
    }, 150);
    
    // Listen to scroll events on the scroller
    scroller.addEventListener('scroll', checkHorizontalVisibility, { passive: true });
    
    // Also check visibility when the scroller enters/leaves the viewport
    const scrollerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Scroller is visible, check horizontal visibility
          checkHorizontalVisibility();
        } else {
          // Scroller is not visible, pause all videos in it
          videos.forEach(video => {
            if (video.isVisuallyActive) {
              video.isVisuallyActive = false;
              pauseVideo(video);
            }
          });
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -72px 0px'
    });
    
    scrollerObserver.observe(scroller);
    
    // Store references for cleanup
    if (!scroller._videoScrollHandler) {
      scroller._videoScrollHandler = checkHorizontalVisibility;
      scroller._videoScrollObserver = scrollerObserver;
    }
  };
  
  // Desktop event listeners
  const setupDesktopListeners = () => {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
  };
  
  const removeDesktopListeners = () => {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
  };
  
  // Check if video has valid source
  const hasValidVideoSource = (video) => {
    const source = video.querySelector('source');
    return source && source.dataset.hlsSrc && source.dataset.hlsSrc.trim() !== '';
  };
  
  // Device management
  const handleDeviceChange = () => {
    const deviceType = Utils.isMobile() ? 'mobile' : 'desktop';
    
    if (currentDevice === deviceType) return;
    
    // Cleanup current setup
    cleanup();
    currentDevice = deviceType;
    
    // Setup for new device
    if (deviceType === 'mobile') {
      setupMobileObserver();
    } else {
      setupDesktopListeners();
      
      // Setup initial states for desktop videos
      document.querySelectorAll('.exp_card_video').forEach(video => {
        if (hasValidVideoSource(video)) {
          const poster = video.parentElement?.querySelector('.exp_card_poster');
          if (poster?.src) video.poster = poster.src;
          gsap.set(video, { opacity: 0 });
          
          if (!video.hasPlayingListener) {
            video.addEventListener('playing', () => {
              if (gsap.getProperty(video, "opacity") < 1) {
                requestAnimationFrame(() => {
                  gsap.to(video, { opacity: 1, duration: config.fadeInDuration, ease: "power2.out" });
                });
              }
            });
            video.hasPlayingListener = true;
          }
        }
      });
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    // Pause all active videos
    activeVideos.forEach(video => {
      if (video && !video.paused) {
        video.pause();
      }
      if (video._playTimeout) {
        clearTimeout(video._playTimeout);
        video._playTimeout = null;
      }
    });
    activeVideos.clear();
    
    // Cleanup HLS instances
    hlsPool.forEach((hls, video) => {
      if (!document.body.contains(video)) {
        hls.destroy();
        hlsPool.delete(video);
      }
    });
    
    // Remove event listeners and observers
    removeDesktopListeners();
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
    
    // Cleanup horizontal scroll listeners
    document.querySelectorAll('.swiper-wrapper').forEach(scroller => {
      if (scroller._videoScrollHandler) {
        scroller.removeEventListener('scroll', scroller._videoScrollHandler);
        scroller._videoScrollHandler = null;
      }
      if (scroller._videoScrollObserver) {
        scroller._videoScrollObserver.disconnect();
        scroller._videoScrollObserver = null;
      }
    });
  };
  
  // Public API
  return {
    init() {
      if (!window.gsap) return;
      
      handleDeviceChange();
      window.addEventListener('resize', Utils.debounce(handleDeviceChange, 250));
      
      // Handle new videos added to DOM
      new MutationObserver(mutations => {
        let hasNewVideos = false;
        
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.classList?.contains('exp_card_wrap') || 
                  node.querySelector?.('.exp_card_wrap')) {
                hasNewVideos = true;
              }
            }
          });
        });
        
        if (hasNewVideos) {
          Utils.debounce(() => handleDeviceChange(), 100)();
        }
      }).observe(document.body, { childList: true, subtree: true });
    },
    
    cleanup,
    
    // Utility for cleaning up invalid videos
    cleanupInvalidVideoElements(scope = document) {
      const cards = scope.querySelectorAll('.exp_card_wrap');
      let cleanedCount = 0;
      
      cards.forEach(card => {
        const video = card.querySelector('.exp_card_video');
        if (video && !hasValidVideoSource(video)) {
          video.remove();
          cleanedCount++;
        }
      });
      
      return cleanedCount;
    }
  };
})();


// Static Border Glow Effect for Fixture Cards

const initDynamicLighting = () => {
  const svgFilterContainer = document.querySelector('.g_fixture_filter');
  const filterTemplate = document.getElementById('lighting');

  if (!svgFilterContainer || !filterTemplate) {
    return;
  }

  const lightWraps = document.querySelectorAll('[data-light-wrap]');
  const lightFixtures = [];

  lightWraps.forEach((wrap, index) => {
    const light1Element = wrap.querySelector('[data-light="light1"]');
    const light2Element = wrap.querySelector('[data-light="light2"]');
    const color1 = light1Element ? light1Element.getAttribute('data-light-color') : 'transparent';
    const color2 = light2Element ? light2Element.getAttribute('data-light-color') : 'transparent';

    const newFilter = filterTemplate.cloneNode(true);
    const uniqueId = `lighting-instance-${index}`;
    newFilter.id = uniqueId;

    const newLight1 = newFilter.querySelector('#light1');
    const newLight2 = newFilter.querySelector('#light2');

    if (newLight1) newLight1.setAttribute('lighting-color', color1);
    if (newLight2) newLight2.setAttribute('lighting-color', color2);

    svgFilterContainer.appendChild(newFilter);
    wrap.style.setProperty('--dynamic-filter-url', `url(#${uniqueId})`);

    lightFixtures.push({
      wrap,
      light1Element,
      light2Element,
      pointLight1: newFilter.querySelector('#light1 fePointLight'),
      pointLight2: newFilter.querySelector('#light2 fePointLight'),
    });
  });

  const updateLightPositions = () => {
    lightFixtures.forEach(({ wrap, light1Element, light2Element, pointLight1, pointLight2 }) => {
      const wrapRect = wrap.getBoundingClientRect();

      if (pointLight1 && light1Element) {
        const light1ElementRect = light1Element.getBoundingClientRect();
        const light1CenterX = light1ElementRect.left + light1ElementRect.width / 2;
        const light1CenterY = light1ElementRect.top + light1ElementRect.height / 2;
        const relativeX = light1CenterX - wrapRect.left;
        const relativeY = light1CenterY - wrapRect.top;
        pointLight1.setAttribute('x', relativeX);
        pointLight1.setAttribute('y', relativeY);
      }

      if (pointLight2 && light2Element) {
        const light2ElementRect = light2Element.getBoundingClientRect();
        const light2CenterX = light2ElementRect.left + light2ElementRect.width / 2;
        const light2CenterY = light2ElementRect.top + light2ElementRect.height / 2;
        const relativeX = light2CenterX - wrapRect.left;
        const relativeY = light2CenterY - wrapRect.top;
        pointLight2.setAttribute('x', relativeX);
        pointLight2.setAttribute('y', relativeY);
      }
    });
  };

  updateLightPositions();
  window.addEventListener('resize', Utils.debounce(updateLightPositions, 100));
};

window.addEventListener('load', initDynamicLighting);


// TOGGLE EXP CARD PACKAGES ACCORDION

document.addEventListener('click', function(event) {
  // Find the closest ancestor button with the target attribute
  const toggleButton = Utils.safeClosest(event, '[data-packages-btn-toggle]');

  // If a toggle button was clicked
  if (toggleButton) {
    // Find the main card container for this button
    const cardWrapper = toggleButton.closest('.exp_card_wrap');
    
    // If a card wrapper is found, find the accordion content within it
    if (cardWrapper) {
      const content = cardWrapper.querySelector('.exp_card_accordion_content');
      
      // If the content container is found, toggle the visibility class
      if (content) {
        content.classList.toggle('is-hidden');
      }
    }
  }
});


// SET EXP CARD PACKAGES IMAGE
document.addEventListener('DOMContentLoaded', function() {
  // Process card packages image for a single card
  function processCard(card) {
    // Find the first package image within the current card
    const sourceImage = card.querySelector('.exp_packages_img');

    // If no package image exists in this card, skip
    if (!sourceImage) {
      return;
    }

    // Find all target image elements where the src will be placed
    const targetImages = card.querySelectorAll('.exp_card_header_btn_img_wrap.is-1 .exp_card_header_btn_img');

    // If any target images are found, loop through them and update their src
    if (targetImages.length > 0) {
      targetImages.forEach(targetImage => {
        targetImage.src = sourceImage.src;
      });
    }
  }

  // Process all existing cards on page load
  const existingCards = document.querySelectorAll('.exp_card_wrap');
  existingCards.forEach(processCard);

  // Watch for new cards added to the DOM
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        // Skip if not an element
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        // Check if the added node is a card
        if (node.classList && node.classList.contains('exp_card_wrap')) {
          processCard(node);
        }

        // Check for cards within the added node
        const newCards = node.querySelectorAll && node.querySelectorAll('.exp_card_wrap');
        if (newCards) {
          newCards.forEach(processCard);
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Initialize the manager and expose globally  
window.ExperienceCardVideoManager = UnifiedVideoManager;
window.UnifiedVideoManager = UnifiedVideoManager;

// Universal Swiper Management System
const UniversalSwiperManager = (() => {
  
  // Default configuration that can be overridden
  const defaultConfig = {
    desktopBreakpoint: 991,
    initDelay: 50,
    verificationDelay: 100,
    buttonWrapperSelector: 'data-swiper-combo',
    prevButtonSelector: 'data-swiper-button-prev',
    nextButtonSelector: 'data-swiper-button-next'
  };
  
  // Create a new swiper manager instance
  const createManager = (options = {}) => {
    const config = { ...defaultConfig, ...options };
    const { name, swiperConfigs, initializeSwiper } = config;
    const swiperInstances = [];
    
    // Toggle button wrapper visibility based on swiper state
    const toggleButtonWrapper = (swiper) => {
      const { comboClass } = swiper;
      
      const btnWrap = document.querySelector(`[${config.buttonWrapperSelector}="${comboClass}"]`);

      if (!btnWrap) {
        return;
      }
      
      // More robust hide/show logic
      const hasMultipleSlides = swiper.slides && swiper.slides.length > 1;
      const shouldHide = !hasMultipleSlides || (swiper.isBeginning && swiper.isEnd);
      
      const newDisplay = shouldHide ? "none" : "flex";
      
      btnWrap.style.display = newDisplay;
    };
    
    // Reset button wrappers to default state
    const resetButtonWrappers = () => {
      const buttonWrappers = document.querySelectorAll(`[${config.buttonWrapperSelector}]`);
      
      buttonWrappers.forEach((btnWrap) => {
        btnWrap.style.display = "none";
      });
    };
    
    // Enhanced swiper initialization with timing fixes
    const createInitializeSwiper = (originalInitializer) => {
      return (swiperConfig) => {
        // Pre-initialize button wrapper
        const btnWrap = document.querySelector(`[${config.buttonWrapperSelector}="${swiperConfig.comboClass}"]`);
        if (btnWrap) {
          btnWrap.style.display = "flex";
        }
        
        // Enhance config with proper callbacks
        const enhancedConfig = {
          ...swiperConfig,
          on: {
            ...swiperConfig.on,
            init() {
              // Call original init callback if it exists
              if (swiperConfig.on?.init) {
                swiperConfig.on.init.call(this);
              }
              
              // Delay the initial toggle to ensure DOM is ready
              setTimeout(() => {
                toggleButtonWrapper(this);
              }, config.initDelay);
            },
            slideChange() {
              // Call original slideChange callback if it exists
              if (swiperConfig.on?.slideChange) {
                swiperConfig.on.slideChange.call(this);
              }
              
              toggleButtonWrapper(this);
            },
            resize() {
              // Call original resize callback if it exists
              if (swiperConfig.on?.resize) {
                swiperConfig.on.resize.call(this);
              }
              
              toggleButtonWrapper(this);
            }
          }
        };
        
        // Call the original initializer with enhanced config
        const swiper = originalInitializer(enhancedConfig);
        
        if (swiper) {
          swiper.comboClass = swiperConfig.comboClass;
        }
        return swiper;
      };
    };
    
    // Manage swiper initialization based on screen width
    const manageSwipers = () => {
      const isSwiperEnabled = window.innerWidth > config.desktopBreakpoint;

      if (isSwiperEnabled) {
        if (swiperInstances.length === 0) {
          // First, ensure all button wrappers start with consistent state
          const allButtonWrappers = document.querySelectorAll(`[${config.buttonWrapperSelector}]`);
          allButtonWrappers.forEach((btnWrap) => {
            btnWrap.style.display = "none"; // Start hidden, will be shown by toggleButtonWrapper if needed
          });
          
          swiperConfigs.forEach((swiperConfig, index) => {
            const swiperContainer = document.querySelector(swiperConfig.selector);
            
            if (swiperContainer) {
              const slides = swiperContainer.querySelectorAll(".swiper-slide");
              
              if (slides.length > 0) {
                const enhancedInitializer = createInitializeSwiper(initializeSwiper);
                swiperInstances.push(enhancedInitializer(swiperConfig));
              }
            }
          });
          
          // Final verification step - ensure all button wrappers are correctly set
          setTimeout(() => {
            swiperInstances.forEach((swiper) => {
              if (swiper && swiper.comboClass) {
                toggleButtonWrapper(swiper);
              }
            });
          }, config.verificationDelay);
          
        } else {
          // Update existing swipers
          swiperInstances.forEach(swiper => {
            if (swiper && swiper.comboClass) {
              toggleButtonWrapper(swiper);
            }
          });
        }
      } else {
        // Hide all button wrappers for mobile
        const buttonWrappers = document.querySelectorAll(`[${config.buttonWrapperSelector}]`);
        buttonWrappers.forEach((btnWrap) => {
          btnWrap.style.display = "none";
        });

        while (swiperInstances.length > 0) {
          const swiper = swiperInstances.pop();
          if (swiper && swiper.comboClass) {
            swiper.destroy(true, true);
          }
        }
      }
    };
    
    // Setup resize listener
    const setupResizeListener = () => {
      const debouncedManageSwipers = Utils.debounce(() => {
        manageSwipers();
      }, 200);
      
      window.addEventListener("resize", debouncedManageSwipers);
      
      manageSwipers();
    };
    
    // Public API
    return {
      manageSwipers,
      toggleButtonWrapper,
      resetButtonWrappers,
      setupResizeListener,
      swiperInstances,
      createInitializeSwiper
    };
  };
  
  return {
    createManager
  };
})();

// Expose globally
window.UniversalSwiperManager = UniversalSwiperManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', UnifiedVideoManager.init);
} else {
  UnifiedVideoManager.init();
}