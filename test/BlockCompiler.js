"use strict";
var assert = require('assert')
  , BlockCompiler = require('../lib/block')
  , fs = require("fs");

describe('BlockCompiler', function() {

  describe('with default configuration', function() {

    // Block tests are prettified to save on whitespace misunderstandings
    var c = new BlockCompiler();

    var samplesDir = __dirname + "/../samples";
    var samples = fs.readdirSync(samplesDir);

    for (var i in samples) {
      var filename = samples[i];
      if (/\.rho$/.test(filename))
        testFile(filename);
    }

    function testFile(filename) {
      var sample = filename.replace(/\.rho$/, "");
      it('process "' + sample + '"', function() {
        var text = fs.readFileSync(
          samplesDir + "/" + filename, { encoding: 'utf-8' });
        var expectedHtml = fs.readFileSync(
          samplesDir + "/" + sample + ".html",
          { encoding: 'utf-8'}).trim().replace(/\r\n|\r/g, "\n");
        var result = c.toHtml(text);
        var actualHtml = require('html')
          .prettyPrint(result, { indent_size: 2 })
          .trim()
          .replace(/\r\n|\r/g, "\n");
        assert.equal(actualHtml, expectedHtml);
      });
    }

  });

});
