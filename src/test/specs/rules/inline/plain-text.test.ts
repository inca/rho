import assert from 'assert';
import {
    RhoProcessor,
    PlainTextRule,
    Cursor,
    TextNode,
} from '../../../../main';

describe('PlainTextRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new PlainTextRule(ctx, {
        controlCharacters: [0x5e]
    });

    it('emits a region till next control character', () => {
        const cursor = new Cursor('Hello ^ World!', 0);
        const node = rule.parse(cursor);
        assert(node instanceof TextNode);
        assert(node?.render(ctx), 'Hello ');
        assert.equal(cursor.pos, 6);
    });

});
