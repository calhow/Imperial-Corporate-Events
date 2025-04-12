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

// HANDLE DESTRUCTION OF IS HIGHLIGHTS Swiper
window.fsAttributes = window.fsAttributes || [];
window.fsAttributes.push([
  "cmsfilter",
  (filterInstances) => {
    const [firstInstance, secondInstance] = filterInstances;

    swiperConfigs.forEach(({ selector, comboClass, slidesPerView }) => {
      if (comboClass !== "is-highlights") {
        const swiperInstance = initializeSwiper({
          selector,
          comboClass,
          slidesPerView,
        });

        swiperInstances.push(swiperInstance);
      }
    });

    const triggerRenderItems = () => {
      if (window.innerWidth < 992) return; // Only run on 992px and above

      const highlightsSwiper = swiperInstances.find(
        (swiper) => swiper.comboClass === "is-highlights"
      );

      if (highlightsSwiper) {
        highlightsSwiper.destroy(true, true);
        swiperInstances.splice(swiperInstances.indexOf(highlightsSwiper), 1);
      }

      const newHighlightsSwiper = initializeSwiper({
        selector: ".swiper.is-highlights",
        comboClass: "is-highlights",
        slidesPerView: "auto",
      });

      swiperInstances.push(newHighlightsSwiper);
    };

    if (secondInstance) {
      secondInstance.listInstance.on("renderitems", () => {
        triggerRenderItems();
      });
    }

    const onFilterChange = () => {
      triggerRenderItems();
    };

    if (secondInstance) {
      secondInstance.listInstance.on("change", onFilterChange);
    }
  },
]);

// KEY FEATURE CARD CLICK ANIMATION
const cards = document.querySelectorAll(".card_key-feature_wrap");

cards.forEach((card) => {
  const para = card.querySelector(".card_key-feature_para");

  para.classList.add("line-clamp-2"); // Initially add the line clamp combo class

  card.addEventListener("click", () => {
    if (card.classList.contains("is-expanded")) {
      card.classList.remove("is-expanded");
      setTimeout(() => para.classList.add("line-clamp-2"), 500); // Reapply line clamp after 500ms
    } else {
      card.classList.add("is-expanded");
      para.classList.remove("line-clamp-2");
    }
  });
});

// Highlight card tap toggle (only for devices < 992px)
function setCardHighlightListeners() {
  if (window.innerWidth < 992) {
    document.querySelectorAll(".card_highlight_wrap").forEach((card) => {
      card.addEventListener("click", handleClick);
    });
  }
}

function handleClick(event) {
  event.preventDefault();
  this.classList.toggle("is-active");
}

document.addEventListener("DOMContentLoaded", setCardHighlightListeners);

// ADD & REMOVE CONTROLS FROM EXP VIDEO WHEN PLAYING OUTSIDE OF MODAL
document.addEventListener("DOMContentLoaded", () => {
  // Find all video containers and set up events for each
  document.querySelectorAll('.video_contain').forEach(setupVideoEvents);
});

function setupVideoEvents(container) {
  // Handle case when function is called without a container parameter
  if (!container) {
    // Find all video containers and process them instead
    document.querySelectorAll('.video_contain').forEach(videoContainer => {
      setupVideoEvents(videoContainer);
    });
    return;
  }

  const videoWrap = container.querySelector(".video_cover_wrap");
  const videoPlayer = container.querySelector(".video_gallery_player");
  
  if (!videoWrap || !videoPlayer) return;
  
  // Find optional UI elements using more reliable selectors
  // First try to find them within the slide, then fallback to document level for gallery
  const parentSlide = container.closest('.swiper-slide');
  const swiperContainer = container.closest('.swiper');
  
  // Find testimonial button - could be in slide or nearby in DOM
  let testimonialBtn = parentSlide?.querySelector(".gallery_selection_btn_wrap");
  if (!testimonialBtn) {
    // If not in the slide, look for it in the closest common container
    testimonialBtn = swiperContainer?.querySelector(".gallery_selection_btn_wrap");
  }
  
  // Find swiper pagination - could be in swiper container or elsewhere
  let swiperControls = swiperContainer?.querySelector(".swiper-pagination.is-gallery");
  if (!swiperControls) {
    // Try to find pagination near the swiper
    swiperControls = document.querySelector(".swiper-pagination.is-gallery");
  }
  
  // Find gallery buttons - could be in container or elsewhere
  let galleryBtnWrap = swiperContainer?.parentElement?.querySelector(".gallery_btn_wrap");
  if (!galleryBtnWrap) {
    // Try to find it in a parent container
    galleryBtnWrap = swiperContainer?.closest(".video_wrap")?.querySelector(".gallery_btn_wrap");
    // If still not found, try a broader search
    if (!galleryBtnWrap) {
      galleryBtnWrap = document.querySelector(".gallery_btn_wrap");
    }
  }

  const disableUI = (disable) => {
    videoWrap.classList.toggle("is-disabled", disable);
    
    // Only toggle optional UI elements if they exist
    if (testimonialBtn) testimonialBtn.classList.toggle("is-disabled", disable);
    if (swiperControls) swiperControls.classList.toggle("is-disabled", disable);
    if (galleryBtnWrap) galleryBtnWrap.classList.toggle("is-disabled", disable);
    
    if (disable) videoPlayer.setAttribute("controls", "true");
    else videoPlayer.removeAttribute("controls");
  };

  let isScrubbing = false;

  videoWrap.addEventListener("click", () => {
    disableUI(true);
    videoPlayer.play().catch(() => {});
  });

  videoPlayer.addEventListener("ended", () => {
    videoPlayer.currentTime = 0;
    disableUI(false);
  });

  videoPlayer.addEventListener("seeking", () => (isScrubbing = true));

  videoPlayer.addEventListener("seeked", () => {
    setTimeout(() => (isScrubbing = false), 100);
  });

  videoPlayer.addEventListener("pause", () => {
    setTimeout(() => {
      if (!isScrubbing) disableUI(false);
    }, 100);
  });
}

// GALLERY SLIDER

const gallerySwiper = new Swiper(".swiper.is-gallery", {
  slidesPerView: 1,
  slideActiveClass: "is-active",
  effect: "fade",
  fadeEffect: {
    crossFade: true,
  },
  loop: true,
  preventClicks: false,
  preventClicksPropagation: false,
  navigation: {
    nextEl: '[data-swiper-button-next="is-gallery"]',
    prevEl: '[data-swiper-button-prev="is-gallery"]',
    disabledClass: "is-disabled",
  },
  pagination: {
    el: ".swiper-pagination.is-gallery",
    type: "bullets",
    dynamicBullets: true,
  },
  on: {
    init: function () {
      const swiperInstance = this;
      const hasOnlyOneSlide = swiperInstance.slides.length === 1;

      swiperInstance.params.loop = !hasOnlyOneSlide;
      swiperInstance.loopDestroy();
      if (!hasOnlyOneSlide) {
        swiperInstance.loopCreate();
      }
      swiperInstance.update();

      const videoSlide = document.querySelector(
        ".video_wrap .swiper-slide.is-gallery"
      );

      if (videoSlide) {
        const videoElement = videoSlide.querySelector("video");
        if (videoElement) {
          const src = videoElement.getAttribute("src");
          const poster = videoElement.getAttribute("poster");

          if (src && src.trim() !== "" && poster && poster.trim() !== "") {
            videoSlide.parentNode.removeChild(videoSlide);
            swiperInstance.prependSlide(videoSlide);
            swiperInstance.slideTo(0, 0, false);
            
            // Fix: Find video container and pass it to setupVideoEvents
            const videoContainer = videoSlide.querySelector('.video_contain');
            if (videoContainer) {
              setupVideoEvents(videoContainer);
            }
          }
        }
      }

      const galleryBtnWrap = document.querySelector(".gallery_btn_wrap");
      const prevBtn = document.querySelector(
        '[data-swiper-button-prev="is-gallery"]'
      );
      const nextBtn = document.querySelector(
        '[data-swiper-button-next="is-gallery"]'
      );

      if (swiperInstance.slides.length === 1) {
        if (galleryBtnWrap) galleryBtnWrap.style.display = "none";
      } else {
        if (prevBtn) prevBtn.style.display = "block";
        if (nextBtn) nextBtn.style.display = "block";
      }
    },
  },
});

// HIGHLIGHTS FILTER TABS

setTimeout(function () {
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    "cmsfilter",
    function (filterInstances) {
      // Check if there are multiple filter instances
      if (filterInstances.length > 1) {
        // Target the second filter instance (index 1)
        const secondFilterInstance = filterInstances[1];

        // Log filtersData for second filter instance
        const filtersData = secondFilterInstance.filtersData;

        let resultsArray = [];

        // Loop through filtersData and gather filter values and results
        filtersData.forEach(function (element) {
          const elements = element.elements;
          elements.forEach(function (element) {
            let filterValue = element.value.trim();
            let resultsNumber = element.resultsCount;
            resultsArray.push({
              filterName: filterValue,
              filterResults: resultsNumber,
            });
          });
        });

        // Loop through the filters and update the radios
        resultsArray.forEach(function (filter) {
          // Find the label elements containing the filter text
          var elements = Array.from(
            document.querySelectorAll(".form_pill-tab_wrap")
          ).filter(function (element) {
            return (
              element
                .querySelector(".form_pill-tab_label")
                .textContent.trim() === filter.filterName
            );
          });

          elements.forEach(function (element) {
            // Check if the element is a label and add/remove radio-disabled class from the parent wrapper
            if (element.tagName === "LABEL") {
              // If the filter has no results, disable the entire label
              if (filter.filterResults === 0) {
                element.classList.add("radio-disabled");
              } else {
                element.classList.remove("radio-disabled");
              }
            }
          });
        });
      }
    },
  ]);
}, 100);

// FIXED BUTTONS WHILE SCROLLING ON MOBILE

ScrollTrigger.create({
  trigger: ".packages_wrap",
  start: "bottom top",
  onEnter: () => {
    document.querySelector(".exp_btn_wrap.is-fixed").classList.add("is-active");
  },
  onLeaveBack: () => {
    document
      .querySelector(".exp_btn_wrap.is-fixed")
      .classList.remove("is-active");
  },
});

ScrollTrigger.create({
  trigger: ".footer_wrap",
  start: "top bottom",
  onEnter: () => {
    document
      .querySelector(".exp_btn_wrap.is-fixed")
      .classList.remove("is-active");
  },
  onLeaveBack: () => {
    document.querySelector(".exp_btn_wrap.is-fixed").classList.add("is-active");
  },
});

let lastScrollTop = 0;
const btnWrap = document.querySelector(".exp_btn_wrap.is-fixed");

const throttleInterval = 300;
let lastCallTime = 0;

if (window.innerWidth <= 767 && btnWrap) {
  window.addEventListener("scroll", () => {
    const currentTime = new Date().getTime();

    if (currentTime - lastCallTime > throttleInterval) {
      lastCallTime = currentTime;

      const currentScrollTop =
        window.scrollY || document.documentElement.scrollTop;

      if (currentScrollTop > lastScrollTop) {
        btnWrap.classList.remove("is-upscroll");
      } else if (currentScrollTop < lastScrollTop) {
        btnWrap.classList.add("is-upscroll");
      }

      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    }
  });
}

// SWIPER FOR MODAL GALLERIES

function initializeGallerySwipers() {
  // Define gallery types with their specific selectors and attributes
  const galleryTypes = [
    { class: "is-hotel-gallery", attr: "data-swiper-hotel" },
    { class: "is-room-gallery", attr: "data-swiper-room" },
    { class: "is-hospitality-gallery", attr: "data-swiper-hospitality" },
  ];

  // Initialize all gallery types
  galleryTypes.forEach(({ class: galleryClass, attr: dataAttr }) => {
    document.querySelectorAll(`.swiper.${galleryClass}`).forEach((gallery) => {
      const uniqueValue = gallery.getAttribute(dataAttr);
      if (!uniqueValue) return;

      // Count the number of slides
      const slideCount = gallery.querySelectorAll('.swiper-slide').length;
      // Only enable loop if there are more than 1 slide
      const shouldLoop = slideCount > 1;

      new Swiper(gallery, {
        slidesPerView: 1,
        slideActiveClass: "is-active",
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        loop: shouldLoop,
        preventClicks: false,
        preventClicksPropagation: false,
        navigation: {
          nextEl: `[data-swiper-button-next="${uniqueValue}"]`,
          prevEl: `[data-swiper-button-prev="${uniqueValue}"]`,
          disabledClass: "is-disabled",
        },
        pagination: {
          el: `.swiper-pagination[${dataAttr}="${uniqueValue}"]`,
          type: "bullets",
          dynamicBullets: true,
        },
        on: {
          init: function () {
            const swiperInstance = this;
            const hasOnlyOneSlide = swiperInstance.slides.length === 1;

            // Handle loop for single slides
            swiperInstance.params.loop = !hasOnlyOneSlide;
            swiperInstance.loopDestroy();
            if (!hasOnlyOneSlide) {
              swiperInstance.loopCreate();
            }
            swiperInstance.update();

            // Toggle visibility of navigation elements
            const galleryBtnWrap = gallery
              .closest(".package_gallery_contain")
              .querySelector(".gallery_btn_wrap");

            const prevBtn = document.querySelector(
              `[data-swiper-button-prev="${uniqueValue}"]`
            );
            const nextBtn = document.querySelector(
              `[data-swiper-button-next="${uniqueValue}"]`
            );

            if (hasOnlyOneSlide) {
              if (galleryBtnWrap) galleryBtnWrap.style.display = "none";
            } else {
              if (prevBtn) prevBtn.style.display = "block";
              if (nextBtn) nextBtn.style.display = "block";
            }
          },
        },
      });
    });
  });
}

// CMS NEST FUNCTION

function cmsNest() {
  const items = document.querySelectorAll("[data-cms-nest^='item']");

  // If no CMS nest items found, dispatch event immediately
  if (items.length === 0) {
    document.dispatchEvent(
      new CustomEvent("cmsNestComplete", { detail: { found: false } })
    );
    return;
  }

  let pendingFetches = items.length;
  let contentFound = false;

  items.forEach((item) => {
    const link = item.querySelector("[data-cms-nest='link']");
    if (!link) {
      console.warn("CMS Nest: Link not found", item);
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
      return;
    }

    const href = link.getAttribute("href");
    if (!href) {
      console.warn("CMS Nest: Href attribute not found", link);
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
      return;
    }

    try {
      const url = new URL(href, window.location.origin);
      if (url.hostname !== window.location.hostname) {
        console.warn("CMS Nest: URL is not on the same domain", url);
        pendingFetches--;
        if (pendingFetches === 0) {
          document.dispatchEvent(
            new CustomEvent("cmsNestComplete", {
              detail: { found: contentFound },
            })
          );
        }
        return;
      }

      fetchWithTimeout(href, {}, 5e3)
        .then((response) => response.text())
        .then((html) => {
          const parsedContent = new DOMParser().parseFromString(
            html,
            "text/html"
          );

          // Get all dropzones within this item
          const dropzones = item.querySelectorAll(
            "[data-cms-nest^='dropzone-']"
          );
          let foundContent = false;

          dropzones.forEach((dropzone) => {
            // Extract the number from the dropzone (e.g., "dropzone-2" -> "2")
            const dropzoneNum = dropzone
              .getAttribute("data-cms-nest")
              .split("-")[1];
            const targetSelector = `[data-cms-nest='target-${dropzoneNum}']`;

            const target = parsedContent.querySelector(targetSelector);
            if (target) {
              dropzone.innerHTML = "";
              dropzone.appendChild(target);
              foundContent = true;
              contentFound = true;
            } else {
              console.warn(
                `CMS Nest: ${targetSelector} not found in fetched content`,
                url
              );
            }
          });

          // Dispatch event for this specific item completion
          item.dispatchEvent(
            new CustomEvent("cmsNestItemComplete", {
              detail: { found: foundContent },
              bubbles: true,
            })
          );

          pendingFetches--;
          if (pendingFetches === 0) {
            document.dispatchEvent(
              new CustomEvent("cmsNestComplete", {
                detail: { found: contentFound },
              })
            );
          }
        })
        .catch((error) => {
          console.error(
            "CMS Nest: Error fetching the link or request timed out:",
            error
          );
          pendingFetches--;
          if (pendingFetches === 0) {
            document.dispatchEvent(
              new CustomEvent("cmsNestComplete", {
                detail: { found: contentFound },
              })
            );
          }
        });
    } catch (error) {
      console.error("CMS Nest: Invalid URL", href, error);
      pendingFetches--;
      if (pendingFetches === 0) {
        document.dispatchEvent(
          new CustomEvent("cmsNestComplete", {
            detail: { found: contentFound },
          })
        );
      }
    }
  });
}

// HIDE EMPTY FEATURED AMENITIES DIVS IN PACKAGE MODAL
function hideEmptyDivs() {
  const modalWrap = document.querySelector(".package_modal_wrap");
  if (!modalWrap) return;
  const divs = modalWrap.querySelectorAll(
    "div.package_accordion_featured-amenities"
  );
  divs.forEach((div) => {
    if (div.textContent.trim() === "" && div.children.length === 0) {
      div.style.display = "none";
    }
  });
}

// ADJUST HOTEL STARS
function adjustHotelStars() {
  const starWraps = document.querySelectorAll(".package_hotel_star_wrap");

  starWraps.forEach(function (wrap) {
    const hotelScore = parseInt(wrap.getAttribute("data-hotel-score"), 10);
    const stars = wrap.children;

    if (isNaN(hotelScore) || hotelScore < 1 || hotelScore > 5) {
      for (let i = 0; i < stars.length; i++)
        stars[i].style.display = "inline-block";
    } else {
      for (let i = 0; i < stars.length; i++) {
        stars[i].style.display = i < hotelScore ? "inline-block" : "none";
      }
    }
  });
}

// PACKAGE MODAL CONTENT RETRIEVAL

// Get elements to use
const cardsSelector = ".packages_card";
const contentSelector = ".package_contain";

// Get cards and panel elements
const packageModal = document.querySelector(".package_modal");
const packageModalTarget = packageModal?.querySelector(".package_modal_wrap");

// Store for pre-fetched content
const contentCache = new Map();
// Store for pending fetches
const pendingFetches = new Map();
// Queue for URLs waiting to be fetched
const prefetchQueue = [];
// Maximum number of concurrent prefetches
const MAX_CONCURRENT_PREFETCHES = 4;

// Function to attach event handlers to package cards
const attachPackageCardHandlers = (cards) => {
  if (!cards || !cards.length) return;
  
  // Convert to array and prioritize visible cards
  const cardsArray = Array.from(cards);
  cardsArray.sort((a, b) => {
    const aVisible = isElementInViewport(a);
    const bVisible = isElementInViewport(b);
    return (bVisible ? 1 : 0) - (aVisible ? 1 : 0);
  });
  
  cardsArray.forEach((card) => {
    // Skip if already processed
    if (card.hasAttribute('data-package-card-initialized')) return;
    
    // Mark as initialized
    card.setAttribute('data-package-card-initialized', 'true');
    
    // Add click handler
    card.addEventListener("click", handleCardClick);
    
    // Start pre-fetch
    const linkElement = card.querySelector(".packages_link");
    if (linkElement) {
      const url = linkElement.getAttribute("href");
      if (url && !contentCache.has(url) && !pendingFetches.has(url)) {
        prefetchPackageContent(url);
      }
    }
  });
};

// Function to check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Function to request content prefetching - either start immediately or queue
const prefetchPackageContent = (url) => {
  // Skip if already cached or fetching
  if (contentCache.has(url) || pendingFetches.has(url)) return;
  
  // If we're below the concurrent limit, start the fetch
  if (pendingFetches.size < MAX_CONCURRENT_PREFETCHES) {
    startPrefetch(url);
  } else {
    // Otherwise add to queue for later
    if (!prefetchQueue.includes(url)) {
      prefetchQueue.push(url);
    }
  }
};

// Function to actually start a prefetch
const startPrefetch = (url) => {
  const fetchPromise = fetchContent(url).then(content => {
    if (content) {
      contentCache.set(url, content);
    }
    pendingFetches.delete(url);
    
    // Process next queued URL if available
    processNextQueuedFetch();
    
    return content;
  }).catch(error => {
    pendingFetches.delete(url);
    
    // Process next queued URL even on error
    processNextQueuedFetch();
    
    return null;
  });
  
  pendingFetches.set(url, fetchPromise);
};

// Function to process the next URL in the prefetch queue
const processNextQueuedFetch = () => {
  if (prefetchQueue.length > 0 && pendingFetches.size < MAX_CONCURRENT_PREFETCHES) {
    const nextUrl = prefetchQueue.shift();
    startPrefetch(nextUrl);
  }
};

// Function to populate modal with content
const populateModal = (content, url) => {
  if (!packageModalTarget) return;
  
  // Clear previous content immediately
  packageModalTarget.innerHTML = "";
  packageModalTarget.setAttribute('data-current-url', url);
  
  // Defer content population to ensure animation runs smoothly first
  setTimeout(() => {
    // Minimize layout thrashing by doing operations in batch
    // 1. Clone the content (no DOM impact)
    const contentClone = content.cloneNode(true);
    
    // 2. Prepare the content before adding to DOM (minimize reflows)
    // Apply any needed modifications to the clone before insertion
    prepareContentForInsertion(contentClone);
    
    // 3. Insert into DOM (single reflow)
    packageModalTarget.appendChild(contentClone);
    
    // 4. Start component initialization with requestAnimationFrame to avoid blocking the main thread
    requestAnimationFrame(() => initializeModalContent(contentClone));
  }, 0);
};

// Function to prepare content before DOM insertion
// This helps minimize reflows by doing operations before the element is in the live DOM
const prepareContentForInsertion = (contentElement) => {
  // Remove any loading states or temporary attributes
  contentElement.querySelectorAll('[data-temp-loading]').forEach(el => {
    el.removeAttribute('data-temp-loading');
  });
  
  // Set initial state for animations or transitions if needed
  contentElement.querySelectorAll('.package_animate').forEach(el => {
    el.style.opacity = '0';
  });
};

// Separate function to initialize modal content across multiple animation frames
const initializeModalContent = (contentElement) => {
  try {
    // First batch of initializations
    initializePackageAccordion();
    
    // Schedule paragraph toggles for the next frame (most expensive operation)
    requestAnimationFrame(() => {
      setupParagraphToggles(packageModalTarget);
      
      // Schedule gallery initializations for the next frame
      requestAnimationFrame(() => {
        initializeGallerySwipers();
        adjustHotelStars();
        
        // Schedule remaining initializations
        requestAnimationFrame(() => {
          initializeTabsInScope(packageModalTarget);
          initializeCountersInScope(packageModalTarget);
          initializePackageForm();
          initializeTabButtons(packageModalTarget);
          
          // Handle video setup and CMS operations last
          requestAnimationFrame(() => {
            packageModalTarget.querySelectorAll('.video_contain').forEach(setupVideoEvents);
            
            // Run CMS operations
            cmsNest();
            
            // Set up CMS Nest completion event
            document.addEventListener(
              "cmsNestComplete",
              (e) => {
                try {
                  requestAnimationFrame(() => {
                    insertSVGFromCMS(packageModalTarget);
                    hideEmptyDivs();
                  });
                } catch (error) {
                  // Silently handle errors
                }
              },
              { once: true }
            );
          });
        });
      });
    });
  } catch (error) {
    // Silently handle errors
  }
};

// Function to check if modal already contains the correct content
const isModalContentCorrect = (url) => {
  if (!packageModalTarget) return false;
  
  // Check if the modal has a data-current-url attribute
  const currentUrl = packageModalTarget.getAttribute('data-current-url');
  const isCorrect = currentUrl === url;
  return isCorrect;
};

// Function to fetch content from URL
const fetchContent = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Set up Web Worker for content processing if not already done
    if (!window.contentProcessorReady) {
      setupContentProcessor();
    }
    
    // Use the web worker if available, otherwise fall back to main thread processing
    if (window.contentProcessor) {
      return new Promise((resolve) => {
        // Set up one-time handler for this specific URL
        const messageHandler = (e) => {
          const { processedUrl, content, error } = e.data;
          
          if (processedUrl === url) {
            // Remove the event listener once we've received the right response
            window.contentProcessor.removeEventListener('message', messageHandler);
            
            if (error) {
              fallbackToMainThreadProcessing();
              return;
            }
            
            try {
              // Convert the processed content back to DOM nodes
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content || '';
              const processedContent = tempDiv.querySelector(contentSelector);
              
              if (!processedContent) {
                fallbackToMainThreadProcessing();
                return;
              }
              
              resolve(processedContent);
            } catch (e) {
              fallbackToMainThreadProcessing();
            }
          }
        };
        
        // Fallback function for when worker fails
        const fallbackToMainThreadProcessing = () => {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const content = doc.querySelector(contentSelector);
            
            if (!content) {
              resolve(null);
              return;
            }
            
            resolve(content);
          } catch (e) {
            resolve(null);
          }
        };
        
        window.contentProcessor.addEventListener('message', messageHandler);
        
        // Set timeout for worker response
        const timeoutId = setTimeout(() => {
          window.contentProcessor.removeEventListener('message', messageHandler);
          fallbackToMainThreadProcessing();
        }, 3000);
        
        // Send the HTML for processing
        try {
          window.contentProcessor.postMessage({ 
            action: 'processContent', 
            html: text, 
            url: url,
            selector: contentSelector
          });
        } catch (e) {
          clearTimeout(timeoutId);
          fallbackToMainThreadProcessing();
        }
      });
    } else {
      // Fallback to synchronous processing
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const content = doc.querySelector(contentSelector);
      
      if (!content) {
        throw new Error("Content not found in fetched document");
      }
      
      return content;
    }
  } catch (error) {
    return null;
  }
};

// Function to set up the Content Processor Web Worker
const setupContentProcessor = () => {
  // Only set up once
  if (window.contentProcessorReady) return;
  
  try {
    // Create the worker code as a blob
    const workerCode = `
      self.addEventListener('message', (e) => {
        const { action, html, url, selector } = e.data;
        
        if (action === 'processContent') {
          try {
            // Since DOMParser is not available in workers, use string manipulation instead
            // This is a simplified version that handles basic cases
            const findContent = (html, selector) => {
              try {
                // For selector like ".package_contain", look for class="package_contain"
                // This is a simplified approach and won't work for complex selectors
                const classMatch = selector.match(/\\.(\\w+)/);
                if (classMatch && classMatch[1]) {
                  const className = classMatch[1];
                  
                  // Find the opening tag with this class
                  const classPattern = new RegExp('<([^>]+)\\\\s+class="([^"]*\\\\s+)?' + className + '(\\\\s+[^"]*)?">');
                  const match = html.match(classPattern);
                  
                  if (match) {
                    // Get the tag name to help find the closing tag
                    const tagName = match[1].trim();
                    const startIndex = match.index;
                    
                    // Simple way to find the corresponding closing tag
                    // Note: This doesn't handle nested tags of the same type perfectly
                    let openTags = 1;
                    let endIndex = startIndex + match[0].length;
                    
                    const openPattern = new RegExp('<' + tagName + '\\\\b', 'g');
                    const closePattern = new RegExp('<\\\\/' + tagName + '\\\\s*>', 'g');
                    
                    openPattern.lastIndex = endIndex;
                    closePattern.lastIndex = endIndex;
                    
                    let openMatch, closeMatch;
                    
                    while (openTags > 0 && endIndex < html.length) {
                      openPattern.lastIndex = endIndex;
                      closePattern.lastIndex = endIndex;
                      
                      openMatch = openPattern.exec(html);
                      closeMatch = closePattern.exec(html);
                      
                      if (!closeMatch) break;
                      
                      if (openMatch && openMatch.index < closeMatch.index) {
                        openTags++;
                        endIndex = openMatch.index + openMatch[0].length;
                      } else {
                        openTags--;
                        endIndex = closeMatch.index + closeMatch[0].length;
                      }
                    }
                    
                    if (openTags === 0) {
                      // Got the full content
                      return html.substring(startIndex, endIndex);
                    }
                  }
                }
                
                return null;
              } catch (e) {
                return null;
              }
            };
            
            // Extract the content based on the selector
            const content = findContent(html, selector);
            
            if (content) {
              // Basic processing - remove script tags
              let processedContent = content.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');
              
              // Mark images for optimization
              processedContent = processedContent.replace(/<img([^>]*)>/gi, (match, attributes) => {
                return '<img' + attributes + ' data-worker-processed="true">';
              });
              
              // Handle lazy-loaded elements
              processedContent = processedContent.replace(/data-src=/gi, 'data-worker-lazy="true" data-src=');
              
              // Mark iframes and embeds
              processedContent = processedContent.replace(/<(iframe|embed)([^>]*)>/gi, 
                (match, tag, attributes) => {
                  return '<' + tag + attributes + ' data-worker-embed="true">';
                }
              );
              
              // Return the processed content HTML
              self.postMessage({
                processedUrl: url,
                content: processedContent
              });
            } else {
              self.postMessage({
                processedUrl: url,
                error: 'Content not found',
                content: null
              });
            }
          } catch (error) {
            self.postMessage({
              processedUrl: url,
              error: error.message,
              content: null
            });
          }
        }
      });
    `;
    
    // Create a blob URL for the worker
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    // Create the worker
    window.contentProcessor = new Worker(workerUrl);
    
    // Set up error handler
    window.contentProcessor.onerror = (error) => {
      window.contentProcessor = null;
      window.contentProcessorReady = false;
    };
    
    // Clean up the blob URL
    URL.revokeObjectURL(workerUrl);
    
    // Mark as ready
    window.contentProcessorReady = true;
  } catch (error) {
    // If web workers aren't supported or fail to initialize
    window.contentProcessor = null;
    window.contentProcessorReady = false;
  }
};

// Function to handle content population for a URL
const handleContentForUrl = (url) => {
  // Check if modal already contains the correct content
  if (isModalContentCorrect(url)) {
    return;
  }
  
  // Check if content is already cached
  if (contentCache.has(url)) {
    populateModal(contentCache.get(url), url);
    return;
  }
  
  // Check if fetch is in progress
  if (pendingFetches.has(url)) {
    pendingFetches.get(url).then(content => {
      if (content) {
        populateModal(content, url);
      }
    });
    return;
  }
  
  // If not cached or pending, fetch it now
  const fetchPromise = fetchContent(url).then(content => {
    if (content) {
      contentCache.set(url, content);
      populateModal(content, url);
    }
    return content;
  }).catch(error => {
    return null;
  });
  
  pendingFetches.set(url, fetchPromise);
};

// Function to handle card click
const handleCardClick = (event) => {
  // Prevent default behavior to avoid page navigation
  event.preventDefault();
  
  const card = event.currentTarget;
  const linkElement = card.querySelector(".packages_link");
  if (!linkElement) return;
  
  const url = linkElement.getAttribute("href");
  if (!url) return;
  
  // First trigger the modal open animation immediately
  // This ensures the animation begins right away without waiting for content
  openModalForUrl(url);
};

// Function to trigger the modal opening
const openModalForUrl = (url) => {
  // Create and trigger a modal open button
  // This approach ensures we follow the exact same path as a user click
  // which maintains compatibility with the modal animation system
  const btn = document.createElement('button');
  btn.setAttribute('data-modal-open', 'package');
  btn.style.position = 'absolute';
  btn.style.opacity = '0';
  btn.style.pointerEvents = 'none';
  
  // Add to DOM, click, then clean up
  document.body.appendChild(btn);
  btn.click();
  requestAnimationFrame(() => {
    // Remove in next frame to ensure click event is processed
    document.body.removeChild(btn);
    
    // Start content handling after the modal animation has started
    setTimeout(() => handleContentForUrl(url), 10);
  });
};

// Initialize existing package cards on page load
document.addEventListener('DOMContentLoaded', () => {
  if (packageModalTarget) {
    const packageCards = document.querySelectorAll(cardsSelector);
    attachPackageCardHandlers(packageCards);
  }
}, { passive: true });

// Create a more efficient MutationObserver to watch for new package cards added to the DOM
const packageCardObserver = new MutationObserver((mutations) => {
  // Process in a separate task to avoid blocking rendering
  setTimeout(() => {
    let newCards = [];
    
    // First collect all new cards
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a package card
            if (node.matches && node.matches(cardsSelector)) {
              newCards.push(node);
            }
            
            // Check for package cards inside the added node
            if (node.querySelectorAll) {
              const nestedCards = node.querySelectorAll(cardsSelector);
              if (nestedCards.length > 0) {
                newCards = newCards.concat(Array.from(nestedCards));
              }
            }
          }
        }
      }
    }
    
    // Then process all the new cards in a batch
    if (newCards.length > 0) {
      attachPackageCardHandlers(newCards);
    }
  }, 0);
});

// Start observing the document for added package cards with optimized options
if (packageModalTarget) {
  packageCardObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,  // We don't need to observe attribute changes
    characterData: false  // We don't need to observe text changes
  });
}

// PACKAGE FORM
const initializePackageForm = () => {
  const form = packageModalTarget.querySelector('#wf-form-Package');
  const submitBtn = packageModalTarget.querySelector('[data-form-submit="package"]');
  const formWrapper = form?.closest('.w-form');
  if (!form || !submitBtn || !formWrapper) return;

  // Add loading state on form submit
  form.addEventListener('submit', () => {
    submitBtn.classList.add('is-loading');
    submitBtn.classList.remove('is-success');
    submitBtn.disabled = true;
    
    // Update button text and hide icon
    const btnText = submitBtn.querySelector('.btn_push_text');
    const btnIcon = submitBtn.querySelector('.btn_push_icon_mask');
    if (btnText) {
      btnText.textContent = 'Sending...';
      btnText.classList.remove('has-tick');
    }
    if (btnIcon) btnIcon.style.display = 'none';
  });

  // Remove loading state on success or failure
  const stopLoading = (isSuccess = false) => {
    submitBtn.classList.remove('is-loading');
    const btnText = submitBtn.querySelector('.btn_push_text');
    const btnIcon = submitBtn.querySelector('.btn_push_icon_mask');

    if (isSuccess) {
      submitBtn.classList.add('is-success');
      if (btnText) {
        btnText.textContent = 'Request sent';
        btnText.classList.add('has-tick');
      }
    } else {
      submitBtn.classList.remove('is-success');
      if (btnText) {
        btnText.textContent = 'Submit';
        btnText.classList.remove('has-tick');
      }
    }
    submitBtn.disabled = false;
    
    if (btnIcon) btnIcon.style.display = isSuccess ? 'none' : '';
  };

  // Watch for Webflow's form state changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const successWrap = formWrapper.querySelector('.w-form-done');
        const failWrap = formWrapper.querySelector('.w-form-fail');
        
        if (successWrap && successWrap.style.display === 'block') {
          stopLoading(true);
        } else if (failWrap && failWrap.style.display === 'block') {
          stopLoading(false);
        }
      }
    });
  });

  // Start observing the form wrapper for style changes
  observer.observe(formWrapper, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: true
  });

  // Click handler to trigger form submit via hidden button
  submitBtn.addEventListener('click', () => {
    const tempBtn = document.createElement('button');
    tempBtn.type = 'submit';
    tempBtn.style.display = 'none';
    form.appendChild(tempBtn);
    tempBtn.click();
    form.removeChild(tempBtn);
  });

  // Webflow re-init with proper error handling
  if (window.Webflow && Webflow.require) {
    try {
      const forms = Webflow.require("forms");
      if (forms && typeof forms.ready === 'function') {
        forms.ready();
      }
    } catch (e) {
      console.error('Webflow forms initialization failed:', e);
    }
  }
};

// MANAGES PACKAGE TAB BUTTONS

const initializeTabButtons = (scope = document) => {
  const backBtn = scope.querySelector('.package_btn_tab_wrap.is-back');
  const forwardBtn = scope.querySelector('.package_btn_tab_wrap.is-forward');
  const submitBtn = scope.querySelector('.package_btn_tab_wrap.is-submit');
  
  if (!backBtn || !forwardBtn || !submitBtn) return;
  
  forwardBtn.addEventListener('click', function() {
    forwardBtn.classList.add('is-hidden');
    submitBtn.classList.remove('is-hidden');
    backBtn.classList.remove('is-hidden');
  });
  
  backBtn.addEventListener('click', function() {
    backBtn.classList.add('is-hidden');
    submitBtn.classList.add('is-hidden');
    forwardBtn.classList.remove('is-hidden');
  });
};

