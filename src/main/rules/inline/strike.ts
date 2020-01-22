import { BracketRule, Node, Region } from '../../core';
import { HtmlElementNode } from '../../nodes';

export class StrikeRule extends BracketRule {
    get openMarker() { return '~'; }
    get closeMarker() { return '~'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new HtmlElementNode(region, root.children, 's', null, false, false);
    }
}
