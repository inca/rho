import { Rule, Node, Cursor } from '../../core';
import { TextNode } from '../../nodes/text';
import { matchHtmlTag } from '../../util/html';

export class HtmlTagRule extends Rule {

    protected parseAt(cursor: Cursor): Node | null {
        const tag = matchHtmlTag(cursor);
        if (tag) {
            return new TextNode(tag.region);
        }
        return null;
    }

}
