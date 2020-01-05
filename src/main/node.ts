import { StringRegion } from './region';
import { Processor } from './processor';

/**
 * Represents an AST node produced by parsing rules.
 */
export abstract class Node {
    constructor(
        readonly region: StringRegion,
        readonly children: Node[] = [],
    ) {}

    abstract render(processor: Processor): string;

    renderChildren(processor: Processor): string {
        // TODO perf compare with string concat
        let result = '';
        for (const child of this.children) {
            result += child.render(processor);
        }
        return result;
    }

    debug(indent: string = '') {
        let lines = indent + '\u001b[33m' + this.constructor.name + '\u001b[0m' + ' ' +
            '\u001b[37m' + '|' + '\u001b[0m' + this.region.toString() + '\u001b[37m' + '|' + '\u001b[0m';
        for (const child of this.children) {
            lines += `\n` + child.debug(indent + '  ');
        }
        return lines;
    }
}
