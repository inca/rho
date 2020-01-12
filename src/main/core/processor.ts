import { Parser } from './parser';
import { Rule } from './rule';
import { Exception } from './exception';

export type ParserDef = () => Rule[];

export class Processor {
    protected parserDefs: Map<string, ParserDef> = new Map();

    defineParser(parserId: string, def: ParserDef): this {
        this.parserDefs.set(parserId, def);
        return this;
    }

    getParser(parserId: string): Parser {
        const def = this.parserDefs.get(parserId);
        if (!def) {
            throw new Exception({
                code: 'ParserNotFound',
                message: `Parser "${parserId}" not found, please update Processor configuration accordingly`
            });
        }
        const rules = def();
        return new Parser(this, rules);
    }
}
