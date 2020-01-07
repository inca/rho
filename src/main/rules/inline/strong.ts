import { BracketRule, StringRegion, Processor, Node } from '../../core';

export class StrongRule extends BracketRule {
    get openMarker() { return '*'; }
    get closeMarker() { return '*'; }

    parseSubRegion(region: StringRegion): Node {
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new StrongNode(region, root.children);
    }
}

export class StrongNode extends Node {
    render(processor: Processor) {
        return `<strong>${this.renderChildren(processor)}</strong>`;
    }
}
