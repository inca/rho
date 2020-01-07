import { Processor } from './processor';
import { Rule } from './rule';
import { Cursor } from './cursor';
import { Node } from './node';
import { Exception } from './exception';
import { StringRegion } from './region';
import { RootNode } from '../nodes/root';

export class Parser {
    constructor(
        readonly processor: Processor,
        readonly rules: Rule[]
    ) {
    }

    parseString(str: string) {
        return this.parse(new StringRegion(str));
    }

    parse(region: StringRegion): Node {
        const nodes: Node[] = [];
        const cursor = new Cursor(region);
        while (cursor.hasCurrent()) {
            nodes.push(this.parsePass(cursor));
        }
        return new RootNode(region, nodes);
    }

    protected parsePass(cursor: Cursor): Node {
        for (const rule of this.rules) {
            const pos = cursor.position();
            const node = rule.parse(cursor);
            if (node) {
                if (cursor.position() <= pos) {
                    throw new Exception({
                        code: 'InvalidRule',
                        message: 'Parse rule should advance cursor position if it emits a node',
                        details: {
                            parser: this,
                            cursor,
                            rule,
                        }
                    });
                }
                return node;
            } else {
                cursor.set(pos);
            }
        }
        throw new Exception({
            code: 'InvalidParser',
            message: 'Parser should emit a node on each pass',
            details: {
                parser: this,
                cursor,
            }
        });
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
