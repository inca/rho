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

