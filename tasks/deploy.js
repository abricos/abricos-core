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
var DEPLOYOPTDEF = {
    src: "src",
    dest: "www",
    deploy_components: "../../deploy_components/",
    dependencies: {}
};

var command = require('command');
var path = require('path');
var async = require('async');
var _ = require('lodash');

module.exports = function(grunt) {
    grunt.registerTask(TASK.name, TASK.description, function() {
        var deployName = arguments[0] || "default";
        var done = this.async();

        async.series([
            function(mainCallback) {
                exports._setGruntConfig(deployName, mainCallback);
            },
            function(mainCallback) {
                exports._initDependencies(deployName, mainCallback);
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
    
    exports._getDeployJSONDir = function(deployName){
        return path.join(ROOT, "deploy", deployName);
    };

    exports._getDeployJSONFile = function(deployName){
        var deployJSONDir = exports._getDeployJSONDir(deployName);
        return path.join(deployJSONDir, "deploy.json");
    };

    exports._setGruntConfig = function(deployName, mainCallback) {
        deployName = deployName || "default";

        var deployJSONFile = exports._getDeployJSONFile(deployName);

        if (!grunt.file.exists(deployJSONFile)) {
            grunt.fail.fatal("Deploy config file (" + deployJSONFile + ") not found");
        }

        var deployFileOptions = grunt.file.readJSON(deployJSONFile);
        var deployGruntOptions = grunt.config([TASK.name, deployName]) || {};

        var deployOptions = _.assign(
                DEPLOYOPTDEF,
                _.assign(deployGruntOptions, deployFileOptions)
                );

        // Set deploy options in 
        grunt.config([TASK.name, deployName], deployOptions);

        mainCallback();
    };

    exports._initDependencies = function(deployName, mainCallback) {

        var deployJSONDir = exports._getDeployJSONDir(deployName);
        var deployOptions = grunt.config([TASK.name, deployName]);
        var deployComponentsDir = path.join(deployJSONDir, deployOptions.deploy_components);

        var dependName;
        var stack = [];

        for (dependName in deployOptions.dependencies) {
            var depend = deployOptions.dependencies[dependName];

            // Set default value if empty
            depend = _.assign({
                update: true,
                name: dependName
            }, depend);
            
            // Absolute directory for dependency project
            depend._folder = path.join(deployComponentsDir, dependName);

            // Wraps in a closure to hold dependency reference
            (function(depend) {
                if (grunt.file.exists(depend._folder)) {
                    if (depend.update) {
                        stack.push(function(depCallback) {
                            exports._updateDependency(depend, depCallback);
                        });
                    }
                }
                else {
                    stack.push(function(depCallback) {
                        exports._cloneDependency(depend, depCallback);
                    });
                }
            })(depend);
        }

        async.parallel(stack, function() {
            mainCallback();
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