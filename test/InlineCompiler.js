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

    it('should escape &amp;, except in entity references', function() {
      assert.equal(c.compile("this & that"), "this &amp; that");
      assert.equal(c.compile("this &amp; that"), "this &amp; that");
      assert.equal(c.compile("this &#026; that"), "this &#026; that");
      assert.equal(c.compile("this &#X1A; that"), "this &#X1A; that");
      // a bit more complicated
      var input = "This & that; A&B, but leave &amp;, &#095; and &#x09a; alone.";
      var output = "This &amp; that; A&amp;B, but leave &amp;, &#095; and &#x09a; alone.";
      assert.equal(c.compile(input), output);
    });

    it('should escape &lt;, except in HTML tags', function() {
      assert.equal(c.compile("a < b"), "a &lt; b");
      assert.equal(c.compile("a <b>c</b>"), "a <b>c</b>");
    });

    it('should leave HTML comments unprocessed', function() {
      var input = "This & <!-- this text is *unprocessed* --> that.";
      var output = "This &amp; <!-- this text is *unprocessed* --> that.";
      assert.equal(c.compile(input), output);
    });

    it('should escape &gt; chars', function() {
      var input = "A < B; B > C";
      var output = "A &lt; B; B &gt; C";
      assert.equal(c.compile(input), output);
    });

    it('should process HTML tags coarsely, without real HTML semantics', function() {
      var input = "A<B *hello* A>B";
      var output = "A<B *hello* A>B";
      assert.equal(c.compile(input), output);
    });

    it('should process ems and strongs', function() {
      assert.equal(c.compile("Text *_ * _*"), "Text <strong>_ </strong> _*");
      assert.equal(c.compile("Text _ * _*"), "Text <em> * </em>*");
    });

    it('should respect backslashes while on ems/strongs', function() {
      assert.equal(
        c.compile("Text *_ \\* _*"),
        "Text <strong><em> * </em></strong>");
    });

    it('should process triple code spans', function() {
      assert.equal(
        c.compile("Code with ```<b>tags</b> & SGMLs &#095;```"),
        "Code with <code><b>tags</b> &amp; SGMLs &#095;</code>");
    });

    it('should process regular code spans', function() {
      assert.equal(
        c.compile("Code with `<b>tags</b> & SGMLs &#095;`"),
        "Code with <code>&lt;b&gt;tags&lt;/b&gt; &amp; SGMLs &#095;</code>");
    });

    it('should process MathJax formulas', function() {
      assert.equal(
        c.compile("%%e^i\\varphi = \\cos{\\varphi} + i\\sin{\\varphi}%%"),
        "%%e^i\\varphi = \\cos{\\varphi} + i\\sin{\\varphi}%%");
      assert.equal(c.compile("$$a<b>c<d>f$$"), "$$a&lt;b&gt;c&lt;d&gt;f$$");
    });

    it('should process typographics out-of-box', function() {
      assert.equal(
        c.compile("This -> that, except in code `foo -> bar`"),
        "This &rarr; that, except in code <code>foo -&gt; bar</code>");
    });

    it('should emit opening and closing quotes', function() {
      assert.equal(
        c.compile("\"Rho\" is awesome;\n\"This\" works \"too\"."),
        "&ldquo;Rho&rdquo; is awesome;\n" +
          "&ldquo;This&rdquo; works &ldquo;too&rdquo;.");
    });

    it('should leave link definitions and media without processing', function() {
      assert.equal(
        c.compile("Headless [[link]]"),
        "Headless [[link]]");
      assert.equal(
        c.compile("Referenced [link][id]"),
        "Referenced [link][id]");
      assert.equal(
        c.compile("Referenced ![media][id]"),
        "Referenced ![media][id]");
    });

  });

  describe("with some test links and media", function() {

    var links = {
      rho: {
        url: "http://github.com/inca/rho",
        title: "Rho — text2html processing tool for Node"
      },
      node: "http://nodejs.org"
    };

    var images = {
      gravatar: {
        url: 'http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6',
        title: "Look at me!"
      }
    };

    var c = new InlineCompiler({
      resolveLink: function(id) {
        return links[id];
      },
      resolveImage: function(id) {
        return images[id];
      }
    });

    it("should resolve headless links", function() {
      assert.equal(
        c.compile("Everybody likes [[rho]]"),
        "Everybody likes <a href=\"http://github.com/inca/rho\"" +
          " title=\"Rho — text2html processing tool for Node\">" +
          "Rho — text2html processing tool for Node</a>");
    });

    it("should resolve reference links", function() {
      assert.equal(
        c.compile("[Rho][rho] -- text2html processing tool for [Node][node]."),
        "<a href=\"http://github.com/inca/rho\"" +
          " title=\"Rho — text2html processing tool for Node\">Rho</a> &mdash; " +
          "text2html processing tool for <a href=\"http://nodejs.org\">Node</a>.");
    });

    it("should process inline links", function() {
      assert.equal(
        c.compile("[Rho](https://github.com/inca/rho) is awesome!"),
        "<a href=\"https://github.com/inca/rho\">Rho</a> is awesome!");
    });

    it("should resolve reference images", function() {
      assert.equal(
        c.compile("Me: ![Boris Okunskiy][gravatar]"),
        "Me: <img src=\"http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6\"" +
          " alt=\"Boris Okunskiy\" title=\"Look at me!\"/>");
    });

    it("should process inline images", function() {
      assert.equal(
        c.compile("Me: ![](http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6)"),
        "Me: <img src=\"http://gravatar.com/avatar/e1e3018a2ed287d8bae27bacdabefcb6\"" +
          " alt=\"\"/>");
    });

    it("should process cool things inside inline link texts", function() {
      assert.equal(
        c.compile("[The `code` inside a link](#) is cool."),
          "<a href=\"#\">The <code>code</code> inside a link</a> is cool.");
    });

    it("should process cool things inside reference link texts", function() {
      assert.equal(
        c.compile("[The `code` inside a link][node] is cool."),
        "<a href=\"http://nodejs.org\">The <code>code</code> inside a link</a>" +
          " is cool.");
    });

    it("should resolve links inside HTML attributes", function() {
      assert.equal(
        c.compile("<a href=\"[node]\">NodeJS</a>."),
        "<a href=\"http://nodejs.org\">NodeJS</a>.");
    });

  });

  describe("with custom macros", function() {

    var c = new InlineCompiler({}, {
      "smiley": {
        match: [":)", ":-)"],
        emit: "<img src=\"/smiley.png\"/>"
      }
    });

    it("should match simple macro", function() {
      assert.equal(c.compile("Hey there :)"),
        "Hey there <img src=\"/smiley.png\"/>");
    });

  });

});
