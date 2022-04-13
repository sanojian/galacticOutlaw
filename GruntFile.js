module.exports = function(grunt) {

	// Load Grunt tasks declared in the package.json file
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Project configuration.
	grunt.initConfig({

		watch: {
			scripts: {
					files: [
							'*.js'
					],
					tasks: []
			},
			pages: {
				files: [
						'src/html/*.*'
				],
				tasks: ['copy:html']
			}
		},
		'http-server': {
			dev: {
				root: './',
				port: 3118,
				runInBackground: true
			}
		},
		jshint: {
			options: {
				esversion: 8,
				evil: true
			},
			all: ['src/js/**/*.js', '!src/js/lib/**.*js']
		},
		copy: {
      html: {
        src: '*.*',
        dest: 'dist/',
        cwd: 'src/html',
        expand: true
      }
    },
    clean: ['dist/*.html', 'dist/js/'],
		concat: {
			shared: {
				files: {
					'dist/js/index.js': [
						'src/js/main.js',
						'src/js/DEFS.js',
						'src/js/**/*.js'
					]
				}
			},
		}

	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('dev', [
		'watch'
	]);
	//grunt.registerTask('build', ['clean', 'jshint', 'concat', 'copy']);
	grunt.registerTask('default', ['http-server', 'dev']);

};

