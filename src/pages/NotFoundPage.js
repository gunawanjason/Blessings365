import '../styles/components/not-found.css';
import { renderHeader } from '../components/Header.js';
import { createBottomNav } from '../components/BottomNav.js';
import { trackEvent } from '../utils/analytics.js';

/**
 * Render the 404 Not Found page.
 */
export function renderNotFoundPage(app) {
    app.innerHTML = '';

    // Header
    const header = renderHeader('404', () => {});
    app.appendChild(header);

    // Main content
    const main = document.createElement('main');
    main.className = 'app-container';

    const notFoundContent = document.createElement('div');
    notFoundContent.className = 'not-found-container';
    notFoundContent.innerHTML = `
        <div class="not-found-content">
            <h1 class="not-found-title">404</h1>
            <p class="not-found-message">Halaman tidak ditemukan</p>
            <p class="not-found-subtitle">The page you're looking for doesn't exist.</p>
            <a href="#/" class="not-found-button">Kembali ke Halaman Utama</a>
        </div>
    `;

    main.appendChild(notFoundContent);
    app.appendChild(main);

    // Bottom Navigation
    const bottomNav = createBottomNav('daily');
    app.appendChild(bottomNav);

    // Track 404 event
    trackEvent('404', {
        hash: window.location.hash,
        path: window.location.pathname
    });
}
