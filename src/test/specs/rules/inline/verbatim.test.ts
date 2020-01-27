import assert from 'assert';
import {
    RhoProcessor,
    VerbatimRule,
    Cursor,
    TextNode,
} from '../../../../main';

describe('VerbatimRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new VerbatimRule(ctx);

    it('emits any character verbatim', () => {
        const cursor = new Cursor('\\- random \\`~!@#$%^&*()-_+="<>{}[] stuff \\\\', 0);
        while (cursor.hasCurrent()) {
            const pos = cursor.pos;
            const char = cursor.current();
            const node = rule.parse(cursor);
            assert(node instanceof TextNode);
            assert.equal(cursor.pos, pos + 1);
            assert.equal(node?.region.start, pos);
            assert.equal(node?.region.end, pos + 1);
            assert.equal(node?.region.toString(), char);
            cursor.skip();
        }
    });

});
