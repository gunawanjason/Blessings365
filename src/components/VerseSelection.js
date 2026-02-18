import { toUnicodeBold, generateVerseReferenceString } from '../utils/helpers.js';
import { trackEvent } from '../utils/analytics.js';
import { getTranslatedBookName } from '../data/bookNames.js';

/**
 * Manages verse selection state, the action bar, and copy functionality.
 * @param {Function} getCurrentVersion - Function to get current translation
 * @param {Function} getBoldCopyEnabled - Function to checks if bold copy is enabled
 * @param {Object} options - Optional configuration
 * @param {boolean} options.simpleText - If true, shows "X verses selected" instead of references
 */
export function createVerseSelection(getCurrentVersion, getBoldCopyEnabled, options = {}) {
    let selectedVerses = [];
    let actionBar = null;
    let infoEl = null;
    let copyBtn = null;
    let originalCopyHTML = '';
    let copyTimeout = null;

    function init() {
        // Create action bar — simple floating pill
        actionBar = document.createElement('div');
        actionBar.className = 'action-bar';
        actionBar.id = 'action-bar';
        actionBar.innerHTML = `
      <div class="action-bar__inner">
        <span class="action-bar__info" id="selection-info"></span>
        <button class="action-bar__copy" id="copy-btn" disabled>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
      </div>
    `;
        document.body.appendChild(actionBar);

        infoEl = actionBar.querySelector('#selection-info');
        copyBtn = actionBar.querySelector('#copy-btn');
        originalCopyHTML = copyBtn.innerHTML;

        copyBtn.addEventListener('click', handleCopy);

        // Click on action bar inner (not copy button) to deselect
        actionBar.querySelector('.action-bar__inner').addEventListener('click', (e) => {
            if (!e.target.closest('.action-bar__copy')) {
                clearSelection();
            }
        });

        // Click outside to deselect
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.verse-line') && !e.target.closest('#action-bar')) {
                clearSelection();
            }
        });

        return actionBar;
    }

    function handleVerseClick(verseLine) {
        if (selectedVerses.includes(verseLine)) {
            verseLine.classList.remove('verse-line--selected');
            selectedVerses = selectedVerses.filter(v => v !== verseLine);
        } else {
            verseLine.classList.add('verse-line--selected');
            selectedVerses.push(verseLine);
        }
        resetCopyBtn();
        updateActionBar();
    }

    function clearSelection() {
        selectedVerses.forEach(v => v.classList.remove('verse-line--selected'));
        selectedVerses = [];
        resetCopyBtn();
        updateActionBar();
    }

    function toggleScrollPadding(show) {
        document.body.classList.toggle('action-bar-active', show);
    }

    function updateActionBar() {
        if (!actionBar) return;

        if (selectedVerses.length > 0) {
            actionBar.classList.add('action-bar--visible');
            copyBtn.disabled = false;
            toggleScrollPadding(true);

            const count = selectedVerses.length;
            if (options.simpleText) {
                infoEl.textContent = `${count} verse${count === 1 ? '' : 's'}`;
            } else {
                const { formattedHeader } = formatVerseSelection();
                infoEl.textContent = formattedHeader;
            }
        } else {
            actionBar.classList.remove('action-bar--visible');
            copyBtn.disabled = true;
            infoEl.textContent = '';
            toggleScrollPadding(false);
        }
    }

    function resetCopyBtn() {
        if (copyTimeout) {
            clearTimeout(copyTimeout);
            copyTimeout = null;
        }
        if (copyBtn) {
            copyBtn.innerHTML = originalCopyHTML;
            copyBtn.classList.remove('action-bar__copy--success', 'action-bar__copy--error');
        }
        const inner = actionBar?.querySelector('.action-bar__inner');
        if (inner) inner.classList.remove('action-bar__inner--success');
    }

    async function handleCopy() {
        const { formattedText } = formatVerseSelection();
        resetCopyBtn();

        const inner = actionBar.querySelector('.action-bar__inner');

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(formattedText);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = formattedText;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            // Turn the whole bar green
            inner.classList.add('action-bar__inner--success');
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
            copyBtn.classList.add('action-bar__copy--success');

            trackEvent('share', {
                method: 'copy',
                content_type: 'bible_verse_formatted_multi',
                item_id: formattedText.substring(0, 100),
            });

            // Auto-hide and clear after delay
            copyTimeout = setTimeout(() => {
                clearSelection();
            }, 1500);
        } catch (err) {
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Failed`;
            copyBtn.classList.add('action-bar__copy--error');
            copyTimeout = setTimeout(resetCopyBtn, 2000);
        }
    }

    function formatVerseSelection() {
        if (selectedVerses.length === 0) return { formattedText: '', formattedHeader: '' };

        const defaultTranslation = getCurrentVersion();
        const boldCopy = getBoldCopyEnabled();

        // Sort by document position (this naturally handles Comparison view: Panel 1 first, then Panel 2)
        const sorted = [...selectedVerses].sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });

        // Parse Verse Data including Version
        const allVerseData = sorted.map(el => {
            const chapter = parseInt(el.dataset.chapter);
            const verse = parseInt(el.dataset.verse);
            const bookEnglish = el.dataset.book;
            // Use dataset version if available (for Compare mode), fallback to current global
            const version = el.dataset.version || defaultTranslation;
            const bookName = getTranslatedBookName(bookEnglish, version);

            const numberEl = el.querySelector('.verse-number');
            const fullText = el.textContent || '';
            const numText = numberEl ? numberEl.textContent : '';
            const plainText = fullText.replace(numText, '').trim();

            return { book: bookName, chapter, verse, text: plainText, version };
        }).filter(v => !isNaN(v.chapter) && !isNaN(v.verse));

        // Grouping Strategy: Version -> Book -> Chapter
        // Since we want to respect the visual order (e.g. Left Panel verses, then Right Panel verses),
        // and 'sorted' already does that, we can just iterate and break groups when keys change.

        const groups = [];
        let currentGroup = null;

        allVerseData.forEach(v => {
            const key = `${v.version}|${v.book}|${v.chapter}`;

            if (!currentGroup || currentGroup.key !== key) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = {
                    key: key,
                    version: v.version,
                    book: v.book,
                    chapter: v.chapter,
                    verses: []
                };
            }
            currentGroup.verses.push(v);
        });
        if (currentGroup) groups.push(currentGroup);

        // Generate Output
        const finalOutput = [];
        const listOfHeaders = [];

        groups.forEach(group => {
            // Sort verses within the group (usually already sorted, but safe to be sure)
            group.verses.sort((a, b) => a.verse - b.verse);
            const refString = generateVerseReferenceString(group.verses.map(v => v.verse));

            let header = `${group.book} ${group.chapter}:${refString} (${group.version})`;
            let contentLines;

            if (boldCopy) {
                header = toUnicodeBold(header);
                contentLines = group.verses.map(v => `${toUnicodeBold(v.verse.toString())} ${v.text}`);
            } else {
                contentLines = group.verses.map(v => `${v.verse} ${v.text}`);
            }

            // User requested format:
            // Header
            // Content
            finalOutput.push(header + '\n' + contentLines.join('\n'));

            // For simple header summary
            listOfHeaders.push({
                book: group.book,
                chapter: group.chapter,
                verses: refString,
                version: group.version
            });
        });

        const formattedText = finalOutput.join('\n\n');

        // Formatted Header for single line display (if needed, though simpleText handles comparison view mostly)
        // If versions differ, logic might be tricky, but standard view expects: Book C:V (Version)
        // If multiple versions, we'll just list them? 
        // For now, keep simple logic or join them.

        // Let's create a smart summary: "Mat 5:1 (ESV), Mat 5:1 (TB)"
        const formattedHeader = listOfHeaders.map(h => {
            return `${h.book} ${h.chapter}:${h.verses} (${h.version})`;
        }).join(', ');

        return { formattedText, formattedHeader };
    }

    return {
        init,
        handleVerseClick,
        clearSelection,
        getSelectedCount: () => selectedVerses.length,
    };
}
