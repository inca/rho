'use strict';

var defaults = require("./defaults")
  , html = require("html")
  , BlockCompiler = require("./block")
  , Walker = require("./walker").Walker;

/* # Asynchronous block compiler

 Unlike `BlockCompiler`, `AsyncCompiler` accepts callback
 which will be invoked once the computation is finished.

 Each block is computed in event queue.
 */
var AsyncCompiler
  = module.exports
  = exports
  = function(options) {

  this.options = require("./extend")({}, defaults.options, options);

};

/* Async compiler operates through `render` which accepts
 `text` to render and callback, which is invoked once
 the rendering is over:

 ```
 var asyncCompiler = new AsyncCompiler();
 asyncCompiler.render(myText, function(err, html) {
 // Do something with rendered HTML
 });
 ```
 */
AsyncCompiler.prototype = {

  BlockCompiler: BlockCompiler,

  render: function(text, done) {
    var blockCompiler = new this.BlockCompiler(this.options, this);
    var walk = new Walker(text);
    this.nextTick(blockCompiler, walk, done);
  },

  nextTick: function(blockCompiler, walk, done) {
    if (walk.hasCurrent()) {
      blockCompiler.emitBlock(walk);
      process.nextTick(this.nextTick.bind(this, blockCompiler, walk, done));
    } else {
      done(null, blockCompiler.outToString());
    }
  }

};


