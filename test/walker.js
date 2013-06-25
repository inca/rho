"use strict";
var assert = require('assert')
  , Walker = require('../lib/walker').Walker;

var pangram = "The quick brown fox jumps over the lazy dog.";

describe('Walker', function() {

  describe('when constructed with String argument', function() {

    var w = new Walker(pangram);

    it('should proxy #length', function() {
      assert.equal(w.length, pangram.length);
    });

    it('should proxy #substring', function() {
      assert.equal(w.substring(4, 19), "quick brown fox");
    });

    it('should proxy #charAt', function() {
      assert.equal(w.charAt(4), "q");
    });

    it('should proxy #toString', function() {
      assert.equal(w.toString(), pangram);
    });

  });

  describe('when constructed with another walker', function() {

    var w1 = new Walker(pangram);
    var w2 = new Walker(w1);

    it('should proxy #length', function() {
      assert.equal(w2.length, pangram.length);
    });

    it('should proxy #substring', function() {
      assert.equal(w2.substring(4, 19), "quick brown fox");
    });

    it('should proxy #charAt', function() {
      assert.equal(w2.charAt(4), "q");
    });

    it('should proxy #toString', function() {
      assert.equal(w2.toString(), pangram);
    });

  });

  it('should throw ERR_INDEX_OUT_OF_BOUNDS on failed #checkIndex', function() {
    assert.throws(function() {
      new Walker(pangram).checkIndex(100)
    }, "ERR_INDEX_OUT_OF_BOUNDS");
  });

  it('should throw ERR_INDEX_OUT_OF_BOUNDS on failed #checkRange', function() {
    assert.throws(function() {
      new Walker(pangram).checkRange(0, 100)
    }, "ERR_RANGE_OUT_OF_BOUNDS");
  });

  it('should recognize block ends', function() {
    var w = new Walker("Block\n   \nAnother block.\n\nThird block.");
    assert.equal(w.scrollToTerm().position, 5);
    assert.equal(w.skipWhitespaces().scrollToTerm().position, 24);
  });

});
