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
var fs = require('fs-extra');
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
                exports._deployAbricosCore(deployName, mainCallback);
            },
            function(mainCallback) {
                exports._initDependencies(deployName, mainCallback);
            },
            function(mainCallback) {
                exports._deploySiteSrc(deployName, mainCallback);
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

    exports._getDeployJSONDir = function(deployName) {
        return path.join(ROOT, "deploy", deployName);
    };

    exports._getDeployJSONFile = function(deployName) {
        var dir = exports._getDeployJSONDir(deployName);
        return path.join(dir, "deploy.json");
    };

    exports._getDeploySrcDir = function(deployName) {
        var dir = exports._getDeployJSONDir(deployName);
        var options = grunt.config([TASK.name, deployName]) || {};

        return path.join(dir, options.src);
    };

    exports._getDeployDestDir = function(deployName) {
        var dir = exports._getDeployJSONDir(deployName);
        var options = grunt.config([TASK.name, deployName]) || {};

        return path.join(dir, options.dest);
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

    exports._deployAbricosCore = function(deployName, mainCallback) {
        grunt.log.ok('Deploy Abricos core');

        var src = path.join(ROOT, 'build');
        var dest = exports._getDeployDestDir(deployName);

        fs.copy(src, dest, function(err) {
            if (err) {
                mainCallback(err);
            }
            else {
                mainCallback();
            }
        });
    };

    exports._deploySiteSrc = function(deployName, mainCallback) {
        grunt.log.ok('Deploy Site source');

        var src = exports._getDeploySrcDir(deployName);
        var dest = exports._getDeployDestDir(deployName);

        fs.copy(src, dest, function(err) {
            if (err) {
                mainCallback(err);
            }
            else {
                mainCallback();
            }
        });
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

            depend.deployName = deployName;
            depend.dependName = dependName;

            // Wraps in a closure to hold dependency reference
            (function(depend) {
                stack.push(function(depCallback) {
                    exports._deployDependency(depend, depCallback);
                });
            })(depend);
        }

        async.parallel(stack, function() {
            mainCallback();
        });
    };

    exports._updateDependency = function(depend, depCallback) {

        if (!depend.update) {
            depCallback();
            return;
        }

        grunt.log.ok('Updating: ' + depend.repo + ' [' + depend.version + ']');

        async.series([
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['fetch', depend.repo, depend.version, '--progress'], {
                            cwd: depend._folder
                        })
                        .then(function() {
                            mainCallback();
                        });
            },
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['checkout', depend.version, '-f'], {
                            cwd: depend._folder
                        })
                        .then(function() {
                            mainCallback();
                        });
            },
            function(mainCallback) {
                command.open(ROOT)
                        .on('stdout', command.writeTo(process.stdout))
                        .on('stderr', command.writeTo(process.stderr))
                        .exec('git', ['pull', '--rebase', depend.repo, depend.version, '--progress'], {
                            cwd: depend._folder
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

    exports._cloneDependency = function(depend, depCallback) {
        grunt.log.ok('Cloning: ' + depend.repo +
                ' [' + depend.version + ']');

        command.open(ROOT)
                .on('stdout', command.writeTo(process.stdout))
                .on('stderr', command.writeTo(process.stderr))
                .exec('git', ['clone', depend.repo, '-b', depend.version, depend._folder, '--progress'], {
                    cwd: ROOT
                })
                .then(function() {
                    depCallback();
                });
    };

    exports._buildAbricosModuleDependency = function(depend, mainCallback) {
        grunt.log.ok('Build Abricos module: ' + depend.dependName);

        var cwd = depend._folder;
        var src = path.join(cwd, 'src');
        var dest = path.join(cwd, 'build', 'modules', depend.name);
        
        fs.copy(src, dest, function(err) {
            if (err) {
                mainCallback(err);
            }
            else {
                mainCallback();
            }
        });
    };

    exports._deployAbricosModuleDependency = function(depend, mainCallback) {
        grunt.log.ok('Deploy Abricos module: ' + depend.dependName);

        var src = path.join(depend._folder, 'build');
        var dest = exports._getDeployDestDir(depend.deployName);

        fs.copy(src, dest, function(err) {
            if (err) {
                mainCallback(err);
            }
            else {
                mainCallback();
            }
        });
    };

    exports._deployDependency = function(depend, deployCallback) {
        var stack = [];

        stack.push(function(depCallback) {
            if (grunt.file.exists(depend._folder)) {
                exports._updateDependency(depend, depCallback);
            } else {
                exports._cloneDependency(depend, depCallback);
            }
        });

        switch (depend.type) {
            case "module":
                stack.push(function(depCallback) {
                    exports._buildAbricosModuleDependency(depend, depCallback);
                });
                stack.push(function(depCallback) {
                    exports._deployAbricosModuleDependency(depend, depCallback);
                });
                break;
            case "template":
                break;
        }

        async.series(stack,
                function() {
                    deployCallback();
                }
        );
    };
};