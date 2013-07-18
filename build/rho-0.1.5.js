;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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

},{"./block":3,"./defaults":2,"./inline":4}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
"use strict";

var defaults = require("./defaults")
  , InlineCompiler = require("./inline")
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
  = exports
  = function(options) {

  this.options = require("extend")(true, {}, defaults.options, options);

  this.inline = new InlineCompiler(this.options);

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

  toHtml: function(input) {
    return this.reset().append(input).outToString();
  },

  reset: function() {
    this.out = [];
    this.selector = {};
    this.blockIndent = 0;
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
    if (this.options.pretty)
      result = html.prettyPrint(result, { indent_size: 2 }) + "\n";
    return result;
  },

  emitBlock: function(walk) {
    walk.skipBlankLines();
    this.countBlockIndent(walk);
    if (this.tryUnorderedList(walk)) return;
    if (this.tryOrderedList(walk)) return;
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
  stripSelector: function(walk) {
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
        if (!walk.at("}")) // invalid selector
          break;
        // Selector matched, exclude it
        walk.skip().skipSpaces();
        var e = walk.position;
        return walk.startFrom(start).exclude(s, e);
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
        // Skip next marker
        walk.skip(2);
        startIdx = walk.position;
      }
    }
    // Emit last li
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
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
    var ol = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
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
        var li = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
        this.emitLi(li);
        // Skip next marker
        walk.skipDigits().skip(2);
        startIdx = walk.position;
      }
    }
    // Emit last li
    var last = this.stripSelector(new SubWalker(walk, startIdx, walk.position));
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
        walk.startFrom(endIdx).skipBlankLines();
        return true;
      }
      // Not HTML block or comment
      return false;
    }
    // Only block tags are accepted
    var tagName = m[1].toLowerCase();
    if (blockTags.indexOf(tagName) == -1) {
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
    this.out.push("<table");
    this.emitSelector();
    this.out.push(">");
    // Scan for width marker at the end of initial `-`-sequence
    var widthAttr = "";
    while (walk.at("-")) walk.skip();
    if (walk.at(">")) {
      widthAttr = " width=\"100%\"";
      walk.skip();
    }
    // Columns count is determined by reading the first line
    var cells = this.readCells(walk);
    var cols = cells.length;
    var alignAttrs = [];
    var hasHead = false;
    // Scan the next line for alignment data, if it looks like separator line
    var startIdx = walk.position;
    walk.scrollToEol();
    var line = walk.substring(startIdx, walk.position);
    if (tableSeparatorLineRe.test(line)) {
      hasHead = true;
      var separators = this.readCells(new Walker(line));
      separators.forEach(function(e, i) {
        var m = e.trim();
        var left = m[0] == ":";
        var right = m[m.length - 1] == ":";
        if (left && right) alignAttrs[i] = " style=\"text-align:center\"";
        else if (left) alignAttrs[i] = " style=\"text-align:left\"";
        else if (right) alignAttrs[i] = " style=\"text-align:right\"";
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
    if (!hasHead)  // Don't forget that first row!
      this.emitRow("td", cells, alignAttrs);
    while (!found && walk.hasCurrent()) {
      walk.skipWhitespaces();
      startIdx = walk.position;
      walk.scrollToEol();
      line = walk.substring(startIdx, walk.position).trim();
      if (tableEndRe.test(line))
        found = true;
      else {
        cells = this.readCells(new Walker(line));
        while (cells.length > cols)
          cells.pop();
        while (cells.length < cols)
          cells.push("");
        this.emitRow("td", cells, alignAttrs);
      }

    }
    this.out.push("</tbody>");
    this.out.push("</table>");
  },

  emitRow: function(tag, cells, alignAttrs) {
    this.out.push("<tr>");
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
    var result = [];
    walk.skipWhitespaces();
    // Skipping leading pipe
    if (walk.at("|")) walk.skip();
    var i = walk.position;
    while (walk.hasCurrent() && !walk.atNewLine()) {
      // Respect backslash escape `\\|`
      if (walk.at("\\|")) walk.skip(2);
      if (walk.at("|")) {
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
    walk.skipWhitespaces();
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

var blockTags = ["address", "article", "aside", "blockquote", "canvas",
  "dd", "div", "dl", "dt", "fieldset", "figcaption", "figure", "footer",
  "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hgroup", "hr",
  "noscript", "ol", "output", "p", "pre", "section", "table", "ul",
  "style", "script"];

var htmlTagRe = /^<\/?([a-zA-Z]+)\b[\s\S]*?(\/)?>$/;
var htmlCommentRe = /^<!--[\s\S]*?-->$/;

var tableSeparatorLineRe = /^[- :|]+$/;
var tableEndRe = /^-{3,}$/;
},{"./defaults":2,"./inline":4,"./walker":5,"extend":7,"html":6}],4:[function(require,module,exports){
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

  this.options = require("extend")(true, {}, defaults.options, options);

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
    if (this.tryAmp(walk)) return;
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
    this.tryBracing(walk, marker, marker, function(w) {
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
    var href = link.url;
    if (!href)
      href = link.toString();
    this.out.push("<a href=\"" + href + "\"");
    if (link.title)
      this.out.push(" title=\"" + escapeHtml(link.title) + "\"");
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
    var end = walk.indexOf("]");
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
      var url = link.url;
      if (!url)
        url = link.toString();
      if (link) {
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

},{"./defaults":2,"./walker":5,"extend":7}],6:[function(require,module,exports){
/*

 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <elfz@laacz.lv>
    http://jsbeautifier.org/


  You are free to use this in any way you want, in case you find this useful or working for you.

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    max_char (default 70)            -  maximum amount of characters per line,
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"

    e.g.

    style_html(html_source, {
      'indent_size': 2,
      'indent_char': ' ',
      'max_char': 78,
      'brace_style': 'expand',
      'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u']
    });
*/

function style_html(html_source, options) {
//Wrapper function to invoke all the necessary constructors and deal with the output.

  var multi_parser,
      indent_size,
      indent_character,
      max_char,
      brace_style,
      unformatted;

  options = options || {};
  indent_size = options.indent_size || 4;
  indent_character = options.indent_char || ' ';
  brace_style = options.brace_style || 'collapse';
  max_char = options.max_char == 0 ? Infinity : options.max_char || 70;
  unformatted = options.unformatted || ['a', 'span', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

  function Parser() {

    this.pos = 0; //Parser position
    this.token = '';
    this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
    this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
      parent: 'parent1',
      parentcount: 1,
      parent1: ''
    };
    this.tag_type = '';
    this.token_text = this.last_token = this.last_text = this.token_type = '';

    this.Utils = { //Uilities made available to the various functions
      whitespace: "\n\r\t ".split(''),
      single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?='.split(','), //all the single tags for HTML
      extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
      in_array: function (what, arr) {
        for (var i=0; i<arr.length; i++) {
          if (what === arr[i]) {
            return true;
          }
        }
        return false;
      }
    }

    this.get_content = function () { //function to capture regular content between tags

      var input_char = '',
          content = [],
          space = false; //if a space is needed

      while (this.input.charAt(this.pos) !== '<') {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (content.length) {
            space = true;
          }
          this.line_char_count--;
          continue; //don't want to insert unnecessary space
        }
        else if (space) {
          if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
            content.push('\n');
            for (var i=0; i<this.indent_level; i++) {
              content.push(this.indent_string);
            }
            this.line_char_count = 0;
          }
          else{
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        content.push(input_char); //letter at-a-time (or string) inserted to an array
      }
      return content.length?content.join(''):'';
    }

    this.get_contents_to = function (name) { //get the full content of a script or style to pass to js_beautify
      if (this.pos == this.input.length) {
        return ['', 'TK_EOF'];
      }
      var input_char = '';
      var content = '';
      var reg_match = new RegExp('\<\/' + name + '\\s*\>', 'igm');
      reg_match.lastIndex = this.pos;
      var reg_array = reg_match.exec(this.input);
      var end_script = reg_array?reg_array.index:this.input.length; //absolute end of script
      if(this.pos < end_script) { //get everything in between the script tags
        content = this.input.substring(this.pos, end_script);
        this.pos = end_script;
      }
      return content;
    }

    this.record_tag = function (tag){ //function to record a tag and its parent in this.tags Object
      if (this.tags[tag + 'count']) { //check for the existence of this tag type
        this.tags[tag + 'count']++;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      else { //otherwise initialize this tag type
        this.tags[tag + 'count'] = 1;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
      this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
    }

    this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
      if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
        while (temp_parent) { //till we reach '' (the initial value);
          if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
            break;
          }
          temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
        }
        if (temp_parent) { //if we caught something
          this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
          this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
        }
        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
        if (this.tags[tag + 'count'] == 1) {
          delete this.tags[tag + 'count'];
        }
        else {
          this.tags[tag + 'count']--;
        }
      }
    }

    this.get_tag = function () { //function to get a full tag and parse its type
      var input_char = '',
          content = [],
          space = false,
          tag_start, tag_end;

      do {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
          space = true;
          this.line_char_count--;
          continue;
        }

        if (input_char === "'" || input_char === '"') {
          if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
            input_char += this.get_unformatted(input_char);
            space = true;
          }
        }

        if (input_char === '=') { //no space before =
          space = false;
        }

        if (content.length && content[content.length-1] !== '=' && input_char !== '>'
            && space) { //no space after = or before >
          if (this.line_char_count >= this.max_char) {
            this.print_newline(false, content);
            this.line_char_count = 0;
          }
          else {
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        if (input_char === '<') {
            tag_start = this.pos - 1;
        }
        content.push(input_char); //inserts character at-a-time (or string)
      } while (input_char !== '>');

      var tag_complete = content.join('');
      var tag_index;
      if (tag_complete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
        tag_index = tag_complete.indexOf(' ');
      }
      else { //otherwise go with the tag ending
        tag_index = tag_complete.indexOf('>');
      }
      var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
      if (tag_complete.charAt(tag_complete.length-2) === '/' ||
          this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
        this.tag_type = 'SINGLE';
      }
      else if (tag_check === 'script') { //for later script handling
        this.record_tag(tag_check);
        this.tag_type = 'SCRIPT';
      }
      else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
        this.record_tag(tag_check);
        this.tag_type = 'STYLE';
      }
      else if (this.Utils.in_array(tag_check, unformatted)) { // do not reformat the "unformatted" tags
        var comment = this.get_unformatted('</'+tag_check+'>', tag_complete); //...delegate to get_unformatted function
        content.push(comment);
        // Preserve collapsed whitespace either before or after this tag.
        if (tag_start > 0 && this.Utils.in_array(this.input.charAt(tag_start - 1), this.Utils.whitespace)){
            content.splice(0, 0, this.input.charAt(tag_start - 1));
        }
        tag_end = this.pos - 1;
        if (this.Utils.in_array(this.input.charAt(tag_end + 1), this.Utils.whitespace)){
            content.push(this.input.charAt(tag_end + 1));
        }
        this.tag_type = 'SINGLE';
      }
      else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
        if (tag_check.indexOf('[if') != -1) { //peek for <!--[if conditional comment
          if (tag_complete.indexOf('!IE') != -1) { //this type needs a closing --> so...
            var comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
            content.push(comment);
          }
          this.tag_type = 'START';
        }
        else if (tag_check.indexOf('[endif') != -1) {//peek for <!--[endif end conditional comment
          this.tag_type = 'END';
          this.unindent();
        }
        else if (tag_check.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
          var comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
          content.push(comment);
          this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
        }
        else {
          var comment = this.get_unformatted('-->', tag_complete);
          content.push(comment);
          this.tag_type = 'SINGLE';
        }
      }
      else {
        if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
          this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
          this.tag_type = 'END';
        }
        else { //otherwise it's a start-tag
          this.record_tag(tag_check); //push it on the tag stack
          this.tag_type = 'START';
        }
        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
          this.print_newline(true, this.output);
        }
      }
      return content.join(''); //returns fully formatted tag
    }

    this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety

      if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) != -1) {
        return '';
      }
      var input_char = '';
      var content = '';
      var space = true;
      do {

        if (this.pos >= this.input.length) {
          return content;
        }

        input_char = this.input.charAt(this.pos);
        this.pos++

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (!space) {
            this.line_char_count--;
            continue;
          }
          if (input_char === '\n' || input_char === '\r') {
            content += '\n';
            /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
            for (var i=0; i<this.indent_level; i++) {
              content += this.indent_string;
            }
            space = false; //...and make sure other indentation is erased
            */
            this.line_char_count = 0;
            continue;
          }
        }
        content += input_char;
        this.line_char_count++;
        space = true;


      } while (content.toLowerCase().indexOf(delimiter) == -1);
      return content;
    }

    this.get_token = function () { //initial handler for token-retrieval
      var token;

      if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') { //check if we need to format javascript
       var type = this.last_token.substr(7)
       token = this.get_contents_to(type);
        if (typeof token !== 'string') {
          return token;
        }
        return [token, 'TK_' + type];
      }
      if (this.current_mode === 'CONTENT') {
        token = this.get_content();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          return [token, 'TK_CONTENT'];
        }
      }

      if (this.current_mode === 'TAG') {
        token = this.get_tag();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          var tag_name_type = 'TK_TAG_' + this.tag_type;
          return [token, tag_name_type];
        }
      }
    }

    this.get_full_indent = function (level) {
      level = this.indent_level + level || 0;
      if (level < 1)
        return '';

      return Array(level + 1).join(this.indent_string);
    }


    this.printer = function (js_source, indent_character, indent_size, max_char, brace_style) { //handles input/output and some other printing functions

      this.input = js_source || ''; //gets the input for the Parser
      this.output = [];
      this.indent_character = indent_character;
      this.indent_string = '';
      this.indent_size = indent_size;
      this.brace_style = brace_style;
      this.indent_level = 0;
      this.max_char = max_char;
      this.line_char_count = 0; //count to see if max_char was exceeded

      for (var i=0; i<this.indent_size; i++) {
        this.indent_string += this.indent_character;
      }

      this.print_newline = function (ignore, arr) {
        this.line_char_count = 0;
        if (!arr || !arr.length) {
          return;
        }
        if (!ignore) { //we might want the extra line
          while (this.Utils.in_array(arr[arr.length-1], this.Utils.whitespace)) {
            arr.pop();
          }
        }
        arr.push('\n');
        for (var i=0; i<this.indent_level; i++) {
          arr.push(this.indent_string);
        }
      }

      this.print_token = function (text) {
        this.output.push(text);
      }

      this.indent = function () {
        this.indent_level++;
      }

      this.unindent = function () {
        if (this.indent_level > 0) {
          this.indent_level--;
        }
      }
    }
    return this;
  }

  /*_____________________--------------------_____________________*/

  multi_parser = new Parser(); //wrapping functions Parser
  multi_parser.printer(html_source, indent_character, indent_size, max_char, brace_style); //initialize starting values

  while (true) {
      var t = multi_parser.get_token();
      multi_parser.token_text = t[0];
      multi_parser.token_type = t[1];

    if (multi_parser.token_type === 'TK_EOF') {
      break;
    }

    switch (multi_parser.token_type) {
      case 'TK_TAG_START':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.indent();
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_STYLE':
      case 'TK_TAG_SCRIPT':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_END':
        //Print new line only if the tag has no content and has child
        if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
            var tag_name = multi_parser.token_text.match(/\w+/)[0];
            var tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length -1].match(/<\s*(\w+)/);
            if (tag_extracted_from_last_output === null || tag_extracted_from_last_output[1] !== tag_name)
                multi_parser.print_newline(true, multi_parser.output);
        }
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_SINGLE':
        // Don't add a newline before elements that should remain unformatted.
        var tag_check = multi_parser.token_text.match(/^\s*<([a-z]+)/i);
        if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)){
            multi_parser.print_newline(false, multi_parser.output);
        }
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_CONTENT':
        if (multi_parser.token_text !== '') {
          multi_parser.print_token(multi_parser.token_text);
        }
        multi_parser.current_mode = 'TAG';
        break;
      case 'TK_STYLE':
      case 'TK_SCRIPT':
        if (multi_parser.token_text !== '') {
          multi_parser.output.push('\n');
          var text = multi_parser.token_text;
          if (multi_parser.token_type == 'TK_SCRIPT') {
            var _beautifier = typeof js_beautify == 'function' && js_beautify;
          } else if (multi_parser.token_type == 'TK_STYLE') {
            var _beautifier = typeof css_beautify == 'function' && css_beautify;
          }

          if (options.indent_scripts == "keep") {
            var script_indent_level = 0;
          } else if (options.indent_scripts == "separate") {
            var script_indent_level = -multi_parser.indent_level;
          } else {
            var script_indent_level = 1;
          }

          var indentation = multi_parser.get_full_indent(script_indent_level);
          if (_beautifier) {
            // call the Beautifier if avaliable
            text = _beautifier(text.replace(/^\s*/, indentation), options);
          } else {
            // simply indent the string otherwise
            var white = text.match(/^\s*/)[0];
            var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
            var reindent = multi_parser.get_full_indent(script_indent_level -_level);
            text = text.replace(/^\s*/, indentation)
                   .replace(/\r\n|\r|\n/g, '\n' + reindent)
                   .replace(/\s*$/, '');
          }
          if (text) {
            multi_parser.print_token(text);
            multi_parser.print_newline(true, multi_parser.output);
          }
        }
        multi_parser.current_mode = 'TAG';
        break;
    }
    multi_parser.last_token = multi_parser.token_type;
    multi_parser.last_text = multi_parser.token_text;
  }
  return multi_parser.output.join('');
}

module.exports = {
  prettyPrint: style_html
};
},{}],7:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwnProperty.call(obj, 'constructor');
	var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],5:[function(require,module,exports){
"use strict";

var extend = require("extend");

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
        c == ">" || c == "`" || c == "$" || c == '%' || c == "_" ||
        c == "*" || c == "!" || c == "[" || c == "(" || c == "{" ||
        c == "-" || c == "\"";
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
        if (w.at("\\" + marker))
          w.skip(marker.length + 1);
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


},{"extend":7}]},{},[1])
;