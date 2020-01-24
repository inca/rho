import { Region } from './region';
import { Context } from './context';

/**
 * Represents an AST node produced by parsing rules.
 */
export class Node {
    constructor(
        public region: Region,
        public children: Node[] = [],
    ) {}

    render(ctx: Context) {
        return ctx.renderChildren(this);
    }

    debug(indent: string = '') {
        let lines = indent + '\u001b[33m' + this.constructor.name + '\u001b[0m' + ' ' +
            '\u001b[46m\u001b[30m' + this.region.toString() + '\u001b[0m';
        for (const child of this.children) {
            lines += `\n` + child.debug(indent + '  ');
        }
        return lines;
    }
}
