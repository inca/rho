"use strict";

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

  /* ## Index checking, absolute, relative */

  // throws an error if `i` is beyond the range of current walker
  checkIndex: function(i) {
    if (i < 0 || i > this.length)
      throw new Error("ERR_INDEX_OUT_OF_BOUNDS");
  },

  // throws an error if the range `[s, e)` intersects the
  // boundaries of current walker
  checkRange: function(s, e) {
    if (s > e) {
      var p = s;
      s = e;
      e = p;
    }
    if (s < 0 || s > this.length || e < 0 || e > this.length)
      throw new Error("ERR_RANGE_OUT_OF_BOUNDS");
  },

  // resolves an index corresponding to `relative` from
  // underlying `source`
  absoluteIndex: function(relative) {
    this.checkIndex(relative);
    return relative;
  },

  /* ## Subregioning and exclusion

   The `exclude` method returns another walker based off the current one,
   cutting away a portion of text.
   */
  exclude: function(s, e) {
    this.checkRange(s, e);
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

  // rewinds `position` by 1
  stepBack: function() {
    this.position -= 1;
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
    var result = "";
    while(this.position < i) {
      result += this.current();
      this.skip();
    }
    return result;
  },

  // scans forward, searching for `marker`, respecting backslashes,
  // returns the index or `null` if marker not found
  indexOf: function(marker) {
    return this.lookahead(function(w) {
      var found = false;
      while (!found && w.hasCurrent()) {
        if (w.at(marker))
          found = true;
        else if (w.at("\\" + marker))
          w.skip(marker.length + 1);
        else w.skip();
      }
      return found ? w.position + marker.length : null;
    });
  },

  /* ## Testing characters

   Various methods are available to quickly test characters
   at current cursor position.
   */

  // tests if cursor looks at specified `cs`
  at: function(cs) {
    var success = true;
    var i = 0;
    while (success && i < cs.length) {
      if (!this.hasCurrent() || this.current() != cs.charAt(i))
        success = false;
      else {
        i += 1;
        this.skip();
      }
    }
    // recover cursor position
    this.position = this.position - i;
    return success;
  },

  // tests if current char is in specified `arr`
  atSome: function(arr) {
    for (var i = 0; i < arr.length; i++) {
      if (this.at(arr[i]))
        return true;
    }
    return false;
  },

  // tests if cursor looks at digit
  atDigit: function() {
    var c = this.current();
    return c >= '0' && c <= '9';
  },

  // tests if cursor looks at latin letter
  atLatin: function() {
    var c = this.current();
    return c >= 'A' && c <= 'z';
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
    while(!finish) {
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

SubWalker.prototype = new Walker;

SubWalker.prototype.absoluteIndex = function(relative) {
  this.checkIndex(relative);
  var idx = this.start + relative;
  if (typeof(this.source.absoluteIndex) == "function")
    return this.source.absoluteIndex(idx);
  else return idx;
};

SubWalker.prototype.charAt = function(i) {
  this.checkIndex(i);
  return this.source.charAt(this.start + i);
};

SubWalker.prototype.substring = function(s, e) {
  this.checkRange(s, e);
  if (typeof(e) == 'undefined')
    e = this.length;
  return this.source.substring(this.start + s, this.start + e);
};

SubWalker.prototype.toString = function() {
  return this.source.substring(this.start, this.end);
};

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

};

MultiWalker.prototype = new Walker;

MultiWalker.prototype.absoluteIndex = function(relative) {
  this.checkIndex(relative);
  if (this.regions.length == 0)
    return -1;
  var i = 0;
  var idx = relative;
  while (idx >= this.regions[i].length) {
    idx -= this.regions[i].length;
    i += 1;
  }
  var r = this.regions[i];
  if (typeof(r.absoluteIndex) == "function")
    return r.absoluteIndex(idx);
  else return idx;
};

MultiWalker.prototype.charAt = function(index) {
  if (this.regions.length == 0)
    return "";
  this.checkIndex(index);
  var i = 0;
  var idx = index;
  while (idx >= this.regions[i].length) {
    idx -= this.regions[i].length;
    i += 1;
  }
  return this.regions[i].charAt(idx);
};

MultiWalker.prototype.substring = function(s, e) {
  if (this.regions.length == 0)
    return "";
  this.checkRange(s, e);
  if (s == e) return "";
  var buffer = [];
  var l = e - s;
  var o = s;
  var i = 0;
  // find start region
  while (o >= this.regions[i].length) {
    o -= this.regions[i].length;
    i += 1;
  }
  // append start and middle regions, if any
  while (i < this.regions.length && (o + l) >= this.regions[i].length) {
    var w = this.regions[i];
    if (o > 0)
      w = w.substring(o);
    buffer.push(w);
    l -= w.length;
    o = 0;
    i += 1;
  }
  // append end region, if any
  if (l > 0)
    buffer.push(this.regions[i].substring(o, o + l));
  if (buffer.length == 0) return "";
  else if (buffer.length == 1) return buffer[0];
  else return new MultiWalker(buffer).toString();
};

MultiWalker.prototype.toString = function() {
  var result = "";
  for (var i = 0; i < this.regions.length; i++)
    result += this.regions[i].toString();
  return result;
};

