const ampEscape = /&(?!(?:[a-zA-Z]+|#[0-9]+|#[xX][0-9a-fA-F]+);)/g;

export function escapeHtml(str: string) {
    return str
        .replace(ampEscape, '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('\'', '&quot;')
        .replace('\'', '&#x27;');
}
