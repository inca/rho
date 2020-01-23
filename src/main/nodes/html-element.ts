import { Node, Region, Processor } from '../core';
import { Selector } from '../util/selector';

export class HtmlElementNode extends Node {
    constructor(
        region: Region,
        children: Node[],
        readonly tagName: string,
        readonly selector: Selector | null = null,
        readonly trim: boolean = true,
        readonly newline: boolean = true,
    ) {
        super(region, children);
    }

    render(processor: Processor) {
        let content = this.renderChildren(processor);
        if (this.trim) {
            content = content.trim();
        }
        let result = '<' + this.tagName;
        if (this.selector) {
            result += this.selector.render();
        }
        result += '>';
        result += content;
        result += '</' + this.tagName + '>';
        if (this.newline) {
            result += '\n';
        }
        return result;
    }

}
