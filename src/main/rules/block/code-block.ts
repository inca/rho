import { Cursor, Region, Node } from '../../core';
import { HtmlElementNode } from '../../nodes';
import { FencedBlockRule } from './fenced-block';

export class CodeBlockRule extends FencedBlockRule {
    protected contentStart: number = 0;
    protected contentEnd: number = 0;

    get marker() {
        return '```';
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
