import assert from 'assert';
import { Cursor } from '../../main/core';

const str = 'A quick brown fox jumps over the lazy dog';

function createCursor(pos: number = 0) {
    return new Cursor(str, pos);
}

describe('Cursor', () => {

    describe('clone', () => {
        it('returns a clone of cursor', () => {
            const cursor = createCursor(5);
            const clone = cursor.clone();
            assert.notStrictEqual(clone, cursor);
            assert.equal(cursor.region, clone.region);
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

    describe('at', () => {
        it('returns true if cursor is looking at string', () => {
            const cursor = createCursor(8);
            assert(cursor.at('brown'));
        });
        it('returns false if cursor is not looking at string', () => {
            const cursor = createCursor(8);
            assert(!cursor.at('broWn'));
        });
        it('returns false if cursor is finished', () => {
            const cursor = createCursor(str.length);
            assert(!cursor.at('.'));
        });
    });

    describe('atSpaces', () => {
        it('returns true if cursor is at specified number of spaces', () => {
            const cursor = new Cursor('Hello\n    World', 6);
            assert(cursor.atSpaces(4));
            assert(!cursor.atSpaces(5));
        });
    });

    // describe('lookahead', () => {
    //     it('returns result without modifying cursor', () => {
    //         const cursor = createCursor();
    //         const res = cursor.lookahead(cur => {
    //             while (cur.hasCurrent()) {
    //                 if (cur.at('lazy')) {
    //                     return cur.position();
    //                 }
    //                 cur.skip();
    //             }
    //         });
    //         assert.equal(cursor.position(), 0);
    //         assert.equal(res, 33);
    //     });
    // });

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

    describe('skipSpaces', () => {
        it('skips spaces and tabs', () => {
            const cursor = new Cursor('  \t \r\n Hello');
            cursor.skipSpaces();
            assert(cursor.at('\r\n Hello'));
        });
    });

    describe('skipWhitespaces', () => {
        it('skips spaces, tabs and newline characters', () => {
            const cursor = new Cursor('  \t \r\n Hello');
            cursor.skipWhitespaces();
            assert(cursor.at('Hello'));
        });
    });

    describe('skipNewline', () => {
        it('skips a single newline character', () => {
            const cursor = new Cursor('\r\n\n\n Hello');
            cursor.skipNewLine();
            assert(cursor.at('\n\n Hello'));
        });
    });

    describe('skipNewlines', () => {
        it('skips all newline characters', () => {
            const cursor = new Cursor('\r\n\n\n Hello');
            cursor.skipNewLines();
            assert(cursor.at(' Hello'));
        });
    });

    describe('skipBlankLines', () => {
        it('skips blank lines, leaving the indentation intact', () => {
            const cursor = new Cursor('\r\n\r\n    \r\n    Hello');
            cursor.skipBlankLines();
            assert(cursor.at('    Hello'));
        });
    });

    describe('skipToEol', () => {
        it('skips to the end of current line', () => {
            const cursor = new Cursor('Hello\r\n    World');
            cursor.skipToEol();
            assert.equal(cursor.position(), 5);
        });
    });

    describe('skipToEndOfBlock', () => {
        it('skips to the end of current block', () => {
            const cursor = new Cursor('Hello\r\n    World\r\n  \r\n    Hi again!');
            cursor.skipToEndOfBlock();
            assert.equal(cursor.position(), 16);
            assert(cursor.at('\r\n  \r\n    Hi again!'));
        });
    });

    describe('readUntil', () => {
        it('returns a substring and advances position', () => {
            const cursor = createCursor(8);
            const text = cursor.readUntil(13);
            assert.equal(text.toString(), 'brown');
            assert.equal(cursor.position(), 13);
        });
    });

});
