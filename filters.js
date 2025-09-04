// FINSWEET ATTRIBUTES V2 FILTER - SIMPLIFIED VERSION

// Initialize immediately without waiting for fsAttributes
(function() {
  'use strict';

  // State management
  let activeFilters = {};
  let isInitialized = false;
  let listInstances = [];


        
  // Get active filters from Finsweet's reactive state
  function getActiveFilters() {
    const filters = {};
    
    // Extract filters from all list instances
    listInstances.forEach(listInstance => {
      const finsweetFilters = listInstance.filters.value;
      
      // Process each filter group
      finsweetFilters.groups.forEach(group => {
        group.conditions.forEach(condition => {
          // Only include conditions that the user has interacted with
          if (!condition.interacted) return;
          
          const categoryLower = condition.fieldKey.toLowerCase();
          const values = Array.isArray(condition.value) ? condition.value : [condition.value];
          
          values.forEach(value => {
            if (value && value !== 'Radio' && value !== 'on' && value !== '') {
              if (!filters[categoryLower]) {
                filters[categoryLower] = [];
              }
              
              filters[categoryLower].push({
                originalValue: value,
                displayValue: categoryLower === "months" ? value.replace(/\s+\d{4}$/, "").trim() : value,
              });
            }
          });
        });
      });
    });
    
    return filters;
  }

  // Update active filter display
  function updateActiveFiltersDisplay() {
    activeFilters = getActiveFilters();
    
    const displayElements = document.querySelectorAll("[data-active-filters]");
    displayElements.forEach(element => {
      const filterGroup = element.getAttribute("data-active-filters").toLowerCase();
      const filterValues = activeFilters[filterGroup] || [];

      const activeFiltersText = filterValues.map(item => item.displayValue).join(", ");

      const defaultText = {
        area: "Anywhere",
        months: "Anytime", 
        category: "Anything",
      };

      const displayText = activeFiltersText || defaultText[filterGroup] || "";
      element.textContent = displayText;
      element.classList.toggle("is-active", filterValues.length > 0);
    });

    // Update clear buttons
    const clearButtons = document.querySelectorAll("[data-filter-clear]");
    clearButtons.forEach(button => {
      const filterGroup = button.getAttribute("data-filter-clear").toLowerCase();
      const hasActiveFilters = activeFilters[filterGroup] && activeFilters[filterGroup].length > 0;
      
      button.style.display = hasActiveFilters ? "flex" : "none";
    });

    // Update clear all button
    const clearAllButton = document.querySelector('[data-filter-clear-all="true"]');
    if (clearAllButton) {
      const hasAnyActiveFilters = ["area", "months", "category", "theme"].some(
        group => activeFilters[group] && activeFilters[group].length > 0
      );
      clearAllButton.classList.toggle("is-active", hasAnyActiveFilters);
    }

    // Update mobile clear wrap
    const mobileClearWrap = document.querySelector('[data-filter-mobile-clear-wrap]');
    if (mobileClearWrap) {
      const hasAnyActiveFilters = ["area", "months", "category"].some(
        group => activeFilters[group] && activeFilters[group].length > 0
      );
      const isMobile = window.innerWidth <= 991;
      const isFilterModalOpen = window.modalStates && window.modalStates['filter'];
      mobileClearWrap.style.display = (hasAnyActiveFilters && isMobile && !isFilterModalOpen) ? "flex" : "none";
    }
  }

        // Update underline position for theme tabs
  function updateUnderlinePosition() {
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      let checkedRadio = document.querySelector(".form_theme-radio_wrap input:checked");
      const fillElement = document.querySelector(".form_theme_underline_fill");
      
      // Fallback to first radio if none is checked
      if (!checkedRadio) {
        const firstRadioWrap = document.querySelector(".form_theme-radio_wrap:first-child");
        if (firstRadioWrap) {
          checkedRadio = firstRadioWrap.querySelector('input[type="radio"]');
        }
      }
      
      if (!checkedRadio || !fillElement) {
        return;
      }
      
      // Find the radio wrapper and underline element within it
      const radioWrap = checkedRadio.closest('.form_theme-radio_wrap');
      const targetUnderline = radioWrap.querySelector('.form_theme-tab_underline');
      
      if (!targetUnderline) {
        return;
      }
      
      // Force a reflow to ensure accurate measurements
      radioWrap.offsetHeight;
      
      // Get the width of the radio wrapper
      const radioWrapRect = radioWrap.getBoundingClientRect();
      const radioWrapWidth = radioWrapRect.width;
      
      // Ensure we have a valid width before proceeding
      if (radioWrapWidth <= 0) {
        setTimeout(() => updateUnderlinePosition(), 50);
        return;
      }
      
      // Use GSAP Flip for smooth animation if available
      if (typeof gsap !== 'undefined' && gsap.registerPlugin && typeof Flip !== 'undefined') {
        // Record the current state
        const state = Flip.getState(fillElement);
        
        // Make DOM changes - move element AND set target width
        targetUnderline.appendChild(fillElement);
        fillElement.style.width = `${radioWrapWidth}px`;
        
        // Use Flip to animate from previous state to current state
        Flip.from(state, {
          duration: window.innerWidth >= 992 ? 0.4 : 0.3,
          ease: "power1.out",
          absolute: true
        });
      } else if (typeof gsap !== 'undefined') {
        // Fallback GSAP animation without Flip
        gsap.set(fillElement, { clearProps: "all" });
        targetUnderline.appendChild(fillElement);
        fillElement.style.width = `${radioWrapWidth}px`;
      } else {
        // Fallback without GSAP
        fillElement.style.transform = '';
        fillElement.style.transition = 'width 0.3s ease';
        targetUnderline.appendChild(fillElement);
        fillElement.style.width = `${radioWrapWidth}px`;
      }
    });
  }

  // Setup reactive listeners using Finsweet's system
  function setupEventListeners() {
    // Setup reactive watching for filter changes
    listInstances.forEach(listInstance => {
      // Watch for filter changes and update display
      listInstance.effect(() => {
        // This runs whenever filters change
        updateActiveFiltersDisplay();
      });
    });

    // Theme radio changes for underline (keep as manual listener)
    document.addEventListener('change', (e) => {
      if (e.target.matches('.form_theme-radio_wrap input[type="radio"]')) {
        updateUnderlinePosition();
      }
    });

    // External clear all buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-filter-empty-clear-all="true"], [data-filter-mobile-clear-all="true"]') || 
          e.target.closest('[data-filter-empty-clear-all="true"], [data-filter-mobile-clear-all="true"]')) {
        
        const clearButton = document.querySelector('[fs-list-element="clear"][data-filter-clear-all="true"]');
        if (clearButton) {
          clearButton.click();
        }
      }
    });

    // Resize handler
    const resizeDebounce = typeof Utils !== 'undefined' ? Utils.debounce : function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
    
    window.addEventListener('resize', resizeDebounce(() => {
      updateActiveFiltersDisplay();
      updateUnderlinePosition();
    }, 100));
  }

  // Initialize filter row activation
  function setupFilterRows() {
    document.addEventListener('click', (e) => {
      const element = e.target.closest('[data-filter-row], [data-filter-button]');
      if (!element) return;

      const targetAttribute = element.getAttribute('data-filter-row') || element.getAttribute('data-filter-button');
      if (targetAttribute) {
        const activeRow = document.querySelector('[data-filter-row].is-active');
        if (activeRow) activeRow.classList.remove('is-active');

        const targetRow = document.querySelector(`[data-filter-row="${targetAttribute}"]`);
        if (targetRow) targetRow.classList.add('is-active');
      }
    });
  }

  // Updates swiper container classes based on nav button states to control their visibility
  function updateSwiperClasses() {
    const swiperContainer = document.querySelector(".form_theme-tab_wrap");
    const nextButton = document.querySelector(
      '[data-swiper-btn-filter="next"]'
    );
    const prevButton = document.querySelector(
      '[data-swiper-btn-filter="prev"]'
    );

    if (!swiperContainer || !nextButton || !prevButton) return;

    swiperContainer.classList.remove("is-next", "is-both", "is-prev");

    const isNextDisabled = nextButton.classList.contains(
      "theme_btn_wrap_disabled"
    );
    const isPrevDisabled = prevButton.classList.contains(
      "theme_btn_wrap_disabled"
    );

    if (!isNextDisabled && !isPrevDisabled) {
      swiperContainer.classList.add("is-both");
    } else if (isNextDisabled && !isPrevDisabled) {
      swiperContainer.classList.add("is-prev");
    } else if (isPrevDisabled && !isNextDisabled) {
      swiperContainer.classList.add("is-next");
    }
  }

  // Store swiper instance globally for navigation
  let themeSwiperInstance = null;

  // Navigate to the active theme tab (responsive: Swiper for desktop, scroll for mobile)
  function navigateToActiveTab() {
    // Find the active theme tab (checked radio button)
    const checkedRadio = document.querySelector('.form_theme-radio_wrap input:checked');
    if (!checkedRadio) {
      return;
    }

    const radioWrap = checkedRadio.closest('.form_theme-radio_wrap');
    const isMobile = window.innerWidth <= 992;

    if (isMobile) {
      // Mobile: Use scroll positioning to center the active tab
      const scrollContainer = document.querySelector('.form_theme-tab_list');
      
      if (!scrollContainer) {
        return;
      }

      // Get container and tab measurements
      const containerWidth = scrollContainer.clientWidth;
      const containerScrollWidth = scrollContainer.scrollWidth;
      const tabLeft = radioWrap.offsetLeft;
      const tabWidth = radioWrap.offsetWidth;
      
      // Calculate scroll position to center the tab
      const centerPosition = tabLeft + (tabWidth / 2) - (containerWidth / 2);
      const maxScrollPosition = containerScrollWidth - containerWidth;
      const scrollPosition = Math.max(0, Math.min(centerPosition, maxScrollPosition));
      
      // Use smooth scroll to center the active tab
      scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
    } else {
      // Desktop: Use Swiper navigation
      if (!themeSwiperInstance) {
        return;
      }

      // Find the slide index of the active tab
      const allSlides = document.querySelectorAll('.form_theme-tab_item');
      let activeSlideIndex = -1;

      allSlides.forEach((slide, index) => {
        if (slide.contains(radioWrap)) {
          activeSlideIndex = index;
        }
      });

      if (activeSlideIndex >= 0) {
        // Calculate target slide index with offset for better visibility
        let targetSlideIndex;
        
        if (activeSlideIndex === 0) {
          // If it's the first slide, stay at first slide
          targetSlideIndex = 0;
        } else if (activeSlideIndex === allSlides.length - 1) {
          // If it's the last slide, stay at last slide
          targetSlideIndex = activeSlideIndex;
        } else {
          // Navigate to the slide before the active one for better visibility
          targetSlideIndex = activeSlideIndex - 1;
        }
        
        // Use slideTo to navigate to the calculated target slide
        themeSwiperInstance.slideTo(targetSlideIndex, 300, false);
      }
    }
  }

  // Initialize swiper for theme filters using UniversalSwiperManager
  function setupSwiper() {
    if (typeof Swiper === 'undefined' || !window.UniversalSwiperManager) return;

    const swiperContainer = document.querySelector(".form_theme-tab_wrap");
    if (!swiperContainer) return;

    // Create swiper manager instance for theme filters
    const themeSwiperManager = window.UniversalSwiperManager.createManager({
      name: 'theme-filters',
      desktopBreakpoint: 991,
      buttonWrapperSelector: 'data-swiper-combo',
      swiperConfigs: [{
        selector: '.form_theme-tab_wrap',
        comboClass: 'theme-filter',
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
          init: function() {
            // Store the swiper instance globally
            themeSwiperInstance = this;
            updateSwiperClasses.call(this);
            // Update underline position after Swiper is fully initialized
            setTimeout(() => updateUnderlinePosition(), 100);
          },
          navigationNext: updateSwiperClasses,
          navigationPrev: updateSwiperClasses,
          transitionEnd: updateSwiperClasses,
          reachBeginning: updateSwiperClasses,
          reachEnd: updateSwiperClasses,
        }
      }],
      initializeSwiper: (config) => {
        return new Swiper(config.selector, config);
      }
    });

    // Initialize the manager
    themeSwiperManager.setupResizeListener();
  }

  // Add this function to inject empty facet styles after Finsweet initialization
  function injectEmptyFacetStyles() {
    // Check if styles already exist
    const existingStyles = document.querySelector('[data-empty-facet-styles="true"]');
    if (existingStyles) {
      return;
    }
    
    const styles = `
      .is-list-emptyfacet, .is-list-emptyfacet * {
        pointer-events: none !important;
        cursor: default !important;
      }

      .form_checkbox_row.is-active {
        cursor: default !important;	
      }

      .form_filters_item.is-list-emptyfacet, .form_theme-tab_item.is-list-emptyfacet {
        transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);  
        opacity: 0.3;
        filter: grayscale(1);
      }
    `;

    // Create and inject the style element
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-empty-facet-styles', 'true');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // Detect when Finsweet has finished initialization
  function waitForFinsweetInitialization() {
    return new Promise((resolve) => {
      // Initialize FinsweetAttributes if not already present
      window.FinsweetAttributes ||= [];
      
      // Push a callback to run when list attribute is loaded
      window.FinsweetAttributes.push([
        'list',
        async (finsweetListInstances) => {
          try {
            // Store list instances for reactive watching
            listInstances = finsweetListInstances;
            
            // Wait for all list instances to finish loading paginated items
            const paginationPromises = listInstances
              .map(listInstance => listInstance.loadingPaginatedItems)
              .filter(promise => promise); // Filter out undefined promises
            
            // Wait for all pagination promises to resolve
            await Promise.all(paginationPromises);
            
            // Inject empty facet styles once everything is ready
            injectEmptyFacetStyles();
            resolve();
          } catch (error) {
            // Inject styles anyway to prevent blocking
            injectEmptyFacetStyles();
            resolve();
          }
        },
      ]);
    });
  }

  // Initialize everything
  async function init() {
    if (isInitialized) return;
        
    // Check for required elements
    const listElement = document.querySelector('[fs-list-element="list"]');
    const filtersElement = document.querySelector('[fs-list-element="filters"]');
    
    if (!listElement || !filtersElement) {
      return;
    }
    
    // Setup immediate visual elements (no dependency on Finsweet)
    setupFilterRows();
    setupSwiper();
    
    // Wait for Finsweet initialization, then setup reactive functionality
    await waitForFinsweetInitialization();
    
    // Setup reactive functionality AFTER Finsweet is ready
    setupEventListeners();
    updateActiveFiltersDisplay();
    
    // Set initial underline position AFTER everything is ready
    setTimeout(() => updateUnderlinePosition(), 100);
    
    // Navigate swiper to active tab if one is set via URL parameters
    setTimeout(() => navigateToActiveTab(), 150);
    
    isInitialized = true;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


})();
