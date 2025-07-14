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
  
  // Create animation properties without blur
  const getAnimProps = (props) => {
    // Always remove filter:blur from animation props
    if (props.filter && props.filter.includes('blur')) {
      const { filter, ...otherProps } = props;
      return otherProps;
    }
    return props;
  };

  // Timeout fetch utility
  const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  };

  return {
    debounce,
    isInViewport,
    isMobile,
    getAnimProps,
    fetchWithTimeout
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
const autoplayVideos = new WeakSet(); // Tracks videos that were autoplaying

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
  const navContain = document.querySelector(".nav_main_contain");
  const navWrap = document.querySelector(".nav_main_wrap");
  
  if (anyModalOpen) {
    document.body.classList.add("no-scroll");
    if (modalGroup !== "nav") {
      navContain?.classList.add("is-disabled");
      setTimeout(() => {
        navWrap.style.display = "none";
      }, 200);
    }
  } else {
    document.body.classList.remove("no-scroll");
    navWrap.style.display = "block";
    navContain?.classList.remove("is-disabled");
  }
}

function handleVideosOnModalOpen(modalGroup) {
  if (modalGroup === 'filter' || modalGroup === 'nav') {
    return;
  }

  document.querySelectorAll("video").forEach((video) => {
    const isInModal = video.closest(
      `[data-modal-element='content'][data-modal-group='${modalGroup}']`
    );
    if (!isInModal && !video.paused) {
      video.pause();
    }
    if (video.autoplay) {
      autoplayVideos.add(video);
    }
  });

  const modalVideos = document.querySelectorAll(
    `[data-modal-element='content'][data-modal-group='${modalGroup}'] video`
  );
  
  modalVideos.forEach((video) => {
    if (modalGroup !== 'package' && modalGroup !== 'experience') {
      video.play().catch(err => {});
    }
  });
}

function handleVideosOnModalClose(modalGroup) {
  if (modalGroup === 'filter' || modalGroup === 'nav') {
    return;
  }
  
  document.querySelectorAll("video").forEach((video) => {
    const isInModal = video.closest(
      `[data-modal-element='content'][data-modal-group='${modalGroup}']`
    );
    if (isInModal && !video.paused) {
      video.pause();
    }
    if (autoplayVideos.has(video)) {
      video.play();
      autoplayVideos.delete(video);
    }
  });
}

document.addEventListener("click", (event) => {
  const modalToggleBtn = event.target.closest(
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

  // Clear any lingering blur effects on mobile when opening a modal
  if (isOpening && Utils.isMobile() && (trayModalType === 'nav' || trayModalType === 'reviews')) {
    const selectors = trayModalType === 'nav' ? [
      ".menu_link_list > *",
      ".form_menu_grid > *",
      ".menu_trending_cms_list > *",
      ".menu_calendar_list",
      ".menu_calendar_list_pagination",
      "[menu-category-pag]",
      "[menu-category-label]",
      "[menu-category-cms-list]"
    ] : [
      ".reviews_modal_review_list > *"
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length) {
        gsap.set(elements, { filter: "none" });
      }
    });
  }

  let modalTl = gsap.timeline({
    onStart: () => {
      if (isOpening) {
        updateLiveChatVisibility();
        handleVideosOnModalOpen(modalGroup);
        
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
        handleVideosOnModalClose(modalGroup);
        updateLiveChatVisibility();
        
        // Update filter display when filter modal closes
        if (modalGroup === 'filter' && typeof window.FilterSystem !== 'undefined') {
          window.FilterSystem.updateActiveFiltersDisplay();
        }
      }
      
      // Always clear filter
      gsap.set(
        `[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`,
        { filter: "none" }
      );
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
        modalTl
          // BG & Tray
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
            opacity: 1, 
            duration: 0.3, 
            ease: "power4.Out"
          }, 0)
          .fromTo(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, 
            { xPercent: 105 }, 
            { 
              xPercent: 0, 
              duration: 0.35, 
              ease: "power4.Out"
            }, 0.1 )
           // Bar & close buttons
          .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".nav_modal_close_mob", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)

          // Content animations with staggered timing
          .to(".menu_image_btn", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".menu_link_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".menu_link_list > *", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out", stagger: 0.015 }, 0.30)
          .to(".menu_calendar_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to(".form_search_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to(".menu_calendar_list", { opacity: 1, x: "0rem", duration: 0.15, ease: "power1.out" }, 0.45)
          .to(".menu_calendar_list_pagination", { opacity: 1, x: "0rem", duration: 0.15, ease: "power1.out"}, 0.5)
          .to(".form_menu_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".form_menu_grid > *", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out", stagger: 0.015 }, 0.3)
          .to(".menu_availability_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.45)
          .to(".menu_trending_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(".menu_trending_cms_list > *", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out", stagger: 0.02 }, 0.35)
          .to("[menu-category-wrap='1']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to("[menu-category-label='1']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4) 
          .to("[menu-category-cms-list='1']", { opacity: 1, x: "0rem", duration: 0.15, ease: "power1.out" }, 0.42)
          .to("[menu-category-pag='1']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.44)
          .to("[menu-category-wrap='2']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.46)
          .to("[menu-category-label='2']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.46) 
          .to("[menu-category-cms-list='2']", { opacity: 1, x: "0rem", duration: 0.15, ease: "power1.out" }, 0.48)
          .to("[menu-category-pag='2']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.5)
          .to("[menu-category-label='3']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.52) 
          .to("[menu-category-cms-list='3']", { opacity: 1, x: "0rem", duration: 0.15, ease: "power1.out" }, 0.54)
          .to("[menu-category-pag='3']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.56);

      } else if (trayModalType === 'package') {
        modalTl
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
            opacity: 1, 
            duration: 0.3, 
            ease: "power4.Out"
          }, 0)
          .fromTo(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, 
            { xPercent: 105 }, 
            { 
              xPercent: 0, 
              duration: 0.35, 
              ease: "power4.Out"
            }, 0.1 )
          .add(() => {
            document.dispatchEvent(new CustomEvent('packageModalAnimationComplete'));
          }, 0.35);

      } else if (trayModalType === 'experience') {
        modalTl
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
            opacity: 1, 
            duration: 0.3, 
            ease: "power4.Out"
          }, 0)
          .fromTo(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, 
            { xPercent: 105 }, 
            { 
              xPercent: 0, 
              duration: 0.35, 
              ease: "power4.Out"
            }, 0.1 )
          .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(".experience_btn_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(".form_experience_heading", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3) 
          .to(".form_experience_grid > *", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out", stagger: 0.015 }, 0.3)
          .to(".form_experience_para", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4);
          
      } else if (trayModalType === 'reviews') {
        modalTl
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
            opacity: 1, 
            duration: 0.3, 
            ease: "power4.Out"
          }, 0)
          .fromTo(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, 
            { xPercent: 105 }, 
            { 
              xPercent: 0, 
              duration: 0.35, 
              ease: "power4.Out"
            }, 0.1 )
          .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(".reviews_modal_review_list > *", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out", stagger: 0.05 }, 0.35);
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
        modalTl
          .to(".menu_image_btn", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_link_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_trending_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_menu_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_link_list > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_menu_grid > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_trending_cms_list > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_availability_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_search_wrap", { opacity: 0, x: "0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_list", { opacity: 0, x: "0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_list_pagination", { opacity: 0, x: "0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-wrap='1']", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-wrap='2']", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-pag='1']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-pag='2']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-pag='3']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-label='1']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-label='2']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0) 
          .to("[menu-category-label='3']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-cms-list='1']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-cms-list='2']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0) 
          .to("[menu-category-cms-list='3']", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "0.5rem", duration: 0.2, ease: "power1.in" }, 0)
          .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.in" }, 0)
          .to(".nav_modal_close_mob", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0)
          .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { xPercent: 105, duration: 0.35, ease: "power1.in" }, 0);
      } else if (trayModalType === 'package') {
        modalTl
          .to('.package_heading_wrap', { 
            opacity: 0, 
            x: "0.5rem", 
            duration: 0.2, 
            ease: "power1.in"
          }, 0)
          .to('.package_content > *', { 
            opacity: 0, 
            x: "1rem", 
            duration: 0.2, 
            ease: "power1.in"
          }, 0)
          .to('.package_content > * > *', { 
            opacity: 0, 
            x: "0.125rem", 
            y: "-0.25rem", 
            duration: 0.2, 
            ease: "power1.in"
          }, 0)
          .to('.package_btn_wrap', { 
            opacity: 0, 
            x: "0.5rem", 
            duration: 0.2, 
            ease: "power1.in"
          }, 0)
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { 
            opacity: 0, 
            duration: 0.3, 
            ease: "power1.in" 
          }, 0.1)
          .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { 
            xPercent: 105, 
            duration: 0.35, 
            ease: "power1.in" 
          }, 0.1)
          .add(() => {
            document.dispatchEvent(new CustomEvent('packageModalClosed'));
          });
      } else if (trayModalType === 'reviews') {
        modalTl
        .to(".reviews_modal_review_list > *", { opacity: 0, x: "0.25rem", y: "-0.5rem", duration: 0.2, ease: "power1.out" }, 0)  
        .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "0.5rem", duration: 0.2, ease: "power1.in" }, 0)
        .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.in" }, 0)
        .to(".nav_modal_close_mob", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
        .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0)
        .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { xPercent: 105, duration: 0.35, ease: "power1.in" }, 0);
      } else if (trayModalType === 'experience') {
        modalTl
          .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "0.5rem", duration: 0.2, ease: "power1.in" }, 0)
          .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.in" }, 0)
          .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0)
          .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { xPercent: 105, duration: 0.35, ease: "power1.in" }, 0)
          .to(".form_experience_heading", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_experience_grid > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_experience_para", { opacity: 0, x: "0.125rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".experience_btn_wrap", { opacity: 0, x: "0.5rem", duration: 0.2, ease: "power1.out" }, 0);
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
  
  // Handle resize events for modal visibility management
  const handleResize = Utils.debounce(() => {
    // Ensure proper visibility of modal elements on resize
    const modalElements = [
      // Nav modal elements
      ".menu_link_list > *",
      ".form_menu_grid > *",
      ".menu_trending_cms_list > *",
      ".menu_calendar_list",
      ".menu_calendar_list_pagination",
      "[menu-category-pag]",
      "[menu-category-label]",
      "[menu-category-cms-list]",
      // Review modal elements
      ".reviews_modal_review_list > *",
      // Package modal elements
      ".package_content > * > *"
    ];
    
    // Reset any potentially problematic styles
    modalElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length) {
        gsap.set(elements, { filter: "none" });
      }
    });
  }, 150);
  
  window.addEventListener("resize", handleResize);
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
  const button = event.target.closest("[data-target-button]");
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

// Experience Card Video Interaction Handler (HLS Lazy-Loading Version)
const ExperienceCardVideoManager = (() => {
  let scrollTriggers = [];
  let currentDevice = null;
  // Use a Map to store and manage HLS instances for each video element
  const hlsInstances = new Map();

  const initializeVideoInteractions = () => {
    const deviceType = Utils.isMobile() ? 'mobile' : 'desktop';
    if (currentDevice === deviceType && scrollTriggers.length > 0) return;

    cleanup();
    currentDevice = deviceType;

    const experienceCards = document.querySelectorAll('.exp_card_wrap');
    experienceCards.forEach(card => {
      const video = card.querySelector('.exp_card_video');
      const poster = card.querySelector('.exp_card_poster');
      if (!video || !poster || !hasValidVideoSource(video)) return;

      // --- ONE-TIME SETUP ---
      // Set the video's poster attribute.
      if (poster.src) {
        video.poster = poster.src;
      }
      // Set the initial state: video is transparent, letting the poster show through.
      gsap.set(video, { opacity: 0 });
      
      // Add the video fade-in listener ONCE. This will fire whenever playback starts.
      video.addEventListener('playing', () => {
        // Ensure we only fade the video in if it's currently invisible.
        if (gsap.getProperty(video, "opacity") < 1) {
          requestAnimationFrame(() => {
            gsap.to(video, { opacity: 1, duration: 0.5, ease: "power2.out" });
          });
        }
      });
      // --- END ONE-TIME SETUP ---

      if (deviceType === 'mobile') {
        setupMobileInteraction(card, video, poster);
      } else {
        setupDesktopInteraction(card, video, poster);
      }
    });
  };

  const hasValidVideoSource = (video) => {
    const source = video.querySelector('source');
    return source && source.dataset.hlsSrc;
  };
  
  // This function is triggered by hover or scroll
  const playVideoAndHidePoster = (video) => {
    // A small delay ensures we only play if the user's intent is clear,
    // preventing race conditions from rapid scroll or hover events.
    video.playTimeout = setTimeout(() => {
      if (hlsInstances.has(video)) {
        const hls = hlsInstances.get(video);
        hls.startLoad();
        video.play().catch((e) => {});
      } else if (Hls.isSupported()) {
        const hlsUrl = video.querySelector('source').dataset.hlsSrc;
        if (!hlsUrl) {
            return;
        }

        const hls = new Hls({
          capLevelToPlayerSize: true,
          startLevel: -1,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {});

        hlsInstances.set(video, hls);
      }
    }, 200); // 200ms delay to confirm user intent
  };

  const pauseVideoAndShowPoster = (video, poster) => {
    // Immediately clear any pending play command.
    if (video.playTimeout) {
      clearTimeout(video.playTimeout);
    }

    video.pause();

    // Fade the video OUT to reveal the poster underneath.
    gsap.to(video, { opacity: 0, duration: 0.3, ease: "power2.out" });
  };

  const setupMobileInteraction = (card, video, poster) => {
    const trigger = ScrollTrigger.create({
      trigger: card,
      start: "bottom bottom",
      end: "top top+=72",
      onEnter: () => {
        playVideoAndHidePoster(video);
      },
      onLeave: () => {
        pauseVideoAndShowPoster(video, poster);
      },
      onEnterBack: () => {
        playVideoAndHidePoster(video);
      },
      onLeaveBack: () => {
        pauseVideoAndShowPoster(video, poster);
      }
    });
    scrollTriggers.push(trigger);
  };

  const setupDesktopInteraction = (card, video, poster) => {
    const handleMouseEnter = () => {
        playVideoAndHidePoster(video);
    };
    const handleMouseLeave = () => {
        pauseVideoAndShowPoster(video, poster);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    card._videoEventHandlers = { mouseenter: handleMouseEnter, mouseleave: handleMouseLeave };
  };

  const cleanup = () => {
    // Kill all existing ScrollTriggers
    scrollTriggers.forEach(trigger => trigger.kill());
    scrollTriggers = [];

    // Remove hover listeners from all cards
    document.querySelectorAll('.exp_card_wrap').forEach(card => {
      if (card._videoEventHandlers) {
        card.removeEventListener('mouseenter', card._videoEventHandlers.mouseenter);
        card.removeEventListener('mouseleave', card._videoEventHandlers.mouseleave);
        delete card._videoEventHandlers;
      }
    });
    
    // Destroy HLS instances only for videos that are no longer in the DOM.
    hlsInstances.forEach((hls, video) => {
        if (!document.body.contains(video)) {
            hls.destroy();
            hlsInstances.delete(video);
        }
    });
  };

  const handleResize = Utils.debounce(() => initializeVideoInteractions(), 150);

  return {
    init: () => {
      document.addEventListener('DOMContentLoaded', initializeVideoInteractions);
      window.addEventListener('resize', handleResize);
    },
    reinitialize: initializeVideoInteractions,
    cleanup: cleanup
  };
})();

// Initialize the manager
ExperienceCardVideoManager.init();


// Static Border Glow Effect for Fixture Cards

const initDynamicLighting = () => {
  const svgFilterContainer = document.querySelector('.g_fixture_filter');
  const filterTemplate = document.getElementById('lighting');

  if (!svgFilterContainer || !filterTemplate) {
    console.error('SVG filter template or container not found.');
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
  const toggleButton = event.target.closest('[data-packages-btn-toggle]');

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
  // Select all card components on the page
  const allCards = document.querySelectorAll('.exp_card_wrap');

  // Iterate over each card component
  allCards.forEach(card => {
    // Find the first package image within the current card
    const sourceImage = card.querySelector('.exp_packages_img');

    // If no package image exists in this card, skip to the next one
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
  });
});