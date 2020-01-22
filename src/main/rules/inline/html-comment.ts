import { Rule, Node, Cursor } from '../../core';
import { TextNode } from '../../nodes/text';

const CHAR_LT = 0x3c;

export class HtmlCommentRule extends Rule {
    protected parseAt(cursor: Cursor): Node | null {
        if (!cursor.atCode(CHAR_LT)) {
            return null;
        }
        if (!cursor.at('<!--')) {
            return null;
        }
        const start = cursor.pos;
        while (cursor.hasCurrent()) {
            if (cursor.at('-->')) {
                cursor.skip(3);
                return new TextNode(cursor.subRegion(start, cursor.pos));
            }
            cursor.skip();
        }
        return null;
    }

}
