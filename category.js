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

// Function to initialize Swiper
const initializeSwiper = ({
  selector,
  comboClass,
  slidesPerView,
  breakpoints,
}) => {
  const swiper = new Swiper(selector, {
    speed: 400,
    slidesPerView, // Default slidesPerView
    spaceBetween: 0,
    navigation: {
      nextEl: `[data-swiper-button-next="${comboClass}"]`,
      prevEl: `[data-swiper-button-prev="${comboClass}"]`,
    },
    breakpoints, // Apply breakpoints here
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

// Function to toggle Swiper visibility
const toggleButtonWrapper = (swiper) => {
  const { comboClass } = swiper;
  const btnWrap = document.querySelector(`[data-swiper-combo="${comboClass}"]`);

  if (!btnWrap) return; // Safeguard for missing elements
  btnWrap.style.display = swiper.isBeginning && swiper.isEnd ? "none" : "flex";
};

// Function to reset button wrappers to default value
const resetButtonWrappers = () => {
  const buttonWrappers = document.querySelectorAll("[data-swiper-combo]");
  buttonWrappers.forEach((btnWrap) => {
    btnWrap.style.display = "none";
  });
};

// Function to manage Swiper initialization/destroying
const manageSwipers = () => {
  const isSwiperEnabled = window.innerWidth > 991;

  if (isSwiperEnabled) {
    if (swiperInstances.length === 0) {
      swiperConfigs.forEach((config) => {
        const swiperContainer = document.querySelector(config.selector);
        if (swiperContainer) {
          // Check if the container has any slides
          const slides = swiperContainer.querySelectorAll(".swiper-slide");
          if (slides.length > 0) {
            swiperInstances.push(initializeSwiper(config));
          }
        }
      });
    }
  } else {
    // Reset button wrappers to default state for smaller devices
    resetButtonWrappers();

    while (swiperInstances.length > 0) {
      const swiper = swiperInstances.pop();
      swiper.destroy(true, true);
    }
  }
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Attach listener to window resize
window.addEventListener("resize", debounce(manageSwipers, 200));

// Run on page load
manageSwipers();

// CATEGORY TAB FLIP
// Select all tab wrap elements and initialize the underline fill element
const tabWraps = document.querySelectorAll(".cat_tab");
let fillElement = document.createElement("div");
fillElement.classList.add("cat_tab_underline_fill");
document.body.appendChild(fillElement); // Append it temporarily

// Function to get the animation duration based on device width
const getAnimationDuration = () => {
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  return viewportWidth >= 992 ? 0.4 : 0.3; // 0.4s for 992px and above, 0.3s for 991px and below
};

// Update the position of the underline fill element
const updateUnderline = (newActiveTab) => {
  // Get the underline inside the active tab
  const underline = newActiveTab.querySelector(".cat_tab_underline");
  if (!underline) return;

  // Calculate the state before the move
  const state = Flip.getState(fillElement);

  // Move the fill element to the new underline
  underline.appendChild(fillElement);

  // Apply the Flip animation
  Flip.from(state, {
    duration: getAnimationDuration(), // Set duration dynamically
    ease: "power1.out",
    absolute: true,
  });
};

// Handle click events for updating active class
tabWraps.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Find the currently active element
    const currentActive = document.querySelector(".cat_tab.is-active");

    // Remove the active class from the current element
    if (currentActive && currentActive !== tab) {
      currentActive.classList.remove("is-active");
    }

    // Add the active class to the clicked element
    tab.classList.add("is-active");

    // Update the underline fill position
    updateUnderline(tab);
  });
});

// Initialize the underline fill position on the first child of .cat_tab_wrap
const tabList = document.querySelector(".cat_tab_wrap");
if (tabList) {
  const firstTab = tabList.firstElementChild; // Get the first child
  if (firstTab) {
    const underline = firstTab.querySelector(".cat_tab_underline");
    if (underline) {
      // Move the fill element to the initial position
      underline.appendChild(fillElement);
    }
  }
}

// Initialize the underline fill position on the first active item (if any)
const initialActive = document.querySelector(".cat_tab.is-active");
if (initialActive) {
  updateUnderline(initialActive);
}

// Re-evaluate duration on window resize
window.addEventListener("resize", () => {
  // Update underline for the currently active element to reflect duration changes
  const currentActive = document.querySelector(".cat_tab.is-active");
  if (currentActive) {
    updateUnderline(currentActive);
  }
});

// CATEGORY LINK TABS
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

  // Map data-cat-group to content elements for quick access
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

    // Update tabs
    tabs.forEach((tab) =>
      tab.classList.toggle("is-active", tab === selectedTab)
    );

    // Update contents
    contents.forEach((content) => content.classList.remove("is-active"));
    const activeContent = contentMap[selectedGroup];
    if (activeContent) activeContent.classList.add("is-active");

    // Update content-wrap height
    updateContentWrapHeight();
  }

  // Initialize first tab and content as active on page load
  if (tabs.length) {
    updateActiveTab(tabs[0]);
  }

  // Add click event listener to each tab
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => updateActiveTab(tab))
  );

  // Debounce function to optimize resize event handling
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateContentWrapHeight, 100);
  });
});

// HIDE SORT, PAGINATION & COUNT IF LESS THAN OR EQUAL TO 3 EXPERIENCES

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

// NAVEBAR LINK ANIMATION ON SCROLL

// ScrollTrigger Module
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
      // Cleanup function (optional, for when matchMedia conditions change)
    };
  });

  return {}; // Ensure the module returns an object if needed
})();
