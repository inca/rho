import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    LinkRule,
    HeadlessLinkRule,
} from '../../../../main';

describe('LinkRule', () => {

    const processor = new RhoProcessor();
    const ctx = processor.createContext();
    const rule = new LinkRule(ctx);

    context('inline link', () => {

        it('emits link with valid region', () => {
            const cursor = new Cursor('This [link](#link) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="#link">link</a>');
            assert.equal(node?.region?.start, 5);
            assert.equal(node?.region?.end, 18);
            assert.equal(cursor.pos, 18);
        });

        it('escapes html chars in href', () => {
            const cursor = new Cursor('This [link](?foo=1&bar=2) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="?foo=1&amp;bar=2">link</a>');
        });

        it('supports inline markup inside', () => {
            const cursor = new Cursor('This [foo *bar* _baz_](#) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="#">foo <strong>bar</strong> <em>baz</em></a>');
        });

        it('allows nested images');

        it('allows escaped [ inside', () => {
            const cursor = new Cursor('This [foo \\[ bar](#) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="#">foo [ bar</a>');
        });

        it('allows escaped ] inside', () => {
            const cursor = new Cursor('This [foo \\] bar](#) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="#">foo ] bar</a>');
        });

    });

    context('ref link', () => {

        it('emits link with valid region', () => {
            const cursor = new Cursor('This [link][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.region?.start, 5);
            assert.equal(node?.region?.end, 15);
            assert.equal(cursor.pos, 15);
        });

        it('populates ctx.mediaIds for resolution', () => {
            const ctx = processor.createContext();
            const rule = new LinkRule(ctx);
            const cursor = new Cursor('This [link][id] that', 5);
            assert(!ctx.mediaIds.has('id'));
            rule.parse(cursor);
            assert(ctx.mediaIds.has('id'));
        });

        it('renders a resolved link', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('id', {
                href: 'https://github.com/inca/rho',
            });
            const rule = new LinkRule(ctx);
            const cursor = new Cursor('This [link][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<a href="https://github.com/inca/rho">link</a>');
        });

        it('renders empty string when link is not resolved', () => {
            const ctx = processor.createContext();
            const rule = new LinkRule(ctx);
            const cursor = new Cursor('This [link][unknown] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '');
        });

        it('renders external link', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('id', {
                href: 'https://github.com/inca/rho',
                external: true
            });
            const rule = new LinkRule(ctx);
            const cursor = new Cursor('This [link][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<a href="https://github.com/inca/rho" target="_blank">link</a>');
        });

    });

    context('headless link', () => {

        it('renders resolved link', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('rho', {
                href: 'https://github.com/inca/rho',
                title: 'Rho'
            });
            const rule = new HeadlessLinkRule(ctx);
            const cursor = new Cursor('This [[rho]] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<a href="https://github.com/inca/rho" title="Rho">Rho</a>');
        });

        it('renders empty string when link is not resolved', () => {
            const ctx = processor.createContext();
            const rule = new HeadlessLinkRule(ctx);
            const cursor = new Cursor('This [[unknown]] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '');
        });

    });

});
