/**
 * Render the bottom navigation bar for mobile.
 * @param {string} activePage - 'daily' or 'compare'
 */
export function createBottomNav(activePage) {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
    <div class="bottom-nav__inner">
      <a href="#/" class="bottom-nav__item ${activePage === 'daily' ? 'bottom-nav__item--active' : ''}" ${activePage === 'daily' ? 'aria-current="page"' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        <span>Read</span>
      </a>
      <a href="#/compare" class="bottom-nav__item ${activePage === 'compare' ? 'bottom-nav__item--active' : ''}" ${activePage === 'compare' ? 'aria-current="page"' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Compare</span>
      </a>
    </div>
  `;
    return nav;
}
