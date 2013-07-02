"use strict";

var defaults = require("./defaults")
  , InlineCompiler = require("./inline")
  , utils = require("./utils")
  , Walker = require("./walker").Walker
  , SubWalker = require("./walker").SubWalker
  , html = require("html");

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

  toHtml: function(input) {
    this.compile(input);
    var result = this.outToString();
    if (this.options.pretty)
      result = html.prettyPrint(result, { indent_size: 2 }) + "\n";
    return result;
  },

  compile: function(input) {
    this.out = [];
    this.selector = {};
    this.blockIndent = 0;
    this.blockSrc = 0;
    var walk = new Walker(input);
    while(walk.hasCurrent())
      this.emitBlock(walk);
    return this;
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
    if (this.tryUnorderedList(walk)) return;
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
        walk.skip().skipSpaces();
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

  /* Unordered lists start with `* `, every line indented beyond
   the marker is included into `<li>`.*/

  tryUnorderedList: function(walk) {
    if (!walk.at("* ")) return false;
    var startIdx = walk.position;
    var found = false;
    // Find the end of the block, checking for nested subblocks
    while (!found && walk.hasCurrent()) {
      walk.scrollToTerm().skipBlankLines();
      if (walk.atSpaces(this.blockIndent)) {
        var i = walk.position;
        walk.skip(this.blockIndent);
        if (!walk.at("* ") && !walk.atSpace()) {
          found = true;
          walk.startFrom(i);
        }
      } else found = true;
    }
    // We got UL region, emit it
    var ul = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitUl(ul);
    return true;
  },

  emitUl: function(walk) {
    this.out.push("<ul");
    this.emitSelector();
    this.out.push(">");
    // Determining the bounds of each li
    walk.skip(2); // Skipping marker
    var startIdx = walk.position;
    while (walk.hasCurrent()) {
      walk.scrollToEol().skipBlankLines();
      if (walk.atSpaces(this.blockIndent) &&
        walk.skip(this.blockIndent).at("* ")) {
        var li = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
        this.emitLi(li);
        walk.skip(2);
        startIdx = walk.position;
      }
    }
    // Emit last li
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitLi(last);
    // All items emitted
    this.out.push("</ul>");
  },

  emitLi: function(walk) {
    this.out.push("<li");
    this.emitSelector();
    this.out.push(">");
    // Determine, whether the contents is inline or block
    var b = walk.lookahead(function(w) {
      w.scrollToTerm().skipWhitespaces();
      return w.hasCurrent(); // In other words, there is a blank line inside
    });
    var indent = this.blockIndent;
    if (b) {
      while (walk.hasCurrent())
        this.emitBlock(walk);
      this.blockIndent = indent;
    } else this.out.push(this.inline.toHtml(walk));
    this.out.push("</li>");
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
      this.out.push(">");
      this.out.push(this.inline.toHtml(p));
      this.out.push("</p>\n");
    }
  }

};
