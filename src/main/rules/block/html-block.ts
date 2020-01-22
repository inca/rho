import { Cursor, Region } from '../../core';
import { BlockRule } from './block';
import { TextNode } from '../../nodes';

export class HtmlBlockRule extends BlockRule {

    protected scanBlock(cursor: Cursor): Region | null {
        const start = cursor.pos;
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.subRegion(start, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        // Html blocks are emitted as is
        return new TextNode(region);
    }

    protected parseSelectorAt() {
        // Selector expressions are not supported
        return null;
    }

}
