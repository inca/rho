import { Rule } from './rule';
import { Exception } from './exception';
import { Context } from './context';
import { Node } from './node';

export type ParserDef = (ctx: Context) => Rule[];
export type NodeTransform = (node: Node, ctx: Context) => Node[];

export class Processor {
    protected mainParserId: string = '';
    protected parserDefs: Map<string, ParserDef> = new Map();
    transforms: NodeTransform[] = [];
    // Note: it is favourable for subclasses to provide more specific interface for options.
    options: any = {};

    constructor(options: any = {}) {
        this.options = options;
    }

    toHtml(str: string): string {
        const ctx = this.createContext();
        const ast = ctx.getMainParser().parseString(str);
        return ctx.render(ast);
    }

    createContext() {
        return new Context(this);
    }

    setMainParser(parserId: string): this {
        this.mainParserId = parserId;
        return this;
    }

    defineParser(parserId: string, def: ParserDef): this {
        this.parserDefs.set(parserId, def);
        return this;
    }

    getParserDef(parserId: string): ParserDef {
        const def = this.parserDefs.get(parserId);
        if (!def) {
            throw new Exception({
                code: 'ParserNotFound',
                message: `Parser "${parserId}" not found, please update Processor accordingly`
            });
        }
        return def;
    }

    getMainParserDef(): ParserDef {
        if (!this.mainParserId) {
            throw new Exception({
                code: 'ProcessorNotConfigured',
                message: `Main parser not specified, please update Processor accordingly`,
            });
        }
        return this.getParserDef(this.mainParserId);
    }

    transform(fn: NodeTransform): this {
        this.transforms.push(fn);
        return this;
    }

}
