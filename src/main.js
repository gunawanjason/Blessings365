import './styles/index.css';
import { createSettingsPanel } from './components/SettingsPanel.js';
import { createScrollToTop } from './components/ScrollToTop.js';
import { renderDailyPage } from './pages/DailyPage.js';
import { renderComparePage } from './pages/ComparePage.js';
import { renderNotFoundPage } from './pages/NotFoundPage.js';
import { updateVerseFontSize } from './components/VerseDisplay.js';

// ===========================
// App Initialization
// ===========================

const app = document.getElementById('app');

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.dataset.theme = savedTheme;

// Create settings panel (global, persists across routes)
const settingsPanel = createSettingsPanel({
    onThemeChange: () => { },
    onFontSizeChange: (cls) => {
        // Delegated to active page via _onFontSizeChange
        if (settingsPanel._onFontSizeChange) settingsPanel._onFontSizeChange(cls);
    },
    onBoldCopyChange: () => { },
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
