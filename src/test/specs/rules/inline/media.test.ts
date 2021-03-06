import assert from 'assert';
import {
    RhoProcessor,
    Cursor,
    MediaRule,
    HeadlessMediaRule,
} from '../../../../main';

describe('MediaRule', () => {

    const processor = new RhoProcessor({
        lazyImages: false
    });
    const ctx = processor.createContext();
    const rule = new MediaRule(ctx);

    context('inline media', () => {

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

        it('supports auxiliary width', () => {
            const cursor = new Cursor('This ![alt text](/img|32) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img" alt="alt text" title="alt text" width="32"/>');
        });

        it('supports auxiliary height', () => {
            const cursor = new Cursor('This ![alt text](/img|,32) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img" alt="alt text" title="alt text" height="32"/>');
        });

        it('supports auxiliary width and height', () => {
            const cursor = new Cursor('This ![alt text](/img|32x24) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img" alt="alt text" title="alt text" width="32" height="24"/>');
        });

    });

    context('ref media', () => {

        it('emits media with valid region', () => {
            const cursor = new Cursor('This ![text][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.region?.start, 5);
            assert.equal(node?.region?.end, 16);
            assert.equal(cursor.pos, 16);
        });

        it('populates ctx.mediaIds for resolution', () => {
            const ctx = processor.createContext();
            const rule = new MediaRule(ctx);
            const cursor = new Cursor('This ![text][id] that', 5);
            assert(!ctx.mediaIds.has('id'));
            rule.parse(cursor);
            assert(ctx.mediaIds.has('id'));
        });

        it('renders a resolved media', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('id', {
                href: '/some/img',
            });
            const rule = new MediaRule(ctx);
            const cursor = new Cursor('This ![text][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '<img src="/some/img" alt="text" title="text"/>');
        });

        it('supports auxiliary width and height', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('id', {
                href: '/some/img|32x24',
            });
            const rule = new MediaRule(ctx);
            const cursor = new Cursor('This ![text][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/some/img" alt="text" title="text" width="32" height="24"/>');
        });

        it('renders empty string when media is not resolved', () => {
            const ctx = processor.createContext();
            const rule = new MediaRule(ctx);
            const cursor = new Cursor('This ![text][unknown] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '');
        });

        it('supports custom render', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('id', {
                href: '/some/img',
                customRender() {
                    return `<img srcset="${this.href}-480 480w, ${this.href}-800 800w"/>`;
                }
            });
            const rule = new MediaRule(ctx);
            const cursor = new Cursor('This ![link][id] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img srcset="/some/img-480 480w, /some/img-800 800w"/>');
        });

    });

    context('headless media', () => {

        it('renders resolved media', () => {
            const ctx = processor.createContext();
            ctx.resolvedMedia.set('img', {
                href: '/some/img',
                title: 'My Cool Pic'
            });
            const rule = new HeadlessMediaRule(ctx);
            const cursor = new Cursor('This ![[img]] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/some/img" alt="My Cool Pic" title="My Cool Pic"/>');
        });

        it('renders empty string when link is not resolved', () => {
            const ctx = processor.createContext();
            const rule = new HeadlessMediaRule(ctx);
            const cursor = new Cursor('This ![[unknown]] that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx), '');
        });

    });

    context('lazy images', () => {
        const processor = new RhoProcessor({
            lazyImages: true
        });
        const ctx = processor.createContext();
        const rule = new MediaRule(ctx);

        it('emits loading="lazy"', () => {
            const cursor = new Cursor('This ![alt text](/img.png) that', 5);
            const node = rule.parse(cursor);
            assert.equal(node?.render(ctx),
                '<img src="/img.png" alt="alt text" title="alt text" loading="lazy"/>');
            assert.equal(node?.region?.start, 5);
            assert.equal(node?.region?.end, 26);
            assert.equal(cursor.pos, 26);
        });
    });

});
