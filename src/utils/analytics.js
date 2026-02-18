/**
 * Track a Google Analytics event.
 */
export function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        try {
            gtag('event', eventName, params);
        } catch (err) {
            console.warn('GA tracking failed:', err);
        }
    }
}
