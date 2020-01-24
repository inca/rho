import { BracketRule, Region, Node } from '../../core';
import { HtmlElementNode } from '../../nodes';

export class StrongRule extends BracketRule {
    get openMarker() { return '*'; }
    get closeMarker() { return '*'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.ctx.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'strong', null, true);
    }
}
