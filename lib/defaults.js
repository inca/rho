"use strict";

exports.options = {

  resolveLink: function(id) {
    return null;
  },

  resolveMedia: function(id) {
    return null;
  },

  resolveFragment: function(id) {
    return null;
  },

  sourceIndices: false,

  stripInvalidXmlChars: true,

};

exports.macros = {

  // Typographic enhancements

  "typo.mdash": {
    match: '--',
    out: '&mdash;'
  },

  "typo.reg": {
    match: ['(r)', '(R)'],
    out: '&reg;'
  },

  "typo.copy": {
    match: ['(c)', '(C)'],
    out: '&copy;'
  },

  "typo.tm": {
    match: ['(tm)', '(TM)'],
    out: '&trade;'
  },

  "typo.hellip": {
    match: '...',
    out: '&hellip;'
  },

  "typo.larr": {
    match: ['&lt;-', '<-'],
    out: '&larr;'
  },

  "typo.rarr": {
    match: ['-&gt;', '->'],
    out: '&rarr;'
  }

};