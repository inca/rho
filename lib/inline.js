"use strict";

var defaults = require("./defaults");

/* # Inline compiler

Inline compiler transforms text within blocks by applying
typographic enhancements, escaping unsafe HTML and XML chars,
expanding inline elements syntax, including `em`, `strong`,
`code`, `a`, etc.
*/
var InlineCompiler
  = module.exports
  = function InlineCompiler(options) {

  this.options = (function() {
    var result = {};
    var a = null;
    for (a in defaults)
      result[a] = defaults[a];
    for (a in options)
      result[a] = options[a];
    return result;
  });

  this.buffer = [];

};

