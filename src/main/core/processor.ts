import { Parser } from './parser';
import { Rule } from './rule';
import { Exception } from './exception';

export class Processor {
    protected parsers: Map<string, Parser> = new Map();

    defineParser(parserId: string, rules: Rule[]): this {
        const parser = new Parser(this, rules);
        this.parsers.set(parserId, parser);
        return this;
    }

    getParser(parserId: string): Parser {
        const parser = this.parsers.get(parserId);
        if (!parser) {
            throw new Exception({
                code: 'ParserNotFound',
                message: `Parser "${parserId}" not found, please update Processor configuration accordingly`
            });
        }
        return parser;
    }
}
