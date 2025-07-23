// FINSWEET ATTRIBUTES V2 FILTER - SIMPLIFIED VERSION

// Initialize immediately without waiting for fsAttributes
(function() {
  'use strict';

  // State management
  let activeFilters = {};
  let isInitialized = false;


        
  // Get active filters from DOM
  function getActiveFilters() {
    const filters = {};
    
    // Get all filter fields
    const filterFields = document.querySelectorAll('[fs-list-field]');
    
    filterFields.forEach(field => {
      const category = field.getAttribute('fs-list-field');
      if (!category) return;
      
      const categoryLower = category.toLowerCase();
        let value = null;
        
      if (field.type === 'checkbox' && field.checked) {
        value = field.getAttribute('fs-list-value') || field.value;
      } else if (field.type === 'radio' && field.checked) {
        value = field.getAttribute('fs-list-value') || field.value;
      } else if (field.tagName === 'SELECT' && field.selectedIndex > 0) {
        value = field.value;
      } else if (field.type === 'text' && field.value.trim()) {
        value = field.value.trim();
        }
        
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
     let checkedRadio = document.querySelector(".form_theme-radio_wrap input:checked");
     const fillElement = document.querySelector(".form_theme_underline_fill");
     
     // Fallback to first radio if none is checked
     if (!checkedRadio) {
       const firstRadioWrap = document.querySelector(".form_theme-radio_wrap:first-child");
       if (firstRadioWrap) {
         checkedRadio = firstRadioWrap.querySelector('input[type="radio"]');
       }
     }
     
     if (checkedRadio && fillElement) {
       // Find the radio wrapper and underline element within it
       const radioWrap = checkedRadio.closest('.form_theme-radio_wrap');
       const targetUnderline = radioWrap.querySelector('.form_theme-tab_underline');
       if (!targetUnderline) return;
       
       // Get the width of the radio wrapper
       const radioWrapWidth = radioWrap.offsetWidth;
       
       // Use GSAP Flip for smooth animation if available
       if (typeof gsap !== 'undefined' && gsap.registerPlugin && typeof Flip !== 'undefined') {
         // Record the current state
         const state = Flip.getState(fillElement);
         
         // Make DOM changes
         targetUnderline.appendChild(fillElement);
         fillElement.style.width = `${radioWrapWidth}px`;
         
         // Animate from the previous state
         Flip.from(state, {
           duration: window.innerWidth >= 992 ? 0.4 : 0.3,
           ease: "power1.out"
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
     }
   }

  // Setup event listeners
  function setupEventListeners() {

    // Filter field changes
    const filterFields = document.querySelectorAll('[fs-list-field]');
    filterFields.forEach(field => {
      if (field.tagName === 'DIV' && !field.type) return;
      
      const eventType = field.type === 'text' ? 'input' : 'change';
      const fieldName = field.getAttribute('fs-list-field');
      const isThemeFilter = fieldName && fieldName.toLowerCase() === 'theme';
      
      field.addEventListener(eventType, Utils.debounce(() => {
        updateActiveFiltersDisplay();
      }, 100));
    });

    // Theme radio changes for underline
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
    window.addEventListener('resize', Utils.debounce(() => {
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

  // Initialize swiper for theme filters
  function setupSwiper() {
    if (typeof Swiper === 'undefined' || window.innerWidth < 992) return;

    const swiperContainer = document.querySelector(".form_theme-tab_wrap");
    if (!swiperContainer) return;

    const swiper = new Swiper(".form_theme-tab_wrap", {
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
        navigationNext: updateSwiperClasses,
        navigationPrev: updateSwiperClasses,
        transitionEnd: updateSwiperClasses,
        reachBeginning: updateSwiperClasses,
        reachEnd: updateSwiperClasses,
      }
    });

    window.addEventListener('resize', Utils.debounce(() => {
      if (window.innerWidth < 992 && swiper) {
        swiper.destroy(true, true);
      }
    }, 100));
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
    // Check if CMS nest is complete
    function checkCMSNestComplete() {
      return new Promise((resolve) => {
        // Initialize FinsweetAttributes if not already present
        window.FinsweetAttributes ||= [];
        
        // Push a callback to run when list attribute is loaded
        window.FinsweetAttributes.push([
          'list',
          async (listInstances) => {
            try {
              // Wait for all list instances and their nested items to be fully loaded
              const nestingPromises = [];
              
              for (const listInstance of listInstances) {
                // Wait for paginated items to load
                if (listInstance.loadingPaginatedItems) {
                  nestingPromises.push(listInstance.loadingPaginatedItems);
                }
                
                // Wait for all items' nesting to complete
                listInstance.items.value.forEach(item => {
                  if (item.nesting) {
                    nestingPromises.push(item.nesting);
                  }
                });
              }
              
              // Wait for all nesting promises to resolve
              await Promise.all(nestingPromises);
              resolve();
            } catch (error) {
              resolve(); // Resolve anyway to prevent blocking
            }
          },
        ]);
      });
    }

    // Wait for CMS nest completion and inject styles
    checkCMSNestComplete().then(() => {
      injectEmptyFacetStyles();
    });
  }

  // Initialize everything
  function init() {
    if (isInitialized) return;
        
    // Check for required elements
    const listElement = document.querySelector('[fs-list-element="list"]');
    const filtersElement = document.querySelector('[fs-list-element="filters"]');
    
    if (!listElement || !filtersElement) {
      return;
    }
    
    // Setup all functionality
    setupEventListeners();
    setupFilterRows();
    setupSwiper();
    updateUnderlinePosition();
    updateActiveFiltersDisplay();
    
    // Wait for Finsweet initialization and inject styles when ready
    waitForFinsweetInitialization();
    
    isInitialized = true;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.FilterSystem = {
    init,
    updateActiveFiltersDisplay,
    updateUnderlinePosition,
    getActiveFilters: () => activeFilters
  };

})();
