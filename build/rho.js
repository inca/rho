(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var defaults = require("./defaults")
  , InlineCompiler = require("./inline")
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
  = exports
  = function(options) {

  this.options = require("./extend")({}, defaults.options, options);

  this.reset();

};

/* ## Compilation

 Block compiler follows the conventions of `InlineCompiler`:

 * `tryXXX` methods are "fail-fast" and immediately return `false`,
 if they do not match the start of the block;
 * `emitXXX` methods do not return meaningful result; instead, they
 modify the output and increment the cursor position.

 */
BlockCompiler.prototype = {

  InlineCompiler: InlineCompiler,

  toHtml: function(input) {
    return this.reset().append(input).outToString();
  },

  reset: function() {
    this.out = [];
    this.selector = {};
    this.blockIndent = 0;
    this.inline = new this.InlineCompiler(this.options, this);
    this.inline.out = this.out;
    return this;
  },

  append: function(input) {
    return this.processBlocks(new Walker(input));
  },

  processBlocks: function(walk) {
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
    this.countBlockIndent(walk);
    if (this.tryUnorderedList(walk)) return;
    if (this.tryOrderedList(walk)) return;
    if (this.tryDefinitionList(walk)) return;
    if (this.tryHeading(walk)) return;
    if (this.tryCodeBlock(walk)) return;
    if (this.tryDiv(walk)) return;
    if (this.tryHtml(walk)) return;
    if (this.tryHrTable(walk)) return;
    this.emitParagraph(walk);
  },

  // Uses inline compiler to emit output of specified walk.

  emitInline: function(walk) {
    this.inline.processInlines(walk);
    return this;
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
  stripSelector: function(walk, allowMultipleSelectors) {
    this.selector = {};
    var start = walk.position;
    while (walk.hasCurrent() && !walk.atNewLine()) {
      if (walk.at("\\{")) {
        walk.skip(2);
        continue;
      }
      if (walk.at("{")) {
        var s = walk.position;
        walk.skip();
        this.trySelectorId(walk);
        while(this.trySelectorClass(walk)) {}
        this.trySelectorStyle(walk);
        if (!walk.at("}")) // invalid selector
          break;
        // Selector matched, exclude it
        walk.skip().skipSpaces();
        // Only match if the selector was at the end of the line
        // or we allow multiple selectors on a line and the next char is "{"
        if (!walk.hasCurrent() || walk.atNewLine() || (allowMultipleSelectors && walk.at("{"))) {
          var e = walk.position;
          return walk.startFrom(start).exclude(s, e);
        }
      } else walk.skip();
    }
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

  trySelectorStyle: function(walk) {
    if (!walk.at(";")) return false;
    walk.skip();
    var end = walk.lookahead(function(w) {
      while (w.hasCurrent() && !w.at('}'))
        w.skip();
      return w.position;
    });
    this.selector.style = walk.yieldUntil(end);
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
    // emit style
    if (typeof this.selector.style == "string") {
      this.out.push(" style=\"" + this.selector.style + "\"");
    }
    // emit class
    if (Array.isArray(this.selector.classes)) {
      this.out.push(" class=\"");
      var totalSel = this.selector.classes.length;
      for (var i = 0; i < totalSel; i++) {
        if (i > 0) this.out.push(" ");
        this.out.push(this.selector.classes[i]);
      }
      this.out.push("\"");
    }
  },

  /* Markered blocks are DIVs `~~~` and code blocks `\`\`\``. */

  tryCodeBlock: function(walk) {
    if (!walk.at("```")) return false;
    walk.skip(3);
    var startIdx = walk.position;
    var endIdx = walk.indexOf("```");
    if (endIdx === null) {
      // Not a code block
      walk.startFrom(startIdx - 3);
      return false;
    }
    var b = this.stripSelector(new SubWalker(walk, startIdx, endIdx));
    this.out.push("<pre");
    this.emitSelector();
    this.out.push("><code>");
    this.emitCode(b);
    this.out.push("</code></pre>");
    walk.startFrom(endIdx + 3).skipBlankLines();
    return true;
  },

  /* Code is processed line-by-line, block indent is stripped. */

  emitCode: function(walk) {
    walk.skipBlankLines();
    if (walk.atSpaces(this.blockIndent))
      walk.skip(this.blockIndent);
    while (walk.hasCurrent()) {
      if (walk.atNewLine()) {
        walk.skipNewLine();
        if (walk.atSpaces(this.blockIndent))
          walk.skip(this.blockIndent);
        if (walk.hasCurrent())
          this.out.push("\n");
      } else {
        this.inline.emitCode(walk);
      }
    }
  },

  /* Divs are simple blocks surrounded by `~~~`. They are extremely
   useful if you wish to attach a class to several blocks without
   changing their semantics. */

  tryDiv: function(walk) {
    if (!walk.at("~~~")) return false;
    walk.skip(3);
    var startIdx = walk.position;
    var endIdx = walk.indexOf("~~~");
    if (endIdx === null) {
      // Not a div
      walk.startFrom(startIdx - 3);
      return false;
    }
    var b = this.stripSelector(new SubWalker(walk, startIdx, endIdx));
    this.out.push("<div");
    this.emitSelector();
    this.out.push(">");
    while (b.hasCurrent())
      this.emitBlock(b);
    this.out.push("</div>\n");
    walk.startFrom(endIdx + 3).skipBlankLines();
    return true;
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
    var ul = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
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
        var li = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
        this.emitLi(li);
        // Skip next marker
        walk.skip(2);
        startIdx = walk.position;
      }
    }
    // Emit last li
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
    this.emitLi(last);
    // All items emitted
    this.out.push("</ul>\n");
  },

  /* Ordered lists start with `1. ` and continue with any-digit marker. */

  tryOrderedList: function(walk) {
    if (!walk.at("1. ")) return false;
    var startIdx = walk.position;
    var found = false;
    // Find the end of the block, checking for nested subblocks
    while (!found && walk.hasCurrent()) {
      walk.scrollToTerm().skipBlankLines();
      if (walk.atSpaces(this.blockIndent)) {
        var i = walk.position;
        walk.skip(this.blockIndent);
        if (!this.lookingAtOlMarker(walk) && !walk.atSpace()) {
          found = true;
          walk.startFrom(i);
        }
      } else found = true;
    }
    // We got UL region, emit it
    var ol = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
    this.emitOl(ol);
    return true;
  },

  lookingAtOlMarker: function(walk) {
    if (!walk.atDigit()) return false;
    return walk.lookahead(function(w) {
      while (w.atDigit())
        w.skip();
      return w.at(". ");
    });
  },

  emitOl: function(walk) {
    this.out.push("<ol");
    this.emitSelector();
    this.out.push(">");
    // Determining the bounds of each li
    walk.skipDigits().skip(2); // Skipping marker
    var startIdx = walk.position;
    while (walk.hasCurrent()) {
      walk.scrollToEol().skipBlankLines();
      if (walk.atSpaces(this.blockIndent) &&
        this.lookingAtOlMarker(walk.skip(this.blockIndent))) {
        var li = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
        this.emitLi(li);
        // Skip next marker
        walk.skipDigits().skip(2);
        startIdx = walk.position;
      }
    }
    // Emit last li
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position), true);
    this.emitLi(last);
    // All items emitted
    this.out.push("</ol>\n");
  },

  // LI emitting is universal -- both for OLs and ULs.

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
    } else this.emitInline(walk);
    this.out.push("</li>");
  },

  /* Definition lists start with either `= ` or `- ` which are rendered as
  `dt` and `dd` respectively. Indentation is required for nested blocks. */

  tryDefinitionList: function(walk) {
    if (!walk.at("= ") && !walk.at('- ')) return false;
    var startIdx = walk.position;
    var found = false;
    // Find the end of the block, checking for nested subblocks
    while (!found && walk.hasCurrent()) {
      walk.scrollToTerm().skipBlankLines();
      if (walk.atSpaces(this.blockIndent)) {
        var i = walk.position;
        walk.skip(this.blockIndent);
        if (!walk.at("= ") && !walk.at('- ') && !walk.atSpace()) {
          found = true;
          walk.startFrom(i);
        }
      } else found = true;
    }
    // We got DL region, emit it
    var dl = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitDl(dl);
    return true;
  },

  emitDl: function(walk) {
    this.out.push("<dl");
    this.emitSelector();
    this.out.push(">");
    // Parsing dt and dd
    var startIdx = walk.position;
    while (walk.hasCurrent()) {
      walk.scrollToEol().skipBlankLines();
      if (walk.atSpaces(this.blockIndent)) {
        walk.skip(this.blockIndent);
        if (walk.at('= ') || walk.at('- ')) {
          var elem = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
          this.emitDtDd(elem);
          startIdx = walk.position;
        }
      }
    }
    // Emit last element
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.emitDtDd(last);
    // All items emitted
    this.out.push("</dl>\n");
  },

  // emits either `dt` or `dd` depending on the marker

  emitDtDd: function(walk) {
    var tag = walk.at('= ') ? 'dt' : 'dd';
    walk.skip(2);
    this.out.push("<");
    this.out.push(tag);
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
    } else this.emitInline(walk);
    this.out.push('</');
    this.out.push(tag);
    this.out.push('>');
  },

  /* Headings start with `#`, the amount of pounds designate the level. */

  tryHeading: function(walk) {
    if (!walk.at("#")) return false;
    var startIdx = walk.position;
    var level = 0;
    while (walk.at("#")) {
      walk.skip();
      level += 1;
    }
    if (!walk.at(" ")) {
      walk.startFrom(startIdx);
      return false;
    }
    // This is heading now, emitting inplace
    var tag = "h" + level.toString();
    walk.skip();
    startIdx = walk.position;
    walk.scrollToTerm();
    var h = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    this.out.push("<");
    this.out.push(tag);
    this.emitSelector();
    this.out.push(">");
    this.emitInline(h);
    this.out.push("</");
    this.out.push(tag);
    this.out.push(">");
    return true;
  },

  /* Block HTML tags are emitted without much of modification. */

  tryHtml: function(walk) {
    if (!walk.at("<")) return false;
    var endIdx = walk.indexOf(">");
    if (endIdx === null) {
      return false;
    }
    var tag = walk.substring(walk.position, endIdx + 1);
    // Attempt to match a tag
    var m = htmlTagRe.exec(tag);
    if (m === null) {
      // Try HTML comment as well
      if (htmlCommentRe.test(tag)) {
        this.out.push(tag);
        walk.startFrom(endIdx + 1).skipBlankLines();
        return true;
      }
      // Not HTML block or comment
      return false;
    }
    // Only block tags are accepted
    var tagName = m[1].toLowerCase();
    if (inlineTags.indexOf(tagName) !== -1) {
      // Seems like it's a paragraph starting with inline element
      return false;
    }
    // Search for corresponding closing tag
    var startIdx = walk.position;
    walk.startFrom(endIdx);
    this.scrollToClosingTag(walk, tagName);
    var w = new SubWalker(walk, startIdx, walk.position);
    while (w.hasCurrent())
      this.inline.emitPlain(w);
    return true;
  },

  scrollToClosingTag: function(walk, tagName) {
    var openingTag = "<" + tagName;
    var closingTag = "</" + tagName;
    var found = false;
    while (!found && walk.hasCurrent()) {
      // Closing tag
      if (walk.atInsensitive(closingTag)) {
        walk.skip(closingTag.length).scrollTo(">").skip();
        return;
      }
      // Opening tag: skipping it and search recursively
      if (walk.atInsensitive(openingTag)) {
        walk.skip(openingTag.length).scrollTo(">").skip();
        this.scrollToClosingTag(walk, tagName);
        continue;
      }
      // All other cases
      walk.skip();
    }
  },

  /* HRs and tables start with `---`. Their latter contents is ran through
   regex.*/

  tryHrTable: function(walk) {
    if (!walk.at("---")) return false;
    var startIdx = walk.position;
    walk.scrollToTerm();
    var b = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
    if (b.toString().trim() == "---")
      this.emitHr(b);
    else this.emitTable(b);
    return true;
  },

  emitHr: function(walk) {
    this.out.push("<hr");
    this.emitSelector();
    this.out.push("/>");
  },

  emitTable: function(walk) {
    var $this = this;
    this.out.push("<table");
    this.emitSelector();
    // Scan for width marker at the end of initial `-`-sequence
    while (walk.at("-")) walk.skip();
    if (walk.at(">")) {
      this.out.push(" width=\"100%\"");
      walk.skip();
    }
    this.out.push(">");
    // Columns count is determined by reading the first line
    walk.skipWhitespaces();
    var cells = this.readCells(walk.readLine());
    var cols = cells.length;
    var alignAttrs = [];
    var hasHead = false;
    // Scan the next line for alignment data, if it looks like separator line
    var line = walk.readLine();
    if (tableSeparatorLineRe.test(line.toString().trim())) {
      hasHead = true;
      // stash selector, b/c it is overwritten by readCells
      var selector = this.selector;
      var separators = this.readCells(line);
      this.selector = selector;
      separators.forEach(function(e, i) {
        var m = e.trim();
        var left = m[0] == ":";
        var right = m[m.length - 1] == ":";
        if (left && right) alignAttrs[i] = " class=\"align-center\"";
        else if (left) alignAttrs[i] = " class=\"align-left\"";
        else if (right) alignAttrs[i] = " class=\"align-right\"";
      });
    }
    // Emitting head
    if (hasHead) {
      this.out.push("<thead>");
      this.emitRow("th", cells, alignAttrs);
      this.out.push("</thead>");
    }
    // Emitting body
    this.out.push("<tbody>");
    var found = false;
    if (!hasHead) {
      // Don't forget that first row!
      this.emitRow("td", cells, alignAttrs);
      // Also process the buffered line
      found = processLine();
    }
    while (!found && walk.hasCurrent()) {
      walk.skipWhitespaces();
      line = walk.readLine();
      found = processLine();
    }
    this.out.push("</tbody>");
    this.out.push("</table>");

    function processLine() {
      if (tableEndRe.test(line.toString().trim()))
        return true;
      var cells = $this.readCells(line);
      while (cells.length > cols)
        cells.pop();
      while (cells.length < cols)
        cells.push("");
      $this.emitRow("td", cells, alignAttrs);
      return false;
    }

  },

  emitRow: function(tag, cells, alignAttrs) {
    this.out.push("<tr");
    this.emitSelector();
    this.out.push(">");
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var a = alignAttrs[i];
      this.out.push("<");
      this.out.push(tag);
      if (a) this.out.push(a);
      this.out.push(">");
      if (cell.length)
        this.emitInline(new Walker(cell));
      this.out.push("</");
      this.out.push(tag);
      this.out.push(">");
    }
    this.out.push("</tr>");
  },

  // Columns are read line-by-line, cells are delimited with `|`

  readCells: function(walk) {
    walk = this.stripSelector(walk);
    var result = [];
    walk.skipWhitespaces();
    // Skipping leading pipe
    if (walk.at("|")) walk.skip();
    var i = walk.position;
    while (walk.hasCurrent() && !walk.atNewLine()) {
      // Respect backslash escape `\\|`
      if (walk.at("\\|"))
        walk.skip(2);
      else if (walk.at("|")) {
        result.push(walk.substring(i, walk.position));
        walk.skip();
        i = walk.position;
      } else walk.skip();
    }
    // Don't forget the last cell
    var s = walk.substring(i, walk.position).trim();
    if (s != "")
      result.push(s);
    // Skip trailing whitespace
    walk.skipWhitespaces();
    return result;
  },

  /* Paragraph is the most generic block. It is emitted if
   other blocks did not match. */

  emitParagraph: function(walk) {
    if (walk.hasCurrent()) {
      var start = walk.position;
      walk.scrollToTerm();
      var p = this.stripSelector(new SubWalker(walk, start, walk.position));
      this.out.push("<p");
      this.emitSelector();
      this.out.push(">");
      this.emitInline(p);
      this.out.push("</p>\n");
    }
  }

};

/* ## Constants */
var inlineTags = ["a", "b", "big", "i", "small", "tt", "abbr", "acronym",
  "cite", "code", "dfn", "em", "kbd", "strong", "samp", "time", "var",
  "a", "bdo", "br", "img", "map", "object", "q", "script", "span", "sub",
  "sup", "button", "input", "label", "select", "textarea"];

var htmlTagRe = /^<\/?([a-zA-Z]+)\b[\s\S]*?(\/)?>$/;
var htmlCommentRe = /^<!--[\s\S]*?-->$/;

var tableSeparatorLineRe = /^[- :|]+$/;
var tableEndRe = /^-{3,}$/;

},{"./defaults":3,"./extend":4,"./inline":5,"./walker":6}],2:[function(require,module,exports){
/* # Rho for browser */

window.rho = {

  options: require("./defaults"),

  BlockCompiler: require("./block"),

  InlineCompiler: require("./inline"),

  toHtml: function(text) {
    return new rho.BlockCompiler(this.options).toHtml(text);
  },

  toInlineHtml: function(text) {
    return new rho.InlineCompiler(this.options).toHtml(text);
  }

};

},{"./block":1,"./defaults":3,"./inline":5}],3:[function(require,module,exports){
"use strict";

exports.options = {

  resolveLink: function(id) {
    return null;
  },

  resolveImage: function(id) {
    return null;
  },

  stripInvalidXmlChars: true,

  typographics: {

    enabled: true,

    mdash: "&mdash;",
    copy: "&copy;",
    reg: "&reg;",
    trade: "&trade;",
    larr: "&larr;",
    rarr: "&rarr;",
    ldquo: "&ldquo;",
    rdquo: "&rdquo;"

  }

};
},{}],4:[function(require,module,exports){
"use strict";

var extend = module.exports = function() {
  var target = arguments[0] || {}
    , length = arguments.length;

  if (typeof target != 'object') {
    target = {}
  }

  for (var i = 1; i < length; i++) {
    var aug = arguments[i];
    if (!aug) continue;
    for (var k in aug) {
      var src = target[k];
      if (typeof src == 'object') {
        target[k] = extend(src, aug[k]);
      } else target[k] = aug[k];
    }
  }

  return target;

};
},{}],5:[function(require,module,exports){
"use strict";

var defaults = require("./defaults")
  , Walker = require("./walker").Walker
  , SubWalker = require("./walker").SubWalker;

/* # Inline compiler

 Inline compiler transforms text within blocks by applying
 typographic enhancements, escaping unsafe HTML and XML chars,
 expanding inline elements syntax, including `em`, `strong`,
 `code`, `a`, etc.
 */
var InlineCompiler
  = module.exports
  = exports
  = function(options) {

  this.options = require("./extend")({}, defaults.options, options);

  this.reset();

};

/* ## Compilation

 Compilation is done by series of `tryXXX` alongside with `emitXXX`
 methods.

 `tryXXX` probe input at current position to match some tokens specific
 for `XXX` markup element.

 `tryXXX` methods are designed for fail-fast: if the input don't match,
 they immediately return `false`, leaving the cursor unmodified.
 However, if they match, they become responsible for emitting an element.
 When `tryXXX` returns `true`, the input cursor is positioned at the end
 of `XXX`.

 `emitXXX` are designed to emit unconditionally, thus they do not return
 anything meaningful.
 */
InlineCompiler.prototype = {

  toHtml: function(input) {
    return this.reset().append(input).outToString();
  },

  reset: function() {
    this.out = [];
    return this;
  },

  append: function(input) {
    return this.processInlines(new Walker(input));
  },

  processInlines: function(walk) {
    while(walk.hasCurrent())
      this.emitNormal(walk);
    return this;
  },

  outToString: function() {
    var result = "";
    for (var i = 0; i < this.out.length; i++)
      result += this.out[i];
    return result;
  },

  /* ## Compiler contexts

   Inline compiler operates in following contexts:

   * normal — all tokens are processed as in specification;
   * code — only backslash escapes and HTML chars are processed;
   * plain — only ampersand-escapes are processed.

   */
  emitNormal: function(walk) {
    if (this.emitText(walk)) return;
    // Backslash escapes
    if (this.tryBackslashEscape(walk)) return;
    // Typographics
    if (this.options.typographics.enabled &&
      this.tryTypographics(walk))
      return;
    // HTML chars
    if (this.tryAmp(walk)) return;
    if (this.tryLt(walk)) return;
    if (this.tryGt(walk)) return;
    // Bracing elements
    if (this.tryTripleCodeSpan(walk)) return;
    if (this.tryCodeSpan(walk)) return;
    if (this.tryFormula(walk)) return;
    if (this.tryEm(walk)) return;
    if (this.tryStrong(walk)) return;
    // Link, media, fragments
    if (this.tryHeadlessLink(walk)) return;
    if (this.tryLink(walk)) return;
    if (this.tryImg(walk)) return;
    // General character
    this.emitChar(walk);
  },

  /* Chars are spit "as is", only XML-invalid chars are filtered. */
  emitChar: function(walk) {
    var c = walk.current();
    if (!(this.options.stripInvalidXmlChars && isInvalidXmlChar(c)))
      this.out.push(c);
    walk.skip();
  },

  emitText: function(walk) {
    var t = walk.yieldText();
    if (t.length > 0)
      this.out.push(t);
    return !walk.hasCurrent();
  },

  /* Reserved char are backslash-escaped. */
  tryBackslashEscape: function(walk) {
    if (!walk.at("\\"))
      return false;
    // Assuming backslash
    walk.skip();
    if (walk.matchSome(backslashChars)) {
      this.out.push(walk.current());
      walk.skip();
    } else {
      this.out.push("\\");
    }
    return true;
  },

  tryTypographics: function(walk) {
    if (walk.at("--")) {
      walk.skip(2);
      this.out.push(this.options.typographics.mdash);
      return true;
    } else if (walk.at("(c)") || walk.at("(C)")) {
      walk.skip(3);
      this.out.push(this.options.typographics.copy);
      return true;
    } else if (walk.at("(r)") || walk.at("(R)")) {
      walk.skip(3);
      this.out.push(this.options.typographics.reg);
      return true;
    } else if (walk.at("(tm)") || walk.at("(TM)")) {
      walk.skip(4);
      this.out.push(this.options.typographics.trade);
      return true;
    } else if (walk.at("<-")) {
      walk.skip(2);
      this.out.push(this.options.typographics.larr);
      return true;
    } else if (walk.at("&lt;-")) {
      walk.skip(5);
      this.out.push(this.options.typographics.larr);
      return true;
    } else if (walk.at("->")) {
      walk.skip(2);
      this.out.push(this.options.typographics.rarr);
      return true;
    } else if (walk.at("-&gt;")) {
      walk.skip(5);
      this.out.push(this.options.typographics.rarr);
      return true;
    } else if (walk.at("\"")) {
      walk.skip();
      var lastToken = this.out[this.out.length - 1] || "";
      var lastChar = lastToken[lastToken.length - 1] || "";
      if (lastChar.trim() == "")
        this.out.push(this.options.typographics.ldquo);
      else this.out.push(this.options.typographics.rdquo);
      return true;
    }
    return false;
  },

  /* Ampersands should distinguish entity references. */

  tryAmp: function(walk) {
    if (!walk.at("&")) return false;
    // Assuming entity reference
    var end = walk.lookahead(function(w) {
      // Skipping &
      walk.skip();
      var allowedChars = latinLetters;
      if (walk.matchSome(["#x", "#X"])) {
        allowedChars = hexChars;
        walk.skip(2);
      } else if (walk.at("#")) {
        allowedChars = decimalChars;
        walk.skip();
      }
      // We are standing at the first char of entity reference code
      if (w.current() == ";")  // zero-length references disallowed
        return null;
      while (w.hasCurrent()) {
        var c = w.current();
        if (c == ";") {
          w.skip();
          return w.position;
        } else if (w.matchSome(allowedChars)) {
          w.skip();
        } else return null;
      }
      return null;
    });
    // Entity reference is emitted as is
    if (end !== null) {
      this.out.push(walk.yieldUntil(end));
    } else {
      // Escaping as &amp;
      this.out.push("&amp;");
      walk.skip();
    }
    return true;
  },

  /* The `<` char should be escaped, unless it is a part of HTML tag. */

  tryLt: function(walk) {
    if (!walk.at("<")) return false;
    if (this.tryHtmlTag(walk)) return true;
    if (this.tryHtmlComment(walk)) return true;
    // Not HTML tag -- escaping <
    this.out.push("&lt;");
    walk.skip();
    return true;
  },

  /* HTML tags and comments are emitted without much of modification
   (only amps are processed inside). A word of a caution, though.

   HTML tag is rather coarsely determined: we look for `<`,
   then optional `/` (in case this is a close tag); then
   latin word -- tag name. If matching is successful up to this point,
   we start looking for the sequence which closes this tag (`>` or `/>`).

   This leads to unexpected behaviour, if you have an input like
   `A<B *hello* A>B`, which you would expect to compile like
   `A&lt;B <strong>hello</strong> A&gt;B`. Due to our coarse HTML detection
   the `<B *hello* A>` sequence is considered a HTML tag, thus is left
   unprocessed.

   Most of the time this is totally OK, however. The `<` chars are not
   encountered that much in plain texts, and when they do, they are usually:

   * a part of MathJAX expression (inside `%%` or `$$`);
   * a part of code block or code span;
   * delimited from words with spaces.

   In all of these cases it will be escaped as `&lt;`, comme il faut.

   */

  tryHtmlTag: function(walk) {
    var end = walk.lookahead(function(w) {
      w.skip();
      // Closing tags count
      if (w.at("/"))
        w.skip();
      // Tag name should start with latin
      if (!w.atLatin())
        return null;
      while(w.atLatin())
        w.skip();
      // Tag name skipped, now search for either /> or >
      while(w.hasCurrent()) {
        if (w.at(">")) {
          w.skip();
          return w.position;
        } else if (w.at("/>")) {
          w.skip(2);
          return w.position;
        }
        w.skip();
      }
      return null;
    });
    // Not HTML tag -- returning
    if (end === null)
      return false;
    // Emitting HTML tag
    var w = new SubWalker(walk, walk.position, end);
    while(w.hasCurrent())
      this.emitHtmlTag(w);
    walk.startFrom(end);
    return true;
  },

  tryHtmlComment: function(walk) {
    if (!walk.at("<!--"))
      return false;
    var end = walk.lookahead(function(w) {
      w.skip(4);
      while(w.hasCurrent())
        if (w.at("-->"))
          return w.position + 3;
        else w.skip();
      return null;
    });
    // Not HTML comment
    if (end === null)
      return false;
    // Emitting like HTML tag
    this.out.push(walk.yieldUntil(end));
    return true;
  },

  emitHtmlTag: function(walk) {
    if (this.emitText(walk)) return;
    if (this.tryAmp(walk)) return;
    if (this.tryLinkAttr(walk)) return;
    this.emitChar(walk);
  },

  /* Some sensitive contexts require only ampersands escape. */

  emitPlain: function(walk) {
    if (this.emitText(walk)) return;
    this.emitChar(walk);
  },

  /* The `>` char is straightforward, since unescaped cases
   are already covered by HTML tags. */

  tryGt: function(walk) {
    if (!walk.at(">")) return false;
    this.out.push("&gt;");
    walk.skip();
    return true;
  },

  /* There are cases (code spans) when `<` is escaped unconditionally,
   even if it denotes to HTML tag. */

  tryLtEscape: function(walk) {
    if (!walk.at("<")) return false;
    this.out.push("&lt;");
    walk.skip();
    return true;
  },

  /* Bracing elements -- code spans, ems and strongs -- are processed
   like logical parentheses. */

  tryBracing: function(walk, openMarker, closeMarker, emitter) {
    if (!walk.at(openMarker))
      return false;
    walk.skip(openMarker.length);
    var end = walk.indexOf(closeMarker);
    if (end === null) {
      // just emit the open marker
      this.out.push(openMarker);
    } else {
      // delegate rendering of subarea to emitter
      var w = new SubWalker(walk, walk.position, end);
      emitter.call(this, w);
      walk.startFrom(end + closeMarker.length);
    }
    return true;
  },

  /* Triple code spans are emitted as is, only ampersands are escaped
   inside. */

  tryTripleCodeSpan: function(walk) {
    return this.tryBracing(walk, '```', '```', function(w) {
      this.out.push("<code>");
      while (w.hasCurrent())
        this.emitPlain(w);
      this.out.push("</code>");
    });
  },

  /* Regular code spans are processed by escaping amps, lt-gts, resolving
   fragments and respecting backslash escapes. */

  tryCodeSpan: function(walk) {
    return this.tryBracing(walk, '`', '`', function(w) {
      this.out.push("<code>");
      while (w.hasCurrent())
        this.emitCode(w);
      this.out.push("</code>");
    });
  },

  emitCode: function(walk) {
    if (this.tryBackslashEscape(walk)) return;
    if (this.tryAmp(walk)) return;
    if (this.tryLtEscape(walk)) return;
    if (this.tryGt(walk)) return;
    this.emitChar(walk)
  },

  /* MathJax-friendly formulas are enclosed in `$$` or `%%` pairs.
   Processing is similar to the one in code spans, except that
   backslashes are emitted as-is. Markers are emitted too. */
  tryFormula: function(walk) {
    return this.tryFormulaM(walk, "%%") || this.tryFormulaM(walk, "$$");
  },

  tryFormulaM: function(walk, marker) {
    return this.tryBracing(walk, marker, marker, function(w) {
      this.out.push(marker);
      while(w.hasCurrent())
        this.emitFormula(w);
      this.out.push(marker);
    });
  },

  emitFormula: function(walk) {
    if (this.tryAmp(walk)) return;
    if (this.tryLtEscape(walk)) return;
    if (this.tryGt(walk)) return;
    this.emitChar(walk)
  },

  /* Ems and strongs are matched reluctantly up to their closing marker. */

  tryEm: function(walk) {
    return this.tryBracing(walk, '_', '_', function(w) {
      this.out.push("<em>");
      while (w.hasCurrent())
        this.emitNormal(w);
      this.out.push("</em>");
    });
  },

  tryStrong: function(walk) {
    return this.tryBracing(walk, '*', '*', function(w) {
      this.out.push("<strong>");
      while (w.hasCurrent())
        this.emitNormal(w);
      this.out.push("</strong>");
    });
  },

  /* Links and images are resolved from supplied `options`. */

  emitLink: function(text, link) {
    var href = link.url
      , external = link.external || this.options.externalLinks;
    if (!href)
      href = link.toString();
    this.out.push("<a href=\"" + href + "\"");
    if (link.title)
      this.out.push(" title=\"" + escapeHtml(link.title) + "\"");
    if (external)
      this.out.push(" target=\"_blank\"");
    // Link text is rendered separately with the same options
    var html = new InlineCompiler(this.options).toHtml(text);
    this.out.push(">" + html + "</a>");
  },

  tryHeadlessLink: function(walk) {
    if (!walk.at("[["))
      return false;
    walk.skip(2);
    var end = walk.indexOf("]]");
    // ]] not found, emitting
    if (end === null) {
      this.out.push("[[");
      return true
    }
    var id = walk.yieldUntil(end);
    var link = this.options.resolveLink(id);
    if (!link) // Link not found, spitting as is
      this.out.push("[[" + id + "]]");
    else this.emitLink(link.title, link);
    walk.skip(2);
    return true;
  },

  tryLink: function(walk) {
    if (!walk.at("[")) return false;
    // Try to find the ]
    walk.skip();
    var start = walk.position;
    // Also support nesting with images
    var end = walk.lookahead(function(w) {
      var nested = 0;
      var found = false;
      while (!found && w.hasCurrent()) {
        if (w.at("\\"))
          w.skip(2);
        else if (w.at('![')) {
          nested += 1;
          w.skip(2);
        } else if (w.at(']')) {
          if (nested == 0)
            found = true;
          else {
            nested -= 1;
            w.skip()
          }
        } else w.skip();
      }
      return found ? w.position : null;
    });
    if (end === null) {
      this.out.push("[");
      return true;
    }
    // Collecting the text up to ] and matching further
    var text = walk.yieldUntil(end);
    walk.skip();
    if (this.tryInlineLink(text, walk)) return true;
    if (this.tryRefLink(text, walk)) return true;
    // Nothing matched -- rolling back and processing text normally
    walk.startFrom(start);
    this.out.push("[");
    return true;
  },

  tryInlineLink: function(text, walk) {
    if (!walk.at("(")) return false;
    var end = walk.indexOf(")");
    if (end === null)
      return false;
    walk.skip();
    var href = walk.yieldUntil(end);
    walk.skip();
    this.emitLink(text, href);
    return true;
  },

  tryRefLink: function(text, walk) {
    if (!walk.at("[")) return false;
    var start = walk.position;
    walk.skip();
    var end = walk.indexOf("]");
    if (end !== null) {
      var id = walk.yieldUntil(end);
      var link = this.options.resolveLink(id);
      if (link) {
        this.emitLink(text, link);
        walk.skip();
        return true;
      }
    }
    // Not a reference link, rolling back
    walk.startFrom(start);
    return false;
  },

  emitImg: function(alt, link) {
    if (link.html) {
      this.out.push(link.html);
      return;
    }
    var src = link.url;
    if (!src)
      src = link.toString();
    this.out.push("<img src=\"" + src + "\" alt=\"" + escapeHtml(alt) + "\"");
    if (link.title)
      this.out.push(" title=\"" + escapeHtml(link.title) + "\"");
    this.out.push("/>");
  },

  tryImg: function(walk) {
    if (!walk.at("![")) return false;
    // Try to find the ]
    walk.skip(2);
    var start = walk.position;
    var end = walk.indexOf("]");
    if (end === null) {
      this.out.push("![");
      return true;
    }
    // Collecting the text up to ] and matching further
    var text = walk.yieldUntil(end);
    walk.skip();
    if (this.tryInlineImg(text, walk)) return true;
    if (this.tryRefImg(text, walk)) return true;
    // Nothing matched -- rolling back and processing text normally
    walk.startFrom(start);
    this.out.push("![");
    return true;
  },

  tryInlineImg: function(text, walk) {
    if (!walk.at("(")) return false;
    var end = walk.indexOf(")");
    if (end === null)
      return false;
    walk.skip();
    var src = walk.yieldUntil(end);
    walk.skip();
    this.emitImg(text, src);
    return true;
  },

  tryRefImg: function(text, walk) {
    if (!walk.at("[")) return false;
    var start = walk.position;
    walk.skip();
    var end = walk.indexOf("]");
    if (end !== null) {
      var id = walk.yieldUntil(end);
      var link = this.options.resolveImage(id);
      if (link) {
        this.emitImg(text, link);
        walk.skip();
        return true;
      }
    }
    // Not a reference link, rolling back
    walk.startFrom(start);
    return false;
  },

  tryLinkAttr: function(walk) {
    if (!walk.at("[")) return false;
    var start = walk.position;
    walk.skip();
    var end = walk.indexOf("]");
    if (end !== null) {
      var id = walk.yieldUntil(end);
      var link = this.options.resolveLink(id);
      if (link) {
        var url = link.url;
        if (!url)
          url = link.toString();
        this.out.push(url);
        walk.skip();
        return true;
      }
    }
    // Not a reference link, rolling back
    walk.startFrom(start);
    return false;
  }

};

/* ## Regexes and constants */

var backslashChars = '\\.+*[]()`{}_!-|~\'"';
var latinLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var hexChars = "0123456789abcdefABCDEF";
var decimalChars = "0123456789";
var ampEscape = /&(?!(?:[a-zA-Z]+|#[0-9]+|#[xX][0-9a-fA-F]+);)/g;

/* ## Utility stuff */

function isInvalidXmlChar(code) {
  if (typeof code == "string")
    code = code.charCodeAt(0);
  return (code >= 0x1 && code <= 0x8) ||
    (code >= 0xB && code <= 0xC) ||
    (code >= 0xE && code <= 0x1F) ||
    (code >= 0x7F && code <= 0x84) ||
    (code >= 0x86 && code <= 0x9F) ||
    (code >= 0xFDD0 && code <= 0xFDDF) ||
    (code % 0x10000 == 0xFFFE) ||
    (code % 0x10000 == 0xFFFF);
}

function escapeHtml(text) {
  return text
    .replace(ampEscape, "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace("\"", "&quot;")
    .replace("\'", "&#x27;");
}

function unescapeHtml(text) {
  return text
    // >
    .replace("&gt;", ">")
    .replace(/&#[xX]3[eE];/, ">")
    .replace("&#62;", ">")
    // <
    .replace(/&[lL][tT];/, "<")
    .replace(/&#[xX]3[cC];/, "<")
    .replace("&#60;", "<")
    // "
    .replace(/&[qQ][uU][oO][tT];/, "\"")
    .replace(/&#[xX]22;/, "\"")
    .replace("&#34;", "\"")
    // '
    .replace(/&[aA][pP][oO][sS];/, "\'")
    .replace(/&#[xX]27;/, "\'")
    .replace("&#39;", "\'")
    // &
    .replace(/&[aA][mM][pP];/, "&")
    .replace(/&#[xX]26;/, "&")
    .replace("&#38;", "&");
}

},{"./defaults":3,"./extend":4,"./walker":6}],6:[function(require,module,exports){
"use strict";

var extend = require("./extend");

/* # Generic character sequence walker

 `Walker` wraps `source` (string or another walker)
 and adds a common cursor, lookahead and other parser functionality.

 Walkers are supposed to be composed from either strings or another
 walkers. The catch is that no strings are actually copied --
 only indices. All operations inside are based on simple arithmetics.
 */
var Walker = exports.Walker = function(cs) {

  this.source = cs || "";
  this.position = 0;

  this.length = this.source.length;

};

Walker.prototype = {

  /* ## Character sequence

   We define `length` property along with `charAt(i)`,
   `substring(s, e)` and `toString()`
   to make every walker behave like a string.

   By convention character sequence variables are named `cs` are
   only allowed to use these members.
   */

  // returns a character at `i`
  charAt: function(i) {
    if (i >= this.length)
      return "";
    return this.source.charAt(i);
  },

  // returns a substring in specified range `[s;e)`
  substring: function(s, e) {
    if (typeof(e) == 'undefined')
      e = this.source.length;
    return this.source.substring(s, e);
  },

  // returns a string representation of this walker
  // (delegates to `source`)
  toString: function() {
    return this.source.toString();
  },

  /* ## Subregioning and exclusion

   The `exclude` method returns another walker based off the current one,
   cutting away a portion of text.
   */
  exclude: function(s, e) {
    if (e - s == 0) // none
      return this;
    if (s == 0 && e == this.length) // everything
      return new Walker("");
    if (s == 0) // minus prefix
      return new SubWalker(this, e, this.length);
    if (e == this.length) // minus postfix
      return new SubWalker(this, 0, s);
    // cut the middle out
    var ws = new SubWalker(this, 0, s);
    var we = new SubWalker(this, e, this.length);
    return new MultiWalker([ws, we]);
  },

  /* ## Cursors

   The `position` property is a simple zero-based index inside
   a walker. Many methods make use of it to do the traversal stuff.
   */

  // returns a char under `position`
  current: function() {
    return this.charAt(this.position);
  },

  // checks if `current()` is applicable in current position
  hasCurrent: function() {
    return this.position >= 0 && this.position < this.length;
  },

  // checks if `step()` is allowed from current position
  hasNext: function() {
    return (this.position + 1) < this.length;
  },

  // forwards the `position` by specified `n`
  skip: function(n) {
    if (typeof n == 'undefined')
      n = 1;
    this.position += n;
    return this;
  },

  // peeks a next char without modifying `position`
  peek: function() {
    return this.charAt(this.position + 1);
  },

  // resets `position` to zero
  reset: function() {
    this.position = 0;
    return this;
  },

  // resets `position` to specified `i`
  startFrom: function(i) {
    this.position = i;
    return this;
  },

  // executes a `fn` on current walker and returns its result,
  // the initial `position` is restored once `fn` finishes
  lookahead: function(fn) {
    var oldPos = this.position;
    var result = fn(this);
    this.position = oldPos;
    return result;
  },

  // walks to specified index `i`, returning a string
  yieldUntil: function(i) {
    if (i <= this.position)
      return "";
    var result = this.substring(this.position, i);
    this.startFrom(i);
    return result;
  },

  // walks up to next control symbol, returning a string
  yieldText: function() {
    var found = false;
    var start = this.position;
    while(!found && this.hasCurrent()) {
      var c = this.current();
      found = c == "" || c == "\\" || c == "&" || c == "<" ||
        c == ">" || c == "`" || c == "$" || c == "%" || c == "_" ||
        c == "*" || c == "!" || c == "[" || c == "(" || c == "{" ||
        c == "-" || c == "\"" || c == "=";
      if (!found)
        this.skip();
    }
    return this.substring(start, this.position);
  },

  // scrolls to the end of the current line
  scrollToEol: function() {
    while (this.hasCurrent() && !this.atNewLine())
      this.skip();
    return this;
  },

  // scrolls walker to the end of the block (EOL, followed by EOF or blank line)
  scrollToTerm: function() {
    var found = false;
    while(this.hasCurrent() && !found) {
      if (this.atNewLine()) {
        var i = this.position;
        if (this.skipNewLine().skipSpaces().atNewLine()) {
          this.startFrom(i);
          found = true;
        } else this.skip();
      } else this.skip();
    }
    return this;
  },

  // scrolls walker up to the next occurrence of specified `cs`
  scrollTo: function(cs) {
    while (this.hasCurrent() && !this.at(cs))
      this.skip();
    return this;
  },

  // scans forward, searching for `marker`, respecting backslashes,
  // returns the index or `null` if marker not found
  indexOf: function(marker) {
    return this.lookahead(function(w) {
      var found = false;
      while (!found && w.hasCurrent()) {
        if (w.at("\\"))
          w.skip(2);
        else if (w.at(marker))
          found = true;
        else w.skip();
      }
      return found ? w.position : null;
    });
  },

  /* ## Testing characters

   Various methods are available to quickly test characters
   at current cursor position.
   */

  // tests if cursor looks at specified `cs`
  at: function(cs) {
    var end = this.position + cs.length;
    if (end > this.length) return false;
    return this.substring(this.position, end) == cs;
  },

  // tests if cursor looks at specified `cs`, case insensitively
  atInsensitive: function(cs) {
    var end = this.position + cs.length;
    if (end > this.length) return false;
    return this.substring(this.position, end).toLowerCase() ==
      cs.toLowerCase();
  },

  // tests if current char is in specified `arr`
  matchSome: function(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (this.at(arr[i]))
        return arr[i];
    }
    return null;
  },

  // tests if cursor looks at digit
  atDigit: function() {
    var c = this.current();
    return c >= '0' && c <= '9';
  },

  // skips digits

  skipDigits: function() {
    while (this.atDigit())
      this.skip();
    return this;
  },

  // tests if cursor looks at latin letter
  atLatin: function() {
    var c = this.current();
    return c >= 'A' && c <= 'z';
  },

  // tests if cursor is at [a-zA-Z0-9_-]
  atIdentifier: function() {
    var c = this.current();
    return c >= '0' && c <= '9' || c >= 'A' && c <= 'z' || c == '_' || c == '-';
  },

  // tests if cursor is positioned towards a new line
  atNewLine: function() {
    return this.at("\r\n") ||
      this.at("\n") || this.at("\r");
  },

  // skips exactly one new line, if `atNewLine`
  skipNewLine: function() {
    if (this.at("\r\n"))
      this.skip(2);
    else if (this.atNewLine())
      this.skip();
    return this;
  },

  // skips all new line tokens at cursor
  skipNewLines: function() {
    while (this.atNewLine())
      this.skipNewLine();
    return this;
  },

  // tests if cursor is positioned towards an inline-level space
  atSpace: function() {
    return this.at(" ") || this.at("\t")
  },

  // tests if cursor looks at specified `count` of space chars
  atSpaces: function(count) {
    return this.lookahead(function(w) {
      for (var i = 0; i < count; i++) {
        if (!w.hasCurrent() || !w.at(" "))
          return false;
        w.skip();
      }
      return true;
    });
  },

  // skips one space char if positioned towards one
  skipSpace: function() {
    if (this.atSpace())
      this.skip();
    return this;
  },

  // skips all spaces at current cursor
  skipSpaces: function() {
    while (this.atSpace())
      this.skip();
    return this;
  },

  // tests if cursor looks at any kind of whitespace
  atWhitespace: function() {
    return this.atNewLine() || this.atSpace();
  },

  // skips one whitespace char at cursor position
  skipWhitespace: function() {
    var p = this.position;
    this.skipNewLine();
    if (this.position == p)
      this.skipSpace();
    return this;
  },

  // skips all whitespace at current cursor position
  skipWhitespaces: function() {
    while(this.atWhitespace())
      this.skip();
    return this;
  },

  // skips lines containing only whitespace characters up to
  // the beginning of the next line containing meaningful content
  skipBlankLines: function() {
    var finish = false;
    while(this.hasCurrent() && !finish) {
      var p = this.position;
      this.skipSpaces();
      if (this.atNewLine())
        this.skipNewLines();
      else {
        this.position = p;
        finish = true;
      }
    }
    return this;
  },

  // skips to the end of the current line, returning it
  readLine: function() {
    var startIdx = this.position;
    this.scrollToEol().skipNewLine();
    return new SubWalker(this, startIdx, this.position);
  }

};

/* # Subsequence walker

 `SubWalker` restricts the cursor to the portion of the source character
 sequence specified by `start` and `end` index.
 */
var SubWalker = exports.SubWalker = function(cs, start, end) {

  this.source = cs;

  this.start = start;
  if (typeof(start) == "undefined" || this.start < 0)
    this.start = 0;

  this.end = end;
  if (typeof(end) == "undefined" || this.end > cs.length)
    this.end = cs.length;

  this.length = this.end - this.start;

};

SubWalker.prototype = extend({}, new Walker, {

  charAt: function(i) {
    if (i >= this.length)
      return "";
    return this.source.charAt(this.start + i);
  },

  substring: function(s, e) {
    if (typeof(e) == 'undefined')
      e = this.length;
    return this.source.substring(this.start + s, this.start + e);
  },

  toString: function() {
    return this.source.substring(this.start, this.end);
  }

});

/* # Multi sequence walker

 `MultiWalker` provides a virtual worker over specified `regions`.
 */
var MultiWalker = exports.MultiWalker = function(regions) {

  if (Array.isArray(regions))
    this.regions = regions;
  else this.regions = [ regions ];

  var l = 0;

  this.regions.forEach(function(r) {
    l += r.length;
  });

  this.length = l;

  this.string = (function() {
    var result = "";
    for (var i = 0; i < this.regions.length; i++)
      result += this.regions[i];
    return result;
  }).call(this);

};

MultiWalker.prototype = extend({}, new Walker, {

  charAt: function(idx) {
    return this.string.charAt(idx);
  },

  substring: function(s, e) {
    if (this.regions.length == 0)
      return "";
    return this.string.substring(s, e);
  },

  toString: function() {
    return this.string;
  }

});


},{"./extend":4}]},{},[2]);
