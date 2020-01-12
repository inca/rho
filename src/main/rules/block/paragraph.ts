import { Rule, Cursor, Node, Region } from '../../core';
import { HtmlElementNode } from '../../nodes/html-element';
import { BlockRule } from './block';

export class ParagraphRule extends BlockRule {

    protected scanBlock(cursor: Cursor): number | null {
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.position();
    }

    protected parseSubRegion(region: Region) {
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'p');
    }

}
