import { Rule, Cursor, Node, Region } from '../../core';
import { HtmlElementNode } from '../../nodes/html-element';
import { BlockRule } from './block';

export class ParagraphRule extends BlockRule {

    protected scanBlock(cursor: Cursor): number | null {
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.pos;
    }

    protected parseSubRegion(region: Region) {
        // region here should be already tainted, and proper selector already parsed!
        const cursor = new Cursor(region);
        const selector = this.captureSelector(cursor, false);
        if (selector) {
            region = region.taint(selector.region.start, selector.region.end);
        }
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'p');
    }

}
