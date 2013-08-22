"use strict";
var assert = require('assert')
  , AsyncCompiler = require('../lib/async')
  , fs = require("fs");

describe('AsyncCompiler', function() {

  // Block tests are prettified to save on whitespace misunderstandings
  var c = new AsyncCompiler();

  describe('in a simple usage scenario', function() {

    it('should process simple blocks asynchronously', function(done) {
      c.render("Hello *world*!\n\nOne more.\n\nAnother one.",
        function(err, html) {
          assert.equal(html.trim(),
            "<p>Hello <strong>world</strong>!</p>\n" +
              "<p>One more.</p>\n" +
              "<p>Another one.</p>");
          done();
        });
    });

  });

  describe('with files I/O', function() {

    var samplesDir = __dirname + "/../samples";
    var samples = fs.readdirSync(samplesDir);

    for (var i in samples) {
      var filename = samples[i];
      if (/\.rho$/.test(filename))
        testFile(filename);
    }

    function testFile(filename) {
      var sample = filename.replace(/\.rho$/, "");
      it('process "' + sample + '"', function(done) {
        fs.readFile(samplesDir + "/" + filename,
          { encoding: 'utf-8'},
          function(err, text) {
            if (err) throw err;
            fs.readFile(samplesDir + "/" + sample + ".html",
              { encoding: 'utf-8' },
              function(err, expectedHtml) {
                if (err) throw err;
                c.render(text, function(err, html) {
                  if (err) throw err;
                  var ah = require('html')
                    .prettyPrint(html, { indent_size: 2 })
                    .trim()
                    .replace(/\r\n|\r/g, "\n");
                  var eh = expectedHtml.trim().replace(/\r\n|\r/g, "\n");
                  assert.equal(ah, eh);
                  done();
                });
              });
          });
      });
    }

  });

});

