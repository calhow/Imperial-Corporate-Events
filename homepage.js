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
const homeHeroWrap = document.querySelector(".hero_home_wrap");

// Create variables but don't initialize them outside the media query
let homeHeroParallax;

// Enable parallax for devices above 479px
let parallaxMediaMatcher = gsap.matchMedia();
parallaxMediaMatcher.add("(min-width: 479px)", () => {
  // Initialize all parallax timelines inside the media query
  if (homeHeroWrap) {
    homeHeroParallax = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero_home_wrap",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
    homeHeroParallax.to(".hero_home_vid", { y: "20rem" });
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
        trigger: ".hero_home_wrap",
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

