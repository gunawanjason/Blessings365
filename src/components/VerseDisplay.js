import { getTranslatedBookName } from '../data/bookNames.js';
import { trackEvent } from '../utils/analytics.js';

const CHEVRON_SVG = `<svg class="verse-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

/**
 * Render verses into a container element.
 * Uses a single-expand accordion: only one card open at a time.
 */
export function renderVerses(container, versesData, translation, headingsMap, fontSizeClass, onVerseClick, accordionId = 'verses', layout = 'accordion', onTabChange) {
    container.innerHTML = '';

    if (!versesData || versesData.length === 0) {
        container.innerHTML = '<div class="error-message">No verses found for this date.</div>';
        return;
    }

    if (layout === 'tabs') {
        renderTabs(container, versesData, translation, headingsMap, fontSizeClass, onVerseClick, onTabChange);
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
function renderTabs(container, versesData, translation, headingsMap, fontSizeClass, onVerseClick, onTabChange) {
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
                endVerse: null
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

    // 2. Create Tabs Container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'verse-tabs';

    const tabsNavWrap = document.createElement('div');
    tabsNavWrap.className = 'verse-tabs__nav-wrap';

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

    const tabsContent = document.createElement('div');
    tabsContent.className = 'verse-tabs__content';

    tabsNavWrap.appendChild(tabsNav);
    tabsNavWrap.appendChild(leftEdgeArrow);
    tabsNavWrap.appendChild(rightEdgeArrow);
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
        btn.setAttribute('aria-controls', `pane-${index}`);
        btn.id = `tab-${index}`;
        if (index === 0) {
            btn.classList.add('active');
            if (onTabChange) onTabChange(book.name);
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
            // Deactivate all
            tabsNav.querySelectorAll('.verse-tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabsContent.querySelectorAll('.verse-tab-pane').forEach(p => p.classList.remove('active'));

            // Activate this
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            pane.classList.add('active');

            // Allow animation ease-in
            requestAnimationFrame(() => {
                pane.style.opacity = '1';
                pane.style.transform = 'translateY(0)';
            });

            // Auto-scroll nav if needed (only on desktop, prevent horizontal scroll on mobile)
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }

            requestAnimationFrame(refreshTabNavFades);
            setTimeout(refreshTabNavFades, 180);

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
        pane.setAttribute('aria-labelledby', `tab-${index}`);
        pane.id = `pane-${index}`;
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
                    const verseLine = createVerseLine(item, translation, fontSizeClass, onVerseClick);
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

    refreshTabNavFades();
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

        const hasLeftByGeometry = firstRect.left < (navRect.left - EDGE_EPSILON);
        const hasRightByGeometry = lastRect.right > (navRect.right + EDGE_EPSILON);
        const hasLeftByScroll = scrollLeft > EDGE_EPSILON;
        const hasRightByScroll = (maxScrollLeft - scrollLeft) > EDGE_EPSILON;

        let hasLeft = hasLeftByGeometry || hasLeftByScroll;
        let hasRight = hasRightByGeometry || hasRightByScroll;

        if (maxScrollLeft > EDGE_EPSILON && !hasLeft && !hasRight) {
            if (scrollLeft <= EDGE_EPSILON) {
                hasRight = true;
            } else if ((maxScrollLeft - scrollLeft) <= EDGE_EPSILON) {
                hasLeft = true;
            } else {
                hasLeft = true;
                hasRight = true;
            }
        }

        const contentSpan = lastRect.right - firstRect.left;
        const canScroll = maxScrollLeft > 0 || hasLeft || hasRight || contentSpan > (navRect.width + EDGE_EPSILON);

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

    // Throttled scroll handler to prevent excessive updates
    let scrollTimer = null;
    const throttledScrollHandler = () => {
        if (scrollTimer) return;
        scrollTimer = setTimeout(() => {
            update();
            scrollTimer = null;
        }, 50); // 50ms throttle for scroll events
    };

    tabsNav.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
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
            container.querySelectorAll('.verse-card--expanded').forEach(openCard => {
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
 * Smoothly expand a card using measured height.
 */
function expandCard(card, body) {
    card.classList.add('verse-card--expanded');
    // Animate: set height from 0 to scrollHeight
    body.style.maxHeight = body.scrollHeight + 'px';
    // After transition, remove max-height so content can reflow
    const onEnd = () => {
        body.style.maxHeight = 'none';
        body.removeEventListener('transitionend', onEnd);
    };
    body.addEventListener('transitionend', onEnd);
}

/**
 * Smoothly collapse a card.
 */
function collapseCard(card, body) {
    // Set explicit height first so transition works
    body.style.maxHeight = body.scrollHeight + 'px';
    // Force reflow
    body.offsetHeight; // eslint-disable-line no-unused-expressions
    // Then animate to 0
    requestAnimationFrame(() => {
        body.style.maxHeight = '0px';
        card.classList.remove('verse-card--expanded');
    });
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
 * Show loading indicator in a container.
 */
export function showLoading(container) {
    container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span class="loading__text">Loading verses…</span>
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
    container.querySelectorAll('.verse-line').forEach(el => {
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

/**
 * Align the heights of corresponding elements in two containers.
 * Assumes container1 and container2 have the same number of children in same order,
 * or rather matches them by data attributes or structure.
 * Since we are rendering tabs, we need to find the *active* tab pane in both.
 */
export function balanceHeights(container1, container2) {
    if (!container1 || !container2) return;

    // 1. Find active tab panes
    const pane1 = container1.querySelector('.verse-tab-pane.active');
    const pane2 = container2.querySelector('.verse-tab-pane.active');

    if (!pane1 || !pane2) return;

    // 2. Get all children (heading + verses)
    // We rely on the fact that syncComparisons produces strictly aligned lists.
    // So child[i] in pane1 corresponds to child[i] in pane2.
    const children1 = Array.from(pane1.children);
    const children2 = Array.from(pane2.children);

    // 3. Iterate and sync height
    const count = Math.min(children1.length, children2.length);

    // Use a double-RAF to ensure layout is settled before measuring
    requestAnimationFrame(() => {
        // Reset heights first to measure natural height
        for (let i = 0; i < count; i++) {
            children1[i].style.height = '';
            children2[i].style.height = '';
        }

        // Force reflow/re-measure
        requestAnimationFrame(() => {
            for (let i = 0; i < count; i++) {
                const el1 = children1[i];
                const el2 = children2[i];

                const h1 = el1.getBoundingClientRect().height;
                const h2 = el2.getBoundingClientRect().height;

                if (Math.abs(h1 - h2) > 0.5) {
                    const maxH = Math.max(h1, h2);
                    el1.style.height = `${maxH}px`;
                    el2.style.height = `${maxH}px`;
                }
            }
        });
    });
}
