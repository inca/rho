import { BracketRule, Node, Processor, Region } from '../../core';

export class EmRule extends BracketRule {
    get openMarker() { return '_'; }
    get closeMarker() { return '_'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new EmNode(region, root.children);
    }
}

export class EmNode extends Node {
    render(processor: Processor) {
        return `<em>${this.renderChildren(processor)}</em>`;
    }
}
