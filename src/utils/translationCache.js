/**
 * Smart LRU translation cache backed by sessionStorage.
 *
 * Lives for the duration of the browser tab session — cleared automatically
 * when the tab is closed, so stale data never persists across sessions.
 *
 * Eviction rules (applied in order):
 *  1. TTL  — entries older than MAX_AGE_MS are treated as expired on read.
 *  2. Sweep — expired entries are pruned before every write.
 *  3. LRU   — when at MAX_ENTRIES capacity, the least-recently-accessed
 *             entry is evicted to make room.
 *  4. Overflow — if sessionStorage throws (quota exceeded), the oldest half
 *               of entries are dropped and the write is retried once.
 */

const CACHE_KEY = 'blessings_verse_cache';
const MAX_ENTRIES = 20; // max unique (translation × versesString) combos
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes TTL

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadStore() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function persist(store) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {
        // sessionStorage quota hit — drop the oldest half and retry once
        _evictOldestHalf(store);
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(store));
        } catch {
            // Give up silently; the cache will just be a no-op this time
        }
    }
}

function _evictOldestHalf(store) {
    const sorted = Object.keys(store).sort((a, b) => store[a].lastAccessed - store[b].lastAccessed);
    const dropCount = Math.ceil(sorted.length / 2);
    for (let i = 0; i < dropCount; i++) {
        delete store[sorted[i]];
    }
}

function _evictLRU(store) {
    const keys = Object.keys(store);
    if (!keys.length) return;
    const lru = keys.reduce((oldest, key) =>
        store[key].lastAccessed < store[oldest].lastAccessed ? key : oldest
    );
    delete store[lru];
}

function _sweepExpired(store, now) {
    for (const key of Object.keys(store)) {
        if (now - store[key].timestamp > MAX_AGE_MS) {
            delete store[key];
        }
    }
}

function _makeKey(translation, versesString) {
    return `${translation}::${versesString}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return cached data for the given translation + versesString, or null on a
 * cache miss / expired entry.
 *
 * @param {string} translation  e.g. "NIV", "TB"
 * @param {string} versesString e.g. "Genesis 1:1-3:7,Matthew 1:1-25"
 * @returns {{ versesData: Array, headingsMap: Map }|null}
 */
export function getCached(translation, versesString) {
    const store = loadStore();
    const key = _makeKey(translation, versesString);
    const entry = store[key];

    if (!entry) return null;

    // Expired?
    if (Date.now() - entry.timestamp > MAX_AGE_MS) {
        delete store[key];
        persist(store);
        return null;
    }

    // Touch the entry to keep it fresh in LRU ordering
    entry.lastAccessed = Date.now();
    entry.accessCount = (entry.accessCount || 0) + 1;
    persist(store);

    return {
        versesData: entry.versesData,
        // Map is not JSON-serialisable; it was stored as an entries array
        headingsMap: new Map(entry.headingsMapEntries),
    };
}

/**
 * Store the fetched result in the cache.
 *
 * @param {string} translation
 * @param {string} versesString
 * @param {{ versesData: Array, headingsMap: Map }} data
 */
export function setCached(translation, versesString, data) {
    const store = loadStore();
    const now = Date.now();

    // 1. Purge expired entries first (keeps the store tidy)
    _sweepExpired(store, now);

    // 2. Enforce max-entries cap via LRU eviction
    while (Object.keys(store).length >= MAX_ENTRIES) {
        _evictLRU(store);
    }

    const key = _makeKey(translation, versesString);
    store[key] = {
        versesData: data.versesData,
        // Serialise Map → plain array so JSON.stringify works
        headingsMapEntries: Array.from(data.headingsMap.entries()),
        timestamp: now,
        lastAccessed: now,
        accessCount: 1,
    };

    persist(store);
}

/**
 * Wipe the entire cache (useful for debugging or forced refresh).
 */
export function clearCache() {
    sessionStorage.removeItem(CACHE_KEY);
}

/**
 * Return a lightweight snapshot of current cache stats (for debugging).
 */
export function getCacheStats() {
    const store = loadStore();
    const now = Date.now();
    const entries = Object.entries(store);
    return {
        total: entries.length,
        maxEntries: MAX_ENTRIES,
        maxAgeMinutes: MAX_AGE_MS / 60_000,
        entries: entries.map(([key, e]) => ({
            key,
            ageSeconds: Math.round((now - e.timestamp) / 1000),
            lastAccessedSeconds: Math.round((now - e.lastAccessed) / 1000),
            accessCount: e.accessCount,
            versesCount: e.versesData?.length ?? 0,
        })),
    };
}
