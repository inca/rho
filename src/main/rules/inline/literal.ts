import { Rule, Cursor, Node } from '../../core';
import { TextNode } from '../../nodes/text';

/**
 * Emits a single character as is. Useful as a fallback rule i.e. last rule
 * in parser which makes sure that cursor does not get stuck on any unmatched control characters.
 */
export class LiteralRule extends Rule {

    protected parseAt(cursor: Cursor): Node | null {
        return new TextNode(cursor.readForward(1));
    }

}
