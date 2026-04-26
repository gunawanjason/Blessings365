const positions = { read: {}, compare: {} };

export function saveScrollPos(namespace, bookName, pos) {
    if (namespace && bookName) positions[namespace][bookName] = pos;
}

export function getScrollPos(namespace, bookName) {
    return positions[namespace]?.[bookName] ?? 0;
}
