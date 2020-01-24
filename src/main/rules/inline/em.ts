import { Node, Region } from '../../core';
import { HtmlElementNode } from '../../nodes';
import { BracketRule } from '../block/bracket';

export class EmRule extends BracketRule {
    get openMarker() { return '_'; }
    get closeMarker() { return '_'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.ctx.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 'em', null, true);
    }
}
