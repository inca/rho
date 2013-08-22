"use strict";

var extend = module.exports = function() {
  var target = arguments[0] || {}
    , length = arguments.length;

  if (typeof target != 'object') {
    target = {}
  }

  for (var i = 1; i < length; i++) {
    var aug = arguments[i];
    if (!aug) continue;
    for (var k in aug) {
      var src = target[k];
      if (typeof src == 'object') {
        target[k] = extend(src, aug[k]);
      } else target[k] = aug[k];
    }
  }

  return target;

};