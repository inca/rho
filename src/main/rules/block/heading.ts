import { Cursor, Region, Context } from '../../core';
import { BlockRule } from './block';
import { HtmlElementNode } from '../../nodes';

export class HeadingRule extends BlockRule {
    marker: string;
    minLevel: number;
    maxLevel: number;

    level: number = 0;

    constructor(
        ctx: Context,
        options: {
            marker?: string,
            minLevel: number,
            maxLevel: number,
        }
    ) {
        super(ctx);
        this.marker = options.marker ?? '#';
        this.minLevel = options.minLevel;
        this.maxLevel = options.maxLevel;
    }

    protected scanBlock(cursor: Cursor): Region | null {
        this.level = 0;
        while (cursor.at(this.marker)) {
            cursor.skip(this.marker.length);
            this.level += 1;
        }
        if (!cursor.atSpace() || this.level < this.minLevel || this.level > this.maxLevel) {
            return null;
        }
        cursor.skipSpaces();
        const start = cursor.pos;
        cursor.skipToEndOfBlock().skipBlankLines();
        return cursor.subRegion(start, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const children = this.parseInlineContent(region);
        return new HtmlElementNode(region, children, 'h' + this.level, this.selector);
    }

}
