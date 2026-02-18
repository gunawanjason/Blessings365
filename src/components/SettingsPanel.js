import { trackEvent } from '../utils/analytics.js';

/**
 * Create the settings panel (slide-out drawer).
 * @param {Object} options
 * @param {Function} options.onThemeChange - called with 'light' or 'dark'
 * @param {Function} options.onFontSizeChange - called with 'verse-line--small' | 'verse-line--medium' | 'verse-line--large'
 * @param {Function} options.onBoldCopyChange - called with boolean
 */
export function createSettingsPanel({ onThemeChange, onFontSizeChange, onBoldCopyChange }) {
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.id = 'settings-overlay';

  // Panel
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.id = 'settings-panel';

  panel.innerHTML = `
    <div class="settings-panel__header">
      <h2 class="settings-panel__title">Reader settings</h2>
      <button class="settings-panel__close" id="settings-close" aria-label="Close settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <div class="settings-panel__body">
      <!-- Font Size -->
      <div class="setting-row setting-row--column">
         <div class="setting-start">
             <span class="setting-label">Font size</span>
         </div>
         <div class="font-control">
             <div class="font-slider-container">
                <input type="range" min="1" max="3" value="2" step="1" class="font-slider__input" id="font-slider" />
             </div>
             <div class="font-labels">
               <button class="font-btn" data-size="1">
                 <span class="font-btn__icon" style="font-size: 0.85em">Aa</span>
                 <span class="font-btn__text">Small</span>
               </button>
               <button class="font-btn" data-size="2">
                 <span class="font-btn__icon" style="font-size: 1em">Aa</span>
                 <span class="font-btn__text">Medium</span>
               </button>
               <button class="font-btn" data-size="3">
                 <span class="font-btn__icon" style="font-size: 1.25em">Aa</span>
                 <span class="font-btn__text">Large</span>
               </button>
             </div>
         </div>
      </div>

      <!-- Appearance -->
      <div class="setting-row">
        <span class="setting-label">Appearance</span>
        <div class="setting-end">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
           <label class="toggle toggle--inline">
            <input type="checkbox" id="theme-toggle" />
            <span class="toggle__track"></span>
           </label>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </div>
      </div>
      
      <!-- Copy Format -->
      <div class="setting-row">
        <span class="setting-label">Copy Format</span>
        <div class="setting-end">
           <span class="format-icon">Aa</span>
           <label class="toggle toggle--inline">
            <input type="checkbox" id="bold-copy-toggle" checked />
            <span class="toggle__track"></span>
           </label>
           <span class="format-icon format-icon--bold">Aa</span>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="settings-panel__footer">
        <p>Blessings365</p>
        <p>Made with &hearts; for daily reading</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Elements
  const themeToggle = panel.querySelector('#theme-toggle');
  const fontSlider = panel.querySelector('#font-slider');
  const boldToggle = panel.querySelector('#bold-copy-toggle');
  const closeBtn = panel.querySelector('#settings-close');
  const fontBtns = panel.querySelectorAll('.font-btn');

  // Load saved settings
  const savedTheme = localStorage.getItem('theme') || 'light';
  themeToggle.checked = savedTheme === 'dark';
  document.documentElement.dataset.theme = savedTheme;

  const fontSizeMap = { 1: 'verse-line--small', 2: 'verse-line--medium', 3: 'verse-line--large' };
  const reverseMap = { 'verse-line--small': '1', 'verse-line--medium': '2', 'verse-line--large': '3' };
  const savedFontSize = localStorage.getItem('fontSize') || 'verse-line--medium';
  fontSlider.value = reverseMap[savedFontSize] || '2';
  updateActiveFontBtn(fontSlider.value);

  const savedBoldCopy = localStorage.getItem('boldCopy');
  boldToggle.checked = savedBoldCopy !== 'false';

  // Event listeners
  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    if (onThemeChange) onThemeChange(theme);
    trackEvent('change_setting', { setting_type: 'theme', setting_value: theme });
  });

  fontSlider.addEventListener('input', () => {
    updateFontSize(fontSlider.value);
  });

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      fontSlider.value = size;
      updateFontSize(size);
    });
  });

  function updateFontSize(val) {
    const cls = fontSizeMap[val];
    localStorage.setItem('fontSize', cls);
    if (onFontSizeChange) onFontSizeChange(cls);
    updateActiveFontBtn(val);
    trackEvent('change_setting', { setting_type: 'font_size', setting_value: cls });
  }

  function updateActiveFontBtn(val) {
    fontBtns.forEach(b => {
      if (b.dataset.size === val) b.classList.add('font-btn--active');
      else b.classList.remove('font-btn--active');
    });
  }

  boldToggle.addEventListener('change', () => {
    localStorage.setItem('boldCopy', boldToggle.checked.toString());
    if (onBoldCopyChange) onBoldCopyChange(boldToggle.checked);
    trackEvent('change_setting', { setting_type: 'bold_copy', setting_value: boldToggle.checked });
  });

  // Open/close
  function open() {
    const btn = document.getElementById('settings-btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const top = rect.bottom + 8; // 8px gap
      const right = window.innerWidth - rect.right; // Align right edges
      panel.style.top = `${top}px`;
      panel.style.right = `${right}px`;
    }

    overlay.classList.add('settings-overlay--visible');
    panel.classList.add('settings-panel--open');
  }

  function close() {
    overlay.classList.remove('settings-overlay--visible');
    panel.classList.remove('settings-panel--open');
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  return {
    open,
    close,
    getTheme: () => themeToggle.checked ? 'dark' : 'light',
    getFontSizeClass: () => fontSizeMap[fontSlider.value] || 'verse-line--medium',
    getBoldCopyEnabled: () => boldToggle.checked,
  };
}
