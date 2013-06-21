"use strict";

var defaults = require("./defaults")
  , utils = require("./utils")
  , Walker = require("./walker").Walker;

/* # Inline compiler

Inline compiler transforms text within blocks by applying
typographic enhancements, escaping unsafe HTML and XML chars,
expanding inline elements syntax, including `em`, `strong`,
`code`, `a`, etc.
*/
var InlineCompiler
  = module.exports
  = function InlineCompiler(options, macros) {

  this.out = "";

  this.options = utils.merge(defaults.options, options);

  this.macros = utils.merge(defaults.macros, macros);

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

  compile: function(input) {
    this.out = "";
    var walk = new Walker(input);
    while(walk.hasCurrent())
      this.emitNormal(walk);
    return this.out;
  },

  /* ## Compiler contexts

  Inline compiler operates in following contexts:

    * normal — all tokens are processed as in specification;
    * code — only backslash escapes and HTML chars are processed;
  */
  emitNormal: function(walk) {
    // Backslash escapes
    if (this.tryBackslashEscape(walk)) return;
    // Macros (typographics inside)
    if (this.tryMacros(walk)) return;
    // HTML chars
    if (this.tryAmp(walk)) return;
    /*
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
    if (this.tryFragment(walk)) return;
    if (this.tryMedia(walk)) return;
    if (this.tryLink(walk)) return;
    */
    // General character
    this.emitChar(walk);
  },

  /* Chars are spit "as is", only XML-invalid chars are filtered. */
  emitChar: function(walk) {
    var c = walk.current();
    if (!(this.options.stripInvalidXmlChars && isInvalidXmlChar(c)))
      this.out += c;
    walk.skip();
  },

  /* Reserved char are backslash-escaped. */
  tryBackslashEscape: function(walk) {
    if (!walk.at("\\"))
      return false;
    // Assuming backslash
    walk.skip();
    if (walk.atSome(backslashChars)) {
      this.out += walk.current();
      walk.skip();
    } else {
      this.out += "\\";
    }
    return true;
  },

  /* Macrodefinitions are supplied in `options`. */

  tryMacros: function(walk) {
    // TODO
    return false;
  },

  /* &amp; */

  tryAmp: function(walk) {
    if (!walk.at("&")) return false;
    // Assuming entity reference
    var end = walk.lookahead(function(w) {
      // Skipping &
      walk.skip();
      var allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (walk.atSome(["#x", "#X"])) {
        allowedChars = "0123456789abcdefABCDEF";
        walk.skip(2);
      }
      else if (walk.at("#")) {
        allowedChars = "0123456789";
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
        } else if (w.atSome(allowedChars)) {
          w.skip();
        } else return null;
      }
      return null;
    });
    // Entity reference is emitted as is
    if (end !== null) {
      this.out += walk.emitUntil(end);
    } else {
      // Escaping as &amp;
      this.out += "&amp;";
      walk.skip();
    }
    return true;
  }


};

/* ## Regexes and constants */

var backslashChars = [
  '.', '+', '*', '[', ']',
  '(', ')', '`', '{', '}',
  '_', '!', '-', '|', '~', '\\'
];

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
