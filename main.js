// Set background color from data attributes
const setBgColor = (element) => {
  const bgColor = element.dataset.bgColor || "#333333"; // Fallback to #333333
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

  return {
    debounce,
    isInViewport
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
  container.querySelectorAll(".svg-code").forEach((element) => {
    const svgCode = element.textContent;
    if (!svgCode) return;
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      
      if (svg && doc.querySelector('parsererror') === null) {
        const invalidValueAttrs = Array.from(svg.attributes)
          .filter(attr => (attr.name === 'width' || attr.name === 'height') && attr.value === 'auto');
        
        invalidValueAttrs.forEach(attr => {
          svg.removeAttribute(attr.name);
        });
        
        const fixedSvg = svg.cloneNode(true);
        element.insertAdjacentElement("afterend", document.importNode(fixedSvg, true));
      } else {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = svgCode.replace(/\s(width|height)="auto"/g, '');
        element.insertAdjacentElement("afterend", wrapper.firstElementChild);
      }
    } catch (e) {
      try {
        const cleanSvg = svgCode.replace(/\s(width|height)="auto"/g, '');
        element.insertAdjacentHTML("afterend", cleanSvg);
      } catch (err) {
        // Silent fallback to avoid breaking the page
      }
    }
  });
}

insertSVGFromCMS();

// Initialize smooth scrolling
const lenis = new Lenis({
  lerp: 0.15,
  smoothWheel: true,
  smoothTouch: false,
  overscroll: false,
  prevent: (node) => node.closest(".u-modal-prevent-scroll") !== null,
});

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Initialize Finsweet Attributes
document.addEventListener("DOMContentLoaded", function () {
  window.fsAttributes = window.fsAttributes || [];
  
  window.fsAttributes.push([
    "cmsload",
    (listInstances) => {
      const packageLoadInstance = listInstances.find(instance => 
        instance.el && instance.el.getAttribute('fs-cmsload-element') === 'list-2'
      );
      
      if (packageLoadInstance) {
        packageLoadInstance.on('renderitems', (renderedItems) => {
          const newPackageCards = [];
          renderedItems.forEach(item => {
            const packageCards = item.querySelectorAll('.packages_card');
            if (packageCards.length) {
              packageCards.forEach(card => newPackageCards.push(card));
            }
          });
          
          if (typeof attachPackageCardHandlers === 'function' && newPackageCards.length > 0) {
            attachPackageCardHandlers(newPackageCards);
          }
        });
      }
    }
  ]);
  
  window.fsAttributes.push([
    "cmsnest",
    (listInstances) => {
      window.fsAttributes.cmsfilter.init();
    },
  ]);
});

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

// Parallax animations setup
const homeHeroWrap = document.querySelector(".hero_home_wrap");
const catHeroWrap = document.querySelector(".hero_cat_wrap");
const ctaContent = document.querySelector(".cta_content");
const expGallery = document.querySelector(".gallery_img");
const videoElement = document.querySelector(".video_gallery_player");
const posterElement = document.querySelector(".video_gallery_poster");

const getPaddingTop = el =>
  parseFloat(getComputedStyle(el).paddingTop) || 0;
const expContent = document.querySelector(".exp_content");
const galleryWrap = document.querySelector(".gallery_wrap");
const expContentPadding = expContent ? getPaddingTop(expContent) : 0;
const galleryWrapPadding = galleryWrap ? getPaddingTop(galleryWrap) : 0;
const totalGalleryOffset = expContentPadding + galleryWrapPadding;

let homeHeroParallax;
if (homeHeroWrap) {
  homeHeroParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero_home_wrap",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

let catHeroParallax;
if (catHeroWrap) {
  catHeroParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero_cat_wrap",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

let ctaParallax;
if (ctaContent) {
  ctaParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".cta_content",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
}

let expGalleryParallax;
if (expGallery) {
  expGalleryParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".gallery_img",
      start: `top ${totalGalleryOffset}px`, 
      end: "bottom top",
      scrub: true,
    },
  });
}

let videoPosterParallax;
if (videoElement && posterElement) {
  videoPosterParallax = gsap.timeline({
    scrollTrigger: {
      trigger: videoElement,
      start: `top ${totalGalleryOffset}px`,
      end: "bottom top",
      scrub: true,
    },
  });
}

// Enable parallax for devices above 480px
let mm = gsap.matchMedia();
mm.add("(min-width: 480px)", () => {
  if (homeHeroParallax) {
    homeHeroParallax.to(".hero_home_vid", { y: "10rem" });
  }
  if (catHeroParallax) {
    catHeroParallax.to(".hero_cat_img", { y: "-4rem" });
  }
  if (expGalleryParallax) {
    expGalleryParallax.to(".gallery_img", { y: "3rem" });
  }
  if (videoPosterParallax) {
    videoPosterParallax.to(".video_gallery_poster", { y: "3rem" });
  }
  if (ctaParallax) {
    ctaParallax.to(".cta_bg_img", { y: "10rem" });
  }
});

// MODAL ANIMATION
const modalStates = {}; // Tracks state for each modal group
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
    if (modalGroup !== 'package') {
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
  if (!modalToggleBtn) return;

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
        handleVideosOnModalOpen(modalGroup);
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
      }
      gsap.set(
        `[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`,
        { filter: "none" }
      );
    }
  });

  if (isOpening) {
    modalStates[modalGroup] = true;
    
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
          .to(".menu_link_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".menu_link_list > *", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out", stagger: 0.015 }, 0.30)
          .to(".menu_calendar_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to(".form_search_wrap", { opacity: 1, x: "0rem", y: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to(".menu_calendar_list", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.15, ease: "power1.out" }, 0.45)
          .to(".menu_calendar_list_pagination", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.15, ease: "power1.out"}, 0.5)
          .to(".form_menu_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.3)
          .to(".form_menu_grid > *", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out", stagger: 0.015 }, 0.3)
          .to(".menu_availability_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.45)
          .to(".menu_trending_wrap", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.35)
          .to(".menu_trending_cms_list > *", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out", stagger: 0.02 }, 0.35)
          .to("[menu-category-wrap='1']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.4)
          .to("[menu-category-label='1']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.4) 
          .to("[menu-category-cms-list='1']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.15, ease: "power1.out" }, 0.42)
          .to("[menu-category-pag='1']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.44)
          .to("[menu-category-wrap='2']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.46)
          .to("[menu-category-label='2']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.46) 
          .to("[menu-category-cms-list='2']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.15, ease: "power1.out" }, 0.48)
          .to("[menu-category-pag='2']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.5)
          .to("[menu-category-wrap='3']", { opacity: 1, x: "0rem", duration: 0.2, ease: "power1.out" }, 0.52) 
          .to("[menu-category-label='3']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.52) 
          .to("[menu-category-cms-list='3']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.15, ease: "power1.out" }, 0.54)
          .to("[menu-category-pag='3']", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out" }, 0.56);

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
          .to(".reviews_modal_review_list > *", { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)", duration: 0.2, ease: "power1.out", stagger: 0.05 }, 0.35);
          
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
          .to(".menu_link_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_trending_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_menu_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_link_list > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_menu_grid > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_trending_cms_list > *", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_availability_wrap", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".form_search_wrap", { opacity: 0, x: "0.25rem", y: "-0.5rem", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_list", { opacity: 0, x: "0.25rem", y: "-0.5rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to(".menu_calendar_list_pagination", { opacity: 0, x: "0.25rem", y: "-0.5rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-wrap='1']", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-wrap='2']", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-wrap='3']", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0) 
          .to("[menu-category-pag='1']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-pag='2']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-pag='3']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-label='1']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-label='2']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0) 
          .to("[menu-category-label='3']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-cms-list='1']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
          .to("[menu-category-cms-list='2']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0) 
          .to("[menu-category-cms-list='3']", { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)
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
            filter: "blur(2px)", 
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
        .to(".reviews_modal_review_list > *", { opacity: 0, x: "0.25rem", y: "-0.5rem", filter: "blur(2px)", duration: 0.2, ease: "power1.out" }, 0)  
        .to(`[data-modal-element='bar'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "0.5rem", duration: 0.2, ease: "power1.in" }, 0)
        .to(`[data-modal-element='close-btn'][data-modal-group='${modalGroup}']`, { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.in" }, 0)
        .to(".nav_modal_close_mob", { opacity: 0, x: "1rem", duration: 0.2, ease: "power1.out" }, 0)
        .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0)
        .to(`[data-modal-element='tray-contain'][data-modal-group='${modalGroup}']`, { xPercent: 105, duration: 0.35, ease: "power1.in" }, 0);
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
  if (tabs.length === 0) return;

  const contentElements = root.querySelectorAll(
    `[data-tab-element="content"][data-tab-group="${group}"]`
  );
  if (contentElements.length === 0) return;

  const contentsContainer = contentElements[0].parentElement;

  const parent = root.querySelector(
    `[data-tab-element="tab-wrap"][data-tab-group="${group}"]`
  );
  if (!parent) return;

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

  tabs[0].classList.add("is-active");

  const isInModal =
    parent.closest('.u-modal-prevent-scroll[data-modal-element="modal"]') !==
    null;

  if (tabMode === "highlight") {
    if (isInModal) {
      document.addEventListener("click", (event) => {
        const modalOpenBtn = event.target.closest("[data-modal-open]");
        if (modalOpenBtn) {
          const modalGroup = modalOpenBtn.getAttribute("data-modal-open");
          if (parent.closest(`[data-modal-group='${modalGroup}']`)) {
            setTimeout(() => positionHighlight(tabs[0]), 50);
          }
        }
      });
    } else {
      window.addEventListener("load", () => {
        positionHighlight(tabs[0]);
      });
    }
  }

  tabs.forEach((tab, index) => {
    tab.dataset.index = index;

    tab.addEventListener("click", () => {
      if (tab.classList.contains("is-active")) return;

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
};

const initializeTabsInScope = (root = document) => {
  const tabGroups = new Set();
  root.querySelectorAll('[data-tab-element="tab"]').forEach((tab) => {
    tabGroups.add(tab.dataset.tabGroup);
  });
  tabGroups.forEach((group) => initializeTabGroup(group, root));
};

document.addEventListener("DOMContentLoaded", () => {
  initializeTabsInScope();
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
  if (!button) return;

  const targetValue = button.getAttribute("data-target-button");
  const modalGroup = button.getAttribute("data-modal-open");

  if (modalGroup !== "nav") return;

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

    if (!targetAnchor || !targetField) return;

    document.addEventListener(
      "modalOpenComplete",
      async (event) => {
        if (event.detail !== modalGroup) return;

        const upcomingTab = await getUpcomingTab();
        if (upcomingTab && !upcomingTab.classList.contains("is-active")) {
          upcomingTab.click();
        }

        targetAnchor.scrollIntoView({ behavior: "smooth", block: "start" });

        setTimeout(() => {
          targetField.focus();
          targetField.setSelectionRange(
            targetField.value.length,
            targetField.value.length
          );
        }, 300);
      },
      { once: true }
    );
  }

  if (targetValue === "menu-contact") {
    document.addEventListener(
      "modalOpenComplete",
      (event) => {
        if (event.detail !== modalGroup) return;

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
  window.setupParagraphToggles = function (scope = document) {
    const classSets = [
      {
        wrap: ".g_para_clamped_wrap",
        para: ".g_para_clamped",
        btn: ".g_para_clamped_btn",
      },
      {
        wrap: ".g_para_hover_wrap",
        para: ".g_para_hover",
        btn: ".g_para_hover_btn",
      },
    ];

    classSets.forEach(({ wrap, para, btn }) => {
      const items = scope.querySelectorAll(wrap);

      items.forEach(function (wrapElement) {
        const paraElement = wrapElement.querySelector(para);
        const toggleBtn = wrapElement.querySelector(btn);
        const modalElement = wrapElement.closest(
          '[data-modal-element="modal"]'
        );

        function isClamped(el) {
          if (
            modalElement &&
            window.getComputedStyle(modalElement).display === "none"
          ) {
            modalElement.style.display = "block";
            const result = el.scrollHeight > el.clientHeight;
            modalElement.style.display = "none";
            return result;
          }
          return el.scrollHeight > el.clientHeight;
        }

        if (!isClamped(paraElement)) toggleBtn.classList.add("is-hidden");
      });
    });
  };

  document.addEventListener("click", function (event) {
    classSets = [
      {
        btn: ".g_para_clamped_btn",
        para: ".g_para_clamped",
      },
      {
        btn: ".g_para_hover_btn",
        para: ".g_para_hover",
      },
    ];

    for (const classSet of classSets) {
      const toggleBtn = event.target.closest(classSet.btn);

      if (toggleBtn) {
        const wrapElement = toggleBtn.closest(
          ".g_para_clamped_wrap, .g_para_hover_wrap"
        );
        if (!wrapElement) continue;

        const paraElement = wrapElement.querySelector(classSet.para);
        if (!paraElement) continue;

        paraElement.classList.toggle("is-expanded");
        toggleBtn.innerText = paraElement.classList.contains("is-expanded")
          ? "show less"
          : "read more";

        break;
      }
    }
  });

  window.setupParagraphToggles();
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

// Global ScrollTrigger Module for Navbar Animations
window.NavScrollTrigger = (() => {
  const initNavbarScrollEffects = () => {
    const mmSecond = gsap.matchMedia();

    mmSecond.add("(min-width: 480px) and (max-width: 1215px)", () => {
      ScrollTrigger.create({
        trigger: ".page_main",
        start: `top+=${document.querySelector(".nav_main_contain")?.offsetHeight || 0}px top`,
        onEnter: () => {
          gsap.to(".nav_main_contain", {
            yPercent: -100,
            duration: 0.7,
            ease: "power2.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(".nav_main_contain", {
            yPercent: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        },
      });

      return () => {
        // Cleanup function for when matchMedia conditions change
      };
    });

    mmSecond.add("(min-width: 1215px)", () => {
      ScrollTrigger.create({
        trigger: ".page_main",
        start: `top+=5px top`,
        onEnter: () => {
          gsap.to(".nav_main_link_wrap", {
            opacity: 0,
            pointerEvents: "none",
            duration: 0.2,
            ease: "power2.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(".nav_main_link_wrap", {
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.1,
            ease: "power2.out",
          });
        },
      });

      return () => {
        // Cleanup function for when matchMedia conditions change
      };
    });
  };

  document.addEventListener("DOMContentLoaded", initNavbarScrollEffects);

  return {
    init: initNavbarScrollEffects
  };
})();
