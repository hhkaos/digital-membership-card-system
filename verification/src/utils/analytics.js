let initialized = false;
let scriptInjected = false;

/**
 * Initialize Google Analytics (GA4) if enabled in config.
 * Injects the official Google tag (gtag.js) snippet when
 * analytics.enabled === true and a valid measurementId is provided.
 */
export function initAnalytics(config) {
  if (initialized) return;
  if (!config.analytics?.enabled || !config.analytics?.measurementId) return;

  const measurementId = config.analytics.measurementId;

  // Inject the Google tag script (only in browser)
  if (typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    scriptInjected = true;
  }

  // Initialize dataLayer and gtag function (matches Google's official snippet)
  globalThis.dataLayer = globalThis.dataLayer || [];
  function gtag() { globalThis.dataLayer.push(arguments); }
  globalThis.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });

  initialized = true;
}

/**
 * Track a page view event.
 */
export function trackPageView() {
  if (!initialized || !globalThis.gtag) return;
  globalThis.gtag('event', 'page_view');
}

/**
 * Track a verification result event.
 * @param {'valid'|'invalid_signature'|'invalid_expired'|'invalid_revoked'|'invalid_no_token'|'invalid_config_error'} outcome
 */
export function trackVerificationResult(outcome) {
  if (!initialized || !globalThis.gtag) return;
  globalThis.gtag('event', 'verification_result', { outcome });
}

/** @internal For testing only: reset module state */
export function _resetForTesting() {
  initialized = false;
  scriptInjected = false;
  delete globalThis.gtag;
  delete globalThis.dataLayer;
}

/** @internal For testing only: check if script was injected */
export function _wasScriptInjected() {
  return scriptInjected;
}
