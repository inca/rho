import { BracketRule, Node, Processor, Region } from '../../core';
import { HtmlElementNode } from '../../nodes';

export class EmRule extends BracketRule {
    get openMarker() { return '_'; }
    get closeMarker() { return '_'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.ctx.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'em', null, false, false);
    }
}
