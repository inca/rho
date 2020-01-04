import assert from 'assert';
import { Cursor } from '../../main/cursor';
import { DEFAULT_RHO_CONFIG } from '../../main/config';

const str = 'A quick brown fox jumps over the lazy dog';

function createCursor(pos: number = 0) {
    return new Cursor(DEFAULT_RHO_CONFIG, str, pos);
}

describe('Cursor', () => {

    describe('clone', () => {
        it('returns a clone of cursor', () => {
            const cursor = createCursor(5);
            const clone = cursor.clone();
            assert.notStrictEqual(clone, cursor);
            assert.equal(cursor.source, clone.source);
            assert.equal(cursor.config, clone.config);
            assert.equal(cursor.position(), clone.position());
        });
    });

    describe('peek', () => {
        it('returns next character without advancing cursor position', () => {
            const cursor = createCursor(8);
            const char = cursor.peek();
            assert.equal(cursor.position(), 8);
            assert.equal(char, 'r');
        });
        it('returns empty string if cursor is finished', () => {
            const cursor = createCursor(str.length);
            const char = cursor.peek();
            assert.equal(cursor.position(), str.length);
            assert.equal(char, '');
        });
    });

    describe('current', () => {
        it('returns current character', () => {
            const cursor = createCursor(8);
            const char = cursor.current();
            assert.equal(cursor.position(), 8);
            assert.equal(char, 'b');
        });
        it('returns empty string if cursor is finished', () => {
            const cursor = createCursor(str.length);
            const char = cursor.current();
            assert.equal(cursor.position(), str.length);
            assert.equal(char, '');
        });
    });

    describe('hasCurrent', () => {
        it('returns true if cursor is in region', () => {
            const cursor = createCursor(8);
            assert(cursor.hasCurrent());
        });
        it('returns false if cursor is finished', () => {
            const cursor = createCursor(str.length);
            assert(!cursor.hasCurrent());
        });
    });

    describe('skip', () => {
        it('increments position', () => {
            const cursor = createCursor();
            assert.equal(cursor.position(), 0);
            assert.equal(cursor.current(), 'A');
            cursor.skip();
            assert.equal(cursor.position(), 1);
            assert.equal(cursor.current(), ' ');
        });
    });

    describe('lookahead', () => {
        it('returns result without modifying cursor', () => {
            const cursor = createCursor();
            const res = cursor.lookahead(cur => {
                while (cur.hasCurrent()) {
                    if (cur.at('lazy')) {
                        return cur.position();
                    }
                    cur.skip();
                }
            });
            assert.equal(cursor.position(), 0);
            assert.equal(res, 33);
        });
    });

    describe('yieldInlineText', () => {
        it('returns text up to the next control character', () => {
            const cursor = new Cursor(DEFAULT_RHO_CONFIG, 'Hello [World]()');
            const text = cursor.yieldInlineText();
            assert.equal(text, 'Hello ');
            assert.equal(cursor.position(), 6);
        });
    });

});
