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
            release: ['release/<%= pkg.version %>/']
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
                files: [
                    // Copy Abricos Core
                    {expand: true, cwd: 'src/', src: '**', dest: 'build/'},
                    
                    // Copy PureCSS
                    {expand: true, cwd: 'build_temp/', src: 'pure/**', dest: 'build/external/'}, 
                    
                    // Copy Alloy-ui 
                    {expand: true, cwd: 'build_temp/alloyui/build/', src: '**', dest: 'build/external/alloyui/'}, 
                    {expand: true, cwd: 'build_temp/alloyui/', src: '*.md', dest: 'build/external/alloyui/'}, 
                    
                    // Copy Jevix
                    {expand: true, cwd: 'build_temp/jevix/', src: ['jevix.class.php', 'readme.mediawiki'], dest: 'build/external/jevix'}, 
                    
                    // Copy abricos.js files
                    {
                        expand: true,
                        flatten: true,
                        cwd: path.join(ROOT, '<%= pkg.dependencies["abricos.js"].folder %>'),
                        src: ['build/*', 'README.md', 'LICENSE'],
                        dest: 'build/external/abricos.js/'
                    }
                ]
            }
        },
        compress: {
            release: {
                options: {
                    archive: 'release/<%= pkg.name %>-<%= pkg.version %>.zip'
                },
                expand: true,
                flatten: true,
                dest: 'abricos/',
                src: [
                    '{LICENSE,README.md}',
                    'build/*'
                ]
            }
        },
        subgrunt: {
            abricosjs: {
                '../abricos.js': ['default']
            }
        }
    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-subgrunt');

    grunt.registerTask('default', ['clean:build', 'copy']);
    grunt.registerTask('init', ['depends-init', 'subgrunt:abricosjs', 'bower:install']);
    grunt.registerTask('release', ['default', 'clean:release', 'compress:release']);
};
