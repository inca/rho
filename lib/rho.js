'use strict';

var defaults = require("./defaults")
  , BlockCompiler = require("./block")
  , InlineCompiler = require("./inline")
  , AsyncCompiler = require("./async");

/* # Rho module

To minimize usage efforts Rho can be configured globally for your application.

```
// Require the module first
var rho = require("rho");

// Configure it as you see fit
rho.options.pretty = true;

// This is the text we will be rendering
var text = "Hello\n\n*World*!";

// Asynchronous API (preferable in web applications)
rho.render(text, function(err, html) {
  // html now contains "<p>Hello</p><p><strong>World</strong>!</p>"
});

// Synchronous API (still fast, but cause a bit of blocking)
var html = rho.toHtml(text);
// html now contains "<p>Hello</p><p><strong>World</strong>!</p>"

// Inline compilation, synchronous only
 var inline = rho.toInlineHtml(text);
 // inline now contains "Hello\n\n<strong>World</strong>!"
```

If you intent to use different configurations in a single application,
stick with either `BlockCompiler`, `InlineCompiler` or `AsyncCompiler`.
*/
module.exports = exports = {

  options: defaults.options,

  toHtml: function(text) {
    return new BlockCompiler(this.options).toHtml(text);
  },

  toInlineHtml: function(text) {
    return new InlineCompiler(this.options).toHtml(text);
  },

  render: function(text, done) {
    new AsyncCompiler(this.options).render(text, done);
  }

};
