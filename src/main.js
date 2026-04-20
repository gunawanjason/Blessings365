import './styles/index.css';
import { createSettingsPanel } from './components/SettingsPanel.js';
import { createScrollToTop } from './components/ScrollToTop.js';
import { renderDailyPage } from './pages/DailyPage.js';
import { renderComparePage } from './pages/ComparePage.js';
import { renderNotFoundPage } from './pages/NotFoundPage.js';
import { updateVerseFontSize } from './components/VerseDisplay.js';
import {
    shouldShowOnboarding,
    renderOnboarding,
    shouldShowWelcomeBack,
    renderWelcomeBack,
} from './components/Onboarding.js';

// ===========================
// App Initialization
// ===========================

const app = document.getElementById('app');

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.dataset.theme = savedTheme;

// Create settings panel (global, persists across routes)
const settingsPanel = createSettingsPanel({
    onThemeChange: () => {},
    onFontSizeChange: (cls) => {
        // Delegated to active page via _onFontSizeChange
        if (settingsPanel._onFontSizeChange) settingsPanel._onFontSizeChange(cls);
    },
    onBoldCopyChange: () => {},
    onReplayOnboarding: () => renderOnboarding(),
});

// Expose a hook for pages to intercept font size changes
settingsPanel._onFontSizeChange = null;

// Scroll to top button (global)
createScrollToTop();

// ===========================
// Hash-Based Router
// ===========================

function route() {
    const hash = window.location.hash || '#/';

    // Remove old action bars when navigating
    const oldActionBar = document.getElementById('action-bar');
    if (oldActionBar) oldActionBar.remove();

    // Reset font size change handler
    settingsPanel._onFontSizeChange = null;

    // Scroll to top on navigation
    window.scrollTo(0, 0);

    // Define valid routes
    const validRoutes = ['#/', '#/compare'];

    if (validRoutes.includes(hash)) {
        if (hash === '#/compare') {
            renderComparePage(app, settingsPanel);
        } else {
            renderDailyPage(app, settingsPanel);
        }
    } else {
        // Unknown route - show 404 page
        renderNotFoundPage(app);
    }
}

window.addEventListener('hashchange', route);

// Initial route
route();

// Global "open New Testament tab" handler.
// Fires from the onboarding completion, and retries until tabs are rendered
// (handles the race where verses are still loading when the user finishes).
function tryOpenNtTab(retriesLeft = 30) {
    const tabs = document.querySelectorAll('#verses-output .verse-tab-btn');
    if (tabs.length >= 2) {
        tabs[1].click();
        try {
            localStorage.removeItem('blessings365_start_with_nt');
        } catch {}
        return;
    }
    if (retriesLeft > 0) {
        setTimeout(() => tryOpenNtTab(retriesLeft - 1), 150);
    }
}
window.addEventListener('blessings365:open-nt', () => tryOpenNtTab());

// Show onboarding for first-time visitors; otherwise show the daily
// welcome-back reminder (PRAY / GROW frameworks) once per calendar day.
if (shouldShowOnboarding()) {
    renderOnboarding();
} else if (shouldShowWelcomeBack()) {
    renderWelcomeBack();
}
