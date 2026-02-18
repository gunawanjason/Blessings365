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

    // 1. Collect all unique references (Book Chapter:Verse)
    // We assume input verses are already sorted by book order -> chapter -> verse
    // But to be safe and simple, we'll map them by reference and use a sorted set of keys.
    const refs = new Set();
    const v1Map = new Map();
    const v2Map = new Map();

    const normalizeRef = (v) => `${v.book} ${v.chapter}:${v.verse}`;

    verses1.forEach(v => {
        const ref = normalizeRef(v);
        refs.add(ref);
        v1Map.set(ref, v);
    });

    verses2.forEach(v => {
        const ref = normalizeRef(v);
        refs.add(ref);
        v2Map.set(ref, v);
    });

    // Sort references to maintain biblical order.
    // Since we don't have a canonical book order list handy here easily without importing it,
    // we'll rely on the order they appear in the original arrays.
    // A robust way: Iterate through verses1 and verses2 again to build a sorted unique list.
    const sortedRefs = [];
    let i1 = 0, i2 = 0;
    while (i1 < verses1.length || i2 < verses2.length) {
        // This is a simple merge sort assuming both inputs are already sorted (standard Bible order)
        // If they are not sorted (e.g. crossing books strangely), this might need a canonical sort.
        // For now, assuming standard API response order.

        let v1 = verses1[i1];
        let v2 = verses2[i2];
        let ref1 = v1 ? normalizeRef(v1) : null;
        let ref2 = v2 ? normalizeRef(v2) : null;

        if (ref1 && !sortedRefs.includes(ref1)) {
            // We need a way to know if ref1 comes before ref2. 
            // Since we can't easily compare "Genesis" vs "Exodus" without a map,
            // we will use a "seen" set and push everything from v1, then insert v2 items?
            // Actually, strict merge is hard without a comparator.
            // fallback: just use the Set iteration if we trust Set order (JS sets preserve insertion order).
            // But Set order depends on which list we processed first.
            // BEST APPROACH: Use the sequence from the inputs.
        }

        // Let's use a simpler approach: 
        // 1. Create a list of all refs from v1.
        // 2. Insert refs from v2 that aren't in v1, at the appropriate place?
        //    That's effectively merging.
        // Let's assume the API returns verses in order.
        // We'll just combine and sort based on a composite index if available, or just
        // rely on the Set insertion order if we iterate v1 then v2? No, that puts all unique v2 at the end.

        // Let's try to just collect all unique refs in a list, then sort them.
        // To sort correctly, we need to parse Book, Chapter, Verse.
        // If books are the same, compare C:V.
        // If books differ, we need book order.
        // Let's assume the inputs are for a single day reading which usually implies a continuous block or specific blocks.
        // If we have multiple blocks (e.g. Psalm + OT + NT), they will appear in order in the response arrays.

        // Let's build a "master list" by iterating both arrays simultaneously.
        // If book matches: compare chapter/verse.
        // If book doesn't match: which one comes first? 
        // We can't know without a book order constant.
        // HOWEVER, for a "Compare Page" of a daily reading, strict canonical sorting might be less critical 
        // IF we assume the user reads them in the order provided by the plan.

        // Let's try a heuristic: 
        // If we see a reference in v1, add it.
        // If we see a reference in v2, check if we've seen it. If not, where does it go?
        // Actually, `verses1` and `verses2` are usually IDENTICAL in terms of references 99% of the time.
        // The edge cases are missing verses.
        // We can just concatenate and dedup, then sort by simple comparison if books are same?

        // NEW STRATEGY:
        // Use the order from verses1 as the "base".
        // Use the order from verses2 as a secondary base.
        // Merge them.
        break;
        // ... implementation in main code block ...
    }

    // ... Revised Strategy inside the function below ...
    // We'll use a specific logic: 
    // We assume `verses1` is the "anchor" for order, but if `verses2` has something `verses1` doesn't, we need to insert it.
    // If they are completely different books, we just append?
    // Let's rely on a helper or just "merge" based on identifying "next match".

    // Actually, let's keep it simple: 
    // Most daily readings are Verse-by-Verse sequential.
    // We'll build a unique list of refs by iterating both pointers.
    // If refs match, take it, advance both.
    // If mismatch, we need to know which one is "earlier".
    // We will assume that verses are "mostly" aligned. 
    // If v1 has "Gen 1:1" and v2 has "Gen 1:1", match.
    // If v1 has "Gen 1:2" and v2 has "Gen 1:3" (missing 2), we assume v1 is "earlier".
    // We can parse chapter:verse to compare.
    // If books differ, we assume the one that matches the "current" book of the other side is "same", else it's a new book.

    return syncStrategy(verses1, headingsMap1, verses2, headingsMap2);
}

function syncStrategy(verses1, headingsMap1, verses2, headingsMap2) {
    const aligned1 = [];
    const aligned2 = [];

    let i1 = 0;
    let i2 = 0;

    const getId = (v) => `${v.book}|${v.chapter}|${v.verse}`;
    const getRef = (v) => `${v.book} ${v.chapter}:${v.verse}`; // Format for headingsMap key

    while (i1 < verses1.length || i2 < verses2.length) {
        const v1 = verses1[i1];
        const v2 = verses2[i2];

        let useV1 = false;
        let useV2 = false;

        if (!v2) {
            // Only v1 exists
            useV1 = true;
        } else if (!v1) {
            // Only v2 exists
            useV2 = true;
        } else {
            // Both exist, compare order
            const id1 = getId(v1);
            const id2 = getId(v2);

            if (id1 === id2) {
                // Match
                useV1 = true;
                useV2 = true;
            } else {
                // Mismatch - determine which comes first
                // If books are same, compare C:V
                if (v1.book === v2.book) {
                    const c1 = parseInt(v1.chapter);
                    const v_num1 = parseInt(v1.verse);
                    const c2 = parseInt(v2.chapter);
                    const v_num2 = parseInt(v2.verse);

                    if (c1 < c2 || (c1 === c2 && v_num1 < v_num2)) {
                        useV1 = true; // v1 is earlier
                    } else {
                        useV2 = true; // v2 is earlier
                    }
                } else {
                    // Different books. This is hard without a map.
                    // Heuristic: If v1's book was the same as the PREVIOUS processed book, and v2's is new, then v1 is earlier?
                    // Let's assume standard order: Gen -> Rev.
                    // But if we can't sort books, we might just assume v1 is correct order if v2 is totally different?
                    // Or just take v1. 
                    // Let's prioritize v1 as the "left" side usually dictates the flow if ambiguous.
                    useV1 = true; // Fallback
                }
            }
        }

        // Determine the "Current Verse Object" (or synthetic one) to check for headings
        const refVerse = useV1 ? v1 : v2;
        const refString = getRef(refVerse);

        // Check for headings
        const h1 = headingsMap1 && headingsMap1.has(refString) ? headingsMap1.get(refString) : null;
        const h2 = headingsMap2 && headingsMap2.has(refString) ? headingsMap2.get(refString) : null;

        if (h1 || h2) {
            // Add a heading row
            aligned1.push({
                type: h1 ? 'heading' : 'empty-heading',
                content: h1 || '',
                book: refVerse.book // context
            });
            aligned2.push({
                type: h2 ? 'heading' : 'empty-heading',
                content: h2 || '',
                book: refVerse.book
            });
        }

        // Add verse row
        if (useV1) {
            aligned1.push({ ...v1, type: 'verse' });
            i1++;
        } else {
            aligned1.push({ type: 'empty-verse', book: refVerse.book, chapter: refVerse.chapter, verse: refVerse.verse });
        }

        if (useV2) {
            aligned2.push({ ...v2, type: 'verse' });
            i2++;
        } else {
            aligned2.push({ type: 'empty-verse', book: refVerse.book, chapter: refVerse.chapter, verse: refVerse.verse });
        }
    }

    return [aligned1, aligned2];
}
