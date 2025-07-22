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

window.addEventListener("resize", Utils.debounce(manageSwipers, 200));

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
  document.querySelectorAll("[data-highlight-toggle='true']").forEach((toggle) => {
    toggle.addEventListener("click", handleClick);
  });
}

function handleClick(event) {
  const card = this.closest('.card_highlight_wrap');
  if (!card) return;
  event.preventDefault();
  card.classList.toggle('is-active');
}

document.addEventListener("DOMContentLoaded", setCardHighlightListeners);

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

// SHARE BUTTON

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('shareBtn');
  const textElements = btn.querySelectorAll('.btn_default_text');
  const originalTexts = Array.from(textElements).map(el => el.textContent);

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
        textElements.forEach(el => el.textContent = 'Link copied');
        setTimeout(() => {
          textElements.forEach((el, index) => {
            el.textContent = originalTexts[index];
          });
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

document.addEventListener('DOMContentLoaded', () => {

  // Scope variables to be managed by init/destroy functions
  let expandTimeline, heroExpandWidth, expandBtn, hero, heroVidBg;
  let isInitialized = false;

  const toggleAnimation = () => {
    if (!isInitialized) return;

    // Toggle all necessary classes to manage state
    expandBtn.classList.toggle('is-alt');
    document.body.classList.toggle('no-scroll');
    hero.classList.toggle('u-modal-prevent-scroll');

    if (expandBtn.classList.contains('is-alt')) {
      // Animate forward
      gsap.to(expandTimeline, {
        progress: 1,
        duration: 0.7,
        ease: 'power2.out',
        onStart: () => {
          gsap.set(hero, { zIndex: 9999 });
          gsap.set(heroVidBg, { display: 'block' });
        }
      });
    } else {
      // Animate backward
      gsap.to(expandTimeline, {
        progress: 0,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(hero, { zIndex: 'auto' });
          gsap.set(heroVidBg, { display: 'none' });
        }
      });
    }
  };

  const init = () => {
    // Select elements
    expandBtn = document.querySelector('[data-video-control="expand"]');
    hero = document.querySelector('.exp_hero');
    heroVidBg = document.querySelector('.exp_hero_vid_bg');

    if (!expandBtn || !hero || !heroVidBg) return;

    // Perform initial calculation
    heroExpandWidth = gsap.getProperty(":root", "--exp-hero-expand-width");

    // Create the timeline
    expandTimeline = gsap.timeline({ paused: true })
      .to(hero, {
        width: () => heroExpandWidth, // Use a function to make it dynamic on each run
        '--hero-before-opacity': 1
      }, 0)
      .to(heroVidBg, { opacity: 1 }, 0);

    // Add event listeners
    expandBtn.addEventListener('click', toggleAnimation);
    heroVidBg.addEventListener('click', toggleAnimation);

    isInitialized = true;
  };

  const destroy = () => {
    if (!isInitialized) return;

    // Remove listeners to prevent memory leaks
    expandBtn.removeEventListener('click', toggleAnimation);
    heroVidBg.removeEventListener('click', toggleAnimation);

    // Completely stop and remove animations and reset styles
    gsap.killTweensOf(expandTimeline);
    expandTimeline.kill();
    // Remove all state-managing classes
    expandBtn.classList.remove('is-alt');
    document.body.classList.remove('no-scroll');
    hero.classList.remove('u-modal-prevent-scroll');
    // Set final resting state explicitly
    gsap.set(hero, {
      width: '100%',
      zIndex: 'auto',
      '--hero-before-opacity': 0
    });
    gsap.set(heroVidBg, { clearProps: 'display,opacity' });

    isInitialized = false;
  };

  const handleResize = () => {
    if (window.innerWidth >= 992) {
      if (!isInitialized) {
        init(); // Setup if entering desktop viewport
      } else {
        // If already initialized, just reset state and recalculate width
        gsap.killTweensOf(expandTimeline);
        expandTimeline.progress(0);
        // Remove classes during reset
        expandBtn.classList.remove('is-alt');
        document.body.classList.remove('no-scroll');
        hero.classList.remove('u-modal-prevent-scroll');
        // Set styles
        gsap.set(hero, { zIndex: 'auto', width: '100%' });
        gsap.set(heroVidBg, { display: 'none' });
        
        heroExpandWidth = gsap.getProperty(":root", "--exp-hero-expand-width");
      }
    } else {
      destroy(); // Teardown if leaving desktop viewport
    }
  };

  // --- Initial Setup ---
  
  // Run the check once on page load
  handleResize();

  // Add the debounced resize listener
  window.addEventListener('resize', Utils.debounce(handleResize, 250));

});


// Simplified Single Video Player for Experience Pages
const SingleHLSPlayer = {
  video: null,
  hls: null,
  controls: {},



  isDesktop: () => window.innerWidth >= 992,

  init(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    this.video = container.querySelector('video.exp_video');
    const source = container.querySelector('source.exp_vid_src');
    const poster = container.querySelector('img.exp_poster');

    if (!this.video || !source?.dataset.hlsSrc) return;

    // Set poster if available
    if (poster?.src) this.video.poster = poster.src;

    // Get control elements
    this.controls = {
      play: document.querySelector('[data-video-control="play"]'),
      sound: document.querySelector('[data-video-control="sound"]')
    };

    this.setupEventListeners();
    this.handleResize();
    
    window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 250));
  },

  setupEventListeners() {
    const { play, sound } = this.controls;
    
    if (play) {
      play.addEventListener('click', () => {
        this.video.paused ? this.playVideo() : this.pauseVideo();
      });
    }
    
    if (sound) {
      sound.addEventListener('click', () => {
        this.video.muted = !this.video.muted;
      });
    }

    // Update button states
    this.video.addEventListener('play', () => play?.classList.remove('is-alt'));
    this.video.addEventListener('pause', () => play?.classList.add('is-alt'));
    this.video.addEventListener('volumechange', () => {
      sound?.classList.toggle('is-alt', !this.video.muted);
    });

    // Set initial states
    play?.classList.add('is-alt');
    sound?.classList.toggle('is-alt', !this.video.muted);
  },

  handleResize() {
    const shouldBeActive = this.isDesktop();
    
    if (shouldBeActive && !this.hls) {
      this.startHLS();
    } else if (!shouldBeActive && this.hls) {
      this.stopHLS();
    }
  },

  startHLS() {
    if (!Hls.isSupported()) return;
    
    const source = this.video.querySelector('source.exp_vid_src');
    if (!source?.dataset.hlsSrc) return;

    this.hls = new Hls({
      capLevelToPlayerSize: true,
      startLevel: -1,
      maxBufferLength: 15
    });

    this.hls.loadSource(source.dataset.hlsSrc);
    this.hls.attachMedia(this.video);
    
    gsap.set(this.video, { opacity: 0 });
    
    // Auto-play after a short delay
    setTimeout(() => this.playVideo(), 1000);
  },

  stopHLS() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    this.video.pause();
    gsap.set(this.video, { opacity: 0 });
  },
  
  playVideo() {
    if (!this.video) return;

    this.video.play().then(() => {
      gsap.to(this.video, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }).catch(() => {
      // Silent error handling
    });
  },

  pauseVideo() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SingleHLSPlayer.init('.exp_media_wrap');
});