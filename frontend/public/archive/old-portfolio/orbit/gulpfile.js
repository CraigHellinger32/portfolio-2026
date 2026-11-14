const gulp          = require('gulp');
// Load plugins automatically
const plugins       = require('gulp-load-plugins')({
        pattern: ['*', '!gulpicon', '!browser-sync', '!twing', '!json-query', '!gulp-showhelp', '!replace-ext']
    });
// Project Name Stored in JSON File
let project        = require('./gulp/project.json');
// Package JSON
const packageJson    = require('./package.json');
// Config
const getConfig      = require('./gulp.config.js'),
      config         = getConfig(gulp, plugins, project, packageJson);
// Packages
const babel          = require('gulp-babel');
const gulpicon       = require('gulpicon/tasks/gulpicon');
const browserSync    = require('browser-sync').create('orbit');
const spawn          = require('child_process').spawn;
// Modules
const getTwing       = require('./gulp/modules/twing');
const helpOutput     = require('./gulp/modules/help');
const setProject     = require('./gulp/modules/setProject');
// Misc
let twigProcess;
let icons = gulpicon(config.gulpicon.glob, config.gulpicon.args);


// ========================================================
//  Task functions
// ========================================================
//  Defined using plain JavaScript functions

// ========================================================
//  Compile functions
// ===================
function javascript() {
    return gulp.src(config.jsToConcat, { allowEmpty: true })
        .pipe(babel({
            presets: ['@babel/preset-env'],
            exclude: config.paths.src.node + 'verge/src/verge.js'
        }))
        .pipe(plugins.plumber({ errorHandler: plugins.orbitOnError }))
        .pipe(config.env.isProduction ? plugins.util.noop() : plugins.sourcemaps.init())
        .pipe(plugins.concat('orbit.js', {newLine: ';'}))
        .pipe(config.env.isProduction ? plugins.uglify(config.uglifySettings) : plugins.sourcemaps.write())
        .pipe(gulp.dest(config.paths.dest.js))
        .pipe(config.env.isProduction ? plugins.util.noop() : browserSync.stream());
}

function jsonPages(done) {
    if (config.isImplementation) return done();

    return gulp.src(config.paths.src.data + 'pages/*.json')
        .pipe(plugins.plumber({ errorHandler: plugins.orbitOnError }))
        .pipe(plugins.jsoncombine("pages.json", function(data, meta) {
            return Buffer.from(JSON.stringify(data, null, 0))
        }))
        .pipe(gulp.dest(config.paths.src.data))
        done();
}

function json(done) {
    if (config.isImplementation) return done();

    return gulp.src(config.paths.src.data + '*.json')
        .pipe(plugins.plumber({ errorHandler: plugins.orbitOnError }))
        .pipe(plugins.jsoncombine("data.json", function(data, meta) {
            return Buffer.from(JSON.stringify(data, null, 0))
        }))
        .pipe(gulp.dest(config.paths.src.html))
        done();
}

function scss() {
    var scssSettings = config.scssSettings.dev;
    if (config.env.isProduction) {
        scssSettings = config.scssSettings.prod;
    }
    return gulp.src(config.paths.src.sass + '*.scss')
        .pipe(plugins.plumber({ errorHandler: config.orbitOnError }))
        .pipe( config.env.isProduction ? plugins.util.noop() : plugins.sourcemaps.init())
        .pipe(plugins.sass(scssSettings))
        .pipe(plugins.autoprefixer({
            browsers: [
                '> 1%',
                'last 5 versions',
                'Firefox ESR',
                'Opera 12.1'
            ],
        }))
        .pipe(plugins.regexRename(/style/, 'orbit'))
        .pipe(config.env.isProduction ? plugins.util.noop() : plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(config.paths.dest.css))
        .pipe(config.env.isProduction ? plugins.util.noop() : browserSync.stream());
}

// Usage:
// gulp init
function init(done) {
    if (config.isImplementation) {
        // Run at the beginning of an implementation
        // Prompts you to check the name of your project
        // (to make sure it matches the implementation theme name)
        // Copy twig templates from protototypes to implementation
        setProject(gulp, plugins),
        compileProductionTwig();
    } else {
        // Run when starting a new prototype
        // Prompts you to name your project, then updates the
        // directory name.
        setProject(gulp, plugins);
    }
    done();
}

// Copies prototype twig files into the correct directory for
// implementations.
//
// Run as part of init()
function compileProductionTwig() {
    if (!config.isImplementation) return;

    return gulp.src([
        config.paths.src.templates + '**/*.twig',
        '!' + config.paths.src.templates + 'partials/molecules/styleguide/**'
    ])
    .pipe(gulp.dest(config.paths.dest.twig, { overwrite: false }));
}

// Removes prototype files for implementation.
//
// Run manually when you are ready to remove the html folder
function removePrototype(done) {
    if (config.isImplementation) {
        return gulp.src(
            config.paths.src.html,
            {
                read: false
            }
        )
        .pipe(plugins.clean());
    }
    done();
}

// Twig - Prototype only
// Sets up Twing environment using data json files and
// outputting as html
function twig(done) {
    if (config.isImplementation) return done();

    let jsonData = require(config.paths.src.html + 'data.json');

    return gulp.src(config.paths.src.prototypes + '**/*.twig')
        .pipe(plugins.plumber({
            errorHandler: plugins.orbitOnError
        }))
        .pipe(getTwing({
            data: jsonData,
            paths: {
                templates: config.paths.src.templates,
                layouts: config.paths.src.layouts,
                prototypes: config.paths.src.prototypes,
                pages: config.paths.src.pages,
                partials: config.paths.src.partials,
                widgets: config.paths.src.widgets,
                images: config.paths.dest.images,
                dist: config.paths.dest.dist
            }
        }, {
            outputExt: ''
        },
        config
        ))
        .pipe(plugins.rename(function(path) {
            if (path.basename.indexOf('.') > -1) {
                path.extname = '';
            }
        }))
        .pipe(gulp.dest(config.paths.dest.html))
        done();
}

// spawnTwig - Prototypes only
// Runs Twing if not already running
function spawnTwig(done) {
    if (config.env.isProduction) {
        done();
    } else {
        // stop twig if running
        if (twigProcess) {
            twigProcess.kill();
        }
        // (re)start twig
        twigProcess = spawn('gulp', ['twig'], {stdio: 'inherit'});
        done();
    }
}


// ========================================================
//  Copy functions
// ================
function fonts() {
    return gulp.src(config.paths.src.fonts + '**/*')
        .pipe(gulp.dest(config.paths.dest.fonts))
}

function contentImages(done) {
    if (config.isImplementation) {
        return done();
    }
    return gulp.src(config.paths.src.contentImages + '**/*')
        .pipe(gulp.dest(config.paths.dest.contentImages));
}

function themeImages() {
    return gulp.src(config.paths.src.themeImages + '**/*')
        .pipe(gulp.dest(config.paths.dest.themeImages));
}

function javascriptLibs() {
    return gulp.src(config.jsLibsToCopy.src)
        .pipe(gulp.dest(config.jsLibsToCopy.dest));
}

function scssLibs() {
    return gulp.src(config.sassLibsToCopy.src)
        .pipe(plugins.rename({
            prefix: "_",
            extname: ".scss"
        }))
        .pipe( config.env.isProduction ? plugins.replace('/*!', '/*') : plugins.util.noop())
        .pipe(gulp.dest(config.sassLibsToCopy.dest));
}

function xfpCssLibs(done) {
    if (config.isImplementation) {
        return done();
    }
    return gulp.src(config.xfpCssLibsToCopy.src)
        .pipe(gulp.dest(config.xfpCssLibsToCopy.dest));
}

function xfpJsLibs(done) {
    if (config.isImplementation) {
        return done();
    }
    return gulp.src(config.xfpJsLibsToCopy.src)
        .pipe(gulp.dest(config.xfpJsLibsToCopy.dest));
}

function xfpMaps(done) {
    if (config.isImplementation) {
        return done();
    }
    return gulp.src(config.xfpMapsToCopy.src)
        .pipe(gulp.dest(config.xfpMapsToCopy.dest));
}


// ========================================================
//  Development functions
// =======================
function scssLint() {
    return gulp.src(config.paths.src.sass + '**/*.scss')
        .pipe(plugins.plumber({ errorHandler: plugins.orbitOnError }))
        .pipe(plugins.changedInPlace(config.changedInPlace))
        .pipe(plugins.scssLint(config.scssLint));
}

function watch(done) {
    gulp.watch(config.paths.src.data  + '*.json', json);
    gulp.watch(config.paths.src.data  + 'pages/*.json', jsonPages);
    gulp.watch(config.paths.src.sass  + '**/*.scss', gulp.series('scss', 'scssLint'));
    gulp.watch(config.paths.src.contentImages + '**/*', contentImages);
    gulp.watch(config.paths.src.themeImages + '**/*', themeImages);
    gulp.watch(config.paths.src.js    + '**/*.js', javascript);
    gulp.watch(config.paths.src.html  + 'data.json', spawnTwig);
    gulp.watch(config.paths.src.gulp  + 'widgets.json', spawnTwig);
    gulp.watch(config.paths.src.html  + '**/*.twig', spawnTwig);
    gulp.watch(config.paths.src.icons + '**/*.svg', icons);
    done();
}

function server(done) {
    if (config.env.isProduction) {
        done();
    } else {
        gulp.watch(config.paths.dest.css + '**/*.css').on("change", browserSync.reload);
        gulp.watch([
            config.paths.dest.html + '**/*.html',
            config.paths.dest.icons + '**/*.svg.css'
        ]).on("change", browserSync.reload);

        if (config.isImplementation) {
            browserSync.init({
                proxy: config.proxyUrl,
                serveStatic: ['static_temp/']
            });
            done();
        } else {
            browserSync.init({
                server: config.basePaths.server,
                port: 3000,
                online: false,
                https: true,
                open: true
            });
            done();
        }
    }
}

// ========================================================
//  Helper tasks
// ===============

/**
 * Adds and commits compiled assets to the dist directory
 */
function commitCompiled(done) {
    if(!config.commit) done();
    return gulp.src(config.paths.dest.dist + '.')
        .pipe(plugins.git.add())
        .pipe(plugins.git.commit('Build: Update compiled assets'));
    done();
}

/**
 * Outputs a list of all of the modules added to package.json
 */
function viewPlugins(done) {
    plugins.util.log(plugins);
    done();
}

/**
 * Outputs the gulp config file
 */
function viewConfig(done) {
    plugins.util.log(config);
    done();
}

/**
 * Runs CS Fixer
 * Implementation only
 */
function csFix (done) {
    const phpcsFixerCommand = "./vendor/bin/php-cs-fixer fix -v --using-cache=no";
    plugins.run(phpcsFixerCommand).exec()
        .pipe(gulp.dest('output'));
    done();
}

/**
 * Lists gulp commands and descriptions
 */
function help (done) {
    helpOutput(packageJson, plugins);

    done();
}


// ========================================================
//  Specify tasks
// ===============
const build = gulp.series(
    gulp.parallel(
        icons,
        gulp.series(
            jsonPages,
            json,
            twig,
            server
        ),
        gulp.series(
            scssLibs,
            scss,
            scssLint
        )
    ),
    gulp.parallel(
        contentImages,
        themeImages,
        javascript,
        javascriptLibs,
        xfpCssLibs,
        xfpJsLibs,
        xfpMaps
    )
);


//  Export tasks
// ==============
//  Use CommonJS `exports` module notation to declare tasks
exports.init = init; // Initial task for prototypes and implementations
exports.server = server;
exports.build = build;
exports.commitCompiled = commitCompiled;
exports.fonts = fonts;
exports.contentImages = contentImages;
exports.themeImages = themeImages;
exports.javascript  = javascript;
exports.javascriptLibs = javascriptLibs;
exports.xfpCssLibs = xfpCssLibs;
exports.xfpJsLibs = xfpJsLibs;
exports.xfpMaps = xfpMaps;
exports.json = json;
exports.jsonPages = jsonPages;
exports.scss = scss;
exports.scssLibs = scssLibs;
exports.scssLint = scssLint;
exports.watch = watch;
exports.icons = icons;
exports.twig = twig;
exports.spawnTwig = spawnTwig;
exports.viewPlugins = viewPlugins;
exports.viewConfig = viewConfig;
exports.csFix = csFix;
exports.help = help;
exports.compileProductionTwig = compileProductionTwig;
exports.removePrototype = removePrototype;

// ========================================================
//  Default Task
// ==============

gulp.task('default', gulp.series(
    build,
    watch
));
// ========================================================
