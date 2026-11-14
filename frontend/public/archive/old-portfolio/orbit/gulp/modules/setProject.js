/**
 * Project Name Setup
 * $ gulp start
 */
module.exports = function(gulp, plugins){
    /**
     * Renaming the 'MainSiteProject' directory for prototypes
     *
     * @param      {Object}  projectData  from './gulp/project.json'
     */
    const renameDirectory = function(projectData) {
        const newDirectoryCommand = `mv ./html/MainSiteProject ./html/${projectData.name}`;
        plugins.run(newDirectoryCommand).exec();
        console.log(plugins.chalk.bgYellow.black(`Project '${projectData.name}' has been set up:`));
        console.log(plugins.chalk.bgYellow.black.bold(`./html/${projectData.name}/`));
    }

    /**
     * Getting data from './gulp/project.json'
     */
    let project = require('../project.json');

    return gulp.src('gulp.config.js')
        /**
         * Prompt asking for input of project name
         */
        .pipe(plugins.prompt.prompt({
            type: 'input',
            name: 'name',
            message: 'Name of project (Press enter to use the default \'MainSiteProject\'):'
        }, function(result){
            const updateProjectJson = (function() {
                if (result.name == 'MainSiteProject' || result.name == '') {
                    return;
                }

                let projectData = JSON.stringify(result);

                /**
                 * Updating 'project.json' with project name that
                 * has been inputted
                 */
                plugins.file('project.json', projectData, { src: true })
                    .pipe(gulp.dest('./gulp/'));
                projectData = JSON.parse(projectData);

                /**
                 * Calling 'renameDirectory' with data from 'project.json'
                 */
                renameDirectory(projectData);
            })();
        }
    ));
}
