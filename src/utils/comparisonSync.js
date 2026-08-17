/**
 * Align any number of translations to the same heading and verse rows.
 * The first dataset establishes book order; missing rows receive placeholders.
 *
 * @param {Array<{versesData: Array, headingsMap: Map}>} datasets
 * @returns {Array<Array>}
 */
export function syncComparisonGroup(datasets) {
    if (!datasets.length) return [];

    const getId = (verse) => `${verse.book}|${verse.chapter}|${verse.verse}`;
    const getRef = (verse) => `${verse.book} ${verse.chapter}:${verse.verse}`;
    const bookOrder = new Map();
    const references = new Map();

    datasets.forEach(({ versesData = [] }) => {
        versesData.forEach((verse) => {
            if (!bookOrder.has(verse.book)) bookOrder.set(verse.book, bookOrder.size);
            if (!references.has(getId(verse))) references.set(getId(verse), verse);
        });
    });

    const orderedReferences = Array.from(references.values()).sort((a, b) => {
        const bookDifference = bookOrder.get(a.book) - bookOrder.get(b.book);
        if (bookDifference !== 0) return bookDifference;

        const chapterDifference = Number(a.chapter) - Number(b.chapter);
        if (chapterDifference !== 0) return chapterDifference;
        return Number(a.verse) - Number(b.verse);
    });

    const verseMaps = datasets.map(
        ({ versesData = [] }) => new Map(versesData.map((verse) => [getId(verse), verse]))
    );
    const aligned = datasets.map(() => []);

    orderedReferences.forEach((reference) => {
        const id = getId(reference);
        const refString = getRef(reference);
        const headings = datasets.map(({ headingsMap }) => headingsMap?.get(refString) || null);

        if (headings.some(Boolean)) {
            headings.forEach((heading, index) => {
                aligned[index].push({
                    type: heading ? 'heading' : 'empty-heading',
                    content: heading || '',
                    book: reference.book,
                });
            });
        }

        verseMaps.forEach((verseMap, index) => {
            const verse = verseMap.get(id);
            aligned[index].push(
                verse
                    ? { ...verse, type: 'verse' }
                    : {
                          type: 'empty-verse',
                          book: reference.book,
                          chapter: reference.chapter,
                          verse: reference.verse,
                      }
            );
        });
    });

    return aligned;
}

/** Preserve the original two-translation API for existing callers. */
export function syncComparisons(verses1, headingsMap1, verses2, headingsMap2) {
    return syncComparisonGroup([
        { versesData: verses1, headingsMap: headingsMap1 },
        { versesData: verses2, headingsMap: headingsMap2 },
    ]);
}
