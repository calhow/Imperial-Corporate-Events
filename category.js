// Category page swiper and video management - Updated for CDN cache refresh
const swiperInstances = [];

// Function to adjust swiper parallax values based on screen width
const adjustSwiperParallax = () => {
  const catCardMediaElements = document.querySelectorAll('.swiper.is-cat-hero .cat_card_media');
  
  // Use smaller parallax value for mobile screens
  const parallaxValue = window.innerWidth <= 767 ? '250' : '400';
  
  catCardMediaElements.forEach(element => {
    element.setAttribute('data-swiper-parallax-x', parallaxValue);
  });
};

const swiperConfigs = [
  {
    selector: ".swiper.is-cat-hero",
    comboClass: "is-cat-hero",
    slidesPerView: "auto",
    parallax: true,
    speed: 800,
    loop: true,
    autoplay: {
      delay: 20000,
      disableOnInteraction: true,
    },
    pagination: document.querySelector(".swiper-pagination.is-cat-hero") ? {
      el: ".swiper-pagination.is-cat-hero",
      clickable: true,
    } : null,
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
    selector: ".swiper.is-reviews",
    comboClass: "is-reviews",
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
  {
    selector: ".swiper.is-competitions",
    comboClass: "is-competitions",
    slidesPerView: "auto",
  },

];

// Video management for swiper slides (HLS Version)
const manageSlideVideos = (swiper) => {
  // Store video elements, posters, and HLS instances for easier access
  swiper.videos = [];
  swiper.posters = [];
  swiper.videoTimeouts = [];
  // NEW: Use a Map to manage HLS instances for this swiper
  swiper.hlsInstances = new Map();

  swiper.slides.forEach((slide, index) => {
    const video = slide.querySelector('video');
    const poster = slide.querySelector('.cat_card_poster');
    
    if (video) {
      const source = video.querySelector('source');
      // Skip slides that don't have a video with a valid HLS source.
      if (!source || !source.dataset.hlsSrc) {
        return;
      }

      if (poster && poster.src) {
        video.poster = poster.src;
      }

      swiper.videos[index] = video;
      video.setAttribute('data-slide-index', index);
      video.pause();
      // Set the initial state: video is transparent, letting the poster show through.
      gsap.set(video, { opacity: 0 });
      
      if (poster) {
        swiper.posters[index] = poster;
      }
    }
  });

  // Add a paused flag for ScrollTrigger
  swiper.isPaused = false;
  
  setupActiveSlide(swiper);

  const checkVideoStates = () => { /* This function remains the same */ };
  swiper.videoStateInterval = setInterval(checkVideoStates, 2000);

  const originalDestroy = swiper.destroy;
  // MODIFIED: Override destroy to clean up HLS instances as well
  swiper.destroy = function(deleteInstance, cleanStyles) {
    clearInterval(swiper.videoStateInterval);
    if (swiper.videoTimeouts) {
      swiper.videoTimeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    }
    // NEW: Destroy all HLS instances to prevent memory leaks
    if (swiper.hlsInstances) {
        swiper.hlsInstances.forEach(hls => hls.destroy());
    }
    return originalDestroy.call(this, deleteInstance, cleanStyles);
  };

  return checkVideoStates;
};

// Setup active slide with delayed video playback (HLS Version)
const setupActiveSlide = (swiper) => {
  const realIndex = swiper.realIndex;
  if (!swiper || !swiper.slides[swiper.activeIndex] || swiper.isPaused) return;

  const video = swiper.videos[realIndex];

  // Set autoplay delay based on whether the active slide has a video.
  const newDelay = video ? 20000 : 10000;
  if (swiper.params.autoplay.delay !== newDelay) {
    swiper.params.autoplay.delay = newDelay;
    swiper.autoplay.stop();
  }

  // If there's no video on this slide, we're done.
  if (!video) {
    return;
  }
  
  if (swiper.videoTimeouts && swiper.videoTimeouts[realIndex]) {
    clearTimeout(swiper.videoTimeouts[realIndex]);
  }

  video.pause();

  // If an HLS instance already exists, just restart its loading.
  if (swiper.hlsInstances.has(video)) {
    const hls = swiper.hlsInstances.get(video);
    hls.startLoad();
  }
  // Otherwise, create a new HLS instance with optimized buffer settings.
  else if (Hls.isSupported()) {
    const source = video.querySelector('source');
    const hlsUrl = source ? source.dataset.hlsSrc : null;
    if (hlsUrl) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        startLevel: -1,
        // Limit buffer to 20s to conserve memory, since autoplay is 20s.
        maxBufferLength: 20,
        maxMaxBufferLength: 20,
        // Don't keep any buffer behind the playhead; not needed for this use case.
        backBufferLength: 0,
        // Set a hard memory cap of 20MB per video instance.
        maxBufferSize: 20 * 1000 * 1000,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      swiper.hlsInstances.set(video, hls);
    }
  }

  // After a 1-second delay, attempt to play the video.
  swiper.videoTimeouts[realIndex] = setTimeout(() => {
    // The play() method returns a promise. We chain the poster animation to it.
    video.play().then(() => {
      // Use requestAnimationFrame to sync the poster fade with the browser's
      // next paint cycle. This ensures the video frame is ready to be displayed.
      requestAnimationFrame(() => {
        // Fade the video IN, revealing it over the poster.
        gsap.to(video, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      });
    }).catch(() => {
      // If playback fails (e.g., browser blocks it), do nothing. The poster remains.
    });
  }, 1000); // 1 second delay
};

// Resets all non-active slides to their initial state.
const resetInactiveSlides = (swiper) => {
  if (!swiper || !swiper.videos || swiper.isPaused) {
    return;
  }
  
  // Pause videos and fade out for all slides that are not the active one.
  swiper.videos.forEach((video, index) => {
    if (!video || index === swiper.realIndex) return;
    
    if (swiper.videoTimeouts && swiper.videoTimeouts[index]) {
      clearTimeout(swiper.videoTimeouts[index]);
      swiper.videoTimeouts[index] = null;
    }
    
    try {
      video.pause();
      // Fade the video OUT to reveal the poster underneath.
      gsap.to(video, { opacity: 0, duration: 0.2, ease: "power2.out" });

      // Stop loading video data for inactive slides to save bandwidth.
      if (swiper.hlsInstances.has(video)) {
        swiper.hlsInstances.get(video).stopLoad();
      }
    } catch (e) {
      // Silent catch for any video errors.
    }
  });
};

// Simplified swiper initialization - enhanced callbacks handled by UniversalSwiperManager
const initializeSwiper = ({
  selector,
  comboClass,
  slidesPerView,
  breakpoints,
  parallax,
  speed,
  autoplay,
  pagination,
}) => {
  const swiperConfig = {
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
      init(swiper) {
        // Category-specific initialization logic
        if (comboClass === "is-cat-hero") {
          manageSlideVideos(swiper);
          adjustSwiperParallax();
          // Set up visibility-based play/pause
          ScrollTrigger.create({
            trigger: swiper.el,
            start: "top bottom",
            end: "bottom top",
            onLeave: () => {
              swiper.isPaused = true; // Set paused flag
              swiper.autoplay.stop();
              if (swiper.videos) {
                swiper.videos.forEach((video, index) => {
                  if (video) video.pause();
                  if (swiper.videoTimeouts && swiper.videoTimeouts[index]) {
                    clearTimeout(swiper.videoTimeouts[index]);
                  }
                });
              }
            },
            onEnterBack: () => {
              swiper.isPaused = false; // Unset paused flag
              swiper.autoplay.start();
              // When coming back into view, reset inactive slides and set up the active one.
              resetInactiveSlides(swiper);
              setupActiveSlide(swiper);
            },
          });
        }
      },
      // When a slide change starts, reset the slides that are no longer active.
      slideChange(swiper) {
        if (comboClass === "is-cat-hero") {
          resetInactiveSlides(swiper);
        }
      },
      // When the new slide has finished transitioning, set it up for playback.
      slideChangeTransitionEnd(swiper) {
        if (comboClass === "is-cat-hero") {
          setupActiveSlide(swiper);
          // Ensure autoplay continues after manual interaction
          if (swiper.autoplay && swiper.autoplay.paused) {
            swiper.autoplay.start();
          }
        }
      },
      // Ensure autoplay restarts with the correct (potentially updated) delay
      autoplayStop(swiper) {
        // MODIFIED: Only restart autoplay if it's NOT paused by the ScrollTrigger.
        if (comboClass === "is-cat-hero" && swiper.autoplay && !swiper.isPaused) {
          setTimeout(() => swiper.autoplay.start(), 50);
        }
      },
    },
  };
  
  // Only add pagination if it exists
  if (pagination) {
    swiperConfig.pagination = pagination;
  }
  
  const swiper = new Swiper(selector, swiperConfig);
  return swiper;
};

// Custom swiper manager for category page with special mobile hero handling
const createCategorySwiperManager = () => {
  // Ensure UniversalSwiperManager is available
  if (!window.UniversalSwiperManager) {
    return {
      manageSwipers: () => {},
      toggleButtonWrapper: () => {},
      resetButtonWrappers: () => {},
      setupResizeListener: () => {},
      swiperInstances: [],
      createInitializeSwiper: () => () => {}
    };
  }

  const config = {
    name: 'Category',
    swiperConfigs,
    initializeSwiper,
    desktopBreakpoint: 991,
    initDelay: 50,
    verificationDelay: 100
  };
  
  const baseManager = window.UniversalSwiperManager.createManager(config);

  // Override manageSwipers to handle special mobile hero logic
  const originalManageSwipers = baseManager.manageSwipers;
  
  const customManageSwipers = () => {
    const isSwiperEnabled = window.innerWidth > config.desktopBreakpoint;

    if (isSwiperEnabled) {
      // Use original logic for desktop
      originalManageSwipers();
    } else {
      // Custom mobile logic - keep hero swiper, destroy others
      baseManager.resetButtonWrappers();

      // Store the hero swiper if it exists before destroying others
      let heroSwiper = baseManager.swiperInstances.find(s => s.comboClass === "is-cat-hero");
      
      // Destroy all non-hero swipers
      for (let i = baseManager.swiperInstances.length - 1; i >= 0; i--) {
        const swiper = baseManager.swiperInstances[i];
        if (swiper.comboClass !== "is-cat-hero") {
          swiper.destroy(true, true);
          baseManager.swiperInstances.splice(i, 1);
        }
      }
      
      // If we didn't save a hero swiper, create one if needed
      if (!heroSwiper) {
        const heroConfig = swiperConfigs.find(configItem => configItem.comboClass === "is-cat-hero");
        if (heroConfig) {
          const heroContainer = document.querySelector(heroConfig.selector);
          if (heroContainer) {
            const slides = heroContainer.querySelectorAll(".swiper-slide");
            if (slides.length > 0) {
              const enhancedInitializer = baseManager.createInitializeSwiper(initializeSwiper);
              const newHeroSwiper = enhancedInitializer(heroConfig);
              baseManager.swiperInstances.push(newHeroSwiper);
            }
          }
        }
      }
    }
  };

  return {
    ...baseManager,
    manageSwipers: customManageSwipers,
    setupResizeListener: () => {
      const debouncedManageSwipers = Utils.debounce(() => {
        customManageSwipers();
      }, 200);
      
      window.addEventListener("resize", debouncedManageSwipers);
      
      customManageSwipers();
    }
  };
};

// Initialize the custom category swiper manager
let CategorySwiperManager;

// Function to initialize when UniversalSwiperManager is available
const initializeCategorySwiperManager = () => {
  if (window.UniversalSwiperManager) {
    CategorySwiperManager = createCategorySwiperManager();
    
    // Setup the swiper management system and run initial setup
    CategorySwiperManager.setupResizeListener();
    
    return true; // Successfully initialized
  }
  return false; // Not ready yet
};

// Try to initialize immediately
if (!initializeCategorySwiperManager()) {
  // If not available, wait for DOM content loaded and try again
  document.addEventListener('DOMContentLoaded', () => {
    if (!initializeCategorySwiperManager()) {
      // If still not available, wait a bit more
      setTimeout(() => {
        initializeCategorySwiperManager();
      }, 100);
    }
  });
}

// Run parallax adjustment right away
adjustSwiperParallax();

// Initialize cat-hero swiper immediately regardless of screen size
document.addEventListener("DOMContentLoaded", () => {
  // Run the parallax adjustment
  adjustSwiperParallax();
  
  // Wait for CategorySwiperManager to be available
  const ensureCategorySwiperManager = () => {
    if (CategorySwiperManager && CategorySwiperManager.swiperInstances) {
      // Ensure hero swiper is created if needed
      const heroExists = CategorySwiperManager.swiperInstances.some(s => s.comboClass === "is-cat-hero");
      
      if (!heroExists) {
        const heroConfig = swiperConfigs.find(config => config.comboClass === "is-cat-hero");
        if (heroConfig) {
          const heroContainer = document.querySelector(heroConfig.selector);
          if (heroContainer) {
            const slides = heroContainer.querySelectorAll(".swiper-slide");
            if (slides.length > 0) {
              const enhancedInitializer = CategorySwiperManager.createInitializeSwiper(initializeSwiper);
              const newHeroSwiper = enhancedInitializer(heroConfig);
              CategorySwiperManager.swiperInstances.push(newHeroSwiper);
            }
          }
        }
      }
    } else {
      // Try again after a short delay
      setTimeout(ensureCategorySwiperManager, 50);
    }
  };
  
  ensureCategorySwiperManager();
});

// Listen for resize events to adjust parallax values
window.addEventListener('resize', (typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
})(adjustSwiperParallax, 100));

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

// Swiper Module for category links
const CategoryLinkSwiperModule = (() => {
  let swiper;

  function initSwiper() {
    if (window.innerWidth >= 992) {
      if (!swiper) {
        swiper = new Swiper(".cat_link_list_wrap", {
          wrapperClass: "cat_link_list",
          slideClass: "cat_link_item",
          navigation: {
            nextEl: '[data-swiper-btn-cat="next"]',
            prevEl: '[data-swiper-btn-cat="prev"]',
            disabledClass: "cat_link_btn_wrap_disabled",
          },
          slidesPerView: "auto",
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          resistanceRatio: 0.85,
          freeMode: true,
          watchOverflow: true,
          on: {
            init: updateSwiperClasses,
            slideChange: updateSwiperClasses,
            reachEnd: updateSwiperClasses,
            reachBeginning: updateSwiperClasses,
            setTranslate: updateSwiperClasses,
          },
        });
      }
    } else {
      if (swiper) {
        swiper.destroy(true, true);
        swiper = undefined;
      }
    }
  }

  // Updates swiper container classes based on nav button states to control their visibility.
  function updateSwiperClasses() {
    const swiperContainer = document.querySelector(".cat_link_list_wrap");
    const nextButton = document.querySelector(
      '[data-swiper-btn-cat="next"]'
    );
    const prevButton = document.querySelector(
      '[data-swiper-btn-cat="prev"]'
    );

    if (!swiperContainer || !nextButton || !prevButton) return;

    swiperContainer.classList.remove("is-next", "is-both", "is-prev");

    const isNextDisabled = nextButton.classList.contains(
      "cat_link_btn_wrap_disabled"
    );
    const isPrevDisabled = prevButton.classList.contains(
      "cat_link_btn_wrap_disabled"
    );

    if (!isNextDisabled && !isPrevDisabled) {
      swiperContainer.classList.add("is-both");
    } else if (isNextDisabled && !isPrevDisabled) {
      swiperContainer.classList.add("is-prev");
    } else if (isPrevDisabled && !isNextDisabled) {
      swiperContainer.classList.add("is-next");
    }
  }

  window.addEventListener("load", initSwiper);
  
  const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };
  
  window.addEventListener("resize", debounceFn(initSwiper, 100));

  return {
    initSwiper,
    getSwiper: () => swiper,
  };
})();

// SET EXPERIENCE TEXT
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".link_cat-btn-thumb_subtext").forEach(function (subtextWrap) {
    const subtextElements = subtextWrap.querySelectorAll(".cat_link_subtext");
    const numberEl = subtextElements[0];
    const labelEl = subtextElements[1];

    if (numberEl && labelEl) {
      const count = parseInt(numberEl.textContent.trim(), 10);
      if (!isNaN(count)) {
        labelEl.innerHTML = count === 1 ? "&nbsp;experience" : "&nbsp;experiences";
      }
    }
  });
});

