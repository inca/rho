import { Node, Region, Processor } from '../core';
import { SelectorNode } from './selector';

export class HtmlElementNode extends Node {
    constructor(
        region: Region,
        children: Node[],
        readonly tagName: string,
        readonly selector?: SelectorNode | null,
    ) {
        super(region, children);
    }

    render(processor: Processor) {
        return `<${this.tagName}${this.selector?.render() || ''}>` +
            this.renderChildren(processor).trim() +
            `</${this.tagName}>`;
    }

}
