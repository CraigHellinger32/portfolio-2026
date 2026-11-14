module.exports = function(data = {}, options = {}, config){
    // code copied from gulp-twing v2.0.0 - https://www.npmjs.com/package/gulp-twing

    // Twing only modules
    const jsonQuery     = require('json-query');
    const Transform     = require('stream').Transform;
    const Twing         = require('twing');
    const replaceExt    = require('replace-ext');
    const path          = require('path');
    const fs            = require('fs');
    const project       = require('../project.json');
    const widgetTypes   = require('../widgets.json');

    const defaults = {
        outputExt: '.html',
        templatePaths: '.'
    };

    const themes = {
        'project': `./html/${project.name}/templates/`,
        'base': config.paths.src.baseTheme,
        'xfpbase': config.paths.src.formsBase
    };

    const mergedOptions = Object.assign({}, defaults, options);
    let stream = new Transform({objectMode: true});

    stream._transform = function(file, encoding, callback) {
        let template;

        if (file.isNull()) {
            callback(null, file);

            return;
        }
        else {
            template = path.relative(process.cwd(), file.path);
        }

        let loader = new Twing.TwingLoaderFilesystem([mergedOptions.templatePaths, themes.project, themes.base, themes.xfpbase]);
        let env = new Twing.TwingEnvironment(loader, {
            'cache': './static_temp/twig_cache/',
            'autoescape': false,
            'auto_reload': true
        });

        loader.addPath(themes.base, 'theme:base');
        loader.addPath(themes.xfpbase, 'theme:xfpbase');
        loader.addPath(themes.xfpbase, 'theme:paybridgebase');

        function isIterable(value) {
            return Symbol.iterator in Object(value);
        }

        // ========================================================
        //  Custom debug function to match Twig {{ dump(variable) }}
        // ======================================
        let dump = new Twing.TwingFunction('dump', function(value) {
            if (typeof value === 'undefined') return '<code class="debug">Undefined</code>';

            return '<code class="debug">' + JSON.stringify(value) + '</code>';
        });
        env.addFunction(dump);

        // ========================================================
        //  Search html/data/site.json and return the value of a constant.
        //  Used to replicate Jadu constant() and getConstantValue() functions
        // ======================================
        function queryJaduConstant(value) {
            if (typeof value === 'undefined') return null;

            switch (value) {
                case 'METADATA_GENERIC_NAME':
                    return jsonQuery('data.site.name', { data: data }).value;
                break;
                case 'ANALYTICS_INCLUDE':
                    return jsonQuery('data.site.constants.ANALYTICS_INCLUDE', { data: data }).value;
                break;
                case 'GOOGLE_MAPS_API_KEY':
                    return jsonQuery('data.site.constants.GOOGLE_MAPS_API_KEY', { data: data }).value;
                break;
                case 'XFP_MAP_COMPONENT_CENTER_LAT':
                    return jsonQuery('data.site.constants.XFP_MAP_COMPONENT_CENTER_LAT', { data: data }).value;
                break;
                case 'XFP_MAP_COMPONENT_CENTER_LNG':
                    return jsonQuery('data.site.constants.XFP_MAP_COMPONENT_CENTER_LNG', { data: data }).value;
                break;
                case 'XFP_MAP_COMPONENT_ZOOM':
                    return jsonQuery('data.site.constants.XFP_MAP_COMPONENT_ZOOM', { data: data }).value;
                break;
            }
            return;
        }

        // ========================================================
        //  Custom Twig function to match Photon {{ getConstantValue('METADATA_GENERIC_NAME') }}
        // ======================================
        let getConstantValue = new Twing.TwingFunction('getConstantValue', function(value) {
            return queryJaduConstant(value);
        });
        env.addFunction(getConstantValue);

        // ========================================================
        //  Custom Twig function to match XFP {{ constant('METADATA_GENERIC_NAME') }}
        // ======================================
        let constant = new Twing.TwingFunction('constant', function(value) {
            return queryJaduConstant(value);
        });
        env.addFunction(constant);

        // ========================================================
        //  Custom Twig function to match Photon {{ component('search') }}
        // ======================================
        let component = new Twing.TwingFunction('component', function(value, parameter) {
            if (typeof value === 'undefined') return null;

            var path = config.paths.src.baseTheme + 'partials/';

            switch (value) {
                case 'category_navigation':
                    var incidentalLinks = jsonQuery('data.incidentalContent.headerNavigationLinks.links', { data: data }).value;

                    if (typeof incidentalLinks === 'undefined') return;

                    if (fs.existsSync(config.paths.src.partials + 'molecules/list/record.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    return env.render(path + 'molecules/list/record.html.twig', {
                        'className': 'list--navigation',
                        'title': 'Categories',
                        'group': incidentalLinks
                    });
                break;
                case 'navigation_widget':
                    var navWidgetLinks = jsonQuery('data.site.navigationWidget', { data: data }).value;

                    if (typeof navWidgetLinks === 'undefined') return;

                    if (fs.existsSync(config.paths.src.partials + 'molecules/list/record.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    return env.render(path + 'molecules/list/record.html.twig', {
                        'className': 'list--navigation',
                        'title': navWidgetLinks.title,
                        'group': navWidgetLinks.links
                    });
                break;
                case 'search':
                    if (fs.existsSync(config.paths.src.partials + 'molecules/form/search.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    return env.render(path + 'molecules/form/search.html.twig');
                break;
                case 'multimedia_items':
                    var parameterId = parameter.get('itemID');
                    if (typeof parameterId === 'undefined') return;
                    return '<img src="./images/media_' + parameterId + '.jpg" alt="' + value + ' ' + parameterId + '" />';
                break;
                case 'page_stylesheet':
                    return;
                break;
                case 'directory_search_form':
                    if (fs.existsSync(config.paths.src.partials + 'organisms/form/directory_search.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    var page = jsonQuery('data.pages._3_article_directory', { data: data }).value;

                    return env.render(path + 'organisms/form/directory_search.html.twig', { 'page': page });
                break;
                case 'announcement':
                    if (fs.existsSync(config.paths.src.partials + 'molecules/text/announcement.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    var announcement = jsonQuery('data.site.announcement', { data: data }).value;

                    if (!announcement.visible) {
                        return;
                    }

                    return env.render(path + 'molecules/text/announcement.html.twig', {
                        'announcement': announcement,
                        'title': announcement.title,
                        'summary': announcement.summary,
                        'url': announcement.url,
                        'label': announcement.label
                    });
                break;
                case 'recaptcha':
                    return '<p>Recaptcha goes here.</p>';
                break;
                case 'related_articles':
                    if (fs.existsSync(config.paths.src.partials + 'organisms/related_menu.html.twig')) {
                        path = config.paths.src.partials;
                    }

                    var type = parameter.get('type'),
                        page = jsonQuery('data.pages._2_document_pages', { data: data }).value;

                    return env.render(path + 'organisms/related_menu.html.twig', {
                        'title': type.charAt(0).toUpperCase() + type.slice(1),
                        'group': page.relatedMenu[type]
                    });
                break;
            }
        });
        env.addFunction(component);

        // ========================================================
        //  Custom Twig function to match Photon {{ path('index') }}
        // ======================================
        let orbitPath = new Twing.TwingFunction('path', function(value, parameters) {
            switch (value) {
                case 'index':
                    return jsonQuery('data.site.baseUrl', { data: data }).value;
                break;
                case 'document_category':
                    return '2-landing-page.html?' + parameters.get('categoryId');
                break;
                case 'news_article':
                    return '5-article-news.html?news=' + parameters.get('articleId');
                break;
                case 'search_list':
                    return jsonQuery('data.site.searchResultsUrl', { data: data }).value;
                break;
                case 'meeting_download':
                    return '5-article-meeting.html?download=' + parameters.get('attachmentId');
                break;
                case 'file_download':
                    return '5-article-download.html?download=' + parameters.get('fileId');
                break;
                case 'user_registration':
                    return '6-form-user-registration.html';
                break;
                case 'user_account_signin':
                    return '6-form-user-signin.html';
                break;
                case 'user_home':
                    return '/' + value;
                break;
                default:
                    return value;
                break;
            }
        });
        env.addFunction(orbitPath);

        // ========================================================
        //  Custom Twig function to match Photon {{ asset('site/dist/orbit.js') }}
        // ======================================
        let asset = new Twing.TwingFunction('asset', function(value) {
            if (!config.isProduction) {
                return value.replace('site/', './');
            } else {
                return value;
            }
        });
        env.addFunction(asset);

        // ========================================================
        //  Custom Twig function to match Photon {{ absolute_url(asset(page.content.image.url)) }}
        // ======================================
        let absolute_url = new Twing.TwingFunction('absolute_url', function(value) {
            return value;
        });
        env.addFunction(absolute_url);

        // ========================================================
        //  Custom Twig function to match Photon {{ getTranslatedString('account-link-label') }}
        // ======================================
        let getTranslatedString = new Twing.TwingFunction('getTranslatedString', function(value, parameters) {
            if (typeof value === 'undefined') return;

            var query = jsonQuery('data.languagePack[entryKey=' + value + '].singularValue', { data: data }).value;

            switch (value) {
                case 'copyright':
                    var year = new Date().getFullYear();
                    query = query.replace('%1$s', year).replace('%2$s', jsonQuery('data.site.name', { data: data }).value);
                break;
            }

            if (typeof parameters !== 'undefined') {
                query = query.replace('%1$s', parameters[0]).replace('%2$s', parameters[1]);
            }

            return query;
        });
        env.addFunction(getTranslatedString);

        // ========================================================
        //  Custom Twig function to replicate Incidental Content {{ incidental_content('footerLinks') }}
        // ======================================
        let incidentalContent = new Twing.TwingFunction('incidental_content', function(value) {
            var returnObject = [];

            if (typeof value === 'undefined') return returnObject;

            var query = jsonQuery('data.incidentalContent.' + value, { data: data });

            if (typeof query["value"] === 'undefined') return returnObject;

            if (isIterable(query["value"])) {
                query["value"].forEach( function(item, index) {
                    returnObject[index] = item;
                });
            } else {
                returnObject = query["value"];
            }

            return returnObject;
        });
        env.addFunction(incidentalContent);

        // ========================================================
        //  Custom Twig function to match Photon {{ getESRIMapsHTML(-1, '', supplement.record.guid)|raw }}
        // ======================================
        let getESRIMapsHTML = new Twing.TwingFunction('getESRIMapsHTML', function(value) {
            return '<div class="map esri" id="map_esri"></div>';
        });
        env.addFunction(getESRIMapsHTML);

        // ========================================================
        //  Custom Twig function to match Photon {{ getDefaultMapConfig() }}
        // ======================================
        let getDefaultMapConfig = new Twing.TwingFunction('getDefaultMapConfig', function(value) {
            if (typeof value === 'undefined') return 'UK_GB';

            return value;
        });
        env.addFunction(getDefaultMapConfig);

        // ========================================================
        //  Custom Twig function to match Photon {{ convertToLazyImage(image) }} - Used in advert and contact supplements
        // ======================================
        let convertToLazyImage = new Twing.TwingFunction('convertToLazyImage', function(value) {
            return value;
        });
        env.addFunction(convertToLazyImage);

        // ========================================================
        //  Custom Twig function to match Photon {{ widget(widget) }}
        // ======================================
        let widget = new Twing.TwingFunction('widget', function(value) {
            if (typeof value === 'undefined') return;

            var widgetName;
            var filename;

            if (value.widget.title.length) {
                widgetName = value.widget.title.replace(' ', '_').replace('-', '_').toLowerCase();
            } else if (value.name.length) {
                widgetName = value.name.replace(' ', '_').replace('-', '_').toLowerCase();
            } else {
                return '<span class="error">Missing name or title in the data for this widget</span>';
            }

            if (value.widgetID >= 900) {
                filename = config.paths.src.widgets + 'custom/' + widgetName + '.html.twig';
            } else {
                filename = config.paths.src.widgets + widgetName + '.html.twig';

                if (!fs.existsSync(filename)) {
                    filename = config.paths.src.baseTheme + 'widgets/' + widgetName + '.html.twig';
                }
            }

            switch (widgetName) {
                case 'navigation':
                    return env.render(filename, {
                        'navigations': value,
                        'title': value.title,
                        'paths': config.paths.src
                    });
                break;
                case 'images':
                case 'homepage_banner':
                    return env.render(filename, {
                        'title': value.title,
                        'imgSrc': value.imgSrc,
                        'linkHref': value.linkHref,
                        'linkText': value.linkText,
                        'caption': value.caption,
                        'paths': config.paths.src
                    });
                break;
                case 'latest_news':
                    return env.render(filename, {
                        'title': value.title,
                        'article': value.article,
                        'group': value.group,
                        'paths': config.paths.src
                    });
                break;
                case 'document':
                    return env.render(filename, {
                        'title': value.title,
                        'categories': value.title,
                        'group': value.group,
                        'paths': config.paths.src
                    });
                break;
                case 'events_calendar':
                    return env.render(filename, {
                        'title': value.title,
                        'time': Date.now(),
                        'paths': config.paths.src
                    });
                break;
                case 'external_feeds':
                    return env.render(filename, {
                        'title': value.title,
                        'feed': value.feed,
                        'group': value.feed.group,
                        'paths': config.paths.src
                    });
                break;
                case 'gallery':
                    return env.render(filename, {
                        'gallery': value.gallery,
                        'paths': config.paths.src
                    });
                break;
                case 'middle_advert':
                case 'right_advert':
                    return env.render(filename, {
                        'adverts': value.adverts,
                        'paths': config.paths.src
                    });
                break;
                case 'sitemap':
                    return env.render(filename, {
                        'rootCategories': value.rootCategories,
                        'paths': config.paths.src
                    });
                break;
                case 'website_statistics':
                    return env.render(filename, {
                        'stats': value.stats,
                        'paths': config.paths.src
                    });
                break;
                case 'whats_new':
                    return env.render(filename, {
                        'newsArticles': value.newsArticles,
                        'documents': value.documents,
                        'paths': config.paths.src
                    });
                break;
                case 'opinion_poll':
                    return env.render(filename, {
                        'poll': value.poll,
                        'form': value.poll.form,
                        'hasVoted': value.poll.hasVoted,
                        'answerPercentage': value.poll.answerPercentage,
                        'paths': config.paths.src
                    });
                break;
                default:
                    return env.render(filename, {
                        'article': value.article,
                        'articles': value.articles,
                        'categories': value.categories,
                        'content': value.content,
                        'description': value.description,
                        'factory': value.factory,
                        'group': value.group,
                        'items': value.items,
                        'slides': value.slides,
                        'title': value.title,
                        'widget': value,
                        'paths': config.paths.src
                    });
                break;
            }
        });
        env.addFunction(widget);

        // ========================================================
        //  Custom Twig functions to allow full-width widget Row modifiers
        // ======================================
        let widgetRowModifier = new Twing.TwingFunction('widgetRowModifier', function($firstWidgetId, $loop) {
            if (typeof $firstWidgetId === 'undefined') return;

            var $fullWidthWidgets = widgetTypes.fullWidth;
            var $flushWidgets = widgetTypes.flush;
            var $classModifier = '';

            if ($flushWidgets.includes($firstWidgetId)) {
                $classModifier += ' widget-row--flush';
            }

            if ($fullWidthWidgets.includes($firstWidgetId)) {
                $classModifier += ' widget-row--full-width';
            }

            return $classModifier;
        });
        env.addFunction(widgetRowModifier);


        let widgetHasContainer = new Twing.TwingFunction('widgetHasContainer', function($firstWidgetId, $columns) {
            if (typeof $firstWidgetId === 'undefined') return true;

            var $fullWidthWidgets = widgetTypes.fullWidth;

            if (!$fullWidthWidgets.includes($firstWidgetId) && ($columns === null || $columns !== 'two-column')) {
                return true;
            }
        });
        env.addFunction(widgetHasContainer);

        let widgetHasInnerContainer = new Twing.TwingFunction('widgetHasInnerContainer', function($firstWidgetId, $columns) {
            if (typeof $firstWidgetId === 'undefined') return true;

            var $containedWidgets = widgetTypes.innerContainer;

            if ($containedWidgets.includes($firstWidgetId) && ($columns === null || $columns !== 'two-column')) {
                return true;
            }
        });
        env.addFunction(widgetHasInnerContainer);

        let widgetWidthModifier = new Twing.TwingFunction('widgetWidthModifier', function($width) {
            if (typeof $width === 'undefined') return;

            var $widthClasses = 'widget-width widget-width--' + $width;

            if ($width < 40 ) {
                return $widthClasses + ' widget-width--small';
            } else if ($width > 60) {
                return $widthClasses + ' widget-width--large';
            } else {
                return $widthClasses + ' widget-width--medium';
            }

            return $widthClasses;
        });
        env.addFunction(widgetWidthModifier);

        //  Custom Twig function to match Photon {{ getWidgetStylePath(page_specific_stylesheet) }}
        // ======================================
        let getWidgetStylePath = new Twing.TwingFunction('getWidgetStylePath', function() {
            return 'widget_styles.css';
        });
        env.addFunction(getWidgetStylePath);

        //  Custom Twig function to match Photon {{ getWidgetScriptPath() }}
        // ======================================
        let getWidgetScriptPath = new Twing.TwingFunction('getWidgetScriptPath', function() {
            return 'widget_script.js';
        });
        env.addFunction(getWidgetScriptPath);

        // ========================================================
        //  Custom Twig function to match XFP {{ controller() }}
        // ======================================
        let controller = new Twing.TwingFunction('controller', function(value, parameters) {
            if (typeof value === 'undefined') return;

            var filename;
            var question;

            parameters.forEach( function(item, index) {
                if (index === 'question') {
                    question = item;
                    filename = config.paths.src.templates + 'partials/molecules/form/' + item.componentType + '.html.twig';

                    if (!fs.existsSync(filename)) {
                        if (fs.existsSync(config.paths.src.formsBase + '/partials/molecules/form/' + item.componentType + '.html.twig')) {
                            filename = '@theme:xfpbase/partials/molecules/form/' + item.componentType + '.html.twig';
                        } else {
                            filename = '@theme:base/partials/molecules/form/' + item.componentType + '.html.twig';
                        }
                    } else {
                        filename = 'partials/molecules/form/' + item.componentType + '.html.twig';
                    }
                }
            });

            question.template = filename;

            return env.render('@theme:xfpbase/partials/molecules/styleguide/forms-xfp.html.twig', {
                'filename': filename,
                'question': question,
                'label': question.label,
                'hasRows': question.hasRows,
                'hasColumns': question.hasColumns,
                'hasSummary': question.hasSummary,
                'columns': question.columns,
                'rows': question.rows,
                'map_type': question.map_type
            });
        });
        env.addFunction(controller);

        // ========================================================
        //  Custom Twig function to match XFP {{ render_inline() }}
        // ======================================
        let render_inline = new Twing.TwingFunction('render_inline', function(value) {
            if (typeof value === 'undefined') return;

            return value;
        });
        env.addFunction(render_inline);

        //  Custom Twig function to match Photon {{ getSiteRootUrl() }}
        // ======================================
        let getSiteRootUrl = new Twing.TwingFunction('getSiteRootUrl', function(value) {
            return config.proxyUrl;
        });
        env.addFunction(getSiteRootUrl);

        // ========================================================
        //  Custom Twig function to match Photon {{ getSlug(attribute(categories,'category').getId(), 'category') }) }}
        // ======================================
        let getSlug = new Twing.TwingFunction('getSlug', function(value, parameters) {
            return 'landing.html?' + parameters;
        });
        env.addFunction(getSlug);

        // ========================================================
        //  Custom Twig function to match Photon {{ attribute(categories,'sub-category') }}
        // ======================================
        let attribute = new Twing.TwingFunction('attribute', function(value, parameters) {
            return 'landing.html?' + parameters;
        });
        env.addFunction(attribute);

        // ========================================================
        //  Custom Twig function to match {{ getDocumentUrl(item.id) }} uses in the standard Document Widget #4
        // ======================================
        let getDocumentUrl = new Twing.TwingFunction('getDocumentUrl', function(value) {
            if (typeof value === 'undefined') return;

            return '/document.html?id=' + value;
        });
        env.addFunction(getDocumentUrl);

        // ========================================================
        //  Custom Twig function to match {{ getIntegrationDetails('analytics_code_header')|raw }}
        // ======================================
        let getIntegrationDetails = new Twing.TwingFunction('getIntegrationDetails', function(value) {
            if (typeof value === 'undefined') return returnObject;

            var query = jsonQuery('data.site.' + value, { data: data });

            if (typeof query["value"] === 'undefined') return '<!-- ' + returnObject + ' -->';

            return query["value"];
        });
        env.addFunction(getIntegrationDetails);

        // ========================================================
        //  Custom Twig filter to match Photon {{ |escape('classname') }}
        // ======================================
        class escapeHandler {
            static handle(string) {
                if (typeof string === 'undefined') return;
                return string.replace(' ', '-').toLowerCase();
            }
        }
        let escape = new Twing.TwingFilter('escape', escapeHandler.handle);
        env.addFilter(escape);

        // ========================================================
        //  Custom Twig filter to match Photon {{ image_property('alt') }}
        // ======================================
        class imagePropertyHandler {
            static handle(string, output) {
                if (typeof string === 'undefined') return;
                return output + ' goes here.';
            }
        }
        let imageProperty = new Twing.TwingFilter('image_property', imagePropertyHandler.handle);
        env.addFilter(imageProperty);

        // ========================================================
        //  Custom Twig filter to match Photon {{ |combine_words }} used in the document widget #4
        // ======================================
        class combineWordsHandler {
            static handle(string, output) {
                if (typeof string === 'undefined') return;
                return string;
            }
        }
        let combineWords = new Twing.TwingFilter('combine_words', combineWordsHandler.handle);
        env.addFilter(combineWords);

        // ========================================================
        //  Custom Twig filter to match Photon {{ |process_editor }} used on the directory record_article page
        // ======================================
        class processEditorHandler {
            static handle(string, output) {
                if (typeof string === 'undefined') return;
                return string;
            }
        }
        let processEditor = new Twing.TwingFilter('process_editor', processEditorHandler.handle);
        env.addFilter(processEditor);

        try {
            let binary = env.render(template, data);

            file.contents = Buffer.from(binary);
            file.path = replaceExt(file.path, mergedOptions.outputExt);

            callback(null, file);
        }
        catch(err) {
            callback(err, file);
        }
    };
    return stream;
};
