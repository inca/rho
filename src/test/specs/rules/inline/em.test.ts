import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    EmRule,
} from '../../../../main';

describe('EmRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new EmRule(ctx);

    context('_ pair', () => {

        it('consumes EM till end marker', () => {
            const cursor = new Cursor('This _word_ that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<em>word</em>');
            assert.equal(cursor.pos, 11);
        });

        it('renders inline markup inside', () => {
            const cursor = new Cursor('_a *&* b_', 0);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<em>a <strong>&amp;</strong> b</em>');
            assert(!cursor.hasCurrent());
        });
    });

    context('singular _', () => {
        it('does not match', () => {
            const cursor = new Cursor('This _and that', 5);
            const node = rule.parse(cursor);
            assert(node == null);
            assert.equal(cursor.pos, 5);
        });
    });

    context('other character', () => {
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
