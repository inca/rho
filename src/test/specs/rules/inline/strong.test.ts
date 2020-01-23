import assert from 'assert';
import {
    RhoProcessor,
    StrongRule,
    Cursor,
} from '../../../../main';

describe('StrongRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new StrongRule(ctx);

    context('* pair', () => {

        it('consumes STRONG till end marker', () => {
            const cursor = new Cursor('This *word* that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<strong>word</strong>');
            assert.equal(cursor.pos, 11);
        });

        it('renders inline markup inside', () => {
            const cursor = new Cursor('*a _&_ b*', 0);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<strong>a <em>&amp;</em> b</strong>');
            assert(!cursor.hasCurrent());
        });

    });

    context('single *', () => {
        it('does not match', () => {
            const cursor = new Cursor('This *and that', 5);
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
