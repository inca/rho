import { Node, Region, Processor } from '../core';

export class HtmlElementNode extends Node {
    constructor(
        region: Region,
        children: Node[],
        readonly tagName: string
    ) {
        super(region, children);
    }

    render(processor: Processor) {
        return `<${this.tagName}>${this.renderChildren(processor).trim()}</${this.tagName}>`;
    }
}
