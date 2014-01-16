var path = require('path');

module.exports = function(grunt) {
	grunt.initConfig({
		
		pkg: grunt.file.readJSON('abricos.json'),
		
		init: {
            dependencies: '<%= pkg.dependencies %>'
        },		

		clean: {
	        build: ['build/'],
	        release  : ['release/<%= pkg.version %>/']
	    },
	    
        copy: {
            main: {
            	expand: true,
            	cwd: 'src/',
                src: '**',
                dest: 'build/'
            }
        },
        
        bower: {
            install: {
            	options: {
            		targetDir: './build/external'
            	}
            }
        },
        
        compress: {
            release: {
                options: {
                    
                	archive: 'release/<%= pkg.name %>-<%= pkg.version %>.zip'
                },

                expand : true,
                flatten: true,
                dest   : 'abricos/',

                src: [
                    '{LICENSE,README.md}',
                    'build/*'
                ]
            }
        }
    });
	
	grunt.loadTasks('tasks');
	
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower-task');    
    
    grunt.registerTask('default', ['clean:build', 'copy', 'bower:install']);
    grunt.registerTask('release', ['default', 'clean:release', 'compress:release']);
};
