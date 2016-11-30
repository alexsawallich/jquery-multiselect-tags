module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v<%= pkg.version %> by <%= pkg.author %> */\n'
			},
			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		copy: {
			production:	{
				files: [{
					expand: true,
					cwd: 'src/',
					src: ['*'],
					dest: 'dist/'
				}]
			}
		},
		cssmin: {
			targets: {
				files: {
					'dist/<%= pkg.name %>.min.css': ['src/<%= pkg.name %>.css']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.registerTask('default', ['uglify', 'copy', 'cssmin']);
};