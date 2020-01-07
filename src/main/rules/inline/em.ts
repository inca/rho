import { BracketRule, Node, Processor, StringRegion } from '../../core';

export class EmRule extends BracketRule {
    get openMarker() { return '_'; }
    get closeMarker() { return '_'; }

    parseSubRegion(region: StringRegion): Node {
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
