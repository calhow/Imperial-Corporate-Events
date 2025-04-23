const swiperInstances = [];

const swiperConfigs = [
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

// Initialize Swiper instances with navigation and event handlers
const initializeSwiper = ({
  selector,
  comboClass,
  slidesPerView,
  breakpoints,
}) => {
  const swiper = new Swiper(selector, {
    speed: 400,
    slidesPerView,
    spaceBetween: 0,
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
            swiperInstances.push(initializeSwiper(config));
          }
        }
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

// Parallax animations setup
const catHeroImg = document.querySelector(".cat_hero_img");
const ctaContent = document.querySelector(".cta_bg_img");

// Create variables but don't initialize them outside the media query
let catHeroParallax;
let ctaParallax;

// Enable parallax for devices above 479px
let catMediaMatcher = gsap.matchMedia();
catMediaMatcher.add("(min-width: 479px)", () => {
  // Initialize all parallax timelines inside the media query
  
  if (catHeroImg) {
    catHeroParallax = gsap.timeline({
      scrollTrigger: {
        trigger: ".cat_hero_img",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
    catHeroParallax.to(".cat_hero_img", { y: "3rem" });
  }

  if (ctaContent) {
    ctaParallax = gsap.timeline({
      scrollTrigger: {
        trigger: ".cta_bg_img",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    ctaParallax.to(".cta_bg_img", { y: "6rem" });
  }
  
});