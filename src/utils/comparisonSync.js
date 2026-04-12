/**
 * Synchronize two sets of verses and headings for side-by-side comparison.
 * Ensures that both lists have the same number of items and strictly align:
 * - Headings align with headings (or empty placeholders)
 * - Verses align with verses (or empty placeholders)
 *
 * @param {Array} verses1 - Array of verse objects for translation 1
 * @param {Map} headingsMap1 - Map of headings for translation 1
 * @param {Array} verses2 - Array of verse objects for translation 2
 * @param {Map} headingsMap2 - Map of headings for translation 2
 * @returns {Array} [alignedList1, alignedList2]
 */
export function syncComparisons(verses1, headingsMap1, verses2, headingsMap2) {
    const aligned1 = [];
    const aligned2 = [];

    let i1 = 0;
    let i2 = 0;

    let lastBook1 = null;
    let lastBook2 = null;

    const getId = (v) => `${v.book}|${v.chapter}|${v.verse}`;
    const getRef = (v) => `${v.book} ${v.chapter}:${v.verse}`; // Format for headingsMap key

    while (i1 < verses1.length || i2 < verses2.length) {
        const v1 = verses1[i1];
        const v2 = verses2[i2];

        let useV1 = false;
        let useV2 = false;

        if (!v2) {
            useV1 = true;
        } else if (!v1) {
            useV2 = true;
        } else {
            const id1 = getId(v1);
            const id2 = getId(v2);

            if (id1 === id2) {
                useV1 = true;
                useV2 = true;
            } else {
                if (v1.book === v2.book) {
                    const c1 = parseInt(v1.chapter);
                    const v_num1 = parseInt(v1.verse);
                    const c2 = parseInt(v2.chapter);
                    const v_num2 = parseInt(v2.verse);

                    if (c1 < c2 || (c1 === c2 && v_num1 < v_num2)) {
                        useV1 = true;
                    } else {
                        useV2 = true;
                    }
                } else {
                    if (v2.book === lastBook1) {
                        useV2 = true;
                    } else if (v1.book === lastBook2) {
                        useV1 = true;
                    } else {
                        useV1 = true;
                    }
                }
            }
        }

        const refVerse = useV1 ? v1 : v2;
        const refString = getRef(refVerse);

        const h1 = headingsMap1 && headingsMap1.has(refString) ? headingsMap1.get(refString) : null;
        const h2 = headingsMap2 && headingsMap2.has(refString) ? headingsMap2.get(refString) : null;

        if (h1 || h2) {
            aligned1.push({
                type: h1 ? 'heading' : 'empty-heading',
                content: h1 || '',
                book: refVerse.book,
            });
            aligned2.push({
                type: h2 ? 'heading' : 'empty-heading',
                content: h2 || '',
                book: refVerse.book,
            });
        }

        if (useV1) {
            aligned1.push({ ...v1, type: 'verse' });
            lastBook1 = v1.book;
            i1++;
        } else {
            aligned1.push({
                type: 'empty-verse',
                book: refVerse.book,
                chapter: refVerse.chapter,
                verse: refVerse.verse,
            });
        }

        if (useV2) {
            aligned2.push({ ...v2, type: 'verse' });
            lastBook2 = v2.book;
            i2++;
        } else {
            aligned2.push({
                type: 'empty-verse',
                book: refVerse.book,
                chapter: refVerse.chapter,
                verse: refVerse.verse,
            });
        }
    }

    return [aligned1, aligned2];
}
