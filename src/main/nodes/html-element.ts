import { Node, Region, Context } from '../core';
import { Selector } from '../util/selector';

export class HtmlElementNode extends Node {
    constructor(
        region: Region,
        children: Node[],
        public tagName: string,
        public selector: Selector | null = null,
        public inline: boolean = false,
        public selfClosing: boolean = false,
    ) {
        super(region, children);
    }

    render(ctx: Context) {
        let content = ctx.renderChildren(this);
        if (!this.inline) {
            content = content.trim();
        }
        let result = '<' + this.tagName;
        if (this.selector) {
            result += this.selector.render();
        }
        if (this.selfClosing) {
            result += '/>';
        } else {
            result += '>';
            result += content;
            result += '</' + this.tagName + '>';
        }
        if (!this.inline) {
            result += '\n';
        }
        return result;
    }

}
