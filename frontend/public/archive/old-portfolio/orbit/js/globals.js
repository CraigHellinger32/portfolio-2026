/**
 * Global variables and objects
 */

var html = document.getElementsByTagName('html')[0];
var body = document.body;

/**
 * Breakpoints
 *
 * @type     {Object}
 */
var breakpoints = {
    mobile: 600,
    tablet: 760,
    desktop: 1020
};

/**
 * Site sections
 *
 * @type     {Object}
 */
var site = {
    site: document.querySelector('.site'),
    header: document.querySelector('.site-header'),
    main: document.querySelector('.site-main'),
    footer: document.querySelector('.site-footer')
};

/**
 * Menu toggle
 *
 * @type     {Object}
 * @property {HTMLElement} toggle     - Menu button
 * @property {HTMLElement} navigation - Menu container
 */
var menu = {
    toggle: document.querySelectorAll('.js-menu-toggle'),
    navigation: document.getElementById('js-menu'),
    text: document.querySelector('.js-menu-toggle .button__text')
};

/**
 * Search toggle
 *
 * @type     {Object}
 * @property {HTMLElement} toggle     - Search button
 * @property {HTMLElement} navigation - Search container
 */
var search = {
    toggle: document.querySelectorAll('.js-search-toggle')[0],
    navigation: document.getElementById('js-search'),
    text: document.querySelector('.js-search-toggle .button__text')
};

/**
 * Pages-in toggle
 *
 * @type     {Object}
 * @property {HTMLElement} toggle     - Pages in button
 * @property {HTMLElement} navigation - Pages in list
 */
var pagesIn = {
    toggle: document.querySelectorAll('.js-pages-in-toggle'),
    navigation: document.getElementById('pages-in-list')
};

/**
 * All header toggles
 *
 * @property {HTMLElement} toggle     - Toggle buttons
 */
 var headerToggles = site.header.querySelectorAll('.js-toggle');

/**
 * Viewport widths
 *
 * @type     {Object}
 */
var viewports = {
    width: verge.viewportW(),
    height: verge.viewportH()
}

/**
 * iOSDevice
 *
 * @type     {Boolean}
 */
var iOSDevice = !!navigator.platform.match(/iPhone|iPod|iPad/);

/**
 * Embedded Maps
 *
 */
var map = null;
var embeddedMaps = site.main.querySelectorAll('.map');
var skipEmbeddedMapsForwards = site.main.querySelectorAll('.js-map-skip-forwards');
var skipEmbeddedMapsBackwards = site.main.querySelectorAll('.js-map-skip-backwards');

/**
 * jQuery
 */
var $siteMain = $(site.main);
var $forms = $siteMain.find('.form');
var $body = $(body);
var $html = $(html);
