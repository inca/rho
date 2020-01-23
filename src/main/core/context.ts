import { Processor, ParserDef } from './processor';
import { Parser } from './parser';

export class Context {
    constructor(
        readonly processor: Processor,
    ) {}

    getParser(parserId: string) {
        const def = this.processor.getParserDef(parserId);
        return this.createParser(def);
    }

    getMainParser() {
        const def = this.processor.getMainParserDef();
        return this.createParser(def);
    }

    protected createParser(def: ParserDef) {
        const rules = def(this);
        return new Parser(this, rules);
    }

}
