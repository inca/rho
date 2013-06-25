"use strict";

exports.options = {

  resolveLink: function(id) {
    return null;
  },

  resolveImage: function(id) {
    return null;
  },

  sourceIndices: false,

  stripInvalidXmlChars: true

};

exports.macros = {

  // Typographic enhancements

  "typo.mdash": {
    match: '--',
    emit: "&mdash;"
  },

  "typo.reg": {
    match: ['(r)', '(R)'],
    emit: '&reg;'
  },

  "typo.copy": {
    match: ['(c)', '(C)'],
    emit: '&copy;'
  },

  "typo.tm": {
    match: ['(tm)', '(TM)'],
    emit: '&trade;'
  },

  "typo.hellip": {
    match: '...',
    emit: '&hellip;'
  },

  "typo.larr": {
    match: ['&lt;-', '<-'],
    emit: '&larr;'
  },

  "typo.rarr": {
    match: ['-&gt;', '->'],
    emit: '&rarr;'
  },

  "typo.quote": {
    match: "\"",
    emit: function(walk, sym) {
      walk.skip(sym.length);
      var lastChar = this.out.charAt(this.out.length - 1);
      if (lastChar == "" || /\s/.test(lastChar))
        this.out += "&ldquo;";
      else this.out += "&rdquo;";
    }
  }

};