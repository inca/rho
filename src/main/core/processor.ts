import { Parser } from './parser';
import { Rule } from './rule';
import { Exception } from './exception';

export class Processor {
    protected parsers: Map<string, Parser> = new Map();

    defineParser(kind: string, rules: Rule[]): this {
        const parser = new Parser(this, rules);
        this.parsers.set(kind, parser);
        return this;
    }

    getParser(kind: string): Parser {
        const parser = this.parsers.get(kind);
        if (!parser) {
            throw new Exception({
                code: 'ParserNotFound',
                message: `Parser "${kind}" not found, please update Processor configuration accordingly`
            });
        }
        return parser;
    }
}
