import { BracketRule, Node, Processor, StringRegion } from '../../core';

export class CodeSpanRule extends BracketRule {
    get openMarker() { return '`'; }
    get closeMarker() { return '`'; }

    parseSubRegion(region: StringRegion): Node {
        const codeParser = this.processor.getParser('code');
        const root = codeParser.parse(region);
        return new CodeSpanNode(region, root.children);
    }
}

export class CodeSpanNode extends Node {
    render(processor: Processor) {
        return `<code>${this.renderChildren(processor)}</code>`;
    }
}
