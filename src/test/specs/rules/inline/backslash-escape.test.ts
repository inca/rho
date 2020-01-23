import assert from 'assert';
import {
    RhoProcessor,
    BackslashEscapeRule,
    Cursor,
    TextNode,
} from '../../../../main';

describe('BackslashEscapeRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new BackslashEscapeRule(ctx, {
        controlCharacters: [0x5e]
    });

    context('\\ + control character', () => {
        it('consumes backslash, emits control character verbatim', () => {
            const cursor = new Cursor('This \\^ that', 5);
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(node?.render(ctx), '^');
            assert.equal(cursor.pos, 7);
        });
    });

    context('\\ + other character', () => {
        it('does not match', () => {
            const cursor = new Cursor('\\- random \\& stuff \\\\', 0);
            while (cursor.hasCurrent()) {
                const pos = cursor.pos;
                const node = rule.parse(cursor);
                assert(node == null);
                assert.equal(cursor.pos, pos);
                cursor.skip();
            }
        });
    });

});
