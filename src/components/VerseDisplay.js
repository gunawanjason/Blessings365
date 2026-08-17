import { getTranslatedBookName } from '../data/bookNames.js';
import { trackEvent } from '../utils/analytics.js';
import { saveScrollPos, getScrollPos } from '../utils/scrollState.js';

const CHEVRON_SVG = `<svg class="verse-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

/**
 * Render verses into a container element.
 * Uses a single-expand accordion: only one card open at a time.
 */
export function renderVerses(
    container,
    versesData,
    translation,
    headingsMap,
    fontSizeClass,
    onVerseClick,
    accordionId = 'verses',
    layout = 'accordion',
    onTabChange
) {
    container.innerHTML = '';

    if (!versesData || versesData.length === 0) {
        container.innerHTML = '<div class="error-message">No verses found for this date.</div>';
        return;
    }

    if (layout === 'tabs') {
        renderTabs(
            container,
            versesData,
            translation,
            headingsMap,
            fontSizeClass,
            onVerseClick,
            onTabChange
        );
        return;
    }

    // Default: Accordion
    let currentBook = '';
    let currentContent = null;
    let currentCardInfo = null;
    const allCards = []; // { card, body, bookEnglish, startVerse, endVerse }

    for (const verseData of versesData) {
        const bookName = verseData.book;

        if (bookName !== currentBook) {
            if (currentCardInfo) {
                allCards.push(currentCardInfo);
            }

            // Create card element
            const card = document.createElement('div');
            card.className = 'verse-card';
            card.dataset.book = bookName;

            const header = document.createElement('div');
            header.className = 'verse-card__header';
            header.innerHTML = `<span class="verse-card__title" data-book="${bookName}"></span>${CHEVRON_SVG}`;

            const body = document.createElement('div');
            body.className = 'verse-card__body';
            currentContent = document.createElement('div');
            currentContent.className = 'verse-card__content';
            body.appendChild(currentContent);

            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);

            // Use IIFE or direct reference to avoid closure bug
            header.addEventListener('click', createToggleHandler(card, body, container));

            currentBook = bookName;
            currentCardInfo = {
                card,
                body,
                bookEnglish: bookName,
                startVerse: `${verseData.chapter}:${verseData.verse}`,
                endVerse: `${verseData.chapter}:${verseData.verse}`,
            };
        }

        // Insert pericope heading if it exists
        if (headingsMap) {
            const key = `${verseData.book} ${verseData.chapter}:${verseData.verse}`;
            if (headingsMap.has(key)) {
                const headingDiv = document.createElement('div');
                headingDiv.className = 'pericope-heading';
                headingDiv.innerHTML = headingsMap.get(key);
                currentContent.appendChild(headingDiv);
            }
        }

        // Create verse line
        const verseLine = document.createElement('div');
        verseLine.className = `verse-line ${fontSizeClass}`;
        verseLine.dataset.chapter = verseData.chapter;
        verseLine.dataset.verse = verseData.verse;
        verseLine.dataset.book = verseData.book;
        verseLine.dataset.version = translation;
        verseLine.innerHTML = `<span class="verse-number">${verseData.chapter}:${verseData.verse}</span> ${verseData.content}`;

        verseLine.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onVerseClick) onVerseClick(verseLine, verseData);
        });

        currentContent.appendChild(verseLine);

        if (currentCardInfo) {
            currentCardInfo.endVerse = `${verseData.chapter}:${verseData.verse}`;
        }
    }

    // Push the last card
    if (currentCardInfo) {
        allCards.push(currentCardInfo);
    }

    // Finalize all card titles
    for (const info of allCards) {
        finalizeCardTitle(info.card, info.bookEnglish, translation, info.startVerse, info.endVerse);
    }

    // Auto-expand the first card
    if (allCards.length > 0) {
        expandCard(allCards[0].card, allCards[0].body);
    }
}

/**
 * Render verses using a tabbed layout.
 */
function renderTabs(
    container,
    versesData,
    translation,
    headingsMap,
    fontSizeClass,
    onVerseClick,
    onTabChange
) {
    // 1. Group by Book
    const books = [];
    let currentBookName = null;
    let currentBookData = null;

    for (const verse of versesData) {
        // If it's a heading item with no book property (shouldn't happen given sync logic, but be safe)
        // actually sync logic adds book to headings.
        // But headings don't have chapter/verse usually?
        // Let's rely on verse.book.

        if (verse.book !== currentBookName) {
            if (currentBookData) books.push(currentBookData);
            currentBookName = verse.book;
            currentBookData = {
                name: currentBookName,
                verses: [],
                startVerse: null,
                endVerse: null,
            };
        }

        currentBookData.verses.push(verse);

        // Update range only if it's a verse (real or empty-verse with data)
        if (verse.chapter && verse.verse) {
            if (!currentBookData.startVerse) {
                currentBookData.startVerse = `${verse.chapter}:${verse.verse}`;
            }
            currentBookData.endVerse = `${verse.chapter}:${verse.verse}`;
        }
    }
    if (currentBookData) books.push(currentBookData);

    // Scroll state: determine scroll context
    const scrollPanel = container.closest('.compare-panel');
    const namespace = scrollPanel ? 'compare' : 'read';
    let currentActiveBook = books[0]?.name ?? null;

    // 2. Create Tabs Container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'verse-tabs';
    if (namespace === 'read') tabsContainer.classList.add('verse-tabs--reader');

    const tabIdPrefix = `${container.id || namespace}-${translation}`.replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
    );

    const tabsNavWrap = document.createElement('div');
    tabsNavWrap.className = 'verse-tabs__nav-wrap';

    // New wrapper for scroll content specifically (excludes badge in compare view)
    const tabsScrollArea = document.createElement('div');
    tabsScrollArea.className = 'verse-tabs__scroll-area';

    const leftEdgeArrow = document.createElement('span');
    leftEdgeArrow.className = 'verse-tabs__edge-arrow verse-tabs__edge-arrow--left';
    leftEdgeArrow.setAttribute('aria-hidden', 'true');
    leftEdgeArrow.textContent = '‹';

    const rightEdgeArrow = document.createElement('span');
    rightEdgeArrow.className = 'verse-tabs__edge-arrow verse-tabs__edge-arrow--right';
    rightEdgeArrow.setAttribute('aria-hidden', 'true');
    rightEdgeArrow.textContent = '›';

    const tabsNav = document.createElement('div');
    tabsNav.className = 'verse-tabs__nav'; // Scrollable horizontal list
    tabsNav.setAttribute('role', 'tablist');
    tabsNav.setAttribute('aria-label', 'Bible Books');

    // Enable horizontal scrolling with mouse wheel on desktop (no snap on desktop)
    tabsNavWrap.addEventListener(
        'wheel',
        (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                tabsNav.scrollLeft += e.deltaY;
            }
        },
        { passive: false }
    );

    const tabsContent = document.createElement('div');
    tabsContent.className = 'verse-tabs__content';

    // Use scroll area to contain nav + arrows
    tabsScrollArea.appendChild(tabsNav);
    tabsScrollArea.appendChild(leftEdgeArrow);
    tabsScrollArea.appendChild(rightEdgeArrow);

    tabsNavWrap.appendChild(tabsScrollArea);
    tabsContainer.appendChild(tabsNavWrap);
    tabsContainer.appendChild(tabsContent);
    container.appendChild(tabsContainer);

    const refreshTabNavFades = setupTabNavFades(tabsNav, tabsNavWrap);

    // 3. Render Tabs and Content
    books.forEach((book, index) => {
        // --- Nav Button ---
        const btn = document.createElement('button');
        btn.className = 'verse-tab-btn';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        btn.setAttribute('aria-controls', `${tabIdPrefix}-pane-${index}`);
        btn.id = `${tabIdPrefix}-tab-${index}`;
        if (index === 0) {
            btn.classList.add('active');
            if (onTabChange) onTabChange(book.name);

            // Restore saved scroll for the initial tab (e.g. returning from another page)
            const initPos = getScrollPos(namespace, book.name);
            if (initPos > 0) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (!btn.classList.contains('active')) return;
                        if (scrollPanel && window.innerWidth <= 768) {
                            scrollPanel.scrollTop = initPos;
                        } else {
                            window.scrollTo({ top: initPos });
                        }
                    });
                });
            }
        }

        // Add data-book for programmatic access/sync
        btn.dataset.book = book.name;

        const translatedName = getTranslatedBookName(book.name, translation);

        // Format logic for range (reuse if possible or simplify)
        let range = `${book.startVerse}-${book.endVerse}`;
        if (book.startVerse.split(':')[0] === book.endVerse.split(':')[0]) {
            range = `${book.startVerse.split(':')[0]}:${book.startVerse.split(':')[1]}-${book.endVerse.split(':')[1]}`;
        }

        // Simple, clean book icon
        const iconSvg = `
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        `;

        btn.innerHTML = `
            ${iconSvg}
            <div class="tab-content-wrapper">
                <span class="tab-book">${translatedName}</span>
                <span class="tab-range">${range}</span>
            </div>
        `;

        btn.addEventListener('click', () => {
            // Save scroll position of the book we're leaving
            if (currentActiveBook && currentActiveBook !== book.name) {
                const isMobileCompare = scrollPanel && window.innerWidth <= 768;
                const pos = isMobileCompare ? scrollPanel.scrollTop : window.scrollY;
                saveScrollPos(namespace, currentActiveBook, pos);
            }

            // Deactivate all
            tabsNav.querySelectorAll('.verse-tab-btn').forEach((b) => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabsContent
                .querySelectorAll('.verse-tab-pane')
                .forEach((p) => p.classList.remove('active'));

            // Activate this
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            pane.classList.add('active');

            // Allow animation ease-in
            requestAnimationFrame(() => {
                pane.style.opacity = '1';
                pane.style.transform = 'translateY(0)';
            });

            // Keep the active book visible. Compare panels avoid this on mobile because
            // their outer horizontal scroller owns the swipe gesture.
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else if (!scrollPanel) {
                centerTabInNav(tabsNav, btn);
            }

            requestAnimationFrame(refreshTabNavFades);
            setTimeout(refreshTabNavFades, 180);

            // Restore saved scroll position for the book we're entering
            const savedPos = getScrollPos(namespace, book.name);
            const isMobileCompare = scrollPanel && window.innerWidth <= 768;
            if (isMobileCompare) {
                scrollPanel.scrollTop = savedPos;
            } else {
                window.scrollTo({ top: savedPos });
            }

            currentActiveBook = book.name;

            // Notify listener (for sync)
            if (onTabChange) onTabChange(book.name);

            trackEvent('select_content', {
                content_type: 'bible_book_tab',
                item_id: book.name,
            });
        });

        tabsNav.appendChild(btn);

        // --- Content Pane ---
        const pane = document.createElement('div');
        pane.className = 'verse-tab-pane';
        pane.setAttribute('role', 'tabpanel');
        pane.setAttribute('aria-labelledby', `${tabIdPrefix}-tab-${index}`);
        pane.id = `${tabIdPrefix}-pane-${index}`;
        if (index === 0) pane.classList.add('active');

        // Render verses into pane
        // Similar logic to renderVerses loop but just for this book's verses
        let currentContent = pane;
        // Note: In tabs, we just dump verses directly into the pane,
        // keeping the pericope and verse styling.
        // We might want a wrapper for padding if needed.

        for (const item of book.verses) {
            // Handle explicit synchronized items (Heading, Verse, Empty)
            if (item.type) {
                if (item.type === 'heading') {
                    const headingDiv = document.createElement('div');
                    headingDiv.className = 'pericope-heading';
                    headingDiv.innerHTML = item.content;
                    currentContent.appendChild(headingDiv);
                } else if (item.type === 'empty-heading') {
                    const headingDiv = document.createElement('div');
                    headingDiv.className = 'pericope-heading pericope-heading--empty';
                    headingDiv.innerHTML = '&nbsp;';
                    currentContent.appendChild(headingDiv);
                } else if (item.type === 'verse') {
                    const verseLine = createVerseLine(
                        item,
                        translation,
                        fontSizeClass,
                        onVerseClick
                    );
                    currentContent.appendChild(verseLine);
                } else if (item.type === 'empty-verse') {
                    const verseLine = document.createElement('div');
                    verseLine.className = `verse-line verse-line--empty ${fontSizeClass}`;
                    verseLine.innerHTML = '&nbsp;';
                    currentContent.appendChild(verseLine);
                }
                continue;
            }

            // Standard Logic: Check headingsMap lookup
            if (headingsMap) {
                const key = `${item.book} ${item.chapter}:${item.verse}`;
                if (headingsMap.has(key)) {
                    const headingDiv = document.createElement('div');
                    headingDiv.className = 'pericope-heading';
                    headingDiv.innerHTML = headingsMap.get(key);
                    currentContent.appendChild(headingDiv);
                }
            }

            const verseLine = createVerseLine(item, translation, fontSizeClass, onVerseClick);
            currentContent.appendChild(verseLine);
        }

        tabsContent.appendChild(pane);
    });

    if (namespace === 'read') setupReaderBookSwipe(tabsContent, tabsNav);

    // Save the current active book's scroll when the user navigates to another page
    window.addEventListener(
        'hashchange',
        () => {
            if (!currentActiveBook) return;
            const isMobileCompare = scrollPanel && window.innerWidth <= 768;
            const pos = isMobileCompare ? scrollPanel.scrollTop : window.scrollY;
            saveScrollPos(namespace, currentActiveBook, pos);
        },
        { once: true }
    );

    refreshTabNavFades();
}

function centerTabInNav(tabsNav, button) {
    const left = button.offsetLeft - (tabsNav.clientWidth - button.offsetWidth) / 2;
    tabsNav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
}

function setupReaderBookSwipe(tabsContent, tabsNav) {
    const SWIPE_THRESHOLD = 52;
    const DIRECTION_RATIO = 1.2;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    tabsContent.addEventListener(
        'touchstart',
        (event) => {
            if (window.innerWidth > 768 || event.touches.length !== 1) {
                tracking = false;
                return;
            }

            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            tracking = true;
        },
        { passive: true }
    );

    tabsContent.addEventListener(
        'touchend',
        (event) => {
            if (!tracking || window.innerWidth > 768 || !event.changedTouches.length) return;
            tracking = false;

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            if (
                Math.abs(deltaX) < SWIPE_THRESHOLD ||
                Math.abs(deltaX) < Math.abs(deltaY) * DIRECTION_RATIO
            ) {
                return;
            }

            const buttons = Array.from(tabsNav.querySelectorAll('.verse-tab-btn'));
            const activeIndex = buttons.findIndex((button) => button.classList.contains('active'));
            const targetIndex = deltaX < 0 ? activeIndex + 1 : activeIndex - 1;
            const target = buttons[targetIndex];

            if (target) {
                event.preventDefault();
                target.click();
            }
        },
        { passive: false }
    );
}

function setupTabNavFades(tabsNav, tabsNavWrap) {
    const EDGE_EPSILON = 2;
    let rafId = null;
    let settleTimer = null;
    let lastCanScroll = null;
    let lastHasLeft = null;
    let lastHasRight = null;
    let isUpdating = false;

    const updateImmediate = () => {
        // Prevent concurrent updates
        if (isUpdating) return;
        isUpdating = true;

        const children = Array.from(tabsNav.children).filter((el) => el instanceof HTMLElement);

        if (children.length === 0) {
            if (lastCanScroll !== false) {
                tabsNavWrap.classList.remove('verse-tabs__nav-wrap--scrollable');
                lastCanScroll = false;
            }
            if (lastHasLeft !== false) {
                tabsNavWrap.classList.remove('verse-tabs__nav-wrap--left-fade');
                lastHasLeft = false;
            }
            if (lastHasRight !== false) {
                tabsNavWrap.classList.remove('verse-tabs__nav-wrap--right-fade');
                lastHasRight = false;
            }
            isUpdating = false;
            return;
        }

        const firstItem = children[0];
        const lastItem = children[children.length - 1];
        const navRect = tabsNav.getBoundingClientRect();
        const firstRect = firstItem.getBoundingClientRect();
        const lastRect = lastItem.getBoundingClientRect();
        const scrollWidth = Math.ceil(tabsNav.scrollWidth);
        const clientWidth = Math.floor(tabsNav.clientWidth);
        const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
        const scrollLeft = Math.max(0, Math.min(maxScrollLeft, tabsNav.scrollLeft));

        const hasLeftByGeometry = firstRect.left < navRect.left - EDGE_EPSILON;
        const hasRightByGeometry = lastRect.right > navRect.right + EDGE_EPSILON;
        const hasLeftByScroll = scrollLeft > EDGE_EPSILON;
        const hasRightByScroll = maxScrollLeft - scrollLeft > EDGE_EPSILON;

        let hasLeft = hasLeftByGeometry || hasLeftByScroll;
        let hasRight = hasRightByGeometry || hasRightByScroll;

        if (maxScrollLeft > EDGE_EPSILON && !hasLeft && !hasRight) {
            if (scrollLeft <= EDGE_EPSILON) {
                hasRight = true;
            } else if (maxScrollLeft - scrollLeft <= EDGE_EPSILON) {
                hasLeft = true;
            } else {
                hasLeft = true;
                hasRight = true;
            }
        }

        const contentSpan = lastRect.right - firstRect.left;
        const canScroll =
            maxScrollLeft > 0 || hasLeft || hasRight || contentSpan > navRect.width + EDGE_EPSILON;

        // Only update classes if there's an actual change
        if (canScroll !== lastCanScroll) {
            tabsNavWrap.classList.toggle('verse-tabs__nav-wrap--scrollable', canScroll);
            lastCanScroll = canScroll;
        }
        if (hasLeft !== lastHasLeft) {
            tabsNavWrap.classList.toggle('verse-tabs__nav-wrap--left-fade', hasLeft);
            lastHasLeft = hasLeft;
        }
        if (hasRight !== lastHasRight) {
            tabsNavWrap.classList.toggle('verse-tabs__nav-wrap--right-fade', hasRight);
            lastHasRight = hasRight;
        }

        isUpdating = false;
    };

    const update = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateImmediate();
        });
    };

    // Scroll handler — update() already coalesces via requestAnimationFrame,
    // so the fade tracks the scroll without lag or extra timers.
    tabsNav.addEventListener('scroll', update, { passive: true });

    // Use a single resize handler with debouncing
    let resizeTimer = null;
    const debouncedResizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(update, 150);
    };

    window.addEventListener('resize', debouncedResizeHandler);
    window.addEventListener('orientationchange', debouncedResizeHandler);

    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
            // Debounce resize observer updates
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(update, 150);
        });
        observer.observe(tabsNav);
    }

    // Initial update with delay to ensure DOM is settled
    requestAnimationFrame(() => {
        updateImmediate();
    });
    // Additional delayed update for mobile rendering quirks
    setTimeout(update, 300);

    return update;
}

/**
 * Create a toggle handler that implements single-expand accordion behavior.
 * Captures the correct card/body via function parameters (no closure bug).
 */
function createToggleHandler(card, body, container) {
    return () => {
        const isExpanded = card.classList.contains('verse-card--expanded');

        if (isExpanded) {
            // Collapse this card
            collapseCard(card, body);
        } else {
            // Collapse all other cards first
            container.querySelectorAll('.verse-card--expanded').forEach((openCard) => {
                const openBody = openCard.querySelector('.verse-card__body');
                collapseCard(openCard, openBody);
            });
            // Expand this one
            expandCard(card, body);
        }

        trackEvent('select_content', {
            content_type: 'bible_book_chapter',
            item_id: card.querySelector('.verse-card__title')?.textContent || '',
        });
    };
}

/**
 * Expand a card — CSS grid-template-rows transition handles the animation.
 */
function expandCard(card, body) {
    // Clear any legacy inline maxHeight from older implementations
    body.style.maxHeight = '';
    card.classList.add('verse-card--expanded');
}

/**
 * Collapse a card — CSS grid-template-rows transition handles the animation.
 */
function collapseCard(card, body) {
    body.style.maxHeight = '';
    card.classList.remove('verse-card--expanded');
}

function finalizeCardTitle(card, bookEnglish, translation, startVerse, endVerse) {
    const titleEl = card.querySelector('.verse-card__title');
    if (!titleEl) return;

    const translatedBook = getTranslatedBookName(bookEnglish, translation);

    let displayEnd = endVerse;
    if (startVerse.split(':')[0] === endVerse.split(':')[0]) {
        displayEnd = endVerse.split(':')[1];
    }

    titleEl.textContent = `${translatedBook} ${startVerse}-${displayEnd}`;
}

/**
 * Show skeleton loading indicator in a container.
 */
export function showLoading(container) {
    // Skeleton tab button
    const skeletonTab = (isActive = false) => `
        <div class="skeleton-tab ${isActive ? 'skeleton-tab--active' : ''}">
            <div class="skeleton-tab__icon"></div>
            <div class="skeleton-tab__content">
                <div class="skeleton-tab__book"></div>
                <div class="skeleton-tab__range"></div>
            </div>
        </div>
    `;

    // Skeleton verse line
    const skeletonVerse = (textLines) => `
        <div class="skeleton-verse">
            <div class="skeleton-badge"></div>
            <div class="skeleton-text">
                ${textLines.map((len) => `<div class="skeleton-text-line skeleton-text-line--${len}"></div>`).join('')}
            </div>
        </div>
    `;

    const skeletonHeading = () => `<div class="skeleton-heading"></div>`;

    container.innerHTML = `
        <div class="skeleton-tabs">
            <div class="skeleton-tabs__nav-wrap">
                <div class="skeleton-tabs__nav">
                    ${skeletonTab(true)}
                    ${skeletonTab()}
                    ${skeletonTab()}
                </div>
            </div>
            <div class="skeleton-tabs__content">
                ${skeletonHeading()}
                ${skeletonVerse(['full', 'medium'])}
                ${skeletonVerse(['long'])}
                ${skeletonVerse(['full', 'short'])}
                ${skeletonVerse(['medium'])}
                ${skeletonHeading()}
                ${skeletonVerse(['full', 'long'])}
                ${skeletonVerse(['long'])}
                ${skeletonVerse(['full', 'medium'])}
            </div>
        </div>
    `;
}

/**
 * Show error message in a container.
 */
export function showError(container, message = 'Error loading verses. Please try again.') {
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

/**
 * Update font size class on all verse lines.
 */
export function updateVerseFontSize(container, fontSizeClass) {
    container.querySelectorAll('.verse-line').forEach((el) => {
        el.classList.remove('verse-line--small', 'verse-line--medium', 'verse-line--large');
        el.classList.add(fontSizeClass);
    });
}

function createVerseLine(verseData, translation, fontSizeClass, onVerseClick) {
    const verseLine = document.createElement('div');
    verseLine.className = `verse-line ${fontSizeClass}`;
    verseLine.dataset.chapter = verseData.chapter;
    verseLine.dataset.verse = verseData.verse;
    verseLine.dataset.book = verseData.book;
    verseLine.dataset.version = translation;
    verseLine.innerHTML = `<span class="verse-number">${verseData.chapter}:${verseData.verse}</span> ${verseData.content}`;

    verseLine.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onVerseClick) onVerseClick(verseLine, verseData);
    });
    return verseLine;
}

/** Align corresponding rows across all active comparison translations. */
export function balanceHeights(...containers) {
    const panes = containers
        .filter(Boolean)
        .map((container) => container.querySelector('.verse-tab-pane.active'))
        .filter(Boolean);

    if (panes.length < 2) return;

    const childGroups = panes.map((pane) => Array.from(pane.children));
    const count = Math.min(...childGroups.map((children) => children.length));

    childGroups.forEach((children) => {
        for (let index = 0; index < count; index++) {
            children[index].style.height = '';
            children[index].style.minHeight = '';
        }
    });

    for (let index = 0; index < count; index++) {
        const row = childGroups.map((children) => children[index]);
        const maxHeight = Math.max(...row.map((element) => element.getBoundingClientRect().height));
        const normalizedHeight = `${Math.ceil(maxHeight * 100) / 100}px`;

        row.forEach((element) => {
            element.style.minHeight = normalizedHeight;
        });
    }
}
