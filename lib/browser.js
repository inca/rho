/* # Rho for browser */

window.rho = {

  options: require("./defaults"),

  BlockCompiler: require("./block"),

  InlineCompiler: require("./inline"),

  toHtml: function(text) {
    return new rho.BlockCompiler(this.options).toHtml(text);
  },

  toInlineHtml: function(text) {
    return new rho.InlineCompiler(this.options).toHtml(text);
  }

};
