define(function(require, exports, module) {

  exports.options = require("./defaults");

  exports.BlockCompiler = require("./block");

  exports.InlineCompiler = require("./inline");

  exports.toHtml = function(text) {
    return new rho.BlockCompiler(this.options).toHtml(text);
  };

  exports.toInlineHtml = function(text) {
    return new rho.InlineCompiler(this.options).toHtml(text);
  }

});