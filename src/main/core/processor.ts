import { Parser } from './parser';
import { Rule } from './rule';
import { Exception } from './exception';

export type ParserDef = () => Rule[];

export class Processor {
    protected mainParserId: string = '';
    protected parserDefs: Map<string, ParserDef> = new Map();

    setMainParser(parserId: string): this {
        this.mainParserId = parserId;
        return this;
    }

    defineParser(parserId: string, def: ParserDef): this {
        this.parserDefs.set(parserId, def);
        return this;
    }

    getParser(parserId: string): Parser {
        const def = this.parserDefs.get(parserId);
        if (!def) {
            throw new Exception({
                code: 'ParserNotFound',
                message: `Parser "${parserId}" not found, please update Processor accordingly`
            });
        }
        const rules = def();
        return new Parser(this, rules);
    }

    getMainParser(): Parser {
        if (!this.mainParserId) {
            throw new Exception({
                code: 'ProcessorNotConfigured',
                message: `Main parser not specified, please update Processor accordingly`,
            });
        }
        return this.getParser(this.mainParserId);
    }

    process(str: string): string {
        const ast = this.getMainParser().parseString(str);
        return ast.render(this);
    }
}
