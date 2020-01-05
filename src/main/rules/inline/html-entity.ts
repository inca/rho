import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { Node } from '../../node';
import { latinLetters, hexDigits, decimalDigits } from '../../constants';
import { TextNode } from '../../nodes/text';
import { StringRegion } from '../../region';

export class HtmlEntityRule extends Rule {

    parse(cursor: Cursor): Node | null {
        return this.tryAmp(cursor) ||
            this.tryLt(cursor) ||
            this.tryGt(cursor);
    }

    /**
     * Ampersands should be escaped as &amp; unless they are
     * part of entity reference.
     */
    tryAmp(cursor: Cursor): Node | null {
        if (!cursor.at('&')) {
            return null;
        }
        // Check for entity reference
        const end = cursor.lookahead(cur => {
            cur.skip();
            let allowedChars = latinLetters;
            if (cur.at('#x') || cur.at('#X')) {
                // Hexadecimal escape
                allowedChars = hexDigits;
                cur.skip(2);
            } else if (cur.at('#')) {
                allowedChars = decimalDigits;
                cur.skip(1);
            }
            if (cur.at(';')) {
                // Invalid entity reference
                return null;
            }
            while (cur.hasCurrent()) {
                const c = cur.current();
                if (c === ';') {
                    cur.skip();
                    return cur.position();
                } else if (cur.atSome(allowedChars)) {
                    cur.skip();
                } else {
                    return null;
                }
            }
            return null;
        });
        if (end === null) {
            return new HtmlEscapeNode(cursor.readForward(1), '&');
        }
        return new TextNode(cursor.readUntil(end));
    }

    /**
     * `<` character should be escaped, unless it's a part of HTML tag or comment.
     */
    tryLt(cursor: Cursor): Node | null {
        if (!cursor.at('<')) {
            return null;
        }
        if (this.isAtHtmlTag(cursor)) {
            return null;
        }
        if (this.isAtHtmlComment(cursor)) {
            return null;
        }
        return new HtmlEscapeNode(cursor.readForward(1), '<');
    }

    /**
     * `>` character is escaped unconditionally. HTML parser should take care of tags
     * which are part of HTML markup.
     */
    tryGt(cursor: Cursor): Node | null {
        if (!cursor.at('>')) {
            return null;
        }
        return new HtmlEscapeNode(cursor.readForward(1), '>');
    }

    isAtHtmlTag(cursor: Cursor): boolean {
        return cursor.lookahead(cur => {
            cur.skip(); // <
            // Closing tag counts as HTML tag here
            if (cur.at('/')) {
                cur.skip();
            }
            // HTML tag name should start with latin character
            if (!cur.atLatin()) {
                return false;
            }
            // Hack! We look max 1000 characters for > character
            let i = 0;
            while (cur.hasCurrent() && i < 1000) {
                i += 1;
                if (cur.at('>')) {
                    return true;
                }
                cur.skip();
            }
            return false;
        });
    }

    isAtHtmlComment(cursor: Cursor): boolean {
        return cursor.at('<!--');
    }

}

export class HtmlEscapeNode extends Node {

    constructor(
        region: StringRegion,
        protected char: '&' | '<' | '>'
    ) {
        super(region);
    }

    render() {
        switch (this.char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            default:
                return '';
        }
    }
}
