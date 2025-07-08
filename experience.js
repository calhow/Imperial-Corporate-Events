// Sets experience background image from gallery or video poster with animations
const BackgroundImageManager = (() => {
  // Configuration
  const config = {
    animationDuration: 0.6,
    easing: 'power2.out',
    targetClass: 'exp_bg_img',
    containerClass: 'exp_bg_img_wrap',
    bgImageCount: 8
  };
  
  // State
  let gallerySwiper = null;
  let isAnimating = false;
  let direction = 'next';
  let resizeHandler = null;
  let originalImages = [];
  let duplicateImages = [];
  let animatingIn = true;
  
  // Gets the source element from gallery slide
  const getSourceElement = (slide) => {
    if (!slide && gallerySwiper) {
      slide = gallerySwiper.slides[gallerySwiper.activeIndex];
    }
    
    if (!slide) {
      return document.querySelector('.video_gallery_poster') || null;
    }
    
    return slide.querySelector('.gallery_img') || 
           slide.querySelector('img') || 
           slide.querySelector('video');
  };
  
  // Extracts image URL from an element
  const getImageUrl = (element) => {
    if (!element) return null;
    
    if (element.tagName === 'IMG') {
      return element.src;
    } else if (element.tagName === 'VIDEO') {
      return element.poster || element.querySelector('source')?.getAttribute('poster');
    }
    
    return null;
  };
  
  // Gets container element for background images
  const getContainerElement = () => document.querySelector(`.${config.containerClass}`);
  
  // Finds all original background images
  const findOriginalImages = () => {
    const images = [];
    for (let i = 1; i <= config.bgImageCount; i++) {
      const img = document.querySelector(`.${config.targetClass}.is-${i}`);
      if (img) images.push(img);
    }
    return images;
  };
    
  // Creates duplicate set of images for crossfade animations
  const createDuplicateImages = () => {
    document.querySelectorAll(`.${config.targetClass}[data-duplicate="true"]`)
      .forEach(el => el.parentNode?.removeChild(el));
    
    const container = getContainerElement();
    if (!container || originalImages.length === 0) return [];
    
    const duplicates = [];
    
    originalImages.forEach((original, index) => {
      const duplicate = document.createElement('img');
      
      // Copy attributes from original
      for (const attr of original.attributes) {
        if (attr.name !== 'class' && attr.name !== 'src' && attr.name !== 'style') {
          duplicate.setAttribute(attr.name, attr.value);
        }
      }
      
      duplicate.className = original.className;
      duplicate.setAttribute('data-duplicate', 'true');
      duplicate.setAttribute('data-original-index', index.toString());
      duplicate.style.opacity = '0';
      
      if (original.src) {
        duplicate.src = original.src;
      }
      
      container.appendChild(duplicate);
      duplicates.push(duplicate);
    });
    
    return duplicates;
  };
  
  // Returns target opacity for an element based on CSS
  const getTargetOpacity = (element) => {
    const tempEl = document.createElement('img');
    tempEl.className = element.className;
    tempEl.style.cssText = "position: absolute; visibility: hidden;";
    document.body.appendChild(tempEl);
    
    const cssOpacity = parseFloat(window.getComputedStyle(tempEl).opacity);
    document.body.removeChild(tempEl);
    
    return isNaN(cssOpacity) ? 1 : cssOpacity;
  };
  
  // Initializes the background image manager
  const initialize = (swiper) => {
    if (!swiper) return;
    
    cleanup();
    
    gallerySwiper = swiper;
    originalImages = findOriginalImages();
    
    if (originalImages.length === 0) return;
    
    duplicateImages = createDuplicateImages();
    
    const sourceElement = getSourceElement();
    const imageUrl = getImageUrl(sourceElement);
    
    if (imageUrl) {
      originalImages.forEach(img => {
        img.src = imageUrl;
        img.style.opacity = '';
        img.style.transform = '';
      });
      
      duplicateImages.forEach(img => {
        img.src = imageUrl;
        img.style.opacity = '0';
        img.style.transform = '';
      });
    }
    
    gallerySwiper.on('slideNextTransitionStart', () => {
      direction = 'next';
      handleSlideChange();
    });
    
    gallerySwiper.on('slidePrevTransitionStart', () => {
      direction = 'prev';
      handleSlideChange();
    });
    
    gallerySwiper.on('breakpoint', () => {
      resetAnimation();
      updateBackgroundImagesFromCurrentSlide();
    });
    
    resizeHandler = debounce(() => {
      resetAnimation();
      updateBackgroundImagesFromCurrentSlide();
    }, 250);
    
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('beforeunload', cleanup, { once: true });
  };
  
  // Cleans up event listeners and resources
  const cleanup = () => {
    resetAnimation();
    
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    
    originalImages.forEach(img => {
      img.style.opacity = '';
      img.style.transform = '';
      gsap.killTweensOf(img);
    });
    
    duplicateImages.forEach(img => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    
    if (gallerySwiper) {
      gallerySwiper.off('slideNextTransitionStart');
      gallerySwiper.off('slidePrevTransitionStart');
      gallerySwiper.off('breakpoint');
      gallerySwiper = null;
    }
    
    originalImages = [];
    duplicateImages = [];
    isAnimating = false;
    animatingIn = true;
  };
  
  // Resets any in-progress animations
  const resetAnimation = () => {
    if (isAnimating) {
      originalImages.forEach(img => {
        gsap.killTweensOf(img);
        img.style.opacity = '';
        img.style.transform = '';
      });
      
      duplicateImages.forEach(img => {
        gsap.killTweensOf(img);
        img.style.opacity = '0';
        img.style.transform = '';
      });
      
      isAnimating = false;
    }
  };
  
  // Handles slide changes and triggers animations
  const handleSlideChange = () => {
    if (!gallerySwiper || originalImages.length === 0) return;
    
    if (isAnimating) resetAnimation();
    
    const activeSlide = gallerySwiper.slides[gallerySwiper.activeIndex];
    if (!activeSlide) return;
    
    const sourceElement = getSourceElement(activeSlide);
    const imageUrl = getImageUrl(sourceElement);
    
    if (!imageUrl) return;
    
    if (gallerySwiper.animating && gallerySwiper.swipeDirection) {
      updateBackgroundImagesFromCurrentSlide();
      return;
    }
    
    animateBackgroundTransition(imageUrl);
  };
  
  // Animates background image transitions
  const animateBackgroundTransition = (newImageUrl) => {
    if (originalImages.length === 0 || duplicateImages.length === 0) return;
    
    const currentAnimationRequest = newImageUrl;
    
    if (isAnimating) resetAnimation();
    
    isAnimating = true;
    
    // Determine which set is currently visible and which will animate in
    let currentSet = animatingIn ? originalImages : duplicateImages;
    let nextSet = animatingIn ? duplicateImages : originalImages;
    
    try {
      if (nextSet.some(img => !img.parentNode)) {
        if (animatingIn && duplicateImages.some(img => !img.parentNode)) {
          duplicateImages = createDuplicateImages();
          nextSet = animatingIn ? duplicateImages : originalImages;
        }
        
        if (nextSet.some(img => !img.parentNode)) {
          isAnimating = false;
          return;
        }
      }
      
      nextSet.forEach(img => {
        img.src = newImageUrl;
        if (img.style.display === 'none') img.style.display = '';
        img.style.opacity = '0';
      });
      
      // Get target opacities for all next set images
      const nextSetTargetOpacities = nextSet.map(getTargetOpacity);
      
      const tl = gsap.timeline({
        onComplete: () => {
          if (currentAnimationRequest === newImageUrl) {
            setTimeout(() => {
              if (currentAnimationRequest !== newImageUrl) return;
              
              nextSet.forEach(img => img.style.opacity = '');
              animatingIn = !animatingIn;
              isAnimating = false;
            }, 50);
          } else {
            isAnimating = false;
          }
        }
      });
      
      // Animate current set out
      currentSet.forEach(img => {
        tl.to(img, {
          opacity: 0,
          duration: config.animationDuration,
          ease: config.easing,
          onComplete: () => img.style.opacity = '0'
        }, 0);
      });
      
      // Animate each next set image to its target CSS opacity
      nextSet.forEach((img, i) => {
        tl.to(img, {
          opacity: nextSetTargetOpacities[i],
          duration: config.animationDuration,
          ease: config.easing,
          onComplete: () => img.style.opacity = ''
        }, 0);
      });
      
    } catch (error) {
      isAnimating = false;
    }
  };
  
  // Updates background images from current slide without animation
  const updateBackgroundImagesFromCurrentSlide = () => {
    if (!gallerySwiper || originalImages.length === 0) return;
    
    const activeSlide = gallerySwiper.slides[gallerySwiper.activeIndex];
    if (!activeSlide) return;
    
    const sourceElement = getSourceElement(activeSlide);
    const imageUrl = getImageUrl(sourceElement);
    
    if (!imageUrl) return;
    
    originalImages.forEach(img => {
      img.src = imageUrl;
      img.style.opacity = '';
    });
    
    duplicateImages.forEach(img => {
      img.src = imageUrl;
      img.style.opacity = '0';
    });
    
    animatingIn = true;
  };
  
  return {
    initialize,
    updateBackgroundImagesFromCurrentSlide,
    cleanup
  };
})();

// Debounce function
const debounce = (typeof Utils !== 'undefined' && Utils.debounce) ? Utils.debounce : function(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Add resize event listener for background images
window.addEventListener('resize', debounce(() => {
  if (typeof BackgroundImageManager !== 'undefined') {
    BackgroundImageManager.updateBackgroundImagesFromCurrentSlide();
  }
}, 250));

// Initialize on page load
if (document.readyState !== 'loading') {
  if (typeof BackgroundImageManager !== 'undefined') {
    BackgroundImageManager.updateBackgroundImagesFromCurrentSlide();
  }
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof BackgroundImageManager !== 'undefined') {
      BackgroundImageManager.updateBackgroundImagesFromCurrentSlide();
    }
  }, {once: true});
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
  {
    selector: ".swiper.is-exp-venues",
    comboClass: "is-exp-venues",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-exp-reviews",
    comboClass: "is-exp-reviews",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-package-featured",
    comboClass: "is-package-featured",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-package-all",
    comboClass: "is-package-all",
    slidesPerView: 1,
    spaceBetween: 32,
    speed: 600,
    grid: {
      rows: 4,
      fill: "column"
    }
  }
];

// Initializes Swiper with proper navigation and breakpoints
const initializeSwiper = ({
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
        toggleButtonWrapper(this);
      },
      slideChange() {
        toggleButtonWrapper(this);
      },
      resize() {
        toggleButtonWrapper(this);
      },
    },
  };

  // Add grid configuration if provided
  if (grid) {
    swiperConfig.grid = grid;
  }

  const swiper = new Swiper(selector, swiperConfig);

  swiper.comboClass = comboClass;
  return swiper;
};

// Toggles button wrapper visibility based on swiper state
const toggleButtonWrapper = (swiper) => {
  const { comboClass } = swiper;
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);

  if (!btnWrap) return;
  const shouldHide = swiper.isBeginning && swiper.isEnd;
  btnWrap.style.display = shouldHide ? "none" : "flex";
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
    // Ensure .gallery_btn_wrap is always recalculated after resize
    const mainGallerySwiper = document.querySelector('.swiper.is-gallery')?.swiper;
    if (mainGallerySwiper) {
      SwiperManager.toggleNavigationVisibility(mainGallerySwiper, {
        galleryBtnWrap: document.querySelector('.gallery_btn_wrap'),
        prevBtn: document.querySelector('[data-swiper-button-prev="is-gallery"]'),
        nextBtn: document.querySelector('[data-swiper-button-next="is-gallery"]')
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

window.addEventListener("resize", debounce(manageSwipers, 200));

manageSwipers();


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

// Sets up highlight card tap behavior
function setCardHighlightListeners() {
  document.querySelectorAll(".card_highlight_wrap").forEach((card) => {
    card.addEventListener("click", handleClick);
  });
}

function handleClick(event) {
  // only bail out on title‐click if the card is currently active
  if (
    this.classList.contains('is-active') &&
    event.target.closest('.card_highlight_text_title')
  ) {
    return;
  }

  event.preventDefault();
  this.classList.toggle('is-active');
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
  if (!src.trim()) return false;
  
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
    if (btnWrap) {
      btnWrap.style.display = hasMultipleSlides ? "flex" : "none";
    }
    const prevButton = prevBtn || 
      (uniqueValue && document.querySelector(`[data-swiper-button-prev="${uniqueValue}"]`)) ||
      document.querySelector('[data-swiper-button-prev]');
    const nextButton = nextBtn || 
      (uniqueValue && document.querySelector(`[data-swiper-button-next="${uniqueValue}"]`)) ||
      document.querySelector('[data-swiper-button-next]');
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
    loop: true,
    preventClicks: false,
    preventClicksPropagation: false,
    speed: 400,
    easing: 'ease-out',
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
        if (videoSlidePrePositioned) {
          swiper.slideTo(0, 0, false);
        }
        
        SwiperManager.toggleNavigationVisibility(swiper, {
          galleryBtnWrap: document.querySelector(".gallery_btn_wrap"),
          prevBtn: document.querySelector('[data-swiper-button-prev="is-gallery"]'),
          nextBtn: document.querySelector('[data-swiper-button-next="is-gallery"]')
        });
        
        // Initialize the background image manager with this swiper
        BackgroundImageManager.initialize(swiper);
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
            const response = await fetchWithTimeout(href, {}, 5e3);
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
const cardsSelectors = [".packages_card", ".swiper-slide.is-package-all"];
const combinedCardsSelector = cardsSelectors.join(", ");
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
    this.handleResize = this.handleResize.bind(this);
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
    
    // Look for different possible link patterns in both card types
    const linkElement = card.querySelector(".packages_link") || 
                       card.querySelector("a[href]") ||
                       card.querySelector("[data-link-href]");
    
    if (linkElement) {
      const url = linkElement.getAttribute("href") || 
                  linkElement.getAttribute("data-link-href");
      
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
            initializeTabsInScope(packageModalTarget);
            initializeCountersInScope(packageModalTarget);
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
        let eventFired = false;
        
        document.addEventListener("cmsNestComplete", (event) => {
            eventFired = true;
            
            requestAnimationFrame(() => {
                insertSVGFromCMS(packageModalTarget);
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
                        insertSVGFromCMS(packageModalTarget);
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
  
  // Look for different possible link patterns in both card types
  const linkElement = card.querySelector(".packages_link") || 
                     card.querySelector("a[href]") ||
                     card.querySelector("[data-link-href]");
  
  if (!linkElement) return;
  
  const url = linkElement.getAttribute("href") || 
             linkElement.getAttribute("data-link-href");
  
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

// Populates modal with content and animations
async function populateModal(content, url) {
    if (!packageModalTarget) return;
    
    TimelineManager.clearAll();
    EventManager.removeAll(packageModalTarget);
    
    // Clean up availability sync if it exists
    if (packageModalTarget._availabilitySyncCleanup) {
        packageModalTarget._availabilitySyncCleanup();
        packageModalTarget._availabilitySyncCleanup = null;
    }
    
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

// Initialize package cards on page load
document.addEventListener('DOMContentLoaded', () => {
  if (packageModalTarget) {
    const packageCards = document.querySelectorAll(combinedCardsSelector);
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
            // Check if the node matches any of our card selectors
            const matchesAnySelector = cardsSelectors.some(selector => 
              node.matches && node.matches(selector)
            );
            
            if (matchesAnySelector) {
              newCards.push(node);
            }
            
            if (node.querySelectorAll) {
              const nestedCards = node.querySelectorAll(combinedCardsSelector);
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

// on DOM-ready, wire it up for *both* your package and your experience modal
document.addEventListener('DOMContentLoaded', () => {
  // your existing package modal
  initializePackageForm(packageModalTarget);

  // the "experience" modal
  const experienceModalTarget = document.querySelector(
    '[data-modal-group="experience"][data-modal-element="tray-contain"]'
  );
  initializePackageForm(experienceModalTarget);
});


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

// Fix tab highlight position after modal animation completes
document.addEventListener("packageModalAnimationComplete", () => {
  setTimeout(() => {
    const packageModalTarget = document.querySelector('[data-modal-element="tray-contain"][data-modal-group="package"]');
    if (!packageModalTarget) return;
    
    // Get all tab groups in the modal
    const tabGroups = new Set();
    packageModalTarget.querySelectorAll('[data-tab-element="tab"]').forEach(tab => {
      if (tab.dataset.tabGroup) {
        tabGroups.add(tab.dataset.tabGroup);
      }
    });
    
    // For each tab group, recalculate highlight positions
    tabGroups.forEach(group => {
      const tabWrap = packageModalTarget.querySelector(`[data-tab-element="tab-wrap"][data-tab-group="${group}"]`);
      if (!tabWrap) return;
      
      const tabMode = tabWrap.getAttribute("data-tab-mode");
      if (tabMode !== "highlight") return;
      
      const highlight = tabWrap.querySelector('.g_switch_tabs_highlight');
      if (!highlight) return;
      
      const tabs = packageModalTarget.querySelectorAll(`[data-tab-element="tab"][data-tab-group="${group}"]`);
      if (!tabs.length) return;
      
      // Find visible tabs
      const visibleTabs = Array.from(tabs).filter(tab => 
        !tab.classList.contains('w-condition-invisible') && 
        tab.offsetWidth > 0 && 
        tab.offsetHeight > 0
      );
      
      if (!visibleTabs.length) return;
      
      // Get current active tab or first visible tab
      const activeTab = Array.from(visibleTabs).find(tab => tab.classList.contains("is-active")) || visibleTabs[0];
      
      // If no tab is active, activate the first visible one
      if (!activeTab.classList.contains("is-active")) {
        tabs.forEach(tab => tab.classList.remove("is-active"));
        activeTab.classList.add("is-active");
      }
      
      // Position the highlight
      highlight.style.top = `${activeTab.offsetTop}px`;
      highlight.style.left = `${activeTab.offsetLeft}px`;
      highlight.style.width = `${activeTab.offsetWidth}px`;
      highlight.style.height = `${activeTab.offsetHeight}px`;
    });
  }, 100);
});


// Parallax animations setup
const expGallery = document.querySelector(".gallery_img");
const videoElement = document.querySelector(".video_gallery_player");
const posterElement = document.querySelector(".video_gallery_poster");
const testimonialThumb = document.querySelector(".testimonial_thumb_img");
const testimonialBg = document.querySelector(".testimonial_content_bg-img");

const getPaddingTop = el =>
  parseFloat(getComputedStyle(el).paddingTop) || 0;
const expContent = document.querySelector(".exp_content");
const galleryWrap = document.querySelector(".gallery_wrap");
const expContentPadding = expContent ? getPaddingTop(expContent) : 0;
const galleryWrapPadding = galleryWrap ? getPaddingTop(galleryWrap) : 0;
const totalGalleryOffset = expContentPadding + galleryWrapPadding;

// Create variables but don't initialize them outside the media query
let testimonialThumbParallax;
let testimonialBgParallax;
let expGalleryParallax;
let videoPosterParallax;

// Enable parallax for devices above 479px
let expMediaMatcher = gsap.matchMedia();
expMediaMatcher.add("(min-width: 479px)", () => {
  
  
  if (testimonialThumb) {
    testimonialThumbParallax = gsap.timeline({
      scrollTrigger: {
        trigger: testimonialThumb,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    testimonialThumbParallax.to(".testimonial_thumb_img", { y: "3rem" });
  }
  
  if (testimonialBg) {
    testimonialBgParallax = gsap.timeline({
      scrollTrigger: {
        trigger: testimonialBg,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    testimonialBgParallax.to(".testimonial_content_bg-img", { y: "3rem" });
  }
  
  if (expGallery) {
    expGalleryParallax = gsap.timeline({
      scrollTrigger: {
        trigger: expGallery,
        start: `top ${totalGalleryOffset}px`, 
        end: "bottom top",
        scrub: true,
      },
    });
    expGalleryParallax.to(".gallery_img", { y: "3rem" });
  }
  
  if (videoElement && posterElement) {
    videoPosterParallax = gsap.timeline({
      scrollTrigger: {
        trigger: posterElement,
        start: `top ${totalGalleryOffset}px`,
        end: "bottom top",
        scrub: true,
      },
    });
    videoPosterParallax.to(".video_gallery_poster", { y: "3rem" });
  }
});


// Swiper Module for exp nav links
const SwiperModule = (() => {
  let swiper;
  let isAnchorScrolling = false; // Prevents navigation jumps during smooth scrolling

  function initSwiper() {
    if (window.innerWidth >= 992) {
      if (!swiper) {
        swiper = new Swiper(".exp_nav_wrap", {
          wrapperClass: "exp_nav_list",
          slideClass: "exp_nav_item",
          navigation: {
            nextEl: '[data-swiper-btn-exp="next"]',
            prevEl: '[data-swiper-btn-exp="prev"]',
            disabledClass: "exp_nav_btn_wrap_disabled",
          },
          slidesPerView: "auto",
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          resistanceRatio: 0.85,
          freeMode: true,
          watchOverflow: true,
          on: {
            init: function() {
              updateSwiperClasses();
              slideToCurrentAnchor(this);
            },
            slideChange: updateSwiperClasses,
            reachEnd: updateSwiperClasses,
            reachBeginning: updateSwiperClasses,
            setTranslate: updateSwiperClasses,
          },
        });

        observeAnchorChanges();
        setupAnchorClickHandlers();
      }
    } else {
      if (swiper) {
        swiper.destroy(true, true);
        swiper = undefined;
      }
    }
  }

  // Centers the currently active nav item with adjustment for navigation buttons
  function slideToCurrentAnchor(swiperInstance) {
    if (isAnchorScrolling) return;
    
    const activeAnchorItem = document.querySelector('.exp_nav_item a.w--current');
    if (activeAnchorItem && swiperInstance) {
      const slideElement = activeAnchorItem.closest('.exp_nav_item');
      if (slideElement) {
        const slideIndex = Array.from(slideElement.parentNode.children).indexOf(slideElement);
        if (slideIndex !== -1) {
          const swiperWidth = swiperInstance.width;
          const slideWidth = slideElement.offsetWidth;
          const slideLeft = slideElement.offsetLeft;
          
          const prevButton = document.querySelector('[data-swiper-btn-exp="prev"]');
          const buttonOffset = prevButton ? prevButton.offsetWidth + 10 : 0; // Extra padding prevents overlap
          
          let offset = slideLeft - (swiperWidth / 2) + (slideWidth / 2) - buttonOffset;
          offset = Math.max(0, Math.min(offset, swiperInstance.maxTranslate() * -1));
          
          swiperInstance.translateTo(-offset, 300);
          
          setTimeout(() => {
            swiperInstance.updateProgress();
            swiperInstance.updateActiveIndex();
            updateSwiperClasses();
          }, 350);
        }
      }
    }
  }

  // Prevents navigation jumps during anchor link scrolling
  function setupAnchorClickHandlers() {
    document.querySelectorAll('.exp_nav_item a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        if (swiper) {
          const slideElement = this.closest('.exp_nav_item');
          if (slideElement) {
            const slideIndex = Array.from(slideElement.parentNode.children).indexOf(slideElement);
            if (slideIndex !== -1) {
              isAnchorScrolling = true;
              slideToCurrentAnchor(swiper);
              
              // Reset flag after estimated scroll animation completes
              setTimeout(() => {
                isAnchorScrolling = false;
              }, 1500);
            }
          }
        }
      });
    });
  }

  // Tracks navigation state changes from scrolling and hash changes
  function observeAnchorChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.classList.contains('w--current')) {
          
          if (swiper && !isAnchorScrolling) {
            slideToCurrentAnchor(swiper);
          }
        }
      });
    });

    document.querySelectorAll('.exp_nav_item a').forEach(anchor => {
      observer.observe(anchor, { attributes: true });
    });
    
    window.addEventListener('hashchange', () => {
      if (swiper) {
        isAnchorScrolling = true;
        setTimeout(() => slideToCurrentAnchor(swiper), 100);
        setTimeout(() => {
          isAnchorScrolling = false;
        }, 1500);
      }
    });
    
    const scrollHandler = debounce(() => {
      if (swiper && !isAnchorScrolling) {
        slideToCurrentAnchor(swiper);
      }
    }, 200);
    
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  // Updates navigation button states based on swiper position
  function updateSwiperClasses() {
    const swiperContainer = document.querySelector(".exp_nav_wrap");
    const nextButton = document.querySelector(
      '[data-swiper-btn-exp="next"]'
    );
    const prevButton = document.querySelector(
      '[data-swiper-btn-exp="prev"]'
    );

    if (!swiperContainer || !nextButton || !prevButton) return;

    swiperContainer.classList.remove("is-next", "is-both", "is-prev");

    if (prevButton.classList.contains("exp_nav_btn_wrap_disabled") && nextButton.classList.contains("exp_nav_btn_wrap_disabled")) {
      return;
    } else if (nextButton.classList.contains("exp_nav_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-prev");
    } else if (prevButton.classList.contains("exp_nav_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-next");
    } else {
      swiperContainer.classList.add("is-both");
    }
  }

  // Prevents rapid firing of expensive operations
  const debounce = function(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  window.addEventListener("load", initSwiper);
  
  const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : debounce;
  
  window.addEventListener("resize", debounceFn(initSwiper, 100));

  return {
    initSwiper,
    getSwiper: () => swiper,
    slideToCurrentAnchor: () => slideToCurrentAnchor(swiper)
  };
})();


// SHARE BUTTON

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('shareBtn');
  const textEl = btn.querySelector('.btn_default_text');
  const originalText = textEl.textContent;

  btn.addEventListener('click', async () => {
    const shareData = {
      title: document.title,
      text: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        textEl.textContent = 'Link copied';
        setTimeout(() => {
          textEl.textContent = originalText;
        }, 3000);
      } catch (err) {
        console.error('Could not copy link:', err);
      }
    }
  });
});


// Sticky button bar on tablet down
const stickyOptionsMatchMedia = gsap.matchMedia();

stickyOptionsMatchMedia.add("(max-width: 991px)", () => {
  ScrollTrigger.create({
    trigger: ".footer_wrap",
    start: "top bottom",
    onEnter: () => {
      gsap.set(".exp_sticky_options_wrap", { yPercent: 100, overwrite: true });
    },
    onLeaveBack: () => {
      gsap.set(".exp_sticky_options_wrap", { yPercent: 0, overwrite: true });
    }
  });
});

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


