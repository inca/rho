"use strict";

exports.merge = function() {
  var result = {};
  for (var i = 0; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var k in obj)
      result[k] = obj[k];
  }
  return result;
};