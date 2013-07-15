module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: ['Gruntfile.js', 'lib/*.js', 'test/*.js']
    },

    browserify: {
      basic: {
        src: ['lib/browser.js'],
        dest: 'build/rho-<%=pkg.version%>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! Rho v.<%=pkg.version%> by <%=pkg.author%> */\n'
      },
      build: {
        src: 'build/rho-<%=pkg.version%>.js',
        dest: 'build/rho-<%=pkg.version%>.min.js'
      }
    },

  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['browserify', 'uglify']);

};