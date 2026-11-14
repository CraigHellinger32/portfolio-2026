/**
 * $ gulp help
 */
module.exports = function(package, plugins){
    const log       = console.log;
    const divider   = '-------------------------------------------------';


    /**
     * Dependencies
     */
    const docs      = require('gulp-showhelp');


    /**
     * Descriptions of Tasks
     *
     * Add any new tasks to this object.
     * Nested objects are automatically outputted, so feel free
     * to add more nested objects (1 level deep max).
     *
     * @type       {Object}
     */
    const tasks = {
        make: {
            'make': 'Installs all dependencies for a project',
            'make clean': 'Removes all dependencies and verifies the node cache'
        },
        init: {
            'gulp init (for prototypes)': 'Prompts for name of project, and updates the directory \'MainSiteProject\'',
            'gulp init (for implementations)': 'Copies templates to src'
        },
        dev: {
            'gulp': 'Runs Orbit in dev mode',
            'gulp --prod': 'Runs Orbit and compiles production assets, continues to watch for changes',
            'gulp build --prod': 'Compiles production ready assets, but doesn\'t watch for changes',
            'gulp watch --prod': 'Similar to \'gulp build --prod\', but doesn\'t do an intial pre-build'

        },
        assets: {
            'gulp icons --prod': 'Compiles production ready icon assets as a singular task'
        },
        misc: {
            'gulp commitCompiled': 'Adds and commits all of the compiled assets in the \'\\dist\' directory',
            'gulp viewPlugins': 'Outputs a list of all installed packages for the project',
            'gulp viewConfig': 'Outputs contents of the \'gulp.config.js\' file',
            'gulp csFix': 'Runs CS-Fixer, only required if making PHP changes',
            'gulp help': 'Runs this help task',
            'gulp removePrototype': 'To remove the html folder when moving to implementation'
        }
    };


    /**
     * Miscellaneous notes to be added the end of output
     *
     * @type       {String}
     */
    const notes = [
        `Use node version ${package.engines.node} for best performance.`,
        'If having problems with running gulp or make, try running \'make clean\' and then re-running \'make\'.',
        'When making changes to be merged into ORBIT dev, ensure they are code reviewed and internally tested. Once ready to merge, tag the version and update the version number of Orbit in \'package.json\'. Don\'t forget to update \'CHANGELOG.md\''
    ];


    /**
     * Iterate through nested object and print output
     *
     * @param      {Function} obj - The object
     */
    const iterateTasks = (obj) => {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object') {
                iterateTasks(obj[key])
            } else {
                docs.showTask(key, obj[key]);
            }
        })
        log(plugins.chalk.yellow(divider));
    }


    /**
     * ===========================
     * Printing output to terminal
     * ===========================
     */

    /**
     * Help: Introduction
     */
    log(plugins.chalk.bgYellow.black(`\n${package.name} ${package.version}`))
    log(plugins.chalk.bgGreen.black('\nRefer to the Orbit Readme for full documentation:'));
    log(plugins.chalk.bgGreen.black('https://gitlab.hq.jadu.net/spacecraft/orbit/blob/dev/readme.md\n'));

    /**
     * Help: Tasks
     */
    log(plugins.chalk.green.bold('Tasks'));
    log(plugins.chalk.yellow(divider));
    iterateTasks(tasks);

    /**
     * Help: Notes
     */
    log(plugins.chalk.green.bold('\n\nNotes'));
    log(plugins.chalk.yellow(divider));
    notes.forEach(function (value) {
        log(value);
        log(plugins.chalk.yellow(divider));
    });
    log('\n');
}
