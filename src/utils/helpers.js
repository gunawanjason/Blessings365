/**
 * Check if a year is a leap year
 */
export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the day of year for a given date (1-365).
 * Adjusts for leap years so that Feb 29 maps to the same day as Feb 28.
 */
export function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
    const oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);

    if (
        isLeapYear(date.getFullYear()) &&
        ((date.getMonth() === 1 && date.getDate() === 29) || date.getMonth() > 1)
    ) {
        day -= 1;
    }

    return day;
}

/**
 * Get the number of days in each month
 */
export function getDaysInMonth(month, year) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (isLeapYear(year) && month === 2) return 29;
    return daysInMonth[month - 1];
}

/**
 * Month names
 */
export const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

/**
 * Cookie helpers
 */
export function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

export function getCookie(name) {
    const prefix = name + '=';
    const ca = document.cookie.split(';');
    for (let c of ca) {
        c = c.trim();
        if (c.indexOf(prefix) === 0) return c.substring(prefix.length);
    }
    return '';
}

/**
 * Unicode bold mapping for copy formatting
 */
const boldMap = {
    A: '𝗔',
    B: '𝗕',
    C: '𝗖',
    D: '𝗗',
    E: '𝗘',
    F: '𝗙',
    G: '𝗚',
    H: '𝗛',
    I: '𝗜',
    J: '𝗝',
    K: '𝗞',
    L: '𝗟',
    M: '𝗠',
    N: '𝗡',
    O: '𝗢',
    P: '𝗣',
    Q: '𝗤',
    R: '𝗥',
    S: '𝗦',
    T: '𝗧',
    U: '𝗨',
    V: '𝗩',
    W: '𝗪',
    X: '𝗫',
    Y: '𝗬',
    Z: '𝗭',
    a: '𝗮',
    b: '𝗯',
    c: '𝗰',
    d: '𝗱',
    e: '𝗲',
    f: '𝗳',
    g: '𝗴',
    h: '𝗵',
    i: '𝗶',
    j: '𝗷',
    k: '𝗸',
    l: '𝗹',
    m: '𝗺',
    n: '𝗻',
    o: '𝗼',
    p: '𝗽',
    q: '𝗾',
    r: '𝗿',
    s: '𝘀',
    t: '𝘁',
    u: '𝘂',
    v: '𝘃',
    w: '𝘄',
    x: '𝘅',
    y: '𝘆',
    z: '𝘇',
    0: '𝟬',
    1: '𝟭',
    2: '𝟮',
    3: '𝟯',
    4: '𝟰',
    5: '𝟱',
    6: '𝟲',
    7: '𝟳',
    8: '𝟴',
    9: '𝟵',
    ' ': ' ',
    ':': ':',
    '-': '-',
    '(': ' (',
    ')': ')',
    ',': ',',
    '.': '.',
};

export function toUnicodeBold(str) {
    return str
        .split('')
        .map((c) => boldMap[c] || c)
        .join('');
}

/**
 * Parse unique book names from a comma-separated verse string.
 */
export function extractUniqueBooks(versesString) {
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

/**
 * Generate consolidated verse reference string like "4, 6-8, 10"
 */
export function generateVerseReferenceString(verseNumbers) {
    if (!verseNumbers || verseNumbers.length === 0) return '';
    const result = [];
    let rangeStart = verseNumbers[0];

    for (let i = 0; i < verseNumbers.length; i++) {
        const current = verseNumbers[i];
        const next = verseNumbers[i + 1];

        if (next !== current + 1 || i === verseNumbers.length - 1) {
            result.push(current === rangeStart ? `${rangeStart}` : `${rangeStart}-${current}`);
            if (next) rangeStart = next;
        }
    }
    return result.join(', ');
}
