// Home Hero Swiper Module
const HomeHeroSwiperModule = (() => {
    let heroSwiper;
  
    function initHeroSwiper() {
      const swiperContainer = document.querySelector('.home_hero_swiper_wrap');
      if (!swiperContainer) return;
  
      // Only initialize swiper for viewport widths >= 992px
      if (window.innerWidth >= 992) {
        if (!heroSwiper) {
          heroSwiper = new Swiper('.home_hero_swiper_wrap .swiper.is-hero', {
            direction: 'vertical',
            loop: true,
            speed: 500,
            autoplay: {
              delay: 6000,
              disableOnInteraction: false
            },
            pagination: {
              el: '.swiper-pagination.is-hero',
              clickable: true,
              dynamicBullets: true,
            },
            grabCursor: true,
            mousewheel: false,
            on: {
              init: function() {
                swiperContainer.classList.add('is-initialized');
              }
            }
          });
        }
      } else if (heroSwiper) {
        // Destroy swiper if viewport is below 992px
        heroSwiper.destroy(true, true);
        heroSwiper = null;
        swiperContainer.classList.remove('is-initialized');
      }
    }
  
    // Use global Utils.debounce if available, fallback to local implementation
    const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };
  
    window.addEventListener('load', initHeroSwiper);
    window.addEventListener('resize', debounceFn(initHeroSwiper, 250));
  
    return {
      init: initHeroSwiper,
      getSwiper: () => heroSwiper
    };
  })();


  // Scroll button fade animation
const ScrollButtonFade = (() => {
    const scrollBtn = document.querySelector(".hero_scroll-btn_wrap");
    
    if (scrollBtn) {
      gsap.timeline({
        scrollTrigger: {
          trigger: ".hero_scroll-btn_wrap",
          start: "bottom-=24px bottom",
          end: "bottom top",
          scrub: true,
        }
      }).to(scrollBtn, {
        opacity: 0,
        ease: "none"
      });
    }
  })();


  // Parallax animations setup
const homeHeroWrap = document.querySelector("[data-hero-wrap]");

// Create variables but don't initialize them outside the media query
let homeHeroParallax;

// Enable parallax for devices above 479px
let parallaxMediaMatcher = gsap.matchMedia();
parallaxMediaMatcher.add("(min-width: 479px)", () => {
  // Initialize all parallax timelines inside the media query
  if (homeHeroWrap) {
    homeHeroParallax = gsap.timeline({
      scrollTrigger: {
        trigger: "[data-hero-wrap]",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
    homeHeroParallax.to([".hero_vid", ".hero_vid_poster"], { y: "20rem" });
  }
  
});


/**
 * HeroVideoManager (No Animation Version)
 * Manages the lazy-loading and playback of the primary hero video using HLS.js.
 * - Dependency: HLS.js
 */
const HeroVideoManager = (() => {
  // The CSS selector for the video element
  const VIDEO_SELECTOR = ".hero_vid";

  /**
   * Initializes the video manager.
   */
  const init = () => {
    // Ensure the HLS.js library is available
    if (typeof Hls === 'undefined') {
      console.error("HeroVideoManager requires HLS.js to be loaded.");
      return;
    }

    const videoElement = document.querySelector(VIDEO_SELECTOR);

    // If the video element doesn't exist, do nothing.
    if (!videoElement) {
      return;
    }

    const sourceElement = videoElement.querySelector('source.hero_vid_src');
    const hlsUrl = sourceElement ? sourceElement.dataset.hlsSrc : null;

    // If there's no HLS source URL, do nothing.
    if (!hlsUrl) {
      return;
    }

    // Check for HLS support in the browser
    if (Hls.isSupported()) {
      setupHlsPlayer(videoElement, hlsUrl);
    }
  };

  /**
   * Sets up and configures the HLS.js player for the video.
   * @param {HTMLVideoElement} videoElement - The video element to attach to.
   * @param {string} hlsUrl - The URL of the HLS manifest.
   */
  const setupHlsPlayer = (videoElement, hlsUrl) => {
    const hls = new Hls({
      // Start loading the video immediately in the background
      autoStartLoad: true,
    });

    // Load the HLS stream
    hls.loadSource(hlsUrl);

    // Attach HLS.js to the video element
    hls.attachMedia(videoElement);

    // When the HLS manifest has been parsed, the video is ready to play.
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Attempt to play the video.
      const playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was prevented by the browser.
          // This is a failsafe to prevent console errors.
          console.log("Hero video autoplay was prevented by the browser.");
        });
      }
    });
  };

  // Expose the init function to be called publicly
  return {
    init: init
  };
})();

// Wait for the DOM to be fully loaded before initializing the video manager.
document.addEventListener('DOMContentLoaded', HeroVideoManager.init);


// Initialize multiple review carousels with alternating directions
const reviewSwipers = [];
const reviewCarousels = document.querySelectorAll('.swiper.is-review-carousel');

reviewCarousels.forEach((carousel, index) => {
  // Define speeds for each carousel
  const speeds = [12000, 15000, 14000];
  const speed = speeds[index] || 12000; // Fallback to 10000 if more than 3 carousels
  
  const swiper = new Swiper(carousel, {
    speed: speed,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      reverseDirection: index === 1 // Second instance (index 1) goes in reverse
    },
    loop: true,
    allowTouchMove: false,
    slidesPerView: 'auto',
    freeMode: true,
  });
  
  reviewSwipers.push(swiper);
});


document.addEventListener('DOMContentLoaded', () => {

  // Select all the main logo containers
  const logoItems = gsap.utils.toArray('.logo_item');

  // ## 1. Initial State Setup ##
  logoItems.forEach((item, index) => {
      const logos = item.querySelectorAll('.logo_svg');
      item.dataset.currentIndex = 0;
      
      // Check if mobile (767px and down) to conditionally apply blur
      const isMobile = window.innerWidth <= 767;
      const blurFilter = isMobile ? 'blur(0px)' : 'blur(10px)';
      
      gsap.set(logos, { opacity: 0, y: '2rem', scale: 1, filter: blurFilter });
      if (logos.length > 0) {
          gsap.set(logos[0], { opacity: 0.72, y: '0rem', scale: 1, filter: 'blur(0px)' });
      }
  });

  // ## 2. The Animation Function for a Single Item ##
  function animateLogoItem(item) {
      const logos = item.querySelectorAll('.logo_svg');
      if (logos.length < 2) return;

      let currentIndex = parseInt(item.dataset.currentIndex);
      let nextIndex = (currentIndex + 1) % logos.length;
      item.dataset.currentIndex = nextIndex; // Update the index for the next run

      const currentLogo = logos[currentIndex];
      const nextLogo = logos[nextIndex];

      // Check if mobile (767px and down) to conditionally apply blur
      const isMobile = window.innerWidth <= 767;
      const blurOutFilter = isMobile ? 'blur(0px)' : 'blur(10px)';
      const blurInFilter = isMobile ? 'blur(0px)' : 'blur(10px)';

      const tl = gsap.timeline();
    
      // Animate OUT
      tl.to(currentLogo, {
          y: '-3rem',
          scale: 1.25,
          opacity: 0,
          filter: blurOutFilter,
          duration: 0.5,
          ease: 'power2.in'
      });
    
      // Animate IN (with the .fromTo() fix)
      tl.fromTo(nextLogo, {
          y: '2rem',
          opacity: 0,
          filter: blurInFilter,
          scale: 1
      }, {
          y: '0rem',
          opacity: 0.72,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.5,
          ease: 'power2.out'
      });
  }

  // ## 3. The Master Timeline & Recursive Loop ##
  function runFullSequence() {
      const masterTl = gsap.timeline({
          onComplete: () => {
              gsap.delayedCall(4, runFullSequence);
          }
      });

      logoItems.forEach((item, index) => {
          masterTl.call(animateLogoItem, [item], index * 0.05);
      });
  }
  runFullSequence();

});



document.addEventListener("DOMContentLoaded", () => {
  let mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
      
      // --- 🎬 ANIMATION 1: BACKSTAGE ---
      const trigger1 = document.querySelector(".home_text_hover_span.is-backstage");
      const tl1 = gsap.timeline({ paused: true });

      tl1.fromTo(".home_hover_img.is-1", { x: "-4rem", y: "4rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" })
         .fromTo(".home_hover_img.is-3", { x: "-4rem", y: "-4rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.075)
         .fromTo(".home_hover_img.is-2", { x: "4rem", y: "2rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.075);

      trigger1.addEventListener("mouseenter", () => {
          tl1.timeScale(1).play();
      });
      trigger1.addEventListener("mouseleave", () => {
          tl1.timeScale(2).reverse();
      });

      // --- 🎬 ANIMATION 2: MEMORIES ---
      const trigger2 = document.querySelector(".home_text_hover_span.is-memories");
      const tl2 = gsap.timeline({ paused: true });

      tl2.fromTo(".home_hover_img.is-6", { x: "-4rem", y: "2rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" })
         .fromTo(".home_hover_img.is-5", { x: "1rem", y: "-4rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.075)
         .fromTo(".home_hover_img.is-4", { x: "4rem", y: "4rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.15);

      trigger2.addEventListener("mouseenter", () => {
          tl2.timeScale(1).play();
      });
      trigger2.addEventListener("mouseleave", () => {
          tl2.timeScale(2).reverse();
      });

      // --- 🎬 ANIMATION 3: DREAM ---
      const trigger3 = document.querySelector(".home_text_hover_span.is-dream");
      const tl3 = gsap.timeline({ paused: true });

      tl3.fromTo(".home_hover_img.is-8", { x: "-4rem", y: "-3rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" })
         .fromTo(".home_hover_img.is-7", { x: "1rem", y: "4rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.075)
         .fromTo(".home_hover_img.is-9", { x: "4rem", y: "-2rem", opacity: 0, scale: 0.5 }, { x: "0rem", y: "0rem", opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.15);

      trigger3.addEventListener("mouseenter", () => {
          tl3.timeScale(1).play();
      });
      trigger3.addEventListener("mouseleave", () => {
          tl3.timeScale(2).reverse();
      });

      // Cleanup function for when the media query no longer matches
      return () => {
          tl1.kill();
          tl2.kill();
          tl3.kill(); // Add the new timeline to the cleanup
      };
  });
});


/**
 * @file Manages hover-to-play video functionality for '.home_trending_main_item' elements on desktop.
 * @summary This script uses HLS.js to stream video and GSAP for smooth fade animations.
 * It is optimized for performance by using event delegation and instance pooling.
 * The effect is only active on viewports 992px and wider.
 */
(() => {
  // Ensure required libraries are available before running.
  if (!window.Hls || !window.gsap) {
    return;
  }

  // --- Configuration & State ---
  const HLS_CONFIG = {
    capLevelToPlayerSize: true, // Optimizes quality for the player size.
    maxBufferLength: 10,       // Reduces memory usage.
  };
  const FADE_DURATION = 0.4;
  const PLAY_DELAY = 150; // Delay in ms before playing to avoid flashes on quick mouse-overs.
  const DESKTOP_BREAKPOINT = 992; // The min-width (in px) for this effect to be active.

  const hlsInstances = new Map();
  let isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

  // --- Core Functions ---

  const getHlsInstance = (video) => {
    if (hlsInstances.has(video)) {
      return hlsInstances.get(video);
    }

    const source = video.querySelector('source[data-hls-src]');
    const hlsSrc = source?.dataset.hlsSrc;

    if (!hlsSrc || !Hls.isSupported()) {
      return null;
    }

    const hls = new Hls(HLS_CONFIG);
    hls.loadSource(hlsSrc);
    hls.attachMedia(video);
    hlsInstances.set(video, hls);
    return hls;
  };

  const playVideo = (item) => {
    const video = item.querySelector('.exp_video');
    if (!video) return;

    item._playTimeout = setTimeout(() => {
      const hls = getHlsInstance(video);
      if (hls) {
        hls.startLoad();
      } else {
        return;
      }
      
      video.play().catch(() => { /* Silently handle play interruption errors */ });

      // Animate the video's opacity to 1 (visible).
      gsap.to(video, { opacity: 1, duration: FADE_DURATION, ease: "power2.out" });

    }, PLAY_DELAY);
  };

  const pauseVideo = (item) => {
    const video = item.querySelector('.exp_video');
    if (!video) return;

    if (item._playTimeout) {
      clearTimeout(item._playTimeout);
      item._playTimeout = null;
    }

    if (!video.paused) {
      video.pause();
    }
    
    // Animate the video's opacity to 0 (hidden).
    gsap.to(video, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
  };

  // --- Event Handlers (using Delegation) ---

  const handleMouseOver = (event) => {
    const item = event.target.closest('.home_trending_main_item');
    if (!item || item.contains(event.relatedTarget)) return;
    
    playVideo(item);
  };

  const handleMouseOut = (event) => {
    const item = event.target.closest('.home_trending_main_item');
    if (!item || item.contains(event.relatedTarget)) return;
    
    pauseVideo(item);
  };
  
  // --- Setup & Responsive Logic ---

  /**
   * Attaches or removes event listeners based on the current viewport width.
   * This function only handles changes on resize.
   */
  const manageEventListenersOnResize = () => {
    const isNowDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;

    if (isNowDesktop === isDesktop) return; // No change in state.
    
    isDesktop = isNowDesktop;

    if (isDesktop) {
      // Switched to desktop: add listeners.
      document.body.addEventListener('mouseover', handleMouseOver);
      document.body.addEventListener('mouseout', handleMouseOut);
    } else {
      // Switched to mobile: remove listeners and reset all videos.
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
      document.querySelectorAll('.home_trending_main_item').forEach(pauseVideo);
    }
  };
  
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  /**
   * Initializes the functionality.
   */
  const init = () => {
    document.querySelectorAll('.home_trending_main_item .exp_video').forEach(video => {
      gsap.set(video, { opacity: 0 });
    });
    
    // Directly attach listeners on initial load if we're on desktop.
    if (isDesktop) {
      document.body.addEventListener('mouseover', handleMouseOver);
      document.body.addEventListener('mouseout', handleMouseOut);
    }
    
    // Listen for resize events to dynamically add/remove the effect.
    window.addEventListener('resize', debounce(manageEventListenersOnResize, 250));
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* Teams animation */

gsap.set('.teams_item:nth-child(odd)', {
  y: '0rem',
});

gsap.set('.teams_item:nth-child(even)', {
  y: '-5rem',
});

gsap.to('.teams_item:nth-child(odd)', {
  y: '-5rem',
  ease: 'none',
  scrollTrigger: {
    trigger: '.teams_wrap',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});

gsap.to('.teams_item:nth-child(even)', {
  y: '0rem',
  ease: 'none',
  scrollTrigger: {
    trigger: '.teams_wrap',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});


/* Category link vertical Swiper */
document.addEventListener('DOMContentLoaded', function () {
  // Get the Swiper container element from the page
  const swiperContainer = document.querySelector('.category_wrap');

  // Initialize Swiper on that container
  const swiper = new Swiper(swiperContainer, {
    // --- Core Settings ---
    direction: 'vertical',
    loop: true,
    speed: 2000,
    allowTouchMove: false,
    slidesPerView: 'auto',
    freeMode: {
      enabled: true,
      momentum: false,
      sticky: false,
    },
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
    },
    // --- Smooth Transitions ---
    effect: 'slide',
    grabCursor: false,
    preventInteractionOnTransition: true,
    // --- Class Mappings ---
    wrapperClass: 'category_list',
    slideClass: 'category_item',
  });

  // 1. When the mouse enters the container, stop the autoplay
  swiperContainer.addEventListener('mouseenter', () => {
    swiper.autoplay.stop();
  });

  // 2. When the mouse leaves the container, start the autoplay again
  swiperContainer.addEventListener('mouseleave', () => {
    swiper.autoplay.start();
  });
});

/* Hero video modal */

// Home Modal Video Player for All Devices
const HomeModalVideoPlayer = {
  video: null,
  hls: null,
  modalGroup: 'home',
  isInitialized: false,
  hlsReady: false,
  shouldAutoPlay: false,

  init() {
    this.video = document.querySelector('[data-modal-group="home"] .exp_video');
    if (!this.video) return;

    const source = this.video.querySelector('source.exp_vid_src');
    if (!source?.dataset.hlsSrc) return;

    this.isInitialized = true;
    this.initializeHLS();
    this.setupEventListeners();
  },

  initializeHLS() {
    const source = this.video.querySelector('source.exp_vid_src');
    if (!source?.dataset.hlsSrc || !Hls.isSupported()) return;

    this.hls = new Hls({
      capLevelToPlayerSize: true,
      startLevel: -1,
      maxBufferLength: 15,
      maxMaxBufferLength: 15
    });

    this.hls.loadSource(source.dataset.hlsSrc);
    this.hls.attachMedia(this.video);
    
    gsap.set(this.video, { opacity: 0 });
    
    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.hlsReady = true;
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        this.pauseVideo();
      }
    });
  },

  setupEventListeners() {
    document.addEventListener('click', (event) => {
      const modalToggleBtn = event.target.closest("[data-modal-open], [data-modal-close]");
      if (!modalToggleBtn) return;

      const modalGroup = modalToggleBtn.getAttribute("data-modal-open") || 
                         modalToggleBtn.getAttribute("data-modal-close");
      
      if (modalGroup !== this.modalGroup) return;

      const isOpening = modalToggleBtn.hasAttribute("data-modal-open");
      
      if (isOpening) {
        this.shouldAutoPlay = true;
        setTimeout(() => this.playVideo(), 300);
      } else {
        this.shouldAutoPlay = false;
        this.pauseVideo();
      }
    });

    if (this.video) {
      this.video.addEventListener('pause', () => {
        if (this.shouldAutoPlay) {
          this.shouldAutoPlay = false;
        }
      });

      this.video.addEventListener('play', () => {
        if (!this.shouldAutoPlay && window.modalStates?.[this.modalGroup]) {
          this.shouldAutoPlay = true;
        }
      });
    }

    const checkModalState = () => {
      if (!window.modalStates) return;
      
      const isModalOpen = window.modalStates[this.modalGroup];
      const isVideoPlaying = this.video && !this.video.paused;
      
      if (isModalOpen && !isVideoPlaying && this.hlsReady && this.shouldAutoPlay) {
        this.playVideo();
      } else if (!isModalOpen && isVideoPlaying) {
        this.pauseVideo();
      }
    };

    setInterval(checkModalState, 500);
  },

  playVideo() {
    if (!this.video || !this.hlsReady) return;

    this.video.play().then(() => {
      gsap.to(this.video, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }).catch(() => {});
  },

  pauseVideo() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
    
    gsap.to(this.video, { opacity: 0, duration: 0.3, ease: 'power2.out' });
  },
};

// Team Modal Video Player
const TeamModalVideoPlayer = {
  video: null,
  hls: null,
  modalGroup: 'team',
  isInitialized: false,
  hlsReady: false,
  shouldAutoPlay: false,

  init() {
    this.video = document.querySelector('[data-modal-group="team"] .exp_video');
    if (!this.video) return;

    const source = this.video.querySelector('source.exp_vid_src');
    if (!source?.dataset.hlsSrc) return;

    this.isInitialized = true;
    this.initializeHLS();
    this.setupEventListeners();
  },

  initializeHLS() {
    const source = this.video.querySelector('source.exp_vid_src');
    if (!source?.dataset.hlsSrc || !Hls.isSupported()) return;

    this.hls = new Hls({
      capLevelToPlayerSize: true,
      startLevel: -1,
      maxBufferLength: 15,
      maxMaxBufferLength: 15
    });

    this.hls.loadSource(source.dataset.hlsSrc);
    this.hls.attachMedia(this.video);
    
    gsap.set(this.video, { opacity: 0 });
    
    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.hlsReady = true;
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        this.pauseVideo();
      }
    });
  },

  setupEventListeners() {
    document.addEventListener('click', (event) => {
      const modalToggleBtn = event.target.closest("[data-modal-open], [data-modal-close]");
      if (!modalToggleBtn) return;

      const modalGroup = modalToggleBtn.getAttribute("data-modal-open") || 
                         modalToggleBtn.getAttribute("data-modal-close");
      
      if (modalGroup !== this.modalGroup) return;

      const isOpening = modalToggleBtn.hasAttribute("data-modal-open");
      
      if (isOpening) {
        this.shouldAutoPlay = true;
        setTimeout(() => this.playVideo(), 300);
      } else {
        this.shouldAutoPlay = false;
        this.pauseVideo();
      }
    });

    if (this.video) {
      this.video.addEventListener('pause', () => {
        if (this.shouldAutoPlay) {
          this.shouldAutoPlay = false;
        }
      });

      this.video.addEventListener('play', () => {
        if (!this.shouldAutoPlay && window.modalStates?.[this.modalGroup]) {
          this.shouldAutoPlay = true;
        }
      });
    }

    const checkModalState = () => {
      if (!window.modalStates) return;
      
      const isModalOpen = window.modalStates[this.modalGroup];
      const isVideoPlaying = this.video && !this.video.paused;
      
      if (isModalOpen && !isVideoPlaying && this.hlsReady && this.shouldAutoPlay) {
        this.playVideo();
      } else if (!isModalOpen && isVideoPlaying) {
        this.pauseVideo();
      }
    };

    setInterval(checkModalState, 500);
  },

  playVideo() {
    if (!this.video || !this.hlsReady) return;

    this.video.play().then(() => {
      gsap.to(this.video, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }).catch(() => {});
  },

  pauseVideo() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
    
    gsap.to(this.video, { opacity: 0, duration: 0.3, ease: 'power2.out' });
  },
};

// Initialize video players when the page content is loaded
document.addEventListener('DOMContentLoaded', () => {
  HomeModalVideoPlayer.init();
  TeamModalVideoPlayer.init();
});


/* Calendar Swiper */

const thumbsSwiper = new Swiper('.home_cal_bg_wrap', {
  effect: 'fade',
  fadeEffect: {
    crossFade: true
  },
  allowTouchMove: false,
  wrapperClass: 'home_cal_bg_list',
  slideClass: 'home_cal_bg_item',
});

const swiper = new Swiper('.swiper.is-cal', {
  effect: 'coverflow',
  loop: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  spaceBetween: -80,
  freeMode: true,
  allowTouchMove: false,

  coverflowEffect: {
    rotate: 80,
    stretch: 0,
    depth: 240,
    modifier: 1,
    scale: 1.1,
    slideShadows: false,
  },

  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
  },

  thumbs: {
    swiper: thumbsSwiper,
  },
});


// About tabbed content

document.addEventListener("DOMContentLoaded", () => {
  // --- SELECTORS ---
  const tabs = Array.from(
    document.querySelectorAll('[data-home-element="tab"]')
  );
  const contents = Array.from(
    document.querySelectorAll('[data-home-element="content"]')
  );
  const contentWrap = document.querySelector(
    '[data-home-element="content-wrap"]'
  );
  const underlineFill = document.querySelector(".home_tab_underline_fill");

  // --- NEW: Accordion Selector ---
  const accordions = Array.from(document.querySelectorAll(".accordion_wrap"));

  if (!tabs.length || !underlineFill || !contentWrap) {
    console.warn("Home tabs: Missing required elements.");
    return;
  }

  // --- STATE AND MAPPING ---
  const contentMap = contents.reduce((map, content) => {
    map[content.getAttribute("data-home-group")] = content;
    return map;
  }, {});

  // --- UNDERLINE LOGIC ---

  const getAnimationDuration = () => {
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    return viewportWidth >= 992 ? 0.4 : 0.3;
  };

  const positionUnderline = (targetTab, animate = true) => {
    if (!targetTab) return;
    const tabWidth = targetTab.offsetWidth;
    const tabOffsetLeft = targetTab.offsetLeft;

    if (animate && typeof gsap !== "undefined") {
      gsap.to(underlineFill, {
        width: tabWidth,
        x: tabOffsetLeft,
        duration: getAnimationDuration(),
        ease: "power1.out",
      });
    } else {
      if (animate) {
        underlineFill.style.transition = `transform ${getAnimationDuration()}s ease-out, width ${getAnimationDuration()}s ease-out`;
      } else {
        underlineFill.style.transition = "none";
      }
      underlineFill.style.width = `${tabWidth}px`;
      underlineFill.style.transform = `translateX(${tabOffsetLeft}px)`;
    }
  };

  // --- CONTENT LOGIC ---

  function updateContentWrapHeight() {
    const activeContent = contentWrap.querySelector(
      '[data-home-element="content"].is-active'
    );
    if (activeContent) {
      // Use GSAP for a smooth height transition if available
      if (typeof gsap !== "undefined") {
        gsap.to(contentWrap, {
          height: activeContent.offsetHeight,
          duration: 0.3,
          ease: "power1.out"
        });
      } else {
        contentWrap.style.height = `${activeContent.offsetHeight}px`;
      }
    }
  }

  function updateActiveTab(selectedTab) {
    const selectedGroup = selectedTab.getAttribute("data-home-group");
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab === selectedTab);
    });
    positionUnderline(selectedTab, true);
    contents.forEach((content) => {
      const contentGroup = content.getAttribute("data-home-group");
      content.classList.toggle("is-active", contentGroup === selectedGroup);
    });
    updateContentWrapHeight();
  }

  // --- INITIALIZATION & EVENT LISTENERS ---

  const initializeTabs = () => {
    let activeTab = tabs.find(tab => tab.classList.contains('is-active')) || tabs[0];
    if (activeTab) {
      const activeGroup = activeTab.getAttribute("data-home-group");
      contents.forEach(content => {
          content.classList.remove('is-active');
      });
      if(contentMap[activeGroup]) {
          contentMap[activeGroup].classList.add('is-active');
      }
      positionUnderline(activeTab, false);
      // Set initial height without animation
      const activeContent = contentWrap.querySelector('[data-home-element="content"].is-active');
      if (activeContent) {
        contentWrap.style.height = `${activeContent.offsetHeight}px`;
      }
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => updateActiveTab(tab));
  });
  
  // --- NEW: ACCORDION HEIGHT ADJUSTMENT ---
  // Listen for clicks on any accordion
  if (accordions.length) {
    accordions.forEach(accordion => {
      accordion.addEventListener('click', () => {
        // We use a small timeout to wait for the accordion's open/close
        // animation to finish before we measure the new height.
        setTimeout(() => {
          updateContentWrapHeight();
        }, 300); // 300ms is a common transition duration
      });
    });
  }
  // --- END NEW CODE ---

  const debouncedResize = (() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const currentActiveTab = document.querySelector('[data-home-element="tab"].is-active');
        positionUnderline(currentActiveTab, false);
        updateContentWrapHeight();
      }, 150);
    };
  })();
  
  window.addEventListener("resize", debouncedResize);

  initializeTabs();
});


/* Subscribe section animation */
gsap.registerPlugin(ScrollTrigger);

const subscribeAnimation = () => {
  const subscribeWrap = document.querySelector('.subscribe_wrap');
  const heading1 = document.querySelector('.sub_heading.is-1');
  const heading2 = document.querySelector('.sub_heading.is-2');
  const componentWrap = document.querySelector('.subscribe_component_wrap');
  const catListWrap = document.querySelector('.cat_list_cta_wrap');
  
  if (!subscribeWrap || !heading1 || !heading2 || !componentWrap || !catListWrap) return;
  
  let mm = gsap.matchMedia();
  
  // Desktop animation (768px and up)
  mm.add("(min-width: 768px)", () => {
    // Set initial states for desktop
    gsap.set(heading1, { x: 220 });
    gsap.set(heading2, { x: -220 });
    gsap.set(componentWrap, { scaleX: 0 });
    gsap.set(catListWrap, { opacity: 0 });
    
    // Create timeline
    const tl = gsap.timeline({ paused: true });
    
    // Custom scroll trigger with manual visibility check
    ScrollTrigger.create({
      trigger: subscribeWrap,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const rect = subscribeWrap.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if element is fully in viewport
        const isFullyInView = rect.bottom <= windowHeight && rect.top >= 0;
        
        // Check if element is completely out of view
        const isCompletelyHidden = rect.bottom < 0 || rect.top > windowHeight;
        
        if (isFullyInView && tl.progress() === 0) {
          tl.play();
        } else if (isCompletelyHidden && tl.progress() > 0) {
          tl.reverse();
        }
      }
    });
    
    // Add desktop animations to timeline
    tl.to([heading1, heading2], {
      x: 0,
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(componentWrap, {
      scaleX: 1,
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(catListWrap, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
  
  // Mobile animation (767px and below)
  mm.add("(max-width: 767px)", () => {
    // Set initial states for mobile
    gsap.set(heading1, { y: 140 });
    gsap.set(heading2, { y: -140 });
    gsap.set(componentWrap, { scaleY: 0 });
    gsap.set(catListWrap, { opacity: 0 });
    
    // Create timeline
    const tl = gsap.timeline({ paused: true });
    
    // Custom scroll trigger with manual visibility check
    ScrollTrigger.create({
      trigger: subscribeWrap,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const rect = subscribeWrap.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if element is fully in viewport
        const isFullyInView = rect.bottom <= windowHeight && rect.top >= 0;
        
        // Check if element is completely out of view
        const isCompletelyHidden = rect.bottom < 0 || rect.top > windowHeight;
        
        if (isFullyInView && tl.progress() === 0) {
          tl.play();
        } else if (isCompletelyHidden && tl.progress() > 0) {
          tl.reverse();
        }
      }
    });
    
    // Add mobile animations to timeline
    tl.to([heading1, heading2], {
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(componentWrap, {
      scaleY: 1,
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(catListWrap, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
};

// Initialize subscribe animation
document.addEventListener('DOMContentLoaded', subscribeAnimation);

