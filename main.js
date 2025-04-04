// Set experience card fixture bg color
// Function to set the background color
const setBgColor = (element) => {
  const bgColor = element.dataset.bgColor || "#333333"; // Fallback to #333333
  element.style.backgroundColor = bgColor;
};

// Initially set background color for existing elements
document.querySelectorAll("[data-bg-color]").forEach(setBgColor);

// Create a MutationObserver to watch for added nodes
const observer = new MutationObserver((mutations) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check if the added node has the data-bg-color attribute
      if (node.hasAttribute("data-bg-color")) {
        setBgColor(node);
      }

      // Check for any descendant elements that have the data-bg-color attribute
      node.querySelectorAll("[data-bg-color]").forEach(setBgColor);
    }
  }
});

// Start observing the document body for added nodes
observer.observe(document.body, { childList: true, subtree: true });

// Create SVG elements from CMS paragraphs
function insertSVGFromCMS(container = document) {
  container.querySelectorAll(".svg-code").forEach((element) => {
    const svgCode = element.textContent;
    if (!svgCode) return;
    const svgElement = document.createElement("div");
    svgElement.innerHTML = svgCode;
    element.insertAdjacentElement("afterend", svgElement.firstChild);
  });
}

insertSVGFromCMS();

// LENIS SMOOTH SCROLLING

// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({
  lerp: 0.15,
  smoothWheel: true,
  smoothTouch: false,
  overscroll: false,
  prevent: (node) => node.closest(".u-modal-prevent-scroll") !== null,
});

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// FINSWEET ATTRIBUTES

// Enable Finsweet Attributes to work together
document.addEventListener("DOMContentLoaded", function () {
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    "cmsnest",
    (listInstances) => {
      window.fsAttributes.cmsfilter.init();
    },
  ]);
});

// PARALLAX ANIMATIONS

// Initialize timelines conditionally
const homeHeroWrap = document.querySelector(".hero_home_wrap");
const catHeroWrap = document.querySelector(".hero_cat_wrap");
const ctaContent = document.querySelector(".cta_content");

// Home video parallax trigger
let homeHeroParallax;
if (homeHeroWrap) {
  homeHeroParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero_home_wrap",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

// Category hero parallax trigger
let catHeroParallax;
if (catHeroWrap) {
  catHeroParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero_cat_wrap",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

// Footer CTA parallax trigger
let ctaParallax;
if (ctaContent) {
  ctaParallax = gsap.timeline({
    scrollTrigger: {
      trigger: ".cta_content",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
}

// Handle media queries
let mm = gsap.matchMedia();

// Parallax for CTA & Hero on devices above 480px
mm.add("(min-width: 480px)", () => {
  if (homeHeroParallax) {
    homeHeroParallax.to(".hero_home_vid", { y: "12rem" });
  }
  if (catHeroParallax) {
    catHeroParallax.to(".hero_cat_img", { y: "-4rem" });
  }
  if (ctaParallax) {
    ctaParallax.to(".cta_bg_img", { y: "12rem" });
  }
});

// MODAL ANIMATION
const modalStates = {}; // Tracks state for each modal group
const autoplayVideos = new WeakSet(); // Tracks videos that were autoplaying

function updateLiveChatVisibility() {
  const anyModalOpen = Object.values(modalStates).some((state) => state);
  if (window.LiveChatWidget) {
    const initialState = LiveChatWidget.get("state");
    if (
      initialState.visibility === "maximized" ||
      initialState.visibility === "minimized"
    ) {
      anyModalOpen
        ? window.LiveChatWidget.call("hide")
        : window.LiveChatWidget.call("minimize");
    }
  }
}

function toggleBodyScrollAndAnimate(modalGroup) {
  const anyModalOpen = Object.values(modalStates).some((state) => state);
  const navContain = document.querySelector(".nav_main_contain");
  const navWrap = document.querySelector(".nav_main_wrap");
  if (anyModalOpen) {
    document.body.classList.add("no-scroll");
    if (modalGroup !== "nav") {
      navContain?.classList.add("is-disabled");
      setTimeout(() => {
        navWrap.style.display = "none";
      }, 200);
    }
  } else {
    document.body.classList.remove("no-scroll");
    navWrap.style.display = "block";
    navContain?.classList.remove("is-disabled");
  }
}

function handleVideosOnModalOpen(modalGroup) {
  document.querySelectorAll("video").forEach((video) => {
    const isInModal = video.closest(
      `[data-modal-element='content'][data-modal-group='${modalGroup}']`
    );
    if (!isInModal && !video.paused) {
      video.pause();
    }
    if (video.autoplay) {
      autoplayVideos.add(video);
    }
  });

  // Play videos inside the modal
  document
    .querySelectorAll(
      `[data-modal-element='content'][data-modal-group='${modalGroup}'] video`
    )
    .forEach((video) => {
      video.play();
    });
}

function handleVideosOnModalClose(modalGroup) {
  document.querySelectorAll("video").forEach((video) => {
    const isInModal = video.closest(
      `[data-modal-element='content'][data-modal-group='${modalGroup}']`
    );
    if (isInModal && !video.paused) {
      video.pause();
    }
    if (autoplayVideos.has(video)) {
      video.play();
      autoplayVideos.delete(video);
    }
  });
}

document.addEventListener("click", (event) => {
  const modalToggleBtn = event.target.closest(
    "[data-modal-open], [data-modal-close]"
  );
  if (!modalToggleBtn) return;

  const modalGroup =
    modalToggleBtn.getAttribute("data-modal-open") ||
    modalToggleBtn.getAttribute("data-modal-close");
  const isOpening = modalToggleBtn.hasAttribute("data-modal-open");

  let modalTl = gsap.timeline({
    onComplete: () => {
      if (!isOpening) {
        gsap.set(
          `[data-modal-element='modal'][data-modal-group='${modalGroup}']`,
          { display: "none" }
        );
        modalStates[modalGroup] = false;
        handleVideosOnModalClose(modalGroup);
        updateLiveChatVisibility();
      }
      gsap.set(
        `[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`,
        { filter: "none" }
      );
    },
    onStart: () => {
      if (isOpening) {
        updateLiveChatVisibility();
        handleVideosOnModalOpen(modalGroup);
      }
    },
  });

  if (isOpening) {
    modalStates[modalGroup] = true;
    modalTl
      .set(`[data-modal-element='modal'][data-modal-group='${modalGroup}']`, {
        display: "inline-flex",
      })
      .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, {
        opacity: 1,
        duration: 0.2,
      })
      .to(
        `[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`,
        {
          opacity: 1,
          filter: "blur(0rem)",
          y: "0rem",
          duration: 0.25,
          ease: "power1.out",
          stagger: 0.05,
        }
      );
  } else {
    modalStates[modalGroup] = false;
    modalTl
      .to(`[data-modal-element='bg'][data-modal-group='${modalGroup}']`, {
        opacity: 0,
        duration: 0.2,
      })
      .to(
        `[data-modal-element='content'][data-modal-group='${modalGroup}'] > *`,
        {
          opacity: 0,
          filter: "blur(0.75rem)",
          y: "1rem",
          duration: 0.2,
          ease: "power1.in",
        },
        "<"
      );
  }

  toggleBodyScrollAndAnimate(modalGroup);
});

//NAVIGATION FUNCTIONALITY & ANIMTATIONS

// Applies .is-active class to .form_search_list when it gains focus
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".form_field_input.is-search");
  const parentList = searchInput?.closest(".form_search_list");

  if (parentList && searchInput) {
    parentList.addEventListener("focusin", () => {
      parentList.classList.add("is-active");
    });

    parentList.addEventListener("focusout", () => {
      parentList.classList.remove("is-active");
    });
  }
});

// TAB SWITCH ANIMATION
document.addEventListener("DOMContentLoaded", () => {
  // Function to initialize each tab group
  const initializeTabGroup = (group) => {
    const tabs = document.querySelectorAll(
      `[data-tab-element="tab"][data-tab-group="${group}"]`
    );
    if (tabs.length === 0) return;

    const contentElements = document.querySelectorAll(
      `[data-tab-element="content"][data-tab-group="${group}"]`
    );
    if (contentElements.length === 0) return;

    const contentsContainer = contentElements[0].parentElement;

    const parent = document.querySelector(
      `[data-tab-element="tab-wrap"][data-tab-group="${group}"]`
    );
    if (!parent) return;

    const tabMode = parent.getAttribute("data-tab-mode");

    let highlight;
    if (tabMode === "highlight") {
      highlight = parent.querySelector(".g_switch_tabs_highlight");
      if (!highlight) {
        highlight = document.createElement("div");
        highlight.className = "g_switch_tabs_highlight";
        parent.appendChild(highlight);
      }
    }

    const positionHighlight = (target) => {
      if (!highlight) return;
      highlight.style.top = `${target.offsetTop}px`;
      highlight.style.left = `${target.offsetLeft}px`;
      highlight.style.width = `${target.offsetWidth}px`;
      highlight.style.height = `${target.offsetHeight}px`;
    };

    tabs[0].classList.add("is-active");

    const isInModal =
      parent.closest('.u-modal-prevent-scroll[data-modal-element="modal"]') !==
      null;

    if (tabMode === "highlight") {
      if (isInModal) {
        document.addEventListener("click", (event) => {
          const modalOpenBtn = event.target.closest("[data-modal-open]");
          if (modalOpenBtn) {
            const modalGroup = modalOpenBtn.getAttribute("data-modal-open");
            if (parent.closest(`[data-modal-group='${modalGroup}']`)) {
              setTimeout(() => positionHighlight(tabs[0]), 50); // 50ms delay
            }
          }
        });
      } else {
        window.addEventListener("load", () => {
          positionHighlight(tabs[0]);
        });
      }
    }

    tabs.forEach((tab, index) => {
      tab.dataset.index = index;

      tab.addEventListener("click", () => {
        if (tab.classList.contains("is-active")) return;

        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");

        if (tabMode === "highlight") {
          const state = Flip.getState(highlight);
          positionHighlight(tab);

          Flip.from(state, {
            duration: 0.5,
            ease: "power2.inOut",
            scale: true,
          });
        }

        gsap.to(contentsContainer, {
          xPercent: -100 * index,
          duration: 0.5,
          ease: "power2.inOut",
        });
      });
    });
  };

  const tabGroups = new Set();
  document.querySelectorAll('[data-tab-element="tab"]').forEach((tab) => {
    tabGroups.add(tab.dataset.tabGroup);
  });
  tabGroups.forEach((group) => initializeTabGroup(group));
});

//MENU SEARCH BUTTON
// Utility function to wait for the upcoming tab with retries
async function getUpcomingTab(retries = 5, delay = 100) {
  while (retries > 0) {
    const tab = document.querySelector(
      `[data-tab-element="tab"][data-tab-match="upcoming"][data-tab-group="menu"]`
    );
    if (tab) return tab;
    await new Promise((resolve) => setTimeout(resolve, delay));
    retries--;
  }
  return null;
}

// Event listener for modal button clicks and modal open completion
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-target-button]");
  if (!button) return;

  const targetValue = button.getAttribute("data-target-button");
  const modalGroup = button.getAttribute("data-modal-open");

  if (modalGroup !== "nav") return;

  // Define modal animation with `onComplete` dispatch
  const modalTl = gsap.timeline({
    onComplete: () => {
      document.dispatchEvent(
        new CustomEvent("modalOpenComplete", { detail: modalGroup })
      );
    },
  });

  // Handle "menu-search" behavior (existing)
  if (targetValue === "menu-search") {
    const targetAnchor = document.querySelector(
      `[data-target-anchor="${targetValue}"]`
    );
    const targetField = document.querySelector(
      `[data-target-field="${targetValue}"]`
    );

    if (!targetAnchor || !targetField) return;

    document.addEventListener(
      "modalOpenComplete",
      async (event) => {
        if (event.detail !== modalGroup) return;

        const upcomingTab = await getUpcomingTab();
        if (upcomingTab && !upcomingTab.classList.contains("is-active")) {
          upcomingTab.click();
        }

        // Smooth scroll to anchor
        targetAnchor.scrollIntoView({ behavior: "smooth", block: "start" });

        // Focus input field after scroll
        setTimeout(() => {
          targetField.focus();
          targetField.setSelectionRange(
            targetField.value.length,
            targetField.value.length
          );
        }, 300);
      },
      { once: true }
    );
  }

  // Handle "menu-contact" behavior (new optimized integration)
  if (targetValue === "menu-contact") {
    document.addEventListener(
      "modalOpenComplete",
      (event) => {
        if (event.detail !== modalGroup) return;

        const contactTab = document.querySelector(
          `[data-tab-element="tab"][data-tab-match="contact"][data-tab-group="menu"]`
        );

        if (contactTab && !contactTab.classList.contains("is-active")) {
          contactTab.click();
        }
      },
      { once: true }
    );
  }
});

(function setupParagraphToggles() {
  // Define the initialization function globally
  window.setupParagraphToggles = function () {
    const classSets = [
      {
        wrap: ".g_para_clamped_wrap",
        para: ".g_para_clamped",
        btn: ".g_para_clamped_btn",
      },
      {
        wrap: ".g_para_hover_wrap",
        para: ".g_para_hover",
        btn: ".g_para_hover_btn",
      },
    ];

    // Handle initial setup of buttons (hiding if not needed)
    classSets.forEach(({ wrap, para, btn }) => {
      const items = document.querySelectorAll(wrap);

      items.forEach(function (wrapElement) {
        const paraElement = wrapElement.querySelector(para);
        const toggleBtn = wrapElement.querySelector(btn);
        const modalElement = wrapElement.closest(
          '[data-modal-element="modal"]'
        );

        function isClamped(el) {
          if (
            modalElement &&
            window.getComputedStyle(modalElement).display === "none"
          ) {
            modalElement.style.display = "block";
            const result = el.scrollHeight > el.clientHeight;
            modalElement.style.display = "none";
            return result;
          }
          return el.scrollHeight > el.clientHeight;
        }

        // Only hide the button if the paragraph is not clamped
        if (!isClamped(paraElement)) toggleBtn.classList.add("is-hidden");
      });
    });
  };

  // Set up global event delegation for ALL toggle buttons
  document.addEventListener("click", function (event) {
    // Check if button click matches any of our button classes
    classSets = [
      {
        btn: ".g_para_clamped_btn",
        para: ".g_para_clamped",
      },
      {
        btn: ".g_para_hover_btn",
        para: ".g_para_hover",
      },
    ];

    // Loop through our class sets to find which one was clicked
    for (const classSet of classSets) {
      const toggleBtn = event.target.closest(classSet.btn);

      if (toggleBtn) {
        // Found a matching button
        const wrapElement = toggleBtn.closest(
          ".g_para_clamped_wrap, .g_para_hover_wrap"
        );
        if (!wrapElement) continue;

        const paraElement = wrapElement.querySelector(classSet.para);
        if (!paraElement) continue;

        // Toggle the expanded state
        paraElement.classList.toggle("is-expanded");
        toggleBtn.innerText = paraElement.classList.contains("is-expanded")
          ? "show less"
          : "read more";

        break; // Exit the loop once we've handled the click
      }
    }
  });

  // Immediately invoke the initial setup function
  window.setupParagraphToggles();
})();

// Adjust exp card review stars based on score
document.addEventListener("DOMContentLoaded", function () {
  const starWraps = document.querySelectorAll(".card_review_star_wrap");

  starWraps.forEach(function (wrap) {
    const reviewScore = parseInt(wrap.getAttribute("data-review-score"), 10);
    const stars = wrap.children;

    if (isNaN(reviewScore) || reviewScore < 1 || reviewScore > 5) {
      for (let i = 0; i < stars.length; i++)
        stars[i].style.display = "inline-block";
    } else {
      for (let i = 0; i < stars.length; i++) {
        stars[i].style.display = i < reviewScore ? "inline-block" : "none";
      }
    }
  });
});

// Accordion click
document.addEventListener("click", function (event) {
  const accordion = event.target.closest(".accordion_wrap");
  if (accordion) {
    accordion.classList.toggle("is-active");
  }
});

// Function to initialize the inclusion accordion functionality
function initializePackageAccordion() {
  const accordionHeaders = document.querySelectorAll(
    ".package_accordion_header"
  );
  accordionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      // Find the parent accordion element and toggle its class
      const parentAccordion = header.closest(".package_accordion");
      if (parentAccordion) {
        parentAccordion.classList.toggle("is-active");
      }
    });
  });
}

//OPEN LIVE CHAT
(() => {
  const openChatButtons = document.querySelectorAll('[data-live-chat="open"]');

  if (!openChatButtons.length) return; // Exit if no matching buttons

  openChatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (window.LiveChatWidget) {
        window.LiveChatWidget.call("maximize");
      }
    });
  });
})();
