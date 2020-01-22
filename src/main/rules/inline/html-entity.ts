import { Rule, Node, Cursor, constants } from '../../core';
import { TextNode } from '../../nodes/text';
import { LiteralNode } from '../../nodes';

const latinLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const decimalDigits = '0123456789';
const hexDigits = '0123456789abcdefABCDEF';

const { CHAR_AMP, CHAR_LT, CHAR_GT } = constants;

export class HtmlEntityRule extends Rule {

    protected parseAt(cursor: Cursor): Node | null {
        return this.tryAmp(cursor) ||
            this.tryLt(cursor) ||
            this.tryGt(cursor);
    }

    /**
     * Ampersands should be escaped as &amp; unless they are
     * part of entity reference.
     */
    tryAmp(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_AMP)) {
            return null;
        }
        // Check for entity reference
        const end = this.matchEntityReference(cursor.clone());
        if (end === null) {
            return new LiteralNode(cursor.readForward(1), '&amp;');
        }
        return new TextNode(cursor.readUntil(end));
    }

    matchEntityReference(cursor: Cursor): number | null {
        cursor.skip();
        let allowedChars = latinLetters;
        if (cursor.at('#x') || cursor.at('#X')) {
            // Hexadecimal escape
            allowedChars = hexDigits;
            cursor.skip(2);
        } else if (cursor.at('#')) {
            allowedChars = decimalDigits;
            cursor.skip(1);
        }
        if (cursor.at(';')) {
            // Invalid entity reference
            return null;
        }
        while (cursor.hasCurrent()) {
            const c = cursor.current();
            if (c === ';') {
                cursor.skip();
                return cursor.pos;
            } else if (allowedChars.indexOf(c) > -1) {
                cursor.skip();
            } else {
                return null;
            }
        }
        return null;
    }

    /**
     * `<` character should be escaped, unless it's a part of HTML tag or comment.
     */
    tryLt(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_LT)) {
            return null;
        }
        return new LiteralNode(cursor.readForward(1), '&lt;');
    }

    /**
     * `>` character is escaped unconditionally. HTML parser should take care of tags
     * which are part of HTML markup.
     */
    tryGt(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_GT)) {
            return null;
        }
        return new LiteralNode(cursor.readForward(1), '&gt;');
    }

}
