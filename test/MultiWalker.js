"use strict";
var assert = require('assert')
  , Walker = require('../lib/walker').Walker
  , SubWalker = require('../lib/walker').SubWalker
  , MultiWalker = require('../lib/walker').MultiWalker;

var pangram = "The quick brown fox jumps over the lazy dog.";

describe('MultiWalker', function() {

  var w1 = new SubWalker(pangram, 0, 10);  // "The quick "
  var w2 = new SubWalker(pangram, 16, 35);   //  "fox jumps over the "
  var w3 = new SubWalker(pangram, 10, 16);   //  "brown "
  var w4 = "cat.";

  describe('when composed from another walkers', function() {

    var w = new MultiWalker([w1, w2, w3, w4]);

    it('should evaluate proper #length', function() {
      assert.equal(w.length, 39);
    });

    it('should evaluate proper #toString', function() {
      assert.equal(w.toString(), "The quick fox jumps over the brown cat.");
    });

    it('should evaluate proper #charAt', function() {
      assert.equal(w.charAt(2), "e");
      assert.equal(w.charAt(9), " ");
      assert.equal(w.charAt(10), "f");
      assert.equal(w.charAt(31), "o");
    });

    it('should evaluate proper #substring', function() {
      assert.equal(w.substring(4, 13), "quick fox");
      assert.equal(w.substring(29, 38), "brown cat");
      assert.equal(w.substring(10, 10), "");
      assert.equal(w.substring(0, w.length), w.toString());
    });

  });

  describe('when composed from nested multi-walkers', function() {

    var m1 = new MultiWalker([w2, w3]);
    var m2 = new MultiWalker([w1, m1, w4]);

    it('should evaluate correctly', function() {
      assert.equal(m2.toString(), "The quick fox jumps over the brown cat.");
    });

    it('should not break inside another walker', function() {
      var w = new SubWalker(m2, 10, 34);
      assert.equal(w.toString(), "fox jumps over the brown");
      assert.equal(w.length, 24);
      assert.equal(w.charAt(10), "o");
      assert.equal(w.substring(15, 24), "the brown");
      assert.equal(w.substring(0, 0), "");
      assert.equal(w.substring(0, w.length), w.toString());
    });

  });

  it('should exclude substrings with #exclude', function() {
    var w = new MultiWalker([w1, w2, w3, w4]);
    assert.equal(w.exclude(4, 10).toString(), "The fox jumps over the brown cat.");
  });

  it('should match chars from array', function() {
    var w = new MultiWalker([w1, w2, w3, w4]).startFrom(10);
    assert.equal(w.matchSome(['a', 'b', 'f', 'c']), "f");
    assert.equal(w.matchSome(['1', '2', '3', '4']), null);
  });

  it('should match chars from another string', function() {
    var w = new MultiWalker([w1, w2, w3, w4]).startFrom(10);
    assert.equal(w.matchSome('abfc'), "f");
    assert.equal(w.matchSome('1234'), null);
  });

  it('should return strings with #yieldUntil', function() {
    var w = new MultiWalker([w1, w2, w3, w4]).startFrom(10);
    var result = w.yieldUntil(9);
    assert.equal(result, "");
    assert.equal(w.position, 10);
    result = w.yieldUntil(19);
    assert.equal(result, "fox jumps");
    assert.equal(w.position, 19);
  });

});
