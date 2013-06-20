"use strict";

/* # Generic character sequence walker

 `Walker` wraps `source` (string or another walker)
 and adds a common cursor, lookahead and other parser functionality.
 */
function Walker(cs) {

  this.source = cs;
  this.position = 0;

  this.length = 0;
  if (cs && cs.length)
    this.length = cs.length;

}

exports.Walker = Walker;

/* ## Character sequence

 We define `length` property along with `charAt(i)`,
 `substring(s, e)` and `toString()`
 to make every walker behave like a string.

 By convention character sequence variables are named `cs` are
 only allowed to use these members.
 */

Walker.prototype.charAt = function(i) {
  return this.source.charAt(i);
};

Walker.prototype.substring = function(s, e) {
  if (typeof(e) == 'undefined')
    e = this.source.length;
  return this.source.substring(s, e);
};

Walker.prototype.toString = function() {
  return this.source.toString();
};

// Index checking, absolute, relative

Walker.prototype.checkIndex = function(i) {
  if (i < 0 || i > this.length)
    throw new Error("ERR_INDEX_OUT_OF_BOUNDS");
};

Walker.prototype.checkRange = function(s, e) {
  if (s > e) {
    var p = s;
    s = e;
    e = p;
  }
  if (s < 0 || s > this.length || e < 0 || e > this.length)
    throw new Error("ERR_RANGE_OUT_OF_BOUNDS");
};

Walker.prototype.absoluteIndex = function(relative) {
  this.checkIndex(relative);
  return relative;
};

Walker.prototype.absolutePosition = function() {
  return this.absoluteIndex(this.position);
};

/* ## Cursors

The `position` property is a simple zero-based index inside
a walker. Many methods make use of it to do the traversal stuff.
*/
Walker.prototype.current = function() {
  return this.charAt(this.position);
};

Walker.prototype.hasCurrent = function() {
  return this.position >= 0 && this.position < this.length;
};

Walker.prototype.hasNext = function() {
  return (this.position + 1) < this.length;
};

Walker.prototype.skip = function(n) {
  if (typeof n == 'undefined')
    n = 1;
  this.position += n;
  return this;
};

Walker.prototype.peek = function() {
  return this.charAt(this.position + 1);
};

Walker.prototype.reset = function() {
  this.position = 0;
  return this;
};

Walker.prototype.startFrom = function(i) {
  this.position = i;
  return this;
};

Walker.prototype.stepBack = function() {
  this.position -= 1;
  return this;
};

Walker.prototype.lookahead = function(walkFn) {
  var oldPos = this.position;
  var result = walkFn(this);
  this.position = oldPos;
  return result;
};

Walker.prototype.exclude = function(s, e) {
  // TODO
};

/* ## Testing characters

Various methods are available to quickly test characters
at current cursor position.
*/
Walker.prototype.at = function(cs) {
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
};

Walker.prototype.atDigit = function() {
  var c = this.current();
  return c >= '0' && c <= '9';
};

// New lines

Walker.prototype.atNewLine = function() {
  return this.at("\r\n") ||
    this.at("\n") || this.at("\r");
};

Walker.prototype.skipNewLine = function() {
  if (this.at("\r\n"))
    this.skip(2);
  else if (this.atNewLine())
    this.skip();
  return this;
};

Walker.prototype.skipNewLines = function() {
  while (this.atNewLine())
    this.skipNewLine();
  return this;
};

// Spaces and tabs

Walker.prototype.atSpace = function() {
  return this.at(" ") || this.at("\t")
};

Walker.prototype.atSpaces = function(count) {
  return this.lookahead(function(w) {
    for (var i = 0; i < count; i++) {
      if (!w.hasCurrent() || !w.at(" "))
        return false;
      w.skip();
    }
    return true;
  });
};

Walker.prototype.skipSpace = function() {
  if (this.atSpace())
    this.skip();
  return this;
};

Walker.prototype.skipSpaces = function() {
  while (this.atSpace())
    this.skip();
  return this;
};

// Whitespaces in general

Walker.prototype.atWhitespace = function() {
  return this.atNewLine() || this.atSpace();
};

Walker.prototype.skipWhitespace = function() {
  var p = this.position;
  this.skipNewLine();
  if (this.position == p)
    this.skipSpace();
  return this;
};

Walker.prototype.skipWhitespaces = function() {
  while(this.atWhitespace())
    this.skip();
  return this;
};

Walker.prototype.skipBlankLines = function() {
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
};

/* # Subsequence walker

`SubWalker` restricts the cursor to the portion of the source character
sequence specified by `start` and `end` index.
*/
function SubWalker(cs, start, end) {

  this.source = cs;

  this.start = start;
  if (typeof(start) == "undefined" || this.start < 0)
    this.start = 0;

  this.end = end;
  if (typeof(end) == "undefined" || this.end > cs.length)
    this.end = cs.length;

  this.length = this.end - this.start;

}

exports.SubWalker = SubWalker;

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
function MultiWalker(regions) {

  if (Array.isArray(regions))
    this.regions = regions;
  else this.regions = [ regions ];

  var l = 0;

  this.regions.forEach(function(r) {
    l += r.length;
  });

  this.length = l;

}

exports.MultiWalker = MultiWalker;

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
  this.regions.forEach(function(r) {
    result += r.toString();
  });
  return result;
};

