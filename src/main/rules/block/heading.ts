import { Cursor, Region, Processor } from '../../core';
import { HtmlElementNode } from '../../nodes/html-element';
import { BlockRule } from './block';

export class HeadingRule extends BlockRule {
    minLevel: number;
    maxLevel: number;

    level: number = 0;

    constructor(
        processor: Processor,
        options: {
            minLevel: number,
            maxLevel: number,
        }
    ) {
        super(processor);
        this.minLevel = options.minLevel;
        this.maxLevel = options.maxLevel;
    }

    protected scanBlock(cursor: Cursor): Region | null {
        this.level = 0;
        while (cursor.at('#')) {
            cursor.skip();
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
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'h' + this.level, this.selector);
    }

}
