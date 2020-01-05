import { Rule } from '../../rule';
import { Cursor } from '../../cursor';
import { TextNode } from '../../nodes/text';
import { Node } from '../../node';

export class SingleCharRule extends Rule {

    parse(cursor: Cursor): Node | null {
        if (cursor.hasCurrent()) {
            // TODO add support for invalid XML characters
            return new TextNode(cursor.readForward(1));
        }
        return null;
    }

}
