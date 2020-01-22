import { Region } from '../../core';
import { HtmlElementNode } from '../../nodes';
import { FencedBlockRule } from './fenced-block';

export class DivBlockRule extends FencedBlockRule {
    protected contentStart: number = 0;
    protected contentEnd: number = 0;

    get marker() {
        return '~~~';
    }

    protected parseContent(region: Region) {
        const blockParser = this.processor.getParser('block');
        const ast = blockParser.parse(region);
        const div = new HtmlElementNode(region, ast.children, 'div', this.selector);
        return div;
    }

}
