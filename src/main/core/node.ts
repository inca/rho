import { Region } from './region';
import { Context } from './context';

/**
 * Represents an AST node produced by parsing rules.
 */
export class Node {
    constructor(
        readonly region: Region,
        readonly children: Node[] = [],
    ) {}

    render(ctx: Context) {
        return this.renderChildren(ctx);
    }

    renderChildren(ctx: Context): string {
        let result = '';
        for (const child of this.children) {
            result += child.render(ctx);
        }
        return result;
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
