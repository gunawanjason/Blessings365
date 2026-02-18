/**
 * Create the scroll-to-top button.
 * Listens to both window scroll and internal panel scrolls (compare view).
 */
export function createScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn';
    btn.id = 'scroll-top-btn';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;

    let hideTimeout;

    function showButton() {
        if (hideTimeout) clearTimeout(hideTimeout);
        btn.classList.add('scroll-top-btn--visible');
        hideTimeout = setTimeout(() => {
            btn.classList.remove('scroll-top-btn--visible');
        }, 3000);
    }

    function hideButton() {
        if (hideTimeout) clearTimeout(hideTimeout);
        btn.classList.remove('scroll-top-btn--visible');
    }

    // Check if we're in mobile compare view (panels exist and are scrollable)
    function isInMobileCompareView() {
        const panels = document.querySelectorAll('.compare-panel');
        if (panels.length === 0) return false;
        // Check if any panel has scrollable content
        return Array.from(panels).some(panel => panel.scrollHeight > panel.clientHeight);
    }

    // Window scroll (read view) - also checks panels for mobile compare view
    window.addEventListener('scroll', () => {
        const windowScrolled = document.documentElement.scrollTop > 200;

        // In mobile compare view, also check panel scroll positions
        let panelScrolled = false;
        if (isInMobileCompareView()) {
            document.querySelectorAll('.compare-panel').forEach(panel => {
                if (panel.scrollTop > 100) {
                    panelScrolled = true;
                }
            });
        }

        if (windowScrolled || panelScrolled) {
            showButton();
        } else {
            hideButton();
        }
    });

    // Function to bind scroll listeners to compare panels
    function bindPanelScrollListeners() {
        document.querySelectorAll('.compare-panel').forEach(panel => {
            if (!panel._scrollToTopBound) {
                panel._scrollToTopBound = true;
                panel.addEventListener('scroll', () => {
                    if (panel.scrollTop > 100) {
                        showButton();
                    } else {
                        hideButton();
                    }
                });
            }
        });
    }

    // Initial bind
    bindPanelScrollListeners();

    // Panel scroll (compare view — panels scroll internally)
    const observer = new MutationObserver(() => {
        bindPanelScrollListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    /**
     * Custom smooth scroll animation for elements.
     * Uses requestAnimationFrame + easeOutCubic for a smooth feel
     * without relying on native scroll-behavior (which breaks sync).
     */
    function smoothScrollToTop(elements, duration = 400) {
        const startTops = Array.from(elements).map(el => el.scrollTop);
        const startTime = performance.now();

        // Signal panels to pause sync during animation
        elements.forEach(el => { el._animatingScroll = true; });

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic: fast start, gentle deceleration
            const ease = 1 - Math.pow(1 - progress, 3);

            elements.forEach((el, i) => {
                el.scrollTop = startTops[i] * (1 - ease);
            });

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Ensure we land exactly at 0 and re-enable sync
                elements.forEach(el => {
                    el.scrollTop = 0;
                    el._animatingScroll = false;
                });
            }
        }

        requestAnimationFrame(step);
    }

    btn.addEventListener('click', () => {
        // Check if we're in mobile compare view
        const panels = document.querySelectorAll('.compare-panel');
        const hasPanels = panels.length > 0;

        if (hasPanels) {
            // Mobile compare view: animate both panels in lockstep
            smoothScrollToTop(panels, 400);
            // Also scroll window to ensure complete reset
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else {
            // Regular view: scroll window with smooth animation
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        hideButton();
    });

    document.body.appendChild(btn);
    return btn;
}
