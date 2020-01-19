import assert from 'assert';
import { Region, TaintedRegion } from '../../main/core';

describe('Region', () => {

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

    describe('tainted region', () => {

        const str = '__ABcdEFgH___';
        const region = new Region(str, 2, 10)
            .taintRelative(0, 2)
            .taintRelative(4, 6)
            .taintRelative(7, 8);

        describe('charAt', () => {
            it('returns empty string for tainted subregions', () => {
                const expectations = ['', '', 'c', 'd', '', '', 'g', ''];
                for (let i = 0; i < expectations.length; i++) {
                    assert.equal(region.charAt(i), expectations[i]);
                }
            });
        });

        describe('substring', () => {
            it('ignores tainted subregions', () => {
                const expectations = [
                    ['', '', '', 'c', 'cd', 'cd', 'cd', 'cdg', 'cdg'],
                    ['', '', 'c', 'cd', 'cd', 'cd', 'cdg', 'cdg'],
                    ['', 'c', 'cd', 'cd', 'cd', 'cdg', 'cdg'],
                    ['', 'd', 'd', 'd', 'dg', 'dg'],
                    ['', '', '', 'g', 'g'],
                    ['', '', 'g', 'g'],
                    ['', 'g', 'g'],
                    ['', ''],
                ];
                for (let s = 0; s < expectations.length; s++) {
                    const line = expectations[s];
                    for (let e = 0; e < line.length; e++) {
                        const substr = region.substring(s, s + e);
                        assert.equal(substr, line[e],
                            `substring(${s}, ${s + e}) should be ${line[e]}, instead got ${substr}`);
                    }
                }
            });
        });

        describe('toString', () => {
            it('ignores tainted subregions', () => {
                assert.equal(region.toString(), 'cdg');
            });
        });

        describe('untaint', () => {
            it('returns regions not covered by any taints', () => {
                const regions = region.untaint();
                assert.equal(regions.length, 2);
                for (const region of regions) {
                    assert(region instanceof Region);
                    assert(!(region instanceof TaintedRegion));
                }
                assert.equal(regions[0].start, 4);
                assert.equal(regions[0].end, 6);
                assert.equal(regions[0].length, 2);
                assert.equal(regions[1].start, 8);
                assert.equal(regions[1].end, 9);
                assert.equal(regions[1].length, 1);
            });
        });

        describe('integration', () => {

            it('maintains taints in subregions', () => {
                const region = new Region('abc|def||ghi')
                    .taintRelative(3, 4)
                    .taintRelative(7, 9);
                assert.equal(region.toString(), 'abcdefghi');
                assert.equal(region.subRegion(0, 7).toString(), 'abcdef');
                assert.equal(region.subRegion(3).toString(), 'defghi');
            });

            it('creates taints in subregions', () => {
                const region = new Region('abcDefgHi')
                    .taintRelative(3, 4)
                    .subRegion(3)
                    .taintRelative(4, 5);
                assert.equal(region.toString(), 'efgi');
            });

        });

    });

});
