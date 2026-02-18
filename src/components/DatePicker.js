import { MONTH_NAMES, getDaysInMonth, isLeapYear } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';

/**
 * Create a date picker (month + day dropdowns).
 * @param {Function} onChange - called with { month, day } when selection changes
 */
export function createDatePicker(onChange) {
    const container = document.createElement('div');
    container.className = 'control-group';

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // Month selector
    const monthLabel = document.createElement('span');
    monthLabel.className = 'control-label';
    monthLabel.textContent = 'Date';

    const monthSelect = document.createElement('select');
    monthSelect.className = 'select-input';
    monthSelect.id = 'month-selector';

    MONTH_NAMES.forEach((name, index) => {
        const opt = document.createElement('option');
        opt.value = index + 1;
        opt.textContent = name;
        monthSelect.appendChild(opt);
    });
    monthSelect.value = currentMonth;

    // Day selector
    const daySelect = document.createElement('select');
    daySelect.className = 'select-input';
    daySelect.id = 'day-selector';
    daySelect.style.minWidth = '60px';

    function fillDays() {
        const selectedMonth = parseInt(monthSelect.value);
        const maxDays = getDaysInMonth(selectedMonth, currentYear);
        daySelect.innerHTML = '';
        for (let i = 1; i <= maxDays; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            daySelect.appendChild(opt);
        }
    }

    fillDays();
    daySelect.value = currentDay;

    // Handle leap year Feb 29
    if (isLeapYear(currentYear) && currentMonth === 2 && currentDay === 29) {
        daySelect.value = 29;
    }

    monthSelect.addEventListener('change', () => {
        fillDays();
        onChange({ month: parseInt(monthSelect.value), day: parseInt(daySelect.value) });
        trackEvent('select_content', { content_type: 'date_month', item_id: monthSelect.value });
    });

    daySelect.addEventListener('change', () => {
        onChange({ month: parseInt(monthSelect.value), day: parseInt(daySelect.value) });
        trackEvent('select_content', { content_type: 'date_day', item_id: daySelect.value });
    });

    container.appendChild(monthLabel);
    container.appendChild(monthSelect);
    container.appendChild(daySelect);

    return {
        element: container,
        getDate: () => ({ month: parseInt(monthSelect.value), day: parseInt(daySelect.value) }),
    };
}
