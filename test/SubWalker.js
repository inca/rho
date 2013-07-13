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
      assert.equal(w.end, 44);
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
      assert.equal(w3.charAt(2), "o");
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

  it('should iterate over characters', function() {
    var w = new SubWalker(pangram, 4, 19);
    assert.equal(w.hasNext(), true);
    assert.equal(w.current(), "q");
    assert.equal(w.skip().current(), "u");
    assert.equal(w.startFrom(6).current(), "b");
    assert.equal(w.peek(), "r");
    assert.equal(w.skip().current(), "r");
  });

  it('should perform basic lookups', function() {
    var w = new SubWalker(pangram, 4, 19);
    assert.equal(w.startFrom(6).at("brown"), true);
    assert.equal(w.current(), "b");
  });

  it('should recognize newlines', function() {
    var w = new SubWalker("\r\n\n\r");  // exactly three times
    assert.equal(w.atNewLine(), true);
    assert.equal(w.skipNewLine().atNewLine(), true);
    assert.equal(w.skipNewLine().atNewLine(), true);
    assert.equal(w.hasNext(), false);
  });

  it('should skip multiple newlines', function() {
    var w = new SubWalker("\r\n\n\r");
    assert.equal(w.skipNewLines().atNewLine(), false);
    assert.equal(w.hasNext(), false);
  });

  it('should recognize spaces', function() {
    var w = new SubWalker(" \t ");
    assert.equal(w.skipSpace()
      .skipSpace()
      .skipSpace()
      .atSpace(), false);
    assert.equal(w.reset().skipSpaces().hasNext(), false);
  });

  it('should recognize general whitespace', function() {
    var w = new SubWalker(" \r\n\t\n");
    assert.equal(w.skipWhitespace().skipWhitespace().at("\t"), true);
    assert.equal(w.skipWhitespace().skipWhitespace().hasNext(), false);
  });

  it('should recognize blank lines', function() {
    var w = new SubWalker("  \n\n\t\n   Howdy!");
    assert.equal(w.skipBlankLines().at("   Howdy!"), true);
  });

  it('should leave non-whitespace chars when skipping whitespace', function() {
    var w = new SubWalker(pangram, 4, 19);
    w.skipNewLine()
      .skipNewLines()
      .skipSpace()
      .skipSpaces()
      .skipWhitespace()
      .skipWhitespaces()
      .skipBlankLines();
    assert.equal(w.at("quick"), true);
  });

  it('should report space number correctly', function() {
    var w = new SubWalker("    * item\n");
    assert.equal(w.atSpaces(0), true);
    assert.equal(w.atSpaces(4), true);
    assert.equal(w.atSpaces(5), false);
  });

});
