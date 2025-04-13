// HOMEPAGE FILTER

// Swiper Module
const SwiperModule = (() => {
  let swiper;

  function initSwiper() {
    if (window.innerWidth >= 992) {
      if (!swiper) {
        swiper = new Swiper(".form_theme-tab_wrap", {
          wrapperClass: "form_theme-tab_list",
          slideClass: "form_theme-tab_item",
          navigation: {
            nextEl: '[data-swiper-btn-filter="next"]',
            prevEl: '[data-swiper-btn-filter="prev"]',
            disabledClass: "theme_btn_wrap_disabled",
          },
          slidesPerView: "auto",
          slidesPerGroup: 1,
          watchSlidesProgress: true, // Enhance performance by watching slide visibility
          resistanceRatio: 0.85, // Resistance when swiping past edge limits
          freeMode: true, // Allow slides to move freely instead of snapping
          watchOverflow: true, // Prevent issues when there aren't enough slides to scroll
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
    const swiperContainer = document.querySelector(".form_theme-tab_wrap");
    const nextButton = document.querySelector(
      '[data-swiper-btn-filter="next"]'
    );
    const prevButton = document.querySelector(
      '[data-swiper-btn-filter="prev"]'
    );

    swiperContainer.classList.remove("is-next", "is-both", "is-prev");

    if (nextButton.classList.contains("theme_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-prev");
    } else if (prevButton.classList.contains("theme_btn_wrap_disabled")) {
      swiperContainer.classList.add("is-next");
    } else {
      swiperContainer.classList.add("is-both");
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  window.addEventListener("load", initSwiper);
  window.addEventListener("resize", debounce(initSwiper, 100));

  return {
    initSwiper,
    getSwiper: () => swiper,
  };
})();

// Underline Module
const UnderlineModule = (() => {
  const fillElement = document.createElement("div");
  fillElement.classList.add("form_theme_underline_fill");
  document.body.appendChild(fillElement);

  const getAnimationDuration = () =>
    (window.innerWidth || document.documentElement.clientWidth) >= 992
      ? 0.4
      : 0.3;

  function updateUnderline(newActiveWrap) {
    const underline = newActiveWrap.querySelector(".form_theme-tab_underline");
    if (!underline) return;

    const state = Flip.getState(fillElement);
    underline.appendChild(fillElement);

    Flip.from(state, {
      duration: getAnimationDuration(),
      ease: "power1.out",
      absolute: true,
    });
  }

  // Event delegation for radio buttons
  document.addEventListener("click", (event) => {
    const radio = event.target.closest(".form_theme-radio_wrap");
    if (!radio) return;

    const currentActive = document.querySelector(
      ".form_theme-radio_wrap.is-active"
    );

    if (currentActive && currentActive !== radio) {
      currentActive.classList.remove("is-active");
    }

    radio.classList.add("is-active");
    updateUnderline(radio);
  });

  // Initialize the underline fill position on the first active item (if any)
  function initUnderlinePosition() {
    const initialActive = document.querySelector(
      ".form_theme-radio_wrap.is-active"
    );
    if (initialActive) {
      updateUnderline(initialActive);
    } else {
      // Initialize the underline fill position on the first child of .form_theme-tab_list
      const tabList = document.querySelector(".form_theme-tab_list");
      if (tabList) {
        const firstTab = tabList.firstElementChild;
        if (firstTab) {
          const underline = firstTab.querySelector(".form_theme-tab_underline");
          if (underline) {
            underline.appendChild(fillElement);
          }
        }
      }
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Update underline on window resize
  window.addEventListener(
    "resize",
    debounce(() => {
      const currentActive = document.querySelector(
        ".form_theme-radio_wrap.is-active"
      );
      if (currentActive) {
        updateUnderline(currentActive);
      }
    }, 100)
  );

  // Initialize the underline position on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", initUnderlinePosition);

  return {
    updateUnderline,
  };
})();

// Filter Module
const FilterModule = (() => {
  let activeFilters = {};
  let previousActiveFilters = {};

  function arraysEqual(a1, a2) {
    if (a1.length !== a2.length) return false;
    const sortedA1 = [...a1].sort();
    const sortedA2 = [...a2].sort();
    return sortedA1.every((value, index) => value === sortedA2[index]);
  }

  function updateActiveFilters(filterInstance) {
    activeFilters = {};

    filterInstance.filtersData.forEach((filter) => {
      const category = filter.originalFilterKeys[0].toLowerCase();

      if (!activeFilters[category]) {
        activeFilters[category] = [];
      }

      filter.values.forEach((value) => {
        activeFilters[category].push({
          originalValue: value,
          displayValue:
            category === "months"
              ? value.replace(/\s+\d{4}$/, "").trim()
              : value,
        });
      });
    });
  }

  function updateActiveFiltersDisplay(filtersElement) {
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    // Update text and classes for elements with data-active-filters within filtersElement
    filtersElement
      .querySelectorAll("[data-active-filters]")
      .forEach((element) => {
        const filterGroup = element
          .getAttribute("data-active-filters")
          .toLowerCase();
        const filterValues = activeFilters[filterGroup] || [];

        const activeFiltersText = filterValues
          .map((item) => item.displayValue)
          .join(", ");

        // Set default text if no active filters
        const defaultText = {
          area: "Anywhere",
          months: "Anytime",
          category: "Anything",
        };

        element.textContent =
          activeFiltersText || defaultText[filterGroup] || "";

        // Toggle .is-active class
        element.classList.toggle("is-active", filterValues.length > 0);
      });

    // Update visibility of individual clear buttons within filtersElement
    filtersElement.querySelectorAll("[data-filter-clear]").forEach((button) => {
      const filterGroup = button
        .getAttribute("data-filter-clear")
        .toLowerCase();
      const hasActiveFilters =
        activeFilters[filterGroup] && activeFilters[filterGroup].length > 0;

      // Check for [data-clear-filter-btn="true"] and device width
      const isClearFilterBtn =
        button.getAttribute("data-clear-filter-btn") === "true";

      if (isClearFilterBtn && viewportWidth <= 991) {
        // On devices 991px and down, always hide the button
        button.style.display = "none";
      } else {
        // On devices 992px and up, or if [data-clear-filter-btn] is not "true"
        button.style.display = hasActiveFilters ? "flex" : "none";
      }
    });

    // Update global clear-all button within filtersElement
    const clearAllButton = filtersElement.querySelector(
      '[data-filter-clear-all="true"]'
    );

    if (clearAllButton) {
      const hasAnyActiveFilters = ["area", "months", "category"].some(
        (group) => activeFilters[group] && activeFilters[group].length > 0
      );

      clearAllButton.classList.toggle("is-active", hasAnyActiveFilters);
    }
  }

  async function resetSelectedFilters(filterInstance, filtersElement) {
    const promises = [
      // Reset Area, Months, and Category filters
      filterInstance.resetFilters(["area"]),
      filterInstance.resetFilters(["months"]),
      filterInstance.resetFilters(["category"]),
    ];

    // Set Theme filter to "All Experiences" if not already set
    const themeFilter = filterInstance.filtersData.find(
      (filter) => filter.originalFilterKeys[0].toLowerCase() === "theme"
    );

    if (themeFilter) {
      const isAllExperiencesActive = themeFilter.values.has("All Experiences");

      if (!isAllExperiencesActive) {
        const allExperiencesElement = themeFilter.elements.find(
          (element) => element.value === "All Experiences"
        );

        if (allExperiencesElement) {
          allExperiencesElement.element.checked = true;
          // Add is-active class to the corresponding radio wrap
          const radioWrap = allExperiencesElement.element.closest(
            ".form_theme-radio_wrap"
          );
          if (radioWrap) {
            radioWrap.classList.add("is-active");
            // Remove is-active from other radio wraps
            document
              .querySelectorAll(".form_theme-radio_wrap.is-active")
              .forEach((wrap) => {
                if (wrap !== radioWrap) {
                  wrap.classList.remove("is-active");
                }
              });
            // Update the underline fill position
            UnderlineModule.updateUnderline(radioWrap);
          }

          // Update filter data and apply filters
          await filterInstance.storeFiltersData();
          await filterInstance.applyFilters();
        }
      } else {
        // If "All Experiences" is already active, ensure is-active class is set
        const allExperiencesElement = themeFilter.elements.find(
          (element) => element.value === "All Experiences"
        );
        if (allExperiencesElement) {
          const radioWrap = allExperiencesElement.element.closest(
            ".form_theme-radio_wrap"
          );
          if (radioWrap) {
            radioWrap.classList.add("is-active");
            UnderlineModule.updateUnderline(radioWrap);
          }
        }
      }
    }

    await Promise.all(promises);
    updateActiveFilters(filterInstance);
    updateActiveFiltersDisplay(filtersElement);

    // Adjust swiper or scroll position based on viewport width
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    if (viewportWidth >= 992) {
      // Devices 992px and above
      const swiper = SwiperModule.getSwiper();
      if (swiper) {
        swiper.slideTo(0);
      }
    } else {
      // Devices 991px and below
      const tabList = document.querySelector(".form_theme-tab_list");
      if (tabList) {
        tabList.scrollLeft = 0;
      }
    }
  }

  async function checkAndSetThemeToAllExperiences(
    filterInstance,
    filtersElement
  ) {
    const hasActiveFilters = ["area", "months", "category"].some(
      (group) => activeFilters[group] && activeFilters[group].length > 0
    );

    if (hasActiveFilters) {
      const themeFilter = filterInstance.filtersData.find(
        (filter) => filter.originalFilterKeys[0].toLowerCase() === "theme"
      );

      if (themeFilter) {
        const isAllExperiencesActive =
          themeFilter.values.has("All Experiences");

        if (!isAllExperiencesActive) {
          const allExperiencesElement = themeFilter.elements.find(
            (element) => element.value === "All Experiences"
          );

          if (allExperiencesElement) {
            allExperiencesElement.element.checked = true;
            // Add is-active class to the corresponding radio wrap
            const radioWrap = allExperiencesElement.element.closest(
              ".form_theme-radio_wrap"
            );
            if (radioWrap) {
              radioWrap.classList.add("is-active");
              // Remove is-active from other radio wraps
              document
                .querySelectorAll(".form_theme-radio_wrap.is-active")
                .forEach((wrap) => {
                  if (wrap !== radioWrap) {
                    wrap.classList.remove("is-active");
                  }
                });
              // Update the underline fill position
              UnderlineModule.updateUnderline(radioWrap);
            }

            await filterInstance.storeFiltersData();
            await filterInstance.applyFilters();
            updateActiveFilters(filterInstance);
            updateActiveFiltersDisplay(filtersElement);

            // Adjust swiper or scroll position based on viewport width
            const viewportWidth =
              window.innerWidth || document.documentElement.clientWidth;

            if (viewportWidth >= 992) {
              // Devices 992px and above
              const swiper = SwiperModule.getSwiper();
              if (swiper) {
                swiper.slideTo(0);
              }
            } else {
              // Devices 991px and below
              const tabList = document.querySelector(".form_theme-tab_list");
              if (tabList) {
                tabList.scrollLeft = 0;
              }
            }
          }
        }
      }
    }
  }

  function onFiltersUpdate(filterInstance, filtersElement) {
    // Store previous active filters for comparison
    const prevFilters = {};
    ["area", "months", "category"].forEach((group) => {
      prevFilters[group] = (previousActiveFilters[group] || []).map(
        (item) => item.originalValue
      );
    });

    updateActiveFilters(filterInstance);
    updateActiveFiltersDisplay(filtersElement);

    // Compare current and previous filters
    const filtersChanged = ["area", "months", "category"].some((group) => {
      const prevValues = prevFilters[group] || [];
      const currentValues = (activeFilters[group] || []).map(
        (item) => item.originalValue
      );
      return !arraysEqual(prevValues, currentValues);
    });

    if (filtersChanged) {
      checkAndSetThemeToAllExperiences(filterInstance, filtersElement);
    }

    // Update previousActiveFilters with current values
    previousActiveFilters = {};
    Object.keys(activeFilters).forEach((group) => {
      previousActiveFilters[group] = activeFilters[group].map((item) => ({
        ...item,
      }));
    });
  }

  function setupClearButtons(filterInstance, filtersElement) {
    const clearAllButton = filtersElement.querySelector(
      '[data-filter-clear-all="true"]'
    );
    if (clearAllButton) {
      clearAllButton.addEventListener("click", () =>
        resetSelectedFilters(filterInstance, filtersElement)
      );
    }
  }

  function init(filterInstances) {
    const targetFilterInstance = filterInstances.find((instance) => {
      const listElement = instance.listInstance.list;
      return (
        listElement &&
        listElement.getAttribute("fs-cmsfilter-element") === "list-2"
      );
    });

    if (!targetFilterInstance) {
      console.error(
        'Filter instance with [fs-cmsfilter-element="list-2"] not found.'
      );
      return;
    }

    const filtersElement = document.querySelector(
      '[fs-cmsfilter-element="filters-2"]'
    );
    if (!filtersElement) {
      console.error(
        'Filters element with [fs-cmsfilter-element="filters-2"] not found.'
      );
      return;
    }

    document.addEventListener("click", (event) => {
      const clearAllButton = event.target.closest(
        '[data-filter-empty-clear-all="true"]'
      );
      if (clearAllButton) {
        const existingClearAllButton = document.querySelector(
          '[data-filter-clear-all="true"]'
        );
        if (existingClearAllButton) {
          existingClearAllButton.click();
        }
      }
    });

    updateActiveFilters(targetFilterInstance);
    updateActiveFiltersDisplay(filtersElement);
    setupClearButtons(targetFilterInstance, filtersElement);

    targetFilterInstance.listInstance.on("renderitems", () => {
      onFiltersUpdate(targetFilterInstance, filtersElement);
    });

    // Debounce function
    function debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    window.addEventListener(
      "resize",
      debounce(() => {
        updateActiveFiltersDisplay(filtersElement);
      }, 100)
    );
  }

  return {
    init,
  };
})();

// Initialize FilterModule
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  "cmsfilter",
  (filterInstances) => {
    FilterModule.init(filterInstances);
  },
]);

// ScrollTrigger Module
const ScrollTriggerModule = (() => {
  const filterElement = document.querySelector(".filter_btn_contain");
  const filterHeight = filterElement ? filterElement.offsetHeight : 0;

  // Get the height of the navbar once
  const navbar = document.querySelector(".nav_main_contain");
  const navbarHeight = navbar ? navbar.offsetHeight : 0;

  // Handle media queries
  const mmSecond = gsap.matchMedia();

  // Navbar scroll-trigger animation for devices above 480px
  mmSecond.add("(min-width: 480px) and (max-width: 1215px)", () => {
    ScrollTrigger.create({
      trigger: ".page_main",
      start: `top+=${navbarHeight}px top`,
      onEnter: () => {
        gsap.to(".nav_main_contain", {
          yPercent: -100,
          duration: 0.7,
          ease: "power2.out",
        });
      },
      onLeaveBack: () => {
        gsap.to(".nav_main_contain", {
          yPercent: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      },
    });
  });

  // Navbar opacity change for screens 1215px and above
  mmSecond.add("(min-width: 1215px)", () => {
    ScrollTrigger.create({
      trigger: ".page_main",
      start: `top+=5px top`,
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
  });

  // HERO CONTENT OPACITY FADE
  // Create a media query for devices 992px and above
  const mediaQuery = window.matchMedia("(min-width: 992px)");

  let scrollHandler = null; // Variable to store the event listener reference

  // Function to run the scroll effect
  function scrollEffect() {
    const content = document.querySelector("[data-scroll-element='content']");
    const trigger = document.querySelector("[data-scroll-element='trigger']");

    if (!content || !trigger) return; // Prevent errors if elements are missing

    // Get bounding rectangles for both content and trigger
    const contentRect = content.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();

    // Adjust fade start by 120px above the original fadeStart position
    const fadeStart = contentRect.bottom + 150; // Start 150px before the original position
    const fadeEnd = contentRect.top + 100; // When fully faded (trigger reaches top of content)

    // Calculate the scroll progress based on the trigger's position relative to content
    let progress = (fadeStart - triggerRect.top) / (fadeStart - fadeEnd);
    progress = Math.min(Math.max(progress, 0), 1); // Clamp between 0 and 1

    // Apply opacity, which decreases as the trigger gets closer
    gsap.to(content, { opacity: 1 - progress, duration: 0.1, ease: "none" });

  }

  // Function to handle media query changes
  function handleMediaChange(e) {
    if (e.matches) {
      // Screen is 992px or above, add the event listener if not already added
      if (!scrollHandler) {
        scrollHandler = () => scrollEffect();
        window.addEventListener("scroll", scrollHandler);
      }
    } else {
      // Screen is below 992px, remove the event listener if it exists
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        scrollHandler = null;
      }
    }
  }

  // Run the media query check initially and also when the screen size changes
  mediaQuery.addEventListener("change", handleMediaChange);
  handleMediaChange(mediaQuery); // Initial check

  // Run the media query check initially and also when the screen size changes
  mediaQuery.addEventListener("change", handleMediaChange);
  handleMediaChange(mediaQuery); // Initial check

  // Theme sticky styling
  ScrollTrigger.create({
    trigger: ".theme_wrap",
    start: "top top",
    toggleActions: "play none reverse none",
    onEnter: () => gsap.set(".form_theme_underline", { opacity: 1 }),
    onLeaveBack: () => gsap.set(".form_theme_underline", { opacity: 0 }),
  });

  // ScrollTrigger for sticky filter nav
  const filterTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".filter_main_sticky",
      start: `top top+=${filterHeight}px`,
      end: "top top",
      scrub: true,
      toggleActions: "play none reverse none",
    },
  });

  filterTl.to(".filter_btn_contain", { top: "0rem", ease: "none" });
})();

// Scroll Anchor Module
const ScrollAnchorModule = (() => {
  document.addEventListener("DOMContentLoaded", () => {
    const filterElements = document.querySelectorAll(
      ".form_theme-radio_wrap, .form_filter-check_wrap"
    );

    function debounce(func, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }

    const handleFilterClick = debounce(function () {
      const target = document.getElementById("filter-section");
      if (!target) return;
      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY;
      if (Math.abs(window.scrollY - targetPosition) > 10) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    document.addEventListener("click", (event) => {
      const element = event.target.closest(
        ".form_theme-radio_wrap, .form_filter-check_wrap"
      );
      if (!element) return;
      handleFilterClick();
    });
  });
})();

// Filter Rows Module
const FilterRowsModule = (() => {
  function activateFilter(targetAttribute) {
    // Find the currently active row and remove 'is-active' class
    const activeRow = document.querySelector("[data-filter-row].is-active");
    if (activeRow) {
      activeRow.classList.remove("is-active");
    }

    // Add 'is-active' class to the matching [data-filter-row] element
    const targetRow = document.querySelector(
      `[data-filter-row="${targetAttribute}"]`
    );
    if (targetRow) {
      targetRow.classList.add("is-active");
    }
  }

  // Use event delegation to handle clicks on [data-filter-row] and [data-filter-button] elements
  document.addEventListener("click", (event) => {
    const element = event.target.closest(
      "[data-filter-row], [data-filter-button]"
    );
    if (!element) return;

    const targetAttribute =
      element.getAttribute("data-filter-row") ||
      element.getAttribute("data-filter-button");
    if (targetAttribute) {
      activateFilter(targetAttribute);
    }
  });
})();

// HANDLE CLEAR FILTER CLICKS OVER FILTER BTNS
document.querySelectorAll('[data-clear-filter-btn="true"]').forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

document.addEventListener("click", (event) => {
  const element = event.target.closest(
    "[data-filter-row], [data-filter-button]"
  );
});

// TOGGLE VISIBILITY ON RESULTS COUNT

const resultsCount = document.querySelector(
  '[fs-cmsfilter-element="results-count-2"]'
);
const filterCount = document.querySelector(".filter_main_list_count");
const pagination = document.querySelector(".filter_main_list_pagination");

if (resultsCount && filterCount && pagination) {
  const toggleVisibility = () => {
    const isHidden = resultsCount.textContent.trim() === "0";
    filterCount.classList.toggle("is-hidden", isHidden);
    pagination.classList.toggle("is-hidden", isHidden);
  };

  const observer = new MutationObserver(toggleVisibility);
  observer.observe(resultsCount, { childList: true });

  toggleVisibility();
}
