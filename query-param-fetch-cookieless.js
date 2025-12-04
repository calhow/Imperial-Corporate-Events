// cspell:ignore gclid
// Cookieless gclid Tracker - Propagates gclid via URL parameters (no storage)
const GclidCookieless = (() => {
  const PARAM_NAME = 'gclid';
  
  // Get gclid from current URL
  const getGclid = () => new URLSearchParams(window.location.search).get(PARAM_NAME);
  
  // Add gclid to a URL string
  const appendToUrl = (url, gclid) => {
    if (!url || !gclid) return url;
    try {
      const urlObj = new URL(url, window.location.origin);
      // Only modify internal links
      if (urlObj.origin !== window.location.origin) return url;
      // Don't override existing gclid
      if (urlObj.searchParams.has(PARAM_NAME)) return url;
      urlObj.searchParams.set(PARAM_NAME, gclid);
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  };
  
  // Inject hidden input into form
  const addToForm = (form, gclid) => {
    if (!form || !gclid) return;
    if (form.querySelector(`input[name="${PARAM_NAME}"]`)) return;
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = PARAM_NAME;
    input.value = gclid;
    form.appendChild(input);
  };
  
  // Process all links on page
  const processLinks = (gclid, scope = document) => {
    scope.querySelectorAll('a[href]').forEach(link => {
      const newHref = appendToUrl(link.href, gclid);
      if (newHref !== link.href) link.href = newHref;
    });
  };
  
  // Process all forms on page
  const processForms = (gclid, scope = document) => {
    scope.querySelectorAll('form').forEach(form => addToForm(form, gclid));
  };
  
  const init = () => {
    const gclid = getGclid();
    if (!gclid) return;
    
    // Process existing elements
    processLinks(gclid);
    processForms(gclid);
    
    // Watch for dynamically added elements
    new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          
          // Process the node itself
          if (node.tagName === 'A' && node.href) {
            node.href = appendToUrl(node.href, gclid);
          } else if (node.tagName === 'FORM') {
            addToForm(node, gclid);
          }
          
          // Process children
          if (node.querySelectorAll) {
            processLinks(gclid, node);
            processForms(gclid, node);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  };
  
  return { init, getGclid };
})();

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', GclidCookieless.init)
  : GclidCookieless.init();

window.GclidCookieless = GclidCookieless;

