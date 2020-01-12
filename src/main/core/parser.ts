import { Processor } from './processor';
import { Rule } from './rule';
import { Cursor } from './cursor';
import { Node } from './node';
import { Exception } from './exception';
import { Region } from './region';
import { RootNode } from '../nodes/root';

export class Parser {
    constructor(
        readonly processor: Processor,
        readonly rules: Rule[]
    ) {
    }

    parseString(str: string) {
        return this.parse(new Region(str));
    }

    parse(region: Region): Node {
        const nodes: Node[] = [];
        const cursor = new Cursor(region);
        while (cursor.hasCurrent()) {
            const node = this.parseSinglePass(cursor);
            if (node == null) {
                throw new Exception({
                    code: 'InvalidParser',
                    message: 'Parser must emit a node on each pass',
                    details: {
                        parser: this,
                        cursor,
                    }
                });
            }
            nodes.push(node);
        }
        return new RootNode(region, nodes);
    }

    parseSinglePass(cursor: Cursor): Node | null {
        for (const rule of this.rules) {
            const node = rule.parse(cursor);
            if (node) {
                return node;
            }
        }
        return null;
    }

    // TODO PoC APIs for manipulating rules, confirm after extensions appear

    insertRuleBefore(predicate: (rule: Rule) => boolean, newRule: Rule): this {
        const i = this.rules.findIndex(r => predicate(r));
        if (i > -1) {
            this.rules.splice(i, 0, newRule);
        } // TODO throw otherwise?
        return this;
    }

    insertRuleAfter(predicate: (rule: Rule) => boolean, newRule: Rule): this {
        const i = this.rules.findIndex(r => predicate(r));
        if (i > -1) {
            this.rules.splice(i + 1, 0, newRule);
        } // TODO throw otherwise?
        return this;
    }

    replaceRule(predicate: (rule: Rule) => boolean, newRule: Rule): this {
        const i = this.rules.findIndex(r => predicate(r));
        if (i > -1) {
            this.rules.splice(i, 1, newRule);
        } // TODO throw otherwise?
        return this;
    }

    removeRule(predicate: (rule: Rule) => boolean): this {
        const i = this.rules.findIndex(r => predicate(r));
        if (i > -1) {
            this.rules.splice(i, 0);
        } // TODO throw otherwise?
        return this;
    }

}
