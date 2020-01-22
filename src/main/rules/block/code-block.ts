import { Cursor, Region, Processor, Node } from '../../core';
import { BlockRule } from './block';
import { HtmlElementNode } from '../../nodes';

export class CodeBlockRule extends BlockRule {
    marker: string;

    protected contentStart: number = 0;
    protected contentEnd: number = 0;

    constructor(
        processor: Processor,
        options: {
            marker?: string,
        } = {}
    ) {
        super(processor);
        this.marker = options.marker ?? '```';
    }

    protected scanBlock(cursor: Cursor): Region | null {
        const { marker } = this;
        if (!cursor.at(marker)) {
            return null;
        }
        const blockStart = cursor.pos;
        cursor.skip(marker.length).skipToEol();
        this.contentStart = cursor.pos;
        const end = cursor.indexOfEscaped(marker);
        if (end == null) {
            return null;
        }
        this.contentEnd = end;
        cursor
            .set(end)
            .skip(marker.length)
            .skipBlankLines();
        return cursor.subRegion(blockStart, cursor.pos);
    }

    protected parseSubRegion(region: Region) {
        const offset = this.contentStart - region.start;
        const length = this.contentEnd - this.contentStart;
        return this.parseContent(region.subRegion(offset, offset + length));
    }

    protected parseContent(region: Region) {
        const codeParser = this.processor.getParser('code');
        const cursor = new Cursor(region);
        // Note: we skip exactly one leading newline,
        // this allows code blocks to add leading blank lines
        cursor.skipSpaces().skipNewLine();
        const lines: Node[] = [];
        while (cursor.hasCurrent()) {
            cursor.skipSpaces(this.indent);
            const start = cursor.pos;
            cursor.skipToEol().skipNewLine();
            const line = cursor.subRegion(start, cursor.pos);
            const ast = codeParser.parse(line);
            lines.push(ast);
        }
        const code = new HtmlElementNode(region, lines, 'code', null, false, false);
        const pre = new HtmlElementNode(region, [code], 'pre', this.selector, true, false);
        return pre;
    }

}
