import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    TypographicsRule,
} from '../../../../main';

describe('TypographicsRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new TypographicsRule(ctx, processor.options);

    context('double quotes', () => {

        it('emits left quote at start, following non-whitespace', () => {
            const cursor = new Cursor('"hello', 0);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '“');
            assert.equal(cursor.pos, 1);
        });

        it('emits right quote at start, following whitespace', () => {
            const cursor = new Cursor('" hello', 0);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '”');
            assert.equal(cursor.pos, 1);
        });

        it('emits right quote in between whitespace', () => {
            const cursor = new Cursor('This " that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '”');
            assert.equal(cursor.pos, 6);
        });

        it('emits right quote following whitespace', () => {
            const cursor = new Cursor('This "and" that', 9);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '”');
            assert.equal(cursor.pos, 10);
        });

    });

});
