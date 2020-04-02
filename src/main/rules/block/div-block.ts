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
        const children = this.parseBlockContent(region);
        const div = new HtmlElementNode(region, children, 'div', this.selector);
        return div;
    }

}
