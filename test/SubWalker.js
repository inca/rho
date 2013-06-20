"use strict";
var assert = require('assert')
  , Walker = require('../lib/walker').Walker
  , SubWalker = require('../lib/walker').SubWalker;

var pangram = "The quick brown fox jumps over the lazy dog.";

describe('SubWalker', function() {

  describe('when given incorrect range bounds', function() {

    var w = new SubWalker(pangram, -6, 63);

    it('should correct its range', function() {
      assert.equal(w.start, 0);
      assert.equal(w.end, 43);
    });

  });

  describe('when constructed from several walkers', function() {

    var w1 = new Walker(pangram);
    var w2 = new SubWalker(w1, 4, 19);  // "quick brown fox"
    var w3 = new SubWalker(w2, 6, 11);  // "brown"

    it('should evaluate proper #length', function() {
      assert.equal(w1.length, pangram.length);
      assert.equal(w2.length, 15);
      assert.equal(w3.length, 5);
    });

    it('should evaluate proper #charAt', function() {
      assert.equal(w2.charAt(0), "q");
      assert.equal(w2.charAt(6), "b");
      assert.equal(w3.charAt(0), "b");
    });

    it('should evaluate proper #substring', function() {
      assert.equal(w2.substring(12), "fox");
      assert.equal(w3.substring(2,3), "o");
    });

    it('should evaluate proper #toString', function() {
      assert.equal(w2.toString(), "quick brown fox");
      assert.equal(w3.toString(), "brown");
    });

  });

});
