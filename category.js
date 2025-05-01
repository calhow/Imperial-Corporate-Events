const swiperInstances = [];

// Utility debounce function
const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const CategoryBackgroundManager = (() => {
  // Configuration
  const config = {
    animationDuration: 0.6,
    easing: 'power2.out',
    targetClass: 'cat_bg_img',
    containerClass: 'cat_bg_img_wrap',
    bgImageCount: 8
  };
  
  // Try alternative container class if needed
  if (!document.querySelector(`.${config.containerClass}`)) {
    config.containerClass = 'cat_bg_img_wrap-copy';
  }
  
  // Check if background images with current class exist
  const hasBgImages = document.querySelector(`.${config.targetClass}`);
  if (!hasBgImages) {
    // Try alternative class names
    const alternativeClasses = ['cat_hero_bg_img', 'cat_bg_image'];
    for (const altClass of alternativeClasses) {
      if (document.querySelector(`.${altClass}`)) {
        config.targetClass = altClass;
        break;
      }
    }
  }
  
  // State
  let heroSwiper = null;
  let isAnimating = false;
  let resizeHandler = null;
  let originalImages = [];
  let duplicateImages = [];
  let animatingIn = true;
  
  // Gets the source element from hero slide
  const getSourceElement = (slide) => {
    if (!slide && heroSwiper) {
      slide = heroSwiper.slides[heroSwiper.activeIndex];
    }
    
    if (!slide) {
      return document.querySelector('.cat_card_poster') || null;
    }
    
    return slide.querySelector('img') || slide.querySelector('video');
  };
  
  // Extracts image URL from an element
  const getImageUrl = (element) => {
    if (!element) return null;
    
    let url = null;
    
    if (element.tagName === 'IMG') {
      url = element.src;
    } else if (element.tagName === 'VIDEO') {
      url = element.poster || element.querySelector('source')?.getAttribute('poster');
    }
    
    return url;
  };
  
  // Gets container element for background images
  const getContainerElement = () => {
    return document.querySelector(`.${config.containerClass}`);
  };
  
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
    
    heroSwiper = swiper;
    originalImages = findOriginalImages();
    
    if (originalImages.length === 0) return;
    
    duplicateImages = createDuplicateImages();
    
    const sourceElement = getSourceElement();
    const imageUrl = getImageUrl(sourceElement);
    
    if (imageUrl) {
      originalImages.forEach(img => {
        img.src = imageUrl;
        img.style.opacity = '';
      });
      
      duplicateImages.forEach(img => {
        img.src = imageUrl;
        img.style.opacity = '0';
      });
    }
    
    // Listen for slide changes
    heroSwiper.on('slideChange', handleSlideChange);
    
    // Add more event listeners to ensure we catch slide changes
    heroSwiper.on('slideChangeTransitionStart', handleSlideChange);
    
    heroSwiper.on('slideChangeTransitionEnd', updateBackgroundImagesFromCurrentSlide);
    
    heroSwiper.on('breakpoint', () => {
      resetAnimation();
      updateBackgroundImagesFromCurrentSlide();
    });
    
    // Debounce resize handler
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
      gsap.killTweensOf(img);
    });
    
    duplicateImages.forEach(img => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    
    if (heroSwiper) {
      heroSwiper.off('slideChange');
      heroSwiper.off('slideChangeTransitionStart');
      heroSwiper.off('slideChangeTransitionEnd');
      heroSwiper.off('breakpoint');
      heroSwiper = null;
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
      });
      
      duplicateImages.forEach(img => {
        gsap.killTweensOf(img);
        img.style.opacity = '0';
      });
      
      isAnimating = false;
    }
  };
  
  // Handles slide changes and triggers animations
  const handleSlideChange = () => {
    if (!heroSwiper || originalImages.length === 0) return;
    
    if (isAnimating) resetAnimation();
    
    const activeSlide = heroSwiper.slides[heroSwiper.activeIndex];
    if (!activeSlide) return;
    
    const sourceElement = getSourceElement(activeSlide);
    const imageUrl = getImageUrl(sourceElement);
    
    if (!imageUrl) return;
    
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
    if (!heroSwiper || originalImages.length === 0) return;
    
    const activeSlide = heroSwiper.slides[heroSwiper.activeIndex];
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
  
  // Manually refreshes all background images with current slide content
  const refreshBackgrounds = () => {
    // Try to find container again in case DOM has changed
    const container = getContainerElement();
    
    // Recheck original images
    const freshOriginals = findOriginalImages();
    
    if (freshOriginals.length > 0) {
      originalImages = freshOriginals;
      
      // If hero swiper exists, update from current slide
      if (heroSwiper) {
        updateBackgroundImagesFromCurrentSlide();
      } else {
        // Try to find a fallback source
        const fallbackSource = getSourceElement();
        const fallbackUrl = getImageUrl(fallbackSource);
        
        if (fallbackUrl) {
          // Apply to all original images
          originalImages.forEach(img => {
            img.src = fallbackUrl;
            img.style.opacity = '';
          });
          
          // Recreate duplicates
          duplicateImages = createDuplicateImages();
          duplicateImages.forEach(img => {
            img.src = fallbackUrl;
            img.style.opacity = '0';
          });
        }
      }
      
      return true;
    }
    
    return false;
  };
  
  return {
    initialize,
    updateBackgroundImagesFromCurrentSlide,
    cleanup,
    refreshBackgrounds
  };
})();

const swiperConfigs = [
  {
    selector: ".swiper.is-cat-hero",
    comboClass: "is-cat-hero",
    slidesPerView: "auto",
    parallax: true,
    speed: 800,
    autoplay: {
      delay: 15000,
      disableOnInteraction: true,
    },
  },
  {
    selector: ".swiper.is-reviews",
    comboClass: "is-reviews",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-cats",
    comboClass: "is-cats",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-venues",
    comboClass: "is-venues",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-comps",
    comboClass: "is-comps",
    slidesPerView: "auto",
  },
  {
    selector: ".swiper.is-teams",
    comboClass: "is-teams",
    slidesPerView: "auto",
  },
];

// Video management for swiper slides
const manageSlideVideos = (swiper) => {
  const slides = swiper.slides;
  
  // Handle all videos in slides
  slides.forEach((slide, index) => {
    const video = slide.querySelector('video');
    if (!video) return;
    
    // Pause all videos initially
    video.pause();
    
    // Play video if it's the active slide
    if (index === swiper.activeIndex) {
      video.play().catch(err => console.warn('Video playback error:', err));
    }
  });
};

// Handle video on slide change
const handleSlideChange = (swiper) => {
  const slides = swiper.slides;
  
  // Pause all videos first
  slides.forEach(slide => {
    const video = slide.querySelector('video');
    if (video) video.pause();
  });
  
  // Play video on active slide
  const activeSlide = slides[swiper.activeIndex];
  if (activeSlide) {
    const activeVideo = activeSlide.querySelector('video');
    if (activeVideo) {
      activeVideo.play().catch(err => console.warn('Video playback error:', err));
    }
  }
};

// Initialize Swiper instances with navigation and event handlers
const initializeSwiper = ({
  selector,
  comboClass,
  slidesPerView,
  breakpoints,
  parallax,
  speed,
  autoplay,
}) => {
  const swiper = new Swiper(selector, {
    speed: speed || 500,
    slidesPerView,
    spaceBetween: 0,
    parallax,
    autoplay,
    navigation: {
      nextEl: `[data-swiper-button-next="${comboClass}"]`,
      prevEl: `[data-swiper-button-prev="${comboClass}"]`,
    },
    breakpoints,
    on: {
      init() {
        toggleButtonWrapper(this);
        if (comboClass === "is-cat-hero") {
          manageSlideVideos(this);
          CategoryBackgroundManager.initialize(this);
        }
      },
      slideChange() {
        toggleButtonWrapper(this);
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
        }
      },
      resize() {
        toggleButtonWrapper(this);
      },
      autoplayStop() {
        // Restart autoplay if it's the cat-hero swiper
        if (comboClass === "is-cat-hero" && this.autoplay) {
          setTimeout(() => this.autoplay.start(), 50);
        }
      },
      autoplayPause() {
        // Restart autoplay if it's the cat-hero swiper
        if (comboClass === "is-cat-hero" && this.autoplay) {
          setTimeout(() => this.autoplay.start(), 50);
        }
      },
      slideChangeTransitionEnd() {
        // Make sure autoplay is running
        if (comboClass === "is-cat-hero" && this.autoplay && this.autoplay.paused) {
          this.autoplay.start();
        }
        
        if (comboClass === "is-cat-hero" && this.isEnd) {
          setTimeout(() => {
            this.slideTo(0, 500);
            
            // Ensure autoplay continues after a sufficient delay
            setTimeout(() => {
              if (this.autoplay) {
                this.autoplay.start();
              }
            }, 600);
          }, 2000); // Wait full delay time before resetting
        }
      },
    },
  });

  swiper.comboClass = comboClass;
  return swiper;
};

// Toggle visibility of navigation buttons based on swiper state
const toggleButtonWrapper = (swiper) => {
  const { comboClass } = swiper;
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);

  if (!btnWrap) return;
  btnWrap.style.display = swiper.isBeginning && swiper.isEnd ? "none" : "flex";
};

// Reset button wrappers to default state
const resetButtonWrappers = () => {
  const buttonWrappers = document.querySelectorAll("[data-swiper-combo]");
  buttonWrappers.forEach((btnWrap) => {
    btnWrap.style.display = "none";
  });
};

// Initialize or destroy swipers based on viewport width
const manageSwipers = () => {
  const isSwiperEnabled = window.innerWidth > 991;

  if (isSwiperEnabled) {
    if (swiperInstances.length === 0) {
      swiperConfigs.forEach((config) => {
        const swiperContainer = document.querySelector(config.selector);
        if (swiperContainer) {
          const slides = swiperContainer.querySelectorAll(".swiper-slide");
          if (slides.length > 0) {
            const swiper = initializeSwiper(config);
            swiperInstances.push(swiper);
          }
        }
      });
    }
  } else {
    resetButtonWrappers();

    // Clean up background manager when swipers are destroyed
    CategoryBackgroundManager.cleanup();

    while (swiperInstances.length > 0) {
      const swiper = swiperInstances.pop();
      swiper.destroy(true, true);
    }
  }
};

// Attach listener to window resize using Utils.debounce if available
window.addEventListener("resize", (typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
})(manageSwipers, 200));

// Initialize on page load
manageSwipers();

// Category tab underline animation
const tabWraps = document.querySelectorAll(".cat_tab");
let fillElement = document.createElement("div");
fillElement.classList.add("cat_tab_underline_fill");
document.body.appendChild(fillElement);

// Get animation duration based on viewport width
const getAnimationDuration = () => {
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  return viewportWidth >= 992 ? 0.4 : 0.3;
};

// Update underline position with animation
const updateUnderline = (newActiveTab) => {
  const underline = newActiveTab.querySelector(".cat_tab_underline");
  if (!underline) return;

  const state = Flip.getState(fillElement);
  underline.appendChild(fillElement);

  Flip.from(state, {
    duration: getAnimationDuration(),
    ease: "power1.out",
    absolute: true,
  });
};

// Handle tab click events
tabWraps.forEach((tab) => {
  tab.addEventListener("click", () => {
    const currentActive = document.querySelector(".cat_tab.is-active");

    if (currentActive && currentActive !== tab) {
      currentActive.classList.remove("is-active");
    }

    tab.classList.add("is-active");
    updateUnderline(tab);
  });
});

// Initialize underline position
const tabList = document.querySelector(".cat_tab_wrap");
if (tabList) {
  const firstTab = tabList.firstElementChild;
  if (firstTab) {
    const underline = firstTab.querySelector(".cat_tab_underline");
    if (underline) {
      underline.appendChild(fillElement);
    }
  }
}

// Set initial active tab underline
const initialActive = document.querySelector(".cat_tab.is-active");
if (initialActive) {
  updateUnderline(initialActive);
}

// Update underline on window resize
window.addEventListener("resize", () => {
  const currentActive = document.querySelector(".cat_tab.is-active");
  if (currentActive) {
    updateUnderline(currentActive);
  }
});

// Category content tab system
document.addEventListener("DOMContentLoaded", () => {
  const tabs = Array.from(
    document.querySelectorAll('[data-cat-element="tab"]')
  );
  const contents = Array.from(
    document.querySelectorAll('[data-cat-element="content"]')
  );
  const contentWrap = document.querySelector(
    '[data-cat-element="content-wrap"]'
  );

  // Create map for quick access to content elements
  const contentMap = contents.reduce((map, content) => {
    map[content.getAttribute("data-cat-group")] = content;
    return map;
  }, {});

  function updateContentWrapHeight() {
    const activeContent = contentWrap.querySelector(
      '[data-cat-element="content"].is-active'
    );
    contentWrap.style.height = activeContent
      ? `${activeContent.offsetHeight}px`
      : "0px";
  }

  function updateActiveTab(selectedTab) {
    const selectedGroup = selectedTab.getAttribute("data-cat-group");

    tabs.forEach((tab) =>
      tab.classList.toggle("is-active", tab === selectedTab)
    );

    contents.forEach((content) => content.classList.remove("is-active"));
    const activeContent = contentMap[selectedGroup];
    if (activeContent) activeContent.classList.add("is-active");

    updateContentWrapHeight();
  }

  // Initialize first tab
  if (tabs.length) {
    updateActiveTab(tabs[0]);
  }

  // Add click listeners
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => updateActiveTab(tab))
  );

  // Handle resize with debounce
  const debouncedResize = (typeof Utils !== 'undefined' ? 
    Utils.debounce(updateContentWrapHeight, 100) : 
    (() => {
      let resizeTimeout;
      return () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateContentWrapHeight, 100);
      };
    })()
  );
  
  window.addEventListener("resize", debouncedResize);
});

// Show pagination and sorting controls for lists with more than 3 items
document.addEventListener("DOMContentLoaded", () => {
  const mainList = document.querySelector(".exp_main_list");
  const itemCount = mainList
    ? mainList.getElementsByClassName("exp_main_item").length
    : 0;

  if (mainList && itemCount > 3) {
    const pagination = document.querySelector(".cat_exp_list_pagination");
    const sortWrap = document.querySelector(".cat_exp_sort_form_wrap");
    const listCount = document.querySelector(".cat_exp_list_count");

    if (pagination) pagination.style.display = "flex";
    if (sortWrap) sortWrap.style.display = "flex";
    if (listCount) listCount.style.display = "block";
  }
});

// Navbar link animation on scroll
if (typeof window.NavScrollTrigger !== 'undefined') {
  // Use the global module
  // It will initialize on DOMContentLoaded automatically
} else {
  // Local fallback implementation
  const navScrollTriggerModule = (() => {
    // Handle media queries
    const mmSecond = gsap.matchMedia();

    // Navbar opacity change for screens 1215px and above
    mmSecond.add("(min-width: 1215px)", () => {
      ScrollTrigger.create({
        trigger: ".page_main",
        start: "top+=5px top",
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

    return {}; // Ensure the module returns an object if needed
  })();
}

// Re-initialize CategoryBackgroundManager if needed when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Find all swiper containers
  const heroContainer = document.querySelector('.swiper.is-cat-hero');
  
  if (heroContainer) {
    const slides = heroContainer.querySelectorAll('.swiper-slide');
  }
  
  // Find the hero swiper instance if it exists
  const heroSwiperInstance = swiperInstances.find(swiper => swiper.comboClass === "is-cat-hero");
  
  if (heroSwiperInstance) {
    // Force recreate all original and duplicate images
    CategoryBackgroundManager.initialize(heroSwiperInstance);
  } else {
    // If no hero swiper instance but container exists, initialize manually
    const heroConfig = swiperConfigs.find(config => config.comboClass === "is-cat-hero");
    if (heroConfig) {
      const swiperContainer = document.querySelector(heroConfig.selector);
      if (swiperContainer) {
        const slides = swiperContainer.querySelectorAll(".swiper-slide");
        if (slides.length > 0) {
          const newSwiper = initializeSwiper(heroConfig);
          swiperInstances.push(newSwiper);
        }
      }
    }
  }
});

// Add a final fallback on window load
window.addEventListener('load', () => {
  setTimeout(() => {
    // Try manually refreshing backgrounds after everything is loaded
    CategoryBackgroundManager.refreshBackgrounds();
    
    // Check again for hero swiper
    const heroSwiperInstance = swiperInstances.find(swiper => swiper.comboClass === "is-cat-hero");
    if (heroSwiperInstance) {
      CategoryBackgroundManager.initialize(heroSwiperInstance);
    }
  }, 500);
});

// Parallax animations setup
const catCardMedia = document.querySelector(".cat_card_media");
const catHeaderWrap = document.querySelector(".cat_header_wrap");

// Create variables but don't initialize them outside the media query
let catCardMediaParallax;

// Enable parallax for devices above 479px
let catCardMediaMatcher = gsap.matchMedia();
catCardMediaMatcher.add("(min-width: 479px)", () => {
  // Initialize all parallax timelines inside the media query
  
  if (catCardMedia) {
    catCardMediaParallax = gsap.timeline({
      scrollTrigger: {
        trigger: ".cat_card_media",
        start: () => {
          const headerHeight = catHeaderWrap ? catHeaderWrap.offsetHeight : 0;
          return `top-=${headerHeight}px top`;
        },
        end: "bottom top",
        scrub: true,
      },
    });
    catCardMediaParallax.to(".cat_card_media > *", { y: "10rem" });
  }
  
});



