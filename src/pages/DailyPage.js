import { renderHeader } from '../components/Header.js';
import { createBottomNav } from '../components/BottomNav.js';
import { createDatePicker } from '../components/DatePicker.js';
import { createVersionSelector } from '../components/VersionSelector.js';
import { renderVerses, showLoading, showError, updateVerseFontSize } from '../components/VerseDisplay.js';
import { createVerseSelection } from '../components/VerseSelection.js';
import { fetchDayData } from '../utils/api.js';
import { dayOfYear, MONTH_NAMES } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';

/**
 * Render the Daily Reading page.
 */
export function renderDailyPage(app, settingsPanel) {
    app.innerHTML = '';

    // Header
    const header = renderHeader('daily', () => settingsPanel.open());
    app.appendChild(header);

    // Main content wrapper
    const main = document.createElement('main');
    main.className = 'app-container';

    // Controls bar — clean, centered (date + version only)
    const controlsBar = document.createElement('div');
    controlsBar.className = 'controls-bar';

    const datePicker = createDatePicker(handleDateChange);
    const versionSelector = createVersionSelector({
        onChange: () => loadVerses(),
    });

    controlsBar.appendChild(datePicker.element);
    controlsBar.appendChild(versionSelector.element);
    main.appendChild(controlsBar);

    // Verses container
    const versesContainer = document.createElement('div');
    versesContainer.id = 'verses-output';
    versesContainer.style.paddingBottom = 'var(--space-2xl)';
    main.appendChild(versesContainer);

    app.appendChild(main);

    // Bottom Navigation (Mobile)
    const bottomNav = createBottomNav('daily');
    app.appendChild(bottomNav);

    // Verse selection manager
    const verseSelection = createVerseSelection(
        () => versionSelector.getValue(),
        () => settingsPanel.getBoldCopyEnabled(),
    );
    verseSelection.init();

    // Load the reading plan data
    let readingPlanData = null;

    async function init() {
        try {
            const response = await fetch('/Translated_Bacaan_Alkitab_365.json');
            readingPlanData = await response.json();
            loadVerses();
        } catch (error) {
            console.error('Error loading reading plan:', error);
            showError(versesContainer, 'Error loading reading plan. Please refresh the page.');
        }
    }

    function handleDateChange() {
        loadVerses();
    }

    async function loadVerses() {
        if (!readingPlanData) return;

        const { month, day } = datePicker.getDate();
        const translation = versionSelector.getValue();
        const date = new Date(new Date().getFullYear(), month - 1, day);
        const dayIndex = dayOfYear(date);
        const versesString = readingPlanData[dayIndex]?.join(',');

        if (!versesString) {
            showError(versesContainer, 'No readings found for this date.');
            return;
        }

        showLoading(versesContainer);
        verseSelection.clearSelection();

        try {
            const { versesData, headingsMap } = await fetchDayData(translation, versesString);
            const fontSizeClass = settingsPanel.getFontSizeClass();

            renderVerses(
                versesContainer,
                versesData,
                translation,
                headingsMap,
                fontSizeClass,
                (verseLine) => verseSelection.handleVerseClick(verseLine),
                'daily-verses',
                'tabs'
            );

        } catch (error) {
            console.error('Error fetching verses:', error);
            showError(versesContainer);
        }
    }

    // Listen for font size changes from settings
    const originalOnFontSize = settingsPanel._onFontSizeChange;
    settingsPanel._onFontSizeChange = (cls) => {
        updateVerseFontSize(versesContainer, cls);
        if (originalOnFontSize) originalOnFontSize(cls);
    };

    init();

    // Engagement heartbeat
    setInterval(() => {
        if (!document.hidden) {
            trackEvent('user_heartbeat', {
                event_category: 'engagement',
                event_label: 'active_tab',
                non_interaction: true,
            });
        }
    }, 30000);

    return { loadVerses };
}
