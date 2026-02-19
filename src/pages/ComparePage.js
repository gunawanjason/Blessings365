import { renderHeader } from '../components/Header.js';
import { createBottomNav } from '../components/BottomNav.js';
import { createDatePicker } from '../components/DatePicker.js';
import { createVersionSelector } from '../components/VersionSelector.js';
import { renderVerses, showLoading, showError, updateVerseFontSize, balanceHeights } from '../components/VerseDisplay.js';
import { createVerseSelection } from '../components/VerseSelection.js';
import { fetchDayData } from '../utils/api.js';
import { dayOfYear } from '../utils/helpers.js';
import { syncComparisons } from '../utils/comparisonSync.js';
import { getTranslatedBookName } from '../data/bookNames.js';

/**
 * Render the Compare page.
 */
export function renderComparePage(app, settingsPanel) {
    app.innerHTML = '';

    // Header
    const header = renderHeader('compare', () => settingsPanel.open());
    app.appendChild(header);

    // Main content wrapper
    const main = document.createElement('main');
    main.className = 'app-container app-container--wide';

    // Header section (Title + Controls)
    const pageHeader = document.createElement('div');
    pageHeader.className = 'compare-header';

    const title = document.createElement('h1');
    title.className = 'page-title';
    title.textContent = 'Compare Versions';
    pageHeader.appendChild(title);

    const controlsBar = document.createElement('div');
    controlsBar.className = 'compare-controls';

    const datePicker = createDatePicker(handleDateChange);
    controlsBar.appendChild(datePicker.element);

    const versionGroup = document.createElement('div');
    versionGroup.className = 'compare-controls__versions';

    const versionSelector1 = createVersionSelector({
        id: 'translation-1',
        defaultVersion: 'ESV',
        label: 'V1',
        showLabel: false,
        useCookie: false,
        onChange: () => loadBoth(),
    });

    const versionSelector2 = createVersionSelector({
        id: 'translation-2',
        defaultVersion: 'TB',
        label: 'V2',
        showLabel: false,
        useCookie: false,
        onChange: () => loadBoth(),
    });

    versionGroup.appendChild(versionSelector1.element);
    versionGroup.appendChild(versionSelector2.element);
    controlsBar.appendChild(versionGroup);

    pageHeader.appendChild(controlsBar);
    main.appendChild(pageHeader);



    // Compare grid
    const grid = document.createElement('div');
    grid.className = 'compare-grid';

    // Panel 1
    const panel1 = document.createElement('div');
    panel1.className = 'compare-panel';
    const panelHeader1 = document.createElement('div');
    panelHeader1.className = 'compare-panel__header';
    panelHeader1.id = 'panel-header-1';
    panelHeader1.innerHTML = `<span class="compare-panel__translation">ESV</span><span class="compare-panel__book" id="panel-book-1"></span>`;
    panel1.appendChild(panelHeader1);
    const versesContainer1 = document.createElement('div');
    versesContainer1.id = 'verses-output-1';
    panel1.appendChild(versesContainer1);

    // Panel 2
    const panel2 = document.createElement('div');
    panel2.className = 'compare-panel';
    const panelHeader2 = document.createElement('div');
    panelHeader2.className = 'compare-panel__header';
    panelHeader2.id = 'panel-header-2';
    panelHeader2.innerHTML = `<span class="compare-panel__translation">TB</span><span class="compare-panel__book" id="panel-book-2"></span>`;
    panel2.appendChild(panelHeader2);
    const versesContainer2 = document.createElement('div');
    versesContainer2.id = 'verses-output-2';
    panel2.appendChild(versesContainer2);

    grid.appendChild(panel1);
    grid.appendChild(panel2);
    main.appendChild(grid);

    app.appendChild(main);

    // --- Persistent Edge Tab (Mobile) ---
    const edgeTab = document.createElement('div');
    edgeTab.className = 'compare-edge-tab';
    edgeTab.innerHTML = `<span class="compare-edge-tab__label"></span><span class="compare-edge-tab__chevron">›</span>`;
    app.appendChild(edgeTab);

    // Mobile Swipe Indicators (Dots)
    const indicators = document.createElement('div');
    indicators.className = 'compare-indicators';
    indicators.innerHTML = `
        <div class="compare-dot active" data-index="0"></div>
        <div class="compare-dot" data-index="1"></div>
    `;
    app.appendChild(indicators);

    /** Update the edge tab label & position based on which panel is showing */
    function updateEdgeTab(panelIndex) {
        const label = edgeTab.querySelector('.compare-edge-tab__label');
        const chevron = edgeTab.querySelector('.compare-edge-tab__chevron');
        if (panelIndex === 0) {
            label.textContent = versionSelector2.getValue();
            chevron.textContent = '›';
            edgeTab.classList.remove('left');
        } else {
            label.textContent = versionSelector1.getValue();
            chevron.textContent = '‹';
            edgeTab.classList.add('left');
        }
    }
    updateEdgeTab(0);

    // --- Auto-hide: collapse after 3s idle, expand on interaction ---
    let hideTimer = null;
    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => edgeTab.classList.add('collapsed'), 3000);
    }
    function expandTab() {
        edgeTab.classList.remove('collapsed');
        scheduleHide();
    }
    // Start the first auto-hide countdown
    scheduleHide();

    // --- Vertical drag to reposition ---
    let dragStartY = 0;
    let dragStartTop = 0;
    let isDragging = false;
    const DRAG_THRESHOLD = 6; // px — less than this is a tap

    edgeTab.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        dragStartY = touch.clientY;
        dragStartTop = edgeTab.getBoundingClientRect().top;
        isDragging = false;
        edgeTab.classList.add('dragging');
    }, { passive: true });

    edgeTab.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const dy = touch.clientY - dragStartY;
        if (Math.abs(dy) > DRAG_THRESHOLD) {
            isDragging = true;
            // Clamp within safe bounds (below header, above bottom nav)
            const minTop = 80;
            const maxTop = window.innerHeight - 80;
            const newTop = Math.min(maxTop, Math.max(minTop, dragStartTop + dy));
            edgeTab.style.top = newTop + 'px';
        }
        e.preventDefault();
    }, { passive: false });

    edgeTab.addEventListener('touchend', (e) => {
        edgeTab.classList.remove('dragging');
        if (!isDragging) {
            // It was a tap
            if (edgeTab.classList.contains('collapsed')) {
                // Collapsed → just expand it
                expandTab();
            } else {
                // Expanded → switch to the other panel
                const currentIndex = Math.round(grid.scrollLeft / grid.clientWidth);
                const targetIndex = currentIndex === 0 ? 1 : 0;
                grid.scrollTo({ left: targetIndex * grid.clientWidth, behavior: 'smooth' });
            }
        }
        scheduleHide();
    });

    // Also handle mouse click for non-touch (desktop testing)
    edgeTab.addEventListener('click', (e) => {
        if (edgeTab.classList.contains('collapsed')) {
            expandTab();
        } else {
            const currentIndex = Math.round(grid.scrollLeft / grid.clientWidth);
            const targetIndex = currentIndex === 0 ? 1 : 0;
            grid.scrollTo({ left: targetIndex * grid.clientWidth, behavior: 'smooth' });
        }
    });

    // Bottom Navigation (Mobile)
    const bottomNav = createBottomNav('compare');
    app.appendChild(bottomNav);

    // Sync dots + edge tab with scroll; expand tab on horizontal swipe
    grid.addEventListener('scroll', () => {
        const index = Math.round(grid.scrollLeft / grid.clientWidth);
        indicators.querySelectorAll('.compare-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        updateEdgeTab(index);
        expandTab();
    });

    // Sync vertical scroll between panels
    // On mobile, we only sync from the *active* panel to the hidden one to avoid
    // fighting the native momentum scroll or creating loops.
    let isSyncing = false;
    function syncScroll(source, target) {
        if (isSyncing) return;

        // Mobile check: only sync if the source panel is currently the visible one
        if (window.innerWidth <= 768) {
            const currentIndex = Math.round(grid.scrollLeft / grid.clientWidth);
            // panel1 is index 0, panel2 is index 1
            const sourceIndex = (source === panel1) ? 0 : 1;
            if (currentIndex !== sourceIndex) return;
        }

        // Skip sync during animated scroll-to-top (both panels animate in lockstep)
        if (source._animatingScroll || target._animatingScroll) return;

        isSyncing = true;
        target.scrollTop = source.scrollTop;
        isSyncing = false;
    }

    // Enable scroll sync for both desktop and mobile
    panel1.addEventListener('scroll', () => syncScroll(panel1, panel2));
    panel2.addEventListener('scroll', () => syncScroll(panel2, panel1));

    // Verse selection manager
    const verseSelection = createVerseSelection(
        () => versionSelector1.getValue(),
        () => settingsPanel.getBoldCopyEnabled(),
        { simpleText: true }
    );
    verseSelection.init();

    // Load reading plan data
    let readingPlanData = null;

    async function init() {
        try {
            const response = await fetch('/Translated_Bacaan_Alkitab_365.json');
            readingPlanData = await response.json();
            loadBoth();
        } catch (error) {
            console.error('Error loading reading plan:', error);
            showError(versesContainer1, 'Error loading reading plan.');
        }
    }

    function handleDateChange() {
        loadBoth();
    }

    async function loadBoth() {
        if (!readingPlanData) return;

        const { month, day } = datePicker.getDate();
        const date = new Date(new Date().getFullYear(), month - 1, day);
        const dayIndex = dayOfYear(date);
        const versesString = readingPlanData[dayIndex]?.join(',');

        if (!versesString) {
            showError(versesContainer1, 'No readings found.');
            showError(versesContainer2, 'No readings found.');
            return;
        }

        const translation1 = versionSelector1.getValue();
        const translation2 = versionSelector2.getValue();

        // Update translation names in headers
        const transSpan1 = panelHeader1.querySelector('.compare-panel__translation');
        const transSpan2 = panelHeader2.querySelector('.compare-panel__translation');
        if (transSpan1) transSpan1.textContent = translation1;
        if (transSpan2) transSpan2.textContent = translation2;

        // Refresh edge tab label with new translations
        const currentPanel = Math.round(grid.scrollLeft / grid.clientWidth);
        updateEdgeTab(currentPanel);

        // Clear book names until a tab is selected
        const bookSpan1 = document.getElementById('panel-book-1');
        const bookSpan2 = document.getElementById('panel-book-2');
        if (bookSpan1) bookSpan1.textContent = '';
        if (bookSpan2) bookSpan2.textContent = '';

        showLoading(versesContainer1);
        showLoading(versesContainer2);
        verseSelection.clearSelection();

        const fontSizeClass = settingsPanel.getFontSizeClass();

        try {
            const [data1, data2] = await Promise.all([
                fetchDayData(translation1, versesString),
                fetchDayData(translation2, versesString),
            ]);

            // Synchronize verses and headings for alignment
            const [aligned1, aligned2] = syncComparisons(
                data1.versesData, data1.headingsMap,
                data2.versesData, data2.headingsMap
            );

            renderVerses(versesContainer1, aligned1, translation1, null, fontSizeClass,
                (vl) => verseSelection.handleVerseClick(vl), 'v1', 'tabs', (book) => {
                    updatePanelBookName(1, book, translation1);
                    syncTabs(versesContainer2, book);
                    balanceHeights(versesContainer1, versesContainer2);
                });
            injectTranslationBadge(versesContainer1, translation1);

            renderVerses(versesContainer2, aligned2, translation2, null, fontSizeClass,
                (vl) => verseSelection.handleVerseClick(vl), 'v2', 'tabs', (book) => {
                    updatePanelBookName(2, book, translation2);
                    syncTabs(versesContainer1, book);
                    balanceHeights(versesContainer1, versesContainer2);
                });
            injectTranslationBadge(versesContainer2, translation2);

            // Initial balance
            setTimeout(() => {
                balanceHeights(versesContainer1, versesContainer2);
            }, 50);

        } catch (error) {
            console.error('Error fetching comparison data:', error);
            showError(versesContainer1);
            showError(versesContainer2);
        }
    }

    /**
     * Inject a translation badge as the first child of the tab bar wrapper.
     */
    function injectTranslationBadge(container, translationName) {
        const navWrap = container.querySelector('.verse-tabs__nav-wrap');
        if (!navWrap) return;

        // Remove any existing badge first
        const existing = navWrap.querySelector('.compare-tab-badge');
        if (existing) existing.remove();

        const badge = document.createElement('div');
        badge.className = 'compare-tab-badge';
        badge.textContent = translationName;

        // Insert before the nav list
        navWrap.insertBefore(badge, navWrap.firstChild);
    }

    /**
     * Update the book name displayed in the panel header.
     */
    function updatePanelBookName(panelNum, bookName, translation) {
        const bookSpan = document.getElementById(`panel-book-${panelNum}`);
        if (bookSpan) {
            const translatedBook = getTranslatedBookName(bookName, translation);
            bookSpan.textContent = translatedBook;
        }
    }

    /**
     * Programmatically switch the tab in a target container to match the book.
     * On mobile, we prevent the scrollIntoView to avoid horizontal scroll jump.
     */
    function syncTabs(targetContainer, bookName) {
        // Find the button with the matching data-book attribute
        const btn = targetContainer.querySelector(`.verse-tab-btn[data-book="${bookName}"]`);
        if (btn && !btn.classList.contains('active')) {
            // On mobile, prevent scrollIntoView from causing horizontal scroll
            const isMobile = window.innerWidth <= 768;

            // Temporarily disable scroll behavior
            const nav = btn.closest('.verse-tabs__nav');
            if (isMobile && nav) {
                const originalScrollBehavior = nav.style.scrollBehavior;
                nav.style.scrollBehavior = 'auto';

                // Click the button
                btn.click();

                // Restore scroll behavior after a short delay
                setTimeout(() => {
                    nav.style.scrollBehavior = originalScrollBehavior;
                }, 100);
            } else {
                btn.click();
            }
        }
    }

    // Listen for font size changes
    const originalOnFontSize = settingsPanel._onFontSizeChange;
    settingsPanel._onFontSizeChange = (cls) => {
        updateVerseFontSize(versesContainer1, cls);
        updateVerseFontSize(versesContainer2, cls);
        if (originalOnFontSize) originalOnFontSize(cls);
        // Re-balance after font change
        setTimeout(() => balanceHeights(versesContainer1, versesContainer2), 50);
    };

    // Auto-balance heights on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            balanceHeights(versesContainer1, versesContainer2);
        }, 100);
    });

    init();
}
