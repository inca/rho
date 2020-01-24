import { BracketRule, Node, Region } from '../../core';
import { HtmlElementNode } from '../../nodes';

export class CodeSpanRule extends BracketRule {
    get openMarker() { return '`'; }
    get closeMarker() { return '`'; }

    protected parseSubRegion(region: Region): Node {
        const codeParser = this.ctx.getParser('code');
        const root = codeParser.parse(region);
        return new HtmlElementNode(region, root.children, 'code', null, true);
    }
}
