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
                    {expand: true, cwd: 'build_temp/', src: 'pure/**', dest: 'build/vendor/'},
                    // Copy Alloy-ui 
                    {expand: true, cwd: 'build_temp/alloyui/build/', src: '**', dest: 'build/vendor/alloyui/'},
                    {expand: true, cwd: 'build_temp/alloyui/', src: '*.md', dest: 'build/vendor/alloyui/'},
                    // YUI3 Gallery (by filter)
                    {
                        expand: true, cwd: 'build_temp/yui3gallery/build/', 
                        src: [
                            'gallery-sm-*/**',
                        ], 
                        dest: 'build/vendor/yui3gallery/'
                    },
                    // Copy YUI3-2in3
                    {expand: true, cwd: 'build_temp/yui2in3/build/', src: '**', dest: 'build/vendor/yui2in3/'},
                    {expand: true, cwd: 'build_temp/yui2in3/', src: 'README.textile', dest: 'build/vendor/yui2in3/'},
                    // Copy Jevix
                    {expand: true, cwd: 'build_temp/jevix/', src: ['jevix.class.php', 'readme.mediawiki'], dest: 'build/vendor/jevix'},
                    // Copy abricos.js files
                    {
                        expand: true,
                        flatten: true,
                        cwd: path.join(ROOT, '<%= pkg.dependencies["abricos.js"].folder %>'),
                        src: ['build/*', 'README.md', 'LICENSE'],
                        dest: 'build/vendor/abricos.js/'
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
