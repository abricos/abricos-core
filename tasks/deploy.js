/*
 * Copyright (c) 2013, Alexander Kuzmin <roosit@abricos.org>
 * Code licensed under the MIT License:
 * https://github.com/abricos/abricos-core/blob/master/LICENSE.md
 */

"use strict";

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

var path = require('path');
var async = require('async');
var fs = require('fs-extra');
var _ = require('lodash');

var chalk = require('chalk');
var exec = require('child_process').exec;
var util = require('util')

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
        var cwd = grunt.config([TASK.name, deployName, "cwd"]);
        
        if (!cwd){
            cwd = path.join(ROOT, "deploy", deployName);
        }

        return cwd;
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

        var options = grunt.option.flags();

        options.forEach(function(option) {
            var key;
            var value;
            var valueIndex;

            // Normalize option
            option = option.replace(/^--(no-)?/, '');

            valueIndex = option.lastIndexOf('=');

            // String parameter
            if (valueIndex !== -1) {
                key = option.substring(0, valueIndex);
                value = option.substring(valueIndex + 1);
            }
            // Boolean parameter
            else {
                key = option;
                value = grunt.option(key);
            }

            if (key === "cwd") {
                grunt.config([TASK.name, deployName, "cwd"],
                        path.join(ROOT, value, deployName));
            }
            if (key == "depend"){
                grunt.config([TASK.name, deployName, "depend"], value);
            }
        });

        // deploy.json
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
        var onlyDependName = grunt.config([TASK.name, deployName, "depend"]);
        
        if (onlyDependName){
            mainCallback();
            return;
        }
        
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
        var src = exports._getDeploySrcDir(deployName);
        var dest = exports._getDeployDestDir(deployName);
        
        if (!grunt.file.exists(src)) {
            mainCallback();
            return;
        }
        
        grunt.log.ok('Deploy Site source');

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

        var onlyDependName = grunt.config([TASK.name, deployName, "depend"]);

        var deployJSONDir = exports._getDeployJSONDir(deployName);
        var deployOptions = grunt.config([TASK.name, deployName]);
        var deployComponentsDir = path.join(deployJSONDir, deployOptions.deploy_components);

        var dependName;
        var stack = [];

        for (dependName in deployOptions.dependencies) {

            if (onlyDependName && onlyDependName !== dependName){
                continue;
            }

            var depend = deployOptions.dependencies[dependName];

            // Set default value if empty
            depend = _.assign({
                update: true,
                name: dependName
            }, depend);
            
            depend.info = {
                // Absolute directory for dependency project
                folder: path.join(deployComponentsDir, dependName),
                
                // True - there is a change
                isChanges: false
            };

            depend.deployName = deployName;
            depend.dependName = dependName;

            // Wraps in a closure to hold dependency reference
            (function(depend) {
                stack.push(function(depCallback) {
                    exports._deployDependency(depend, depCallback);
                });
            })(depend);
        }

        async.parallelLimit(stack, 5, function() {
            mainCallback();
        });
    };
    
    exports._shell = function(cmd, args, options, callback){
        if (util.isArray(args)){
            args = args.join(' ');
        }
        cmd += ' ' + args;
        exec(cmd, options, function(err, stdout, stderr){
            if (err){
                grunt.log.error(stderr);
            }
            else {
                grunt.log.writeln(stderr);
            }
            callback(err, stdout, stderr);
        });
    };
    
    exports._checkStatusDependency = function(depend, depCallback) {
        exports._shell("git", ['status', '-s'], {
                cwd: depend.info.folder
            }, function(err, stdout, stderr){
                if (stdout.trim().length > 0){
                    depend.info.isChanges = true;
                }
                depCallback();
            });
    };

    exports._updateDependency = function(depend, depCallback) {
        grunt.log.ok('Updating: ' + depend.repo + ' [' + depend.version + ']');

        async.series([
            function(mainCallback) {
                exports._shell("git", ['fetch', depend.repo, depend.version, '--progress'], {
                    cwd: depend.info.folder
                }, function(){
                    mainCallback();
                });
            },
            function(mainCallback) {
                exports._shell("git", ['checkout', depend.version, '-f'], {
                    cwd: depend.info.folder
                }, function(){
                    mainCallback();
                });
            },
            function(mainCallback) {
                exports._shell("git", ['pull', '--rebase', depend.repo, depend.version, '--progress'], {
                    cwd: depend.info.folder
                }, function(){
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

        exports._shell("git", ['clone', depend.repo, '-b', depend.version, depend.info.folder, '--progress'], {
            cwd: ROOT
        }, function(){
            depCallback();
        });
    };

    exports._buildAbricosModuleDependency = function(depend, mainCallback) {
        grunt.log.ok('Build Abricos module: ' + depend.dependName);

        var cwd = depend.info.folder;
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

        var src = path.join(depend.info.folder, 'build');
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

    exports._buildAbricosTemplateDependency = function(depend, mainCallback) {
        grunt.log.ok('Build Abricos template: ' + depend.dependName);

        var cwd = depend.info.folder;
        var src = path.join(cwd, 'src');
        var dest = path.join(cwd, 'build', 'tt', depend.name);

        fs.copy(src, dest, function(err) {
            if (err) {
                mainCallback(err);
            }
            else {
                mainCallback();
            }
        });
    };

    exports._deployAbricosTemplateDependency = function(depend, mainCallback) {
        grunt.log.ok('Deploy Abricos template: ' + depend.dependName);

        var src = path.join(depend.info.folder, 'build');
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
            if (grunt.file.exists(depend.info.folder)) {
                exports._checkStatusDependency(depend, function(){
                    if (depend.info.isChanges) {
                        grunt.log.ok('There are local changes: ' + depend.repo + ' [' + depend.version + ']');
                        depCallback();
                    }else{
                        exports._updateDependency(depend, depCallback);
                    }
                });
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
                stack.push(function(depCallback) {
                    exports._buildAbricosTemplateDependency(depend, depCallback);
                });
                stack.push(function(depCallback) {
                    exports._deployAbricosTemplateDependency(depend, depCallback);
                });
                break;
        }

        async.series(stack,
                function() {
                    deployCallback();
                }
        );
    };
};