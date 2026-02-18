import { trackEvent } from '../utils/analytics.js';

/**
 * Render the header/navbar.
 * @param {string} activePage - 'daily' or 'compare'
 * @param {Function} onSettingsClick - callback when settings button is clicked
 */
export function renderHeader(activePage, onSettingsClick) {
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header__inner">
      <a href="#/" class="header__brand"><img src="/assets/bcc.ico" alt="BCC Logo" class="header__logo" />Blessings<span class="header__brand-accent">365</span></a>
      <div class="header__actions">
        <a href="#/" class="header__nav-link ${activePage === 'daily' ? 'header__nav-link--active' : ''}" ${activePage === 'daily' ? 'aria-current="page"' : ''}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Read
        </a>
        <a href="#/compare" class="header__nav-link ${activePage === 'compare' ? 'header__nav-link--active' : ''}" ${activePage === 'compare' ? 'aria-current="page"' : ''}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Compare
        </a>
        <button class="icon-btn" id="settings-btn" aria-label="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
            <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"></circle>
            <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"></circle>
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"></circle>
          </svg>
        </button>
      </div>
    </div>
  `;

  header.querySelector('#settings-btn').addEventListener('click', () => {
    onSettingsClick();
    trackEvent('toggle_settings', { ui_element: 'settings_button' });
  });

  return header;
}
