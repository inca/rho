import { ContextWithMedia } from '../context';
import { Node, Cursor, constants } from '../core';

const { CHAR_BACKSLASH, CHAR_PIPE, CHAR_COMMA } = constants;
const HREF_AUX_DELIMITERS = [
    0x58,   // X
    0x78,   // x
    CHAR_COMMA
];

export interface MediaDef {
    href: string;
    title?: string;
    external?: boolean;
    customRender?: (this: MediaDef, node: Node, ctx: ContextWithMedia) => string;
}

export interface MediaHref {
    src: string;
    width?: number;
    height?: number;
}

export function parseHref(str: string): MediaHref {
    let src = '';
    let width = '';
    let height = '';
    const cursor = new Cursor(str);
    while (cursor.hasCurrent()) {
        if (cursor.atCode(CHAR_BACKSLASH)) {
            src += cursor.peek(1);
            cursor.skip(2);
            continue;
        }
        if (cursor.atCode(CHAR_PIPE)) {
            cursor.skip();
            break;
        }
        src += cursor.current();
        cursor.skip();
    }
    // Additionally, parse width and height if provided
    while (cursor.hasCurrent() && cursor.atDigit()) {
        width += cursor.current();
        cursor.skip();
    }
    if (HREF_AUX_DELIMITERS.some(_ => cursor.atCode(_))) {
        cursor.skip();
        while (cursor.hasCurrent() && cursor.atDigit()) {
            height += cursor.current();
            cursor.skip();
        }
    }
    return {
        src,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
    };
}
