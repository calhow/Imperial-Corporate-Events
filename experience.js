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
const ExpNavSwiperModule = (() => {
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
    
    const scrollHandler = Utils.debounce(() => {
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



  window.addEventListener("load", initSwiper);
  
  window.addEventListener("resize", Utils.debounce(initSwiper, 100));

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




