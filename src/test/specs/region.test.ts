import assert from 'assert';
import { Region } from '../../main/core';

describe('StringRegion', () => {

    const str = 'A quick brown fox jumps over the lazy dog';
    const region = new Region(str, 8, 28);

    describe('charAt', () => {
        it('returns characters within the region', () => {
            assert.equal(region.charAt(0), 'b');
            assert.equal(region.charAt(1), 'r');
            assert.equal(region.charAt(10), 'j');
        });
        it('ignores negative index', () => {
            const char = region.charAt(-1);
            assert.equal(char, '');
        });
        it('ignores index outside region', () => {
            const char = region.charAt(25);
            assert.equal(char, '');
        });
    });

    describe('substring', () => {
        it('returns substring from the region', () => {
            assert.equal(region.substring(0), 'brown fox jumps over');
            assert.equal(region.substring(6, 9), 'fox');
        });
        it('does not pierce region boundaries', () => {
            assert.equal(region.substring(0, 25), 'brown fox jumps over');
        });
    });

    describe('toString', () => {
        it('materializes the region', () => {
            assert.equal(region.toString(), 'brown fox jumps over');
        });
    });

    describe('subRegion', () => {
        it('returns a subregion', () => {
            const sub = region.subRegion(6, 9);
            assert.equal(sub.toString(), 'fox');
        });
    });

});
