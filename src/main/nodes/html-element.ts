import { Node, Region, Processor } from '../core';
import { SelectorNode } from './selector';

export class HtmlElementNode extends Node {
    constructor(
        region: Region,
        children: Node[],
        readonly tagName: string,
        readonly selector: SelectorNode | null = null,
        readonly trim: boolean = true,
    ) {
        super(region, children);
    }

    render(processor: Processor) {
        let content = this.renderChildren(processor);
        if (this.trim) {
            content = content.trim();
        }
        const attrs = this.selector?.render() || '';
        return `<${this.tagName}${attrs}>${content}</${this.tagName}>`;
    }

}
