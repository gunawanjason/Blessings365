import { API_BASE_URL } from '../data/config.js';

/**
 * Fetch verses for a given translation and verse references.
 */
export async function fetchVerses(translation, versesString) {
    const url = `${API_BASE_URL}/${translation}/multiple?verses=${encodeURIComponent(versesString)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch verses: ${response.status}`);
    return response.json();
}

/**
 * Fetch pericope headings for a given book and translation.
 */
export async function fetchHeadings(translation, bookName) {
    try {
        const url = `${API_BASE_URL}/${translation}/headings?book=${encodeURIComponent(bookName)}`;
        const response = await fetch(url);
        if (!response.ok) return { book: bookName, headings: {} };
        return response.json();
    } catch {
        return { book: bookName, headings: {} };
    }
}

/**
 * Build a headings map from API headings response.
 */
export function buildHeadingsMap(headingsResponse) {
    const map = new Map();
    if (!headingsResponse || !headingsResponse.headings) return map;

    const chapters = headingsResponse.headings;
    for (const chapter in chapters) {
        if (chapters.hasOwnProperty(chapter)) {
            const chapterHeadings = chapters[chapter];
            if (Array.isArray(chapterHeadings)) {
                chapterHeadings.forEach(h => {
                    const key = `${headingsResponse.book} ${chapter}:${h.start}`;
                    map.set(key, h.heading);
                });
            }
        }
    }
    return map;
}

/**
 * Fetch all verses and headings for a given day.
 */
export async function fetchDayData(translation, versesString) {
    const uniqueBooks = extractUniqueBooksFromString(versesString);

    const [versesData, ...headingsResponses] = await Promise.all([
        fetchVerses(translation, versesString),
        ...uniqueBooks.map(book => fetchHeadings(translation, book)),
    ]);

    // Merge all headings into a single map
    const allHeadings = new Map();
    headingsResponses.forEach(res => {
        const map = buildHeadingsMap(res);
        map.forEach((value, key) => allHeadings.set(key, value));
    });

    return { versesData, headingsMap: allHeadings };
}

function extractUniqueBooksFromString(versesString) {
    const ranges = versesString.split(',');
    const books = new Set();
    for (const range of ranges) {
        const trimmed = range.trim();
        const match = trimmed.match(/(.+)\s\d+:/);
        if (match) {
            books.add(match[1]);
        } else {
            const lastSpaceIndex = trimmed.lastIndexOf(' ');
            if (lastSpaceIndex !== -1) books.add(trimmed.substring(0, lastSpaceIndex));
        }
    }
    return [...books];
}
