// HOMEPAGE FILTER

// Swiper Module for theme filters
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

// Underline animation for theme filters
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

  function initUnderlinePosition() {
    const initialActive = document.querySelector(
      ".form_theme-radio_wrap.is-active"
    );
    if (initialActive) {
      updateUnderline(initialActive);
    } else {
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

  const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  window.addEventListener(
    "resize",
    debounceFn(() => {
      const currentActive = document.querySelector(
        ".form_theme-radio_wrap.is-active"
      );
      if (currentActive) {
        updateUnderline(currentActive);
      }
    }, 100)
  );

  document.addEventListener("DOMContentLoaded", initUnderlinePosition);

  return {
    updateUnderline,
  };
})();

// Filter Module for managing active filters and their display
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

        const defaultText = {
          area: "Anywhere",
          months: "Anytime",
          category: "Anything",
        };

        element.textContent =
          activeFiltersText || defaultText[filterGroup] || "";

        element.classList.toggle("is-active", filterValues.length > 0);
      });

    filtersElement.querySelectorAll("[data-filter-clear]").forEach((button) => {
      const filterGroup = button
        .getAttribute("data-filter-clear")
        .toLowerCase();
      const hasActiveFilters =
        activeFilters[filterGroup] && activeFilters[filterGroup].length > 0;

      const isClearFilterBtn =
        button.getAttribute("data-clear-filter-btn") === "true";

      if (isClearFilterBtn && viewportWidth <= 991) {
        button.style.display = "none";
      } else {
        button.style.display = hasActiveFilters ? "flex" : "none";
      }
    });

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
      filterInstance.resetFilters(["area"]),
      filterInstance.resetFilters(["months"]),
      filterInstance.resetFilters(["category"]),
    ];

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
          const radioWrap = allExperiencesElement.element.closest(
            ".form_theme-radio_wrap"
          );
          if (radioWrap) {
            radioWrap.classList.add("is-active");
            document
              .querySelectorAll(".form_theme-radio_wrap.is-active")
              .forEach((wrap) => {
                if (wrap !== radioWrap) {
                  wrap.classList.remove("is-active");
                }
              });
            UnderlineModule.updateUnderline(radioWrap);
          }

          await filterInstance.storeFiltersData();
          await filterInstance.applyFilters();
        }
      } else {
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

    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    if (viewportWidth >= 992) {
      const swiper = SwiperModule.getSwiper();
      if (swiper) {
        swiper.slideTo(0);
      }
    } else {
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
            const radioWrap = allExperiencesElement.element.closest(
              ".form_theme-radio_wrap"
            );
            if (radioWrap) {
              radioWrap.classList.add("is-active");
              document
                .querySelectorAll(".form_theme-radio_wrap.is-active")
                .forEach((wrap) => {
                  if (wrap !== radioWrap) {
                    wrap.classList.remove("is-active");
                  }
                });
              UnderlineModule.updateUnderline(radioWrap);
            }

            await filterInstance.storeFiltersData();
            await filterInstance.applyFilters();
            updateActiveFilters(filterInstance);
            updateActiveFiltersDisplay(filtersElement);

            const viewportWidth =
              window.innerWidth || document.documentElement.clientWidth;

            if (viewportWidth >= 992) {
              const swiper = SwiperModule.getSwiper();
              if (swiper) {
                swiper.slideTo(0);
              }
            } else {
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
    const prevFilters = {};
    ["area", "months", "category"].forEach((group) => {
      prevFilters[group] = (previousActiveFilters[group] || []).map(
        (item) => item.originalValue
      );
    });

    updateActiveFilters(filterInstance);
    updateActiveFiltersDisplay(filtersElement);

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

    const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    };

    window.addEventListener(
      "resize",
      debounceFn(() => {
        updateActiveFiltersDisplay(filtersElement);
      }, 100)
    );
  }

  return {
    init,
  };
})();

// Initialize FilterModule with the filter instances
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  "cmsfilter",
  (filterInstances) => {
    FilterModule.init(filterInstances);
  },
]);

// ScrollTrigger Module for handling scroll-based effects
const ScrollTriggerModule = (() => {
  const filterElement = document.querySelector(".filter_btn_contain");
  const filterHeight = filterElement ? filterElement.offsetHeight : 0;

  // Use the global NavScrollTrigger if available
  if (typeof window.NavScrollTrigger === 'undefined') {
    // If global module isn't available, implement locally
    const navbar = document.querySelector(".nav_main_contain");
    const navbarHeight = navbar ? navbar.offsetHeight : 0;

    const mmSecond = gsap.matchMedia();

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
  }

  // Hero content opacity fade effect
  const mediaQuery = window.matchMedia("(min-width: 992px)");
  let scrollHandler = null;


  function handleMediaChange(e) {
    if (e.matches) {
      if (!scrollHandler) {
        scrollHandler = () => scrollEffect();
        window.addEventListener("scroll", scrollHandler);
      }
    } else {
      if (scrollHandler) {
        window.removeEventListener("scroll", scrollHandler);
        scrollHandler = null;
      }
    }
  }

  mediaQuery.addEventListener("change", handleMediaChange);
  handleMediaChange(mediaQuery);

  // Theme sticky styling
  ScrollTrigger.create({
    trigger: "#filter-section",
    start: "top +1px",
    toggleActions: "play none reverse none",
    onEnter: () => {
      gsap.set(".form_theme_underline", { opacity: 1 });
      gsap.to(".filter_main_blur", { opacity: 1, duration: 0.7, ease: "power4.out" });
    },
    onLeaveBack: () => {
      gsap.set(".form_theme_underline", { opacity: 0 });
      gsap.to(".filter_main_blur", { opacity: 0, duration: 0.5, ease: "power4.out" });
    },
  });

  // Theme wrap max-width animation
  ScrollTrigger.create({
    trigger: "#filter-section",
    start: "top +1px",
    toggleActions: "play none reverse none",
    onEnter: () => {
      gsap.to(".form_theme_wrap", { 
        maxWidth: "100%", 
        duration: 0.7, 
        ease: "power4.out" 
      });
    },
    onLeaveBack: () => {
      gsap.to(".form_theme_wrap", { 
        maxWidth: "48rem", 
        duration: 0.5, 
        ease: "power4.out" 
      });
    },
  });

})();

// Handle filter section scrolling
const ScrollAnchorModule = (() => {
  document.addEventListener("DOMContentLoaded", () => {
    const filterElements = document.querySelectorAll(
      ".form_theme-radio_wrap, .form_filter-check_wrap"
    );

    const debounceFn = typeof Utils !== 'undefined' ? Utils.debounce : function(func, delay) {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    };

    const handleFilterClick = debounceFn(function() {
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

// Handle filter row activation
const FilterRowsModule = (() => {
  function activateFilter(targetAttribute) {
    const activeRow = document.querySelector("[data-filter-row].is-active");
    if (activeRow) {
      activeRow.classList.remove("is-active");
    }

    const targetRow = document.querySelector(
      `[data-filter-row="${targetAttribute}"]`
    );
    if (targetRow) {
      targetRow.classList.add("is-active");
    }
  }

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

// Prevent click propagation on clear filter buttons
document.querySelectorAll('[data-clear-filter-btn="true"]').forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

// Toggle visibility based on results count
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
