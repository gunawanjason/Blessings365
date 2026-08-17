import { renderHeader } from '../components/Header.js';
import { createBottomNav } from '../components/BottomNav.js';
import { createDatePicker } from '../components/DatePicker.js';
import { createVersionSelector } from '../components/VersionSelector.js';
import {
    renderVerses,
    showLoading,
    showError,
    updateVerseFontSize,
    balanceHeights,
} from '../components/VerseDisplay.js';
import { createVerseSelection } from '../components/VerseSelection.js';
import { fetchDayData } from '../utils/api.js';
import { dayOfYear } from '../utils/helpers.js';
import { syncComparisonGroup } from '../utils/comparisonSync.js';
import { getTranslatedBookName } from '../data/bookNames.js';

const MOBILE_BREAKPOINT = '(max-width: 768px)';
const TABLET_BREAKPOINT = '(min-width: 769px) and (max-width: 1023px)';

/** Render the Compare page. */
export function renderComparePage(app, settingsPanel) {
    app.innerHTML = '';

    const mobileMedia = window.matchMedia(MOBILE_BREAKPOINT);
    const tabletMedia = window.matchMedia(TABLET_BREAKPOINT);
    const header = renderHeader('compare', () => settingsPanel.toggle());
    app.appendChild(header);

    const main = document.createElement('main');
    main.className = 'app-container app-container--wide';

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

    const selectorOptions = [
        { id: 'translation-1', defaultVersion: 'NIV', cookieName: 'compareVersion1' },
        { id: 'translation-2', defaultVersion: 'TB', cookieName: 'compareVersion2' },
        { id: 'translation-3', defaultVersion: 'ESV', cookieName: 'compareVersion3' },
    ];
    const versionSelectors = selectorOptions.map((options, index) => {
        const selector = createVersionSelector({
            ...options,
            label: `V${index + 1}`,
            showLabel: false,
            useCookie: true,
            onChange: () => loadComparisons(),
        });
        versionGroup.appendChild(selector.element);
        return selector;
    });

    const panelCountHint = document.createElement('div');
    panelCountHint.className = 'control-group compare-panel-count-hint';
    panelCountHint.innerHTML = `
        <button type="button" class="compare-panel-count-hint__button" aria-label="Enable three comparison panels" title="Compare up to three translations">
            <span class="compare-panel-count-hint__plus" aria-hidden="true">+</span>
            <span>3 panels</span>
        </button>
    `;
    panelCountHint.querySelector('button').addEventListener('click', () => {
        settingsPanel.setComparePanelCount(3);
    });
    versionGroup.appendChild(panelCountHint);

    controlsBar.appendChild(versionGroup);
    pageHeader.appendChild(controlsBar);
    main.appendChild(pageHeader);

    const grid = document.createElement('div');
    grid.className = 'compare-grid';

    const panels = [];
    const panelHeaders = [];
    const verseContainers = [];

    versionSelectors.forEach((selector, index) => {
        const panelNumber = index + 1;
        const panel = document.createElement('div');
        panel.className = 'compare-panel';
        const panelHeader = document.createElement('div');
        panelHeader.className = 'compare-panel__header';
        panelHeader.id = `panel-header-${panelNumber}`;
        panelHeader.innerHTML = `<span class="compare-panel__translation">${selector.getValue()}</span><span class="compare-panel__book" id="panel-book-${panelNumber}"></span>`;

        const versesContainer = document.createElement('div');
        versesContainer.id = `verses-output-${panelNumber}`;
        versesContainer.className = 'compare-panel__verses';

        panel.appendChild(panelHeader);
        panel.appendChild(versesContainer);
        grid.appendChild(panel);

        panels.push(panel);
        panelHeaders.push(panelHeader);
        verseContainers.push(versesContainer);
    });

    main.appendChild(grid);
    app.appendChild(main);

    const createEdgeTab = (direction) => {
        const edgeTab = document.createElement('div');
        edgeTab.className = `compare-edge-tab compare-edge-tab--${direction}`;
        edgeTab.setAttribute('role', 'button');
        edgeTab.setAttribute('tabindex', '0');
        edgeTab.innerHTML = `<span class="compare-edge-tab__label"></span><span class="compare-edge-tab__chevron">${direction === 'previous' ? '‹' : '›'}</span>`;
        app.appendChild(edgeTab);
        return edgeTab;
    };

    const previousEdgeTab = createEdgeTab('previous');
    const nextEdgeTab = createEdgeTab('next');
    const edgeTabs = [previousEdgeTab, nextEdgeTab];

    const indicators = document.createElement('div');
    indicators.className = 'compare-indicators';
    indicators.setAttribute('aria-label', 'Translation position');
    indicators.innerHTML = versionSelectors
        .map(
            (_, index) =>
                `<div class="compare-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
        )
        .join('');
    app.appendChild(indicators);

    const bottomNav = createBottomNav('compare');
    app.appendChild(bottomNav);

    let hideTimer = null;
    let readingPlanData = null;
    let loadSequence = 0;
    let balanceTimer = null;
    let balanceFrame = null;
    let breakpointTimer = null;
    let resizeHintTimer = null;
    let isDisposed = false;

    function getActivePanelCount() {
        return settingsPanel.getComparePanelCount();
    }

    function getCurrentPanelIndex() {
        if (!grid.clientWidth) return 0;
        return Math.min(
            getActivePanelCount() - 1,
            Math.max(0, Math.round(grid.scrollLeft / grid.clientWidth))
        );
    }

    function updateEdgeTab(edgeTab, targetIndex) {
        const isAvailable = targetIndex >= 0 && targetIndex < getActivePanelCount();
        edgeTab.classList.toggle('compare-edge-tab--hidden', !isAvailable);
        edgeTab.setAttribute('aria-hidden', String(!isAvailable));
        edgeTab.setAttribute('tabindex', isAvailable ? '0' : '-1');
        if (!isAvailable) return;

        const translation = versionSelectors[targetIndex].getValue();
        edgeTab.querySelector('.compare-edge-tab__label').textContent = translation;
        edgeTab.setAttribute('aria-label', `Show ${translation} translation`);
    }

    function updateEdgeTabs(panelIndex) {
        if (tabletMedia.matches) {
            const activeCount = getActivePanelCount();
            const maxScrollLeft = Math.max(0, grid.scrollWidth - grid.clientWidth);
            const atStart = grid.scrollLeft <= 2;
            const atEnd = grid.scrollLeft >= maxScrollLeft - 2;

            updateEdgeTab(previousEdgeTab, atStart ? -1 : 0);
            updateEdgeTab(nextEdgeTab, !atEnd && activeCount === 3 ? 2 : -1);
            return;
        }

        updateEdgeTab(previousEdgeTab, panelIndex - 1);
        updateEdgeTab(nextEdgeTab, panelIndex + 1);
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            edgeTabs.forEach((edgeTab) => edgeTab.classList.add('collapsed'));
        }, 3000);
    }

    function expandTabs() {
        edgeTabs.forEach((edgeTab) => edgeTab.classList.remove('collapsed'));
        scheduleHide();
    }

    function navigateFromEdgeTab(edgeTab, direction) {
        if (edgeTab.classList.contains('collapsed')) expandTabs();

        if (tabletMedia.matches) {
            const maxScrollLeft = Math.max(0, grid.scrollWidth - grid.clientWidth);
            if (!maxScrollLeft) return;
            grid.scrollTo({ left: direction > 0 ? maxScrollLeft : 0, behavior: 'smooth' });
            return;
        }

        const targetIndex = getCurrentPanelIndex() + direction;
        if (targetIndex < 0 || targetIndex >= getActivePanelCount()) return;
        grid.scrollTo({ left: targetIndex * grid.clientWidth, behavior: 'smooth' });
    }

    updateEdgeTabs(0);
    scheduleHide();

    const DRAG_THRESHOLD = 6;

    function setupEdgeTab(edgeTab, direction) {
        let dragStartY = 0;
        let dragStartTop = 0;
        let isDragging = false;
        let suppressNextClick = false;

        edgeTab.addEventListener(
            'touchstart',
            (event) => {
                const touch = event.touches[0];
                dragStartY = touch.clientY;
                dragStartTop = edgeTab.getBoundingClientRect().top;
                isDragging = false;
                edgeTab.classList.add('dragging');
            },
            { passive: true }
        );

        edgeTab.addEventListener(
            'touchmove',
            (event) => {
                const touch = event.touches[0];
                const deltaY = touch.clientY - dragStartY;
                if (Math.abs(deltaY) > DRAG_THRESHOLD) {
                    isDragging = true;
                    const minTop = 80;
                    const maxTop = window.innerHeight - 80;
                    const newTop = Math.min(maxTop, Math.max(minTop, dragStartTop + deltaY));
                    edgeTab.style.top = `${newTop}px`;
                }
                event.preventDefault();
            },
            { passive: false }
        );

        edgeTab.addEventListener('touchend', () => {
            edgeTab.classList.remove('dragging');
            if (isDragging) {
                suppressNextClick = true;
                setTimeout(() => {
                    suppressNextClick = false;
                }, 400);
            }
            scheduleHide();
        });

        edgeTab.addEventListener('click', (event) => {
            if (suppressNextClick) {
                event.preventDefault();
                return;
            }
            navigateFromEdgeTab(edgeTab, direction);
        });

        edgeTab.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigateFromEdgeTab(edgeTab, direction);
            }
        });
    }

    setupEdgeTab(previousEdgeTab, -1);
    setupEdgeTab(nextEdgeTab, 1);

    grid.addEventListener('scroll', () => {
        const index = getCurrentPanelIndex();
        indicators.querySelectorAll('.compare-dot').forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });
        updateEdgeTabs(index);
        expandTabs();
        scheduleHeightBalance(120);
    });

    let isSyncing = false;
    function syncScroll(source, sourceIndex) {
        if (isSyncing) return;
        if (mobileMedia.matches && getCurrentPanelIndex() !== sourceIndex) return;

        const activePanels = panels.slice(0, getActivePanelCount());
        if (source._animatingScroll || activePanels.some((panel) => panel._animatingScroll)) return;

        isSyncing = true;
        activePanels.forEach((panel) => {
            if (panel !== source) panel.scrollTop = source.scrollTop;
        });
        isSyncing = false;
    }

    panels.forEach((panel, index) => {
        panel.addEventListener('scroll', () => syncScroll(panel, index));
    });

    const verseSelection = createVerseSelection(
        () => versionSelectors[0].getValue(),
        () => settingsPanel.getBoldCopyEnabled(),
        { simpleText: true }
    );
    verseSelection.init();

    async function init() {
        try {
            const response = await fetch('/Translated_Bacaan_Alkitab_365.json');
            if (isDisposed) return;
            readingPlanData = await response.json();
            if (isDisposed) return;
            loadComparisons();
        } catch (error) {
            if (isDisposed) return;
            console.error('Error loading reading plan:', error);
            showError(verseContainers[0], 'Error loading reading plan.');
        }
    }

    function handleDateChange() {
        loadComparisons();
    }

    function updatePanelBookName(panelIndex, bookName, translation) {
        const bookSpan = panelHeaders[panelIndex].querySelector('.compare-panel__book');
        if (bookSpan) bookSpan.textContent = getTranslatedBookName(bookName, translation);
    }

    function syncTabs(targetContainer, bookName) {
        const button = targetContainer.querySelector(`.verse-tab-btn[data-book="${bookName}"]`);
        if (!button || button.classList.contains('active')) return;

        const nav = button.closest('.verse-tabs__nav');
        if (mobileMedia.matches && nav) {
            const originalScrollBehavior = nav.style.scrollBehavior;
            nav.style.scrollBehavior = 'auto';
            button.click();
            setTimeout(() => {
                nav.style.scrollBehavior = originalScrollBehavior;
            }, 100);
        } else {
            button.click();
        }
    }

    function injectTranslationBadge(container, translationName) {
        const navWrap = container.querySelector('.verse-tabs__nav-wrap');
        if (!navWrap) return;

        navWrap.querySelector('.compare-tab-badge')?.remove();
        const badge = document.createElement('div');
        badge.className = 'compare-tab-badge';
        badge.textContent = translationName;
        navWrap.insertBefore(badge, navWrap.firstChild);
    }

    function getActiveContainers() {
        return verseContainers.slice(0, getActivePanelCount());
    }

    function applyPanelCount() {
        const activeCount = getActivePanelCount();

        versionSelectors.forEach((selector, index) => {
            selector.element.classList.toggle('compare-control--disabled', index >= activeCount);
        });
        panels.forEach((panel, index) => {
            panel.classList.toggle('compare-panel--disabled', index >= activeCount);
        });
        indicators.querySelectorAll('.compare-dot').forEach((dot, index) => {
            dot.classList.toggle('compare-dot--disabled', index >= activeCount);
            dot.classList.toggle('active', index === 0);
        });

        panelCountHint.classList.toggle('compare-panel-count-hint--hidden', activeCount >= 3);
        grid.classList.toggle('compare-grid--two', activeCount === 2);
        grid.scrollTo({ left: 0, behavior: 'auto' });
        updateEdgeTabs(0);
    }

    function balanceVisibleHeights() {
        balanceHeights(...getActiveContainers());
    }

    function scheduleHeightBalance(delay = 0) {
        clearTimeout(balanceTimer);
        if (balanceFrame !== null) cancelAnimationFrame(balanceFrame);

        balanceTimer = setTimeout(() => {
            balanceTimer = null;
            balanceFrame = requestAnimationFrame(() => {
                balanceFrame = null;
                balanceVisibleHeights();
            });
        }, delay);
    }

    async function loadComparisons() {
        if (!readingPlanData || isDisposed) return;

        const requestId = ++loadSequence;
        const { month, day } = datePicker.getDate();
        const date = new Date(new Date().getFullYear(), month - 1, day);
        const dayIndex = dayOfYear(date);
        const versesString = readingPlanData[dayIndex]?.join(',');
        const activeCount = getActivePanelCount();
        const activeContainers = verseContainers.slice(0, activeCount);
        const translations = versionSelectors
            .slice(0, activeCount)
            .map((selector) => selector.getValue());

        if (!versesString) {
            activeContainers.forEach((container) => showError(container, 'No readings found.'));
            return;
        }

        panelHeaders.forEach((panelHeader, index) => {
            const translationSpan = panelHeader.querySelector('.compare-panel__translation');
            const bookSpan = panelHeader.querySelector('.compare-panel__book');
            if (translationSpan) translationSpan.textContent = versionSelectors[index].getValue();
            if (bookSpan) bookSpan.textContent = '';
        });

        updateEdgeTabs(getCurrentPanelIndex());
        activeContainers.forEach(showLoading);
        verseContainers.slice(activeCount).forEach((container) => {
            container.innerHTML = '';
        });
        verseSelection.clearSelection();

        const fontSizeClass = settingsPanel.getFontSizeClass();

        try {
            const datasets = await Promise.all(
                translations.map((translation) => fetchDayData(translation, versesString))
            );
            if (isDisposed || requestId !== loadSequence) return;

            const alignedDatasets = syncComparisonGroup(datasets);

            alignedDatasets.forEach((alignedVerses, index) => {
                const container = activeContainers[index];
                const translation = translations[index];

                renderVerses(
                    container,
                    alignedVerses,
                    translation,
                    null,
                    fontSizeClass,
                    (verseLine) => verseSelection.handleVerseClick(verseLine),
                    `v${index + 1}`,
                    'tabs',
                    (book) => {
                        updatePanelBookName(index, book, translation);
                        activeContainers.forEach((targetContainer, targetIndex) => {
                            if (targetIndex !== index) syncTabs(targetContainer, book);
                        });
                        scheduleHeightBalance();
                    }
                );
                injectTranslationBadge(container, translation);
            });

            scheduleHeightBalance();
            document.fonts?.ready.then(() => {
                if (!isDisposed && requestId === loadSequence) scheduleHeightBalance();
            });
        } catch (error) {
            if (isDisposed || requestId !== loadSequence) return;
            console.error('Error fetching comparison data:', error);
            activeContainers.forEach((container) => showError(container));
        }
    }

    const originalOnFontSize = settingsPanel._onFontSizeChange;
    settingsPanel._onFontSizeChange = (fontSizeClass) => {
        getActiveContainers().forEach((container) => updateVerseFontSize(container, fontSizeClass));
        if (originalOnFontSize) originalOnFontSize(fontSizeClass);
        scheduleHeightBalance(50);
    };

    const originalOnComparePanelCountChange = settingsPanel._onComparePanelCountChange;
    settingsPanel._onComparePanelCountChange = () => {
        applyPanelCount();
        loadComparisons();
        if (originalOnComparePanelCountChange) originalOnComparePanelCountChange();
    };

    function handleResize() {
        scheduleHeightBalance(100);
        clearTimeout(resizeHintTimer);
        resizeHintTimer = setTimeout(() => {
            if (!isDisposed) updateEdgeTabs(getCurrentPanelIndex());
        }, 100);
    }

    function handleBreakpointChange() {
        clearTimeout(breakpointTimer);
        breakpointTimer = setTimeout(() => {
            if (isDisposed) return;
            grid.scrollTo({ left: 0, behavior: 'auto' });
            indicators.querySelectorAll('.compare-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === 0);
            });
            updateEdgeTabs(0);
            scheduleHeightBalance();
        }, 50);
    }

    window.addEventListener('resize', handleResize);
    mobileMedia.addEventListener('change', handleBreakpointChange);
    tabletMedia.addEventListener('change', handleBreakpointChange);

    window.addEventListener(
        'hashchange',
        () => {
            isDisposed = true;
            loadSequence++;
            clearTimeout(hideTimer);
            clearTimeout(balanceTimer);
            clearTimeout(breakpointTimer);
            clearTimeout(resizeHintTimer);
            if (balanceFrame !== null) cancelAnimationFrame(balanceFrame);
            window.removeEventListener('resize', handleResize);
            mobileMedia.removeEventListener('change', handleBreakpointChange);
            tabletMedia.removeEventListener('change', handleBreakpointChange);
        },
        { once: true }
    );

    applyPanelCount();
    init();
}
