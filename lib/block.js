"use strict";

var defaults = require("./defaults")
  , InlineCompiler = require("./inline")
  , utils = require("./utils")
  , Walker = require("./walker").Walker
  , SubWalker = require("./walker").SubWalker;

/* # Block compiler

Block compiler is what you usually use to transform a document.
It walks a potentially large documents coarsely, looking for
markers which designate the block. The inline markup (inside
blocks) is processed by `InlineCompiler`.
*/
var BlockCompiler
  = module.exports
  = function BlockCompiler(options) {

  this.out = [];

  this.selector = {};

  this.blockIndent = 0;

  this.blockSrc = 0;

  this.options = utils.merge(defaults.options, options);

  this.inline = new InlineCompiler(this.options);

};

/* ## Compilation

Block compiler follows the conventions of `InlineCompiler`:

* `tryXXX` methods are "fail-fast" and immediately return `false`,
  if they do not match the start of the block;
* `emitXXX` methods do not return meaningful result; instead, they
  modify the output and increment the cursor position.

 */
BlockCompiler.prototype = {

  compile: function(input) {
    this.out = [];
    this.selector = {};
    this.blockIndent = 0;
    this.blockSrc = 0;
    var walk = new Walker(input);
    while(walk.hasCurrent())
      this.emitBlock(walk);
    return this.outToString();
  },

  outToString: function() {
    var result = "";
    for (var i = 0; i < this.out.length; i++)
      result += this.out[i];
    return result;
  },

  emitBlock: function(walk) {
    walk.skipBlankLines();
    this.blockSrc = walk.absoluteIndex(walk.position);
    this.countBlockIndent(walk);
    this.emitParagraph(walk);
  },

  /* Counts the spaces from line start up to the first non-whitespace char
     on the first line of a block. */

  countBlockIndent: function(walk) {
    this.blockIndent = 0;
    while (walk.hasCurrent() && walk.at(" ")) {
      this.blockIndent += 1;
      walk.skip();
    }
  },

  /* Selector expression is stripped from each block, if it exists,
  resulting in a new walker with excluded region. */
  stripSelector: function(walk) {
    this.selector = {};
    var start = walk.position;
    while (walk.hasCurrent() && !walk.atNewLine())
      if (walk.at("{")) {
        var s = walk.position;
        walk.skip();
        this.trySelectorId(walk);
        while(this.trySelectorClass(walk)) {}
        if (!walk.at("}")) // invalid selector
          break;
        // Selector matched, exclude it
        walk.skip().skipSpaces().skipNewLine();
        var e = walk.position;
        return walk.startFrom(start).exclude(s, e);
      } else walk.skip();
    // Selector not found
    this.selector = {};
    walk.startFrom(start);
    return walk;
  },

  trySelectorId: function(walk) {
    if (!walk.at("#")) return false;
    walk.skip();
    var end = walk.lookahead(function(w) {
      while (w.hasCurrent() && w.atIdentifier())
        w.skip();
      return w.position;
    });
    this.selector.id = walk.yieldUntil(end);
    return true;
  },

  trySelectorClass: function(walk) {
    if (!walk.at(".")) return false;
    walk.skip();
    var end = walk.lookahead(function(w) {
      while (w.hasCurrent() && w.atIdentifier())
        w.skip();
      return w.position;
    });
    if (!Array.isArray(this.selector.classes))
      this.selector.classes = [];
    this.selector.classes.push(walk.yieldUntil(end));
    return true;
  },

  /* Selector is emitted as HTML `id` and `class` attributes. */

  emitSelector: function() {
    // emit id
    if (typeof this.selector.id == "string") {
      this.out.push(" id=\"" + this.selector.id + "\"");
    }
    // emit class
    if (Array.isArray(this.selector.classes)) {
      this.out.push(" class=\"");
      for (var i in this.selector.classes) {
        if (i > 0) this.out.push(" ");
        this.out.push(this.selector.classes[i]);
      }
      this.out.push("\"");
    }
    // emit data-src
    if (this.options.sourceIndices)
      this.out.push(" data-src=\"" + this.blockSrc + "\"");
  },

  /* Paragraph is the most generic block. It is emitted if
  other blocks did not match. */

  emitParagraph: function(walk) {
    walk.skipWhitespaces();
    if (walk.hasCurrent()) {
      var start = walk.position;
      walk.scrollToTerm();
      var p = this.stripSelector(new SubWalker(walk, start, walk.position));
      this.out.push("<p");
      this.emitSelector();
      this.out.push(">" + this.inline.compile(p) + "</p>\n");
    }
  }

};
