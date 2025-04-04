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
  setupVideoEvents();
});

function setupVideoEvents() {
  const videoWrap = document.querySelector(".video_cover_wrap");
  const videoPlayer = document.querySelector(".video_gallery_player");
  const testimonialBtn = document.querySelector(".gallery_selection_btn_wrap");
  const swiperControls = document.querySelector(
    ".swiper-pagination.is-gallery"
  );
  const swiperPagination = document.querySelector(".gallery_btn_wrap");

  if (!videoWrap || !videoPlayer) return;

  const disableUI = (disable) => {
    videoWrap.classList.toggle("is-disabled", disable);
    testimonialBtn?.classList.toggle("is-disabled", disable);
    swiperControls?.classList.toggle("is-disabled", disable);
    swiperPagination?.classList.toggle("is-disabled", disable);
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
            setupVideoEvents();
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

      new Swiper(gallery, {
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
window.addEventListener("load", () => {
  // Get elements to use
  const cardsSelector = ".packages_card";
  const contentSelector = ".package_contain";

  // Get cards and panel elements
  const cards = document.querySelectorAll(cardsSelector);
  const packageModal = document.querySelector(".package_modal");
  const packageModalTarget = packageModal.querySelector(".package_modal_wrap");

  // Iterate over cards
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      // Get the hidden link inside the card
      const linkElement = card.querySelector(".packages_link");

      // Extract the URL from the hidden link
      const url = linkElement.getAttribute("href");

      // Use AJAX to get the project content from the URL
      $.ajax({
        url: url,
        success: function (data) {
          const content = $(data).find(contentSelector);
          packageModalTarget.innerHTML = ""; // Clear previous content
          packageModalTarget.append(content[0]); // Append it to the panel
          initializePackageAccordion(); // Reinitialize the inclusion accordion
          setupParagraphToggles(); // Reinitialize paragraph toggles
          initializeGallerySwipers();
          adjustHotelStars();

          // Run cmsNest and listen for completion event
          cmsNest();

          // Set up the event listener for cmsNestComplete
          document.addEventListener(
            "cmsNestComplete",
            function handleCMSNestComplete(event) {
              // Run insertSVGFromCMS immediately once cmsNest is complete
              insertSVGFromCMS(packageModalTarget);
              hideEmptyDivs();

              // Remove the event listener to prevent duplicates on future calls
              document.removeEventListener(
                "cmsNestComplete",
                handleCMSNestComplete
              );
            },
            { once: true }
          ); // Using once: true as an alternative way to ensure it only runs once
        }, // ajax success
      }); // ajax
    }); // card click
  }); // foreach
});
