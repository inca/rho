import { Rule, Region, Node, Cursor } from '../../core';

export abstract class BlockRule extends Rule {
    indent: number = 0;

    protected abstract parseSubRegion(region: Region): Node | null;
    protected abstract scanBlock(cursor: Cursor): number | null;

    protected parseAt(cursor: Cursor): Node | null {
        cursor.skipBlankLines();
        this.countBlockIndent(cursor);
        const end = this.scanBlock(cursor.clone());
        if (end == null) {
            return null;
        }
        const region = cursor.readUntil(end);
        return this.parseSubRegion(region);
    }

    countBlockIndent(cursor: Cursor) {
        this.indent = 0;
        while (cursor.hasCurrent()) {
            if (cursor.at(' ')) {
                this.indent += 1;
                cursor.skip();
            } else {
                break;
            }
        }
    }

    parseInlineContent(region: Region): Node[] {
        const parser = this.processor.getParser('inline');
        const ast = parser.parse(region);
        return ast.children;
    }

}
