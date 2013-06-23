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
  }

};