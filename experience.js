// Sets experience background image from gallery or video poster
const setExpBackgroundImage = () => {
  // Find source element in priority order
  const getSourceElement = () => {
    // 1. Team logo with valid image URL
    const teamLogo = document.querySelector('.gallery_home-team-logo');
    if (teamLogo) {
      const logoSrc = teamLogo.currentSrc || teamLogo.src;
      if (logoSrc && 
          logoSrc.trim() !== '' && 
          !logoSrc.includes('/experience/') &&
          /\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(logoSrc)) {
        return teamLogo;
      }
    }
    
    // 2. Video poster with valid background image
    const videoPoster = document.querySelector('.video_gallery_poster');
    if (videoPoster) {
      const bgImage = getComputedStyle(videoPoster).backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage !== 'url("")') {
        return videoPoster;
      }
    }
    
    // 3. First gallery image
    return document.querySelector('.gallery_img');
  };
  
  // Extract image URL from source element
  const getImageUrl = (element) => {
    if (!element) return null;
    
    if (element.tagName === 'IMG') {
      return element.currentSrc || element.src;
    }
    
    const bgImage = getComputedStyle(element).backgroundImage;
    if (bgImage && bgImage !== 'none' && bgImage !== 'url("")') {
      const urlMatch = bgImage.split('"');
      return urlMatch.length > 1 ? urlMatch[1] : bgImage.substring(4, bgImage.length - 1);
    }
    
    return null;
  };
  
  // Set image source on all target elements
  const setBackgroundImages = (url) => {
    if (!url) return;
    
    const targetImages = document.getElementsByClassName('exp_bg_img');
    for (let i = 0; i < targetImages.length; i++) {
      targetImages[i].src = url;
    }
  };
  
  // Execute the image setting pipeline
  const sourceElement = getSourceElement();
  const imageUrl = getImageUrl(sourceElement);
  setBackgroundImages(imageUrl);
};

if (document.readyState !== 'loading') {
  setExpBackgroundImage();
} else {
  document.addEventListener('DOMContentLoaded', setExpBackgroundImage, {once: true});
}

const swiperInstances = [];

const swiperConfigs = [
  {
    selector: ".swiper.is-key-features",
    comboClass: "is-key-features",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-highlights",
    comboClass: "is-highlights",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-similar-exp",
    comboClass: "is-similar-exp",
    slidesPerView: "auto",
  },
];

// Initializes Swiper with proper navigation and breakpoints
const initializeSwiper = ({
  selector,
  comboClass,
  slidesPerView,
  breakpoints,
}) => {
  const swiper = new Swiper(selector, {
    speed: 400,
    slidesPerView,
    spaceBetween: 0,
    navigation: {
      nextEl: `[data-swiper-button-next="${comboClass}"]`,
      prevEl: `[data-swiper-button-prev="${comboClass}"]`,
    },
    breakpoints,
    on: {
      init() {
        toggleButtonWrapper(this);
      },
      slideChange() {
        toggleButtonWrapper(this);
      },
      resize() {
        toggleButtonWrapper(this);
      },
    },
  });

  swiper.comboClass = comboClass;
  return swiper;
};

// Toggles button wrapper visibility based on swiper state
const toggleButtonWrapper = (swiper) => {
  const { comboClass } = swiper;
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);

  if (!btnWrap) return;
  btnWrap.style.display = swiper.isBeginning && swiper.isEnd ? "none" : "flex";
};

// Resets button wrappers to default state
const resetButtonWrappers = () => {
  const buttonWrappers = document.querySelectorAll("[data-swiper-combo]");
  buttonWrappers.forEach((btnWrap) => {
    btnWrap.style.display = "none";
  });
};

// Manages Swiper initialization based on screen width
const manageSwipers = () => {
  const isSwiperEnabled = window.innerWidth > 991;

  if (isSwiperEnabled) {
    if (swiperInstances.length === 0) {
      swiperConfigs.forEach((config) => {
        const swiperContainer = document.querySelector(config.selector);
        if (swiperContainer) {
          const slides = swiperContainer.querySelectorAll(".swiper-slide");
          if (slides.length > 0) {
            swiperInstances.push(initializeSwiper(config));
          }
        }
      });
    }
  } else {
    resetButtonWrappers();

    while (swiperInstances.length > 0) {
      const swiper = swiperInstances.pop();
      swiper.destroy(true, true);
    }
  }
};

// Debounce function
const debounce = (typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
});

window.addEventListener("resize", debounce(manageSwipers, 200));

manageSwipers();

// Handles highlights swiper destruction and recreation during filter changes
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  "cmsfilter",
  (filterInstances) => {
    const [firstInstance, secondInstance] = filterInstances;

    swiperConfigs.forEach(({ selector, comboClass, slidesPerView }) => {
      if (comboClass !== "is-highlights") {
        const swiperInstance = initializeSwiper({
          selector,
          comboClass,
          slidesPerView,
        });

        swiperInstances.push(swiperInstance);
      }
    });

    const triggerRenderItems = () => {
      if (window.innerWidth < 992) return;

      const highlightsSwiper = swiperInstances.find(
        (swiper) => swiper.comboClass === "is-highlights"
      );

      if (highlightsSwiper) {
        highlightsSwiper.destroy(true, true);
        swiperInstances.splice(swiperInstances.indexOf(highlightsSwiper), 1);
      }

      const newHighlightsSwiper = initializeSwiper({
        selector: ".swiper.is-highlights",
        comboClass: "is-highlights",
        slidesPerView: "auto",
      });

      swiperInstances.push(newHighlightsSwiper);
    };

    if (secondInstance) {
      secondInstance.listInstance.on("renderitems", () => {
        triggerRenderItems();
      });
    }

    const onFilterChange = () => {
      triggerRenderItems();
    };

    if (secondInstance) {
      secondInstance.listInstance.on("change", onFilterChange);
    }
  },
]);

// Handles key feature card animation on click
const cards = document.querySelectorAll(".card_key-feature_wrap");

cards.forEach((card) => {
  const para = card.querySelector(".card_key-feature_para");

  para.classList.add("line-clamp-2");

  card.addEventListener("click", () => {
    if (card.classList.contains("is-expanded")) {
      card.classList.remove("is-expanded");
      setTimeout(() => para.classList.add("line-clamp-2"), 500);
    } else {
      card.classList.add("is-expanded");
      para.classList.remove("line-clamp-2");
    }
  });
});

// Sets up highlight card tap behavior for mobile
function setCardHighlightListeners() {
  if (window.innerWidth < 992) {
    document.querySelectorAll(".card_highlight_wrap").forEach((card) => {
      card.addEventListener("click", handleClick);
    });
  }
}

function handleClick(event) {
  event.preventDefault();
  this.classList.toggle("is-active");
}

document.addEventListener("DOMContentLoaded", setCardHighlightListeners);

// Unified video management system
const VideoManager = {
  setupVideo(container) {
    if (!container) return;
    
    const videoWrap = container.querySelector(".video_cover_wrap");
    const videoPlayer = container.querySelector(".video_gallery_player");
    
    if (!videoWrap || !videoPlayer) return;
    
    const uiElements = this._findUIElements(container);
    
    this._setupEventHandlers(videoWrap, videoPlayer, uiElements);
    
    return {
      videoWrap,
      videoPlayer,
      uiElements
    };
  },
  
  _findUIElements(container) {
    const uiElements = {
      testimonialBtn: null,
      swiperControls: null,
      galleryBtnWrap: null
    };
    
    const parentSlide = container.closest('.swiper-slide');
    const swiperContainer = container.closest('.swiper');
    
    uiElements.testimonialBtn = parentSlide?.querySelector(".gallery_selection_btn_wrap") || 
                               swiperContainer?.querySelector(".gallery_selection_btn_wrap");
    
    uiElements.swiperControls = swiperContainer?.querySelector(".swiper-pagination.is-gallery") ||
                               document.querySelector(".swiper-pagination.is-gallery");
    
    uiElements.galleryBtnWrap = swiperContainer?.parentElement?.querySelector(".gallery_btn_wrap") ||
                               swiperContainer?.closest(".video_wrap")?.querySelector(".gallery_btn_wrap") ||
                               document.querySelector(".gallery_btn_wrap");
    
    return uiElements;
  },
  
  _setupEventHandlers(videoWrap, videoPlayer, uiElements) {
    let isScrubbing = false;
    
    const toggleUI = (disable) => {
      videoWrap.classList.toggle("is-disabled", disable);
      
      if (uiElements.testimonialBtn) uiElements.testimonialBtn.classList.toggle("is-disabled", disable);
      if (uiElements.swiperControls) uiElements.swiperControls.classList.toggle("is-disabled", disable);
      if (uiElements.galleryBtnWrap) uiElements.galleryBtnWrap.classList.toggle("is-disabled", disable);
      
      if (disable) videoPlayer.setAttribute("controls", "true");
      else videoPlayer.removeAttribute("controls");
    };
    
    videoWrap.addEventListener("click", () => {
      toggleUI(true);
      videoPlayer.play().catch(() => {});
    });
    
    videoPlayer.addEventListener("ended", () => {
      videoPlayer.currentTime = 0;
      toggleUI(false);
    });
    
    videoPlayer.addEventListener("seeking", () => (isScrubbing = true));
    
    videoPlayer.addEventListener("seeked", () => {
      setTimeout(() => (isScrubbing = false), 100);
    });
    
    videoPlayer.addEventListener("pause", () => {
      setTimeout(() => {
        if (!isScrubbing) toggleUI(false);
      }, 100);
    });
  },
  
  initAll() {
    document.querySelectorAll('.video_contain').forEach(container => 
      this.setupVideo(container)
    );
  }
};

// Initialize all videos on DOM load
document.addEventListener("DOMContentLoaded", () => {
  VideoManager.initAll();
});

// Positions video slide to first position before swiper initialization
const prepareGalleryVideoSlide = () => {
  const videoSlide = document.querySelector(".video_wrap .swiper-slide.is-gallery");
  if (!videoSlide) return false;
  
  const videoElement = videoSlide.querySelector("video");
  if (!videoElement) return false;
  
  const src = videoElement.getAttribute("src") || "";
  const poster = videoElement.getAttribute("poster") || "";
  if (!src.trim() || !poster.trim()) return false;
  
  const swiperWrapper = document.querySelector(".swiper.is-gallery .swiper-wrapper");
  if (!swiperWrapper) return false;
  
  videoSlide.remove();
  swiperWrapper.prepend(videoSlide);
  
  const videoContainer = videoSlide.querySelector('.video_contain');
  if (videoContainer) VideoManager.setupVideo(videoContainer);
  
  return true;
};

// Unified Swiper utilities
const SwiperManager = {
  setupLoopMode(swiper, minSlidesForLoop = 2) {
    const slideCount = swiper.slides.length;
    const hasEnoughSlides = slideCount >= minSlidesForLoop;
    
    if (hasEnoughSlides) {
      swiper.params.loop = true;
      swiper.loopDestroy();
      swiper.loopCreate();
      swiper.update();
      return true;
    } else {
      swiper.params.loop = false;
      swiper.loopDestroy();
      swiper.update();
      return false;
    }
  },
  
  toggleNavigationVisibility(swiper, options = {}) {
    const {
      galleryBtnWrap = null,
      prevBtn = null,
      nextBtn = null,
      galleryClass = null,
      uniqueValue = null
    } = options;
    
    const slideCount = swiper.slides.length;
    const hasMultipleSlides = slideCount > 1;
    
    const btnWrap = galleryBtnWrap || 
      (galleryClass && document.querySelector(`.gallery_btn_wrap.${galleryClass}`)) ||
      document.querySelector(".gallery_btn_wrap");
      
    const prevButton = prevBtn || 
      (uniqueValue && document.querySelector(`[data-swiper-button-prev="${uniqueValue}"]`)) ||
      document.querySelector('[data-swiper-button-prev]');
      
    const nextButton = nextBtn || 
      (uniqueValue && document.querySelector(`[data-swiper-button-next="${uniqueValue}"]`)) ||
      document.querySelector('[data-swiper-button-next]');
    
    if (btnWrap) {
      btnWrap.style.display = hasMultipleSlides ? "flex" : "none";
    }
    
    if (prevButton && nextButton) {
      const displayValue = hasMultipleSlides ? "block" : "none";
      prevButton.style.display = displayValue;
      nextButton.style.display = displayValue;
    }
    
    return hasMultipleSlides;
  }
};

// Main gallery slider initialization
(() => {
  const videoSlidePrePositioned = prepareGalleryVideoSlide();
  
  const gallerySwiper = new Swiper(".swiper.is-gallery", {
    slidesPerView: 1,
    slideActiveClass: "is-active",
    effect: "fade",
    fadeEffect: { crossFade: true },
    loop: false,
    loopedSlides: 1,
    preventClicks: false,
    preventClicksPropagation: false,
    navigation: {
      nextEl: '[data-swiper-button-next="is-gallery"]',
      prevEl: '[data-swiper-button-prev="is-gallery"]',
      disabledClass: "is-disabled"
    },
    pagination: {
      el: ".swiper-pagination.is-gallery",
      type: "bullets",
      dynamicBullets: true
    },
    on: {
      init(swiper) {
        const loopEnabled = SwiperManager.setupLoopMode(swiper);
        
        if (videoSlidePrePositioned) {
          if (loopEnabled) {
            swiper.slideToLoop(0, 0, false);
          } else {
            swiper.slideTo(0, 0, false);
          }
        }
        
        SwiperManager.toggleNavigationVisibility(swiper, {
          galleryBtnWrap: document.querySelector(".gallery_btn_wrap"),
          prevBtn: document.querySelector('[data-swiper-button-prev="is-gallery"]'),
          nextBtn: document.querySelector('[data-swiper-button-next="is-gallery"]')
        });
      }
    }
  });
  
  return gallerySwiper;
})();

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
        loop: false,
        loopedSlides: 1,
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
            SwiperManager.setupLoopMode(this);
            
            SwiperManager.toggleNavigationVisibility(this, {
              galleryBtnWrap: gallery.closest(".package_gallery_contain")?.querySelector(".gallery_btn_wrap"),
              prevBtn: document.querySelector(`[data-swiper-button-prev="${uniqueValue}"]`),
              nextBtn: document.querySelector(`[data-swiper-button-next="${uniqueValue}"]`)
            });
          }
        }
      });
    });
  });
}

// Initializes highlights filter tabs
setTimeout(function () {
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    "cmsfilter",
    function (filterInstances) {
      if (filterInstances.length > 1) {
        const secondFilterInstance = filterInstances[1];
        const filtersData = secondFilterInstance.filtersData;

        let resultsArray = [];

        filtersData.forEach(function (element) {
          const elements = element.elements;
          elements.forEach(function (element) {
            let filterValue = element.value.trim();
            let resultsNumber = element.resultsCount;
            resultsArray.push({
              filterName: filterValue,
              filterResults: resultsNumber,
            });
          });
        });

        resultsArray.forEach(function (filter) {
          var elements = Array.from(
            document.querySelectorAll(".form_pill-tab_wrap")
          ).filter(function (element) {
            return (
              element
                .querySelector(".form_pill-tab_label")
                .textContent.trim() === filter.filterName
            );
          });

          elements.forEach(function (element) {
            if (element.tagName === "LABEL") {
              if (filter.filterResults === 0) {
                element.classList.add("radio-disabled");
              } else {
                element.classList.remove("radio-disabled");
              }
            }
          });
        });
      }
    },
  ]);
}, 100);

// Controls fixed buttons visibility while scrolling on mobile
ScrollTrigger.create({
  trigger: ".packages_wrap",
  start: "bottom top",
  onEnter: () => {
    document.querySelector(".exp_btn_wrap.is-fixed").classList.add("is-active");
  },
  onLeaveBack: () => {
    document
      .querySelector(".exp_btn_wrap.is-fixed")
      .classList.remove("is-active");
  },
});

ScrollTrigger.create({
  trigger: ".footer_wrap",
  start: "top bottom",
  onEnter: () => {
    document
      .querySelector(".exp_btn_wrap.is-fixed")
      .classList.remove("is-active");
  },
  onLeaveBack: () => {
    document.querySelector(".exp_btn_wrap.is-fixed").classList.add("is-active");
  },
});

let lastScrollTop = 0;
const btnWrap = document.querySelector(".exp_btn_wrap.is-fixed");

const throttleInterval = 300;
let lastCallTime = 0;

if (window.innerWidth <= 767 && btnWrap) {
  window.addEventListener("scroll", () => {
    const currentTime = new Date().getTime();

    if (currentTime - lastCallTime > throttleInterval) {
      lastCallTime = currentTime;

      const currentScrollTop =
        window.scrollY || document.documentElement.scrollTop;

      if (currentScrollTop > lastScrollTop) {
        btnWrap.classList.remove("is-upscroll");
      } else if (currentScrollTop < lastScrollTop) {
        btnWrap.classList.add("is-upscroll");
      }

      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    }
  });
}

// Fetches and injects nested CMS content
function cmsNest() {
  const items = document.querySelectorAll("[data-cms-nest^='item']");

  if (items.length === 0) {
    document.dispatchEvent(
      new CustomEvent("cmsNestComplete", { detail: { found: false } })
    );
    return;
  }

  let pendingFetches = items.length;
  let contentFound = false;

  items.forEach((item) => {
    const link = item.querySelector("[data-cms-nest='link']");
    if (!link) {
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
      return;
    }

    const href = link.getAttribute("href");
    if (!href) {
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
      return;
    }

    try {
      const url = new URL(href, window.location.origin);
      if (url.hostname !== window.location.hostname) {
        pendingFetches--;
        if (pendingFetches === 0) {
          document.dispatchEvent(
            new CustomEvent("cmsNestComplete", {
              detail: { found: contentFound },
            })
          );
        }
        return;
      }

      fetchWithTimeout(href, {}, 5e3)
        .then((response) => response.text())
        .then((html) => {
          const parsedContent = new DOMParser().parseFromString(
            html,
            "text/html"
          );

          const dropzones = item.querySelectorAll(
            "[data-cms-nest^='dropzone-']"
          );
          let foundContent = false;

          dropzones.forEach((dropzone) => {
            const dropzoneNum = dropzone
              .getAttribute("data-cms-nest")
              .split("-")[1];
            const targetSelector = `[data-cms-nest='target-${dropzoneNum}']`;

            const target = parsedContent.querySelector(targetSelector);
            if (target) {
              dropzone.innerHTML = "";
              dropzone.appendChild(target);
              foundContent = true;
              contentFound = true;
            }
          });

          item.dispatchEvent(
            new CustomEvent("cmsNestItemComplete", {
              detail: { found: foundContent },
              bubbles: true,
            })
          );

          pendingFetches--;
          if (pendingFetches === 0) {
            document.dispatchEvent(
              new CustomEvent("cmsNestComplete", {
                detail: { found: contentFound },
              })
            );
          }
        })
        .catch(() => {
          pendingFetches--;
          if (pendingFetches === 0) {
            document.dispatchEvent(
              new CustomEvent("cmsNestComplete", {
                detail: { found: contentFound },
              })
            );
          }
        });
    } catch (error) {
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
    }
  });
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
const cardsSelector = ".packages_card";
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
    console.log('[AnimationManager] Initialized with modal target:', !!modalTarget);
  }

  getElements() {
    this.elements = {
      headingWrap: this.modalTarget.querySelector('.package_heading_wrap'),
      contentChildren: this.modalTarget.querySelectorAll('.package_content > *'),
      contentGrandchildren: this.modalTarget.querySelectorAll('.package_content > * > *'),
      btnWrap: this.modalTarget.querySelector('.package_btn_wrap')
    };
    console.log('[AnimationManager] Found elements:', {
      hasHeadingWrap: !!this.elements.headingWrap,
      contentChildrenCount: this.elements.contentChildren?.length,
      contentGrandchildrenCount: this.elements.contentGrandchildren?.length,
      hasButtonWrap: !!this.elements.btnWrap
    });
    return this.elements;
  }

  setInitialState() {
    const elements = this.getElements();
    console.log('[AnimationManager] Setting initial state');
    
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
      gsap.set(elements.contentGrandchildren, { 
        opacity: 0, 
        x: "0.125rem", 
        y: "-0.25rem", 
        filter: "blur(2px)" 
      });
    }
    if (elements.btnWrap) gsap.set(elements.btnWrap, { opacity: 0, x: "0.5rem" });
    
    this.modalTarget.offsetHeight;
    console.log('[AnimationManager] Initial state set');
  }

  createTimeline() {
    console.log('[AnimationManager] Creating timeline');
    const elements = this.getElements();
    this.timeline = gsap.timeline({
      onComplete: () => {
        console.log('[AnimationManager] Timeline completed');
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
        filter: "blur(0rem)",
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
    
    console.log('[AnimationManager] Timeline created');
    return this.timeline;
  }

  animate() {
    console.log('[AnimationManager] Starting animation sequence');
    this.setInitialState();
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.createTimeline();
      });
    });
  }

  cleanup() {
    console.log('[AnimationManager] Cleaning up');
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.elements = null;
  }
}

const packageAnimationManager = new AnimationStateManager(packageModalTarget);

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
    
    const linkElement = card.querySelector(".packages_link");
    if (linkElement) {
      const url = linkElement.getAttribute("href");
      if (url && !contentCache.has(url) && !pendingFetches.has(url)) {
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

// Initializes modal content with all needed functionality
const initializeModalContent = async (contentElement) => {
    const initSequence = [
        () => initializePackageAccordion(),
        () => setupParagraphToggles(packageModalTarget),
        () => {
            initializeGallerySwipers();
            adjustHotelStars();
        },
        () => {
            initializeTabsInScope(packageModalTarget);
            initializeCountersInScope(packageModalTarget);
            initializePackageForm();
            initializeTabButtons(packageModalTarget);
        },
        () => {
            packageModalTarget.querySelectorAll('.video_contain')
                .forEach(container => VideoManager.setupVideo(container));
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
        document.addEventListener("cmsNestComplete", () => {
            requestAnimationFrame(() => {
                insertSVGFromCMS(packageModalTarget);
                hideEmptyDivs();
                resolve();
            });
        }, { once: true });
    });
};

// Creates content animation timeline
const createContentAnimation = (elements) => {
    const timeline = gsap.timeline({
        paused: true,
        onComplete: () => TimelineManager.remove(timeline)
    });

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
            props: { opacity: 1, x: "0rem", y: "0rem", filter: "blur(0rem)" },
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

// Sets initial animation states
const setInitialStates = (elements) => {
    const allElements = [
        elements.headingWrap,
        ...(elements.contentChildren || []),
        ...(elements.contentGrandchildren || []),
        elements.btnWrap
    ].filter(Boolean);
    
    gsap.set(allElements, { opacity: 0 });

    const states = {
        headingWrap: { opacity: 0, x: "0.5rem" },
        contentChildren: { opacity: 0, x: "1rem" },
        contentGrandchildren: { opacity: 0, x: "0.125rem", y: "-0.25rem", filter: "blur(2px)" },
        btnWrap: { opacity: 0, x: "0.5rem" }
    };

    Object.entries(states).forEach(([key, props]) => {
        const target = elements[key];
        if (target) gsap.set(target, props);
    });
};

// Populates modal with content and animations
async function populateModal(content, url) {
    if (!packageModalTarget) return;
    
    TimelineManager.clearAll();
    EventManager.removeAll(packageModalTarget);
    packageModalTarget.innerHTML = "";
    
    if (url) {
        packageModalTarget.setAttribute('data-current-url', url);
    }
    
    const contentClone = content.cloneNode(true);
    prepareContentForInsertion(contentClone);
    
    const elements = {
        headingWrap: contentClone.querySelector('.package_heading_wrap'),
        contentChildren: contentClone.querySelectorAll('.package_content > *'),
        contentGrandchildren: contentClone.querySelectorAll('.package_content > * > *'),
        btnWrap: contentClone.querySelector('.package_btn_wrap')
    };
    
    setInitialStates(elements);
    
    packageModalTarget.appendChild(contentClone);
    packageModalTarget.offsetHeight;
    await initializeModalContent(contentClone);
    
    const timeline = createContentAnimation(elements);
    timeline.play();
    
    return timeline;
}

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

// Handles content population for URL
const handleContentForUrl = (url) => {
  if (isModalContentCorrect(url)) {
    return;
  }
  
  if (contentCache.has(url)) {
    populateModal(contentCache.get(url), url);
    return;
  }
  
  if (pendingFetches.has(url)) {
    pendingFetches.get(url).then(content => {
      if (content) {
        populateModal(content, url);
      }
    });
    return;
  }
  
  const fetchPromise = fetchContent(url).then(content => {
    if (content) {
      contentCache.set(url, content);
      populateModal(content, url);
    }
    return content;
  }).catch(error => {
    return null;
  });
  
  pendingFetches.set(url, fetchPromise);
};

// Handles package card click events
const handleCardClick = (event) => {
  event.preventDefault();
  
  const card = event.currentTarget;
  const linkElement = card.querySelector(".packages_link");
  if (!linkElement) return;
  
  const url = linkElement.getAttribute("href");
  if (!url) return;
  
  openModalForUrl(url);
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
            y: "-0.25rem", 
            filter: "blur(2px)" 
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
                  filter: "blur(0rem)", 
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
          y: "-0.25rem", 
          filter: "blur(2px)" 
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
              filter: "blur(0rem)", 
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

// Initialize package cards on page load
document.addEventListener('DOMContentLoaded', () => {
  if (packageModalTarget) {
    const packageCards = document.querySelectorAll(cardsSelector);
    attachPackageCardHandlers(packageCards);
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

// Initializes and manages package form submission
const initializePackageForm = () => {
  const form = packageModalTarget.querySelector('#wf-form-Package');
  const submitBtn = packageModalTarget.querySelector('[data-form-submit="package"]');
  const formWrapper = form?.closest('.w-form');
  if (!form || !submitBtn || !formWrapper) return;

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

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const successWrap = formWrapper.querySelector('.w-form-done');
        const failWrap = formWrapper.querySelector('.w-form-fail');
        
        if (successWrap && successWrap.style.display === 'block') {
          stopLoading(true);
        } else if (failWrap && failWrap.style.display === 'block') {
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

  submitBtn.addEventListener('click', () => {
    const tempBtn = document.createElement('button');
    tempBtn.type = 'submit';
    tempBtn.style.display = 'none';
    form.appendChild(tempBtn);
    tempBtn.click();
    form.removeChild(tempBtn);
  });

  if (window.Webflow && Webflow.require) {
    try {
      const forms = Webflow.require("forms");
      if (forms && typeof forms.ready === 'function') {
        forms.ready();
      }
    } catch (e) {
      // Silently handle Webflow forms initialization errors
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