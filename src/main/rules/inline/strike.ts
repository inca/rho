import { BracketRule, Node, Processor, Region } from '../../core';

export class StrikeRule extends BracketRule {
    get openMarker() { return '~'; }
    get closeMarker() { return '~'; }

    protected parseSubRegion(region: Region): Node {
        const inlineParser = this.processor.getParser('inline');
        const root = inlineParser.parse(region);
        return new StrikeNode(region, root.children);
    }
}

export class StrikeNode extends Node {
    render(processor: Processor) {
        return `<s>${this.renderChildren(processor)}</s>`;
    }
}
