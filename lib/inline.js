"use strict";

var defaults = require("./defaults")
  , assert = require("assert")
  , utils = require("./utils")
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
//    if (this.tryFragment(walk)) return;
//    if (this.tryMedia(walk)) return;
//    if (this.tryLink(walk)) return;
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
    for (var k in this.macros) {
      var macro = this.macros[k];
      if (this.tryMacro(macro, walk))
        return true;
    }
    return false;
  },

  tryMacro: function(macro, walk) {
    var match = macro.match;
    if (!match) return false;
    // Try to match either a string or element of an array
    var sym = null;
    if (typeof match == "string") {
      if (walk.at(match))
        sym = match;
    } else if (typeof match.length == "number") {
      for (var i in match) {
        var m = match[i];
        if (walk.at(m)) {
          sym = m;
          break;
        }
      }
    } else return false;
    // See if match succeeded
    if (sym === null)
      return false;
    // Apply macro: either emit a string or apply a function
    if (typeof macro.emit == "function") {
      macro.emit.call(this, walk, sym);
      return true;
    } else if (typeof macro.emit == "string") {
      walk.skip(sym.length);
      this.out += macro.emit;
      return true;
    } else return false;
  },

  /* Ampersands should distinguish entity references. */

  tryAmp: function(walk) {
    if (!walk.at("&")) return false;
    // Assuming entity reference
    var end = walk.lookahead(function(w) {
      // Skipping &
      walk.skip();
      var allowedChars = latinLetters;
      if (walk.atSome(["#x", "#X"])) {
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
        } else if (w.atSome(allowedChars)) {
          w.skip();
        } else return null;
      }
      return null;
    });
    // Entity reference is emitted as is
    if (end !== null) {
      this.out += walk.yieldUntil(end);
    } else {
      // Escaping as &amp;
      this.out += "&amp;";
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
    this.out += "&lt;";
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
    assert(walk.at("<"));
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
    var w = new SubWalker(walk, walk.position, end);
    while(w.hasCurrent())
      this.emitHtmlTag(w);
    walk.startFrom(end);
    return true;
  },

  emitHtmlTag: function(walk) {
    if (this.tryAmp(walk)) return;
    // TODO if (tryLinkAttr(walk)) return;
    this.emitChar(walk);
  },

  /* Some sensitive contexts require only ampersands escape. */

  emitPlain: function(walk) {
    if (this.tryAmp(walk)) return;
    this.emitChar(walk);
  },

  /* The `>` char is straightforward, since unescaped cases
  are already covered by HTML tags. */

  tryGt: function(walk) {
    if (!walk.at(">")) return false;
    this.out += "&gt;";
    walk.skip();
    return true;
  },

  /* There are cases (code spans) when `<` is escaped unconditionally,
  even if it denotes to HTML tag. */

  tryLtEscape: function(walk) {
    if (!walk.at("<")) return false;
    this.out += "&lt;";
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
      this.out += openMarker;
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
      this.out += "<code>";
      while (w.hasCurrent())
        this.emitPlain(w);
      this.out += "</code>";
    });
  },

  /* Regular code spans are processed by escaping amps, lt-gts, resolving
  fragments and respecting backslash escapes. */

  tryCodeSpan: function(walk) {
    return this.tryBracing(walk, '`', '`', function(w) {
      this.out += "<code>";
      while (w.hasCurrent())
        this.emitCode(w);
      this.out += "</code>";
    });
  },

  emitCode: function(walk) {
    if (this.tryBackslashEscape(walk)) return;
    if (this.tryAmp(walk)) return;
    if (this.tryLtEscape(walk)) return;
    if (this.tryGt(walk)) return;
    // TODO if (this.tryFragment(walk)) return;
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
      this.out += marker;
      while(w.hasCurrent())
        this.emitFormula(w);
      this.out += marker;
    });
  },

  emitFormula: function(walk) {
    if (this.tryAmp(walk)) return;
    if (this.tryLtEscape(walk)) return;
    if (this.tryGt(walk)) return;
    // TODO if (this.tryFragment(walk)) return;
    this.emitChar(walk)
  },

  /* Ems and strongs are matched reluctantly up to their closing marker. */

  tryEm: function(walk) {
    return this.tryBracing(walk, '_', '_', function(w) {
      this.out += "<em>";
      while (w.hasCurrent())
        this.emitNormal(w);
      this.out += "</em>";
    });
  },

  tryStrong: function(walk) {
    return this.tryBracing(walk, '*', '*', function(w) {
      this.out += "<strong>";
      while (w.hasCurrent())
        this.emitNormal(w);
      this.out += "</strong>";
    });
  },

  /* Links and media are resolved from supplied `options`. */

  tryHeadlessLink: function(walk) {
    if (!walk.at("[["))
      return false;
    walk.skip(2);
    var end = walk.indexOf("]]");
    // ]] not found, emitting
    if (end === null) {
      this.out += "[[";
      return true
    }
    var id = walk.yieldUntil(end);
    var link = this.options.resolveLink(id);
    if (!link) // Link not found, spitting as is
      this.out += "[[" + id + "]]";
    else this.emitLink(link.title, link);
    walk.skip(2);
    return true;
  },

  emitLink: function(text, link) {
    var href = link.href;
    if (!href)
      href = link.toString();
    this.out += "<a href=\"" + href + "\"";
    if (link.title)
      this.out += " title=\"" + escapeHtml(link.title) + "\"";
    this.out += ">" + text + "</a>";
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
