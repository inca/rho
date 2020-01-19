import { Cursor, Region } from '../../core';
import { HtmlElementNode } from '../../nodes/html-element';
import { BlockRule } from './block';

export class ParagraphRule extends BlockRule {

    protected scanBlock(cursor: Cursor): Region | null {
        const start = cursor.pos;
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.subRegion(start, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const children = this.parseInlineContent(region);
        return new HtmlElementNode(region, children, 'p', this.selector);
    }

}
