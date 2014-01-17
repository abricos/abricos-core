var path = require('path');

var ROOT = process.cwd();

module.exports = function(grunt) {
	grunt.initConfig({
		
		pkg: grunt.file.readJSON('abricos.json'),
		
		init: {
            dependencies: '<%= pkg.dependencies %>'
        },

		clean: {
	        build: ['build/', 'build/temp/'],
	        release  : ['release/<%= pkg.version %>/']
		},
	    
        bower: {
            install: {
            	options: {
            		targetDir: './build_temp'
            	}
            }
        },
        
        copy: {
            main: {
	        	files: [{
	        	    expand: true,
            	    cwd: 'src/',
            	    src: '**',
            	    dest: 'build/'
	        	},{
	        	    expand: true,
            	    cwd: 'build_temp/',
            	    src: 'pure/**',
            	    dest: 'build/external/'
	        	},{
	        	    expand: true,
            	    cwd: 'build_temp/alloyui/',
            	    src: ['build/**', '*.md'],
            	    dest: 'build/external/alloyui/'
	        	},{
	        		expand: false,
	        		src: path.join(ROOT, '<%= pkg.dependencies["abricos.js"].folder %>', 'src/abricos.js'),
	        		dest: 'build/external/abricos.js/abricos.js'
	        	}]
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
    
    grunt.registerTask('default', ['clean:build', 'bower:install', 'copy']);
    grunt.registerTask('release', ['default', 'clean:release', 'compress:release']);
};
