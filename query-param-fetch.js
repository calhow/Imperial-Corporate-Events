// Google Ads gclid Tracker - Captures, stores, and injects gclid into all forms
const GclidTracker = (() => {
  const EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
  
  const getGclid = () => {
    try {
      const data = JSON.parse(localStorage.getItem('gclid_data'));
      if (data && Date.now() < data.expiresAt) return data.gclid;
      localStorage.removeItem('gclid_data');
    } catch (e) {}
    return null;
  };
  
  const storeGclid = (gclid) => {
    if (!gclid) return;
    try {
      localStorage.setItem('gclid_data', JSON.stringify({
        gclid,
        timestamp: Date.now(),
        expiresAt: Date.now() + EXPIRATION_MS
      }));
    } catch (e) {}
  };
  
  const addToForm = (form, gclid) => {
    if (!form || !gclid) return;
    let input = form.querySelector('input[name="gclid"]');
    
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'gclid';
      input.value = gclid;
      form.appendChild(input);
    } else if (input.value !== gclid) {
      input.value = gclid;
    }
  };
  
  const processedForms = new WeakSet();
  
  const processForms = (scope = document) => {
    const gclid = getGclid();
    if (!gclid) return;
    
    scope.querySelectorAll('form').forEach(form => {
      addToForm(form, gclid);
      processedForms.add(form);
    });
  };
  
  const init = () => {
    const urlGclid = new URLSearchParams(window.location.search).get('gclid');
    if (urlGclid) storeGclid(urlGclid);
    
    processForms();
    
    let debounceTimer;
    
    new MutationObserver((mutations) => {
      let hasNewForms = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || (node.querySelectorAll && node.querySelectorAll('form').length > 0)) {
              hasNewForms = true;
            }
          }
        });
      });
      
      if (!hasNewForms) return;
      
      const gclid = getGclid();
      if (!gclid) return;
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        document.querySelectorAll('form').forEach(form => {
          if (!processedForms.has(form)) {
            addToForm(form, gclid);
            processedForms.add(form);
          }
        });
      }, 100);
    }).observe(document.body, { childList: true, subtree: true });
  };
  
  return { init, processForms, getGclid };
})();

document.readyState === 'loading' 
  ? document.addEventListener('DOMContentLoaded', GclidTracker.init)
  : GclidTracker.init();

window.GclidTracker = GclidTracker;

