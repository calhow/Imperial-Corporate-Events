const swiperInstances = [];

// Utility debounce function
const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

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
    autoplay: {
      delay: 15000,
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
  // Store video elements and their associated poster elements for easier access
  swiper.videos = [];
  swiper.posters = [];
  swiper.videoTimeouts = [];
  
  // Find all videos and posters in slides
  swiper.slides.forEach((slide, index) => {
    const video = slide.querySelector('video');
    const poster = slide.querySelector('.cat_card_poster');
    
    if (video) {
      swiper.videos[index] = video;
      
      // Add data attributes to track slides
      video.setAttribute('data-slide-index', index);
      
      // Pause all videos initially
      video.pause();
      
      // Store poster if found
      if (poster) {
        swiper.posters[index] = poster;
        // Ensure poster is visible initially
        gsap.set(poster, { opacity: 1 });
      }
    }
  });
  
  // Setup active slide with delay
  setupActiveSlide(swiper, swiper.activeIndex);
  
  // Special handling to ensure videos are managed correctly
  const checkVideoStates = () => {
    if (!swiper || !swiper.videos) return;
    
    // Make sure inactive videos are paused and posters are visible
    swiper.videos.forEach((video, index) => {
      if (!video) return;
      
      if (index === swiper.activeIndex) {
        // Active slide is managed by handleSlideChange and setupActiveSlide
      } else {
        // For non-active slides, ensure video is paused and poster is visible
        if (!video.paused) {
          video.pause();
        }
        
        const poster = swiper.posters[index];
        if (poster && poster.style.opacity !== '1') {
          gsap.set(poster, { opacity: 1 });
        }
      }
    });
  };
  
  // Run periodically to ensure video states
  swiper.videoStateInterval = setInterval(checkVideoStates, 2000);
  
  // Store the original destroy method
  const originalDestroy = swiper.destroy;
  
  // Override destroy to clean up video management
  swiper.destroy = function(deleteInstance, cleanStyles) {
    clearInterval(swiper.videoStateInterval);
    
    // Clear any pending timeouts
    if (swiper.videoTimeouts) {
      swiper.videoTimeouts.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    }
    
    // Call original destroy
    return originalDestroy.call(this, deleteInstance, cleanStyles);
  };
  
  return checkVideoStates;
};

// Setup active slide with delayed video playback
const setupActiveSlide = (swiper, index) => {
  if (!swiper || !swiper.videos || !swiper.videos[index]) {
    return;
  }
  
  // Clear any existing timeout for this slide
  if (swiper.videoTimeouts && swiper.videoTimeouts[index]) {
    clearTimeout(swiper.videoTimeouts[index]);
  }
  
  const video = swiper.videos[index];
  const poster = swiper.posters[index];
  
  // Ensure video is initially paused
  video.pause();
  
  // Ensure poster is visible
  if (poster) {
    gsap.set(poster, { opacity: 1 });
  }
  
  // Set a timeout to play the video and fade out the poster after 3 seconds
  swiper.videoTimeouts[index] = setTimeout(() => {
    // Play the video
    video.play().then(() => {
      // Fade out the poster if it exists
      if (poster) {
        gsap.to(poster, {
          opacity: 0, 
          duration: 0.7, 
          ease: "power2.out"
        });
      }
    }).catch(() => {
      // Silent catch for autoplay policy errors
    });
  }, 3000); // 3 second delay
};

// Handle video on slide change
const handleSlideChange = (swiper) => {
  if (!swiper || !swiper.videos) {
    return;
  }
  
  // Handle inactive slides - immediately pause videos and fade in posters
  swiper.videos.forEach((video, index) => {
    if (!video) return;
    
    // Skip active index
    if (index === swiper.activeIndex) return;
    
    // Clear any pending timeouts for this slide
    if (swiper.videoTimeouts && swiper.videoTimeouts[index]) {
      clearTimeout(swiper.videoTimeouts[index]);
      swiper.videoTimeouts[index] = null;
    }
    
    try {
      video.pause();
      
      // Fade in poster if it exists
      const poster = swiper.posters[index];
      if (poster) {
        gsap.to(poster, {
          opacity: 1, 
          duration: 0.2, 
          ease: "power2.out"
        });
      }
    } catch (e) {
      // Silent catch for any video errors
    }
  });
  
  // Setup the new active slide with delayed video play
  setupActiveSlide(swiper, swiper.activeIndex);
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
  pagination,
}) => {
  // Pre-initialize the button wrapper before Swiper is created
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);
  if (btnWrap) {
    // Ensure it's visible during initialization
    btnWrap.style.display = "flex";
  }
  
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
      init() {
        // Toggle buttons based on actual Swiper state now that it's initialized
        toggleButtonWrapper(this);
        
        if (comboClass === "is-cat-hero") {
          const checkVideoStates = manageSlideVideos(this);
          
          // Save checker function for later
          this.checkVideoStates = checkVideoStates;
          
          // Adjust parallax values based on screen size
          adjustSwiperParallax();
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
      slideChangeTransitionStart() {
        // Also try running the video handling here
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
        }
      },
      slideChangeTransitionEnd() {
        // Make sure autoplay is running
        if (comboClass === "is-cat-hero" && this.autoplay && this.autoplay.paused) {
          this.autoplay.start();
        }
        
        // Double-check video handling at transition end
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
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
      afterInit() {
        // Also initialize video handling after complete init
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
          
          // Ensure parallax values are properly adjusted
          adjustSwiperParallax();
        }
      },
      activeIndexChange() {
        // Another place to catch slide changes
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
        }
      },
      touchEnd() {
        // Triggered when touch ends - good place to catch user interactions
        if (comboClass === "is-cat-hero") {
          handleSlideChange(this);
        }
      },
      // Add click handler for navigation buttons
      navigationNext() {
        if (comboClass === "is-cat-hero") {
          // Force handle slide change after a short delay to ensure Swiper has updated
          setTimeout(() => handleSlideChange(this), 50);
        }
      },
      navigationPrev() {
        if (comboClass === "is-cat-hero") {
          // Force handle slide change after a short delay to ensure Swiper has updated
          setTimeout(() => handleSlideChange(this), 50);
        }
      }
    },
  };
  
  // Only add pagination if it exists
  if (pagination) {
    swiperConfig.pagination = pagination;
  }
  
  const swiper = new Swiper(selector, swiperConfig);

  swiper.comboClass = comboClass;
  return swiper;
};

// Toggle visibility of navigation buttons based on swiper state
const toggleButtonWrapper = (swiper) => {
  if (!swiper || !swiper.comboClass) return;
  
  const { comboClass } = swiper;
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);
  
  if (!btnWrap) return;
  
  // Determine the correct display value
  const displayValue = swiper.isBeginning && swiper.isEnd ? "none" : "flex";
  
  // Only update if needed to avoid unnecessary repaints
  if (btnWrap.style.display !== displayValue) {
    btnWrap.style.display = displayValue;
  }
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
      // First reset all button wrappers to ensure clean state
      resetButtonWrappers();
      
      // Initialize all swipers
      swiperConfigs.forEach((config) => {
        const swiperContainer = document.querySelector(config.selector);
        if (swiperContainer) {
          const slides = swiperContainer.querySelectorAll(".swiper-slide");
          if (slides.length > 0) {
            const swiper = initializeSwiper(config);
            swiperInstances.push(swiper);
            
            // Explicitly toggle the button wrapper after Swiper is fully initialized
            if (swiper && swiper.initialized) {
              toggleButtonWrapper(swiper);
            }
          }
        }
      });
    } else {
      // Update existing swipers
      swiperInstances.forEach(swiper => {
        if (swiper) {
          toggleButtonWrapper(swiper);
        }
      });
    }
  } else {
    resetButtonWrappers();

    // Store the hero swiper if it exists before destroying
    let heroSwiper = swiperInstances.find(s => s.comboClass === "is-cat-hero");
    let heroConfig = null;
    
    // Destroy all non-hero swipers
    for (let i = swiperInstances.length - 1; i >= 0; i--) {
      const swiper = swiperInstances[i];
      if (swiper.comboClass !== "is-cat-hero") {
        swiper.destroy(true, true);
        swiperInstances.splice(i, 1);
      }
    }
    
    // If we didn't save a hero swiper, create one if needed
    if (!heroSwiper) {
      const heroConfig = swiperConfigs.find(config => config.comboClass === "is-cat-hero");
      if (heroConfig) {
        const heroContainer = document.querySelector(heroConfig.selector);
        if (heroContainer) {
          const slides = heroContainer.querySelectorAll(".swiper-slide");
          if (slides.length > 0) {
            const newHeroSwiper = initializeSwiper(heroConfig);
            swiperInstances.push(newHeroSwiper);
          }
        }
      }
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

// Run parallax adjustment right away
adjustSwiperParallax();

// Initialize on page load
manageSwipers();

// Initialize cat-hero swiper immediately regardless of screen size
document.addEventListener("DOMContentLoaded", () => {
  // If the hero swiper doesn't exist yet, create it
  const heroExists = swiperInstances.some(s => s.comboClass === "is-cat-hero");
  
  if (!heroExists) {
    const heroConfig = swiperConfigs.find(config => config.comboClass === "is-cat-hero");
    if (heroConfig) {
      const heroContainer = document.querySelector(heroConfig.selector);
      if (heroContainer) {
        const slides = heroContainer.querySelectorAll(".swiper-slide");
        if (slides.length > 0) {
          const newHeroSwiper = initializeSwiper(heroConfig);
          swiperInstances.push(newHeroSwiper);
          
          // Ensure button wrapper is correctly initialized
          if (newHeroSwiper && newHeroSwiper.initialized) {
            toggleButtonWrapper(newHeroSwiper);
          }
        }
      }
    }
  } else {
    // Update existing hero swiper's button wrapper
    const heroSwiper = swiperInstances.find(s => s.comboClass === "is-cat-hero");
    if (heroSwiper) {
      toggleButtonWrapper(heroSwiper);
    }
  }
  
  // Also update other swipers if they exist
  swiperInstances.forEach(swiper => {
    if (swiper && swiper.comboClass !== "is-cat-hero") {
      toggleButtonWrapper(swiper);
    }
  });
  
  // Run the parallax adjustment
  adjustSwiperParallax();
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
    // CategoryBackgroundManager.initialize(heroSwiperInstance);
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
    // CategoryBackgroundManager.refreshBackgrounds();
    
    // Adjust parallax values after everything is loaded
    adjustSwiperParallax();
    
    // Check again for hero swiper
    const heroSwiperInstance = swiperInstances.find(swiper => swiper.comboClass === "is-cat-hero");
    if (heroSwiperInstance) {
      // CategoryBackgroundManager.initialize(heroSwiperInstance);
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

// Also ensure button wrappers are properly initialized on full page load
window.addEventListener('load', () => {
  // Update all swiper button wrappers
  swiperInstances.forEach(swiper => {
    if (swiper && swiper.initialized) {
      toggleButtonWrapper(swiper);
    }
  });
});

// Swiper Module for category links
const SwiperModule = (() => {
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

    if (nextButton.classList.contains("cat_link_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-prev");
    } else if (prevButton.classList.contains("cat_link_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-next");
    } else {
      swiperContainer.classList.add("is-both");
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

// Initialize parallax adjustment on load
document.addEventListener('DOMContentLoaded', adjustSwiperParallax);

// Update on window resize with debounce
window.addEventListener('resize', (typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
})(adjustSwiperParallax, 100));


// SET EXPERIENCE TEXT

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".link_cat-btn-thumb_subtext").forEach(function (subtextWrap) {
    const numberEl = subtextWrap.querySelector(".cat_link_subtext.u-display-inline-block");
    const labelEl  = subtextWrap.querySelector(".cat_link_subtext:not(.u-display-inline-block)");

    if (numberEl && labelEl) {
      const count = parseInt(numberEl.textContent.trim(), 10);
      if (!isNaN(count)) {
        labelEl.innerHTML = count === 1 ? "&nbsp;experience" : "&nbsp;experiences";
      }
    }
  });
});

