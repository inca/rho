var fs = require("fs")
  , rho = require("./lib/rho");

var texts = {
  src: function(filename) {
    return fs.readFileSync(filename, { encoding: 'utf-8' });
  },
  html: function(filename) {
    return rho.toHtml(texts.src(filename));
  }
};

module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({

    pkg: pkg,

    browserify: {
      basic: {
        src: ['lib/browser.js'],
        dest: 'build/rho.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! Rho v.<%=pkg.version%> by <%=pkg.author%> */\n'
      },
      build: {
        src: 'build/rho.js',
        dest: 'build/rho.min.js'
      }
    },

    jade: {
      compile: {
        options: {
          pretty: true,
          data: {
            texts: texts,
            pkg: pkg
          }
        },
        files: {
          "index.html": "pages/index.jade",
          "love.html": "pages/love.jade",
          "thankyou.html": "pages/thankyou.jade"
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('default', ['browserify', 'uglify', 'jade']);

};
