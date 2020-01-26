import { Processor, ParserDef } from './processor';
import { Parser } from './parser';
import { Node } from './node';
import { MediaDef } from './media';

export class Context {
    renderStack: Node[] = [];
    mediaIds: Set<string> = new Set();
    resolvedMedia: Map<string, MediaDef> = new Map();

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

    render(node: Node): string {
        let res = '';
        const nodes = this.runTransforms(node);
        for (const node of nodes) {
            res += node.render(this);
        }
        return res;
    }

    renderChildren(node: Node) {
        let res = '';
        this.renderStack.push(node);
        for (const child of node.children) {
            res += this.render(child);
        }
        this.renderStack.pop();
        return res;
    }

    runTransforms(node: Node): Node[] {
        let nodes = [node];
        for (const transform of this.processor.transforms) {
            const res = [];
            for (const node of nodes) {
                const newNodes = transform(node, this);
                res.push(...newNodes);
            }
            nodes = res;
        }
        return nodes;
    }

}
