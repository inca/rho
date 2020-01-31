import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    ImageRule,
} from '../../../../main';

describe('ImageRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new ImageRule(ctx);

    context('inline image', () => {

        it('emits image with valid region', () => {
            const cursor = new Cursor('This ![alt text](/img.png) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img.png" alt="alt text" title="alt text"/>');
            assert.equal(node?.region?.start, 5);
            assert.equal(node?.region?.end, 26);
            assert.equal(cursor.pos, 26);
        });

        it('escapes html chars in src', () => {
            const cursor = new Cursor('This ![alt text](/img?foo=1&bar=2) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img?foo=1&amp;bar=2" alt="alt text" title="alt text"/>');
        });

    });

});
