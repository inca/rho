import { Region, Cursor, constants } from '../core';

const { CHAR_LT, CHAR_GT, CHAR_SLASH, CHAR_COLON } = constants;

export function matchHtmlTag(cursor: Cursor): HtmlTag | null {
    if (!cursor.atCode(CHAR_LT)) {
        return null;
    }
    const start = cursor.pos;
    cursor.skip();  // <
    let closingTag = false;
    if (cursor.atCode(CHAR_SLASH)) {
        cursor.skip();
        closingTag = true;
    }
    // Match tagname
    const tagNameStart = cursor.pos;
    if (!cursor.atLatin()) {
        return null;
    }
    while (cursor.atIdentifier() || cursor.atCode(CHAR_COLON)) {
        cursor.skip();
    }
    const tagName = cursor.subRegion(tagNameStart, cursor.pos)
        .toString()
        .toLowerCase();
    // For closing tags there can be only whitespace followed by >
    if (closingTag) {
        cursor.skipWhitespaces();
        if (!cursor.atCode(CHAR_GT)) {
            return null;
        }
        cursor.skip();
        const region = cursor.subRegion(start, cursor.pos);
        return { type: HtmlTagType.CLOSING, tagName, region };
    }
    // Opening and self-closing tags support attributes,
    // but only after whitespace.
    if (!cursor.atWhitespace()) {
        // No attributes, so it's either > or />
        const type = matchTagEnd(cursor);
        if (!type) {
            return null;
        }
        const region = cursor.subRegion(start, cursor.pos);
        return { type, tagName, region };
    }
    cursor.skipWhitespaces();
    // Parsing attributes is over-complicated, so just search for > or />
    while (cursor.hasCurrent()) {
        const type = matchTagEnd(cursor);
        if (type) {
            const region = cursor.subRegion(start, cursor.pos);
            return { type, tagName, region };
        }
        cursor.skip();
    }
    return null;
}

function matchTagEnd(cursor: Cursor): HtmlTagType | null {
    if (cursor.atCode(CHAR_GT)) {
        cursor.skip();
        return HtmlTagType.OPENING;
    }
    if (cursor.atCode(CHAR_SLASH) && cursor.atCode(CHAR_GT, 1)) {
        cursor.skip(2);
        return HtmlTagType.SELF_CLOSING;
    }
    return null;
}

export interface HtmlTag {
    type: HtmlTagType;
    tagName: string;
    region: Region;
}

export enum HtmlTagType { OPENING = 1, CLOSING = 2, SELF_CLOSING = 3 }
