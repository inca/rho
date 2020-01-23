import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    FormulaRule,
    FormulaNode,
} from '../../../../main';

describe('FormulaRule', () => {

    const processor = new RhoProcessor();

    for (const marker of ['$$', '%%']) {
        const ctx = processor.createContext();
        const rule = new FormulaRule(ctx, { marker });

        context(marker, () => {
            it('consumes till next marker, emits control character verbatim', () => {
                const cursor = new Cursor(`This ${marker}\\frac{1}{x}${marker} that`, 5);
                const node = rule.parse(cursor);
                assert(node instanceof FormulaNode);
                assert.equal(node?.render(ctx), `${marker}\\frac{1}{x}${marker}`);
                assert.equal(cursor.pos, 20);
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
    }

});
