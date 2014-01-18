/*
 * Copyright (c) 2013, Alexander Kuzmin <roosit@abricos.org>
 * Code licensed under the MIT License:
 * https://github.com/abricos/abricos-core/blob/master/LICENSE.md
 */

var TASK = {
    name: 'deploy',
    description: 'Deploy Abricos Platform.'
};

var ROOT = process.cwd();

var path = require('path');
var async = require('async');
var _ = require('lodash');
var command = require('command');

module.exports = function(grunt) {
    grunt.registerTask(TASK.name, TASK.description, function() {
        var dpName = arguments[0] || "default";

        var done = this.async();
        async.series([
            function(callback) {
                exports._setGruntConfig(dpName, callback);
            },
            function(callback) {
                exports._initDependencies(dpName, callback);
            }],
                function(err) {
                    if (err) {
                        done(false);
                    }
                    else {
                        done();
                    }
                }
        );
    });

    exports._setGruntConfig = function(dpName, callback) {
        dpName = dpName || "default";

        var dpDir = path.join(ROOT, "deploy", dpName);
        var dpCfgFile = path.join(dpDir, "deploy.json");

        if (!grunt.file.exists(dpCfgFile)) {
            grunt.fail.fatal("Deploy config file (" + dpCfgFile + ") not found");
        }

        var dpCfgDef = {
            src: "src",
            dest: "www",
            dependencies: {}
        };
        var dpCfgFile = grunt.file.readJSON(dpCfgFile);
        var dpCfgGrunt = grunt.config([TASK.name, dpName]) || {};

        var dpCfg = _.assign(dpCfgDef, dpCfgFile);
        dpCfg = _.assign(dpCfgGrunt, dpCfg);

        grunt.config([TASK.name, dpName], dpCfg);

        callback();
    };

    exports._initDependencies = function(dpName, callback) {

        var dpDir = path.join(ROOT, "deploy", dpName);
        var dpCfg = grunt.config([TASK.name, dpName]);

        var dependencyName;
        var stack = [];

        for (dependencyName in dpCfg.dependencies) {
            var dp = dpCfg.dependencies[dependencyName];

            dp._folder = path.join(dpDir, dp.folder);

            // Wraps in a closure to hold dependency reference
            (function(dp) {
                if (grunt.file.exists(dp._folder)) {
                    stack.push(function(depCallback) {
                        exports._updateDependency(dp, depCallback);
                    });
                }
                else {
                    stack.push(function(depCallback) {
                        exports._cloneDependency(dp, depCallback);
                    });
                }
            })(dp);
        }

        async.parallel(stack, function() {
            callback();
        });
    };

    exports._updateDependency = function(dependency, depCallback) {
        grunt.log.ok('Updating: ' + dependency.repo +
                ' [' + dependency.version + ']');

        async.series([
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['fetch', dependency.repo, dependency.version, '--progress'], {
                            cwd: dependency._folder
                        })
                        .then(function() {
                            mainCallback();
                        });
            },
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['checkout', dependency.version, '-f'], {
                            cwd: dependency._folder
                        })
                        .then(function() {
                            mainCallback();
                        });
            },
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['pull', '--rebase', dependency.repo, dependency.version, '--progress'], {
                            cwd: dependency._folder
                        })
                        .then(function() {
                            mainCallback();
                        });
            }],
                function() {
                    depCallback();
                }
        );
    };

    exports._cloneDependency = function(dependency, depCallback) {
        grunt.log.ok('Cloning: ' + dependency.repo +
                ' [' + dependency.version + ']');

        command.open(ROOT)
                .on('stdout', command.writeTo(process.stdout))
                .on('stderr', command.writeTo(process.stderr))
                .exec('git', ['clone', dependency.repo, '-b', dependency.version, dependency._folder, '--progress'], {
                    cwd: ROOT
                })
                .then(function() {
                    depCallback();
                });
    };
};