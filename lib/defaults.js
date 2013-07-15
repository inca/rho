"use strict";

exports.options = {

  resolveLink: function(id) {
    return null;
  },

  resolveImage: function(id) {
    return null;
  },

  stripInvalidXmlChars: true,

  typographics: {

    enabled: true,

    mdash: "&mdash;",
    copy: "&copy;",
    reg: "&reg;",
    trade: "&trade;",
    larr: "&larr;",
    rarr: "&rarr;",
    ldquo: "&ldquo;",
    rdquo: "&rdquo;"

  }

};