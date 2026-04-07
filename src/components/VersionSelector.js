import { BIBLE_VERSIONS } from '../data/config.js';
import { setCookie, getCookie } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';

/**
 * Create a Bible version selector dropdown.
 * @param {Object} options
 * @param {string} options.id - element ID
 * @param {string} options.defaultVersion - default selected version
 * @param {boolean} options.showLabel - whether to show label
 * @param {string} options.label - label text
 * @param {boolean} options.useCookie - whether to persist selection to a cookie
 * @param {string} options.cookieName - cookie key to use (defaults to 'selectedVersion')
 * @param {Function} options.onChange - callback when version changes
 */
export function createVersionSelector({ id = 'translation-selector', defaultVersion = 'TB', showLabel = true, label = 'Version', useCookie = true, cookieName = 'selectedVersion', onChange } = {}) {
    const container = document.createElement('div');
    container.className = 'control-group';

    if (showLabel) {
        const labelEl = document.createElement('span');
        labelEl.className = 'control-label';
        labelEl.textContent = label;
        container.appendChild(labelEl);
    }

    const select = document.createElement('select');
    select.className = 'select-input';
    select.id = id;

    BIBLE_VERSIONS.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.value;
        opt.textContent = v.label;
        select.appendChild(opt);
    });

    // Restore saved version from cookie
    if (useCookie) {
        const saved = getCookie(cookieName);
        select.value = saved || defaultVersion;
    } else {
        select.value = defaultVersion;
    }

    select.addEventListener('change', () => {
        if (useCookie) setCookie(cookieName, select.value, 365);
        if (onChange) onChange(select.value);
        trackEvent('select_content', { content_type: 'bible_version', item_id: select.value });
    });

    container.appendChild(select);

    return {
        element: container,
        getValue: () => select.value,
        setValue: (val) => { select.value = val; },
    };
}
