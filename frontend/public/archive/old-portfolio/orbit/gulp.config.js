module.exports = function(gulp, plugins, project, packageJson){
    'use strict';

    /**
     * Config settings
     * Amend these 3 values as needed
     */
    const config = {
        isImplementation: false,
        isGalaxiesSite: false,
        proxyUrl: 'https://photon.ntn.jadu.net/'
    }

    config.default = {
        projectName: project.name,
        projectSubdomain: project.subdomain,
        baseFontSize: "16px"
    }

    config.env = {
        isProduction: !!plugins.util.env.prod,
        justWatch: !!plugins.util.env.watch,
        commit: !!plugins.util.env.commit
    }

    if (config.commit) {
        config.env.isProduction = true;
    }

    let destinationPath = './static_temp/site/';
    let destinationServer = 'static_temp/';

    // alter the path so that Browsersync will still work on a Galaxies implementation
    if (config.isGalaxiesSite && config.isImplementation) {
        destinationPath = './static_temp/themes/';

        if (config.default.projectSubdomain.length) {
            destinationPath += config.default.projectSubdomain + '/'
        } else {
            plugins.util.log(plugins.util.colors.bgRed('Please add your Galaxies subdomain in project.json for Browsersync to work'));
        }
    } else {
        destinationServer += 'site/';
    }

    config.basePaths = {
        src:    './',
        root:    '../',
        dest:   destinationPath,
        server: destinationServer
    }

    if (config.isImplementation && ( config.env.isProduction || config.env.justWatch )) {
        if (config.isGalaxiesSite) {
            config.basePaths.dest = '../public/';
        } else {
            config.basePaths.dest = '../public_html/site/';
        }
    }

    config.paths = {
        src: {
            gulp            : config.basePaths.src + 'gulp/',
            fonts           : config.basePaths.src + 'fonts/',
            html            : config.basePaths.src + 'html/',
            baseTheme       : config.basePaths.src + 'html/CmsProject/templates/',
            formsBase       : config.basePaths.src + 'html/XfpProject/base/',
            formsLibs       : config.basePaths.src + 'html/XfpProject/libs/',
            prototypes      : config.basePaths.src + 'html/' + config.default.projectName + '/prototypes/pages/',
            templates       : config.basePaths.src + 'html/' + config.default.projectName + '/templates/',
            layouts         : config.basePaths.src + 'html/' + config.default.projectName + '/templates/layouts/',
            pages           : config.basePaths.src + 'html/' + config.default.projectName + '/templates/pages/',
            partials        : config.basePaths.src + 'html/' + config.default.projectName + '/templates/partials/',
            widgets         : config.basePaths.src + 'html/' + config.default.projectName + '/templates/widgets/',
            data            : config.basePaths.src + 'html/data/',
            icons           : config.basePaths.src + 'icons/',
            images          : config.basePaths.src + 'images/',
            themeImages     : config.basePaths.src + 'images/theme/',
            contentImages   : config.basePaths.src + 'images/content/',
            js              : config.basePaths.src + 'js/',
            node            : config.basePaths.src + 'node_modules/',
            sass            : config.basePaths.src + 'sass/'
        },
        dest: {
            css             : config.basePaths.dest + 'dist/',
            dist            : config.basePaths.dest + 'dist/',
            fonts           : config.basePaths.dest + 'fonts/',
            html            : config.basePaths.dest,
            icons           : config.basePaths.dest + 'dist/icons/',
            images          : config.basePaths.dest + 'images/',
            themeImages     : config.basePaths.dest + 'dist/images/',
            contentImages   : config.basePaths.dest + 'images/',
            js              : config.basePaths.dest + 'dist/',
            libs            : config.basePaths.dest + 'dist/libs/',
            xfpCSS          : config.basePaths.dest + 'xfp/css/',
            xfpJS           : config.basePaths.dest + 'xfp/js/src/',
            xfpMaps         : config.basePaths.dest + 'xfp/javascript/maps/',
            twig            : config.basePaths.root + 'src/Custom/' + config.default.projectName + '/Resources/templates/base'
        }
    };

    config.jsToConcat = [
        config.paths.src.node + 'jquery-match-height/dist/jquery.matchHeight.js',
        config.paths.src.node + 'match-media/matchMedia.js',
        config.paths.src.node + 'flickity/dist/flickity.pkgd.js',
        config.paths.src.node + 'Placeholdr/placeholdr.js',
        config.paths.src.node + 'verge/src/verge.js',
        config.paths.src.node + 'picturefill/dist/picturefill.min.js',
        config.paths.src.node + 'isotope-layout/dist/isotope.pkgd.js',
        config.paths.src.js + 'globals.js',
        config.paths.src.js + 'debounce.js',
        config.paths.src.js + 'helpers.js',
        config.paths.src.js + 'a11y-toggle-with-callback.js',
        config.paths.src.js + 'a11y-toggle-connected.js',
        config.paths.src.js + 'external-link-checker.js',
        config.paths.src.js + 'file-upload.js',
        config.paths.src.js + 'toggle-mobile-swap.js',
        config.paths.src.js + 'navigation.js',
        config.paths.src.js + 'embedded-maps.js',
        config.paths.src.js + 'smartresize.js',
        config.paths.src.js + 'carousel-init.js',
        config.paths.src.js + 'responsive-tables.js',
        config.paths.src.js + 'date-field-format-helper.js',
        config.paths.src.js + 'isotope-init.js',
        config.paths.src.js + 'main.js'
    ];

    // JS Plugins that are to be removed for production
    if (!config.isImplementation && !config.env.isProduction) {
        config.jsToConcat.push(config.paths.src.node + 'prismjs/prism.js');
    }

    config.sassLibsToCopy = {
        src: [
            config.paths.src.node + 'dropzone/dist/dropzone.css',
            config.paths.src.node + '@nishanths/zoom.js/css/zoom.css',
            config.paths.src.node + 'flickity/dist/flickity.css',
            config.paths.src.node + 'normalize.css/normalize.css'
        ],
        dest: config.basePaths.src + 'sass/4-Libs/'
    }

    // 3rd party CSS Libs that are to be removed for production
    if (!config.isImplementation && !config.env.isProduction) {
        config.sassLibsToCopy.src.push(config.paths.src.node + 'prismjs/themes/prism.css');
    }

    config.jsLibsToCopy = {
        src: [
            config.paths.src.js + 'libs/modernizr-custom.js',
            config.paths.src.node + 'jquery/dist/jquery.min.js'
        ],
        dest: config.paths.dest.libs
    }

    config.xfpJsLibsToCopy = {
        src: [
            config.paths.src.formsLibs + 'js/file-uploads.js',
            config.paths.src.formsLibs + 'js/in-page-branching.js',
            config.paths.src.node + 'date-input-polyfill/date-input-polyfill.dist.js',
            config.paths.src.node + 'dropzone/dist/dropzone.js',
        ],
        dest: config.paths.dest.xfpJS
    }

    config.xfpMapsToCopy = {
        src: [
            config.paths.src.formsLibs + 'js/google-loader.js',
        ],
        dest: config.paths.dest.xfpMaps
    }

    config.xfpCssLibsToCopy = {
        src: [
            config.paths.src.node + 'dropzone/dist/dropzone.css',
        ],
        dest: config.paths.dest.xfpCSS
    }

    config.gulpicon = {
        glob: plugins.glob.sync(config.paths.src.icons + '**/*.svg'),
        args: {
            enhanceSVG:     true,
            defaultWidth:  '150px',
            defaultHeight: '150px',
            colors: {
                // ==========================
                //  Neutral Colours
                // ==========================
                white:             '#fff',
                black:             '#000',
                // ==========================
                //  Accessibility Colours
                // ==========================
                a11yYellow:        '#ff0',
                a11yGreen:         '#0f0',
                a11yBlue:          '#010066',
                a11yBlueLight:     '#9fcfff',
                a11yRed:           '#f00',
                a11yCream:         '#fff9d2',
                a11yGold:          '#6f6200',
                // ==========================
                //  Custom Colours
                // ==========================
                primary:           '#2d3547'
            },
            customselectors: {
                // ==========================
                //  Base Icons
                // ==========================
                //    - Alerts
                // ==========================
                'alert-warning': [
                    '.alert--warning::before'
                ],
                'alert-danger': [
                    '.alert--danger::before',
                    '.alert--error::before'
                ],
                'alert-success': [
                    '.alert--success::before'
                ],
                'alert-information': [
                    '.alert--information::before',
                    '.alert--info::before'
                ],
                // ==========================
                //    - Chevrons & Arrows
                // ==========================
                'ui-chevron-right': [
                    '.quicklink__link'
                ],
                'ui-chevron-down': [
                    '.form__select',
                    '.goog-te-combo'
                ],
                'ui-arrow-right': [
                    '.list--navigation .list__item::before',
                    '.list--record .list__item::before',
                    '.list--grouped .list .list__item::before'
                ],
                // ==========================
                //    - Misc
                // ==========================
                'ui-search-primary': [
                    '.form--search .icon-ui-search'
                ],
                'ui-check': [
                    '.form__label--checkbox::after'
                ],
                'ui-upload': [
                    '.form__label--upload::after'
                ],
                'ui-image-upload': [
                    '.form__label--image-upload::after'
                ],
                // ==========================
                //  Accessibility Icons
                // ==========================
                //    - High Contrast Theme
                // ==========================
                'logo-a11yYellow': [
                    '.user-style--scheme-high-contrast .icon-logo'
                ],
                'account-black': [
                    '.user-style--scheme-high-contrast .button .icon-account'
                ],
                'account-a11yGreen': [
                    '.user-style--scheme-high-contrast .button:hover .icon-account',
                    '.user-style--scheme-high-contrast .button:focus .icon-account'
                ],
                'alert-warning-a11yYellow': [
                    '.user-style--scheme-high-contrast .alert--warning::before'
                ],
                'alert-danger-a11yYellow': [
                    '.user-style--scheme-high-contrast .alert--danger::before'
                ],
                'alert-information-a11yYellow': [
                    '.user-style--scheme-high-contrast .alert--information::before'
                ],
                'alert-success-a11yYellow': [
                    '.user-style--scheme-high-contrast .alert--success::before'
                ],
                'ui-chevron-down-a11yYellow': [
                    '.user-style--scheme-high-contrast .form__select'
                ],
                'ui-search-black': [
                    '.user-style--scheme-high-contrast .button .icon-ui-search'
                ],
                'ui-search-a11yGreen': [
                    '.user-style--scheme-high-contrast .button:hover .icon-ui-search',
                    '.user-style--scheme-high-contrast .button:focus .icon-ui-search'
                ],
                'ui-chevron-up-black': [
                    '.user-style--scheme-high-contrast .back-to-top .icon-ui-chevron-up'
                ],
                'ui-chevron-up-a11yGreen': [
                    '.user-style--scheme-high-contrast .back-to-top:hover .icon-ui-chevron-up',
                    '.user-style--scheme-high-contrast .back-to-top:focus .icon-ui-chevron-up',
                ],
                'ui-arrow-right-a11yGreen': [
                    '.user-style--scheme-high-contrast .card .icon-ui-arrow-right',
                    '.user-style--scheme-high-contrast .widget-navigation .list__link .icon-ui-arrow-right',
                    '.user-style--scheme-high-contrast .list--navigation .list__item::before',
                    '.user-style--scheme-high-contrast .list--record .list__item::before'
                ],
                'external-link-a11yGreen': [
                    '.user-style--scheme-high-contrast .link-external .icon-external-link'
                ],
                'social-facebook-a11yYellow': [
                    '.user-style--scheme-high-contrast .nav--social-links .icon-social-facebook'
                ],
                'social-linkedin-a11yYellow': [
                    '.user-style--scheme-high-contrast .nav--social-links .icon-social-linkedin'
                ],
                'social-twitter-a11yYellow': [
                    '.user-style--scheme-high-contrast .nav--social-links .icon-social-twitter'
                ],
                // ==========================
                //    - Blue Theme
                // ==========================
                'account-a11yBlue': [
                    '.user-style--scheme-blue .button .icon-account'
                ],
                'account-a11yRed': [
                    '.user-style--scheme-blue .button:hover .icon-account',
                    '.user-style--scheme-blue .button:focus .icon-account'
                ],
                'ui-search-a11yBlue': [
                    '.user-style--scheme-blue .button .icon-ui-search'
                ],
                'ui-search-a11yRed': [
                    '.user-style--scheme-blue .button:hover .icon-ui-search',
                    '.user-style--scheme-blue .button:focus .icon-ui-search'
                ],
                'ui-chevron-up-a11yBlue': [
                    '.user-style--scheme-blue .back-to-top .icon-ui-chevron-up'
                ],
                'ui-chevron-up-a11yRed': [
                    '.user-style--scheme-blue .back-to-top:hover .icon-ui-chevron-up',
                    '.user-style--scheme-blue .back-to-top:focus .icon-ui-chevron-up',
                ],
                'ui-arrow-right-a11yBlue': [
                    '.user-style--scheme-blue .card .icon-ui-arrow-right',
                    '.user-style--scheme-blue .widget-navigation .list__link .icon-ui-arrow-right',
                    '.user-style--scheme-blue .list--navigation .list__item::before',
                    '.user-style--scheme-blue .list--record .list__item::before'
                ],
                'external-link-a11yRed': [
                    '.user-style--scheme-blue .link-external .icon-external-link'
                ],
                // ==========================
                //    - Cream Theme
                // ==========================
                'account-a11yCream': [
                    '.user-style--scheme-cream .button .icon-account'
                ],
                'account-a11yGold': [
                    '.user-style--scheme-cream .button:hover .icon-account',
                    '.user-style--scheme-cream .button:focus .icon-account'
                ],
                'external-link-a11yGold': [
                    '.user-style--scheme-cream .link-external .icon-external-link'
                ],
                'ui-chevron-up-a11yCream': [
                    '.user-style--scheme-cream .back-to-top .icon-ui-chevron-up'
                ],
                'ui-chevron-up-a11yGold': [
                    '.user-style--scheme-cream .back-to-top:hover .icon-ui-chevron-up',
                    '.user-style--scheme-cream .back-to-top:focus .icon-ui-chevron-up'
                ],
                'ui-search-a11yCream': [
                    '.user-style--scheme-cream .button .icon-ui-search'
                ],
                'ui-search-a11yGold': [
                    '.user-style--scheme-cream .button:hover .icon-ui-search',
                    '.user-style--scheme-cream .button:focus .icon-ui-search'
                ],
                // ==========================
                //    - Blue & Cream Theme
                // ==========================
                'logo-a11yBlue': [
                    '.user-style--scheme-blue .icon-logo',
                    '.user-style--scheme-cream .icon-logo'
                ],
                'alert-warning-a11yBlue': [
                    '.user-style--scheme-blue .alert--warning::before',
                    '.user-style--scheme-cream .alert--warning::before'
                ],
                'alert-danger-a11yBlue': [
                    '.user-style--scheme-blue .alert--danger::before',
                    '.user-style--scheme-cream .alert--danger::before'
                ],
                'alert-information-a11yBlue': [
                    '.user-style--scheme-blue .alert--information::before',
                    '.user-style--scheme-cream .alert--information::before'
                ],
                'alert-success-a11yBlue': [
                    '.user-style--scheme-blue .alert--success::before',
                    '.user-style--scheme-cream .alert--success::before'
                ],
                'ui-chevron-down-a11yBlue': [
                    '.user-style--scheme-blue .form__select',
                    '.user-style--scheme-cream .form__select'
                ],
                'social-facebook-a11yBlue': [
                    '.user-style--scheme-blue .nav--social-links .icon-social-facebook',
                    '.user-style--scheme-cream .nav--social-links .icon-social-facebook'
                ],
                'social-linkedin-a11yBlue': [
                    '.user-style--scheme-blue .nav--social-links .icon-social-linkedin',
                    '.user-style--scheme-cream .nav--social-links .icon-social-linkedin'
                ],
                'social-twitter-a11yBlue': [
                    '.user-style--scheme-blue .nav--social-links .icon-social-twitter',
                    '.user-style--scheme-cream .nav--social-links .icon-social-twitter'
                ]
            },
            dest: config.paths.dest.icons
        }
    };

    config.changedInPlace = {
        'firstPass': true
    };

    config.scssLint = {
        'config': '.scss-lint.yml',
        'maxBuffer': 614400
    };

    config.scssSettings = {
        dev: {
            outputStyle: 'expanded'
        },
        prod: {
            outputStyle: 'compressed'
        }
    }
    config.uglifySettings = {
        compress: {
            // Remove any console.logs to prevent old IE having a fit
            drop_console: true
        },
        mangle: {
            except: ['jQuery']
        },
        // Set screwIE8 to false to work for IE 6-8
        screwIE8: false,
        preserveComments: false
    }

    config.orbitOnError = function(err) {
        if (err.formatted) {
            var errorMessage = err.formatted;
        } else {
            var errorMessage = err;
        }

        plugins.util.beep();
        plugins.util.log(plugins.util.colors.bgRed(errorMessage));
        this.emit('end');
    };

    return config;
}
