import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { TextNode } from '../../nodes/text';
import { Node } from '../../node';

/**
 * Emits a single character as is. Useful as a fallback rule i.e. last rule
 * in parser which makes sure that cursor does not get stuck on any unmatched control characters.
 */
export class LiteralRule extends Rule {

    parse(cursor: Cursor): Node | null {
        return new TextNode(cursor.readForward(1));
    }

}
