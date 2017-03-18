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
