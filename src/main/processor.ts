import { Parser } from './parser';
import { Rule } from './rule';
import { Exception } from './exception';
import { Config, DEFAULT_CONFIG } from './config';

export class Processor {
    config: Config;

    protected parsers: Map<string, Parser> = new Map();

    constructor(config: Partial<Config> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

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
