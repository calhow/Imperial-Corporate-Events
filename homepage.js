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

// Character-by-character text animation
const TextSplitAnimation = (() => {
  const homeText = document.querySelector('.home_text');
  if (!homeText) return;

  // Wait for DOM content to be loaded
  window.addEventListener('DOMContentLoaded', () => {
    // Create a SplitText instance
    const splitText = new SplitText(homeText, {
      type: "chars",
      charsClass: "split-char"
    });
    
    // Process split characters to add immediate parent classes only
    splitText.chars.forEach(char => {
      // Find the immediate parent of this character
      const immediateParent = char.parentNode;
      
      // If the immediate parent is a span with special classes, add those classes
      if (immediateParent && immediateParent.tagName === 'SPAN' && 
          (immediateParent.classList.contains('home_text_span') || 
           immediateParent.classList.contains('home_text_hover_span') ||
           immediateParent.classList.contains('home_line_span'))) {
        // Add classes from the immediate span parent
        immediateParent.className.split(' ').forEach(className => {
          if (className) char.classList.add(className);
        });
      } else {
        // If not in a special span, add the main container classes
        homeText.className.split(' ').forEach(className => {
          if (className) char.classList.add(className);
        });
      }
    });
    
    // Initial state - all characters invisible and shifted down
    gsap.set(splitText.chars, { 
      y: "1rem", 
      opacity: 0 ,
      willChange: "transform, opacity"
    });
    
    // Create animation to reveal characters
    gsap.timeline({
      scrollTrigger: {
        trigger: "[data-hero-wrap]",
        start: "bottom-=250px top",
        once: true
      },
      onComplete: () => {
        // After animation completes, revert the split text
        gsap.set(splitText.chars, { willChange: "auto" });
        splitText.revert();
      }
    }).to(splitText.chars, {
      y: "0rem",
      opacity: 1,
      stagger: 0.005,
      ease: "power2.out",
      duration: 0.5
    });
  });
})();

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