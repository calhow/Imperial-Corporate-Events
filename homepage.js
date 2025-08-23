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
      gsap.set(logos, { opacity: 0, y: '2rem', scale: 1, filter: 'blur(24px)' });
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

      const tl = gsap.timeline();
    
      // Animate OUT
      tl.to(currentLogo, {
          y: '-3rem',
          scale: 1.5,
          opacity: 0,
          filter: 'blur(24px)',
          duration: 0.6,
          ease: 'power2.in'
      });
    
      // Animate IN (with the .fromTo() fix)
      tl.fromTo(nextLogo, {
          y: '2rem',
          opacity: 0,
          filter: 'blur(24px)',
          scale: 1
      }, {
          y: '0rem',
          opacity: 0.72,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.6,
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
          masterTl.call(animateLogoItem, [item], index * 0.075);
      });
  }
  runFullSequence();

});