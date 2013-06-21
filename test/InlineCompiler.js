"use strict";
var assert = require('assert')
  , InlineCompiler = require('../lib/inline');

describe('InlineCompiler', function() {

  describe('with default configuration', function() {

    var c = new InlineCompiler();

    it('should emit generic chars as is', function() {
      assert.equal(c.compile("Hello world!"), "Hello world!");
    });

    it('should emit backslashed special chars as is', function() {
      assert.equal(c.compile("\\\\"), "\\");
      assert.equal(c.compile("Test\\."), "Test.");
      assert.equal(c.compile("\\Test\\."), "\\Test.");
    });

    it('should escape &, unless they are part of entity reference', function() {
      assert.equal(c.compile("this & that"), "this &amp; that");
      assert.equal(c.compile("this &amp; that"), "this &amp; that");
      assert.equal(c.compile("this &#026; that"), "this &#026; that");
      assert.equal(c.compile("this &#X1A; that"), "this &#X1A; that");
      // a bit more complicated
      var input = "This & that; A&B, but leave &amp;, &#095; and &#x09a; alone.";
      var output = "This &amp; that; A&amp;B, but leave &amp;, &#095; and &#x09a; alone.";
      assert.equal(c.compile(input), output);
    });

  });


});
