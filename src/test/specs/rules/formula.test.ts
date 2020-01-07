import { RhoProcessor } from '../../../main/processor';
import { Cursor } from '../../../main/core';
import { FormulaRule, FormulaNode } from '../../../main/rules';
import assert from 'assert';

describe('FormulaRule', () => {

    const processor = new RhoProcessor();

    for (const marker of ['$$', '%%']) {
        const rule = new FormulaRule(processor, { marker });

        context(marker, () => {
            it('consumes till next marker, emits control character verbatim', () => {
                const cursor = new Cursor(`This ${marker}\\frac{1}{x}${marker} that`, 5);
                const node = rule.parse(cursor);
                assert(node instanceof FormulaNode);
                assert(node?.render(processor), `${marker}\\frac{1}{x}${marker}`);
                assert.equal(cursor.position(), 20);
            });
        });

        context('other character', () => {
            it('does not match', () => {
                const cursor = new Cursor('\\- random \\& stuff \\\\', 0);
                while (cursor.hasCurrent()) {
                    const pos = cursor.position();
                    const node = rule.parse(cursor);
                    assert(node == null);
                    assert.equal(cursor.position(), pos);
                    cursor.skip();
                }
            });
        });
    }

});
