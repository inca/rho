import { Rule, Node, Cursor, constants } from '../../core';
import { TextNode } from '../../nodes/text';

const { CHAR_LT, CHAR_GT, CHAR_SLASH } = constants;

export class HtmlTagRule extends Rule {

    protected parseAt(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_LT)) {
            return null;
        }
        const start = cursor.pos;
        cursor.skip();  // <
        // Closing html are accepted here
        let closingTag = false;
        if (cursor.atCode(CHAR_SLASH)) {
            cursor.skip();
            closingTag = true;
        }
        // Match tagname
        if (!cursor.atLatin()) {
            return null;
        }
        while (cursor.atIdentifier()) {
            cursor.skip();
        }
        // For closing tags there can be only whitespace followed by >
        if (closingTag) {
            cursor.skipWhitespaces();
            if (!cursor.atCode(CHAR_GT)) {
                return null;
            }
            cursor.skip();
            return new TextNode(cursor.subRegion(start, cursor.pos));
        }
        // Opening and self-closing tags support attributes,
        // but only after whitespace.
        if (!cursor.atWhitespace()) {
            // No attributes, so it's either > or />
            if (this.matchTagEnd(cursor)) {
                return new TextNode(cursor.subRegion(start, cursor.pos));
            }
            return null;
        }
        cursor.skipWhitespaces();
        // Parsing attributes is over-complicated, so just search for > or />
        while (cursor.hasCurrent()) {
            if (this.matchTagEnd(cursor)) {
                return new TextNode(cursor.subRegion(start, cursor.pos));
            }
            cursor.skip();
        }
        return null;
    }

    protected matchTagEnd(cursor: Cursor) {
        if (cursor.atCode(CHAR_GT)) {
            cursor.skip();
            return true;
        }
        if (cursor.at('/>')) {
            cursor.skip(2);
            return true;
        }
        return false;
    }

}
