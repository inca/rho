import pretty from 'pretty';

export function normalize(html: string) {
    return pretty(html, { ocd: true });
}
