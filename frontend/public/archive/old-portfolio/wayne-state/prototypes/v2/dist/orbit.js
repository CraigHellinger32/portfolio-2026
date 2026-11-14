"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
* jquery-match-height 0.7.2 by @liabru
* http://brm.io/jquery-match-height/
* License: MIT
*/
;

(function (factory) {
  // eslint-disable-line no-extra-semi
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Global
    factory(jQuery);
  }
})(function ($) {
  /*
  *  internal
  */
  var _previousResizeWidth = -1,
      _updateTimeout = -1;
  /*
  *  _parse
  *  value parse utility function
  */


  var _parse = function _parse(value) {
    // parse value and convert NaN to 0
    return parseFloat(value) || 0;
  };
  /*
  *  _rows
  *  utility function returns array of jQuery selections representing each row
  *  (as displayed after float wrapping applied by browser)
  */


  var _rows = function _rows(elements) {
    var tolerance = 1,
        $elements = $(elements),
        lastTop = null,
        rows = []; // group elements by their top position

    $elements.each(function () {
      var $that = $(this),
          top = $that.offset().top - _parse($that.css('margin-top')),
          lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

      if (lastRow === null) {
        // first item on the row, so just push it
        rows.push($that);
      } else {
        // if the row top is the same, add to the row group
        if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
          rows[rows.length - 1] = lastRow.add($that);
        } else {
          // otherwise start a new row group
          rows.push($that);
        }
      } // keep track of the last row top


      lastTop = top;
    });
    return rows;
  };
  /*
  *  _parseOptions
  *  handle plugin options
  */


  var _parseOptions = function _parseOptions(options) {
    var opts = {
      byRow: true,
      property: 'height',
      target: null,
      remove: false
    };

    if (_typeof(options) === 'object') {
      return $.extend(opts, options);
    }

    if (typeof options === 'boolean') {
      opts.byRow = options;
    } else if (options === 'remove') {
      opts.remove = true;
    }

    return opts;
  };
  /*
  *  matchHeight
  *  plugin definition
  */


  var matchHeight = $.fn.matchHeight = function (options) {
    var opts = _parseOptions(options); // handle remove


    if (opts.remove) {
      var that = this; // remove fixed height from all selected elements

      this.css(opts.property, ''); // remove selected elements from all groups

      $.each(matchHeight._groups, function (key, group) {
        group.elements = group.elements.not(that);
      }); // TODO: cleanup empty groups

      return this;
    }

    if (this.length <= 1 && !opts.target) {
      return this;
    } // keep track of this group so we can re-apply later on load and resize events


    matchHeight._groups.push({
      elements: this,
      options: opts
    }); // match each element's height to the tallest element in the selection


    matchHeight._apply(this, opts);

    return this;
  };
  /*
  *  plugin global options
  */


  matchHeight.version = '0.7.2';
  matchHeight._groups = [];
  matchHeight._throttle = 80;
  matchHeight._maintainScroll = false;
  matchHeight._beforeUpdate = null;
  matchHeight._afterUpdate = null;
  matchHeight._rows = _rows;
  matchHeight._parse = _parse;
  matchHeight._parseOptions = _parseOptions;
  /*
  *  matchHeight._apply
  *  apply matchHeight to given elements
  */

  matchHeight._apply = function (elements, options) {
    var opts = _parseOptions(options),
        $elements = $(elements),
        rows = [$elements]; // take note of scroll position


    var scrollTop = $(window).scrollTop(),
        htmlHeight = $('html').outerHeight(true); // get hidden parents

    var $hiddenParents = $elements.parents().filter(':hidden'); // cache the original inline style

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.data('style-cache', $that.attr('style'));
    }); // temporarily must force hidden parents visible

    $hiddenParents.css('display', 'block'); // get rows if using byRow, otherwise assume one row

    if (opts.byRow && !opts.target) {
      // must first force an arbitrary equal height so floating elements break evenly
      $elements.each(function () {
        var $that = $(this),
            display = $that.css('display'); // temporarily force a usable display value

        if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
          display = 'block';
        } // cache the original inline style


        $that.data('style-cache', $that.attr('style'));
        $that.css({
          'display': display,
          'padding-top': '0',
          'padding-bottom': '0',
          'margin-top': '0',
          'margin-bottom': '0',
          'border-top-width': '0',
          'border-bottom-width': '0',
          'height': '100px',
          'overflow': 'hidden'
        });
      }); // get the array of rows (based on element top position)

      rows = _rows($elements); // revert original inline styles

      $elements.each(function () {
        var $that = $(this);
        $that.attr('style', $that.data('style-cache') || '');
      });
    }

    $.each(rows, function (key, row) {
      var $row = $(row),
          targetHeight = 0;

      if (!opts.target) {
        // skip apply to rows with only one item
        if (opts.byRow && $row.length <= 1) {
          $row.css(opts.property, '');
          return;
        } // iterate the row and find the max height


        $row.each(function () {
          var $that = $(this),
              style = $that.attr('style'),
              display = $that.css('display'); // temporarily force a usable display value

          if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
            display = 'block';
          } // ensure we get the correct actual height (and not a previously set height value)


          var css = {
            'display': display
          };
          css[opts.property] = '';
          $that.css(css); // find the max height (including padding, but not margin)

          if ($that.outerHeight(false) > targetHeight) {
            targetHeight = $that.outerHeight(false);
          } // revert styles


          if (style) {
            $that.attr('style', style);
          } else {
            $that.css('display', '');
          }
        });
      } else {
        // if target set, use the height of the target element
        targetHeight = opts.target.outerHeight(false);
      } // iterate the row and apply the height to all elements


      $row.each(function () {
        var $that = $(this),
            verticalPadding = 0; // don't apply to a target

        if (opts.target && $that.is(opts.target)) {
          return;
        } // handle padding and border correctly (required when not using border-box)


        if ($that.css('box-sizing') !== 'border-box') {
          verticalPadding += _parse($that.css('border-top-width')) + _parse($that.css('border-bottom-width'));
          verticalPadding += _parse($that.css('padding-top')) + _parse($that.css('padding-bottom'));
        } // set the height (accounting for padding and border)


        $that.css(opts.property, targetHeight - verticalPadding + 'px');
      });
    }); // revert hidden parents

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.attr('style', $that.data('style-cache') || null);
    }); // restore scroll position if enabled

    if (matchHeight._maintainScroll) {
      $(window).scrollTop(scrollTop / htmlHeight * $('html').outerHeight(true));
    }

    return this;
  };
  /*
  *  matchHeight._applyDataApi
  *  applies matchHeight to all elements with a data-match-height attribute
  */


  matchHeight._applyDataApi = function () {
    var groups = {}; // generate groups by their groupId set by elements using data-match-height

    $('[data-match-height], [data-mh]').each(function () {
      var $this = $(this),
          groupId = $this.attr('data-mh') || $this.attr('data-match-height');

      if (groupId in groups) {
        groups[groupId] = groups[groupId].add($this);
      } else {
        groups[groupId] = $this;
      }
    }); // apply matchHeight to each group

    $.each(groups, function () {
      this.matchHeight(true);
    });
  };
  /*
  *  matchHeight._update
  *  updates matchHeight on all current groups with their correct options
  */


  var _update = function _update(event) {
    if (matchHeight._beforeUpdate) {
      matchHeight._beforeUpdate(event, matchHeight._groups);
    }

    $.each(matchHeight._groups, function () {
      matchHeight._apply(this.elements, this.options);
    });

    if (matchHeight._afterUpdate) {
      matchHeight._afterUpdate(event, matchHeight._groups);
    }
  };

  matchHeight._update = function (throttle, event) {
    // prevent update if fired from a resize event
    // where the viewport width hasn't actually changed
    // fixes an event looping bug in IE8
    if (event && event.type === 'resize') {
      var windowWidth = $(window).width();

      if (windowWidth === _previousResizeWidth) {
        return;
      }

      _previousResizeWidth = windowWidth;
    } // throttle updates


    if (!throttle) {
      _update(event);
    } else if (_updateTimeout === -1) {
      _updateTimeout = setTimeout(function () {
        _update(event);

        _updateTimeout = -1;
      }, matchHeight._throttle);
    }
  };
  /*
  *  bind events
  */
  // apply on DOM ready event


  $(matchHeight._applyDataApi); // use on or bind where supported

  var on = $.fn.on ? 'on' : 'bind'; // update heights on load and resize events

  $(window)[on]('load', function (event) {
    matchHeight._update(false, event);
  }); // throttled update heights on resize events

  $(window)[on]('resize orientationchange', function (event) {
    matchHeight._update(true, event);
  });
});;"use strict";

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */
window.matchMedia || (window.matchMedia = function () {
  "use strict"; // For browsers that support matchMedium api such as IE 9 and webkit

  var styleMedia = window.styleMedia || window.media; // For those that don't support matchMedium

  if (!styleMedia) {
    var style = document.createElement('style'),
        script = document.getElementsByTagName('script')[0],
        info = null;
    style.type = 'text/css';
    style.id = 'matchmediajs-test';
    script.parentNode.insertBefore(style, script); // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers

    info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;
    styleMedia = {
      matchMedium: function matchMedium(media) {
        var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }'; // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers

        if (style.styleSheet) {
          style.styleSheet.cssText = text;
        } else {
          style.textContent = text;
        } // Test if media query is true or false


        return info.width === '1px';
      }
    };
  }

  return function (media) {
    return {
      matches: styleMedia.matchMedium(media || 'all'),
      media: media || 'all'
    };
  };
}());;"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Flickity PACKAGED v2.2.1
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * https://flickity.metafizzy.co
 * Copyright 2015-2019 Metafizzy
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */
(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /* globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('jquery-bridget/jquery-bridget', ['jquery'], function (jQuery) {
      return factory(window, jQuery);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('jquery'));
  } else {
    // browser global
    window.jQueryBridget = factory(window, window.jQuery);
  }
})(window, function factory(window, jQuery) {
  'use strict'; // ----- utils ----- //

  var arraySlice = Array.prototype.slice; // helper function for logging errors
  // $.error breaks jQuery chaining

  var console = window.console;
  var logError = typeof console == 'undefined' ? function () {} : function (message) {
    console.error(message);
  }; // ----- jQueryBridget ----- //

  function jQueryBridget(namespace, PluginClass, $) {
    $ = $ || jQuery || window.jQuery;

    if (!$) {
      return;
    } // add option method -> $().plugin('option', {...})


    if (!PluginClass.prototype.option) {
      // option setter
      PluginClass.prototype.option = function (opts) {
        // bail out if not an object
        if (!$.isPlainObject(opts)) {
          return;
        }

        this.options = $.extend(true, this.options, opts);
      };
    } // make jQuery plugin


    $.fn[namespace] = function (arg0
    /*, arg1 */
    ) {
      if (typeof arg0 == 'string') {
        // method call $().plugin( 'methodName', { options } )
        // shift arguments by 1
        var args = arraySlice.call(arguments, 1);
        return methodCall(this, arg0, args);
      } // just $().plugin({ options })


      plainCall(this, arg0);
      return this;
    }; // $().plugin('methodName')


    function methodCall($elems, methodName, args) {
      var returnValue;
      var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';
      $elems.each(function (i, elem) {
        // get instance
        var instance = $.data(elem, namespace);

        if (!instance) {
          logError(namespace + ' not initialized. Cannot call methods, i.e. ' + pluginMethodStr);
          return;
        }

        var method = instance[methodName];

        if (!method || methodName.charAt(0) == '_') {
          logError(pluginMethodStr + ' is not a valid method');
          return;
        } // apply method, get return value


        var value = method.apply(instance, args); // set return value if value is returned, use only first value

        returnValue = returnValue === undefined ? value : returnValue;
      });
      return returnValue !== undefined ? returnValue : $elems;
    }

    function plainCall($elems, options) {
      $elems.each(function (i, elem) {
        var instance = $.data(elem, namespace);

        if (instance) {
          // set options & init
          instance.option(options);

          instance._init();
        } else {
          // initialize new instance
          instance = new PluginClass(elem, options);
          $.data(elem, namespace, instance);
        }
      });
    }

    updateJQuery($);
  } // ----- updateJQuery ----- //
  // set $.bridget for v1 backwards compatibility


  function updateJQuery($) {
    if (!$ || $ && $.bridget) {
      return;
    }

    $.bridget = jQueryBridget;
  }

  updateJQuery(jQuery || window.jQuery); // -----  ----- //

  return jQueryBridget;
});
/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */


(function (global, factory) {
  // universal module definition

  /* jshint strict: false */

  /* globals define, module, window */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('ev-emitter/ev-emitter', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }
})(typeof window != 'undefined' ? window : void 0, function () {
  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    } // set events hash


    var events = this._events = this._events || {}; // set listeners array

    var listeners = events[eventName] = events[eventName] || []; // only add once

    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
    }

    return this;
  };

  proto.once = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    } // add event


    this.on(eventName, listener); // set once flag
    // set onceEvents hash

    var onceEvents = this._onceEvents = this._onceEvents || {}; // set onceListeners object

    var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {}; // set flag

    onceListeners[listener] = true;
    return this;
  };

  proto.off = function (eventName, listener) {
    var listeners = this._events && this._events[eventName];

    if (!listeners || !listeners.length) {
      return;
    }

    var index = listeners.indexOf(listener);

    if (index != -1) {
      listeners.splice(index, 1);
    }

    return this;
  };

  proto.emitEvent = function (eventName, args) {
    var listeners = this._events && this._events[eventName];

    if (!listeners || !listeners.length) {
      return;
    } // copy over to avoid interference if .off() in listener


    listeners = listeners.slice(0);
    args = args || []; // once stuff

    var onceListeners = this._onceEvents && this._onceEvents[eventName];

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      var isOnce = onceListeners && onceListeners[listener];

      if (isOnce) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off(eventName, listener); // unset once flag

        delete onceListeners[listener];
      } // trigger listener


      listener.apply(this, args);
    }

    return this;
  };

  proto.allOff = function () {
    delete this._events;
    delete this._onceEvents;
  };

  return EvEmitter;
});
/*!
 * getSize v2.0.3
 * measure size of elements
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

/* globals console: false */


(function (window, factory) {
  /* jshint strict: false */

  /* globals define, module */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('get-size/get-size', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }
})(window, function factory() {
  'use strict'; // -------------------------- helpers -------------------------- //
  // get a number from a string, not a percentage

  function getStyleSize(value) {
    var num = parseFloat(value); // not a percent like '100%', and a number

    var isValid = value.indexOf('%') == -1 && !isNaN(num);
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console == 'undefined' ? noop : function (message) {
    console.error(message);
  }; // -------------------------- measurements -------------------------- //

  var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];
  var measurementsLength = measurements.length;

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };

    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      size[measurement] = 0;
    }

    return size;
  } // -------------------------- getStyle -------------------------- //

  /**
   * getStyle, get style of element, check for Firefox bug
   * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */


  function getStyle(elem) {
    var style = getComputedStyle(elem);

    if (!style) {
      logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See https://bit.ly/getsizebug1');
    }

    return style;
  } // -------------------------- setup -------------------------- //


  var isSetup = false;
  var isBoxSizeOuter;
  /**
   * setup
   * check isBoxSizerOuter
   * do on first getSize() rather than on page load for Firefox bug
   */

  function setup() {
    // setup once
    if (isSetup) {
      return;
    }

    isSetup = true; // -------------------------- box sizing -------------------------- //

    /**
     * Chrome & Safari measure the outer-width on style.width on border-box elems
     * IE11 & Firefox<29 measures the inner-width
     */

    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style.boxSizing = 'border-box';
    var body = document.body || document.documentElement;
    body.appendChild(div);
    var style = getStyle(div); // round value for browser zoom. desandro/masonry#928

    isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
    getSize.isBoxSizeOuter = isBoxSizeOuter;
    body.removeChild(div);
  } // -------------------------- getSize -------------------------- //


  function getSize(elem) {
    setup(); // use querySeletor if elem is string

    if (typeof elem == 'string') {
      elem = document.querySelector(elem);
    } // do not proceed on non-objects


    if (!elem || _typeof(elem) != 'object' || !elem.nodeType) {
      return;
    }

    var style = getStyle(elem); // if hidden, everything is 0

    if (style.display == 'none') {
      return getZeroSize();
    }

    var size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;
    var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box'; // get all measurements

    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      var value = style[measurement];
      var num = parseFloat(value); // any 'auto', 'medium' value will be 0

      size[measurement] = !isNaN(num) ? num : 0;
    }

    var paddingWidth = size.paddingLeft + size.paddingRight;
    var paddingHeight = size.paddingTop + size.paddingBottom;
    var marginWidth = size.marginLeft + size.marginRight;
    var marginHeight = size.marginTop + size.marginBottom;
    var borderWidth = size.borderLeftWidth + size.borderRightWidth;
    var borderHeight = size.borderTopWidth + size.borderBottomWidth;
    var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter; // overwrite width and height if we can get it from style

    var styleWidth = getStyleSize(style.width);

    if (styleWidth !== false) {
      size.width = styleWidth + ( // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
    }

    var styleHeight = getStyleSize(style.height);

    if (styleHeight !== false) {
      size.height = styleHeight + ( // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
    }

    size.innerWidth = size.width - (paddingWidth + borderWidth);
    size.innerHeight = size.height - (paddingHeight + borderHeight);
    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;
    return size;
  }

  return getSize;
});
/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */


(function (window, factory) {
  /*global define: false, module: false */
  'use strict'; // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('desandro-matches-selector/matches-selector', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }
})(window, function factory() {
  'use strict';

  var matchesMethod = function () {
    var ElemProto = window.Element.prototype; // check for the standard method name first

    if (ElemProto.matches) {
      return 'matches';
    } // check un-prefixed


    if (ElemProto.matchesSelector) {
      return 'matchesSelector';
    } // check vendor prefixes


    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    for (var i = 0; i < prefixes.length; i++) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';

      if (ElemProto[method]) {
        return method;
      }
    }
  }();

  return function matchesSelector(elem, selector) {
    return elem[matchesMethod](selector);
  };
});
/**
 * Fizzy UI utils v2.0.7
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */


(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('fizzy-ui-utils/utils', ['desandro-matches-selector/matches-selector'], function (matchesSelector) {
      return factory(window, matchesSelector);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('desandro-matches-selector'));
  } else {
    // browser global
    window.fizzyUIUtils = factory(window, window.matchesSelector);
  }
})(window, function factory(window, matchesSelector) {
  var utils = {}; // ----- extend ----- //
  // extends objects

  utils.extend = function (a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }

    return a;
  }; // ----- modulo ----- //


  utils.modulo = function (num, div) {
    return (num % div + div) % div;
  }; // ----- makeArray ----- //


  var arraySlice = Array.prototype.slice; // turn element or nodeList into an array

  utils.makeArray = function (obj) {
    if (Array.isArray(obj)) {
      // use object if already an array
      return obj;
    } // return empty array if undefined or null. #6


    if (obj === null || obj === undefined) {
      return [];
    }

    var isArrayLike = _typeof(obj) == 'object' && typeof obj.length == 'number';

    if (isArrayLike) {
      // convert nodeList to array
      return arraySlice.call(obj);
    } // array of single index


    return [obj];
  }; // ----- removeFrom ----- //


  utils.removeFrom = function (ary, obj) {
    var index = ary.indexOf(obj);

    if (index != -1) {
      ary.splice(index, 1);
    }
  }; // ----- getParent ----- //


  utils.getParent = function (elem, selector) {
    while (elem.parentNode && elem != document.body) {
      elem = elem.parentNode;

      if (matchesSelector(elem, selector)) {
        return elem;
      }
    }
  }; // ----- getQueryElement ----- //
  // use element as selector string


  utils.getQueryElement = function (elem) {
    if (typeof elem == 'string') {
      return document.querySelector(elem);
    }

    return elem;
  }; // ----- handleEvent ----- //
  // enable .ontype to trigger from .addEventListener( elem, 'type' )


  utils.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  }; // ----- filterFindElements ----- //


  utils.filterFindElements = function (elems, selector) {
    // make array of elems
    elems = utils.makeArray(elems);
    var ffElems = [];
    elems.forEach(function (elem) {
      // check that elem is an actual element
      if (!(elem instanceof HTMLElement)) {
        return;
      } // add elem if no selector


      if (!selector) {
        ffElems.push(elem);
        return;
      } // filter & find items if we have a selector
      // filter


      if (matchesSelector(elem, selector)) {
        ffElems.push(elem);
      } // find children


      var childElems = elem.querySelectorAll(selector); // concat childElems to filterFound array

      for (var i = 0; i < childElems.length; i++) {
        ffElems.push(childElems[i]);
      }
    });
    return ffElems;
  }; // ----- debounceMethod ----- //


  utils.debounceMethod = function (_class, methodName, threshold) {
    threshold = threshold || 100; // original method

    var method = _class.prototype[methodName];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[methodName] = function () {
      var timeout = this[timeoutName];
      clearTimeout(timeout);
      var args = arguments;

      var _this = this;

      this[timeoutName] = setTimeout(function () {
        method.apply(_this, args);
        delete _this[timeoutName];
      }, threshold);
    };
  }; // ----- docReady ----- //


  utils.docReady = function (callback) {
    var readyState = document.readyState;

    if (readyState == 'complete' || readyState == 'interactive') {
      // do async to allow for other scripts to run. metafizzy/flickity#441
      setTimeout(callback);
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }; // ----- htmlInit ----- //
  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/


  utils.toDashed = function (str) {
    return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via [data-namespace] or .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-options
   */

  utils.htmlInit = function (WidgetClass, namespace) {
    utils.docReady(function () {
      var dashedNamespace = utils.toDashed(namespace);
      var dataAttr = 'data-' + dashedNamespace;
      var dataAttrElems = document.querySelectorAll('[' + dataAttr + ']');
      var jsDashElems = document.querySelectorAll('.js-' + dashedNamespace);
      var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
      var dataOptionsAttr = dataAttr + '-options';
      var jQuery = window.jQuery;
      elems.forEach(function (elem) {
        var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
        var options;

        try {
          options = attr && JSON.parse(attr);
        } catch (error) {
          // log error, do not initialize
          if (console) {
            console.error('Error parsing ' + dataAttr + ' on ' + elem.className + ': ' + error);
          }

          return;
        } // initialize


        var instance = new WidgetClass(elem, options); // make available via $().data('namespace')

        if (jQuery) {
          jQuery.data(elem, namespace, instance);
        }
      });
    });
  }; // -----  ----- //


  return utils;
}); // Flickity.Cell


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/cell', ['get-size/get-size'], function (getSize) {
      return factory(window, getSize);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('get-size'));
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Cell = factory(window, window.getSize);
  }
})(window, function factory(window, getSize) {
  function Cell(elem, parent) {
    this.element = elem;
    this.parent = parent;
    this.create();
  }

  var proto = Cell.prototype;

  proto.create = function () {
    this.element.style.position = 'absolute';
    this.element.setAttribute('aria-hidden', 'true');
    this.x = 0;
    this.shift = 0;
  };

  proto.destroy = function () {
    // reset style
    this.unselect();
    this.element.style.position = '';
    var side = this.parent.originSide;
    this.element.style[side] = '';
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
  };

  proto.setPosition = function (x) {
    this.x = x;
    this.updateTarget();
    this.renderPosition(x);
  }; // setDefaultTarget v1 method, backwards compatibility, remove in v3


  proto.updateTarget = proto.setDefaultTarget = function () {
    var marginProperty = this.parent.originSide == 'left' ? 'marginLeft' : 'marginRight';
    this.target = this.x + this.size[marginProperty] + this.size.width * this.parent.cellAlign;
  };

  proto.renderPosition = function (x) {
    // render position of cell with in slider
    var side = this.parent.originSide;
    this.element.style[side] = this.parent.getPositionValue(x);
  };

  proto.select = function () {
    this.element.classList.add('is-selected');
    this.element.removeAttribute('aria-hidden');
  };

  proto.unselect = function () {
    this.element.classList.remove('is-selected');
    this.element.setAttribute('aria-hidden', 'true');
  };
  /**
   * @param {Integer} factor - 0, 1, or -1
  **/


  proto.wrapShift = function (shift) {
    this.shift = shift;
    this.renderPosition(this.x + this.parent.slideableWidth * shift);
  };

  proto.remove = function () {
    this.element.parentNode.removeChild(this.element);
  };

  return Cell;
}); // slide


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/slide', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.Slide = factory();
  }
})(window, function factory() {
  'use strict';

  function Slide(parent) {
    this.parent = parent;
    this.isOriginLeft = parent.originSide == 'left';
    this.cells = [];
    this.outerWidth = 0;
    this.height = 0;
  }

  var proto = Slide.prototype;

  proto.addCell = function (cell) {
    this.cells.push(cell);
    this.outerWidth += cell.size.outerWidth;
    this.height = Math.max(cell.size.outerHeight, this.height); // first cell stuff

    if (this.cells.length == 1) {
      this.x = cell.x; // x comes from first cell

      var beginMargin = this.isOriginLeft ? 'marginLeft' : 'marginRight';
      this.firstMargin = cell.size[beginMargin];
    }
  };

  proto.updateTarget = function () {
    var endMargin = this.isOriginLeft ? 'marginRight' : 'marginLeft';
    var lastCell = this.getLastCell();
    var lastMargin = lastCell ? lastCell.size[endMargin] : 0;
    var slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
    this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
  };

  proto.getLastCell = function () {
    return this.cells[this.cells.length - 1];
  };

  proto.select = function () {
    this.cells.forEach(function (cell) {
      cell.select();
    });
  };

  proto.unselect = function () {
    this.cells.forEach(function (cell) {
      cell.unselect();
    });
  };

  proto.getCellElements = function () {
    return this.cells.map(function (cell) {
      return cell.element;
    });
  };

  return Slide;
}); // animate


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/animate', ['fizzy-ui-utils/utils'], function (utils) {
      return factory(window, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('fizzy-ui-utils'));
  } else {
    // browser global
    window.Flickity = window.Flickity || {};
    window.Flickity.animatePrototype = factory(window, window.fizzyUIUtils);
  }
})(window, function factory(window, utils) {
  // -------------------------- animate -------------------------- //
  var proto = {};

  proto.startAnimation = function () {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    this.restingFrames = 0;
    this.animate();
  };

  proto.animate = function () {
    this.applyDragForce();
    this.applySelectedAttraction();
    var previousX = this.x;
    this.integratePhysics();
    this.positionSlider();
    this.settle(previousX); // animate next frame

    if (this.isAnimating) {
      var _this = this;

      requestAnimationFrame(function animateFrame() {
        _this.animate();
      });
    }
  };

  proto.positionSlider = function () {
    var x = this.x; // wrap position around

    if (this.options.wrapAround && this.cells.length > 1) {
      x = utils.modulo(x, this.slideableWidth);
      x = x - this.slideableWidth;
      this.shiftWrapCells(x);
    }

    this.setTranslateX(x, this.isAnimating);
    this.dispatchScrollEvent();
  };

  proto.setTranslateX = function (x, is3d) {
    x += this.cursorPosition; // reverse if right-to-left and using transform

    x = this.options.rightToLeft ? -x : x;
    var translateX = this.getPositionValue(x); // use 3D tranforms for hardware acceleration on iOS
    // but use 2D when settled, for better font-rendering

    this.slider.style.transform = is3d ? 'translate3d(' + translateX + ',0,0)' : 'translateX(' + translateX + ')';
  };

  proto.dispatchScrollEvent = function () {
    var firstSlide = this.slides[0];

    if (!firstSlide) {
      return;
    }

    var positionX = -this.x - firstSlide.target;
    var progress = positionX / this.slidesWidth;
    this.dispatchEvent('scroll', null, [progress, positionX]);
  };

  proto.positionSliderAtSelected = function () {
    if (!this.cells.length) {
      return;
    }

    this.x = -this.selectedSlide.target;
    this.velocity = 0; // stop wobble

    this.positionSlider();
  };

  proto.getPositionValue = function (position) {
    if (this.options.percentPosition) {
      // percent position, round to 2 digits, like 12.34%
      return Math.round(position / this.size.innerWidth * 10000) * 0.01 + '%';
    } else {
      // pixel positioning
      return Math.round(position) + 'px';
    }
  };

  proto.settle = function (previousX) {
    // keep track of frames where x hasn't moved
    if (!this.isPointerDown && Math.round(this.x * 100) == Math.round(previousX * 100)) {
      this.restingFrames++;
    } // stop animating if resting for 3 or more frames


    if (this.restingFrames > 2) {
      this.isAnimating = false;
      delete this.isFreeScrolling; // render position with translateX when settled

      this.positionSlider();
      this.dispatchEvent('settle', null, [this.selectedIndex]);
    }
  };

  proto.shiftWrapCells = function (x) {
    // shift before cells
    var beforeGap = this.cursorPosition + x;

    this._shiftCells(this.beforeShiftCells, beforeGap, -1); // shift after cells


    var afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);

    this._shiftCells(this.afterShiftCells, afterGap, 1);
  };

  proto._shiftCells = function (cells, gap, shift) {
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var cellShift = gap > 0 ? shift : 0;
      cell.wrapShift(cellShift);
      gap -= cell.size.outerWidth;
    }
  };

  proto._unshiftCells = function (cells) {
    if (!cells || !cells.length) {
      return;
    }

    for (var i = 0; i < cells.length; i++) {
      cells[i].wrapShift(0);
    }
  }; // -------------------------- physics -------------------------- //


  proto.integratePhysics = function () {
    this.x += this.velocity;
    this.velocity *= this.getFrictionFactor();
  };

  proto.applyForce = function (force) {
    this.velocity += force;
  };

  proto.getFrictionFactor = function () {
    return 1 - this.options[this.isFreeScrolling ? 'freeScrollFriction' : 'friction'];
  };

  proto.getRestingPosition = function () {
    // my thanks to Steven Wittens, who simplified this math greatly
    return this.x + this.velocity / (1 - this.getFrictionFactor());
  };

  proto.applyDragForce = function () {
    if (!this.isDraggable || !this.isPointerDown) {
      return;
    } // change the position to drag position by applying force


    var dragVelocity = this.dragX - this.x;
    var dragForce = dragVelocity - this.velocity;
    this.applyForce(dragForce);
  };

  proto.applySelectedAttraction = function () {
    // do not attract if pointer down or no slides
    var dragDown = this.isDraggable && this.isPointerDown;

    if (dragDown || this.isFreeScrolling || !this.slides.length) {
      return;
    }

    var distance = this.selectedSlide.target * -1 - this.x;
    var force = distance * this.options.selectedAttraction;
    this.applyForce(force);
  };

  return proto;
}); // Flickity main


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/flickity', ['ev-emitter/ev-emitter', 'get-size/get-size', 'fizzy-ui-utils/utils', './cell', './slide', './animate'], function (EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
      return factory(window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('ev-emitter'), require('get-size'), require('fizzy-ui-utils'), require('./cell'), require('./slide'), require('./animate'));
  } else {
    // browser global
    var _Flickity = window.Flickity;
    window.Flickity = factory(window, window.EvEmitter, window.getSize, window.fizzyUIUtils, _Flickity.Cell, _Flickity.Slide, _Flickity.animatePrototype);
  }
})(window, function factory(window, EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
  // vars
  var jQuery = window.jQuery;
  var getComputedStyle = window.getComputedStyle;
  var console = window.console;

  function moveElements(elems, toElem) {
    elems = utils.makeArray(elems);

    while (elems.length) {
      toElem.appendChild(elems.shift());
    }
  } // -------------------------- Flickity -------------------------- //
  // globally unique identifiers


  var GUID = 0; // internal store of all Flickity intances

  var instances = {};

  function Flickity(element, options) {
    var queryElement = utils.getQueryElement(element);

    if (!queryElement) {
      if (console) {
        console.error('Bad element for Flickity: ' + (queryElement || element));
      }

      return;
    }

    this.element = queryElement; // do not initialize twice on same element

    if (this.element.flickityGUID) {
      var instance = instances[this.element.flickityGUID];
      instance.option(options);
      return instance;
    } // add jQuery


    if (jQuery) {
      this.$element = jQuery(this.element);
    } // options


    this.options = utils.extend({}, this.constructor.defaults);
    this.option(options); // kick things off

    this._create();
  }

  Flickity.defaults = {
    accessibility: true,
    // adaptiveHeight: false,
    cellAlign: 'center',
    // cellSelector: undefined,
    // contain: false,
    freeScrollFriction: 0.075,
    // friction when free-scrolling
    friction: 0.28,
    // friction when selecting
    namespaceJQueryEvents: true,
    // initialIndex: 0,
    percentPosition: true,
    resize: true,
    selectedAttraction: 0.025,
    setGallerySize: true // watchCSS: false,
    // wrapAround: false

  }; // hash of methods triggered on _create()

  Flickity.createMethods = [];
  var proto = Flickity.prototype; // inherit EventEmitter

  utils.extend(proto, EvEmitter.prototype);

  proto._create = function () {
    // add id for Flickity.data
    var id = this.guid = ++GUID;
    this.element.flickityGUID = id; // expando

    instances[id] = this; // associate via id
    // initial properties

    this.selectedIndex = 0; // how many frames slider has been in same position

    this.restingFrames = 0; // initial physics properties

    this.x = 0;
    this.velocity = 0;
    this.originSide = this.options.rightToLeft ? 'right' : 'left'; // create viewport & slider

    this.viewport = document.createElement('div');
    this.viewport.className = 'flickity-viewport';

    this._createSlider();

    if (this.options.resize || this.options.watchCSS) {
      window.addEventListener('resize', this);
    } // add listeners from on option


    for (var eventName in this.options.on) {
      var listener = this.options.on[eventName];
      this.on(eventName, listener);
    }

    Flickity.createMethods.forEach(function (method) {
      this[method]();
    }, this);

    if (this.options.watchCSS) {
      this.watchCSS();
    } else {
      this.activate();
    }
  };
  /**
   * set options
   * @param {Object} opts
   */


  proto.option = function (opts) {
    utils.extend(this.options, opts);
  };

  proto.activate = function () {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.element.classList.add('flickity-enabled');

    if (this.options.rightToLeft) {
      this.element.classList.add('flickity-rtl');
    }

    this.getSize(); // move initial cell elements so they can be loaded as cells

    var cellElems = this._filterFindCellElements(this.element.children);

    moveElements(cellElems, this.slider);
    this.viewport.appendChild(this.slider);
    this.element.appendChild(this.viewport); // get cells from children

    this.reloadCells();

    if (this.options.accessibility) {
      // allow element to focusable
      this.element.tabIndex = 0; // listen for key presses

      this.element.addEventListener('keydown', this);
    }

    this.emitEvent('activate');
    this.selectInitialIndex(); // flag for initial activation, for using initialIndex

    this.isInitActivated = true; // ready event. #493

    this.dispatchEvent('ready');
  }; // slider positions the cells


  proto._createSlider = function () {
    // slider element does all the positioning
    var slider = document.createElement('div');
    slider.className = 'flickity-slider';
    slider.style[this.originSide] = 0;
    this.slider = slider;
  };

  proto._filterFindCellElements = function (elems) {
    return utils.filterFindElements(elems, this.options.cellSelector);
  }; // goes through all children


  proto.reloadCells = function () {
    // collection of item elements
    this.cells = this._makeCells(this.slider.children);
    this.positionCells();

    this._getWrapShiftCells();

    this.setGallerySize();
  };
  /**
   * turn elements into Flickity.Cells
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - collection of new Flickity Cells
   */


  proto._makeCells = function (elems) {
    var cellElems = this._filterFindCellElements(elems); // create new Flickity for collection


    var cells = cellElems.map(function (cellElem) {
      return new Cell(cellElem, this);
    }, this);
    return cells;
  };

  proto.getLastCell = function () {
    return this.cells[this.cells.length - 1];
  };

  proto.getLastSlide = function () {
    return this.slides[this.slides.length - 1];
  }; // positions all cells


  proto.positionCells = function () {
    // size all cells
    this._sizeCells(this.cells); // position all cells


    this._positionCells(0);
  };
  /**
   * position certain cells
   * @param {Integer} index - which cell to start with
   */


  proto._positionCells = function (index) {
    index = index || 0; // also measure maxCellHeight
    // start 0 if positioning all cells

    this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
    var cellX = 0; // get cellX

    if (index > 0) {
      var startCell = this.cells[index - 1];
      cellX = startCell.x + startCell.size.outerWidth;
    }

    var len = this.cells.length;

    for (var i = index; i < len; i++) {
      var cell = this.cells[i];
      cell.setPosition(cellX);
      cellX += cell.size.outerWidth;
      this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
    } // keep track of cellX for wrap-around


    this.slideableWidth = cellX; // slides

    this.updateSlides(); // contain slides target

    this._containSlides(); // update slidesWidth


    this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
  };
  /**
   * cell.getSize() on multiple cells
   * @param {Array} cells
   */


  proto._sizeCells = function (cells) {
    cells.forEach(function (cell) {
      cell.getSize();
    });
  }; // --------------------------  -------------------------- //


  proto.updateSlides = function () {
    this.slides = [];

    if (!this.cells.length) {
      return;
    }

    var slide = new Slide(this);
    this.slides.push(slide);
    var isOriginLeft = this.originSide == 'left';
    var nextMargin = isOriginLeft ? 'marginRight' : 'marginLeft';

    var canCellFit = this._getCanCellFit();

    this.cells.forEach(function (cell, i) {
      // just add cell if first cell in slide
      if (!slide.cells.length) {
        slide.addCell(cell);
        return;
      }

      var slideWidth = slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);

      if (canCellFit.call(this, i, slideWidth)) {
        slide.addCell(cell);
      } else {
        // doesn't fit, new slide
        slide.updateTarget();
        slide = new Slide(this);
        this.slides.push(slide);
        slide.addCell(cell);
      }
    }, this); // last slide

    slide.updateTarget(); // update .selectedSlide

    this.updateSelectedSlide();
  };

  proto._getCanCellFit = function () {
    var groupCells = this.options.groupCells;

    if (!groupCells) {
      return function () {
        return false;
      };
    } else if (typeof groupCells == 'number') {
      // group by number. 3 -> [0,1,2], [3,4,5], ...
      var number = parseInt(groupCells, 10);
      return function (i) {
        return i % number !== 0;
      };
    } // default, group by width of slide
    // parse '75%


    var percentMatch = typeof groupCells == 'string' && groupCells.match(/^(\d+)%$/);
    var percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
    return function (i, slideWidth) {
      return slideWidth <= (this.size.innerWidth + 1) * percent;
    };
  }; // alias _init for jQuery plugin .flickity()


  proto._init = proto.reposition = function () {
    this.positionCells();
    this.positionSliderAtSelected();
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
    this.setCellAlign();
    this.cursorPosition = this.size.innerWidth * this.cellAlign;
  };

  var cellAlignShorthands = {
    // cell align, then based on origin side
    center: {
      left: 0.5,
      right: 0.5
    },
    left: {
      left: 0,
      right: 1
    },
    right: {
      right: 0,
      left: 1
    }
  };

  proto.setCellAlign = function () {
    var shorthand = cellAlignShorthands[this.options.cellAlign];
    this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
  };

  proto.setGallerySize = function () {
    if (this.options.setGallerySize) {
      var height = this.options.adaptiveHeight && this.selectedSlide ? this.selectedSlide.height : this.maxCellHeight;
      this.viewport.style.height = height + 'px';
    }
  };

  proto._getWrapShiftCells = function () {
    // only for wrap-around
    if (!this.options.wrapAround) {
      return;
    } // unshift previous cells


    this._unshiftCells(this.beforeShiftCells);

    this._unshiftCells(this.afterShiftCells); // get before cells
    // initial gap


    var gapX = this.cursorPosition;
    var cellIndex = this.cells.length - 1;
    this.beforeShiftCells = this._getGapCells(gapX, cellIndex, -1); // get after cells
    // ending gap between last cell and end of gallery viewport

    gapX = this.size.innerWidth - this.cursorPosition; // start cloning at first cell, working forwards

    this.afterShiftCells = this._getGapCells(gapX, 0, 1);
  };

  proto._getGapCells = function (gapX, cellIndex, increment) {
    // keep adding cells until the cover the initial gap
    var cells = [];

    while (gapX > 0) {
      var cell = this.cells[cellIndex];

      if (!cell) {
        break;
      }

      cells.push(cell);
      cellIndex += increment;
      gapX -= cell.size.outerWidth;
    }

    return cells;
  }; // ----- contain ----- //
  // contain cell targets so no excess sliding


  proto._containSlides = function () {
    if (!this.options.contain || this.options.wrapAround || !this.cells.length) {
      return;
    }

    var isRightToLeft = this.options.rightToLeft;
    var beginMargin = isRightToLeft ? 'marginRight' : 'marginLeft';
    var endMargin = isRightToLeft ? 'marginLeft' : 'marginRight';
    var contentWidth = this.slideableWidth - this.getLastCell().size[endMargin]; // content is less than gallery size

    var isContentSmaller = contentWidth < this.size.innerWidth; // bounds

    var beginBound = this.cursorPosition + this.cells[0].size[beginMargin];
    var endBound = contentWidth - this.size.innerWidth * (1 - this.cellAlign); // contain each cell target

    this.slides.forEach(function (slide) {
      if (isContentSmaller) {
        // all cells fit inside gallery
        slide.target = contentWidth * this.cellAlign;
      } else {
        // contain to bounds
        slide.target = Math.max(slide.target, beginBound);
        slide.target = Math.min(slide.target, endBound);
      }
    }, this);
  }; // -----  ----- //

  /**
   * emits events via eventEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */


  proto.dispatchEvent = function (type, event, args) {
    var emitArgs = event ? [event].concat(args) : args;
    this.emitEvent(type, emitArgs);

    if (jQuery && this.$element) {
      // default trigger with type if no event
      type += this.options.namespaceJQueryEvents ? '.flickity' : '';
      var $event = type;

      if (event) {
        // create jQuery event
        var jQEvent = jQuery.Event(event);
        jQEvent.type = type;
        $event = jQEvent;
      }

      this.$element.trigger($event, args);
    }
  }; // -------------------------- select -------------------------- //

  /**
   * @param {Integer} index - index of the slide
   * @param {Boolean} isWrap - will wrap-around to last/first if at the end
   * @param {Boolean} isInstant - will immediately set position at selected cell
   */


  proto.select = function (index, isWrap, isInstant) {
    if (!this.isActive) {
      return;
    }

    index = parseInt(index, 10);

    this._wrapSelect(index);

    if (this.options.wrapAround || isWrap) {
      index = utils.modulo(index, this.slides.length);
    } // bail if invalid index


    if (!this.slides[index]) {
      return;
    }

    var prevIndex = this.selectedIndex;
    this.selectedIndex = index;
    this.updateSelectedSlide();

    if (isInstant) {
      this.positionSliderAtSelected();
    } else {
      this.startAnimation();
    }

    if (this.options.adaptiveHeight) {
      this.setGallerySize();
    } // events


    this.dispatchEvent('select', null, [index]); // change event if new index

    if (index != prevIndex) {
      this.dispatchEvent('change', null, [index]);
    } // old v1 event name, remove in v3


    this.dispatchEvent('cellSelect');
  }; // wraps position for wrapAround, to move to closest slide. #113


  proto._wrapSelect = function (index) {
    var len = this.slides.length;
    var isWrapping = this.options.wrapAround && len > 1;

    if (!isWrapping) {
      return index;
    }

    var wrapIndex = utils.modulo(index, len); // go to shortest

    var delta = Math.abs(wrapIndex - this.selectedIndex);
    var backWrapDelta = Math.abs(wrapIndex + len - this.selectedIndex);
    var forewardWrapDelta = Math.abs(wrapIndex - len - this.selectedIndex);

    if (!this.isDragSelect && backWrapDelta < delta) {
      index += len;
    } else if (!this.isDragSelect && forewardWrapDelta < delta) {
      index -= len;
    } // wrap position so slider is within normal area


    if (index < 0) {
      this.x -= this.slideableWidth;
    } else if (index >= len) {
      this.x += this.slideableWidth;
    }
  };

  proto.previous = function (isWrap, isInstant) {
    this.select(this.selectedIndex - 1, isWrap, isInstant);
  };

  proto.next = function (isWrap, isInstant) {
    this.select(this.selectedIndex + 1, isWrap, isInstant);
  };

  proto.updateSelectedSlide = function () {
    var slide = this.slides[this.selectedIndex]; // selectedIndex could be outside of slides, if triggered before resize()

    if (!slide) {
      return;
    } // unselect previous selected slide


    this.unselectSelectedSlide(); // update new selected slide

    this.selectedSlide = slide;
    slide.select();
    this.selectedCells = slide.cells;
    this.selectedElements = slide.getCellElements(); // HACK: selectedCell & selectedElement is first cell in slide, backwards compatibility
    // Remove in v3?

    this.selectedCell = slide.cells[0];
    this.selectedElement = this.selectedElements[0];
  };

  proto.unselectSelectedSlide = function () {
    if (this.selectedSlide) {
      this.selectedSlide.unselect();
    }
  };

  proto.selectInitialIndex = function () {
    var initialIndex = this.options.initialIndex; // already activated, select previous selectedIndex

    if (this.isInitActivated) {
      this.select(this.selectedIndex, false, true);
      return;
    } // select with selector string


    if (initialIndex && typeof initialIndex == 'string') {
      var cell = this.queryCell(initialIndex);

      if (cell) {
        this.selectCell(initialIndex, false, true);
        return;
      }
    }

    var index = 0; // select with number

    if (initialIndex && this.slides[initialIndex]) {
      index = initialIndex;
    } // select instantly


    this.select(index, false, true);
  };
  /**
   * select slide from number or cell element
   * @param {Element or Number} elem
   */


  proto.selectCell = function (value, isWrap, isInstant) {
    // get cell
    var cell = this.queryCell(value);

    if (!cell) {
      return;
    }

    var index = this.getCellSlideIndex(cell);
    this.select(index, isWrap, isInstant);
  };

  proto.getCellSlideIndex = function (cell) {
    // get index of slides that has cell
    for (var i = 0; i < this.slides.length; i++) {
      var slide = this.slides[i];
      var index = slide.cells.indexOf(cell);

      if (index != -1) {
        return i;
      }
    }
  }; // -------------------------- get cells -------------------------- //

  /**
   * get Flickity.Cell, given an Element
   * @param {Element} elem
   * @returns {Flickity.Cell} item
   */


  proto.getCell = function (elem) {
    // loop through cells to get the one that matches
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];

      if (cell.element == elem) {
        return cell;
      }
    }
  };
  /**
   * get collection of Flickity.Cells, given Elements
   * @param {Element, Array, NodeList} elems
   * @returns {Array} cells - Flickity.Cells
   */


  proto.getCells = function (elems) {
    elems = utils.makeArray(elems);
    var cells = [];
    elems.forEach(function (elem) {
      var cell = this.getCell(elem);

      if (cell) {
        cells.push(cell);
      }
    }, this);
    return cells;
  };
  /**
   * get cell elements
   * @returns {Array} cellElems
   */


  proto.getCellElements = function () {
    return this.cells.map(function (cell) {
      return cell.element;
    });
  };
  /**
   * get parent cell from an element
   * @param {Element} elem
   * @returns {Flickit.Cell} cell
   */


  proto.getParentCell = function (elem) {
    // first check if elem is cell
    var cell = this.getCell(elem);

    if (cell) {
      return cell;
    } // try to get parent cell elem


    elem = utils.getParent(elem, '.flickity-slider > *');
    return this.getCell(elem);
  };
  /**
   * get cells adjacent to a slide
   * @param {Integer} adjCount - number of adjacent slides
   * @param {Integer} index - index of slide to start
   * @returns {Array} cells - array of Flickity.Cells
   */


  proto.getAdjacentCellElements = function (adjCount, index) {
    if (!adjCount) {
      return this.selectedSlide.getCellElements();
    }

    index = index === undefined ? this.selectedIndex : index;
    var len = this.slides.length;

    if (1 + adjCount * 2 >= len) {
      return this.getCellElements();
    }

    var cellElems = [];

    for (var i = index - adjCount; i <= index + adjCount; i++) {
      var slideIndex = this.options.wrapAround ? utils.modulo(i, len) : i;
      var slide = this.slides[slideIndex];

      if (slide) {
        cellElems = cellElems.concat(slide.getCellElements());
      }
    }

    return cellElems;
  };
  /**
   * select slide from number or cell element
   * @param {Element, Selector String, or Number} selector
   */


  proto.queryCell = function (selector) {
    if (typeof selector == 'number') {
      // use number as index
      return this.cells[selector];
    }

    if (typeof selector == 'string') {
      // do not select invalid selectors from hash: #123, #/. #791
      if (selector.match(/^[#\.]?[\d\/]/)) {
        return;
      } // use string as selector, get element


      selector = this.element.querySelector(selector);
    } // get cell from element


    return this.getCell(selector);
  }; // -------------------------- events -------------------------- //


  proto.uiChange = function () {
    this.emitEvent('uiChange');
  }; // keep focus on element when child UI elements are clicked


  proto.childUIPointerDown = function (event) {
    // HACK iOS does not allow touch events to bubble up?!
    if (event.type != 'touchstart') {
      event.preventDefault();
    }

    this.focus();
  }; // ----- resize ----- //


  proto.onresize = function () {
    this.watchCSS();
    this.resize();
  };

  utils.debounceMethod(Flickity, 'onresize', 150);

  proto.resize = function () {
    if (!this.isActive) {
      return;
    }

    this.getSize(); // wrap values

    if (this.options.wrapAround) {
      this.x = utils.modulo(this.x, this.slideableWidth);
    }

    this.positionCells();

    this._getWrapShiftCells();

    this.setGallerySize();
    this.emitEvent('resize'); // update selected index for group slides, instant
    // TODO: position can be lost between groups of various numbers

    var selectedElement = this.selectedElements && this.selectedElements[0];
    this.selectCell(selectedElement, false, true);
  }; // watches the :after property, activates/deactivates


  proto.watchCSS = function () {
    var watchOption = this.options.watchCSS;

    if (!watchOption) {
      return;
    }

    var afterContent = getComputedStyle(this.element, ':after').content; // activate if :after { content: 'flickity' }

    if (afterContent.indexOf('flickity') != -1) {
      this.activate();
    } else {
      this.deactivate();
    }
  }; // ----- keydown ----- //
  // go previous/next if left/right keys pressed


  proto.onkeydown = function (event) {
    // only work if element is in focus
    var isNotFocused = document.activeElement && document.activeElement != this.element;

    if (!this.options.accessibility || isNotFocused) {
      return;
    }

    var handler = Flickity.keyboardHandlers[event.keyCode];

    if (handler) {
      handler.call(this);
    }
  };

  Flickity.keyboardHandlers = {
    // left arrow
    37: function _() {
      var leftMethod = this.options.rightToLeft ? 'next' : 'previous';
      this.uiChange();
      this[leftMethod]();
    },
    // right arrow
    39: function _() {
      var rightMethod = this.options.rightToLeft ? 'previous' : 'next';
      this.uiChange();
      this[rightMethod]();
    }
  }; // ----- focus ----- //

  proto.focus = function () {
    // TODO remove scrollTo once focus options gets more support
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#Browser_compatibility
    var prevScrollY = window.pageYOffset;
    this.element.focus({
      preventScroll: true
    }); // hack to fix scroll jump after focus, #76

    if (window.pageYOffset != prevScrollY) {
      window.scrollTo(window.pageXOffset, prevScrollY);
    }
  }; // -------------------------- destroy -------------------------- //
  // deactivate all Flickity functionality, but keep stuff available


  proto.deactivate = function () {
    if (!this.isActive) {
      return;
    }

    this.element.classList.remove('flickity-enabled');
    this.element.classList.remove('flickity-rtl');
    this.unselectSelectedSlide(); // destroy cells

    this.cells.forEach(function (cell) {
      cell.destroy();
    });
    this.element.removeChild(this.viewport); // move child elements back into element

    moveElements(this.slider.children, this.element);

    if (this.options.accessibility) {
      this.element.removeAttribute('tabIndex');
      this.element.removeEventListener('keydown', this);
    } // set flags


    this.isActive = false;
    this.emitEvent('deactivate');
  };

  proto.destroy = function () {
    this.deactivate();
    window.removeEventListener('resize', this);
    this.allOff();
    this.emitEvent('destroy');

    if (jQuery && this.$element) {
      jQuery.removeData(this.element, 'flickity');
    }

    delete this.element.flickityGUID;
    delete instances[this.guid];
  }; // -------------------------- prototype -------------------------- //


  utils.extend(proto, animatePrototype); // -------------------------- extras -------------------------- //

  /**
   * get Flickity instance from element
   * @param {Element} elem
   * @returns {Flickity}
   */

  Flickity.data = function (elem) {
    elem = utils.getQueryElement(elem);
    var id = elem && elem.flickityGUID;
    return id && instances[id];
  };

  utils.htmlInit(Flickity, 'flickity');

  if (jQuery && jQuery.bridget) {
    jQuery.bridget('flickity', Flickity);
  } // set internal jQuery, for Webpack + jQuery v3, #478


  Flickity.setJQuery = function (jq) {
    jQuery = jq;
  };

  Flickity.Cell = Cell;
  Flickity.Slide = Slide;
  return Flickity;
});
/*!
 * Unipointer v2.3.0
 * base class for doing one thing with pointer event
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*global define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('unipointer/unipointer', ['ev-emitter/ev-emitter'], function (EvEmitter) {
      return factory(window, EvEmitter);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('ev-emitter'));
  } else {
    // browser global
    window.Unipointer = factory(window, window.EvEmitter);
  }
})(window, function factory(window, EvEmitter) {
  function noop() {}

  function Unipointer() {} // inherit EvEmitter


  var proto = Unipointer.prototype = Object.create(EvEmitter.prototype);

  proto.bindStartEvent = function (elem) {
    this._bindStartEvent(elem, true);
  };

  proto.unbindStartEvent = function (elem) {
    this._bindStartEvent(elem, false);
  };
  /**
   * Add or remove start event
   * @param {Boolean} isAdd - remove if falsey
   */


  proto._bindStartEvent = function (elem, isAdd) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd;
    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener'; // default to mouse events

    var startEvent = 'mousedown';

    if (window.PointerEvent) {
      // Pointer Events
      startEvent = 'pointerdown';
    } else if ('ontouchstart' in window) {
      // Touch Events. iOS Safari
      startEvent = 'touchstart';
    }

    elem[bindMethod](startEvent, this);
  }; // trigger handler methods for events


  proto.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  }; // returns the touch that we're keeping track of


  proto.getTouch = function (touches) {
    for (var i = 0; i < touches.length; i++) {
      var touch = touches[i];

      if (touch.identifier == this.pointerIdentifier) {
        return touch;
      }
    }
  }; // ----- start event ----- //


  proto.onmousedown = function (event) {
    // dismiss clicks from right or middle buttons
    var button = event.button;

    if (button && button !== 0 && button !== 1) {
      return;
    }

    this._pointerDown(event, event);
  };

  proto.ontouchstart = function (event) {
    this._pointerDown(event, event.changedTouches[0]);
  };

  proto.onpointerdown = function (event) {
    this._pointerDown(event, event);
  };
  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */


  proto._pointerDown = function (event, pointer) {
    // dismiss right click and other pointers
    // button = 0 is okay, 1-4 not
    if (event.button || this.isPointerDown) {
      return;
    }

    this.isPointerDown = true; // save pointer identifier to match up touch events

    this.pointerIdentifier = pointer.pointerId !== undefined ? // pointerId for pointer events, touch.indentifier for touch events
    pointer.pointerId : pointer.identifier;
    this.pointerDown(event, pointer);
  };

  proto.pointerDown = function (event, pointer) {
    this._bindPostStartEvents(event);

    this.emitEvent('pointerDown', [event, pointer]);
  }; // hash of events to be bound after start event


  var postStartEvents = {
    mousedown: ['mousemove', 'mouseup'],
    touchstart: ['touchmove', 'touchend', 'touchcancel'],
    pointerdown: ['pointermove', 'pointerup', 'pointercancel']
  };

  proto._bindPostStartEvents = function (event) {
    if (!event) {
      return;
    } // get proper events to match start event


    var events = postStartEvents[event.type]; // bind events to node

    events.forEach(function (eventName) {
      window.addEventListener(eventName, this);
    }, this); // save these arguments

    this._boundPointerEvents = events;
  };

  proto._unbindPostStartEvents = function () {
    // check for _boundEvents, in case dragEnd triggered twice (old IE8 bug)
    if (!this._boundPointerEvents) {
      return;
    }

    this._boundPointerEvents.forEach(function (eventName) {
      window.removeEventListener(eventName, this);
    }, this);

    delete this._boundPointerEvents;
  }; // ----- move event ----- //


  proto.onmousemove = function (event) {
    this._pointerMove(event, event);
  };

  proto.onpointermove = function (event) {
    if (event.pointerId == this.pointerIdentifier) {
      this._pointerMove(event, event);
    }
  };

  proto.ontouchmove = function (event) {
    var touch = this.getTouch(event.changedTouches);

    if (touch) {
      this._pointerMove(event, touch);
    }
  };
  /**
   * pointer move
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */


  proto._pointerMove = function (event, pointer) {
    this.pointerMove(event, pointer);
  }; // public


  proto.pointerMove = function (event, pointer) {
    this.emitEvent('pointerMove', [event, pointer]);
  }; // ----- end event ----- //


  proto.onmouseup = function (event) {
    this._pointerUp(event, event);
  };

  proto.onpointerup = function (event) {
    if (event.pointerId == this.pointerIdentifier) {
      this._pointerUp(event, event);
    }
  };

  proto.ontouchend = function (event) {
    var touch = this.getTouch(event.changedTouches);

    if (touch) {
      this._pointerUp(event, touch);
    }
  };
  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */


  proto._pointerUp = function (event, pointer) {
    this._pointerDone();

    this.pointerUp(event, pointer);
  }; // public


  proto.pointerUp = function (event, pointer) {
    this.emitEvent('pointerUp', [event, pointer]);
  }; // ----- pointer done ----- //
  // triggered on pointer up & pointer cancel


  proto._pointerDone = function () {
    this._pointerReset();

    this._unbindPostStartEvents();

    this.pointerDone();
  };

  proto._pointerReset = function () {
    // reset properties
    this.isPointerDown = false;
    delete this.pointerIdentifier;
  };

  proto.pointerDone = noop; // ----- pointer cancel ----- //

  proto.onpointercancel = function (event) {
    if (event.pointerId == this.pointerIdentifier) {
      this._pointerCancel(event, event);
    }
  };

  proto.ontouchcancel = function (event) {
    var touch = this.getTouch(event.changedTouches);

    if (touch) {
      this._pointerCancel(event, touch);
    }
  };
  /**
   * pointer cancel
   * @param {Event} event
   * @param {Event or Touch} pointer
   * @private
   */


  proto._pointerCancel = function (event, pointer) {
    this._pointerDone();

    this.pointerCancel(event, pointer);
  }; // public


  proto.pointerCancel = function (event, pointer) {
    this.emitEvent('pointerCancel', [event, pointer]);
  }; // -----  ----- //
  // utility function for getting x/y coords from event


  Unipointer.getPointerPoint = function (pointer) {
    return {
      x: pointer.pageX,
      y: pointer.pageY
    };
  }; // -----  ----- //


  return Unipointer;
});
/*!
 * Unidragger v2.3.0
 * Draggable base class
 * MIT license
 */

/*jshint browser: true, unused: true, undef: true, strict: true */


(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('unidragger/unidragger', ['unipointer/unipointer'], function (Unipointer) {
      return factory(window, Unipointer);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('unipointer'));
  } else {
    // browser global
    window.Unidragger = factory(window, window.Unipointer);
  }
})(window, function factory(window, Unipointer) {
  // -------------------------- Unidragger -------------------------- //
  function Unidragger() {} // inherit Unipointer & EvEmitter


  var proto = Unidragger.prototype = Object.create(Unipointer.prototype); // ----- bind start ----- //

  proto.bindHandles = function () {
    this._bindHandles(true);
  };

  proto.unbindHandles = function () {
    this._bindHandles(false);
  };
  /**
   * Add or remove start event
   * @param {Boolean} isAdd
   */


  proto._bindHandles = function (isAdd) {
    // munge isAdd, default to true
    isAdd = isAdd === undefined ? true : isAdd; // bind each handle

    var bindMethod = isAdd ? 'addEventListener' : 'removeEventListener';
    var touchAction = isAdd ? this._touchActionValue : '';

    for (var i = 0; i < this.handles.length; i++) {
      var handle = this.handles[i];

      this._bindStartEvent(handle, isAdd);

      handle[bindMethod]('click', this); // touch-action: none to override browser touch gestures. metafizzy/flickity#540

      if (window.PointerEvent) {
        handle.style.touchAction = touchAction;
      }
    }
  }; // prototype so it can be overwriteable by Flickity


  proto._touchActionValue = 'none'; // ----- start event ----- //

  /**
   * pointer start
   * @param {Event} event
   * @param {Event or Touch} pointer
   */

  proto.pointerDown = function (event, pointer) {
    var isOkay = this.okayPointerDown(event);

    if (!isOkay) {
      return;
    } // track start event position


    this.pointerDownPointer = pointer;
    event.preventDefault();
    this.pointerDownBlur(); // bind move and end events

    this._bindPostStartEvents(event);

    this.emitEvent('pointerDown', [event, pointer]);
  }; // nodes that have text fields


  var cursorNodes = {
    TEXTAREA: true,
    INPUT: true,
    SELECT: true,
    OPTION: true
  }; // input types that do not have text fields

  var clickTypes = {
    radio: true,
    checkbox: true,
    button: true,
    submit: true,
    image: true,
    file: true
  }; // dismiss inputs with text fields. flickity#403, flickity#404

  proto.okayPointerDown = function (event) {
    var isCursorNode = cursorNodes[event.target.nodeName];
    var isClickType = clickTypes[event.target.type];
    var isOkay = !isCursorNode || isClickType;

    if (!isOkay) {
      this._pointerReset();
    }

    return isOkay;
  }; // kludge to blur previously focused input


  proto.pointerDownBlur = function () {
    var focused = document.activeElement; // do not blur body for IE10, metafizzy/flickity#117

    var canBlur = focused && focused.blur && focused != document.body;

    if (canBlur) {
      focused.blur();
    }
  }; // ----- move event ----- //

  /**
   * drag move
   * @param {Event} event
   * @param {Event or Touch} pointer
   */


  proto.pointerMove = function (event, pointer) {
    var moveVector = this._dragPointerMove(event, pointer);

    this.emitEvent('pointerMove', [event, pointer, moveVector]);

    this._dragMove(event, pointer, moveVector);
  }; // base pointer move logic


  proto._dragPointerMove = function (event, pointer) {
    var moveVector = {
      x: pointer.pageX - this.pointerDownPointer.pageX,
      y: pointer.pageY - this.pointerDownPointer.pageY
    }; // start drag if pointer has moved far enough to start drag

    if (!this.isDragging && this.hasDragStarted(moveVector)) {
      this._dragStart(event, pointer);
    }

    return moveVector;
  }; // condition if pointer has moved far enough to start drag


  proto.hasDragStarted = function (moveVector) {
    return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
  }; // ----- end event ----- //

  /**
   * pointer up
   * @param {Event} event
   * @param {Event or Touch} pointer
   */


  proto.pointerUp = function (event, pointer) {
    this.emitEvent('pointerUp', [event, pointer]);

    this._dragPointerUp(event, pointer);
  };

  proto._dragPointerUp = function (event, pointer) {
    if (this.isDragging) {
      this._dragEnd(event, pointer);
    } else {
      // pointer didn't move enough for drag to start
      this._staticClick(event, pointer);
    }
  }; // -------------------------- drag -------------------------- //
  // dragStart


  proto._dragStart = function (event, pointer) {
    this.isDragging = true; // prevent clicks

    this.isPreventingClicks = true;
    this.dragStart(event, pointer);
  };

  proto.dragStart = function (event, pointer) {
    this.emitEvent('dragStart', [event, pointer]);
  }; // dragMove


  proto._dragMove = function (event, pointer, moveVector) {
    // do not drag if not dragging yet
    if (!this.isDragging) {
      return;
    }

    this.dragMove(event, pointer, moveVector);
  };

  proto.dragMove = function (event, pointer, moveVector) {
    event.preventDefault();
    this.emitEvent('dragMove', [event, pointer, moveVector]);
  }; // dragEnd


  proto._dragEnd = function (event, pointer) {
    // set flags
    this.isDragging = false; // re-enable clicking async

    setTimeout(function () {
      delete this.isPreventingClicks;
    }.bind(this));
    this.dragEnd(event, pointer);
  };

  proto.dragEnd = function (event, pointer) {
    this.emitEvent('dragEnd', [event, pointer]);
  }; // ----- onclick ----- //
  // handle all clicks and prevent clicks when dragging


  proto.onclick = function (event) {
    if (this.isPreventingClicks) {
      event.preventDefault();
    }
  }; // ----- staticClick ----- //
  // triggered after pointer down & up with no/tiny movement


  proto._staticClick = function (event, pointer) {
    // ignore emulated mouse up clicks
    if (this.isIgnoringMouseUp && event.type == 'mouseup') {
      return;
    }

    this.staticClick(event, pointer); // set flag for emulated clicks 300ms after touchend

    if (event.type != 'mouseup') {
      this.isIgnoringMouseUp = true; // reset flag after 300ms

      setTimeout(function () {
        delete this.isIgnoringMouseUp;
      }.bind(this), 400);
    }
  };

  proto.staticClick = function (event, pointer) {
    this.emitEvent('staticClick', [event, pointer]);
  }; // ----- utils ----- //


  Unidragger.getPointerPoint = Unipointer.getPointerPoint; // -----  ----- //

  return Unidragger;
}); // drag


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/drag', ['./flickity', 'unidragger/unidragger', 'fizzy-ui-utils/utils'], function (Flickity, Unidragger, utils) {
      return factory(window, Flickity, Unidragger, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('./flickity'), require('unidragger'), require('fizzy-ui-utils'));
  } else {
    // browser global
    window.Flickity = factory(window, window.Flickity, window.Unidragger, window.fizzyUIUtils);
  }
})(window, function factory(window, Flickity, Unidragger, utils) {
  // ----- defaults ----- //
  utils.extend(Flickity.defaults, {
    draggable: '>1',
    dragThreshold: 3
  }); // ----- create ----- //

  Flickity.createMethods.push('_createDrag'); // -------------------------- drag prototype -------------------------- //

  var proto = Flickity.prototype;
  utils.extend(proto, Unidragger.prototype);
  proto._touchActionValue = 'pan-y'; // --------------------------  -------------------------- //

  var isTouch = ('createTouch' in document);
  var isTouchmoveScrollCanceled = false;

  proto._createDrag = function () {
    this.on('activate', this.onActivateDrag);
    this.on('uiChange', this._uiChangeDrag);
    this.on('deactivate', this.onDeactivateDrag);
    this.on('cellChange', this.updateDraggable); // TODO updateDraggable on resize? if groupCells & slides change
    // HACK - add seemingly innocuous handler to fix iOS 10 scroll behavior
    // #457, RubaXa/Sortable#973

    if (isTouch && !isTouchmoveScrollCanceled) {
      window.addEventListener('touchmove', function () {});
      isTouchmoveScrollCanceled = true;
    }
  };

  proto.onActivateDrag = function () {
    this.handles = [this.viewport];
    this.bindHandles();
    this.updateDraggable();
  };

  proto.onDeactivateDrag = function () {
    this.unbindHandles();
    this.element.classList.remove('is-draggable');
  };

  proto.updateDraggable = function () {
    // disable dragging if less than 2 slides. #278
    if (this.options.draggable == '>1') {
      this.isDraggable = this.slides.length > 1;
    } else {
      this.isDraggable = this.options.draggable;
    }

    if (this.isDraggable) {
      this.element.classList.add('is-draggable');
    } else {
      this.element.classList.remove('is-draggable');
    }
  }; // backwards compatibility


  proto.bindDrag = function () {
    this.options.draggable = true;
    this.updateDraggable();
  };

  proto.unbindDrag = function () {
    this.options.draggable = false;
    this.updateDraggable();
  };

  proto._uiChangeDrag = function () {
    delete this.isFreeScrolling;
  }; // -------------------------- pointer events -------------------------- //


  proto.pointerDown = function (event, pointer) {
    if (!this.isDraggable) {
      this._pointerDownDefault(event, pointer);

      return;
    }

    var isOkay = this.okayPointerDown(event);

    if (!isOkay) {
      return;
    }

    this._pointerDownPreventDefault(event);

    this.pointerDownFocus(event); // blur

    if (document.activeElement != this.element) {
      // do not blur if already focused
      this.pointerDownBlur();
    } // stop if it was moving


    this.dragX = this.x;
    this.viewport.classList.add('is-pointer-down'); // track scrolling

    this.pointerDownScroll = getScrollPosition();
    window.addEventListener('scroll', this);

    this._pointerDownDefault(event, pointer);
  }; // default pointerDown logic, used for staticClick


  proto._pointerDownDefault = function (event, pointer) {
    // track start event position
    // Safari 9 overrides pageX and pageY. These values needs to be copied. #779
    this.pointerDownPointer = {
      pageX: pointer.pageX,
      pageY: pointer.pageY
    }; // bind move and end events

    this._bindPostStartEvents(event);

    this.dispatchEvent('pointerDown', event, [pointer]);
  };

  var focusNodes = {
    INPUT: true,
    TEXTAREA: true,
    SELECT: true
  };

  proto.pointerDownFocus = function (event) {
    var isFocusNode = focusNodes[event.target.nodeName];

    if (!isFocusNode) {
      this.focus();
    }
  };

  proto._pointerDownPreventDefault = function (event) {
    var isTouchStart = event.type == 'touchstart';
    var isTouchPointer = event.pointerType == 'touch';
    var isFocusNode = focusNodes[event.target.nodeName];

    if (!isTouchStart && !isTouchPointer && !isFocusNode) {
      event.preventDefault();
    }
  }; // ----- move ----- //


  proto.hasDragStarted = function (moveVector) {
    return Math.abs(moveVector.x) > this.options.dragThreshold;
  }; // ----- up ----- //


  proto.pointerUp = function (event, pointer) {
    delete this.isTouchScrolling;
    this.viewport.classList.remove('is-pointer-down');
    this.dispatchEvent('pointerUp', event, [pointer]);

    this._dragPointerUp(event, pointer);
  };

  proto.pointerDone = function () {
    window.removeEventListener('scroll', this);
    delete this.pointerDownScroll;
  }; // -------------------------- dragging -------------------------- //


  proto.dragStart = function (event, pointer) {
    if (!this.isDraggable) {
      return;
    }

    this.dragStartPosition = this.x;
    this.startAnimation();
    window.removeEventListener('scroll', this);
    this.dispatchEvent('dragStart', event, [pointer]);
  };

  proto.pointerMove = function (event, pointer) {
    var moveVector = this._dragPointerMove(event, pointer);

    this.dispatchEvent('pointerMove', event, [pointer, moveVector]);

    this._dragMove(event, pointer, moveVector);
  };

  proto.dragMove = function (event, pointer, moveVector) {
    if (!this.isDraggable) {
      return;
    }

    event.preventDefault();
    this.previousDragX = this.dragX; // reverse if right-to-left

    var direction = this.options.rightToLeft ? -1 : 1;

    if (this.options.wrapAround) {
      // wrap around move. #589
      moveVector.x = moveVector.x % this.slideableWidth;
    }

    var dragX = this.dragStartPosition + moveVector.x * direction;

    if (!this.options.wrapAround && this.slides.length) {
      // slow drag
      var originBound = Math.max(-this.slides[0].target, this.dragStartPosition);
      dragX = dragX > originBound ? (dragX + originBound) * 0.5 : dragX;
      var endBound = Math.min(-this.getLastSlide().target, this.dragStartPosition);
      dragX = dragX < endBound ? (dragX + endBound) * 0.5 : dragX;
    }

    this.dragX = dragX;
    this.dragMoveTime = new Date();
    this.dispatchEvent('dragMove', event, [pointer, moveVector]);
  };

  proto.dragEnd = function (event, pointer) {
    if (!this.isDraggable) {
      return;
    }

    if (this.options.freeScroll) {
      this.isFreeScrolling = true;
    } // set selectedIndex based on where flick will end up


    var index = this.dragEndRestingSelect();

    if (this.options.freeScroll && !this.options.wrapAround) {
      // if free-scroll & not wrap around
      // do not free-scroll if going outside of bounding slides
      // so bounding slides can attract slider, and keep it in bounds
      var restingX = this.getRestingPosition();
      this.isFreeScrolling = -restingX > this.slides[0].target && -restingX < this.getLastSlide().target;
    } else if (!this.options.freeScroll && index == this.selectedIndex) {
      // boost selection if selected index has not changed
      index += this.dragEndBoostSelect();
    }

    delete this.previousDragX; // apply selection
    // TODO refactor this, selecting here feels weird
    // HACK, set flag so dragging stays in correct direction

    this.isDragSelect = this.options.wrapAround;
    this.select(index);
    delete this.isDragSelect;
    this.dispatchEvent('dragEnd', event, [pointer]);
  };

  proto.dragEndRestingSelect = function () {
    var restingX = this.getRestingPosition(); // how far away from selected slide

    var distance = Math.abs(this.getSlideDistance(-restingX, this.selectedIndex)); // get closet resting going up and going down

    var positiveResting = this._getClosestResting(restingX, distance, 1);

    var negativeResting = this._getClosestResting(restingX, distance, -1); // use closer resting for wrap-around


    var index = positiveResting.distance < negativeResting.distance ? positiveResting.index : negativeResting.index;
    return index;
  };
  /**
   * given resting X and distance to selected cell
   * get the distance and index of the closest cell
   * @param {Number} restingX - estimated post-flick resting position
   * @param {Number} distance - distance to selected cell
   * @param {Integer} increment - +1 or -1, going up or down
   * @returns {Object} - { distance: {Number}, index: {Integer} }
   */


  proto._getClosestResting = function (restingX, distance, increment) {
    var index = this.selectedIndex;
    var minDistance = Infinity;
    var condition = this.options.contain && !this.options.wrapAround ? // if contain, keep going if distance is equal to minDistance
    function (d, md) {
      return d <= md;
    } : function (d, md) {
      return d < md;
    };

    while (condition(distance, minDistance)) {
      // measure distance to next cell
      index += increment;
      minDistance = distance;
      distance = this.getSlideDistance(-restingX, index);

      if (distance === null) {
        break;
      }

      distance = Math.abs(distance);
    }

    return {
      distance: minDistance,
      // selected was previous index
      index: index - increment
    };
  };
  /**
   * measure distance between x and a slide target
   * @param {Number} x
   * @param {Integer} index - slide index
   */


  proto.getSlideDistance = function (x, index) {
    var len = this.slides.length; // wrap around if at least 2 slides

    var isWrapAround = this.options.wrapAround && len > 1;
    var slideIndex = isWrapAround ? utils.modulo(index, len) : index;
    var slide = this.slides[slideIndex];

    if (!slide) {
      return null;
    } // add distance for wrap-around slides


    var wrap = isWrapAround ? this.slideableWidth * Math.floor(index / len) : 0;
    return x - (slide.target + wrap);
  };

  proto.dragEndBoostSelect = function () {
    // do not boost if no previousDragX or dragMoveTime
    if (this.previousDragX === undefined || !this.dragMoveTime || // or if drag was held for 100 ms
    new Date() - this.dragMoveTime > 100) {
      return 0;
    }

    var distance = this.getSlideDistance(-this.dragX, this.selectedIndex);
    var delta = this.previousDragX - this.dragX;

    if (distance > 0 && delta > 0) {
      // boost to next if moving towards the right, and positive velocity
      return 1;
    } else if (distance < 0 && delta < 0) {
      // boost to previous if moving towards the left, and negative velocity
      return -1;
    }

    return 0;
  }; // ----- staticClick ----- //


  proto.staticClick = function (event, pointer) {
    // get clickedCell, if cell was clicked
    var clickedCell = this.getParentCell(event.target);
    var cellElem = clickedCell && clickedCell.element;
    var cellIndex = clickedCell && this.cells.indexOf(clickedCell);
    this.dispatchEvent('staticClick', event, [pointer, cellElem, cellIndex]);
  }; // ----- scroll ----- //


  proto.onscroll = function () {
    var scroll = getScrollPosition();
    var scrollMoveX = this.pointerDownScroll.x - scroll.x;
    var scrollMoveY = this.pointerDownScroll.y - scroll.y; // cancel click/tap if scroll is too much

    if (Math.abs(scrollMoveX) > 3 || Math.abs(scrollMoveY) > 3) {
      this._pointerDone();
    }
  }; // ----- utils ----- //


  function getScrollPosition() {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset
    };
  } // -----  ----- //


  return Flickity;
}); // prev/next buttons


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/prev-next-button', ['./flickity', 'unipointer/unipointer', 'fizzy-ui-utils/utils'], function (Flickity, Unipointer, utils) {
      return factory(window, Flickity, Unipointer, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('./flickity'), require('unipointer'), require('fizzy-ui-utils'));
  } else {
    // browser global
    factory(window, window.Flickity, window.Unipointer, window.fizzyUIUtils);
  }
})(window, function factory(window, Flickity, Unipointer, utils) {
  'use strict';

  var svgURI = 'http://www.w3.org/2000/svg'; // -------------------------- PrevNextButton -------------------------- //

  function PrevNextButton(direction, parent) {
    this.direction = direction;
    this.parent = parent;

    this._create();
  }

  PrevNextButton.prototype = Object.create(Unipointer.prototype);

  PrevNextButton.prototype._create = function () {
    // properties
    this.isEnabled = true;
    this.isPrevious = this.direction == -1;
    var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
    this.isLeft = this.direction == leftDirection;
    var element = this.element = document.createElement('button');
    element.className = 'flickity-button flickity-prev-next-button';
    element.className += this.isPrevious ? ' previous' : ' next'; // prevent button from submitting form http://stackoverflow.com/a/10836076/182183

    element.setAttribute('type', 'button'); // init as disabled

    this.disable();
    element.setAttribute('aria-label', this.isPrevious ? 'Previous' : 'Next'); // create arrow

    var svg = this.createSVG();
    element.appendChild(svg); // events

    this.parent.on('select', this.update.bind(this));
    this.on('pointerDown', this.parent.childUIPointerDown.bind(this.parent));
  };

  PrevNextButton.prototype.activate = function () {
    this.bindStartEvent(this.element);
    this.element.addEventListener('click', this); // add to DOM

    this.parent.element.appendChild(this.element);
  };

  PrevNextButton.prototype.deactivate = function () {
    // remove from DOM
    this.parent.element.removeChild(this.element); // click events

    this.unbindStartEvent(this.element);
    this.element.removeEventListener('click', this);
  };

  PrevNextButton.prototype.createSVG = function () {
    var svg = document.createElementNS(svgURI, 'svg');
    svg.setAttribute('class', 'flickity-button-icon');
    svg.setAttribute('viewBox', '0 0 100 100');
    var path = document.createElementNS(svgURI, 'path');
    var pathMovements = getArrowMovements(this.parent.options.arrowShape);
    path.setAttribute('d', pathMovements);
    path.setAttribute('class', 'arrow'); // rotate arrow

    if (!this.isLeft) {
      path.setAttribute('transform', 'translate(100, 100) rotate(180) ');
    }

    svg.appendChild(path);
    return svg;
  }; // get SVG path movmement


  function getArrowMovements(shape) {
    // use shape as movement if string
    if (typeof shape == 'string') {
      return shape;
    } // create movement string


    return 'M ' + shape.x0 + ',50' + ' L ' + shape.x1 + ',' + (shape.y1 + 50) + ' L ' + shape.x2 + ',' + (shape.y2 + 50) + ' L ' + shape.x3 + ',50 ' + ' L ' + shape.x2 + ',' + (50 - shape.y2) + ' L ' + shape.x1 + ',' + (50 - shape.y1) + ' Z';
  }

  PrevNextButton.prototype.handleEvent = utils.handleEvent;

  PrevNextButton.prototype.onclick = function () {
    if (!this.isEnabled) {
      return;
    }

    this.parent.uiChange();
    var method = this.isPrevious ? 'previous' : 'next';
    this.parent[method]();
  }; // -----  ----- //


  PrevNextButton.prototype.enable = function () {
    if (this.isEnabled) {
      return;
    }

    this.element.disabled = false;
    this.isEnabled = true;
  };

  PrevNextButton.prototype.disable = function () {
    if (!this.isEnabled) {
      return;
    }

    this.element.disabled = true;
    this.isEnabled = false;
  };

  PrevNextButton.prototype.update = function () {
    // index of first or last slide, if previous or next
    var slides = this.parent.slides; // enable is wrapAround and at least 2 slides

    if (this.parent.options.wrapAround && slides.length > 1) {
      this.enable();
      return;
    }

    var lastIndex = slides.length ? slides.length - 1 : 0;
    var boundIndex = this.isPrevious ? 0 : lastIndex;
    var method = this.parent.selectedIndex == boundIndex ? 'disable' : 'enable';
    this[method]();
  };

  PrevNextButton.prototype.destroy = function () {
    this.deactivate();
    this.allOff();
  }; // -------------------------- Flickity prototype -------------------------- //


  utils.extend(Flickity.defaults, {
    prevNextButtons: true,
    arrowShape: {
      x0: 10,
      x1: 60,
      y1: 50,
      x2: 70,
      y2: 40,
      x3: 30
    }
  });
  Flickity.createMethods.push('_createPrevNextButtons');
  var proto = Flickity.prototype;

  proto._createPrevNextButtons = function () {
    if (!this.options.prevNextButtons) {
      return;
    }

    this.prevButton = new PrevNextButton(-1, this);
    this.nextButton = new PrevNextButton(1, this);
    this.on('activate', this.activatePrevNextButtons);
  };

  proto.activatePrevNextButtons = function () {
    this.prevButton.activate();
    this.nextButton.activate();
    this.on('deactivate', this.deactivatePrevNextButtons);
  };

  proto.deactivatePrevNextButtons = function () {
    this.prevButton.deactivate();
    this.nextButton.deactivate();
    this.off('deactivate', this.deactivatePrevNextButtons);
  }; // --------------------------  -------------------------- //


  Flickity.PrevNextButton = PrevNextButton;
  return Flickity;
}); // page dots


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/page-dots', ['./flickity', 'unipointer/unipointer', 'fizzy-ui-utils/utils'], function (Flickity, Unipointer, utils) {
      return factory(window, Flickity, Unipointer, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('./flickity'), require('unipointer'), require('fizzy-ui-utils'));
  } else {
    // browser global
    factory(window, window.Flickity, window.Unipointer, window.fizzyUIUtils);
  }
})(window, function factory(window, Flickity, Unipointer, utils) {
  // -------------------------- PageDots -------------------------- //
  function PageDots(parent) {
    this.parent = parent;

    this._create();
  }

  PageDots.prototype = Object.create(Unipointer.prototype);

  PageDots.prototype._create = function () {
    // create holder element
    this.holder = document.createElement('ol');
    this.holder.className = 'flickity-page-dots'; // create dots, array of elements

    this.dots = []; // events

    this.handleClick = this.onClick.bind(this);
    this.on('pointerDown', this.parent.childUIPointerDown.bind(this.parent));
  };

  PageDots.prototype.activate = function () {
    this.setDots();
    this.holder.addEventListener('click', this.handleClick);
    this.bindStartEvent(this.holder); // add to DOM

    this.parent.element.appendChild(this.holder);
  };

  PageDots.prototype.deactivate = function () {
    this.holder.removeEventListener('click', this.handleClick);
    this.unbindStartEvent(this.holder); // remove from DOM

    this.parent.element.removeChild(this.holder);
  };

  PageDots.prototype.setDots = function () {
    // get difference between number of slides and number of dots
    var delta = this.parent.slides.length - this.dots.length;

    if (delta > 0) {
      this.addDots(delta);
    } else if (delta < 0) {
      this.removeDots(-delta);
    }
  };

  PageDots.prototype.addDots = function (count) {
    var fragment = document.createDocumentFragment();
    var newDots = [];
    var length = this.dots.length;
    var max = length + count;

    for (var i = length; i < max; i++) {
      var dot = document.createElement('li');
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Page dot ' + (i + 1));
      fragment.appendChild(dot);
      newDots.push(dot);
    }

    this.holder.appendChild(fragment);
    this.dots = this.dots.concat(newDots);
  };

  PageDots.prototype.removeDots = function (count) {
    // remove from this.dots collection
    var removeDots = this.dots.splice(this.dots.length - count, count); // remove from DOM

    removeDots.forEach(function (dot) {
      this.holder.removeChild(dot);
    }, this);
  };

  PageDots.prototype.updateSelected = function () {
    // remove selected class on previous
    if (this.selectedDot) {
      this.selectedDot.className = 'dot';
      this.selectedDot.removeAttribute('aria-current');
    } // don't proceed if no dots


    if (!this.dots.length) {
      return;
    }

    this.selectedDot = this.dots[this.parent.selectedIndex];
    this.selectedDot.className = 'dot is-selected';
    this.selectedDot.setAttribute('aria-current', 'step');
  };

  PageDots.prototype.onTap = // old method name, backwards-compatible
  PageDots.prototype.onClick = function (event) {
    var target = event.target; // only care about dot clicks

    if (target.nodeName != 'LI') {
      return;
    }

    this.parent.uiChange();
    var index = this.dots.indexOf(target);
    this.parent.select(index);
  };

  PageDots.prototype.destroy = function () {
    this.deactivate();
    this.allOff();
  };

  Flickity.PageDots = PageDots; // -------------------------- Flickity -------------------------- //

  utils.extend(Flickity.defaults, {
    pageDots: true
  });
  Flickity.createMethods.push('_createPageDots');
  var proto = Flickity.prototype;

  proto._createPageDots = function () {
    if (!this.options.pageDots) {
      return;
    }

    this.pageDots = new PageDots(this); // events

    this.on('activate', this.activatePageDots);
    this.on('select', this.updateSelectedPageDots);
    this.on('cellChange', this.updatePageDots);
    this.on('resize', this.updatePageDots);
    this.on('deactivate', this.deactivatePageDots);
  };

  proto.activatePageDots = function () {
    this.pageDots.activate();
  };

  proto.updateSelectedPageDots = function () {
    this.pageDots.updateSelected();
  };

  proto.updatePageDots = function () {
    this.pageDots.setDots();
  };

  proto.deactivatePageDots = function () {
    this.pageDots.deactivate();
  }; // -----  ----- //


  Flickity.PageDots = PageDots;
  return Flickity;
}); // player & autoPlay


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/player', ['ev-emitter/ev-emitter', 'fizzy-ui-utils/utils', './flickity'], function (EvEmitter, utils, Flickity) {
      return factory(EvEmitter, utils, Flickity);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('ev-emitter'), require('fizzy-ui-utils'), require('./flickity'));
  } else {
    // browser global
    factory(window.EvEmitter, window.fizzyUIUtils, window.Flickity);
  }
})(window, function factory(EvEmitter, utils, Flickity) {
  // -------------------------- Player -------------------------- //
  function Player(parent) {
    this.parent = parent;
    this.state = 'stopped'; // visibility change event handler

    this.onVisibilityChange = this.visibilityChange.bind(this);
    this.onVisibilityPlay = this.visibilityPlay.bind(this);
  }

  Player.prototype = Object.create(EvEmitter.prototype); // start play

  Player.prototype.play = function () {
    if (this.state == 'playing') {
      return;
    } // do not play if page is hidden, start playing when page is visible


    var isPageHidden = document.hidden;

    if (isPageHidden) {
      document.addEventListener('visibilitychange', this.onVisibilityPlay);
      return;
    }

    this.state = 'playing'; // listen to visibility change

    document.addEventListener('visibilitychange', this.onVisibilityChange); // start ticking

    this.tick();
  };

  Player.prototype.tick = function () {
    // do not tick if not playing
    if (this.state != 'playing') {
      return;
    }

    var time = this.parent.options.autoPlay; // default to 3 seconds

    time = typeof time == 'number' ? time : 3000;

    var _this = this; // HACK: reset ticks if stopped and started within interval


    this.clear();
    this.timeout = setTimeout(function () {
      _this.parent.next(true);

      _this.tick();
    }, time);
  };

  Player.prototype.stop = function () {
    this.state = 'stopped';
    this.clear(); // remove visibility change event

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  };

  Player.prototype.clear = function () {
    clearTimeout(this.timeout);
  };

  Player.prototype.pause = function () {
    if (this.state == 'playing') {
      this.state = 'paused';
      this.clear();
    }
  };

  Player.prototype.unpause = function () {
    // re-start play if paused
    if (this.state == 'paused') {
      this.play();
    }
  }; // pause if page visibility is hidden, unpause if visible


  Player.prototype.visibilityChange = function () {
    var isPageHidden = document.hidden;
    this[isPageHidden ? 'pause' : 'unpause']();
  };

  Player.prototype.visibilityPlay = function () {
    this.play();
    document.removeEventListener('visibilitychange', this.onVisibilityPlay);
  }; // -------------------------- Flickity -------------------------- //


  utils.extend(Flickity.defaults, {
    pauseAutoPlayOnHover: true
  });
  Flickity.createMethods.push('_createPlayer');
  var proto = Flickity.prototype;

  proto._createPlayer = function () {
    this.player = new Player(this);
    this.on('activate', this.activatePlayer);
    this.on('uiChange', this.stopPlayer);
    this.on('pointerDown', this.stopPlayer);
    this.on('deactivate', this.deactivatePlayer);
  };

  proto.activatePlayer = function () {
    if (!this.options.autoPlay) {
      return;
    }

    this.player.play();
    this.element.addEventListener('mouseenter', this);
  }; // Player API, don't hate the ... thanks I know where the door is


  proto.playPlayer = function () {
    this.player.play();
  };

  proto.stopPlayer = function () {
    this.player.stop();
  };

  proto.pausePlayer = function () {
    this.player.pause();
  };

  proto.unpausePlayer = function () {
    this.player.unpause();
  };

  proto.deactivatePlayer = function () {
    this.player.stop();
    this.element.removeEventListener('mouseenter', this);
  }; // ----- mouseenter/leave ----- //
  // pause auto-play on hover


  proto.onmouseenter = function () {
    if (!this.options.pauseAutoPlayOnHover) {
      return;
    }

    this.player.pause();
    this.element.addEventListener('mouseleave', this);
  }; // resume auto-play on hover off


  proto.onmouseleave = function () {
    this.player.unpause();
    this.element.removeEventListener('mouseleave', this);
  }; // -----  ----- //


  Flickity.Player = Player;
  return Flickity;
}); // add, remove cell


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/add-remove-cell', ['./flickity', 'fizzy-ui-utils/utils'], function (Flickity, utils) {
      return factory(window, Flickity, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('./flickity'), require('fizzy-ui-utils'));
  } else {
    // browser global
    factory(window, window.Flickity, window.fizzyUIUtils);
  }
})(window, function factory(window, Flickity, utils) {
  // append cells to a document fragment
  function getCellsFragment(cells) {
    var fragment = document.createDocumentFragment();
    cells.forEach(function (cell) {
      fragment.appendChild(cell.element);
    });
    return fragment;
  } // -------------------------- add/remove cell prototype -------------------------- //


  var proto = Flickity.prototype;
  /**
   * Insert, prepend, or append cells
   * @param {Element, Array, NodeList} elems
   * @param {Integer} index
   */

  proto.insert = function (elems, index) {
    var cells = this._makeCells(elems);

    if (!cells || !cells.length) {
      return;
    }

    var len = this.cells.length; // default to append

    index = index === undefined ? len : index; // add cells with document fragment

    var fragment = getCellsFragment(cells); // append to slider

    var isAppend = index == len;

    if (isAppend) {
      this.slider.appendChild(fragment);
    } else {
      var insertCellElement = this.cells[index].element;
      this.slider.insertBefore(fragment, insertCellElement);
    } // add to this.cells


    if (index === 0) {
      // prepend, add to start
      this.cells = cells.concat(this.cells);
    } else if (isAppend) {
      // append, add to end
      this.cells = this.cells.concat(cells);
    } else {
      // insert in this.cells
      var endCells = this.cells.splice(index, len - index);
      this.cells = this.cells.concat(cells).concat(endCells);
    }

    this._sizeCells(cells);

    this.cellChange(index, true);
  };

  proto.append = function (elems) {
    this.insert(elems, this.cells.length);
  };

  proto.prepend = function (elems) {
    this.insert(elems, 0);
  };
  /**
   * Remove cells
   * @param {Element, Array, NodeList} elems
   */


  proto.remove = function (elems) {
    var cells = this.getCells(elems);

    if (!cells || !cells.length) {
      return;
    }

    var minCellIndex = this.cells.length - 1; // remove cells from collection & DOM

    cells.forEach(function (cell) {
      cell.remove();
      var index = this.cells.indexOf(cell);
      minCellIndex = Math.min(index, minCellIndex);
      utils.removeFrom(this.cells, cell);
    }, this);
    this.cellChange(minCellIndex, true);
  };
  /**
   * logic to be run after a cell's size changes
   * @param {Element} elem - cell's element
   */


  proto.cellSizeChange = function (elem) {
    var cell = this.getCell(elem);

    if (!cell) {
      return;
    }

    cell.getSize();
    var index = this.cells.indexOf(cell);
    this.cellChange(index);
  };
  /**
   * logic any time a cell is changed: added, removed, or size changed
   * @param {Integer} changedCellIndex - index of the changed cell, optional
   */


  proto.cellChange = function (changedCellIndex, isPositioningSlider) {
    var prevSelectedElem = this.selectedElement;

    this._positionCells(changedCellIndex);

    this._getWrapShiftCells();

    this.setGallerySize(); // update selectedIndex
    // try to maintain position & select previous selected element

    var cell = this.getCell(prevSelectedElem);

    if (cell) {
      this.selectedIndex = this.getCellSlideIndex(cell);
    }

    this.selectedIndex = Math.min(this.slides.length - 1, this.selectedIndex);
    this.emitEvent('cellChange', [changedCellIndex]); // position slider

    this.select(this.selectedIndex); // do not position slider after lazy load

    if (isPositioningSlider) {
      this.positionSliderAtSelected();
    }
  }; // -----  ----- //


  return Flickity;
}); // lazyload


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/lazyload', ['./flickity', 'fizzy-ui-utils/utils'], function (Flickity, utils) {
      return factory(window, Flickity, utils);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('./flickity'), require('fizzy-ui-utils'));
  } else {
    // browser global
    factory(window, window.Flickity, window.fizzyUIUtils);
  }
})(window, function factory(window, Flickity, utils) {
  'use strict';

  Flickity.createMethods.push('_createLazyload');
  var proto = Flickity.prototype;

  proto._createLazyload = function () {
    this.on('select', this.lazyLoad);
  };

  proto.lazyLoad = function () {
    var lazyLoad = this.options.lazyLoad;

    if (!lazyLoad) {
      return;
    } // get adjacent cells, use lazyLoad option for adjacent count


    var adjCount = typeof lazyLoad == 'number' ? lazyLoad : 0;
    var cellElems = this.getAdjacentCellElements(adjCount); // get lazy images in those cells

    var lazyImages = [];
    cellElems.forEach(function (cellElem) {
      var lazyCellImages = getCellLazyImages(cellElem);
      lazyImages = lazyImages.concat(lazyCellImages);
    }); // load lazy images

    lazyImages.forEach(function (img) {
      new LazyLoader(img, this);
    }, this);
  };

  function getCellLazyImages(cellElem) {
    // check if cell element is lazy image
    if (cellElem.nodeName == 'IMG') {
      var lazyloadAttr = cellElem.getAttribute('data-flickity-lazyload');
      var srcAttr = cellElem.getAttribute('data-flickity-lazyload-src');
      var srcsetAttr = cellElem.getAttribute('data-flickity-lazyload-srcset');

      if (lazyloadAttr || srcAttr || srcsetAttr) {
        return [cellElem];
      }
    } // select lazy images in cell


    var lazySelector = 'img[data-flickity-lazyload], ' + 'img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]';
    var imgs = cellElem.querySelectorAll(lazySelector);
    return utils.makeArray(imgs);
  } // -------------------------- LazyLoader -------------------------- //

  /**
   * class to handle loading images
   */


  function LazyLoader(img, flickity) {
    this.img = img;
    this.flickity = flickity;
    this.load();
  }

  LazyLoader.prototype.handleEvent = utils.handleEvent;

  LazyLoader.prototype.load = function () {
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this); // get src & srcset

    var src = this.img.getAttribute('data-flickity-lazyload') || this.img.getAttribute('data-flickity-lazyload-src');
    var srcset = this.img.getAttribute('data-flickity-lazyload-srcset'); // set src & serset

    this.img.src = src;

    if (srcset) {
      this.img.setAttribute('srcset', srcset);
    } // remove attr


    this.img.removeAttribute('data-flickity-lazyload');
    this.img.removeAttribute('data-flickity-lazyload-src');
    this.img.removeAttribute('data-flickity-lazyload-srcset');
  };

  LazyLoader.prototype.onload = function (event) {
    this.complete(event, 'flickity-lazyloaded');
  };

  LazyLoader.prototype.onerror = function (event) {
    this.complete(event, 'flickity-lazyerror');
  };

  LazyLoader.prototype.complete = function (event, className) {
    // unbind events
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
    var cell = this.flickity.getParentCell(this.img);
    var cellElem = cell && cell.element;
    this.flickity.cellSizeChange(cellElem);
    this.img.classList.add(className);
    this.flickity.dispatchEvent('lazyLoad', event, cellElem);
  }; // -----  ----- //


  Flickity.LazyLoader = LazyLoader;
  return Flickity;
});
/*!
 * Flickity v2.2.1
 * Touch, responsive, flickable carousels
 *
 * Licensed GPLv3 for open source use
 * or Flickity Commercial License for commercial use
 *
 * https://flickity.metafizzy.co
 * Copyright 2015-2019 Metafizzy
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity/js/index', ['./flickity', './drag', './prev-next-button', './page-dots', './player', './add-remove-cell', './lazyload'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('./flickity'), require('./drag'), require('./prev-next-button'), require('./page-dots'), require('./player'), require('./add-remove-cell'), require('./lazyload'));
  }
})(window, function factory(Flickity) {
  /*jshint strict: false*/
  return Flickity;
});
/*!
 * Flickity asNavFor v2.0.2
 * enable asNavFor for Flickity
 */

/*jshint browser: true, undef: true, unused: true, strict: true*/


(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('flickity-as-nav-for/as-nav-for', ['flickity/js/index', 'fizzy-ui-utils/utils'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('flickity'), require('fizzy-ui-utils'));
  } else {
    // browser global
    window.Flickity = factory(window.Flickity, window.fizzyUIUtils);
  }
})(window, function factory(Flickity, utils) {
  // -------------------------- asNavFor prototype -------------------------- //
  // Flickity.defaults.asNavFor = null;
  Flickity.createMethods.push('_createAsNavFor');
  var proto = Flickity.prototype;

  proto._createAsNavFor = function () {
    this.on('activate', this.activateAsNavFor);
    this.on('deactivate', this.deactivateAsNavFor);
    this.on('destroy', this.destroyAsNavFor);
    var asNavForOption = this.options.asNavFor;

    if (!asNavForOption) {
      return;
    } // HACK do async, give time for other flickity to be initalized


    var _this = this;

    setTimeout(function initNavCompanion() {
      _this.setNavCompanion(asNavForOption);
    });
  };

  proto.setNavCompanion = function (elem) {
    elem = utils.getQueryElement(elem);
    var companion = Flickity.data(elem); // stop if no companion or companion is self

    if (!companion || companion == this) {
      return;
    }

    this.navCompanion = companion; // companion select

    var _this = this;

    this.onNavCompanionSelect = function () {
      _this.navCompanionSelect();
    };

    companion.on('select', this.onNavCompanionSelect); // click

    this.on('staticClick', this.onNavStaticClick);
    this.navCompanionSelect(true);
  };

  proto.navCompanionSelect = function (isInstant) {
    // wait for companion & selectedCells first. #8
    var companionCells = this.navCompanion && this.navCompanion.selectedCells;

    if (!companionCells) {
      return;
    } // select slide that matches first cell of slide


    var selectedCell = companionCells[0];
    var firstIndex = this.navCompanion.cells.indexOf(selectedCell);
    var lastIndex = firstIndex + companionCells.length - 1;
    var selectIndex = Math.floor(lerp(firstIndex, lastIndex, this.navCompanion.cellAlign));
    this.selectCell(selectIndex, false, isInstant); // set nav selected class

    this.removeNavSelectedElements(); // stop if companion has more cells than this one

    if (selectIndex >= this.cells.length) {
      return;
    }

    var selectedCells = this.cells.slice(firstIndex, lastIndex + 1);
    this.navSelectedElements = selectedCells.map(function (cell) {
      return cell.element;
    });
    this.changeNavSelectedClass('add');
  };

  function lerp(a, b, t) {
    return (b - a) * t + a;
  }

  proto.changeNavSelectedClass = function (method) {
    this.navSelectedElements.forEach(function (navElem) {
      navElem.classList[method]('is-nav-selected');
    });
  };

  proto.activateAsNavFor = function () {
    this.navCompanionSelect(true);
  };

  proto.removeNavSelectedElements = function () {
    if (!this.navSelectedElements) {
      return;
    }

    this.changeNavSelectedClass('remove');
    delete this.navSelectedElements;
  };

  proto.onNavStaticClick = function (event, pointer, cellElement, cellIndex) {
    if (typeof cellIndex == 'number') {
      this.navCompanion.selectCell(cellIndex);
    }
  };

  proto.deactivateAsNavFor = function () {
    this.removeNavSelectedElements();
  };

  proto.destroyAsNavFor = function () {
    if (!this.navCompanion) {
      return;
    }

    this.navCompanion.off('select', this.onNavCompanionSelect);
    this.off('staticClick', this.onNavStaticClick);
    delete this.navCompanion;
  }; // -----  ----- //


  return Flickity;
});
/*!
 * imagesLoaded v4.1.4
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */


(function (window, factory) {
  'use strict'; // universal module definition

  /*global define: false, module: false, require: false */

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('imagesloaded/imagesloaded', ['ev-emitter/ev-emitter'], function (EvEmitter) {
      return factory(window, EvEmitter);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('ev-emitter'));
  } else {
    // browser global
    window.imagesLoaded = factory(window, window.EvEmitter);
  }
})(typeof window !== 'undefined' ? window : void 0, // --------------------------  factory -------------------------- //
function factory(window, EvEmitter) {
  var $ = window.jQuery;
  var console = window.console; // -------------------------- helpers -------------------------- //
  // extend objects

  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }

    return a;
  }

  var arraySlice = Array.prototype.slice; // turn element or nodeList into an array

  function makeArray(obj) {
    if (Array.isArray(obj)) {
      // use object if already an array
      return obj;
    }

    var isArrayLike = _typeof(obj) == 'object' && typeof obj.length == 'number';

    if (isArrayLike) {
      // convert nodeList to array
      return arraySlice.call(obj);
    } // array of single index


    return [obj];
  } // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */


  function ImagesLoaded(elem, options, onAlways) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if (!(this instanceof ImagesLoaded)) {
      return new ImagesLoaded(elem, options, onAlways);
    } // use elem as selector string


    var queryElem = elem;

    if (typeof elem == 'string') {
      queryElem = document.querySelectorAll(elem);
    } // bail if bad element


    if (!queryElem) {
      console.error('Bad element for imagesLoaded ' + (queryElem || elem));
      return;
    }

    this.elements = makeArray(queryElem);
    this.options = extend({}, this.options); // shift arguments if no options set

    if (typeof options == 'function') {
      onAlways = options;
    } else {
      extend(this.options, options);
    }

    if (onAlways) {
      this.on('always', onAlways);
    }

    this.getImages();

    if ($) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    } // HACK check async to allow time to bind listeners


    setTimeout(this.check.bind(this));
  }

  ImagesLoaded.prototype = Object.create(EvEmitter.prototype);
  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function () {
    this.images = []; // filter & find items if we have an item selector

    this.elements.forEach(this.addElementImages, this);
  };
  /**
   * @param {Node} element
   */


  ImagesLoaded.prototype.addElementImages = function (elem) {
    // filter siblings
    if (elem.nodeName == 'IMG') {
      this.addImage(elem);
    } // get background image on element


    if (this.options.background === true) {
      this.addElementBackgroundImages(elem);
    } // find children
    // no non-element nodes, #143


    var nodeType = elem.nodeType;

    if (!nodeType || !elementNodeTypes[nodeType]) {
      return;
    }

    var childImgs = elem.querySelectorAll('img'); // concat childElems to filterFound array

    for (var i = 0; i < childImgs.length; i++) {
      var img = childImgs[i];
      this.addImage(img);
    } // get child background images


    if (typeof this.options.background == 'string') {
      var children = elem.querySelectorAll(this.options.background);

      for (i = 0; i < children.length; i++) {
        var child = children[i];
        this.addElementBackgroundImages(child);
      }
    }
  };

  var elementNodeTypes = {
    1: true,
    9: true,
    11: true
  };

  ImagesLoaded.prototype.addElementBackgroundImages = function (elem) {
    var style = getComputedStyle(elem);

    if (!style) {
      // Firefox returns null if in a hidden iframe https://bugzil.la/548397
      return;
    } // get url inside url("...")


    var reURL = /url\((['"])?(.*?)\1\)/gi;
    var matches = reURL.exec(style.backgroundImage);

    while (matches !== null) {
      var url = matches && matches[2];

      if (url) {
        this.addBackground(url, elem);
      }

      matches = reURL.exec(style.backgroundImage);
    }
  };
  /**
   * @param {Image} img
   */


  ImagesLoaded.prototype.addImage = function (img) {
    var loadingImage = new LoadingImage(img);
    this.images.push(loadingImage);
  };

  ImagesLoaded.prototype.addBackground = function (url, elem) {
    var background = new Background(url, elem);
    this.images.push(background);
  };

  ImagesLoaded.prototype.check = function () {
    var _this = this;

    this.progressedCount = 0;
    this.hasAnyBroken = false; // complete if no images

    if (!this.images.length) {
      this.complete();
      return;
    }

    function onProgress(image, elem, message) {
      // HACK - Chrome triggers event before object properties have changed. #83
      setTimeout(function () {
        _this.progress(image, elem, message);
      });
    }

    this.images.forEach(function (loadingImage) {
      loadingImage.once('progress', onProgress);
      loadingImage.check();
    });
  };

  ImagesLoaded.prototype.progress = function (image, elem, message) {
    this.progressedCount++;
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded; // progress event

    this.emitEvent('progress', [this, image, elem]);

    if (this.jqDeferred && this.jqDeferred.notify) {
      this.jqDeferred.notify(this, image);
    } // check if completed


    if (this.progressedCount == this.images.length) {
      this.complete();
    }

    if (this.options.debug && console) {
      console.log('progress: ' + message, image, elem);
    }
  };

  ImagesLoaded.prototype.complete = function () {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    this.emitEvent(eventName, [this]);
    this.emitEvent('always', [this]);

    if (this.jqDeferred) {
      var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
      this.jqDeferred[jqMethod](this);
    }
  }; // --------------------------  -------------------------- //


  function LoadingImage(img) {
    this.img = img;
  }

  LoadingImage.prototype = Object.create(EvEmitter.prototype);

  LoadingImage.prototype.check = function () {
    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    var isComplete = this.getIsImageComplete();

    if (isComplete) {
      // report based on naturalWidth
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      return;
    } // If none of the checks above matched, simulate loading on detached element.


    this.proxyImage = new Image();
    this.proxyImage.addEventListener('load', this);
    this.proxyImage.addEventListener('error', this); // bind to image as well for Firefox. #191

    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.proxyImage.src = this.img.src;
  };

  LoadingImage.prototype.getIsImageComplete = function () {
    // check for non-zero, non-undefined naturalWidth
    // fixes Safari+InfiniteScroll+Masonry bug infinite-scroll#671
    return this.img.complete && this.img.naturalWidth;
  };

  LoadingImage.prototype.confirm = function (isLoaded, message) {
    this.isLoaded = isLoaded;
    this.emitEvent('progress', [this, this.img, message]);
  }; // ----- events ----- //
  // trigger specified handler for event type


  LoadingImage.prototype.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  };

  LoadingImage.prototype.onload = function () {
    this.confirm(true, 'onload');
    this.unbindEvents();
  };

  LoadingImage.prototype.onerror = function () {
    this.confirm(false, 'onerror');
    this.unbindEvents();
  };

  LoadingImage.prototype.unbindEvents = function () {
    this.proxyImage.removeEventListener('load', this);
    this.proxyImage.removeEventListener('error', this);
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  }; // -------------------------- Background -------------------------- //


  function Background(url, element) {
    this.url = url;
    this.element = element;
    this.img = new Image();
  } // inherit LoadingImage prototype


  Background.prototype = Object.create(LoadingImage.prototype);

  Background.prototype.check = function () {
    this.img.addEventListener('load', this);
    this.img.addEventListener('error', this);
    this.img.src = this.url; // check if image is already complete

    var isComplete = this.getIsImageComplete();

    if (isComplete) {
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      this.unbindEvents();
    }
  };

  Background.prototype.unbindEvents = function () {
    this.img.removeEventListener('load', this);
    this.img.removeEventListener('error', this);
  };

  Background.prototype.confirm = function (isLoaded, message) {
    this.isLoaded = isLoaded;
    this.emitEvent('progress', [this, this.element, message]);
  }; // -------------------------- jQuery -------------------------- //


  ImagesLoaded.makeJQueryPlugin = function (jQuery) {
    jQuery = jQuery || window.jQuery;

    if (!jQuery) {
      return;
    } // set local variable


    $ = jQuery; // $().imagesLoaded()

    $.fn.imagesLoaded = function (options, callback) {
      var instance = new ImagesLoaded(this, options, callback);
      return instance.jqDeferred.promise($(this));
    };
  }; // try making plugin


  ImagesLoaded.makeJQueryPlugin(); // --------------------------  -------------------------- //

  return ImagesLoaded;
});
/*!
 * Flickity imagesLoaded v2.0.0
 * enables imagesLoaded option for Flickity
 */

/*jshint browser: true, strict: true, undef: true, unused: true */


(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['flickity/js/index', 'imagesloaded/imagesloaded'], function (Flickity, imagesLoaded) {
      return factory(window, Flickity, imagesLoaded);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('flickity'), require('imagesloaded'));
  } else {
    // browser global
    window.Flickity = factory(window, window.Flickity, window.imagesLoaded);
  }
})(window, function factory(window, Flickity, imagesLoaded) {
  'use strict';

  Flickity.createMethods.push('_createImagesLoaded');
  var proto = Flickity.prototype;

  proto._createImagesLoaded = function () {
    this.on('activate', this.imagesLoaded);
  };

  proto.imagesLoaded = function () {
    if (!this.options.imagesLoaded) {
      return;
    }

    var _this = this;

    function onImagesLoadedProgress(instance, image) {
      var cell = _this.getParentCell(image.img);

      _this.cellSizeChange(cell && cell.element);

      if (!_this.options.freeScroll) {
        _this.positionSliderAtSelected();
      }
    }

    imagesLoaded(this.slider).on('progress', onImagesLoadedProgress);
  };

  return Flickity;
});;"use strict";

/*
 * Copyright (c) 2013 Shane Carr
 *
 * https://github.com/vote539/placeholdr
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function ($, ns, placeholderAttribute, origValFn) {
  // Utility functions
  var putPlaceholder = function putPlaceholder() {
    var $this = $(this);

    if (!$this[origValFn]()) {
      $this.addClass(ns);

      if ($this.attr("type") === "password") {
        $this.attr("type", "text");
        $this.data(ns + "-pwd", true);
      }

      $this[origValFn]($this.attr(placeholderAttribute));
    }
  };

  var clearPlaceholder = function clearPlaceholder() {
    var $this = $(this);
    $this.removeClass(ns);

    if ($this.data(ns + "-pwd")) {
      $this.attr("type", "password");
    }

    if ($this[origValFn]() === $this.attr(placeholderAttribute)) {
      $this[origValFn]("");
    }
  };

  var clearPlaceholdersInForm = function clearPlaceholdersInForm() {
    $(this).find("[" + placeholderAttribute + "]").each(function () {
      if ($(this).data(ns)) clearPlaceholder.call(this);
    });
  };

  $.fn.placeholdr = function () {
    // Don't evaluate the polyfill if the browser supports placeholders
    if (placeholderAttribute in document.createElement("input")) return this; // Find and iterate through all inputs that have a placeholder attribute

    $(this).find("[" + placeholderAttribute + "]").each(function () {
      var $this = $(this); // leave now if we've polyfilled this element before

      if ($this.data(ns)) return;
      $this.data(ns, true); // put the placeholder into the value

      putPlaceholder.call(this); // handle focus and blur events

      $this.focus(clearPlaceholder);
      $this.blur(putPlaceholder);
    }); // Find and iterate through all form elements in order to prevent
    // placeholders from being submitted in forms.

    $(this).find("form").each(function () {
      var $this = $(this); // leave now if we've polyfilled this element before

      if ($this.data(ns)) return;
      $this.data(ns, true);
      $this.submit(clearPlaceholdersInForm);
    });
    return this;
  }; // Overwrite the existing jQuery val() function


  $.fn[origValFn] = $.fn.val;

  $.fn.val = function (txt) {
    var $this = $(this);

    if ($.type(txt) === "undefined" && $this.data(ns) && $this[origValFn]() === $this.attr(placeholderAttribute)) {
      return "";
    }

    var isstr = $.type(txt) === "string";

    if (isstr) {
      clearPlaceholder.call(this);
    }

    var ret = $.fn[origValFn].apply(this, arguments);

    if (isstr && !txt) {
      putPlaceholder.call(this);
    }

    return ret;
  }; // Evaluate the script on page ready


  $(function () {
    $(document).placeholdr();
  }); // Add default CSS rule

  document.write("<style>.placeholdr{color:#AAA;}</style>");
})(jQuery, "placeholdr", "placeholder", "placeholdrVal");;!function (root, name, make) {
  if (typeof module != 'undefined' && module['exports']) module['exports'] = make();else root[name] = make();
}(this, 'verge', function () {
  var xports = {},
      win = typeof window != 'undefined' && window,
      doc = typeof document != 'undefined' && document,
      docElem = doc && doc.documentElement,
      matchMedia = win['matchMedia'] || win['msMatchMedia'],
      mq = matchMedia ? function (q) {
    return !!matchMedia.call(win, q).matches;
  } : function () {
    return false;
  },
      viewportW = xports['viewportW'] = function () {
    var a = docElem['clientWidth'],
        b = win['innerWidth'];
    return a < b ? b : a;
  },
      viewportH = xports['viewportH'] = function () {
    var a = docElem['clientHeight'],
        b = win['innerHeight'];
    return a < b ? b : a;
  };
  /**
   * Test if a media query is active. Like Modernizr.mq
   * @since 1.6.0
   * @return {boolean}
   */


  xports['mq'] = mq;
  /**
   * Normalized matchMedia
   * @since 1.6.0
   * @return {MediaQueryList|Object}
   */

  xports['matchMedia'] = matchMedia ? function () {
    // matchMedia must be binded to window
    return matchMedia.apply(win, arguments);
  } : function () {
    // Gracefully degrade to plain object
    return {};
  };
  /**
   * @since 1.8.0
   * @return {{width:number, height:number}}
   */

  function viewport() {
    return {
      'width': viewportW(),
      'height': viewportH()
    };
  }

  xports['viewport'] = viewport;
  /**
   * Cross-browser window.scrollX
   * @since 1.0.0
   * @return {number}
   */

  xports['scrollX'] = function () {
    return win.pageXOffset || docElem.scrollLeft;
  };
  /**
   * Cross-browser window.scrollY
   * @since 1.0.0
   * @return {number}
   */


  xports['scrollY'] = function () {
    return win.pageYOffset || docElem.scrollTop;
  };
  /**
   * @param {{top:number, right:number, bottom:number, left:number}} coords
   * @param {number=} cushion adjustment
   * @return {Object}
   */


  function calibrate(coords, cushion) {
    var o = {};
    cushion = +cushion || 0;
    o['width'] = (o['right'] = coords['right'] + cushion) - (o['left'] = coords['left'] - cushion);
    o['height'] = (o['bottom'] = coords['bottom'] + cushion) - (o['top'] = coords['top'] - cushion);
    return o;
  }
  /**
   * Cross-browser element.getBoundingClientRect plus optional cushion.
   * Coords are relative to the top-left corner of the viewport.
   * @since 1.0.0
   * @param {Element|Object} el element or stack (uses first item)
   * @param {number=} cushion +/- pixel adjustment amount
   * @return {Object|boolean}
   */


  function rectangle(el, cushion) {
    el = el && !el.nodeType ? el[0] : el;
    if (!el || 1 !== el.nodeType) return false;
    return calibrate(el.getBoundingClientRect(), cushion);
  }

  xports['rectangle'] = rectangle;
  /**
   * Get the viewport aspect ratio (or the aspect ratio of an object or element)
   * @since 1.7.0
   * @param {(Element|Object)=} o optional object with width/height props or methods
   * @return {number}
   * @link http://w3.org/TR/css3-mediaqueries/#orientation
   */

  function aspect(o) {
    o = null == o ? viewport() : 1 === o.nodeType ? rectangle(o) : o;
    var h = o['height'],
        w = o['width'];
    h = typeof h == 'function' ? h.call(o) : h;
    w = typeof w == 'function' ? w.call(o) : w;
    return w / h;
  }

  xports['aspect'] = aspect;
  /**
   * Test if an element is in the same x-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */

  xports['inX'] = function (el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.right >= 0 && r.left <= viewportW();
  };
  /**
   * Test if an element is in the same y-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */


  xports['inY'] = function (el, cushion) {
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.top <= viewportH();
  };
  /**
   * Test if an element is in the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */


  xports['inViewport'] = function (el, cushion) {
    // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both
    // to avoid calling rectangle() twice. It gzips just as small like this.
    var r = rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
  };

  return xports;
});;"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*! picturefill - v3.0.2 - 2016-02-12
 * https://scottjehl.github.io/picturefill/
 * Copyright (c) 2016 https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Licensed MIT
 */
!function (a) {
  var b = navigator.userAgent;
  a.HTMLPictureElement && /ecko/.test(b) && b.match(/rv\:(\d+)/) && RegExp.$1 < 45 && addEventListener("resize", function () {
    var b,
        c = document.createElement("source"),
        d = function d(a) {
      var b,
          d,
          e = a.parentNode;
      "PICTURE" === e.nodeName.toUpperCase() ? (b = c.cloneNode(), e.insertBefore(b, e.firstElementChild), setTimeout(function () {
        e.removeChild(b);
      })) : (!a._pfLastSize || a.offsetWidth > a._pfLastSize) && (a._pfLastSize = a.offsetWidth, d = a.sizes, a.sizes += ",100vw", setTimeout(function () {
        a.sizes = d;
      }));
    },
        e = function e() {
      var a,
          b = document.querySelectorAll("picture > img, img[srcset][sizes]");

      for (a = 0; a < b.length; a++) {
        d(b[a]);
      }
    },
        f = function f() {
      clearTimeout(b), b = setTimeout(e, 99);
    },
        g = a.matchMedia && matchMedia("(orientation: landscape)"),
        h = function h() {
      f(), g && g.addListener && g.addListener(f);
    };

    return c.srcset = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", /^[c|i]|d$/.test(document.readyState || "") ? h() : document.addEventListener("DOMContentLoaded", h), f;
  }());
}(window), function (a, b, c) {
  "use strict";

  function d(a) {
    return " " === a || "	" === a || "\n" === a || "\f" === a || "\r" === a;
  }

  function e(b, c) {
    var d = new a.Image();
    return d.onerror = function () {
      A[b] = !1, ba();
    }, d.onload = function () {
      A[b] = 1 === d.width, ba();
    }, d.src = c, "pending";
  }

  function f() {
    M = !1, P = a.devicePixelRatio, N = {}, O = {}, s.DPR = P || 1, Q.width = Math.max(a.innerWidth || 0, z.clientWidth), Q.height = Math.max(a.innerHeight || 0, z.clientHeight), Q.vw = Q.width / 100, Q.vh = Q.height / 100, r = [Q.height, Q.width, P].join("-"), Q.em = s.getEmValue(), Q.rem = Q.em;
  }

  function g(a, b, c, d) {
    var e, f, g, h;
    return "saveData" === B.algorithm ? a > 2.7 ? h = c + 1 : (f = b - c, e = Math.pow(a - .6, 1.5), g = f * e, d && (g += .1 * e), h = a + g) : h = c > 1 ? Math.sqrt(a * b) : a, h > c;
  }

  function h(a) {
    var b,
        c = s.getSet(a),
        d = !1;
    "pending" !== c && (d = r, c && (b = s.setRes(c), s.applySetCandidate(b, a))), a[s.ns].evaled = d;
  }

  function i(a, b) {
    return a.res - b.res;
  }

  function j(a, b, c) {
    var d;
    return !c && b && (c = a[s.ns].sets, c = c && c[c.length - 1]), d = k(b, c), d && (b = s.makeUrl(b), a[s.ns].curSrc = b, a[s.ns].curCan = d, d.res || aa(d, d.set.sizes)), d;
  }

  function k(a, b) {
    var c, d, e;
    if (a && b) for (e = s.parseSet(b), a = s.makeUrl(a), c = 0; c < e.length; c++) {
      if (a === s.makeUrl(e[c].url)) {
        d = e[c];
        break;
      }
    }
    return d;
  }

  function l(a, b) {
    var c,
        d,
        e,
        f,
        g = a.getElementsByTagName("source");

    for (c = 0, d = g.length; d > c; c++) {
      e = g[c], e[s.ns] = !0, f = e.getAttribute("srcset"), f && b.push({
        srcset: f,
        media: e.getAttribute("media"),
        type: e.getAttribute("type"),
        sizes: e.getAttribute("sizes")
      });
    }
  }

  function m(a, b) {
    function c(b) {
      var c,
          d = b.exec(a.substring(m));
      return d ? (c = d[0], m += c.length, c) : void 0;
    }

    function e() {
      var a,
          c,
          d,
          e,
          f,
          i,
          j,
          k,
          l,
          m = !1,
          o = {};

      for (e = 0; e < h.length; e++) {
        f = h[e], i = f[f.length - 1], j = f.substring(0, f.length - 1), k = parseInt(j, 10), l = parseFloat(j), X.test(j) && "w" === i ? ((a || c) && (m = !0), 0 === k ? m = !0 : a = k) : Y.test(j) && "x" === i ? ((a || c || d) && (m = !0), 0 > l ? m = !0 : c = l) : X.test(j) && "h" === i ? ((d || c) && (m = !0), 0 === k ? m = !0 : d = k) : m = !0;
      }

      m || (o.url = g, a && (o.w = a), c && (o.d = c), d && (o.h = d), d || c || a || (o.d = 1), 1 === o.d && (b.has1x = !0), o.set = b, n.push(o));
    }

    function f() {
      for (c(T), i = "", j = "in descriptor";;) {
        if (k = a.charAt(m), "in descriptor" === j) {
          if (d(k)) i && (h.push(i), i = "", j = "after descriptor");else {
            if ("," === k) return m += 1, i && h.push(i), void e();
            if ("(" === k) i += k, j = "in parens";else {
              if ("" === k) return i && h.push(i), void e();
              i += k;
            }
          }
        } else if ("in parens" === j) {
          if (")" === k) i += k, j = "in descriptor";else {
            if ("" === k) return h.push(i), void e();
            i += k;
          }
        } else if ("after descriptor" === j) if (d(k)) ;else {
          if ("" === k) return void e();
          j = "in descriptor", m -= 1;
        }
        m += 1;
      }
    }

    for (var g, h, i, j, k, l = a.length, m = 0, n = [];;) {
      if (c(U), m >= l) return n;
      g = c(V), h = [], "," === g.slice(-1) ? (g = g.replace(W, ""), e()) : f();
    }
  }

  function n(a) {
    function b(a) {
      function b() {
        f && (g.push(f), f = "");
      }

      function c() {
        g[0] && (h.push(g), g = []);
      }

      for (var e, f = "", g = [], h = [], i = 0, j = 0, k = !1;;) {
        if (e = a.charAt(j), "" === e) return b(), c(), h;

        if (k) {
          if ("*" === e && "/" === a[j + 1]) {
            k = !1, j += 2, b();
            continue;
          }

          j += 1;
        } else {
          if (d(e)) {
            if (a.charAt(j - 1) && d(a.charAt(j - 1)) || !f) {
              j += 1;
              continue;
            }

            if (0 === i) {
              b(), j += 1;
              continue;
            }

            e = " ";
          } else if ("(" === e) i += 1;else if (")" === e) i -= 1;else {
            if ("," === e) {
              b(), c(), j += 1;
              continue;
            }

            if ("/" === e && "*" === a.charAt(j + 1)) {
              k = !0, j += 2;
              continue;
            }
          }

          f += e, j += 1;
        }
      }
    }

    function c(a) {
      return k.test(a) && parseFloat(a) >= 0 ? !0 : l.test(a) ? !0 : "0" === a || "-0" === a || "+0" === a ? !0 : !1;
    }

    var e,
        f,
        g,
        h,
        i,
        j,
        k = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,
        l = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i;

    for (f = b(a), g = f.length, e = 0; g > e; e++) {
      if (h = f[e], i = h[h.length - 1], c(i)) {
        if (j = i, h.pop(), 0 === h.length) return j;
        if (h = h.join(" "), s.matchesMedia(h)) return j;
      }
    }

    return "100vw";
  }

  b.createElement("picture");

  var o,
      p,
      q,
      r,
      s = {},
      t = !1,
      u = function u() {},
      v = b.createElement("img"),
      w = v.getAttribute,
      x = v.setAttribute,
      y = v.removeAttribute,
      z = b.documentElement,
      A = {},
      B = {
    algorithm: ""
  },
      C = "data-pfsrc",
      D = C + "set",
      E = navigator.userAgent,
      F = /rident/.test(E) || /ecko/.test(E) && E.match(/rv\:(\d+)/) && RegExp.$1 > 35,
      G = "currentSrc",
      H = /\s+\+?\d+(e\d+)?w/,
      I = /(\([^)]+\))?\s*(.+)/,
      J = a.picturefillCFG,
      K = "position:absolute;left:0;visibility:hidden;display:block;padding:0;border:none;font-size:1em;width:1em;overflow:hidden;clip:rect(0px, 0px, 0px, 0px)",
      L = "font-size:100%!important;",
      M = !0,
      N = {},
      O = {},
      P = a.devicePixelRatio,
      Q = {
    px: 1,
    "in": 96
  },
      R = b.createElement("a"),
      S = !1,
      T = /^[ \t\n\r\u000c]+/,
      U = /^[, \t\n\r\u000c]+/,
      V = /^[^ \t\n\r\u000c]+/,
      W = /[,]+$/,
      X = /^\d+$/,
      Y = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,
      Z = function Z(a, b, c, d) {
    a.addEventListener ? a.addEventListener(b, c, d || !1) : a.attachEvent && a.attachEvent("on" + b, c);
  },
      $ = function $(a) {
    var b = {};
    return function (c) {
      return c in b || (b[c] = a(c)), b[c];
    };
  },
      _ = function () {
    var a = /^([\d\.]+)(em|vw|px)$/,
        b = function b() {
      for (var a = arguments, b = 0, c = a[0]; (++b in a);) {
        c = c.replace(a[b], a[++b]);
      }

      return c;
    },
        c = $(function (a) {
      return "return " + b((a || "").toLowerCase(), /\band\b/g, "&&", /,/g, "||", /min-([a-z-\s]+):/g, "e.$1>=", /max-([a-z-\s]+):/g, "e.$1<=", /calc([^)]+)/g, "($1)", /(\d+[\.]*[\d]*)([a-z]+)/g, "($1 * e.$2)", /^(?!(e.[a-z]|[0-9\.&=|><\+\-\*\(\)\/])).*/gi, "") + ";";
    });

    return function (b, d) {
      var e;
      if (!(b in N)) if (N[b] = !1, d && (e = b.match(a))) N[b] = e[1] * Q[e[2]];else try {
        N[b] = new Function("e", c(b))(Q);
      } catch (f) {}
      return N[b];
    };
  }(),
      aa = function aa(a, b) {
    return a.w ? (a.cWidth = s.calcListLength(b || "100vw"), a.res = a.w / a.cWidth) : a.res = a.d, a;
  },
      ba = function ba(a) {
    if (t) {
      var c,
          d,
          e,
          f = a || {};

      if (f.elements && 1 === f.elements.nodeType && ("IMG" === f.elements.nodeName.toUpperCase() ? f.elements = [f.elements] : (f.context = f.elements, f.elements = null)), c = f.elements || s.qsa(f.context || b, f.reevaluate || f.reselect ? s.sel : s.selShort), e = c.length) {
        for (s.setupRun(f), S = !0, d = 0; e > d; d++) {
          s.fillImg(c[d], f);
        }

        s.teardownRun(f);
      }
    }
  };

  o = a.console && console.warn ? function (a) {
    console.warn(a);
  } : u, G in v || (G = "src"), A["image/jpeg"] = !0, A["image/gif"] = !0, A["image/png"] = !0, A["image/svg+xml"] = b.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1"), s.ns = ("pf" + new Date().getTime()).substr(0, 9), s.supSrcset = "srcset" in v, s.supSizes = "sizes" in v, s.supPicture = !!a.HTMLPictureElement, s.supSrcset && s.supPicture && !s.supSizes && !function (a) {
    v.srcset = "data:,a", a.src = "data:,a", s.supSrcset = v.complete === a.complete, s.supPicture = s.supSrcset && s.supPicture;
  }(b.createElement("img")), s.supSrcset && !s.supSizes ? !function () {
    var a = "data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw==",
        c = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        d = b.createElement("img"),
        e = function e() {
      var a = d.width;
      2 === a && (s.supSizes = !0), q = s.supSrcset && !s.supSizes, t = !0, setTimeout(ba);
    };

    d.onload = e, d.onerror = e, d.setAttribute("sizes", "9px"), d.srcset = c + " 1w," + a + " 9w", d.src = c;
  }() : t = !0, s.selShort = "picture>img,img[srcset]", s.sel = s.selShort, s.cfg = B, s.DPR = P || 1, s.u = Q, s.types = A, s.setSize = u, s.makeUrl = $(function (a) {
    return R.href = a, R.href;
  }), s.qsa = function (a, b) {
    return "querySelector" in a ? a.querySelectorAll(b) : [];
  }, s.matchesMedia = function () {
    return a.matchMedia && (matchMedia("(min-width: 0.1em)") || {}).matches ? s.matchesMedia = function (a) {
      return !a || matchMedia(a).matches;
    } : s.matchesMedia = s.mMQ, s.matchesMedia.apply(this, arguments);
  }, s.mMQ = function (a) {
    return a ? _(a) : !0;
  }, s.calcLength = function (a) {
    var b = _(a, !0) || !1;
    return 0 > b && (b = !1), b;
  }, s.supportsType = function (a) {
    return a ? A[a] : !0;
  }, s.parseSize = $(function (a) {
    var b = (a || "").match(I);
    return {
      media: b && b[1],
      length: b && b[2]
    };
  }), s.parseSet = function (a) {
    return a.cands || (a.cands = m(a.srcset, a)), a.cands;
  }, s.getEmValue = function () {
    var a;

    if (!p && (a = b.body)) {
      var c = b.createElement("div"),
          d = z.style.cssText,
          e = a.style.cssText;
      c.style.cssText = K, z.style.cssText = L, a.style.cssText = L, a.appendChild(c), p = c.offsetWidth, a.removeChild(c), p = parseFloat(p, 10), z.style.cssText = d, a.style.cssText = e;
    }

    return p || 16;
  }, s.calcListLength = function (a) {
    if (!(a in O) || B.uT) {
      var b = s.calcLength(n(a));
      O[a] = b ? b : Q.width;
    }

    return O[a];
  }, s.setRes = function (a) {
    var b;

    if (a) {
      b = s.parseSet(a);

      for (var c = 0, d = b.length; d > c; c++) {
        aa(b[c], a.sizes);
      }
    }

    return b;
  }, s.setRes.res = aa, s.applySetCandidate = function (a, b) {
    if (a.length) {
      var c,
          d,
          e,
          f,
          h,
          k,
          l,
          m,
          n,
          o = b[s.ns],
          p = s.DPR;
      if (k = o.curSrc || b[G], l = o.curCan || j(b, k, a[0].set), l && l.set === a[0].set && (n = F && !b.complete && l.res - .1 > p, n || (l.cached = !0, l.res >= p && (h = l))), !h) for (a.sort(i), f = a.length, h = a[f - 1], d = 0; f > d; d++) {
        if (c = a[d], c.res >= p) {
          e = d - 1, h = a[e] && (n || k !== s.makeUrl(c.url)) && g(a[e].res, c.res, p, a[e].cached) ? a[e] : c;
          break;
        }
      }
      h && (m = s.makeUrl(h.url), o.curSrc = m, o.curCan = h, m !== k && s.setSrc(b, h), s.setSize(b));
    }
  }, s.setSrc = function (a, b) {
    var c;
    a.src = b.url, "image/svg+xml" === b.set.type && (c = a.style.width, a.style.width = a.offsetWidth + 1 + "px", a.offsetWidth + 1 && (a.style.width = c));
  }, s.getSet = function (a) {
    var b,
        c,
        d,
        e = !1,
        f = a[s.ns].sets;

    for (b = 0; b < f.length && !e; b++) {
      if (c = f[b], c.srcset && s.matchesMedia(c.media) && (d = s.supportsType(c.type))) {
        "pending" === d && (c = d), e = c;
        break;
      }
    }

    return e;
  }, s.parseSets = function (a, b, d) {
    var e,
        f,
        g,
        h,
        i = b && "PICTURE" === b.nodeName.toUpperCase(),
        j = a[s.ns];
    (j.src === c || d.src) && (j.src = w.call(a, "src"), j.src ? x.call(a, C, j.src) : y.call(a, C)), (j.srcset === c || d.srcset || !s.supSrcset || a.srcset) && (e = w.call(a, "srcset"), j.srcset = e, h = !0), j.sets = [], i && (j.pic = !0, l(b, j.sets)), j.srcset ? (f = {
      srcset: j.srcset,
      sizes: w.call(a, "sizes")
    }, j.sets.push(f), g = (q || j.src) && H.test(j.srcset || ""), g || !j.src || k(j.src, f) || f.has1x || (f.srcset += ", " + j.src, f.cands.push({
      url: j.src,
      d: 1,
      set: f
    }))) : j.src && j.sets.push({
      srcset: j.src,
      sizes: null
    }), j.curCan = null, j.curSrc = c, j.supported = !(i || f && !s.supSrcset || g && !s.supSizes), h && s.supSrcset && !j.supported && (e ? (x.call(a, D, e), a.srcset = "") : y.call(a, D)), j.supported && !j.srcset && (!j.src && a.src || a.src !== s.makeUrl(j.src)) && (null === j.src ? a.removeAttribute("src") : a.src = j.src), j.parsed = !0;
  }, s.fillImg = function (a, b) {
    var c,
        d = b.reselect || b.reevaluate;
    a[s.ns] || (a[s.ns] = {}), c = a[s.ns], (d || c.evaled !== r) && ((!c.parsed || b.reevaluate) && s.parseSets(a, a.parentNode, b), c.supported ? c.evaled = r : h(a));
  }, s.setupRun = function () {
    (!S || M || P !== a.devicePixelRatio) && f();
  }, s.supPicture ? (ba = u, s.fillImg = u) : !function () {
    var c,
        d = a.attachEvent ? /d$|^c/ : /d$|^c|^i/,
        e = function e() {
      var a = b.readyState || "";
      f = setTimeout(e, "loading" === a ? 200 : 999), b.body && (s.fillImgs(), c = c || d.test(a), c && clearTimeout(f));
    },
        f = setTimeout(e, b.body ? 9 : 99),
        g = function g(a, b) {
      var c,
          d,
          e = function e() {
        var f = new Date() - d;
        b > f ? c = setTimeout(e, b - f) : (c = null, a());
      };

      return function () {
        d = new Date(), c || (c = setTimeout(e, b));
      };
    },
        h = z.clientHeight,
        i = function i() {
      M = Math.max(a.innerWidth || 0, z.clientWidth) !== Q.width || z.clientHeight !== h, h = z.clientHeight, M && s.fillImgs();
    };

    Z(a, "resize", g(i, 99)), Z(b, "readystatechange", e);
  }(), s.picturefill = ba, s.fillImgs = ba, s.teardownRun = u, ba._ = s, a.picturefillCFG = {
    pf: s,
    push: function push(a) {
      var b = a.shift();
      "function" == typeof s[b] ? s[b].apply(s, a) : (B[b] = a[0], S && s.fillImgs({
        reselect: !0
      }));
    }
  };

  for (; J && J.length;) {
    a.picturefillCFG.push(J.shift());
  }

  a.picturefill = ba, "object" == (typeof module === "undefined" ? "undefined" : _typeof(module)) && "object" == _typeof(module.exports) ? module.exports = ba : "function" == typeof define && define.amd && define("picturefill", function () {
    return ba;
  }), s.supPicture || (A["image/webp"] = e("image/webp", "data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA=="));
}(window, document);;"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

!function () {
  "use strict";

  if ("undefined" != typeof window) {
    var t = window.navigator.userAgent.match(/Edge\/(\d{2})\./),
        n = !!t && 16 <= parseInt(t[1], 10);

    if (!("objectFit" in document.documentElement.style != !1) || n) {
      var o = function o(t, e, i) {
        var n, o, l, a, d;
        if ((i = i.split(" ")).length < 2 && (i[1] = i[0]), "x" === t) n = i[0], o = i[1], l = "left", a = "right", d = e.clientWidth;else {
          if ("y" !== t) return;
          n = i[1], o = i[0], l = "top", a = "bottom", d = e.clientHeight;
        }

        if (n !== l && o !== l) {
          if (n !== a && o !== a) return "center" === n || "50%" === n ? (e.style[l] = "50%", void (e.style["margin-" + l] = d / -2 + "px")) : void (0 <= n.indexOf("%") ? (n = parseInt(n)) < 50 ? (e.style[l] = n + "%", e.style["margin-" + l] = d * (n / -100) + "px") : (n = 100 - n, e.style[a] = n + "%", e.style["margin-" + a] = d * (n / -100) + "px") : e.style[l] = n);
          e.style[a] = "0";
        } else e.style[l] = "0";
      },
          l = function l(t) {
        var e = t.dataset ? t.dataset.objectFit : t.getAttribute("data-object-fit"),
            i = t.dataset ? t.dataset.objectPosition : t.getAttribute("data-object-position");
        e = e || "cover", i = i || "50% 50%";
        var n = t.parentNode;
        return function (t) {
          var e = window.getComputedStyle(t, null),
              i = e.getPropertyValue("position"),
              n = e.getPropertyValue("overflow"),
              o = e.getPropertyValue("display");
          i && "static" !== i || (t.style.position = "relative"), "hidden" !== n && (t.style.overflow = "hidden"), o && "inline" !== o || (t.style.display = "block"), 0 === t.clientHeight && (t.style.height = "100%"), -1 === t.className.indexOf("object-fit-polyfill") && (t.className = t.className + " object-fit-polyfill");
        }(n), function (t) {
          var e = window.getComputedStyle(t, null),
              i = {
            "max-width": "none",
            "max-height": "none",
            "min-width": "0px",
            "min-height": "0px",
            top: "auto",
            right: "auto",
            bottom: "auto",
            left: "auto",
            "margin-top": "0px",
            "margin-right": "0px",
            "margin-bottom": "0px",
            "margin-left": "0px"
          };

          for (var n in i) {
            e.getPropertyValue(n) !== i[n] && (t.style[n] = i[n]);
          }
        }(t), t.style.position = "absolute", t.style.width = "auto", t.style.height = "auto", "scale-down" === e && (e = t.clientWidth < n.clientWidth && t.clientHeight < n.clientHeight ? "none" : "contain"), "none" === e ? (o("x", t, i), void o("y", t, i)) : "fill" === e ? (t.style.width = "100%", t.style.height = "100%", o("x", t, i), void o("y", t, i)) : (t.style.height = "100%", void ("cover" === e && t.clientWidth > n.clientWidth || "contain" === e && t.clientWidth < n.clientWidth ? (t.style.top = "0", t.style.marginTop = "0", o("x", t, i)) : (t.style.width = "100%", t.style.height = "auto", t.style.left = "0", t.style.marginLeft = "0", o("y", t, i))));
      },
          e = function e(t) {
        if (void 0 === t || t instanceof Event) t = document.querySelectorAll("[data-object-fit]");else if (t && t.nodeName) t = [t];else {
          if ("object" != _typeof(t) || !t.length || !t[0].nodeName) return !1;
          t = t;
        }

        for (var e = 0; e < t.length; e++) {
          if (t[e].nodeName) {
            var i = t[e].nodeName.toLowerCase();

            if ("img" === i) {
              if (n) continue;
              t[e].complete ? l(t[e]) : t[e].addEventListener("load", function () {
                l(this);
              });
            } else "video" === i ? 0 < t[e].readyState ? l(t[e]) : t[e].addEventListener("loadedmetadata", function () {
              l(this);
            }) : l(t[e]);
          }
        }

        return !0;
      };

      "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", e) : e(), window.addEventListener("resize", e), window.objectFitPolyfill = e;
    } else window.objectFitPolyfill = function () {
      return !1;
    };
  }
}();;"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Isotope PACKAGED v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */
(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /* globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('jquery-bridget/jquery-bridget', ['jquery'], function (jQuery) {
      return factory(window, jQuery);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('jquery'));
  } else {
    // browser global
    window.jQueryBridget = factory(window, window.jQuery);
  }
})(window, function factory(window, jQuery) {
  'use strict'; // ----- utils ----- //

  var arraySlice = Array.prototype.slice; // helper function for logging errors
  // $.error breaks jQuery chaining

  var console = window.console;
  var logError = typeof console == 'undefined' ? function () {} : function (message) {
    console.error(message);
  }; // ----- jQueryBridget ----- //

  function jQueryBridget(namespace, PluginClass, $) {
    $ = $ || jQuery || window.jQuery;

    if (!$) {
      return;
    } // add option method -> $().plugin('option', {...})


    if (!PluginClass.prototype.option) {
      // option setter
      PluginClass.prototype.option = function (opts) {
        // bail out if not an object
        if (!$.isPlainObject(opts)) {
          return;
        }

        this.options = $.extend(true, this.options, opts);
      };
    } // make jQuery plugin


    $.fn[namespace] = function (arg0
    /*, arg1 */
    ) {
      if (typeof arg0 == 'string') {
        // method call $().plugin( 'methodName', { options } )
        // shift arguments by 1
        var args = arraySlice.call(arguments, 1);
        return methodCall(this, arg0, args);
      } // just $().plugin({ options })


      plainCall(this, arg0);
      return this;
    }; // $().plugin('methodName')


    function methodCall($elems, methodName, args) {
      var returnValue;
      var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';
      $elems.each(function (i, elem) {
        // get instance
        var instance = $.data(elem, namespace);

        if (!instance) {
          logError(namespace + ' not initialized. Cannot call methods, i.e. ' + pluginMethodStr);
          return;
        }

        var method = instance[methodName];

        if (!method || methodName.charAt(0) == '_') {
          logError(pluginMethodStr + ' is not a valid method');
          return;
        } // apply method, get return value


        var value = method.apply(instance, args); // set return value if value is returned, use only first value

        returnValue = returnValue === undefined ? value : returnValue;
      });
      return returnValue !== undefined ? returnValue : $elems;
    }

    function plainCall($elems, options) {
      $elems.each(function (i, elem) {
        var instance = $.data(elem, namespace);

        if (instance) {
          // set options & init
          instance.option(options);

          instance._init();
        } else {
          // initialize new instance
          instance = new PluginClass(elem, options);
          $.data(elem, namespace, instance);
        }
      });
    }

    updateJQuery($);
  } // ----- updateJQuery ----- //
  // set $.bridget for v1 backwards compatibility


  function updateJQuery($) {
    if (!$ || $ && $.bridget) {
      return;
    }

    $.bridget = jQueryBridget;
  }

  updateJQuery(jQuery || window.jQuery); // -----  ----- //

  return jQueryBridget;
});
/**
 * EvEmitter v1.1.0
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */


(function (global, factory) {
  // universal module definition

  /* jshint strict: false */

  /* globals define, module, window */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('ev-emitter/ev-emitter', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }
})(typeof window != 'undefined' ? window : void 0, function () {
  function EvEmitter() {}

  var proto = EvEmitter.prototype;

  proto.on = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    } // set events hash


    var events = this._events = this._events || {}; // set listeners array

    var listeners = events[eventName] = events[eventName] || []; // only add once

    if (listeners.indexOf(listener) == -1) {
      listeners.push(listener);
    }

    return this;
  };

  proto.once = function (eventName, listener) {
    if (!eventName || !listener) {
      return;
    } // add event


    this.on(eventName, listener); // set once flag
    // set onceEvents hash

    var onceEvents = this._onceEvents = this._onceEvents || {}; // set onceListeners object

    var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {}; // set flag

    onceListeners[listener] = true;
    return this;
  };

  proto.off = function (eventName, listener) {
    var listeners = this._events && this._events[eventName];

    if (!listeners || !listeners.length) {
      return;
    }

    var index = listeners.indexOf(listener);

    if (index != -1) {
      listeners.splice(index, 1);
    }

    return this;
  };

  proto.emitEvent = function (eventName, args) {
    var listeners = this._events && this._events[eventName];

    if (!listeners || !listeners.length) {
      return;
    } // copy over to avoid interference if .off() in listener


    listeners = listeners.slice(0);
    args = args || []; // once stuff

    var onceListeners = this._onceEvents && this._onceEvents[eventName];

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      var isOnce = onceListeners && onceListeners[listener];

      if (isOnce) {
        // remove listener
        // remove before trigger to prevent recursion
        this.off(eventName, listener); // unset once flag

        delete onceListeners[listener];
      } // trigger listener


      listener.apply(this, args);
    }

    return this;
  };

  proto.allOff = function () {
    delete this._events;
    delete this._onceEvents;
  };

  return EvEmitter;
});
/*!
 * getSize v2.0.3
 * measure size of elements
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

/* globals console: false */


(function (window, factory) {
  /* jshint strict: false */

  /* globals define, module */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('get-size/get-size', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }
})(window, function factory() {
  'use strict'; // -------------------------- helpers -------------------------- //
  // get a number from a string, not a percentage

  function getStyleSize(value) {
    var num = parseFloat(value); // not a percent like '100%', and a number

    var isValid = value.indexOf('%') == -1 && !isNaN(num);
    return isValid && num;
  }

  function noop() {}

  var logError = typeof console == 'undefined' ? noop : function (message) {
    console.error(message);
  }; // -------------------------- measurements -------------------------- //

  var measurements = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth'];
  var measurementsLength = measurements.length;

  function getZeroSize() {
    var size = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    };

    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      size[measurement] = 0;
    }

    return size;
  } // -------------------------- getStyle -------------------------- //

  /**
   * getStyle, get style of element, check for Firefox bug
   * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
   */


  function getStyle(elem) {
    var style = getComputedStyle(elem);

    if (!style) {
      logError('Style returned ' + style + '. Are you running this code in a hidden iframe on Firefox? ' + 'See https://bit.ly/getsizebug1');
    }

    return style;
  } // -------------------------- setup -------------------------- //


  var isSetup = false;
  var isBoxSizeOuter;
  /**
   * setup
   * check isBoxSizerOuter
   * do on first getSize() rather than on page load for Firefox bug
   */

  function setup() {
    // setup once
    if (isSetup) {
      return;
    }

    isSetup = true; // -------------------------- box sizing -------------------------- //

    /**
     * Chrome & Safari measure the outer-width on style.width on border-box elems
     * IE11 & Firefox<29 measures the inner-width
     */

    var div = document.createElement('div');
    div.style.width = '200px';
    div.style.padding = '1px 2px 3px 4px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '1px 2px 3px 4px';
    div.style.boxSizing = 'border-box';
    var body = document.body || document.documentElement;
    body.appendChild(div);
    var style = getStyle(div); // round value for browser zoom. desandro/masonry#928

    isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
    getSize.isBoxSizeOuter = isBoxSizeOuter;
    body.removeChild(div);
  } // -------------------------- getSize -------------------------- //


  function getSize(elem) {
    setup(); // use querySeletor if elem is string

    if (typeof elem == 'string') {
      elem = document.querySelector(elem);
    } // do not proceed on non-objects


    if (!elem || _typeof(elem) != 'object' || !elem.nodeType) {
      return;
    }

    var style = getStyle(elem); // if hidden, everything is 0

    if (style.display == 'none') {
      return getZeroSize();
    }

    var size = {};
    size.width = elem.offsetWidth;
    size.height = elem.offsetHeight;
    var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box'; // get all measurements

    for (var i = 0; i < measurementsLength; i++) {
      var measurement = measurements[i];
      var value = style[measurement];
      var num = parseFloat(value); // any 'auto', 'medium' value will be 0

      size[measurement] = !isNaN(num) ? num : 0;
    }

    var paddingWidth = size.paddingLeft + size.paddingRight;
    var paddingHeight = size.paddingTop + size.paddingBottom;
    var marginWidth = size.marginLeft + size.marginRight;
    var marginHeight = size.marginTop + size.marginBottom;
    var borderWidth = size.borderLeftWidth + size.borderRightWidth;
    var borderHeight = size.borderTopWidth + size.borderBottomWidth;
    var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter; // overwrite width and height if we can get it from style

    var styleWidth = getStyleSize(style.width);

    if (styleWidth !== false) {
      size.width = styleWidth + ( // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
    }

    var styleHeight = getStyleSize(style.height);

    if (styleHeight !== false) {
      size.height = styleHeight + ( // add padding and border unless it's already including it
      isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
    }

    size.innerWidth = size.width - (paddingWidth + borderWidth);
    size.innerHeight = size.height - (paddingHeight + borderHeight);
    size.outerWidth = size.width + marginWidth;
    size.outerHeight = size.height + marginHeight;
    return size;
  }

  return getSize;
});
/**
 * matchesSelector v2.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */


(function (window, factory) {
  /*global define: false, module: false */
  'use strict'; // universal module definition

  if (typeof define == 'function' && define.amd) {
    // AMD
    define('desandro-matches-selector/matches-selector', factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }
})(window, function factory() {
  'use strict';

  var matchesMethod = function () {
    var ElemProto = window.Element.prototype; // check for the standard method name first

    if (ElemProto.matches) {
      return 'matches';
    } // check un-prefixed


    if (ElemProto.matchesSelector) {
      return 'matchesSelector';
    } // check vendor prefixes


    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    for (var i = 0; i < prefixes.length; i++) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';

      if (ElemProto[method]) {
        return method;
      }
    }
  }();

  return function matchesSelector(elem, selector) {
    return elem[matchesMethod](selector);
  };
});
/**
 * Fizzy UI utils v2.0.7
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */


(function (window, factory) {
  // universal module definition

  /*jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('fizzy-ui-utils/utils', ['desandro-matches-selector/matches-selector'], function (matchesSelector) {
      return factory(window, matchesSelector);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('desandro-matches-selector'));
  } else {
    // browser global
    window.fizzyUIUtils = factory(window, window.matchesSelector);
  }
})(window, function factory(window, matchesSelector) {
  var utils = {}; // ----- extend ----- //
  // extends objects

  utils.extend = function (a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }

    return a;
  }; // ----- modulo ----- //


  utils.modulo = function (num, div) {
    return (num % div + div) % div;
  }; // ----- makeArray ----- //


  var arraySlice = Array.prototype.slice; // turn element or nodeList into an array

  utils.makeArray = function (obj) {
    if (Array.isArray(obj)) {
      // use object if already an array
      return obj;
    } // return empty array if undefined or null. #6


    if (obj === null || obj === undefined) {
      return [];
    }

    var isArrayLike = _typeof(obj) == 'object' && typeof obj.length == 'number';

    if (isArrayLike) {
      // convert nodeList to array
      return arraySlice.call(obj);
    } // array of single index


    return [obj];
  }; // ----- removeFrom ----- //


  utils.removeFrom = function (ary, obj) {
    var index = ary.indexOf(obj);

    if (index != -1) {
      ary.splice(index, 1);
    }
  }; // ----- getParent ----- //


  utils.getParent = function (elem, selector) {
    while (elem.parentNode && elem != document.body) {
      elem = elem.parentNode;

      if (matchesSelector(elem, selector)) {
        return elem;
      }
    }
  }; // ----- getQueryElement ----- //
  // use element as selector string


  utils.getQueryElement = function (elem) {
    if (typeof elem == 'string') {
      return document.querySelector(elem);
    }

    return elem;
  }; // ----- handleEvent ----- //
  // enable .ontype to trigger from .addEventListener( elem, 'type' )


  utils.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  }; // ----- filterFindElements ----- //


  utils.filterFindElements = function (elems, selector) {
    // make array of elems
    elems = utils.makeArray(elems);
    var ffElems = [];
    elems.forEach(function (elem) {
      // check that elem is an actual element
      if (!(elem instanceof HTMLElement)) {
        return;
      } // add elem if no selector


      if (!selector) {
        ffElems.push(elem);
        return;
      } // filter & find items if we have a selector
      // filter


      if (matchesSelector(elem, selector)) {
        ffElems.push(elem);
      } // find children


      var childElems = elem.querySelectorAll(selector); // concat childElems to filterFound array

      for (var i = 0; i < childElems.length; i++) {
        ffElems.push(childElems[i]);
      }
    });
    return ffElems;
  }; // ----- debounceMethod ----- //


  utils.debounceMethod = function (_class, methodName, threshold) {
    threshold = threshold || 100; // original method

    var method = _class.prototype[methodName];
    var timeoutName = methodName + 'Timeout';

    _class.prototype[methodName] = function () {
      var timeout = this[timeoutName];
      clearTimeout(timeout);
      var args = arguments;

      var _this = this;

      this[timeoutName] = setTimeout(function () {
        method.apply(_this, args);
        delete _this[timeoutName];
      }, threshold);
    };
  }; // ----- docReady ----- //


  utils.docReady = function (callback) {
    var readyState = document.readyState;

    if (readyState == 'complete' || readyState == 'interactive') {
      // do async to allow for other scripts to run. metafizzy/flickity#441
      setTimeout(callback);
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }; // ----- htmlInit ----- //
  // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/


  utils.toDashed = function (str) {
    return str.replace(/(.)([A-Z])/g, function (match, $1, $2) {
      return $1 + '-' + $2;
    }).toLowerCase();
  };

  var console = window.console;
  /**
   * allow user to initialize classes via [data-namespace] or .js-namespace class
   * htmlInit( Widget, 'widgetName' )
   * options are parsed from data-namespace-options
   */

  utils.htmlInit = function (WidgetClass, namespace) {
    utils.docReady(function () {
      var dashedNamespace = utils.toDashed(namespace);
      var dataAttr = 'data-' + dashedNamespace;
      var dataAttrElems = document.querySelectorAll('[' + dataAttr + ']');
      var jsDashElems = document.querySelectorAll('.js-' + dashedNamespace);
      var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
      var dataOptionsAttr = dataAttr + '-options';
      var jQuery = window.jQuery;
      elems.forEach(function (elem) {
        var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
        var options;

        try {
          options = attr && JSON.parse(attr);
        } catch (error) {
          // log error, do not initialize
          if (console) {
            console.error('Error parsing ' + dataAttr + ' on ' + elem.className + ': ' + error);
          }

          return;
        } // initialize


        var instance = new WidgetClass(elem, options); // make available via $().data('namespace')

        if (jQuery) {
          jQuery.data(elem, namespace, instance);
        }
      });
    });
  }; // -----  ----- //


  return utils;
});
/**
 * Outlayer Item
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /* globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('outlayer/item', ['ev-emitter/ev-emitter', 'get-size/get-size'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(require('ev-emitter'), require('get-size'));
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(window.EvEmitter, window.getSize);
  }
})(window, function factory(EvEmitter, getSize) {
  'use strict'; // ----- helpers ----- //

  function isEmptyObj(obj) {
    for (var prop in obj) {
      return false;
    }

    prop = null;
    return true;
  } // -------------------------- CSS3 support -------------------------- //


  var docElemStyle = document.documentElement.style;
  var transitionProperty = typeof docElemStyle.transition == 'string' ? 'transition' : 'WebkitTransition';
  var transformProperty = typeof docElemStyle.transform == 'string' ? 'transform' : 'WebkitTransform';
  var transitionEndEvent = {
    WebkitTransition: 'webkitTransitionEnd',
    transition: 'transitionend'
  }[transitionProperty]; // cache all vendor properties that could have vendor prefix

  var vendorProperties = {
    transform: transformProperty,
    transition: transitionProperty,
    transitionDuration: transitionProperty + 'Duration',
    transitionProperty: transitionProperty + 'Property',
    transitionDelay: transitionProperty + 'Delay'
  }; // -------------------------- Item -------------------------- //

  function Item(element, layout) {
    if (!element) {
      return;
    }

    this.element = element; // parent layout class, i.e. Masonry, Isotope, or Packery

    this.layout = layout;
    this.position = {
      x: 0,
      y: 0
    };

    this._create();
  } // inherit EvEmitter


  var proto = Item.prototype = Object.create(EvEmitter.prototype);
  proto.constructor = Item;

  proto._create = function () {
    // transition objects
    this._transn = {
      ingProperties: {},
      clean: {},
      onEnd: {}
    };
    this.css({
      position: 'absolute'
    });
  }; // trigger specified handler for event type


  proto.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
  };
  /**
   * apply CSS styles to element
   * @param {Object} style
   */


  proto.css = function (style) {
    var elemStyle = this.element.style;

    for (var prop in style) {
      // use vendor property if available
      var supportedProp = vendorProperties[prop] || prop;
      elemStyle[supportedProp] = style[prop];
    }
  }; // measure position, and sets it


  proto.getPosition = function () {
    var style = getComputedStyle(this.element);

    var isOriginLeft = this.layout._getOption('originLeft');

    var isOriginTop = this.layout._getOption('originTop');

    var xValue = style[isOriginLeft ? 'left' : 'right'];
    var yValue = style[isOriginTop ? 'top' : 'bottom'];
    var x = parseFloat(xValue);
    var y = parseFloat(yValue); // convert percent to pixels

    var layoutSize = this.layout.size;

    if (xValue.indexOf('%') != -1) {
      x = x / 100 * layoutSize.width;
    }

    if (yValue.indexOf('%') != -1) {
      y = y / 100 * layoutSize.height;
    } // clean up 'auto' or other non-integer values


    x = isNaN(x) ? 0 : x;
    y = isNaN(y) ? 0 : y; // remove padding from measurement

    x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
    y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;
    this.position.x = x;
    this.position.y = y;
  }; // set settled position, apply padding


  proto.layoutPosition = function () {
    var layoutSize = this.layout.size;
    var style = {};

    var isOriginLeft = this.layout._getOption('originLeft');

    var isOriginTop = this.layout._getOption('originTop'); // x


    var xPadding = isOriginLeft ? 'paddingLeft' : 'paddingRight';
    var xProperty = isOriginLeft ? 'left' : 'right';
    var xResetProperty = isOriginLeft ? 'right' : 'left';
    var x = this.position.x + layoutSize[xPadding]; // set in percentage or pixels

    style[xProperty] = this.getXValue(x); // reset other property

    style[xResetProperty] = ''; // y

    var yPadding = isOriginTop ? 'paddingTop' : 'paddingBottom';
    var yProperty = isOriginTop ? 'top' : 'bottom';
    var yResetProperty = isOriginTop ? 'bottom' : 'top';
    var y = this.position.y + layoutSize[yPadding]; // set in percentage or pixels

    style[yProperty] = this.getYValue(y); // reset other property

    style[yResetProperty] = '';
    this.css(style);
    this.emitEvent('layout', [this]);
  };

  proto.getXValue = function (x) {
    var isHorizontal = this.layout._getOption('horizontal');

    return this.layout.options.percentPosition && !isHorizontal ? x / this.layout.size.width * 100 + '%' : x + 'px';
  };

  proto.getYValue = function (y) {
    var isHorizontal = this.layout._getOption('horizontal');

    return this.layout.options.percentPosition && isHorizontal ? y / this.layout.size.height * 100 + '%' : y + 'px';
  };

  proto._transitionTo = function (x, y) {
    this.getPosition(); // get current x & y from top/left

    var curX = this.position.x;
    var curY = this.position.y;
    var didNotMove = x == this.position.x && y == this.position.y; // save end position

    this.setPosition(x, y); // if did not move and not transitioning, just go to layout

    if (didNotMove && !this.isTransitioning) {
      this.layoutPosition();
      return;
    }

    var transX = x - curX;
    var transY = y - curY;
    var transitionStyle = {};
    transitionStyle.transform = this.getTranslate(transX, transY);
    this.transition({
      to: transitionStyle,
      onTransitionEnd: {
        transform: this.layoutPosition
      },
      isCleaning: true
    });
  };

  proto.getTranslate = function (x, y) {
    // flip cooridinates if origin on right or bottom
    var isOriginLeft = this.layout._getOption('originLeft');

    var isOriginTop = this.layout._getOption('originTop');

    x = isOriginLeft ? x : -x;
    y = isOriginTop ? y : -y;
    return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  }; // non transition + transform support


  proto.goTo = function (x, y) {
    this.setPosition(x, y);
    this.layoutPosition();
  };

  proto.moveTo = proto._transitionTo;

  proto.setPosition = function (x, y) {
    this.position.x = parseFloat(x);
    this.position.y = parseFloat(y);
  }; // ----- transition ----- //

  /**
   * @param {Object} style - CSS
   * @param {Function} onTransitionEnd
   */
  // non transition, just trigger callback


  proto._nonTransition = function (args) {
    this.css(args.to);

    if (args.isCleaning) {
      this._removeStyles(args.to);
    }

    for (var prop in args.onTransitionEnd) {
      args.onTransitionEnd[prop].call(this);
    }
  };
  /**
   * proper transition
   * @param {Object} args - arguments
   *   @param {Object} to - style to transition to
   *   @param {Object} from - style to start transition from
   *   @param {Boolean} isCleaning - removes transition styles after transition
   *   @param {Function} onTransitionEnd - callback
   */


  proto.transition = function (args) {
    // redirect to nonTransition if no transition duration
    if (!parseFloat(this.layout.options.transitionDuration)) {
      this._nonTransition(args);

      return;
    }

    var _transition = this._transn; // keep track of onTransitionEnd callback by css property

    for (var prop in args.onTransitionEnd) {
      _transition.onEnd[prop] = args.onTransitionEnd[prop];
    } // keep track of properties that are transitioning


    for (prop in args.to) {
      _transition.ingProperties[prop] = true; // keep track of properties to clean up when transition is done

      if (args.isCleaning) {
        _transition.clean[prop] = true;
      }
    } // set from styles


    if (args.from) {
      this.css(args.from); // force redraw. http://blog.alexmaccaw.com/css-transitions

      var h = this.element.offsetHeight; // hack for JSHint to hush about unused var

      h = null;
    } // enable transition


    this.enableTransition(args.to); // set styles that are transitioning

    this.css(args.to);
    this.isTransitioning = true;
  }; // dash before all cap letters, including first for
  // WebkitTransform => -webkit-transform


  function toDashedAll(str) {
    return str.replace(/([A-Z])/g, function ($1) {
      return '-' + $1.toLowerCase();
    });
  }

  var transitionProps = 'opacity,' + toDashedAll(transformProperty);

  proto.enableTransition = function ()
  /* style */
  {
    // HACK changing transitionProperty during a transition
    // will cause transition to jump
    if (this.isTransitioning) {
      return;
    } // make `transition: foo, bar, baz` from style object
    // HACK un-comment this when enableTransition can work
    // while a transition is happening
    // var transitionValues = [];
    // for ( var prop in style ) {
    //   // dash-ify camelCased properties like WebkitTransition
    //   prop = vendorProperties[ prop ] || prop;
    //   transitionValues.push( toDashedAll( prop ) );
    // }
    // munge number to millisecond, to match stagger


    var duration = this.layout.options.transitionDuration;
    duration = typeof duration == 'number' ? duration + 'ms' : duration; // enable transition styles

    this.css({
      transitionProperty: transitionProps,
      transitionDuration: duration,
      transitionDelay: this.staggerDelay || 0
    }); // listen for transition end event

    this.element.addEventListener(transitionEndEvent, this, false);
  }; // ----- events ----- //


  proto.onwebkitTransitionEnd = function (event) {
    this.ontransitionend(event);
  };

  proto.onotransitionend = function (event) {
    this.ontransitionend(event);
  }; // properties that I munge to make my life easier


  var dashedVendorProperties = {
    '-webkit-transform': 'transform'
  };

  proto.ontransitionend = function (event) {
    // disregard bubbled events from children
    if (event.target !== this.element) {
      return;
    }

    var _transition = this._transn; // get property name of transitioned property, convert to prefix-free

    var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName; // remove property that has completed transitioning

    delete _transition.ingProperties[propertyName]; // check if any properties are still transitioning

    if (isEmptyObj(_transition.ingProperties)) {
      // all properties have completed transitioning
      this.disableTransition();
    } // clean style


    if (propertyName in _transition.clean) {
      // clean up style
      this.element.style[event.propertyName] = '';
      delete _transition.clean[propertyName];
    } // trigger onTransitionEnd callback


    if (propertyName in _transition.onEnd) {
      var onTransitionEnd = _transition.onEnd[propertyName];
      onTransitionEnd.call(this);
      delete _transition.onEnd[propertyName];
    }

    this.emitEvent('transitionEnd', [this]);
  };

  proto.disableTransition = function () {
    this.removeTransitionStyles();
    this.element.removeEventListener(transitionEndEvent, this, false);
    this.isTransitioning = false;
  };
  /**
   * removes style property from element
   * @param {Object} style
  **/


  proto._removeStyles = function (style) {
    // clean up transition styles
    var cleanStyle = {};

    for (var prop in style) {
      cleanStyle[prop] = '';
    }

    this.css(cleanStyle);
  };

  var cleanTransitionStyle = {
    transitionProperty: '',
    transitionDuration: '',
    transitionDelay: ''
  };

  proto.removeTransitionStyles = function () {
    // remove transition
    this.css(cleanTransitionStyle);
  }; // ----- stagger ----- //


  proto.stagger = function (delay) {
    delay = isNaN(delay) ? 0 : delay;
    this.staggerDelay = delay + 'ms';
  }; // ----- show/hide/remove ----- //
  // remove element from DOM


  proto.removeElem = function () {
    this.element.parentNode.removeChild(this.element); // remove display: none

    this.css({
      display: ''
    });
    this.emitEvent('remove', [this]);
  };

  proto.remove = function () {
    // just remove element if no transition support or no transition
    if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
      this.removeElem();
      return;
    } // start transition


    this.once('transitionEnd', function () {
      this.removeElem();
    });
    this.hide();
  };

  proto.reveal = function () {
    delete this.isHidden; // remove display: none

    this.css({
      display: ''
    });
    var options = this.layout.options;
    var onTransitionEnd = {};
    var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
    onTransitionEnd[transitionEndProperty] = this.onRevealTransitionEnd;
    this.transition({
      from: options.hiddenStyle,
      to: options.visibleStyle,
      isCleaning: true,
      onTransitionEnd: onTransitionEnd
    });
  };

  proto.onRevealTransitionEnd = function () {
    // check if still visible
    // during transition, item may have been hidden
    if (!this.isHidden) {
      this.emitEvent('reveal');
    }
  };
  /**
   * get style property use for hide/reveal transition end
   * @param {String} styleProperty - hiddenStyle/visibleStyle
   * @returns {String}
   */


  proto.getHideRevealTransitionEndProperty = function (styleProperty) {
    var optionStyle = this.layout.options[styleProperty]; // use opacity

    if (optionStyle.opacity) {
      return 'opacity';
    } // get first property


    for (var prop in optionStyle) {
      return prop;
    }
  };

  proto.hide = function () {
    // set flag
    this.isHidden = true; // remove display: none

    this.css({
      display: ''
    });
    var options = this.layout.options;
    var onTransitionEnd = {};
    var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
    onTransitionEnd[transitionEndProperty] = this.onHideTransitionEnd;
    this.transition({
      from: options.visibleStyle,
      to: options.hiddenStyle,
      // keep hidden stuff hidden
      isCleaning: true,
      onTransitionEnd: onTransitionEnd
    });
  };

  proto.onHideTransitionEnd = function () {
    // check if still hidden
    // during transition, item may have been un-hidden
    if (this.isHidden) {
      this.css({
        display: 'none'
      });
      this.emitEvent('hide');
    }
  };

  proto.destroy = function () {
    this.css({
      position: '',
      left: '',
      right: '',
      top: '',
      bottom: '',
      transition: '',
      transform: ''
    });
  };

  return Item;
});
/*!
 * Outlayer v2.1.1
 * the brains and guts of a layout library
 * MIT license
 */


(function (window, factory) {
  'use strict'; // universal module definition

  /* jshint strict: false */

  /* globals define, module, require */

  if (typeof define == 'function' && define.amd) {
    // AMD - RequireJS
    define('outlayer/outlayer', ['ev-emitter/ev-emitter', 'get-size/get-size', 'fizzy-ui-utils/utils', './item'], function (EvEmitter, getSize, utils, Item) {
      return factory(window, EvEmitter, getSize, utils, Item);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(window, require('ev-emitter'), require('get-size'), require('fizzy-ui-utils'), require('./item'));
  } else {
    // browser global
    window.Outlayer = factory(window, window.EvEmitter, window.getSize, window.fizzyUIUtils, window.Outlayer.Item);
  }
})(window, function factory(window, EvEmitter, getSize, utils, Item) {
  'use strict'; // ----- vars ----- //

  var console = window.console;
  var jQuery = window.jQuery;

  var noop = function noop() {}; // -------------------------- Outlayer -------------------------- //
  // globally unique identifiers


  var GUID = 0; // internal store of all Outlayer intances

  var instances = {};
  /**
   * @param {Element, String} element
   * @param {Object} options
   * @constructor
   */

  function Outlayer(element, options) {
    var queryElement = utils.getQueryElement(element);

    if (!queryElement) {
      if (console) {
        console.error('Bad element for ' + this.constructor.namespace + ': ' + (queryElement || element));
      }

      return;
    }

    this.element = queryElement; // add jQuery

    if (jQuery) {
      this.$element = jQuery(this.element);
    } // options


    this.options = utils.extend({}, this.constructor.defaults);
    this.option(options); // add id for Outlayer.getFromElement

    var id = ++GUID;
    this.element.outlayerGUID = id; // expando

    instances[id] = this; // associate via id
    // kick it off

    this._create();

    var isInitLayout = this._getOption('initLayout');

    if (isInitLayout) {
      this.layout();
    }
  } // settings are for internal use only


  Outlayer.namespace = 'outlayer';
  Outlayer.Item = Item; // default options

  Outlayer.defaults = {
    containerStyle: {
      position: 'relative'
    },
    initLayout: true,
    originLeft: true,
    originTop: true,
    resize: true,
    resizeContainer: true,
    // item options
    transitionDuration: '0.4s',
    hiddenStyle: {
      opacity: 0,
      transform: 'scale(0.001)'
    },
    visibleStyle: {
      opacity: 1,
      transform: 'scale(1)'
    }
  };
  var proto = Outlayer.prototype; // inherit EvEmitter

  utils.extend(proto, EvEmitter.prototype);
  /**
   * set options
   * @param {Object} opts
   */

  proto.option = function (opts) {
    utils.extend(this.options, opts);
  };
  /**
   * get backwards compatible option value, check old name
   */


  proto._getOption = function (option) {
    var oldOption = this.constructor.compatOptions[option];
    return oldOption && this.options[oldOption] !== undefined ? this.options[oldOption] : this.options[option];
  };

  Outlayer.compatOptions = {
    // currentName: oldName
    initLayout: 'isInitLayout',
    horizontal: 'isHorizontal',
    layoutInstant: 'isLayoutInstant',
    originLeft: 'isOriginLeft',
    originTop: 'isOriginTop',
    resize: 'isResizeBound',
    resizeContainer: 'isResizingContainer'
  };

  proto._create = function () {
    // get items from children
    this.reloadItems(); // elements that affect layout, but are not laid out

    this.stamps = [];
    this.stamp(this.options.stamp); // set container style

    utils.extend(this.element.style, this.options.containerStyle); // bind resize method

    var canBindResize = this._getOption('resize');

    if (canBindResize) {
      this.bindResize();
    }
  }; // goes through all children again and gets bricks in proper order


  proto.reloadItems = function () {
    // collection of item elements
    this.items = this._itemize(this.element.children);
  };
  /**
   * turn elements into Outlayer.Items to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - collection of new Outlayer Items
   */


  proto._itemize = function (elems) {
    var itemElems = this._filterFindItemElements(elems);

    var Item = this.constructor.Item; // create new Outlayer Items for collection

    var items = [];

    for (var i = 0; i < itemElems.length; i++) {
      var elem = itemElems[i];
      var item = new Item(elem, this);
      items.push(item);
    }

    return items;
  };
  /**
   * get item elements to be used in layout
   * @param {Array or NodeList or HTMLElement} elems
   * @returns {Array} items - item elements
   */


  proto._filterFindItemElements = function (elems) {
    return utils.filterFindElements(elems, this.options.itemSelector);
  };
  /**
   * getter method for getting item elements
   * @returns {Array} elems - collection of item elements
   */


  proto.getItemElements = function () {
    return this.items.map(function (item) {
      return item.element;
    });
  }; // ----- init & layout ----- //

  /**
   * lays out all items
   */


  proto.layout = function () {
    this._resetLayout();

    this._manageStamps(); // don't animate first layout


    var layoutInstant = this._getOption('layoutInstant');

    var isInstant = layoutInstant !== undefined ? layoutInstant : !this._isLayoutInited;
    this.layoutItems(this.items, isInstant); // flag for initalized

    this._isLayoutInited = true;
  }; // _init is alias for layout


  proto._init = proto.layout;
  /**
   * logic before any new layout
   */

  proto._resetLayout = function () {
    this.getSize();
  };

  proto.getSize = function () {
    this.size = getSize(this.element);
  };
  /**
   * get measurement from option, for columnWidth, rowHeight, gutter
   * if option is String -> get element from selector string, & get size of element
   * if option is Element -> get size of element
   * else use option as a number
   *
   * @param {String} measurement
   * @param {String} size - width or height
   * @private
   */


  proto._getMeasurement = function (measurement, size) {
    var option = this.options[measurement];
    var elem;

    if (!option) {
      // default to 0
      this[measurement] = 0;
    } else {
      // use option as an element
      if (typeof option == 'string') {
        elem = this.element.querySelector(option);
      } else if (option instanceof HTMLElement) {
        elem = option;
      } // use size of element, if element


      this[measurement] = elem ? getSize(elem)[size] : option;
    }
  };
  /**
   * layout a collection of item elements
   * @api public
   */


  proto.layoutItems = function (items, isInstant) {
    items = this._getItemsForLayout(items);

    this._layoutItems(items, isInstant);

    this._postLayout();
  };
  /**
   * get the items to be laid out
   * you may want to skip over some items
   * @param {Array} items
   * @returns {Array} items
   */


  proto._getItemsForLayout = function (items) {
    return items.filter(function (item) {
      return !item.isIgnored;
    });
  };
  /**
   * layout items
   * @param {Array} items
   * @param {Boolean} isInstant
   */


  proto._layoutItems = function (items, isInstant) {
    this._emitCompleteOnItems('layout', items);

    if (!items || !items.length) {
      // no items, emit event with empty array
      return;
    }

    var queue = [];
    items.forEach(function (item) {
      // get x/y object from method
      var position = this._getItemLayoutPosition(item); // enqueue


      position.item = item;
      position.isInstant = isInstant || item.isLayoutInstant;
      queue.push(position);
    }, this);

    this._processLayoutQueue(queue);
  };
  /**
   * get item layout position
   * @param {Outlayer.Item} item
   * @returns {Object} x and y position
   */


  proto._getItemLayoutPosition = function ()
  /* item */
  {
    return {
      x: 0,
      y: 0
    };
  };
  /**
   * iterate over array and position each item
   * Reason being - separating this logic prevents 'layout invalidation'
   * thx @paul_irish
   * @param {Array} queue
   */


  proto._processLayoutQueue = function (queue) {
    this.updateStagger();
    queue.forEach(function (obj, i) {
      this._positionItem(obj.item, obj.x, obj.y, obj.isInstant, i);
    }, this);
  }; // set stagger from option in milliseconds number


  proto.updateStagger = function () {
    var stagger = this.options.stagger;

    if (stagger === null || stagger === undefined) {
      this.stagger = 0;
      return;
    }

    this.stagger = getMilliseconds(stagger);
    return this.stagger;
  };
  /**
   * Sets position of item in DOM
   * @param {Outlayer.Item} item
   * @param {Number} x - horizontal position
   * @param {Number} y - vertical position
   * @param {Boolean} isInstant - disables transitions
   */


  proto._positionItem = function (item, x, y, isInstant, i) {
    if (isInstant) {
      // if not transition, just set CSS
      item.goTo(x, y);
    } else {
      item.stagger(i * this.stagger);
      item.moveTo(x, y);
    }
  };
  /**
   * Any logic you want to do after each layout,
   * i.e. size the container
   */


  proto._postLayout = function () {
    this.resizeContainer();
  };

  proto.resizeContainer = function () {
    var isResizingContainer = this._getOption('resizeContainer');

    if (!isResizingContainer) {
      return;
    }

    var size = this._getContainerSize();

    if (size) {
      this._setContainerMeasure(size.width, true);

      this._setContainerMeasure(size.height, false);
    }
  };
  /**
   * Sets width or height of container if returned
   * @returns {Object} size
   *   @param {Number} width
   *   @param {Number} height
   */


  proto._getContainerSize = noop;
  /**
   * @param {Number} measure - size of width or height
   * @param {Boolean} isWidth
   */

  proto._setContainerMeasure = function (measure, isWidth) {
    if (measure === undefined) {
      return;
    }

    var elemSize = this.size; // add padding and border width if border box

    if (elemSize.isBorderBox) {
      measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight + elemSize.borderLeftWidth + elemSize.borderRightWidth : elemSize.paddingBottom + elemSize.paddingTop + elemSize.borderTopWidth + elemSize.borderBottomWidth;
    }

    measure = Math.max(measure, 0);
    this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
  };
  /**
   * emit eventComplete on a collection of items events
   * @param {String} eventName
   * @param {Array} items - Outlayer.Items
   */


  proto._emitCompleteOnItems = function (eventName, items) {
    var _this = this;

    function onComplete() {
      _this.dispatchEvent(eventName + 'Complete', null, [items]);
    }

    var count = items.length;

    if (!items || !count) {
      onComplete();
      return;
    }

    var doneCount = 0;

    function tick() {
      doneCount++;

      if (doneCount == count) {
        onComplete();
      }
    } // bind callback


    items.forEach(function (item) {
      item.once(eventName, tick);
    });
  };
  /**
   * emits events via EvEmitter and jQuery events
   * @param {String} type - name of event
   * @param {Event} event - original event
   * @param {Array} args - extra arguments
   */


  proto.dispatchEvent = function (type, event, args) {
    // add original event to arguments
    var emitArgs = event ? [event].concat(args) : args;
    this.emitEvent(type, emitArgs);

    if (jQuery) {
      // set this.$element
      this.$element = this.$element || jQuery(this.element);

      if (event) {
        // create jQuery event
        var $event = jQuery.Event(event);
        $event.type = type;
        this.$element.trigger($event, args);
      } else {
        // just trigger with type if no event available
        this.$element.trigger(type, args);
      }
    }
  }; // -------------------------- ignore & stamps -------------------------- //

  /**
   * keep item in collection, but do not lay it out
   * ignored items do not get skipped in layout
   * @param {Element} elem
   */


  proto.ignore = function (elem) {
    var item = this.getItem(elem);

    if (item) {
      item.isIgnored = true;
    }
  };
  /**
   * return item to layout collection
   * @param {Element} elem
   */


  proto.unignore = function (elem) {
    var item = this.getItem(elem);

    if (item) {
      delete item.isIgnored;
    }
  };
  /**
   * adds elements to stamps
   * @param {NodeList, Array, Element, or String} elems
   */


  proto.stamp = function (elems) {
    elems = this._find(elems);

    if (!elems) {
      return;
    }

    this.stamps = this.stamps.concat(elems); // ignore

    elems.forEach(this.ignore, this);
  };
  /**
   * removes elements to stamps
   * @param {NodeList, Array, or Element} elems
   */


  proto.unstamp = function (elems) {
    elems = this._find(elems);

    if (!elems) {
      return;
    }

    elems.forEach(function (elem) {
      // filter out removed stamp elements
      utils.removeFrom(this.stamps, elem);
      this.unignore(elem);
    }, this);
  };
  /**
   * finds child elements
   * @param {NodeList, Array, Element, or String} elems
   * @returns {Array} elems
   */


  proto._find = function (elems) {
    if (!elems) {
      return;
    } // if string, use argument as selector string


    if (typeof elems == 'string') {
      elems = this.element.querySelectorAll(elems);
    }

    elems = utils.makeArray(elems);
    return elems;
  };

  proto._manageStamps = function () {
    if (!this.stamps || !this.stamps.length) {
      return;
    }

    this._getBoundingRect();

    this.stamps.forEach(this._manageStamp, this);
  }; // update boundingLeft / Top


  proto._getBoundingRect = function () {
    // get bounding rect for container element
    var boundingRect = this.element.getBoundingClientRect();
    var size = this.size;
    this._boundingRect = {
      left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
      top: boundingRect.top + size.paddingTop + size.borderTopWidth,
      right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
      bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
    };
  };
  /**
   * @param {Element} stamp
  **/


  proto._manageStamp = noop;
  /**
   * get x/y position of element relative to container element
   * @param {Element} elem
   * @returns {Object} offset - has left, top, right, bottom
   */

  proto._getElementOffset = function (elem) {
    var boundingRect = elem.getBoundingClientRect();
    var thisRect = this._boundingRect;
    var size = getSize(elem);
    var offset = {
      left: boundingRect.left - thisRect.left - size.marginLeft,
      top: boundingRect.top - thisRect.top - size.marginTop,
      right: thisRect.right - boundingRect.right - size.marginRight,
      bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
    };
    return offset;
  }; // -------------------------- resize -------------------------- //
  // enable event handlers for listeners
  // i.e. resize -> onresize


  proto.handleEvent = utils.handleEvent;
  /**
   * Bind layout to window resizing
   */

  proto.bindResize = function () {
    window.addEventListener('resize', this);
    this.isResizeBound = true;
  };
  /**
   * Unbind layout to window resizing
   */


  proto.unbindResize = function () {
    window.removeEventListener('resize', this);
    this.isResizeBound = false;
  };

  proto.onresize = function () {
    this.resize();
  };

  utils.debounceMethod(Outlayer, 'onresize', 100);

  proto.resize = function () {
    // don't trigger if size did not change
    // or if resize was unbound. See #9
    if (!this.isResizeBound || !this.needsResizeLayout()) {
      return;
    }

    this.layout();
  };
  /**
   * check if layout is needed post layout
   * @returns Boolean
   */


  proto.needsResizeLayout = function () {
    var size = getSize(this.element); // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be

    var hasSizes = this.size && size;
    return hasSizes && size.innerWidth !== this.size.innerWidth;
  }; // -------------------------- methods -------------------------- //

  /**
   * add items to Outlayer instance
   * @param {Array or NodeList or Element} elems
   * @returns {Array} items - Outlayer.Items
  **/


  proto.addItems = function (elems) {
    var items = this._itemize(elems); // add items to collection


    if (items.length) {
      this.items = this.items.concat(items);
    }

    return items;
  };
  /**
   * Layout newly-appended item elements
   * @param {Array or NodeList or Element} elems
   */


  proto.appended = function (elems) {
    var items = this.addItems(elems);

    if (!items.length) {
      return;
    } // layout and reveal just the new items


    this.layoutItems(items, true);
    this.reveal(items);
  };
  /**
   * Layout prepended elements
   * @param {Array or NodeList or Element} elems
   */


  proto.prepended = function (elems) {
    var items = this._itemize(elems);

    if (!items.length) {
      return;
    } // add items to beginning of collection


    var previousItems = this.items.slice(0);
    this.items = items.concat(previousItems); // start new layout

    this._resetLayout();

    this._manageStamps(); // layout new stuff without transition


    this.layoutItems(items, true);
    this.reveal(items); // layout previous items

    this.layoutItems(previousItems);
  };
  /**
   * reveal a collection of items
   * @param {Array of Outlayer.Items} items
   */


  proto.reveal = function (items) {
    this._emitCompleteOnItems('reveal', items);

    if (!items || !items.length) {
      return;
    }

    var stagger = this.updateStagger();
    items.forEach(function (item, i) {
      item.stagger(i * stagger);
      item.reveal();
    });
  };
  /**
   * hide a collection of items
   * @param {Array of Outlayer.Items} items
   */


  proto.hide = function (items) {
    this._emitCompleteOnItems('hide', items);

    if (!items || !items.length) {
      return;
    }

    var stagger = this.updateStagger();
    items.forEach(function (item, i) {
      item.stagger(i * stagger);
      item.hide();
    });
  };
  /**
   * reveal item elements
   * @param {Array}, {Element}, {NodeList} items
   */


  proto.revealItemElements = function (elems) {
    var items = this.getItems(elems);
    this.reveal(items);
  };
  /**
   * hide item elements
   * @param {Array}, {Element}, {NodeList} items
   */


  proto.hideItemElements = function (elems) {
    var items = this.getItems(elems);
    this.hide(items);
  };
  /**
   * get Outlayer.Item, given an Element
   * @param {Element} elem
   * @param {Function} callback
   * @returns {Outlayer.Item} item
   */


  proto.getItem = function (elem) {
    // loop through items to get the one that matches
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];

      if (item.element == elem) {
        // return item
        return item;
      }
    }
  };
  /**
   * get collection of Outlayer.Items, given Elements
   * @param {Array} elems
   * @returns {Array} items - Outlayer.Items
   */


  proto.getItems = function (elems) {
    elems = utils.makeArray(elems);
    var items = [];
    elems.forEach(function (elem) {
      var item = this.getItem(elem);

      if (item) {
        items.push(item);
      }
    }, this);
    return items;
  };
  /**
   * remove element(s) from instance and DOM
   * @param {Array or NodeList or Element} elems
   */


  proto.remove = function (elems) {
    var removeItems = this.getItems(elems);

    this._emitCompleteOnItems('remove', removeItems); // bail if no items to remove


    if (!removeItems || !removeItems.length) {
      return;
    }

    removeItems.forEach(function (item) {
      item.remove(); // remove item from collection

      utils.removeFrom(this.items, item);
    }, this);
  }; // ----- destroy ----- //
  // remove and disable Outlayer instance


  proto.destroy = function () {
    // clean up dynamic styles
    var style = this.element.style;
    style.height = '';
    style.position = '';
    style.width = ''; // destroy items

    this.items.forEach(function (item) {
      item.destroy();
    });
    this.unbindResize();
    var id = this.element.outlayerGUID;
    delete instances[id]; // remove reference to instance by id

    delete this.element.outlayerGUID; // remove data for jQuery

    if (jQuery) {
      jQuery.removeData(this.element, this.constructor.namespace);
    }
  }; // -------------------------- data -------------------------- //

  /**
   * get Outlayer instance from element
   * @param {Element} elem
   * @returns {Outlayer}
   */


  Outlayer.data = function (elem) {
    elem = utils.getQueryElement(elem);
    var id = elem && elem.outlayerGUID;
    return id && instances[id];
  }; // -------------------------- create Outlayer class -------------------------- //

  /**
   * create a layout class
   * @param {String} namespace
   */


  Outlayer.create = function (namespace, options) {
    // sub-class Outlayer
    var Layout = subclass(Outlayer); // apply new options and compatOptions

    Layout.defaults = utils.extend({}, Outlayer.defaults);
    utils.extend(Layout.defaults, options);
    Layout.compatOptions = utils.extend({}, Outlayer.compatOptions);
    Layout.namespace = namespace;
    Layout.data = Outlayer.data; // sub-class Item

    Layout.Item = subclass(Item); // -------------------------- declarative -------------------------- //

    utils.htmlInit(Layout, namespace); // -------------------------- jQuery bridge -------------------------- //
    // make into jQuery plugin

    if (jQuery && jQuery.bridget) {
      jQuery.bridget(namespace, Layout);
    }

    return Layout;
  };

  function subclass(Parent) {
    function SubClass() {
      Parent.apply(this, arguments);
    }

    SubClass.prototype = Object.create(Parent.prototype);
    SubClass.prototype.constructor = SubClass;
    return SubClass;
  } // ----- helpers ----- //
  // how many milliseconds are in each unit


  var msUnits = {
    ms: 1,
    s: 1000
  }; // munge time-like parameter into millisecond number
  // '0.4s' -> 40

  function getMilliseconds(time) {
    if (typeof time == 'number') {
      return time;
    }

    var matches = time.match(/(^\d*\.?\d*)(\w*)/);
    var num = matches && matches[1];
    var unit = matches && matches[2];

    if (!num.length) {
      return 0;
    }

    num = parseFloat(num);
    var mult = msUnits[unit] || 1;
    return num * mult;
  } // ----- fin ----- //
  // back in global


  Outlayer.Item = Item;
  return Outlayer;
});
/**
 * Isotope Item
**/


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('isotope-layout/js/item', ['outlayer/outlayer'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('outlayer'));
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.Item = factory(window.Outlayer);
  }
})(window, function factory(Outlayer) {
  'use strict'; // -------------------------- Item -------------------------- //
  // sub-class Outlayer Item

  function Item() {
    Outlayer.Item.apply(this, arguments);
  }

  var proto = Item.prototype = Object.create(Outlayer.Item.prototype);
  var _create = proto._create;

  proto._create = function () {
    // assign id, used for original-order sorting
    this.id = this.layout.itemGUID++;

    _create.call(this);

    this.sortData = {};
  };

  proto.updateSortData = function () {
    if (this.isIgnored) {
      return;
    } // default sorters


    this.sortData.id = this.id; // for backward compatibility

    this.sortData['original-order'] = this.id;
    this.sortData.random = Math.random(); // go thru getSortData obj and apply the sorters

    var getSortData = this.layout.options.getSortData;
    var sorters = this.layout._sorters;

    for (var key in getSortData) {
      var sorter = sorters[key];
      this.sortData[key] = sorter(this.element, this);
    }
  };

  var _destroy = proto.destroy;

  proto.destroy = function () {
    // call super
    _destroy.apply(this, arguments); // reset display, #741


    this.css({
      display: ''
    });
  };

  return Item;
});
/**
 * Isotope LayoutMode
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('isotope-layout/js/layout-mode', ['get-size/get-size', 'outlayer/outlayer'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('get-size'), require('outlayer'));
  } else {
    // browser global
    window.Isotope = window.Isotope || {};
    window.Isotope.LayoutMode = factory(window.getSize, window.Outlayer);
  }
})(window, function factory(getSize, Outlayer) {
  'use strict'; // layout mode class

  function LayoutMode(isotope) {
    this.isotope = isotope; // link properties

    if (isotope) {
      this.options = isotope.options[this.namespace];
      this.element = isotope.element;
      this.items = isotope.filteredItems;
      this.size = isotope.size;
    }
  }

  var proto = LayoutMode.prototype;
  /**
   * some methods should just defer to default Outlayer method
   * and reference the Isotope instance as `this`
  **/

  var facadeMethods = ['_resetLayout', '_getItemLayoutPosition', '_manageStamp', '_getContainerSize', '_getElementOffset', 'needsResizeLayout', '_getOption'];
  facadeMethods.forEach(function (methodName) {
    proto[methodName] = function () {
      return Outlayer.prototype[methodName].apply(this.isotope, arguments);
    };
  }); // -----  ----- //
  // for horizontal layout modes, check vertical size

  proto.needsVerticalResizeLayout = function () {
    // don't trigger if size did not change
    var size = getSize(this.isotope.element); // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be

    var hasSizes = this.isotope.size && size;
    return hasSizes && size.innerHeight != this.isotope.size.innerHeight;
  }; // ----- measurements ----- //


  proto._getMeasurement = function () {
    this.isotope._getMeasurement.apply(this, arguments);
  };

  proto.getColumnWidth = function () {
    this.getSegmentSize('column', 'Width');
  };

  proto.getRowHeight = function () {
    this.getSegmentSize('row', 'Height');
  };
  /**
   * get columnWidth or rowHeight
   * segment: 'column' or 'row'
   * size 'Width' or 'Height'
  **/


  proto.getSegmentSize = function (segment, size) {
    var segmentName = segment + size;
    var outerSize = 'outer' + size; // columnWidth / outerWidth // rowHeight / outerHeight

    this._getMeasurement(segmentName, outerSize); // got rowHeight or columnWidth, we can chill


    if (this[segmentName]) {
      return;
    } // fall back to item of first element


    var firstItemSize = this.getFirstItemSize();
    this[segmentName] = firstItemSize && firstItemSize[outerSize] || // or size of container
    this.isotope.size['inner' + size];
  };

  proto.getFirstItemSize = function () {
    var firstItem = this.isotope.filteredItems[0];
    return firstItem && firstItem.element && getSize(firstItem.element);
  }; // ----- methods that should reference isotope ----- //


  proto.layout = function () {
    this.isotope.layout.apply(this.isotope, arguments);
  };

  proto.getSize = function () {
    this.isotope.getSize();
    this.size = this.isotope.size;
  }; // -------------------------- create -------------------------- //


  LayoutMode.modes = {};

  LayoutMode.create = function (namespace, options) {
    function Mode() {
      LayoutMode.apply(this, arguments);
    }

    Mode.prototype = Object.create(proto);
    Mode.prototype.constructor = Mode; // default options

    if (options) {
      Mode.options = options;
    }

    Mode.prototype.namespace = namespace; // register in Isotope

    LayoutMode.modes[namespace] = Mode;
    return Mode;
  };

  return LayoutMode;
});
/*!
 * Masonry v4.2.1
 * Cascading grid layout library
 * https://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('masonry-layout/masonry', ['outlayer/outlayer', 'get-size/get-size'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('outlayer'), require('get-size'));
  } else {
    // browser global
    window.Masonry = factory(window.Outlayer, window.getSize);
  }
})(window, function factory(Outlayer, getSize) {
  // -------------------------- masonryDefinition -------------------------- //
  // create an Outlayer layout class
  var Masonry = Outlayer.create('masonry'); // isFitWidth -> fitWidth

  Masonry.compatOptions.fitWidth = 'isFitWidth';
  var proto = Masonry.prototype;

  proto._resetLayout = function () {
    this.getSize();

    this._getMeasurement('columnWidth', 'outerWidth');

    this._getMeasurement('gutter', 'outerWidth');

    this.measureColumns(); // reset column Y

    this.colYs = [];

    for (var i = 0; i < this.cols; i++) {
      this.colYs.push(0);
    }

    this.maxY = 0;
    this.horizontalColIndex = 0;
  };

  proto.measureColumns = function () {
    this.getContainerWidth(); // if columnWidth is 0, default to outerWidth of first item

    if (!this.columnWidth) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element; // columnWidth fall back to item of first element

      this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth || // if first elem has no width, default to size of container
      this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter; // calculate columns

    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth; // fix rounding errors, typically with gutters

    var excess = columnWidth - containerWidth % columnWidth; // if overshoot is less than a pixel, round up, otherwise floor it

    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[mathMethod](cols);
    this.cols = Math.max(cols, 1);
  };

  proto.getContainerWidth = function () {
    // container is parent if fit width
    var isFitWidth = this._getOption('fitWidth');

    var container = isFitWidth ? this.element.parentNode : this.element; // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be

    var size = getSize(container);
    this.containerWidth = size && size.innerWidth;
  };

  proto._getItemLayoutPosition = function (item) {
    item.getSize(); // how many columns does this brick span

    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil'; // round if off by 1 pixel, otherwise use ceil

    var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
    colSpan = Math.min(colSpan, this.cols); // use horizontal or top column position

    var colPosMethod = this.options.horizontalOrder ? '_getHorizontalColPosition' : '_getTopColPosition';
    var colPosition = this[colPosMethod](colSpan, item); // position the brick

    var position = {
      x: this.columnWidth * colPosition.col,
      y: colPosition.y
    }; // apply setHeight to necessary columns

    var setHeight = colPosition.y + item.size.outerHeight;
    var setMax = colSpan + colPosition.col;

    for (var i = colPosition.col; i < setMax; i++) {
      this.colYs[i] = setHeight;
    }

    return position;
  };

  proto._getTopColPosition = function (colSpan) {
    var colGroup = this._getTopColGroup(colSpan); // get the minimum Y value from the columns


    var minimumY = Math.min.apply(Math, colGroup);
    return {
      col: colGroup.indexOf(minimumY),
      y: minimumY
    };
  };
  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */


  proto._getTopColGroup = function (colSpan) {
    if (colSpan < 2) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = []; // how many different places could this brick fit horizontally

    var groupCount = this.cols + 1 - colSpan; // for each group potential horizontal position

    for (var i = 0; i < groupCount; i++) {
      colGroup[i] = this._getColGroupY(i, colSpan);
    }

    return colGroup;
  };

  proto._getColGroupY = function (col, colSpan) {
    if (colSpan < 2) {
      return this.colYs[col];
    } // make an array of colY values for that one group


    var groupColYs = this.colYs.slice(col, col + colSpan); // and get the max value of the array

    return Math.max.apply(Math, groupColYs);
  }; // get column position based on horizontal index. #873


  proto._getHorizontalColPosition = function (colSpan, item) {
    var col = this.horizontalColIndex % this.cols;
    var isOver = colSpan > 1 && col + colSpan > this.cols; // shift to next row if item can't fit on current row

    col = isOver ? 0 : col; // don't let zero-size items take up space

    var hasSize = item.size.outerWidth && item.size.outerHeight;
    this.horizontalColIndex = hasSize ? col + colSpan : this.horizontalColIndex;
    return {
      col: col,
      y: this._getColGroupY(col, colSpan)
    };
  };

  proto._manageStamp = function (stamp) {
    var stampSize = getSize(stamp);

    var offset = this._getElementOffset(stamp); // get the columns that this stamp affects


    var isOriginLeft = this._getOption('originLeft');

    var firstX = isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor(firstX / this.columnWidth);
    firstCol = Math.max(0, firstCol);
    var lastCol = Math.floor(lastX / this.columnWidth); // lastCol should not go over if multiple of columnWidth #425

    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min(this.cols - 1, lastCol); // set colYs to bottom of the stamp

    var isOriginTop = this._getOption('originTop');

    var stampMaxY = (isOriginTop ? offset.top : offset.bottom) + stampSize.outerHeight;

    for (var i = firstCol; i <= lastCol; i++) {
      this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
    }
  };

  proto._getContainerSize = function () {
    this.maxY = Math.max.apply(Math, this.colYs);
    var size = {
      height: this.maxY
    };

    if (this._getOption('fitWidth')) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  proto._getContainerFitWidth = function () {
    var unusedCols = 0; // count unused columns

    var i = this.cols;

    while (--i) {
      if (this.colYs[i] !== 0) {
        break;
      }

      unusedCols++;
    } // fit container to columns that have been used


    return (this.cols - unusedCols) * this.columnWidth - this.gutter;
  };

  proto.needsResizeLayout = function () {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth != this.containerWidth;
  };

  return Masonry;
});
/*!
 * Masonry layout mode
 * sub-classes Masonry
 * https://masonry.desandro.com
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('isotope-layout/js/layout-modes/masonry', ['../layout-mode', 'masonry-layout/masonry'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('../layout-mode'), require('masonry-layout'));
  } else {
    // browser global
    factory(window.Isotope.LayoutMode, window.Masonry);
  }
})(window, function factory(LayoutMode, Masonry) {
  'use strict'; // -------------------------- masonryDefinition -------------------------- //
  // create an Outlayer layout class

  var MasonryMode = LayoutMode.create('masonry');
  var proto = MasonryMode.prototype;
  var keepModeMethods = {
    _getElementOffset: true,
    layout: true,
    _getMeasurement: true
  }; // inherit Masonry prototype

  for (var method in Masonry.prototype) {
    // do not inherit mode methods
    if (!keepModeMethods[method]) {
      proto[method] = Masonry.prototype[method];
    }
  }

  var measureColumns = proto.measureColumns;

  proto.measureColumns = function () {
    // set items, used if measuring first item
    this.items = this.isotope.filteredItems;
    measureColumns.call(this);
  }; // point to mode options for fitWidth


  var _getOption = proto._getOption;

  proto._getOption = function (option) {
    if (option == 'fitWidth') {
      return this.options.isFitWidth !== undefined ? this.options.isFitWidth : this.options.fitWidth;
    }

    return _getOption.apply(this.isotope, arguments);
  };

  return MasonryMode;
});
/**
 * fitRows layout mode
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('isotope-layout/js/layout-modes/fit-rows', ['../layout-mode'], factory);
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) == 'object') {
    // CommonJS
    module.exports = factory(require('../layout-mode'));
  } else {
    // browser global
    factory(window.Isotope.LayoutMode);
  }
})(window, function factory(LayoutMode) {
  'use strict';

  var FitRows = LayoutMode.create('fitRows');
  var proto = FitRows.prototype;

  proto._resetLayout = function () {
    this.x = 0;
    this.y = 0;
    this.maxY = 0;

    this._getMeasurement('gutter', 'outerWidth');
  };

  proto._getItemLayoutPosition = function (item) {
    item.getSize();
    var itemWidth = item.size.outerWidth + this.gutter; // if this element cannot fit in the current row

    var containerWidth = this.isotope.size.innerWidth + this.gutter;

    if (this.x !== 0 && itemWidth + this.x > containerWidth) {
      this.x = 0;
      this.y = this.maxY;
    }

    var position = {
      x: this.x,
      y: this.y
    };
    this.maxY = Math.max(this.maxY, this.y + item.size.outerHeight);
    this.x += itemWidth;
    return position;
  };

  proto._getContainerSize = function () {
    return {
      height: this.maxY
    };
  };

  return FitRows;
});
/**
 * vertical layout mode
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define('isotope-layout/js/layout-modes/vertical', ['../layout-mode'], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('../layout-mode'));
  } else {
    // browser global
    factory(window.Isotope.LayoutMode);
  }
})(window, function factory(LayoutMode) {
  'use strict';

  var Vertical = LayoutMode.create('vertical', {
    horizontalAlignment: 0
  });
  var proto = Vertical.prototype;

  proto._resetLayout = function () {
    this.y = 0;
  };

  proto._getItemLayoutPosition = function (item) {
    item.getSize();
    var x = (this.isotope.size.innerWidth - item.size.outerWidth) * this.options.horizontalAlignment;
    var y = this.y;
    this.y += item.size.outerHeight;
    return {
      x: x,
      y: y
    };
  };

  proto._getContainerSize = function () {
    return {
      height: this.y
    };
  };

  return Vertical;
});
/*!
 * Isotope v3.0.6
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * https://isotope.metafizzy.co
 * Copyright 2010-2018 Metafizzy
 */


(function (window, factory) {
  // universal module definition

  /* jshint strict: false */

  /*globals define, module, require */
  if (typeof define == 'function' && define.amd) {
    // AMD
    define(['outlayer/outlayer', 'get-size/get-size', 'desandro-matches-selector/matches-selector', 'fizzy-ui-utils/utils', 'isotope-layout/js/item', 'isotope-layout/js/layout-mode', // include default layout modes
    'isotope-layout/js/layout-modes/masonry', 'isotope-layout/js/layout-modes/fit-rows', 'isotope-layout/js/layout-modes/vertical'], function (Outlayer, getSize, matchesSelector, utils, Item, LayoutMode) {
      return factory(window, Outlayer, getSize, matchesSelector, utils, Item, LayoutMode);
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module.exports) {
    // CommonJS
    module.exports = factory(window, require('outlayer'), require('get-size'), require('desandro-matches-selector'), require('fizzy-ui-utils'), require('isotope-layout/js/item'), require('isotope-layout/js/layout-mode'), // include default layout modes
    require('isotope-layout/js/layout-modes/masonry'), require('isotope-layout/js/layout-modes/fit-rows'), require('isotope-layout/js/layout-modes/vertical'));
  } else {
    // browser global
    window.Isotope = factory(window, window.Outlayer, window.getSize, window.matchesSelector, window.fizzyUIUtils, window.Isotope.Item, window.Isotope.LayoutMode);
  }
})(window, function factory(window, Outlayer, getSize, matchesSelector, utils, Item, LayoutMode) {
  // -------------------------- vars -------------------------- //
  var jQuery = window.jQuery; // -------------------------- helpers -------------------------- //

  var trim = String.prototype.trim ? function (str) {
    return str.trim();
  } : function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  }; // -------------------------- isotopeDefinition -------------------------- //
  // create an Outlayer layout class

  var Isotope = Outlayer.create('isotope', {
    layoutMode: 'masonry',
    isJQueryFiltering: true,
    sortAscending: true
  });
  Isotope.Item = Item;
  Isotope.LayoutMode = LayoutMode;
  var proto = Isotope.prototype;

  proto._create = function () {
    this.itemGUID = 0; // functions that sort items

    this._sorters = {};

    this._getSorters(); // call super


    Outlayer.prototype._create.call(this); // create layout modes


    this.modes = {}; // start filteredItems with all items

    this.filteredItems = this.items; // keep of track of sortBys

    this.sortHistory = ['original-order']; // create from registered layout modes

    for (var name in LayoutMode.modes) {
      this._initLayoutMode(name);
    }
  };

  proto.reloadItems = function () {
    // reset item ID counter
    this.itemGUID = 0; // call super

    Outlayer.prototype.reloadItems.call(this);
  };

  proto._itemize = function () {
    var items = Outlayer.prototype._itemize.apply(this, arguments); // assign ID for original-order


    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.id = this.itemGUID++;
    }

    this._updateItemsSortData(items);

    return items;
  }; // -------------------------- layout -------------------------- //


  proto._initLayoutMode = function (name) {
    var Mode = LayoutMode.modes[name]; // set mode options
    // HACK extend initial options, back-fill in default options

    var initialOpts = this.options[name] || {};
    this.options[name] = Mode.options ? utils.extend(Mode.options, initialOpts) : initialOpts; // init layout mode instance

    this.modes[name] = new Mode(this);
  };

  proto.layout = function () {
    // if first time doing layout, do all magic
    if (!this._isLayoutInited && this._getOption('initLayout')) {
      this.arrange();
      return;
    }

    this._layout();
  }; // private method to be used in layout() & magic()


  proto._layout = function () {
    // don't animate first layout
    var isInstant = this._getIsInstant(); // layout flow


    this._resetLayout();

    this._manageStamps();

    this.layoutItems(this.filteredItems, isInstant); // flag for initalized

    this._isLayoutInited = true;
  }; // filter + sort + layout


  proto.arrange = function (opts) {
    // set any options pass
    this.option(opts);

    this._getIsInstant(); // filter, sort, and layout
    // filter


    var filtered = this._filter(this.items);

    this.filteredItems = filtered.matches;

    this._bindArrangeComplete();

    if (this._isInstant) {
      this._noTransition(this._hideReveal, [filtered]);
    } else {
      this._hideReveal(filtered);
    }

    this._sort();

    this._layout();
  }; // alias to _init for main plugin method


  proto._init = proto.arrange;

  proto._hideReveal = function (filtered) {
    this.reveal(filtered.needReveal);
    this.hide(filtered.needHide);
  }; // HACK
  // Don't animate/transition first layout
  // Or don't animate/transition other layouts


  proto._getIsInstant = function () {
    var isLayoutInstant = this._getOption('layoutInstant');

    var isInstant = isLayoutInstant !== undefined ? isLayoutInstant : !this._isLayoutInited;
    this._isInstant = isInstant;
    return isInstant;
  }; // listen for layoutComplete, hideComplete and revealComplete
  // to trigger arrangeComplete


  proto._bindArrangeComplete = function () {
    // listen for 3 events to trigger arrangeComplete
    var isLayoutComplete, isHideComplete, isRevealComplete;

    var _this = this;

    function arrangeParallelCallback() {
      if (isLayoutComplete && isHideComplete && isRevealComplete) {
        _this.dispatchEvent('arrangeComplete', null, [_this.filteredItems]);
      }
    }

    this.once('layoutComplete', function () {
      isLayoutComplete = true;
      arrangeParallelCallback();
    });
    this.once('hideComplete', function () {
      isHideComplete = true;
      arrangeParallelCallback();
    });
    this.once('revealComplete', function () {
      isRevealComplete = true;
      arrangeParallelCallback();
    });
  }; // -------------------------- filter -------------------------- //


  proto._filter = function (items) {
    var filter = this.options.filter;
    filter = filter || '*';
    var matches = [];
    var hiddenMatched = [];
    var visibleUnmatched = [];

    var test = this._getFilterTest(filter); // test each item


    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      if (item.isIgnored) {
        continue;
      } // add item to either matched or unmatched group


      var isMatched = test(item); // item.isFilterMatched = isMatched;
      // add to matches if its a match

      if (isMatched) {
        matches.push(item);
      } // add to additional group if item needs to be hidden or revealed


      if (isMatched && item.isHidden) {
        hiddenMatched.push(item);
      } else if (!isMatched && !item.isHidden) {
        visibleUnmatched.push(item);
      }
    } // return collections of items to be manipulated


    return {
      matches: matches,
      needReveal: hiddenMatched,
      needHide: visibleUnmatched
    };
  }; // get a jQuery, function, or a matchesSelector test given the filter


  proto._getFilterTest = function (filter) {
    if (jQuery && this.options.isJQueryFiltering) {
      // use jQuery
      return function (item) {
        return jQuery(item.element).is(filter);
      };
    }

    if (typeof filter == 'function') {
      // use filter as function
      return function (item) {
        return filter(item.element);
      };
    } // default, use filter as selector string


    return function (item) {
      return matchesSelector(item.element, filter);
    };
  }; // -------------------------- sorting -------------------------- //

  /**
   * @params {Array} elems
   * @public
   */


  proto.updateSortData = function (elems) {
    // get items
    var items;

    if (elems) {
      elems = utils.makeArray(elems);
      items = this.getItems(elems);
    } else {
      // update all items if no elems provided
      items = this.items;
    }

    this._getSorters();

    this._updateItemsSortData(items);
  };

  proto._getSorters = function () {
    var getSortData = this.options.getSortData;

    for (var key in getSortData) {
      var sorter = getSortData[key];
      this._sorters[key] = mungeSorter(sorter);
    }
  };
  /**
   * @params {Array} items - of Isotope.Items
   * @private
   */


  proto._updateItemsSortData = function (items) {
    // do not update if no items
    var len = items && items.length;

    for (var i = 0; len && i < len; i++) {
      var item = items[i];
      item.updateSortData();
    }
  }; // ----- munge sorter ----- //
  // encapsulate this, as we just need mungeSorter
  // other functions in here are just for munging


  var mungeSorter = function () {
    // add a magic layer to sorters for convienent shorthands
    // `.foo-bar` will use the text of .foo-bar querySelector
    // `[foo-bar]` will use attribute
    // you can also add parser
    // `.foo-bar parseInt` will parse that as a number
    function mungeSorter(sorter) {
      // if not a string, return function or whatever it is
      if (typeof sorter != 'string') {
        return sorter;
      } // parse the sorter string


      var args = trim(sorter).split(' ');
      var query = args[0]; // check if query looks like [an-attribute]

      var attrMatch = query.match(/^\[(.+)\]$/);
      var attr = attrMatch && attrMatch[1];
      var getValue = getValueGetter(attr, query); // use second argument as a parser

      var parser = Isotope.sortDataParsers[args[1]]; // parse the value, if there was a parser

      sorter = parser ? function (elem) {
        return elem && parser(getValue(elem));
      } : // otherwise just return value
      function (elem) {
        return elem && getValue(elem);
      };
      return sorter;
    } // get an attribute getter, or get text of the querySelector


    function getValueGetter(attr, query) {
      // if query looks like [foo-bar], get attribute
      if (attr) {
        return function getAttribute(elem) {
          return elem.getAttribute(attr);
        };
      } // otherwise, assume its a querySelector, and get its text


      return function getChildText(elem) {
        var child = elem.querySelector(query);
        return child && child.textContent;
      };
    }

    return mungeSorter;
  }(); // parsers used in getSortData shortcut strings


  Isotope.sortDataParsers = {
    'parseInt': function (_parseInt) {
      function parseInt(_x) {
        return _parseInt.apply(this, arguments);
      }

      parseInt.toString = function () {
        return _parseInt.toString();
      };

      return parseInt;
    }(function (val) {
      return parseInt(val, 10);
    }),
    'parseFloat': function (_parseFloat) {
      function parseFloat(_x2) {
        return _parseFloat.apply(this, arguments);
      }

      parseFloat.toString = function () {
        return _parseFloat.toString();
      };

      return parseFloat;
    }(function (val) {
      return parseFloat(val);
    })
  }; // ----- sort method ----- //
  // sort filteredItem order

  proto._sort = function () {
    if (!this.options.sortBy) {
      return;
    } // keep track of sortBy History


    var sortBys = utils.makeArray(this.options.sortBy);

    if (!this._getIsSameSortBy(sortBys)) {
      // concat all sortBy and sortHistory, add to front, oldest goes in last
      this.sortHistory = sortBys.concat(this.sortHistory);
    } // sort magic


    var itemSorter = getItemSorter(this.sortHistory, this.options.sortAscending);
    this.filteredItems.sort(itemSorter);
  }; // check if sortBys is same as start of sortHistory


  proto._getIsSameSortBy = function (sortBys) {
    for (var i = 0; i < sortBys.length; i++) {
      if (sortBys[i] != this.sortHistory[i]) {
        return false;
      }
    }

    return true;
  }; // returns a function used for sorting


  function getItemSorter(sortBys, sortAsc) {
    return function sorter(itemA, itemB) {
      // cycle through all sortKeys
      for (var i = 0; i < sortBys.length; i++) {
        var sortBy = sortBys[i];
        var a = itemA.sortData[sortBy];
        var b = itemB.sortData[sortBy];

        if (a > b || a < b) {
          // if sortAsc is an object, use the value given the sortBy key
          var isAscending = sortAsc[sortBy] !== undefined ? sortAsc[sortBy] : sortAsc;
          var direction = isAscending ? 1 : -1;
          return (a > b ? 1 : -1) * direction;
        }
      }

      return 0;
    };
  } // -------------------------- methods -------------------------- //
  // get layout mode


  proto._mode = function () {
    var layoutMode = this.options.layoutMode;
    var mode = this.modes[layoutMode];

    if (!mode) {
      // TODO console.error
      throw new Error('No layout mode: ' + layoutMode);
    } // HACK sync mode's options
    // any options set after init for layout mode need to be synced


    mode.options = this.options[layoutMode];
    return mode;
  };

  proto._resetLayout = function () {
    // trigger original reset layout
    Outlayer.prototype._resetLayout.call(this);

    this._mode()._resetLayout();
  };

  proto._getItemLayoutPosition = function (item) {
    return this._mode()._getItemLayoutPosition(item);
  };

  proto._manageStamp = function (stamp) {
    this._mode()._manageStamp(stamp);
  };

  proto._getContainerSize = function () {
    return this._mode()._getContainerSize();
  };

  proto.needsResizeLayout = function () {
    return this._mode().needsResizeLayout();
  }; // -------------------------- adding & removing -------------------------- //
  // HEADS UP overwrites default Outlayer appended


  proto.appended = function (elems) {
    var items = this.addItems(elems);

    if (!items.length) {
      return;
    } // filter, layout, reveal new items


    var filteredItems = this._filterRevealAdded(items); // add to filteredItems


    this.filteredItems = this.filteredItems.concat(filteredItems);
  }; // HEADS UP overwrites default Outlayer prepended


  proto.prepended = function (elems) {
    var items = this._itemize(elems);

    if (!items.length) {
      return;
    } // start new layout


    this._resetLayout();

    this._manageStamps(); // filter, layout, reveal new items


    var filteredItems = this._filterRevealAdded(items); // layout previous items


    this.layoutItems(this.filteredItems); // add to items and filteredItems

    this.filteredItems = filteredItems.concat(this.filteredItems);
    this.items = items.concat(this.items);
  };

  proto._filterRevealAdded = function (items) {
    var filtered = this._filter(items);

    this.hide(filtered.needHide); // reveal all new items

    this.reveal(filtered.matches); // layout new items, no transition

    this.layoutItems(filtered.matches, true);
    return filtered.matches;
  };
  /**
   * Filter, sort, and layout newly-appended item elements
   * @param {Array or NodeList or Element} elems
   */


  proto.insert = function (elems) {
    var items = this.addItems(elems);

    if (!items.length) {
      return;
    } // append item elements


    var i, item;
    var len = items.length;

    for (i = 0; i < len; i++) {
      item = items[i];
      this.element.appendChild(item.element);
    } // filter new stuff


    var filteredInsertItems = this._filter(items).matches; // set flag


    for (i = 0; i < len; i++) {
      items[i].isLayoutInstant = true;
    }

    this.arrange(); // reset flag

    for (i = 0; i < len; i++) {
      delete items[i].isLayoutInstant;
    }

    this.reveal(filteredInsertItems);
  };

  var _remove = proto.remove;

  proto.remove = function (elems) {
    elems = utils.makeArray(elems);
    var removeItems = this.getItems(elems); // do regular thing

    _remove.call(this, elems); // bail if no items to remove


    var len = removeItems && removeItems.length; // remove elems from filteredItems

    for (var i = 0; len && i < len; i++) {
      var item = removeItems[i]; // remove item from collection

      utils.removeFrom(this.filteredItems, item);
    }
  };

  proto.shuffle = function () {
    // update random sortData
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      item.sortData.random = Math.random();
    }

    this.options.sortBy = 'random';

    this._sort();

    this._layout();
  };
  /**
   * trigger fn without transition
   * kind of hacky to have this in the first place
   * @param {Function} fn
   * @param {Array} args
   * @returns ret
   * @private
   */


  proto._noTransition = function (fn, args) {
    // save transitionDuration before disabling
    var transitionDuration = this.options.transitionDuration; // disable transition

    this.options.transitionDuration = 0; // do it

    var returnValue = fn.apply(this, args); // re-enable transition for reveal

    this.options.transitionDuration = transitionDuration;
    return returnValue;
  }; // ----- helper methods ----- //

  /**
   * getter method for getting filtered item elements
   * @returns {Array} elems - collection of item elements
   */


  proto.getFilteredItemElements = function () {
    return this.filteredItems.map(function (item) {
      return item.element;
    });
  }; // -----  ----- //


  return Isotope;
});;"use strict";

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
  wrapper: document.querySelector('.main-overlay-wrapper'),
  main: document.querySelector('.site-main'),
  footer: document.querySelector('.site-footer'),
  announcement: document.querySelector('.site-announcement'),
  overlays: document.querySelector('.site-navigation-overlays')
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
  mobilenav: document.getElementById('js-mobile-menu'),
  text: document.querySelector('.js-menu-toggle .button__text'),
  hoverIndicator: document.querySelector('.menu-navigation__hover-indicator')
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
};
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

var $window = $(window),
    $html = $(html),
    $body = $(body),
    $siteMain = $(site.main),
    $siteOverlayWrapper = $(site.wrapper),
    $breadcrumb = $siteOverlayWrapper.find('.breadcrumb'),
    $forms = $siteMain.find('.form'),
    $navigation = $(menu.navigation),
    $menuToggle = $(menu.toggle),
    $menuToggleButton = $(site.header).find('#js-menu-toggle'),
    $searchToggle = $(search.toggle),
    $siteSearchWrapper = $(site.overlays).find('.site-search-wrapper'),
    $siteSearchFormField = $(search.navigation).find('.form__field'),
    $searchSubmitButton = $(search.navigation).find('.button'),
    $mobileMenuContainer = $(site.overlays).find('.menu-navigation .container');;"use strict";

function debounce(func, wait, immediate) {
  'use strict';

  var timeout;
  return function () {
    var context = this,
        args = arguments;

    var later = function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

;;"use strict";

/**
 * More performant forEach function
 *
 * @param {Array}    array    - The array / node list
 * @param {Function} callback - The callback
 */
function forEach(array, callback, scope) {
  for (var i = 0; i < array.length; i++) {
    callback.call(scope, i, array[i]); // passes back stuff we need
  }
}

;
/**
 * Calculates the height of a given element.
 *
 * @param {HTMLElement} elem - The element
 *
 * @return {string} The height in px.
 */

function getHeight(elem) {
  if (!elem) return;
  var elemHeight = elem.scrollHeight + 'px';
  return elemHeight;
}

;
/**
 * Set a min-height on pages with minimal content
 *
 * 100vh doesn't account for the browser controls on some devices.
 * So we need to measure min-height using javascript.
 *
 */

var setSiteMinHeight = debounce(function () {
  var $site = $(site.site),
      $siteHeight = $site.innerHeight(),
      newMinHeight = 'calc(100vh - ' + ($siteHeight - viewports.height) + 'px)';
  if (viewports.height === $siteHeight) return;
  $site.css({
    'min-height': newMinHeight
  }); // After the calculation has been made, remove the inline calc style IF the site content is still larger than the viewport.

  $siteHeight = $site.innerHeight();

  if ($siteHeight > viewports.height) {
    $site.css({
      'min-height': ''
    });
  }
}, 30);
/**
 * Scroll Lock
 *
 * This function is applied to lock the window scrolling.
 * This should be applied when showing popups and full height models to allow the user to scroll the top layer.
 *
 * Call using scrollLock() to lock and scrollLock(false) to unlock;
 *
 */

function scrollLock() {
  var lockingScroll = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  if (!$(site.site).length) return;

  if (lockingScroll == true) {
    $(site.site).css('top', -$(window).scrollTop());
    $html.attr('data-scroll-lock', 'true');
  } else {
    if (!$html.attr('data-scroll-lock').length) return;
    var resetScroll = parseInt($(site.site).css('top')) * -1;
    $html.removeAttr('data-scroll-lock');
    $(site.site).css('top', 'auto');
    $('html, body').animate({
      scrollTop: resetScroll
    }, 0);
  }
}

;
/**
 * Scrolls to element.
 *
 * Immediately invoked function expression
 *
 * Apply data attribute 'data-scroll-to' to an element button with an ID of
 * the selector you want to scroll to.
 *
 * Uses jQuery selectors as 'animate' isn't widely
 * supported with vanilla JS.
 */

(function () {
  $('[data-scroll-to]').on('click', function (event) {
    var $this = $(this),
        targetData = $this.attr('data-scroll-to'),
        $target = $(targetData);
    if ($target.offset() === undefined) return;
    $('html, body').animate({
      scrollTop: $target.offset().top
    }, 500);
  });
})();
/**
 * Resets the tabbing focus
 *
 * Immediately invoked function expression
 *
 * Apply data attribute to a hidden button with an ID of
 * the selector you want to focus to.
 */


(function () {
  $('[data-focus]').on('focus', function () {
    var id = $(this).attr('data-focus');
    $('#' + id).focus();
  });
})();
/*
 * Match height using data attribute
 *
 * <ul class="list" data-matchHeight=".list__item">
 *      <li class="list__item">
 *      </li>
 * </ul>
 */


(function () {
  $('[data-matchHeight]').each(function () {
    var $this = $(this);
    var matchHeightTarget = $this.attr('data-matchHeight');
    $this.find(matchHeightTarget).matchHeight();
  });
  $('[data-matchHeight-parent]').each(function () {
    var $this = $(this);
    var $matchHeightParent = $this.closest($this.attr('data-matchHeight-parent'));
    var $matchHeightTargetObj = $matchHeightParent.find($this.attr('data-matchHeight-with'));

    if (!$matchHeightTargetObj.length) {
      return;
    }

    $this.add($matchHeightTargetObj).matchHeight();
  });
})();;"use strict";

/*
*   Custom version of a11y-toggle - https://github.com/edenspiekermann/a11y-toggle
*
*   Full docs here: http://edenspiekermann.github.io/a11y-toggle/
*
*   Example to watch for callback events, do the following:
*   <button class="button" data-a11y-toggle="target" data-a11y-callback="targetCallback"></button>
*
*   To avoid duplication of the 'DOMContentLoaded' listener, initA11yToggle() is now called from within main.js
*   If you do not want to reinitialise everything, you can pass a context to the a11yToggle function which will be used as a root for .querySelectorAll.
*   i.e. window.a11yToggle(myContainer);
*
*   Initialisation event listener:
*
*   $(window).on('a11y-toggle:targetCallback', function(event) {
*     console.log('a11y-toggle callback loaded');
*   });
*
*   Hide event listener:
*
*   $(window).on('a11y-toggle-hide:targetCallback', function(event) {
*     console.log('a11y-toggle callback hide');
*   });
*
*   Show event listener:
*
*   $(window).on('a11y-toggle-show:targetCallback', function(event) {
*     console.log('a11y-toggle callback show');
*   });
*
*/
var initA11yToggle = function initA11yToggle() {};

(function () {
  'use strict';

  var internalId = 0;
  var togglesMap = {};
  var targetsMap = {};

  function $(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function getClosestToggle(element) {
    if (element.closest) {
      return element.closest('[data-a11y-toggle]');
    }

    while (element) {
      if (element.nodeType === 1 && element.hasAttribute('data-a11y-toggle')) {
        return element;
      }

      element = element.parentNode;
    }

    return null;
  }

  function handleToggle(toggle) {
    var target = toggle && targetsMap[toggle.getAttribute('aria-controls')];

    if (!target) {
      return false;
    }

    var toggles = togglesMap['#' + target.id];
    var isExpanded = target.getAttribute('aria-hidden') === 'false';
    target.setAttribute('aria-hidden', isExpanded);
    toggles.forEach(function (toggle) {
      toggle.setAttribute('aria-expanded', !isExpanded);
    });

    if (toggle.hasAttribute('data-a11y-callback')) {
      var toggleCallbackEvent = document.createEvent('Event');

      if (isExpanded) {
        toggleCallbackEvent.initEvent('a11y-toggle-hide:' + toggle.getAttribute('data-a11y-callback'), true, true);
      } else {
        toggleCallbackEvent.initEvent('a11y-toggle-show:' + toggle.getAttribute('data-a11y-callback'), true, true);
      }

      window.dispatchEvent(toggleCallbackEvent);
    }
  }

  initA11yToggle = function initA11yToggle(context) {
    togglesMap = $('[data-a11y-toggle]', context).reduce(function (acc, toggle) {
      var selector = '#' + toggle.getAttribute('data-a11y-toggle');
      acc[selector] = acc[selector] || [];
      acc[selector].push(toggle);
      return acc;
    }, togglesMap);
    var targets = Object.keys(togglesMap);
    targets.length && $(targets).forEach(function (target) {
      var toggles = togglesMap['#' + target.id];
      var isExpanded = target.hasAttribute('data-a11y-toggle-open');
      var labelledby = [];
      toggles.forEach(function (toggle) {
        toggle.id || toggle.setAttribute('id', 'a11y-toggle-' + internalId++);
        toggle.setAttribute('aria-controls', target.id);
        toggle.setAttribute('aria-expanded', isExpanded);
        labelledby.push(toggle.id);

        if (toggle.hasAttribute('data-a11y-callback')) {
          var toggleInit = document.createEvent('Event');
          toggleInit.initEvent('a11y-toggle:' + toggle.getAttribute('data-a11y-callback'), true, true);
          window.dispatchEvent(toggleInit);
        }
      });
      target.setAttribute('aria-hidden', !isExpanded);
      target.hasAttribute('aria-labelledby') || target.setAttribute('aria-labelledby', labelledby.join(' '));
      targetsMap[target.id] = target;
    });
  };

  document.addEventListener('click', function (event) {
    var toggle = getClosestToggle(event.target);
    handleToggle(toggle);
  });
  window && (window.a11yToggle = initA11yToggle);
})();;"use strict";

(function () {
  // a11y-toggle connected toggle functions
  // ======================================
  var toggleGroups = Array.prototype.slice.call(document.querySelectorAll('[data-a11y-connected-toggle]'));

  function collapse(toggle) {
    var id = toggle.getAttribute('data-a11y-toggle');
    var collapsibleBox = document.getElementById(id);
    collapsibleBox.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
  }

  ;

  function getToggleFromTarget(element) {
    while (!element.hasAttribute('data-a11y-toggle')) {
      element = element.parentNode;
    }

    return element;
  }

  ;
  toggleGroups.forEach(function (toggleGroup) {
    var groupedToggles = Array.prototype.slice.call(toggleGroup.querySelectorAll('[data-a11y-toggle]'));

    toggleGroup.collapseAll = function (event) {
      groupedToggles.filter(function (toggle) {
        return toggle.getAttribute('data-a11y-toggle') !== getToggleFromTarget(event.target).getAttribute('data-a11y-toggle');
      }).forEach(collapse);
    };

    groupedToggles.forEach(function (toggle) {
      toggle.addEventListener('click', toggleGroup.collapseAll);
    });
  });
  $('a[data-a11y-toggle]').on('click', function (event) {
    event.preventDefault();
  });
})();;"use strict";

/**
 * External Link Check
 *
 * Check for extenal links within .editor and add a class.
 *
 * To ignore external links, add the following
 * data attribute to your markup:
 * [data-external-link="false"]
 */
(function () {
  'use strict';

  var links = document.querySelectorAll('.editor a');
  [].forEach.call(links, function (elem) {
    if (location.hostname === elem.hostname || !elem.hostname.length) return;
    if (elem.getAttribute('data-external-link') === 'false' || elem.classList.contains('button')) return;
    var htmlContent = elem.innerHTML;
    var lastIndex = htmlContent.lastIndexOf(" ");
    var htmlContentArray = htmlContent.split(" ");
    elem.classList.add('link-external');
    elem.setAttribute('aria-label', 'external: ' + elem.innerText);
    htmlContent = htmlContent.trim().substring(0, lastIndex);
    elem.innerHTML = '<span class="link-external__text">' + htmlContent.trim() + ' </span><span class="link-external__orphan"><span class="link-external__text">' + htmlContentArray[htmlContentArray.length - 1].trim() + '</span>&nbsp;<span class="icon icon-external-link"></span></span>';
  });
})();;"use strict";

// Custom file upload form fields
// ========================================================
// See demo at http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/
// ========================================================
(function () {
  if (!$forms.length) return;
  $forms.find('.form__field--upload, .form__field--image-upload').each(function () {
    var $input = $(this),
        $label = $input.closest('.form__control').find('.form__label'),
        labelVal = $label.text(),
        clonedLabelClass = 'form__label--upload'; // Only apply the following javascript if we're NOT using dropzone

    if (!$input.parent('.form__component--file').length && !$input.parent('.form__component--image-upload').length) return;

    if ($(this).hasClass('form__field--image-upload')) {
      clonedLabelClass = 'form__label--image-upload';
    }

    $input.after($label.clone().addClass(clonedLabelClass));
    $label.replaceWith(function () {
      return '<span class="form__label">' + this.innerHTML + '</span>';
    });
    $label = $input.next('.form__label');
    $input.on('change', function (event) {
      var fileName = '';

      if (event.target.value) {
        fileName = event.target.value.split('\\').pop();
      }

      if (fileName !== '') {
        $label.text(fileName);
      } else {
        $label.text(labelVal);
      }
    });
    $input.on('focus', function () {
      $input.addClass('has-focus');
    }).on('focusout', function () {
      $input.removeClass('has-focus');
    });
  });
})();;"use strict";

/**
 * Toggles elements between desktop and mobile
 *
 * Useful if elements need to be shown
 * on desktop and hidden on mobile
 *
 * Add on DOMContentLoaded and Resize
 *
 * @param {HTMLElement} $elem   - The element
 * @param {HTMLElement} $toggle - The toggle
 *
 * @return {function} A debounce function
 */
function toggleMobileSwap($elem, $toggle, breakpoint) {
  var resize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (!$elem) return;
  if (!$toggle) return;
  breakpoint = typeof breakpoint === 'undefined' ? breakpoints.mobile : breakpoint;
  jQuery.extend(verge);

  if (verge.viewportW() >= breakpoint) {
    $elem.setAttribute('aria-hidden', 'false');
    $elem.setAttribute('data-toggle-mobile-swap', 'above-' + breakpoint);
    [].forEach.call($toggle, function ($button) {
      $button.setAttribute('aria-expanded', 'true');
    });
  } else {
    if (resize === false) {
      $elem.setAttribute('data-toggle-mobile-swap', 'below-' + breakpoint);
    }

    if ($elem.getAttribute('data-toggle-mobile-swap') === 'above-' + breakpoint) {
      $elem.setAttribute('aria-hidden', 'true');
      [].forEach.call($toggle, function ($button) {
        $button.setAttribute('aria-expanded', 'false');
      });
      $elem.setAttribute('data-toggle-mobile-swap', 'below-' + breakpoint);
    }
  }

  return debounce(function () {
    toggleMobileSwap($elem, $toggle, breakpoint, resize);
  }, 100);
}

;;"use strict";

var navToggleAnimating, dropdownAnimating, focusJumpTimeout;

function toggleBodyClass($class) {
  var $state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'add';

  if ($state === 'add') {
    $body.addClass($class);
  } else {
    $body.removeClass($class);
  }
}

function toggleAnimationClass($elem, $duration) {
  clearTimeout(navToggleAnimating);
  $elem.addClass('is-animating');
  navToggleAnimating = setTimeout(function () {
    $elem.removeClass('is-animating');
  }, $duration);
}

function focusJump($target) {
  clearTimeout(focusJumpTimeout);
  focusJumpTimeout = setTimeout(function () {
    $target.focus();
  }, 600);
}

$window.on('a11y-toggle-show:menuSearchCallback', function (event) {
  if (!$searchToggle.length) return;
  searchToggleState('open');
  menuToggleState('close');
  toggleAnimationClass($(search.navigation).add($(site.overlays)), 10);
  overlayWrapperHeightOffset('open');
});
$window.on('a11y-toggle-hide:menuSearchCallback', function (event) {
  searchToggleState('close');
  toggleAnimationClass($(search.navigation).add($(site.overlays)), 700);
  overlayWrapperHeightOffset('close');
  $searchToggle.focus();
});
$window.on('a11y-toggle-show:menuNavigationCallback', function (event) {
  toggleAnimationClass($(menu.navigation).add($menuToggle).add($(site.overlays)), 10);
  menuToggleState('open');
  searchToggleState('close');
  overlayWrapperHeightOffset('open');
});
$window.on('a11y-toggle-hide:menuNavigationCallback', function (event) {
  menuToggleState('close');
  toggleAnimationClass($(menu.navigation).add($menuToggle).add($(site.overlays)), 700);
  overlayWrapperHeightOffset('close');
  $menuToggleButton.focus();
});
$window.on('a11y-toggle-show:subTierNavigationCallback', function (event) {
  menuSubTierState('open');

  if (viewports.width >= breakpoints.tablet) {
    headerMenuHeightAdjust();
  } else {
    focusJump($mobileMenuContainer.find('.sublinks[aria-hidden="false"] .sublinks__back-button'));
  }
});
$window.on('a11y-toggle-hide:subTierNavigationCallback', function (event) {
  menuSubTierState('close');
});

function searchToggleState($state) {
  if (!$searchToggle.length) return;
  var $state = typeof $state !== 'undefined' ? $state : 'open';

  if ($state == 'close') {
    toggleBodyClass('search-is-open', 'remove');
    $searchToggle.removeClass('is-open');
    $searchToggle.attr('aria-label', 'Open site search dropdown');

    if ($searchToggle.attr('aria-expanded') === 'true') {
      $searchToggle.attr('aria-expanded', 'false');
    }
  } else {
    toggleBodyClass('search-is-open');
    $searchToggle.addClass('is-open');
    $searchToggle.attr('aria-label', 'Close site search dropdown');
    setTimeout(function () {
      $siteSearchFormField.focus();
    }, 300);
  }
}

function menuToggleState($state) {
  if (!$menuToggle.length) return;
  var $state = typeof $state !== 'undefined' ? $state : 'open';

  if ($state == 'close') {
    toggleBodyClass('menu-is-open', 'remove');
    toggleBodyClass('sub-menu-is-open', 'remove');
    $menuToggle.add($(menu.navigation)).removeClass('is-open');
    $mobileMenuContainer.removeClass('is-expanded');
    $siteOverlayWrapper.removeAttr('aria-hidden');
    $mobileMenuContainer.find('.sublinks').attr('aria-hidden', 'true');

    if ($menuToggle.attr('aria-expanded') === 'true') {
      $menuToggle.attr('aria-expanded', 'false');
    }
  } else {
    toggleBodyClass('menu-is-open');
    $menuToggle.add($(menu.navigation)).addClass('is-open');
    $menuToggleButton.focus();
    $siteOverlayWrapper.attr('aria-hidden', 'true');
    setTimeout(function () {
      $menuToggleButton.focus();
    }, 600);
  }
}

function overlayWrapperHeightOffset() {
  var $state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'open';
  if (typeof site.announcement === 'undefined') return;
  var headerHeightOffset = $(site.announcement).outerHeight() + $(site.header).outerHeight();

  if ($state === 'open') {
    $siteOverlayWrapper.add($(site.overlays)).css('padding-top', headerHeightOffset);
    $siteSearchWrapper.css('min-height', viewports.height - headerHeightOffset);
  } else {
    $siteOverlayWrapper.add($(site.overlays)).add($siteSearchWrapper).removeAttr('style');
  }
}

function menuSubTierState($state) {
  var $state = typeof $state !== 'undefined' ? $state : 'open';

  if ($state == 'close') {
    toggleBodyClass('sub-menu-is-open', 'remove');
    $mobileMenuContainer.removeClass('is-expanded');
    $(site.header).removeAttr('style');
    $siteOverlayWrapper.find('.site-content__hero-widgets').removeAttr('style');
  } else {
    toggleBodyClass('sub-menu-is-open');
    $mobileMenuContainer.addClass('is-expanded');
  }
}
/* Manage the accessibility of the tooltip dropdowns in the secondary navigation
 * This if for both mouse and keyboard users
 *
 */


function headerTooltipNavigation() {
  var $secondaryNavigation = $(site.header).find('.nav--secondary-navigation .list--tiered-navigation'),
      $secondaryNavigationLinks = $secondaryNavigation.find('> .list__item .list__link'),
      transitionDelay = 300;
  var hideTooltips = debounce(function () {
    if ($secondaryNavigation.is(':hover')) return;
    var $allSubLinks = $secondaryNavigation.find('.list__sublinks-wrapper');
    $(site.header).removeClass('tooltip-open');
    $allSubLinks.removeClass('is-visible');
    toggleAnimationClass($allSubLinks, 700);
    clearTimeout(dropdownAnimating);
    dropdownAnimating = setTimeout(function () {
      $allSubLinks.attr('aria-hidden', true);
      $secondaryNavigation.find('.list__link--expandable').attr('aria-expanded', 'false');
      $secondaryNavigation.removeClass('is-hovered');
    }, transitionDelay);
  }, transitionDelay);
  $secondaryNavigationLinks.each(function () {
    var $thisLink = $(this),
        $sublinksWrapper = $thisLink.next('.list__sublinks-wrapper');
    if (!$sublinksWrapper.length) return;
    var $sublinks = $sublinksWrapper.find('.list__link');
    $thisLink.add($sublinksWrapper).add($sublinks).on('mouseenter focusin', debounce(function (event) {
      if ($secondaryNavigation.hasClass('is-hovered')) return;
      $(site.header).addClass('tooltip-open');
      $sublinksWrapper.addClass('is-visible');
      $secondaryNavigation.addClass('is-hovered');
      toggleAnimationClass($sublinksWrapper, 10);
    }));
    $thisLink.add($sublinksWrapper).add($sublinks).on('mouseleave', function (event) {
      hideTooltips();
    });
    $thisLink.add($sublinksWrapper).add($sublinks).on('blur', debounce(function (event) {
      if ($sublinks.is(':focus')) return;
      hideTooltips();
    }));
  });
  $secondaryNavigation.on('mouseleave', function (event) {
    hideTooltips();
  });
}
/* Manage the accessibility of the tooltip dropdowns in the secondary navigation
 * This if for both mouse and keyboard users
 *
 */


function headerMenuHeightAdjust() {
  var currentHeight = $(site.header).outerHeight();
  $(site.header).removeAttr('style');
  if (viewports.width < breakpoints.tablet || !$body.hasClass('sub-menu-is-open')) return;
  $(site.header).addClass('is-measuring');
  var $openSubNavigation = $(site.header).find('.menu-navigation .list--tiered-navigation .sublinks[aria-hidden="false"]'),
      heightOffset = $openSubNavigation.outerHeight() + $(site.header).outerHeight(),
      $heroWidgets = $siteOverlayWrapper.find('.site-content__hero-widgets');
  $(site.header).css('min-height', currentHeight);
  setTimeout(function () {
    $(site.header).removeClass('is-measuring').css('min-height', heightOffset);
  });

  if ($(site.site).hasClass('has-hero-image') || $(site.site).hasClass('has-hero-widget') && $heroWidgets.length) {
    $heroWidgets.css('margin-top', -heightOffset);
  }
};"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//  Siteimprove fixes for embedded maps
// ========================================================
function initMaps() {
  // ORBIT-130 - We will no longer try to fix Siteimprove errors on Google Maps
  // https://issuetracker.google.com/issues/69541792
  // Advice for clients to conform with WCAG 2.1 AA standard is to provide text alternatives for the information in the map.
  return;
}

function skipMaps() {
  if ((typeof skipEmbeddedMapsForwards === "undefined" ? "undefined" : _typeof(skipEmbeddedMapsForwards)) !== 'object' || (typeof skipEmbeddedMapsBackwards === "undefined" ? "undefined" : _typeof(skipEmbeddedMapsBackwards)) !== 'object') {
    return;
  }

  var $skipMapButtonForwards = $(skipEmbeddedMapsForwards);
  var $skipMapButtonBackwards = $(skipEmbeddedMapsBackwards);
  var $skipMapButtons = $skipMapButtonForwards.add($skipMapButtonBackwards);
  $skipMapButtons.focus(function () {
    $(this).removeClass('visually-hidden');
  });
  $skipMapButtons.blur(function () {
    $(this).addClass('visually-hidden');
  });
  $skipMapButtons.on('click', function (event) {
    event.preventDefault();
    var $thisButton = $(this),
        $parentWrapper = $thisButton.closest('.form__component--google-map, .form__component--esri, .form__component--location, .definition__content--google-map');

    if ($thisButton.hasClass('js-map-skip-forwards')) {
      var $targetButton = $parentWrapper.find('.js-map-skip-backwards');
    } else {
      var $targetButton = $parentWrapper.find('.js-map-skip-forwards');
    }

    if (!$targetButton.length) return;
    $targetButton.focus();
  });
};'use strict';
/*
 * CAROUSEL
 * ==========
 *
 * Uses Flickity v.^2 – https://flickity.metafizzy.co/options.html
 * Includes customisations to mimic the functionality of https://www.w3.org/WAI/tutorials/carousels/working-example/
 *
 * Example:
 *
 * carouselInit('.js-carousel', '.slide');
 *
 * Options (can be altered in the markup):
 *
 * <div class="carousel js-carousel" data-carousel-title="My Carousel"> // A descriptive name of the carousel for screenreaders. Will default to the first H1, H2 or .widget__heading - with "Slideshow X" as a fallback
 *
 * <div class="carousel js-carousel" data-carousel-autoplay="true">
 * OR
 * <div class="carousel js-carousel" data-carousel-autoplay="1500"> (in milliseconds)
 *
 * <div class="carousel js-carousel" data-carousel-dots="false"> // To remove the dots
 * OR
 * <div class="carousel js-carousel" data-carousel-dots="$x $y $stack"> // Optional CSS overrides - positions the dots 'center bottom horizontal' (default), 'right top vertical', 'left bottom horizontal'
 *
 * <div class="carousel js-carousel" data-carousel-arrows="false"> // To remove the previous and next buttons
 * OR
 * <div class="carousel js-carousel" data-carousel-arrows="$x $y"> // Optional CSS overrides - positions the arrows 'opposite center' (default), 'right top', 'left bottom'
 *
 * <div class="carousel js-carousel" data-carousel-draggable="false"> // disable flickity's draggable option: https://flickity.metafizzy.co/options.html#draggable
 *
 * <div class="carousel js-carousel" data-carousel-adaptive-height="true"> // enable flickity's adaptive height option: https://flickity.metafizzy.co/options.html#adaptiveheight
 *
*/

function pauseCurrentCarousel(element) {
  $(element).closest('.flickity-enabled').flickity('stopPlayer');
} // Add text to buttons


function flickityPaginationText($el, carouselName) {
  $el.find('.flickity-prev-next-button.next').attr('aria-label', 'Next slide: ' + carouselName).append('<span class="visually-hidden">Next slide: ' + carouselName + '</span>');
  $el.find('.flickity-prev-next-button.previous').attr('aria-label', 'Previous slide: ' + carouselName).append('<span class="visually-hidden">Previous slide: ' + carouselName + '</span>');
  $el.find('.flickity-button-icon').attr({
    'preserveAspectRatio': 'xMinYMid',
    'aria-hidden': 'true',
    'focusable': 'false'
  });
}

function wrapFlickityPageDots($currentCarousel, showDots, carouselName, carouselSlideClass, slideTitleClass) {
  if (!showDots || !$currentCarousel.length) return;
  var $pageDots = $currentCarousel.find('.flickity-page-dots'),
      $dots = $pageDots.find('.dot'),
      slideTitleClass = typeof slideTitleClass !== 'undefined' ? slideTitleClass : '.carousel__heading';

  if (!$pageDots.closest('.flickity-page-dots-wrapper').length) {
    $pageDots.wrap('<div class="flickity-page-dots-wrapper"></div>');
  }

  $dots.removeAttr('aria-label').each(function (index) {
    var $dot = $(this),
        dotText = 'Slide ' + (index + 1),
        $targetSlideHeading = $currentCarousel.find(carouselSlideClass + ':eq(' + index + ')').find(slideTitleClass).text();
    if ($dot.find('.flickity-page-dots__button').length) return;

    if ($targetSlideHeading.length) {
      dotText += ': ' + $targetSlideHeading;
    }

    var $newButton = $('<button class="flickity-page-dots__button"><span class="visually-hidden">' + dotText + '</span></button>');
    $dot.append($newButton);
    $newButton.on('click', function (event) {
      event.preventDefault();
      $(this).closest('.dot').trigger('click');
    });
  });
}

function wrapFlickityPrevNextButtons($currentCarousel, showArrows) {
  if (!showArrows || !$currentCarousel.length) return;
  var $prevButton = $currentCarousel.find('.flickity-prev-next-button.previous'),
      $nextButton = $currentCarousel.find('.flickity-prev-next-button.next'),
      $viewport = $currentCarousel.find('.flickity-viewport');
  $prevButton.add($nextButton).wrapAll('<div class="flickity-buttons-wrapper"></div>');
  $prevButton.insertAfter($nextButton); // Flip the tabbing order so that the next button comes first()

  $currentCarousel.find('.flickity-buttons-wrapper').insertBefore($viewport); // Move the buttons before the content in the tabbing order
}

function carouselTabbingControl($currentCarousel, index, carouselSlideClass) {
  if (!$currentCarousel.length) return;
  var carouselSlideClass = typeof carouselSlideClass !== 'undefined' ? carouselSlideClass : '.slide',
      $slides = $currentCarousel.find(carouselSlideClass),
      $slidesSelected = $currentCarousel.find(carouselSlideClass + '.is-selected'),
      $slideLinks = $slides.find('a, button, input:not([type="hidden"]), textarea, select'),
      $pageDotWrapper = $currentCarousel.find('.flickity-page-dots-wrapper');
  $slideLinks.attr('tabindex', '-1');
  $slidesSelected.find('a, button, input:not([type="hidden"]), textarea, select').removeAttr('tabindex');
  $pageDotWrapper.find('.flickity-page-dots__button').removeAttr('disabled tabindex');
  $pageDotWrapper.find('.dot.is-selected .flickity-page-dots__button').attr({
    'disabled': '',
    'tabindex': -1
  });
}
/*
 * If update is false (default), create a new aria-live region for the carousel, or re-use one that is in the markup with the classname .js-aria-live
 * If update is set to true then amend the aria-live message to read "Now viewing slide X of X"
 *
*/


function carouselAriaLive() {
  var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var $ariaLive = arguments.length > 1 ? arguments[1] : undefined;
  var carouselName = arguments.length > 2 ? arguments[2] : undefined;
  var carouselId = arguments.length > 3 ? arguments[3] : undefined;
  var $currentCarousel = arguments.length > 4 ? arguments[4] : undefined;
  var slideCount = arguments.length > 5 ? arguments[5] : undefined;
  var flktyStandard = arguments.length > 6 ? arguments[6] : undefined;
  if (!$currentCarousel.length || slideCount < 2 || typeof carouselName === 'undefined') return;

  if (!update) {
    // If aria live element is detected in the markup, use that. Otherwise create one.
    if (!$ariaLive.length) {
      $ariaLive = $('<div class="carousel__aria-live js-aria-live" id="slideshow-' + carouselId + '" aria-live="polite" aria-atomic="true" role="status">Now viewing slide <span class="js-aria-live__text">1 of ' + slideCount + '</span>: ' + carouselName + '</div>');
      $currentCarousel.attr('aria-labelledby', 'slideshow-' + carouselId).prepend($ariaLive);
    }

    return $ariaLive;
  }

  if (typeof flktyStandard == 'undefined') return $ariaLive;
  $ariaLive.find('.js-aria-live__text').html(flktyStandard.selectedIndex + 1 + ' of ' + flktyStandard.slides.length);
  return $ariaLive;
}

function carouselInit(carouselClass, carouselSlideClass) {
  var $carousels = $(carouselClass),
      carouselSlideClass = typeof carouselSlideClass !== 'undefined' ? carouselSlideClass : '.slide';
  if (!$carousels.length) return;
  $carousels.each(function (index) {
    var $currentCarousel = $(this),
        carouselId = index + 1,
        slideCount = $currentCarousel.find(carouselSlideClass).length,
        autoPlaySpeed = typeof $currentCarousel.attr('data-carousel-autoplay') !== 'undefined' ? $currentCarousel.attr('data-carousel-autoplay') : false,
        adaptiveHeight = typeof $currentCarousel.attr('data-carousel-adaptive-height') !== 'undefined' ? $currentCarousel.attr('data-carousel-adaptive-height') : false,
        groupCells = typeof $currentCarousel.attr('data-carousel-group-cells') !== 'undefined' ? $currentCarousel.attr('data-carousel-group-cells') : false,
        showDots = $currentCarousel.attr('data-carousel-dots') === 'false' ? false : true,
        showArrows = $currentCarousel.attr('data-carousel-arrows') === 'false' ? false : true,
        draggable = $currentCarousel.attr('data-carousel-draggable') === 'false' ? false : true,
        $ariaLive = $currentCarousel.find('.js-aria-live');
    if ($currentCarousel.parent('code').length || $currentCarousel.parent('pre').length) return;

    if (typeof $currentCarousel.attr('data-carousel-title') === 'undefined') {
      var fallbackTitle = $currentCarousel.add($currentCarousel.closest('.widget')).find('h1, h2, .widget__heading').first().text().trim();
      var carouselName = typeof fallbackTitle === 'undefined' ? 'Slideshow ' + carouselId : fallbackTitle;
    } else {
      var carouselName = $currentCarousel.attr('data-carousel-title');
    }

    if (slideCount < 2) return;
    $ariaLive = carouselAriaLive(false, $ariaLive, carouselName, carouselId, $currentCarousel, slideCount);
    $currentCarousel.on('ready.flickity', function () {
      wrapFlickityPageDots($currentCarousel, showDots, carouselName);
      wrapFlickityPrevNextButtons($currentCarousel, showArrows);
      carouselTabbingControl($currentCarousel, 0, carouselSlideClass);
    });
    $currentCarousel.on('select.flickity', function (event, index) {
      carouselTabbingControl($currentCarousel, index, carouselSlideClass);
      $ariaLive = carouselAriaLive(true, $ariaLive, carouselName, carouselId, $currentCarousel, slideCount, flktyStandard);
    });
    $currentCarousel.flickity({
      accessibility: false,
      adaptiveHeight: adaptiveHeight,
      autoPlay: autoPlaySpeed,
      cellSelector: carouselSlideClass,
      groupCells: groupCells,
      draggable: draggable,
      imagesLoaded: true,
      pageDots: showDots,
      prevNextButtons: showArrows,
      wrapAround: true
    });
    var flktyStandard = $currentCarousel.data('flickity'),
        $flickitySlider = $currentCarousel.find('.flickity-slider'),
        $slideLinks = $currentCarousel.find('a, iframe');
    flickityPaginationText($currentCarousel, carouselName); // On window resize...

    if (!groupCells) return;
    window.addEventListener('resize', debounce(function () {
      wrapFlickityPageDots($currentCarousel, showDots, carouselName);
    }, 100));
    window.addEventListener('orientationchange', debounce(function () {
      $currentCarousel.flickity('reloadCells');
      wrapFlickityPageDots($currentCarousel, showDots, carouselName);
    }, 300));
  });
}

;;"use strict";

/**
 * Responsive tables
 *
 * Apply responsive class if the table is larger than the container
 * Copy table headings into each data cell, wrap table in a container
 */
var responsiveTables = function () {
  /**
   * Responsive check
   *
   * Apply responsive class if the table is larger than the container
   */
  var responsiveCheck = debounce(function () {
    $siteMain.find('table:not(.calendar__table):not(.form__matrix)').each(function () {
      var $this = $(this);
      var $tableWrapper = $this.closest('.table-wrapper');
      $tableWrapper.removeClass('responsive');
      if ($tableWrapper.closest('.js-branch-section').length) return;

      if ($tableWrapper.closest('.matrix-wrapper').length) {
        $this.addClass('form__matrix');
        return;
      }

      if ($this.outerWidth() > $tableWrapper.outerWidth()) {
        $tableWrapper.addClass('responsive');
      }
    });
  }, 250);
  /**
   * Amend table markup
   *
   * Copy table headings into each data cell, wrap table in a container
   */

  var tableMarkUp = function tableMarkUp() {
    $siteMain.find('table:not(.calendar__table):not(.form__matrix)').each(function () {
      var $table = $(this);
      $table.find('thead th, thead td').each(function (index) {
        var $th = $(this).html().trim();
        var $count = index + 1;
        if (!$th.length || $th == '&nbsp;') return;
        $table.find('tbody td:nth-child(' + $count + '), tbody th:nth-child(' + $count + ')').prepend('<span class="mobile-th">' + $th + '<span class="mobile-th__seperator">:</span> </span>');
      });
      $table.wrap('<div class="table-wrapper"></div>');
    });
  };
  /**
   * Exposes the methods
   */


  return {
    check: responsiveCheck,
    amendMarkUp: tableMarkUp
  };
}();;"use strict";

function dateInputPolyfillSiteimproveFixes() {
  if (!$forms.length || !$body.length) return;
  var $polyfillWrapper = $body.find('date-input-polyfill');
  if (!$polyfillWrapper.length) return;
  var $yearSelect = $polyfillWrapper.find('.yearSelect'),
      $yearSelectWrapper = $yearSelect.closest('.yearSelect-wrapper'),
      $monthSelect = $polyfillWrapper.find('.monthSelect'),
      $monthSelectWrapper = $monthSelect.closest('.monthSelect-wrapper');

  if (typeof $yearSelect !== 'undefined') {
    $yearSelect.attr('id', 'date-input-polyfill-year-select');
    $yearSelectWrapper.prepend('<label class="visually-hidden" for="date-input-polyfill-year-select">Select Year</label>');
  }

  if (typeof $monthSelect !== 'undefined') {
    $monthSelect.attr('id', 'date-input-polyfill-month-select');
    $monthSelectWrapper.prepend('<label class="visually-hidden" for="date-input-polyfill-month-select">Select Month</label>');
  }

  $polyfillWrapper.appendTo($siteMain);
}

(function dateInputFormat() {
  if (Modernizr.inputtypes.date) return;
  var dateFormat = 'yyyy-mm-dd',
      $formDateNote = '<span class="form__expected-format"><span class="visually-hidden">Date format: </span><span class="form__valid-format">' + dateFormat + '</span></span>';

  function updateDateFormat() {
    $forms.find('[type="date"]').each(function () {
      var $thisDateField = $(this),
          value = $thisDateField.val(),
          newValue,
          expectedFormatRegEx = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/,
          isExpectedFormat = expectedFormatRegEx.test(value);

      if (isExpectedFormat && value !== null) {
        var date = value.split("/"),
            day = date[0],
            month = date[1],
            year = date[2];
        newValue = year + '-' + month + '-' + day;
        $thisDateField.val(newValue);
      }
    });
  }

  $forms.find('[type="date"]').each(function () {
    var $formField = $(this),
        $dateFieldID = $formField.attr('id'),
        $formComponent = $formField.closest('.form__component', '.form__control'),
        $formHelp = $formComponent.find('.form__help'); // Set date format for polyfill to human readable

    $formField.attr({
      'aria-describedby': 'help_text_' + $dateFieldID
    });
    $formField.on('change', function () {
      updateDateFormat();
    });

    if ($formComponent.find('.form__expected-format').length || $formHelp.text().toLowerCase().indexOf(dateFormat) !== -1) {
      return;
    }

    if ($formHelp.length) {
      var $formatInnerWrapper = '<span class="form__expected-format-inner-wrapper">' + $formDateNote + '</span>';

      if ($formHelp.text() === 'dd/mm/yyyy') {
        $formHelp.html($formatInnerWrapper);
      } else {
        $formHelp.append(' ' + $formatInnerWrapper);
      }

      return;
    }

    $formComponent.append('<span class="form__help" id="help_text_' + $dateFieldID + '">' + $formDateNote + '</span>');
  });
  $forms.each(function () {
    $(this).submit(function () {
      updateDateFormat();
    });
  });
})();;"use strict";

//  Isotope layout using data attribute
//  https://isotope.metafizzy.co/
// ==================================
(function () {
  'use strict';

  $('[data-enable-masonry]').each(function () {
    var $this = $(this),
        $isotopeTarget = $this.attr('data-enable-masonry');
    $this.isotope({
      itemSelector: $isotopeTarget,
      layoutMode: 'masonry',
      masonry: {
        horizontalOrder: true
      }
    });

    if (imagesLoaded) {
      $this.imagesLoaded().progress(function () {
        $this.isotope('layout');
      });
    }
  });
})();;'use strict';

(function ($) {
  function duplicateBreadcrumbsInsideHeroWidget() {
    if (!$(site.site).hasClass('has-hero-widget') || !$breadcrumb.length) return;
    var $heroWidgetContent = $siteOverlayWrapper.find('.site-content__hero-widgets .hero-banner__content');
    if (!$heroWidgetContent.length) return;
    $breadcrumb.clone().prependTo($heroWidgetContent).addClass('tablet-hidden').attr('aria-label', 'Mobile breadcrumb navigation');
  } // On document ready...


  document.addEventListener("DOMContentLoaded", function () {
    setSiteMinHeight();
    initA11yToggle();
    toggleMobileSwap(menu.navigation, menu.toggle, breakpoints.tablet);
    headerTooltipNavigation();
    duplicateBreadcrumbsInsideHeroWidget();
    responsiveTables.amendMarkUp();
    responsiveTables.check(); // temporary scroller for matrix table

    $('.form__matrix, .matrix-wrapper .table').each(function () {
      var table = $(this);
      $(this).wrap('<div class="table-wrapper-matrix"></div>').wrap('<div class="scroller"></div>');

      if (table.outerWidth() > table.parent().parent().outerWidth()) {
        table.parent().parent().addClass('has-scroll');
      }

      $(window).on('resize orientationchange', function () {
        if (table.outerWidth() > table.parent().parent().outerWidth()) {
          table.parent().parent().addClass('has-scroll');
        } else {
          table.parent().parent().removeClass('has-scroll');
        }
      });
    }); // Remove error states from form fields via JS when the user alters the contents

    $forms.find('.form__field, .form__textarea, .form__select').on('change', function (event) {
      var $thisField = $(this),
          $thisFieldsControl = $thisField.closest('.form__control');

      if (!$thisField.val() && $thisField.attr('aria-required') === 'true') {
        $thisFieldsControl.addClass('form__control--error');
        return;
      }

      if (!$thisFieldsControl.length || !$thisField.val()) return;
      $thisFieldsControl.removeClass('form__control--error');
    });
    var $menuNav = $(menu.navigation).find('.nav'),
        $menuNavList = $menuNav.find('.list--tiered-navigation'),
        $navigationLinks = $menuNav.find('a'),
        $expandableItems = $menuNav.find('.list--tiered-navigation > .list__item'),
        $parentLinks = $expandableItems.find('> .list__link'),
        $expandableLinks = $expandableItems.find('.list__link--expandable'),
        $navigationLastLink = $navigationLinks.last(),
        $lastSearchSuggestion = $(site.overlays).find('.site-search-wrapper__list .list__item:last-child .list__link'),
        $mobileNavFirstLink = $mobileMenuContainer.find('a').first(),
        $mobileNavLastLink = $mobileMenuContainer.find('a').last(),
        $mobileBackButtons = $mobileMenuContainer.find('.sublinks__back-button'),
        $mobileCTAButtons = $mobileMenuContainer.find('.sublinks__call-to-action'),
        $mobileLastSubTierLinks = $mobileMenuContainer.find('.sublinks .list--tiered-sublinks:last-child > .list__item:last-child > .list__link'),
        $desktopCTAButtons = $expandableItems.find('.sublinks__call-to-action');

    function closeAllMenuSubLinks() {
      var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      if (!$expandableItems.length) return;
      $expandableItems.add($mobileMenuContainer.find('.list--tiered-navigation > .list__item')).each(function () {
        var $thisItem = $(this),
            $siblingLink = $thisItem.find('.list__link--expandable'),
            siblingId = $siblingLink.attr('data-a11y-toggle'),
            $siblingTarget = $thisItem.find('#' + siblingId);
        if (typeof siblingId === 'undefined' || siblingId === id) return;
        $siblingLink.attr('aria-expanded', 'false').removeClass('is-mouse-controlled');
        $siblingTarget.attr('aria-hidden', 'true');
      });
    } // close menus when the user clicks the Escape key


    $body.on('keydown', function (event) {
      if (event.keyCode !== 27) return;

      if ($body.hasClass('menu-is-open')) {
        $menuToggleButton[0].click();
      } else if ($body.hasClass('sub-menu-is-open')) {
        closeAllMenuSubLinks();
        $body.removeClass('sub-menu-is-open');
        $window.trigger('a11y-toggle-hide:subTierNavigationCallback');
      } else if ($body.hasClass('search-is-open')) {
        $searchToggle[0].click();
      }
    });
    $menuToggleButton.on('keydown', function (event) {
      if (!$body.hasClass('menu-is-open') || event.keyCode !== 9) return;
      event.preventDefault();

      if (viewports.width <= breakpoints.tablet) {
        if (event.shiftKey) {
          if ($body.hasClass('sub-menu-is-open')) {
            $mobileMenuContainer.find('.list__link[aria-expanded="true"] ~ .sublinks a').last().focus();
          } else {
            $mobileNavLastLink.focus();
          }
        } else {
          if ($body.hasClass('sub-menu-is-open')) {
            $mobileMenuContainer.find('.sublinks[aria-hidden="false"]:eq(0) .sublinks__back-button').focus();
          } else {
            $mobileNavFirstLink.focus();
          }
        }
      } else {
        $navigationLastLink.focus();
      }
    });
    $navigationLastLink.on('keydown', function (event) {
      if (viewports.width >= breakpoints.tablet || event.keyCode !== 9 || event.shiftKey) return;
      event.preventDefault();
      $menuToggleCloseButton.focus();
    }); //  Trigger a11yToggle events on mouse enter and leave for the menu sub-tiers
    // ========================================================

    $expandableItems.on('mouseenter', debounce(function (event) {
      if (viewports.width <= breakpoints.tablet) return;
      var $thisLink = $(this).find('.list__link--expandable'),
          id = $thisLink.attr('data-a11y-toggle'),
          collapsibleBox = document.getElementById(id);
      closeAllMenuSubLinks(id);

      if (!$thisLink.length || $thisLink.attr('aria-expanded') === 'true') {
        return;
      }

      $(collapsibleBox).attr('aria-hidden', 'false');
      $thisLink.attr('aria-expanded', 'true').addClass('is-mouse-controlled');
      $window.trigger('a11y-toggle-show:subTierNavigationCallback');
    }, 100));
    $(site.header).on('mouseleave', debounce(function (event) {
      if (viewports.width <= breakpoints.tablet) return;
      $expandableLinks.attr('aria-expanded', 'false').removeClass('is-mouse-controlled');
      $expandableItems.find('.sublinks').attr('aria-hidden', 'true');
      $window.trigger('a11y-toggle-hide:subTierNavigationCallback');
      $(menu.hoverIndicator).css({
        'transform': 'translateX(25vw)',
        'width': '4.5rem'
      });
    })); //  Trigger a11yToggle events on mouse enter and leave for the menu sub-tiers
    // ========================================================

    $parentLinks.on('mouseenter focusin', debounce(function (event) {
      if (viewports.width <= breakpoints.tablet) return;
      var $thisLink = $(this),
          listWidth = $menuNavList.width(),
          linkWidth = $thisLink.width(),
          position = $thisLink.position(),
          hoverIndicatorPaddingOffset = 18,
          offset = parseInt(listWidth - position.left - linkWidth - hoverIndicatorPaddingOffset),
          offsetRule;

      if (offset > 0) {
        offsetRule = 'translateX(-' + offset + 'px)';
      } else {
        offsetRule = 'translateX(' + offset + 'px)';
      }

      $(menu.hoverIndicator).css({
        'transform': offsetRule,
        'width': linkWidth
      });
      if ($thisLink.hasClass('.list__link--expandable') || $thisLink.attr('aria-expanded') == 'true') return;
      $window.trigger('a11y-toggle-hide:subTierNavigationCallback');
    }, 100));
    $parentLinks.on('mousedown touchend', function (event) {
      var $thisLink = $(this),
          targetUrl = $thisLink.attr('href');
      if (!$thisLink.hasClass('is-mouse-controlled') || typeof targetUrl === "undefined") return;
      window.location = targetUrl;
    });
    $searchToggle.on('keydown', function (event) {
      if ($body.hasClass('menu-is-open') && viewports.width <= breakpoints.tablet) {
        event.preventDefault();
        $mobileNavFirstLink.focus();
        return;
      }

      if (event.keyCode !== 9 || !$body.hasClass('search-is-open')) return;
      event.preventDefault();

      if (!event.shiftKey) {
        $siteSearchFormField.focus();
      } else {
        $lastSearchSuggestion.focus();
      }
    });
    $searchToggle.on('click', function (event) {
      closeAllMenuSubLinks();
      $body.removeClass('sub-menu-is-open');
      $(menu.hoverIndicator).removeAttr('style');
      $window.trigger('a11y-toggle-hide:subTierNavigationCallback');
    }); //  Hide the focus effect on click for UI elements
    // ========================================================

    $searchToggle.add($menuToggleButton).on('mousedown touchend', function () {
      $(this).addClass('hide-focus');
    });
    $searchToggle.add($menuToggleButton).on('blur', function () {
      $(this).removeClass('hide-focus');
    });
    $siteSearchFormField.on('keydown', function (event) {
      if (event.keyCode !== 9 || !event.shiftKey || !$searchToggle.length) return;
      event.preventDefault();
      $searchToggle.focus();
    });
    $lastSearchSuggestion.on('keydown', function (event) {
      if (event.keyCode !== 9 || event.shiftKey || !$searchToggle.length) return;
      event.preventDefault();
      $searchToggle.focus();
    });
    $mobileNavFirstLink.add($mobileBackButtons).on('keydown', function (event) {
      if (!$body.hasClass('menu-is-open') || event.keyCode !== 9 || !event.shiftKey) return;
      event.preventDefault();
      $menuToggle.focus();
    });
    $mobileBackButtons.on('click', function (event) {
      var $thisButton = $(this);
      event.preventDefault();
      setTimeout(function () {
        $thisButton.closest('.list__sublinks-wrapper').prev('.list__link--expandable').focus();
      }, 500);
    });
    $mobileNavLastLink.add($mobileCTAButtons).add($mobileLastSubTierLinks).on('keydown', function (event) {
      if (!$body.hasClass('menu-is-open') || event.keyCode !== 9 || event.shiftKey) return;
      event.preventDefault();
      $menuToggle.focus();
    });
    $desktopCTAButtons.on('keydown', function (event) {
      if (!$body.hasClass('sub-menu-is-open') || event.keyCode !== 9 || event.shiftKey) return;
      event.preventDefault();
      closeAllMenuSubLinks();
      $(this).closest('.list--tiered-navigation > .list__item').next('.list__item').find('.list__link').focus();
    });
    $expandableLinks.on('keydown', function (event) {
      if (!$body.hasClass('sub-menu-is-open') || event.keyCode !== 9 || !event.shiftKey || viewports.width <= breakpoints.tablet) return;
      event.preventDefault();
      $(this).next('.sublinks').find('a').last().focus();
    });
  }); // On window load...

  window.addEventListener('load', function () {
    carouselInit('.js-carousel');
    skipMaps();
    dateInputPolyfillSiteimproveFixes();
  });
  var resizeFunctions = debounce(function () {
    if ($body.hasClass('search-is-open') || $body.hasClass('menu-is-open')) {
      overlayWrapperHeightOffset();
    }

    headerMenuHeightAdjust();
  }, 100); // On window resize...

  window.addEventListener('resize', function () {
    if (verge.viewportW() == viewports.width && verge.viewportH() == viewports.height) return;
    viewports.height = verge.viewportH();
    viewports.width = verge.viewportW();
    setSiteMinHeight();
    toggleMobileSwap(menu.navigation, menu.toggle, breakpoints.tablet, true);
    responsiveTables.check();
    resizeFunctions();
  });
  /**
   * On orientation change
   */

  window.addEventListener('orientationchange', function () {
    responsiveTables.check();
    $(menu.hoverIndicator).removeAttr('style');
  });
})(jQuery);;"use strict";

/* **********************************************
     Begin prism-core.js
********************************************** */
/// <reference lib="WebWorker"/>
var _self = typeof window !== 'undefined' ? window // if in browser
: typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self // if in worker
: {} // if in node js
;
/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */


var Prism = function (_self) {
  // Private helper vars
  var lang = /\blang(?:uage)?-([\w-]+)\b/i;
  var uniqueId = 0;
  var _ = {
    /**
     * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
     * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
     * additional languages or plugins yourself.
     *
     * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
     *
     * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
     * empty Prism object into the global scope before loading the Prism script like this:
     *
     * ```js
     * window.Prism = window.Prism || {};
     * Prism.manual = true;
     * // add a new <script> to load Prism's script
     * ```
     *
     * @default false
     * @type {boolean}
     * @memberof Prism
     * @public
     */
    manual: _self.Prism && _self.Prism.manual,
    disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

    /**
     * A namespace for utility methods.
     *
     * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
     * change or disappear at any time.
     *
     * @namespace
     * @memberof Prism
     */
    util: {
      encode: function encode(tokens) {
        if (tokens instanceof Token) {
          return new Token(tokens.type, encode(tokens.content), tokens.alias);
        } else if (Array.isArray(tokens)) {
          return tokens.map(encode);
        } else {
          return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
        }
      },

      /**
       * Returns the name of the type of the given value.
       *
       * @param {any} o
       * @returns {string}
       * @example
       * type(null)      === 'Null'
       * type(undefined) === 'Undefined'
       * type(123)       === 'Number'
       * type('foo')     === 'String'
       * type(true)      === 'Boolean'
       * type([1, 2])    === 'Array'
       * type({})        === 'Object'
       * type(String)    === 'Function'
       * type(/abc+/)    === 'RegExp'
       */
      type: function type(o) {
        return Object.prototype.toString.call(o).slice(8, -1);
      },

      /**
       * Returns a unique number for the given object. Later calls will still return the same number.
       *
       * @param {Object} obj
       * @returns {number}
       */
      objId: function objId(obj) {
        if (!obj['__id']) {
          Object.defineProperty(obj, '__id', {
            value: ++uniqueId
          });
        }

        return obj['__id'];
      },

      /**
       * Creates a deep clone of the given object.
       *
       * The main intended use of this function is to clone language definitions.
       *
       * @param {T} o
       * @param {Record<number, any>} [visited]
       * @returns {T}
       * @template T
       */
      clone: function deepClone(o, visited) {
        visited = visited || {};
        var clone, id;

        switch (_.util.type(o)) {
          case 'Object':
            id = _.util.objId(o);

            if (visited[id]) {
              return visited[id];
            }

            clone =
            /** @type {Record<string, any>} */
            {};
            visited[id] = clone;

            for (var key in o) {
              if (o.hasOwnProperty(key)) {
                clone[key] = deepClone(o[key], visited);
              }
            }

            return (
              /** @type {any} */
              clone
            );

          case 'Array':
            id = _.util.objId(o);

            if (visited[id]) {
              return visited[id];
            }

            clone = [];
            visited[id] = clone;

            /** @type {Array} */

            /** @type {any} */
            o.forEach(function (v, i) {
              clone[i] = deepClone(v, visited);
            });
            return (
              /** @type {any} */
              clone
            );

          default:
            return o;
        }
      },

      /**
       * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
       *
       * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
       *
       * @param {Element} element
       * @returns {string}
       */
      getLanguage: function getLanguage(element) {
        while (element && !lang.test(element.className)) {
          element = element.parentElement;
        }

        if (element) {
          return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
        }

        return 'none';
      },

      /**
       * Returns the script element that is currently executing.
       *
       * This does __not__ work for line script element.
       *
       * @returns {HTMLScriptElement | null}
       */
      currentScript: function currentScript() {
        if (typeof document === 'undefined') {
          return null;
        }

        if ('currentScript' in document && 1 < 2
        /* hack to trip TS' flow analysis */
        ) {
            return (
              /** @type {any} */
              document.currentScript
            );
          } // IE11 workaround
        // we'll get the src of the current script by parsing IE11's error stack trace
        // this will not work for inline scripts


        try {
          throw new Error();
        } catch (err) {
          // Get file src url from stack. Specifically works with the format of stack traces in IE.
          // A stack will look like this:
          //
          // Error
          //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
          //    at Global code (http://localhost/components/prism-core.js:606:1)
          var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];

          if (src) {
            var scripts = document.getElementsByTagName('script');

            for (var i in scripts) {
              if (scripts[i].src == src) {
                return scripts[i];
              }
            }
          }

          return null;
        }
      },

      /**
       * Returns whether a given class is active for `element`.
       *
       * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
       * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
       * given class is just the given class with a `no-` prefix.
       *
       * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
       * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
       * ancestors have the given class or the negated version of it, then the default activation will be returned.
       *
       * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
       * version of it, the class is considered active.
       *
       * @param {Element} element
       * @param {string} className
       * @param {boolean} [defaultActivation=false]
       * @returns {boolean}
       */
      isActive: function isActive(element, className, defaultActivation) {
        var no = 'no-' + className;

        while (element) {
          var classList = element.classList;

          if (classList.contains(className)) {
            return true;
          }

          if (classList.contains(no)) {
            return false;
          }

          element = element.parentElement;
        }

        return !!defaultActivation;
      }
    },

    /**
     * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
     *
     * @namespace
     * @memberof Prism
     * @public
     */
    languages: {
      /**
       * Creates a deep copy of the language with the given id and appends the given tokens.
       *
       * If a token in `redef` also appears in the copied language, then the existing token in the copied language
       * will be overwritten at its original position.
       *
       * ## Best practices
       *
       * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
       * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
       * understand the language definition because, normally, the order of tokens matters in Prism grammars.
       *
       * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
       * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
       *
       * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
       * @param {Grammar} redef The new tokens to append.
       * @returns {Grammar} The new language created.
       * @public
       * @example
       * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
       *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
       *     // at its original position
       *     'comment': { ... },
       *     // CSS doesn't have a 'color' token, so this token will be appended
       *     'color': /\b(?:red|green|blue)\b/
       * });
       */
      extend: function extend(id, redef) {
        var lang = _.util.clone(_.languages[id]);

        for (var key in redef) {
          lang[key] = redef[key];
        }

        return lang;
      },

      /**
       * Inserts tokens _before_ another token in a language definition or any other grammar.
       *
       * ## Usage
       *
       * This helper method makes it easy to modify existing languages. For example, the CSS language definition
       * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
       * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
       * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
       * this:
       *
       * ```js
       * Prism.languages.markup.style = {
       *     // token
       * };
       * ```
       *
       * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
       * before existing tokens. For the CSS example above, you would use it like this:
       *
       * ```js
       * Prism.languages.insertBefore('markup', 'cdata', {
       *     'style': {
       *         // token
       *     }
       * });
       * ```
       *
       * ## Special cases
       *
       * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
       * will be ignored.
       *
       * This behavior can be used to insert tokens after `before`:
       *
       * ```js
       * Prism.languages.insertBefore('markup', 'comment', {
       *     'comment': Prism.languages.markup.comment,
       *     // tokens after 'comment'
       * });
       * ```
       *
       * ## Limitations
       *
       * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
       * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
       * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
       * deleting properties which is necessary to insert at arbitrary positions.
       *
       * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
       * Instead, it will create a new object and replace all references to the target object with the new one. This
       * can be done without temporarily deleting properties, so the iteration order is well-defined.
       *
       * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
       * you hold the target object in a variable, then the value of the variable will not change.
       *
       * ```js
       * var oldMarkup = Prism.languages.markup;
       * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
       *
       * assert(oldMarkup !== Prism.languages.markup);
       * assert(newMarkup === Prism.languages.markup);
       * ```
       *
       * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
       * object to be modified.
       * @param {string} before The key to insert before.
       * @param {Grammar} insert An object containing the key-value pairs to be inserted.
       * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
       * object to be modified.
       *
       * Defaults to `Prism.languages`.
       * @returns {Grammar} The new grammar object.
       * @public
       */
      insertBefore: function insertBefore(inside, before, insert, root) {
        root = root ||
        /** @type {any} */
        _.languages;
        var grammar = root[inside];
        /** @type {Grammar} */

        var ret = {};

        for (var token in grammar) {
          if (grammar.hasOwnProperty(token)) {
            if (token == before) {
              for (var newToken in insert) {
                if (insert.hasOwnProperty(newToken)) {
                  ret[newToken] = insert[newToken];
                }
              }
            } // Do not insert token which also occur in insert. See #1525


            if (!insert.hasOwnProperty(token)) {
              ret[token] = grammar[token];
            }
          }
        }

        var old = root[inside];
        root[inside] = ret; // Update references in other language definitions

        _.languages.DFS(_.languages, function (key, value) {
          if (value === old && key != inside) {
            this[key] = ret;
          }
        });

        return ret;
      },
      // Traverse a language definition with Depth First Search
      DFS: function DFS(o, callback, type, visited) {
        visited = visited || {};
        var objId = _.util.objId;

        for (var i in o) {
          if (o.hasOwnProperty(i)) {
            callback.call(o, i, o[i], type || i);

            var property = o[i],
                propertyType = _.util.type(property);

            if (propertyType === 'Object' && !visited[objId(property)]) {
              visited[objId(property)] = true;
              DFS(property, callback, null, visited);
            } else if (propertyType === 'Array' && !visited[objId(property)]) {
              visited[objId(property)] = true;
              DFS(property, callback, i, visited);
            }
          }
        }
      }
    },
    plugins: {},

    /**
     * This is the most high-level function in Prism’s API.
     * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
     * each one of them.
     *
     * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
     *
     * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
     * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
     * @memberof Prism
     * @public
     */
    highlightAll: function highlightAll(async, callback) {
      _.highlightAllUnder(document, async, callback);
    },

    /**
     * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
     * {@link Prism.highlightElement} on each one of them.
     *
     * The following hooks will be run:
     * 1. `before-highlightall`
     * 2. All hooks of {@link Prism.highlightElement} for each element.
     *
     * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
     * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
     * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
     * @memberof Prism
     * @public
     */
    highlightAllUnder: function highlightAllUnder(container, async, callback) {
      var env = {
        callback: callback,
        container: container,
        selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
      };

      _.hooks.run('before-highlightall', env);

      env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

      _.hooks.run('before-all-elements-highlight', env);

      for (var i = 0, element; element = env.elements[i++];) {
        _.highlightElement(element, async === true, env.callback);
      }
    },

    /**
     * Highlights the code inside a single element.
     *
     * The following hooks will be run:
     * 1. `before-sanity-check`
     * 2. `before-highlight`
     * 3. All hooks of {@link Prism.highlight}. These hooks will only be run by the current worker if `async` is `true`.
     * 4. `before-insert`
     * 5. `after-highlight`
     * 6. `complete`
     *
     * @param {Element} element The element containing the code.
     * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
     * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
     * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
     * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
     *
     * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
     * asynchronous highlighting to work. You can build your own bundle on the
     * [Download page](https://prismjs.com/download.html).
     * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
     * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
     * @memberof Prism
     * @public
     */
    highlightElement: function highlightElement(element, async, callback) {
      // Find language
      var language = _.util.getLanguage(element);

      var grammar = _.languages[language]; // Set language on the element, if not present

      element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language; // Set language on the parent, for styling

      var parent = element.parentElement;

      if (parent && parent.nodeName.toLowerCase() === 'pre') {
        parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
      }

      var code = element.textContent;
      var env = {
        element: element,
        language: language,
        grammar: grammar,
        code: code
      };

      function insertHighlightedCode(highlightedCode) {
        env.highlightedCode = highlightedCode;

        _.hooks.run('before-insert', env);

        env.element.innerHTML = env.highlightedCode;

        _.hooks.run('after-highlight', env);

        _.hooks.run('complete', env);

        callback && callback.call(env.element);
      }

      _.hooks.run('before-sanity-check', env);

      if (!env.code) {
        _.hooks.run('complete', env);

        callback && callback.call(env.element);
        return;
      }

      _.hooks.run('before-highlight', env);

      if (!env.grammar) {
        insertHighlightedCode(_.util.encode(env.code));
        return;
      }

      if (async && _self.Worker) {
        var worker = new Worker(_.filename);

        worker.onmessage = function (evt) {
          insertHighlightedCode(evt.data);
        };

        worker.postMessage(JSON.stringify({
          language: env.language,
          code: env.code,
          immediateClose: true
        }));
      } else {
        insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
      }
    },

    /**
     * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
     * and the language definitions to use, and returns a string with the HTML produced.
     *
     * The following hooks will be run:
     * 1. `before-tokenize`
     * 2. `after-tokenize`
     * 3. `wrap`: On each {@link Token}.
     *
     * @param {string} text A string with the code to be highlighted.
     * @param {Grammar} grammar An object containing the tokens to use.
     *
     * Usually a language definition like `Prism.languages.markup`.
     * @param {string} language The name of the language definition passed to `grammar`.
     * @returns {string} The highlighted HTML.
     * @memberof Prism
     * @public
     * @example
     * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
     */
    highlight: function highlight(text, grammar, language) {
      var env = {
        code: text,
        grammar: grammar,
        language: language
      };

      _.hooks.run('before-tokenize', env);

      env.tokens = _.tokenize(env.code, env.grammar);

      _.hooks.run('after-tokenize', env);

      return Token.stringify(_.util.encode(env.tokens), env.language);
    },

    /**
     * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
     * and the language definitions to use, and returns an array with the tokenized code.
     *
     * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
     *
     * This method could be useful in other contexts as well, as a very crude parser.
     *
     * @param {string} text A string with the code to be highlighted.
     * @param {Grammar} grammar An object containing the tokens to use.
     *
     * Usually a language definition like `Prism.languages.markup`.
     * @returns {TokenStream} An array of strings and tokens, a token stream.
     * @memberof Prism
     * @public
     * @example
     * let code = `var foo = 0;`;
     * let tokens = Prism.tokenize(code, Prism.languages.javascript);
     * tokens.forEach(token => {
     *     if (token instanceof Prism.Token && token.type === 'number') {
     *         console.log(`Found numeric literal: ${token.content}`);
     *     }
     * });
     */
    tokenize: function tokenize(text, grammar) {
      var rest = grammar.rest;

      if (rest) {
        for (var token in rest) {
          grammar[token] = rest[token];
        }

        delete grammar.rest;
      }

      var tokenList = new LinkedList();
      addAfter(tokenList, tokenList.head, text);
      matchGrammar(text, tokenList, grammar, tokenList.head, 0);
      return toArray(tokenList);
    },

    /**
     * @namespace
     * @memberof Prism
     * @public
     */
    hooks: {
      all: {},

      /**
       * Adds the given callback to the list of callbacks for the given hook.
       *
       * The callback will be invoked when the hook it is registered for is run.
       * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
       *
       * One callback function can be registered to multiple hooks and the same hook multiple times.
       *
       * @param {string} name The name of the hook.
       * @param {HookCallback} callback The callback function which is given environment variables.
       * @public
       */
      add: function add(name, callback) {
        var hooks = _.hooks.all;
        hooks[name] = hooks[name] || [];
        hooks[name].push(callback);
      },

      /**
       * Runs a hook invoking all registered callbacks with the given environment variables.
       *
       * Callbacks will be invoked synchronously and in the order in which they were registered.
       *
       * @param {string} name The name of the hook.
       * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
       * @public
       */
      run: function run(name, env) {
        var callbacks = _.hooks.all[name];

        if (!callbacks || !callbacks.length) {
          return;
        }

        for (var i = 0, callback; callback = callbacks[i++];) {
          callback(env);
        }
      }
    },
    Token: Token
  };
  _self.Prism = _; // Typescript note:
  // The following can be used to import the Token type in JSDoc:
  //
  //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

  /**
   * Creates a new token.
   *
   * @param {string} type See {@link Token#type type}
   * @param {string | TokenStream} content See {@link Token#content content}
   * @param {string|string[]} [alias] The alias(es) of the token.
   * @param {string} [matchedStr=""] A copy of the full string this token was created from.
   * @class
   * @global
   * @public
   */

  function Token(type, content, alias, matchedStr) {
    /**
     * The type of the token.
     *
     * This is usually the key of a pattern in a {@link Grammar}.
     *
     * @type {string}
     * @see GrammarToken
     * @public
     */
    this.type = type;
    /**
     * The strings or tokens contained by this token.
     *
     * This will be a token stream if the pattern matched also defined an `inside` grammar.
     *
     * @type {string | TokenStream}
     * @public
     */

    this.content = content;
    /**
     * The alias(es) of the token.
     *
     * @type {string|string[]}
     * @see GrammarToken
     * @public
     */

    this.alias = alias; // Copy of the full string this token was created from

    this.length = (matchedStr || '').length | 0;
  }
  /**
   * A token stream is an array of strings and {@link Token Token} objects.
   *
   * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
   * them.
   *
   * 1. No adjacent strings.
   * 2. No empty strings.
   *
   *    The only exception here is the token stream that only contains the empty string and nothing else.
   *
   * @typedef {Array<string | Token>} TokenStream
   * @global
   * @public
   */

  /**
   * Converts the given token or token stream to an HTML representation.
   *
   * The following hooks will be run:
   * 1. `wrap`: On each {@link Token}.
   *
   * @param {string | Token | TokenStream} o The token or token stream to be converted.
   * @param {string} language The name of current language.
   * @returns {string} The HTML representation of the token or token stream.
   * @memberof Token
   * @static
   */


  Token.stringify = function stringify(o, language) {
    if (typeof o == 'string') {
      return o;
    }

    if (Array.isArray(o)) {
      var s = '';
      o.forEach(function (e) {
        s += stringify(e, language);
      });
      return s;
    }

    var env = {
      type: o.type,
      content: stringify(o.content, language),
      tag: 'span',
      classes: ['token', o.type],
      attributes: {},
      language: language
    };
    var aliases = o.alias;

    if (aliases) {
      if (Array.isArray(aliases)) {
        Array.prototype.push.apply(env.classes, aliases);
      } else {
        env.classes.push(aliases);
      }
    }

    _.hooks.run('wrap', env);

    var attributes = '';

    for (var name in env.attributes) {
      attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    }

    return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
  };
  /**
   * @param {string} text
   * @param {LinkedList<string | Token>} tokenList
   * @param {any} grammar
   * @param {LinkedListNode<string | Token>} startNode
   * @param {number} startPos
   * @param {RematchOptions} [rematch]
   * @returns {void}
   * @private
   *
   * @typedef RematchOptions
   * @property {string} cause
   * @property {number} reach
   */


  function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    for (var token in grammar) {
      if (!grammar.hasOwnProperty(token) || !grammar[token]) {
        continue;
      }

      var patterns = grammar[token];
      patterns = Array.isArray(patterns) ? patterns : [patterns];

      for (var j = 0; j < patterns.length; ++j) {
        if (rematch && rematch.cause == token + ',' + j) {
          return;
        }

        var patternObj = patterns[j],
            inside = patternObj.inside,
            lookbehind = !!patternObj.lookbehind,
            greedy = !!patternObj.greedy,
            lookbehindLength = 0,
            alias = patternObj.alias;

        if (greedy && !patternObj.pattern.global) {
          // Without the global flag, lastIndex won't work
          var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
          patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
        }
        /** @type {RegExp} */


        var pattern = patternObj.pattern || patternObj;

        for ( // iterate the token list and keep track of the current token/string position
        var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
          if (rematch && pos >= rematch.reach) {
            break;
          }

          var str = currentNode.value;

          if (tokenList.length > text.length) {
            // Something went terribly wrong, ABORT, ABORT!
            return;
          }

          if (str instanceof Token) {
            continue;
          }

          var removeCount = 1; // this is the to parameter of removeBetween

          if (greedy && currentNode != tokenList.tail.prev) {
            pattern.lastIndex = pos;
            var match = pattern.exec(text);

            if (!match) {
              break;
            }

            var from = match.index + (lookbehind && match[1] ? match[1].length : 0);
            var to = match.index + match[0].length;
            var p = pos; // find the node that contains the match

            p += currentNode.value.length;

            while (from >= p) {
              currentNode = currentNode.next;
              p += currentNode.value.length;
            } // adjust pos (and p)


            p -= currentNode.value.length;
            pos = p; // the current node is a Token, then the match starts inside another Token, which is invalid

            if (currentNode.value instanceof Token) {
              continue;
            } // find the last node which is affected by this match


            for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === 'string'); k = k.next) {
              removeCount++;
              p += k.value.length;
            }

            removeCount--; // replace with the new match

            str = text.slice(pos, p);
            match.index -= pos;
          } else {
            pattern.lastIndex = 0;
            var match = pattern.exec(str);
          }

          if (!match) {
            continue;
          }

          if (lookbehind) {
            lookbehindLength = match[1] ? match[1].length : 0;
          }

          var from = match.index + lookbehindLength,
              matchStr = match[0].slice(lookbehindLength),
              to = from + matchStr.length,
              before = str.slice(0, from),
              after = str.slice(to);
          var reach = pos + str.length;

          if (rematch && reach > rematch.reach) {
            rematch.reach = reach;
          }

          var removeFrom = currentNode.prev;

          if (before) {
            removeFrom = addAfter(tokenList, removeFrom, before);
            pos += before.length;
          }

          removeRange(tokenList, removeFrom, removeCount);
          var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
          currentNode = addAfter(tokenList, removeFrom, wrapped);

          if (after) {
            addAfter(tokenList, currentNode, after);
          }

          if (removeCount > 1) {
            // at least one Token object was removed, so we have to do some rematching
            // this can only happen if the current pattern is greedy
            matchGrammar(text, tokenList, grammar, currentNode.prev, pos, {
              cause: token + ',' + j,
              reach: reach
            });
          }
        }
      }
    }
  }
  /**
   * @typedef LinkedListNode
   * @property {T} value
   * @property {LinkedListNode<T> | null} prev The previous node.
   * @property {LinkedListNode<T> | null} next The next node.
   * @template T
   * @private
   */

  /**
   * @template T
   * @private
   */


  function LinkedList() {
    /** @type {LinkedListNode<T>} */
    var head = {
      value: null,
      prev: null,
      next: null
    };
    /** @type {LinkedListNode<T>} */

    var tail = {
      value: null,
      prev: head,
      next: null
    };
    head.next = tail;
    /** @type {LinkedListNode<T>} */

    this.head = head;
    /** @type {LinkedListNode<T>} */

    this.tail = tail;
    this.length = 0;
  }
  /**
   * Adds a new node with the given value to the list.
   * @param {LinkedList<T>} list
   * @param {LinkedListNode<T>} node
   * @param {T} value
   * @returns {LinkedListNode<T>} The added node.
   * @template T
   */


  function addAfter(list, node, value) {
    // assumes that node != list.tail && values.length >= 0
    var next = node.next;
    var newNode = {
      value: value,
      prev: node,
      next: next
    };
    node.next = newNode;
    next.prev = newNode;
    list.length++;
    return newNode;
  }
  /**
   * Removes `count` nodes after the given node. The given node will not be removed.
   * @param {LinkedList<T>} list
   * @param {LinkedListNode<T>} node
   * @param {number} count
   * @template T
   */


  function removeRange(list, node, count) {
    var next = node.next;

    for (var i = 0; i < count && next !== list.tail; i++) {
      next = next.next;
    }

    node.next = next;
    next.prev = node;
    list.length -= i;
  }
  /**
   * @param {LinkedList<T>} list
   * @returns {T[]}
   * @template T
   */


  function toArray(list) {
    var array = [];
    var node = list.head.next;

    while (node !== list.tail) {
      array.push(node.value);
      node = node.next;
    }

    return array;
  }

  if (!_self.document) {
    if (!_self.addEventListener) {
      // in Node.js
      return _;
    }

    if (!_.disableWorkerMessageHandler) {
      // In worker
      _self.addEventListener('message', function (evt) {
        var message = JSON.parse(evt.data),
            lang = message.language,
            code = message.code,
            immediateClose = message.immediateClose;

        _self.postMessage(_.highlight(code, _.languages[lang], lang));

        if (immediateClose) {
          _self.close();
        }
      }, false);
    }

    return _;
  } // Get current script and highlight


  var script = _.util.currentScript();

  if (script) {
    _.filename = script.src;

    if (script.hasAttribute('data-manual')) {
      _.manual = true;
    }
  }

  function highlightAutomaticallyCallback() {
    if (!_.manual) {
      _.highlightAll();
    }
  }

  if (!_.manual) {
    // If the document state is "loading", then we'll use DOMContentLoaded.
    // If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
    // DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
    // might take longer one animation frame to execute which can create a race condition where only some plugins have
    // been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
    // See https://github.com/PrismJS/prism/issues/2102
    var readyState = document.readyState;

    if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
      document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    } else {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(highlightAutomaticallyCallback);
      } else {
        window.setTimeout(highlightAutomaticallyCallback, 16);
      }
    }
  }

  return _;
}(_self);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prism;
} // hack for components to work correctly in node.js


if (typeof global !== 'undefined') {
  global.Prism = Prism;
} // some additional documentation/types

/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 *
 * @typedef GrammarToken
 * @property {RegExp} pattern The regular expression of the token.
 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
 * @property {boolean} [greedy=false] Whether the token is greedy.
 * @property {string|string[]} [alias] An optional alias or list of aliases.
 * @property {Grammar} [inside] The nested grammar of this token.
 *
 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
 *
 * This can be used to make nested and even recursive language definitions.
 *
 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
 * each another.
 * @global
 * @public
*/

/**
 * @typedef Grammar
 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
 * @global
 * @public
 */

/**
 * A function which will invoked after an element was successfully highlighted.
 *
 * @callback HighlightCallback
 * @param {Element} element The element successfully highlighted.
 * @returns {void}
 * @global
 * @public
*/

/**
 * @callback HookCallback
 * @param {Object<string, any>} env The environment variables of the hook.
 * @returns {void}
 * @global
 * @public
 */

/* **********************************************
     Begin prism-markup.js
********************************************** */


Prism.languages.markup = {
  'comment': /<!--[\s\S]*?-->/,
  'prolog': /<\?[\s\S]+?\?>/,
  'doctype': {
    // https://www.w3.org/TR/xml/#NT-doctypedecl
    pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: true,
    inside: {
      'internal-subset': {
        pattern: /(\[)[\s\S]+(?=\]>$)/,
        lookbehind: true,
        greedy: true,
        inside: null // see below

      },
      'string': {
        pattern: /"[^"]*"|'[^']*'/,
        greedy: true
      },
      'punctuation': /^<!|>$|[[\]]/,
      'doctype-tag': /^DOCTYPE/,
      'name': /[^\s<>'"]+/
    }
  },
  'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
  'tag': {
    pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    greedy: true,
    inside: {
      'tag': {
        pattern: /^<\/?[^\s>\/]+/,
        inside: {
          'punctuation': /^<\/?/,
          'namespace': /^[^\s>\/:]+:/
        }
      },
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
        inside: {
          'punctuation': [{
            pattern: /^=/,
            alias: 'attr-equals'
          }, /"|'/]
        }
      },
      'punctuation': /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          'namespace': /^[^\s>\/:]+:/
        }
      }
    }
  },
  'entity': [{
    pattern: /&[\da-z]{1,8};/i,
    alias: 'named-entity'
  }, /&#x?[\da-f]{1,8};/i]
};
Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] = Prism.languages.markup['entity'];
Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup; // Plugin to make entity title show the real entity, idea by Roman Komarov

Prism.hooks.add('wrap', function (env) {
  if (env.type === 'entity') {
    env.attributes['title'] = env.content.replace(/&amp;/, '&');
  }
});
Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
  /**
   * Adds an inlined language to markup.
   *
   * An example of an inlined language is CSS with `<style>` tags.
   *
   * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addInlined('style', 'css');
   */
  value: function addInlined(tagName, lang) {
    var includedCdataInside = {};
    includedCdataInside['language-' + lang] = {
      pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
      lookbehind: true,
      inside: Prism.languages[lang]
    };
    includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;
    var inside = {
      'included-cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        inside: includedCdataInside
      }
    };
    inside['language-' + lang] = {
      pattern: /[\s\S]+/,
      inside: Prism.languages[lang]
    };
    var def = {};
    def[tagName] = {
      pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () {
        return tagName;
      }), 'i'),
      lookbehind: true,
      greedy: true,
      inside: inside
    };
    Prism.languages.insertBefore('markup', 'cdata', def);
  }
});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;
Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;
/* **********************************************
     Begin prism-css.js
********************************************** */

(function (Prism) {
  var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
  Prism.languages.css = {
    'comment': /\/\*[\s\S]*?\*\//,
    'atrule': {
      pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
      inside: {
        'rule': /^@[\w-]+/,
        'selector-function-argument': {
          pattern: /(\bselector\s*\((?!\s*\))\s*)(?:[^()]|\((?:[^()]|\([^()]*\))*\))+?(?=\s*\))/,
          lookbehind: true,
          alias: 'selector'
        },
        'keyword': {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: true
        } // See rest below

      }
    },
    'url': {
      // https://drafts.csswg.org/css-values-3/#urls
      pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
      greedy: true,
      inside: {
        'function': /^url/i,
        'punctuation': /^\(|\)$/,
        'string': {
          pattern: RegExp('^' + string.source + '$'),
          alias: 'url'
        }
      }
    },
    'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
    'string': {
      pattern: string,
      greedy: true
    },
    'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    'important': /!important\b/i,
    'function': /[-a-z0-9]+(?=\()/i,
    'punctuation': /[(){};:,]/
  };
  Prism.languages.css['atrule'].inside.rest = Prism.languages.css;
  var markup = Prism.languages.markup;

  if (markup) {
    markup.tag.addInlined('style', 'css');
    Prism.languages.insertBefore('inside', 'attr-value', {
      'style-attr': {
        pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
        inside: {
          'attr-name': {
            pattern: /^\s*style/i,
            inside: markup.tag.inside
          },
          'punctuation': /^\s*=\s*['"]|['"]\s*$/,
          'attr-value': {
            pattern: /.+/i,
            inside: Prism.languages.css
          }
        },
        alias: 'language-css'
      }
    }, markup.tag);
  }
})(Prism);
/* **********************************************
     Begin prism-clike.js
********************************************** */


Prism.languages.clike = {
  'comment': [{
    pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    lookbehind: true
  }, {
    pattern: /(^|[^\\:])\/\/.*/,
    lookbehind: true,
    greedy: true
  }],
  'string': {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'class-name': {
    pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    lookbehind: true,
    inside: {
      'punctuation': /[.\\]/
    }
  },
  'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
  'boolean': /\b(?:true|false)\b/,
  'function': /\w+(?=\()/,
  'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
  'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
  'punctuation': /[{}[\];(),.:]/
};
/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
  'class-name': [Prism.languages.clike['class-name'], {
    pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
    lookbehind: true
  }],
  'keyword': [{
    pattern: /((?:^|})\s*)(?:catch|finally)\b/,
    lookbehind: true
  }, {
    pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|(?:get|set)(?=\s*[\[$\w\xA0-\uFFFF])|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    lookbehind: true
  }],
  'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});
Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;
Prism.languages.insertBefore('javascript', 'keyword', {
  'regex': {
    pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    lookbehind: true,
    greedy: true
  },
  // This must be declared before keyword because we use "function" inside the look-forward
  'function-variable': {
    pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
    alias: 'function'
  },
  'parameter': [{
    pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
    lookbehind: true,
    inside: Prism.languages.javascript
  }, {
    pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
    inside: Prism.languages.javascript
  }, {
    pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
    lookbehind: true,
    inside: Prism.languages.javascript
  }, {
    pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
    lookbehind: true,
    inside: Prism.languages.javascript
  }],
  'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});
Prism.languages.insertBefore('javascript', 'string', {
  'template-string': {
    pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
    greedy: true,
    inside: {
      'template-punctuation': {
        pattern: /^`|`$/,
        alias: 'string'
      },
      'interpolation': {
        pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
        lookbehind: true,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\${|}$/,
            alias: 'punctuation'
          },
          rest: Prism.languages.javascript
        }
      },
      'string': /[\s\S]+/
    }
  }
});

if (Prism.languages.markup) {
  Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;
/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
  if (typeof self === 'undefined' || !self.Prism || !self.document) {
    return;
  }

  var Prism = window.Prism;
  var LOADING_MESSAGE = 'Loading…';

  var FAILURE_MESSAGE = function FAILURE_MESSAGE(status, message) {
    return '✖ Error ' + status + ' while fetching file: ' + message;
  };

  var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';
  var EXTENSIONS = {
    'js': 'javascript',
    'py': 'python',
    'rb': 'ruby',
    'ps1': 'powershell',
    'psm1': 'powershell',
    'sh': 'bash',
    'bat': 'batch',
    'h': 'c',
    'tex': 'latex'
  };
  var STATUS_ATTR = 'data-src-status';
  var STATUS_LOADING = 'loading';
  var STATUS_LOADED = 'loaded';
  var STATUS_FAILED = 'failed';
  var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])' + ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';
  var lang = /\blang(?:uage)?-([\w-]+)\b/i;
  /**
   * Sets the Prism `language-xxxx` or `lang-xxxx` class to the given language.
   *
   * @param {HTMLElement} element
   * @param {string} language
   * @returns {void}
   */

  function setLanguageClass(element, language) {
    var className = element.className;
    className = className.replace(lang, ' ') + ' language-' + language;
    element.className = className.replace(/\s+/g, ' ').trim();
  }

  Prism.hooks.add('before-highlightall', function (env) {
    env.selector += ', ' + SELECTOR;
  });
  Prism.hooks.add('before-sanity-check', function (env) {
    var pre =
    /** @type {HTMLPreElement} */
    env.element;

    if (pre.matches(SELECTOR)) {
      env.code = ''; // fast-path the whole thing and go to complete

      pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading
      // add code element with loading message

      var code = pre.appendChild(document.createElement('CODE'));
      code.textContent = LOADING_MESSAGE;
      var src = pre.getAttribute('data-src');
      var language = env.language;

      if (language === 'none') {
        // the language might be 'none' because there is no language set;
        // in this case, we want to use the extension as the language
        var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
        language = EXTENSIONS[extension] || extension;
      } // set language classes


      setLanguageClass(code, language);
      setLanguageClass(pre, language); // preload the language

      var autoloader = Prism.plugins.autoloader;

      if (autoloader) {
        autoloader.loadLanguages(language);
      } // load file


      var xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (xhr.status < 400 && xhr.responseText) {
            // mark as loaded
            pre.setAttribute(STATUS_ATTR, STATUS_LOADED); // highlight code

            code.textContent = xhr.responseText;
            Prism.highlightElement(code);
          } else {
            // mark as failed
            pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

            if (xhr.status >= 400) {
              code.textContent = FAILURE_MESSAGE(xhr.status, xhr.statusText);
            } else {
              code.textContent = FAILURE_EMPTY_MESSAGE;
            }
          }
        }
      };

      xhr.send(null);
    }
  });
  Prism.plugins.fileHighlight = {
    /**
     * Executes the File Highlight plugin for all matching `pre` elements under the given container.
     *
     * Note: Elements which are already loaded or currently loading will not be touched by this method.
     *
     * @param {ParentNode} [container=document]
     */
    highlight: function highlight(container) {
      var elements = (container || document).querySelectorAll(SELECTOR);

      for (var i = 0, element; element = elements[i++];) {
        Prism.highlightElement(element);
      }
    }
  };
  var logged = false;
  /** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */

  Prism.fileHighlight = function () {
    if (!logged) {
      console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
      logged = true;
    }

    Prism.plugins.fileHighlight.highlight.apply(this, arguments);
  };
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5tYXRjaEhlaWdodC5qcyIsIm1hdGNoTWVkaWEuanMiLCJmbGlja2l0eS5wa2dkLmpzIiwicGxhY2Vob2xkci5qcyIsInZlcmdlLmpzIiwicGljdHVyZWZpbGwubWluLmpzIiwib2JqZWN0Rml0UG9seWZpbGwubWluLmpzIiwiaXNvdG9wZS5wa2dkLmpzIiwiZ2xvYmFscy5qcyIsImRlYm91bmNlLmpzIiwiaGVscGVycy5qcyIsImExMXktdG9nZ2xlLXdpdGgtY2FsbGJhY2suanMiLCJhMTF5LXRvZ2dsZS1jb25uZWN0ZWQuanMiLCJleHRlcm5hbC1saW5rLWNoZWNrZXIuanMiLCJmaWxlLXVwbG9hZC5qcyIsInRvZ2dsZS1tb2JpbGUtc3dhcC5qcyIsIm5hdmlnYXRpb24uanMiLCJlbWJlZGRlZC1tYXBzLmpzIiwiY2Fyb3VzZWwtaW5pdC5qcyIsInJlc3BvbnNpdmUtdGFibGVzLmpzIiwiZGF0ZS1maWVsZC1mb3JtYXQtaGVscGVyLmpzIiwiaXNvdG9wZS1pbml0LmpzIiwibWFpbi5qcyIsInByaXNtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQ25YQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUNqMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkMxZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUNqN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUZDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1DMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1DekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUNyUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJvcmJpdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qKlxuKiBqcXVlcnktbWF0Y2gtaGVpZ2h0IDAuNy4yIGJ5IEBsaWFicnVcbiogaHR0cDovL2JybS5pby9qcXVlcnktbWF0Y2gtaGVpZ2h0L1xuKiBMaWNlbnNlOiBNSVRcbiovXG47XG5cbihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dHJhLXNlbWlcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gR2xvYmFsXG4gICAgZmFjdG9yeShqUXVlcnkpO1xuICB9XG59KShmdW5jdGlvbiAoJCkge1xuICAvKlxuICAqICBpbnRlcm5hbFxuICAqL1xuICB2YXIgX3ByZXZpb3VzUmVzaXplV2lkdGggPSAtMSxcbiAgICAgIF91cGRhdGVUaW1lb3V0ID0gLTE7XG4gIC8qXG4gICogIF9wYXJzZVxuICAqICB2YWx1ZSBwYXJzZSB1dGlsaXR5IGZ1bmN0aW9uXG4gICovXG5cblxuICB2YXIgX3BhcnNlID0gZnVuY3Rpb24gX3BhcnNlKHZhbHVlKSB7XG4gICAgLy8gcGFyc2UgdmFsdWUgYW5kIGNvbnZlcnQgTmFOIHRvIDBcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSkgfHwgMDtcbiAgfTtcbiAgLypcbiAgKiAgX3Jvd3NcbiAgKiAgdXRpbGl0eSBmdW5jdGlvbiByZXR1cm5zIGFycmF5IG9mIGpRdWVyeSBzZWxlY3Rpb25zIHJlcHJlc2VudGluZyBlYWNoIHJvd1xuICAqICAoYXMgZGlzcGxheWVkIGFmdGVyIGZsb2F0IHdyYXBwaW5nIGFwcGxpZWQgYnkgYnJvd3NlcilcbiAgKi9cblxuXG4gIHZhciBfcm93cyA9IGZ1bmN0aW9uIF9yb3dzKGVsZW1lbnRzKSB7XG4gICAgdmFyIHRvbGVyYW5jZSA9IDEsXG4gICAgICAgICRlbGVtZW50cyA9ICQoZWxlbWVudHMpLFxuICAgICAgICBsYXN0VG9wID0gbnVsbCxcbiAgICAgICAgcm93cyA9IFtdOyAvLyBncm91cCBlbGVtZW50cyBieSB0aGVpciB0b3AgcG9zaXRpb25cblxuICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhhdCA9ICQodGhpcyksXG4gICAgICAgICAgdG9wID0gJHRoYXQub2Zmc2V0KCkudG9wIC0gX3BhcnNlKCR0aGF0LmNzcygnbWFyZ2luLXRvcCcpKSxcbiAgICAgICAgICBsYXN0Um93ID0gcm93cy5sZW5ndGggPiAwID8gcm93c1tyb3dzLmxlbmd0aCAtIDFdIDogbnVsbDtcblxuICAgICAgaWYgKGxhc3RSb3cgPT09IG51bGwpIHtcbiAgICAgICAgLy8gZmlyc3QgaXRlbSBvbiB0aGUgcm93LCBzbyBqdXN0IHB1c2ggaXRcbiAgICAgICAgcm93cy5wdXNoKCR0aGF0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGlmIHRoZSByb3cgdG9wIGlzIHRoZSBzYW1lLCBhZGQgdG8gdGhlIHJvdyBncm91cFxuICAgICAgICBpZiAoTWF0aC5mbG9vcihNYXRoLmFicyhsYXN0VG9wIC0gdG9wKSkgPD0gdG9sZXJhbmNlKSB7XG4gICAgICAgICAgcm93c1tyb3dzLmxlbmd0aCAtIDFdID0gbGFzdFJvdy5hZGQoJHRoYXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG90aGVyd2lzZSBzdGFydCBhIG5ldyByb3cgZ3JvdXBcbiAgICAgICAgICByb3dzLnB1c2goJHRoYXQpO1xuICAgICAgICB9XG4gICAgICB9IC8vIGtlZXAgdHJhY2sgb2YgdGhlIGxhc3Qgcm93IHRvcFxuXG5cbiAgICAgIGxhc3RUb3AgPSB0b3A7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJvd3M7XG4gIH07XG4gIC8qXG4gICogIF9wYXJzZU9wdGlvbnNcbiAgKiAgaGFuZGxlIHBsdWdpbiBvcHRpb25zXG4gICovXG5cblxuICB2YXIgX3BhcnNlT3B0aW9ucyA9IGZ1bmN0aW9uIF9wYXJzZU9wdGlvbnMob3B0aW9ucykge1xuICAgIHZhciBvcHRzID0ge1xuICAgICAgYnlSb3c6IHRydWUsXG4gICAgICBwcm9wZXJ0eTogJ2hlaWdodCcsXG4gICAgICB0YXJnZXQ6IG51bGwsXG4gICAgICByZW1vdmU6IGZhbHNlXG4gICAgfTtcblxuICAgIGlmIChfdHlwZW9mKG9wdGlvbnMpID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuICQuZXh0ZW5kKG9wdHMsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBvcHRzLmJ5Um93ID0gb3B0aW9ucztcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMgPT09ICdyZW1vdmUnKSB7XG4gICAgICBvcHRzLnJlbW92ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9wdHM7XG4gIH07XG4gIC8qXG4gICogIG1hdGNoSGVpZ2h0XG4gICogIHBsdWdpbiBkZWZpbml0aW9uXG4gICovXG5cblxuICB2YXIgbWF0Y2hIZWlnaHQgPSAkLmZuLm1hdGNoSGVpZ2h0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0cyA9IF9wYXJzZU9wdGlvbnMob3B0aW9ucyk7IC8vIGhhbmRsZSByZW1vdmVcblxuXG4gICAgaWYgKG9wdHMucmVtb3ZlKSB7XG4gICAgICB2YXIgdGhhdCA9IHRoaXM7IC8vIHJlbW92ZSBmaXhlZCBoZWlnaHQgZnJvbSBhbGwgc2VsZWN0ZWQgZWxlbWVudHNcblxuICAgICAgdGhpcy5jc3Mob3B0cy5wcm9wZXJ0eSwgJycpOyAvLyByZW1vdmUgc2VsZWN0ZWQgZWxlbWVudHMgZnJvbSBhbGwgZ3JvdXBzXG5cbiAgICAgICQuZWFjaChtYXRjaEhlaWdodC5fZ3JvdXBzLCBmdW5jdGlvbiAoa2V5LCBncm91cCkge1xuICAgICAgICBncm91cC5lbGVtZW50cyA9IGdyb3VwLmVsZW1lbnRzLm5vdCh0aGF0KTtcbiAgICAgIH0pOyAvLyBUT0RPOiBjbGVhbnVwIGVtcHR5IGdyb3Vwc1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5sZW5ndGggPD0gMSAmJiAhb3B0cy50YXJnZXQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gLy8ga2VlcCB0cmFjayBvZiB0aGlzIGdyb3VwIHNvIHdlIGNhbiByZS1hcHBseSBsYXRlciBvbiBsb2FkIGFuZCByZXNpemUgZXZlbnRzXG5cblxuICAgIG1hdGNoSGVpZ2h0Ll9ncm91cHMucHVzaCh7XG4gICAgICBlbGVtZW50czogdGhpcyxcbiAgICAgIG9wdGlvbnM6IG9wdHNcbiAgICB9KTsgLy8gbWF0Y2ggZWFjaCBlbGVtZW50J3MgaGVpZ2h0IHRvIHRoZSB0YWxsZXN0IGVsZW1lbnQgaW4gdGhlIHNlbGVjdGlvblxuXG5cbiAgICBtYXRjaEhlaWdodC5fYXBwbHkodGhpcywgb3B0cyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgLypcbiAgKiAgcGx1Z2luIGdsb2JhbCBvcHRpb25zXG4gICovXG5cblxuICBtYXRjaEhlaWdodC52ZXJzaW9uID0gJzAuNy4yJztcbiAgbWF0Y2hIZWlnaHQuX2dyb3VwcyA9IFtdO1xuICBtYXRjaEhlaWdodC5fdGhyb3R0bGUgPSA4MDtcbiAgbWF0Y2hIZWlnaHQuX21haW50YWluU2Nyb2xsID0gZmFsc2U7XG4gIG1hdGNoSGVpZ2h0Ll9iZWZvcmVVcGRhdGUgPSBudWxsO1xuICBtYXRjaEhlaWdodC5fYWZ0ZXJVcGRhdGUgPSBudWxsO1xuICBtYXRjaEhlaWdodC5fcm93cyA9IF9yb3dzO1xuICBtYXRjaEhlaWdodC5fcGFyc2UgPSBfcGFyc2U7XG4gIG1hdGNoSGVpZ2h0Ll9wYXJzZU9wdGlvbnMgPSBfcGFyc2VPcHRpb25zO1xuICAvKlxuICAqICBtYXRjaEhlaWdodC5fYXBwbHlcbiAgKiAgYXBwbHkgbWF0Y2hIZWlnaHQgdG8gZ2l2ZW4gZWxlbWVudHNcbiAgKi9cblxuICBtYXRjaEhlaWdodC5fYXBwbHkgPSBmdW5jdGlvbiAoZWxlbWVudHMsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0cyA9IF9wYXJzZU9wdGlvbnMob3B0aW9ucyksXG4gICAgICAgICRlbGVtZW50cyA9ICQoZWxlbWVudHMpLFxuICAgICAgICByb3dzID0gWyRlbGVtZW50c107IC8vIHRha2Ugbm90ZSBvZiBzY3JvbGwgcG9zaXRpb25cblxuXG4gICAgdmFyIHNjcm9sbFRvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKSxcbiAgICAgICAgaHRtbEhlaWdodCA9ICQoJ2h0bWwnKS5vdXRlckhlaWdodCh0cnVlKTsgLy8gZ2V0IGhpZGRlbiBwYXJlbnRzXG5cbiAgICB2YXIgJGhpZGRlblBhcmVudHMgPSAkZWxlbWVudHMucGFyZW50cygpLmZpbHRlcignOmhpZGRlbicpOyAvLyBjYWNoZSB0aGUgb3JpZ2luYWwgaW5saW5lIHN0eWxlXG5cbiAgICAkaGlkZGVuUGFyZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhhdCA9ICQodGhpcyk7XG4gICAgICAkdGhhdC5kYXRhKCdzdHlsZS1jYWNoZScsICR0aGF0LmF0dHIoJ3N0eWxlJykpO1xuICAgIH0pOyAvLyB0ZW1wb3JhcmlseSBtdXN0IGZvcmNlIGhpZGRlbiBwYXJlbnRzIHZpc2libGVcblxuICAgICRoaWRkZW5QYXJlbnRzLmNzcygnZGlzcGxheScsICdibG9jaycpOyAvLyBnZXQgcm93cyBpZiB1c2luZyBieVJvdywgb3RoZXJ3aXNlIGFzc3VtZSBvbmUgcm93XG5cbiAgICBpZiAob3B0cy5ieVJvdyAmJiAhb3B0cy50YXJnZXQpIHtcbiAgICAgIC8vIG11c3QgZmlyc3QgZm9yY2UgYW4gYXJiaXRyYXJ5IGVxdWFsIGhlaWdodCBzbyBmbG9hdGluZyBlbGVtZW50cyBicmVhayBldmVubHlcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICR0aGF0ID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGRpc3BsYXkgPSAkdGhhdC5jc3MoJ2Rpc3BsYXknKTsgLy8gdGVtcG9yYXJpbHkgZm9yY2UgYSB1c2FibGUgZGlzcGxheSB2YWx1ZVxuXG4gICAgICAgIGlmIChkaXNwbGF5ICE9PSAnaW5saW5lLWJsb2NrJyAmJiBkaXNwbGF5ICE9PSAnZmxleCcgJiYgZGlzcGxheSAhPT0gJ2lubGluZS1mbGV4Jykge1xuICAgICAgICAgIGRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9IC8vIGNhY2hlIHRoZSBvcmlnaW5hbCBpbmxpbmUgc3R5bGVcblxuXG4gICAgICAgICR0aGF0LmRhdGEoJ3N0eWxlLWNhY2hlJywgJHRoYXQuYXR0cignc3R5bGUnKSk7XG4gICAgICAgICR0aGF0LmNzcyh7XG4gICAgICAgICAgJ2Rpc3BsYXknOiBkaXNwbGF5LFxuICAgICAgICAgICdwYWRkaW5nLXRvcCc6ICcwJyxcbiAgICAgICAgICAncGFkZGluZy1ib3R0b20nOiAnMCcsXG4gICAgICAgICAgJ21hcmdpbi10b3AnOiAnMCcsXG4gICAgICAgICAgJ21hcmdpbi1ib3R0b20nOiAnMCcsXG4gICAgICAgICAgJ2JvcmRlci10b3Atd2lkdGgnOiAnMCcsXG4gICAgICAgICAgJ2JvcmRlci1ib3R0b20td2lkdGgnOiAnMCcsXG4gICAgICAgICAgJ2hlaWdodCc6ICcxMDBweCcsXG4gICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbidcbiAgICAgICAgfSk7XG4gICAgICB9KTsgLy8gZ2V0IHRoZSBhcnJheSBvZiByb3dzIChiYXNlZCBvbiBlbGVtZW50IHRvcCBwb3NpdGlvbilcblxuICAgICAgcm93cyA9IF9yb3dzKCRlbGVtZW50cyk7IC8vIHJldmVydCBvcmlnaW5hbCBpbmxpbmUgc3R5bGVzXG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICR0aGF0ID0gJCh0aGlzKTtcbiAgICAgICAgJHRoYXQuYXR0cignc3R5bGUnLCAkdGhhdC5kYXRhKCdzdHlsZS1jYWNoZScpIHx8ICcnKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgICQuZWFjaChyb3dzLCBmdW5jdGlvbiAoa2V5LCByb3cpIHtcbiAgICAgIHZhciAkcm93ID0gJChyb3cpLFxuICAgICAgICAgIHRhcmdldEhlaWdodCA9IDA7XG5cbiAgICAgIGlmICghb3B0cy50YXJnZXQpIHtcbiAgICAgICAgLy8gc2tpcCBhcHBseSB0byByb3dzIHdpdGggb25seSBvbmUgaXRlbVxuICAgICAgICBpZiAob3B0cy5ieVJvdyAmJiAkcm93Lmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgJHJvdy5jc3Mob3B0cy5wcm9wZXJ0eSwgJycpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSAvLyBpdGVyYXRlIHRoZSByb3cgYW5kIGZpbmQgdGhlIG1heCBoZWlnaHRcblxuXG4gICAgICAgICRyb3cuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyICR0aGF0ID0gJCh0aGlzKSxcbiAgICAgICAgICAgICAgc3R5bGUgPSAkdGhhdC5hdHRyKCdzdHlsZScpLFxuICAgICAgICAgICAgICBkaXNwbGF5ID0gJHRoYXQuY3NzKCdkaXNwbGF5Jyk7IC8vIHRlbXBvcmFyaWx5IGZvcmNlIGEgdXNhYmxlIGRpc3BsYXkgdmFsdWVcblxuICAgICAgICAgIGlmIChkaXNwbGF5ICE9PSAnaW5saW5lLWJsb2NrJyAmJiBkaXNwbGF5ICE9PSAnZmxleCcgJiYgZGlzcGxheSAhPT0gJ2lubGluZS1mbGV4Jykge1xuICAgICAgICAgICAgZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgfSAvLyBlbnN1cmUgd2UgZ2V0IHRoZSBjb3JyZWN0IGFjdHVhbCBoZWlnaHQgKGFuZCBub3QgYSBwcmV2aW91c2x5IHNldCBoZWlnaHQgdmFsdWUpXG5cblxuICAgICAgICAgIHZhciBjc3MgPSB7XG4gICAgICAgICAgICAnZGlzcGxheSc6IGRpc3BsYXlcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNzc1tvcHRzLnByb3BlcnR5XSA9ICcnO1xuICAgICAgICAgICR0aGF0LmNzcyhjc3MpOyAvLyBmaW5kIHRoZSBtYXggaGVpZ2h0IChpbmNsdWRpbmcgcGFkZGluZywgYnV0IG5vdCBtYXJnaW4pXG5cbiAgICAgICAgICBpZiAoJHRoYXQub3V0ZXJIZWlnaHQoZmFsc2UpID4gdGFyZ2V0SGVpZ2h0KSB7XG4gICAgICAgICAgICB0YXJnZXRIZWlnaHQgPSAkdGhhdC5vdXRlckhlaWdodChmYWxzZSk7XG4gICAgICAgICAgfSAvLyByZXZlcnQgc3R5bGVzXG5cblxuICAgICAgICAgIGlmIChzdHlsZSkge1xuICAgICAgICAgICAgJHRoYXQuYXR0cignc3R5bGUnLCBzdHlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aGF0LmNzcygnZGlzcGxheScsICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaWYgdGFyZ2V0IHNldCwgdXNlIHRoZSBoZWlnaHQgb2YgdGhlIHRhcmdldCBlbGVtZW50XG4gICAgICAgIHRhcmdldEhlaWdodCA9IG9wdHMudGFyZ2V0Lm91dGVySGVpZ2h0KGZhbHNlKTtcbiAgICAgIH0gLy8gaXRlcmF0ZSB0aGUgcm93IGFuZCBhcHBseSB0aGUgaGVpZ2h0IHRvIGFsbCBlbGVtZW50c1xuXG5cbiAgICAgICRyb3cuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkdGhhdCA9ICQodGhpcyksXG4gICAgICAgICAgICB2ZXJ0aWNhbFBhZGRpbmcgPSAwOyAvLyBkb24ndCBhcHBseSB0byBhIHRhcmdldFxuXG4gICAgICAgIGlmIChvcHRzLnRhcmdldCAmJiAkdGhhdC5pcyhvcHRzLnRhcmdldCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gLy8gaGFuZGxlIHBhZGRpbmcgYW5kIGJvcmRlciBjb3JyZWN0bHkgKHJlcXVpcmVkIHdoZW4gbm90IHVzaW5nIGJvcmRlci1ib3gpXG5cblxuICAgICAgICBpZiAoJHRoYXQuY3NzKCdib3gtc2l6aW5nJykgIT09ICdib3JkZXItYm94Jykge1xuICAgICAgICAgIHZlcnRpY2FsUGFkZGluZyArPSBfcGFyc2UoJHRoYXQuY3NzKCdib3JkZXItdG9wLXdpZHRoJykpICsgX3BhcnNlKCR0aGF0LmNzcygnYm9yZGVyLWJvdHRvbS13aWR0aCcpKTtcbiAgICAgICAgICB2ZXJ0aWNhbFBhZGRpbmcgKz0gX3BhcnNlKCR0aGF0LmNzcygncGFkZGluZy10b3AnKSkgKyBfcGFyc2UoJHRoYXQuY3NzKCdwYWRkaW5nLWJvdHRvbScpKTtcbiAgICAgICAgfSAvLyBzZXQgdGhlIGhlaWdodCAoYWNjb3VudGluZyBmb3IgcGFkZGluZyBhbmQgYm9yZGVyKVxuXG5cbiAgICAgICAgJHRoYXQuY3NzKG9wdHMucHJvcGVydHksIHRhcmdldEhlaWdodCAtIHZlcnRpY2FsUGFkZGluZyArICdweCcpO1xuICAgICAgfSk7XG4gICAgfSk7IC8vIHJldmVydCBoaWRkZW4gcGFyZW50c1xuXG4gICAgJGhpZGRlblBhcmVudHMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoYXQgPSAkKHRoaXMpO1xuICAgICAgJHRoYXQuYXR0cignc3R5bGUnLCAkdGhhdC5kYXRhKCdzdHlsZS1jYWNoZScpIHx8IG51bGwpO1xuICAgIH0pOyAvLyByZXN0b3JlIHNjcm9sbCBwb3NpdGlvbiBpZiBlbmFibGVkXG5cbiAgICBpZiAobWF0Y2hIZWlnaHQuX21haW50YWluU2Nyb2xsKSB7XG4gICAgICAkKHdpbmRvdykuc2Nyb2xsVG9wKHNjcm9sbFRvcCAvIGh0bWxIZWlnaHQgKiAkKCdodG1sJykub3V0ZXJIZWlnaHQodHJ1ZSkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICAvKlxuICAqICBtYXRjaEhlaWdodC5fYXBwbHlEYXRhQXBpXG4gICogIGFwcGxpZXMgbWF0Y2hIZWlnaHQgdG8gYWxsIGVsZW1lbnRzIHdpdGggYSBkYXRhLW1hdGNoLWhlaWdodCBhdHRyaWJ1dGVcbiAgKi9cblxuXG4gIG1hdGNoSGVpZ2h0Ll9hcHBseURhdGFBcGkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdyb3VwcyA9IHt9OyAvLyBnZW5lcmF0ZSBncm91cHMgYnkgdGhlaXIgZ3JvdXBJZCBzZXQgYnkgZWxlbWVudHMgdXNpbmcgZGF0YS1tYXRjaC1oZWlnaHRcblxuICAgICQoJ1tkYXRhLW1hdGNoLWhlaWdodF0sIFtkYXRhLW1oXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICBncm91cElkID0gJHRoaXMuYXR0cignZGF0YS1taCcpIHx8ICR0aGlzLmF0dHIoJ2RhdGEtbWF0Y2gtaGVpZ2h0Jyk7XG5cbiAgICAgIGlmIChncm91cElkIGluIGdyb3Vwcykge1xuICAgICAgICBncm91cHNbZ3JvdXBJZF0gPSBncm91cHNbZ3JvdXBJZF0uYWRkKCR0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdyb3Vwc1tncm91cElkXSA9ICR0aGlzO1xuICAgICAgfVxuICAgIH0pOyAvLyBhcHBseSBtYXRjaEhlaWdodCB0byBlYWNoIGdyb3VwXG5cbiAgICAkLmVhY2goZ3JvdXBzLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm1hdGNoSGVpZ2h0KHRydWUpO1xuICAgIH0pO1xuICB9O1xuICAvKlxuICAqICBtYXRjaEhlaWdodC5fdXBkYXRlXG4gICogIHVwZGF0ZXMgbWF0Y2hIZWlnaHQgb24gYWxsIGN1cnJlbnQgZ3JvdXBzIHdpdGggdGhlaXIgY29ycmVjdCBvcHRpb25zXG4gICovXG5cblxuICB2YXIgX3VwZGF0ZSA9IGZ1bmN0aW9uIF91cGRhdGUoZXZlbnQpIHtcbiAgICBpZiAobWF0Y2hIZWlnaHQuX2JlZm9yZVVwZGF0ZSkge1xuICAgICAgbWF0Y2hIZWlnaHQuX2JlZm9yZVVwZGF0ZShldmVudCwgbWF0Y2hIZWlnaHQuX2dyb3Vwcyk7XG4gICAgfVxuXG4gICAgJC5lYWNoKG1hdGNoSGVpZ2h0Ll9ncm91cHMsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG1hdGNoSGVpZ2h0Ll9hcHBseSh0aGlzLmVsZW1lbnRzLCB0aGlzLm9wdGlvbnMpO1xuICAgIH0pO1xuXG4gICAgaWYgKG1hdGNoSGVpZ2h0Ll9hZnRlclVwZGF0ZSkge1xuICAgICAgbWF0Y2hIZWlnaHQuX2FmdGVyVXBkYXRlKGV2ZW50LCBtYXRjaEhlaWdodC5fZ3JvdXBzKTtcbiAgICB9XG4gIH07XG5cbiAgbWF0Y2hIZWlnaHQuX3VwZGF0ZSA9IGZ1bmN0aW9uICh0aHJvdHRsZSwgZXZlbnQpIHtcbiAgICAvLyBwcmV2ZW50IHVwZGF0ZSBpZiBmaXJlZCBmcm9tIGEgcmVzaXplIGV2ZW50XG4gICAgLy8gd2hlcmUgdGhlIHZpZXdwb3J0IHdpZHRoIGhhc24ndCBhY3R1YWxseSBjaGFuZ2VkXG4gICAgLy8gZml4ZXMgYW4gZXZlbnQgbG9vcGluZyBidWcgaW4gSUU4XG4gICAgaWYgKGV2ZW50ICYmIGV2ZW50LnR5cGUgPT09ICdyZXNpemUnKSB7XG4gICAgICB2YXIgd2luZG93V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKTtcblxuICAgICAgaWYgKHdpbmRvd1dpZHRoID09PSBfcHJldmlvdXNSZXNpemVXaWR0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIF9wcmV2aW91c1Jlc2l6ZVdpZHRoID0gd2luZG93V2lkdGg7XG4gICAgfSAvLyB0aHJvdHRsZSB1cGRhdGVzXG5cblxuICAgIGlmICghdGhyb3R0bGUpIHtcbiAgICAgIF91cGRhdGUoZXZlbnQpO1xuICAgIH0gZWxzZSBpZiAoX3VwZGF0ZVRpbWVvdXQgPT09IC0xKSB7XG4gICAgICBfdXBkYXRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBfdXBkYXRlKGV2ZW50KTtcblxuICAgICAgICBfdXBkYXRlVGltZW91dCA9IC0xO1xuICAgICAgfSwgbWF0Y2hIZWlnaHQuX3Rocm90dGxlKTtcbiAgICB9XG4gIH07XG4gIC8qXG4gICogIGJpbmQgZXZlbnRzXG4gICovXG4gIC8vIGFwcGx5IG9uIERPTSByZWFkeSBldmVudFxuXG5cbiAgJChtYXRjaEhlaWdodC5fYXBwbHlEYXRhQXBpKTsgLy8gdXNlIG9uIG9yIGJpbmQgd2hlcmUgc3VwcG9ydGVkXG5cbiAgdmFyIG9uID0gJC5mbi5vbiA/ICdvbicgOiAnYmluZCc7IC8vIHVwZGF0ZSBoZWlnaHRzIG9uIGxvYWQgYW5kIHJlc2l6ZSBldmVudHNcblxuICAkKHdpbmRvdylbb25dKCdsb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgbWF0Y2hIZWlnaHQuX3VwZGF0ZShmYWxzZSwgZXZlbnQpO1xuICB9KTsgLy8gdGhyb3R0bGVkIHVwZGF0ZSBoZWlnaHRzIG9uIHJlc2l6ZSBldmVudHNcblxuICAkKHdpbmRvdylbb25dKCdyZXNpemUgb3JpZW50YXRpb25jaGFuZ2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBtYXRjaEhlaWdodC5fdXBkYXRlKHRydWUsIGV2ZW50KTtcbiAgfSk7XG59KTsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyohIG1hdGNoTWVkaWEoKSBwb2x5ZmlsbCAtIFRlc3QgYSBDU1MgbWVkaWEgdHlwZS9xdWVyeSBpbiBKUy4gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2UgKi9cbndpbmRvdy5tYXRjaE1lZGlhIHx8ICh3aW5kb3cubWF0Y2hNZWRpYSA9IGZ1bmN0aW9uICgpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7IC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XG5cbiAgdmFyIHN0eWxlTWVkaWEgPSB3aW5kb3cuc3R5bGVNZWRpYSB8fCB3aW5kb3cubWVkaWE7IC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cblxuICBpZiAoIXN0eWxlTWVkaWEpIHtcbiAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxuICAgICAgICBzY3JpcHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgICAgIGluZm8gPSBudWxsO1xuICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIHN0eWxlLmlkID0gJ21hdGNobWVkaWFqcy10ZXN0JztcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7IC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG5cbiAgICBpbmZvID0gJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdyAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuICAgIHN0eWxlTWVkaWEgPSB7XG4gICAgICBtYXRjaE1lZGl1bTogZnVuY3Rpb24gbWF0Y2hNZWRpdW0obWVkaWEpIHtcbiAgICAgICAgdmFyIHRleHQgPSAnQG1lZGlhICcgKyBtZWRpYSArICd7ICNtYXRjaG1lZGlhanMtdGVzdCB7IHdpZHRoOiAxcHg7IH0gfSc7IC8vICdzdHlsZS5zdHlsZVNoZWV0JyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICdzdHlsZS50ZXh0Q29udGVudCcgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIH0gLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXG5cblxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAobWVkaWEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlczogc3R5bGVNZWRpYS5tYXRjaE1lZGl1bShtZWRpYSB8fCAnYWxsJyksXG4gICAgICBtZWRpYTogbWVkaWEgfHwgJ2FsbCdcbiAgICB9O1xuICB9O1xufSgpKTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4vKiFcbiAqIEZsaWNraXR5IFBBQ0tBR0VEIHYyLjIuMVxuICogVG91Y2gsIHJlc3BvbnNpdmUsIGZsaWNrYWJsZSBjYXJvdXNlbHNcbiAqXG4gKiBMaWNlbnNlZCBHUEx2MyBmb3Igb3BlbiBzb3VyY2UgdXNlXG4gKiBvciBGbGlja2l0eSBDb21tZXJjaWFsIExpY2Vuc2UgZm9yIGNvbW1lcmNpYWwgdXNlXG4gKlxuICogaHR0cHM6Ly9mbGlja2l0eS5tZXRhZml6enkuY29cbiAqIENvcHlyaWdodCAyMDE1LTIwMTkgTWV0YWZpenp5XG4gKi9cblxuLyoqXG4gKiBCcmlkZ2V0IG1ha2VzIGpRdWVyeSB3aWRnZXRzXG4gKiB2Mi4wLjFcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLyoganNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLypqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdqcXVlcnktYnJpZGdldC9qcXVlcnktYnJpZGdldCcsIFsnanF1ZXJ5J10sIGZ1bmN0aW9uIChqUXVlcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgalF1ZXJ5KTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCdqcXVlcnknKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cualF1ZXJ5QnJpZGdldCA9IGZhY3Rvcnkod2luZG93LCB3aW5kb3cualF1ZXJ5KTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KHdpbmRvdywgalF1ZXJ5KSB7XG4gICd1c2Ugc3RyaWN0JzsgLy8gLS0tLS0gdXRpbHMgLS0tLS0gLy9cblxuICB2YXIgYXJyYXlTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTsgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBsb2dnaW5nIGVycm9yc1xuICAvLyAkLmVycm9yIGJyZWFrcyBqUXVlcnkgY2hhaW5pbmdcblxuICB2YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuICB2YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IGZ1bmN0aW9uICgpIHt9IDogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICB9OyAvLyAtLS0tLSBqUXVlcnlCcmlkZ2V0IC0tLS0tIC8vXG5cbiAgZnVuY3Rpb24galF1ZXJ5QnJpZGdldChuYW1lc3BhY2UsIFBsdWdpbkNsYXNzLCAkKSB7XG4gICAgJCA9ICQgfHwgalF1ZXJ5IHx8IHdpbmRvdy5qUXVlcnk7XG5cbiAgICBpZiAoISQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGFkZCBvcHRpb24gbWV0aG9kIC0+ICQoKS5wbHVnaW4oJ29wdGlvbicsIHsuLi59KVxuXG5cbiAgICBpZiAoIVBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24pIHtcbiAgICAgIC8vIG9wdGlvbiBzZXR0ZXJcbiAgICAgIFBsdWdpbkNsYXNzLnByb3RvdHlwZS5vcHRpb24gPSBmdW5jdGlvbiAob3B0cykge1xuICAgICAgICAvLyBiYWlsIG91dCBpZiBub3QgYW4gb2JqZWN0XG4gICAgICAgIGlmICghJC5pc1BsYWluT2JqZWN0KG9wdHMpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgdGhpcy5vcHRpb25zLCBvcHRzKTtcbiAgICAgIH07XG4gICAgfSAvLyBtYWtlIGpRdWVyeSBwbHVnaW5cblxuXG4gICAgJC5mbltuYW1lc3BhY2VdID0gZnVuY3Rpb24gKGFyZzBcbiAgICAvKiwgYXJnMSAqL1xuICAgICkge1xuICAgICAgaWYgKHR5cGVvZiBhcmcwID09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIG1ldGhvZCBjYWxsICQoKS5wbHVnaW4oICdtZXRob2ROYW1lJywgeyBvcHRpb25zIH0gKVxuICAgICAgICAvLyBzaGlmdCBhcmd1bWVudHMgYnkgMVxuICAgICAgICB2YXIgYXJncyA9IGFycmF5U2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gbWV0aG9kQ2FsbCh0aGlzLCBhcmcwLCBhcmdzKTtcbiAgICAgIH0gLy8ganVzdCAkKCkucGx1Z2luKHsgb3B0aW9ucyB9KVxuXG5cbiAgICAgIHBsYWluQ2FsbCh0aGlzLCBhcmcwKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07IC8vICQoKS5wbHVnaW4oJ21ldGhvZE5hbWUnKVxuXG5cbiAgICBmdW5jdGlvbiBtZXRob2RDYWxsKCRlbGVtcywgbWV0aG9kTmFtZSwgYXJncykge1xuICAgICAgdmFyIHJldHVyblZhbHVlO1xuICAgICAgdmFyIHBsdWdpbk1ldGhvZFN0ciA9ICckKCkuJyArIG5hbWVzcGFjZSArICcoXCInICsgbWV0aG9kTmFtZSArICdcIiknO1xuICAgICAgJGVsZW1zLmVhY2goZnVuY3Rpb24gKGksIGVsZW0pIHtcbiAgICAgICAgLy8gZ2V0IGluc3RhbmNlXG4gICAgICAgIHZhciBpbnN0YW5jZSA9ICQuZGF0YShlbGVtLCBuYW1lc3BhY2UpO1xuXG4gICAgICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgICBsb2dFcnJvcihuYW1lc3BhY2UgKyAnIG5vdCBpbml0aWFsaXplZC4gQ2Fubm90IGNhbGwgbWV0aG9kcywgaS5lLiAnICsgcGx1Z2luTWV0aG9kU3RyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWV0aG9kID0gaW5zdGFuY2VbbWV0aG9kTmFtZV07XG5cbiAgICAgICAgaWYgKCFtZXRob2QgfHwgbWV0aG9kTmFtZS5jaGFyQXQoMCkgPT0gJ18nKSB7XG4gICAgICAgICAgbG9nRXJyb3IocGx1Z2luTWV0aG9kU3RyICsgJyBpcyBub3QgYSB2YWxpZCBtZXRob2QnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gLy8gYXBwbHkgbWV0aG9kLCBnZXQgcmV0dXJuIHZhbHVlXG5cblxuICAgICAgICB2YXIgdmFsdWUgPSBtZXRob2QuYXBwbHkoaW5zdGFuY2UsIGFyZ3MpOyAvLyBzZXQgcmV0dXJuIHZhbHVlIGlmIHZhbHVlIGlzIHJldHVybmVkLCB1c2Ugb25seSBmaXJzdCB2YWx1ZVxuXG4gICAgICAgIHJldHVyblZhbHVlID0gcmV0dXJuVmFsdWUgPT09IHVuZGVmaW5lZCA/IHZhbHVlIDogcmV0dXJuVmFsdWU7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZSAhPT0gdW5kZWZpbmVkID8gcmV0dXJuVmFsdWUgOiAkZWxlbXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGxhaW5DYWxsKCRlbGVtcywgb3B0aW9ucykge1xuICAgICAgJGVsZW1zLmVhY2goZnVuY3Rpb24gKGksIGVsZW0pIHtcbiAgICAgICAgdmFyIGluc3RhbmNlID0gJC5kYXRhKGVsZW0sIG5hbWVzcGFjZSk7XG5cbiAgICAgICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgICAgLy8gc2V0IG9wdGlvbnMgJiBpbml0XG4gICAgICAgICAgaW5zdGFuY2Uub3B0aW9uKG9wdGlvbnMpO1xuXG4gICAgICAgICAgaW5zdGFuY2UuX2luaXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpbml0aWFsaXplIG5ldyBpbnN0YW5jZVxuICAgICAgICAgIGluc3RhbmNlID0gbmV3IFBsdWdpbkNsYXNzKGVsZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICQuZGF0YShlbGVtLCBuYW1lc3BhY2UsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlSlF1ZXJ5KCQpO1xuICB9IC8vIC0tLS0tIHVwZGF0ZUpRdWVyeSAtLS0tLSAvL1xuICAvLyBzZXQgJC5icmlkZ2V0IGZvciB2MSBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuXG5cbiAgZnVuY3Rpb24gdXBkYXRlSlF1ZXJ5KCQpIHtcbiAgICBpZiAoISQgfHwgJCAmJiAkLmJyaWRnZXQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkLmJyaWRnZXQgPSBqUXVlcnlCcmlkZ2V0O1xuICB9XG5cbiAgdXBkYXRlSlF1ZXJ5KGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5KTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cbiAgcmV0dXJuIGpRdWVyeUJyaWRnZXQ7XG59KTtcbi8qKlxuICogRXZFbWl0dGVyIHYxLjEuMFxuICogTGlsJyBldmVudCBlbWl0dGVyXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbi8qIGpzaGludCB1bnVzZWQ6IHRydWUsIHVuZGVmOiB0cnVlLCBzdHJpY3Q6IHRydWUgKi9cblxuXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHdpbmRvdyAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoJ2V2LWVtaXR0ZXIvZXYtZW1pdHRlcicsIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICBnbG9iYWwuRXZFbWl0dGVyID0gZmFjdG9yeSgpO1xuICB9XG59KSh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIEV2RW1pdHRlcigpIHt9XG5cbiAgdmFyIHByb3RvID0gRXZFbWl0dGVyLnByb3RvdHlwZTtcblxuICBwcm90by5vbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKCFldmVudE5hbWUgfHwgIWxpc3RlbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBzZXQgZXZlbnRzIGhhc2hcblxuXG4gICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTsgLy8gc2V0IGxpc3RlbmVycyBhcnJheVxuXG4gICAgdmFyIGxpc3RlbmVycyA9IGV2ZW50c1tldmVudE5hbWVdID0gZXZlbnRzW2V2ZW50TmFtZV0gfHwgW107IC8vIG9ubHkgYWRkIG9uY2VcblxuICAgIGlmIChsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcikgPT0gLTEpIHtcbiAgICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBwcm90by5vbmNlID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAoIWV2ZW50TmFtZSB8fCAhbGlzdGVuZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGFkZCBldmVudFxuXG5cbiAgICB0aGlzLm9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpOyAvLyBzZXQgb25jZSBmbGFnXG4gICAgLy8gc2V0IG9uY2VFdmVudHMgaGFzaFxuXG4gICAgdmFyIG9uY2VFdmVudHMgPSB0aGlzLl9vbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyB8fCB7fTsgLy8gc2V0IG9uY2VMaXN0ZW5lcnMgb2JqZWN0XG5cbiAgICB2YXIgb25jZUxpc3RlbmVycyA9IG9uY2VFdmVudHNbZXZlbnROYW1lXSA9IG9uY2VFdmVudHNbZXZlbnROYW1lXSB8fCB7fTsgLy8gc2V0IGZsYWdcblxuICAgIG9uY2VMaXN0ZW5lcnNbbGlzdGVuZXJdID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBwcm90by5vZmYgPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2ZW50TmFtZV07XG5cbiAgICBpZiAoIWxpc3RlbmVycyB8fCAhbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IGxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcblxuICAgIGlmIChpbmRleCAhPSAtMSkge1xuICAgICAgbGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgYXJncykge1xuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2ZW50TmFtZV07XG5cbiAgICBpZiAoIWxpc3RlbmVycyB8fCAhbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gY29weSBvdmVyIHRvIGF2b2lkIGludGVyZmVyZW5jZSBpZiAub2ZmKCkgaW4gbGlzdGVuZXJcblxuXG4gICAgbGlzdGVuZXJzID0gbGlzdGVuZXJzLnNsaWNlKDApO1xuICAgIGFyZ3MgPSBhcmdzIHx8IFtdOyAvLyBvbmNlIHN0dWZmXG5cbiAgICB2YXIgb25jZUxpc3RlbmVycyA9IHRoaXMuX29uY2VFdmVudHMgJiYgdGhpcy5fb25jZUV2ZW50c1tldmVudE5hbWVdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXTtcbiAgICAgIHZhciBpc09uY2UgPSBvbmNlTGlzdGVuZXJzICYmIG9uY2VMaXN0ZW5lcnNbbGlzdGVuZXJdO1xuXG4gICAgICBpZiAoaXNPbmNlKSB7XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxuICAgICAgICAvLyByZW1vdmUgYmVmb3JlIHRyaWdnZXIgdG8gcHJldmVudCByZWN1cnNpb25cbiAgICAgICAgdGhpcy5vZmYoZXZlbnROYW1lLCBsaXN0ZW5lcik7IC8vIHVuc2V0IG9uY2UgZmxhZ1xuXG4gICAgICAgIGRlbGV0ZSBvbmNlTGlzdGVuZXJzW2xpc3RlbmVyXTtcbiAgICAgIH0gLy8gdHJpZ2dlciBsaXN0ZW5lclxuXG5cbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHByb3RvLmFsbE9mZiA9IGZ1bmN0aW9uICgpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzO1xuICAgIGRlbGV0ZSB0aGlzLl9vbmNlRXZlbnRzO1xuICB9O1xuXG4gIHJldHVybiBFdkVtaXR0ZXI7XG59KTtcbi8qIVxuICogZ2V0U2l6ZSB2Mi4wLjNcbiAqIG1lYXN1cmUgc2l6ZSBvZiBlbGVtZW50c1xuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG5cbi8qIGdsb2JhbHMgY29uc29sZTogZmFsc2UgKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdnZXQtc2l6ZS9nZXQtc2l6ZScsIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmdldFNpemUgPSBmYWN0b3J5KCk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSgpIHtcbiAgJ3VzZSBzdHJpY3QnOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIGdldCBhIG51bWJlciBmcm9tIGEgc3RyaW5nLCBub3QgYSBwZXJjZW50YWdlXG5cbiAgZnVuY3Rpb24gZ2V0U3R5bGVTaXplKHZhbHVlKSB7XG4gICAgdmFyIG51bSA9IHBhcnNlRmxvYXQodmFsdWUpOyAvLyBub3QgYSBwZXJjZW50IGxpa2UgJzEwMCUnLCBhbmQgYSBudW1iZXJcblxuICAgIHZhciBpc1ZhbGlkID0gdmFsdWUuaW5kZXhPZignJScpID09IC0xICYmICFpc05hTihudW0pO1xuICAgIHJldHVybiBpc1ZhbGlkICYmIG51bTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4gIHZhciBsb2dFcnJvciA9IHR5cGVvZiBjb25zb2xlID09ICd1bmRlZmluZWQnID8gbm9vcCA6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWVhc3VyZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgdmFyIG1lYXN1cmVtZW50cyA9IFsncGFkZGluZ0xlZnQnLCAncGFkZGluZ1JpZ2h0JywgJ3BhZGRpbmdUb3AnLCAncGFkZGluZ0JvdHRvbScsICdtYXJnaW5MZWZ0JywgJ21hcmdpblJpZ2h0JywgJ21hcmdpblRvcCcsICdtYXJnaW5Cb3R0b20nLCAnYm9yZGVyTGVmdFdpZHRoJywgJ2JvcmRlclJpZ2h0V2lkdGgnLCAnYm9yZGVyVG9wV2lkdGgnLCAnYm9yZGVyQm90dG9tV2lkdGgnXTtcbiAgdmFyIG1lYXN1cmVtZW50c0xlbmd0aCA9IG1lYXN1cmVtZW50cy5sZW5ndGg7XG5cbiAgZnVuY3Rpb24gZ2V0WmVyb1NpemUoKSB7XG4gICAgdmFyIHNpemUgPSB7XG4gICAgICB3aWR0aDogMCxcbiAgICAgIGhlaWdodDogMCxcbiAgICAgIGlubmVyV2lkdGg6IDAsXG4gICAgICBpbm5lckhlaWdodDogMCxcbiAgICAgIG91dGVyV2lkdGg6IDAsXG4gICAgICBvdXRlckhlaWdodDogMFxuICAgIH07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbWVhc3VyZW1lbnQgPSBtZWFzdXJlbWVudHNbaV07XG4gICAgICBzaXplW21lYXN1cmVtZW50XSA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpemU7XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZ2V0U3R5bGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogZ2V0U3R5bGUsIGdldCBzdHlsZSBvZiBlbGVtZW50LCBjaGVjayBmb3IgRmlyZWZveCBidWdcbiAgICogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG4gICAqL1xuXG5cbiAgZnVuY3Rpb24gZ2V0U3R5bGUoZWxlbSkge1xuICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cbiAgICBpZiAoIXN0eWxlKSB7XG4gICAgICBsb2dFcnJvcignU3R5bGUgcmV0dXJuZWQgJyArIHN0eWxlICsgJy4gQXJlIHlvdSBydW5uaW5nIHRoaXMgY29kZSBpbiBhIGhpZGRlbiBpZnJhbWUgb24gRmlyZWZveD8gJyArICdTZWUgaHR0cHM6Ly9iaXQubHkvZ2V0c2l6ZWJ1ZzEnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3R5bGU7XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gc2V0dXAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIHZhciBpc1NldHVwID0gZmFsc2U7XG4gIHZhciBpc0JveFNpemVPdXRlcjtcbiAgLyoqXG4gICAqIHNldHVwXG4gICAqIGNoZWNrIGlzQm94U2l6ZXJPdXRlclxuICAgKiBkbyBvbiBmaXJzdCBnZXRTaXplKCkgcmF0aGVyIHRoYW4gb24gcGFnZSBsb2FkIGZvciBGaXJlZm94IGJ1Z1xuICAgKi9cblxuICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAvLyBzZXR1cCBvbmNlXG4gICAgaWYgKGlzU2V0dXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpc1NldHVwID0gdHJ1ZTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYm94IHNpemluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLyoqXG4gICAgICogQ2hyb21lICYgU2FmYXJpIG1lYXN1cmUgdGhlIG91dGVyLXdpZHRoIG9uIHN0eWxlLndpZHRoIG9uIGJvcmRlci1ib3ggZWxlbXNcbiAgICAgKiBJRTExICYgRmlyZWZveDwyOSBtZWFzdXJlcyB0aGUgaW5uZXItd2lkdGhcbiAgICAgKi9cblxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuc3R5bGUud2lkdGggPSAnMjAwcHgnO1xuICAgIGRpdi5zdHlsZS5wYWRkaW5nID0gJzFweCAycHggM3B4IDRweCc7XG4gICAgZGl2LnN0eWxlLmJvcmRlclN0eWxlID0gJ3NvbGlkJztcbiAgICBkaXYuc3R5bGUuYm9yZGVyV2lkdGggPSAnMXB4IDJweCAzcHggNHB4JztcbiAgICBkaXYuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICAgIHZhciBzdHlsZSA9IGdldFN0eWxlKGRpdik7IC8vIHJvdW5kIHZhbHVlIGZvciBicm93c2VyIHpvb20uIGRlc2FuZHJvL21hc29ucnkjOTI4XG5cbiAgICBpc0JveFNpemVPdXRlciA9IE1hdGgucm91bmQoZ2V0U3R5bGVTaXplKHN0eWxlLndpZHRoKSkgPT0gMjAwO1xuICAgIGdldFNpemUuaXNCb3hTaXplT3V0ZXIgPSBpc0JveFNpemVPdXRlcjtcbiAgICBib2R5LnJlbW92ZUNoaWxkKGRpdik7XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZ2V0U2l6ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgZnVuY3Rpb24gZ2V0U2l6ZShlbGVtKSB7XG4gICAgc2V0dXAoKTsgLy8gdXNlIHF1ZXJ5U2VsZXRvciBpZiBlbGVtIGlzIHN0cmluZ1xuXG4gICAgaWYgKHR5cGVvZiBlbGVtID09ICdzdHJpbmcnKSB7XG4gICAgICBlbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtKTtcbiAgICB9IC8vIGRvIG5vdCBwcm9jZWVkIG9uIG5vbi1vYmplY3RzXG5cblxuICAgIGlmICghZWxlbSB8fCBfdHlwZW9mKGVsZW0pICE9ICdvYmplY3QnIHx8ICFlbGVtLm5vZGVUeXBlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlID0gZ2V0U3R5bGUoZWxlbSk7IC8vIGlmIGhpZGRlbiwgZXZlcnl0aGluZyBpcyAwXG5cbiAgICBpZiAoc3R5bGUuZGlzcGxheSA9PSAnbm9uZScpIHtcbiAgICAgIHJldHVybiBnZXRaZXJvU2l6ZSgpO1xuICAgIH1cblxuICAgIHZhciBzaXplID0ge307XG4gICAgc2l6ZS53aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XG4gICAgc2l6ZS5oZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcbiAgICB2YXIgaXNCb3JkZXJCb3ggPSBzaXplLmlzQm9yZGVyQm94ID0gc3R5bGUuYm94U2l6aW5nID09ICdib3JkZXItYm94JzsgLy8gZ2V0IGFsbCBtZWFzdXJlbWVudHNcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVhc3VyZW1lbnRzTGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtZWFzdXJlbWVudCA9IG1lYXN1cmVtZW50c1tpXTtcbiAgICAgIHZhciB2YWx1ZSA9IHN0eWxlW21lYXN1cmVtZW50XTtcbiAgICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KHZhbHVlKTsgLy8gYW55ICdhdXRvJywgJ21lZGl1bScgdmFsdWUgd2lsbCBiZSAwXG5cbiAgICAgIHNpemVbbWVhc3VyZW1lbnRdID0gIWlzTmFOKG51bSkgPyBudW0gOiAwO1xuICAgIH1cblxuICAgIHZhciBwYWRkaW5nV2lkdGggPSBzaXplLnBhZGRpbmdMZWZ0ICsgc2l6ZS5wYWRkaW5nUmlnaHQ7XG4gICAgdmFyIHBhZGRpbmdIZWlnaHQgPSBzaXplLnBhZGRpbmdUb3AgKyBzaXplLnBhZGRpbmdCb3R0b207XG4gICAgdmFyIG1hcmdpbldpZHRoID0gc2l6ZS5tYXJnaW5MZWZ0ICsgc2l6ZS5tYXJnaW5SaWdodDtcbiAgICB2YXIgbWFyZ2luSGVpZ2h0ID0gc2l6ZS5tYXJnaW5Ub3AgKyBzaXplLm1hcmdpbkJvdHRvbTtcbiAgICB2YXIgYm9yZGVyV2lkdGggPSBzaXplLmJvcmRlckxlZnRXaWR0aCArIHNpemUuYm9yZGVyUmlnaHRXaWR0aDtcbiAgICB2YXIgYm9yZGVySGVpZ2h0ID0gc2l6ZS5ib3JkZXJUb3BXaWR0aCArIHNpemUuYm9yZGVyQm90dG9tV2lkdGg7XG4gICAgdmFyIGlzQm9yZGVyQm94U2l6ZU91dGVyID0gaXNCb3JkZXJCb3ggJiYgaXNCb3hTaXplT3V0ZXI7IC8vIG92ZXJ3cml0ZSB3aWR0aCBhbmQgaGVpZ2h0IGlmIHdlIGNhbiBnZXQgaXQgZnJvbSBzdHlsZVxuXG4gICAgdmFyIHN0eWxlV2lkdGggPSBnZXRTdHlsZVNpemUoc3R5bGUud2lkdGgpO1xuXG4gICAgaWYgKHN0eWxlV2lkdGggIT09IGZhbHNlKSB7XG4gICAgICBzaXplLndpZHRoID0gc3R5bGVXaWR0aCArICggLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgaXNCb3JkZXJCb3hTaXplT3V0ZXIgPyAwIDogcGFkZGluZ1dpZHRoICsgYm9yZGVyV2lkdGgpO1xuICAgIH1cblxuICAgIHZhciBzdHlsZUhlaWdodCA9IGdldFN0eWxlU2l6ZShzdHlsZS5oZWlnaHQpO1xuXG4gICAgaWYgKHN0eWxlSGVpZ2h0ICE9PSBmYWxzZSkge1xuICAgICAgc2l6ZS5oZWlnaHQgPSBzdHlsZUhlaWdodCArICggLy8gYWRkIHBhZGRpbmcgYW5kIGJvcmRlciB1bmxlc3MgaXQncyBhbHJlYWR5IGluY2x1ZGluZyBpdFxuICAgICAgaXNCb3JkZXJCb3hTaXplT3V0ZXIgPyAwIDogcGFkZGluZ0hlaWdodCArIGJvcmRlckhlaWdodCk7XG4gICAgfVxuXG4gICAgc2l6ZS5pbm5lcldpZHRoID0gc2l6ZS53aWR0aCAtIChwYWRkaW5nV2lkdGggKyBib3JkZXJXaWR0aCk7XG4gICAgc2l6ZS5pbm5lckhlaWdodCA9IHNpemUuaGVpZ2h0IC0gKHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQpO1xuICAgIHNpemUub3V0ZXJXaWR0aCA9IHNpemUud2lkdGggKyBtYXJnaW5XaWR0aDtcbiAgICBzaXplLm91dGVySGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKyBtYXJnaW5IZWlnaHQ7XG4gICAgcmV0dXJuIHNpemU7XG4gIH1cblxuICByZXR1cm4gZ2V0U2l6ZTtcbn0pO1xuLyoqXG4gKiBtYXRjaGVzU2VsZWN0b3IgdjIuMC4yXG4gKiBtYXRjaGVzU2VsZWN0b3IoIGVsZW1lbnQsICcuc2VsZWN0b3InIClcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgc3RyaWN0OiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuICAndXNlIHN0cmljdCc7IC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJywgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cubWF0Y2hlc1NlbGVjdG9yID0gZmFjdG9yeSgpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbWF0Y2hlc01ldGhvZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgRWxlbVByb3RvID0gd2luZG93LkVsZW1lbnQucHJvdG90eXBlOyAvLyBjaGVjayBmb3IgdGhlIHN0YW5kYXJkIG1ldGhvZCBuYW1lIGZpcnN0XG5cbiAgICBpZiAoRWxlbVByb3RvLm1hdGNoZXMpIHtcbiAgICAgIHJldHVybiAnbWF0Y2hlcyc7XG4gICAgfSAvLyBjaGVjayB1bi1wcmVmaXhlZFxuXG5cbiAgICBpZiAoRWxlbVByb3RvLm1hdGNoZXNTZWxlY3Rvcikge1xuICAgICAgcmV0dXJuICdtYXRjaGVzU2VsZWN0b3InO1xuICAgIH0gLy8gY2hlY2sgdmVuZG9yIHByZWZpeGVzXG5cblxuICAgIHZhciBwcmVmaXhlcyA9IFsnd2Via2l0JywgJ21veicsICdtcycsICdvJ107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICB2YXIgbWV0aG9kID0gcHJlZml4ICsgJ01hdGNoZXNTZWxlY3Rvcic7XG5cbiAgICAgIGlmIChFbGVtUHJvdG9bbWV0aG9kXSkge1xuICAgICAgICByZXR1cm4gbWV0aG9kO1xuICAgICAgfVxuICAgIH1cbiAgfSgpO1xuXG4gIHJldHVybiBmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWxlbSwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gZWxlbVttYXRjaGVzTWV0aG9kXShzZWxlY3Rvcik7XG4gIH07XG59KTtcbi8qKlxuICogRml6enkgVUkgdXRpbHMgdjIuMC43XG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUsIHN0cmljdDogdHJ1ZSAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qanNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKmdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdmaXp6eS11aS11dGlscy91dGlscycsIFsnZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3Rvci9tYXRjaGVzLXNlbGVjdG9yJ10sIGZ1bmN0aW9uIChtYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgbWF0Y2hlc1NlbGVjdG9yKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCdkZXNhbmRyby1tYXRjaGVzLXNlbGVjdG9yJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmZpenp5VUlVdGlscyA9IGZhY3Rvcnkod2luZG93LCB3aW5kb3cubWF0Y2hlc1NlbGVjdG9yKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KHdpbmRvdywgbWF0Y2hlc1NlbGVjdG9yKSB7XG4gIHZhciB1dGlscyA9IHt9OyAvLyAtLS0tLSBleHRlbmQgLS0tLS0gLy9cbiAgLy8gZXh0ZW5kcyBvYmplY3RzXG5cbiAgdXRpbHMuZXh0ZW5kID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICBmb3IgKHZhciBwcm9wIGluIGIpIHtcbiAgICAgIGFbcHJvcF0gPSBiW3Byb3BdO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xuICB9OyAvLyAtLS0tLSBtb2R1bG8gLS0tLS0gLy9cblxuXG4gIHV0aWxzLm1vZHVsbyA9IGZ1bmN0aW9uIChudW0sIGRpdikge1xuICAgIHJldHVybiAobnVtICUgZGl2ICsgZGl2KSAlIGRpdjtcbiAgfTsgLy8gLS0tLS0gbWFrZUFycmF5IC0tLS0tIC8vXG5cblxuICB2YXIgYXJyYXlTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTsgLy8gdHVybiBlbGVtZW50IG9yIG5vZGVMaXN0IGludG8gYW4gYXJyYXlcblxuICB1dGlscy5tYWtlQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH0gLy8gcmV0dXJuIGVtcHR5IGFycmF5IGlmIHVuZGVmaW5lZCBvciBudWxsLiAjNlxuXG5cbiAgICBpZiAob2JqID09PSBudWxsIHx8IG9iaiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIGlzQXJyYXlMaWtlID0gX3R5cGVvZihvYmopID09ICdvYmplY3QnICYmIHR5cGVvZiBvYmoubGVuZ3RoID09ICdudW1iZXInO1xuXG4gICAgaWYgKGlzQXJyYXlMaWtlKSB7XG4gICAgICAvLyBjb252ZXJ0IG5vZGVMaXN0IHRvIGFycmF5XG4gICAgICByZXR1cm4gYXJyYXlTbGljZS5jYWxsKG9iaik7XG4gICAgfSAvLyBhcnJheSBvZiBzaW5nbGUgaW5kZXhcblxuXG4gICAgcmV0dXJuIFtvYmpdO1xuICB9OyAvLyAtLS0tLSByZW1vdmVGcm9tIC0tLS0tIC8vXG5cblxuICB1dGlscy5yZW1vdmVGcm9tID0gZnVuY3Rpb24gKGFyeSwgb2JqKSB7XG4gICAgdmFyIGluZGV4ID0gYXJ5LmluZGV4T2Yob2JqKTtcblxuICAgIGlmIChpbmRleCAhPSAtMSkge1xuICAgICAgYXJ5LnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9OyAvLyAtLS0tLSBnZXRQYXJlbnQgLS0tLS0gLy9cblxuXG4gIHV0aWxzLmdldFBhcmVudCA9IGZ1bmN0aW9uIChlbGVtLCBzZWxlY3Rvcikge1xuICAgIHdoaWxlIChlbGVtLnBhcmVudE5vZGUgJiYgZWxlbSAhPSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICBlbGVtID0gZWxlbS5wYXJlbnROb2RlO1xuXG4gICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsZW0sIHNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICAgIH1cbiAgICB9XG4gIH07IC8vIC0tLS0tIGdldFF1ZXJ5RWxlbWVudCAtLS0tLSAvL1xuICAvLyB1c2UgZWxlbWVudCBhcyBzZWxlY3RvciBzdHJpbmdcblxuXG4gIHV0aWxzLmdldFF1ZXJ5RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbTtcbiAgfTsgLy8gLS0tLS0gaGFuZGxlRXZlbnQgLS0tLS0gLy9cbiAgLy8gZW5hYmxlIC5vbnR5cGUgdG8gdHJpZ2dlciBmcm9tIC5hZGRFdmVudExpc3RlbmVyKCBlbGVtLCAndHlwZScgKVxuXG5cbiAgdXRpbHMuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG5cbiAgICBpZiAodGhpc1ttZXRob2RdKSB7XG4gICAgICB0aGlzW21ldGhvZF0oZXZlbnQpO1xuICAgIH1cbiAgfTsgLy8gLS0tLS0gZmlsdGVyRmluZEVsZW1lbnRzIC0tLS0tIC8vXG5cblxuICB1dGlscy5maWx0ZXJGaW5kRWxlbWVudHMgPSBmdW5jdGlvbiAoZWxlbXMsIHNlbGVjdG9yKSB7XG4gICAgLy8gbWFrZSBhcnJheSBvZiBlbGVtc1xuICAgIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KGVsZW1zKTtcbiAgICB2YXIgZmZFbGVtcyA9IFtdO1xuICAgIGVsZW1zLmZvckVhY2goZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgIC8vIGNoZWNrIHRoYXQgZWxlbSBpcyBhbiBhY3R1YWwgZWxlbWVudFxuICAgICAgaWYgKCEoZWxlbSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9IC8vIGFkZCBlbGVtIGlmIG5vIHNlbGVjdG9yXG5cblxuICAgICAgaWYgKCFzZWxlY3Rvcikge1xuICAgICAgICBmZkVsZW1zLnB1c2goZWxlbSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGEgc2VsZWN0b3JcbiAgICAgIC8vIGZpbHRlclxuXG5cbiAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZWxlbSwgc2VsZWN0b3IpKSB7XG4gICAgICAgIGZmRWxlbXMucHVzaChlbGVtKTtcbiAgICAgIH0gLy8gZmluZCBjaGlsZHJlblxuXG5cbiAgICAgIHZhciBjaGlsZEVsZW1zID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTsgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZEVsZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZmRWxlbXMucHVzaChjaGlsZEVsZW1zW2ldKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZmZFbGVtcztcbiAgfTsgLy8gLS0tLS0gZGVib3VuY2VNZXRob2QgLS0tLS0gLy9cblxuXG4gIHV0aWxzLmRlYm91bmNlTWV0aG9kID0gZnVuY3Rpb24gKF9jbGFzcywgbWV0aG9kTmFtZSwgdGhyZXNob2xkKSB7XG4gICAgdGhyZXNob2xkID0gdGhyZXNob2xkIHx8IDEwMDsgLy8gb3JpZ2luYWwgbWV0aG9kXG5cbiAgICB2YXIgbWV0aG9kID0gX2NsYXNzLnByb3RvdHlwZVttZXRob2ROYW1lXTtcbiAgICB2YXIgdGltZW91dE5hbWUgPSBtZXRob2ROYW1lICsgJ1RpbWVvdXQnO1xuXG4gICAgX2NsYXNzLnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0aW1lb3V0ID0gdGhpc1t0aW1lb3V0TmFtZV07XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgdGhpc1t0aW1lb3V0TmFtZV0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWV0aG9kLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgICAgZGVsZXRlIF90aGlzW3RpbWVvdXROYW1lXTtcbiAgICAgIH0sIHRocmVzaG9sZCk7XG4gICAgfTtcbiAgfTsgLy8gLS0tLS0gZG9jUmVhZHkgLS0tLS0gLy9cblxuXG4gIHV0aWxzLmRvY1JlYWR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlYWR5U3RhdGUgPSBkb2N1bWVudC5yZWFkeVN0YXRlO1xuXG4gICAgaWYgKHJlYWR5U3RhdGUgPT0gJ2NvbXBsZXRlJyB8fCByZWFkeVN0YXRlID09ICdpbnRlcmFjdGl2ZScpIHtcbiAgICAgIC8vIGRvIGFzeW5jIHRvIGFsbG93IGZvciBvdGhlciBzY3JpcHRzIHRvIHJ1bi4gbWV0YWZpenp5L2ZsaWNraXR5IzQ0MVxuICAgICAgc2V0VGltZW91dChjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBjYWxsYmFjayk7XG4gICAgfVxuICB9OyAvLyAtLS0tLSBodG1sSW5pdCAtLS0tLSAvL1xuICAvLyBodHRwOi8vamFtZXNyb2JlcnRzLm5hbWUvYmxvZy8yMDEwLzAyLzIyL3N0cmluZy1mdW5jdGlvbnMtZm9yLWphdmFzY3JpcHQtdHJpbS10by1jYW1lbC1jYXNlLXRvLWRhc2hlZC1hbmQtdG8tdW5kZXJzY29yZS9cblxuXG4gIHV0aWxzLnRvRGFzaGVkID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKC4pKFtBLVpdKS9nLCBmdW5jdGlvbiAobWF0Y2gsICQxLCAkMikge1xuICAgICAgcmV0dXJuICQxICsgJy0nICsgJDI7XG4gICAgfSkudG9Mb3dlckNhc2UoKTtcbiAgfTtcblxuICB2YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xuICAvKipcbiAgICogYWxsb3cgdXNlciB0byBpbml0aWFsaXplIGNsYXNzZXMgdmlhIFtkYXRhLW5hbWVzcGFjZV0gb3IgLmpzLW5hbWVzcGFjZSBjbGFzc1xuICAgKiBodG1sSW5pdCggV2lkZ2V0LCAnd2lkZ2V0TmFtZScgKVxuICAgKiBvcHRpb25zIGFyZSBwYXJzZWQgZnJvbSBkYXRhLW5hbWVzcGFjZS1vcHRpb25zXG4gICAqL1xuXG4gIHV0aWxzLmh0bWxJbml0ID0gZnVuY3Rpb24gKFdpZGdldENsYXNzLCBuYW1lc3BhY2UpIHtcbiAgICB1dGlscy5kb2NSZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGFzaGVkTmFtZXNwYWNlID0gdXRpbHMudG9EYXNoZWQobmFtZXNwYWNlKTtcbiAgICAgIHZhciBkYXRhQXR0ciA9ICdkYXRhLScgKyBkYXNoZWROYW1lc3BhY2U7XG4gICAgICB2YXIgZGF0YUF0dHJFbGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1snICsgZGF0YUF0dHIgKyAnXScpO1xuICAgICAgdmFyIGpzRGFzaEVsZW1zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLScgKyBkYXNoZWROYW1lc3BhY2UpO1xuICAgICAgdmFyIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KGRhdGFBdHRyRWxlbXMpLmNvbmNhdCh1dGlscy5tYWtlQXJyYXkoanNEYXNoRWxlbXMpKTtcbiAgICAgIHZhciBkYXRhT3B0aW9uc0F0dHIgPSBkYXRhQXR0ciArICctb3B0aW9ucyc7XG4gICAgICB2YXIgalF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcbiAgICAgIGVsZW1zLmZvckVhY2goZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgdmFyIGF0dHIgPSBlbGVtLmdldEF0dHJpYnV0ZShkYXRhQXR0cikgfHwgZWxlbS5nZXRBdHRyaWJ1dGUoZGF0YU9wdGlvbnNBdHRyKTtcbiAgICAgICAgdmFyIG9wdGlvbnM7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvcHRpb25zID0gYXR0ciAmJiBKU09OLnBhcnNlKGF0dHIpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIC8vIGxvZyBlcnJvciwgZG8gbm90IGluaXRpYWxpemVcbiAgICAgICAgICBpZiAoY29uc29sZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcGFyc2luZyAnICsgZGF0YUF0dHIgKyAnIG9uICcgKyBlbGVtLmNsYXNzTmFtZSArICc6ICcgKyBlcnJvcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IC8vIGluaXRpYWxpemVcblxuXG4gICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBXaWRnZXRDbGFzcyhlbGVtLCBvcHRpb25zKTsgLy8gbWFrZSBhdmFpbGFibGUgdmlhICQoKS5kYXRhKCduYW1lc3BhY2UnKVxuXG4gICAgICAgIGlmIChqUXVlcnkpIHtcbiAgICAgICAgICBqUXVlcnkuZGF0YShlbGVtLCBuYW1lc3BhY2UsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07IC8vIC0tLS0tICAtLS0tLSAvL1xuXG5cbiAgcmV0dXJuIHV0aWxzO1xufSk7IC8vIEZsaWNraXR5LkNlbGxcblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2ZsaWNraXR5L2pzL2NlbGwnLCBbJ2dldC1zaXplL2dldC1zaXplJ10sIGZ1bmN0aW9uIChnZXRTaXplKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIGdldFNpemUpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3csIHJlcXVpcmUoJ2dldC1zaXplJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5DZWxsID0gZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5nZXRTaXplKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KHdpbmRvdywgZ2V0U2l6ZSkge1xuICBmdW5jdGlvbiBDZWxsKGVsZW0sIHBhcmVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW07XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5jcmVhdGUoKTtcbiAgfVxuXG4gIHZhciBwcm90byA9IENlbGwucHJvdG90eXBlO1xuXG4gIHByb3RvLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMuc2hpZnQgPSAwO1xuICB9O1xuXG4gIHByb3RvLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcmVzZXQgc3R5bGVcbiAgICB0aGlzLnVuc2VsZWN0KCk7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJyc7XG4gICAgdmFyIHNpZGUgPSB0aGlzLnBhcmVudC5vcmlnaW5TaWRlO1xuICAgIHRoaXMuZWxlbWVudC5zdHlsZVtzaWRlXSA9ICcnO1xuICB9O1xuXG4gIHByb3RvLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaXplID0gZ2V0U2l6ZSh0aGlzLmVsZW1lbnQpO1xuICB9O1xuXG4gIHByb3RvLnNldFBvc2l0aW9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMudXBkYXRlVGFyZ2V0KCk7XG4gICAgdGhpcy5yZW5kZXJQb3NpdGlvbih4KTtcbiAgfTsgLy8gc2V0RGVmYXVsdFRhcmdldCB2MSBtZXRob2QsIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCByZW1vdmUgaW4gdjNcblxuXG4gIHByb3RvLnVwZGF0ZVRhcmdldCA9IHByb3RvLnNldERlZmF1bHRUYXJnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1hcmdpblByb3BlcnR5ID0gdGhpcy5wYXJlbnQub3JpZ2luU2lkZSA9PSAnbGVmdCcgPyAnbWFyZ2luTGVmdCcgOiAnbWFyZ2luUmlnaHQnO1xuICAgIHRoaXMudGFyZ2V0ID0gdGhpcy54ICsgdGhpcy5zaXplW21hcmdpblByb3BlcnR5XSArIHRoaXMuc2l6ZS53aWR0aCAqIHRoaXMucGFyZW50LmNlbGxBbGlnbjtcbiAgfTtcblxuICBwcm90by5yZW5kZXJQb3NpdGlvbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgLy8gcmVuZGVyIHBvc2l0aW9uIG9mIGNlbGwgd2l0aCBpbiBzbGlkZXJcbiAgICB2YXIgc2lkZSA9IHRoaXMucGFyZW50Lm9yaWdpblNpZGU7XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlW3NpZGVdID0gdGhpcy5wYXJlbnQuZ2V0UG9zaXRpb25WYWx1ZSh4KTtcbiAgfTtcblxuICBwcm90by5zZWxlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2lzLXNlbGVjdGVkJyk7XG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgfTtcblxuICBwcm90by51bnNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnaXMtc2VsZWN0ZWQnKTtcbiAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0ge0ludGVnZXJ9IGZhY3RvciAtIDAsIDEsIG9yIC0xXG4gICoqL1xuXG5cbiAgcHJvdG8ud3JhcFNoaWZ0ID0gZnVuY3Rpb24gKHNoaWZ0KSB7XG4gICAgdGhpcy5zaGlmdCA9IHNoaWZ0O1xuICAgIHRoaXMucmVuZGVyUG9zaXRpb24odGhpcy54ICsgdGhpcy5wYXJlbnQuc2xpZGVhYmxlV2lkdGggKiBzaGlmdCk7XG4gIH07XG5cbiAgcHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gIH07XG5cbiAgcmV0dXJuIENlbGw7XG59KTsgLy8gc2xpZGVcblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2ZsaWNraXR5L2pzL3NsaWRlJywgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHkgfHwge307XG4gICAgd2luZG93LkZsaWNraXR5LlNsaWRlID0gZmFjdG9yeSgpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBTbGlkZShwYXJlbnQpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmlzT3JpZ2luTGVmdCA9IHBhcmVudC5vcmlnaW5TaWRlID09ICdsZWZ0JztcbiAgICB0aGlzLmNlbGxzID0gW107XG4gICAgdGhpcy5vdXRlcldpZHRoID0gMDtcbiAgICB0aGlzLmhlaWdodCA9IDA7XG4gIH1cblxuICB2YXIgcHJvdG8gPSBTbGlkZS5wcm90b3R5cGU7XG5cbiAgcHJvdG8uYWRkQ2VsbCA9IGZ1bmN0aW9uIChjZWxsKSB7XG4gICAgdGhpcy5jZWxscy5wdXNoKGNlbGwpO1xuICAgIHRoaXMub3V0ZXJXaWR0aCArPSBjZWxsLnNpemUub3V0ZXJXaWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IE1hdGgubWF4KGNlbGwuc2l6ZS5vdXRlckhlaWdodCwgdGhpcy5oZWlnaHQpOyAvLyBmaXJzdCBjZWxsIHN0dWZmXG5cbiAgICBpZiAodGhpcy5jZWxscy5sZW5ndGggPT0gMSkge1xuICAgICAgdGhpcy54ID0gY2VsbC54OyAvLyB4IGNvbWVzIGZyb20gZmlyc3QgY2VsbFxuXG4gICAgICB2YXIgYmVnaW5NYXJnaW4gPSB0aGlzLmlzT3JpZ2luTGVmdCA/ICdtYXJnaW5MZWZ0JyA6ICdtYXJnaW5SaWdodCc7XG4gICAgICB0aGlzLmZpcnN0TWFyZ2luID0gY2VsbC5zaXplW2JlZ2luTWFyZ2luXTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8udXBkYXRlVGFyZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbmRNYXJnaW4gPSB0aGlzLmlzT3JpZ2luTGVmdCA/ICdtYXJnaW5SaWdodCcgOiAnbWFyZ2luTGVmdCc7XG4gICAgdmFyIGxhc3RDZWxsID0gdGhpcy5nZXRMYXN0Q2VsbCgpO1xuICAgIHZhciBsYXN0TWFyZ2luID0gbGFzdENlbGwgPyBsYXN0Q2VsbC5zaXplW2VuZE1hcmdpbl0gOiAwO1xuICAgIHZhciBzbGlkZVdpZHRoID0gdGhpcy5vdXRlcldpZHRoIC0gKHRoaXMuZmlyc3RNYXJnaW4gKyBsYXN0TWFyZ2luKTtcbiAgICB0aGlzLnRhcmdldCA9IHRoaXMueCArIHRoaXMuZmlyc3RNYXJnaW4gKyBzbGlkZVdpZHRoICogdGhpcy5wYXJlbnQuY2VsbEFsaWduO1xuICB9O1xuXG4gIHByb3RvLmdldExhc3RDZWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmNlbGxzW3RoaXMuY2VsbHMubGVuZ3RoIC0gMV07XG4gIH07XG5cbiAgcHJvdG8uc2VsZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2VsbHMuZm9yRWFjaChmdW5jdGlvbiAoY2VsbCkge1xuICAgICAgY2VsbC5zZWxlY3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by51bnNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNlbGxzLmZvckVhY2goZnVuY3Rpb24gKGNlbGwpIHtcbiAgICAgIGNlbGwudW5zZWxlY3QoKTtcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5nZXRDZWxsRWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2VsbHMubWFwKGZ1bmN0aW9uIChjZWxsKSB7XG4gICAgICByZXR1cm4gY2VsbC5lbGVtZW50O1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBTbGlkZTtcbn0pOyAvLyBhbmltYXRlXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdmbGlja2l0eS9qcy9hbmltYXRlJywgWydmaXp6eS11aS11dGlscy91dGlscyddLCBmdW5jdGlvbiAodXRpbHMpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgdXRpbHMpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3csIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LkZsaWNraXR5ID0gd2luZG93LkZsaWNraXR5IHx8IHt9O1xuICAgIHdpbmRvdy5GbGlja2l0eS5hbmltYXRlUHJvdG90eXBlID0gZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5maXp6eVVJVXRpbHMpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3Rvcnkod2luZG93LCB1dGlscykge1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBhbmltYXRlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIHZhciBwcm90byA9IHt9O1xuXG4gIHByb3RvLnN0YXJ0QW5pbWF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pc0FuaW1hdGluZyA9IHRydWU7XG4gICAgdGhpcy5yZXN0aW5nRnJhbWVzID0gMDtcbiAgICB0aGlzLmFuaW1hdGUoKTtcbiAgfTtcblxuICBwcm90by5hbmltYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXBwbHlEcmFnRm9yY2UoKTtcbiAgICB0aGlzLmFwcGx5U2VsZWN0ZWRBdHRyYWN0aW9uKCk7XG4gICAgdmFyIHByZXZpb3VzWCA9IHRoaXMueDtcbiAgICB0aGlzLmludGVncmF0ZVBoeXNpY3MoKTtcbiAgICB0aGlzLnBvc2l0aW9uU2xpZGVyKCk7XG4gICAgdGhpcy5zZXR0bGUocHJldmlvdXNYKTsgLy8gYW5pbWF0ZSBuZXh0IGZyYW1lXG5cbiAgICBpZiAodGhpcy5pc0FuaW1hdGluZykge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uIGFuaW1hdGVGcmFtZSgpIHtcbiAgICAgICAgX3RoaXMuYW5pbWF0ZSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLnBvc2l0aW9uU2xpZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB4ID0gdGhpcy54OyAvLyB3cmFwIHBvc2l0aW9uIGFyb3VuZFxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy53cmFwQXJvdW5kICYmIHRoaXMuY2VsbHMubGVuZ3RoID4gMSkge1xuICAgICAgeCA9IHV0aWxzLm1vZHVsbyh4LCB0aGlzLnNsaWRlYWJsZVdpZHRoKTtcbiAgICAgIHggPSB4IC0gdGhpcy5zbGlkZWFibGVXaWR0aDtcbiAgICAgIHRoaXMuc2hpZnRXcmFwQ2VsbHMoeCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRUcmFuc2xhdGVYKHgsIHRoaXMuaXNBbmltYXRpbmcpO1xuICAgIHRoaXMuZGlzcGF0Y2hTY3JvbGxFdmVudCgpO1xuICB9O1xuXG4gIHByb3RvLnNldFRyYW5zbGF0ZVggPSBmdW5jdGlvbiAoeCwgaXMzZCkge1xuICAgIHggKz0gdGhpcy5jdXJzb3JQb3NpdGlvbjsgLy8gcmV2ZXJzZSBpZiByaWdodC10by1sZWZ0IGFuZCB1c2luZyB0cmFuc2Zvcm1cblxuICAgIHggPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAteCA6IHg7XG4gICAgdmFyIHRyYW5zbGF0ZVggPSB0aGlzLmdldFBvc2l0aW9uVmFsdWUoeCk7IC8vIHVzZSAzRCB0cmFuZm9ybXMgZm9yIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiBvbiBpT1NcbiAgICAvLyBidXQgdXNlIDJEIHdoZW4gc2V0dGxlZCwgZm9yIGJldHRlciBmb250LXJlbmRlcmluZ1xuXG4gICAgdGhpcy5zbGlkZXIuc3R5bGUudHJhbnNmb3JtID0gaXMzZCA/ICd0cmFuc2xhdGUzZCgnICsgdHJhbnNsYXRlWCArICcsMCwwKScgOiAndHJhbnNsYXRlWCgnICsgdHJhbnNsYXRlWCArICcpJztcbiAgfTtcblxuICBwcm90by5kaXNwYXRjaFNjcm9sbEV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaXJzdFNsaWRlID0gdGhpcy5zbGlkZXNbMF07XG5cbiAgICBpZiAoIWZpcnN0U2xpZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgcG9zaXRpb25YID0gLXRoaXMueCAtIGZpcnN0U2xpZGUudGFyZ2V0O1xuICAgIHZhciBwcm9ncmVzcyA9IHBvc2l0aW9uWCAvIHRoaXMuc2xpZGVzV2lkdGg7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzY3JvbGwnLCBudWxsLCBbcHJvZ3Jlc3MsIHBvc2l0aW9uWF0pO1xuICB9O1xuXG4gIHByb3RvLnBvc2l0aW9uU2xpZGVyQXRTZWxlY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuY2VsbHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy54ID0gLXRoaXMuc2VsZWN0ZWRTbGlkZS50YXJnZXQ7XG4gICAgdGhpcy52ZWxvY2l0eSA9IDA7IC8vIHN0b3Agd29iYmxlXG5cbiAgICB0aGlzLnBvc2l0aW9uU2xpZGVyKCk7XG4gIH07XG5cbiAgcHJvdG8uZ2V0UG9zaXRpb25WYWx1ZSA9IGZ1bmN0aW9uIChwb3NpdGlvbikge1xuICAgIGlmICh0aGlzLm9wdGlvbnMucGVyY2VudFBvc2l0aW9uKSB7XG4gICAgICAvLyBwZXJjZW50IHBvc2l0aW9uLCByb3VuZCB0byAyIGRpZ2l0cywgbGlrZSAxMi4zNCVcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKHBvc2l0aW9uIC8gdGhpcy5zaXplLmlubmVyV2lkdGggKiAxMDAwMCkgKiAwLjAxICsgJyUnO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBwaXhlbCBwb3NpdGlvbmluZ1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQocG9zaXRpb24pICsgJ3B4JztcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uc2V0dGxlID0gZnVuY3Rpb24gKHByZXZpb3VzWCkge1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgZnJhbWVzIHdoZXJlIHggaGFzbid0IG1vdmVkXG4gICAgaWYgKCF0aGlzLmlzUG9pbnRlckRvd24gJiYgTWF0aC5yb3VuZCh0aGlzLnggKiAxMDApID09IE1hdGgucm91bmQocHJldmlvdXNYICogMTAwKSkge1xuICAgICAgdGhpcy5yZXN0aW5nRnJhbWVzKys7XG4gICAgfSAvLyBzdG9wIGFuaW1hdGluZyBpZiByZXN0aW5nIGZvciAzIG9yIG1vcmUgZnJhbWVzXG5cblxuICAgIGlmICh0aGlzLnJlc3RpbmdGcmFtZXMgPiAyKSB7XG4gICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICBkZWxldGUgdGhpcy5pc0ZyZWVTY3JvbGxpbmc7IC8vIHJlbmRlciBwb3NpdGlvbiB3aXRoIHRyYW5zbGF0ZVggd2hlbiBzZXR0bGVkXG5cbiAgICAgIHRoaXMucG9zaXRpb25TbGlkZXIoKTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc2V0dGxlJywgbnVsbCwgW3RoaXMuc2VsZWN0ZWRJbmRleF0pO1xuICAgIH1cbiAgfTtcblxuICBwcm90by5zaGlmdFdyYXBDZWxscyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgLy8gc2hpZnQgYmVmb3JlIGNlbGxzXG4gICAgdmFyIGJlZm9yZUdhcCA9IHRoaXMuY3Vyc29yUG9zaXRpb24gKyB4O1xuXG4gICAgdGhpcy5fc2hpZnRDZWxscyh0aGlzLmJlZm9yZVNoaWZ0Q2VsbHMsIGJlZm9yZUdhcCwgLTEpOyAvLyBzaGlmdCBhZnRlciBjZWxsc1xuXG5cbiAgICB2YXIgYWZ0ZXJHYXAgPSB0aGlzLnNpemUuaW5uZXJXaWR0aCAtICh4ICsgdGhpcy5zbGlkZWFibGVXaWR0aCArIHRoaXMuY3Vyc29yUG9zaXRpb24pO1xuXG4gICAgdGhpcy5fc2hpZnRDZWxscyh0aGlzLmFmdGVyU2hpZnRDZWxscywgYWZ0ZXJHYXAsIDEpO1xuICB9O1xuXG4gIHByb3RvLl9zaGlmdENlbGxzID0gZnVuY3Rpb24gKGNlbGxzLCBnYXAsIHNoaWZ0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNlbGwgPSBjZWxsc1tpXTtcbiAgICAgIHZhciBjZWxsU2hpZnQgPSBnYXAgPiAwID8gc2hpZnQgOiAwO1xuICAgICAgY2VsbC53cmFwU2hpZnQoY2VsbFNoaWZ0KTtcbiAgICAgIGdhcCAtPSBjZWxsLnNpemUub3V0ZXJXaWR0aDtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uX3Vuc2hpZnRDZWxscyA9IGZ1bmN0aW9uIChjZWxscykge1xuICAgIGlmICghY2VsbHMgfHwgIWNlbGxzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2VsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNlbGxzW2ldLndyYXBTaGlmdCgwKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHBoeXNpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIHByb3RvLmludGVncmF0ZVBoeXNpY3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHk7XG4gICAgdGhpcy52ZWxvY2l0eSAqPSB0aGlzLmdldEZyaWN0aW9uRmFjdG9yKCk7XG4gIH07XG5cbiAgcHJvdG8uYXBwbHlGb3JjZSA9IGZ1bmN0aW9uIChmb3JjZSkge1xuICAgIHRoaXMudmVsb2NpdHkgKz0gZm9yY2U7XG4gIH07XG5cbiAgcHJvdG8uZ2V0RnJpY3Rpb25GYWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIDEgLSB0aGlzLm9wdGlvbnNbdGhpcy5pc0ZyZWVTY3JvbGxpbmcgPyAnZnJlZVNjcm9sbEZyaWN0aW9uJyA6ICdmcmljdGlvbiddO1xuICB9O1xuXG4gIHByb3RvLmdldFJlc3RpbmdQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBteSB0aGFua3MgdG8gU3RldmVuIFdpdHRlbnMsIHdobyBzaW1wbGlmaWVkIHRoaXMgbWF0aCBncmVhdGx5XG4gICAgcmV0dXJuIHRoaXMueCArIHRoaXMudmVsb2NpdHkgLyAoMSAtIHRoaXMuZ2V0RnJpY3Rpb25GYWN0b3IoKSk7XG4gIH07XG5cbiAgcHJvdG8uYXBwbHlEcmFnRm9yY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzRHJhZ2dhYmxlIHx8ICF0aGlzLmlzUG9pbnRlckRvd24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGNoYW5nZSB0aGUgcG9zaXRpb24gdG8gZHJhZyBwb3NpdGlvbiBieSBhcHBseWluZyBmb3JjZVxuXG5cbiAgICB2YXIgZHJhZ1ZlbG9jaXR5ID0gdGhpcy5kcmFnWCAtIHRoaXMueDtcbiAgICB2YXIgZHJhZ0ZvcmNlID0gZHJhZ1ZlbG9jaXR5IC0gdGhpcy52ZWxvY2l0eTtcbiAgICB0aGlzLmFwcGx5Rm9yY2UoZHJhZ0ZvcmNlKTtcbiAgfTtcblxuICBwcm90by5hcHBseVNlbGVjdGVkQXR0cmFjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBkbyBub3QgYXR0cmFjdCBpZiBwb2ludGVyIGRvd24gb3Igbm8gc2xpZGVzXG4gICAgdmFyIGRyYWdEb3duID0gdGhpcy5pc0RyYWdnYWJsZSAmJiB0aGlzLmlzUG9pbnRlckRvd247XG5cbiAgICBpZiAoZHJhZ0Rvd24gfHwgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgfHwgIXRoaXMuc2xpZGVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkaXN0YW5jZSA9IHRoaXMuc2VsZWN0ZWRTbGlkZS50YXJnZXQgKiAtMSAtIHRoaXMueDtcbiAgICB2YXIgZm9yY2UgPSBkaXN0YW5jZSAqIHRoaXMub3B0aW9ucy5zZWxlY3RlZEF0dHJhY3Rpb247XG4gICAgdGhpcy5hcHBseUZvcmNlKGZvcmNlKTtcbiAgfTtcblxuICByZXR1cm4gcHJvdG87XG59KTsgLy8gRmxpY2tpdHkgbWFpblxuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZmxpY2tpdHkvanMvZmxpY2tpdHknLCBbJ2V2LWVtaXR0ZXIvZXYtZW1pdHRlcicsICdnZXQtc2l6ZS9nZXQtc2l6ZScsICdmaXp6eS11aS11dGlscy91dGlscycsICcuL2NlbGwnLCAnLi9zbGlkZScsICcuL2FuaW1hdGUnXSwgZnVuY3Rpb24gKEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIENlbGwsIFNsaWRlLCBhbmltYXRlUHJvdG90eXBlKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIENlbGwsIFNsaWRlLCBhbmltYXRlUHJvdG90eXBlKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCdldi1lbWl0dGVyJyksIHJlcXVpcmUoJ2dldC1zaXplJyksIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJyksIHJlcXVpcmUoJy4vY2VsbCcpLCByZXF1aXJlKCcuL3NsaWRlJyksIHJlcXVpcmUoJy4vYW5pbWF0ZScpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHZhciBfRmxpY2tpdHkgPSB3aW5kb3cuRmxpY2tpdHk7XG4gICAgd2luZG93LkZsaWNraXR5ID0gZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5FdkVtaXR0ZXIsIHdpbmRvdy5nZXRTaXplLCB3aW5kb3cuZml6enlVSVV0aWxzLCBfRmxpY2tpdHkuQ2VsbCwgX0ZsaWNraXR5LlNsaWRlLCBfRmxpY2tpdHkuYW5pbWF0ZVByb3RvdHlwZSk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIENlbGwsIFNsaWRlLCBhbmltYXRlUHJvdG90eXBlKSB7XG4gIC8vIHZhcnNcbiAgdmFyIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XG4gIHZhciBnZXRDb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGU7XG4gIHZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG5cbiAgZnVuY3Rpb24gbW92ZUVsZW1lbnRzKGVsZW1zLCB0b0VsZW0pIHtcbiAgICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheShlbGVtcyk7XG5cbiAgICB3aGlsZSAoZWxlbXMubGVuZ3RoKSB7XG4gICAgICB0b0VsZW0uYXBwZW5kQ2hpbGQoZWxlbXMuc2hpZnQoKSk7XG4gICAgfVxuICB9IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEZsaWNraXR5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIGdsb2JhbGx5IHVuaXF1ZSBpZGVudGlmaWVyc1xuXG5cbiAgdmFyIEdVSUQgPSAwOyAvLyBpbnRlcm5hbCBzdG9yZSBvZiBhbGwgRmxpY2tpdHkgaW50YW5jZXNcblxuICB2YXIgaW5zdGFuY2VzID0ge307XG5cbiAgZnVuY3Rpb24gRmxpY2tpdHkoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHZhciBxdWVyeUVsZW1lbnQgPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoZWxlbWVudCk7XG5cbiAgICBpZiAoIXF1ZXJ5RWxlbWVudCkge1xuICAgICAgaWYgKGNvbnNvbGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQmFkIGVsZW1lbnQgZm9yIEZsaWNraXR5OiAnICsgKHF1ZXJ5RWxlbWVudCB8fCBlbGVtZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBxdWVyeUVsZW1lbnQ7IC8vIGRvIG5vdCBpbml0aWFsaXplIHR3aWNlIG9uIHNhbWUgZWxlbWVudFxuXG4gICAgaWYgKHRoaXMuZWxlbWVudC5mbGlja2l0eUdVSUQpIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IGluc3RhbmNlc1t0aGlzLmVsZW1lbnQuZmxpY2tpdHlHVUlEXTtcbiAgICAgIGluc3RhbmNlLm9wdGlvbihvcHRpb25zKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9IC8vIGFkZCBqUXVlcnlcblxuXG4gICAgaWYgKGpRdWVyeSkge1xuICAgICAgdGhpcy4kZWxlbWVudCA9IGpRdWVyeSh0aGlzLmVsZW1lbnQpO1xuICAgIH0gLy8gb3B0aW9uc1xuXG5cbiAgICB0aGlzLm9wdGlvbnMgPSB1dGlscy5leHRlbmQoe30sIHRoaXMuY29uc3RydWN0b3IuZGVmYXVsdHMpO1xuICAgIHRoaXMub3B0aW9uKG9wdGlvbnMpOyAvLyBraWNrIHRoaW5ncyBvZmZcblxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG5cbiAgRmxpY2tpdHkuZGVmYXVsdHMgPSB7XG4gICAgYWNjZXNzaWJpbGl0eTogdHJ1ZSxcbiAgICAvLyBhZGFwdGl2ZUhlaWdodDogZmFsc2UsXG4gICAgY2VsbEFsaWduOiAnY2VudGVyJyxcbiAgICAvLyBjZWxsU2VsZWN0b3I6IHVuZGVmaW5lZCxcbiAgICAvLyBjb250YWluOiBmYWxzZSxcbiAgICBmcmVlU2Nyb2xsRnJpY3Rpb246IDAuMDc1LFxuICAgIC8vIGZyaWN0aW9uIHdoZW4gZnJlZS1zY3JvbGxpbmdcbiAgICBmcmljdGlvbjogMC4yOCxcbiAgICAvLyBmcmljdGlvbiB3aGVuIHNlbGVjdGluZ1xuICAgIG5hbWVzcGFjZUpRdWVyeUV2ZW50czogdHJ1ZSxcbiAgICAvLyBpbml0aWFsSW5kZXg6IDAsXG4gICAgcGVyY2VudFBvc2l0aW9uOiB0cnVlLFxuICAgIHJlc2l6ZTogdHJ1ZSxcbiAgICBzZWxlY3RlZEF0dHJhY3Rpb246IDAuMDI1LFxuICAgIHNldEdhbGxlcnlTaXplOiB0cnVlIC8vIHdhdGNoQ1NTOiBmYWxzZSxcbiAgICAvLyB3cmFwQXJvdW5kOiBmYWxzZVxuXG4gIH07IC8vIGhhc2ggb2YgbWV0aG9kcyB0cmlnZ2VyZWQgb24gX2NyZWF0ZSgpXG5cbiAgRmxpY2tpdHkuY3JlYXRlTWV0aG9kcyA9IFtdO1xuICB2YXIgcHJvdG8gPSBGbGlja2l0eS5wcm90b3R5cGU7IC8vIGluaGVyaXQgRXZlbnRFbWl0dGVyXG5cbiAgdXRpbHMuZXh0ZW5kKHByb3RvLCBFdkVtaXR0ZXIucHJvdG90eXBlKTtcblxuICBwcm90by5fY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGFkZCBpZCBmb3IgRmxpY2tpdHkuZGF0YVxuICAgIHZhciBpZCA9IHRoaXMuZ3VpZCA9ICsrR1VJRDtcbiAgICB0aGlzLmVsZW1lbnQuZmxpY2tpdHlHVUlEID0gaWQ7IC8vIGV4cGFuZG9cblxuICAgIGluc3RhbmNlc1tpZF0gPSB0aGlzOyAvLyBhc3NvY2lhdGUgdmlhIGlkXG4gICAgLy8gaW5pdGlhbCBwcm9wZXJ0aWVzXG5cbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwOyAvLyBob3cgbWFueSBmcmFtZXMgc2xpZGVyIGhhcyBiZWVuIGluIHNhbWUgcG9zaXRpb25cblxuICAgIHRoaXMucmVzdGluZ0ZyYW1lcyA9IDA7IC8vIGluaXRpYWwgcGh5c2ljcyBwcm9wZXJ0aWVzXG5cbiAgICB0aGlzLnggPSAwO1xuICAgIHRoaXMudmVsb2NpdHkgPSAwO1xuICAgIHRoaXMub3JpZ2luU2lkZSA9IHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCA/ICdyaWdodCcgOiAnbGVmdCc7IC8vIGNyZWF0ZSB2aWV3cG9ydCAmIHNsaWRlclxuXG4gICAgdGhpcy52aWV3cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMudmlld3BvcnQuY2xhc3NOYW1lID0gJ2ZsaWNraXR5LXZpZXdwb3J0JztcblxuICAgIHRoaXMuX2NyZWF0ZVNsaWRlcigpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yZXNpemUgfHwgdGhpcy5vcHRpb25zLndhdGNoQ1NTKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcyk7XG4gICAgfSAvLyBhZGQgbGlzdGVuZXJzIGZyb20gb24gb3B0aW9uXG5cblxuICAgIGZvciAodmFyIGV2ZW50TmFtZSBpbiB0aGlzLm9wdGlvbnMub24pIHtcbiAgICAgIHZhciBsaXN0ZW5lciA9IHRoaXMub3B0aW9ucy5vbltldmVudE5hbWVdO1xuICAgICAgdGhpcy5vbihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBGbGlja2l0eS5jcmVhdGVNZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgdGhpc1ttZXRob2RdKCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLndhdGNoQ1NTKSB7XG4gICAgICB0aGlzLndhdGNoQ1NTKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYWN0aXZhdGUoKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBzZXQgb3B0aW9uc1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgKi9cblxuXG4gIHByb3RvLm9wdGlvbiA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgdXRpbHMuZXh0ZW5kKHRoaXMub3B0aW9ucywgb3B0cyk7XG4gIH07XG5cbiAgcHJvdG8uYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZmxpY2tpdHktZW5hYmxlZCcpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5yaWdodFRvTGVmdCkge1xuICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2ZsaWNraXR5LXJ0bCcpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0U2l6ZSgpOyAvLyBtb3ZlIGluaXRpYWwgY2VsbCBlbGVtZW50cyBzbyB0aGV5IGNhbiBiZSBsb2FkZWQgYXMgY2VsbHNcblxuICAgIHZhciBjZWxsRWxlbXMgPSB0aGlzLl9maWx0ZXJGaW5kQ2VsbEVsZW1lbnRzKHRoaXMuZWxlbWVudC5jaGlsZHJlbik7XG5cbiAgICBtb3ZlRWxlbWVudHMoY2VsbEVsZW1zLCB0aGlzLnNsaWRlcik7XG4gICAgdGhpcy52aWV3cG9ydC5hcHBlbmRDaGlsZCh0aGlzLnNsaWRlcik7XG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMudmlld3BvcnQpOyAvLyBnZXQgY2VsbHMgZnJvbSBjaGlsZHJlblxuXG4gICAgdGhpcy5yZWxvYWRDZWxscygpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hY2Nlc3NpYmlsaXR5KSB7XG4gICAgICAvLyBhbGxvdyBlbGVtZW50IHRvIGZvY3VzYWJsZVxuICAgICAgdGhpcy5lbGVtZW50LnRhYkluZGV4ID0gMDsgLy8gbGlzdGVuIGZvciBrZXkgcHJlc3Nlc1xuXG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMpO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdEV2ZW50KCdhY3RpdmF0ZScpO1xuICAgIHRoaXMuc2VsZWN0SW5pdGlhbEluZGV4KCk7IC8vIGZsYWcgZm9yIGluaXRpYWwgYWN0aXZhdGlvbiwgZm9yIHVzaW5nIGluaXRpYWxJbmRleFxuXG4gICAgdGhpcy5pc0luaXRBY3RpdmF0ZWQgPSB0cnVlOyAvLyByZWFkeSBldmVudC4gIzQ5M1xuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICB9OyAvLyBzbGlkZXIgcG9zaXRpb25zIHRoZSBjZWxsc1xuXG5cbiAgcHJvdG8uX2NyZWF0ZVNsaWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBzbGlkZXIgZWxlbWVudCBkb2VzIGFsbCB0aGUgcG9zaXRpb25pbmdcbiAgICB2YXIgc2xpZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgc2xpZGVyLmNsYXNzTmFtZSA9ICdmbGlja2l0eS1zbGlkZXInO1xuICAgIHNsaWRlci5zdHlsZVt0aGlzLm9yaWdpblNpZGVdID0gMDtcbiAgICB0aGlzLnNsaWRlciA9IHNsaWRlcjtcbiAgfTtcblxuICBwcm90by5fZmlsdGVyRmluZENlbGxFbGVtZW50cyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHJldHVybiB1dGlscy5maWx0ZXJGaW5kRWxlbWVudHMoZWxlbXMsIHRoaXMub3B0aW9ucy5jZWxsU2VsZWN0b3IpO1xuICB9OyAvLyBnb2VzIHRocm91Z2ggYWxsIGNoaWxkcmVuXG5cblxuICBwcm90by5yZWxvYWRDZWxscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgICB0aGlzLmNlbGxzID0gdGhpcy5fbWFrZUNlbGxzKHRoaXMuc2xpZGVyLmNoaWxkcmVuKTtcbiAgICB0aGlzLnBvc2l0aW9uQ2VsbHMoKTtcblxuICAgIHRoaXMuX2dldFdyYXBTaGlmdENlbGxzKCk7XG5cbiAgICB0aGlzLnNldEdhbGxlcnlTaXplKCk7XG4gIH07XG4gIC8qKlxuICAgKiB0dXJuIGVsZW1lbnRzIGludG8gRmxpY2tpdHkuQ2VsbHNcbiAgICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAgICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIGNvbGxlY3Rpb24gb2YgbmV3IEZsaWNraXR5IENlbGxzXG4gICAqL1xuXG5cbiAgcHJvdG8uX21ha2VDZWxscyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBjZWxsRWxlbXMgPSB0aGlzLl9maWx0ZXJGaW5kQ2VsbEVsZW1lbnRzKGVsZW1zKTsgLy8gY3JlYXRlIG5ldyBGbGlja2l0eSBmb3IgY29sbGVjdGlvblxuXG5cbiAgICB2YXIgY2VsbHMgPSBjZWxsRWxlbXMubWFwKGZ1bmN0aW9uIChjZWxsRWxlbSkge1xuICAgICAgcmV0dXJuIG5ldyBDZWxsKGNlbGxFbGVtLCB0aGlzKTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gY2VsbHM7XG4gIH07XG5cbiAgcHJvdG8uZ2V0TGFzdENlbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2VsbHNbdGhpcy5jZWxscy5sZW5ndGggLSAxXTtcbiAgfTtcblxuICBwcm90by5nZXRMYXN0U2xpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpZGVzW3RoaXMuc2xpZGVzLmxlbmd0aCAtIDFdO1xuICB9OyAvLyBwb3NpdGlvbnMgYWxsIGNlbGxzXG5cblxuICBwcm90by5wb3NpdGlvbkNlbGxzID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHNpemUgYWxsIGNlbGxzXG4gICAgdGhpcy5fc2l6ZUNlbGxzKHRoaXMuY2VsbHMpOyAvLyBwb3NpdGlvbiBhbGwgY2VsbHNcblxuXG4gICAgdGhpcy5fcG9zaXRpb25DZWxscygwKTtcbiAgfTtcbiAgLyoqXG4gICAqIHBvc2l0aW9uIGNlcnRhaW4gY2VsbHNcbiAgICogQHBhcmFtIHtJbnRlZ2VyfSBpbmRleCAtIHdoaWNoIGNlbGwgdG8gc3RhcnQgd2l0aFxuICAgKi9cblxuXG4gIHByb3RvLl9wb3NpdGlvbkNlbGxzID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaW5kZXggPSBpbmRleCB8fCAwOyAvLyBhbHNvIG1lYXN1cmUgbWF4Q2VsbEhlaWdodFxuICAgIC8vIHN0YXJ0IDAgaWYgcG9zaXRpb25pbmcgYWxsIGNlbGxzXG5cbiAgICB0aGlzLm1heENlbGxIZWlnaHQgPSBpbmRleCA/IHRoaXMubWF4Q2VsbEhlaWdodCB8fCAwIDogMDtcbiAgICB2YXIgY2VsbFggPSAwOyAvLyBnZXQgY2VsbFhcblxuICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgIHZhciBzdGFydENlbGwgPSB0aGlzLmNlbGxzW2luZGV4IC0gMV07XG4gICAgICBjZWxsWCA9IHN0YXJ0Q2VsbC54ICsgc3RhcnRDZWxsLnNpemUub3V0ZXJXaWR0aDtcbiAgICB9XG5cbiAgICB2YXIgbGVuID0gdGhpcy5jZWxscy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gaW5kZXg7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuICAgICAgY2VsbC5zZXRQb3NpdGlvbihjZWxsWCk7XG4gICAgICBjZWxsWCArPSBjZWxsLnNpemUub3V0ZXJXaWR0aDtcbiAgICAgIHRoaXMubWF4Q2VsbEhlaWdodCA9IE1hdGgubWF4KGNlbGwuc2l6ZS5vdXRlckhlaWdodCwgdGhpcy5tYXhDZWxsSGVpZ2h0KTtcbiAgICB9IC8vIGtlZXAgdHJhY2sgb2YgY2VsbFggZm9yIHdyYXAtYXJvdW5kXG5cblxuICAgIHRoaXMuc2xpZGVhYmxlV2lkdGggPSBjZWxsWDsgLy8gc2xpZGVzXG5cbiAgICB0aGlzLnVwZGF0ZVNsaWRlcygpOyAvLyBjb250YWluIHNsaWRlcyB0YXJnZXRcblxuICAgIHRoaXMuX2NvbnRhaW5TbGlkZXMoKTsgLy8gdXBkYXRlIHNsaWRlc1dpZHRoXG5cblxuICAgIHRoaXMuc2xpZGVzV2lkdGggPSBsZW4gPyB0aGlzLmdldExhc3RTbGlkZSgpLnRhcmdldCAtIHRoaXMuc2xpZGVzWzBdLnRhcmdldCA6IDA7XG4gIH07XG4gIC8qKlxuICAgKiBjZWxsLmdldFNpemUoKSBvbiBtdWx0aXBsZSBjZWxsc1xuICAgKiBAcGFyYW0ge0FycmF5fSBjZWxsc1xuICAgKi9cblxuXG4gIHByb3RvLl9zaXplQ2VsbHMgPSBmdW5jdGlvbiAoY2VsbHMpIHtcbiAgICBjZWxscy5mb3JFYWNoKGZ1bmN0aW9uIChjZWxsKSB7XG4gICAgICBjZWxsLmdldFNpemUoKTtcbiAgICB9KTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICBwcm90by51cGRhdGVTbGlkZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zbGlkZXMgPSBbXTtcblxuICAgIGlmICghdGhpcy5jZWxscy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2xpZGUgPSBuZXcgU2xpZGUodGhpcyk7XG4gICAgdGhpcy5zbGlkZXMucHVzaChzbGlkZSk7XG4gICAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMub3JpZ2luU2lkZSA9PSAnbGVmdCc7XG4gICAgdmFyIG5leHRNYXJnaW4gPSBpc09yaWdpbkxlZnQgPyAnbWFyZ2luUmlnaHQnIDogJ21hcmdpbkxlZnQnO1xuXG4gICAgdmFyIGNhbkNlbGxGaXQgPSB0aGlzLl9nZXRDYW5DZWxsRml0KCk7XG5cbiAgICB0aGlzLmNlbGxzLmZvckVhY2goZnVuY3Rpb24gKGNlbGwsIGkpIHtcbiAgICAgIC8vIGp1c3QgYWRkIGNlbGwgaWYgZmlyc3QgY2VsbCBpbiBzbGlkZVxuICAgICAgaWYgKCFzbGlkZS5jZWxscy5sZW5ndGgpIHtcbiAgICAgICAgc2xpZGUuYWRkQ2VsbChjZWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2xpZGVXaWR0aCA9IHNsaWRlLm91dGVyV2lkdGggLSBzbGlkZS5maXJzdE1hcmdpbiArIChjZWxsLnNpemUub3V0ZXJXaWR0aCAtIGNlbGwuc2l6ZVtuZXh0TWFyZ2luXSk7XG5cbiAgICAgIGlmIChjYW5DZWxsRml0LmNhbGwodGhpcywgaSwgc2xpZGVXaWR0aCkpIHtcbiAgICAgICAgc2xpZGUuYWRkQ2VsbChjZWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGRvZXNuJ3QgZml0LCBuZXcgc2xpZGVcbiAgICAgICAgc2xpZGUudXBkYXRlVGFyZ2V0KCk7XG4gICAgICAgIHNsaWRlID0gbmV3IFNsaWRlKHRoaXMpO1xuICAgICAgICB0aGlzLnNsaWRlcy5wdXNoKHNsaWRlKTtcbiAgICAgICAgc2xpZGUuYWRkQ2VsbChjZWxsKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTsgLy8gbGFzdCBzbGlkZVxuXG4gICAgc2xpZGUudXBkYXRlVGFyZ2V0KCk7IC8vIHVwZGF0ZSAuc2VsZWN0ZWRTbGlkZVxuXG4gICAgdGhpcy51cGRhdGVTZWxlY3RlZFNsaWRlKCk7XG4gIH07XG5cbiAgcHJvdG8uX2dldENhbkNlbGxGaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdyb3VwQ2VsbHMgPSB0aGlzLm9wdGlvbnMuZ3JvdXBDZWxscztcblxuICAgIGlmICghZ3JvdXBDZWxscykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBncm91cENlbGxzID09ICdudW1iZXInKSB7XG4gICAgICAvLyBncm91cCBieSBudW1iZXIuIDMgLT4gWzAsMSwyXSwgWzMsNCw1XSwgLi4uXG4gICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQoZ3JvdXBDZWxscywgMTApO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpKSB7XG4gICAgICAgIHJldHVybiBpICUgbnVtYmVyICE9PSAwO1xuICAgICAgfTtcbiAgICB9IC8vIGRlZmF1bHQsIGdyb3VwIGJ5IHdpZHRoIG9mIHNsaWRlXG4gICAgLy8gcGFyc2UgJzc1JVxuXG5cbiAgICB2YXIgcGVyY2VudE1hdGNoID0gdHlwZW9mIGdyb3VwQ2VsbHMgPT0gJ3N0cmluZycgJiYgZ3JvdXBDZWxscy5tYXRjaCgvXihcXGQrKSUkLyk7XG4gICAgdmFyIHBlcmNlbnQgPSBwZXJjZW50TWF0Y2ggPyBwYXJzZUludChwZXJjZW50TWF0Y2hbMV0sIDEwKSAvIDEwMCA6IDE7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpLCBzbGlkZVdpZHRoKSB7XG4gICAgICByZXR1cm4gc2xpZGVXaWR0aCA8PSAodGhpcy5zaXplLmlubmVyV2lkdGggKyAxKSAqIHBlcmNlbnQ7XG4gICAgfTtcbiAgfTsgLy8gYWxpYXMgX2luaXQgZm9yIGpRdWVyeSBwbHVnaW4gLmZsaWNraXR5KClcblxuXG4gIHByb3RvLl9pbml0ID0gcHJvdG8ucmVwb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBvc2l0aW9uQ2VsbHMoKTtcbiAgICB0aGlzLnBvc2l0aW9uU2xpZGVyQXRTZWxlY3RlZCgpO1xuICB9O1xuXG4gIHByb3RvLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaXplID0gZ2V0U2l6ZSh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuc2V0Q2VsbEFsaWduKCk7XG4gICAgdGhpcy5jdXJzb3JQb3NpdGlvbiA9IHRoaXMuc2l6ZS5pbm5lcldpZHRoICogdGhpcy5jZWxsQWxpZ247XG4gIH07XG5cbiAgdmFyIGNlbGxBbGlnblNob3J0aGFuZHMgPSB7XG4gICAgLy8gY2VsbCBhbGlnbiwgdGhlbiBiYXNlZCBvbiBvcmlnaW4gc2lkZVxuICAgIGNlbnRlcjoge1xuICAgICAgbGVmdDogMC41LFxuICAgICAgcmlnaHQ6IDAuNVxuICAgIH0sXG4gICAgbGVmdDoge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0OiAxXG4gICAgfSxcbiAgICByaWdodDoge1xuICAgICAgcmlnaHQ6IDAsXG4gICAgICBsZWZ0OiAxXG4gICAgfVxuICB9O1xuXG4gIHByb3RvLnNldENlbGxBbGlnbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2hvcnRoYW5kID0gY2VsbEFsaWduU2hvcnRoYW5kc1t0aGlzLm9wdGlvbnMuY2VsbEFsaWduXTtcbiAgICB0aGlzLmNlbGxBbGlnbiA9IHNob3J0aGFuZCA/IHNob3J0aGFuZFt0aGlzLm9yaWdpblNpZGVdIDogdGhpcy5vcHRpb25zLmNlbGxBbGlnbjtcbiAgfTtcblxuICBwcm90by5zZXRHYWxsZXJ5U2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNldEdhbGxlcnlTaXplKSB7XG4gICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmFkYXB0aXZlSGVpZ2h0ICYmIHRoaXMuc2VsZWN0ZWRTbGlkZSA/IHRoaXMuc2VsZWN0ZWRTbGlkZS5oZWlnaHQgOiB0aGlzLm1heENlbGxIZWlnaHQ7XG4gICAgICB0aGlzLnZpZXdwb3J0LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLl9nZXRXcmFwU2hpZnRDZWxscyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBvbmx5IGZvciB3cmFwLWFyb3VuZFxuICAgIGlmICghdGhpcy5vcHRpb25zLndyYXBBcm91bmQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIHVuc2hpZnQgcHJldmlvdXMgY2VsbHNcblxuXG4gICAgdGhpcy5fdW5zaGlmdENlbGxzKHRoaXMuYmVmb3JlU2hpZnRDZWxscyk7XG5cbiAgICB0aGlzLl91bnNoaWZ0Q2VsbHModGhpcy5hZnRlclNoaWZ0Q2VsbHMpOyAvLyBnZXQgYmVmb3JlIGNlbGxzXG4gICAgLy8gaW5pdGlhbCBnYXBcblxuXG4gICAgdmFyIGdhcFggPSB0aGlzLmN1cnNvclBvc2l0aW9uO1xuICAgIHZhciBjZWxsSW5kZXggPSB0aGlzLmNlbGxzLmxlbmd0aCAtIDE7XG4gICAgdGhpcy5iZWZvcmVTaGlmdENlbGxzID0gdGhpcy5fZ2V0R2FwQ2VsbHMoZ2FwWCwgY2VsbEluZGV4LCAtMSk7IC8vIGdldCBhZnRlciBjZWxsc1xuICAgIC8vIGVuZGluZyBnYXAgYmV0d2VlbiBsYXN0IGNlbGwgYW5kIGVuZCBvZiBnYWxsZXJ5IHZpZXdwb3J0XG5cbiAgICBnYXBYID0gdGhpcy5zaXplLmlubmVyV2lkdGggLSB0aGlzLmN1cnNvclBvc2l0aW9uOyAvLyBzdGFydCBjbG9uaW5nIGF0IGZpcnN0IGNlbGwsIHdvcmtpbmcgZm9yd2FyZHNcblxuICAgIHRoaXMuYWZ0ZXJTaGlmdENlbGxzID0gdGhpcy5fZ2V0R2FwQ2VsbHMoZ2FwWCwgMCwgMSk7XG4gIH07XG5cbiAgcHJvdG8uX2dldEdhcENlbGxzID0gZnVuY3Rpb24gKGdhcFgsIGNlbGxJbmRleCwgaW5jcmVtZW50KSB7XG4gICAgLy8ga2VlcCBhZGRpbmcgY2VsbHMgdW50aWwgdGhlIGNvdmVyIHRoZSBpbml0aWFsIGdhcFxuICAgIHZhciBjZWxscyA9IFtdO1xuXG4gICAgd2hpbGUgKGdhcFggPiAwKSB7XG4gICAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbHNbY2VsbEluZGV4XTtcblxuICAgICAgaWYgKCFjZWxsKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjZWxscy5wdXNoKGNlbGwpO1xuICAgICAgY2VsbEluZGV4ICs9IGluY3JlbWVudDtcbiAgICAgIGdhcFggLT0gY2VsbC5zaXplLm91dGVyV2lkdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNlbGxzO1xuICB9OyAvLyAtLS0tLSBjb250YWluIC0tLS0tIC8vXG4gIC8vIGNvbnRhaW4gY2VsbCB0YXJnZXRzIHNvIG5vIGV4Y2VzcyBzbGlkaW5nXG5cblxuICBwcm90by5fY29udGFpblNsaWRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5jb250YWluIHx8IHRoaXMub3B0aW9ucy53cmFwQXJvdW5kIHx8ICF0aGlzLmNlbGxzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpc1JpZ2h0VG9MZWZ0ID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0O1xuICAgIHZhciBiZWdpbk1hcmdpbiA9IGlzUmlnaHRUb0xlZnQgPyAnbWFyZ2luUmlnaHQnIDogJ21hcmdpbkxlZnQnO1xuICAgIHZhciBlbmRNYXJnaW4gPSBpc1JpZ2h0VG9MZWZ0ID8gJ21hcmdpbkxlZnQnIDogJ21hcmdpblJpZ2h0JztcbiAgICB2YXIgY29udGVudFdpZHRoID0gdGhpcy5zbGlkZWFibGVXaWR0aCAtIHRoaXMuZ2V0TGFzdENlbGwoKS5zaXplW2VuZE1hcmdpbl07IC8vIGNvbnRlbnQgaXMgbGVzcyB0aGFuIGdhbGxlcnkgc2l6ZVxuXG4gICAgdmFyIGlzQ29udGVudFNtYWxsZXIgPSBjb250ZW50V2lkdGggPCB0aGlzLnNpemUuaW5uZXJXaWR0aDsgLy8gYm91bmRzXG5cbiAgICB2YXIgYmVnaW5Cb3VuZCA9IHRoaXMuY3Vyc29yUG9zaXRpb24gKyB0aGlzLmNlbGxzWzBdLnNpemVbYmVnaW5NYXJnaW5dO1xuICAgIHZhciBlbmRCb3VuZCA9IGNvbnRlbnRXaWR0aCAtIHRoaXMuc2l6ZS5pbm5lcldpZHRoICogKDEgLSB0aGlzLmNlbGxBbGlnbik7IC8vIGNvbnRhaW4gZWFjaCBjZWxsIHRhcmdldFxuXG4gICAgdGhpcy5zbGlkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2xpZGUpIHtcbiAgICAgIGlmIChpc0NvbnRlbnRTbWFsbGVyKSB7XG4gICAgICAgIC8vIGFsbCBjZWxscyBmaXQgaW5zaWRlIGdhbGxlcnlcbiAgICAgICAgc2xpZGUudGFyZ2V0ID0gY29udGVudFdpZHRoICogdGhpcy5jZWxsQWxpZ247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb250YWluIHRvIGJvdW5kc1xuICAgICAgICBzbGlkZS50YXJnZXQgPSBNYXRoLm1heChzbGlkZS50YXJnZXQsIGJlZ2luQm91bmQpO1xuICAgICAgICBzbGlkZS50YXJnZXQgPSBNYXRoLm1pbihzbGlkZS50YXJnZXQsIGVuZEJvdW5kKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGVtaXRzIGV2ZW50cyB2aWEgZXZlbnRFbWl0dGVyIGFuZCBqUXVlcnkgZXZlbnRzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gbmFtZSBvZiBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIG9yaWdpbmFsIGV2ZW50XG4gICAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgLSBleHRyYSBhcmd1bWVudHNcbiAgICovXG5cblxuICBwcm90by5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGV2ZW50LCBhcmdzKSB7XG4gICAgdmFyIGVtaXRBcmdzID0gZXZlbnQgPyBbZXZlbnRdLmNvbmNhdChhcmdzKSA6IGFyZ3M7XG4gICAgdGhpcy5lbWl0RXZlbnQodHlwZSwgZW1pdEFyZ3MpO1xuXG4gICAgaWYgKGpRdWVyeSAmJiB0aGlzLiRlbGVtZW50KSB7XG4gICAgICAvLyBkZWZhdWx0IHRyaWdnZXIgd2l0aCB0eXBlIGlmIG5vIGV2ZW50XG4gICAgICB0eXBlICs9IHRoaXMub3B0aW9ucy5uYW1lc3BhY2VKUXVlcnlFdmVudHMgPyAnLmZsaWNraXR5JyA6ICcnO1xuICAgICAgdmFyICRldmVudCA9IHR5cGU7XG5cbiAgICAgIGlmIChldmVudCkge1xuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIHZhciBqUUV2ZW50ID0galF1ZXJ5LkV2ZW50KGV2ZW50KTtcbiAgICAgICAgalFFdmVudC50eXBlID0gdHlwZTtcbiAgICAgICAgJGV2ZW50ID0galFFdmVudDtcbiAgICAgIH1cblxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCRldmVudCwgYXJncyk7XG4gICAgfVxuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBzZWxlY3QgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQHBhcmFtIHtJbnRlZ2VyfSBpbmRleCAtIGluZGV4IG9mIHRoZSBzbGlkZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzV3JhcCAtIHdpbGwgd3JhcC1hcm91bmQgdG8gbGFzdC9maXJzdCBpZiBhdCB0aGUgZW5kXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbnN0YW50IC0gd2lsbCBpbW1lZGlhdGVseSBzZXQgcG9zaXRpb24gYXQgc2VsZWN0ZWQgY2VsbFxuICAgKi9cblxuXG4gIHByb3RvLnNlbGVjdCA9IGZ1bmN0aW9uIChpbmRleCwgaXNXcmFwLCBpc0luc3RhbnQpIHtcbiAgICBpZiAoIXRoaXMuaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpbmRleCA9IHBhcnNlSW50KGluZGV4LCAxMCk7XG5cbiAgICB0aGlzLl93cmFwU2VsZWN0KGluZGV4KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCB8fCBpc1dyYXApIHtcbiAgICAgIGluZGV4ID0gdXRpbHMubW9kdWxvKGluZGV4LCB0aGlzLnNsaWRlcy5sZW5ndGgpO1xuICAgIH0gLy8gYmFpbCBpZiBpbnZhbGlkIGluZGV4XG5cblxuICAgIGlmICghdGhpcy5zbGlkZXNbaW5kZXhdKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHByZXZJbmRleCA9IHRoaXMuc2VsZWN0ZWRJbmRleDtcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICB0aGlzLnVwZGF0ZVNlbGVjdGVkU2xpZGUoKTtcblxuICAgIGlmIChpc0luc3RhbnQpIHtcbiAgICAgIHRoaXMucG9zaXRpb25TbGlkZXJBdFNlbGVjdGVkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhcnRBbmltYXRpb24oKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmFkYXB0aXZlSGVpZ2h0KSB7XG4gICAgICB0aGlzLnNldEdhbGxlcnlTaXplKCk7XG4gICAgfSAvLyBldmVudHNcblxuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdzZWxlY3QnLCBudWxsLCBbaW5kZXhdKTsgLy8gY2hhbmdlIGV2ZW50IGlmIG5ldyBpbmRleFxuXG4gICAgaWYgKGluZGV4ICE9IHByZXZJbmRleCkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdjaGFuZ2UnLCBudWxsLCBbaW5kZXhdKTtcbiAgICB9IC8vIG9sZCB2MSBldmVudCBuYW1lLCByZW1vdmUgaW4gdjNcblxuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdjZWxsU2VsZWN0Jyk7XG4gIH07IC8vIHdyYXBzIHBvc2l0aW9uIGZvciB3cmFwQXJvdW5kLCB0byBtb3ZlIHRvIGNsb3Nlc3Qgc2xpZGUuICMxMTNcblxuXG4gIHByb3RvLl93cmFwU2VsZWN0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgdmFyIGxlbiA9IHRoaXMuc2xpZGVzLmxlbmd0aDtcbiAgICB2YXIgaXNXcmFwcGluZyA9IHRoaXMub3B0aW9ucy53cmFwQXJvdW5kICYmIGxlbiA+IDE7XG5cbiAgICBpZiAoIWlzV3JhcHBpbmcpIHtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG5cbiAgICB2YXIgd3JhcEluZGV4ID0gdXRpbHMubW9kdWxvKGluZGV4LCBsZW4pOyAvLyBnbyB0byBzaG9ydGVzdFxuXG4gICAgdmFyIGRlbHRhID0gTWF0aC5hYnMod3JhcEluZGV4IC0gdGhpcy5zZWxlY3RlZEluZGV4KTtcbiAgICB2YXIgYmFja1dyYXBEZWx0YSA9IE1hdGguYWJzKHdyYXBJbmRleCArIGxlbiAtIHRoaXMuc2VsZWN0ZWRJbmRleCk7XG4gICAgdmFyIGZvcmV3YXJkV3JhcERlbHRhID0gTWF0aC5hYnMod3JhcEluZGV4IC0gbGVuIC0gdGhpcy5zZWxlY3RlZEluZGV4KTtcblxuICAgIGlmICghdGhpcy5pc0RyYWdTZWxlY3QgJiYgYmFja1dyYXBEZWx0YSA8IGRlbHRhKSB7XG4gICAgICBpbmRleCArPSBsZW47XG4gICAgfSBlbHNlIGlmICghdGhpcy5pc0RyYWdTZWxlY3QgJiYgZm9yZXdhcmRXcmFwRGVsdGEgPCBkZWx0YSkge1xuICAgICAgaW5kZXggLT0gbGVuO1xuICAgIH0gLy8gd3JhcCBwb3NpdGlvbiBzbyBzbGlkZXIgaXMgd2l0aGluIG5vcm1hbCBhcmVhXG5cblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIHRoaXMueCAtPSB0aGlzLnNsaWRlYWJsZVdpZHRoO1xuICAgIH0gZWxzZSBpZiAoaW5kZXggPj0gbGVuKSB7XG4gICAgICB0aGlzLnggKz0gdGhpcy5zbGlkZWFibGVXaWR0aDtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8ucHJldmlvdXMgPSBmdW5jdGlvbiAoaXNXcmFwLCBpc0luc3RhbnQpIHtcbiAgICB0aGlzLnNlbGVjdCh0aGlzLnNlbGVjdGVkSW5kZXggLSAxLCBpc1dyYXAsIGlzSW5zdGFudCk7XG4gIH07XG5cbiAgcHJvdG8ubmV4dCA9IGZ1bmN0aW9uIChpc1dyYXAsIGlzSW5zdGFudCkge1xuICAgIHRoaXMuc2VsZWN0KHRoaXMuc2VsZWN0ZWRJbmRleCArIDEsIGlzV3JhcCwgaXNJbnN0YW50KTtcbiAgfTtcblxuICBwcm90by51cGRhdGVTZWxlY3RlZFNsaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzbGlkZSA9IHRoaXMuc2xpZGVzW3RoaXMuc2VsZWN0ZWRJbmRleF07IC8vIHNlbGVjdGVkSW5kZXggY291bGQgYmUgb3V0c2lkZSBvZiBzbGlkZXMsIGlmIHRyaWdnZXJlZCBiZWZvcmUgcmVzaXplKClcblxuICAgIGlmICghc2xpZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIHVuc2VsZWN0IHByZXZpb3VzIHNlbGVjdGVkIHNsaWRlXG5cblxuICAgIHRoaXMudW5zZWxlY3RTZWxlY3RlZFNsaWRlKCk7IC8vIHVwZGF0ZSBuZXcgc2VsZWN0ZWQgc2xpZGVcblxuICAgIHRoaXMuc2VsZWN0ZWRTbGlkZSA9IHNsaWRlO1xuICAgIHNsaWRlLnNlbGVjdCgpO1xuICAgIHRoaXMuc2VsZWN0ZWRDZWxscyA9IHNsaWRlLmNlbGxzO1xuICAgIHRoaXMuc2VsZWN0ZWRFbGVtZW50cyA9IHNsaWRlLmdldENlbGxFbGVtZW50cygpOyAvLyBIQUNLOiBzZWxlY3RlZENlbGwgJiBzZWxlY3RlZEVsZW1lbnQgaXMgZmlyc3QgY2VsbCBpbiBzbGlkZSwgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICAvLyBSZW1vdmUgaW4gdjM/XG5cbiAgICB0aGlzLnNlbGVjdGVkQ2VsbCA9IHNsaWRlLmNlbGxzWzBdO1xuICAgIHRoaXMuc2VsZWN0ZWRFbGVtZW50ID0gdGhpcy5zZWxlY3RlZEVsZW1lbnRzWzBdO1xuICB9O1xuXG4gIHByb3RvLnVuc2VsZWN0U2VsZWN0ZWRTbGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZFNsaWRlKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkU2xpZGUudW5zZWxlY3QoKTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uc2VsZWN0SW5pdGlhbEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbml0aWFsSW5kZXggPSB0aGlzLm9wdGlvbnMuaW5pdGlhbEluZGV4OyAvLyBhbHJlYWR5IGFjdGl2YXRlZCwgc2VsZWN0IHByZXZpb3VzIHNlbGVjdGVkSW5kZXhcblxuICAgIGlmICh0aGlzLmlzSW5pdEFjdGl2YXRlZCkge1xuICAgICAgdGhpcy5zZWxlY3QodGhpcy5zZWxlY3RlZEluZGV4LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBzZWxlY3Qgd2l0aCBzZWxlY3RvciBzdHJpbmdcblxuXG4gICAgaWYgKGluaXRpYWxJbmRleCAmJiB0eXBlb2YgaW5pdGlhbEluZGV4ID09ICdzdHJpbmcnKSB7XG4gICAgICB2YXIgY2VsbCA9IHRoaXMucXVlcnlDZWxsKGluaXRpYWxJbmRleCk7XG5cbiAgICAgIGlmIChjZWxsKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0Q2VsbChpbml0aWFsSW5kZXgsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBpbmRleCA9IDA7IC8vIHNlbGVjdCB3aXRoIG51bWJlclxuXG4gICAgaWYgKGluaXRpYWxJbmRleCAmJiB0aGlzLnNsaWRlc1tpbml0aWFsSW5kZXhdKSB7XG4gICAgICBpbmRleCA9IGluaXRpYWxJbmRleDtcbiAgICB9IC8vIHNlbGVjdCBpbnN0YW50bHlcblxuXG4gICAgdGhpcy5zZWxlY3QoaW5kZXgsIGZhbHNlLCB0cnVlKTtcbiAgfTtcbiAgLyoqXG4gICAqIHNlbGVjdCBzbGlkZSBmcm9tIG51bWJlciBvciBjZWxsIGVsZW1lbnRcbiAgICogQHBhcmFtIHtFbGVtZW50IG9yIE51bWJlcn0gZWxlbVxuICAgKi9cblxuXG4gIHByb3RvLnNlbGVjdENlbGwgPSBmdW5jdGlvbiAodmFsdWUsIGlzV3JhcCwgaXNJbnN0YW50KSB7XG4gICAgLy8gZ2V0IGNlbGxcbiAgICB2YXIgY2VsbCA9IHRoaXMucXVlcnlDZWxsKHZhbHVlKTtcblxuICAgIGlmICghY2VsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0Q2VsbFNsaWRlSW5kZXgoY2VsbCk7XG4gICAgdGhpcy5zZWxlY3QoaW5kZXgsIGlzV3JhcCwgaXNJbnN0YW50KTtcbiAgfTtcblxuICBwcm90by5nZXRDZWxsU2xpZGVJbmRleCA9IGZ1bmN0aW9uIChjZWxsKSB7XG4gICAgLy8gZ2V0IGluZGV4IG9mIHNsaWRlcyB0aGF0IGhhcyBjZWxsXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNsaWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNsaWRlID0gdGhpcy5zbGlkZXNbaV07XG4gICAgICB2YXIgaW5kZXggPSBzbGlkZS5jZWxscy5pbmRleE9mKGNlbGwpO1xuXG4gICAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgfVxuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBnZXQgY2VsbHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogZ2V0IEZsaWNraXR5LkNlbGwsIGdpdmVuIGFuIEVsZW1lbnRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gICAqIEByZXR1cm5zIHtGbGlja2l0eS5DZWxsfSBpdGVtXG4gICAqL1xuXG5cbiAgcHJvdG8uZ2V0Q2VsbCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgLy8gbG9vcCB0aHJvdWdoIGNlbGxzIHRvIGdldCB0aGUgb25lIHRoYXQgbWF0Y2hlc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNlbGwgPSB0aGlzLmNlbGxzW2ldO1xuXG4gICAgICBpZiAoY2VsbC5lbGVtZW50ID09IGVsZW0pIHtcbiAgICAgICAgcmV0dXJuIGNlbGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogZ2V0IGNvbGxlY3Rpb24gb2YgRmxpY2tpdHkuQ2VsbHMsIGdpdmVuIEVsZW1lbnRzXG4gICAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGNlbGxzIC0gRmxpY2tpdHkuQ2VsbHNcbiAgICovXG5cblxuICBwcm90by5nZXRDZWxscyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KGVsZW1zKTtcbiAgICB2YXIgY2VsbHMgPSBbXTtcbiAgICBlbGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbChlbGVtKTtcblxuICAgICAgaWYgKGNlbGwpIHtcbiAgICAgICAgY2VsbHMucHVzaChjZWxsKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gY2VsbHM7XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgY2VsbCBlbGVtZW50c1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGNlbGxFbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLmdldENlbGxFbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5jZWxscy5tYXAoZnVuY3Rpb24gKGNlbGwpIHtcbiAgICAgIHJldHVybiBjZWxsLmVsZW1lbnQ7XG4gICAgfSk7XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgcGFyZW50IGNlbGwgZnJvbSBhbiBlbGVtZW50XG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICAgKiBAcmV0dXJucyB7RmxpY2tpdC5DZWxsfSBjZWxsXG4gICAqL1xuXG5cbiAgcHJvdG8uZ2V0UGFyZW50Q2VsbCA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgLy8gZmlyc3QgY2hlY2sgaWYgZWxlbSBpcyBjZWxsXG4gICAgdmFyIGNlbGwgPSB0aGlzLmdldENlbGwoZWxlbSk7XG5cbiAgICBpZiAoY2VsbCkge1xuICAgICAgcmV0dXJuIGNlbGw7XG4gICAgfSAvLyB0cnkgdG8gZ2V0IHBhcmVudCBjZWxsIGVsZW1cblxuXG4gICAgZWxlbSA9IHV0aWxzLmdldFBhcmVudChlbGVtLCAnLmZsaWNraXR5LXNsaWRlciA+IConKTtcbiAgICByZXR1cm4gdGhpcy5nZXRDZWxsKGVsZW0pO1xuICB9O1xuICAvKipcbiAgICogZ2V0IGNlbGxzIGFkamFjZW50IHRvIGEgc2xpZGVcbiAgICogQHBhcmFtIHtJbnRlZ2VyfSBhZGpDb3VudCAtIG51bWJlciBvZiBhZGphY2VudCBzbGlkZXNcbiAgICogQHBhcmFtIHtJbnRlZ2VyfSBpbmRleCAtIGluZGV4IG9mIHNsaWRlIHRvIHN0YXJ0XG4gICAqIEByZXR1cm5zIHtBcnJheX0gY2VsbHMgLSBhcnJheSBvZiBGbGlja2l0eS5DZWxsc1xuICAgKi9cblxuXG4gIHByb3RvLmdldEFkamFjZW50Q2VsbEVsZW1lbnRzID0gZnVuY3Rpb24gKGFkakNvdW50LCBpbmRleCkge1xuICAgIGlmICghYWRqQ291bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdGVkU2xpZGUuZ2V0Q2VsbEVsZW1lbnRzKCk7XG4gICAgfVxuXG4gICAgaW5kZXggPSBpbmRleCA9PT0gdW5kZWZpbmVkID8gdGhpcy5zZWxlY3RlZEluZGV4IDogaW5kZXg7XG4gICAgdmFyIGxlbiA9IHRoaXMuc2xpZGVzLmxlbmd0aDtcblxuICAgIGlmICgxICsgYWRqQ291bnQgKiAyID49IGxlbikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2VsbEVsZW1lbnRzKCk7XG4gICAgfVxuXG4gICAgdmFyIGNlbGxFbGVtcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IGluZGV4IC0gYWRqQ291bnQ7IGkgPD0gaW5kZXggKyBhZGpDb3VudDsgaSsrKSB7XG4gICAgICB2YXIgc2xpZGVJbmRleCA9IHRoaXMub3B0aW9ucy53cmFwQXJvdW5kID8gdXRpbHMubW9kdWxvKGksIGxlbikgOiBpO1xuICAgICAgdmFyIHNsaWRlID0gdGhpcy5zbGlkZXNbc2xpZGVJbmRleF07XG5cbiAgICAgIGlmIChzbGlkZSkge1xuICAgICAgICBjZWxsRWxlbXMgPSBjZWxsRWxlbXMuY29uY2F0KHNsaWRlLmdldENlbGxFbGVtZW50cygpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2VsbEVsZW1zO1xuICB9O1xuICAvKipcbiAgICogc2VsZWN0IHNsaWRlIGZyb20gbnVtYmVyIG9yIGNlbGwgZWxlbWVudFxuICAgKiBAcGFyYW0ge0VsZW1lbnQsIFNlbGVjdG9yIFN0cmluZywgb3IgTnVtYmVyfSBzZWxlY3RvclxuICAgKi9cblxuXG4gIHByb3RvLnF1ZXJ5Q2VsbCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT0gJ251bWJlcicpIHtcbiAgICAgIC8vIHVzZSBudW1iZXIgYXMgaW5kZXhcbiAgICAgIHJldHVybiB0aGlzLmNlbGxzW3NlbGVjdG9yXTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBkbyBub3Qgc2VsZWN0IGludmFsaWQgc2VsZWN0b3JzIGZyb20gaGFzaDogIzEyMywgIy8uICM3OTFcbiAgICAgIGlmIChzZWxlY3Rvci5tYXRjaCgvXlsjXFwuXT9bXFxkXFwvXS8pKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gLy8gdXNlIHN0cmluZyBhcyBzZWxlY3RvciwgZ2V0IGVsZW1lbnRcblxuXG4gICAgICBzZWxlY3RvciA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICB9IC8vIGdldCBjZWxsIGZyb20gZWxlbWVudFxuXG5cbiAgICByZXR1cm4gdGhpcy5nZXRDZWxsKHNlbGVjdG9yKTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZXZlbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICBwcm90by51aUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmVtaXRFdmVudCgndWlDaGFuZ2UnKTtcbiAgfTsgLy8ga2VlcCBmb2N1cyBvbiBlbGVtZW50IHdoZW4gY2hpbGQgVUkgZWxlbWVudHMgYXJlIGNsaWNrZWRcblxuXG4gIHByb3RvLmNoaWxkVUlQb2ludGVyRG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIC8vIEhBQ0sgaU9TIGRvZXMgbm90IGFsbG93IHRvdWNoIGV2ZW50cyB0byBidWJibGUgdXA/IVxuICAgIGlmIChldmVudC50eXBlICE9ICd0b3VjaHN0YXJ0Jykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmZvY3VzKCk7XG4gIH07IC8vIC0tLS0tIHJlc2l6ZSAtLS0tLSAvL1xuXG5cbiAgcHJvdG8ub25yZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy53YXRjaENTUygpO1xuICAgIHRoaXMucmVzaXplKCk7XG4gIH07XG5cbiAgdXRpbHMuZGVib3VuY2VNZXRob2QoRmxpY2tpdHksICdvbnJlc2l6ZScsIDE1MCk7XG5cbiAgcHJvdG8ucmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc0FjdGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0U2l6ZSgpOyAvLyB3cmFwIHZhbHVlc1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy53cmFwQXJvdW5kKSB7XG4gICAgICB0aGlzLnggPSB1dGlscy5tb2R1bG8odGhpcy54LCB0aGlzLnNsaWRlYWJsZVdpZHRoKTtcbiAgICB9XG5cbiAgICB0aGlzLnBvc2l0aW9uQ2VsbHMoKTtcblxuICAgIHRoaXMuX2dldFdyYXBTaGlmdENlbGxzKCk7XG5cbiAgICB0aGlzLnNldEdhbGxlcnlTaXplKCk7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ3Jlc2l6ZScpOyAvLyB1cGRhdGUgc2VsZWN0ZWQgaW5kZXggZm9yIGdyb3VwIHNsaWRlcywgaW5zdGFudFxuICAgIC8vIFRPRE86IHBvc2l0aW9uIGNhbiBiZSBsb3N0IGJldHdlZW4gZ3JvdXBzIG9mIHZhcmlvdXMgbnVtYmVyc1xuXG4gICAgdmFyIHNlbGVjdGVkRWxlbWVudCA9IHRoaXMuc2VsZWN0ZWRFbGVtZW50cyAmJiB0aGlzLnNlbGVjdGVkRWxlbWVudHNbMF07XG4gICAgdGhpcy5zZWxlY3RDZWxsKHNlbGVjdGVkRWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICB9OyAvLyB3YXRjaGVzIHRoZSA6YWZ0ZXIgcHJvcGVydHksIGFjdGl2YXRlcy9kZWFjdGl2YXRlc1xuXG5cbiAgcHJvdG8ud2F0Y2hDU1MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHdhdGNoT3B0aW9uID0gdGhpcy5vcHRpb25zLndhdGNoQ1NTO1xuXG4gICAgaWYgKCF3YXRjaE9wdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhZnRlckNvbnRlbnQgPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCwgJzphZnRlcicpLmNvbnRlbnQ7IC8vIGFjdGl2YXRlIGlmIDphZnRlciB7IGNvbnRlbnQ6ICdmbGlja2l0eScgfVxuXG4gICAgaWYgKGFmdGVyQ29udGVudC5pbmRleE9mKCdmbGlja2l0eScpICE9IC0xKSB7XG4gICAgICB0aGlzLmFjdGl2YXRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICAgIH1cbiAgfTsgLy8gLS0tLS0ga2V5ZG93biAtLS0tLSAvL1xuICAvLyBnbyBwcmV2aW91cy9uZXh0IGlmIGxlZnQvcmlnaHQga2V5cyBwcmVzc2VkXG5cblxuICBwcm90by5vbmtleWRvd24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAvLyBvbmx5IHdvcmsgaWYgZWxlbWVudCBpcyBpbiBmb2N1c1xuICAgIHZhciBpc05vdEZvY3VzZWQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT0gdGhpcy5lbGVtZW50O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuYWNjZXNzaWJpbGl0eSB8fCBpc05vdEZvY3VzZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlciA9IEZsaWNraXR5LmtleWJvYXJkSGFuZGxlcnNbZXZlbnQua2V5Q29kZV07XG5cbiAgICBpZiAoaGFuZGxlcikge1xuICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfTtcblxuICBGbGlja2l0eS5rZXlib2FyZEhhbmRsZXJzID0ge1xuICAgIC8vIGxlZnQgYXJyb3dcbiAgICAzNzogZnVuY3Rpb24gXygpIHtcbiAgICAgIHZhciBsZWZ0TWV0aG9kID0gdGhpcy5vcHRpb25zLnJpZ2h0VG9MZWZ0ID8gJ25leHQnIDogJ3ByZXZpb3VzJztcbiAgICAgIHRoaXMudWlDaGFuZ2UoKTtcbiAgICAgIHRoaXNbbGVmdE1ldGhvZF0oKTtcbiAgICB9LFxuICAgIC8vIHJpZ2h0IGFycm93XG4gICAgMzk6IGZ1bmN0aW9uIF8oKSB7XG4gICAgICB2YXIgcmlnaHRNZXRob2QgPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAncHJldmlvdXMnIDogJ25leHQnO1xuICAgICAgdGhpcy51aUNoYW5nZSgpO1xuICAgICAgdGhpc1tyaWdodE1ldGhvZF0oKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tIGZvY3VzIC0tLS0tIC8vXG5cbiAgcHJvdG8uZm9jdXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gVE9ETyByZW1vdmUgc2Nyb2xsVG8gb25jZSBmb2N1cyBvcHRpb25zIGdldHMgbW9yZSBzdXBwb3J0XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50L2ZvY3VzI0Jyb3dzZXJfY29tcGF0aWJpbGl0eVxuICAgIHZhciBwcmV2U2Nyb2xsWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICB0aGlzLmVsZW1lbnQuZm9jdXMoe1xuICAgICAgcHJldmVudFNjcm9sbDogdHJ1ZVxuICAgIH0pOyAvLyBoYWNrIHRvIGZpeCBzY3JvbGwganVtcCBhZnRlciBmb2N1cywgIzc2XG5cbiAgICBpZiAod2luZG93LnBhZ2VZT2Zmc2V0ICE9IHByZXZTY3JvbGxZKSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8od2luZG93LnBhZ2VYT2Zmc2V0LCBwcmV2U2Nyb2xsWSk7XG4gICAgfVxuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkZXN0cm95IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIGRlYWN0aXZhdGUgYWxsIEZsaWNraXR5IGZ1bmN0aW9uYWxpdHksIGJ1dCBrZWVwIHN0dWZmIGF2YWlsYWJsZVxuXG5cbiAgcHJvdG8uZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNBY3RpdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnZmxpY2tpdHktZW5hYmxlZCcpO1xuICAgIHRoaXMuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdmbGlja2l0eS1ydGwnKTtcbiAgICB0aGlzLnVuc2VsZWN0U2VsZWN0ZWRTbGlkZSgpOyAvLyBkZXN0cm95IGNlbGxzXG5cbiAgICB0aGlzLmNlbGxzLmZvckVhY2goZnVuY3Rpb24gKGNlbGwpIHtcbiAgICAgIGNlbGwuZGVzdHJveSgpO1xuICAgIH0pO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLnZpZXdwb3J0KTsgLy8gbW92ZSBjaGlsZCBlbGVtZW50cyBiYWNrIGludG8gZWxlbWVudFxuXG4gICAgbW92ZUVsZW1lbnRzKHRoaXMuc2xpZGVyLmNoaWxkcmVuLCB0aGlzLmVsZW1lbnQpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hY2Nlc3NpYmlsaXR5KSB7XG4gICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJJbmRleCcpO1xuICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzKTtcbiAgICB9IC8vIHNldCBmbGFnc1xuXG5cbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ2RlYWN0aXZhdGUnKTtcbiAgfTtcblxuICBwcm90by5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzKTtcbiAgICB0aGlzLmFsbE9mZigpO1xuICAgIHRoaXMuZW1pdEV2ZW50KCdkZXN0cm95Jyk7XG5cbiAgICBpZiAoalF1ZXJ5ICYmIHRoaXMuJGVsZW1lbnQpIHtcbiAgICAgIGpRdWVyeS5yZW1vdmVEYXRhKHRoaXMuZWxlbWVudCwgJ2ZsaWNraXR5Jyk7XG4gICAgfVxuXG4gICAgZGVsZXRlIHRoaXMuZWxlbWVudC5mbGlja2l0eUdVSUQ7XG4gICAgZGVsZXRlIGluc3RhbmNlc1t0aGlzLmd1aWRdO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwcm90b3R5cGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIHV0aWxzLmV4dGVuZChwcm90bywgYW5pbWF0ZVByb3RvdHlwZSk7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGV4dHJhcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBnZXQgRmxpY2tpdHkgaW5zdGFuY2UgZnJvbSBlbGVtZW50XG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbVxuICAgKiBAcmV0dXJucyB7RmxpY2tpdHl9XG4gICAqL1xuXG4gIEZsaWNraXR5LmRhdGEgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIGVsZW0gPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoZWxlbSk7XG4gICAgdmFyIGlkID0gZWxlbSAmJiBlbGVtLmZsaWNraXR5R1VJRDtcbiAgICByZXR1cm4gaWQgJiYgaW5zdGFuY2VzW2lkXTtcbiAgfTtcblxuICB1dGlscy5odG1sSW5pdChGbGlja2l0eSwgJ2ZsaWNraXR5Jyk7XG5cbiAgaWYgKGpRdWVyeSAmJiBqUXVlcnkuYnJpZGdldCkge1xuICAgIGpRdWVyeS5icmlkZ2V0KCdmbGlja2l0eScsIEZsaWNraXR5KTtcbiAgfSAvLyBzZXQgaW50ZXJuYWwgalF1ZXJ5LCBmb3IgV2VicGFjayArIGpRdWVyeSB2MywgIzQ3OFxuXG5cbiAgRmxpY2tpdHkuc2V0SlF1ZXJ5ID0gZnVuY3Rpb24gKGpxKSB7XG4gICAgalF1ZXJ5ID0ganE7XG4gIH07XG5cbiAgRmxpY2tpdHkuQ2VsbCA9IENlbGw7XG4gIEZsaWNraXR5LlNsaWRlID0gU2xpZGU7XG4gIHJldHVybiBGbGlja2l0eTtcbn0pO1xuLyohXG4gKiBVbmlwb2ludGVyIHYyLjMuMFxuICogYmFzZSBjbGFzcyBmb3IgZG9pbmcgb25lIHRoaW5nIHdpdGggcG9pbnRlciBldmVudFxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlLCBzdHJpY3Q6IHRydWUgKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qZ2xvYmFsIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgndW5pcG9pbnRlci91bmlwb2ludGVyJywgWydldi1lbWl0dGVyL2V2LWVtaXR0ZXInXSwgZnVuY3Rpb24gKEV2RW1pdHRlcikge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkod2luZG93LCBFdkVtaXR0ZXIpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3csIHJlcXVpcmUoJ2V2LWVtaXR0ZXInKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuVW5pcG9pbnRlciA9IGZhY3Rvcnkod2luZG93LCB3aW5kb3cuRXZFbWl0dGVyKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KHdpbmRvdywgRXZFbWl0dGVyKSB7XG4gIGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4gIGZ1bmN0aW9uIFVuaXBvaW50ZXIoKSB7fSAvLyBpbmhlcml0IEV2RW1pdHRlclxuXG5cbiAgdmFyIHByb3RvID0gVW5pcG9pbnRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2RW1pdHRlci5wcm90b3R5cGUpO1xuXG4gIHByb3RvLmJpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICB0aGlzLl9iaW5kU3RhcnRFdmVudChlbGVtLCB0cnVlKTtcbiAgfTtcblxuICBwcm90by51bmJpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICB0aGlzLl9iaW5kU3RhcnRFdmVudChlbGVtLCBmYWxzZSk7XG4gIH07XG4gIC8qKlxuICAgKiBBZGQgb3IgcmVtb3ZlIHN0YXJ0IGV2ZW50XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNBZGQgLSByZW1vdmUgaWYgZmFsc2V5XG4gICAqL1xuXG5cbiAgcHJvdG8uX2JpbmRTdGFydEV2ZW50ID0gZnVuY3Rpb24gKGVsZW0sIGlzQWRkKSB7XG4gICAgLy8gbXVuZ2UgaXNBZGQsIGRlZmF1bHQgdG8gdHJ1ZVxuICAgIGlzQWRkID0gaXNBZGQgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBpc0FkZDtcbiAgICB2YXIgYmluZE1ldGhvZCA9IGlzQWRkID8gJ2FkZEV2ZW50TGlzdGVuZXInIDogJ3JlbW92ZUV2ZW50TGlzdGVuZXInOyAvLyBkZWZhdWx0IHRvIG1vdXNlIGV2ZW50c1xuXG4gICAgdmFyIHN0YXJ0RXZlbnQgPSAnbW91c2Vkb3duJztcblxuICAgIGlmICh3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgICAvLyBQb2ludGVyIEV2ZW50c1xuICAgICAgc3RhcnRFdmVudCA9ICdwb2ludGVyZG93bic7XG4gICAgfSBlbHNlIGlmICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHtcbiAgICAgIC8vIFRvdWNoIEV2ZW50cy4gaU9TIFNhZmFyaVxuICAgICAgc3RhcnRFdmVudCA9ICd0b3VjaHN0YXJ0JztcbiAgICB9XG5cbiAgICBlbGVtW2JpbmRNZXRob2RdKHN0YXJ0RXZlbnQsIHRoaXMpO1xuICB9OyAvLyB0cmlnZ2VyIGhhbmRsZXIgbWV0aG9kcyBmb3IgZXZlbnRzXG5cblxuICBwcm90by5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcblxuICAgIGlmICh0aGlzW21ldGhvZF0pIHtcbiAgICAgIHRoaXNbbWV0aG9kXShldmVudCk7XG4gICAgfVxuICB9OyAvLyByZXR1cm5zIHRoZSB0b3VjaCB0aGF0IHdlJ3JlIGtlZXBpbmcgdHJhY2sgb2ZcblxuXG4gIHByb3RvLmdldFRvdWNoID0gZnVuY3Rpb24gKHRvdWNoZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b3VjaCA9IHRvdWNoZXNbaV07XG5cbiAgICAgIGlmICh0b3VjaC5pZGVudGlmaWVyID09IHRoaXMucG9pbnRlcklkZW50aWZpZXIpIHtcbiAgICAgICAgcmV0dXJuIHRvdWNoO1xuICAgICAgfVxuICAgIH1cbiAgfTsgLy8gLS0tLS0gc3RhcnQgZXZlbnQgLS0tLS0gLy9cblxuXG4gIHByb3RvLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgLy8gZGlzbWlzcyBjbGlja3MgZnJvbSByaWdodCBvciBtaWRkbGUgYnV0dG9uc1xuICAgIHZhciBidXR0b24gPSBldmVudC5idXR0b247XG5cbiAgICBpZiAoYnV0dG9uICYmIGJ1dHRvbiAhPT0gMCAmJiBidXR0b24gIT09IDEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9wb2ludGVyRG93bihldmVudCwgZXZlbnQpO1xuICB9O1xuXG4gIHByb3RvLm9udG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXMuX3BvaW50ZXJEb3duKGV2ZW50LCBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gIH07XG5cbiAgcHJvdG8ub25wb2ludGVyZG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXMuX3BvaW50ZXJEb3duKGV2ZW50LCBldmVudCk7XG4gIH07XG4gIC8qKlxuICAgKiBwb2ludGVyIHN0YXJ0XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnQgb3IgVG91Y2h9IHBvaW50ZXJcbiAgICovXG5cblxuICBwcm90by5fcG9pbnRlckRvd24gPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICAvLyBkaXNtaXNzIHJpZ2h0IGNsaWNrIGFuZCBvdGhlciBwb2ludGVyc1xuICAgIC8vIGJ1dHRvbiA9IDAgaXMgb2theSwgMS00IG5vdFxuICAgIGlmIChldmVudC5idXR0b24gfHwgdGhpcy5pc1BvaW50ZXJEb3duKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pc1BvaW50ZXJEb3duID0gdHJ1ZTsgLy8gc2F2ZSBwb2ludGVyIGlkZW50aWZpZXIgdG8gbWF0Y2ggdXAgdG91Y2ggZXZlbnRzXG5cbiAgICB0aGlzLnBvaW50ZXJJZGVudGlmaWVyID0gcG9pbnRlci5wb2ludGVySWQgIT09IHVuZGVmaW5lZCA/IC8vIHBvaW50ZXJJZCBmb3IgcG9pbnRlciBldmVudHMsIHRvdWNoLmluZGVudGlmaWVyIGZvciB0b3VjaCBldmVudHNcbiAgICBwb2ludGVyLnBvaW50ZXJJZCA6IHBvaW50ZXIuaWRlbnRpZmllcjtcbiAgICB0aGlzLnBvaW50ZXJEb3duKGV2ZW50LCBwb2ludGVyKTtcbiAgfTtcblxuICBwcm90by5wb2ludGVyRG93biA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIHRoaXMuX2JpbmRQb3N0U3RhcnRFdmVudHMoZXZlbnQpO1xuXG4gICAgdGhpcy5lbWl0RXZlbnQoJ3BvaW50ZXJEb3duJywgW2V2ZW50LCBwb2ludGVyXSk7XG4gIH07IC8vIGhhc2ggb2YgZXZlbnRzIHRvIGJlIGJvdW5kIGFmdGVyIHN0YXJ0IGV2ZW50XG5cblxuICB2YXIgcG9zdFN0YXJ0RXZlbnRzID0ge1xuICAgIG1vdXNlZG93bjogWydtb3VzZW1vdmUnLCAnbW91c2V1cCddLFxuICAgIHRvdWNoc3RhcnQ6IFsndG91Y2htb3ZlJywgJ3RvdWNoZW5kJywgJ3RvdWNoY2FuY2VsJ10sXG4gICAgcG9pbnRlcmRvd246IFsncG9pbnRlcm1vdmUnLCAncG9pbnRlcnVwJywgJ3BvaW50ZXJjYW5jZWwnXVxuICB9O1xuXG4gIHByb3RvLl9iaW5kUG9zdFN0YXJ0RXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgaWYgKCFldmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gZ2V0IHByb3BlciBldmVudHMgdG8gbWF0Y2ggc3RhcnQgZXZlbnRcblxuXG4gICAgdmFyIGV2ZW50cyA9IHBvc3RTdGFydEV2ZW50c1tldmVudC50eXBlXTsgLy8gYmluZCBldmVudHMgdG8gbm9kZVxuXG4gICAgZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzKTtcbiAgICB9LCB0aGlzKTsgLy8gc2F2ZSB0aGVzZSBhcmd1bWVudHNcblxuICAgIHRoaXMuX2JvdW5kUG9pbnRlckV2ZW50cyA9IGV2ZW50cztcbiAgfTtcblxuICBwcm90by5fdW5iaW5kUG9zdFN0YXJ0RXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGNoZWNrIGZvciBfYm91bmRFdmVudHMsIGluIGNhc2UgZHJhZ0VuZCB0cmlnZ2VyZWQgdHdpY2UgKG9sZCBJRTggYnVnKVxuICAgIGlmICghdGhpcy5fYm91bmRQb2ludGVyRXZlbnRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fYm91bmRQb2ludGVyRXZlbnRzLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIGRlbGV0ZSB0aGlzLl9ib3VuZFBvaW50ZXJFdmVudHM7XG4gIH07IC8vIC0tLS0tIG1vdmUgZXZlbnQgLS0tLS0gLy9cblxuXG4gIHByb3RvLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdGhpcy5fcG9pbnRlck1vdmUoZXZlbnQsIGV2ZW50KTtcbiAgfTtcblxuICBwcm90by5vbnBvaW50ZXJtb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnBvaW50ZXJJZCA9PSB0aGlzLnBvaW50ZXJJZGVudGlmaWVyKSB7XG4gICAgICB0aGlzLl9wb2ludGVyTW92ZShldmVudCwgZXZlbnQpO1xuICAgIH1cbiAgfTtcblxuICBwcm90by5vbnRvdWNobW92ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciB0b3VjaCA9IHRoaXMuZ2V0VG91Y2goZXZlbnQuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgaWYgKHRvdWNoKSB7XG4gICAgICB0aGlzLl9wb2ludGVyTW92ZShldmVudCwgdG91Y2gpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIHBvaW50ZXIgbW92ZVxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG5cbiAgcHJvdG8uX3BvaW50ZXJNb3ZlID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5wb2ludGVyTW92ZShldmVudCwgcG9pbnRlcik7XG4gIH07IC8vIHB1YmxpY1xuXG5cbiAgcHJvdG8ucG9pbnRlck1vdmUgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICB0aGlzLmVtaXRFdmVudCgncG9pbnRlck1vdmUnLCBbZXZlbnQsIHBvaW50ZXJdKTtcbiAgfTsgLy8gLS0tLS0gZW5kIGV2ZW50IC0tLS0tIC8vXG5cblxuICBwcm90by5vbm1vdXNldXAgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLl9wb2ludGVyVXAoZXZlbnQsIGV2ZW50KTtcbiAgfTtcblxuICBwcm90by5vbnBvaW50ZXJ1cCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmIChldmVudC5wb2ludGVySWQgPT0gdGhpcy5wb2ludGVySWRlbnRpZmllcikge1xuICAgICAgdGhpcy5fcG9pbnRlclVwKGV2ZW50LCBldmVudCk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLm9udG91Y2hlbmQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgdG91Y2ggPSB0aGlzLmdldFRvdWNoKGV2ZW50LmNoYW5nZWRUb3VjaGVzKTtcblxuICAgIGlmICh0b3VjaCkge1xuICAgICAgdGhpcy5fcG9pbnRlclVwKGV2ZW50LCB0b3VjaCk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogcG9pbnRlciB1cFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG5cbiAgcHJvdG8uX3BvaW50ZXJVcCA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIHRoaXMuX3BvaW50ZXJEb25lKCk7XG5cbiAgICB0aGlzLnBvaW50ZXJVcChldmVudCwgcG9pbnRlcik7XG4gIH07IC8vIHB1YmxpY1xuXG5cbiAgcHJvdG8ucG9pbnRlclVwID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ3BvaW50ZXJVcCcsIFtldmVudCwgcG9pbnRlcl0pO1xuICB9OyAvLyAtLS0tLSBwb2ludGVyIGRvbmUgLS0tLS0gLy9cbiAgLy8gdHJpZ2dlcmVkIG9uIHBvaW50ZXIgdXAgJiBwb2ludGVyIGNhbmNlbFxuXG5cbiAgcHJvdG8uX3BvaW50ZXJEb25lID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3BvaW50ZXJSZXNldCgpO1xuXG4gICAgdGhpcy5fdW5iaW5kUG9zdFN0YXJ0RXZlbnRzKCk7XG5cbiAgICB0aGlzLnBvaW50ZXJEb25lKCk7XG4gIH07XG5cbiAgcHJvdG8uX3BvaW50ZXJSZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyByZXNldCBwcm9wZXJ0aWVzXG4gICAgdGhpcy5pc1BvaW50ZXJEb3duID0gZmFsc2U7XG4gICAgZGVsZXRlIHRoaXMucG9pbnRlcklkZW50aWZpZXI7XG4gIH07XG5cbiAgcHJvdG8ucG9pbnRlckRvbmUgPSBub29wOyAvLyAtLS0tLSBwb2ludGVyIGNhbmNlbCAtLS0tLSAvL1xuXG4gIHByb3RvLm9ucG9pbnRlcmNhbmNlbCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmIChldmVudC5wb2ludGVySWQgPT0gdGhpcy5wb2ludGVySWRlbnRpZmllcikge1xuICAgICAgdGhpcy5fcG9pbnRlckNhbmNlbChldmVudCwgZXZlbnQpO1xuICAgIH1cbiAgfTtcblxuICBwcm90by5vbnRvdWNoY2FuY2VsID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHRvdWNoID0gdGhpcy5nZXRUb3VjaChldmVudC5jaGFuZ2VkVG91Y2hlcyk7XG5cbiAgICBpZiAodG91Y2gpIHtcbiAgICAgIHRoaXMuX3BvaW50ZXJDYW5jZWwoZXZlbnQsIHRvdWNoKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBwb2ludGVyIGNhbmNlbFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG5cbiAgcHJvdG8uX3BvaW50ZXJDYW5jZWwgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICB0aGlzLl9wb2ludGVyRG9uZSgpO1xuXG4gICAgdGhpcy5wb2ludGVyQ2FuY2VsKGV2ZW50LCBwb2ludGVyKTtcbiAgfTsgLy8gcHVibGljXG5cblxuICBwcm90by5wb2ludGVyQ2FuY2VsID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ3BvaW50ZXJDYW5jZWwnLCBbZXZlbnQsIHBvaW50ZXJdKTtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG4gIC8vIHV0aWxpdHkgZnVuY3Rpb24gZm9yIGdldHRpbmcgeC95IGNvb3JkcyBmcm9tIGV2ZW50XG5cblxuICBVbmlwb2ludGVyLmdldFBvaW50ZXJQb2ludCA9IGZ1bmN0aW9uIChwb2ludGVyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHBvaW50ZXIucGFnZVgsXG4gICAgICB5OiBwb2ludGVyLnBhZ2VZXG4gICAgfTtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cblxuICByZXR1cm4gVW5pcG9pbnRlcjtcbn0pO1xuLyohXG4gKiBVbmlkcmFnZ2VyIHYyLjMuMFxuICogRHJhZ2dhYmxlIGJhc2UgY2xhc3NcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLypqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ3VuaWRyYWdnZXIvdW5pZHJhZ2dlcicsIFsndW5pcG9pbnRlci91bmlwb2ludGVyJ10sIGZ1bmN0aW9uIChVbmlwb2ludGVyKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIFVuaXBvaW50ZXIpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3csIHJlcXVpcmUoJ3VuaXBvaW50ZXInKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuVW5pZHJhZ2dlciA9IGZhY3Rvcnkod2luZG93LCB3aW5kb3cuVW5pcG9pbnRlcik7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIFVuaXBvaW50ZXIpIHtcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gVW5pZHJhZ2dlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICBmdW5jdGlvbiBVbmlkcmFnZ2VyKCkge30gLy8gaW5oZXJpdCBVbmlwb2ludGVyICYgRXZFbWl0dGVyXG5cblxuICB2YXIgcHJvdG8gPSBVbmlkcmFnZ2VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVW5pcG9pbnRlci5wcm90b3R5cGUpOyAvLyAtLS0tLSBiaW5kIHN0YXJ0IC0tLS0tIC8vXG5cbiAgcHJvdG8uYmluZEhhbmRsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYmluZEhhbmRsZXModHJ1ZSk7XG4gIH07XG5cbiAgcHJvdG8udW5iaW5kSGFuZGxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9iaW5kSGFuZGxlcyhmYWxzZSk7XG4gIH07XG4gIC8qKlxuICAgKiBBZGQgb3IgcmVtb3ZlIHN0YXJ0IGV2ZW50XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNBZGRcbiAgICovXG5cblxuICBwcm90by5fYmluZEhhbmRsZXMgPSBmdW5jdGlvbiAoaXNBZGQpIHtcbiAgICAvLyBtdW5nZSBpc0FkZCwgZGVmYXVsdCB0byB0cnVlXG4gICAgaXNBZGQgPSBpc0FkZCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGlzQWRkOyAvLyBiaW5kIGVhY2ggaGFuZGxlXG5cbiAgICB2YXIgYmluZE1ldGhvZCA9IGlzQWRkID8gJ2FkZEV2ZW50TGlzdGVuZXInIDogJ3JlbW92ZUV2ZW50TGlzdGVuZXInO1xuICAgIHZhciB0b3VjaEFjdGlvbiA9IGlzQWRkID8gdGhpcy5fdG91Y2hBY3Rpb25WYWx1ZSA6ICcnO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhhbmRsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoYW5kbGUgPSB0aGlzLmhhbmRsZXNbaV07XG5cbiAgICAgIHRoaXMuX2JpbmRTdGFydEV2ZW50KGhhbmRsZSwgaXNBZGQpO1xuXG4gICAgICBoYW5kbGVbYmluZE1ldGhvZF0oJ2NsaWNrJywgdGhpcyk7IC8vIHRvdWNoLWFjdGlvbjogbm9uZSB0byBvdmVycmlkZSBicm93c2VyIHRvdWNoIGdlc3R1cmVzLiBtZXRhZml6enkvZmxpY2tpdHkjNTQwXG5cbiAgICAgIGlmICh3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgICAgIGhhbmRsZS5zdHlsZS50b3VjaEFjdGlvbiA9IHRvdWNoQWN0aW9uO1xuICAgICAgfVxuICAgIH1cbiAgfTsgLy8gcHJvdG90eXBlIHNvIGl0IGNhbiBiZSBvdmVyd3JpdGVhYmxlIGJ5IEZsaWNraXR5XG5cblxuICBwcm90by5fdG91Y2hBY3Rpb25WYWx1ZSA9ICdub25lJzsgLy8gLS0tLS0gc3RhcnQgZXZlbnQgLS0tLS0gLy9cblxuICAvKipcbiAgICogcG9pbnRlciBzdGFydFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqL1xuXG4gIHByb3RvLnBvaW50ZXJEb3duID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdmFyIGlzT2theSA9IHRoaXMub2theVBvaW50ZXJEb3duKGV2ZW50KTtcblxuICAgIGlmICghaXNPa2F5KSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyB0cmFjayBzdGFydCBldmVudCBwb3NpdGlvblxuXG5cbiAgICB0aGlzLnBvaW50ZXJEb3duUG9pbnRlciA9IHBvaW50ZXI7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLnBvaW50ZXJEb3duQmx1cigpOyAvLyBiaW5kIG1vdmUgYW5kIGVuZCBldmVudHNcblxuICAgIHRoaXMuX2JpbmRQb3N0U3RhcnRFdmVudHMoZXZlbnQpO1xuXG4gICAgdGhpcy5lbWl0RXZlbnQoJ3BvaW50ZXJEb3duJywgW2V2ZW50LCBwb2ludGVyXSk7XG4gIH07IC8vIG5vZGVzIHRoYXQgaGF2ZSB0ZXh0IGZpZWxkc1xuXG5cbiAgdmFyIGN1cnNvck5vZGVzID0ge1xuICAgIFRFWFRBUkVBOiB0cnVlLFxuICAgIElOUFVUOiB0cnVlLFxuICAgIFNFTEVDVDogdHJ1ZSxcbiAgICBPUFRJT046IHRydWVcbiAgfTsgLy8gaW5wdXQgdHlwZXMgdGhhdCBkbyBub3QgaGF2ZSB0ZXh0IGZpZWxkc1xuXG4gIHZhciBjbGlja1R5cGVzID0ge1xuICAgIHJhZGlvOiB0cnVlLFxuICAgIGNoZWNrYm94OiB0cnVlLFxuICAgIGJ1dHRvbjogdHJ1ZSxcbiAgICBzdWJtaXQ6IHRydWUsXG4gICAgaW1hZ2U6IHRydWUsXG4gICAgZmlsZTogdHJ1ZVxuICB9OyAvLyBkaXNtaXNzIGlucHV0cyB3aXRoIHRleHQgZmllbGRzLiBmbGlja2l0eSM0MDMsIGZsaWNraXR5IzQwNFxuXG4gIHByb3RvLm9rYXlQb2ludGVyRG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBpc0N1cnNvck5vZGUgPSBjdXJzb3JOb2Rlc1tldmVudC50YXJnZXQubm9kZU5hbWVdO1xuICAgIHZhciBpc0NsaWNrVHlwZSA9IGNsaWNrVHlwZXNbZXZlbnQudGFyZ2V0LnR5cGVdO1xuICAgIHZhciBpc09rYXkgPSAhaXNDdXJzb3JOb2RlIHx8IGlzQ2xpY2tUeXBlO1xuXG4gICAgaWYgKCFpc09rYXkpIHtcbiAgICAgIHRoaXMuX3BvaW50ZXJSZXNldCgpO1xuICAgIH1cblxuICAgIHJldHVybiBpc09rYXk7XG4gIH07IC8vIGtsdWRnZSB0byBibHVyIHByZXZpb3VzbHkgZm9jdXNlZCBpbnB1dFxuXG5cbiAgcHJvdG8ucG9pbnRlckRvd25CbHVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmb2N1c2VkID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDsgLy8gZG8gbm90IGJsdXIgYm9keSBmb3IgSUUxMCwgbWV0YWZpenp5L2ZsaWNraXR5IzExN1xuXG4gICAgdmFyIGNhbkJsdXIgPSBmb2N1c2VkICYmIGZvY3VzZWQuYmx1ciAmJiBmb2N1c2VkICE9IGRvY3VtZW50LmJvZHk7XG5cbiAgICBpZiAoY2FuQmx1cikge1xuICAgICAgZm9jdXNlZC5ibHVyKCk7XG4gICAgfVxuICB9OyAvLyAtLS0tLSBtb3ZlIGV2ZW50IC0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGRyYWcgbW92ZVxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqL1xuXG5cbiAgcHJvdG8ucG9pbnRlck1vdmUgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICB2YXIgbW92ZVZlY3RvciA9IHRoaXMuX2RyYWdQb2ludGVyTW92ZShldmVudCwgcG9pbnRlcik7XG5cbiAgICB0aGlzLmVtaXRFdmVudCgncG9pbnRlck1vdmUnLCBbZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3JdKTtcblxuICAgIHRoaXMuX2RyYWdNb3ZlKGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yKTtcbiAgfTsgLy8gYmFzZSBwb2ludGVyIG1vdmUgbG9naWNcblxuXG4gIHByb3RvLl9kcmFnUG9pbnRlck1vdmUgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICB2YXIgbW92ZVZlY3RvciA9IHtcbiAgICAgIHg6IHBvaW50ZXIucGFnZVggLSB0aGlzLnBvaW50ZXJEb3duUG9pbnRlci5wYWdlWCxcbiAgICAgIHk6IHBvaW50ZXIucGFnZVkgLSB0aGlzLnBvaW50ZXJEb3duUG9pbnRlci5wYWdlWVxuICAgIH07IC8vIHN0YXJ0IGRyYWcgaWYgcG9pbnRlciBoYXMgbW92ZWQgZmFyIGVub3VnaCB0byBzdGFydCBkcmFnXG5cbiAgICBpZiAoIXRoaXMuaXNEcmFnZ2luZyAmJiB0aGlzLmhhc0RyYWdTdGFydGVkKG1vdmVWZWN0b3IpKSB7XG4gICAgICB0aGlzLl9kcmFnU3RhcnQoZXZlbnQsIHBvaW50ZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBtb3ZlVmVjdG9yO1xuICB9OyAvLyBjb25kaXRpb24gaWYgcG9pbnRlciBoYXMgbW92ZWQgZmFyIGVub3VnaCB0byBzdGFydCBkcmFnXG5cblxuICBwcm90by5oYXNEcmFnU3RhcnRlZCA9IGZ1bmN0aW9uIChtb3ZlVmVjdG9yKSB7XG4gICAgcmV0dXJuIE1hdGguYWJzKG1vdmVWZWN0b3IueCkgPiAzIHx8IE1hdGguYWJzKG1vdmVWZWN0b3IueSkgPiAzO1xuICB9OyAvLyAtLS0tLSBlbmQgZXZlbnQgLS0tLS0gLy9cblxuICAvKipcbiAgICogcG9pbnRlciB1cFxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge0V2ZW50IG9yIFRvdWNofSBwb2ludGVyXG4gICAqL1xuXG5cbiAgcHJvdG8ucG9pbnRlclVwID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ3BvaW50ZXJVcCcsIFtldmVudCwgcG9pbnRlcl0pO1xuXG4gICAgdGhpcy5fZHJhZ1BvaW50ZXJVcChldmVudCwgcG9pbnRlcik7XG4gIH07XG5cbiAgcHJvdG8uX2RyYWdQb2ludGVyVXAgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICBpZiAodGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICB0aGlzLl9kcmFnRW5kKGV2ZW50LCBwb2ludGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcG9pbnRlciBkaWRuJ3QgbW92ZSBlbm91Z2ggZm9yIGRyYWcgdG8gc3RhcnRcbiAgICAgIHRoaXMuX3N0YXRpY0NsaWNrKGV2ZW50LCBwb2ludGVyKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRyYWcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gZHJhZ1N0YXJ0XG5cblxuICBwcm90by5fZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTsgLy8gcHJldmVudCBjbGlja3NcblxuICAgIHRoaXMuaXNQcmV2ZW50aW5nQ2xpY2tzID0gdHJ1ZTtcbiAgICB0aGlzLmRyYWdTdGFydChldmVudCwgcG9pbnRlcik7XG4gIH07XG5cbiAgcHJvdG8uZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ2RyYWdTdGFydCcsIFtldmVudCwgcG9pbnRlcl0pO1xuICB9OyAvLyBkcmFnTW92ZVxuXG5cbiAgcHJvdG8uX2RyYWdNb3ZlID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yKSB7XG4gICAgLy8gZG8gbm90IGRyYWcgaWYgbm90IGRyYWdnaW5nIHlldFxuICAgIGlmICghdGhpcy5pc0RyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kcmFnTW92ZShldmVudCwgcG9pbnRlciwgbW92ZVZlY3Rvcik7XG4gIH07XG5cbiAgcHJvdG8uZHJhZ01vdmUgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuZW1pdEV2ZW50KCdkcmFnTW92ZScsIFtldmVudCwgcG9pbnRlciwgbW92ZVZlY3Rvcl0pO1xuICB9OyAvLyBkcmFnRW5kXG5cblxuICBwcm90by5fZHJhZ0VuZCA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIC8vIHNldCBmbGFnc1xuICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlOyAvLyByZS1lbmFibGUgY2xpY2tpbmcgYXN5bmNcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgZGVsZXRlIHRoaXMuaXNQcmV2ZW50aW5nQ2xpY2tzO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5kcmFnRW5kKGV2ZW50LCBwb2ludGVyKTtcbiAgfTtcblxuICBwcm90by5kcmFnRW5kID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ2RyYWdFbmQnLCBbZXZlbnQsIHBvaW50ZXJdKTtcbiAgfTsgLy8gLS0tLS0gb25jbGljayAtLS0tLSAvL1xuICAvLyBoYW5kbGUgYWxsIGNsaWNrcyBhbmQgcHJldmVudCBjbGlja3Mgd2hlbiBkcmFnZ2luZ1xuXG5cbiAgcHJvdG8ub25jbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmICh0aGlzLmlzUHJldmVudGluZ0NsaWNrcykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tIHN0YXRpY0NsaWNrIC0tLS0tIC8vXG4gIC8vIHRyaWdnZXJlZCBhZnRlciBwb2ludGVyIGRvd24gJiB1cCB3aXRoIG5vL3RpbnkgbW92ZW1lbnRcblxuXG4gIHByb3RvLl9zdGF0aWNDbGljayA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIC8vIGlnbm9yZSBlbXVsYXRlZCBtb3VzZSB1cCBjbGlja3NcbiAgICBpZiAodGhpcy5pc0lnbm9yaW5nTW91c2VVcCAmJiBldmVudC50eXBlID09ICdtb3VzZXVwJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RhdGljQ2xpY2soZXZlbnQsIHBvaW50ZXIpOyAvLyBzZXQgZmxhZyBmb3IgZW11bGF0ZWQgY2xpY2tzIDMwMG1zIGFmdGVyIHRvdWNoZW5kXG5cbiAgICBpZiAoZXZlbnQudHlwZSAhPSAnbW91c2V1cCcpIHtcbiAgICAgIHRoaXMuaXNJZ25vcmluZ01vdXNlVXAgPSB0cnVlOyAvLyByZXNldCBmbGFnIGFmdGVyIDMwMG1zXG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWxldGUgdGhpcy5pc0lnbm9yaW5nTW91c2VVcDtcbiAgICAgIH0uYmluZCh0aGlzKSwgNDAwKTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uc3RhdGljQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICB0aGlzLmVtaXRFdmVudCgnc3RhdGljQ2xpY2snLCBbZXZlbnQsIHBvaW50ZXJdKTtcbiAgfTsgLy8gLS0tLS0gdXRpbHMgLS0tLS0gLy9cblxuXG4gIFVuaWRyYWdnZXIuZ2V0UG9pbnRlclBvaW50ID0gVW5pcG9pbnRlci5nZXRQb2ludGVyUG9pbnQ7IC8vIC0tLS0tICAtLS0tLSAvL1xuXG4gIHJldHVybiBVbmlkcmFnZ2VyO1xufSk7IC8vIGRyYWdcblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2ZsaWNraXR5L2pzL2RyYWcnLCBbJy4vZmxpY2tpdHknLCAndW5pZHJhZ2dlci91bmlkcmFnZ2VyJywgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ10sIGZ1bmN0aW9uIChGbGlja2l0eSwgVW5pZHJhZ2dlciwgdXRpbHMpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgRmxpY2tpdHksIFVuaWRyYWdnZXIsIHV0aWxzKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCcuL2ZsaWNraXR5JyksIHJlcXVpcmUoJ3VuaWRyYWdnZXInKSwgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSBmYWN0b3J5KHdpbmRvdywgd2luZG93LkZsaWNraXR5LCB3aW5kb3cuVW5pZHJhZ2dlciwgd2luZG93LmZpenp5VUlVdGlscyk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIEZsaWNraXR5LCBVbmlkcmFnZ2VyLCB1dGlscykge1xuICAvLyAtLS0tLSBkZWZhdWx0cyAtLS0tLSAvL1xuICB1dGlscy5leHRlbmQoRmxpY2tpdHkuZGVmYXVsdHMsIHtcbiAgICBkcmFnZ2FibGU6ICc+MScsXG4gICAgZHJhZ1RocmVzaG9sZDogM1xuICB9KTsgLy8gLS0tLS0gY3JlYXRlIC0tLS0tIC8vXG5cbiAgRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlRHJhZycpOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkcmFnIHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIHZhciBwcm90byA9IEZsaWNraXR5LnByb3RvdHlwZTtcbiAgdXRpbHMuZXh0ZW5kKHByb3RvLCBVbmlkcmFnZ2VyLnByb3RvdHlwZSk7XG4gIHByb3RvLl90b3VjaEFjdGlvblZhbHVlID0gJ3Bhbi15JzsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgdmFyIGlzVG91Y2ggPSAoJ2NyZWF0ZVRvdWNoJyBpbiBkb2N1bWVudCk7XG4gIHZhciBpc1RvdWNobW92ZVNjcm9sbENhbmNlbGVkID0gZmFsc2U7XG5cbiAgcHJvdG8uX2NyZWF0ZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vbignYWN0aXZhdGUnLCB0aGlzLm9uQWN0aXZhdGVEcmFnKTtcbiAgICB0aGlzLm9uKCd1aUNoYW5nZScsIHRoaXMuX3VpQ2hhbmdlRHJhZyk7XG4gICAgdGhpcy5vbignZGVhY3RpdmF0ZScsIHRoaXMub25EZWFjdGl2YXRlRHJhZyk7XG4gICAgdGhpcy5vbignY2VsbENoYW5nZScsIHRoaXMudXBkYXRlRHJhZ2dhYmxlKTsgLy8gVE9ETyB1cGRhdGVEcmFnZ2FibGUgb24gcmVzaXplPyBpZiBncm91cENlbGxzICYgc2xpZGVzIGNoYW5nZVxuICAgIC8vIEhBQ0sgLSBhZGQgc2VlbWluZ2x5IGlubm9jdW91cyBoYW5kbGVyIHRvIGZpeCBpT1MgMTAgc2Nyb2xsIGJlaGF2aW9yXG4gICAgLy8gIzQ1NywgUnViYVhhL1NvcnRhYmxlIzk3M1xuXG4gICAgaWYgKGlzVG91Y2ggJiYgIWlzVG91Y2htb3ZlU2Nyb2xsQ2FuY2VsZWQpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBmdW5jdGlvbiAoKSB7fSk7XG4gICAgICBpc1RvdWNobW92ZVNjcm9sbENhbmNlbGVkID0gdHJ1ZTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8ub25BY3RpdmF0ZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5oYW5kbGVzID0gW3RoaXMudmlld3BvcnRdO1xuICAgIHRoaXMuYmluZEhhbmRsZXMoKTtcbiAgICB0aGlzLnVwZGF0ZURyYWdnYWJsZSgpO1xuICB9O1xuXG4gIHByb3RvLm9uRGVhY3RpdmF0ZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy51bmJpbmRIYW5kbGVzKCk7XG4gICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWRyYWdnYWJsZScpO1xuICB9O1xuXG4gIHByb3RvLnVwZGF0ZURyYWdnYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBkaXNhYmxlIGRyYWdnaW5nIGlmIGxlc3MgdGhhbiAyIHNsaWRlcy4gIzI3OFxuICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlID09ICc+MScpIHtcbiAgICAgIHRoaXMuaXNEcmFnZ2FibGUgPSB0aGlzLnNsaWRlcy5sZW5ndGggPiAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzRHJhZ2dhYmxlID0gdGhpcy5vcHRpb25zLmRyYWdnYWJsZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2lzLWRyYWdnYWJsZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnaXMtZHJhZ2dhYmxlJyk7XG4gICAgfVxuICB9OyAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuXG5cbiAgcHJvdG8uYmluZERyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVEcmFnZ2FibGUoKTtcbiAgfTtcblxuICBwcm90by51bmJpbmREcmFnID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub3B0aW9ucy5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICB0aGlzLnVwZGF0ZURyYWdnYWJsZSgpO1xuICB9O1xuXG4gIHByb3RvLl91aUNoYW5nZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgZGVsZXRlIHRoaXMuaXNGcmVlU2Nyb2xsaW5nO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBwb2ludGVyIGV2ZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgcHJvdG8ucG9pbnRlckRvd24gPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICBpZiAoIXRoaXMuaXNEcmFnZ2FibGUpIHtcbiAgICAgIHRoaXMuX3BvaW50ZXJEb3duRGVmYXVsdChldmVudCwgcG9pbnRlcik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaXNPa2F5ID0gdGhpcy5va2F5UG9pbnRlckRvd24oZXZlbnQpO1xuXG4gICAgaWYgKCFpc09rYXkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9wb2ludGVyRG93blByZXZlbnREZWZhdWx0KGV2ZW50KTtcblxuICAgIHRoaXMucG9pbnRlckRvd25Gb2N1cyhldmVudCk7IC8vIGJsdXJcblxuICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9IHRoaXMuZWxlbWVudCkge1xuICAgICAgLy8gZG8gbm90IGJsdXIgaWYgYWxyZWFkeSBmb2N1c2VkXG4gICAgICB0aGlzLnBvaW50ZXJEb3duQmx1cigpO1xuICAgIH0gLy8gc3RvcCBpZiBpdCB3YXMgbW92aW5nXG5cblxuICAgIHRoaXMuZHJhZ1ggPSB0aGlzLng7XG4gICAgdGhpcy52aWV3cG9ydC5jbGFzc0xpc3QuYWRkKCdpcy1wb2ludGVyLWRvd24nKTsgLy8gdHJhY2sgc2Nyb2xsaW5nXG5cbiAgICB0aGlzLnBvaW50ZXJEb3duU2Nyb2xsID0gZ2V0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcyk7XG5cbiAgICB0aGlzLl9wb2ludGVyRG93bkRlZmF1bHQoZXZlbnQsIHBvaW50ZXIpO1xuICB9OyAvLyBkZWZhdWx0IHBvaW50ZXJEb3duIGxvZ2ljLCB1c2VkIGZvciBzdGF0aWNDbGlja1xuXG5cbiAgcHJvdG8uX3BvaW50ZXJEb3duRGVmYXVsdCA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIC8vIHRyYWNrIHN0YXJ0IGV2ZW50IHBvc2l0aW9uXG4gICAgLy8gU2FmYXJpIDkgb3ZlcnJpZGVzIHBhZ2VYIGFuZCBwYWdlWS4gVGhlc2UgdmFsdWVzIG5lZWRzIHRvIGJlIGNvcGllZC4gIzc3OVxuICAgIHRoaXMucG9pbnRlckRvd25Qb2ludGVyID0ge1xuICAgICAgcGFnZVg6IHBvaW50ZXIucGFnZVgsXG4gICAgICBwYWdlWTogcG9pbnRlci5wYWdlWVxuICAgIH07IC8vIGJpbmQgbW92ZSBhbmQgZW5kIGV2ZW50c1xuXG4gICAgdGhpcy5fYmluZFBvc3RTdGFydEV2ZW50cyhldmVudCk7XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3BvaW50ZXJEb3duJywgZXZlbnQsIFtwb2ludGVyXSk7XG4gIH07XG5cbiAgdmFyIGZvY3VzTm9kZXMgPSB7XG4gICAgSU5QVVQ6IHRydWUsXG4gICAgVEVYVEFSRUE6IHRydWUsXG4gICAgU0VMRUNUOiB0cnVlXG4gIH07XG5cbiAgcHJvdG8ucG9pbnRlckRvd25Gb2N1cyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBpc0ZvY3VzTm9kZSA9IGZvY3VzTm9kZXNbZXZlbnQudGFyZ2V0Lm5vZGVOYW1lXTtcblxuICAgIGlmICghaXNGb2N1c05vZGUpIHtcbiAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uX3BvaW50ZXJEb3duUHJldmVudERlZmF1bHQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgaXNUb3VjaFN0YXJ0ID0gZXZlbnQudHlwZSA9PSAndG91Y2hzdGFydCc7XG4gICAgdmFyIGlzVG91Y2hQb2ludGVyID0gZXZlbnQucG9pbnRlclR5cGUgPT0gJ3RvdWNoJztcbiAgICB2YXIgaXNGb2N1c05vZGUgPSBmb2N1c05vZGVzW2V2ZW50LnRhcmdldC5ub2RlTmFtZV07XG5cbiAgICBpZiAoIWlzVG91Y2hTdGFydCAmJiAhaXNUb3VjaFBvaW50ZXIgJiYgIWlzRm9jdXNOb2RlKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfTsgLy8gLS0tLS0gbW92ZSAtLS0tLSAvL1xuXG5cbiAgcHJvdG8uaGFzRHJhZ1N0YXJ0ZWQgPSBmdW5jdGlvbiAobW92ZVZlY3Rvcikge1xuICAgIHJldHVybiBNYXRoLmFicyhtb3ZlVmVjdG9yLngpID4gdGhpcy5vcHRpb25zLmRyYWdUaHJlc2hvbGQ7XG4gIH07IC8vIC0tLS0tIHVwIC0tLS0tIC8vXG5cblxuICBwcm90by5wb2ludGVyVXAgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICBkZWxldGUgdGhpcy5pc1RvdWNoU2Nyb2xsaW5nO1xuICAgIHRoaXMudmlld3BvcnQuY2xhc3NMaXN0LnJlbW92ZSgnaXMtcG9pbnRlci1kb3duJyk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdwb2ludGVyVXAnLCBldmVudCwgW3BvaW50ZXJdKTtcblxuICAgIHRoaXMuX2RyYWdQb2ludGVyVXAoZXZlbnQsIHBvaW50ZXIpO1xuICB9O1xuXG4gIHByb3RvLnBvaW50ZXJEb25lID0gZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzKTtcbiAgICBkZWxldGUgdGhpcy5wb2ludGVyRG93blNjcm9sbDtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gZHJhZ2dpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIHByb3RvLmRyYWdTdGFydCA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIGlmICghdGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24gPSB0aGlzLng7XG4gICAgdGhpcy5zdGFydEFuaW1hdGlvbigpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2RyYWdTdGFydCcsIGV2ZW50LCBbcG9pbnRlcl0pO1xuICB9O1xuXG4gIHByb3RvLnBvaW50ZXJNb3ZlID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyKSB7XG4gICAgdmFyIG1vdmVWZWN0b3IgPSB0aGlzLl9kcmFnUG9pbnRlck1vdmUoZXZlbnQsIHBvaW50ZXIpO1xuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdwb2ludGVyTW92ZScsIGV2ZW50LCBbcG9pbnRlciwgbW92ZVZlY3Rvcl0pO1xuXG4gICAgdGhpcy5fZHJhZ01vdmUoZXZlbnQsIHBvaW50ZXIsIG1vdmVWZWN0b3IpO1xuICB9O1xuXG4gIHByb3RvLmRyYWdNb3ZlID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyLCBtb3ZlVmVjdG9yKSB7XG4gICAgaWYgKCF0aGlzLmlzRHJhZ2dhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLnByZXZpb3VzRHJhZ1ggPSB0aGlzLmRyYWdYOyAvLyByZXZlcnNlIGlmIHJpZ2h0LXRvLWxlZnRcblxuICAgIHZhciBkaXJlY3Rpb24gPSB0aGlzLm9wdGlvbnMucmlnaHRUb0xlZnQgPyAtMSA6IDE7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLndyYXBBcm91bmQpIHtcbiAgICAgIC8vIHdyYXAgYXJvdW5kIG1vdmUuICM1ODlcbiAgICAgIG1vdmVWZWN0b3IueCA9IG1vdmVWZWN0b3IueCAlIHRoaXMuc2xpZGVhYmxlV2lkdGg7XG4gICAgfVxuXG4gICAgdmFyIGRyYWdYID0gdGhpcy5kcmFnU3RhcnRQb3NpdGlvbiArIG1vdmVWZWN0b3IueCAqIGRpcmVjdGlvbjtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLndyYXBBcm91bmQgJiYgdGhpcy5zbGlkZXMubGVuZ3RoKSB7XG4gICAgICAvLyBzbG93IGRyYWdcbiAgICAgIHZhciBvcmlnaW5Cb3VuZCA9IE1hdGgubWF4KC10aGlzLnNsaWRlc1swXS50YXJnZXQsIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24pO1xuICAgICAgZHJhZ1ggPSBkcmFnWCA+IG9yaWdpbkJvdW5kID8gKGRyYWdYICsgb3JpZ2luQm91bmQpICogMC41IDogZHJhZ1g7XG4gICAgICB2YXIgZW5kQm91bmQgPSBNYXRoLm1pbigtdGhpcy5nZXRMYXN0U2xpZGUoKS50YXJnZXQsIHRoaXMuZHJhZ1N0YXJ0UG9zaXRpb24pO1xuICAgICAgZHJhZ1ggPSBkcmFnWCA8IGVuZEJvdW5kID8gKGRyYWdYICsgZW5kQm91bmQpICogMC41IDogZHJhZ1g7XG4gICAgfVxuXG4gICAgdGhpcy5kcmFnWCA9IGRyYWdYO1xuICAgIHRoaXMuZHJhZ01vdmVUaW1lID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2RyYWdNb3ZlJywgZXZlbnQsIFtwb2ludGVyLCBtb3ZlVmVjdG9yXSk7XG4gIH07XG5cbiAgcHJvdG8uZHJhZ0VuZCA9IGZ1bmN0aW9uIChldmVudCwgcG9pbnRlcikge1xuICAgIGlmICghdGhpcy5pc0RyYWdnYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZnJlZVNjcm9sbCkge1xuICAgICAgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgPSB0cnVlO1xuICAgIH0gLy8gc2V0IHNlbGVjdGVkSW5kZXggYmFzZWQgb24gd2hlcmUgZmxpY2sgd2lsbCBlbmQgdXBcblxuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5kcmFnRW5kUmVzdGluZ1NlbGVjdCgpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mcmVlU2Nyb2xsICYmICF0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCkge1xuICAgICAgLy8gaWYgZnJlZS1zY3JvbGwgJiBub3Qgd3JhcCBhcm91bmRcbiAgICAgIC8vIGRvIG5vdCBmcmVlLXNjcm9sbCBpZiBnb2luZyBvdXRzaWRlIG9mIGJvdW5kaW5nIHNsaWRlc1xuICAgICAgLy8gc28gYm91bmRpbmcgc2xpZGVzIGNhbiBhdHRyYWN0IHNsaWRlciwgYW5kIGtlZXAgaXQgaW4gYm91bmRzXG4gICAgICB2YXIgcmVzdGluZ1ggPSB0aGlzLmdldFJlc3RpbmdQb3NpdGlvbigpO1xuICAgICAgdGhpcy5pc0ZyZWVTY3JvbGxpbmcgPSAtcmVzdGluZ1ggPiB0aGlzLnNsaWRlc1swXS50YXJnZXQgJiYgLXJlc3RpbmdYIDwgdGhpcy5nZXRMYXN0U2xpZGUoKS50YXJnZXQ7XG4gICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLmZyZWVTY3JvbGwgJiYgaW5kZXggPT0gdGhpcy5zZWxlY3RlZEluZGV4KSB7XG4gICAgICAvLyBib29zdCBzZWxlY3Rpb24gaWYgc2VsZWN0ZWQgaW5kZXggaGFzIG5vdCBjaGFuZ2VkXG4gICAgICBpbmRleCArPSB0aGlzLmRyYWdFbmRCb29zdFNlbGVjdCgpO1xuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLnByZXZpb3VzRHJhZ1g7IC8vIGFwcGx5IHNlbGVjdGlvblxuICAgIC8vIFRPRE8gcmVmYWN0b3IgdGhpcywgc2VsZWN0aW5nIGhlcmUgZmVlbHMgd2VpcmRcbiAgICAvLyBIQUNLLCBzZXQgZmxhZyBzbyBkcmFnZ2luZyBzdGF5cyBpbiBjb3JyZWN0IGRpcmVjdGlvblxuXG4gICAgdGhpcy5pc0RyYWdTZWxlY3QgPSB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZDtcbiAgICB0aGlzLnNlbGVjdChpbmRleCk7XG4gICAgZGVsZXRlIHRoaXMuaXNEcmFnU2VsZWN0O1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnZHJhZ0VuZCcsIGV2ZW50LCBbcG9pbnRlcl0pO1xuICB9O1xuXG4gIHByb3RvLmRyYWdFbmRSZXN0aW5nU2VsZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN0aW5nWCA9IHRoaXMuZ2V0UmVzdGluZ1Bvc2l0aW9uKCk7IC8vIGhvdyBmYXIgYXdheSBmcm9tIHNlbGVjdGVkIHNsaWRlXG5cbiAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLmFicyh0aGlzLmdldFNsaWRlRGlzdGFuY2UoLXJlc3RpbmdYLCB0aGlzLnNlbGVjdGVkSW5kZXgpKTsgLy8gZ2V0IGNsb3NldCByZXN0aW5nIGdvaW5nIHVwIGFuZCBnb2luZyBkb3duXG5cbiAgICB2YXIgcG9zaXRpdmVSZXN0aW5nID0gdGhpcy5fZ2V0Q2xvc2VzdFJlc3RpbmcocmVzdGluZ1gsIGRpc3RhbmNlLCAxKTtcblxuICAgIHZhciBuZWdhdGl2ZVJlc3RpbmcgPSB0aGlzLl9nZXRDbG9zZXN0UmVzdGluZyhyZXN0aW5nWCwgZGlzdGFuY2UsIC0xKTsgLy8gdXNlIGNsb3NlciByZXN0aW5nIGZvciB3cmFwLWFyb3VuZFxuXG5cbiAgICB2YXIgaW5kZXggPSBwb3NpdGl2ZVJlc3RpbmcuZGlzdGFuY2UgPCBuZWdhdGl2ZVJlc3RpbmcuZGlzdGFuY2UgPyBwb3NpdGl2ZVJlc3RpbmcuaW5kZXggOiBuZWdhdGl2ZVJlc3RpbmcuaW5kZXg7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9O1xuICAvKipcbiAgICogZ2l2ZW4gcmVzdGluZyBYIGFuZCBkaXN0YW5jZSB0byBzZWxlY3RlZCBjZWxsXG4gICAqIGdldCB0aGUgZGlzdGFuY2UgYW5kIGluZGV4IG9mIHRoZSBjbG9zZXN0IGNlbGxcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHJlc3RpbmdYIC0gZXN0aW1hdGVkIHBvc3QtZmxpY2sgcmVzdGluZyBwb3NpdGlvblxuICAgKiBAcGFyYW0ge051bWJlcn0gZGlzdGFuY2UgLSBkaXN0YW5jZSB0byBzZWxlY3RlZCBjZWxsXG4gICAqIEBwYXJhbSB7SW50ZWdlcn0gaW5jcmVtZW50IC0gKzEgb3IgLTEsIGdvaW5nIHVwIG9yIGRvd25cbiAgICogQHJldHVybnMge09iamVjdH0gLSB7IGRpc3RhbmNlOiB7TnVtYmVyfSwgaW5kZXg6IHtJbnRlZ2VyfSB9XG4gICAqL1xuXG5cbiAgcHJvdG8uX2dldENsb3Nlc3RSZXN0aW5nID0gZnVuY3Rpb24gKHJlc3RpbmdYLCBkaXN0YW5jZSwgaW5jcmVtZW50KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5zZWxlY3RlZEluZGV4O1xuICAgIHZhciBtaW5EaXN0YW5jZSA9IEluZmluaXR5O1xuICAgIHZhciBjb25kaXRpb24gPSB0aGlzLm9wdGlvbnMuY29udGFpbiAmJiAhdGhpcy5vcHRpb25zLndyYXBBcm91bmQgPyAvLyBpZiBjb250YWluLCBrZWVwIGdvaW5nIGlmIGRpc3RhbmNlIGlzIGVxdWFsIHRvIG1pbkRpc3RhbmNlXG4gICAgZnVuY3Rpb24gKGQsIG1kKSB7XG4gICAgICByZXR1cm4gZCA8PSBtZDtcbiAgICB9IDogZnVuY3Rpb24gKGQsIG1kKSB7XG4gICAgICByZXR1cm4gZCA8IG1kO1xuICAgIH07XG5cbiAgICB3aGlsZSAoY29uZGl0aW9uKGRpc3RhbmNlLCBtaW5EaXN0YW5jZSkpIHtcbiAgICAgIC8vIG1lYXN1cmUgZGlzdGFuY2UgdG8gbmV4dCBjZWxsXG4gICAgICBpbmRleCArPSBpbmNyZW1lbnQ7XG4gICAgICBtaW5EaXN0YW5jZSA9IGRpc3RhbmNlO1xuICAgICAgZGlzdGFuY2UgPSB0aGlzLmdldFNsaWRlRGlzdGFuY2UoLXJlc3RpbmdYLCBpbmRleCk7XG5cbiAgICAgIGlmIChkaXN0YW5jZSA9PT0gbnVsbCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhkaXN0YW5jZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGRpc3RhbmNlOiBtaW5EaXN0YW5jZSxcbiAgICAgIC8vIHNlbGVjdGVkIHdhcyBwcmV2aW91cyBpbmRleFxuICAgICAgaW5kZXg6IGluZGV4IC0gaW5jcmVtZW50XG4gICAgfTtcbiAgfTtcbiAgLyoqXG4gICAqIG1lYXN1cmUgZGlzdGFuY2UgYmV0d2VlbiB4IGFuZCBhIHNsaWRlIHRhcmdldFxuICAgKiBAcGFyYW0ge051bWJlcn0geFxuICAgKiBAcGFyYW0ge0ludGVnZXJ9IGluZGV4IC0gc2xpZGUgaW5kZXhcbiAgICovXG5cblxuICBwcm90by5nZXRTbGlkZURpc3RhbmNlID0gZnVuY3Rpb24gKHgsIGluZGV4KSB7XG4gICAgdmFyIGxlbiA9IHRoaXMuc2xpZGVzLmxlbmd0aDsgLy8gd3JhcCBhcm91bmQgaWYgYXQgbGVhc3QgMiBzbGlkZXNcblxuICAgIHZhciBpc1dyYXBBcm91bmQgPSB0aGlzLm9wdGlvbnMud3JhcEFyb3VuZCAmJiBsZW4gPiAxO1xuICAgIHZhciBzbGlkZUluZGV4ID0gaXNXcmFwQXJvdW5kID8gdXRpbHMubW9kdWxvKGluZGV4LCBsZW4pIDogaW5kZXg7XG4gICAgdmFyIHNsaWRlID0gdGhpcy5zbGlkZXNbc2xpZGVJbmRleF07XG5cbiAgICBpZiAoIXNsaWRlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IC8vIGFkZCBkaXN0YW5jZSBmb3Igd3JhcC1hcm91bmQgc2xpZGVzXG5cblxuICAgIHZhciB3cmFwID0gaXNXcmFwQXJvdW5kID8gdGhpcy5zbGlkZWFibGVXaWR0aCAqIE1hdGguZmxvb3IoaW5kZXggLyBsZW4pIDogMDtcbiAgICByZXR1cm4geCAtIChzbGlkZS50YXJnZXQgKyB3cmFwKTtcbiAgfTtcblxuICBwcm90by5kcmFnRW5kQm9vc3RTZWxlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZG8gbm90IGJvb3N0IGlmIG5vIHByZXZpb3VzRHJhZ1ggb3IgZHJhZ01vdmVUaW1lXG4gICAgaWYgKHRoaXMucHJldmlvdXNEcmFnWCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLmRyYWdNb3ZlVGltZSB8fCAvLyBvciBpZiBkcmFnIHdhcyBoZWxkIGZvciAxMDAgbXNcbiAgICBuZXcgRGF0ZSgpIC0gdGhpcy5kcmFnTW92ZVRpbWUgPiAxMDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBkaXN0YW5jZSA9IHRoaXMuZ2V0U2xpZGVEaXN0YW5jZSgtdGhpcy5kcmFnWCwgdGhpcy5zZWxlY3RlZEluZGV4KTtcbiAgICB2YXIgZGVsdGEgPSB0aGlzLnByZXZpb3VzRHJhZ1ggLSB0aGlzLmRyYWdYO1xuXG4gICAgaWYgKGRpc3RhbmNlID4gMCAmJiBkZWx0YSA+IDApIHtcbiAgICAgIC8vIGJvb3N0IHRvIG5leHQgaWYgbW92aW5nIHRvd2FyZHMgdGhlIHJpZ2h0LCBhbmQgcG9zaXRpdmUgdmVsb2NpdHlcbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAoZGlzdGFuY2UgPCAwICYmIGRlbHRhIDwgMCkge1xuICAgICAgLy8gYm9vc3QgdG8gcHJldmlvdXMgaWYgbW92aW5nIHRvd2FyZHMgdGhlIGxlZnQsIGFuZCBuZWdhdGl2ZSB2ZWxvY2l0eVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIHJldHVybiAwO1xuICB9OyAvLyAtLS0tLSBzdGF0aWNDbGljayAtLS0tLSAvL1xuXG5cbiAgcHJvdG8uc3RhdGljQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQsIHBvaW50ZXIpIHtcbiAgICAvLyBnZXQgY2xpY2tlZENlbGwsIGlmIGNlbGwgd2FzIGNsaWNrZWRcbiAgICB2YXIgY2xpY2tlZENlbGwgPSB0aGlzLmdldFBhcmVudENlbGwoZXZlbnQudGFyZ2V0KTtcbiAgICB2YXIgY2VsbEVsZW0gPSBjbGlja2VkQ2VsbCAmJiBjbGlja2VkQ2VsbC5lbGVtZW50O1xuICAgIHZhciBjZWxsSW5kZXggPSBjbGlja2VkQ2VsbCAmJiB0aGlzLmNlbGxzLmluZGV4T2YoY2xpY2tlZENlbGwpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgnc3RhdGljQ2xpY2snLCBldmVudCwgW3BvaW50ZXIsIGNlbGxFbGVtLCBjZWxsSW5kZXhdKTtcbiAgfTsgLy8gLS0tLS0gc2Nyb2xsIC0tLS0tIC8vXG5cblxuICBwcm90by5vbnNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2Nyb2xsID0gZ2V0U2Nyb2xsUG9zaXRpb24oKTtcbiAgICB2YXIgc2Nyb2xsTW92ZVggPSB0aGlzLnBvaW50ZXJEb3duU2Nyb2xsLnggLSBzY3JvbGwueDtcbiAgICB2YXIgc2Nyb2xsTW92ZVkgPSB0aGlzLnBvaW50ZXJEb3duU2Nyb2xsLnkgLSBzY3JvbGwueTsgLy8gY2FuY2VsIGNsaWNrL3RhcCBpZiBzY3JvbGwgaXMgdG9vIG11Y2hcblxuICAgIGlmIChNYXRoLmFicyhzY3JvbGxNb3ZlWCkgPiAzIHx8IE1hdGguYWJzKHNjcm9sbE1vdmVZKSA+IDMpIHtcbiAgICAgIHRoaXMuX3BvaW50ZXJEb25lKCk7XG4gICAgfVxuICB9OyAvLyAtLS0tLSB1dGlscyAtLS0tLSAvL1xuXG5cbiAgZnVuY3Rpb24gZ2V0U2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IHdpbmRvdy5wYWdlWE9mZnNldCxcbiAgICAgIHk6IHdpbmRvdy5wYWdlWU9mZnNldFxuICAgIH07XG4gIH0gLy8gLS0tLS0gIC0tLS0tIC8vXG5cblxuICByZXR1cm4gRmxpY2tpdHk7XG59KTsgLy8gcHJldi9uZXh0IGJ1dHRvbnNcblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2ZsaWNraXR5L2pzL3ByZXYtbmV4dC1idXR0b24nLCBbJy4vZmxpY2tpdHknLCAndW5pcG9pbnRlci91bmlwb2ludGVyJywgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ10sIGZ1bmN0aW9uIChGbGlja2l0eSwgVW5pcG9pbnRlciwgdXRpbHMpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgRmxpY2tpdHksIFVuaXBvaW50ZXIsIHV0aWxzKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCcuL2ZsaWNraXR5JyksIHJlcXVpcmUoJ3VuaXBvaW50ZXInKSwgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdywgd2luZG93LkZsaWNraXR5LCB3aW5kb3cuVW5pcG9pbnRlciwgd2luZG93LmZpenp5VUlVdGlscyk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIEZsaWNraXR5LCBVbmlwb2ludGVyLCB1dGlscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIHN2Z1VSSSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFByZXZOZXh0QnV0dG9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgZnVuY3Rpb24gUHJldk5leHRCdXR0b24oZGlyZWN0aW9uLCBwYXJlbnQpIHtcbiAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG5cbiAgUHJldk5leHRCdXR0b24ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVbmlwb2ludGVyLnByb3RvdHlwZSk7XG5cbiAgUHJldk5leHRCdXR0b24ucHJvdG90eXBlLl9jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcHJvcGVydGllc1xuICAgIHRoaXMuaXNFbmFibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzUHJldmlvdXMgPSB0aGlzLmRpcmVjdGlvbiA9PSAtMTtcbiAgICB2YXIgbGVmdERpcmVjdGlvbiA9IHRoaXMucGFyZW50Lm9wdGlvbnMucmlnaHRUb0xlZnQgPyAxIDogLTE7XG4gICAgdGhpcy5pc0xlZnQgPSB0aGlzLmRpcmVjdGlvbiA9PSBsZWZ0RGlyZWN0aW9uO1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAnZmxpY2tpdHktYnV0dG9uIGZsaWNraXR5LXByZXYtbmV4dC1idXR0b24nO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9IHRoaXMuaXNQcmV2aW91cyA/ICcgcHJldmlvdXMnIDogJyBuZXh0JzsgLy8gcHJldmVudCBidXR0b24gZnJvbSBzdWJtaXR0aW5nIGZvcm0gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA4MzYwNzYvMTgyMTgzXG5cbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTsgLy8gaW5pdCBhcyBkaXNhYmxlZFxuXG4gICAgdGhpcy5kaXNhYmxlKCk7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCB0aGlzLmlzUHJldmlvdXMgPyAnUHJldmlvdXMnIDogJ05leHQnKTsgLy8gY3JlYXRlIGFycm93XG5cbiAgICB2YXIgc3ZnID0gdGhpcy5jcmVhdGVTVkcoKTtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHN2Zyk7IC8vIGV2ZW50c1xuXG4gICAgdGhpcy5wYXJlbnQub24oJ3NlbGVjdCcsIHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xuICAgIHRoaXMub24oJ3BvaW50ZXJEb3duJywgdGhpcy5wYXJlbnQuY2hpbGRVSVBvaW50ZXJEb3duLmJpbmQodGhpcy5wYXJlbnQpKTtcbiAgfTtcblxuICBQcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5iaW5kU3RhcnRFdmVudCh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMpOyAvLyBhZGQgdG8gRE9NXG5cbiAgICB0aGlzLnBhcmVudC5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gIH07XG5cbiAgUHJldk5leHRCdXR0b24ucHJvdG90eXBlLmRlYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcmVtb3ZlIGZyb20gRE9NXG4gICAgdGhpcy5wYXJlbnQuZWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpOyAvLyBjbGljayBldmVudHNcblxuICAgIHRoaXMudW5iaW5kU3RhcnRFdmVudCh0aGlzLmVsZW1lbnQpO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMpO1xuICB9O1xuXG4gIFByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5jcmVhdGVTVkcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdVUkksICdzdmcnKTtcbiAgICBzdmcuc2V0QXR0cmlidXRlKCdjbGFzcycsICdmbGlja2l0eS1idXR0b24taWNvbicpO1xuICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnLCAnMCAwIDEwMCAxMDAnKTtcbiAgICB2YXIgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdVUkksICdwYXRoJyk7XG4gICAgdmFyIHBhdGhNb3ZlbWVudHMgPSBnZXRBcnJvd01vdmVtZW50cyh0aGlzLnBhcmVudC5vcHRpb25zLmFycm93U2hhcGUpO1xuICAgIHBhdGguc2V0QXR0cmlidXRlKCdkJywgcGF0aE1vdmVtZW50cyk7XG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2Fycm93Jyk7IC8vIHJvdGF0ZSBhcnJvd1xuXG4gICAgaWYgKCF0aGlzLmlzTGVmdCkge1xuICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMTAwLCAxMDApIHJvdGF0ZSgxODApICcpO1xuICAgIH1cblxuICAgIHN2Zy5hcHBlbmRDaGlsZChwYXRoKTtcbiAgICByZXR1cm4gc3ZnO1xuICB9OyAvLyBnZXQgU1ZHIHBhdGggbW92bWVtZW50XG5cblxuICBmdW5jdGlvbiBnZXRBcnJvd01vdmVtZW50cyhzaGFwZSkge1xuICAgIC8vIHVzZSBzaGFwZSBhcyBtb3ZlbWVudCBpZiBzdHJpbmdcbiAgICBpZiAodHlwZW9mIHNoYXBlID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gc2hhcGU7XG4gICAgfSAvLyBjcmVhdGUgbW92ZW1lbnQgc3RyaW5nXG5cblxuICAgIHJldHVybiAnTSAnICsgc2hhcGUueDAgKyAnLDUwJyArICcgTCAnICsgc2hhcGUueDEgKyAnLCcgKyAoc2hhcGUueTEgKyA1MCkgKyAnIEwgJyArIHNoYXBlLngyICsgJywnICsgKHNoYXBlLnkyICsgNTApICsgJyBMICcgKyBzaGFwZS54MyArICcsNTAgJyArICcgTCAnICsgc2hhcGUueDIgKyAnLCcgKyAoNTAgLSBzaGFwZS55MikgKyAnIEwgJyArIHNoYXBlLngxICsgJywnICsgKDUwIC0gc2hhcGUueTEpICsgJyBaJztcbiAgfVxuXG4gIFByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IHV0aWxzLmhhbmRsZUV2ZW50O1xuXG4gIFByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc0VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnBhcmVudC51aUNoYW5nZSgpO1xuICAgIHZhciBtZXRob2QgPSB0aGlzLmlzUHJldmlvdXMgPyAncHJldmlvdXMnIDogJ25leHQnO1xuICAgIHRoaXMucGFyZW50W21ldGhvZF0oKTtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cblxuICBQcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzRW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMuaXNFbmFibGVkID0gdHJ1ZTtcbiAgfTtcblxuICBQcmV2TmV4dEJ1dHRvbi5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNFbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzRW5hYmxlZCA9IGZhbHNlO1xuICB9O1xuXG4gIFByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaW5kZXggb2YgZmlyc3Qgb3IgbGFzdCBzbGlkZSwgaWYgcHJldmlvdXMgb3IgbmV4dFxuICAgIHZhciBzbGlkZXMgPSB0aGlzLnBhcmVudC5zbGlkZXM7IC8vIGVuYWJsZSBpcyB3cmFwQXJvdW5kIGFuZCBhdCBsZWFzdCAyIHNsaWRlc1xuXG4gICAgaWYgKHRoaXMucGFyZW50Lm9wdGlvbnMud3JhcEFyb3VuZCAmJiBzbGlkZXMubGVuZ3RoID4gMSkge1xuICAgICAgdGhpcy5lbmFibGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbGFzdEluZGV4ID0gc2xpZGVzLmxlbmd0aCA/IHNsaWRlcy5sZW5ndGggLSAxIDogMDtcbiAgICB2YXIgYm91bmRJbmRleCA9IHRoaXMuaXNQcmV2aW91cyA/IDAgOiBsYXN0SW5kZXg7XG4gICAgdmFyIG1ldGhvZCA9IHRoaXMucGFyZW50LnNlbGVjdGVkSW5kZXggPT0gYm91bmRJbmRleCA/ICdkaXNhYmxlJyA6ICdlbmFibGUnO1xuICAgIHRoaXNbbWV0aG9kXSgpO1xuICB9O1xuXG4gIFByZXZOZXh0QnV0dG9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGVhY3RpdmF0ZSgpO1xuICAgIHRoaXMuYWxsT2ZmKCk7XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEZsaWNraXR5IHByb3RvdHlwZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgdXRpbHMuZXh0ZW5kKEZsaWNraXR5LmRlZmF1bHRzLCB7XG4gICAgcHJldk5leHRCdXR0b25zOiB0cnVlLFxuICAgIGFycm93U2hhcGU6IHtcbiAgICAgIHgwOiAxMCxcbiAgICAgIHgxOiA2MCxcbiAgICAgIHkxOiA1MCxcbiAgICAgIHgyOiA3MCxcbiAgICAgIHkyOiA0MCxcbiAgICAgIHgzOiAzMFxuICAgIH1cbiAgfSk7XG4gIEZsaWNraXR5LmNyZWF0ZU1ldGhvZHMucHVzaCgnX2NyZWF0ZVByZXZOZXh0QnV0dG9ucycpO1xuICB2YXIgcHJvdG8gPSBGbGlja2l0eS5wcm90b3R5cGU7XG5cbiAgcHJvdG8uX2NyZWF0ZVByZXZOZXh0QnV0dG9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5wcmV2TmV4dEJ1dHRvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnByZXZCdXR0b24gPSBuZXcgUHJldk5leHRCdXR0b24oLTEsIHRoaXMpO1xuICAgIHRoaXMubmV4dEJ1dHRvbiA9IG5ldyBQcmV2TmV4dEJ1dHRvbigxLCB0aGlzKTtcbiAgICB0aGlzLm9uKCdhY3RpdmF0ZScsIHRoaXMuYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMpO1xuICB9O1xuXG4gIHByb3RvLmFjdGl2YXRlUHJldk5leHRCdXR0b25zID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucHJldkJ1dHRvbi5hY3RpdmF0ZSgpO1xuICAgIHRoaXMubmV4dEJ1dHRvbi5hY3RpdmF0ZSgpO1xuICAgIHRoaXMub24oJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMpO1xuICB9O1xuXG4gIHByb3RvLmRlYWN0aXZhdGVQcmV2TmV4dEJ1dHRvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wcmV2QnV0dG9uLmRlYWN0aXZhdGUoKTtcbiAgICB0aGlzLm5leHRCdXR0b24uZGVhY3RpdmF0ZSgpO1xuICAgIHRoaXMub2ZmKCdkZWFjdGl2YXRlJywgdGhpcy5kZWFjdGl2YXRlUHJldk5leHRCdXR0b25zKTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICBGbGlja2l0eS5QcmV2TmV4dEJ1dHRvbiA9IFByZXZOZXh0QnV0dG9uO1xuICByZXR1cm4gRmxpY2tpdHk7XG59KTsgLy8gcGFnZSBkb3RzXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdmbGlja2l0eS9qcy9wYWdlLWRvdHMnLCBbJy4vZmxpY2tpdHknLCAndW5pcG9pbnRlci91bmlwb2ludGVyJywgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ10sIGZ1bmN0aW9uIChGbGlja2l0eSwgVW5pcG9pbnRlciwgdXRpbHMpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgRmxpY2tpdHksIFVuaXBvaW50ZXIsIHV0aWxzKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCcuL2ZsaWNraXR5JyksIHJlcXVpcmUoJ3VuaXBvaW50ZXInKSwgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdywgd2luZG93LkZsaWNraXR5LCB3aW5kb3cuVW5pcG9pbnRlciwgd2luZG93LmZpenp5VUlVdGlscyk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIEZsaWNraXR5LCBVbmlwb2ludGVyLCB1dGlscykge1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQYWdlRG90cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICBmdW5jdGlvbiBQYWdlRG90cyhwYXJlbnQpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG5cbiAgUGFnZURvdHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVbmlwb2ludGVyLnByb3RvdHlwZSk7XG5cbiAgUGFnZURvdHMucHJvdG90eXBlLl9jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gY3JlYXRlIGhvbGRlciBlbGVtZW50XG4gICAgdGhpcy5ob2xkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvbCcpO1xuICAgIHRoaXMuaG9sZGVyLmNsYXNzTmFtZSA9ICdmbGlja2l0eS1wYWdlLWRvdHMnOyAvLyBjcmVhdGUgZG90cywgYXJyYXkgb2YgZWxlbWVudHNcblxuICAgIHRoaXMuZG90cyA9IFtdOyAvLyBldmVudHNcblxuICAgIHRoaXMuaGFuZGxlQ2xpY2sgPSB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uKCdwb2ludGVyRG93bicsIHRoaXMucGFyZW50LmNoaWxkVUlQb2ludGVyRG93bi5iaW5kKHRoaXMucGFyZW50KSk7XG4gIH07XG5cbiAgUGFnZURvdHMucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0RG90cygpO1xuICAgIHRoaXMuaG9sZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgdGhpcy5iaW5kU3RhcnRFdmVudCh0aGlzLmhvbGRlcik7IC8vIGFkZCB0byBET01cblxuICAgIHRoaXMucGFyZW50LmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5ob2xkZXIpO1xuICB9O1xuXG4gIFBhZ2VEb3RzLnByb3RvdHlwZS5kZWFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaG9sZGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljayk7XG4gICAgdGhpcy51bmJpbmRTdGFydEV2ZW50KHRoaXMuaG9sZGVyKTsgLy8gcmVtb3ZlIGZyb20gRE9NXG5cbiAgICB0aGlzLnBhcmVudC5lbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuaG9sZGVyKTtcbiAgfTtcblxuICBQYWdlRG90cy5wcm90b3R5cGUuc2V0RG90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBnZXQgZGlmZmVyZW5jZSBiZXR3ZWVuIG51bWJlciBvZiBzbGlkZXMgYW5kIG51bWJlciBvZiBkb3RzXG4gICAgdmFyIGRlbHRhID0gdGhpcy5wYXJlbnQuc2xpZGVzLmxlbmd0aCAtIHRoaXMuZG90cy5sZW5ndGg7XG5cbiAgICBpZiAoZGVsdGEgPiAwKSB7XG4gICAgICB0aGlzLmFkZERvdHMoZGVsdGEpO1xuICAgIH0gZWxzZSBpZiAoZGVsdGEgPCAwKSB7XG4gICAgICB0aGlzLnJlbW92ZURvdHMoLWRlbHRhKTtcbiAgICB9XG4gIH07XG5cbiAgUGFnZURvdHMucHJvdG90eXBlLmFkZERvdHMgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIG5ld0RvdHMgPSBbXTtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5kb3RzLmxlbmd0aDtcbiAgICB2YXIgbWF4ID0gbGVuZ3RoICsgY291bnQ7XG5cbiAgICBmb3IgKHZhciBpID0gbGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICAgIHZhciBkb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgZG90LmNsYXNzTmFtZSA9ICdkb3QnO1xuICAgICAgZG90LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdQYWdlIGRvdCAnICsgKGkgKyAxKSk7XG4gICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChkb3QpO1xuICAgICAgbmV3RG90cy5wdXNoKGRvdCk7XG4gICAgfVxuXG4gICAgdGhpcy5ob2xkZXIuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgIHRoaXMuZG90cyA9IHRoaXMuZG90cy5jb25jYXQobmV3RG90cyk7XG4gIH07XG5cbiAgUGFnZURvdHMucHJvdG90eXBlLnJlbW92ZURvdHMgPSBmdW5jdGlvbiAoY291bnQpIHtcbiAgICAvLyByZW1vdmUgZnJvbSB0aGlzLmRvdHMgY29sbGVjdGlvblxuICAgIHZhciByZW1vdmVEb3RzID0gdGhpcy5kb3RzLnNwbGljZSh0aGlzLmRvdHMubGVuZ3RoIC0gY291bnQsIGNvdW50KTsgLy8gcmVtb3ZlIGZyb20gRE9NXG5cbiAgICByZW1vdmVEb3RzLmZvckVhY2goZnVuY3Rpb24gKGRvdCkge1xuICAgICAgdGhpcy5ob2xkZXIucmVtb3ZlQ2hpbGQoZG90KTtcbiAgICB9LCB0aGlzKTtcbiAgfTtcblxuICBQYWdlRG90cy5wcm90b3R5cGUudXBkYXRlU2VsZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcmVtb3ZlIHNlbGVjdGVkIGNsYXNzIG9uIHByZXZpb3VzXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWREb3QpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWREb3QuY2xhc3NOYW1lID0gJ2RvdCc7XG4gICAgICB0aGlzLnNlbGVjdGVkRG90LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1jdXJyZW50Jyk7XG4gICAgfSAvLyBkb24ndCBwcm9jZWVkIGlmIG5vIGRvdHNcblxuXG4gICAgaWYgKCF0aGlzLmRvdHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZWxlY3RlZERvdCA9IHRoaXMuZG90c1t0aGlzLnBhcmVudC5zZWxlY3RlZEluZGV4XTtcbiAgICB0aGlzLnNlbGVjdGVkRG90LmNsYXNzTmFtZSA9ICdkb3QgaXMtc2VsZWN0ZWQnO1xuICAgIHRoaXMuc2VsZWN0ZWREb3Quc2V0QXR0cmlidXRlKCdhcmlhLWN1cnJlbnQnLCAnc3RlcCcpO1xuICB9O1xuXG4gIFBhZ2VEb3RzLnByb3RvdHlwZS5vblRhcCA9IC8vIG9sZCBtZXRob2QgbmFtZSwgYmFja3dhcmRzLWNvbXBhdGlibGVcbiAgUGFnZURvdHMucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0OyAvLyBvbmx5IGNhcmUgYWJvdXQgZG90IGNsaWNrc1xuXG4gICAgaWYgKHRhcmdldC5ub2RlTmFtZSAhPSAnTEknKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wYXJlbnQudWlDaGFuZ2UoKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmRvdHMuaW5kZXhPZih0YXJnZXQpO1xuICAgIHRoaXMucGFyZW50LnNlbGVjdChpbmRleCk7XG4gIH07XG5cbiAgUGFnZURvdHMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kZWFjdGl2YXRlKCk7XG4gICAgdGhpcy5hbGxPZmYoKTtcbiAgfTtcblxuICBGbGlja2l0eS5QYWdlRG90cyA9IFBhZ2VEb3RzOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBGbGlja2l0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIHV0aWxzLmV4dGVuZChGbGlja2l0eS5kZWZhdWx0cywge1xuICAgIHBhZ2VEb3RzOiB0cnVlXG4gIH0pO1xuICBGbGlja2l0eS5jcmVhdGVNZXRob2RzLnB1c2goJ19jcmVhdGVQYWdlRG90cycpO1xuICB2YXIgcHJvdG8gPSBGbGlja2l0eS5wcm90b3R5cGU7XG5cbiAgcHJvdG8uX2NyZWF0ZVBhZ2VEb3RzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5vcHRpb25zLnBhZ2VEb3RzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wYWdlRG90cyA9IG5ldyBQYWdlRG90cyh0aGlzKTsgLy8gZXZlbnRzXG5cbiAgICB0aGlzLm9uKCdhY3RpdmF0ZScsIHRoaXMuYWN0aXZhdGVQYWdlRG90cyk7XG4gICAgdGhpcy5vbignc2VsZWN0JywgdGhpcy51cGRhdGVTZWxlY3RlZFBhZ2VEb3RzKTtcbiAgICB0aGlzLm9uKCdjZWxsQ2hhbmdlJywgdGhpcy51cGRhdGVQYWdlRG90cyk7XG4gICAgdGhpcy5vbigncmVzaXplJywgdGhpcy51cGRhdGVQYWdlRG90cyk7XG4gICAgdGhpcy5vbignZGVhY3RpdmF0ZScsIHRoaXMuZGVhY3RpdmF0ZVBhZ2VEb3RzKTtcbiAgfTtcblxuICBwcm90by5hY3RpdmF0ZVBhZ2VEb3RzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGFnZURvdHMuYWN0aXZhdGUoKTtcbiAgfTtcblxuICBwcm90by51cGRhdGVTZWxlY3RlZFBhZ2VEb3RzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGFnZURvdHMudXBkYXRlU2VsZWN0ZWQoKTtcbiAgfTtcblxuICBwcm90by51cGRhdGVQYWdlRG90cyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBhZ2VEb3RzLnNldERvdHMoKTtcbiAgfTtcblxuICBwcm90by5kZWFjdGl2YXRlUGFnZURvdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wYWdlRG90cy5kZWFjdGl2YXRlKCk7XG4gIH07IC8vIC0tLS0tICAtLS0tLSAvL1xuXG5cbiAgRmxpY2tpdHkuUGFnZURvdHMgPSBQYWdlRG90cztcbiAgcmV0dXJuIEZsaWNraXR5O1xufSk7IC8vIHBsYXllciAmIGF1dG9QbGF5XG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdmbGlja2l0eS9qcy9wbGF5ZXInLCBbJ2V2LWVtaXR0ZXIvZXYtZW1pdHRlcicsICdmaXp6eS11aS11dGlscy91dGlscycsICcuL2ZsaWNraXR5J10sIGZ1bmN0aW9uIChFdkVtaXR0ZXIsIHV0aWxzLCBGbGlja2l0eSkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoRXZFbWl0dGVyLCB1dGlscywgRmxpY2tpdHkpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdldi1lbWl0dGVyJyksIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJyksIHJlcXVpcmUoJy4vZmxpY2tpdHknKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdy5FdkVtaXR0ZXIsIHdpbmRvdy5maXp6eVVJVXRpbHMsIHdpbmRvdy5GbGlja2l0eSk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeShFdkVtaXR0ZXIsIHV0aWxzLCBGbGlja2l0eSkge1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQbGF5ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgZnVuY3Rpb24gUGxheWVyKHBhcmVudCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuc3RhdGUgPSAnc3RvcHBlZCc7IC8vIHZpc2liaWxpdHkgY2hhbmdlIGV2ZW50IGhhbmRsZXJcblxuICAgIHRoaXMub25WaXNpYmlsaXR5Q2hhbmdlID0gdGhpcy52aXNpYmlsaXR5Q2hhbmdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vblZpc2liaWxpdHlQbGF5ID0gdGhpcy52aXNpYmlsaXR5UGxheS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgUGxheWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZFbWl0dGVyLnByb3RvdHlwZSk7IC8vIHN0YXJ0IHBsYXlcblxuICBQbGF5ZXIucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT0gJ3BsYXlpbmcnKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBkbyBub3QgcGxheSBpZiBwYWdlIGlzIGhpZGRlbiwgc3RhcnQgcGxheWluZyB3aGVuIHBhZ2UgaXMgdmlzaWJsZVxuXG5cbiAgICB2YXIgaXNQYWdlSGlkZGVuID0gZG9jdW1lbnQuaGlkZGVuO1xuXG4gICAgaWYgKGlzUGFnZUhpZGRlbikge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMub25WaXNpYmlsaXR5UGxheSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0ZSA9ICdwbGF5aW5nJzsgLy8gbGlzdGVuIHRvIHZpc2liaWxpdHkgY2hhbmdlXG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5vblZpc2liaWxpdHlDaGFuZ2UpOyAvLyBzdGFydCB0aWNraW5nXG5cbiAgICB0aGlzLnRpY2soKTtcbiAgfTtcblxuICBQbGF5ZXIucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZG8gbm90IHRpY2sgaWYgbm90IHBsYXlpbmdcbiAgICBpZiAodGhpcy5zdGF0ZSAhPSAncGxheWluZycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdGltZSA9IHRoaXMucGFyZW50Lm9wdGlvbnMuYXV0b1BsYXk7IC8vIGRlZmF1bHQgdG8gMyBzZWNvbmRzXG5cbiAgICB0aW1lID0gdHlwZW9mIHRpbWUgPT0gJ251bWJlcicgPyB0aW1lIDogMzAwMDtcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7IC8vIEhBQ0s6IHJlc2V0IHRpY2tzIGlmIHN0b3BwZWQgYW5kIHN0YXJ0ZWQgd2l0aGluIGludGVydmFsXG5cblxuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIF90aGlzLnBhcmVudC5uZXh0KHRydWUpO1xuXG4gICAgICBfdGhpcy50aWNrKCk7XG4gICAgfSwgdGltZSk7XG4gIH07XG5cbiAgUGxheWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhdGUgPSAnc3RvcHBlZCc7XG4gICAgdGhpcy5jbGVhcigpOyAvLyByZW1vdmUgdmlzaWJpbGl0eSBjaGFuZ2UgZXZlbnRcblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLm9uVmlzaWJpbGl0eUNoYW5nZSk7XG4gIH07XG5cbiAgUGxheWVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgfTtcblxuICBQbGF5ZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlID09ICdwbGF5aW5nJykge1xuICAgICAgdGhpcy5zdGF0ZSA9ICdwYXVzZWQnO1xuICAgICAgdGhpcy5jbGVhcigpO1xuICAgIH1cbiAgfTtcblxuICBQbGF5ZXIucHJvdG90eXBlLnVucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcmUtc3RhcnQgcGxheSBpZiBwYXVzZWRcbiAgICBpZiAodGhpcy5zdGF0ZSA9PSAncGF1c2VkJykge1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfVxuICB9OyAvLyBwYXVzZSBpZiBwYWdlIHZpc2liaWxpdHkgaXMgaGlkZGVuLCB1bnBhdXNlIGlmIHZpc2libGVcblxuXG4gIFBsYXllci5wcm90b3R5cGUudmlzaWJpbGl0eUNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaXNQYWdlSGlkZGVuID0gZG9jdW1lbnQuaGlkZGVuO1xuICAgIHRoaXNbaXNQYWdlSGlkZGVuID8gJ3BhdXNlJyA6ICd1bnBhdXNlJ10oKTtcbiAgfTtcblxuICBQbGF5ZXIucHJvdG90eXBlLnZpc2liaWxpdHlQbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGxheSgpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLm9uVmlzaWJpbGl0eVBsYXkpO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBGbGlja2l0eSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgdXRpbHMuZXh0ZW5kKEZsaWNraXR5LmRlZmF1bHRzLCB7XG4gICAgcGF1c2VBdXRvUGxheU9uSG92ZXI6IHRydWVcbiAgfSk7XG4gIEZsaWNraXR5LmNyZWF0ZU1ldGhvZHMucHVzaCgnX2NyZWF0ZVBsYXllcicpO1xuICB2YXIgcHJvdG8gPSBGbGlja2l0eS5wcm90b3R5cGU7XG5cbiAgcHJvdG8uX2NyZWF0ZVBsYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIodGhpcyk7XG4gICAgdGhpcy5vbignYWN0aXZhdGUnLCB0aGlzLmFjdGl2YXRlUGxheWVyKTtcbiAgICB0aGlzLm9uKCd1aUNoYW5nZScsIHRoaXMuc3RvcFBsYXllcik7XG4gICAgdGhpcy5vbigncG9pbnRlckRvd24nLCB0aGlzLnN0b3BQbGF5ZXIpO1xuICAgIHRoaXMub24oJ2RlYWN0aXZhdGUnLCB0aGlzLmRlYWN0aXZhdGVQbGF5ZXIpO1xuICB9O1xuXG4gIHByb3RvLmFjdGl2YXRlUGxheWVyID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5vcHRpb25zLmF1dG9QbGF5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wbGF5ZXIucGxheSgpO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgdGhpcyk7XG4gIH07IC8vIFBsYXllciBBUEksIGRvbid0IGhhdGUgdGhlIC4uLiB0aGFua3MgSSBrbm93IHdoZXJlIHRoZSBkb29yIGlzXG5cblxuICBwcm90by5wbGF5UGxheWVyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGxheWVyLnBsYXkoKTtcbiAgfTtcblxuICBwcm90by5zdG9wUGxheWVyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucGxheWVyLnN0b3AoKTtcbiAgfTtcblxuICBwcm90by5wYXVzZVBsYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBsYXllci5wYXVzZSgpO1xuICB9O1xuXG4gIHByb3RvLnVucGF1c2VQbGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wbGF5ZXIudW5wYXVzZSgpO1xuICB9O1xuXG4gIHByb3RvLmRlYWN0aXZhdGVQbGF5ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wbGF5ZXIuc3RvcCgpO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgdGhpcyk7XG4gIH07IC8vIC0tLS0tIG1vdXNlZW50ZXIvbGVhdmUgLS0tLS0gLy9cbiAgLy8gcGF1c2UgYXV0by1wbGF5IG9uIGhvdmVyXG5cblxuICBwcm90by5vbm1vdXNlZW50ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMucGF1c2VBdXRvUGxheU9uSG92ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnBsYXllci5wYXVzZSgpO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcyk7XG4gIH07IC8vIHJlc3VtZSBhdXRvLXBsYXkgb24gaG92ZXIgb2ZmXG5cblxuICBwcm90by5vbm1vdXNlbGVhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5wbGF5ZXIudW5wYXVzZSgpO1xuICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcyk7XG4gIH07IC8vIC0tLS0tICAtLS0tLSAvL1xuXG5cbiAgRmxpY2tpdHkuUGxheWVyID0gUGxheWVyO1xuICByZXR1cm4gRmxpY2tpdHk7XG59KTsgLy8gYWRkLCByZW1vdmUgY2VsbFxuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZmxpY2tpdHkvanMvYWRkLXJlbW92ZS1jZWxsJywgWycuL2ZsaWNraXR5JywgJ2Zpenp5LXVpLXV0aWxzL3V0aWxzJ10sIGZ1bmN0aW9uIChGbGlja2l0eSwgdXRpbHMpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KHdpbmRvdywgRmxpY2tpdHksIHV0aWxzKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCcuL2ZsaWNraXR5JyksIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5GbGlja2l0eSwgd2luZG93LmZpenp5VUlVdGlscyk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIEZsaWNraXR5LCB1dGlscykge1xuICAvLyBhcHBlbmQgY2VsbHMgdG8gYSBkb2N1bWVudCBmcmFnbWVudFxuICBmdW5jdGlvbiBnZXRDZWxsc0ZyYWdtZW50KGNlbGxzKSB7XG4gICAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGNlbGxzLmZvckVhY2goZnVuY3Rpb24gKGNlbGwpIHtcbiAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGNlbGwuZWxlbWVudCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGZyYWdtZW50O1xuICB9IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGFkZC9yZW1vdmUgY2VsbCBwcm90b3R5cGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIHZhciBwcm90byA9IEZsaWNraXR5LnByb3RvdHlwZTtcbiAgLyoqXG4gICAqIEluc2VydCwgcHJlcGVuZCwgb3IgYXBwZW5kIGNlbGxzXG4gICAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICAgKiBAcGFyYW0ge0ludGVnZXJ9IGluZGV4XG4gICAqL1xuXG4gIHByb3RvLmluc2VydCA9IGZ1bmN0aW9uIChlbGVtcywgaW5kZXgpIHtcbiAgICB2YXIgY2VsbHMgPSB0aGlzLl9tYWtlQ2VsbHMoZWxlbXMpO1xuXG4gICAgaWYgKCFjZWxscyB8fCAhY2VsbHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxlbiA9IHRoaXMuY2VsbHMubGVuZ3RoOyAvLyBkZWZhdWx0IHRvIGFwcGVuZFxuXG4gICAgaW5kZXggPSBpbmRleCA9PT0gdW5kZWZpbmVkID8gbGVuIDogaW5kZXg7IC8vIGFkZCBjZWxscyB3aXRoIGRvY3VtZW50IGZyYWdtZW50XG5cbiAgICB2YXIgZnJhZ21lbnQgPSBnZXRDZWxsc0ZyYWdtZW50KGNlbGxzKTsgLy8gYXBwZW5kIHRvIHNsaWRlclxuXG4gICAgdmFyIGlzQXBwZW5kID0gaW5kZXggPT0gbGVuO1xuXG4gICAgaWYgKGlzQXBwZW5kKSB7XG4gICAgICB0aGlzLnNsaWRlci5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbnNlcnRDZWxsRWxlbWVudCA9IHRoaXMuY2VsbHNbaW5kZXhdLmVsZW1lbnQ7XG4gICAgICB0aGlzLnNsaWRlci5pbnNlcnRCZWZvcmUoZnJhZ21lbnQsIGluc2VydENlbGxFbGVtZW50KTtcbiAgICB9IC8vIGFkZCB0byB0aGlzLmNlbGxzXG5cblxuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgLy8gcHJlcGVuZCwgYWRkIHRvIHN0YXJ0XG4gICAgICB0aGlzLmNlbGxzID0gY2VsbHMuY29uY2F0KHRoaXMuY2VsbHMpO1xuICAgIH0gZWxzZSBpZiAoaXNBcHBlbmQpIHtcbiAgICAgIC8vIGFwcGVuZCwgYWRkIHRvIGVuZFxuICAgICAgdGhpcy5jZWxscyA9IHRoaXMuY2VsbHMuY29uY2F0KGNlbGxzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaW5zZXJ0IGluIHRoaXMuY2VsbHNcbiAgICAgIHZhciBlbmRDZWxscyA9IHRoaXMuY2VsbHMuc3BsaWNlKGluZGV4LCBsZW4gLSBpbmRleCk7XG4gICAgICB0aGlzLmNlbGxzID0gdGhpcy5jZWxscy5jb25jYXQoY2VsbHMpLmNvbmNhdChlbmRDZWxscyk7XG4gICAgfVxuXG4gICAgdGhpcy5fc2l6ZUNlbGxzKGNlbGxzKTtcblxuICAgIHRoaXMuY2VsbENoYW5nZShpbmRleCwgdHJ1ZSk7XG4gIH07XG5cbiAgcHJvdG8uYXBwZW5kID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdGhpcy5pbnNlcnQoZWxlbXMsIHRoaXMuY2VsbHMubGVuZ3RoKTtcbiAgfTtcblxuICBwcm90by5wcmVwZW5kID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdGhpcy5pbnNlcnQoZWxlbXMsIDApO1xuICB9O1xuICAvKipcbiAgICogUmVtb3ZlIGNlbGxzXG4gICAqIEBwYXJhbSB7RWxlbWVudCwgQXJyYXksIE5vZGVMaXN0fSBlbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBjZWxscyA9IHRoaXMuZ2V0Q2VsbHMoZWxlbXMpO1xuXG4gICAgaWYgKCFjZWxscyB8fCAhY2VsbHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG1pbkNlbGxJbmRleCA9IHRoaXMuY2VsbHMubGVuZ3RoIC0gMTsgLy8gcmVtb3ZlIGNlbGxzIGZyb20gY29sbGVjdGlvbiAmIERPTVxuXG4gICAgY2VsbHMuZm9yRWFjaChmdW5jdGlvbiAoY2VsbCkge1xuICAgICAgY2VsbC5yZW1vdmUoKTtcbiAgICAgIHZhciBpbmRleCA9IHRoaXMuY2VsbHMuaW5kZXhPZihjZWxsKTtcbiAgICAgIG1pbkNlbGxJbmRleCA9IE1hdGgubWluKGluZGV4LCBtaW5DZWxsSW5kZXgpO1xuICAgICAgdXRpbHMucmVtb3ZlRnJvbSh0aGlzLmNlbGxzLCBjZWxsKTtcbiAgICB9LCB0aGlzKTtcbiAgICB0aGlzLmNlbGxDaGFuZ2UobWluQ2VsbEluZGV4LCB0cnVlKTtcbiAgfTtcbiAgLyoqXG4gICAqIGxvZ2ljIHRvIGJlIHJ1biBhZnRlciBhIGNlbGwncyBzaXplIGNoYW5nZXNcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtIC0gY2VsbCdzIGVsZW1lbnRcbiAgICovXG5cblxuICBwcm90by5jZWxsU2l6ZUNoYW5nZSA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgdmFyIGNlbGwgPSB0aGlzLmdldENlbGwoZWxlbSk7XG5cbiAgICBpZiAoIWNlbGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjZWxsLmdldFNpemUoKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmNlbGxzLmluZGV4T2YoY2VsbCk7XG4gICAgdGhpcy5jZWxsQ2hhbmdlKGluZGV4KTtcbiAgfTtcbiAgLyoqXG4gICAqIGxvZ2ljIGFueSB0aW1lIGEgY2VsbCBpcyBjaGFuZ2VkOiBhZGRlZCwgcmVtb3ZlZCwgb3Igc2l6ZSBjaGFuZ2VkXG4gICAqIEBwYXJhbSB7SW50ZWdlcn0gY2hhbmdlZENlbGxJbmRleCAtIGluZGV4IG9mIHRoZSBjaGFuZ2VkIGNlbGwsIG9wdGlvbmFsXG4gICAqL1xuXG5cbiAgcHJvdG8uY2VsbENoYW5nZSA9IGZ1bmN0aW9uIChjaGFuZ2VkQ2VsbEluZGV4LCBpc1Bvc2l0aW9uaW5nU2xpZGVyKSB7XG4gICAgdmFyIHByZXZTZWxlY3RlZEVsZW0gPSB0aGlzLnNlbGVjdGVkRWxlbWVudDtcblxuICAgIHRoaXMuX3Bvc2l0aW9uQ2VsbHMoY2hhbmdlZENlbGxJbmRleCk7XG5cbiAgICB0aGlzLl9nZXRXcmFwU2hpZnRDZWxscygpO1xuXG4gICAgdGhpcy5zZXRHYWxsZXJ5U2l6ZSgpOyAvLyB1cGRhdGUgc2VsZWN0ZWRJbmRleFxuICAgIC8vIHRyeSB0byBtYWludGFpbiBwb3NpdGlvbiAmIHNlbGVjdCBwcmV2aW91cyBzZWxlY3RlZCBlbGVtZW50XG5cbiAgICB2YXIgY2VsbCA9IHRoaXMuZ2V0Q2VsbChwcmV2U2VsZWN0ZWRFbGVtKTtcblxuICAgIGlmIChjZWxsKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSB0aGlzLmdldENlbGxTbGlkZUluZGV4KGNlbGwpO1xuICAgIH1cblxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IE1hdGgubWluKHRoaXMuc2xpZGVzLmxlbmd0aCAtIDEsIHRoaXMuc2VsZWN0ZWRJbmRleCk7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ2NlbGxDaGFuZ2UnLCBbY2hhbmdlZENlbGxJbmRleF0pOyAvLyBwb3NpdGlvbiBzbGlkZXJcblxuICAgIHRoaXMuc2VsZWN0KHRoaXMuc2VsZWN0ZWRJbmRleCk7IC8vIGRvIG5vdCBwb3NpdGlvbiBzbGlkZXIgYWZ0ZXIgbGF6eSBsb2FkXG5cbiAgICBpZiAoaXNQb3NpdGlvbmluZ1NsaWRlcikge1xuICAgICAgdGhpcy5wb3NpdGlvblNsaWRlckF0U2VsZWN0ZWQoKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tICAtLS0tLSAvL1xuXG5cbiAgcmV0dXJuIEZsaWNraXR5O1xufSk7IC8vIGxhenlsb2FkXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdmbGlja2l0eS9qcy9sYXp5bG9hZCcsIFsnLi9mbGlja2l0eScsICdmaXp6eS11aS11dGlscy91dGlscyddLCBmdW5jdGlvbiAoRmxpY2tpdHksIHV0aWxzKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIEZsaWNraXR5LCB1dGlscyk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHdpbmRvdywgcmVxdWlyZSgnLi9mbGlja2l0eScpLCByZXF1aXJlKCdmaXp6eS11aS11dGlscycpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIGZhY3Rvcnkod2luZG93LCB3aW5kb3cuRmxpY2tpdHksIHdpbmRvdy5maXp6eVVJVXRpbHMpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3Rvcnkod2luZG93LCBGbGlja2l0eSwgdXRpbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZsaWNraXR5LmNyZWF0ZU1ldGhvZHMucHVzaCgnX2NyZWF0ZUxhenlsb2FkJyk7XG4gIHZhciBwcm90byA9IEZsaWNraXR5LnByb3RvdHlwZTtcblxuICBwcm90by5fY3JlYXRlTGF6eWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vbignc2VsZWN0JywgdGhpcy5sYXp5TG9hZCk7XG4gIH07XG5cbiAgcHJvdG8ubGF6eUxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhenlMb2FkID0gdGhpcy5vcHRpb25zLmxhenlMb2FkO1xuXG4gICAgaWYgKCFsYXp5TG9hZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gZ2V0IGFkamFjZW50IGNlbGxzLCB1c2UgbGF6eUxvYWQgb3B0aW9uIGZvciBhZGphY2VudCBjb3VudFxuXG5cbiAgICB2YXIgYWRqQ291bnQgPSB0eXBlb2YgbGF6eUxvYWQgPT0gJ251bWJlcicgPyBsYXp5TG9hZCA6IDA7XG4gICAgdmFyIGNlbGxFbGVtcyA9IHRoaXMuZ2V0QWRqYWNlbnRDZWxsRWxlbWVudHMoYWRqQ291bnQpOyAvLyBnZXQgbGF6eSBpbWFnZXMgaW4gdGhvc2UgY2VsbHNcblxuICAgIHZhciBsYXp5SW1hZ2VzID0gW107XG4gICAgY2VsbEVsZW1zLmZvckVhY2goZnVuY3Rpb24gKGNlbGxFbGVtKSB7XG4gICAgICB2YXIgbGF6eUNlbGxJbWFnZXMgPSBnZXRDZWxsTGF6eUltYWdlcyhjZWxsRWxlbSk7XG4gICAgICBsYXp5SW1hZ2VzID0gbGF6eUltYWdlcy5jb25jYXQobGF6eUNlbGxJbWFnZXMpO1xuICAgIH0pOyAvLyBsb2FkIGxhenkgaW1hZ2VzXG5cbiAgICBsYXp5SW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGltZykge1xuICAgICAgbmV3IExhenlMb2FkZXIoaW1nLCB0aGlzKTtcbiAgICB9LCB0aGlzKTtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXRDZWxsTGF6eUltYWdlcyhjZWxsRWxlbSkge1xuICAgIC8vIGNoZWNrIGlmIGNlbGwgZWxlbWVudCBpcyBsYXp5IGltYWdlXG4gICAgaWYgKGNlbGxFbGVtLm5vZGVOYW1lID09ICdJTUcnKSB7XG4gICAgICB2YXIgbGF6eWxvYWRBdHRyID0gY2VsbEVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWZsaWNraXR5LWxhenlsb2FkJyk7XG4gICAgICB2YXIgc3JjQXR0ciA9IGNlbGxFbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1mbGlja2l0eS1sYXp5bG9hZC1zcmMnKTtcbiAgICAgIHZhciBzcmNzZXRBdHRyID0gY2VsbEVsZW0uZ2V0QXR0cmlidXRlKCdkYXRhLWZsaWNraXR5LWxhenlsb2FkLXNyY3NldCcpO1xuXG4gICAgICBpZiAobGF6eWxvYWRBdHRyIHx8IHNyY0F0dHIgfHwgc3Jjc2V0QXR0cikge1xuICAgICAgICByZXR1cm4gW2NlbGxFbGVtXTtcbiAgICAgIH1cbiAgICB9IC8vIHNlbGVjdCBsYXp5IGltYWdlcyBpbiBjZWxsXG5cblxuICAgIHZhciBsYXp5U2VsZWN0b3IgPSAnaW1nW2RhdGEtZmxpY2tpdHktbGF6eWxvYWRdLCAnICsgJ2ltZ1tkYXRhLWZsaWNraXR5LWxhenlsb2FkLXNyY10sIGltZ1tkYXRhLWZsaWNraXR5LWxhenlsb2FkLXNyY3NldF0nO1xuICAgIHZhciBpbWdzID0gY2VsbEVsZW0ucXVlcnlTZWxlY3RvckFsbChsYXp5U2VsZWN0b3IpO1xuICAgIHJldHVybiB1dGlscy5tYWtlQXJyYXkoaW1ncyk7XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTGF6eUxvYWRlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBjbGFzcyB0byBoYW5kbGUgbG9hZGluZyBpbWFnZXNcbiAgICovXG5cblxuICBmdW5jdGlvbiBMYXp5TG9hZGVyKGltZywgZmxpY2tpdHkpIHtcbiAgICB0aGlzLmltZyA9IGltZztcbiAgICB0aGlzLmZsaWNraXR5ID0gZmxpY2tpdHk7XG4gICAgdGhpcy5sb2FkKCk7XG4gIH1cblxuICBMYXp5TG9hZGVyLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IHV0aWxzLmhhbmRsZUV2ZW50O1xuXG4gIExhenlMb2FkZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMpO1xuICAgIHRoaXMuaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcyk7IC8vIGdldCBzcmMgJiBzcmNzZXRcblxuICAgIHZhciBzcmMgPSB0aGlzLmltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmxpY2tpdHktbGF6eWxvYWQnKSB8fCB0aGlzLmltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmxpY2tpdHktbGF6eWxvYWQtc3JjJyk7XG4gICAgdmFyIHNyY3NldCA9IHRoaXMuaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1mbGlja2l0eS1sYXp5bG9hZC1zcmNzZXQnKTsgLy8gc2V0IHNyYyAmIHNlcnNldFxuXG4gICAgdGhpcy5pbWcuc3JjID0gc3JjO1xuXG4gICAgaWYgKHNyY3NldCkge1xuICAgICAgdGhpcy5pbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBzcmNzZXQpO1xuICAgIH0gLy8gcmVtb3ZlIGF0dHJcblxuXG4gICAgdGhpcy5pbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWZsaWNraXR5LWxhenlsb2FkJyk7XG4gICAgdGhpcy5pbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWZsaWNraXR5LWxhenlsb2FkLXNyYycpO1xuICAgIHRoaXMuaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1mbGlja2l0eS1sYXp5bG9hZC1zcmNzZXQnKTtcbiAgfTtcblxuICBMYXp5TG9hZGVyLnByb3RvdHlwZS5vbmxvYWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLmNvbXBsZXRlKGV2ZW50LCAnZmxpY2tpdHktbGF6eWxvYWRlZCcpO1xuICB9O1xuXG4gIExhenlMb2FkZXIucHJvdG90eXBlLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB0aGlzLmNvbXBsZXRlKGV2ZW50LCAnZmxpY2tpdHktbGF6eWVycm9yJyk7XG4gIH07XG5cbiAgTGF6eUxvYWRlci5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiAoZXZlbnQsIGNsYXNzTmFtZSkge1xuICAgIC8vIHVuYmluZCBldmVudHNcbiAgICB0aGlzLmltZy5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcyk7XG4gICAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzKTtcbiAgICB2YXIgY2VsbCA9IHRoaXMuZmxpY2tpdHkuZ2V0UGFyZW50Q2VsbCh0aGlzLmltZyk7XG4gICAgdmFyIGNlbGxFbGVtID0gY2VsbCAmJiBjZWxsLmVsZW1lbnQ7XG4gICAgdGhpcy5mbGlja2l0eS5jZWxsU2l6ZUNoYW5nZShjZWxsRWxlbSk7XG4gICAgdGhpcy5pbWcuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgIHRoaXMuZmxpY2tpdHkuZGlzcGF0Y2hFdmVudCgnbGF6eUxvYWQnLCBldmVudCwgY2VsbEVsZW0pO1xuICB9OyAvLyAtLS0tLSAgLS0tLS0gLy9cblxuXG4gIEZsaWNraXR5LkxhenlMb2FkZXIgPSBMYXp5TG9hZGVyO1xuICByZXR1cm4gRmxpY2tpdHk7XG59KTtcbi8qIVxuICogRmxpY2tpdHkgdjIuMi4xXG4gKiBUb3VjaCwgcmVzcG9uc2l2ZSwgZmxpY2thYmxlIGNhcm91c2Vsc1xuICpcbiAqIExpY2Vuc2VkIEdQTHYzIGZvciBvcGVuIHNvdXJjZSB1c2VcbiAqIG9yIEZsaWNraXR5IENvbW1lcmNpYWwgTGljZW5zZSBmb3IgY29tbWVyY2lhbCB1c2VcbiAqXG4gKiBodHRwczovL2ZsaWNraXR5Lm1ldGFmaXp6eS5jb1xuICogQ29weXJpZ2h0IDIwMTUtMjAxOSBNZXRhZml6enlcbiAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZmxpY2tpdHkvanMvaW5kZXgnLCBbJy4vZmxpY2tpdHknLCAnLi9kcmFnJywgJy4vcHJldi1uZXh0LWJ1dHRvbicsICcuL3BhZ2UtZG90cycsICcuL3BsYXllcicsICcuL2FkZC1yZW1vdmUtY2VsbCcsICcuL2xhenlsb2FkJ10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCcuL2ZsaWNraXR5JyksIHJlcXVpcmUoJy4vZHJhZycpLCByZXF1aXJlKCcuL3ByZXYtbmV4dC1idXR0b24nKSwgcmVxdWlyZSgnLi9wYWdlLWRvdHMnKSwgcmVxdWlyZSgnLi9wbGF5ZXInKSwgcmVxdWlyZSgnLi9hZGQtcmVtb3ZlLWNlbGwnKSwgcmVxdWlyZSgnLi9sYXp5bG9hZCcpKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KEZsaWNraXR5KSB7XG4gIC8qanNoaW50IHN0cmljdDogZmFsc2UqL1xuICByZXR1cm4gRmxpY2tpdHk7XG59KTtcbi8qIVxuICogRmxpY2tpdHkgYXNOYXZGb3IgdjIuMC4yXG4gKiBlbmFibGUgYXNOYXZGb3IgZm9yIEZsaWNraXR5XG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSwgc3RyaWN0OiB0cnVlKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKmpzaGludCBzdHJpY3Q6IGZhbHNlICovXG5cbiAgLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZmxpY2tpdHktYXMtbmF2LWZvci9hcy1uYXYtZm9yJywgWydmbGlja2l0eS9qcy9pbmRleCcsICdmaXp6eS11aS11dGlscy91dGlscyddLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnZmxpY2tpdHknKSwgcmVxdWlyZSgnZml6enktdWktdXRpbHMnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSBmYWN0b3J5KHdpbmRvdy5GbGlja2l0eSwgd2luZG93LmZpenp5VUlVdGlscyk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeShGbGlja2l0eSwgdXRpbHMpIHtcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gYXNOYXZGb3IgcHJvdG90eXBlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIEZsaWNraXR5LmRlZmF1bHRzLmFzTmF2Rm9yID0gbnVsbDtcbiAgRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlQXNOYXZGb3InKTtcbiAgdmFyIHByb3RvID0gRmxpY2tpdHkucHJvdG90eXBlO1xuXG4gIHByb3RvLl9jcmVhdGVBc05hdkZvciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9uKCdhY3RpdmF0ZScsIHRoaXMuYWN0aXZhdGVBc05hdkZvcik7XG4gICAgdGhpcy5vbignZGVhY3RpdmF0ZScsIHRoaXMuZGVhY3RpdmF0ZUFzTmF2Rm9yKTtcbiAgICB0aGlzLm9uKCdkZXN0cm95JywgdGhpcy5kZXN0cm95QXNOYXZGb3IpO1xuICAgIHZhciBhc05hdkZvck9wdGlvbiA9IHRoaXMub3B0aW9ucy5hc05hdkZvcjtcblxuICAgIGlmICghYXNOYXZGb3JPcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIEhBQ0sgZG8gYXN5bmMsIGdpdmUgdGltZSBmb3Igb3RoZXIgZmxpY2tpdHkgdG8gYmUgaW5pdGFsaXplZFxuXG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiBpbml0TmF2Q29tcGFuaW9uKCkge1xuICAgICAgX3RoaXMuc2V0TmF2Q29tcGFuaW9uKGFzTmF2Rm9yT3B0aW9uKTtcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5zZXROYXZDb21wYW5pb24gPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIGVsZW0gPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoZWxlbSk7XG4gICAgdmFyIGNvbXBhbmlvbiA9IEZsaWNraXR5LmRhdGEoZWxlbSk7IC8vIHN0b3AgaWYgbm8gY29tcGFuaW9uIG9yIGNvbXBhbmlvbiBpcyBzZWxmXG5cbiAgICBpZiAoIWNvbXBhbmlvbiB8fCBjb21wYW5pb24gPT0gdGhpcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMubmF2Q29tcGFuaW9uID0gY29tcGFuaW9uOyAvLyBjb21wYW5pb24gc2VsZWN0XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5vbk5hdkNvbXBhbmlvblNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIF90aGlzLm5hdkNvbXBhbmlvblNlbGVjdCgpO1xuICAgIH07XG5cbiAgICBjb21wYW5pb24ub24oJ3NlbGVjdCcsIHRoaXMub25OYXZDb21wYW5pb25TZWxlY3QpOyAvLyBjbGlja1xuXG4gICAgdGhpcy5vbignc3RhdGljQ2xpY2snLCB0aGlzLm9uTmF2U3RhdGljQ2xpY2spO1xuICAgIHRoaXMubmF2Q29tcGFuaW9uU2VsZWN0KHRydWUpO1xuICB9O1xuXG4gIHByb3RvLm5hdkNvbXBhbmlvblNlbGVjdCA9IGZ1bmN0aW9uIChpc0luc3RhbnQpIHtcbiAgICAvLyB3YWl0IGZvciBjb21wYW5pb24gJiBzZWxlY3RlZENlbGxzIGZpcnN0LiAjOFxuICAgIHZhciBjb21wYW5pb25DZWxscyA9IHRoaXMubmF2Q29tcGFuaW9uICYmIHRoaXMubmF2Q29tcGFuaW9uLnNlbGVjdGVkQ2VsbHM7XG5cbiAgICBpZiAoIWNvbXBhbmlvbkNlbGxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBzZWxlY3Qgc2xpZGUgdGhhdCBtYXRjaGVzIGZpcnN0IGNlbGwgb2Ygc2xpZGVcblxuXG4gICAgdmFyIHNlbGVjdGVkQ2VsbCA9IGNvbXBhbmlvbkNlbGxzWzBdO1xuICAgIHZhciBmaXJzdEluZGV4ID0gdGhpcy5uYXZDb21wYW5pb24uY2VsbHMuaW5kZXhPZihzZWxlY3RlZENlbGwpO1xuICAgIHZhciBsYXN0SW5kZXggPSBmaXJzdEluZGV4ICsgY29tcGFuaW9uQ2VsbHMubGVuZ3RoIC0gMTtcbiAgICB2YXIgc2VsZWN0SW5kZXggPSBNYXRoLmZsb29yKGxlcnAoZmlyc3RJbmRleCwgbGFzdEluZGV4LCB0aGlzLm5hdkNvbXBhbmlvbi5jZWxsQWxpZ24pKTtcbiAgICB0aGlzLnNlbGVjdENlbGwoc2VsZWN0SW5kZXgsIGZhbHNlLCBpc0luc3RhbnQpOyAvLyBzZXQgbmF2IHNlbGVjdGVkIGNsYXNzXG5cbiAgICB0aGlzLnJlbW92ZU5hdlNlbGVjdGVkRWxlbWVudHMoKTsgLy8gc3RvcCBpZiBjb21wYW5pb24gaGFzIG1vcmUgY2VsbHMgdGhhbiB0aGlzIG9uZVxuXG4gICAgaWYgKHNlbGVjdEluZGV4ID49IHRoaXMuY2VsbHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNlbGVjdGVkQ2VsbHMgPSB0aGlzLmNlbGxzLnNsaWNlKGZpcnN0SW5kZXgsIGxhc3RJbmRleCArIDEpO1xuICAgIHRoaXMubmF2U2VsZWN0ZWRFbGVtZW50cyA9IHNlbGVjdGVkQ2VsbHMubWFwKGZ1bmN0aW9uIChjZWxsKSB7XG4gICAgICByZXR1cm4gY2VsbC5lbGVtZW50O1xuICAgIH0pO1xuICAgIHRoaXMuY2hhbmdlTmF2U2VsZWN0ZWRDbGFzcygnYWRkJyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gbGVycChhLCBiLCB0KSB7XG4gICAgcmV0dXJuIChiIC0gYSkgKiB0ICsgYTtcbiAgfVxuXG4gIHByb3RvLmNoYW5nZU5hdlNlbGVjdGVkQ2xhc3MgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgdGhpcy5uYXZTZWxlY3RlZEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG5hdkVsZW0pIHtcbiAgICAgIG5hdkVsZW0uY2xhc3NMaXN0W21ldGhvZF0oJ2lzLW5hdi1zZWxlY3RlZCcpO1xuICAgIH0pO1xuICB9O1xuXG4gIHByb3RvLmFjdGl2YXRlQXNOYXZGb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5uYXZDb21wYW5pb25TZWxlY3QodHJ1ZSk7XG4gIH07XG5cbiAgcHJvdG8ucmVtb3ZlTmF2U2VsZWN0ZWRFbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMubmF2U2VsZWN0ZWRFbGVtZW50cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2hhbmdlTmF2U2VsZWN0ZWRDbGFzcygncmVtb3ZlJyk7XG4gICAgZGVsZXRlIHRoaXMubmF2U2VsZWN0ZWRFbGVtZW50cztcbiAgfTtcblxuICBwcm90by5vbk5hdlN0YXRpY0NsaWNrID0gZnVuY3Rpb24gKGV2ZW50LCBwb2ludGVyLCBjZWxsRWxlbWVudCwgY2VsbEluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBjZWxsSW5kZXggPT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMubmF2Q29tcGFuaW9uLnNlbGVjdENlbGwoY2VsbEluZGV4KTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uZGVhY3RpdmF0ZUFzTmF2Rm9yID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVtb3ZlTmF2U2VsZWN0ZWRFbGVtZW50cygpO1xuICB9O1xuXG4gIHByb3RvLmRlc3Ryb3lBc05hdkZvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMubmF2Q29tcGFuaW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5uYXZDb21wYW5pb24ub2ZmKCdzZWxlY3QnLCB0aGlzLm9uTmF2Q29tcGFuaW9uU2VsZWN0KTtcbiAgICB0aGlzLm9mZignc3RhdGljQ2xpY2snLCB0aGlzLm9uTmF2U3RhdGljQ2xpY2spO1xuICAgIGRlbGV0ZSB0aGlzLm5hdkNvbXBhbmlvbjtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cblxuICByZXR1cm4gRmxpY2tpdHk7XG59KTtcbi8qIVxuICogaW1hZ2VzTG9hZGVkIHY0LjEuNFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAndXNlIHN0cmljdCc7IC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdpbWFnZXNsb2FkZWQvaW1hZ2VzbG9hZGVkJywgWydldi1lbWl0dGVyL2V2LWVtaXR0ZXInXSwgZnVuY3Rpb24gKEV2RW1pdHRlcikge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkod2luZG93LCBFdkVtaXR0ZXIpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3csIHJlcXVpcmUoJ2V2LWVtaXR0ZXInKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuaW1hZ2VzTG9hZGVkID0gZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5FdkVtaXR0ZXIpO1xuICB9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHZvaWQgMCwgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIGZhY3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbmZ1bmN0aW9uIGZhY3Rvcnkod2luZG93LCBFdkVtaXR0ZXIpIHtcbiAgdmFyICQgPSB3aW5kb3cualF1ZXJ5O1xuICB2YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIGV4dGVuZCBvYmplY3RzXG5cbiAgZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcbiAgICBmb3IgKHZhciBwcm9wIGluIGIpIHtcbiAgICAgIGFbcHJvcF0gPSBiW3Byb3BdO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgdmFyIGFycmF5U2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7IC8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG5cbiAgZnVuY3Rpb24gbWFrZUFycmF5KG9iaikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgIC8vIHVzZSBvYmplY3QgaWYgYWxyZWFkeSBhbiBhcnJheVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICB2YXIgaXNBcnJheUxpa2UgPSBfdHlwZW9mKG9iaikgPT0gJ29iamVjdCcgJiYgdHlwZW9mIG9iai5sZW5ndGggPT0gJ251bWJlcic7XG5cbiAgICBpZiAoaXNBcnJheUxpa2UpIHtcbiAgICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICAgIHJldHVybiBhcnJheVNsaWNlLmNhbGwob2JqKTtcbiAgICB9IC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuXG5cbiAgICByZXR1cm4gW29ial07XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW1hZ2VzTG9hZGVkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXksIEVsZW1lbnQsIE5vZGVMaXN0LCBTdHJpbmd9IGVsZW1cbiAgICogQHBhcmFtIHtPYmplY3Qgb3IgRnVuY3Rpb259IG9wdGlvbnMgLSBpZiBmdW5jdGlvbiwgdXNlIGFzIGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uQWx3YXlzIC0gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG5cblxuICBmdW5jdGlvbiBJbWFnZXNMb2FkZWQoZWxlbSwgb3B0aW9ucywgb25BbHdheXMpIHtcbiAgICAvLyBjb2VyY2UgSW1hZ2VzTG9hZGVkKCkgd2l0aG91dCBuZXcsIHRvIGJlIG5ldyBJbWFnZXNMb2FkZWQoKVxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbWFnZXNMb2FkZWQpKSB7XG4gICAgICByZXR1cm4gbmV3IEltYWdlc0xvYWRlZChlbGVtLCBvcHRpb25zLCBvbkFsd2F5cyk7XG4gICAgfSAvLyB1c2UgZWxlbSBhcyBzZWxlY3RvciBzdHJpbmdcblxuXG4gICAgdmFyIHF1ZXJ5RWxlbSA9IGVsZW07XG5cbiAgICBpZiAodHlwZW9mIGVsZW0gPT0gJ3N0cmluZycpIHtcbiAgICAgIHF1ZXJ5RWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbSk7XG4gICAgfSAvLyBiYWlsIGlmIGJhZCBlbGVtZW50XG5cblxuICAgIGlmICghcXVlcnlFbGVtKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdCYWQgZWxlbWVudCBmb3IgaW1hZ2VzTG9hZGVkICcgKyAocXVlcnlFbGVtIHx8IGVsZW0pKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnRzID0gbWFrZUFycmF5KHF1ZXJ5RWxlbSk7XG4gICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMpOyAvLyBzaGlmdCBhcmd1bWVudHMgaWYgbm8gb3B0aW9ucyBzZXRcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvbkFsd2F5cyA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4dGVuZCh0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChvbkFsd2F5cykge1xuICAgICAgdGhpcy5vbignYWx3YXlzJywgb25BbHdheXMpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0SW1hZ2VzKCk7XG5cbiAgICBpZiAoJCkge1xuICAgICAgLy8gYWRkIGpRdWVyeSBEZWZlcnJlZCBvYmplY3RcbiAgICAgIHRoaXMuanFEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gICAgfSAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcblxuXG4gICAgc2V0VGltZW91dCh0aGlzLmNoZWNrLmJpbmQodGhpcykpO1xuICB9XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZFbWl0dGVyLnByb3RvdHlwZSk7XG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuZ2V0SW1hZ2VzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaW1hZ2VzID0gW107IC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG5cbiAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2godGhpcy5hZGRFbGVtZW50SW1hZ2VzLCB0aGlzKTtcbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudFxuICAgKi9cblxuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkRWxlbWVudEltYWdlcyA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gICAgaWYgKGVsZW0ubm9kZU5hbWUgPT0gJ0lNRycpIHtcbiAgICAgIHRoaXMuYWRkSW1hZ2UoZWxlbSk7XG4gICAgfSAvLyBnZXQgYmFja2dyb3VuZCBpbWFnZSBvbiBlbGVtZW50XG5cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja2dyb3VuZCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5hZGRFbGVtZW50QmFja2dyb3VuZEltYWdlcyhlbGVtKTtcbiAgICB9IC8vIGZpbmQgY2hpbGRyZW5cbiAgICAvLyBubyBub24tZWxlbWVudCBub2RlcywgIzE0M1xuXG5cbiAgICB2YXIgbm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xuXG4gICAgaWYgKCFub2RlVHlwZSB8fCAhZWxlbWVudE5vZGVUeXBlc1tub2RlVHlwZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY2hpbGRJbWdzID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTsgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRJbWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW1nID0gY2hpbGRJbWdzW2ldO1xuICAgICAgdGhpcy5hZGRJbWFnZShpbWcpO1xuICAgIH0gLy8gZ2V0IGNoaWxkIGJhY2tncm91bmQgaW1hZ2VzXG5cblxuICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmJhY2tncm91bmQgPT0gJ3N0cmluZycpIHtcbiAgICAgIHZhciBjaGlsZHJlbiA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCh0aGlzLm9wdGlvbnMuYmFja2dyb3VuZCk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgdGhpcy5hZGRFbGVtZW50QmFja2dyb3VuZEltYWdlcyhjaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHZhciBlbGVtZW50Tm9kZVR5cGVzID0ge1xuICAgIDE6IHRydWUsXG4gICAgOTogdHJ1ZSxcbiAgICAxMTogdHJ1ZVxuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkRWxlbWVudEJhY2tncm91bmRJbWFnZXMgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cbiAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAvLyBGaXJlZm94IHJldHVybnMgbnVsbCBpZiBpbiBhIGhpZGRlbiBpZnJhbWUgaHR0cHM6Ly9idWd6aWwubGEvNTQ4Mzk3XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBnZXQgdXJsIGluc2lkZSB1cmwoXCIuLi5cIilcblxuXG4gICAgdmFyIHJlVVJMID0gL3VybFxcKChbJ1wiXSk/KC4qPylcXDFcXCkvZ2k7XG4gICAgdmFyIG1hdGNoZXMgPSByZVVSTC5leGVjKHN0eWxlLmJhY2tncm91bmRJbWFnZSk7XG5cbiAgICB3aGlsZSAobWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgICAgdmFyIHVybCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1syXTtcblxuICAgICAgaWYgKHVybCkge1xuICAgICAgICB0aGlzLmFkZEJhY2tncm91bmQodXJsLCBlbGVtKTtcbiAgICAgIH1cblxuICAgICAgbWF0Y2hlcyA9IHJlVVJMLmV4ZWMoc3R5bGUuYmFja2dyb3VuZEltYWdlKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0ge0ltYWdlfSBpbWdcbiAgICovXG5cblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEltYWdlID0gZnVuY3Rpb24gKGltZykge1xuICAgIHZhciBsb2FkaW5nSW1hZ2UgPSBuZXcgTG9hZGluZ0ltYWdlKGltZyk7XG4gICAgdGhpcy5pbWFnZXMucHVzaChsb2FkaW5nSW1hZ2UpO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkQmFja2dyb3VuZCA9IGZ1bmN0aW9uICh1cmwsIGVsZW0pIHtcbiAgICB2YXIgYmFja2dyb3VuZCA9IG5ldyBCYWNrZ3JvdW5kKHVybCwgZWxlbSk7XG4gICAgdGhpcy5pbWFnZXMucHVzaChiYWNrZ3JvdW5kKTtcbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLnByb2dyZXNzZWRDb3VudCA9IDA7XG4gICAgdGhpcy5oYXNBbnlCcm9rZW4gPSBmYWxzZTsgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG5cbiAgICBpZiAoIXRoaXMuaW1hZ2VzLmxlbmd0aCkge1xuICAgICAgdGhpcy5jb21wbGV0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uUHJvZ3Jlc3MoaW1hZ2UsIGVsZW0sIG1lc3NhZ2UpIHtcbiAgICAgIC8vIEhBQ0sgLSBDaHJvbWUgdHJpZ2dlcnMgZXZlbnQgYmVmb3JlIG9iamVjdCBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZC4gIzgzXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMucHJvZ3Jlc3MoaW1hZ2UsIGVsZW0sIG1lc3NhZ2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5pbWFnZXMuZm9yRWFjaChmdW5jdGlvbiAobG9hZGluZ0ltYWdlKSB7XG4gICAgICBsb2FkaW5nSW1hZ2Uub25jZSgncHJvZ3Jlc3MnLCBvblByb2dyZXNzKTtcbiAgICAgIGxvYWRpbmdJbWFnZS5jaGVjaygpO1xuICAgIH0pO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoaW1hZ2UsIGVsZW0sIG1lc3NhZ2UpIHtcbiAgICB0aGlzLnByb2dyZXNzZWRDb3VudCsrO1xuICAgIHRoaXMuaGFzQW55QnJva2VuID0gdGhpcy5oYXNBbnlCcm9rZW4gfHwgIWltYWdlLmlzTG9hZGVkOyAvLyBwcm9ncmVzcyBldmVudFxuXG4gICAgdGhpcy5lbWl0RXZlbnQoJ3Byb2dyZXNzJywgW3RoaXMsIGltYWdlLCBlbGVtXSk7XG5cbiAgICBpZiAodGhpcy5qcURlZmVycmVkICYmIHRoaXMuanFEZWZlcnJlZC5ub3RpZnkpIHtcbiAgICAgIHRoaXMuanFEZWZlcnJlZC5ub3RpZnkodGhpcywgaW1hZ2UpO1xuICAgIH0gLy8gY2hlY2sgaWYgY29tcGxldGVkXG5cblxuICAgIGlmICh0aGlzLnByb2dyZXNzZWRDb3VudCA9PSB0aGlzLmltYWdlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnICYmIGNvbnNvbGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdwcm9ncmVzczogJyArIG1lc3NhZ2UsIGltYWdlLCBlbGVtKTtcbiAgICB9XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXZlbnROYW1lID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAnZmFpbCcgOiAnZG9uZSc7XG4gICAgdGhpcy5pc0NvbXBsZXRlID0gdHJ1ZTtcbiAgICB0aGlzLmVtaXRFdmVudChldmVudE5hbWUsIFt0aGlzXSk7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ2Fsd2F5cycsIFt0aGlzXSk7XG5cbiAgICBpZiAodGhpcy5qcURlZmVycmVkKSB7XG4gICAgICB2YXIganFNZXRob2QgPSB0aGlzLmhhc0FueUJyb2tlbiA/ICdyZWplY3QnIDogJ3Jlc29sdmUnO1xuICAgICAgdGhpcy5qcURlZmVycmVkW2pxTWV0aG9kXSh0aGlzKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgZnVuY3Rpb24gTG9hZGluZ0ltYWdlKGltZykge1xuICAgIHRoaXMuaW1nID0gaW1nO1xuICB9XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZFbWl0dGVyLnByb3RvdHlwZSk7XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBJZiBjb21wbGV0ZSBpcyB0cnVlIGFuZCBicm93c2VyIHN1cHBvcnRzIG5hdHVyYWwgc2l6ZXMsXG4gICAgLy8gdHJ5IHRvIGNoZWNrIGZvciBpbWFnZSBzdGF0dXMgbWFudWFsbHkuXG4gICAgdmFyIGlzQ29tcGxldGUgPSB0aGlzLmdldElzSW1hZ2VDb21wbGV0ZSgpO1xuXG4gICAgaWYgKGlzQ29tcGxldGUpIHtcbiAgICAgIC8vIHJlcG9ydCBiYXNlZCBvbiBuYXR1cmFsV2lkdGhcbiAgICAgIHRoaXMuY29uZmlybSh0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IDAsICduYXR1cmFsV2lkdGgnKTtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIElmIG5vbmUgb2YgdGhlIGNoZWNrcyBhYm92ZSBtYXRjaGVkLCBzaW11bGF0ZSBsb2FkaW5nIG9uIGRldGFjaGVkIGVsZW1lbnQuXG5cblxuICAgIHRoaXMucHJveHlJbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIHRoaXMucHJveHlJbWFnZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcyk7XG4gICAgdGhpcy5wcm94eUltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcyk7IC8vIGJpbmQgdG8gaW1hZ2UgYXMgd2VsbCBmb3IgRmlyZWZveC4gIzE5MVxuXG4gICAgdGhpcy5pbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMpO1xuICAgIHRoaXMuaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcyk7XG4gICAgdGhpcy5wcm94eUltYWdlLnNyYyA9IHRoaXMuaW1nLnNyYztcbiAgfTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmdldElzSW1hZ2VDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBjaGVjayBmb3Igbm9uLXplcm8sIG5vbi11bmRlZmluZWQgbmF0dXJhbFdpZHRoXG4gICAgLy8gZml4ZXMgU2FmYXJpK0luZmluaXRlU2Nyb2xsK01hc29ucnkgYnVnIGluZmluaXRlLXNjcm9sbCM2NzFcbiAgICByZXR1cm4gdGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoO1xuICB9O1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuY29uZmlybSA9IGZ1bmN0aW9uIChpc0xvYWRlZCwgbWVzc2FnZSkge1xuICAgIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgICB0aGlzLmVtaXRFdmVudCgncHJvZ3Jlc3MnLCBbdGhpcywgdGhpcy5pbWcsIG1lc3NhZ2VdKTtcbiAgfTsgLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG4gIC8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcblxuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG5cbiAgICBpZiAodGhpc1ttZXRob2RdKSB7XG4gICAgICB0aGlzW21ldGhvZF0oZXZlbnQpO1xuICAgIH1cbiAgfTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNvbmZpcm0odHJ1ZSwgJ29ubG9hZCcpO1xuICAgIHRoaXMudW5iaW5kRXZlbnRzKCk7XG4gIH07XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY29uZmlybShmYWxzZSwgJ29uZXJyb3InKTtcbiAgICB0aGlzLnVuYmluZEV2ZW50cygpO1xuICB9O1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUudW5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucHJveHlJbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgdGhpcyk7XG4gICAgdGhpcy5wcm94eUltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcyk7XG4gICAgdGhpcy5pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIHRoaXMpO1xuICAgIHRoaXMuaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgdGhpcyk7XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEJhY2tncm91bmQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIGZ1bmN0aW9uIEJhY2tncm91bmQodXJsLCBlbGVtZW50KSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmltZyA9IG5ldyBJbWFnZSgpO1xuICB9IC8vIGluaGVyaXQgTG9hZGluZ0ltYWdlIHByb3RvdHlwZVxuXG5cbiAgQmFja2dyb3VuZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExvYWRpbmdJbWFnZS5wcm90b3R5cGUpO1xuXG4gIEJhY2tncm91bmQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzKTtcbiAgICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMpO1xuICAgIHRoaXMuaW1nLnNyYyA9IHRoaXMudXJsOyAvLyBjaGVjayBpZiBpbWFnZSBpcyBhbHJlYWR5IGNvbXBsZXRlXG5cbiAgICB2YXIgaXNDb21wbGV0ZSA9IHRoaXMuZ2V0SXNJbWFnZUNvbXBsZXRlKCk7XG5cbiAgICBpZiAoaXNDb21wbGV0ZSkge1xuICAgICAgdGhpcy5jb25maXJtKHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gMCwgJ25hdHVyYWxXaWR0aCcpO1xuICAgICAgdGhpcy51bmJpbmRFdmVudHMoKTtcbiAgICB9XG4gIH07XG5cbiAgQmFja2dyb3VuZC5wcm90b3R5cGUudW5iaW5kRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCB0aGlzKTtcbiAgICB0aGlzLmltZy5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIHRoaXMpO1xuICB9O1xuXG4gIEJhY2tncm91bmQucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiAoaXNMb2FkZWQsIG1lc3NhZ2UpIHtcbiAgICB0aGlzLmlzTG9hZGVkID0gaXNMb2FkZWQ7XG4gICAgdGhpcy5lbWl0RXZlbnQoJ3Byb2dyZXNzJywgW3RoaXMsIHRoaXMuZWxlbWVudCwgbWVzc2FnZV0pO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqUXVlcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIEltYWdlc0xvYWRlZC5tYWtlSlF1ZXJ5UGx1Z2luID0gZnVuY3Rpb24gKGpRdWVyeSkge1xuICAgIGpRdWVyeSA9IGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5O1xuXG4gICAgaWYgKCFqUXVlcnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIHNldCBsb2NhbCB2YXJpYWJsZVxuXG5cbiAgICAkID0galF1ZXJ5OyAvLyAkKCkuaW1hZ2VzTG9hZGVkKClcblxuICAgICQuZm4uaW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgSW1hZ2VzTG9hZGVkKHRoaXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5qcURlZmVycmVkLnByb21pc2UoJCh0aGlzKSk7XG4gICAgfTtcbiAgfTsgLy8gdHJ5IG1ha2luZyBwbHVnaW5cblxuXG4gIEltYWdlc0xvYWRlZC5tYWtlSlF1ZXJ5UGx1Z2luKCk7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIHJldHVybiBJbWFnZXNMb2FkZWQ7XG59KTtcbi8qIVxuICogRmxpY2tpdHkgaW1hZ2VzTG9hZGVkIHYyLjAuMFxuICogZW5hYmxlcyBpbWFnZXNMb2FkZWQgb3B0aW9uIGZvciBGbGlja2l0eVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qanNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKmdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKFsnZmxpY2tpdHkvanMvaW5kZXgnLCAnaW1hZ2VzbG9hZGVkL2ltYWdlc2xvYWRlZCddLCBmdW5jdGlvbiAoRmxpY2tpdHksIGltYWdlc0xvYWRlZCkge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkod2luZG93LCBGbGlja2l0eSwgaW1hZ2VzTG9hZGVkKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCdmbGlja2l0eScpLCByZXF1aXJlKCdpbWFnZXNsb2FkZWQnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuRmxpY2tpdHkgPSBmYWN0b3J5KHdpbmRvdywgd2luZG93LkZsaWNraXR5LCB3aW5kb3cuaW1hZ2VzTG9hZGVkKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KHdpbmRvdywgRmxpY2tpdHksIGltYWdlc0xvYWRlZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRmxpY2tpdHkuY3JlYXRlTWV0aG9kcy5wdXNoKCdfY3JlYXRlSW1hZ2VzTG9hZGVkJyk7XG4gIHZhciBwcm90byA9IEZsaWNraXR5LnByb3RvdHlwZTtcblxuICBwcm90by5fY3JlYXRlSW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub24oJ2FjdGl2YXRlJywgdGhpcy5pbWFnZXNMb2FkZWQpO1xuICB9O1xuXG4gIHByb3RvLmltYWdlc0xvYWRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5pbWFnZXNMb2FkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gb25JbWFnZXNMb2FkZWRQcm9ncmVzcyhpbnN0YW5jZSwgaW1hZ2UpIHtcbiAgICAgIHZhciBjZWxsID0gX3RoaXMuZ2V0UGFyZW50Q2VsbChpbWFnZS5pbWcpO1xuXG4gICAgICBfdGhpcy5jZWxsU2l6ZUNoYW5nZShjZWxsICYmIGNlbGwuZWxlbWVudCk7XG5cbiAgICAgIGlmICghX3RoaXMub3B0aW9ucy5mcmVlU2Nyb2xsKSB7XG4gICAgICAgIF90aGlzLnBvc2l0aW9uU2xpZGVyQXRTZWxlY3RlZCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGltYWdlc0xvYWRlZCh0aGlzLnNsaWRlcikub24oJ3Byb2dyZXNzJywgb25JbWFnZXNMb2FkZWRQcm9ncmVzcyk7XG4gIH07XG5cbiAgcmV0dXJuIEZsaWNraXR5O1xufSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgU2hhbmUgQ2FyclxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS92b3RlNTM5L3BsYWNlaG9sZHJcbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG4oZnVuY3Rpb24gKCQsIG5zLCBwbGFjZWhvbGRlckF0dHJpYnV0ZSwgb3JpZ1ZhbEZuKSB7XG4gIC8vIFV0aWxpdHkgZnVuY3Rpb25zXG4gIHZhciBwdXRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uIHB1dFBsYWNlaG9sZGVyKCkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG5cbiAgICBpZiAoISR0aGlzW29yaWdWYWxGbl0oKSkge1xuICAgICAgJHRoaXMuYWRkQ2xhc3MobnMpO1xuXG4gICAgICBpZiAoJHRoaXMuYXR0cihcInR5cGVcIikgPT09IFwicGFzc3dvcmRcIikge1xuICAgICAgICAkdGhpcy5hdHRyKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgICAgICR0aGlzLmRhdGEobnMgKyBcIi1wd2RcIiwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgICR0aGlzW29yaWdWYWxGbl0oJHRoaXMuYXR0cihwbGFjZWhvbGRlckF0dHJpYnV0ZSkpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgY2xlYXJQbGFjZWhvbGRlciA9IGZ1bmN0aW9uIGNsZWFyUGxhY2Vob2xkZXIoKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAkdGhpcy5yZW1vdmVDbGFzcyhucyk7XG5cbiAgICBpZiAoJHRoaXMuZGF0YShucyArIFwiLXB3ZFwiKSkge1xuICAgICAgJHRoaXMuYXR0cihcInR5cGVcIiwgXCJwYXNzd29yZFwiKTtcbiAgICB9XG5cbiAgICBpZiAoJHRoaXNbb3JpZ1ZhbEZuXSgpID09PSAkdGhpcy5hdHRyKHBsYWNlaG9sZGVyQXR0cmlidXRlKSkge1xuICAgICAgJHRoaXNbb3JpZ1ZhbEZuXShcIlwiKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGNsZWFyUGxhY2Vob2xkZXJzSW5Gb3JtID0gZnVuY3Rpb24gY2xlYXJQbGFjZWhvbGRlcnNJbkZvcm0oKSB7XG4gICAgJCh0aGlzKS5maW5kKFwiW1wiICsgcGxhY2Vob2xkZXJBdHRyaWJ1dGUgKyBcIl1cIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoJCh0aGlzKS5kYXRhKG5zKSkgY2xlYXJQbGFjZWhvbGRlci5jYWxsKHRoaXMpO1xuICAgIH0pO1xuICB9O1xuXG4gICQuZm4ucGxhY2Vob2xkciA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBEb24ndCBldmFsdWF0ZSB0aGUgcG9seWZpbGwgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgcGxhY2Vob2xkZXJzXG4gICAgaWYgKHBsYWNlaG9sZGVyQXR0cmlidXRlIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKSkgcmV0dXJuIHRoaXM7IC8vIEZpbmQgYW5kIGl0ZXJhdGUgdGhyb3VnaCBhbGwgaW5wdXRzIHRoYXQgaGF2ZSBhIHBsYWNlaG9sZGVyIGF0dHJpYnV0ZVxuXG4gICAgJCh0aGlzKS5maW5kKFwiW1wiICsgcGxhY2Vob2xkZXJBdHRyaWJ1dGUgKyBcIl1cIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpOyAvLyBsZWF2ZSBub3cgaWYgd2UndmUgcG9seWZpbGxlZCB0aGlzIGVsZW1lbnQgYmVmb3JlXG5cbiAgICAgIGlmICgkdGhpcy5kYXRhKG5zKSkgcmV0dXJuO1xuICAgICAgJHRoaXMuZGF0YShucywgdHJ1ZSk7IC8vIHB1dCB0aGUgcGxhY2Vob2xkZXIgaW50byB0aGUgdmFsdWVcblxuICAgICAgcHV0UGxhY2Vob2xkZXIuY2FsbCh0aGlzKTsgLy8gaGFuZGxlIGZvY3VzIGFuZCBibHVyIGV2ZW50c1xuXG4gICAgICAkdGhpcy5mb2N1cyhjbGVhclBsYWNlaG9sZGVyKTtcbiAgICAgICR0aGlzLmJsdXIocHV0UGxhY2Vob2xkZXIpO1xuICAgIH0pOyAvLyBGaW5kIGFuZCBpdGVyYXRlIHRocm91Z2ggYWxsIGZvcm0gZWxlbWVudHMgaW4gb3JkZXIgdG8gcHJldmVudFxuICAgIC8vIHBsYWNlaG9sZGVycyBmcm9tIGJlaW5nIHN1Ym1pdHRlZCBpbiBmb3Jtcy5cblxuICAgICQodGhpcykuZmluZChcImZvcm1cIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpOyAvLyBsZWF2ZSBub3cgaWYgd2UndmUgcG9seWZpbGxlZCB0aGlzIGVsZW1lbnQgYmVmb3JlXG5cbiAgICAgIGlmICgkdGhpcy5kYXRhKG5zKSkgcmV0dXJuO1xuICAgICAgJHRoaXMuZGF0YShucywgdHJ1ZSk7XG4gICAgICAkdGhpcy5zdWJtaXQoY2xlYXJQbGFjZWhvbGRlcnNJbkZvcm0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9OyAvLyBPdmVyd3JpdGUgdGhlIGV4aXN0aW5nIGpRdWVyeSB2YWwoKSBmdW5jdGlvblxuXG5cbiAgJC5mbltvcmlnVmFsRm5dID0gJC5mbi52YWw7XG5cbiAgJC5mbi52YWwgPSBmdW5jdGlvbiAodHh0KSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKTtcblxuICAgIGlmICgkLnR5cGUodHh0KSA9PT0gXCJ1bmRlZmluZWRcIiAmJiAkdGhpcy5kYXRhKG5zKSAmJiAkdGhpc1tvcmlnVmFsRm5dKCkgPT09ICR0aGlzLmF0dHIocGxhY2Vob2xkZXJBdHRyaWJ1dGUpKSB7XG4gICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG5cbiAgICB2YXIgaXNzdHIgPSAkLnR5cGUodHh0KSA9PT0gXCJzdHJpbmdcIjtcblxuICAgIGlmIChpc3N0cikge1xuICAgICAgY2xlYXJQbGFjZWhvbGRlci5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIHZhciByZXQgPSAkLmZuW29yaWdWYWxGbl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIGlmIChpc3N0ciAmJiAhdHh0KSB7XG4gICAgICBwdXRQbGFjZWhvbGRlci5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH07IC8vIEV2YWx1YXRlIHRoZSBzY3JpcHQgb24gcGFnZSByZWFkeVxuXG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJChkb2N1bWVudCkucGxhY2Vob2xkcigpO1xuICB9KTsgLy8gQWRkIGRlZmF1bHQgQ1NTIHJ1bGVcblxuICBkb2N1bWVudC53cml0ZShcIjxzdHlsZT4ucGxhY2Vob2xkcntjb2xvcjojQUFBO308L3N0eWxlPlwiKTtcbn0pKGpRdWVyeSwgXCJwbGFjZWhvbGRyXCIsIFwicGxhY2Vob2xkZXJcIiwgXCJwbGFjZWhvbGRyVmFsXCIpOyIsIiFmdW5jdGlvbiAocm9vdCwgbmFtZSwgbWFrZSkge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGVbJ2V4cG9ydHMnXSkgbW9kdWxlWydleHBvcnRzJ10gPSBtYWtlKCk7ZWxzZSByb290W25hbWVdID0gbWFrZSgpO1xufSh0aGlzLCAndmVyZ2UnLCBmdW5jdGlvbiAoKSB7XG4gIHZhciB4cG9ydHMgPSB7fSxcbiAgICAgIHdpbiA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LFxuICAgICAgZG9jID0gdHlwZW9mIGRvY3VtZW50ICE9ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LFxuICAgICAgZG9jRWxlbSA9IGRvYyAmJiBkb2MuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgbWF0Y2hNZWRpYSA9IHdpblsnbWF0Y2hNZWRpYSddIHx8IHdpblsnbXNNYXRjaE1lZGlhJ10sXG4gICAgICBtcSA9IG1hdGNoTWVkaWEgPyBmdW5jdGlvbiAocSkge1xuICAgIHJldHVybiAhIW1hdGNoTWVkaWEuY2FsbCh3aW4sIHEpLm1hdGNoZXM7XG4gIH0gOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICAgICAgdmlld3BvcnRXID0geHBvcnRzWyd2aWV3cG9ydFcnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYSA9IGRvY0VsZW1bJ2NsaWVudFdpZHRoJ10sXG4gICAgICAgIGIgPSB3aW5bJ2lubmVyV2lkdGgnXTtcbiAgICByZXR1cm4gYSA8IGIgPyBiIDogYTtcbiAgfSxcbiAgICAgIHZpZXdwb3J0SCA9IHhwb3J0c1sndmlld3BvcnRIJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGEgPSBkb2NFbGVtWydjbGllbnRIZWlnaHQnXSxcbiAgICAgICAgYiA9IHdpblsnaW5uZXJIZWlnaHQnXTtcbiAgICByZXR1cm4gYSA8IGIgPyBiIDogYTtcbiAgfTtcbiAgLyoqXG4gICAqIFRlc3QgaWYgYSBtZWRpYSBxdWVyeSBpcyBhY3RpdmUuIExpa2UgTW9kZXJuaXpyLm1xXHJcbiAgICogQHNpbmNlIDEuNi4wXHJcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgKi9cblxuXG4gIHhwb3J0c1snbXEnXSA9IG1xO1xuICAvKipcbiAgICogTm9ybWFsaXplZCBtYXRjaE1lZGlhXHJcbiAgICogQHNpbmNlIDEuNi4wXHJcbiAgICogQHJldHVybiB7TWVkaWFRdWVyeUxpc3R8T2JqZWN0fVxyXG4gICAqL1xuXG4gIHhwb3J0c1snbWF0Y2hNZWRpYSddID0gbWF0Y2hNZWRpYSA/IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBtYXRjaE1lZGlhIG11c3QgYmUgYmluZGVkIHRvIHdpbmRvd1xuICAgIHJldHVybiBtYXRjaE1lZGlhLmFwcGx5KHdpbiwgYXJndW1lbnRzKTtcbiAgfSA6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBHcmFjZWZ1bGx5IGRlZ3JhZGUgdG8gcGxhaW4gb2JqZWN0XG4gICAgcmV0dXJuIHt9O1xuICB9O1xuICAvKipcclxuICAgKiBAc2luY2UgMS44LjBcclxuICAgKiBAcmV0dXJuIHt7d2lkdGg6bnVtYmVyLCBoZWlnaHQ6bnVtYmVyfX1cclxuICAgKi9cblxuICBmdW5jdGlvbiB2aWV3cG9ydCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ3dpZHRoJzogdmlld3BvcnRXKCksXG4gICAgICAnaGVpZ2h0Jzogdmlld3BvcnRIKClcbiAgICB9O1xuICB9XG5cbiAgeHBvcnRzWyd2aWV3cG9ydCddID0gdmlld3BvcnQ7XG4gIC8qKlxuICAgKiBDcm9zcy1icm93c2VyIHdpbmRvdy5zY3JvbGxYXHJcbiAgICogQHNpbmNlIDEuMC4wXHJcbiAgICogQHJldHVybiB7bnVtYmVyfVxyXG4gICAqL1xuXG4gIHhwb3J0c1snc2Nyb2xsWCddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB3aW4ucGFnZVhPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxMZWZ0O1xuICB9O1xuICAvKipcbiAgICogQ3Jvc3MtYnJvd3NlciB3aW5kb3cuc2Nyb2xsWVxyXG4gICAqIEBzaW5jZSAxLjAuMFxyXG4gICAqIEByZXR1cm4ge251bWJlcn1cclxuICAgKi9cblxuXG4gIHhwb3J0c1snc2Nyb2xsWSddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB3aW4ucGFnZVlPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxUb3A7XG4gIH07XG4gIC8qKlxyXG4gICAqIEBwYXJhbSB7e3RvcDpudW1iZXIsIHJpZ2h0Om51bWJlciwgYm90dG9tOm51bWJlciwgbGVmdDpudW1iZXJ9fSBjb29yZHNcclxuICAgKiBAcGFyYW0ge251bWJlcj19IGN1c2hpb24gYWRqdXN0bWVudFxyXG4gICAqIEByZXR1cm4ge09iamVjdH1cclxuICAgKi9cblxuXG4gIGZ1bmN0aW9uIGNhbGlicmF0ZShjb29yZHMsIGN1c2hpb24pIHtcbiAgICB2YXIgbyA9IHt9O1xuICAgIGN1c2hpb24gPSArY3VzaGlvbiB8fCAwO1xuICAgIG9bJ3dpZHRoJ10gPSAob1sncmlnaHQnXSA9IGNvb3Jkc1sncmlnaHQnXSArIGN1c2hpb24pIC0gKG9bJ2xlZnQnXSA9IGNvb3Jkc1snbGVmdCddIC0gY3VzaGlvbik7XG4gICAgb1snaGVpZ2h0J10gPSAob1snYm90dG9tJ10gPSBjb29yZHNbJ2JvdHRvbSddICsgY3VzaGlvbikgLSAob1sndG9wJ10gPSBjb29yZHNbJ3RvcCddIC0gY3VzaGlvbik7XG4gICAgcmV0dXJuIG87XG4gIH1cbiAgLyoqXHJcbiAgICogQ3Jvc3MtYnJvd3NlciBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCBwbHVzIG9wdGlvbmFsIGN1c2hpb24uXHJcbiAgICogQ29vcmRzIGFyZSByZWxhdGl2ZSB0byB0aGUgdG9wLWxlZnQgY29ybmVyIG9mIHRoZSB2aWV3cG9ydC5cclxuICAgKiBAc2luY2UgMS4wLjBcclxuICAgKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBlbCBlbGVtZW50IG9yIHN0YWNrICh1c2VzIGZpcnN0IGl0ZW0pXHJcbiAgICogQHBhcmFtIHtudW1iZXI9fSBjdXNoaW9uICsvLSBwaXhlbCBhZGp1c3RtZW50IGFtb3VudFxyXG4gICAqIEByZXR1cm4ge09iamVjdHxib29sZWFufVxyXG4gICAqL1xuXG5cbiAgZnVuY3Rpb24gcmVjdGFuZ2xlKGVsLCBjdXNoaW9uKSB7XG4gICAgZWwgPSBlbCAmJiAhZWwubm9kZVR5cGUgPyBlbFswXSA6IGVsO1xuICAgIGlmICghZWwgfHwgMSAhPT0gZWwubm9kZVR5cGUpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gY2FsaWJyYXRlKGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBjdXNoaW9uKTtcbiAgfVxuXG4gIHhwb3J0c1sncmVjdGFuZ2xlJ10gPSByZWN0YW5nbGU7XG4gIC8qKlxyXG4gICAqIEdldCB0aGUgdmlld3BvcnQgYXNwZWN0IHJhdGlvIChvciB0aGUgYXNwZWN0IHJhdGlvIG9mIGFuIG9iamVjdCBvciBlbGVtZW50KVxyXG4gICAqIEBzaW5jZSAxLjcuMFxyXG4gICAqIEBwYXJhbSB7KEVsZW1lbnR8T2JqZWN0KT19IG8gb3B0aW9uYWwgb2JqZWN0IHdpdGggd2lkdGgvaGVpZ2h0IHByb3BzIG9yIG1ldGhvZHNcclxuICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICogQGxpbmsgaHR0cDovL3czLm9yZy9UUi9jc3MzLW1lZGlhcXVlcmllcy8jb3JpZW50YXRpb25cclxuICAgKi9cblxuICBmdW5jdGlvbiBhc3BlY3Qobykge1xuICAgIG8gPSBudWxsID09IG8gPyB2aWV3cG9ydCgpIDogMSA9PT0gby5ub2RlVHlwZSA/IHJlY3RhbmdsZShvKSA6IG87XG4gICAgdmFyIGggPSBvWydoZWlnaHQnXSxcbiAgICAgICAgdyA9IG9bJ3dpZHRoJ107XG4gICAgaCA9IHR5cGVvZiBoID09ICdmdW5jdGlvbicgPyBoLmNhbGwobykgOiBoO1xuICAgIHcgPSB0eXBlb2YgdyA9PSAnZnVuY3Rpb24nID8gdy5jYWxsKG8pIDogdztcbiAgICByZXR1cm4gdyAvIGg7XG4gIH1cblxuICB4cG9ydHNbJ2FzcGVjdCddID0gYXNwZWN0O1xuICAvKipcclxuICAgKiBUZXN0IGlmIGFuIGVsZW1lbnQgaXMgaW4gdGhlIHNhbWUgeC1heGlzIHNlY3Rpb24gYXMgdGhlIHZpZXdwb3J0LlxyXG4gICAqIEBzaW5jZSAxLjAuMFxyXG4gICAqIEBwYXJhbSB7RWxlbWVudHxPYmplY3R9IGVsXHJcbiAgICogQHBhcmFtIHtudW1iZXI9fSBjdXNoaW9uXHJcbiAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgKi9cblxuICB4cG9ydHNbJ2luWCddID0gZnVuY3Rpb24gKGVsLCBjdXNoaW9uKSB7XG4gICAgdmFyIHIgPSByZWN0YW5nbGUoZWwsIGN1c2hpb24pO1xuICAgIHJldHVybiAhIXIgJiYgci5yaWdodCA+PSAwICYmIHIubGVmdCA8PSB2aWV3cG9ydFcoKTtcbiAgfTtcbiAgLyoqXHJcbiAgICogVGVzdCBpZiBhbiBlbGVtZW50IGlzIGluIHRoZSBzYW1lIHktYXhpcyBzZWN0aW9uIGFzIHRoZSB2aWV3cG9ydC5cclxuICAgKiBAc2luY2UgMS4wLjBcclxuICAgKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBlbFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gY3VzaGlvblxyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICovXG5cblxuICB4cG9ydHNbJ2luWSddID0gZnVuY3Rpb24gKGVsLCBjdXNoaW9uKSB7XG4gICAgdmFyIHIgPSByZWN0YW5nbGUoZWwsIGN1c2hpb24pO1xuICAgIHJldHVybiAhIXIgJiYgci5ib3R0b20gPj0gMCAmJiByLnRvcCA8PSB2aWV3cG9ydEgoKTtcbiAgfTtcbiAgLyoqXHJcbiAgICogVGVzdCBpZiBhbiBlbGVtZW50IGlzIGluIHRoZSB2aWV3cG9ydC5cclxuICAgKiBAc2luY2UgMS4wLjBcclxuICAgKiBAcGFyYW0ge0VsZW1lbnR8T2JqZWN0fSBlbFxyXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gY3VzaGlvblxyXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICovXG5cblxuICB4cG9ydHNbJ2luVmlld3BvcnQnXSA9IGZ1bmN0aW9uIChlbCwgY3VzaGlvbikge1xuICAgIC8vIEVxdWl2IHRvIGBpblgoZWwsIGN1c2hpb24pICYmIGluWShlbCwgY3VzaGlvbilgIGJ1dCBqdXN0IG1hbnVhbGx5IGRvIGJvdGhcbiAgICAvLyB0byBhdm9pZCBjYWxsaW5nIHJlY3RhbmdsZSgpIHR3aWNlLiBJdCBnemlwcyBqdXN0IGFzIHNtYWxsIGxpa2UgdGhpcy5cbiAgICB2YXIgciA9IHJlY3RhbmdsZShlbCwgY3VzaGlvbik7XG4gICAgcmV0dXJuICEhciAmJiByLmJvdHRvbSA+PSAwICYmIHIucmlnaHQgPj0gMCAmJiByLnRvcCA8PSB2aWV3cG9ydEgoKSAmJiByLmxlZnQgPD0gdmlld3BvcnRXKCk7XG4gIH07XG5cbiAgcmV0dXJuIHhwb3J0cztcbn0pOyIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qISBwaWN0dXJlZmlsbCAtIHYzLjAuMiAtIDIwMTYtMDItMTJcbiAqIGh0dHBzOi8vc2NvdHRqZWhsLmdpdGh1Yi5pby9waWN0dXJlZmlsbC9cbiAqIENvcHlyaWdodCAoYykgMjAxNiBodHRwczovL2dpdGh1Yi5jb20vc2NvdHRqZWhsL3BpY3R1cmVmaWxsL2Jsb2IvbWFzdGVyL0F1dGhvcnMudHh0OyBMaWNlbnNlZCBNSVRcbiAqL1xuIWZ1bmN0aW9uIChhKSB7XG4gIHZhciBiID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgYS5IVE1MUGljdHVyZUVsZW1lbnQgJiYgL2Vja28vLnRlc3QoYikgJiYgYi5tYXRjaCgvcnZcXDooXFxkKykvKSAmJiBSZWdFeHAuJDEgPCA0NSAmJiBhZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYixcbiAgICAgICAgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzb3VyY2VcIiksXG4gICAgICAgIGQgPSBmdW5jdGlvbiBkKGEpIHtcbiAgICAgIHZhciBiLFxuICAgICAgICAgIGQsXG4gICAgICAgICAgZSA9IGEucGFyZW50Tm9kZTtcbiAgICAgIFwiUElDVFVSRVwiID09PSBlLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPyAoYiA9IGMuY2xvbmVOb2RlKCksIGUuaW5zZXJ0QmVmb3JlKGIsIGUuZmlyc3RFbGVtZW50Q2hpbGQpLCBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZS5yZW1vdmVDaGlsZChiKTtcbiAgICAgIH0pKSA6ICghYS5fcGZMYXN0U2l6ZSB8fCBhLm9mZnNldFdpZHRoID4gYS5fcGZMYXN0U2l6ZSkgJiYgKGEuX3BmTGFzdFNpemUgPSBhLm9mZnNldFdpZHRoLCBkID0gYS5zaXplcywgYS5zaXplcyArPSBcIiwxMDB2d1wiLCBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYS5zaXplcyA9IGQ7XG4gICAgICB9KSk7XG4gICAgfSxcbiAgICAgICAgZSA9IGZ1bmN0aW9uIGUoKSB7XG4gICAgICB2YXIgYSxcbiAgICAgICAgICBiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcInBpY3R1cmUgPiBpbWcsIGltZ1tzcmNzZXRdW3NpemVzXVwiKTtcblxuICAgICAgZm9yIChhID0gMDsgYSA8IGIubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgZChiW2FdKTtcbiAgICAgIH1cbiAgICB9LFxuICAgICAgICBmID0gZnVuY3Rpb24gZigpIHtcbiAgICAgIGNsZWFyVGltZW91dChiKSwgYiA9IHNldFRpbWVvdXQoZSwgOTkpO1xuICAgIH0sXG4gICAgICAgIGcgPSBhLm1hdGNoTWVkaWEgJiYgbWF0Y2hNZWRpYShcIihvcmllbnRhdGlvbjogbGFuZHNjYXBlKVwiKSxcbiAgICAgICAgaCA9IGZ1bmN0aW9uIGgoKSB7XG4gICAgICBmKCksIGcgJiYgZy5hZGRMaXN0ZW5lciAmJiBnLmFkZExpc3RlbmVyKGYpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYy5zcmNzZXQgPSBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBQUFBQUNINUJBRUtBQUVBTEFBQUFBQUJBQUVBQUFJQ1RBRUFPdz09XCIsIC9eW2N8aV18ZCQvLnRlc3QoZG9jdW1lbnQucmVhZHlTdGF0ZSB8fCBcIlwiKSA/IGgoKSA6IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGgpLCBmO1xuICB9KCkpO1xufSh3aW5kb3cpLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICBmdW5jdGlvbiBkKGEpIHtcbiAgICByZXR1cm4gXCIgXCIgPT09IGEgfHwgXCJcdFwiID09PSBhIHx8IFwiXFxuXCIgPT09IGEgfHwgXCJcXGZcIiA9PT0gYSB8fCBcIlxcclwiID09PSBhO1xuICB9XG5cbiAgZnVuY3Rpb24gZShiLCBjKSB7XG4gICAgdmFyIGQgPSBuZXcgYS5JbWFnZSgpO1xuICAgIHJldHVybiBkLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBW2JdID0gITEsIGJhKCk7XG4gICAgfSwgZC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBBW2JdID0gMSA9PT0gZC53aWR0aCwgYmEoKTtcbiAgICB9LCBkLnNyYyA9IGMsIFwicGVuZGluZ1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gZigpIHtcbiAgICBNID0gITEsIFAgPSBhLmRldmljZVBpeGVsUmF0aW8sIE4gPSB7fSwgTyA9IHt9LCBzLkRQUiA9IFAgfHwgMSwgUS53aWR0aCA9IE1hdGgubWF4KGEuaW5uZXJXaWR0aCB8fCAwLCB6LmNsaWVudFdpZHRoKSwgUS5oZWlnaHQgPSBNYXRoLm1heChhLmlubmVySGVpZ2h0IHx8IDAsIHouY2xpZW50SGVpZ2h0KSwgUS52dyA9IFEud2lkdGggLyAxMDAsIFEudmggPSBRLmhlaWdodCAvIDEwMCwgciA9IFtRLmhlaWdodCwgUS53aWR0aCwgUF0uam9pbihcIi1cIiksIFEuZW0gPSBzLmdldEVtVmFsdWUoKSwgUS5yZW0gPSBRLmVtO1xuICB9XG5cbiAgZnVuY3Rpb24gZyhhLCBiLCBjLCBkKSB7XG4gICAgdmFyIGUsIGYsIGcsIGg7XG4gICAgcmV0dXJuIFwic2F2ZURhdGFcIiA9PT0gQi5hbGdvcml0aG0gPyBhID4gMi43ID8gaCA9IGMgKyAxIDogKGYgPSBiIC0gYywgZSA9IE1hdGgucG93KGEgLSAuNiwgMS41KSwgZyA9IGYgKiBlLCBkICYmIChnICs9IC4xICogZSksIGggPSBhICsgZykgOiBoID0gYyA+IDEgPyBNYXRoLnNxcnQoYSAqIGIpIDogYSwgaCA+IGM7XG4gIH1cblxuICBmdW5jdGlvbiBoKGEpIHtcbiAgICB2YXIgYixcbiAgICAgICAgYyA9IHMuZ2V0U2V0KGEpLFxuICAgICAgICBkID0gITE7XG4gICAgXCJwZW5kaW5nXCIgIT09IGMgJiYgKGQgPSByLCBjICYmIChiID0gcy5zZXRSZXMoYyksIHMuYXBwbHlTZXRDYW5kaWRhdGUoYiwgYSkpKSwgYVtzLm5zXS5ldmFsZWQgPSBkO1xuICB9XG5cbiAgZnVuY3Rpb24gaShhLCBiKSB7XG4gICAgcmV0dXJuIGEucmVzIC0gYi5yZXM7XG4gIH1cblxuICBmdW5jdGlvbiBqKGEsIGIsIGMpIHtcbiAgICB2YXIgZDtcbiAgICByZXR1cm4gIWMgJiYgYiAmJiAoYyA9IGFbcy5uc10uc2V0cywgYyA9IGMgJiYgY1tjLmxlbmd0aCAtIDFdKSwgZCA9IGsoYiwgYyksIGQgJiYgKGIgPSBzLm1ha2VVcmwoYiksIGFbcy5uc10uY3VyU3JjID0gYiwgYVtzLm5zXS5jdXJDYW4gPSBkLCBkLnJlcyB8fCBhYShkLCBkLnNldC5zaXplcykpLCBkO1xuICB9XG5cbiAgZnVuY3Rpb24gayhhLCBiKSB7XG4gICAgdmFyIGMsIGQsIGU7XG4gICAgaWYgKGEgJiYgYikgZm9yIChlID0gcy5wYXJzZVNldChiKSwgYSA9IHMubWFrZVVybChhKSwgYyA9IDA7IGMgPCBlLmxlbmd0aDsgYysrKSB7XG4gICAgICBpZiAoYSA9PT0gcy5tYWtlVXJsKGVbY10udXJsKSkge1xuICAgICAgICBkID0gZVtjXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkO1xuICB9XG5cbiAgZnVuY3Rpb24gbChhLCBiKSB7XG4gICAgdmFyIGMsXG4gICAgICAgIGQsXG4gICAgICAgIGUsXG4gICAgICAgIGYsXG4gICAgICAgIGcgPSBhLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic291cmNlXCIpO1xuXG4gICAgZm9yIChjID0gMCwgZCA9IGcubGVuZ3RoOyBkID4gYzsgYysrKSB7XG4gICAgICBlID0gZ1tjXSwgZVtzLm5zXSA9ICEwLCBmID0gZS5nZXRBdHRyaWJ1dGUoXCJzcmNzZXRcIiksIGYgJiYgYi5wdXNoKHtcbiAgICAgICAgc3Jjc2V0OiBmLFxuICAgICAgICBtZWRpYTogZS5nZXRBdHRyaWJ1dGUoXCJtZWRpYVwiKSxcbiAgICAgICAgdHlwZTogZS5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLFxuICAgICAgICBzaXplczogZS5nZXRBdHRyaWJ1dGUoXCJzaXplc1wiKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbShhLCBiKSB7XG4gICAgZnVuY3Rpb24gYyhiKSB7XG4gICAgICB2YXIgYyxcbiAgICAgICAgICBkID0gYi5leGVjKGEuc3Vic3RyaW5nKG0pKTtcbiAgICAgIHJldHVybiBkID8gKGMgPSBkWzBdLCBtICs9IGMubGVuZ3RoLCBjKSA6IHZvaWQgMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlKCkge1xuICAgICAgdmFyIGEsXG4gICAgICAgICAgYyxcbiAgICAgICAgICBkLFxuICAgICAgICAgIGUsXG4gICAgICAgICAgZixcbiAgICAgICAgICBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgayxcbiAgICAgICAgICBsLFxuICAgICAgICAgIG0gPSAhMSxcbiAgICAgICAgICBvID0ge307XG5cbiAgICAgIGZvciAoZSA9IDA7IGUgPCBoLmxlbmd0aDsgZSsrKSB7XG4gICAgICAgIGYgPSBoW2VdLCBpID0gZltmLmxlbmd0aCAtIDFdLCBqID0gZi5zdWJzdHJpbmcoMCwgZi5sZW5ndGggLSAxKSwgayA9IHBhcnNlSW50KGosIDEwKSwgbCA9IHBhcnNlRmxvYXQoaiksIFgudGVzdChqKSAmJiBcIndcIiA9PT0gaSA/ICgoYSB8fCBjKSAmJiAobSA9ICEwKSwgMCA9PT0gayA/IG0gPSAhMCA6IGEgPSBrKSA6IFkudGVzdChqKSAmJiBcInhcIiA9PT0gaSA/ICgoYSB8fCBjIHx8IGQpICYmIChtID0gITApLCAwID4gbCA/IG0gPSAhMCA6IGMgPSBsKSA6IFgudGVzdChqKSAmJiBcImhcIiA9PT0gaSA/ICgoZCB8fCBjKSAmJiAobSA9ICEwKSwgMCA9PT0gayA/IG0gPSAhMCA6IGQgPSBrKSA6IG0gPSAhMDtcbiAgICAgIH1cblxuICAgICAgbSB8fCAoby51cmwgPSBnLCBhICYmIChvLncgPSBhKSwgYyAmJiAoby5kID0gYyksIGQgJiYgKG8uaCA9IGQpLCBkIHx8IGMgfHwgYSB8fCAoby5kID0gMSksIDEgPT09IG8uZCAmJiAoYi5oYXMxeCA9ICEwKSwgby5zZXQgPSBiLCBuLnB1c2gobykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGYoKSB7XG4gICAgICBmb3IgKGMoVCksIGkgPSBcIlwiLCBqID0gXCJpbiBkZXNjcmlwdG9yXCI7Oykge1xuICAgICAgICBpZiAoayA9IGEuY2hhckF0KG0pLCBcImluIGRlc2NyaXB0b3JcIiA9PT0gaikge1xuICAgICAgICAgIGlmIChkKGspKSBpICYmIChoLnB1c2goaSksIGkgPSBcIlwiLCBqID0gXCJhZnRlciBkZXNjcmlwdG9yXCIpO2Vsc2Uge1xuICAgICAgICAgICAgaWYgKFwiLFwiID09PSBrKSByZXR1cm4gbSArPSAxLCBpICYmIGgucHVzaChpKSwgdm9pZCBlKCk7XG4gICAgICAgICAgICBpZiAoXCIoXCIgPT09IGspIGkgKz0gaywgaiA9IFwiaW4gcGFyZW5zXCI7ZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChcIlwiID09PSBrKSByZXR1cm4gaSAmJiBoLnB1c2goaSksIHZvaWQgZSgpO1xuICAgICAgICAgICAgICBpICs9IGs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFwiaW4gcGFyZW5zXCIgPT09IGopIHtcbiAgICAgICAgICBpZiAoXCIpXCIgPT09IGspIGkgKz0gaywgaiA9IFwiaW4gZGVzY3JpcHRvclwiO2Vsc2Uge1xuICAgICAgICAgICAgaWYgKFwiXCIgPT09IGspIHJldHVybiBoLnB1c2goaSksIHZvaWQgZSgpO1xuICAgICAgICAgICAgaSArPSBrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChcImFmdGVyIGRlc2NyaXB0b3JcIiA9PT0gaikgaWYgKGQoaykpIDtlbHNlIHtcbiAgICAgICAgICBpZiAoXCJcIiA9PT0gaykgcmV0dXJuIHZvaWQgZSgpO1xuICAgICAgICAgIGogPSBcImluIGRlc2NyaXB0b3JcIiwgbSAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIG0gKz0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBnLCBoLCBpLCBqLCBrLCBsID0gYS5sZW5ndGgsIG0gPSAwLCBuID0gW107Oykge1xuICAgICAgaWYgKGMoVSksIG0gPj0gbCkgcmV0dXJuIG47XG4gICAgICBnID0gYyhWKSwgaCA9IFtdLCBcIixcIiA9PT0gZy5zbGljZSgtMSkgPyAoZyA9IGcucmVwbGFjZShXLCBcIlwiKSwgZSgpKSA6IGYoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBuKGEpIHtcbiAgICBmdW5jdGlvbiBiKGEpIHtcbiAgICAgIGZ1bmN0aW9uIGIoKSB7XG4gICAgICAgIGYgJiYgKGcucHVzaChmKSwgZiA9IFwiXCIpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjKCkge1xuICAgICAgICBnWzBdICYmIChoLnB1c2goZyksIGcgPSBbXSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGUsIGYgPSBcIlwiLCBnID0gW10sIGggPSBbXSwgaSA9IDAsIGogPSAwLCBrID0gITE7Oykge1xuICAgICAgICBpZiAoZSA9IGEuY2hhckF0KGopLCBcIlwiID09PSBlKSByZXR1cm4gYigpLCBjKCksIGg7XG5cbiAgICAgICAgaWYgKGspIHtcbiAgICAgICAgICBpZiAoXCIqXCIgPT09IGUgJiYgXCIvXCIgPT09IGFbaiArIDFdKSB7XG4gICAgICAgICAgICBrID0gITEsIGogKz0gMiwgYigpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaiArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChkKGUpKSB7XG4gICAgICAgICAgICBpZiAoYS5jaGFyQXQoaiAtIDEpICYmIGQoYS5jaGFyQXQoaiAtIDEpKSB8fCAhZikge1xuICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoMCA9PT0gaSkge1xuICAgICAgICAgICAgICBiKCksIGogKz0gMTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGUgPSBcIiBcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKFwiKFwiID09PSBlKSBpICs9IDE7ZWxzZSBpZiAoXCIpXCIgPT09IGUpIGkgLT0gMTtlbHNlIHtcbiAgICAgICAgICAgIGlmIChcIixcIiA9PT0gZSkge1xuICAgICAgICAgICAgICBiKCksIGMoKSwgaiArPSAxO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFwiL1wiID09PSBlICYmIFwiKlwiID09PSBhLmNoYXJBdChqICsgMSkpIHtcbiAgICAgICAgICAgICAgayA9ICEwLCBqICs9IDI7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGYgKz0gZSwgaiArPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYyhhKSB7XG4gICAgICByZXR1cm4gay50ZXN0KGEpICYmIHBhcnNlRmxvYXQoYSkgPj0gMCA/ICEwIDogbC50ZXN0KGEpID8gITAgOiBcIjBcIiA9PT0gYSB8fCBcIi0wXCIgPT09IGEgfHwgXCIrMFwiID09PSBhID8gITAgOiAhMTtcbiAgICB9XG5cbiAgICB2YXIgZSxcbiAgICAgICAgZixcbiAgICAgICAgZyxcbiAgICAgICAgaCxcbiAgICAgICAgaSxcbiAgICAgICAgaixcbiAgICAgICAgayA9IC9eKD86WystXT9bMC05XSt8WzAtOV0qXFwuWzAtOV0rKSg/OltlRV1bKy1dP1swLTldKyk/KD86Y2h8Y218ZW18ZXh8aW58bW18cGN8cHR8cHh8cmVtfHZofHZtaW58dm1heHx2dykkL2ksXG4gICAgICAgIGwgPSAvXmNhbGNcXCgoPzpbMC05YS16IFxcLlxcK1xcLVxcKlxcL1xcKFxcKV0rKVxcKSQvaTtcblxuICAgIGZvciAoZiA9IGIoYSksIGcgPSBmLmxlbmd0aCwgZSA9IDA7IGcgPiBlOyBlKyspIHtcbiAgICAgIGlmIChoID0gZltlXSwgaSA9IGhbaC5sZW5ndGggLSAxXSwgYyhpKSkge1xuICAgICAgICBpZiAoaiA9IGksIGgucG9wKCksIDAgPT09IGgubGVuZ3RoKSByZXR1cm4gajtcbiAgICAgICAgaWYgKGggPSBoLmpvaW4oXCIgXCIpLCBzLm1hdGNoZXNNZWRpYShoKSkgcmV0dXJuIGo7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFwiMTAwdndcIjtcbiAgfVxuXG4gIGIuY3JlYXRlRWxlbWVudChcInBpY3R1cmVcIik7XG5cbiAgdmFyIG8sXG4gICAgICBwLFxuICAgICAgcSxcbiAgICAgIHIsXG4gICAgICBzID0ge30sXG4gICAgICB0ID0gITEsXG4gICAgICB1ID0gZnVuY3Rpb24gdSgpIHt9LFxuICAgICAgdiA9IGIuY3JlYXRlRWxlbWVudChcImltZ1wiKSxcbiAgICAgIHcgPSB2LmdldEF0dHJpYnV0ZSxcbiAgICAgIHggPSB2LnNldEF0dHJpYnV0ZSxcbiAgICAgIHkgPSB2LnJlbW92ZUF0dHJpYnV0ZSxcbiAgICAgIHogPSBiLmRvY3VtZW50RWxlbWVudCxcbiAgICAgIEEgPSB7fSxcbiAgICAgIEIgPSB7XG4gICAgYWxnb3JpdGhtOiBcIlwiXG4gIH0sXG4gICAgICBDID0gXCJkYXRhLXBmc3JjXCIsXG4gICAgICBEID0gQyArIFwic2V0XCIsXG4gICAgICBFID0gbmF2aWdhdG9yLnVzZXJBZ2VudCxcbiAgICAgIEYgPSAvcmlkZW50Ly50ZXN0KEUpIHx8IC9lY2tvLy50ZXN0KEUpICYmIEUubWF0Y2goL3J2XFw6KFxcZCspLykgJiYgUmVnRXhwLiQxID4gMzUsXG4gICAgICBHID0gXCJjdXJyZW50U3JjXCIsXG4gICAgICBIID0gL1xccytcXCs/XFxkKyhlXFxkKyk/dy8sXG4gICAgICBJID0gLyhcXChbXildK1xcKSk/XFxzKiguKykvLFxuICAgICAgSiA9IGEucGljdHVyZWZpbGxDRkcsXG4gICAgICBLID0gXCJwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dmlzaWJpbGl0eTpoaWRkZW47ZGlzcGxheTpibG9jaztwYWRkaW5nOjA7Ym9yZGVyOm5vbmU7Zm9udC1zaXplOjFlbTt3aWR0aDoxZW07b3ZlcmZsb3c6aGlkZGVuO2NsaXA6cmVjdCgwcHgsIDBweCwgMHB4LCAwcHgpXCIsXG4gICAgICBMID0gXCJmb250LXNpemU6MTAwJSFpbXBvcnRhbnQ7XCIsXG4gICAgICBNID0gITAsXG4gICAgICBOID0ge30sXG4gICAgICBPID0ge30sXG4gICAgICBQID0gYS5kZXZpY2VQaXhlbFJhdGlvLFxuICAgICAgUSA9IHtcbiAgICBweDogMSxcbiAgICBcImluXCI6IDk2XG4gIH0sXG4gICAgICBSID0gYi5jcmVhdGVFbGVtZW50KFwiYVwiKSxcbiAgICAgIFMgPSAhMSxcbiAgICAgIFQgPSAvXlsgXFx0XFxuXFxyXFx1MDAwY10rLyxcbiAgICAgIFUgPSAvXlssIFxcdFxcblxcclxcdTAwMGNdKy8sXG4gICAgICBWID0gL15bXiBcXHRcXG5cXHJcXHUwMDBjXSsvLFxuICAgICAgVyA9IC9bLF0rJC8sXG4gICAgICBYID0gL15cXGQrJC8sXG4gICAgICBZID0gL14tPyg/OlswLTldK3xbMC05XSpcXC5bMC05XSspKD86W2VFXVsrLV0/WzAtOV0rKT8kLyxcbiAgICAgIFogPSBmdW5jdGlvbiBaKGEsIGIsIGMsIGQpIHtcbiAgICBhLmFkZEV2ZW50TGlzdGVuZXIgPyBhLmFkZEV2ZW50TGlzdGVuZXIoYiwgYywgZCB8fCAhMSkgOiBhLmF0dGFjaEV2ZW50ICYmIGEuYXR0YWNoRXZlbnQoXCJvblwiICsgYiwgYyk7XG4gIH0sXG4gICAgICAkID0gZnVuY3Rpb24gJChhKSB7XG4gICAgdmFyIGIgPSB7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGMpIHtcbiAgICAgIHJldHVybiBjIGluIGIgfHwgKGJbY10gPSBhKGMpKSwgYltjXTtcbiAgICB9O1xuICB9LFxuICAgICAgXyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYSA9IC9eKFtcXGRcXC5dKykoZW18dnd8cHgpJC8sXG4gICAgICAgIGIgPSBmdW5jdGlvbiBiKCkge1xuICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50cywgYiA9IDAsIGMgPSBhWzBdOyAoKytiIGluIGEpOykge1xuICAgICAgICBjID0gYy5yZXBsYWNlKGFbYl0sIGFbKytiXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjO1xuICAgIH0sXG4gICAgICAgIGMgPSAkKGZ1bmN0aW9uIChhKSB7XG4gICAgICByZXR1cm4gXCJyZXR1cm4gXCIgKyBiKChhIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCksIC9cXGJhbmRcXGIvZywgXCImJlwiLCAvLC9nLCBcInx8XCIsIC9taW4tKFthLXotXFxzXSspOi9nLCBcImUuJDE+PVwiLCAvbWF4LShbYS16LVxcc10rKTovZywgXCJlLiQxPD1cIiwgL2NhbGMoW14pXSspL2csIFwiKCQxKVwiLCAvKFxcZCtbXFwuXSpbXFxkXSopKFthLXpdKykvZywgXCIoJDEgKiBlLiQyKVwiLCAvXig/IShlLlthLXpdfFswLTlcXC4mPXw+PFxcK1xcLVxcKlxcKFxcKVxcL10pKS4qL2dpLCBcIlwiKSArIFwiO1wiO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChiLCBkKSB7XG4gICAgICB2YXIgZTtcbiAgICAgIGlmICghKGIgaW4gTikpIGlmIChOW2JdID0gITEsIGQgJiYgKGUgPSBiLm1hdGNoKGEpKSkgTltiXSA9IGVbMV0gKiBRW2VbMl1dO2Vsc2UgdHJ5IHtcbiAgICAgICAgTltiXSA9IG5ldyBGdW5jdGlvbihcImVcIiwgYyhiKSkoUSk7XG4gICAgICB9IGNhdGNoIChmKSB7fVxuICAgICAgcmV0dXJuIE5bYl07XG4gICAgfTtcbiAgfSgpLFxuICAgICAgYWEgPSBmdW5jdGlvbiBhYShhLCBiKSB7XG4gICAgcmV0dXJuIGEudyA/IChhLmNXaWR0aCA9IHMuY2FsY0xpc3RMZW5ndGgoYiB8fCBcIjEwMHZ3XCIpLCBhLnJlcyA9IGEudyAvIGEuY1dpZHRoKSA6IGEucmVzID0gYS5kLCBhO1xuICB9LFxuICAgICAgYmEgPSBmdW5jdGlvbiBiYShhKSB7XG4gICAgaWYgKHQpIHtcbiAgICAgIHZhciBjLFxuICAgICAgICAgIGQsXG4gICAgICAgICAgZSxcbiAgICAgICAgICBmID0gYSB8fCB7fTtcblxuICAgICAgaWYgKGYuZWxlbWVudHMgJiYgMSA9PT0gZi5lbGVtZW50cy5ub2RlVHlwZSAmJiAoXCJJTUdcIiA9PT0gZi5lbGVtZW50cy5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpID8gZi5lbGVtZW50cyA9IFtmLmVsZW1lbnRzXSA6IChmLmNvbnRleHQgPSBmLmVsZW1lbnRzLCBmLmVsZW1lbnRzID0gbnVsbCkpLCBjID0gZi5lbGVtZW50cyB8fCBzLnFzYShmLmNvbnRleHQgfHwgYiwgZi5yZWV2YWx1YXRlIHx8IGYucmVzZWxlY3QgPyBzLnNlbCA6IHMuc2VsU2hvcnQpLCBlID0gYy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChzLnNldHVwUnVuKGYpLCBTID0gITAsIGQgPSAwOyBlID4gZDsgZCsrKSB7XG4gICAgICAgICAgcy5maWxsSW1nKGNbZF0sIGYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcy50ZWFyZG93blJ1bihmKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgbyA9IGEuY29uc29sZSAmJiBjb25zb2xlLndhcm4gPyBmdW5jdGlvbiAoYSkge1xuICAgIGNvbnNvbGUud2FybihhKTtcbiAgfSA6IHUsIEcgaW4gdiB8fCAoRyA9IFwic3JjXCIpLCBBW1wiaW1hZ2UvanBlZ1wiXSA9ICEwLCBBW1wiaW1hZ2UvZ2lmXCJdID0gITAsIEFbXCJpbWFnZS9wbmdcIl0gPSAhMCwgQVtcImltYWdlL3N2Zyt4bWxcIl0gPSBiLmltcGxlbWVudGF0aW9uLmhhc0ZlYXR1cmUoXCJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0ltYWdlXCIsIFwiMS4xXCIpLCBzLm5zID0gKFwicGZcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpKS5zdWJzdHIoMCwgOSksIHMuc3VwU3Jjc2V0ID0gXCJzcmNzZXRcIiBpbiB2LCBzLnN1cFNpemVzID0gXCJzaXplc1wiIGluIHYsIHMuc3VwUGljdHVyZSA9ICEhYS5IVE1MUGljdHVyZUVsZW1lbnQsIHMuc3VwU3Jjc2V0ICYmIHMuc3VwUGljdHVyZSAmJiAhcy5zdXBTaXplcyAmJiAhZnVuY3Rpb24gKGEpIHtcbiAgICB2LnNyY3NldCA9IFwiZGF0YTosYVwiLCBhLnNyYyA9IFwiZGF0YTosYVwiLCBzLnN1cFNyY3NldCA9IHYuY29tcGxldGUgPT09IGEuY29tcGxldGUsIHMuc3VwUGljdHVyZSA9IHMuc3VwU3Jjc2V0ICYmIHMuc3VwUGljdHVyZTtcbiAgfShiLmNyZWF0ZUVsZW1lbnQoXCJpbWdcIikpLCBzLnN1cFNyY3NldCAmJiAhcy5zdXBTaXplcyA/ICFmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGEgPSBcImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFnQUJBUEFBQVAvLy93QUFBQ0g1QkFBQUFBQUFMQUFBQUFBQ0FBRUFBQUlDQkFvQU93PT1cIixcbiAgICAgICAgYyA9IFwiZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQVFBQkFBQUFBQ0g1QkFFS0FBRUFMQUFBQUFBQkFBRUFBQUlDVEFFQU93PT1cIixcbiAgICAgICAgZCA9IGIuY3JlYXRlRWxlbWVudChcImltZ1wiKSxcbiAgICAgICAgZSA9IGZ1bmN0aW9uIGUoKSB7XG4gICAgICB2YXIgYSA9IGQud2lkdGg7XG4gICAgICAyID09PSBhICYmIChzLnN1cFNpemVzID0gITApLCBxID0gcy5zdXBTcmNzZXQgJiYgIXMuc3VwU2l6ZXMsIHQgPSAhMCwgc2V0VGltZW91dChiYSk7XG4gICAgfTtcblxuICAgIGQub25sb2FkID0gZSwgZC5vbmVycm9yID0gZSwgZC5zZXRBdHRyaWJ1dGUoXCJzaXplc1wiLCBcIjlweFwiKSwgZC5zcmNzZXQgPSBjICsgXCIgMXcsXCIgKyBhICsgXCIgOXdcIiwgZC5zcmMgPSBjO1xuICB9KCkgOiB0ID0gITAsIHMuc2VsU2hvcnQgPSBcInBpY3R1cmU+aW1nLGltZ1tzcmNzZXRdXCIsIHMuc2VsID0gcy5zZWxTaG9ydCwgcy5jZmcgPSBCLCBzLkRQUiA9IFAgfHwgMSwgcy51ID0gUSwgcy50eXBlcyA9IEEsIHMuc2V0U2l6ZSA9IHUsIHMubWFrZVVybCA9ICQoZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gUi5ocmVmID0gYSwgUi5ocmVmO1xuICB9KSwgcy5xc2EgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBcInF1ZXJ5U2VsZWN0b3JcIiBpbiBhID8gYS5xdWVyeVNlbGVjdG9yQWxsKGIpIDogW107XG4gIH0sIHMubWF0Y2hlc01lZGlhID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhLm1hdGNoTWVkaWEgJiYgKG1hdGNoTWVkaWEoXCIobWluLXdpZHRoOiAwLjFlbSlcIikgfHwge30pLm1hdGNoZXMgPyBzLm1hdGNoZXNNZWRpYSA9IGZ1bmN0aW9uIChhKSB7XG4gICAgICByZXR1cm4gIWEgfHwgbWF0Y2hNZWRpYShhKS5tYXRjaGVzO1xuICAgIH0gOiBzLm1hdGNoZXNNZWRpYSA9IHMubU1RLCBzLm1hdGNoZXNNZWRpYS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LCBzLm1NUSA9IGZ1bmN0aW9uIChhKSB7XG4gICAgcmV0dXJuIGEgPyBfKGEpIDogITA7XG4gIH0sIHMuY2FsY0xlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIGIgPSBfKGEsICEwKSB8fCAhMTtcbiAgICByZXR1cm4gMCA+IGIgJiYgKGIgPSAhMSksIGI7XG4gIH0sIHMuc3VwcG9ydHNUeXBlID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gYSA/IEFbYV0gOiAhMDtcbiAgfSwgcy5wYXJzZVNpemUgPSAkKGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIGIgPSAoYSB8fCBcIlwiKS5tYXRjaChJKTtcbiAgICByZXR1cm4ge1xuICAgICAgbWVkaWE6IGIgJiYgYlsxXSxcbiAgICAgIGxlbmd0aDogYiAmJiBiWzJdXG4gICAgfTtcbiAgfSksIHMucGFyc2VTZXQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBhLmNhbmRzIHx8IChhLmNhbmRzID0gbShhLnNyY3NldCwgYSkpLCBhLmNhbmRzO1xuICB9LCBzLmdldEVtVmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGE7XG5cbiAgICBpZiAoIXAgJiYgKGEgPSBiLmJvZHkpKSB7XG4gICAgICB2YXIgYyA9IGIuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgICBkID0gei5zdHlsZS5jc3NUZXh0LFxuICAgICAgICAgIGUgPSBhLnN0eWxlLmNzc1RleHQ7XG4gICAgICBjLnN0eWxlLmNzc1RleHQgPSBLLCB6LnN0eWxlLmNzc1RleHQgPSBMLCBhLnN0eWxlLmNzc1RleHQgPSBMLCBhLmFwcGVuZENoaWxkKGMpLCBwID0gYy5vZmZzZXRXaWR0aCwgYS5yZW1vdmVDaGlsZChjKSwgcCA9IHBhcnNlRmxvYXQocCwgMTApLCB6LnN0eWxlLmNzc1RleHQgPSBkLCBhLnN0eWxlLmNzc1RleHQgPSBlO1xuICAgIH1cblxuICAgIHJldHVybiBwIHx8IDE2O1xuICB9LCBzLmNhbGNMaXN0TGVuZ3RoID0gZnVuY3Rpb24gKGEpIHtcbiAgICBpZiAoIShhIGluIE8pIHx8IEIudVQpIHtcbiAgICAgIHZhciBiID0gcy5jYWxjTGVuZ3RoKG4oYSkpO1xuICAgICAgT1thXSA9IGIgPyBiIDogUS53aWR0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gT1thXTtcbiAgfSwgcy5zZXRSZXMgPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBiO1xuXG4gICAgaWYgKGEpIHtcbiAgICAgIGIgPSBzLnBhcnNlU2V0KGEpO1xuXG4gICAgICBmb3IgKHZhciBjID0gMCwgZCA9IGIubGVuZ3RoOyBkID4gYzsgYysrKSB7XG4gICAgICAgIGFhKGJbY10sIGEuc2l6ZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBiO1xuICB9LCBzLnNldFJlcy5yZXMgPSBhYSwgcy5hcHBseVNldENhbmRpZGF0ZSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgaWYgKGEubGVuZ3RoKSB7XG4gICAgICB2YXIgYyxcbiAgICAgICAgICBkLFxuICAgICAgICAgIGUsXG4gICAgICAgICAgZixcbiAgICAgICAgICBoLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbCxcbiAgICAgICAgICBtLFxuICAgICAgICAgIG4sXG4gICAgICAgICAgbyA9IGJbcy5uc10sXG4gICAgICAgICAgcCA9IHMuRFBSO1xuICAgICAgaWYgKGsgPSBvLmN1clNyYyB8fCBiW0ddLCBsID0gby5jdXJDYW4gfHwgaihiLCBrLCBhWzBdLnNldCksIGwgJiYgbC5zZXQgPT09IGFbMF0uc2V0ICYmIChuID0gRiAmJiAhYi5jb21wbGV0ZSAmJiBsLnJlcyAtIC4xID4gcCwgbiB8fCAobC5jYWNoZWQgPSAhMCwgbC5yZXMgPj0gcCAmJiAoaCA9IGwpKSksICFoKSBmb3IgKGEuc29ydChpKSwgZiA9IGEubGVuZ3RoLCBoID0gYVtmIC0gMV0sIGQgPSAwOyBmID4gZDsgZCsrKSB7XG4gICAgICAgIGlmIChjID0gYVtkXSwgYy5yZXMgPj0gcCkge1xuICAgICAgICAgIGUgPSBkIC0gMSwgaCA9IGFbZV0gJiYgKG4gfHwgayAhPT0gcy5tYWtlVXJsKGMudXJsKSkgJiYgZyhhW2VdLnJlcywgYy5yZXMsIHAsIGFbZV0uY2FjaGVkKSA/IGFbZV0gOiBjO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBoICYmIChtID0gcy5tYWtlVXJsKGgudXJsKSwgby5jdXJTcmMgPSBtLCBvLmN1ckNhbiA9IGgsIG0gIT09IGsgJiYgcy5zZXRTcmMoYiwgaCksIHMuc2V0U2l6ZShiKSk7XG4gICAgfVxuICB9LCBzLnNldFNyYyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgdmFyIGM7XG4gICAgYS5zcmMgPSBiLnVybCwgXCJpbWFnZS9zdmcreG1sXCIgPT09IGIuc2V0LnR5cGUgJiYgKGMgPSBhLnN0eWxlLndpZHRoLCBhLnN0eWxlLndpZHRoID0gYS5vZmZzZXRXaWR0aCArIDEgKyBcInB4XCIsIGEub2Zmc2V0V2lkdGggKyAxICYmIChhLnN0eWxlLndpZHRoID0gYykpO1xuICB9LCBzLmdldFNldCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIGIsXG4gICAgICAgIGMsXG4gICAgICAgIGQsXG4gICAgICAgIGUgPSAhMSxcbiAgICAgICAgZiA9IGFbcy5uc10uc2V0cztcblxuICAgIGZvciAoYiA9IDA7IGIgPCBmLmxlbmd0aCAmJiAhZTsgYisrKSB7XG4gICAgICBpZiAoYyA9IGZbYl0sIGMuc3Jjc2V0ICYmIHMubWF0Y2hlc01lZGlhKGMubWVkaWEpICYmIChkID0gcy5zdXBwb3J0c1R5cGUoYy50eXBlKSkpIHtcbiAgICAgICAgXCJwZW5kaW5nXCIgPT09IGQgJiYgKGMgPSBkKSwgZSA9IGM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlO1xuICB9LCBzLnBhcnNlU2V0cyA9IGZ1bmN0aW9uIChhLCBiLCBkKSB7XG4gICAgdmFyIGUsXG4gICAgICAgIGYsXG4gICAgICAgIGcsXG4gICAgICAgIGgsXG4gICAgICAgIGkgPSBiICYmIFwiUElDVFVSRVwiID09PSBiLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIGogPSBhW3MubnNdO1xuICAgIChqLnNyYyA9PT0gYyB8fCBkLnNyYykgJiYgKGouc3JjID0gdy5jYWxsKGEsIFwic3JjXCIpLCBqLnNyYyA/IHguY2FsbChhLCBDLCBqLnNyYykgOiB5LmNhbGwoYSwgQykpLCAoai5zcmNzZXQgPT09IGMgfHwgZC5zcmNzZXQgfHwgIXMuc3VwU3Jjc2V0IHx8IGEuc3Jjc2V0KSAmJiAoZSA9IHcuY2FsbChhLCBcInNyY3NldFwiKSwgai5zcmNzZXQgPSBlLCBoID0gITApLCBqLnNldHMgPSBbXSwgaSAmJiAoai5waWMgPSAhMCwgbChiLCBqLnNldHMpKSwgai5zcmNzZXQgPyAoZiA9IHtcbiAgICAgIHNyY3NldDogai5zcmNzZXQsXG4gICAgICBzaXplczogdy5jYWxsKGEsIFwic2l6ZXNcIilcbiAgICB9LCBqLnNldHMucHVzaChmKSwgZyA9IChxIHx8IGouc3JjKSAmJiBILnRlc3Qoai5zcmNzZXQgfHwgXCJcIiksIGcgfHwgIWouc3JjIHx8IGsoai5zcmMsIGYpIHx8IGYuaGFzMXggfHwgKGYuc3Jjc2V0ICs9IFwiLCBcIiArIGouc3JjLCBmLmNhbmRzLnB1c2goe1xuICAgICAgdXJsOiBqLnNyYyxcbiAgICAgIGQ6IDEsXG4gICAgICBzZXQ6IGZcbiAgICB9KSkpIDogai5zcmMgJiYgai5zZXRzLnB1c2goe1xuICAgICAgc3Jjc2V0OiBqLnNyYyxcbiAgICAgIHNpemVzOiBudWxsXG4gICAgfSksIGouY3VyQ2FuID0gbnVsbCwgai5jdXJTcmMgPSBjLCBqLnN1cHBvcnRlZCA9ICEoaSB8fCBmICYmICFzLnN1cFNyY3NldCB8fCBnICYmICFzLnN1cFNpemVzKSwgaCAmJiBzLnN1cFNyY3NldCAmJiAhai5zdXBwb3J0ZWQgJiYgKGUgPyAoeC5jYWxsKGEsIEQsIGUpLCBhLnNyY3NldCA9IFwiXCIpIDogeS5jYWxsKGEsIEQpKSwgai5zdXBwb3J0ZWQgJiYgIWouc3Jjc2V0ICYmICghai5zcmMgJiYgYS5zcmMgfHwgYS5zcmMgIT09IHMubWFrZVVybChqLnNyYykpICYmIChudWxsID09PSBqLnNyYyA/IGEucmVtb3ZlQXR0cmlidXRlKFwic3JjXCIpIDogYS5zcmMgPSBqLnNyYyksIGoucGFyc2VkID0gITA7XG4gIH0sIHMuZmlsbEltZyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgdmFyIGMsXG4gICAgICAgIGQgPSBiLnJlc2VsZWN0IHx8IGIucmVldmFsdWF0ZTtcbiAgICBhW3MubnNdIHx8IChhW3MubnNdID0ge30pLCBjID0gYVtzLm5zXSwgKGQgfHwgYy5ldmFsZWQgIT09IHIpICYmICgoIWMucGFyc2VkIHx8IGIucmVldmFsdWF0ZSkgJiYgcy5wYXJzZVNldHMoYSwgYS5wYXJlbnROb2RlLCBiKSwgYy5zdXBwb3J0ZWQgPyBjLmV2YWxlZCA9IHIgOiBoKGEpKTtcbiAgfSwgcy5zZXR1cFJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICAoIVMgfHwgTSB8fCBQICE9PSBhLmRldmljZVBpeGVsUmF0aW8pICYmIGYoKTtcbiAgfSwgcy5zdXBQaWN0dXJlID8gKGJhID0gdSwgcy5maWxsSW1nID0gdSkgOiAhZnVuY3Rpb24gKCkge1xuICAgIHZhciBjLFxuICAgICAgICBkID0gYS5hdHRhY2hFdmVudCA/IC9kJHxeYy8gOiAvZCR8XmN8XmkvLFxuICAgICAgICBlID0gZnVuY3Rpb24gZSgpIHtcbiAgICAgIHZhciBhID0gYi5yZWFkeVN0YXRlIHx8IFwiXCI7XG4gICAgICBmID0gc2V0VGltZW91dChlLCBcImxvYWRpbmdcIiA9PT0gYSA/IDIwMCA6IDk5OSksIGIuYm9keSAmJiAocy5maWxsSW1ncygpLCBjID0gYyB8fCBkLnRlc3QoYSksIGMgJiYgY2xlYXJUaW1lb3V0KGYpKTtcbiAgICB9LFxuICAgICAgICBmID0gc2V0VGltZW91dChlLCBiLmJvZHkgPyA5IDogOTkpLFxuICAgICAgICBnID0gZnVuY3Rpb24gZyhhLCBiKSB7XG4gICAgICB2YXIgYyxcbiAgICAgICAgICBkLFxuICAgICAgICAgIGUgPSBmdW5jdGlvbiBlKCkge1xuICAgICAgICB2YXIgZiA9IG5ldyBEYXRlKCkgLSBkO1xuICAgICAgICBiID4gZiA/IGMgPSBzZXRUaW1lb3V0KGUsIGIgLSBmKSA6IChjID0gbnVsbCwgYSgpKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQgPSBuZXcgRGF0ZSgpLCBjIHx8IChjID0gc2V0VGltZW91dChlLCBiKSk7XG4gICAgICB9O1xuICAgIH0sXG4gICAgICAgIGggPSB6LmNsaWVudEhlaWdodCxcbiAgICAgICAgaSA9IGZ1bmN0aW9uIGkoKSB7XG4gICAgICBNID0gTWF0aC5tYXgoYS5pbm5lcldpZHRoIHx8IDAsIHouY2xpZW50V2lkdGgpICE9PSBRLndpZHRoIHx8IHouY2xpZW50SGVpZ2h0ICE9PSBoLCBoID0gei5jbGllbnRIZWlnaHQsIE0gJiYgcy5maWxsSW1ncygpO1xuICAgIH07XG5cbiAgICBaKGEsIFwicmVzaXplXCIsIGcoaSwgOTkpKSwgWihiLCBcInJlYWR5c3RhdGVjaGFuZ2VcIiwgZSk7XG4gIH0oKSwgcy5waWN0dXJlZmlsbCA9IGJhLCBzLmZpbGxJbWdzID0gYmEsIHMudGVhcmRvd25SdW4gPSB1LCBiYS5fID0gcywgYS5waWN0dXJlZmlsbENGRyA9IHtcbiAgICBwZjogcyxcbiAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKGEpIHtcbiAgICAgIHZhciBiID0gYS5zaGlmdCgpO1xuICAgICAgXCJmdW5jdGlvblwiID09IHR5cGVvZiBzW2JdID8gc1tiXS5hcHBseShzLCBhKSA6IChCW2JdID0gYVswXSwgUyAmJiBzLmZpbGxJbWdzKHtcbiAgICAgICAgcmVzZWxlY3Q6ICEwXG4gICAgICB9KSk7XG4gICAgfVxuICB9O1xuXG4gIGZvciAoOyBKICYmIEoubGVuZ3RoOykge1xuICAgIGEucGljdHVyZWZpbGxDRkcucHVzaChKLnNoaWZ0KCkpO1xuICB9XG5cbiAgYS5waWN0dXJlZmlsbCA9IGJhLCBcIm9iamVjdFwiID09ICh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgJiYgXCJvYmplY3RcIiA9PSBfdHlwZW9mKG1vZHVsZS5leHBvcnRzKSA/IG1vZHVsZS5leHBvcnRzID0gYmEgOiBcImZ1bmN0aW9uXCIgPT0gdHlwZW9mIGRlZmluZSAmJiBkZWZpbmUuYW1kICYmIGRlZmluZShcInBpY3R1cmVmaWxsXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYmE7XG4gIH0pLCBzLnN1cFBpY3R1cmUgfHwgKEFbXCJpbWFnZS93ZWJwXCJdID0gZShcImltYWdlL3dlYnBcIiwgXCJkYXRhOmltYWdlL3dlYnA7YmFzZTY0LFVrbEdSa29BQUFCWFJVSlFWbEE0V0FvQUFBQVFBQUFBQUFBQUFBQUFRVXhRU0F3QUFBQUJCeEFSL1E5RVJQOERBQUJXVURnZ0dBQUFBREFCQUowQktnRUFBUUFEQURRbHBBQURjQUQrKy8xUUFBPT1cIikpO1xufSh3aW5kb3csIGRvY3VtZW50KTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4hZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICBpZiAoXCJ1bmRlZmluZWRcIiAhPSB0eXBlb2Ygd2luZG93KSB7XG4gICAgdmFyIHQgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvRWRnZVxcLyhcXGR7Mn0pXFwuLyksXG4gICAgICAgIG4gPSAhIXQgJiYgMTYgPD0gcGFyc2VJbnQodFsxXSwgMTApO1xuXG4gICAgaWYgKCEoXCJvYmplY3RGaXRcIiBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgIT0gITEpIHx8IG4pIHtcbiAgICAgIHZhciBvID0gZnVuY3Rpb24gbyh0LCBlLCBpKSB7XG4gICAgICAgIHZhciBuLCBvLCBsLCBhLCBkO1xuICAgICAgICBpZiAoKGkgPSBpLnNwbGl0KFwiIFwiKSkubGVuZ3RoIDwgMiAmJiAoaVsxXSA9IGlbMF0pLCBcInhcIiA9PT0gdCkgbiA9IGlbMF0sIG8gPSBpWzFdLCBsID0gXCJsZWZ0XCIsIGEgPSBcInJpZ2h0XCIsIGQgPSBlLmNsaWVudFdpZHRoO2Vsc2Uge1xuICAgICAgICAgIGlmIChcInlcIiAhPT0gdCkgcmV0dXJuO1xuICAgICAgICAgIG4gPSBpWzFdLCBvID0gaVswXSwgbCA9IFwidG9wXCIsIGEgPSBcImJvdHRvbVwiLCBkID0gZS5jbGllbnRIZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobiAhPT0gbCAmJiBvICE9PSBsKSB7XG4gICAgICAgICAgaWYgKG4gIT09IGEgJiYgbyAhPT0gYSkgcmV0dXJuIFwiY2VudGVyXCIgPT09IG4gfHwgXCI1MCVcIiA9PT0gbiA/IChlLnN0eWxlW2xdID0gXCI1MCVcIiwgdm9pZCAoZS5zdHlsZVtcIm1hcmdpbi1cIiArIGxdID0gZCAvIC0yICsgXCJweFwiKSkgOiB2b2lkICgwIDw9IG4uaW5kZXhPZihcIiVcIikgPyAobiA9IHBhcnNlSW50KG4pKSA8IDUwID8gKGUuc3R5bGVbbF0gPSBuICsgXCIlXCIsIGUuc3R5bGVbXCJtYXJnaW4tXCIgKyBsXSA9IGQgKiAobiAvIC0xMDApICsgXCJweFwiKSA6IChuID0gMTAwIC0gbiwgZS5zdHlsZVthXSA9IG4gKyBcIiVcIiwgZS5zdHlsZVtcIm1hcmdpbi1cIiArIGFdID0gZCAqIChuIC8gLTEwMCkgKyBcInB4XCIpIDogZS5zdHlsZVtsXSA9IG4pO1xuICAgICAgICAgIGUuc3R5bGVbYV0gPSBcIjBcIjtcbiAgICAgICAgfSBlbHNlIGUuc3R5bGVbbF0gPSBcIjBcIjtcbiAgICAgIH0sXG4gICAgICAgICAgbCA9IGZ1bmN0aW9uIGwodCkge1xuICAgICAgICB2YXIgZSA9IHQuZGF0YXNldCA/IHQuZGF0YXNldC5vYmplY3RGaXQgOiB0LmdldEF0dHJpYnV0ZShcImRhdGEtb2JqZWN0LWZpdFwiKSxcbiAgICAgICAgICAgIGkgPSB0LmRhdGFzZXQgPyB0LmRhdGFzZXQub2JqZWN0UG9zaXRpb24gOiB0LmdldEF0dHJpYnV0ZShcImRhdGEtb2JqZWN0LXBvc2l0aW9uXCIpO1xuICAgICAgICBlID0gZSB8fCBcImNvdmVyXCIsIGkgPSBpIHx8IFwiNTAlIDUwJVwiO1xuICAgICAgICB2YXIgbiA9IHQucGFyZW50Tm9kZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgdmFyIGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0LCBudWxsKSxcbiAgICAgICAgICAgICAgaSA9IGUuZ2V0UHJvcGVydHlWYWx1ZShcInBvc2l0aW9uXCIpLFxuICAgICAgICAgICAgICBuID0gZS5nZXRQcm9wZXJ0eVZhbHVlKFwib3ZlcmZsb3dcIiksXG4gICAgICAgICAgICAgIG8gPSBlLmdldFByb3BlcnR5VmFsdWUoXCJkaXNwbGF5XCIpO1xuICAgICAgICAgIGkgJiYgXCJzdGF0aWNcIiAhPT0gaSB8fCAodC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIiksIFwiaGlkZGVuXCIgIT09IG4gJiYgKHQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiKSwgbyAmJiBcImlubGluZVwiICE9PSBvIHx8ICh0LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCIpLCAwID09PSB0LmNsaWVudEhlaWdodCAmJiAodC5zdHlsZS5oZWlnaHQgPSBcIjEwMCVcIiksIC0xID09PSB0LmNsYXNzTmFtZS5pbmRleE9mKFwib2JqZWN0LWZpdC1wb2x5ZmlsbFwiKSAmJiAodC5jbGFzc05hbWUgPSB0LmNsYXNzTmFtZSArIFwiIG9iamVjdC1maXQtcG9seWZpbGxcIik7XG4gICAgICAgIH0obiksIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgdmFyIGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0LCBudWxsKSxcbiAgICAgICAgICAgICAgaSA9IHtcbiAgICAgICAgICAgIFwibWF4LXdpZHRoXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgXCJtYXgtaGVpZ2h0XCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgXCJtaW4td2lkdGhcIjogXCIwcHhcIixcbiAgICAgICAgICAgIFwibWluLWhlaWdodFwiOiBcIjBweFwiLFxuICAgICAgICAgICAgdG9wOiBcImF1dG9cIixcbiAgICAgICAgICAgIHJpZ2h0OiBcImF1dG9cIixcbiAgICAgICAgICAgIGJvdHRvbTogXCJhdXRvXCIsXG4gICAgICAgICAgICBsZWZ0OiBcImF1dG9cIixcbiAgICAgICAgICAgIFwibWFyZ2luLXRvcFwiOiBcIjBweFwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tcmlnaHRcIjogXCIwcHhcIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjBweFwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tbGVmdFwiOiBcIjBweFwiXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGZvciAodmFyIG4gaW4gaSkge1xuICAgICAgICAgICAgZS5nZXRQcm9wZXJ0eVZhbHVlKG4pICE9PSBpW25dICYmICh0LnN0eWxlW25dID0gaVtuXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KHQpLCB0LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiLCB0LnN0eWxlLndpZHRoID0gXCJhdXRvXCIsIHQuc3R5bGUuaGVpZ2h0ID0gXCJhdXRvXCIsIFwic2NhbGUtZG93blwiID09PSBlICYmIChlID0gdC5jbGllbnRXaWR0aCA8IG4uY2xpZW50V2lkdGggJiYgdC5jbGllbnRIZWlnaHQgPCBuLmNsaWVudEhlaWdodCA/IFwibm9uZVwiIDogXCJjb250YWluXCIpLCBcIm5vbmVcIiA9PT0gZSA/IChvKFwieFwiLCB0LCBpKSwgdm9pZCBvKFwieVwiLCB0LCBpKSkgOiBcImZpbGxcIiA9PT0gZSA/ICh0LnN0eWxlLndpZHRoID0gXCIxMDAlXCIsIHQuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCIsIG8oXCJ4XCIsIHQsIGkpLCB2b2lkIG8oXCJ5XCIsIHQsIGkpKSA6ICh0LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiLCB2b2lkIChcImNvdmVyXCIgPT09IGUgJiYgdC5jbGllbnRXaWR0aCA+IG4uY2xpZW50V2lkdGggfHwgXCJjb250YWluXCIgPT09IGUgJiYgdC5jbGllbnRXaWR0aCA8IG4uY2xpZW50V2lkdGggPyAodC5zdHlsZS50b3AgPSBcIjBcIiwgdC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjBcIiwgbyhcInhcIiwgdCwgaSkpIDogKHQuc3R5bGUud2lkdGggPSBcIjEwMCVcIiwgdC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIiwgdC5zdHlsZS5sZWZ0ID0gXCIwXCIsIHQuc3R5bGUubWFyZ2luTGVmdCA9IFwiMFwiLCBvKFwieVwiLCB0LCBpKSkpKTtcbiAgICAgIH0sXG4gICAgICAgICAgZSA9IGZ1bmN0aW9uIGUodCkge1xuICAgICAgICBpZiAodm9pZCAwID09PSB0IHx8IHQgaW5zdGFuY2VvZiBFdmVudCkgdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbZGF0YS1vYmplY3QtZml0XVwiKTtlbHNlIGlmICh0ICYmIHQubm9kZU5hbWUpIHQgPSBbdF07ZWxzZSB7XG4gICAgICAgICAgaWYgKFwib2JqZWN0XCIgIT0gX3R5cGVvZih0KSB8fCAhdC5sZW5ndGggfHwgIXRbMF0ubm9kZU5hbWUpIHJldHVybiAhMTtcbiAgICAgICAgICB0ID0gdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdC5sZW5ndGg7IGUrKykge1xuICAgICAgICAgIGlmICh0W2VdLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaSA9IHRbZV0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgaWYgKFwiaW1nXCIgPT09IGkpIHtcbiAgICAgICAgICAgICAgaWYgKG4pIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB0W2VdLmNvbXBsZXRlID8gbCh0W2VdKSA6IHRbZV0uYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGwodGhpcyk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIFwidmlkZW9cIiA9PT0gaSA/IDAgPCB0W2VdLnJlYWR5U3RhdGUgPyBsKHRbZV0pIDogdFtlXS5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBsKHRoaXMpO1xuICAgICAgICAgICAgfSkgOiBsKHRbZV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhMDtcbiAgICAgIH07XG5cbiAgICAgIFwibG9hZGluZ1wiID09PSBkb2N1bWVudC5yZWFkeVN0YXRlID8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZSkgOiBlKCksIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGUpLCB3aW5kb3cub2JqZWN0Rml0UG9seWZpbGwgPSBlO1xuICAgIH0gZWxzZSB3aW5kb3cub2JqZWN0Rml0UG9seWZpbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gITE7XG4gICAgfTtcbiAgfVxufSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qIVxuICogSXNvdG9wZSBQQUNLQUdFRCB2My4wLjZcbiAqXG4gKiBMaWNlbnNlZCBHUEx2MyBmb3Igb3BlbiBzb3VyY2UgdXNlXG4gKiBvciBJc290b3BlIENvbW1lcmNpYWwgTGljZW5zZSBmb3IgY29tbWVyY2lhbCB1c2VcbiAqXG4gKiBodHRwczovL2lzb3RvcGUubWV0YWZpenp5LmNvXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE4IE1ldGFmaXp6eVxuICovXG5cbi8qKlxuICogQnJpZGdldCBtYWtlcyBqUXVlcnkgd2lkZ2V0c1xuICogdjIuMC4xXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qIGpzaGludCBicm93c2VyOiB0cnVlLCBzdHJpY3Q6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qanNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnanF1ZXJ5LWJyaWRnZXQvanF1ZXJ5LWJyaWRnZXQnLCBbJ2pxdWVyeSddLCBmdW5jdGlvbiAoalF1ZXJ5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIGpRdWVyeSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHdpbmRvdywgcmVxdWlyZSgnanF1ZXJ5JykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmpRdWVyeUJyaWRnZXQgPSBmYWN0b3J5KHdpbmRvdywgd2luZG93LmpRdWVyeSk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIGpRdWVyeSkge1xuICAndXNlIHN0cmljdCc7IC8vIC0tLS0tIHV0aWxzIC0tLS0tIC8vXG5cbiAgdmFyIGFycmF5U2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7IC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbG9nZ2luZyBlcnJvcnNcbiAgLy8gJC5lcnJvciBicmVha3MgalF1ZXJ5IGNoYWluaW5nXG5cbiAgdmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbiAgdmFyIGxvZ0Vycm9yID0gdHlwZW9mIGNvbnNvbGUgPT0gJ3VuZGVmaW5lZCcgPyBmdW5jdGlvbiAoKSB7fSA6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbiAgfTsgLy8gLS0tLS0galF1ZXJ5QnJpZGdldCAtLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIGpRdWVyeUJyaWRnZXQobmFtZXNwYWNlLCBQbHVnaW5DbGFzcywgJCkge1xuICAgICQgPSAkIHx8IGpRdWVyeSB8fCB3aW5kb3cualF1ZXJ5O1xuXG4gICAgaWYgKCEkKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBhZGQgb3B0aW9uIG1ldGhvZCAtPiAkKCkucGx1Z2luKCdvcHRpb24nLCB7Li4ufSlcblxuXG4gICAgaWYgKCFQbHVnaW5DbGFzcy5wcm90b3R5cGUub3B0aW9uKSB7XG4gICAgICAvLyBvcHRpb24gc2V0dGVyXG4gICAgICBQbHVnaW5DbGFzcy5wcm90b3R5cGUub3B0aW9uID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgICAgLy8gYmFpbCBvdXQgaWYgbm90IGFuIG9iamVjdFxuICAgICAgICBpZiAoISQuaXNQbGFpbk9iamVjdChvcHRzKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgb3B0cyk7XG4gICAgICB9O1xuICAgIH0gLy8gbWFrZSBqUXVlcnkgcGx1Z2luXG5cblxuICAgICQuZm5bbmFtZXNwYWNlXSA9IGZ1bmN0aW9uIChhcmcwXG4gICAgLyosIGFyZzEgKi9cbiAgICApIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnMCA9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBtZXRob2QgY2FsbCAkKCkucGx1Z2luKCAnbWV0aG9kTmFtZScsIHsgb3B0aW9ucyB9IClcbiAgICAgICAgLy8gc2hpZnQgYXJndW1lbnRzIGJ5IDFcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheVNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgcmV0dXJuIG1ldGhvZENhbGwodGhpcywgYXJnMCwgYXJncyk7XG4gICAgICB9IC8vIGp1c3QgJCgpLnBsdWdpbih7IG9wdGlvbnMgfSlcblxuXG4gICAgICBwbGFpbkNhbGwodGhpcywgYXJnMCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9OyAvLyAkKCkucGx1Z2luKCdtZXRob2ROYW1lJylcblxuXG4gICAgZnVuY3Rpb24gbWV0aG9kQ2FsbCgkZWxlbXMsIG1ldGhvZE5hbWUsIGFyZ3MpIHtcbiAgICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICAgIHZhciBwbHVnaW5NZXRob2RTdHIgPSAnJCgpLicgKyBuYW1lc3BhY2UgKyAnKFwiJyArIG1ldGhvZE5hbWUgKyAnXCIpJztcbiAgICAgICRlbGVtcy5lYWNoKGZ1bmN0aW9uIChpLCBlbGVtKSB7XG4gICAgICAgIC8vIGdldCBpbnN0YW5jZVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSAkLmRhdGEoZWxlbSwgbmFtZXNwYWNlKTtcblxuICAgICAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICAgICAgbG9nRXJyb3IobmFtZXNwYWNlICsgJyBub3QgaW5pdGlhbGl6ZWQuIENhbm5vdCBjYWxsIG1ldGhvZHMsIGkuZS4gJyArIHBsdWdpbk1ldGhvZFN0cik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1ldGhvZCA9IGluc3RhbmNlW21ldGhvZE5hbWVdO1xuXG4gICAgICAgIGlmICghbWV0aG9kIHx8IG1ldGhvZE5hbWUuY2hhckF0KDApID09ICdfJykge1xuICAgICAgICAgIGxvZ0Vycm9yKHBsdWdpbk1ldGhvZFN0ciArICcgaXMgbm90IGEgdmFsaWQgbWV0aG9kJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IC8vIGFwcGx5IG1ldGhvZCwgZ2V0IHJldHVybiB2YWx1ZVxuXG5cbiAgICAgICAgdmFyIHZhbHVlID0gbWV0aG9kLmFwcGx5KGluc3RhbmNlLCBhcmdzKTsgLy8gc2V0IHJldHVybiB2YWx1ZSBpZiB2YWx1ZSBpcyByZXR1cm5lZCwgdXNlIG9ubHkgZmlyc3QgdmFsdWVcblxuICAgICAgICByZXR1cm5WYWx1ZSA9IHJldHVyblZhbHVlID09PSB1bmRlZmluZWQgPyB2YWx1ZSA6IHJldHVyblZhbHVlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmV0dXJuVmFsdWUgIT09IHVuZGVmaW5lZCA/IHJldHVyblZhbHVlIDogJGVsZW1zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsYWluQ2FsbCgkZWxlbXMsIG9wdGlvbnMpIHtcbiAgICAgICRlbGVtcy5lYWNoKGZ1bmN0aW9uIChpLCBlbGVtKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9ICQuZGF0YShlbGVtLCBuYW1lc3BhY2UpO1xuXG4gICAgICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgICAgIC8vIHNldCBvcHRpb25zICYgaW5pdFxuICAgICAgICAgIGluc3RhbmNlLm9wdGlvbihvcHRpb25zKTtcblxuICAgICAgICAgIGluc3RhbmNlLl9pbml0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaW5pdGlhbGl6ZSBuZXcgaW5zdGFuY2VcbiAgICAgICAgICBpbnN0YW5jZSA9IG5ldyBQbHVnaW5DbGFzcyhlbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAkLmRhdGEoZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHVwZGF0ZUpRdWVyeSgkKTtcbiAgfSAvLyAtLS0tLSB1cGRhdGVKUXVlcnkgLS0tLS0gLy9cbiAgLy8gc2V0ICQuYnJpZGdldCBmb3IgdjEgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcblxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUpRdWVyeSgkKSB7XG4gICAgaWYgKCEkIHx8ICQgJiYgJC5icmlkZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJC5icmlkZ2V0ID0galF1ZXJ5QnJpZGdldDtcbiAgfVxuXG4gIHVwZGF0ZUpRdWVyeShqUXVlcnkgfHwgd2luZG93LmpRdWVyeSk7IC8vIC0tLS0tICAtLS0tLSAvL1xuXG4gIHJldHVybiBqUXVlcnlCcmlkZ2V0O1xufSk7XG4vKipcbiAqIEV2RW1pdHRlciB2MS4xLjBcbiAqIExpbCcgZXZlbnQgZW1pdHRlclxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4vKiBqc2hpbnQgdW51c2VkOiB0cnVlLCB1bmRlZjogdHJ1ZSwgc3RyaWN0OiB0cnVlICovXG5cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCB3aW5kb3cgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EIC0gUmVxdWlyZUpTXG4gICAgZGVmaW5lKCdldi1lbWl0dGVyL2V2LWVtaXR0ZXInLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlMgLSBCcm93c2VyaWZ5LCBXZWJwYWNrXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgZ2xvYmFsLkV2RW1pdHRlciA9IGZhY3RvcnkoKTtcbiAgfVxufSkodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHZvaWQgMCwgZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBFdkVtaXR0ZXIoKSB7fVxuXG4gIHZhciBwcm90byA9IEV2RW1pdHRlci5wcm90b3R5cGU7XG5cbiAgcHJvdG8ub24gPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICghZXZlbnROYW1lIHx8ICFsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gc2V0IGV2ZW50cyBoYXNoXG5cblxuICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307IC8vIHNldCBsaXN0ZW5lcnMgYXJyYXlcblxuICAgIHZhciBsaXN0ZW5lcnMgPSBldmVudHNbZXZlbnROYW1lXSA9IGV2ZW50c1tldmVudE5hbWVdIHx8IFtdOyAvLyBvbmx5IGFkZCBvbmNlXG5cbiAgICBpZiAobGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpID09IC0xKSB7XG4gICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcHJvdG8ub25jZSA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKCFldmVudE5hbWUgfHwgIWxpc3RlbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBhZGQgZXZlbnRcblxuXG4gICAgdGhpcy5vbihldmVudE5hbWUsIGxpc3RlbmVyKTsgLy8gc2V0IG9uY2UgZmxhZ1xuICAgIC8vIHNldCBvbmNlRXZlbnRzIGhhc2hcblxuICAgIHZhciBvbmNlRXZlbnRzID0gdGhpcy5fb25jZUV2ZW50cyA9IHRoaXMuX29uY2VFdmVudHMgfHwge307IC8vIHNldCBvbmNlTGlzdGVuZXJzIG9iamVjdFxuXG4gICAgdmFyIG9uY2VMaXN0ZW5lcnMgPSBvbmNlRXZlbnRzW2V2ZW50TmFtZV0gPSBvbmNlRXZlbnRzW2V2ZW50TmFtZV0gfHwge307IC8vIHNldCBmbGFnXG5cbiAgICBvbmNlTGlzdGVuZXJzW2xpc3RlbmVyXSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgcHJvdG8ub2ZmID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldmVudE5hbWVdO1xuXG4gICAgaWYgKCFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSBsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG5cbiAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgIGxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1tldmVudE5hbWVdO1xuXG4gICAgaWYgKCFsaXN0ZW5lcnMgfHwgIWxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGNvcHkgb3ZlciB0byBhdm9pZCBpbnRlcmZlcmVuY2UgaWYgLm9mZigpIGluIGxpc3RlbmVyXG5cblxuICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5zbGljZSgwKTtcbiAgICBhcmdzID0gYXJncyB8fCBbXTsgLy8gb25jZSBzdHVmZlxuXG4gICAgdmFyIG9uY2VMaXN0ZW5lcnMgPSB0aGlzLl9vbmNlRXZlbnRzICYmIHRoaXMuX29uY2VFdmVudHNbZXZlbnROYW1lXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbaV07XG4gICAgICB2YXIgaXNPbmNlID0gb25jZUxpc3RlbmVycyAmJiBvbmNlTGlzdGVuZXJzW2xpc3RlbmVyXTtcblxuICAgICAgaWYgKGlzT25jZSkge1xuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXJcbiAgICAgICAgLy8gcmVtb3ZlIGJlZm9yZSB0cmlnZ2VyIHRvIHByZXZlbnQgcmVjdXJzaW9uXG4gICAgICAgIHRoaXMub2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpOyAvLyB1bnNldCBvbmNlIGZsYWdcblxuICAgICAgICBkZWxldGUgb25jZUxpc3RlbmVyc1tsaXN0ZW5lcl07XG4gICAgICB9IC8vIHRyaWdnZXIgbGlzdGVuZXJcblxuXG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBwcm90by5hbGxPZmYgPSBmdW5jdGlvbiAoKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50cztcbiAgICBkZWxldGUgdGhpcy5fb25jZUV2ZW50cztcbiAgfTtcblxuICByZXR1cm4gRXZFbWl0dGVyO1xufSk7XG4vKiFcbiAqIGdldFNpemUgdjIuMC4zXG4gKiBtZWFzdXJlIHNpemUgb2YgZWxlbWVudHNcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLyoganNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuXG4vKiBnbG9iYWxzIGNvbnNvbGU6IGZhbHNlICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKiBnbG9iYWxzIGRlZmluZSwgbW9kdWxlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZ2V0LXNpemUvZ2V0LXNpemUnLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5nZXRTaXplID0gZmFjdG9yeSgpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICd1c2Ugc3RyaWN0JzsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBnZXQgYSBudW1iZXIgZnJvbSBhIHN0cmluZywgbm90IGEgcGVyY2VudGFnZVxuXG4gIGZ1bmN0aW9uIGdldFN0eWxlU2l6ZSh2YWx1ZSkge1xuICAgIHZhciBudW0gPSBwYXJzZUZsb2F0KHZhbHVlKTsgLy8gbm90IGEgcGVyY2VudCBsaWtlICcxMDAlJywgYW5kIGEgbnVtYmVyXG5cbiAgICB2YXIgaXNWYWxpZCA9IHZhbHVlLmluZGV4T2YoJyUnKSA9PSAtMSAmJiAhaXNOYU4obnVtKTtcbiAgICByZXR1cm4gaXNWYWxpZCAmJiBudW07XG4gIH1cblxuICBmdW5jdGlvbiBub29wKCkge31cblxuICB2YXIgbG9nRXJyb3IgPSB0eXBlb2YgY29uc29sZSA9PSAndW5kZWZpbmVkJyA/IG5vb3AgOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1lYXN1cmVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIHZhciBtZWFzdXJlbWVudHMgPSBbJ3BhZGRpbmdMZWZ0JywgJ3BhZGRpbmdSaWdodCcsICdwYWRkaW5nVG9wJywgJ3BhZGRpbmdCb3R0b20nLCAnbWFyZ2luTGVmdCcsICdtYXJnaW5SaWdodCcsICdtYXJnaW5Ub3AnLCAnbWFyZ2luQm90dG9tJywgJ2JvcmRlckxlZnRXaWR0aCcsICdib3JkZXJSaWdodFdpZHRoJywgJ2JvcmRlclRvcFdpZHRoJywgJ2JvcmRlckJvdHRvbVdpZHRoJ107XG4gIHZhciBtZWFzdXJlbWVudHNMZW5ndGggPSBtZWFzdXJlbWVudHMubGVuZ3RoO1xuXG4gIGZ1bmN0aW9uIGdldFplcm9TaXplKCkge1xuICAgIHZhciBzaXplID0ge1xuICAgICAgd2lkdGg6IDAsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgICBpbm5lcldpZHRoOiAwLFxuICAgICAgaW5uZXJIZWlnaHQ6IDAsXG4gICAgICBvdXRlcldpZHRoOiAwLFxuICAgICAgb3V0ZXJIZWlnaHQ6IDBcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZWFzdXJlbWVudHNMZW5ndGg7IGkrKykge1xuICAgICAgdmFyIG1lYXN1cmVtZW50ID0gbWVhc3VyZW1lbnRzW2ldO1xuICAgICAgc2l6ZVttZWFzdXJlbWVudF0gPSAwO1xuICAgIH1cblxuICAgIHJldHVybiBzaXplO1xuICB9IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldFN0eWxlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGdldFN0eWxlLCBnZXQgc3R5bGUgb2YgZWxlbWVudCwgY2hlY2sgZm9yIEZpcmVmb3ggYnVnXG4gICAqIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTU0ODM5N1xuICAgKi9cblxuXG4gIGZ1bmN0aW9uIGdldFN0eWxlKGVsZW0pIHtcbiAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuXG4gICAgaWYgKCFzdHlsZSkge1xuICAgICAgbG9nRXJyb3IoJ1N0eWxlIHJldHVybmVkICcgKyBzdHlsZSArICcuIEFyZSB5b3UgcnVubmluZyB0aGlzIGNvZGUgaW4gYSBoaWRkZW4gaWZyYW1lIG9uIEZpcmVmb3g/ICcgKyAnU2VlIGh0dHBzOi8vYml0Lmx5L2dldHNpemVidWcxJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlO1xuICB9IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHNldHVwIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICB2YXIgaXNTZXR1cCA9IGZhbHNlO1xuICB2YXIgaXNCb3hTaXplT3V0ZXI7XG4gIC8qKlxuICAgKiBzZXR1cFxuICAgKiBjaGVjayBpc0JveFNpemVyT3V0ZXJcbiAgICogZG8gb24gZmlyc3QgZ2V0U2l6ZSgpIHJhdGhlciB0aGFuIG9uIHBhZ2UgbG9hZCBmb3IgRmlyZWZveCBidWdcbiAgICovXG5cbiAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgLy8gc2V0dXAgb25jZVxuICAgIGlmIChpc1NldHVwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaXNTZXR1cCA9IHRydWU7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGJveCBzaXppbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8qKlxuICAgICAqIENocm9tZSAmIFNhZmFyaSBtZWFzdXJlIHRoZSBvdXRlci13aWR0aCBvbiBzdHlsZS53aWR0aCBvbiBib3JkZXItYm94IGVsZW1zXG4gICAgICogSUUxMSAmIEZpcmVmb3g8MjkgbWVhc3VyZXMgdGhlIGlubmVyLXdpZHRoXG4gICAgICovXG5cbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LnN0eWxlLndpZHRoID0gJzIwMHB4JztcbiAgICBkaXYuc3R5bGUucGFkZGluZyA9ICcxcHggMnB4IDNweCA0cHgnO1xuICAgIGRpdi5zdHlsZS5ib3JkZXJTdHlsZSA9ICdzb2xpZCc7XG4gICAgZGl2LnN0eWxlLmJvcmRlcldpZHRoID0gJzFweCAycHggM3B4IDRweCc7XG4gICAgZGl2LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIGJvZHkuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICB2YXIgc3R5bGUgPSBnZXRTdHlsZShkaXYpOyAvLyByb3VuZCB2YWx1ZSBmb3IgYnJvd3NlciB6b29tLiBkZXNhbmRyby9tYXNvbnJ5IzkyOFxuXG4gICAgaXNCb3hTaXplT3V0ZXIgPSBNYXRoLnJvdW5kKGdldFN0eWxlU2l6ZShzdHlsZS53aWR0aCkpID09IDIwMDtcbiAgICBnZXRTaXplLmlzQm94U2l6ZU91dGVyID0gaXNCb3hTaXplT3V0ZXI7XG4gICAgYm9keS5yZW1vdmVDaGlsZChkaXYpO1xuICB9IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGdldFNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuXG4gIGZ1bmN0aW9uIGdldFNpemUoZWxlbSkge1xuICAgIHNldHVwKCk7IC8vIHVzZSBxdWVyeVNlbGV0b3IgaWYgZWxlbSBpcyBzdHJpbmdcblxuICAgIGlmICh0eXBlb2YgZWxlbSA9PSAnc3RyaW5nJykge1xuICAgICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbSk7XG4gICAgfSAvLyBkbyBub3QgcHJvY2VlZCBvbiBub24tb2JqZWN0c1xuXG5cbiAgICBpZiAoIWVsZW0gfHwgX3R5cGVvZihlbGVtKSAhPSAnb2JqZWN0JyB8fCAhZWxlbS5ub2RlVHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdHlsZSA9IGdldFN0eWxlKGVsZW0pOyAvLyBpZiBoaWRkZW4sIGV2ZXJ5dGhpbmcgaXMgMFxuXG4gICAgaWYgKHN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnKSB7XG4gICAgICByZXR1cm4gZ2V0WmVyb1NpemUoKTtcbiAgICB9XG5cbiAgICB2YXIgc2l6ZSA9IHt9O1xuICAgIHNpemUud2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xuICAgIHNpemUuaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XG4gICAgdmFyIGlzQm9yZGVyQm94ID0gc2l6ZS5pc0JvcmRlckJveCA9IHN0eWxlLmJveFNpemluZyA9PSAnYm9yZGVyLWJveCc7IC8vIGdldCBhbGwgbWVhc3VyZW1lbnRzXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lYXN1cmVtZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbWVhc3VyZW1lbnQgPSBtZWFzdXJlbWVudHNbaV07XG4gICAgICB2YXIgdmFsdWUgPSBzdHlsZVttZWFzdXJlbWVudF07XG4gICAgICB2YXIgbnVtID0gcGFyc2VGbG9hdCh2YWx1ZSk7IC8vIGFueSAnYXV0bycsICdtZWRpdW0nIHZhbHVlIHdpbGwgYmUgMFxuXG4gICAgICBzaXplW21lYXN1cmVtZW50XSA9ICFpc05hTihudW0pID8gbnVtIDogMDtcbiAgICB9XG5cbiAgICB2YXIgcGFkZGluZ1dpZHRoID0gc2l6ZS5wYWRkaW5nTGVmdCArIHNpemUucGFkZGluZ1JpZ2h0O1xuICAgIHZhciBwYWRkaW5nSGVpZ2h0ID0gc2l6ZS5wYWRkaW5nVG9wICsgc2l6ZS5wYWRkaW5nQm90dG9tO1xuICAgIHZhciBtYXJnaW5XaWR0aCA9IHNpemUubWFyZ2luTGVmdCArIHNpemUubWFyZ2luUmlnaHQ7XG4gICAgdmFyIG1hcmdpbkhlaWdodCA9IHNpemUubWFyZ2luVG9wICsgc2l6ZS5tYXJnaW5Cb3R0b207XG4gICAgdmFyIGJvcmRlcldpZHRoID0gc2l6ZS5ib3JkZXJMZWZ0V2lkdGggKyBzaXplLmJvcmRlclJpZ2h0V2lkdGg7XG4gICAgdmFyIGJvcmRlckhlaWdodCA9IHNpemUuYm9yZGVyVG9wV2lkdGggKyBzaXplLmJvcmRlckJvdHRvbVdpZHRoO1xuICAgIHZhciBpc0JvcmRlckJveFNpemVPdXRlciA9IGlzQm9yZGVyQm94ICYmIGlzQm94U2l6ZU91dGVyOyAvLyBvdmVyd3JpdGUgd2lkdGggYW5kIGhlaWdodCBpZiB3ZSBjYW4gZ2V0IGl0IGZyb20gc3R5bGVcblxuICAgIHZhciBzdHlsZVdpZHRoID0gZ2V0U3R5bGVTaXplKHN0eWxlLndpZHRoKTtcblxuICAgIGlmIChzdHlsZVdpZHRoICE9PSBmYWxzZSkge1xuICAgICAgc2l6ZS53aWR0aCA9IHN0eWxlV2lkdGggKyAoIC8vIGFkZCBwYWRkaW5nIGFuZCBib3JkZXIgdW5sZXNzIGl0J3MgYWxyZWFkeSBpbmNsdWRpbmcgaXRcbiAgICAgIGlzQm9yZGVyQm94U2l6ZU91dGVyID8gMCA6IHBhZGRpbmdXaWR0aCArIGJvcmRlcldpZHRoKTtcbiAgICB9XG5cbiAgICB2YXIgc3R5bGVIZWlnaHQgPSBnZXRTdHlsZVNpemUoc3R5bGUuaGVpZ2h0KTtcblxuICAgIGlmIChzdHlsZUhlaWdodCAhPT0gZmFsc2UpIHtcbiAgICAgIHNpemUuaGVpZ2h0ID0gc3R5bGVIZWlnaHQgKyAoIC8vIGFkZCBwYWRkaW5nIGFuZCBib3JkZXIgdW5sZXNzIGl0J3MgYWxyZWFkeSBpbmNsdWRpbmcgaXRcbiAgICAgIGlzQm9yZGVyQm94U2l6ZU91dGVyID8gMCA6IHBhZGRpbmdIZWlnaHQgKyBib3JkZXJIZWlnaHQpO1xuICAgIH1cblxuICAgIHNpemUuaW5uZXJXaWR0aCA9IHNpemUud2lkdGggLSAocGFkZGluZ1dpZHRoICsgYm9yZGVyV2lkdGgpO1xuICAgIHNpemUuaW5uZXJIZWlnaHQgPSBzaXplLmhlaWdodCAtIChwYWRkaW5nSGVpZ2h0ICsgYm9yZGVySGVpZ2h0KTtcbiAgICBzaXplLm91dGVyV2lkdGggPSBzaXplLndpZHRoICsgbWFyZ2luV2lkdGg7XG4gICAgc2l6ZS5vdXRlckhlaWdodCA9IHNpemUuaGVpZ2h0ICsgbWFyZ2luSGVpZ2h0O1xuICAgIHJldHVybiBzaXplO1xuICB9XG5cbiAgcmV0dXJuIGdldFNpemU7XG59KTtcbi8qKlxuICogbWF0Y2hlc1NlbGVjdG9yIHYyLjAuMlxuICogbWF0Y2hlc1NlbGVjdG9yKCBlbGVtZW50LCAnLnNlbGVjdG9yJyApXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHN0cmljdDogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UgKi9cbiAgJ3VzZSBzdHJpY3QnOyAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3IvbWF0Y2hlcy1zZWxlY3RvcicsIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lm1hdGNoZXNTZWxlY3RvciA9IGZhY3RvcnkoKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1hdGNoZXNNZXRob2QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIEVsZW1Qcm90byA9IHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZTsgLy8gY2hlY2sgZm9yIHRoZSBzdGFuZGFyZCBtZXRob2QgbmFtZSBmaXJzdFxuXG4gICAgaWYgKEVsZW1Qcm90by5tYXRjaGVzKSB7XG4gICAgICByZXR1cm4gJ21hdGNoZXMnO1xuICAgIH0gLy8gY2hlY2sgdW4tcHJlZml4ZWRcblxuXG4gICAgaWYgKEVsZW1Qcm90by5tYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiAnbWF0Y2hlc1NlbGVjdG9yJztcbiAgICB9IC8vIGNoZWNrIHZlbmRvciBwcmVmaXhlc1xuXG5cbiAgICB2YXIgcHJlZml4ZXMgPSBbJ3dlYmtpdCcsICdtb3onLCAnbXMnLCAnbyddO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHByZWZpeCA9IHByZWZpeGVzW2ldO1xuICAgICAgdmFyIG1ldGhvZCA9IHByZWZpeCArICdNYXRjaGVzU2VsZWN0b3InO1xuXG4gICAgICBpZiAoRWxlbVByb3RvW21ldGhvZF0pIHtcbiAgICAgICAgcmV0dXJuIG1ldGhvZDtcbiAgICAgIH1cbiAgICB9XG4gIH0oKTtcblxuICByZXR1cm4gZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsZW0sIHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGVsZW1bbWF0Y2hlc01ldGhvZF0oc2VsZWN0b3IpO1xuICB9O1xufSk7XG4vKipcbiAqIEZpenp5IFVJIHV0aWxzIHYyLjAuN1xuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlLCBzdHJpY3Q6IHRydWUgKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKmpzaGludCBzdHJpY3Q6IGZhbHNlICovXG5cbiAgLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnZml6enktdWktdXRpbHMvdXRpbHMnLCBbJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3IvbWF0Y2hlcy1zZWxlY3RvciddLCBmdW5jdGlvbiAobWF0Y2hlc1NlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIG1hdGNoZXNTZWxlY3Rvcik7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHdpbmRvdywgcmVxdWlyZSgnZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3RvcicpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5maXp6eVVJVXRpbHMgPSBmYWN0b3J5KHdpbmRvdywgd2luZG93Lm1hdGNoZXNTZWxlY3Rvcik7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIG1hdGNoZXNTZWxlY3Rvcikge1xuICB2YXIgdXRpbHMgPSB7fTsgLy8gLS0tLS0gZXh0ZW5kIC0tLS0tIC8vXG4gIC8vIGV4dGVuZHMgb2JqZWN0c1xuXG4gIHV0aWxzLmV4dGVuZCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBiKSB7XG4gICAgICBhW3Byb3BdID0gYltwcm9wXTtcbiAgICB9XG5cbiAgICByZXR1cm4gYTtcbiAgfTsgLy8gLS0tLS0gbW9kdWxvIC0tLS0tIC8vXG5cblxuICB1dGlscy5tb2R1bG8gPSBmdW5jdGlvbiAobnVtLCBkaXYpIHtcbiAgICByZXR1cm4gKG51bSAlIGRpdiArIGRpdikgJSBkaXY7XG4gIH07IC8vIC0tLS0tIG1ha2VBcnJheSAtLS0tLSAvL1xuXG5cbiAgdmFyIGFycmF5U2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7IC8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG5cbiAgdXRpbHMubWFrZUFycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgIC8vIHVzZSBvYmplY3QgaWYgYWxyZWFkeSBhbiBhcnJheVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9IC8vIHJldHVybiBlbXB0eSBhcnJheSBpZiB1bmRlZmluZWQgb3IgbnVsbC4gIzZcblxuXG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCBvYmogPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHZhciBpc0FycmF5TGlrZSA9IF90eXBlb2Yob2JqKSA9PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqLmxlbmd0aCA9PSAnbnVtYmVyJztcblxuICAgIGlmIChpc0FycmF5TGlrZSkge1xuICAgICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgICAgcmV0dXJuIGFycmF5U2xpY2UuY2FsbChvYmopO1xuICAgIH0gLy8gYXJyYXkgb2Ygc2luZ2xlIGluZGV4XG5cblxuICAgIHJldHVybiBbb2JqXTtcbiAgfTsgLy8gLS0tLS0gcmVtb3ZlRnJvbSAtLS0tLSAvL1xuXG5cbiAgdXRpbHMucmVtb3ZlRnJvbSA9IGZ1bmN0aW9uIChhcnksIG9iaikge1xuICAgIHZhciBpbmRleCA9IGFyeS5pbmRleE9mKG9iaik7XG5cbiAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgIGFyeS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfTsgLy8gLS0tLS0gZ2V0UGFyZW50IC0tLS0tIC8vXG5cblxuICB1dGlscy5nZXRQYXJlbnQgPSBmdW5jdGlvbiAoZWxlbSwgc2VsZWN0b3IpIHtcbiAgICB3aGlsZSAoZWxlbS5wYXJlbnROb2RlICYmIGVsZW0gIT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZTtcblxuICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihlbGVtLCBzZWxlY3RvcikpIHtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICB9XG4gICAgfVxuICB9OyAvLyAtLS0tLSBnZXRRdWVyeUVsZW1lbnQgLS0tLS0gLy9cbiAgLy8gdXNlIGVsZW1lbnQgYXMgc2VsZWN0b3Igc3RyaW5nXG5cblxuICB1dGlscy5nZXRRdWVyeUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIGlmICh0eXBlb2YgZWxlbSA9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW07XG4gIH07IC8vIC0tLS0tIGhhbmRsZUV2ZW50IC0tLS0tIC8vXG4gIC8vIGVuYWJsZSAub250eXBlIHRvIHRyaWdnZXIgZnJvbSAuYWRkRXZlbnRMaXN0ZW5lciggZWxlbSwgJ3R5cGUnIClcblxuXG4gIHV0aWxzLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuXG4gICAgaWYgKHRoaXNbbWV0aG9kXSkge1xuICAgICAgdGhpc1ttZXRob2RdKGV2ZW50KTtcbiAgICB9XG4gIH07IC8vIC0tLS0tIGZpbHRlckZpbmRFbGVtZW50cyAtLS0tLSAvL1xuXG5cbiAgdXRpbHMuZmlsdGVyRmluZEVsZW1lbnRzID0gZnVuY3Rpb24gKGVsZW1zLCBzZWxlY3Rvcikge1xuICAgIC8vIG1ha2UgYXJyYXkgb2YgZWxlbXNcbiAgICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheShlbGVtcyk7XG4gICAgdmFyIGZmRWxlbXMgPSBbXTtcbiAgICBlbGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAvLyBjaGVjayB0aGF0IGVsZW0gaXMgYW4gYWN0dWFsIGVsZW1lbnRcbiAgICAgIGlmICghKGVsZW0gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSAvLyBhZGQgZWxlbSBpZiBubyBzZWxlY3RvclxuXG5cbiAgICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgICAgZmZFbGVtcy5wdXNoKGVsZW0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhIHNlbGVjdG9yXG4gICAgICAvLyBmaWx0ZXJcblxuXG4gICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsZW0sIHNlbGVjdG9yKSkge1xuICAgICAgICBmZkVsZW1zLnB1c2goZWxlbSk7XG4gICAgICB9IC8vIGZpbmQgY2hpbGRyZW5cblxuXG4gICAgICB2YXIgY2hpbGRFbGVtcyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7IC8vIGNvbmNhdCBjaGlsZEVsZW1zIHRvIGZpbHRlckZvdW5kIGFycmF5XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRFbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBmZkVsZW1zLnB1c2goY2hpbGRFbGVtc1tpXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZmRWxlbXM7XG4gIH07IC8vIC0tLS0tIGRlYm91bmNlTWV0aG9kIC0tLS0tIC8vXG5cblxuICB1dGlscy5kZWJvdW5jZU1ldGhvZCA9IGZ1bmN0aW9uIChfY2xhc3MsIG1ldGhvZE5hbWUsIHRocmVzaG9sZCkge1xuICAgIHRocmVzaG9sZCA9IHRocmVzaG9sZCB8fCAxMDA7IC8vIG9yaWdpbmFsIG1ldGhvZFxuXG4gICAgdmFyIG1ldGhvZCA9IF9jbGFzcy5wcm90b3R5cGVbbWV0aG9kTmFtZV07XG4gICAgdmFyIHRpbWVvdXROYW1lID0gbWV0aG9kTmFtZSArICdUaW1lb3V0JztcblxuICAgIF9jbGFzcy5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdGltZW91dCA9IHRoaXNbdGltZW91dE5hbWVdO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIHRoaXNbdGltZW91dE5hbWVdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1ldGhvZC5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgIGRlbGV0ZSBfdGhpc1t0aW1lb3V0TmFtZV07XG4gICAgICB9LCB0aHJlc2hvbGQpO1xuICAgIH07XG4gIH07IC8vIC0tLS0tIGRvY1JlYWR5IC0tLS0tIC8vXG5cblxuICB1dGlscy5kb2NSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciByZWFkeVN0YXRlID0gZG9jdW1lbnQucmVhZHlTdGF0ZTtcblxuICAgIGlmIChyZWFkeVN0YXRlID09ICdjb21wbGV0ZScgfHwgcmVhZHlTdGF0ZSA9PSAnaW50ZXJhY3RpdmUnKSB7XG4gICAgICAvLyBkbyBhc3luYyB0byBhbGxvdyBmb3Igb3RoZXIgc2NyaXB0cyB0byBydW4uIG1ldGFmaXp6eS9mbGlja2l0eSM0NDFcbiAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgY2FsbGJhY2spO1xuICAgIH1cbiAgfTsgLy8gLS0tLS0gaHRtbEluaXQgLS0tLS0gLy9cbiAgLy8gaHR0cDovL2phbWVzcm9iZXJ0cy5uYW1lL2Jsb2cvMjAxMC8wMi8yMi9zdHJpbmctZnVuY3Rpb25zLWZvci1qYXZhc2NyaXB0LXRyaW0tdG8tY2FtZWwtY2FzZS10by1kYXNoZWQtYW5kLXRvLXVuZGVyc2NvcmUvXG5cblxuICB1dGlscy50b0Rhc2hlZCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyguKShbQS1aXSkvZywgZnVuY3Rpb24gKG1hdGNoLCAkMSwgJDIpIHtcbiAgICAgIHJldHVybiAkMSArICctJyArICQyO1xuICAgIH0pLnRvTG93ZXJDYXNlKCk7XG4gIH07XG5cbiAgdmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbiAgLyoqXG4gICAqIGFsbG93IHVzZXIgdG8gaW5pdGlhbGl6ZSBjbGFzc2VzIHZpYSBbZGF0YS1uYW1lc3BhY2VdIG9yIC5qcy1uYW1lc3BhY2UgY2xhc3NcbiAgICogaHRtbEluaXQoIFdpZGdldCwgJ3dpZGdldE5hbWUnIClcbiAgICogb3B0aW9ucyBhcmUgcGFyc2VkIGZyb20gZGF0YS1uYW1lc3BhY2Utb3B0aW9uc1xuICAgKi9cblxuICB1dGlscy5odG1sSW5pdCA9IGZ1bmN0aW9uIChXaWRnZXRDbGFzcywgbmFtZXNwYWNlKSB7XG4gICAgdXRpbHMuZG9jUmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRhc2hlZE5hbWVzcGFjZSA9IHV0aWxzLnRvRGFzaGVkKG5hbWVzcGFjZSk7XG4gICAgICB2YXIgZGF0YUF0dHIgPSAnZGF0YS0nICsgZGFzaGVkTmFtZXNwYWNlO1xuICAgICAgdmFyIGRhdGFBdHRyRWxlbXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIGRhdGFBdHRyICsgJ10nKTtcbiAgICAgIHZhciBqc0Rhc2hFbGVtcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy0nICsgZGFzaGVkTmFtZXNwYWNlKTtcbiAgICAgIHZhciBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheShkYXRhQXR0ckVsZW1zKS5jb25jYXQodXRpbHMubWFrZUFycmF5KGpzRGFzaEVsZW1zKSk7XG4gICAgICB2YXIgZGF0YU9wdGlvbnNBdHRyID0gZGF0YUF0dHIgKyAnLW9wdGlvbnMnO1xuICAgICAgdmFyIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XG4gICAgICBlbGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIHZhciBhdHRyID0gZWxlbS5nZXRBdHRyaWJ1dGUoZGF0YUF0dHIpIHx8IGVsZW0uZ2V0QXR0cmlidXRlKGRhdGFPcHRpb25zQXR0cik7XG4gICAgICAgIHZhciBvcHRpb25zO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3B0aW9ucyA9IGF0dHIgJiYgSlNPTi5wYXJzZShhdHRyKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAvLyBsb2cgZXJyb3IsIGRvIG5vdCBpbml0aWFsaXplXG4gICAgICAgICAgaWYgKGNvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgJyArIGRhdGFBdHRyICsgJyBvbiAnICsgZWxlbS5jbGFzc05hbWUgKyAnOiAnICsgZXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSAvLyBpbml0aWFsaXplXG5cblxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgV2lkZ2V0Q2xhc3MoZWxlbSwgb3B0aW9ucyk7IC8vIG1ha2UgYXZhaWxhYmxlIHZpYSAkKCkuZGF0YSgnbmFtZXNwYWNlJylcblxuICAgICAgICBpZiAoalF1ZXJ5KSB7XG4gICAgICAgICAgalF1ZXJ5LmRhdGEoZWxlbSwgbmFtZXNwYWNlLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9OyAvLyAtLS0tLSAgLS0tLS0gLy9cblxuXG4gIHJldHVybiB1dGlscztcbn0pO1xuLyoqXG4gKiBPdXRsYXllciBJdGVtXG4gKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EIC0gUmVxdWlyZUpTXG4gICAgZGVmaW5lKCdvdXRsYXllci9pdGVtJywgWydldi1lbWl0dGVyL2V2LWVtaXR0ZXInLCAnZ2V0LXNpemUvZ2V0LXNpemUnXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTIC0gQnJvd3NlcmlmeSwgV2VicGFja1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdldi1lbWl0dGVyJyksIHJlcXVpcmUoJ2dldC1zaXplJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lk91dGxheWVyID0ge307XG4gICAgd2luZG93Lk91dGxheWVyLkl0ZW0gPSBmYWN0b3J5KHdpbmRvdy5FdkVtaXR0ZXIsIHdpbmRvdy5nZXRTaXplKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KEV2RW1pdHRlciwgZ2V0U2l6ZSkge1xuICAndXNlIHN0cmljdCc7IC8vIC0tLS0tIGhlbHBlcnMgLS0tLS0gLy9cblxuICBmdW5jdGlvbiBpc0VtcHR5T2JqKG9iaikge1xuICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJvcCA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ1NTMyBzdXBwb3J0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICB2YXIgZG9jRWxlbVN0eWxlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuICB2YXIgdHJhbnNpdGlvblByb3BlcnR5ID0gdHlwZW9mIGRvY0VsZW1TdHlsZS50cmFuc2l0aW9uID09ICdzdHJpbmcnID8gJ3RyYW5zaXRpb24nIDogJ1dlYmtpdFRyYW5zaXRpb24nO1xuICB2YXIgdHJhbnNmb3JtUHJvcGVydHkgPSB0eXBlb2YgZG9jRWxlbVN0eWxlLnRyYW5zZm9ybSA9PSAnc3RyaW5nJyA/ICd0cmFuc2Zvcm0nIDogJ1dlYmtpdFRyYW5zZm9ybSc7XG4gIHZhciB0cmFuc2l0aW9uRW5kRXZlbnQgPSB7XG4gICAgV2Via2l0VHJhbnNpdGlvbjogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgIHRyYW5zaXRpb246ICd0cmFuc2l0aW9uZW5kJ1xuICB9W3RyYW5zaXRpb25Qcm9wZXJ0eV07IC8vIGNhY2hlIGFsbCB2ZW5kb3IgcHJvcGVydGllcyB0aGF0IGNvdWxkIGhhdmUgdmVuZG9yIHByZWZpeFxuXG4gIHZhciB2ZW5kb3JQcm9wZXJ0aWVzID0ge1xuICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtUHJvcGVydHksXG4gICAgdHJhbnNpdGlvbjogdHJhbnNpdGlvblByb3BlcnR5LFxuICAgIHRyYW5zaXRpb25EdXJhdGlvbjogdHJhbnNpdGlvblByb3BlcnR5ICsgJ0R1cmF0aW9uJyxcbiAgICB0cmFuc2l0aW9uUHJvcGVydHk6IHRyYW5zaXRpb25Qcm9wZXJ0eSArICdQcm9wZXJ0eScsXG4gICAgdHJhbnNpdGlvbkRlbGF5OiB0cmFuc2l0aW9uUHJvcGVydHkgKyAnRGVsYXknXG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEl0ZW0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBmdW5jdGlvbiBJdGVtKGVsZW1lbnQsIGxheW91dCkge1xuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7IC8vIHBhcmVudCBsYXlvdXQgY2xhc3MsIGkuZS4gTWFzb25yeSwgSXNvdG9wZSwgb3IgUGFja2VyeVxuXG4gICAgdGhpcy5sYXlvdXQgPSBsYXlvdXQ7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcblxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9IC8vIGluaGVyaXQgRXZFbWl0dGVyXG5cblxuICB2YXIgcHJvdG8gPSBJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZFbWl0dGVyLnByb3RvdHlwZSk7XG4gIHByb3RvLmNvbnN0cnVjdG9yID0gSXRlbTtcblxuICBwcm90by5fY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHRyYW5zaXRpb24gb2JqZWN0c1xuICAgIHRoaXMuX3RyYW5zbiA9IHtcbiAgICAgIGluZ1Byb3BlcnRpZXM6IHt9LFxuICAgICAgY2xlYW46IHt9LFxuICAgICAgb25FbmQ6IHt9XG4gICAgfTtcbiAgICB0aGlzLmNzcyh7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgIH0pO1xuICB9OyAvLyB0cmlnZ2VyIHNwZWNpZmllZCBoYW5kbGVyIGZvciBldmVudCB0eXBlXG5cblxuICBwcm90by5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcblxuICAgIGlmICh0aGlzW21ldGhvZF0pIHtcbiAgICAgIHRoaXNbbWV0aG9kXShldmVudCk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaXplID0gZ2V0U2l6ZSh0aGlzLmVsZW1lbnQpO1xuICB9O1xuICAvKipcbiAgICogYXBwbHkgQ1NTIHN0eWxlcyB0byBlbGVtZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuICAgKi9cblxuXG4gIHByb3RvLmNzcyA9IGZ1bmN0aW9uIChzdHlsZSkge1xuICAgIHZhciBlbGVtU3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHN0eWxlKSB7XG4gICAgICAvLyB1c2UgdmVuZG9yIHByb3BlcnR5IGlmIGF2YWlsYWJsZVxuICAgICAgdmFyIHN1cHBvcnRlZFByb3AgPSB2ZW5kb3JQcm9wZXJ0aWVzW3Byb3BdIHx8IHByb3A7XG4gICAgICBlbGVtU3R5bGVbc3VwcG9ydGVkUHJvcF0gPSBzdHlsZVtwcm9wXTtcbiAgICB9XG4gIH07IC8vIG1lYXN1cmUgcG9zaXRpb24sIGFuZCBzZXRzIGl0XG5cblxuICBwcm90by5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudCk7XG5cbiAgICB2YXIgaXNPcmlnaW5MZWZ0ID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luTGVmdCcpO1xuXG4gICAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG5cbiAgICB2YXIgeFZhbHVlID0gc3R5bGVbaXNPcmlnaW5MZWZ0ID8gJ2xlZnQnIDogJ3JpZ2h0J107XG4gICAgdmFyIHlWYWx1ZSA9IHN0eWxlW2lzT3JpZ2luVG9wID8gJ3RvcCcgOiAnYm90dG9tJ107XG4gICAgdmFyIHggPSBwYXJzZUZsb2F0KHhWYWx1ZSk7XG4gICAgdmFyIHkgPSBwYXJzZUZsb2F0KHlWYWx1ZSk7IC8vIGNvbnZlcnQgcGVyY2VudCB0byBwaXhlbHNcblxuICAgIHZhciBsYXlvdXRTaXplID0gdGhpcy5sYXlvdXQuc2l6ZTtcblxuICAgIGlmICh4VmFsdWUuaW5kZXhPZignJScpICE9IC0xKSB7XG4gICAgICB4ID0geCAvIDEwMCAqIGxheW91dFNpemUud2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHlWYWx1ZS5pbmRleE9mKCclJykgIT0gLTEpIHtcbiAgICAgIHkgPSB5IC8gMTAwICogbGF5b3V0U2l6ZS5oZWlnaHQ7XG4gICAgfSAvLyBjbGVhbiB1cCAnYXV0bycgb3Igb3RoZXIgbm9uLWludGVnZXIgdmFsdWVzXG5cblxuICAgIHggPSBpc05hTih4KSA/IDAgOiB4O1xuICAgIHkgPSBpc05hTih5KSA/IDAgOiB5OyAvLyByZW1vdmUgcGFkZGluZyBmcm9tIG1lYXN1cmVtZW50XG5cbiAgICB4IC09IGlzT3JpZ2luTGVmdCA/IGxheW91dFNpemUucGFkZGluZ0xlZnQgOiBsYXlvdXRTaXplLnBhZGRpbmdSaWdodDtcbiAgICB5IC09IGlzT3JpZ2luVG9wID8gbGF5b3V0U2l6ZS5wYWRkaW5nVG9wIDogbGF5b3V0U2l6ZS5wYWRkaW5nQm90dG9tO1xuICAgIHRoaXMucG9zaXRpb24ueCA9IHg7XG4gICAgdGhpcy5wb3NpdGlvbi55ID0geTtcbiAgfTsgLy8gc2V0IHNldHRsZWQgcG9zaXRpb24sIGFwcGx5IHBhZGRpbmdcblxuXG4gIHByb3RvLmxheW91dFBvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXRTaXplID0gdGhpcy5sYXlvdXQuc2l6ZTtcbiAgICB2YXIgc3R5bGUgPSB7fTtcblxuICAgIHZhciBpc09yaWdpbkxlZnQgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdvcmlnaW5MZWZ0Jyk7XG5cbiAgICB2YXIgaXNPcmlnaW5Ub3AgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdvcmlnaW5Ub3AnKTsgLy8geFxuXG5cbiAgICB2YXIgeFBhZGRpbmcgPSBpc09yaWdpbkxlZnQgPyAncGFkZGluZ0xlZnQnIDogJ3BhZGRpbmdSaWdodCc7XG4gICAgdmFyIHhQcm9wZXJ0eSA9IGlzT3JpZ2luTGVmdCA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgdmFyIHhSZXNldFByb3BlcnR5ID0gaXNPcmlnaW5MZWZ0ID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICB2YXIgeCA9IHRoaXMucG9zaXRpb24ueCArIGxheW91dFNpemVbeFBhZGRpbmddOyAvLyBzZXQgaW4gcGVyY2VudGFnZSBvciBwaXhlbHNcblxuICAgIHN0eWxlW3hQcm9wZXJ0eV0gPSB0aGlzLmdldFhWYWx1ZSh4KTsgLy8gcmVzZXQgb3RoZXIgcHJvcGVydHlcblxuICAgIHN0eWxlW3hSZXNldFByb3BlcnR5XSA9ICcnOyAvLyB5XG5cbiAgICB2YXIgeVBhZGRpbmcgPSBpc09yaWdpblRvcCA/ICdwYWRkaW5nVG9wJyA6ICdwYWRkaW5nQm90dG9tJztcbiAgICB2YXIgeVByb3BlcnR5ID0gaXNPcmlnaW5Ub3AgPyAndG9wJyA6ICdib3R0b20nO1xuICAgIHZhciB5UmVzZXRQcm9wZXJ0eSA9IGlzT3JpZ2luVG9wID8gJ2JvdHRvbScgOiAndG9wJztcbiAgICB2YXIgeSA9IHRoaXMucG9zaXRpb24ueSArIGxheW91dFNpemVbeVBhZGRpbmddOyAvLyBzZXQgaW4gcGVyY2VudGFnZSBvciBwaXhlbHNcblxuICAgIHN0eWxlW3lQcm9wZXJ0eV0gPSB0aGlzLmdldFlWYWx1ZSh5KTsgLy8gcmVzZXQgb3RoZXIgcHJvcGVydHlcblxuICAgIHN0eWxlW3lSZXNldFByb3BlcnR5XSA9ICcnO1xuICAgIHRoaXMuY3NzKHN0eWxlKTtcbiAgICB0aGlzLmVtaXRFdmVudCgnbGF5b3V0JywgW3RoaXNdKTtcbiAgfTtcblxuICBwcm90by5nZXRYVmFsdWUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBpc0hvcml6b250YWwgPSB0aGlzLmxheW91dC5fZ2V0T3B0aW9uKCdob3Jpem9udGFsJyk7XG5cbiAgICByZXR1cm4gdGhpcy5sYXlvdXQub3B0aW9ucy5wZXJjZW50UG9zaXRpb24gJiYgIWlzSG9yaXpvbnRhbCA/IHggLyB0aGlzLmxheW91dC5zaXplLndpZHRoICogMTAwICsgJyUnIDogeCArICdweCc7XG4gIH07XG5cbiAgcHJvdG8uZ2V0WVZhbHVlID0gZnVuY3Rpb24gKHkpIHtcbiAgICB2YXIgaXNIb3Jpem9udGFsID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignaG9yaXpvbnRhbCcpO1xuXG4gICAgcmV0dXJuIHRoaXMubGF5b3V0Lm9wdGlvbnMucGVyY2VudFBvc2l0aW9uICYmIGlzSG9yaXpvbnRhbCA/IHkgLyB0aGlzLmxheW91dC5zaXplLmhlaWdodCAqIDEwMCArICclJyA6IHkgKyAncHgnO1xuICB9O1xuXG4gIHByb3RvLl90cmFuc2l0aW9uVG8gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHRoaXMuZ2V0UG9zaXRpb24oKTsgLy8gZ2V0IGN1cnJlbnQgeCAmIHkgZnJvbSB0b3AvbGVmdFxuXG4gICAgdmFyIGN1clggPSB0aGlzLnBvc2l0aW9uLng7XG4gICAgdmFyIGN1clkgPSB0aGlzLnBvc2l0aW9uLnk7XG4gICAgdmFyIGRpZE5vdE1vdmUgPSB4ID09IHRoaXMucG9zaXRpb24ueCAmJiB5ID09IHRoaXMucG9zaXRpb24ueTsgLy8gc2F2ZSBlbmQgcG9zaXRpb25cblxuICAgIHRoaXMuc2V0UG9zaXRpb24oeCwgeSk7IC8vIGlmIGRpZCBub3QgbW92ZSBhbmQgbm90IHRyYW5zaXRpb25pbmcsIGp1c3QgZ28gdG8gbGF5b3V0XG5cbiAgICBpZiAoZGlkTm90TW92ZSAmJiAhdGhpcy5pc1RyYW5zaXRpb25pbmcpIHtcbiAgICAgIHRoaXMubGF5b3V0UG9zaXRpb24oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNYID0geCAtIGN1clg7XG4gICAgdmFyIHRyYW5zWSA9IHkgLSBjdXJZO1xuICAgIHZhciB0cmFuc2l0aW9uU3R5bGUgPSB7fTtcbiAgICB0cmFuc2l0aW9uU3R5bGUudHJhbnNmb3JtID0gdGhpcy5nZXRUcmFuc2xhdGUodHJhbnNYLCB0cmFuc1kpO1xuICAgIHRoaXMudHJhbnNpdGlvbih7XG4gICAgICB0bzogdHJhbnNpdGlvblN0eWxlLFxuICAgICAgb25UcmFuc2l0aW9uRW5kOiB7XG4gICAgICAgIHRyYW5zZm9ybTogdGhpcy5sYXlvdXRQb3NpdGlvblxuICAgICAgfSxcbiAgICAgIGlzQ2xlYW5pbmc6IHRydWVcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5nZXRUcmFuc2xhdGUgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIC8vIGZsaXAgY29vcmlkaW5hdGVzIGlmIG9yaWdpbiBvbiByaWdodCBvciBib3R0b21cbiAgICB2YXIgaXNPcmlnaW5MZWZ0ID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luTGVmdCcpO1xuXG4gICAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5sYXlvdXQuX2dldE9wdGlvbignb3JpZ2luVG9wJyk7XG5cbiAgICB4ID0gaXNPcmlnaW5MZWZ0ID8geCA6IC14O1xuICAgIHkgPSBpc09yaWdpblRvcCA/IHkgOiAteTtcbiAgICByZXR1cm4gJ3RyYW5zbGF0ZTNkKCcgKyB4ICsgJ3B4LCAnICsgeSArICdweCwgMCknO1xuICB9OyAvLyBub24gdHJhbnNpdGlvbiArIHRyYW5zZm9ybSBzdXBwb3J0XG5cblxuICBwcm90by5nb1RvID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB0aGlzLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgIHRoaXMubGF5b3V0UG9zaXRpb24oKTtcbiAgfTtcblxuICBwcm90by5tb3ZlVG8gPSBwcm90by5fdHJhbnNpdGlvblRvO1xuXG4gIHByb3RvLnNldFBvc2l0aW9uID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB0aGlzLnBvc2l0aW9uLnggPSBwYXJzZUZsb2F0KHgpO1xuICAgIHRoaXMucG9zaXRpb24ueSA9IHBhcnNlRmxvYXQoeSk7XG4gIH07IC8vIC0tLS0tIHRyYW5zaXRpb24gLS0tLS0gLy9cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0eWxlIC0gQ1NTXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uVHJhbnNpdGlvbkVuZFxuICAgKi9cbiAgLy8gbm9uIHRyYW5zaXRpb24sIGp1c3QgdHJpZ2dlciBjYWxsYmFja1xuXG5cbiAgcHJvdG8uX25vblRyYW5zaXRpb24gPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHRoaXMuY3NzKGFyZ3MudG8pO1xuXG4gICAgaWYgKGFyZ3MuaXNDbGVhbmluZykge1xuICAgICAgdGhpcy5fcmVtb3ZlU3R5bGVzKGFyZ3MudG8pO1xuICAgIH1cblxuICAgIGZvciAodmFyIHByb3AgaW4gYXJncy5vblRyYW5zaXRpb25FbmQpIHtcbiAgICAgIGFyZ3Mub25UcmFuc2l0aW9uRW5kW3Byb3BdLmNhbGwodGhpcyk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogcHJvcGVyIHRyYW5zaXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGFyZ3MgLSBhcmd1bWVudHNcbiAgICogICBAcGFyYW0ge09iamVjdH0gdG8gLSBzdHlsZSB0byB0cmFuc2l0aW9uIHRvXG4gICAqICAgQHBhcmFtIHtPYmplY3R9IGZyb20gLSBzdHlsZSB0byBzdGFydCB0cmFuc2l0aW9uIGZyb21cbiAgICogICBAcGFyYW0ge0Jvb2xlYW59IGlzQ2xlYW5pbmcgLSByZW1vdmVzIHRyYW5zaXRpb24gc3R5bGVzIGFmdGVyIHRyYW5zaXRpb25cbiAgICogICBAcGFyYW0ge0Z1bmN0aW9ufSBvblRyYW5zaXRpb25FbmQgLSBjYWxsYmFja1xuICAgKi9cblxuXG4gIHByb3RvLnRyYW5zaXRpb24gPSBmdW5jdGlvbiAoYXJncykge1xuICAgIC8vIHJlZGlyZWN0IHRvIG5vblRyYW5zaXRpb24gaWYgbm8gdHJhbnNpdGlvbiBkdXJhdGlvblxuICAgIGlmICghcGFyc2VGbG9hdCh0aGlzLmxheW91dC5vcHRpb25zLnRyYW5zaXRpb25EdXJhdGlvbikpIHtcbiAgICAgIHRoaXMuX25vblRyYW5zaXRpb24oYXJncyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgX3RyYW5zaXRpb24gPSB0aGlzLl90cmFuc247IC8vIGtlZXAgdHJhY2sgb2Ygb25UcmFuc2l0aW9uRW5kIGNhbGxiYWNrIGJ5IGNzcyBwcm9wZXJ0eVxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBhcmdzLm9uVHJhbnNpdGlvbkVuZCkge1xuICAgICAgX3RyYW5zaXRpb24ub25FbmRbcHJvcF0gPSBhcmdzLm9uVHJhbnNpdGlvbkVuZFtwcm9wXTtcbiAgICB9IC8vIGtlZXAgdHJhY2sgb2YgcHJvcGVydGllcyB0aGF0IGFyZSB0cmFuc2l0aW9uaW5nXG5cblxuICAgIGZvciAocHJvcCBpbiBhcmdzLnRvKSB7XG4gICAgICBfdHJhbnNpdGlvbi5pbmdQcm9wZXJ0aWVzW3Byb3BdID0gdHJ1ZTsgLy8ga2VlcCB0cmFjayBvZiBwcm9wZXJ0aWVzIHRvIGNsZWFuIHVwIHdoZW4gdHJhbnNpdGlvbiBpcyBkb25lXG5cbiAgICAgIGlmIChhcmdzLmlzQ2xlYW5pbmcpIHtcbiAgICAgICAgX3RyYW5zaXRpb24uY2xlYW5bcHJvcF0gPSB0cnVlO1xuICAgICAgfVxuICAgIH0gLy8gc2V0IGZyb20gc3R5bGVzXG5cblxuICAgIGlmIChhcmdzLmZyb20pIHtcbiAgICAgIHRoaXMuY3NzKGFyZ3MuZnJvbSk7IC8vIGZvcmNlIHJlZHJhdy4gaHR0cDovL2Jsb2cuYWxleG1hY2Nhdy5jb20vY3NzLXRyYW5zaXRpb25zXG5cbiAgICAgIHZhciBoID0gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDsgLy8gaGFjayBmb3IgSlNIaW50IHRvIGh1c2ggYWJvdXQgdW51c2VkIHZhclxuXG4gICAgICBoID0gbnVsbDtcbiAgICB9IC8vIGVuYWJsZSB0cmFuc2l0aW9uXG5cblxuICAgIHRoaXMuZW5hYmxlVHJhbnNpdGlvbihhcmdzLnRvKTsgLy8gc2V0IHN0eWxlcyB0aGF0IGFyZSB0cmFuc2l0aW9uaW5nXG5cbiAgICB0aGlzLmNzcyhhcmdzLnRvKTtcbiAgICB0aGlzLmlzVHJhbnNpdGlvbmluZyA9IHRydWU7XG4gIH07IC8vIGRhc2ggYmVmb3JlIGFsbCBjYXAgbGV0dGVycywgaW5jbHVkaW5nIGZpcnN0IGZvclxuICAvLyBXZWJraXRUcmFuc2Zvcm0gPT4gLXdlYmtpdC10cmFuc2Zvcm1cblxuXG4gIGZ1bmN0aW9uIHRvRGFzaGVkQWxsKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFtBLVpdKS9nLCBmdW5jdGlvbiAoJDEpIHtcbiAgICAgIHJldHVybiAnLScgKyAkMS50b0xvd2VyQ2FzZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgdmFyIHRyYW5zaXRpb25Qcm9wcyA9ICdvcGFjaXR5LCcgKyB0b0Rhc2hlZEFsbCh0cmFuc2Zvcm1Qcm9wZXJ0eSk7XG5cbiAgcHJvdG8uZW5hYmxlVHJhbnNpdGlvbiA9IGZ1bmN0aW9uICgpXG4gIC8qIHN0eWxlICovXG4gIHtcbiAgICAvLyBIQUNLIGNoYW5naW5nIHRyYW5zaXRpb25Qcm9wZXJ0eSBkdXJpbmcgYSB0cmFuc2l0aW9uXG4gICAgLy8gd2lsbCBjYXVzZSB0cmFuc2l0aW9uIHRvIGp1bXBcbiAgICBpZiAodGhpcy5pc1RyYW5zaXRpb25pbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIG1ha2UgYHRyYW5zaXRpb246IGZvbywgYmFyLCBiYXpgIGZyb20gc3R5bGUgb2JqZWN0XG4gICAgLy8gSEFDSyB1bi1jb21tZW50IHRoaXMgd2hlbiBlbmFibGVUcmFuc2l0aW9uIGNhbiB3b3JrXG4gICAgLy8gd2hpbGUgYSB0cmFuc2l0aW9uIGlzIGhhcHBlbmluZ1xuICAgIC8vIHZhciB0cmFuc2l0aW9uVmFsdWVzID0gW107XG4gICAgLy8gZm9yICggdmFyIHByb3AgaW4gc3R5bGUgKSB7XG4gICAgLy8gICAvLyBkYXNoLWlmeSBjYW1lbENhc2VkIHByb3BlcnRpZXMgbGlrZSBXZWJraXRUcmFuc2l0aW9uXG4gICAgLy8gICBwcm9wID0gdmVuZG9yUHJvcGVydGllc1sgcHJvcCBdIHx8IHByb3A7XG4gICAgLy8gICB0cmFuc2l0aW9uVmFsdWVzLnB1c2goIHRvRGFzaGVkQWxsKCBwcm9wICkgKTtcbiAgICAvLyB9XG4gICAgLy8gbXVuZ2UgbnVtYmVyIHRvIG1pbGxpc2Vjb25kLCB0byBtYXRjaCBzdGFnZ2VyXG5cblxuICAgIHZhciBkdXJhdGlvbiA9IHRoaXMubGF5b3V0Lm9wdGlvbnMudHJhbnNpdGlvbkR1cmF0aW9uO1xuICAgIGR1cmF0aW9uID0gdHlwZW9mIGR1cmF0aW9uID09ICdudW1iZXInID8gZHVyYXRpb24gKyAnbXMnIDogZHVyYXRpb247IC8vIGVuYWJsZSB0cmFuc2l0aW9uIHN0eWxlc1xuXG4gICAgdGhpcy5jc3Moe1xuICAgICAgdHJhbnNpdGlvblByb3BlcnR5OiB0cmFuc2l0aW9uUHJvcHMsXG4gICAgICB0cmFuc2l0aW9uRHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgdHJhbnNpdGlvbkRlbGF5OiB0aGlzLnN0YWdnZXJEZWxheSB8fCAwXG4gICAgfSk7IC8vIGxpc3RlbiBmb3IgdHJhbnNpdGlvbiBlbmQgZXZlbnRcblxuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRyYW5zaXRpb25FbmRFdmVudCwgdGhpcywgZmFsc2UpO1xuICB9OyAvLyAtLS0tLSBldmVudHMgLS0tLS0gLy9cblxuXG4gIHByb3RvLm9ud2Via2l0VHJhbnNpdGlvbkVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHRoaXMub250cmFuc2l0aW9uZW5kKGV2ZW50KTtcbiAgfTtcblxuICBwcm90by5vbm90cmFuc2l0aW9uZW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdGhpcy5vbnRyYW5zaXRpb25lbmQoZXZlbnQpO1xuICB9OyAvLyBwcm9wZXJ0aWVzIHRoYXQgSSBtdW5nZSB0byBtYWtlIG15IGxpZmUgZWFzaWVyXG5cblxuICB2YXIgZGFzaGVkVmVuZG9yUHJvcGVydGllcyA9IHtcbiAgICAnLXdlYmtpdC10cmFuc2Zvcm0nOiAndHJhbnNmb3JtJ1xuICB9O1xuXG4gIHByb3RvLm9udHJhbnNpdGlvbmVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIC8vIGRpc3JlZ2FyZCBidWJibGVkIGV2ZW50cyBmcm9tIGNoaWxkcmVuXG4gICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gdGhpcy5lbGVtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIF90cmFuc2l0aW9uID0gdGhpcy5fdHJhbnNuOyAvLyBnZXQgcHJvcGVydHkgbmFtZSBvZiB0cmFuc2l0aW9uZWQgcHJvcGVydHksIGNvbnZlcnQgdG8gcHJlZml4LWZyZWVcblxuICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBkYXNoZWRWZW5kb3JQcm9wZXJ0aWVzW2V2ZW50LnByb3BlcnR5TmFtZV0gfHwgZXZlbnQucHJvcGVydHlOYW1lOyAvLyByZW1vdmUgcHJvcGVydHkgdGhhdCBoYXMgY29tcGxldGVkIHRyYW5zaXRpb25pbmdcblxuICAgIGRlbGV0ZSBfdHJhbnNpdGlvbi5pbmdQcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV07IC8vIGNoZWNrIGlmIGFueSBwcm9wZXJ0aWVzIGFyZSBzdGlsbCB0cmFuc2l0aW9uaW5nXG5cbiAgICBpZiAoaXNFbXB0eU9iaihfdHJhbnNpdGlvbi5pbmdQcm9wZXJ0aWVzKSkge1xuICAgICAgLy8gYWxsIHByb3BlcnRpZXMgaGF2ZSBjb21wbGV0ZWQgdHJhbnNpdGlvbmluZ1xuICAgICAgdGhpcy5kaXNhYmxlVHJhbnNpdGlvbigpO1xuICAgIH0gLy8gY2xlYW4gc3R5bGVcblxuXG4gICAgaWYgKHByb3BlcnR5TmFtZSBpbiBfdHJhbnNpdGlvbi5jbGVhbikge1xuICAgICAgLy8gY2xlYW4gdXAgc3R5bGVcbiAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtldmVudC5wcm9wZXJ0eU5hbWVdID0gJyc7XG4gICAgICBkZWxldGUgX3RyYW5zaXRpb24uY2xlYW5bcHJvcGVydHlOYW1lXTtcbiAgICB9IC8vIHRyaWdnZXIgb25UcmFuc2l0aW9uRW5kIGNhbGxiYWNrXG5cblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgaW4gX3RyYW5zaXRpb24ub25FbmQpIHtcbiAgICAgIHZhciBvblRyYW5zaXRpb25FbmQgPSBfdHJhbnNpdGlvbi5vbkVuZFtwcm9wZXJ0eU5hbWVdO1xuICAgICAgb25UcmFuc2l0aW9uRW5kLmNhbGwodGhpcyk7XG4gICAgICBkZWxldGUgX3RyYW5zaXRpb24ub25FbmRbcHJvcGVydHlOYW1lXTtcbiAgICB9XG5cbiAgICB0aGlzLmVtaXRFdmVudCgndHJhbnNpdGlvbkVuZCcsIFt0aGlzXSk7XG4gIH07XG5cbiAgcHJvdG8uZGlzYWJsZVRyYW5zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZW1vdmVUcmFuc2l0aW9uU3R5bGVzKCk7XG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHJhbnNpdGlvbkVuZEV2ZW50LCB0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5pc1RyYW5zaXRpb25pbmcgPSBmYWxzZTtcbiAgfTtcbiAgLyoqXG4gICAqIHJlbW92ZXMgc3R5bGUgcHJvcGVydHkgZnJvbSBlbGVtZW50XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdHlsZVxuICAqKi9cblxuXG4gIHByb3RvLl9yZW1vdmVTdHlsZXMgPSBmdW5jdGlvbiAoc3R5bGUpIHtcbiAgICAvLyBjbGVhbiB1cCB0cmFuc2l0aW9uIHN0eWxlc1xuICAgIHZhciBjbGVhblN0eWxlID0ge307XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHN0eWxlKSB7XG4gICAgICBjbGVhblN0eWxlW3Byb3BdID0gJyc7XG4gICAgfVxuXG4gICAgdGhpcy5jc3MoY2xlYW5TdHlsZSk7XG4gIH07XG5cbiAgdmFyIGNsZWFuVHJhbnNpdGlvblN0eWxlID0ge1xuICAgIHRyYW5zaXRpb25Qcm9wZXJ0eTogJycsXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnJyxcbiAgICB0cmFuc2l0aW9uRGVsYXk6ICcnXG4gIH07XG5cbiAgcHJvdG8ucmVtb3ZlVHJhbnNpdGlvblN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyByZW1vdmUgdHJhbnNpdGlvblxuICAgIHRoaXMuY3NzKGNsZWFuVHJhbnNpdGlvblN0eWxlKTtcbiAgfTsgLy8gLS0tLS0gc3RhZ2dlciAtLS0tLSAvL1xuXG5cbiAgcHJvdG8uc3RhZ2dlciA9IGZ1bmN0aW9uIChkZWxheSkge1xuICAgIGRlbGF5ID0gaXNOYU4oZGVsYXkpID8gMCA6IGRlbGF5O1xuICAgIHRoaXMuc3RhZ2dlckRlbGF5ID0gZGVsYXkgKyAnbXMnO1xuICB9OyAvLyAtLS0tLSBzaG93L2hpZGUvcmVtb3ZlIC0tLS0tIC8vXG4gIC8vIHJlbW92ZSBlbGVtZW50IGZyb20gRE9NXG5cblxuICBwcm90by5yZW1vdmVFbGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7IC8vIHJlbW92ZSBkaXNwbGF5OiBub25lXG5cbiAgICB0aGlzLmNzcyh7XG4gICAgICBkaXNwbGF5OiAnJ1xuICAgIH0pO1xuICAgIHRoaXMuZW1pdEV2ZW50KCdyZW1vdmUnLCBbdGhpc10pO1xuICB9O1xuXG4gIHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBqdXN0IHJlbW92ZSBlbGVtZW50IGlmIG5vIHRyYW5zaXRpb24gc3VwcG9ydCBvciBubyB0cmFuc2l0aW9uXG4gICAgaWYgKCF0cmFuc2l0aW9uUHJvcGVydHkgfHwgIXBhcnNlRmxvYXQodGhpcy5sYXlvdXQub3B0aW9ucy50cmFuc2l0aW9uRHVyYXRpb24pKSB7XG4gICAgICB0aGlzLnJlbW92ZUVsZW0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIHN0YXJ0IHRyYW5zaXRpb25cblxuXG4gICAgdGhpcy5vbmNlKCd0cmFuc2l0aW9uRW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5yZW1vdmVFbGVtKCk7XG4gICAgfSk7XG4gICAgdGhpcy5oaWRlKCk7XG4gIH07XG5cbiAgcHJvdG8ucmV2ZWFsID0gZnVuY3Rpb24gKCkge1xuICAgIGRlbGV0ZSB0aGlzLmlzSGlkZGVuOyAvLyByZW1vdmUgZGlzcGxheTogbm9uZVxuXG4gICAgdGhpcy5jc3Moe1xuICAgICAgZGlzcGxheTogJydcbiAgICB9KTtcbiAgICB2YXIgb3B0aW9ucyA9IHRoaXMubGF5b3V0Lm9wdGlvbnM7XG4gICAgdmFyIG9uVHJhbnNpdGlvbkVuZCA9IHt9O1xuICAgIHZhciB0cmFuc2l0aW9uRW5kUHJvcGVydHkgPSB0aGlzLmdldEhpZGVSZXZlYWxUcmFuc2l0aW9uRW5kUHJvcGVydHkoJ3Zpc2libGVTdHlsZScpO1xuICAgIG9uVHJhbnNpdGlvbkVuZFt0cmFuc2l0aW9uRW5kUHJvcGVydHldID0gdGhpcy5vblJldmVhbFRyYW5zaXRpb25FbmQ7XG4gICAgdGhpcy50cmFuc2l0aW9uKHtcbiAgICAgIGZyb206IG9wdGlvbnMuaGlkZGVuU3R5bGUsXG4gICAgICB0bzogb3B0aW9ucy52aXNpYmxlU3R5bGUsXG4gICAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgICAgb25UcmFuc2l0aW9uRW5kOiBvblRyYW5zaXRpb25FbmRcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5vblJldmVhbFRyYW5zaXRpb25FbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gY2hlY2sgaWYgc3RpbGwgdmlzaWJsZVxuICAgIC8vIGR1cmluZyB0cmFuc2l0aW9uLCBpdGVtIG1heSBoYXZlIGJlZW4gaGlkZGVuXG4gICAgaWYgKCF0aGlzLmlzSGlkZGVuKSB7XG4gICAgICB0aGlzLmVtaXRFdmVudCgncmV2ZWFsJyk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogZ2V0IHN0eWxlIHByb3BlcnR5IHVzZSBmb3IgaGlkZS9yZXZlYWwgdHJhbnNpdGlvbiBlbmRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0eWxlUHJvcGVydHkgLSBoaWRkZW5TdHlsZS92aXNpYmxlU3R5bGVcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG5cblxuICBwcm90by5nZXRIaWRlUmV2ZWFsVHJhbnNpdGlvbkVuZFByb3BlcnR5ID0gZnVuY3Rpb24gKHN0eWxlUHJvcGVydHkpIHtcbiAgICB2YXIgb3B0aW9uU3R5bGUgPSB0aGlzLmxheW91dC5vcHRpb25zW3N0eWxlUHJvcGVydHldOyAvLyB1c2Ugb3BhY2l0eVxuXG4gICAgaWYgKG9wdGlvblN0eWxlLm9wYWNpdHkpIHtcbiAgICAgIHJldHVybiAnb3BhY2l0eSc7XG4gICAgfSAvLyBnZXQgZmlyc3QgcHJvcGVydHlcblxuXG4gICAgZm9yICh2YXIgcHJvcCBpbiBvcHRpb25TdHlsZSkge1xuICAgICAgcmV0dXJuIHByb3A7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gc2V0IGZsYWdcbiAgICB0aGlzLmlzSGlkZGVuID0gdHJ1ZTsgLy8gcmVtb3ZlIGRpc3BsYXk6IG5vbmVcblxuICAgIHRoaXMuY3NzKHtcbiAgICAgIGRpc3BsYXk6ICcnXG4gICAgfSk7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLmxheW91dC5vcHRpb25zO1xuICAgIHZhciBvblRyYW5zaXRpb25FbmQgPSB7fTtcbiAgICB2YXIgdHJhbnNpdGlvbkVuZFByb3BlcnR5ID0gdGhpcy5nZXRIaWRlUmV2ZWFsVHJhbnNpdGlvbkVuZFByb3BlcnR5KCdoaWRkZW5TdHlsZScpO1xuICAgIG9uVHJhbnNpdGlvbkVuZFt0cmFuc2l0aW9uRW5kUHJvcGVydHldID0gdGhpcy5vbkhpZGVUcmFuc2l0aW9uRW5kO1xuICAgIHRoaXMudHJhbnNpdGlvbih7XG4gICAgICBmcm9tOiBvcHRpb25zLnZpc2libGVTdHlsZSxcbiAgICAgIHRvOiBvcHRpb25zLmhpZGRlblN0eWxlLFxuICAgICAgLy8ga2VlcCBoaWRkZW4gc3R1ZmYgaGlkZGVuXG4gICAgICBpc0NsZWFuaW5nOiB0cnVlLFxuICAgICAgb25UcmFuc2l0aW9uRW5kOiBvblRyYW5zaXRpb25FbmRcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5vbkhpZGVUcmFuc2l0aW9uRW5kID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGNoZWNrIGlmIHN0aWxsIGhpZGRlblxuICAgIC8vIGR1cmluZyB0cmFuc2l0aW9uLCBpdGVtIG1heSBoYXZlIGJlZW4gdW4taGlkZGVuXG4gICAgaWYgKHRoaXMuaXNIaWRkZW4pIHtcbiAgICAgIHRoaXMuY3NzKHtcbiAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICB9KTtcbiAgICAgIHRoaXMuZW1pdEV2ZW50KCdoaWRlJyk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jc3Moe1xuICAgICAgcG9zaXRpb246ICcnLFxuICAgICAgbGVmdDogJycsXG4gICAgICByaWdodDogJycsXG4gICAgICB0b3A6ICcnLFxuICAgICAgYm90dG9tOiAnJyxcbiAgICAgIHRyYW5zaXRpb246ICcnLFxuICAgICAgdHJhbnNmb3JtOiAnJ1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBJdGVtO1xufSk7XG4vKiFcbiAqIE91dGxheWVyIHYyLjEuMVxuICogdGhlIGJyYWlucyBhbmQgZ3V0cyBvZiBhIGxheW91dCBsaWJyYXJ5XG4gKiBNSVQgbGljZW5zZVxuICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgJ3VzZSBzdHJpY3QnOyAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qIGdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cblxuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQgLSBSZXF1aXJlSlNcbiAgICBkZWZpbmUoJ291dGxheWVyL291dGxheWVyJywgWydldi1lbWl0dGVyL2V2LWVtaXR0ZXInLCAnZ2V0LXNpemUvZ2V0LXNpemUnLCAnZml6enktdWktdXRpbHMvdXRpbHMnLCAnLi9pdGVtJ10sIGZ1bmN0aW9uIChFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSh3aW5kb3csIEV2RW1pdHRlciwgZ2V0U2l6ZSwgdXRpbHMsIEl0ZW0pO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KUyAtIEJyb3dzZXJpZnksIFdlYnBhY2tcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkod2luZG93LCByZXF1aXJlKCdldi1lbWl0dGVyJyksIHJlcXVpcmUoJ2dldC1zaXplJyksIHJlcXVpcmUoJ2Zpenp5LXVpLXV0aWxzJyksIHJlcXVpcmUoJy4vaXRlbScpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5PdXRsYXllciA9IGZhY3Rvcnkod2luZG93LCB3aW5kb3cuRXZFbWl0dGVyLCB3aW5kb3cuZ2V0U2l6ZSwgd2luZG93LmZpenp5VUlVdGlscywgd2luZG93Lk91dGxheWVyLkl0ZW0pO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3Rvcnkod2luZG93LCBFdkVtaXR0ZXIsIGdldFNpemUsIHV0aWxzLCBJdGVtKSB7XG4gICd1c2Ugc3RyaWN0JzsgLy8gLS0tLS0gdmFycyAtLS0tLSAvL1xuXG4gIHZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG4gIHZhciBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xuXG4gIHZhciBub29wID0gZnVuY3Rpb24gbm9vcCgpIHt9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBPdXRsYXllciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBnbG9iYWxseSB1bmlxdWUgaWRlbnRpZmllcnNcblxuXG4gIHZhciBHVUlEID0gMDsgLy8gaW50ZXJuYWwgc3RvcmUgb2YgYWxsIE91dGxheWVyIGludGFuY2VzXG5cbiAgdmFyIGluc3RhbmNlcyA9IHt9O1xuICAvKipcbiAgICogQHBhcmFtIHtFbGVtZW50LCBTdHJpbmd9IGVsZW1lbnRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuXG4gIGZ1bmN0aW9uIE91dGxheWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcXVlcnlFbGVtZW50ID0gdXRpbHMuZ2V0UXVlcnlFbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgaWYgKCFxdWVyeUVsZW1lbnQpIHtcbiAgICAgIGlmIChjb25zb2xlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JhZCBlbGVtZW50IGZvciAnICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lc3BhY2UgKyAnOiAnICsgKHF1ZXJ5RWxlbWVudCB8fCBlbGVtZW50KSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBxdWVyeUVsZW1lbnQ7IC8vIGFkZCBqUXVlcnlcblxuICAgIGlmIChqUXVlcnkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSBqUXVlcnkodGhpcy5lbGVtZW50KTtcbiAgICB9IC8vIG9wdGlvbnNcblxuXG4gICAgdGhpcy5vcHRpb25zID0gdXRpbHMuZXh0ZW5kKHt9LCB0aGlzLmNvbnN0cnVjdG9yLmRlZmF1bHRzKTtcbiAgICB0aGlzLm9wdGlvbihvcHRpb25zKTsgLy8gYWRkIGlkIGZvciBPdXRsYXllci5nZXRGcm9tRWxlbWVudFxuXG4gICAgdmFyIGlkID0gKytHVUlEO1xuICAgIHRoaXMuZWxlbWVudC5vdXRsYXllckdVSUQgPSBpZDsgLy8gZXhwYW5kb1xuXG4gICAgaW5zdGFuY2VzW2lkXSA9IHRoaXM7IC8vIGFzc29jaWF0ZSB2aWEgaWRcbiAgICAvLyBraWNrIGl0IG9mZlxuXG4gICAgdGhpcy5fY3JlYXRlKCk7XG5cbiAgICB2YXIgaXNJbml0TGF5b3V0ID0gdGhpcy5fZ2V0T3B0aW9uKCdpbml0TGF5b3V0Jyk7XG5cbiAgICBpZiAoaXNJbml0TGF5b3V0KSB7XG4gICAgICB0aGlzLmxheW91dCgpO1xuICAgIH1cbiAgfSAvLyBzZXR0aW5ncyBhcmUgZm9yIGludGVybmFsIHVzZSBvbmx5XG5cblxuICBPdXRsYXllci5uYW1lc3BhY2UgPSAnb3V0bGF5ZXInO1xuICBPdXRsYXllci5JdGVtID0gSXRlbTsgLy8gZGVmYXVsdCBvcHRpb25zXG5cbiAgT3V0bGF5ZXIuZGVmYXVsdHMgPSB7XG4gICAgY29udGFpbmVyU3R5bGU6IHtcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnXG4gICAgfSxcbiAgICBpbml0TGF5b3V0OiB0cnVlLFxuICAgIG9yaWdpbkxlZnQ6IHRydWUsXG4gICAgb3JpZ2luVG9wOiB0cnVlLFxuICAgIHJlc2l6ZTogdHJ1ZSxcbiAgICByZXNpemVDb250YWluZXI6IHRydWUsXG4gICAgLy8gaXRlbSBvcHRpb25zXG4gICAgdHJhbnNpdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgaGlkZGVuU3R5bGU6IHtcbiAgICAgIG9wYWNpdHk6IDAsXG4gICAgICB0cmFuc2Zvcm06ICdzY2FsZSgwLjAwMSknXG4gICAgfSxcbiAgICB2aXNpYmxlU3R5bGU6IHtcbiAgICAgIG9wYWNpdHk6IDEsXG4gICAgICB0cmFuc2Zvcm06ICdzY2FsZSgxKSdcbiAgICB9XG4gIH07XG4gIHZhciBwcm90byA9IE91dGxheWVyLnByb3RvdHlwZTsgLy8gaW5oZXJpdCBFdkVtaXR0ZXJcblxuICB1dGlscy5leHRlbmQocHJvdG8sIEV2RW1pdHRlci5wcm90b3R5cGUpO1xuICAvKipcbiAgICogc2V0IG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICovXG5cbiAgcHJvdG8ub3B0aW9uID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICB1dGlscy5leHRlbmQodGhpcy5vcHRpb25zLCBvcHRzKTtcbiAgfTtcbiAgLyoqXG4gICAqIGdldCBiYWNrd2FyZHMgY29tcGF0aWJsZSBvcHRpb24gdmFsdWUsIGNoZWNrIG9sZCBuYW1lXG4gICAqL1xuXG5cbiAgcHJvdG8uX2dldE9wdGlvbiA9IGZ1bmN0aW9uIChvcHRpb24pIHtcbiAgICB2YXIgb2xkT3B0aW9uID0gdGhpcy5jb25zdHJ1Y3Rvci5jb21wYXRPcHRpb25zW29wdGlvbl07XG4gICAgcmV0dXJuIG9sZE9wdGlvbiAmJiB0aGlzLm9wdGlvbnNbb2xkT3B0aW9uXSAhPT0gdW5kZWZpbmVkID8gdGhpcy5vcHRpb25zW29sZE9wdGlvbl0gOiB0aGlzLm9wdGlvbnNbb3B0aW9uXTtcbiAgfTtcblxuICBPdXRsYXllci5jb21wYXRPcHRpb25zID0ge1xuICAgIC8vIGN1cnJlbnROYW1lOiBvbGROYW1lXG4gICAgaW5pdExheW91dDogJ2lzSW5pdExheW91dCcsXG4gICAgaG9yaXpvbnRhbDogJ2lzSG9yaXpvbnRhbCcsXG4gICAgbGF5b3V0SW5zdGFudDogJ2lzTGF5b3V0SW5zdGFudCcsXG4gICAgb3JpZ2luTGVmdDogJ2lzT3JpZ2luTGVmdCcsXG4gICAgb3JpZ2luVG9wOiAnaXNPcmlnaW5Ub3AnLFxuICAgIHJlc2l6ZTogJ2lzUmVzaXplQm91bmQnLFxuICAgIHJlc2l6ZUNvbnRhaW5lcjogJ2lzUmVzaXppbmdDb250YWluZXInXG4gIH07XG5cbiAgcHJvdG8uX2NyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBnZXQgaXRlbXMgZnJvbSBjaGlsZHJlblxuICAgIHRoaXMucmVsb2FkSXRlbXMoKTsgLy8gZWxlbWVudHMgdGhhdCBhZmZlY3QgbGF5b3V0LCBidXQgYXJlIG5vdCBsYWlkIG91dFxuXG4gICAgdGhpcy5zdGFtcHMgPSBbXTtcbiAgICB0aGlzLnN0YW1wKHRoaXMub3B0aW9ucy5zdGFtcCk7IC8vIHNldCBjb250YWluZXIgc3R5bGVcblxuICAgIHV0aWxzLmV4dGVuZCh0aGlzLmVsZW1lbnQuc3R5bGUsIHRoaXMub3B0aW9ucy5jb250YWluZXJTdHlsZSk7IC8vIGJpbmQgcmVzaXplIG1ldGhvZFxuXG4gICAgdmFyIGNhbkJpbmRSZXNpemUgPSB0aGlzLl9nZXRPcHRpb24oJ3Jlc2l6ZScpO1xuXG4gICAgaWYgKGNhbkJpbmRSZXNpemUpIHtcbiAgICAgIHRoaXMuYmluZFJlc2l6ZSgpO1xuICAgIH1cbiAgfTsgLy8gZ29lcyB0aHJvdWdoIGFsbCBjaGlsZHJlbiBhZ2FpbiBhbmQgZ2V0cyBicmlja3MgaW4gcHJvcGVyIG9yZGVyXG5cblxuICBwcm90by5yZWxvYWRJdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgICB0aGlzLml0ZW1zID0gdGhpcy5faXRlbWl6ZSh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuICB9O1xuICAvKipcbiAgICogdHVybiBlbGVtZW50cyBpbnRvIE91dGxheWVyLkl0ZW1zIHRvIGJlIHVzZWQgaW4gbGF5b3V0XG4gICAqIEBwYXJhbSB7QXJyYXkgb3IgTm9kZUxpc3Qgb3IgSFRNTEVsZW1lbnR9IGVsZW1zXG4gICAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBjb2xsZWN0aW9uIG9mIG5ldyBPdXRsYXllciBJdGVtc1xuICAgKi9cblxuXG4gIHByb3RvLl9pdGVtaXplID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdmFyIGl0ZW1FbGVtcyA9IHRoaXMuX2ZpbHRlckZpbmRJdGVtRWxlbWVudHMoZWxlbXMpO1xuXG4gICAgdmFyIEl0ZW0gPSB0aGlzLmNvbnN0cnVjdG9yLkl0ZW07IC8vIGNyZWF0ZSBuZXcgT3V0bGF5ZXIgSXRlbXMgZm9yIGNvbGxlY3Rpb25cblxuICAgIHZhciBpdGVtcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtRWxlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBlbGVtID0gaXRlbUVsZW1zW2ldO1xuICAgICAgdmFyIGl0ZW0gPSBuZXcgSXRlbShlbGVtLCB0aGlzKTtcbiAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9O1xuICAvKipcbiAgICogZ2V0IGl0ZW0gZWxlbWVudHMgdG8gYmUgdXNlZCBpbiBsYXlvdXRcbiAgICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBIVE1MRWxlbWVudH0gZWxlbXNcbiAgICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIGl0ZW0gZWxlbWVudHNcbiAgICovXG5cblxuICBwcm90by5fZmlsdGVyRmluZEl0ZW1FbGVtZW50cyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHJldHVybiB1dGlscy5maWx0ZXJGaW5kRWxlbWVudHMoZWxlbXMsIHRoaXMub3B0aW9ucy5pdGVtU2VsZWN0b3IpO1xuICB9O1xuICAvKipcbiAgICogZ2V0dGVyIG1ldGhvZCBmb3IgZ2V0dGluZyBpdGVtIGVsZW1lbnRzXG4gICAqIEByZXR1cm5zIHtBcnJheX0gZWxlbXMgLSBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgICovXG5cblxuICBwcm90by5nZXRJdGVtRWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5lbGVtZW50O1xuICAgIH0pO1xuICB9OyAvLyAtLS0tLSBpbml0ICYgbGF5b3V0IC0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGxheXMgb3V0IGFsbCBpdGVtc1xuICAgKi9cblxuXG4gIHByb3RvLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZXNldExheW91dCgpO1xuXG4gICAgdGhpcy5fbWFuYWdlU3RhbXBzKCk7IC8vIGRvbid0IGFuaW1hdGUgZmlyc3QgbGF5b3V0XG5cblxuICAgIHZhciBsYXlvdXRJbnN0YW50ID0gdGhpcy5fZ2V0T3B0aW9uKCdsYXlvdXRJbnN0YW50Jyk7XG5cbiAgICB2YXIgaXNJbnN0YW50ID0gbGF5b3V0SW5zdGFudCAhPT0gdW5kZWZpbmVkID8gbGF5b3V0SW5zdGFudCA6ICF0aGlzLl9pc0xheW91dEluaXRlZDtcbiAgICB0aGlzLmxheW91dEl0ZW1zKHRoaXMuaXRlbXMsIGlzSW5zdGFudCk7IC8vIGZsYWcgZm9yIGluaXRhbGl6ZWRcblxuICAgIHRoaXMuX2lzTGF5b3V0SW5pdGVkID0gdHJ1ZTtcbiAgfTsgLy8gX2luaXQgaXMgYWxpYXMgZm9yIGxheW91dFxuXG5cbiAgcHJvdG8uX2luaXQgPSBwcm90by5sYXlvdXQ7XG4gIC8qKlxuICAgKiBsb2dpYyBiZWZvcmUgYW55IG5ldyBsYXlvdXRcbiAgICovXG5cbiAgcHJvdG8uX3Jlc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0U2l6ZSgpO1xuICB9O1xuXG4gIHByb3RvLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaXplID0gZ2V0U2l6ZSh0aGlzLmVsZW1lbnQpO1xuICB9O1xuICAvKipcbiAgICogZ2V0IG1lYXN1cmVtZW50IGZyb20gb3B0aW9uLCBmb3IgY29sdW1uV2lkdGgsIHJvd0hlaWdodCwgZ3V0dGVyXG4gICAqIGlmIG9wdGlvbiBpcyBTdHJpbmcgLT4gZ2V0IGVsZW1lbnQgZnJvbSBzZWxlY3RvciBzdHJpbmcsICYgZ2V0IHNpemUgb2YgZWxlbWVudFxuICAgKiBpZiBvcHRpb24gaXMgRWxlbWVudCAtPiBnZXQgc2l6ZSBvZiBlbGVtZW50XG4gICAqIGVsc2UgdXNlIG9wdGlvbiBhcyBhIG51bWJlclxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVhc3VyZW1lbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSB3aWR0aCBvciBoZWlnaHRcbiAgICogQHByaXZhdGVcbiAgICovXG5cblxuICBwcm90by5fZ2V0TWVhc3VyZW1lbnQgPSBmdW5jdGlvbiAobWVhc3VyZW1lbnQsIHNpemUpIHtcbiAgICB2YXIgb3B0aW9uID0gdGhpcy5vcHRpb25zW21lYXN1cmVtZW50XTtcbiAgICB2YXIgZWxlbTtcblxuICAgIGlmICghb3B0aW9uKSB7XG4gICAgICAvLyBkZWZhdWx0IHRvIDBcbiAgICAgIHRoaXNbbWVhc3VyZW1lbnRdID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdXNlIG9wdGlvbiBhcyBhbiBlbGVtZW50XG4gICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJykge1xuICAgICAgICBlbGVtID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAob3B0aW9uIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgZWxlbSA9IG9wdGlvbjtcbiAgICAgIH0gLy8gdXNlIHNpemUgb2YgZWxlbWVudCwgaWYgZWxlbWVudFxuXG5cbiAgICAgIHRoaXNbbWVhc3VyZW1lbnRdID0gZWxlbSA/IGdldFNpemUoZWxlbSlbc2l6ZV0gOiBvcHRpb247XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogbGF5b3V0IGEgY29sbGVjdGlvbiBvZiBpdGVtIGVsZW1lbnRzXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG5cbiAgcHJvdG8ubGF5b3V0SXRlbXMgPSBmdW5jdGlvbiAoaXRlbXMsIGlzSW5zdGFudCkge1xuICAgIGl0ZW1zID0gdGhpcy5fZ2V0SXRlbXNGb3JMYXlvdXQoaXRlbXMpO1xuXG4gICAgdGhpcy5fbGF5b3V0SXRlbXMoaXRlbXMsIGlzSW5zdGFudCk7XG5cbiAgICB0aGlzLl9wb3N0TGF5b3V0KCk7XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgdGhlIGl0ZW1zIHRvIGJlIGxhaWQgb3V0XG4gICAqIHlvdSBtYXkgd2FudCB0byBza2lwIG92ZXIgc29tZSBpdGVtc1xuICAgKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGl0ZW1zXG4gICAqL1xuXG5cbiAgcHJvdG8uX2dldEl0ZW1zRm9yTGF5b3V0ID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgcmV0dXJuIGl0ZW1zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuICFpdGVtLmlzSWdub3JlZDtcbiAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIGxheW91dCBpdGVtc1xuICAgKiBAcGFyYW0ge0FycmF5fSBpdGVtc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW5zdGFudFxuICAgKi9cblxuXG4gIHByb3RvLl9sYXlvdXRJdGVtcyA9IGZ1bmN0aW9uIChpdGVtcywgaXNJbnN0YW50KSB7XG4gICAgdGhpcy5fZW1pdENvbXBsZXRlT25JdGVtcygnbGF5b3V0JywgaXRlbXMpO1xuXG4gICAgaWYgKCFpdGVtcyB8fCAhaXRlbXMubGVuZ3RoKSB7XG4gICAgICAvLyBubyBpdGVtcywgZW1pdCBldmVudCB3aXRoIGVtcHR5IGFycmF5XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHF1ZXVlID0gW107XG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgLy8gZ2V0IHgveSBvYmplY3QgZnJvbSBtZXRob2RcbiAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldEl0ZW1MYXlvdXRQb3NpdGlvbihpdGVtKTsgLy8gZW5xdWV1ZVxuXG5cbiAgICAgIHBvc2l0aW9uLml0ZW0gPSBpdGVtO1xuICAgICAgcG9zaXRpb24uaXNJbnN0YW50ID0gaXNJbnN0YW50IHx8IGl0ZW0uaXNMYXlvdXRJbnN0YW50O1xuICAgICAgcXVldWUucHVzaChwb3NpdGlvbik7XG4gICAgfSwgdGhpcyk7XG5cbiAgICB0aGlzLl9wcm9jZXNzTGF5b3V0UXVldWUocXVldWUpO1xuICB9O1xuICAvKipcbiAgICogZ2V0IGl0ZW0gbGF5b3V0IHBvc2l0aW9uXG4gICAqIEBwYXJhbSB7T3V0bGF5ZXIuSXRlbX0gaXRlbVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSB4IGFuZCB5IHBvc2l0aW9uXG4gICAqL1xuXG5cbiAgcHJvdG8uX2dldEl0ZW1MYXlvdXRQb3NpdGlvbiA9IGZ1bmN0aW9uICgpXG4gIC8qIGl0ZW0gKi9cbiAge1xuICAgIHJldHVybiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH07XG4gIH07XG4gIC8qKlxuICAgKiBpdGVyYXRlIG92ZXIgYXJyYXkgYW5kIHBvc2l0aW9uIGVhY2ggaXRlbVxuICAgKiBSZWFzb24gYmVpbmcgLSBzZXBhcmF0aW5nIHRoaXMgbG9naWMgcHJldmVudHMgJ2xheW91dCBpbnZhbGlkYXRpb24nXG4gICAqIHRoeCBAcGF1bF9pcmlzaFxuICAgKiBAcGFyYW0ge0FycmF5fSBxdWV1ZVxuICAgKi9cblxuXG4gIHByb3RvLl9wcm9jZXNzTGF5b3V0UXVldWUgPSBmdW5jdGlvbiAocXVldWUpIHtcbiAgICB0aGlzLnVwZGF0ZVN0YWdnZXIoKTtcbiAgICBxdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uIChvYmosIGkpIHtcbiAgICAgIHRoaXMuX3Bvc2l0aW9uSXRlbShvYmouaXRlbSwgb2JqLngsIG9iai55LCBvYmouaXNJbnN0YW50LCBpKTtcbiAgICB9LCB0aGlzKTtcbiAgfTsgLy8gc2V0IHN0YWdnZXIgZnJvbSBvcHRpb24gaW4gbWlsbGlzZWNvbmRzIG51bWJlclxuXG5cbiAgcHJvdG8udXBkYXRlU3RhZ2dlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3RhZ2dlciA9IHRoaXMub3B0aW9ucy5zdGFnZ2VyO1xuXG4gICAgaWYgKHN0YWdnZXIgPT09IG51bGwgfHwgc3RhZ2dlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnN0YWdnZXIgPSAwO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RhZ2dlciA9IGdldE1pbGxpc2Vjb25kcyhzdGFnZ2VyKTtcbiAgICByZXR1cm4gdGhpcy5zdGFnZ2VyO1xuICB9O1xuICAvKipcbiAgICogU2V0cyBwb3NpdGlvbiBvZiBpdGVtIGluIERPTVxuICAgKiBAcGFyYW0ge091dGxheWVyLkl0ZW19IGl0ZW1cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHggLSBob3Jpem9udGFsIHBvc2l0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB5IC0gdmVydGljYWwgcG9zaXRpb25cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc0luc3RhbnQgLSBkaXNhYmxlcyB0cmFuc2l0aW9uc1xuICAgKi9cblxuXG4gIHByb3RvLl9wb3NpdGlvbkl0ZW0gPSBmdW5jdGlvbiAoaXRlbSwgeCwgeSwgaXNJbnN0YW50LCBpKSB7XG4gICAgaWYgKGlzSW5zdGFudCkge1xuICAgICAgLy8gaWYgbm90IHRyYW5zaXRpb24sIGp1c3Qgc2V0IENTU1xuICAgICAgaXRlbS5nb1RvKHgsIHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpdGVtLnN0YWdnZXIoaSAqIHRoaXMuc3RhZ2dlcik7XG4gICAgICBpdGVtLm1vdmVUbyh4LCB5KTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBBbnkgbG9naWMgeW91IHdhbnQgdG8gZG8gYWZ0ZXIgZWFjaCBsYXlvdXQsXG4gICAqIGkuZS4gc2l6ZSB0aGUgY29udGFpbmVyXG4gICAqL1xuXG5cbiAgcHJvdG8uX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZXNpemVDb250YWluZXIoKTtcbiAgfTtcblxuICBwcm90by5yZXNpemVDb250YWluZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlzUmVzaXppbmdDb250YWluZXIgPSB0aGlzLl9nZXRPcHRpb24oJ3Jlc2l6ZUNvbnRhaW5lcicpO1xuXG4gICAgaWYgKCFpc1Jlc2l6aW5nQ29udGFpbmVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNpemUgPSB0aGlzLl9nZXRDb250YWluZXJTaXplKCk7XG5cbiAgICBpZiAoc2l6ZSkge1xuICAgICAgdGhpcy5fc2V0Q29udGFpbmVyTWVhc3VyZShzaXplLndpZHRoLCB0cnVlKTtcblxuICAgICAgdGhpcy5fc2V0Q29udGFpbmVyTWVhc3VyZShzaXplLmhlaWdodCwgZmFsc2UpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIFNldHMgd2lkdGggb3IgaGVpZ2h0IG9mIGNvbnRhaW5lciBpZiByZXR1cm5lZFxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBzaXplXG4gICAqICAgQHBhcmFtIHtOdW1iZXJ9IHdpZHRoXG4gICAqICAgQHBhcmFtIHtOdW1iZXJ9IGhlaWdodFxuICAgKi9cblxuXG4gIHByb3RvLl9nZXRDb250YWluZXJTaXplID0gbm9vcDtcbiAgLyoqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBtZWFzdXJlIC0gc2l6ZSBvZiB3aWR0aCBvciBoZWlnaHRcbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1dpZHRoXG4gICAqL1xuXG4gIHByb3RvLl9zZXRDb250YWluZXJNZWFzdXJlID0gZnVuY3Rpb24gKG1lYXN1cmUsIGlzV2lkdGgpIHtcbiAgICBpZiAobWVhc3VyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGVsZW1TaXplID0gdGhpcy5zaXplOyAvLyBhZGQgcGFkZGluZyBhbmQgYm9yZGVyIHdpZHRoIGlmIGJvcmRlciBib3hcblxuICAgIGlmIChlbGVtU2l6ZS5pc0JvcmRlckJveCkge1xuICAgICAgbWVhc3VyZSArPSBpc1dpZHRoID8gZWxlbVNpemUucGFkZGluZ0xlZnQgKyBlbGVtU2l6ZS5wYWRkaW5nUmlnaHQgKyBlbGVtU2l6ZS5ib3JkZXJMZWZ0V2lkdGggKyBlbGVtU2l6ZS5ib3JkZXJSaWdodFdpZHRoIDogZWxlbVNpemUucGFkZGluZ0JvdHRvbSArIGVsZW1TaXplLnBhZGRpbmdUb3AgKyBlbGVtU2l6ZS5ib3JkZXJUb3BXaWR0aCArIGVsZW1TaXplLmJvcmRlckJvdHRvbVdpZHRoO1xuICAgIH1cblxuICAgIG1lYXN1cmUgPSBNYXRoLm1heChtZWFzdXJlLCAwKTtcbiAgICB0aGlzLmVsZW1lbnQuc3R5bGVbaXNXaWR0aCA/ICd3aWR0aCcgOiAnaGVpZ2h0J10gPSBtZWFzdXJlICsgJ3B4JztcbiAgfTtcbiAgLyoqXG4gICAqIGVtaXQgZXZlbnRDb21wbGV0ZSBvbiBhIGNvbGxlY3Rpb24gb2YgaXRlbXMgZXZlbnRzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWVcbiAgICogQHBhcmFtIHtBcnJheX0gaXRlbXMgLSBPdXRsYXllci5JdGVtc1xuICAgKi9cblxuXG4gIHByb3RvLl9lbWl0Q29tcGxldGVPbkl0ZW1zID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgaXRlbXMpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gb25Db21wbGV0ZSgpIHtcbiAgICAgIF90aGlzLmRpc3BhdGNoRXZlbnQoZXZlbnROYW1lICsgJ0NvbXBsZXRlJywgbnVsbCwgW2l0ZW1zXSk7XG4gICAgfVxuXG4gICAgdmFyIGNvdW50ID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgaWYgKCFpdGVtcyB8fCAhY291bnQpIHtcbiAgICAgIG9uQ29tcGxldGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZG9uZUNvdW50ID0gMDtcblxuICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICBkb25lQ291bnQrKztcblxuICAgICAgaWYgKGRvbmVDb3VudCA9PSBjb3VudCkge1xuICAgICAgICBvbkNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgfSAvLyBiaW5kIGNhbGxiYWNrXG5cblxuICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIGl0ZW0ub25jZShldmVudE5hbWUsIHRpY2spO1xuICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogZW1pdHMgZXZlbnRzIHZpYSBFdkVtaXR0ZXIgYW5kIGpRdWVyeSBldmVudHNcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSBuYW1lIG9mIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gb3JpZ2luYWwgZXZlbnRcbiAgICogQHBhcmFtIHtBcnJheX0gYXJncyAtIGV4dHJhIGFyZ3VtZW50c1xuICAgKi9cblxuXG4gIHByb3RvLmRpc3BhdGNoRXZlbnQgPSBmdW5jdGlvbiAodHlwZSwgZXZlbnQsIGFyZ3MpIHtcbiAgICAvLyBhZGQgb3JpZ2luYWwgZXZlbnQgdG8gYXJndW1lbnRzXG4gICAgdmFyIGVtaXRBcmdzID0gZXZlbnQgPyBbZXZlbnRdLmNvbmNhdChhcmdzKSA6IGFyZ3M7XG4gICAgdGhpcy5lbWl0RXZlbnQodHlwZSwgZW1pdEFyZ3MpO1xuXG4gICAgaWYgKGpRdWVyeSkge1xuICAgICAgLy8gc2V0IHRoaXMuJGVsZW1lbnRcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSB0aGlzLiRlbGVtZW50IHx8IGpRdWVyeSh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBldmVudFxuICAgICAgICB2YXIgJGV2ZW50ID0galF1ZXJ5LkV2ZW50KGV2ZW50KTtcbiAgICAgICAgJGV2ZW50LnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJGV2ZW50LCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGp1c3QgdHJpZ2dlciB3aXRoIHR5cGUgaWYgbm8gZXZlbnQgYXZhaWxhYmxlXG4gICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcih0eXBlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGlnbm9yZSAmIHN0YW1wcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBrZWVwIGl0ZW0gaW4gY29sbGVjdGlvbiwgYnV0IGRvIG5vdCBsYXkgaXQgb3V0XG4gICAqIGlnbm9yZWQgaXRlbXMgZG8gbm90IGdldCBza2lwcGVkIGluIGxheW91dFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAgICovXG5cblxuICBwcm90by5pZ25vcmUgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHZhciBpdGVtID0gdGhpcy5nZXRJdGVtKGVsZW0pO1xuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGl0ZW0uaXNJZ25vcmVkID0gdHJ1ZTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiByZXR1cm4gaXRlbSB0byBsYXlvdXQgY29sbGVjdGlvblxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAgICovXG5cblxuICBwcm90by51bmlnbm9yZSA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW0oZWxlbSk7XG5cbiAgICBpZiAoaXRlbSkge1xuICAgICAgZGVsZXRlIGl0ZW0uaXNJZ25vcmVkO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIGFkZHMgZWxlbWVudHMgdG8gc3RhbXBzXG4gICAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBFbGVtZW50LCBvciBTdHJpbmd9IGVsZW1zXG4gICAqL1xuXG5cbiAgcHJvdG8uc3RhbXAgPSBmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICBlbGVtcyA9IHRoaXMuX2ZpbmQoZWxlbXMpO1xuXG4gICAgaWYgKCFlbGVtcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RhbXBzID0gdGhpcy5zdGFtcHMuY29uY2F0KGVsZW1zKTsgLy8gaWdub3JlXG5cbiAgICBlbGVtcy5mb3JFYWNoKHRoaXMuaWdub3JlLCB0aGlzKTtcbiAgfTtcbiAgLyoqXG4gICAqIHJlbW92ZXMgZWxlbWVudHMgdG8gc3RhbXBzXG4gICAqIEBwYXJhbSB7Tm9kZUxpc3QsIEFycmF5LCBvciBFbGVtZW50fSBlbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLnVuc3RhbXAgPSBmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICBlbGVtcyA9IHRoaXMuX2ZpbmQoZWxlbXMpO1xuXG4gICAgaWYgKCFlbGVtcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVsZW1zLmZvckVhY2goZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgIC8vIGZpbHRlciBvdXQgcmVtb3ZlZCBzdGFtcCBlbGVtZW50c1xuICAgICAgdXRpbHMucmVtb3ZlRnJvbSh0aGlzLnN0YW1wcywgZWxlbSk7XG4gICAgICB0aGlzLnVuaWdub3JlKGVsZW0pO1xuICAgIH0sIHRoaXMpO1xuICB9O1xuICAvKipcbiAgICogZmluZHMgY2hpbGQgZWxlbWVudHNcbiAgICogQHBhcmFtIHtOb2RlTGlzdCwgQXJyYXksIEVsZW1lbnQsIG9yIFN0cmluZ30gZWxlbXNcbiAgICogQHJldHVybnMge0FycmF5fSBlbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLl9maW5kID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgaWYgKCFlbGVtcykge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gaWYgc3RyaW5nLCB1c2UgYXJndW1lbnQgYXMgc2VsZWN0b3Igc3RyaW5nXG5cblxuICAgIGlmICh0eXBlb2YgZWxlbXMgPT0gJ3N0cmluZycpIHtcbiAgICAgIGVsZW1zID0gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbXMpO1xuICAgIH1cblxuICAgIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KGVsZW1zKTtcbiAgICByZXR1cm4gZWxlbXM7XG4gIH07XG5cbiAgcHJvdG8uX21hbmFnZVN0YW1wcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuc3RhbXBzIHx8ICF0aGlzLnN0YW1wcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9nZXRCb3VuZGluZ1JlY3QoKTtcblxuICAgIHRoaXMuc3RhbXBzLmZvckVhY2godGhpcy5fbWFuYWdlU3RhbXAsIHRoaXMpO1xuICB9OyAvLyB1cGRhdGUgYm91bmRpbmdMZWZ0IC8gVG9wXG5cblxuICBwcm90by5fZ2V0Qm91bmRpbmdSZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGdldCBib3VuZGluZyByZWN0IGZvciBjb250YWluZXIgZWxlbWVudFxuICAgIHZhciBib3VuZGluZ1JlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHNpemUgPSB0aGlzLnNpemU7XG4gICAgdGhpcy5fYm91bmRpbmdSZWN0ID0ge1xuICAgICAgbGVmdDogYm91bmRpbmdSZWN0LmxlZnQgKyBzaXplLnBhZGRpbmdMZWZ0ICsgc2l6ZS5ib3JkZXJMZWZ0V2lkdGgsXG4gICAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgKyBzaXplLnBhZGRpbmdUb3AgKyBzaXplLmJvcmRlclRvcFdpZHRoLFxuICAgICAgcmlnaHQ6IGJvdW5kaW5nUmVjdC5yaWdodCAtIChzaXplLnBhZGRpbmdSaWdodCArIHNpemUuYm9yZGVyUmlnaHRXaWR0aCksXG4gICAgICBib3R0b206IGJvdW5kaW5nUmVjdC5ib3R0b20gLSAoc2l6ZS5wYWRkaW5nQm90dG9tICsgc2l6ZS5ib3JkZXJCb3R0b21XaWR0aClcbiAgICB9O1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtIHtFbGVtZW50fSBzdGFtcFxuICAqKi9cblxuXG4gIHByb3RvLl9tYW5hZ2VTdGFtcCA9IG5vb3A7XG4gIC8qKlxuICAgKiBnZXQgeC95IHBvc2l0aW9uIG9mIGVsZW1lbnQgcmVsYXRpdmUgdG8gY29udGFpbmVyIGVsZW1lbnRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IG9mZnNldCAtIGhhcyBsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b21cbiAgICovXG5cbiAgcHJvdG8uX2dldEVsZW1lbnRPZmZzZXQgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHZhciBib3VuZGluZ1JlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciB0aGlzUmVjdCA9IHRoaXMuX2JvdW5kaW5nUmVjdDtcbiAgICB2YXIgc2l6ZSA9IGdldFNpemUoZWxlbSk7XG4gICAgdmFyIG9mZnNldCA9IHtcbiAgICAgIGxlZnQ6IGJvdW5kaW5nUmVjdC5sZWZ0IC0gdGhpc1JlY3QubGVmdCAtIHNpemUubWFyZ2luTGVmdCxcbiAgICAgIHRvcDogYm91bmRpbmdSZWN0LnRvcCAtIHRoaXNSZWN0LnRvcCAtIHNpemUubWFyZ2luVG9wLFxuICAgICAgcmlnaHQ6IHRoaXNSZWN0LnJpZ2h0IC0gYm91bmRpbmdSZWN0LnJpZ2h0IC0gc2l6ZS5tYXJnaW5SaWdodCxcbiAgICAgIGJvdHRvbTogdGhpc1JlY3QuYm90dG9tIC0gYm91bmRpbmdSZWN0LmJvdHRvbSAtIHNpemUubWFyZ2luQm90dG9tXG4gICAgfTtcbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSByZXNpemUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gZW5hYmxlIGV2ZW50IGhhbmRsZXJzIGZvciBsaXN0ZW5lcnNcbiAgLy8gaS5lLiByZXNpemUgLT4gb25yZXNpemVcblxuXG4gIHByb3RvLmhhbmRsZUV2ZW50ID0gdXRpbHMuaGFuZGxlRXZlbnQ7XG4gIC8qKlxuICAgKiBCaW5kIGxheW91dCB0byB3aW5kb3cgcmVzaXppbmdcbiAgICovXG5cbiAgcHJvdG8uYmluZFJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcyk7XG4gICAgdGhpcy5pc1Jlc2l6ZUJvdW5kID0gdHJ1ZTtcbiAgfTtcbiAgLyoqXG4gICAqIFVuYmluZCBsYXlvdXQgdG8gd2luZG93IHJlc2l6aW5nXG4gICAqL1xuXG5cbiAgcHJvdG8udW5iaW5kUmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzKTtcbiAgICB0aGlzLmlzUmVzaXplQm91bmQgPSBmYWxzZTtcbiAgfTtcblxuICBwcm90by5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlc2l6ZSgpO1xuICB9O1xuXG4gIHV0aWxzLmRlYm91bmNlTWV0aG9kKE91dGxheWVyLCAnb25yZXNpemUnLCAxMDApO1xuXG4gIHByb3RvLnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBkb24ndCB0cmlnZ2VyIGlmIHNpemUgZGlkIG5vdCBjaGFuZ2VcbiAgICAvLyBvciBpZiByZXNpemUgd2FzIHVuYm91bmQuIFNlZSAjOVxuICAgIGlmICghdGhpcy5pc1Jlc2l6ZUJvdW5kIHx8ICF0aGlzLm5lZWRzUmVzaXplTGF5b3V0KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmxheW91dCgpO1xuICB9O1xuICAvKipcbiAgICogY2hlY2sgaWYgbGF5b3V0IGlzIG5lZWRlZCBwb3N0IGxheW91dFxuICAgKiBAcmV0dXJucyBCb29sZWFuXG4gICAqL1xuXG5cbiAgcHJvdG8ubmVlZHNSZXNpemVMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNpemUgPSBnZXRTaXplKHRoaXMuZWxlbWVudCk7IC8vIGNoZWNrIHRoYXQgdGhpcy5zaXplIGFuZCBzaXplIGFyZSB0aGVyZVxuICAgIC8vIElFOCB0cmlnZ2VycyByZXNpemUgb24gYm9keSBzaXplIGNoYW5nZSwgc28gdGhleSBtaWdodCBub3QgYmVcblxuICAgIHZhciBoYXNTaXplcyA9IHRoaXMuc2l6ZSAmJiBzaXplO1xuICAgIHJldHVybiBoYXNTaXplcyAmJiBzaXplLmlubmVyV2lkdGggIT09IHRoaXMuc2l6ZS5pbm5lcldpZHRoO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtZXRob2RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGFkZCBpdGVtcyB0byBPdXRsYXllciBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0FycmF5IG9yIE5vZGVMaXN0IG9yIEVsZW1lbnR9IGVsZW1zXG4gICAqIEByZXR1cm5zIHtBcnJheX0gaXRlbXMgLSBPdXRsYXllci5JdGVtc1xuICAqKi9cblxuXG4gIHByb3RvLmFkZEl0ZW1zID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5faXRlbWl6ZShlbGVtcyk7IC8vIGFkZCBpdGVtcyB0byBjb2xsZWN0aW9uXG5cblxuICAgIGlmIChpdGVtcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuaXRlbXMgPSB0aGlzLml0ZW1zLmNvbmNhdChpdGVtcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9O1xuICAvKipcbiAgICogTGF5b3V0IG5ld2x5LWFwcGVuZGVkIGl0ZW0gZWxlbWVudHNcbiAgICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBFbGVtZW50fSBlbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLmFwcGVuZGVkID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5hZGRJdGVtcyhlbGVtcyk7XG5cbiAgICBpZiAoIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gbGF5b3V0IGFuZCByZXZlYWwganVzdCB0aGUgbmV3IGl0ZW1zXG5cblxuICAgIHRoaXMubGF5b3V0SXRlbXMoaXRlbXMsIHRydWUpO1xuICAgIHRoaXMucmV2ZWFsKGl0ZW1zKTtcbiAgfTtcbiAgLyoqXG4gICAqIExheW91dCBwcmVwZW5kZWQgZWxlbWVudHNcbiAgICogQHBhcmFtIHtBcnJheSBvciBOb2RlTGlzdCBvciBFbGVtZW50fSBlbGVtc1xuICAgKi9cblxuXG4gIHByb3RvLnByZXBlbmRlZCA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoZWxlbXMpO1xuXG4gICAgaWYgKCFpdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGFkZCBpdGVtcyB0byBiZWdpbm5pbmcgb2YgY29sbGVjdGlvblxuXG5cbiAgICB2YXIgcHJldmlvdXNJdGVtcyA9IHRoaXMuaXRlbXMuc2xpY2UoMCk7XG4gICAgdGhpcy5pdGVtcyA9IGl0ZW1zLmNvbmNhdChwcmV2aW91c0l0ZW1zKTsgLy8gc3RhcnQgbmV3IGxheW91dFxuXG4gICAgdGhpcy5fcmVzZXRMYXlvdXQoKTtcblxuICAgIHRoaXMuX21hbmFnZVN0YW1wcygpOyAvLyBsYXlvdXQgbmV3IHN0dWZmIHdpdGhvdXQgdHJhbnNpdGlvblxuXG5cbiAgICB0aGlzLmxheW91dEl0ZW1zKGl0ZW1zLCB0cnVlKTtcbiAgICB0aGlzLnJldmVhbChpdGVtcyk7IC8vIGxheW91dCBwcmV2aW91cyBpdGVtc1xuXG4gICAgdGhpcy5sYXlvdXRJdGVtcyhwcmV2aW91c0l0ZW1zKTtcbiAgfTtcbiAgLyoqXG4gICAqIHJldmVhbCBhIGNvbGxlY3Rpb24gb2YgaXRlbXNcbiAgICogQHBhcmFtIHtBcnJheSBvZiBPdXRsYXllci5JdGVtc30gaXRlbXNcbiAgICovXG5cblxuICBwcm90by5yZXZlYWwgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgICB0aGlzLl9lbWl0Q29tcGxldGVPbkl0ZW1zKCdyZXZlYWwnLCBpdGVtcyk7XG5cbiAgICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhZ2dlciA9IHRoaXMudXBkYXRlU3RhZ2dlcigpO1xuICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGkpIHtcbiAgICAgIGl0ZW0uc3RhZ2dlcihpICogc3RhZ2dlcik7XG4gICAgICBpdGVtLnJldmVhbCgpO1xuICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogaGlkZSBhIGNvbGxlY3Rpb24gb2YgaXRlbXNcbiAgICogQHBhcmFtIHtBcnJheSBvZiBPdXRsYXllci5JdGVtc30gaXRlbXNcbiAgICovXG5cblxuICBwcm90by5oaWRlID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgdGhpcy5fZW1pdENvbXBsZXRlT25JdGVtcygnaGlkZScsIGl0ZW1zKTtcblxuICAgIGlmICghaXRlbXMgfHwgIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGFnZ2VyID0gdGhpcy51cGRhdGVTdGFnZ2VyKCk7XG4gICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSwgaSkge1xuICAgICAgaXRlbS5zdGFnZ2VyKGkgKiBzdGFnZ2VyKTtcbiAgICAgIGl0ZW0uaGlkZSgpO1xuICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogcmV2ZWFsIGl0ZW0gZWxlbWVudHNcbiAgICogQHBhcmFtIHtBcnJheX0sIHtFbGVtZW50fSwge05vZGVMaXN0fSBpdGVtc1xuICAgKi9cblxuXG4gIHByb3RvLnJldmVhbEl0ZW1FbGVtZW50cyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoZWxlbXMpO1xuICAgIHRoaXMucmV2ZWFsKGl0ZW1zKTtcbiAgfTtcbiAgLyoqXG4gICAqIGhpZGUgaXRlbSBlbGVtZW50c1xuICAgKiBAcGFyYW0ge0FycmF5fSwge0VsZW1lbnR9LCB7Tm9kZUxpc3R9IGl0ZW1zXG4gICAqL1xuXG5cbiAgcHJvdG8uaGlkZUl0ZW1FbGVtZW50cyA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBpdGVtcyA9IHRoaXMuZ2V0SXRlbXMoZWxlbXMpO1xuICAgIHRoaXMuaGlkZShpdGVtcyk7XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgT3V0bGF5ZXIuSXRlbSwgZ2l2ZW4gYW4gRWxlbWVudFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICogQHJldHVybnMge091dGxheWVyLkl0ZW19IGl0ZW1cbiAgICovXG5cblxuICBwcm90by5nZXRJdGVtID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAvLyBsb29wIHRocm91Z2ggaXRlbXMgdG8gZ2V0IHRoZSBvbmUgdGhhdCBtYXRjaGVzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuaXRlbXNbaV07XG5cbiAgICAgIGlmIChpdGVtLmVsZW1lbnQgPT0gZWxlbSkge1xuICAgICAgICAvLyByZXR1cm4gaXRlbVxuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgY29sbGVjdGlvbiBvZiBPdXRsYXllci5JdGVtcywgZ2l2ZW4gRWxlbWVudHNcbiAgICogQHBhcmFtIHtBcnJheX0gZWxlbXNcbiAgICogQHJldHVybnMge0FycmF5fSBpdGVtcyAtIE91dGxheWVyLkl0ZW1zXG4gICAqL1xuXG5cbiAgcHJvdG8uZ2V0SXRlbXMgPSBmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICBlbGVtcyA9IHV0aWxzLm1ha2VBcnJheShlbGVtcyk7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgZWxlbXMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLmdldEl0ZW0oZWxlbSk7XG5cbiAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuIGl0ZW1zO1xuICB9O1xuICAvKipcbiAgICogcmVtb3ZlIGVsZW1lbnQocykgZnJvbSBpbnN0YW5jZSBhbmQgRE9NXG4gICAqIEBwYXJhbSB7QXJyYXkgb3IgTm9kZUxpc3Qgb3IgRWxlbWVudH0gZWxlbXNcbiAgICovXG5cblxuICBwcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICB2YXIgcmVtb3ZlSXRlbXMgPSB0aGlzLmdldEl0ZW1zKGVsZW1zKTtcblxuICAgIHRoaXMuX2VtaXRDb21wbGV0ZU9uSXRlbXMoJ3JlbW92ZScsIHJlbW92ZUl0ZW1zKTsgLy8gYmFpbCBpZiBubyBpdGVtcyB0byByZW1vdmVcblxuXG4gICAgaWYgKCFyZW1vdmVJdGVtcyB8fCAhcmVtb3ZlSXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVtb3ZlSXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgaXRlbS5yZW1vdmUoKTsgLy8gcmVtb3ZlIGl0ZW0gZnJvbSBjb2xsZWN0aW9uXG5cbiAgICAgIHV0aWxzLnJlbW92ZUZyb20odGhpcy5pdGVtcywgaXRlbSk7XG4gICAgfSwgdGhpcyk7XG4gIH07IC8vIC0tLS0tIGRlc3Ryb3kgLS0tLS0gLy9cbiAgLy8gcmVtb3ZlIGFuZCBkaXNhYmxlIE91dGxheWVyIGluc3RhbmNlXG5cblxuICBwcm90by5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGNsZWFuIHVwIGR5bmFtaWMgc3R5bGVzXG4gICAgdmFyIHN0eWxlID0gdGhpcy5lbGVtZW50LnN0eWxlO1xuICAgIHN0eWxlLmhlaWdodCA9ICcnO1xuICAgIHN0eWxlLnBvc2l0aW9uID0gJyc7XG4gICAgc3R5bGUud2lkdGggPSAnJzsgLy8gZGVzdHJveSBpdGVtc1xuXG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICBpdGVtLmRlc3Ryb3koKTtcbiAgICB9KTtcbiAgICB0aGlzLnVuYmluZFJlc2l6ZSgpO1xuICAgIHZhciBpZCA9IHRoaXMuZWxlbWVudC5vdXRsYXllckdVSUQ7XG4gICAgZGVsZXRlIGluc3RhbmNlc1tpZF07IC8vIHJlbW92ZSByZWZlcmVuY2UgdG8gaW5zdGFuY2UgYnkgaWRcblxuICAgIGRlbGV0ZSB0aGlzLmVsZW1lbnQub3V0bGF5ZXJHVUlEOyAvLyByZW1vdmUgZGF0YSBmb3IgalF1ZXJ5XG5cbiAgICBpZiAoalF1ZXJ5KSB7XG4gICAgICBqUXVlcnkucmVtb3ZlRGF0YSh0aGlzLmVsZW1lbnQsIHRoaXMuY29uc3RydWN0b3IubmFtZXNwYWNlKTtcbiAgICB9XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGRhdGEgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogZ2V0IE91dGxheWVyIGluc3RhbmNlIGZyb20gZWxlbWVudFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1cbiAgICogQHJldHVybnMge091dGxheWVyfVxuICAgKi9cblxuXG4gIE91dGxheWVyLmRhdGEgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIGVsZW0gPSB1dGlscy5nZXRRdWVyeUVsZW1lbnQoZWxlbSk7XG4gICAgdmFyIGlkID0gZWxlbSAmJiBlbGVtLm91dGxheWVyR1VJRDtcbiAgICByZXR1cm4gaWQgJiYgaW5zdGFuY2VzW2lkXTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gY3JlYXRlIE91dGxheWVyIGNsYXNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIGNyZWF0ZSBhIGxheW91dCBjbGFzc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gICAqL1xuXG5cbiAgT3V0bGF5ZXIuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgb3B0aW9ucykge1xuICAgIC8vIHN1Yi1jbGFzcyBPdXRsYXllclxuICAgIHZhciBMYXlvdXQgPSBzdWJjbGFzcyhPdXRsYXllcik7IC8vIGFwcGx5IG5ldyBvcHRpb25zIGFuZCBjb21wYXRPcHRpb25zXG5cbiAgICBMYXlvdXQuZGVmYXVsdHMgPSB1dGlscy5leHRlbmQoe30sIE91dGxheWVyLmRlZmF1bHRzKTtcbiAgICB1dGlscy5leHRlbmQoTGF5b3V0LmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICBMYXlvdXQuY29tcGF0T3B0aW9ucyA9IHV0aWxzLmV4dGVuZCh7fSwgT3V0bGF5ZXIuY29tcGF0T3B0aW9ucyk7XG4gICAgTGF5b3V0Lm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICBMYXlvdXQuZGF0YSA9IE91dGxheWVyLmRhdGE7IC8vIHN1Yi1jbGFzcyBJdGVtXG5cbiAgICBMYXlvdXQuSXRlbSA9IHN1YmNsYXNzKEl0ZW0pOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBkZWNsYXJhdGl2ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgdXRpbHMuaHRtbEluaXQoTGF5b3V0LCBuYW1lc3BhY2UpOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqUXVlcnkgYnJpZGdlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gICAgLy8gbWFrZSBpbnRvIGpRdWVyeSBwbHVnaW5cblxuICAgIGlmIChqUXVlcnkgJiYgalF1ZXJ5LmJyaWRnZXQpIHtcbiAgICAgIGpRdWVyeS5icmlkZ2V0KG5hbWVzcGFjZSwgTGF5b3V0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gTGF5b3V0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHN1YmNsYXNzKFBhcmVudCkge1xuICAgIGZ1bmN0aW9uIFN1YkNsYXNzKCkge1xuICAgICAgUGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgU3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQYXJlbnQucHJvdG90eXBlKTtcbiAgICBTdWJDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdWJDbGFzcztcbiAgICByZXR1cm4gU3ViQ2xhc3M7XG4gIH0gLy8gLS0tLS0gaGVscGVycyAtLS0tLSAvL1xuICAvLyBob3cgbWFueSBtaWxsaXNlY29uZHMgYXJlIGluIGVhY2ggdW5pdFxuXG5cbiAgdmFyIG1zVW5pdHMgPSB7XG4gICAgbXM6IDEsXG4gICAgczogMTAwMFxuICB9OyAvLyBtdW5nZSB0aW1lLWxpa2UgcGFyYW1ldGVyIGludG8gbWlsbGlzZWNvbmQgbnVtYmVyXG4gIC8vICcwLjRzJyAtPiA0MFxuXG4gIGZ1bmN0aW9uIGdldE1pbGxpc2Vjb25kcyh0aW1lKSB7XG4gICAgaWYgKHR5cGVvZiB0aW1lID09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gdGltZTtcbiAgICB9XG5cbiAgICB2YXIgbWF0Y2hlcyA9IHRpbWUubWF0Y2goLyheXFxkKlxcLj9cXGQqKShcXHcqKS8pO1xuICAgIHZhciBudW0gPSBtYXRjaGVzICYmIG1hdGNoZXNbMV07XG4gICAgdmFyIHVuaXQgPSBtYXRjaGVzICYmIG1hdGNoZXNbMl07XG5cbiAgICBpZiAoIW51bS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIG51bSA9IHBhcnNlRmxvYXQobnVtKTtcbiAgICB2YXIgbXVsdCA9IG1zVW5pdHNbdW5pdF0gfHwgMTtcbiAgICByZXR1cm4gbnVtICogbXVsdDtcbiAgfSAvLyAtLS0tLSBmaW4gLS0tLS0gLy9cbiAgLy8gYmFjayBpbiBnbG9iYWxcblxuXG4gIE91dGxheWVyLkl0ZW0gPSBJdGVtO1xuICByZXR1cm4gT3V0bGF5ZXI7XG59KTtcbi8qKlxuICogSXNvdG9wZSBJdGVtXG4qKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2lzb3RvcGUtbGF5b3V0L2pzL2l0ZW0nLCBbJ291dGxheWVyL291dGxheWVyJ10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdvdXRsYXllcicpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5Jc290b3BlID0gd2luZG93Lklzb3RvcGUgfHwge307XG4gICAgd2luZG93Lklzb3RvcGUuSXRlbSA9IGZhY3Rvcnkod2luZG93Lk91dGxheWVyKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KE91dGxheWVyKSB7XG4gICd1c2Ugc3RyaWN0JzsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSXRlbSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBzdWItY2xhc3MgT3V0bGF5ZXIgSXRlbVxuXG4gIGZ1bmN0aW9uIEl0ZW0oKSB7XG4gICAgT3V0bGF5ZXIuSXRlbS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgdmFyIHByb3RvID0gSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE91dGxheWVyLkl0ZW0ucHJvdG90eXBlKTtcbiAgdmFyIF9jcmVhdGUgPSBwcm90by5fY3JlYXRlO1xuXG4gIHByb3RvLl9jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gYXNzaWduIGlkLCB1c2VkIGZvciBvcmlnaW5hbC1vcmRlciBzb3J0aW5nXG4gICAgdGhpcy5pZCA9IHRoaXMubGF5b3V0Lml0ZW1HVUlEKys7XG5cbiAgICBfY3JlYXRlLmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnNvcnREYXRhID0ge307XG4gIH07XG5cbiAgcHJvdG8udXBkYXRlU29ydERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNJZ25vcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBkZWZhdWx0IHNvcnRlcnNcblxuXG4gICAgdGhpcy5zb3J0RGF0YS5pZCA9IHRoaXMuaWQ7IC8vIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5cbiAgICB0aGlzLnNvcnREYXRhWydvcmlnaW5hbC1vcmRlciddID0gdGhpcy5pZDtcbiAgICB0aGlzLnNvcnREYXRhLnJhbmRvbSA9IE1hdGgucmFuZG9tKCk7IC8vIGdvIHRocnUgZ2V0U29ydERhdGEgb2JqIGFuZCBhcHBseSB0aGUgc29ydGVyc1xuXG4gICAgdmFyIGdldFNvcnREYXRhID0gdGhpcy5sYXlvdXQub3B0aW9ucy5nZXRTb3J0RGF0YTtcbiAgICB2YXIgc29ydGVycyA9IHRoaXMubGF5b3V0Ll9zb3J0ZXJzO1xuXG4gICAgZm9yICh2YXIga2V5IGluIGdldFNvcnREYXRhKSB7XG4gICAgICB2YXIgc29ydGVyID0gc29ydGVyc1trZXldO1xuICAgICAgdGhpcy5zb3J0RGF0YVtrZXldID0gc29ydGVyKHRoaXMuZWxlbWVudCwgdGhpcyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBfZGVzdHJveSA9IHByb3RvLmRlc3Ryb3k7XG5cbiAgcHJvdG8uZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBjYWxsIHN1cGVyXG4gICAgX2Rlc3Ryb3kuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgLy8gcmVzZXQgZGlzcGxheSwgIzc0MVxuXG5cbiAgICB0aGlzLmNzcyh7XG4gICAgICBkaXNwbGF5OiAnJ1xuICAgIH0pO1xuICB9O1xuXG4gIHJldHVybiBJdGVtO1xufSk7XG4vKipcbiAqIElzb3RvcGUgTGF5b3V0TW9kZVxuICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKmdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZScsIFsnZ2V0LXNpemUvZ2V0LXNpemUnLCAnb3V0bGF5ZXIvb3V0bGF5ZXInXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2dldC1zaXplJyksIHJlcXVpcmUoJ291dGxheWVyJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lklzb3RvcGUgPSB3aW5kb3cuSXNvdG9wZSB8fCB7fTtcbiAgICB3aW5kb3cuSXNvdG9wZS5MYXlvdXRNb2RlID0gZmFjdG9yeSh3aW5kb3cuZ2V0U2l6ZSwgd2luZG93Lk91dGxheWVyKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KGdldFNpemUsIE91dGxheWVyKSB7XG4gICd1c2Ugc3RyaWN0JzsgLy8gbGF5b3V0IG1vZGUgY2xhc3NcblxuICBmdW5jdGlvbiBMYXlvdXRNb2RlKGlzb3RvcGUpIHtcbiAgICB0aGlzLmlzb3RvcGUgPSBpc290b3BlOyAvLyBsaW5rIHByb3BlcnRpZXNcblxuICAgIGlmIChpc290b3BlKSB7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBpc290b3BlLm9wdGlvbnNbdGhpcy5uYW1lc3BhY2VdO1xuICAgICAgdGhpcy5lbGVtZW50ID0gaXNvdG9wZS5lbGVtZW50O1xuICAgICAgdGhpcy5pdGVtcyA9IGlzb3RvcGUuZmlsdGVyZWRJdGVtcztcbiAgICAgIHRoaXMuc2l6ZSA9IGlzb3RvcGUuc2l6ZTtcbiAgICB9XG4gIH1cblxuICB2YXIgcHJvdG8gPSBMYXlvdXRNb2RlLnByb3RvdHlwZTtcbiAgLyoqXG4gICAqIHNvbWUgbWV0aG9kcyBzaG91bGQganVzdCBkZWZlciB0byBkZWZhdWx0IE91dGxheWVyIG1ldGhvZFxuICAgKiBhbmQgcmVmZXJlbmNlIHRoZSBJc290b3BlIGluc3RhbmNlIGFzIGB0aGlzYFxuICAqKi9cblxuICB2YXIgZmFjYWRlTWV0aG9kcyA9IFsnX3Jlc2V0TGF5b3V0JywgJ19nZXRJdGVtTGF5b3V0UG9zaXRpb24nLCAnX21hbmFnZVN0YW1wJywgJ19nZXRDb250YWluZXJTaXplJywgJ19nZXRFbGVtZW50T2Zmc2V0JywgJ25lZWRzUmVzaXplTGF5b3V0JywgJ19nZXRPcHRpb24nXTtcbiAgZmFjYWRlTWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAgcHJvdG9bbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gT3V0bGF5ZXIucHJvdG90eXBlW21ldGhvZE5hbWVdLmFwcGx5KHRoaXMuaXNvdG9wZSwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9KTsgLy8gLS0tLS0gIC0tLS0tIC8vXG4gIC8vIGZvciBob3Jpem9udGFsIGxheW91dCBtb2RlcywgY2hlY2sgdmVydGljYWwgc2l6ZVxuXG4gIHByb3RvLm5lZWRzVmVydGljYWxSZXNpemVMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZG9uJ3QgdHJpZ2dlciBpZiBzaXplIGRpZCBub3QgY2hhbmdlXG4gICAgdmFyIHNpemUgPSBnZXRTaXplKHRoaXMuaXNvdG9wZS5lbGVtZW50KTsgLy8gY2hlY2sgdGhhdCB0aGlzLnNpemUgYW5kIHNpemUgYXJlIHRoZXJlXG4gICAgLy8gSUU4IHRyaWdnZXJzIHJlc2l6ZSBvbiBib2R5IHNpemUgY2hhbmdlLCBzbyB0aGV5IG1pZ2h0IG5vdCBiZVxuXG4gICAgdmFyIGhhc1NpemVzID0gdGhpcy5pc290b3BlLnNpemUgJiYgc2l6ZTtcbiAgICByZXR1cm4gaGFzU2l6ZXMgJiYgc2l6ZS5pbm5lckhlaWdodCAhPSB0aGlzLmlzb3RvcGUuc2l6ZS5pbm5lckhlaWdodDtcbiAgfTsgLy8gLS0tLS0gbWVhc3VyZW1lbnRzIC0tLS0tIC8vXG5cblxuICBwcm90by5fZ2V0TWVhc3VyZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc290b3BlLl9nZXRNZWFzdXJlbWVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIHByb3RvLmdldENvbHVtbldpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0U2VnbWVudFNpemUoJ2NvbHVtbicsICdXaWR0aCcpO1xuICB9O1xuXG4gIHByb3RvLmdldFJvd0hlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmdldFNlZ21lbnRTaXplKCdyb3cnLCAnSGVpZ2h0Jyk7XG4gIH07XG4gIC8qKlxuICAgKiBnZXQgY29sdW1uV2lkdGggb3Igcm93SGVpZ2h0XG4gICAqIHNlZ21lbnQ6ICdjb2x1bW4nIG9yICdyb3cnXG4gICAqIHNpemUgJ1dpZHRoJyBvciAnSGVpZ2h0J1xuICAqKi9cblxuXG4gIHByb3RvLmdldFNlZ21lbnRTaXplID0gZnVuY3Rpb24gKHNlZ21lbnQsIHNpemUpIHtcbiAgICB2YXIgc2VnbWVudE5hbWUgPSBzZWdtZW50ICsgc2l6ZTtcbiAgICB2YXIgb3V0ZXJTaXplID0gJ291dGVyJyArIHNpemU7IC8vIGNvbHVtbldpZHRoIC8gb3V0ZXJXaWR0aCAvLyByb3dIZWlnaHQgLyBvdXRlckhlaWdodFxuXG4gICAgdGhpcy5fZ2V0TWVhc3VyZW1lbnQoc2VnbWVudE5hbWUsIG91dGVyU2l6ZSk7IC8vIGdvdCByb3dIZWlnaHQgb3IgY29sdW1uV2lkdGgsIHdlIGNhbiBjaGlsbFxuXG5cbiAgICBpZiAodGhpc1tzZWdtZW50TmFtZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIGZhbGwgYmFjayB0byBpdGVtIG9mIGZpcnN0IGVsZW1lbnRcblxuXG4gICAgdmFyIGZpcnN0SXRlbVNpemUgPSB0aGlzLmdldEZpcnN0SXRlbVNpemUoKTtcbiAgICB0aGlzW3NlZ21lbnROYW1lXSA9IGZpcnN0SXRlbVNpemUgJiYgZmlyc3RJdGVtU2l6ZVtvdXRlclNpemVdIHx8IC8vIG9yIHNpemUgb2YgY29udGFpbmVyXG4gICAgdGhpcy5pc290b3BlLnNpemVbJ2lubmVyJyArIHNpemVdO1xuICB9O1xuXG4gIHByb3RvLmdldEZpcnN0SXRlbVNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZpcnN0SXRlbSA9IHRoaXMuaXNvdG9wZS5maWx0ZXJlZEl0ZW1zWzBdO1xuICAgIHJldHVybiBmaXJzdEl0ZW0gJiYgZmlyc3RJdGVtLmVsZW1lbnQgJiYgZ2V0U2l6ZShmaXJzdEl0ZW0uZWxlbWVudCk7XG4gIH07IC8vIC0tLS0tIG1ldGhvZHMgdGhhdCBzaG91bGQgcmVmZXJlbmNlIGlzb3RvcGUgLS0tLS0gLy9cblxuXG4gIHByb3RvLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlzb3RvcGUubGF5b3V0LmFwcGx5KHRoaXMuaXNvdG9wZSwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBwcm90by5nZXRTaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaXNvdG9wZS5nZXRTaXplKCk7XG4gICAgdGhpcy5zaXplID0gdGhpcy5pc290b3BlLnNpemU7XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGNyZWF0ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgTGF5b3V0TW9kZS5tb2RlcyA9IHt9O1xuXG4gIExheW91dE1vZGUuY3JlYXRlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgb3B0aW9ucykge1xuICAgIGZ1bmN0aW9uIE1vZGUoKSB7XG4gICAgICBMYXlvdXRNb2RlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgTW9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHByb3RvKTtcbiAgICBNb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vZGU7IC8vIGRlZmF1bHQgb3B0aW9uc1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIE1vZGUub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuXG4gICAgTW9kZS5wcm90b3R5cGUubmFtZXNwYWNlID0gbmFtZXNwYWNlOyAvLyByZWdpc3RlciBpbiBJc290b3BlXG5cbiAgICBMYXlvdXRNb2RlLm1vZGVzW25hbWVzcGFjZV0gPSBNb2RlO1xuICAgIHJldHVybiBNb2RlO1xuICB9O1xuXG4gIHJldHVybiBMYXlvdXRNb2RlO1xufSk7XG4vKiFcbiAqIE1hc29ucnkgdjQuMi4xXG4gKiBDYXNjYWRpbmcgZ3JpZCBsYXlvdXQgbGlicmFyeVxuICogaHR0cHM6Ly9tYXNvbnJ5LmRlc2FuZHJvLmNvbVxuICogTUlUIExpY2Vuc2VcbiAqIGJ5IERhdmlkIERlU2FuZHJvXG4gKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ21hc29ucnktbGF5b3V0L21hc29ucnknLCBbJ291dGxheWVyL291dGxheWVyJywgJ2dldC1zaXplL2dldC1zaXplJ10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKCh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YobW9kdWxlKSkgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdvdXRsYXllcicpLCByZXF1aXJlKCdnZXQtc2l6ZScpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5NYXNvbnJ5ID0gZmFjdG9yeSh3aW5kb3cuT3V0bGF5ZXIsIHdpbmRvdy5nZXRTaXplKTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KE91dGxheWVyLCBnZXRTaXplKSB7XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIG1hc29ucnlEZWZpbml0aW9uIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gIC8vIGNyZWF0ZSBhbiBPdXRsYXllciBsYXlvdXQgY2xhc3NcbiAgdmFyIE1hc29ucnkgPSBPdXRsYXllci5jcmVhdGUoJ21hc29ucnknKTsgLy8gaXNGaXRXaWR0aCAtPiBmaXRXaWR0aFxuXG4gIE1hc29ucnkuY29tcGF0T3B0aW9ucy5maXRXaWR0aCA9ICdpc0ZpdFdpZHRoJztcbiAgdmFyIHByb3RvID0gTWFzb25yeS5wcm90b3R5cGU7XG5cbiAgcHJvdG8uX3Jlc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0U2l6ZSgpO1xuXG4gICAgdGhpcy5fZ2V0TWVhc3VyZW1lbnQoJ2NvbHVtbldpZHRoJywgJ291dGVyV2lkdGgnKTtcblxuICAgIHRoaXMuX2dldE1lYXN1cmVtZW50KCdndXR0ZXInLCAnb3V0ZXJXaWR0aCcpO1xuXG4gICAgdGhpcy5tZWFzdXJlQ29sdW1ucygpOyAvLyByZXNldCBjb2x1bW4gWVxuXG4gICAgdGhpcy5jb2xZcyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvbHM7IGkrKykge1xuICAgICAgdGhpcy5jb2xZcy5wdXNoKDApO1xuICAgIH1cblxuICAgIHRoaXMubWF4WSA9IDA7XG4gICAgdGhpcy5ob3Jpem9udGFsQ29sSW5kZXggPSAwO1xuICB9O1xuXG4gIHByb3RvLm1lYXN1cmVDb2x1bW5zID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0Q29udGFpbmVyV2lkdGgoKTsgLy8gaWYgY29sdW1uV2lkdGggaXMgMCwgZGVmYXVsdCB0byBvdXRlcldpZHRoIG9mIGZpcnN0IGl0ZW1cblxuICAgIGlmICghdGhpcy5jb2x1bW5XaWR0aCkge1xuICAgICAgdmFyIGZpcnN0SXRlbSA9IHRoaXMuaXRlbXNbMF07XG4gICAgICB2YXIgZmlyc3RJdGVtRWxlbSA9IGZpcnN0SXRlbSAmJiBmaXJzdEl0ZW0uZWxlbWVudDsgLy8gY29sdW1uV2lkdGggZmFsbCBiYWNrIHRvIGl0ZW0gb2YgZmlyc3QgZWxlbWVudFxuXG4gICAgICB0aGlzLmNvbHVtbldpZHRoID0gZmlyc3RJdGVtRWxlbSAmJiBnZXRTaXplKGZpcnN0SXRlbUVsZW0pLm91dGVyV2lkdGggfHwgLy8gaWYgZmlyc3QgZWxlbSBoYXMgbm8gd2lkdGgsIGRlZmF1bHQgdG8gc2l6ZSBvZiBjb250YWluZXJcbiAgICAgIHRoaXMuY29udGFpbmVyV2lkdGg7XG4gICAgfVxuXG4gICAgdmFyIGNvbHVtbldpZHRoID0gdGhpcy5jb2x1bW5XaWR0aCArPSB0aGlzLmd1dHRlcjsgLy8gY2FsY3VsYXRlIGNvbHVtbnNcblxuICAgIHZhciBjb250YWluZXJXaWR0aCA9IHRoaXMuY29udGFpbmVyV2lkdGggKyB0aGlzLmd1dHRlcjtcbiAgICB2YXIgY29scyA9IGNvbnRhaW5lcldpZHRoIC8gY29sdW1uV2lkdGg7IC8vIGZpeCByb3VuZGluZyBlcnJvcnMsIHR5cGljYWxseSB3aXRoIGd1dHRlcnNcblxuICAgIHZhciBleGNlc3MgPSBjb2x1bW5XaWR0aCAtIGNvbnRhaW5lcldpZHRoICUgY29sdW1uV2lkdGg7IC8vIGlmIG92ZXJzaG9vdCBpcyBsZXNzIHRoYW4gYSBwaXhlbCwgcm91bmQgdXAsIG90aGVyd2lzZSBmbG9vciBpdFxuXG4gICAgdmFyIG1hdGhNZXRob2QgPSBleGNlc3MgJiYgZXhjZXNzIDwgMSA/ICdyb3VuZCcgOiAnZmxvb3InO1xuICAgIGNvbHMgPSBNYXRoW21hdGhNZXRob2RdKGNvbHMpO1xuICAgIHRoaXMuY29scyA9IE1hdGgubWF4KGNvbHMsIDEpO1xuICB9O1xuXG4gIHByb3RvLmdldENvbnRhaW5lcldpZHRoID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGNvbnRhaW5lciBpcyBwYXJlbnQgaWYgZml0IHdpZHRoXG4gICAgdmFyIGlzRml0V2lkdGggPSB0aGlzLl9nZXRPcHRpb24oJ2ZpdFdpZHRoJyk7XG5cbiAgICB2YXIgY29udGFpbmVyID0gaXNGaXRXaWR0aCA/IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlIDogdGhpcy5lbGVtZW50OyAvLyBjaGVjayB0aGF0IHRoaXMuc2l6ZSBhbmQgc2l6ZSBhcmUgdGhlcmVcbiAgICAvLyBJRTggdHJpZ2dlcnMgcmVzaXplIG9uIGJvZHkgc2l6ZSBjaGFuZ2UsIHNvIHRoZXkgbWlnaHQgbm90IGJlXG5cbiAgICB2YXIgc2l6ZSA9IGdldFNpemUoY29udGFpbmVyKTtcbiAgICB0aGlzLmNvbnRhaW5lcldpZHRoID0gc2l6ZSAmJiBzaXplLmlubmVyV2lkdGg7XG4gIH07XG5cbiAgcHJvdG8uX2dldEl0ZW1MYXlvdXRQb3NpdGlvbiA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgaXRlbS5nZXRTaXplKCk7IC8vIGhvdyBtYW55IGNvbHVtbnMgZG9lcyB0aGlzIGJyaWNrIHNwYW5cblxuICAgIHZhciByZW1haW5kZXIgPSBpdGVtLnNpemUub3V0ZXJXaWR0aCAlIHRoaXMuY29sdW1uV2lkdGg7XG4gICAgdmFyIG1hdGhNZXRob2QgPSByZW1haW5kZXIgJiYgcmVtYWluZGVyIDwgMSA/ICdyb3VuZCcgOiAnY2VpbCc7IC8vIHJvdW5kIGlmIG9mZiBieSAxIHBpeGVsLCBvdGhlcndpc2UgdXNlIGNlaWxcblxuICAgIHZhciBjb2xTcGFuID0gTWF0aFttYXRoTWV0aG9kXShpdGVtLnNpemUub3V0ZXJXaWR0aCAvIHRoaXMuY29sdW1uV2lkdGgpO1xuICAgIGNvbFNwYW4gPSBNYXRoLm1pbihjb2xTcGFuLCB0aGlzLmNvbHMpOyAvLyB1c2UgaG9yaXpvbnRhbCBvciB0b3AgY29sdW1uIHBvc2l0aW9uXG5cbiAgICB2YXIgY29sUG9zTWV0aG9kID0gdGhpcy5vcHRpb25zLmhvcml6b250YWxPcmRlciA/ICdfZ2V0SG9yaXpvbnRhbENvbFBvc2l0aW9uJyA6ICdfZ2V0VG9wQ29sUG9zaXRpb24nO1xuICAgIHZhciBjb2xQb3NpdGlvbiA9IHRoaXNbY29sUG9zTWV0aG9kXShjb2xTcGFuLCBpdGVtKTsgLy8gcG9zaXRpb24gdGhlIGJyaWNrXG5cbiAgICB2YXIgcG9zaXRpb24gPSB7XG4gICAgICB4OiB0aGlzLmNvbHVtbldpZHRoICogY29sUG9zaXRpb24uY29sLFxuICAgICAgeTogY29sUG9zaXRpb24ueVxuICAgIH07IC8vIGFwcGx5IHNldEhlaWdodCB0byBuZWNlc3NhcnkgY29sdW1uc1xuXG4gICAgdmFyIHNldEhlaWdodCA9IGNvbFBvc2l0aW9uLnkgKyBpdGVtLnNpemUub3V0ZXJIZWlnaHQ7XG4gICAgdmFyIHNldE1heCA9IGNvbFNwYW4gKyBjb2xQb3NpdGlvbi5jb2w7XG5cbiAgICBmb3IgKHZhciBpID0gY29sUG9zaXRpb24uY29sOyBpIDwgc2V0TWF4OyBpKyspIHtcbiAgICAgIHRoaXMuY29sWXNbaV0gPSBzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9O1xuXG4gIHByb3RvLl9nZXRUb3BDb2xQb3NpdGlvbiA9IGZ1bmN0aW9uIChjb2xTcGFuKSB7XG4gICAgdmFyIGNvbEdyb3VwID0gdGhpcy5fZ2V0VG9wQ29sR3JvdXAoY29sU3Bhbik7IC8vIGdldCB0aGUgbWluaW11bSBZIHZhbHVlIGZyb20gdGhlIGNvbHVtbnNcblxuXG4gICAgdmFyIG1pbmltdW1ZID0gTWF0aC5taW4uYXBwbHkoTWF0aCwgY29sR3JvdXApO1xuICAgIHJldHVybiB7XG4gICAgICBjb2w6IGNvbEdyb3VwLmluZGV4T2YobWluaW11bVkpLFxuICAgICAgeTogbWluaW11bVlcbiAgICB9O1xuICB9O1xuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvbFNwYW4gLSBudW1iZXIgb2YgY29sdW1ucyB0aGUgZWxlbWVudCBzcGFuc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9IGNvbEdyb3VwXG4gICAqL1xuXG5cbiAgcHJvdG8uX2dldFRvcENvbEdyb3VwID0gZnVuY3Rpb24gKGNvbFNwYW4pIHtcbiAgICBpZiAoY29sU3BhbiA8IDIpIHtcbiAgICAgIC8vIGlmIGJyaWNrIHNwYW5zIG9ubHkgb25lIGNvbHVtbiwgdXNlIGFsbCB0aGUgY29sdW1uIFlzXG4gICAgICByZXR1cm4gdGhpcy5jb2xZcztcbiAgICB9XG5cbiAgICB2YXIgY29sR3JvdXAgPSBbXTsgLy8gaG93IG1hbnkgZGlmZmVyZW50IHBsYWNlcyBjb3VsZCB0aGlzIGJyaWNrIGZpdCBob3Jpem9udGFsbHlcblxuICAgIHZhciBncm91cENvdW50ID0gdGhpcy5jb2xzICsgMSAtIGNvbFNwYW47IC8vIGZvciBlYWNoIGdyb3VwIHBvdGVudGlhbCBob3Jpem9udGFsIHBvc2l0aW9uXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3VwQ291bnQ7IGkrKykge1xuICAgICAgY29sR3JvdXBbaV0gPSB0aGlzLl9nZXRDb2xHcm91cFkoaSwgY29sU3Bhbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbEdyb3VwO1xuICB9O1xuXG4gIHByb3RvLl9nZXRDb2xHcm91cFkgPSBmdW5jdGlvbiAoY29sLCBjb2xTcGFuKSB7XG4gICAgaWYgKGNvbFNwYW4gPCAyKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb2xZc1tjb2xdO1xuICAgIH0gLy8gbWFrZSBhbiBhcnJheSBvZiBjb2xZIHZhbHVlcyBmb3IgdGhhdCBvbmUgZ3JvdXBcblxuXG4gICAgdmFyIGdyb3VwQ29sWXMgPSB0aGlzLmNvbFlzLnNsaWNlKGNvbCwgY29sICsgY29sU3Bhbik7IC8vIGFuZCBnZXQgdGhlIG1heCB2YWx1ZSBvZiB0aGUgYXJyYXlcblxuICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBncm91cENvbFlzKTtcbiAgfTsgLy8gZ2V0IGNvbHVtbiBwb3NpdGlvbiBiYXNlZCBvbiBob3Jpem9udGFsIGluZGV4LiAjODczXG5cblxuICBwcm90by5fZ2V0SG9yaXpvbnRhbENvbFBvc2l0aW9uID0gZnVuY3Rpb24gKGNvbFNwYW4sIGl0ZW0pIHtcbiAgICB2YXIgY29sID0gdGhpcy5ob3Jpem9udGFsQ29sSW5kZXggJSB0aGlzLmNvbHM7XG4gICAgdmFyIGlzT3ZlciA9IGNvbFNwYW4gPiAxICYmIGNvbCArIGNvbFNwYW4gPiB0aGlzLmNvbHM7IC8vIHNoaWZ0IHRvIG5leHQgcm93IGlmIGl0ZW0gY2FuJ3QgZml0IG9uIGN1cnJlbnQgcm93XG5cbiAgICBjb2wgPSBpc092ZXIgPyAwIDogY29sOyAvLyBkb24ndCBsZXQgemVyby1zaXplIGl0ZW1zIHRha2UgdXAgc3BhY2VcblxuICAgIHZhciBoYXNTaXplID0gaXRlbS5zaXplLm91dGVyV2lkdGggJiYgaXRlbS5zaXplLm91dGVySGVpZ2h0O1xuICAgIHRoaXMuaG9yaXpvbnRhbENvbEluZGV4ID0gaGFzU2l6ZSA/IGNvbCArIGNvbFNwYW4gOiB0aGlzLmhvcml6b250YWxDb2xJbmRleDtcbiAgICByZXR1cm4ge1xuICAgICAgY29sOiBjb2wsXG4gICAgICB5OiB0aGlzLl9nZXRDb2xHcm91cFkoY29sLCBjb2xTcGFuKVxuICAgIH07XG4gIH07XG5cbiAgcHJvdG8uX21hbmFnZVN0YW1wID0gZnVuY3Rpb24gKHN0YW1wKSB7XG4gICAgdmFyIHN0YW1wU2l6ZSA9IGdldFNpemUoc3RhbXApO1xuXG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX2dldEVsZW1lbnRPZmZzZXQoc3RhbXApOyAvLyBnZXQgdGhlIGNvbHVtbnMgdGhhdCB0aGlzIHN0YW1wIGFmZmVjdHNcblxuXG4gICAgdmFyIGlzT3JpZ2luTGVmdCA9IHRoaXMuX2dldE9wdGlvbignb3JpZ2luTGVmdCcpO1xuXG4gICAgdmFyIGZpcnN0WCA9IGlzT3JpZ2luTGVmdCA/IG9mZnNldC5sZWZ0IDogb2Zmc2V0LnJpZ2h0O1xuICAgIHZhciBsYXN0WCA9IGZpcnN0WCArIHN0YW1wU2l6ZS5vdXRlcldpZHRoO1xuICAgIHZhciBmaXJzdENvbCA9IE1hdGguZmxvb3IoZmlyc3RYIC8gdGhpcy5jb2x1bW5XaWR0aCk7XG4gICAgZmlyc3RDb2wgPSBNYXRoLm1heCgwLCBmaXJzdENvbCk7XG4gICAgdmFyIGxhc3RDb2wgPSBNYXRoLmZsb29yKGxhc3RYIC8gdGhpcy5jb2x1bW5XaWR0aCk7IC8vIGxhc3RDb2wgc2hvdWxkIG5vdCBnbyBvdmVyIGlmIG11bHRpcGxlIG9mIGNvbHVtbldpZHRoICM0MjVcblxuICAgIGxhc3RDb2wgLT0gbGFzdFggJSB0aGlzLmNvbHVtbldpZHRoID8gMCA6IDE7XG4gICAgbGFzdENvbCA9IE1hdGgubWluKHRoaXMuY29scyAtIDEsIGxhc3RDb2wpOyAvLyBzZXQgY29sWXMgdG8gYm90dG9tIG9mIHRoZSBzdGFtcFxuXG4gICAgdmFyIGlzT3JpZ2luVG9wID0gdGhpcy5fZ2V0T3B0aW9uKCdvcmlnaW5Ub3AnKTtcblxuICAgIHZhciBzdGFtcE1heFkgPSAoaXNPcmlnaW5Ub3AgPyBvZmZzZXQudG9wIDogb2Zmc2V0LmJvdHRvbSkgKyBzdGFtcFNpemUub3V0ZXJIZWlnaHQ7XG5cbiAgICBmb3IgKHZhciBpID0gZmlyc3RDb2w7IGkgPD0gbGFzdENvbDsgaSsrKSB7XG4gICAgICB0aGlzLmNvbFlzW2ldID0gTWF0aC5tYXgoc3RhbXBNYXhZLCB0aGlzLmNvbFlzW2ldKTtcbiAgICB9XG4gIH07XG5cbiAgcHJvdG8uX2dldENvbnRhaW5lclNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tYXhZID0gTWF0aC5tYXguYXBwbHkoTWF0aCwgdGhpcy5jb2xZcyk7XG4gICAgdmFyIHNpemUgPSB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWF4WVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5fZ2V0T3B0aW9uKCdmaXRXaWR0aCcpKSB7XG4gICAgICBzaXplLndpZHRoID0gdGhpcy5fZ2V0Q29udGFpbmVyRml0V2lkdGgoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2l6ZTtcbiAgfTtcblxuICBwcm90by5fZ2V0Q29udGFpbmVyRml0V2lkdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVudXNlZENvbHMgPSAwOyAvLyBjb3VudCB1bnVzZWQgY29sdW1uc1xuXG4gICAgdmFyIGkgPSB0aGlzLmNvbHM7XG5cbiAgICB3aGlsZSAoLS1pKSB7XG4gICAgICBpZiAodGhpcy5jb2xZc1tpXSAhPT0gMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgdW51c2VkQ29scysrO1xuICAgIH0gLy8gZml0IGNvbnRhaW5lciB0byBjb2x1bW5zIHRoYXQgaGF2ZSBiZWVuIHVzZWRcblxuXG4gICAgcmV0dXJuICh0aGlzLmNvbHMgLSB1bnVzZWRDb2xzKSAqIHRoaXMuY29sdW1uV2lkdGggLSB0aGlzLmd1dHRlcjtcbiAgfTtcblxuICBwcm90by5uZWVkc1Jlc2l6ZUxheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJldmlvdXNXaWR0aCA9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gICAgdGhpcy5nZXRDb250YWluZXJXaWR0aCgpO1xuICAgIHJldHVybiBwcmV2aW91c1dpZHRoICE9IHRoaXMuY29udGFpbmVyV2lkdGg7XG4gIH07XG5cbiAgcmV0dXJuIE1hc29ucnk7XG59KTtcbi8qIVxuICogTWFzb25yeSBsYXlvdXQgbW9kZVxuICogc3ViLWNsYXNzZXMgTWFzb25yeVxuICogaHR0cHM6Ly9tYXNvbnJ5LmRlc2FuZHJvLmNvbVxuICovXG5cblxuKGZ1bmN0aW9uICh3aW5kb3csIGZhY3RvcnkpIHtcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLyoganNoaW50IHN0cmljdDogZmFsc2UgKi9cblxuICAvKmdsb2JhbHMgZGVmaW5lLCBtb2R1bGUsIHJlcXVpcmUgKi9cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZXMvbWFzb25yeScsIFsnLi4vbGF5b3V0LW1vZGUnLCAnbWFzb25yeS1sYXlvdXQvbWFzb25yeSddLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi4vbGF5b3V0LW1vZGUnKSwgcmVxdWlyZSgnbWFzb25yeS1sYXlvdXQnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdy5Jc290b3BlLkxheW91dE1vZGUsIHdpbmRvdy5NYXNvbnJ5KTtcbiAgfVxufSkod2luZG93LCBmdW5jdGlvbiBmYWN0b3J5KExheW91dE1vZGUsIE1hc29ucnkpIHtcbiAgJ3VzZSBzdHJpY3QnOyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBtYXNvbnJ5RGVmaW5pdGlvbiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBjcmVhdGUgYW4gT3V0bGF5ZXIgbGF5b3V0IGNsYXNzXG5cbiAgdmFyIE1hc29ucnlNb2RlID0gTGF5b3V0TW9kZS5jcmVhdGUoJ21hc29ucnknKTtcbiAgdmFyIHByb3RvID0gTWFzb25yeU1vZGUucHJvdG90eXBlO1xuICB2YXIga2VlcE1vZGVNZXRob2RzID0ge1xuICAgIF9nZXRFbGVtZW50T2Zmc2V0OiB0cnVlLFxuICAgIGxheW91dDogdHJ1ZSxcbiAgICBfZ2V0TWVhc3VyZW1lbnQ6IHRydWVcbiAgfTsgLy8gaW5oZXJpdCBNYXNvbnJ5IHByb3RvdHlwZVxuXG4gIGZvciAodmFyIG1ldGhvZCBpbiBNYXNvbnJ5LnByb3RvdHlwZSkge1xuICAgIC8vIGRvIG5vdCBpbmhlcml0IG1vZGUgbWV0aG9kc1xuICAgIGlmICgha2VlcE1vZGVNZXRob2RzW21ldGhvZF0pIHtcbiAgICAgIHByb3RvW21ldGhvZF0gPSBNYXNvbnJ5LnByb3RvdHlwZVttZXRob2RdO1xuICAgIH1cbiAgfVxuXG4gIHZhciBtZWFzdXJlQ29sdW1ucyA9IHByb3RvLm1lYXN1cmVDb2x1bW5zO1xuXG4gIHByb3RvLm1lYXN1cmVDb2x1bW5zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHNldCBpdGVtcywgdXNlZCBpZiBtZWFzdXJpbmcgZmlyc3QgaXRlbVxuICAgIHRoaXMuaXRlbXMgPSB0aGlzLmlzb3RvcGUuZmlsdGVyZWRJdGVtcztcbiAgICBtZWFzdXJlQ29sdW1ucy5jYWxsKHRoaXMpO1xuICB9OyAvLyBwb2ludCB0byBtb2RlIG9wdGlvbnMgZm9yIGZpdFdpZHRoXG5cblxuICB2YXIgX2dldE9wdGlvbiA9IHByb3RvLl9nZXRPcHRpb247XG5cbiAgcHJvdG8uX2dldE9wdGlvbiA9IGZ1bmN0aW9uIChvcHRpb24pIHtcbiAgICBpZiAob3B0aW9uID09ICdmaXRXaWR0aCcpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaXNGaXRXaWR0aCAhPT0gdW5kZWZpbmVkID8gdGhpcy5vcHRpb25zLmlzRml0V2lkdGggOiB0aGlzLm9wdGlvbnMuZml0V2lkdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9nZXRPcHRpb24uYXBwbHkodGhpcy5pc290b3BlLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIHJldHVybiBNYXNvbnJ5TW9kZTtcbn0pO1xuLyoqXG4gKiBmaXRSb3dzIGxheW91dCBtb2RlXG4gKi9cblxuXG4oZnVuY3Rpb24gKHdpbmRvdywgZmFjdG9yeSkge1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKiBqc2hpbnQgc3RyaWN0OiBmYWxzZSAqL1xuXG4gIC8qZ2xvYmFscyBkZWZpbmUsIG1vZHVsZSwgcmVxdWlyZSAqL1xuICBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoJ2lzb3RvcGUtbGF5b3V0L2pzL2xheW91dC1tb2Rlcy9maXQtcm93cycsIFsnLi4vbGF5b3V0LW1vZGUnXSwgZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBleHBvcnRzID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2YoZXhwb3J0cykpID09ICdvYmplY3QnKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi4vbGF5b3V0LW1vZGUnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdy5Jc290b3BlLkxheW91dE1vZGUpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoTGF5b3V0TW9kZSkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIEZpdFJvd3MgPSBMYXlvdXRNb2RlLmNyZWF0ZSgnZml0Um93cycpO1xuICB2YXIgcHJvdG8gPSBGaXRSb3dzLnByb3RvdHlwZTtcblxuICBwcm90by5fcmVzZXRMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMubWF4WSA9IDA7XG5cbiAgICB0aGlzLl9nZXRNZWFzdXJlbWVudCgnZ3V0dGVyJywgJ291dGVyV2lkdGgnKTtcbiAgfTtcblxuICBwcm90by5fZ2V0SXRlbUxheW91dFBvc2l0aW9uID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBpdGVtLmdldFNpemUoKTtcbiAgICB2YXIgaXRlbVdpZHRoID0gaXRlbS5zaXplLm91dGVyV2lkdGggKyB0aGlzLmd1dHRlcjsgLy8gaWYgdGhpcyBlbGVtZW50IGNhbm5vdCBmaXQgaW4gdGhlIGN1cnJlbnQgcm93XG5cbiAgICB2YXIgY29udGFpbmVyV2lkdGggPSB0aGlzLmlzb3RvcGUuc2l6ZS5pbm5lcldpZHRoICsgdGhpcy5ndXR0ZXI7XG5cbiAgICBpZiAodGhpcy54ICE9PSAwICYmIGl0ZW1XaWR0aCArIHRoaXMueCA+IGNvbnRhaW5lcldpZHRoKSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gdGhpcy5tYXhZO1xuICAgIH1cblxuICAgIHZhciBwb3NpdGlvbiA9IHtcbiAgICAgIHg6IHRoaXMueCxcbiAgICAgIHk6IHRoaXMueVxuICAgIH07XG4gICAgdGhpcy5tYXhZID0gTWF0aC5tYXgodGhpcy5tYXhZLCB0aGlzLnkgKyBpdGVtLnNpemUub3V0ZXJIZWlnaHQpO1xuICAgIHRoaXMueCArPSBpdGVtV2lkdGg7XG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9O1xuXG4gIHByb3RvLl9nZXRDb250YWluZXJTaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWF4WVxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIEZpdFJvd3M7XG59KTtcbi8qKlxuICogdmVydGljYWwgbGF5b3V0IG1vZGVcbiAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovXG5cbiAgLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSgnaXNvdG9wZS1sYXlvdXQvanMvbGF5b3V0LW1vZGVzL3ZlcnRpY2FsJywgWycuLi9sYXlvdXQtbW9kZSddLCBmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICgodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKG1vZHVsZSkpID09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi4vbGF5b3V0LW1vZGUnKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICBmYWN0b3J5KHdpbmRvdy5Jc290b3BlLkxheW91dE1vZGUpO1xuICB9XG59KSh3aW5kb3csIGZ1bmN0aW9uIGZhY3RvcnkoTGF5b3V0TW9kZSkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIFZlcnRpY2FsID0gTGF5b3V0TW9kZS5jcmVhdGUoJ3ZlcnRpY2FsJywge1xuICAgIGhvcml6b250YWxBbGlnbm1lbnQ6IDBcbiAgfSk7XG4gIHZhciBwcm90byA9IFZlcnRpY2FsLnByb3RvdHlwZTtcblxuICBwcm90by5fcmVzZXRMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy55ID0gMDtcbiAgfTtcblxuICBwcm90by5fZ2V0SXRlbUxheW91dFBvc2l0aW9uID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBpdGVtLmdldFNpemUoKTtcbiAgICB2YXIgeCA9ICh0aGlzLmlzb3RvcGUuc2l6ZS5pbm5lcldpZHRoIC0gaXRlbS5zaXplLm91dGVyV2lkdGgpICogdGhpcy5vcHRpb25zLmhvcml6b250YWxBbGlnbm1lbnQ7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdGhpcy55ICs9IGl0ZW0uc2l6ZS5vdXRlckhlaWdodDtcbiAgICByZXR1cm4ge1xuICAgICAgeDogeCxcbiAgICAgIHk6IHlcbiAgICB9O1xuICB9O1xuXG4gIHByb3RvLl9nZXRDb250YWluZXJTaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMueVxuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIFZlcnRpY2FsO1xufSk7XG4vKiFcbiAqIElzb3RvcGUgdjMuMC42XG4gKlxuICogTGljZW5zZWQgR1BMdjMgZm9yIG9wZW4gc291cmNlIHVzZVxuICogb3IgSXNvdG9wZSBDb21tZXJjaWFsIExpY2Vuc2UgZm9yIGNvbW1lcmNpYWwgdXNlXG4gKlxuICogaHR0cHM6Ly9pc290b3BlLm1ldGFmaXp6eS5jb1xuICogQ29weXJpZ2h0IDIwMTAtMjAxOCBNZXRhZml6enlcbiAqL1xuXG5cbihmdW5jdGlvbiAod2luZG93LCBmYWN0b3J5KSB7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qIGpzaGludCBzdHJpY3Q6IGZhbHNlICovXG5cbiAgLypnbG9iYWxzIGRlZmluZSwgbW9kdWxlLCByZXF1aXJlICovXG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZShbJ291dGxheWVyL291dGxheWVyJywgJ2dldC1zaXplL2dldC1zaXplJywgJ2Rlc2FuZHJvLW1hdGNoZXMtc2VsZWN0b3IvbWF0Y2hlcy1zZWxlY3RvcicsICdmaXp6eS11aS11dGlscy91dGlscycsICdpc290b3BlLWxheW91dC9qcy9pdGVtJywgJ2lzb3RvcGUtbGF5b3V0L2pzL2xheW91dC1tb2RlJywgLy8gaW5jbHVkZSBkZWZhdWx0IGxheW91dCBtb2Rlc1xuICAgICdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZXMvbWFzb25yeScsICdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZXMvZml0LXJvd3MnLCAnaXNvdG9wZS1sYXlvdXQvanMvbGF5b3V0LW1vZGVzL3ZlcnRpY2FsJ10sIGZ1bmN0aW9uIChPdXRsYXllciwgZ2V0U2l6ZSwgbWF0Y2hlc1NlbGVjdG9yLCB1dGlscywgSXRlbSwgTGF5b3V0TW9kZSkge1xuICAgICAgcmV0dXJuIGZhY3Rvcnkod2luZG93LCBPdXRsYXllciwgZ2V0U2l6ZSwgbWF0Y2hlc1NlbGVjdG9yLCB1dGlscywgSXRlbSwgTGF5b3V0TW9kZSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihtb2R1bGUpKSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHdpbmRvdywgcmVxdWlyZSgnb3V0bGF5ZXInKSwgcmVxdWlyZSgnZ2V0LXNpemUnKSwgcmVxdWlyZSgnZGVzYW5kcm8tbWF0Y2hlcy1zZWxlY3RvcicpLCByZXF1aXJlKCdmaXp6eS11aS11dGlscycpLCByZXF1aXJlKCdpc290b3BlLWxheW91dC9qcy9pdGVtJyksIHJlcXVpcmUoJ2lzb3RvcGUtbGF5b3V0L2pzL2xheW91dC1tb2RlJyksIC8vIGluY2x1ZGUgZGVmYXVsdCBsYXlvdXQgbW9kZXNcbiAgICByZXF1aXJlKCdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZXMvbWFzb25yeScpLCByZXF1aXJlKCdpc290b3BlLWxheW91dC9qcy9sYXlvdXQtbW9kZXMvZml0LXJvd3MnKSwgcmVxdWlyZSgnaXNvdG9wZS1sYXlvdXQvanMvbGF5b3V0LW1vZGVzL3ZlcnRpY2FsJykpO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93Lklzb3RvcGUgPSBmYWN0b3J5KHdpbmRvdywgd2luZG93Lk91dGxheWVyLCB3aW5kb3cuZ2V0U2l6ZSwgd2luZG93Lm1hdGNoZXNTZWxlY3Rvciwgd2luZG93LmZpenp5VUlVdGlscywgd2luZG93Lklzb3RvcGUuSXRlbSwgd2luZG93Lklzb3RvcGUuTGF5b3V0TW9kZSk7XG4gIH1cbn0pKHdpbmRvdywgZnVuY3Rpb24gZmFjdG9yeSh3aW5kb3csIE91dGxheWVyLCBnZXRTaXplLCBtYXRjaGVzU2VsZWN0b3IsIHV0aWxzLCBJdGVtLCBMYXlvdXRNb2RlKSB7XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHZhcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgdmFyIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICB2YXIgdHJpbSA9IFN0cmluZy5wcm90b3R5cGUudHJpbSA/IGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRyaW0oKTtcbiAgfSA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaXNvdG9wZURlZmluaXRpb24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgLy8gY3JlYXRlIGFuIE91dGxheWVyIGxheW91dCBjbGFzc1xuXG4gIHZhciBJc290b3BlID0gT3V0bGF5ZXIuY3JlYXRlKCdpc290b3BlJywge1xuICAgIGxheW91dE1vZGU6ICdtYXNvbnJ5JyxcbiAgICBpc0pRdWVyeUZpbHRlcmluZzogdHJ1ZSxcbiAgICBzb3J0QXNjZW5kaW5nOiB0cnVlXG4gIH0pO1xuICBJc290b3BlLkl0ZW0gPSBJdGVtO1xuICBJc290b3BlLkxheW91dE1vZGUgPSBMYXlvdXRNb2RlO1xuICB2YXIgcHJvdG8gPSBJc290b3BlLnByb3RvdHlwZTtcblxuICBwcm90by5fY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaXRlbUdVSUQgPSAwOyAvLyBmdW5jdGlvbnMgdGhhdCBzb3J0IGl0ZW1zXG5cbiAgICB0aGlzLl9zb3J0ZXJzID0ge307XG5cbiAgICB0aGlzLl9nZXRTb3J0ZXJzKCk7IC8vIGNhbGwgc3VwZXJcblxuXG4gICAgT3V0bGF5ZXIucHJvdG90eXBlLl9jcmVhdGUuY2FsbCh0aGlzKTsgLy8gY3JlYXRlIGxheW91dCBtb2Rlc1xuXG5cbiAgICB0aGlzLm1vZGVzID0ge307IC8vIHN0YXJ0IGZpbHRlcmVkSXRlbXMgd2l0aCBhbGwgaXRlbXNcblxuICAgIHRoaXMuZmlsdGVyZWRJdGVtcyA9IHRoaXMuaXRlbXM7IC8vIGtlZXAgb2YgdHJhY2sgb2Ygc29ydEJ5c1xuXG4gICAgdGhpcy5zb3J0SGlzdG9yeSA9IFsnb3JpZ2luYWwtb3JkZXInXTsgLy8gY3JlYXRlIGZyb20gcmVnaXN0ZXJlZCBsYXlvdXQgbW9kZXNcblxuICAgIGZvciAodmFyIG5hbWUgaW4gTGF5b3V0TW9kZS5tb2Rlcykge1xuICAgICAgdGhpcy5faW5pdExheW91dE1vZGUobmFtZSk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLnJlbG9hZEl0ZW1zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHJlc2V0IGl0ZW0gSUQgY291bnRlclxuICAgIHRoaXMuaXRlbUdVSUQgPSAwOyAvLyBjYWxsIHN1cGVyXG5cbiAgICBPdXRsYXllci5wcm90b3R5cGUucmVsb2FkSXRlbXMuY2FsbCh0aGlzKTtcbiAgfTtcblxuICBwcm90by5faXRlbWl6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaXRlbXMgPSBPdXRsYXllci5wcm90b3R5cGUuX2l0ZW1pemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgLy8gYXNzaWduIElEIGZvciBvcmlnaW5hbC1vcmRlclxuXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgaXRlbS5pZCA9IHRoaXMuaXRlbUdVSUQrKztcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVJdGVtc1NvcnREYXRhKGl0ZW1zKTtcblxuICAgIHJldHVybiBpdGVtcztcbiAgfTsgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbGF5b3V0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cblxuICBwcm90by5faW5pdExheW91dE1vZGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBNb2RlID0gTGF5b3V0TW9kZS5tb2Rlc1tuYW1lXTsgLy8gc2V0IG1vZGUgb3B0aW9uc1xuICAgIC8vIEhBQ0sgZXh0ZW5kIGluaXRpYWwgb3B0aW9ucywgYmFjay1maWxsIGluIGRlZmF1bHQgb3B0aW9uc1xuXG4gICAgdmFyIGluaXRpYWxPcHRzID0gdGhpcy5vcHRpb25zW25hbWVdIHx8IHt9O1xuICAgIHRoaXMub3B0aW9uc1tuYW1lXSA9IE1vZGUub3B0aW9ucyA/IHV0aWxzLmV4dGVuZChNb2RlLm9wdGlvbnMsIGluaXRpYWxPcHRzKSA6IGluaXRpYWxPcHRzOyAvLyBpbml0IGxheW91dCBtb2RlIGluc3RhbmNlXG5cbiAgICB0aGlzLm1vZGVzW25hbWVdID0gbmV3IE1vZGUodGhpcyk7XG4gIH07XG5cbiAgcHJvdG8ubGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGlmIGZpcnN0IHRpbWUgZG9pbmcgbGF5b3V0LCBkbyBhbGwgbWFnaWNcbiAgICBpZiAoIXRoaXMuX2lzTGF5b3V0SW5pdGVkICYmIHRoaXMuX2dldE9wdGlvbignaW5pdExheW91dCcpKSB7XG4gICAgICB0aGlzLmFycmFuZ2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9sYXlvdXQoKTtcbiAgfTsgLy8gcHJpdmF0ZSBtZXRob2QgdG8gYmUgdXNlZCBpbiBsYXlvdXQoKSAmIG1hZ2ljKClcblxuXG4gIHByb3RvLl9sYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZG9uJ3QgYW5pbWF0ZSBmaXJzdCBsYXlvdXRcbiAgICB2YXIgaXNJbnN0YW50ID0gdGhpcy5fZ2V0SXNJbnN0YW50KCk7IC8vIGxheW91dCBmbG93XG5cblxuICAgIHRoaXMuX3Jlc2V0TGF5b3V0KCk7XG5cbiAgICB0aGlzLl9tYW5hZ2VTdGFtcHMoKTtcblxuICAgIHRoaXMubGF5b3V0SXRlbXModGhpcy5maWx0ZXJlZEl0ZW1zLCBpc0luc3RhbnQpOyAvLyBmbGFnIGZvciBpbml0YWxpemVkXG5cbiAgICB0aGlzLl9pc0xheW91dEluaXRlZCA9IHRydWU7XG4gIH07IC8vIGZpbHRlciArIHNvcnQgKyBsYXlvdXRcblxuXG4gIHByb3RvLmFycmFuZ2UgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIC8vIHNldCBhbnkgb3B0aW9ucyBwYXNzXG4gICAgdGhpcy5vcHRpb24ob3B0cyk7XG5cbiAgICB0aGlzLl9nZXRJc0luc3RhbnQoKTsgLy8gZmlsdGVyLCBzb3J0LCBhbmQgbGF5b3V0XG4gICAgLy8gZmlsdGVyXG5cblxuICAgIHZhciBmaWx0ZXJlZCA9IHRoaXMuX2ZpbHRlcih0aGlzLml0ZW1zKTtcblxuICAgIHRoaXMuZmlsdGVyZWRJdGVtcyA9IGZpbHRlcmVkLm1hdGNoZXM7XG5cbiAgICB0aGlzLl9iaW5kQXJyYW5nZUNvbXBsZXRlKCk7XG5cbiAgICBpZiAodGhpcy5faXNJbnN0YW50KSB7XG4gICAgICB0aGlzLl9ub1RyYW5zaXRpb24odGhpcy5faGlkZVJldmVhbCwgW2ZpbHRlcmVkXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2hpZGVSZXZlYWwoZmlsdGVyZWQpO1xuICAgIH1cblxuICAgIHRoaXMuX3NvcnQoKTtcblxuICAgIHRoaXMuX2xheW91dCgpO1xuICB9OyAvLyBhbGlhcyB0byBfaW5pdCBmb3IgbWFpbiBwbHVnaW4gbWV0aG9kXG5cblxuICBwcm90by5faW5pdCA9IHByb3RvLmFycmFuZ2U7XG5cbiAgcHJvdG8uX2hpZGVSZXZlYWwgPSBmdW5jdGlvbiAoZmlsdGVyZWQpIHtcbiAgICB0aGlzLnJldmVhbChmaWx0ZXJlZC5uZWVkUmV2ZWFsKTtcbiAgICB0aGlzLmhpZGUoZmlsdGVyZWQubmVlZEhpZGUpO1xuICB9OyAvLyBIQUNLXG4gIC8vIERvbid0IGFuaW1hdGUvdHJhbnNpdGlvbiBmaXJzdCBsYXlvdXRcbiAgLy8gT3IgZG9uJ3QgYW5pbWF0ZS90cmFuc2l0aW9uIG90aGVyIGxheW91dHNcblxuXG4gIHByb3RvLl9nZXRJc0luc3RhbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlzTGF5b3V0SW5zdGFudCA9IHRoaXMuX2dldE9wdGlvbignbGF5b3V0SW5zdGFudCcpO1xuXG4gICAgdmFyIGlzSW5zdGFudCA9IGlzTGF5b3V0SW5zdGFudCAhPT0gdW5kZWZpbmVkID8gaXNMYXlvdXRJbnN0YW50IDogIXRoaXMuX2lzTGF5b3V0SW5pdGVkO1xuICAgIHRoaXMuX2lzSW5zdGFudCA9IGlzSW5zdGFudDtcbiAgICByZXR1cm4gaXNJbnN0YW50O1xuICB9OyAvLyBsaXN0ZW4gZm9yIGxheW91dENvbXBsZXRlLCBoaWRlQ29tcGxldGUgYW5kIHJldmVhbENvbXBsZXRlXG4gIC8vIHRvIHRyaWdnZXIgYXJyYW5nZUNvbXBsZXRlXG5cblxuICBwcm90by5fYmluZEFycmFuZ2VDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaXN0ZW4gZm9yIDMgZXZlbnRzIHRvIHRyaWdnZXIgYXJyYW5nZUNvbXBsZXRlXG4gICAgdmFyIGlzTGF5b3V0Q29tcGxldGUsIGlzSGlkZUNvbXBsZXRlLCBpc1JldmVhbENvbXBsZXRlO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGFycmFuZ2VQYXJhbGxlbENhbGxiYWNrKCkge1xuICAgICAgaWYgKGlzTGF5b3V0Q29tcGxldGUgJiYgaXNIaWRlQ29tcGxldGUgJiYgaXNSZXZlYWxDb21wbGV0ZSkge1xuICAgICAgICBfdGhpcy5kaXNwYXRjaEV2ZW50KCdhcnJhbmdlQ29tcGxldGUnLCBudWxsLCBbX3RoaXMuZmlsdGVyZWRJdGVtc10pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub25jZSgnbGF5b3V0Q29tcGxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpc0xheW91dENvbXBsZXRlID0gdHJ1ZTtcbiAgICAgIGFycmFuZ2VQYXJhbGxlbENhbGxiYWNrKCk7XG4gICAgfSk7XG4gICAgdGhpcy5vbmNlKCdoaWRlQ29tcGxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpc0hpZGVDb21wbGV0ZSA9IHRydWU7XG4gICAgICBhcnJhbmdlUGFyYWxsZWxDYWxsYmFjaygpO1xuICAgIH0pO1xuICAgIHRoaXMub25jZSgncmV2ZWFsQ29tcGxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpc1JldmVhbENvbXBsZXRlID0gdHJ1ZTtcbiAgICAgIGFycmFuZ2VQYXJhbGxlbENhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGZpbHRlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5cbiAgcHJvdG8uX2ZpbHRlciA9IGZ1bmN0aW9uIChpdGVtcykge1xuICAgIHZhciBmaWx0ZXIgPSB0aGlzLm9wdGlvbnMuZmlsdGVyO1xuICAgIGZpbHRlciA9IGZpbHRlciB8fCAnKic7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICB2YXIgaGlkZGVuTWF0Y2hlZCA9IFtdO1xuICAgIHZhciB2aXNpYmxlVW5tYXRjaGVkID0gW107XG5cbiAgICB2YXIgdGVzdCA9IHRoaXMuX2dldEZpbHRlclRlc3QoZmlsdGVyKTsgLy8gdGVzdCBlYWNoIGl0ZW1cblxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tpXTtcblxuICAgICAgaWYgKGl0ZW0uaXNJZ25vcmVkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSAvLyBhZGQgaXRlbSB0byBlaXRoZXIgbWF0Y2hlZCBvciB1bm1hdGNoZWQgZ3JvdXBcblxuXG4gICAgICB2YXIgaXNNYXRjaGVkID0gdGVzdChpdGVtKTsgLy8gaXRlbS5pc0ZpbHRlck1hdGNoZWQgPSBpc01hdGNoZWQ7XG4gICAgICAvLyBhZGQgdG8gbWF0Y2hlcyBpZiBpdHMgYSBtYXRjaFxuXG4gICAgICBpZiAoaXNNYXRjaGVkKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChpdGVtKTtcbiAgICAgIH0gLy8gYWRkIHRvIGFkZGl0aW9uYWwgZ3JvdXAgaWYgaXRlbSBuZWVkcyB0byBiZSBoaWRkZW4gb3IgcmV2ZWFsZWRcblxuXG4gICAgICBpZiAoaXNNYXRjaGVkICYmIGl0ZW0uaXNIaWRkZW4pIHtcbiAgICAgICAgaGlkZGVuTWF0Y2hlZC5wdXNoKGl0ZW0pO1xuICAgICAgfSBlbHNlIGlmICghaXNNYXRjaGVkICYmICFpdGVtLmlzSGlkZGVuKSB7XG4gICAgICAgIHZpc2libGVVbm1hdGNoZWQucHVzaChpdGVtKTtcbiAgICAgIH1cbiAgICB9IC8vIHJldHVybiBjb2xsZWN0aW9ucyBvZiBpdGVtcyB0byBiZSBtYW5pcHVsYXRlZFxuXG5cbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlczogbWF0Y2hlcyxcbiAgICAgIG5lZWRSZXZlYWw6IGhpZGRlbk1hdGNoZWQsXG4gICAgICBuZWVkSGlkZTogdmlzaWJsZVVubWF0Y2hlZFxuICAgIH07XG4gIH07IC8vIGdldCBhIGpRdWVyeSwgZnVuY3Rpb24sIG9yIGEgbWF0Y2hlc1NlbGVjdG9yIHRlc3QgZ2l2ZW4gdGhlIGZpbHRlclxuXG5cbiAgcHJvdG8uX2dldEZpbHRlclRlc3QgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgaWYgKGpRdWVyeSAmJiB0aGlzLm9wdGlvbnMuaXNKUXVlcnlGaWx0ZXJpbmcpIHtcbiAgICAgIC8vIHVzZSBqUXVlcnlcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4galF1ZXJ5KGl0ZW0uZWxlbWVudCkuaXMoZmlsdGVyKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gdXNlIGZpbHRlciBhcyBmdW5jdGlvblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIoaXRlbS5lbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSAvLyBkZWZhdWx0LCB1c2UgZmlsdGVyIGFzIHNlbGVjdG9yIHN0cmluZ1xuXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBtYXRjaGVzU2VsZWN0b3IoaXRlbS5lbGVtZW50LCBmaWx0ZXIpO1xuICAgIH07XG4gIH07IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHNvcnRpbmcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQHBhcmFtcyB7QXJyYXl9IGVsZW1zXG4gICAqIEBwdWJsaWNcbiAgICovXG5cblxuICBwcm90by51cGRhdGVTb3J0RGF0YSA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIC8vIGdldCBpdGVtc1xuICAgIHZhciBpdGVtcztcblxuICAgIGlmIChlbGVtcykge1xuICAgICAgZWxlbXMgPSB1dGlscy5tYWtlQXJyYXkoZWxlbXMpO1xuICAgICAgaXRlbXMgPSB0aGlzLmdldEl0ZW1zKGVsZW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdXBkYXRlIGFsbCBpdGVtcyBpZiBubyBlbGVtcyBwcm92aWRlZFxuICAgICAgaXRlbXMgPSB0aGlzLml0ZW1zO1xuICAgIH1cblxuICAgIHRoaXMuX2dldFNvcnRlcnMoKTtcblxuICAgIHRoaXMuX3VwZGF0ZUl0ZW1zU29ydERhdGEoaXRlbXMpO1xuICB9O1xuXG4gIHByb3RvLl9nZXRTb3J0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBnZXRTb3J0RGF0YSA9IHRoaXMub3B0aW9ucy5nZXRTb3J0RGF0YTtcblxuICAgIGZvciAodmFyIGtleSBpbiBnZXRTb3J0RGF0YSkge1xuICAgICAgdmFyIHNvcnRlciA9IGdldFNvcnREYXRhW2tleV07XG4gICAgICB0aGlzLl9zb3J0ZXJzW2tleV0gPSBtdW5nZVNvcnRlcihzb3J0ZXIpO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbXMge0FycmF5fSBpdGVtcyAtIG9mIElzb3RvcGUuSXRlbXNcbiAgICogQHByaXZhdGVcbiAgICovXG5cblxuICBwcm90by5fdXBkYXRlSXRlbXNTb3J0RGF0YSA9IGZ1bmN0aW9uIChpdGVtcykge1xuICAgIC8vIGRvIG5vdCB1cGRhdGUgaWYgbm8gaXRlbXNcbiAgICB2YXIgbGVuID0gaXRlbXMgJiYgaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGxlbiAmJiBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gaXRlbXNbaV07XG4gICAgICBpdGVtLnVwZGF0ZVNvcnREYXRhKCk7XG4gICAgfVxuICB9OyAvLyAtLS0tLSBtdW5nZSBzb3J0ZXIgLS0tLS0gLy9cbiAgLy8gZW5jYXBzdWxhdGUgdGhpcywgYXMgd2UganVzdCBuZWVkIG11bmdlU29ydGVyXG4gIC8vIG90aGVyIGZ1bmN0aW9ucyBpbiBoZXJlIGFyZSBqdXN0IGZvciBtdW5naW5nXG5cblxuICB2YXIgbXVuZ2VTb3J0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gYWRkIGEgbWFnaWMgbGF5ZXIgdG8gc29ydGVycyBmb3IgY29udmllbmVudCBzaG9ydGhhbmRzXG4gICAgLy8gYC5mb28tYmFyYCB3aWxsIHVzZSB0aGUgdGV4dCBvZiAuZm9vLWJhciBxdWVyeVNlbGVjdG9yXG4gICAgLy8gYFtmb28tYmFyXWAgd2lsbCB1c2UgYXR0cmlidXRlXG4gICAgLy8geW91IGNhbiBhbHNvIGFkZCBwYXJzZXJcbiAgICAvLyBgLmZvby1iYXIgcGFyc2VJbnRgIHdpbGwgcGFyc2UgdGhhdCBhcyBhIG51bWJlclxuICAgIGZ1bmN0aW9uIG11bmdlU29ydGVyKHNvcnRlcikge1xuICAgICAgLy8gaWYgbm90IGEgc3RyaW5nLCByZXR1cm4gZnVuY3Rpb24gb3Igd2hhdGV2ZXIgaXQgaXNcbiAgICAgIGlmICh0eXBlb2Ygc29ydGVyICE9ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBzb3J0ZXI7XG4gICAgICB9IC8vIHBhcnNlIHRoZSBzb3J0ZXIgc3RyaW5nXG5cblxuICAgICAgdmFyIGFyZ3MgPSB0cmltKHNvcnRlcikuc3BsaXQoJyAnKTtcbiAgICAgIHZhciBxdWVyeSA9IGFyZ3NbMF07IC8vIGNoZWNrIGlmIHF1ZXJ5IGxvb2tzIGxpa2UgW2FuLWF0dHJpYnV0ZV1cblxuICAgICAgdmFyIGF0dHJNYXRjaCA9IHF1ZXJ5Lm1hdGNoKC9eXFxbKC4rKVxcXSQvKTtcbiAgICAgIHZhciBhdHRyID0gYXR0ck1hdGNoICYmIGF0dHJNYXRjaFsxXTtcbiAgICAgIHZhciBnZXRWYWx1ZSA9IGdldFZhbHVlR2V0dGVyKGF0dHIsIHF1ZXJ5KTsgLy8gdXNlIHNlY29uZCBhcmd1bWVudCBhcyBhIHBhcnNlclxuXG4gICAgICB2YXIgcGFyc2VyID0gSXNvdG9wZS5zb3J0RGF0YVBhcnNlcnNbYXJnc1sxXV07IC8vIHBhcnNlIHRoZSB2YWx1ZSwgaWYgdGhlcmUgd2FzIGEgcGFyc2VyXG5cbiAgICAgIHNvcnRlciA9IHBhcnNlciA/IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIHJldHVybiBlbGVtICYmIHBhcnNlcihnZXRWYWx1ZShlbGVtKSk7XG4gICAgICB9IDogLy8gb3RoZXJ3aXNlIGp1c3QgcmV0dXJuIHZhbHVlXG4gICAgICBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICByZXR1cm4gZWxlbSAmJiBnZXRWYWx1ZShlbGVtKTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gc29ydGVyO1xuICAgIH0gLy8gZ2V0IGFuIGF0dHJpYnV0ZSBnZXR0ZXIsIG9yIGdldCB0ZXh0IG9mIHRoZSBxdWVyeVNlbGVjdG9yXG5cblxuICAgIGZ1bmN0aW9uIGdldFZhbHVlR2V0dGVyKGF0dHIsIHF1ZXJ5KSB7XG4gICAgICAvLyBpZiBxdWVyeSBsb29rcyBsaWtlIFtmb28tYmFyXSwgZ2V0IGF0dHJpYnV0ZVxuICAgICAgaWYgKGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZShlbGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKGF0dHIpO1xuICAgICAgICB9O1xuICAgICAgfSAvLyBvdGhlcndpc2UsIGFzc3VtZSBpdHMgYSBxdWVyeVNlbGVjdG9yLCBhbmQgZ2V0IGl0cyB0ZXh0XG5cblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGdldENoaWxkVGV4dChlbGVtKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGVsZW0ucXVlcnlTZWxlY3RvcihxdWVyeSk7XG4gICAgICAgIHJldHVybiBjaGlsZCAmJiBjaGlsZC50ZXh0Q29udGVudDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG11bmdlU29ydGVyO1xuICB9KCk7IC8vIHBhcnNlcnMgdXNlZCBpbiBnZXRTb3J0RGF0YSBzaG9ydGN1dCBzdHJpbmdzXG5cblxuICBJc290b3BlLnNvcnREYXRhUGFyc2VycyA9IHtcbiAgICAncGFyc2VJbnQnOiBmdW5jdGlvbiAoX3BhcnNlSW50KSB7XG4gICAgICBmdW5jdGlvbiBwYXJzZUludChfeCkge1xuICAgICAgICByZXR1cm4gX3BhcnNlSW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG5cbiAgICAgIHBhcnNlSW50LnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3BhcnNlSW50LnRvU3RyaW5nKCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcGFyc2VJbnQ7XG4gICAgfShmdW5jdGlvbiAodmFsKSB7XG4gICAgICByZXR1cm4gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgfSksXG4gICAgJ3BhcnNlRmxvYXQnOiBmdW5jdGlvbiAoX3BhcnNlRmxvYXQpIHtcbiAgICAgIGZ1bmN0aW9uIHBhcnNlRmxvYXQoX3gyKSB7XG4gICAgICAgIHJldHVybiBfcGFyc2VGbG9hdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICBwYXJzZUZsb2F0LnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3BhcnNlRmxvYXQudG9TdHJpbmcoKTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBwYXJzZUZsb2F0O1xuICAgIH0oZnVuY3Rpb24gKHZhbCkge1xuICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsKTtcbiAgICB9KVxuICB9OyAvLyAtLS0tLSBzb3J0IG1ldGhvZCAtLS0tLSAvL1xuICAvLyBzb3J0IGZpbHRlcmVkSXRlbSBvcmRlclxuXG4gIHByb3RvLl9zb3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5vcHRpb25zLnNvcnRCeSkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8ga2VlcCB0cmFjayBvZiBzb3J0QnkgSGlzdG9yeVxuXG5cbiAgICB2YXIgc29ydEJ5cyA9IHV0aWxzLm1ha2VBcnJheSh0aGlzLm9wdGlvbnMuc29ydEJ5KTtcblxuICAgIGlmICghdGhpcy5fZ2V0SXNTYW1lU29ydEJ5KHNvcnRCeXMpKSB7XG4gICAgICAvLyBjb25jYXQgYWxsIHNvcnRCeSBhbmQgc29ydEhpc3RvcnksIGFkZCB0byBmcm9udCwgb2xkZXN0IGdvZXMgaW4gbGFzdFxuICAgICAgdGhpcy5zb3J0SGlzdG9yeSA9IHNvcnRCeXMuY29uY2F0KHRoaXMuc29ydEhpc3RvcnkpO1xuICAgIH0gLy8gc29ydCBtYWdpY1xuXG5cbiAgICB2YXIgaXRlbVNvcnRlciA9IGdldEl0ZW1Tb3J0ZXIodGhpcy5zb3J0SGlzdG9yeSwgdGhpcy5vcHRpb25zLnNvcnRBc2NlbmRpbmcpO1xuICAgIHRoaXMuZmlsdGVyZWRJdGVtcy5zb3J0KGl0ZW1Tb3J0ZXIpO1xuICB9OyAvLyBjaGVjayBpZiBzb3J0QnlzIGlzIHNhbWUgYXMgc3RhcnQgb2Ygc29ydEhpc3RvcnlcblxuXG4gIHByb3RvLl9nZXRJc1NhbWVTb3J0QnkgPSBmdW5jdGlvbiAoc29ydEJ5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydEJ5cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHNvcnRCeXNbaV0gIT0gdGhpcy5zb3J0SGlzdG9yeVtpXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07IC8vIHJldHVybnMgYSBmdW5jdGlvbiB1c2VkIGZvciBzb3J0aW5nXG5cblxuICBmdW5jdGlvbiBnZXRJdGVtU29ydGVyKHNvcnRCeXMsIHNvcnRBc2MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc29ydGVyKGl0ZW1BLCBpdGVtQikge1xuICAgICAgLy8gY3ljbGUgdGhyb3VnaCBhbGwgc29ydEtleXNcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydEJ5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc29ydEJ5ID0gc29ydEJ5c1tpXTtcbiAgICAgICAgdmFyIGEgPSBpdGVtQS5zb3J0RGF0YVtzb3J0QnldO1xuICAgICAgICB2YXIgYiA9IGl0ZW1CLnNvcnREYXRhW3NvcnRCeV07XG5cbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPCBiKSB7XG4gICAgICAgICAgLy8gaWYgc29ydEFzYyBpcyBhbiBvYmplY3QsIHVzZSB0aGUgdmFsdWUgZ2l2ZW4gdGhlIHNvcnRCeSBrZXlcbiAgICAgICAgICB2YXIgaXNBc2NlbmRpbmcgPSBzb3J0QXNjW3NvcnRCeV0gIT09IHVuZGVmaW5lZCA/IHNvcnRBc2Nbc29ydEJ5XSA6IHNvcnRBc2M7XG4gICAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlzQXNjZW5kaW5nID8gMSA6IC0xO1xuICAgICAgICAgIHJldHVybiAoYSA+IGIgPyAxIDogLTEpICogZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAwO1xuICAgIH07XG4gIH0gLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gbWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBnZXQgbGF5b3V0IG1vZGVcblxuXG4gIHByb3RvLl9tb2RlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXRNb2RlID0gdGhpcy5vcHRpb25zLmxheW91dE1vZGU7XG4gICAgdmFyIG1vZGUgPSB0aGlzLm1vZGVzW2xheW91dE1vZGVdO1xuXG4gICAgaWYgKCFtb2RlKSB7XG4gICAgICAvLyBUT0RPIGNvbnNvbGUuZXJyb3JcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbGF5b3V0IG1vZGU6ICcgKyBsYXlvdXRNb2RlKTtcbiAgICB9IC8vIEhBQ0sgc3luYyBtb2RlJ3Mgb3B0aW9uc1xuICAgIC8vIGFueSBvcHRpb25zIHNldCBhZnRlciBpbml0IGZvciBsYXlvdXQgbW9kZSBuZWVkIHRvIGJlIHN5bmNlZFxuXG5cbiAgICBtb2RlLm9wdGlvbnMgPSB0aGlzLm9wdGlvbnNbbGF5b3V0TW9kZV07XG4gICAgcmV0dXJuIG1vZGU7XG4gIH07XG5cbiAgcHJvdG8uX3Jlc2V0TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHRyaWdnZXIgb3JpZ2luYWwgcmVzZXQgbGF5b3V0XG4gICAgT3V0bGF5ZXIucHJvdG90eXBlLl9yZXNldExheW91dC5jYWxsKHRoaXMpO1xuXG4gICAgdGhpcy5fbW9kZSgpLl9yZXNldExheW91dCgpO1xuICB9O1xuXG4gIHByb3RvLl9nZXRJdGVtTGF5b3V0UG9zaXRpb24gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgIHJldHVybiB0aGlzLl9tb2RlKCkuX2dldEl0ZW1MYXlvdXRQb3NpdGlvbihpdGVtKTtcbiAgfTtcblxuICBwcm90by5fbWFuYWdlU3RhbXAgPSBmdW5jdGlvbiAoc3RhbXApIHtcbiAgICB0aGlzLl9tb2RlKCkuX21hbmFnZVN0YW1wKHN0YW1wKTtcbiAgfTtcblxuICBwcm90by5fZ2V0Q29udGFpbmVyU2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbW9kZSgpLl9nZXRDb250YWluZXJTaXplKCk7XG4gIH07XG5cbiAgcHJvdG8ubmVlZHNSZXNpemVMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vZGUoKS5uZWVkc1Jlc2l6ZUxheW91dCgpO1xuICB9OyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBhZGRpbmcgJiByZW1vdmluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAvLyBIRUFEUyBVUCBvdmVyd3JpdGVzIGRlZmF1bHQgT3V0bGF5ZXIgYXBwZW5kZWRcblxuXG4gIHByb3RvLmFwcGVuZGVkID0gZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5hZGRJdGVtcyhlbGVtcyk7XG5cbiAgICBpZiAoIWl0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gLy8gZmlsdGVyLCBsYXlvdXQsIHJldmVhbCBuZXcgaXRlbXNcblxuXG4gICAgdmFyIGZpbHRlcmVkSXRlbXMgPSB0aGlzLl9maWx0ZXJSZXZlYWxBZGRlZChpdGVtcyk7IC8vIGFkZCB0byBmaWx0ZXJlZEl0ZW1zXG5cblxuICAgIHRoaXMuZmlsdGVyZWRJdGVtcyA9IHRoaXMuZmlsdGVyZWRJdGVtcy5jb25jYXQoZmlsdGVyZWRJdGVtcyk7XG4gIH07IC8vIEhFQURTIFVQIG92ZXJ3cml0ZXMgZGVmYXVsdCBPdXRsYXllciBwcmVwZW5kZWRcblxuXG4gIHByb3RvLnByZXBlbmRlZCA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2l0ZW1pemUoZWxlbXMpO1xuXG4gICAgaWYgKCFpdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IC8vIHN0YXJ0IG5ldyBsYXlvdXRcblxuXG4gICAgdGhpcy5fcmVzZXRMYXlvdXQoKTtcblxuICAgIHRoaXMuX21hbmFnZVN0YW1wcygpOyAvLyBmaWx0ZXIsIGxheW91dCwgcmV2ZWFsIG5ldyBpdGVtc1xuXG5cbiAgICB2YXIgZmlsdGVyZWRJdGVtcyA9IHRoaXMuX2ZpbHRlclJldmVhbEFkZGVkKGl0ZW1zKTsgLy8gbGF5b3V0IHByZXZpb3VzIGl0ZW1zXG5cblxuICAgIHRoaXMubGF5b3V0SXRlbXModGhpcy5maWx0ZXJlZEl0ZW1zKTsgLy8gYWRkIHRvIGl0ZW1zIGFuZCBmaWx0ZXJlZEl0ZW1zXG5cbiAgICB0aGlzLmZpbHRlcmVkSXRlbXMgPSBmaWx0ZXJlZEl0ZW1zLmNvbmNhdCh0aGlzLmZpbHRlcmVkSXRlbXMpO1xuICAgIHRoaXMuaXRlbXMgPSBpdGVtcy5jb25jYXQodGhpcy5pdGVtcyk7XG4gIH07XG5cbiAgcHJvdG8uX2ZpbHRlclJldmVhbEFkZGVkID0gZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgdmFyIGZpbHRlcmVkID0gdGhpcy5fZmlsdGVyKGl0ZW1zKTtcblxuICAgIHRoaXMuaGlkZShmaWx0ZXJlZC5uZWVkSGlkZSk7IC8vIHJldmVhbCBhbGwgbmV3IGl0ZW1zXG5cbiAgICB0aGlzLnJldmVhbChmaWx0ZXJlZC5tYXRjaGVzKTsgLy8gbGF5b3V0IG5ldyBpdGVtcywgbm8gdHJhbnNpdGlvblxuXG4gICAgdGhpcy5sYXlvdXRJdGVtcyhmaWx0ZXJlZC5tYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gZmlsdGVyZWQubWF0Y2hlcztcbiAgfTtcbiAgLyoqXG4gICAqIEZpbHRlciwgc29ydCwgYW5kIGxheW91dCBuZXdseS1hcHBlbmRlZCBpdGVtIGVsZW1lbnRzXG4gICAqIEBwYXJhbSB7QXJyYXkgb3IgTm9kZUxpc3Qgb3IgRWxlbWVudH0gZWxlbXNcbiAgICovXG5cblxuICBwcm90by5pbnNlcnQgPSBmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLmFkZEl0ZW1zKGVsZW1zKTtcblxuICAgIGlmICghaXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfSAvLyBhcHBlbmQgaXRlbSBlbGVtZW50c1xuXG5cbiAgICB2YXIgaSwgaXRlbTtcbiAgICB2YXIgbGVuID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaXRlbS5lbGVtZW50KTtcbiAgICB9IC8vIGZpbHRlciBuZXcgc3R1ZmZcblxuXG4gICAgdmFyIGZpbHRlcmVkSW5zZXJ0SXRlbXMgPSB0aGlzLl9maWx0ZXIoaXRlbXMpLm1hdGNoZXM7IC8vIHNldCBmbGFnXG5cblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaXRlbXNbaV0uaXNMYXlvdXRJbnN0YW50ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLmFycmFuZ2UoKTsgLy8gcmVzZXQgZmxhZ1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBkZWxldGUgaXRlbXNbaV0uaXNMYXlvdXRJbnN0YW50O1xuICAgIH1cblxuICAgIHRoaXMucmV2ZWFsKGZpbHRlcmVkSW5zZXJ0SXRlbXMpO1xuICB9O1xuXG4gIHZhciBfcmVtb3ZlID0gcHJvdG8ucmVtb3ZlO1xuXG4gIHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uIChlbGVtcykge1xuICAgIGVsZW1zID0gdXRpbHMubWFrZUFycmF5KGVsZW1zKTtcbiAgICB2YXIgcmVtb3ZlSXRlbXMgPSB0aGlzLmdldEl0ZW1zKGVsZW1zKTsgLy8gZG8gcmVndWxhciB0aGluZ1xuXG4gICAgX3JlbW92ZS5jYWxsKHRoaXMsIGVsZW1zKTsgLy8gYmFpbCBpZiBubyBpdGVtcyB0byByZW1vdmVcblxuXG4gICAgdmFyIGxlbiA9IHJlbW92ZUl0ZW1zICYmIHJlbW92ZUl0ZW1zLmxlbmd0aDsgLy8gcmVtb3ZlIGVsZW1zIGZyb20gZmlsdGVyZWRJdGVtc1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGxlbiAmJiBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gcmVtb3ZlSXRlbXNbaV07IC8vIHJlbW92ZSBpdGVtIGZyb20gY29sbGVjdGlvblxuXG4gICAgICB1dGlscy5yZW1vdmVGcm9tKHRoaXMuZmlsdGVyZWRJdGVtcywgaXRlbSk7XG4gICAgfVxuICB9O1xuXG4gIHByb3RvLnNodWZmbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdXBkYXRlIHJhbmRvbSBzb3J0RGF0YVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLml0ZW1zW2ldO1xuICAgICAgaXRlbS5zb3J0RGF0YS5yYW5kb20gPSBNYXRoLnJhbmRvbSgpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5zb3J0QnkgPSAncmFuZG9tJztcblxuICAgIHRoaXMuX3NvcnQoKTtcblxuICAgIHRoaXMuX2xheW91dCgpO1xuICB9O1xuICAvKipcbiAgICogdHJpZ2dlciBmbiB3aXRob3V0IHRyYW5zaXRpb25cbiAgICoga2luZCBvZiBoYWNreSB0byBoYXZlIHRoaXMgaW4gdGhlIGZpcnN0IHBsYWNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAgICogQHJldHVybnMgcmV0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG5cbiAgcHJvdG8uX25vVHJhbnNpdGlvbiA9IGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgIC8vIHNhdmUgdHJhbnNpdGlvbkR1cmF0aW9uIGJlZm9yZSBkaXNhYmxpbmdcbiAgICB2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gdGhpcy5vcHRpb25zLnRyYW5zaXRpb25EdXJhdGlvbjsgLy8gZGlzYWJsZSB0cmFuc2l0aW9uXG5cbiAgICB0aGlzLm9wdGlvbnMudHJhbnNpdGlvbkR1cmF0aW9uID0gMDsgLy8gZG8gaXRcblxuICAgIHZhciByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KHRoaXMsIGFyZ3MpOyAvLyByZS1lbmFibGUgdHJhbnNpdGlvbiBmb3IgcmV2ZWFsXG5cbiAgICB0aGlzLm9wdGlvbnMudHJhbnNpdGlvbkR1cmF0aW9uID0gdHJhbnNpdGlvbkR1cmF0aW9uO1xuICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgfTsgLy8gLS0tLS0gaGVscGVyIG1ldGhvZHMgLS0tLS0gLy9cblxuICAvKipcbiAgICogZ2V0dGVyIG1ldGhvZCBmb3IgZ2V0dGluZyBmaWx0ZXJlZCBpdGVtIGVsZW1lbnRzXG4gICAqIEByZXR1cm5zIHtBcnJheX0gZWxlbXMgLSBjb2xsZWN0aW9uIG9mIGl0ZW0gZWxlbWVudHNcbiAgICovXG5cblxuICBwcm90by5nZXRGaWx0ZXJlZEl0ZW1FbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5maWx0ZXJlZEl0ZW1zLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZWxlbWVudDtcbiAgICB9KTtcbiAgfTsgLy8gLS0tLS0gIC0tLS0tIC8vXG5cblxuICByZXR1cm4gSXNvdG9wZTtcbn0pOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIEdsb2JhbCB2YXJpYWJsZXMgYW5kIG9iamVjdHNcbiAqL1xudmFyIGh0bWwgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaHRtbCcpWzBdO1xudmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuLyoqXG4gKiBCcmVha3BvaW50c1xuICpcbiAqIEB0eXBlICAgICB7T2JqZWN0fVxuICovXG5cbnZhciBicmVha3BvaW50cyA9IHtcbiAgbW9iaWxlOiA2MDAsXG4gIHRhYmxldDogNzYwLFxuICBkZXNrdG9wOiAxMDIwXG59O1xuLyoqXG4gKiBTaXRlIHNlY3Rpb25zXG4gKlxuICogQHR5cGUgICAgIHtPYmplY3R9XG4gKi9cblxudmFyIHNpdGUgPSB7XG4gIHNpdGU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zaXRlJyksXG4gIGhlYWRlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpdGUtaGVhZGVyJyksXG4gIHdyYXBwZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tYWluLW92ZXJsYXktd3JhcHBlcicpLFxuICBtYWluOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2l0ZS1tYWluJyksXG4gIGZvb3RlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpdGUtZm9vdGVyJyksXG4gIGFubm91bmNlbWVudDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNpdGUtYW5ub3VuY2VtZW50JyksXG4gIG92ZXJsYXlzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2l0ZS1uYXZpZ2F0aW9uLW92ZXJsYXlzJylcbn07XG4vKipcbiAqIE1lbnUgdG9nZ2xlXG4gKlxuICogQHR5cGUgICAgIHtPYmplY3R9XG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSB0b2dnbGUgICAgIC0gTWVudSBidXR0b25cbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IG5hdmlnYXRpb24gLSBNZW51IGNvbnRhaW5lclxuICovXG5cbnZhciBtZW51ID0ge1xuICB0b2dnbGU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1tZW51LXRvZ2dsZScpLFxuICBuYXZpZ2F0aW9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnanMtbWVudScpLFxuICBtb2JpbGVuYXY6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdqcy1tb2JpbGUtbWVudScpLFxuICB0ZXh0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtbWVudS10b2dnbGUgLmJ1dHRvbl9fdGV4dCcpLFxuICBob3ZlckluZGljYXRvcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lbnUtbmF2aWdhdGlvbl9faG92ZXItaW5kaWNhdG9yJylcbn07XG4vKipcbiAqIFNlYXJjaCB0b2dnbGVcbiAqXG4gKiBAdHlwZSAgICAge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHRvZ2dsZSAgICAgLSBTZWFyY2ggYnV0dG9uXG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSBuYXZpZ2F0aW9uIC0gU2VhcmNoIGNvbnRhaW5lclxuICovXG5cbnZhciBzZWFyY2ggPSB7XG4gIHRvZ2dsZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmpzLXNlYXJjaC10b2dnbGUnKVswXSxcbiAgbmF2aWdhdGlvbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzLXNlYXJjaCcpLFxuICB0ZXh0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtc2VhcmNoLXRvZ2dsZSAuYnV0dG9uX190ZXh0Jylcbn07XG4vKipcbiAqIEFsbCBoZWFkZXIgdG9nZ2xlc1xuICpcbiAqIEBwcm9wZXJ0eSB7SFRNTEVsZW1lbnR9IHRvZ2dsZSAgICAgLSBUb2dnbGUgYnV0dG9uc1xuICovXG5cbnZhciBoZWFkZXJUb2dnbGVzID0gc2l0ZS5oZWFkZXIucXVlcnlTZWxlY3RvckFsbCgnLmpzLXRvZ2dsZScpO1xuLyoqXG4gKiBWaWV3cG9ydCB3aWR0aHNcbiAqXG4gKiBAdHlwZSAgICAge09iamVjdH1cbiAqL1xuXG52YXIgdmlld3BvcnRzID0ge1xuICB3aWR0aDogdmVyZ2Uudmlld3BvcnRXKCksXG4gIGhlaWdodDogdmVyZ2Uudmlld3BvcnRIKClcbn07XG4vKipcbiAqIGlPU0RldmljZVxuICpcbiAqIEB0eXBlICAgICB7Qm9vbGVhbn1cbiAqL1xuXG52YXIgaU9TRGV2aWNlID0gISFuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goL2lQaG9uZXxpUG9kfGlQYWQvKTtcbi8qKlxuICogRW1iZWRkZWQgTWFwc1xuICpcbiAqL1xuXG52YXIgbWFwID0gbnVsbDtcbnZhciBlbWJlZGRlZE1hcHMgPSBzaXRlLm1haW4ucXVlcnlTZWxlY3RvckFsbCgnLm1hcCcpO1xudmFyIHNraXBFbWJlZGRlZE1hcHNGb3J3YXJkcyA9IHNpdGUubWFpbi5xdWVyeVNlbGVjdG9yQWxsKCcuanMtbWFwLXNraXAtZm9yd2FyZHMnKTtcbnZhciBza2lwRW1iZWRkZWRNYXBzQmFja3dhcmRzID0gc2l0ZS5tYWluLnF1ZXJ5U2VsZWN0b3JBbGwoJy5qcy1tYXAtc2tpcC1iYWNrd2FyZHMnKTtcbi8qKlxuICogalF1ZXJ5XG4gKi9cblxudmFyICR3aW5kb3cgPSAkKHdpbmRvdyksXG4gICAgJGh0bWwgPSAkKGh0bWwpLFxuICAgICRib2R5ID0gJChib2R5KSxcbiAgICAkc2l0ZU1haW4gPSAkKHNpdGUubWFpbiksXG4gICAgJHNpdGVPdmVybGF5V3JhcHBlciA9ICQoc2l0ZS53cmFwcGVyKSxcbiAgICAkYnJlYWRjcnVtYiA9ICRzaXRlT3ZlcmxheVdyYXBwZXIuZmluZCgnLmJyZWFkY3J1bWInKSxcbiAgICAkZm9ybXMgPSAkc2l0ZU1haW4uZmluZCgnLmZvcm0nKSxcbiAgICAkbmF2aWdhdGlvbiA9ICQobWVudS5uYXZpZ2F0aW9uKSxcbiAgICAkbWVudVRvZ2dsZSA9ICQobWVudS50b2dnbGUpLFxuICAgICRtZW51VG9nZ2xlQnV0dG9uID0gJChzaXRlLmhlYWRlcikuZmluZCgnI2pzLW1lbnUtdG9nZ2xlJyksXG4gICAgJHNlYXJjaFRvZ2dsZSA9ICQoc2VhcmNoLnRvZ2dsZSksXG4gICAgJHNpdGVTZWFyY2hXcmFwcGVyID0gJChzaXRlLm92ZXJsYXlzKS5maW5kKCcuc2l0ZS1zZWFyY2gtd3JhcHBlcicpLFxuICAgICRzaXRlU2VhcmNoRm9ybUZpZWxkID0gJChzZWFyY2gubmF2aWdhdGlvbikuZmluZCgnLmZvcm1fX2ZpZWxkJyksXG4gICAgJHNlYXJjaFN1Ym1pdEJ1dHRvbiA9ICQoc2VhcmNoLm5hdmlnYXRpb24pLmZpbmQoJy5idXR0b24nKSxcbiAgICAkbW9iaWxlTWVudUNvbnRhaW5lciA9ICQoc2l0ZS5vdmVybGF5cykuZmluZCgnLm1lbnUtbmF2aWdhdGlvbiAuY29udGFpbmVyJyk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIHRpbWVvdXQ7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLFxuICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24gbGF0ZXIoKSB7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG5cbiAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgIGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9O1xufVxuXG47IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogTW9yZSBwZXJmb3JtYW50IGZvckVhY2ggZnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSAgICBhcnJheSAgICAtIFRoZSBhcnJheSAvIG5vZGUgbGlzdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2tcbiAqL1xuZnVuY3Rpb24gZm9yRWFjaChhcnJheSwgY2FsbGJhY2ssIHNjb3BlKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBjYWxsYmFjay5jYWxsKHNjb3BlLCBpLCBhcnJheVtpXSk7IC8vIHBhc3NlcyBiYWNrIHN0dWZmIHdlIG5lZWRcbiAgfVxufVxuXG47XG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGhlaWdodCBvZiBhIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbSAtIFRoZSBlbGVtZW50XG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBUaGUgaGVpZ2h0IGluIHB4LlxuICovXG5cbmZ1bmN0aW9uIGdldEhlaWdodChlbGVtKSB7XG4gIGlmICghZWxlbSkgcmV0dXJuO1xuICB2YXIgZWxlbUhlaWdodCA9IGVsZW0uc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgcmV0dXJuIGVsZW1IZWlnaHQ7XG59XG5cbjtcbi8qKlxuICogU2V0IGEgbWluLWhlaWdodCBvbiBwYWdlcyB3aXRoIG1pbmltYWwgY29udGVudFxuICpcbiAqIDEwMHZoIGRvZXNuJ3QgYWNjb3VudCBmb3IgdGhlIGJyb3dzZXIgY29udHJvbHMgb24gc29tZSBkZXZpY2VzLlxuICogU28gd2UgbmVlZCB0byBtZWFzdXJlIG1pbi1oZWlnaHQgdXNpbmcgamF2YXNjcmlwdC5cbiAqXG4gKi9cblxudmFyIHNldFNpdGVNaW5IZWlnaHQgPSBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gIHZhciAkc2l0ZSA9ICQoc2l0ZS5zaXRlKSxcbiAgICAgICRzaXRlSGVpZ2h0ID0gJHNpdGUuaW5uZXJIZWlnaHQoKSxcbiAgICAgIG5ld01pbkhlaWdodCA9ICdjYWxjKDEwMHZoIC0gJyArICgkc2l0ZUhlaWdodCAtIHZpZXdwb3J0cy5oZWlnaHQpICsgJ3B4KSc7XG4gIGlmICh2aWV3cG9ydHMuaGVpZ2h0ID09PSAkc2l0ZUhlaWdodCkgcmV0dXJuO1xuICAkc2l0ZS5jc3Moe1xuICAgICdtaW4taGVpZ2h0JzogbmV3TWluSGVpZ2h0XG4gIH0pOyAvLyBBZnRlciB0aGUgY2FsY3VsYXRpb24gaGFzIGJlZW4gbWFkZSwgcmVtb3ZlIHRoZSBpbmxpbmUgY2FsYyBzdHlsZSBJRiB0aGUgc2l0ZSBjb250ZW50IGlzIHN0aWxsIGxhcmdlciB0aGFuIHRoZSB2aWV3cG9ydC5cblxuICAkc2l0ZUhlaWdodCA9ICRzaXRlLmlubmVySGVpZ2h0KCk7XG5cbiAgaWYgKCRzaXRlSGVpZ2h0ID4gdmlld3BvcnRzLmhlaWdodCkge1xuICAgICRzaXRlLmNzcyh7XG4gICAgICAnbWluLWhlaWdodCc6ICcnXG4gICAgfSk7XG4gIH1cbn0sIDMwKTtcbi8qKlxuICogU2Nyb2xsIExvY2tcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGFwcGxpZWQgdG8gbG9jayB0aGUgd2luZG93IHNjcm9sbGluZy5cbiAqIFRoaXMgc2hvdWxkIGJlIGFwcGxpZWQgd2hlbiBzaG93aW5nIHBvcHVwcyBhbmQgZnVsbCBoZWlnaHQgbW9kZWxzIHRvIGFsbG93IHRoZSB1c2VyIHRvIHNjcm9sbCB0aGUgdG9wIGxheWVyLlxuICpcbiAqIENhbGwgdXNpbmcgc2Nyb2xsTG9jaygpIHRvIGxvY2sgYW5kIHNjcm9sbExvY2soZmFsc2UpIHRvIHVubG9jaztcbiAqXG4gKi9cblxuZnVuY3Rpb24gc2Nyb2xsTG9jaygpIHtcbiAgdmFyIGxvY2tpbmdTY3JvbGwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IHRydWU7XG4gIGlmICghJChzaXRlLnNpdGUpLmxlbmd0aCkgcmV0dXJuO1xuXG4gIGlmIChsb2NraW5nU2Nyb2xsID09IHRydWUpIHtcbiAgICAkKHNpdGUuc2l0ZSkuY3NzKCd0b3AnLCAtJCh3aW5kb3cpLnNjcm9sbFRvcCgpKTtcbiAgICAkaHRtbC5hdHRyKCdkYXRhLXNjcm9sbC1sb2NrJywgJ3RydWUnKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoISRodG1sLmF0dHIoJ2RhdGEtc2Nyb2xsLWxvY2snKS5sZW5ndGgpIHJldHVybjtcbiAgICB2YXIgcmVzZXRTY3JvbGwgPSBwYXJzZUludCgkKHNpdGUuc2l0ZSkuY3NzKCd0b3AnKSkgKiAtMTtcbiAgICAkaHRtbC5yZW1vdmVBdHRyKCdkYXRhLXNjcm9sbC1sb2NrJyk7XG4gICAgJChzaXRlLnNpdGUpLmNzcygndG9wJywgJ2F1dG8nKTtcbiAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICBzY3JvbGxUb3A6IHJlc2V0U2Nyb2xsXG4gICAgfSwgMCk7XG4gIH1cbn1cblxuO1xuLyoqXG4gKiBTY3JvbGxzIHRvIGVsZW1lbnQuXG4gKlxuICogSW1tZWRpYXRlbHkgaW52b2tlZCBmdW5jdGlvbiBleHByZXNzaW9uXG4gKlxuICogQXBwbHkgZGF0YSBhdHRyaWJ1dGUgJ2RhdGEtc2Nyb2xsLXRvJyB0byBhbiBlbGVtZW50IGJ1dHRvbiB3aXRoIGFuIElEIG9mXG4gKiB0aGUgc2VsZWN0b3IgeW91IHdhbnQgdG8gc2Nyb2xsIHRvLlxuICpcbiAqIFVzZXMgalF1ZXJ5IHNlbGVjdG9ycyBhcyAnYW5pbWF0ZScgaXNuJ3Qgd2lkZWx5XG4gKiBzdXBwb3J0ZWQgd2l0aCB2YW5pbGxhIEpTLlxuICovXG5cbihmdW5jdGlvbiAoKSB7XG4gICQoJ1tkYXRhLXNjcm9sbC10b10nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICB0YXJnZXREYXRhID0gJHRoaXMuYXR0cignZGF0YS1zY3JvbGwtdG8nKSxcbiAgICAgICAgJHRhcmdldCA9ICQodGFyZ2V0RGF0YSk7XG4gICAgaWYgKCR0YXJnZXQub2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgIHNjcm9sbFRvcDogJHRhcmdldC5vZmZzZXQoKS50b3BcbiAgICB9LCA1MDApO1xuICB9KTtcbn0pKCk7XG4vKipcbiAqIFJlc2V0cyB0aGUgdGFiYmluZyBmb2N1c1xuICpcbiAqIEltbWVkaWF0ZWx5IGludm9rZWQgZnVuY3Rpb24gZXhwcmVzc2lvblxuICpcbiAqIEFwcGx5IGRhdGEgYXR0cmlidXRlIHRvIGEgaGlkZGVuIGJ1dHRvbiB3aXRoIGFuIElEIG9mXG4gKiB0aGUgc2VsZWN0b3IgeW91IHdhbnQgdG8gZm9jdXMgdG8uXG4gKi9cblxuXG4oZnVuY3Rpb24gKCkge1xuICAkKCdbZGF0YS1mb2N1c10nKS5vbignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWZvY3VzJyk7XG4gICAgJCgnIycgKyBpZCkuZm9jdXMoKTtcbiAgfSk7XG59KSgpO1xuLypcbiAqIE1hdGNoIGhlaWdodCB1c2luZyBkYXRhIGF0dHJpYnV0ZVxuICpcbiAqIDx1bCBjbGFzcz1cImxpc3RcIiBkYXRhLW1hdGNoSGVpZ2h0PVwiLmxpc3RfX2l0ZW1cIj5cbiAqICAgICAgPGxpIGNsYXNzPVwibGlzdF9faXRlbVwiPlxuICogICAgICA8L2xpPlxuICogPC91bD5cbiAqL1xuXG5cbihmdW5jdGlvbiAoKSB7XG4gICQoJ1tkYXRhLW1hdGNoSGVpZ2h0XScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgdmFyIG1hdGNoSGVpZ2h0VGFyZ2V0ID0gJHRoaXMuYXR0cignZGF0YS1tYXRjaEhlaWdodCcpO1xuICAgICR0aGlzLmZpbmQobWF0Y2hIZWlnaHRUYXJnZXQpLm1hdGNoSGVpZ2h0KCk7XG4gIH0pO1xuICAkKCdbZGF0YS1tYXRjaEhlaWdodC1wYXJlbnRdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICB2YXIgJG1hdGNoSGVpZ2h0UGFyZW50ID0gJHRoaXMuY2xvc2VzdCgkdGhpcy5hdHRyKCdkYXRhLW1hdGNoSGVpZ2h0LXBhcmVudCcpKTtcbiAgICB2YXIgJG1hdGNoSGVpZ2h0VGFyZ2V0T2JqID0gJG1hdGNoSGVpZ2h0UGFyZW50LmZpbmQoJHRoaXMuYXR0cignZGF0YS1tYXRjaEhlaWdodC13aXRoJykpO1xuXG4gICAgaWYgKCEkbWF0Y2hIZWlnaHRUYXJnZXRPYmoubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgJHRoaXMuYWRkKCRtYXRjaEhlaWdodFRhcmdldE9iaikubWF0Y2hIZWlnaHQoKTtcbiAgfSk7XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuKiAgIEN1c3RvbSB2ZXJzaW9uIG9mIGExMXktdG9nZ2xlIC0gaHR0cHM6Ly9naXRodWIuY29tL2VkZW5zcGlla2VybWFubi9hMTF5LXRvZ2dsZVxuKlxuKiAgIEZ1bGwgZG9jcyBoZXJlOiBodHRwOi8vZWRlbnNwaWVrZXJtYW5uLmdpdGh1Yi5pby9hMTF5LXRvZ2dsZS9cbipcbiogICBFeGFtcGxlIHRvIHdhdGNoIGZvciBjYWxsYmFjayBldmVudHMsIGRvIHRoZSBmb2xsb3dpbmc6XG4qICAgPGJ1dHRvbiBjbGFzcz1cImJ1dHRvblwiIGRhdGEtYTExeS10b2dnbGU9XCJ0YXJnZXRcIiBkYXRhLWExMXktY2FsbGJhY2s9XCJ0YXJnZXRDYWxsYmFja1wiPjwvYnV0dG9uPlxuKlxuKiAgIFRvIGF2b2lkIGR1cGxpY2F0aW9uIG9mIHRoZSAnRE9NQ29udGVudExvYWRlZCcgbGlzdGVuZXIsIGluaXRBMTF5VG9nZ2xlKCkgaXMgbm93IGNhbGxlZCBmcm9tIHdpdGhpbiBtYWluLmpzXG4qICAgSWYgeW91IGRvIG5vdCB3YW50IHRvIHJlaW5pdGlhbGlzZSBldmVyeXRoaW5nLCB5b3UgY2FuIHBhc3MgYSBjb250ZXh0IHRvIHRoZSBhMTF5VG9nZ2xlIGZ1bmN0aW9uIHdoaWNoIHdpbGwgYmUgdXNlZCBhcyBhIHJvb3QgZm9yIC5xdWVyeVNlbGVjdG9yQWxsLlxuKiAgIGkuZS4gd2luZG93LmExMXlUb2dnbGUobXlDb250YWluZXIpO1xuKlxuKiAgIEluaXRpYWxpc2F0aW9uIGV2ZW50IGxpc3RlbmVyOlxuKlxuKiAgICQod2luZG93KS5vbignYTExeS10b2dnbGU6dGFyZ2V0Q2FsbGJhY2snLCBmdW5jdGlvbihldmVudCkge1xuKiAgICAgY29uc29sZS5sb2coJ2ExMXktdG9nZ2xlIGNhbGxiYWNrIGxvYWRlZCcpO1xuKiAgIH0pO1xuKlxuKiAgIEhpZGUgZXZlbnQgbGlzdGVuZXI6XG4qXG4qICAgJCh3aW5kb3cpLm9uKCdhMTF5LXRvZ2dsZS1oaWRlOnRhcmdldENhbGxiYWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiogICAgIGNvbnNvbGUubG9nKCdhMTF5LXRvZ2dsZSBjYWxsYmFjayBoaWRlJyk7XG4qICAgfSk7XG4qXG4qICAgU2hvdyBldmVudCBsaXN0ZW5lcjpcbipcbiogICAkKHdpbmRvdykub24oJ2ExMXktdG9nZ2xlLXNob3c6dGFyZ2V0Q2FsbGJhY2snLCBmdW5jdGlvbihldmVudCkge1xuKiAgICAgY29uc29sZS5sb2coJ2ExMXktdG9nZ2xlIGNhbGxiYWNrIHNob3cnKTtcbiogICB9KTtcbipcbiovXG52YXIgaW5pdEExMXlUb2dnbGUgPSBmdW5jdGlvbiBpbml0QTExeVRvZ2dsZSgpIHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGludGVybmFsSWQgPSAwO1xuICB2YXIgdG9nZ2xlc01hcCA9IHt9O1xuICB2YXIgdGFyZ2V0c01hcCA9IHt9O1xuXG4gIGZ1bmN0aW9uICQoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoKGNvbnRleHQgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENsb3Nlc3RUb2dnbGUoZWxlbWVudCkge1xuICAgIGlmIChlbGVtZW50LmNsb3Nlc3QpIHtcbiAgICAgIHJldHVybiBlbGVtZW50LmNsb3Nlc3QoJ1tkYXRhLWExMXktdG9nZ2xlXScpO1xuICAgIH1cblxuICAgIHdoaWxlIChlbGVtZW50KSB7XG4gICAgICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gMSAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnZGF0YS1hMTF5LXRvZ2dsZScpKSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlKHRvZ2dsZSkge1xuICAgIHZhciB0YXJnZXQgPSB0b2dnbGUgJiYgdGFyZ2V0c01hcFt0b2dnbGUuZ2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJyldO1xuXG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgdG9nZ2xlcyA9IHRvZ2dsZXNNYXBbJyMnICsgdGFyZ2V0LmlkXTtcbiAgICB2YXIgaXNFeHBhbmRlZCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykgPT09ICdmYWxzZSc7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBpc0V4cGFuZGVkKTtcbiAgICB0b2dnbGVzLmZvckVhY2goZnVuY3Rpb24gKHRvZ2dsZSkge1xuICAgICAgdG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICFpc0V4cGFuZGVkKTtcbiAgICB9KTtcblxuICAgIGlmICh0b2dnbGUuaGFzQXR0cmlidXRlKCdkYXRhLWExMXktY2FsbGJhY2snKSkge1xuICAgICAgdmFyIHRvZ2dsZUNhbGxiYWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblxuICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgdG9nZ2xlQ2FsbGJhY2tFdmVudC5pbml0RXZlbnQoJ2ExMXktdG9nZ2xlLWhpZGU6JyArIHRvZ2dsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtYTExeS1jYWxsYmFjaycpLCB0cnVlLCB0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvZ2dsZUNhbGxiYWNrRXZlbnQuaW5pdEV2ZW50KCdhMTF5LXRvZ2dsZS1zaG93OicgKyB0b2dnbGUuZ2V0QXR0cmlidXRlKCdkYXRhLWExMXktY2FsbGJhY2snKSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHRvZ2dsZUNhbGxiYWNrRXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGluaXRBMTF5VG9nZ2xlID0gZnVuY3Rpb24gaW5pdEExMXlUb2dnbGUoY29udGV4dCkge1xuICAgIHRvZ2dsZXNNYXAgPSAkKCdbZGF0YS1hMTF5LXRvZ2dsZV0nLCBjb250ZXh0KS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgdG9nZ2xlKSB7XG4gICAgICB2YXIgc2VsZWN0b3IgPSAnIycgKyB0b2dnbGUuZ2V0QXR0cmlidXRlKCdkYXRhLWExMXktdG9nZ2xlJyk7XG4gICAgICBhY2Nbc2VsZWN0b3JdID0gYWNjW3NlbGVjdG9yXSB8fCBbXTtcbiAgICAgIGFjY1tzZWxlY3Rvcl0ucHVzaCh0b2dnbGUpO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB0b2dnbGVzTWFwKTtcbiAgICB2YXIgdGFyZ2V0cyA9IE9iamVjdC5rZXlzKHRvZ2dsZXNNYXApO1xuICAgIHRhcmdldHMubGVuZ3RoICYmICQodGFyZ2V0cykuZm9yRWFjaChmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICB2YXIgdG9nZ2xlcyA9IHRvZ2dsZXNNYXBbJyMnICsgdGFyZ2V0LmlkXTtcbiAgICAgIHZhciBpc0V4cGFuZGVkID0gdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1hMTF5LXRvZ2dsZS1vcGVuJyk7XG4gICAgICB2YXIgbGFiZWxsZWRieSA9IFtdO1xuICAgICAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uICh0b2dnbGUpIHtcbiAgICAgICAgdG9nZ2xlLmlkIHx8IHRvZ2dsZS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2ExMXktdG9nZ2xlLScgKyBpbnRlcm5hbElkKyspO1xuICAgICAgICB0b2dnbGUuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgdGFyZ2V0LmlkKTtcbiAgICAgICAgdG9nZ2xlLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIGlzRXhwYW5kZWQpO1xuICAgICAgICBsYWJlbGxlZGJ5LnB1c2godG9nZ2xlLmlkKTtcblxuICAgICAgICBpZiAodG9nZ2xlLmhhc0F0dHJpYnV0ZSgnZGF0YS1hMTF5LWNhbGxiYWNrJykpIHtcbiAgICAgICAgICB2YXIgdG9nZ2xlSW5pdCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgICAgIHRvZ2dsZUluaXQuaW5pdEV2ZW50KCdhMTF5LXRvZ2dsZTonICsgdG9nZ2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1hMTF5LWNhbGxiYWNrJyksIHRydWUsIHRydWUpO1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHRvZ2dsZUluaXQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgIWlzRXhwYW5kZWQpO1xuICAgICAgdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JykgfHwgdGFyZ2V0LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbGxlZGJ5JywgbGFiZWxsZWRieS5qb2luKCcgJykpO1xuICAgICAgdGFyZ2V0c01hcFt0YXJnZXQuaWRdID0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIHRvZ2dsZSA9IGdldENsb3Nlc3RUb2dnbGUoZXZlbnQudGFyZ2V0KTtcbiAgICBoYW5kbGVUb2dnbGUodG9nZ2xlKTtcbiAgfSk7XG4gIHdpbmRvdyAmJiAod2luZG93LmExMXlUb2dnbGUgPSBpbml0QTExeVRvZ2dsZSk7XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKCkge1xuICAvLyBhMTF5LXRvZ2dsZSBjb25uZWN0ZWQgdG9nZ2xlIGZ1bmN0aW9uc1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB2YXIgdG9nZ2xlR3JvdXBzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYTExeS1jb25uZWN0ZWQtdG9nZ2xlXScpKTtcblxuICBmdW5jdGlvbiBjb2xsYXBzZSh0b2dnbGUpIHtcbiAgICB2YXIgaWQgPSB0b2dnbGUuZ2V0QXR0cmlidXRlKCdkYXRhLWExMXktdG9nZ2xlJyk7XG4gICAgdmFyIGNvbGxhcHNpYmxlQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGNvbGxhcHNpYmxlQm94LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIHRvZ2dsZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgfVxuXG4gIDtcblxuICBmdW5jdGlvbiBnZXRUb2dnbGVGcm9tVGFyZ2V0KGVsZW1lbnQpIHtcbiAgICB3aGlsZSAoIWVsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLWExMXktdG9nZ2xlJykpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICA7XG4gIHRvZ2dsZUdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh0b2dnbGVHcm91cCkge1xuICAgIHZhciBncm91cGVkVG9nZ2xlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRvZ2dsZUdyb3VwLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWExMXktdG9nZ2xlXScpKTtcblxuICAgIHRvZ2dsZUdyb3VwLmNvbGxhcHNlQWxsID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBncm91cGVkVG9nZ2xlcy5maWx0ZXIoZnVuY3Rpb24gKHRvZ2dsZSkge1xuICAgICAgICByZXR1cm4gdG9nZ2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1hMTF5LXRvZ2dsZScpICE9PSBnZXRUb2dnbGVGcm9tVGFyZ2V0KGV2ZW50LnRhcmdldCkuZ2V0QXR0cmlidXRlKCdkYXRhLWExMXktdG9nZ2xlJyk7XG4gICAgICB9KS5mb3JFYWNoKGNvbGxhcHNlKTtcbiAgICB9O1xuXG4gICAgZ3JvdXBlZFRvZ2dsZXMuZm9yRWFjaChmdW5jdGlvbiAodG9nZ2xlKSB7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVHcm91cC5jb2xsYXBzZUFsbCk7XG4gICAgfSk7XG4gIH0pO1xuICAkKCdhW2RhdGEtYTExeS10b2dnbGVdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIEV4dGVybmFsIExpbmsgQ2hlY2tcbiAqXG4gKiBDaGVjayBmb3IgZXh0ZW5hbCBsaW5rcyB3aXRoaW4gLmVkaXRvciBhbmQgYWRkIGEgY2xhc3MuXG4gKlxuICogVG8gaWdub3JlIGV4dGVybmFsIGxpbmtzLCBhZGQgdGhlIGZvbGxvd2luZ1xuICogZGF0YSBhdHRyaWJ1dGUgdG8geW91ciBtYXJrdXA6XG4gKiBbZGF0YS1leHRlcm5hbC1saW5rPVwiZmFsc2VcIl1cbiAqL1xuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBsaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5lZGl0b3IgYScpO1xuICBbXS5mb3JFYWNoLmNhbGwobGlua3MsIGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgaWYgKGxvY2F0aW9uLmhvc3RuYW1lID09PSBlbGVtLmhvc3RuYW1lIHx8ICFlbGVtLmhvc3RuYW1lLmxlbmd0aCkgcmV0dXJuO1xuICAgIGlmIChlbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS1leHRlcm5hbC1saW5rJykgPT09ICdmYWxzZScgfHwgZWxlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2J1dHRvbicpKSByZXR1cm47XG4gICAgdmFyIGh0bWxDb250ZW50ID0gZWxlbS5pbm5lckhUTUw7XG4gICAgdmFyIGxhc3RJbmRleCA9IGh0bWxDb250ZW50Lmxhc3RJbmRleE9mKFwiIFwiKTtcbiAgICB2YXIgaHRtbENvbnRlbnRBcnJheSA9IGh0bWxDb250ZW50LnNwbGl0KFwiIFwiKTtcbiAgICBlbGVtLmNsYXNzTGlzdC5hZGQoJ2xpbmstZXh0ZXJuYWwnKTtcbiAgICBlbGVtLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdleHRlcm5hbDogJyArIGVsZW0uaW5uZXJUZXh0KTtcbiAgICBodG1sQ29udGVudCA9IGh0bWxDb250ZW50LnRyaW0oKS5zdWJzdHJpbmcoMCwgbGFzdEluZGV4KTtcbiAgICBlbGVtLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImxpbmstZXh0ZXJuYWxfX3RleHRcIj4nICsgaHRtbENvbnRlbnQudHJpbSgpICsgJyA8L3NwYW4+PHNwYW4gY2xhc3M9XCJsaW5rLWV4dGVybmFsX19vcnBoYW5cIj48c3BhbiBjbGFzcz1cImxpbmstZXh0ZXJuYWxfX3RleHRcIj4nICsgaHRtbENvbnRlbnRBcnJheVtodG1sQ29udGVudEFycmF5Lmxlbmd0aCAtIDFdLnRyaW0oKSArICc8L3NwYW4+Jm5ic3A7PHNwYW4gY2xhc3M9XCJpY29uIGljb24tZXh0ZXJuYWwtbGlua1wiPjwvc3Bhbj48L3NwYW4+JztcbiAgfSk7XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBDdXN0b20gZmlsZSB1cGxvYWQgZm9ybSBmaWVsZHNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBTZWUgZGVtbyBhdCBodHRwOi8vdHltcGFudXMubmV0L2NvZHJvcHMvMjAxNS8wOS8xNS9zdHlsaW5nLWN1c3RvbWl6aW5nLWZpbGUtaW5wdXRzLXNtYXJ0LXdheS9cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4oZnVuY3Rpb24gKCkge1xuICBpZiAoISRmb3Jtcy5sZW5ndGgpIHJldHVybjtcbiAgJGZvcm1zLmZpbmQoJy5mb3JtX19maWVsZC0tdXBsb2FkLCAuZm9ybV9fZmllbGQtLWltYWdlLXVwbG9hZCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpLFxuICAgICAgICAkbGFiZWwgPSAkaW5wdXQuY2xvc2VzdCgnLmZvcm1fX2NvbnRyb2wnKS5maW5kKCcuZm9ybV9fbGFiZWwnKSxcbiAgICAgICAgbGFiZWxWYWwgPSAkbGFiZWwudGV4dCgpLFxuICAgICAgICBjbG9uZWRMYWJlbENsYXNzID0gJ2Zvcm1fX2xhYmVsLS11cGxvYWQnOyAvLyBPbmx5IGFwcGx5IHRoZSBmb2xsb3dpbmcgamF2YXNjcmlwdCBpZiB3ZSdyZSBOT1QgdXNpbmcgZHJvcHpvbmVcblxuICAgIGlmICghJGlucHV0LnBhcmVudCgnLmZvcm1fX2NvbXBvbmVudC0tZmlsZScpLmxlbmd0aCAmJiAhJGlucHV0LnBhcmVudCgnLmZvcm1fX2NvbXBvbmVudC0taW1hZ2UtdXBsb2FkJykubGVuZ3RoKSByZXR1cm47XG5cbiAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygnZm9ybV9fZmllbGQtLWltYWdlLXVwbG9hZCcpKSB7XG4gICAgICBjbG9uZWRMYWJlbENsYXNzID0gJ2Zvcm1fX2xhYmVsLS1pbWFnZS11cGxvYWQnO1xuICAgIH1cblxuICAgICRpbnB1dC5hZnRlcigkbGFiZWwuY2xvbmUoKS5hZGRDbGFzcyhjbG9uZWRMYWJlbENsYXNzKSk7XG4gICAgJGxhYmVsLnJlcGxhY2VXaXRoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAnPHNwYW4gY2xhc3M9XCJmb3JtX19sYWJlbFwiPicgKyB0aGlzLmlubmVySFRNTCArICc8L3NwYW4+JztcbiAgICB9KTtcbiAgICAkbGFiZWwgPSAkaW5wdXQubmV4dCgnLmZvcm1fX2xhYmVsJyk7XG4gICAgJGlucHV0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHZhciBmaWxlTmFtZSA9ICcnO1xuXG4gICAgICBpZiAoZXZlbnQudGFyZ2V0LnZhbHVlKSB7XG4gICAgICAgIGZpbGVOYW1lID0gZXZlbnQudGFyZ2V0LnZhbHVlLnNwbGl0KCdcXFxcJykucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWxlTmFtZSAhPT0gJycpIHtcbiAgICAgICAgJGxhYmVsLnRleHQoZmlsZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJGxhYmVsLnRleHQobGFiZWxWYWwpO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRpbnB1dC5vbignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkaW5wdXQuYWRkQ2xhc3MoJ2hhcy1mb2N1cycpO1xuICAgIH0pLm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICRpbnB1dC5yZW1vdmVDbGFzcygnaGFzLWZvY3VzJyk7XG4gICAgfSk7XG4gIH0pO1xufSkoKTsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBUb2dnbGVzIGVsZW1lbnRzIGJldHdlZW4gZGVza3RvcCBhbmQgbW9iaWxlXG4gKlxuICogVXNlZnVsIGlmIGVsZW1lbnRzIG5lZWQgdG8gYmUgc2hvd25cbiAqIG9uIGRlc2t0b3AgYW5kIGhpZGRlbiBvbiBtb2JpbGVcbiAqXG4gKiBBZGQgb24gRE9NQ29udGVudExvYWRlZCBhbmQgUmVzaXplXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gJGVsZW0gICAtIFRoZSBlbGVtZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAkdG9nZ2xlIC0gVGhlIHRvZ2dsZVxuICpcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufSBBIGRlYm91bmNlIGZ1bmN0aW9uXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZU1vYmlsZVN3YXAoJGVsZW0sICR0b2dnbGUsIGJyZWFrcG9pbnQpIHtcbiAgdmFyIHJlc2l6ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogZmFsc2U7XG4gIGlmICghJGVsZW0pIHJldHVybjtcbiAgaWYgKCEkdG9nZ2xlKSByZXR1cm47XG4gIGJyZWFrcG9pbnQgPSB0eXBlb2YgYnJlYWtwb2ludCA9PT0gJ3VuZGVmaW5lZCcgPyBicmVha3BvaW50cy5tb2JpbGUgOiBicmVha3BvaW50O1xuICBqUXVlcnkuZXh0ZW5kKHZlcmdlKTtcblxuICBpZiAodmVyZ2Uudmlld3BvcnRXKCkgPj0gYnJlYWtwb2ludCkge1xuICAgICRlbGVtLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAkZWxlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlLW1vYmlsZS1zd2FwJywgJ2Fib3ZlLScgKyBicmVha3BvaW50KTtcbiAgICBbXS5mb3JFYWNoLmNhbGwoJHRvZ2dsZSwgZnVuY3Rpb24gKCRidXR0b24pIHtcbiAgICAgICRidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBpZiAocmVzaXplID09PSBmYWxzZSkge1xuICAgICAgJGVsZW0uc2V0QXR0cmlidXRlKCdkYXRhLXRvZ2dsZS1tb2JpbGUtc3dhcCcsICdiZWxvdy0nICsgYnJlYWtwb2ludCk7XG4gICAgfVxuXG4gICAgaWYgKCRlbGVtLmdldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUtbW9iaWxlLXN3YXAnKSA9PT0gJ2Fib3ZlLScgKyBicmVha3BvaW50KSB7XG4gICAgICAkZWxlbS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIFtdLmZvckVhY2guY2FsbCgkdG9nZ2xlLCBmdW5jdGlvbiAoJGJ1dHRvbikge1xuICAgICAgICAkYnV0dG9uLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgfSk7XG4gICAgICAkZWxlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlLW1vYmlsZS1zd2FwJywgJ2JlbG93LScgKyBicmVha3BvaW50KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgIHRvZ2dsZU1vYmlsZVN3YXAoJGVsZW0sICR0b2dnbGUsIGJyZWFrcG9pbnQsIHJlc2l6ZSk7XG4gIH0sIDEwMCk7XG59XG5cbjsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG5hdlRvZ2dsZUFuaW1hdGluZywgZHJvcGRvd25BbmltYXRpbmcsIGZvY3VzSnVtcFRpbWVvdXQ7XG5cbmZ1bmN0aW9uIHRvZ2dsZUJvZHlDbGFzcygkY2xhc3MpIHtcbiAgdmFyICRzdGF0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogJ2FkZCc7XG5cbiAgaWYgKCRzdGF0ZSA9PT0gJ2FkZCcpIHtcbiAgICAkYm9keS5hZGRDbGFzcygkY2xhc3MpO1xuICB9IGVsc2Uge1xuICAgICRib2R5LnJlbW92ZUNsYXNzKCRjbGFzcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJGVsZW0sICRkdXJhdGlvbikge1xuICBjbGVhclRpbWVvdXQobmF2VG9nZ2xlQW5pbWF0aW5nKTtcbiAgJGVsZW0uYWRkQ2xhc3MoJ2lzLWFuaW1hdGluZycpO1xuICBuYXZUb2dnbGVBbmltYXRpbmcgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAkZWxlbS5yZW1vdmVDbGFzcygnaXMtYW5pbWF0aW5nJyk7XG4gIH0sICRkdXJhdGlvbik7XG59XG5cbmZ1bmN0aW9uIGZvY3VzSnVtcCgkdGFyZ2V0KSB7XG4gIGNsZWFyVGltZW91dChmb2N1c0p1bXBUaW1lb3V0KTtcbiAgZm9jdXNKdW1wVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICR0YXJnZXQuZm9jdXMoKTtcbiAgfSwgNjAwKTtcbn1cblxuJHdpbmRvdy5vbignYTExeS10b2dnbGUtc2hvdzptZW51U2VhcmNoQ2FsbGJhY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKCEkc2VhcmNoVG9nZ2xlLmxlbmd0aCkgcmV0dXJuO1xuICBzZWFyY2hUb2dnbGVTdGF0ZSgnb3BlbicpO1xuICBtZW51VG9nZ2xlU3RhdGUoJ2Nsb3NlJyk7XG4gIHRvZ2dsZUFuaW1hdGlvbkNsYXNzKCQoc2VhcmNoLm5hdmlnYXRpb24pLmFkZCgkKHNpdGUub3ZlcmxheXMpKSwgMTApO1xuICBvdmVybGF5V3JhcHBlckhlaWdodE9mZnNldCgnb3BlbicpO1xufSk7XG4kd2luZG93Lm9uKCdhMTF5LXRvZ2dsZS1oaWRlOm1lbnVTZWFyY2hDYWxsYmFjaycsIGZ1bmN0aW9uIChldmVudCkge1xuICBzZWFyY2hUb2dnbGVTdGF0ZSgnY2xvc2UnKTtcbiAgdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJChzZWFyY2gubmF2aWdhdGlvbikuYWRkKCQoc2l0ZS5vdmVybGF5cykpLCA3MDApO1xuICBvdmVybGF5V3JhcHBlckhlaWdodE9mZnNldCgnY2xvc2UnKTtcbiAgJHNlYXJjaFRvZ2dsZS5mb2N1cygpO1xufSk7XG4kd2luZG93Lm9uKCdhMTF5LXRvZ2dsZS1zaG93Om1lbnVOYXZpZ2F0aW9uQ2FsbGJhY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJChtZW51Lm5hdmlnYXRpb24pLmFkZCgkbWVudVRvZ2dsZSkuYWRkKCQoc2l0ZS5vdmVybGF5cykpLCAxMCk7XG4gIG1lbnVUb2dnbGVTdGF0ZSgnb3BlbicpO1xuICBzZWFyY2hUb2dnbGVTdGF0ZSgnY2xvc2UnKTtcbiAgb3ZlcmxheVdyYXBwZXJIZWlnaHRPZmZzZXQoJ29wZW4nKTtcbn0pO1xuJHdpbmRvdy5vbignYTExeS10b2dnbGUtaGlkZTptZW51TmF2aWdhdGlvbkNhbGxiYWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gIG1lbnVUb2dnbGVTdGF0ZSgnY2xvc2UnKTtcbiAgdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJChtZW51Lm5hdmlnYXRpb24pLmFkZCgkbWVudVRvZ2dsZSkuYWRkKCQoc2l0ZS5vdmVybGF5cykpLCA3MDApO1xuICBvdmVybGF5V3JhcHBlckhlaWdodE9mZnNldCgnY2xvc2UnKTtcbiAgJG1lbnVUb2dnbGVCdXR0b24uZm9jdXMoKTtcbn0pO1xuJHdpbmRvdy5vbignYTExeS10b2dnbGUtc2hvdzpzdWJUaWVyTmF2aWdhdGlvbkNhbGxiYWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gIG1lbnVTdWJUaWVyU3RhdGUoJ29wZW4nKTtcblxuICBpZiAodmlld3BvcnRzLndpZHRoID49IGJyZWFrcG9pbnRzLnRhYmxldCkge1xuICAgIGhlYWRlck1lbnVIZWlnaHRBZGp1c3QoKTtcbiAgfSBlbHNlIHtcbiAgICBmb2N1c0p1bXAoJG1vYmlsZU1lbnVDb250YWluZXIuZmluZCgnLnN1YmxpbmtzW2FyaWEtaGlkZGVuPVwiZmFsc2VcIl0gLnN1YmxpbmtzX19iYWNrLWJ1dHRvbicpKTtcbiAgfVxufSk7XG4kd2luZG93Lm9uKCdhMTF5LXRvZ2dsZS1oaWRlOnN1YlRpZXJOYXZpZ2F0aW9uQ2FsbGJhY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgbWVudVN1YlRpZXJTdGF0ZSgnY2xvc2UnKTtcbn0pO1xuXG5mdW5jdGlvbiBzZWFyY2hUb2dnbGVTdGF0ZSgkc3RhdGUpIHtcbiAgaWYgKCEkc2VhcmNoVG9nZ2xlLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgJHN0YXRlID0gdHlwZW9mICRzdGF0ZSAhPT0gJ3VuZGVmaW5lZCcgPyAkc3RhdGUgOiAnb3Blbic7XG5cbiAgaWYgKCRzdGF0ZSA9PSAnY2xvc2UnKSB7XG4gICAgdG9nZ2xlQm9keUNsYXNzKCdzZWFyY2gtaXMtb3BlbicsICdyZW1vdmUnKTtcbiAgICAkc2VhcmNoVG9nZ2xlLnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgJHNlYXJjaFRvZ2dsZS5hdHRyKCdhcmlhLWxhYmVsJywgJ09wZW4gc2l0ZSBzZWFyY2ggZHJvcGRvd24nKTtcblxuICAgIGlmICgkc2VhcmNoVG9nZ2xlLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ3RydWUnKSB7XG4gICAgICAkc2VhcmNoVG9nZ2xlLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdG9nZ2xlQm9keUNsYXNzKCdzZWFyY2gtaXMtb3BlbicpO1xuICAgICRzZWFyY2hUb2dnbGUuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAkc2VhcmNoVG9nZ2xlLmF0dHIoJ2FyaWEtbGFiZWwnLCAnQ2xvc2Ugc2l0ZSBzZWFyY2ggZHJvcGRvd24nKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICRzaXRlU2VhcmNoRm9ybUZpZWxkLmZvY3VzKCk7XG4gICAgfSwgMzAwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtZW51VG9nZ2xlU3RhdGUoJHN0YXRlKSB7XG4gIGlmICghJG1lbnVUb2dnbGUubGVuZ3RoKSByZXR1cm47XG4gIHZhciAkc3RhdGUgPSB0eXBlb2YgJHN0YXRlICE9PSAndW5kZWZpbmVkJyA/ICRzdGF0ZSA6ICdvcGVuJztcblxuICBpZiAoJHN0YXRlID09ICdjbG9zZScpIHtcbiAgICB0b2dnbGVCb2R5Q2xhc3MoJ21lbnUtaXMtb3BlbicsICdyZW1vdmUnKTtcbiAgICB0b2dnbGVCb2R5Q2xhc3MoJ3N1Yi1tZW51LWlzLW9wZW4nLCAncmVtb3ZlJyk7XG4gICAgJG1lbnVUb2dnbGUuYWRkKCQobWVudS5uYXZpZ2F0aW9uKSkucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAkbW9iaWxlTWVudUNvbnRhaW5lci5yZW1vdmVDbGFzcygnaXMtZXhwYW5kZWQnKTtcbiAgICAkc2l0ZU92ZXJsYXlXcmFwcGVyLnJlbW92ZUF0dHIoJ2FyaWEtaGlkZGVuJyk7XG4gICAgJG1vYmlsZU1lbnVDb250YWluZXIuZmluZCgnLnN1YmxpbmtzJykuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgaWYgKCRtZW51VG9nZ2xlLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ3RydWUnKSB7XG4gICAgICAkbWVudVRvZ2dsZS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRvZ2dsZUJvZHlDbGFzcygnbWVudS1pcy1vcGVuJyk7XG4gICAgJG1lbnVUb2dnbGUuYWRkKCQobWVudS5uYXZpZ2F0aW9uKSkuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAkbWVudVRvZ2dsZUJ1dHRvbi5mb2N1cygpO1xuICAgICRzaXRlT3ZlcmxheVdyYXBwZXIuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgJG1lbnVUb2dnbGVCdXR0b24uZm9jdXMoKTtcbiAgICB9LCA2MDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIG92ZXJsYXlXcmFwcGVySGVpZ2h0T2Zmc2V0KCkge1xuICB2YXIgJHN0YXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiAnb3Blbic7XG4gIGlmICh0eXBlb2Ygc2l0ZS5hbm5vdW5jZW1lbnQgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XG4gIHZhciBoZWFkZXJIZWlnaHRPZmZzZXQgPSAkKHNpdGUuYW5ub3VuY2VtZW50KS5vdXRlckhlaWdodCgpICsgJChzaXRlLmhlYWRlcikub3V0ZXJIZWlnaHQoKTtcblxuICBpZiAoJHN0YXRlID09PSAnb3BlbicpIHtcbiAgICAkc2l0ZU92ZXJsYXlXcmFwcGVyLmFkZCgkKHNpdGUub3ZlcmxheXMpKS5jc3MoJ3BhZGRpbmctdG9wJywgaGVhZGVySGVpZ2h0T2Zmc2V0KTtcbiAgICAkc2l0ZVNlYXJjaFdyYXBwZXIuY3NzKCdtaW4taGVpZ2h0Jywgdmlld3BvcnRzLmhlaWdodCAtIGhlYWRlckhlaWdodE9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgJHNpdGVPdmVybGF5V3JhcHBlci5hZGQoJChzaXRlLm92ZXJsYXlzKSkuYWRkKCRzaXRlU2VhcmNoV3JhcHBlcikucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtZW51U3ViVGllclN0YXRlKCRzdGF0ZSkge1xuICB2YXIgJHN0YXRlID0gdHlwZW9mICRzdGF0ZSAhPT0gJ3VuZGVmaW5lZCcgPyAkc3RhdGUgOiAnb3Blbic7XG5cbiAgaWYgKCRzdGF0ZSA9PSAnY2xvc2UnKSB7XG4gICAgdG9nZ2xlQm9keUNsYXNzKCdzdWItbWVudS1pcy1vcGVuJywgJ3JlbW92ZScpO1xuICAgICRtb2JpbGVNZW51Q29udGFpbmVyLnJlbW92ZUNsYXNzKCdpcy1leHBhbmRlZCcpO1xuICAgICQoc2l0ZS5oZWFkZXIpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgJHNpdGVPdmVybGF5V3JhcHBlci5maW5kKCcuc2l0ZS1jb250ZW50X19oZXJvLXdpZGdldHMnKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICB9IGVsc2Uge1xuICAgIHRvZ2dsZUJvZHlDbGFzcygnc3ViLW1lbnUtaXMtb3BlbicpO1xuICAgICRtb2JpbGVNZW51Q29udGFpbmVyLmFkZENsYXNzKCdpcy1leHBhbmRlZCcpO1xuICB9XG59XG4vKiBNYW5hZ2UgdGhlIGFjY2Vzc2liaWxpdHkgb2YgdGhlIHRvb2x0aXAgZHJvcGRvd25zIGluIHRoZSBzZWNvbmRhcnkgbmF2aWdhdGlvblxuICogVGhpcyBpZiBmb3IgYm90aCBtb3VzZSBhbmQga2V5Ym9hcmQgdXNlcnNcbiAqXG4gKi9cblxuXG5mdW5jdGlvbiBoZWFkZXJUb29sdGlwTmF2aWdhdGlvbigpIHtcbiAgdmFyICRzZWNvbmRhcnlOYXZpZ2F0aW9uID0gJChzaXRlLmhlYWRlcikuZmluZCgnLm5hdi0tc2Vjb25kYXJ5LW5hdmlnYXRpb24gLmxpc3QtLXRpZXJlZC1uYXZpZ2F0aW9uJyksXG4gICAgICAkc2Vjb25kYXJ5TmF2aWdhdGlvbkxpbmtzID0gJHNlY29uZGFyeU5hdmlnYXRpb24uZmluZCgnPiAubGlzdF9faXRlbSAubGlzdF9fbGluaycpLFxuICAgICAgdHJhbnNpdGlvbkRlbGF5ID0gMzAwO1xuICB2YXIgaGlkZVRvb2x0aXBzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgIGlmICgkc2Vjb25kYXJ5TmF2aWdhdGlvbi5pcygnOmhvdmVyJykpIHJldHVybjtcbiAgICB2YXIgJGFsbFN1YkxpbmtzID0gJHNlY29uZGFyeU5hdmlnYXRpb24uZmluZCgnLmxpc3RfX3N1YmxpbmtzLXdyYXBwZXInKTtcbiAgICAkKHNpdGUuaGVhZGVyKS5yZW1vdmVDbGFzcygndG9vbHRpcC1vcGVuJyk7XG4gICAgJGFsbFN1YkxpbmtzLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJGFsbFN1YkxpbmtzLCA3MDApO1xuICAgIGNsZWFyVGltZW91dChkcm9wZG93bkFuaW1hdGluZyk7XG4gICAgZHJvcGRvd25BbmltYXRpbmcgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICRhbGxTdWJMaW5rcy5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuICAgICAgJHNlY29uZGFyeU5hdmlnYXRpb24uZmluZCgnLmxpc3RfX2xpbmstLWV4cGFuZGFibGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAkc2Vjb25kYXJ5TmF2aWdhdGlvbi5yZW1vdmVDbGFzcygnaXMtaG92ZXJlZCcpO1xuICAgIH0sIHRyYW5zaXRpb25EZWxheSk7XG4gIH0sIHRyYW5zaXRpb25EZWxheSk7XG4gICRzZWNvbmRhcnlOYXZpZ2F0aW9uTGlua3MuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgdmFyICR0aGlzTGluayA9ICQodGhpcyksXG4gICAgICAgICRzdWJsaW5rc1dyYXBwZXIgPSAkdGhpc0xpbmsubmV4dCgnLmxpc3RfX3N1YmxpbmtzLXdyYXBwZXInKTtcbiAgICBpZiAoISRzdWJsaW5rc1dyYXBwZXIubGVuZ3RoKSByZXR1cm47XG4gICAgdmFyICRzdWJsaW5rcyA9ICRzdWJsaW5rc1dyYXBwZXIuZmluZCgnLmxpc3RfX2xpbmsnKTtcbiAgICAkdGhpc0xpbmsuYWRkKCRzdWJsaW5rc1dyYXBwZXIpLmFkZCgkc3VibGlua3MpLm9uKCdtb3VzZWVudGVyIGZvY3VzaW4nLCBkZWJvdW5jZShmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICgkc2Vjb25kYXJ5TmF2aWdhdGlvbi5oYXNDbGFzcygnaXMtaG92ZXJlZCcpKSByZXR1cm47XG4gICAgICAkKHNpdGUuaGVhZGVyKS5hZGRDbGFzcygndG9vbHRpcC1vcGVuJyk7XG4gICAgICAkc3VibGlua3NXcmFwcGVyLmFkZENsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgICAkc2Vjb25kYXJ5TmF2aWdhdGlvbi5hZGRDbGFzcygnaXMtaG92ZXJlZCcpO1xuICAgICAgdG9nZ2xlQW5pbWF0aW9uQ2xhc3MoJHN1YmxpbmtzV3JhcHBlciwgMTApO1xuICAgIH0pKTtcbiAgICAkdGhpc0xpbmsuYWRkKCRzdWJsaW5rc1dyYXBwZXIpLmFkZCgkc3VibGlua3MpLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBoaWRlVG9vbHRpcHMoKTtcbiAgICB9KTtcbiAgICAkdGhpc0xpbmsuYWRkKCRzdWJsaW5rc1dyYXBwZXIpLmFkZCgkc3VibGlua3MpLm9uKCdibHVyJywgZGVib3VuY2UoZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAoJHN1YmxpbmtzLmlzKCc6Zm9jdXMnKSkgcmV0dXJuO1xuICAgICAgaGlkZVRvb2x0aXBzKCk7XG4gICAgfSkpO1xuICB9KTtcbiAgJHNlY29uZGFyeU5hdmlnYXRpb24ub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBoaWRlVG9vbHRpcHMoKTtcbiAgfSk7XG59XG4vKiBNYW5hZ2UgdGhlIGFjY2Vzc2liaWxpdHkgb2YgdGhlIHRvb2x0aXAgZHJvcGRvd25zIGluIHRoZSBzZWNvbmRhcnkgbmF2aWdhdGlvblxuICogVGhpcyBpZiBmb3IgYm90aCBtb3VzZSBhbmQga2V5Ym9hcmQgdXNlcnNcbiAqXG4gKi9cblxuXG5mdW5jdGlvbiBoZWFkZXJNZW51SGVpZ2h0QWRqdXN0KCkge1xuICB2YXIgY3VycmVudEhlaWdodCA9ICQoc2l0ZS5oZWFkZXIpLm91dGVySGVpZ2h0KCk7XG4gICQoc2l0ZS5oZWFkZXIpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gIGlmICh2aWV3cG9ydHMud2lkdGggPCBicmVha3BvaW50cy50YWJsZXQgfHwgISRib2R5Lmhhc0NsYXNzKCdzdWItbWVudS1pcy1vcGVuJykpIHJldHVybjtcbiAgJChzaXRlLmhlYWRlcikuYWRkQ2xhc3MoJ2lzLW1lYXN1cmluZycpO1xuICB2YXIgJG9wZW5TdWJOYXZpZ2F0aW9uID0gJChzaXRlLmhlYWRlcikuZmluZCgnLm1lbnUtbmF2aWdhdGlvbiAubGlzdC0tdGllcmVkLW5hdmlnYXRpb24gLnN1YmxpbmtzW2FyaWEtaGlkZGVuPVwiZmFsc2VcIl0nKSxcbiAgICAgIGhlaWdodE9mZnNldCA9ICRvcGVuU3ViTmF2aWdhdGlvbi5vdXRlckhlaWdodCgpICsgJChzaXRlLmhlYWRlcikub3V0ZXJIZWlnaHQoKSxcbiAgICAgICRoZXJvV2lkZ2V0cyA9ICRzaXRlT3ZlcmxheVdyYXBwZXIuZmluZCgnLnNpdGUtY29udGVudF9faGVyby13aWRnZXRzJyk7XG4gICQoc2l0ZS5oZWFkZXIpLmNzcygnbWluLWhlaWdodCcsIGN1cnJlbnRIZWlnaHQpO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAkKHNpdGUuaGVhZGVyKS5yZW1vdmVDbGFzcygnaXMtbWVhc3VyaW5nJykuY3NzKCdtaW4taGVpZ2h0JywgaGVpZ2h0T2Zmc2V0KTtcbiAgfSk7XG5cbiAgaWYgKCQoc2l0ZS5zaXRlKS5oYXNDbGFzcygnaGFzLWhlcm8taW1hZ2UnKSB8fCAkKHNpdGUuc2l0ZSkuaGFzQ2xhc3MoJ2hhcy1oZXJvLXdpZGdldCcpICYmICRoZXJvV2lkZ2V0cy5sZW5ndGgpIHtcbiAgICAkaGVyb1dpZGdldHMuY3NzKCdtYXJnaW4tdG9wJywgLWhlaWdodE9mZnNldCk7XG4gIH1cbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgXCJAYmFiZWwvaGVscGVycyAtIHR5cGVvZlwiOyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4vLyAgU2l0ZWltcHJvdmUgZml4ZXMgZm9yIGVtYmVkZGVkIG1hcHNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5mdW5jdGlvbiBpbml0TWFwcygpIHtcbiAgLy8gT1JCSVQtMTMwIC0gV2Ugd2lsbCBubyBsb25nZXIgdHJ5IHRvIGZpeCBTaXRlaW1wcm92ZSBlcnJvcnMgb24gR29vZ2xlIE1hcHNcbiAgLy8gaHR0cHM6Ly9pc3N1ZXRyYWNrZXIuZ29vZ2xlLmNvbS9pc3N1ZXMvNjk1NDE3OTJcbiAgLy8gQWR2aWNlIGZvciBjbGllbnRzIHRvIGNvbmZvcm0gd2l0aCBXQ0FHIDIuMSBBQSBzdGFuZGFyZCBpcyB0byBwcm92aWRlIHRleHQgYWx0ZXJuYXRpdmVzIGZvciB0aGUgaW5mb3JtYXRpb24gaW4gdGhlIG1hcC5cbiAgcmV0dXJuO1xufVxuXG5mdW5jdGlvbiBza2lwTWFwcygpIHtcbiAgaWYgKCh0eXBlb2Ygc2tpcEVtYmVkZGVkTWFwc0ZvcndhcmRzID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yoc2tpcEVtYmVkZGVkTWFwc0ZvcndhcmRzKSkgIT09ICdvYmplY3QnIHx8ICh0eXBlb2Ygc2tpcEVtYmVkZGVkTWFwc0JhY2t3YXJkcyA9PT0gXCJ1bmRlZmluZWRcIiA/IFwidW5kZWZpbmVkXCIgOiBfdHlwZW9mKHNraXBFbWJlZGRlZE1hcHNCYWNrd2FyZHMpKSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgJHNraXBNYXBCdXR0b25Gb3J3YXJkcyA9ICQoc2tpcEVtYmVkZGVkTWFwc0ZvcndhcmRzKTtcbiAgdmFyICRza2lwTWFwQnV0dG9uQmFja3dhcmRzID0gJChza2lwRW1iZWRkZWRNYXBzQmFja3dhcmRzKTtcbiAgdmFyICRza2lwTWFwQnV0dG9ucyA9ICRza2lwTWFwQnV0dG9uRm9yd2FyZHMuYWRkKCRza2lwTWFwQnV0dG9uQmFja3dhcmRzKTtcbiAgJHNraXBNYXBCdXR0b25zLmZvY3VzKGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCd2aXN1YWxseS1oaWRkZW4nKTtcbiAgfSk7XG4gICRza2lwTWFwQnV0dG9ucy5ibHVyKGZ1bmN0aW9uICgpIHtcbiAgICAkKHRoaXMpLmFkZENsYXNzKCd2aXN1YWxseS1oaWRkZW4nKTtcbiAgfSk7XG4gICRza2lwTWFwQnV0dG9ucy5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciAkdGhpc0J1dHRvbiA9ICQodGhpcyksXG4gICAgICAgICRwYXJlbnRXcmFwcGVyID0gJHRoaXNCdXR0b24uY2xvc2VzdCgnLmZvcm1fX2NvbXBvbmVudC0tZ29vZ2xlLW1hcCwgLmZvcm1fX2NvbXBvbmVudC0tZXNyaSwgLmZvcm1fX2NvbXBvbmVudC0tbG9jYXRpb24sIC5kZWZpbml0aW9uX19jb250ZW50LS1nb29nbGUtbWFwJyk7XG5cbiAgICBpZiAoJHRoaXNCdXR0b24uaGFzQ2xhc3MoJ2pzLW1hcC1za2lwLWZvcndhcmRzJykpIHtcbiAgICAgIHZhciAkdGFyZ2V0QnV0dG9uID0gJHBhcmVudFdyYXBwZXIuZmluZCgnLmpzLW1hcC1za2lwLWJhY2t3YXJkcycpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgJHRhcmdldEJ1dHRvbiA9ICRwYXJlbnRXcmFwcGVyLmZpbmQoJy5qcy1tYXAtc2tpcC1mb3J3YXJkcycpO1xuICAgIH1cblxuICAgIGlmICghJHRhcmdldEJ1dHRvbi5sZW5ndGgpIHJldHVybjtcbiAgICAkdGFyZ2V0QnV0dG9uLmZvY3VzKCk7XG4gIH0pO1xufSIsIid1c2Ugc3RyaWN0Jztcbi8qXG4gKiBDQVJPVVNFTFxuICogPT09PT09PT09PVxuICpcbiAqIFVzZXMgRmxpY2tpdHkgdi5eMiDigJMgaHR0cHM6Ly9mbGlja2l0eS5tZXRhZml6enkuY28vb3B0aW9ucy5odG1sXG4gKiBJbmNsdWRlcyBjdXN0b21pc2F0aW9ucyB0byBtaW1pYyB0aGUgZnVuY3Rpb25hbGl0eSBvZiBodHRwczovL3d3dy53My5vcmcvV0FJL3R1dG9yaWFscy9jYXJvdXNlbHMvd29ya2luZy1leGFtcGxlL1xuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogY2Fyb3VzZWxJbml0KCcuanMtY2Fyb3VzZWwnLCAnLnNsaWRlJyk7XG4gKlxuICogT3B0aW9ucyAoY2FuIGJlIGFsdGVyZWQgaW4gdGhlIG1hcmt1cCk6XG4gKlxuICogPGRpdiBjbGFzcz1cImNhcm91c2VsIGpzLWNhcm91c2VsXCIgZGF0YS1jYXJvdXNlbC10aXRsZT1cIk15IENhcm91c2VsXCI+IC8vIEEgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgY2Fyb3VzZWwgZm9yIHNjcmVlbnJlYWRlcnMuIFdpbGwgZGVmYXVsdCB0byB0aGUgZmlyc3QgSDEsIEgyIG9yIC53aWRnZXRfX2hlYWRpbmcgLSB3aXRoIFwiU2xpZGVzaG93IFhcIiBhcyBhIGZhbGxiYWNrXG4gKlxuICogPGRpdiBjbGFzcz1cImNhcm91c2VsIGpzLWNhcm91c2VsXCIgZGF0YS1jYXJvdXNlbC1hdXRvcGxheT1cInRydWVcIj5cbiAqIE9SXG4gKiA8ZGl2IGNsYXNzPVwiY2Fyb3VzZWwganMtY2Fyb3VzZWxcIiBkYXRhLWNhcm91c2VsLWF1dG9wbGF5PVwiMTUwMFwiPiAoaW4gbWlsbGlzZWNvbmRzKVxuICpcbiAqIDxkaXYgY2xhc3M9XCJjYXJvdXNlbCBqcy1jYXJvdXNlbFwiIGRhdGEtY2Fyb3VzZWwtZG90cz1cImZhbHNlXCI+IC8vIFRvIHJlbW92ZSB0aGUgZG90c1xuICogT1JcbiAqIDxkaXYgY2xhc3M9XCJjYXJvdXNlbCBqcy1jYXJvdXNlbFwiIGRhdGEtY2Fyb3VzZWwtZG90cz1cIiR4ICR5ICRzdGFja1wiPiAvLyBPcHRpb25hbCBDU1Mgb3ZlcnJpZGVzIC0gcG9zaXRpb25zIHRoZSBkb3RzICdjZW50ZXIgYm90dG9tIGhvcml6b250YWwnIChkZWZhdWx0KSwgJ3JpZ2h0IHRvcCB2ZXJ0aWNhbCcsICdsZWZ0IGJvdHRvbSBob3Jpem9udGFsJ1xuICpcbiAqIDxkaXYgY2xhc3M9XCJjYXJvdXNlbCBqcy1jYXJvdXNlbFwiIGRhdGEtY2Fyb3VzZWwtYXJyb3dzPVwiZmFsc2VcIj4gLy8gVG8gcmVtb3ZlIHRoZSBwcmV2aW91cyBhbmQgbmV4dCBidXR0b25zXG4gKiBPUlxuICogPGRpdiBjbGFzcz1cImNhcm91c2VsIGpzLWNhcm91c2VsXCIgZGF0YS1jYXJvdXNlbC1hcnJvd3M9XCIkeCAkeVwiPiAvLyBPcHRpb25hbCBDU1Mgb3ZlcnJpZGVzIC0gcG9zaXRpb25zIHRoZSBhcnJvd3MgJ29wcG9zaXRlIGNlbnRlcicgKGRlZmF1bHQpLCAncmlnaHQgdG9wJywgJ2xlZnQgYm90dG9tJ1xuICpcbiAqIDxkaXYgY2xhc3M9XCJjYXJvdXNlbCBqcy1jYXJvdXNlbFwiIGRhdGEtY2Fyb3VzZWwtZHJhZ2dhYmxlPVwiZmFsc2VcIj4gLy8gZGlzYWJsZSBmbGlja2l0eSdzIGRyYWdnYWJsZSBvcHRpb246IGh0dHBzOi8vZmxpY2tpdHkubWV0YWZpenp5LmNvL29wdGlvbnMuaHRtbCNkcmFnZ2FibGVcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiY2Fyb3VzZWwganMtY2Fyb3VzZWxcIiBkYXRhLWNhcm91c2VsLWFkYXB0aXZlLWhlaWdodD1cInRydWVcIj4gLy8gZW5hYmxlIGZsaWNraXR5J3MgYWRhcHRpdmUgaGVpZ2h0IG9wdGlvbjogaHR0cHM6Ly9mbGlja2l0eS5tZXRhZml6enkuY28vb3B0aW9ucy5odG1sI2FkYXB0aXZlaGVpZ2h0XG4gKlxuKi9cblxuZnVuY3Rpb24gcGF1c2VDdXJyZW50Q2Fyb3VzZWwoZWxlbWVudCkge1xuICAkKGVsZW1lbnQpLmNsb3Nlc3QoJy5mbGlja2l0eS1lbmFibGVkJykuZmxpY2tpdHkoJ3N0b3BQbGF5ZXInKTtcbn0gLy8gQWRkIHRleHQgdG8gYnV0dG9uc1xuXG5cbmZ1bmN0aW9uIGZsaWNraXR5UGFnaW5hdGlvblRleHQoJGVsLCBjYXJvdXNlbE5hbWUpIHtcbiAgJGVsLmZpbmQoJy5mbGlja2l0eS1wcmV2LW5leHQtYnV0dG9uLm5leHQnKS5hdHRyKCdhcmlhLWxhYmVsJywgJ05leHQgc2xpZGU6ICcgKyBjYXJvdXNlbE5hbWUpLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCJ2aXN1YWxseS1oaWRkZW5cIj5OZXh0IHNsaWRlOiAnICsgY2Fyb3VzZWxOYW1lICsgJzwvc3Bhbj4nKTtcbiAgJGVsLmZpbmQoJy5mbGlja2l0eS1wcmV2LW5leHQtYnV0dG9uLnByZXZpb3VzJykuYXR0cignYXJpYS1sYWJlbCcsICdQcmV2aW91cyBzbGlkZTogJyArIGNhcm91c2VsTmFtZSkuYXBwZW5kKCc8c3BhbiBjbGFzcz1cInZpc3VhbGx5LWhpZGRlblwiPlByZXZpb3VzIHNsaWRlOiAnICsgY2Fyb3VzZWxOYW1lICsgJzwvc3Bhbj4nKTtcbiAgJGVsLmZpbmQoJy5mbGlja2l0eS1idXR0b24taWNvbicpLmF0dHIoe1xuICAgICdwcmVzZXJ2ZUFzcGVjdFJhdGlvJzogJ3hNaW5ZTWlkJyxcbiAgICAnYXJpYS1oaWRkZW4nOiAndHJ1ZScsXG4gICAgJ2ZvY3VzYWJsZSc6ICdmYWxzZSdcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHdyYXBGbGlja2l0eVBhZ2VEb3RzKCRjdXJyZW50Q2Fyb3VzZWwsIHNob3dEb3RzLCBjYXJvdXNlbE5hbWUsIGNhcm91c2VsU2xpZGVDbGFzcywgc2xpZGVUaXRsZUNsYXNzKSB7XG4gIGlmICghc2hvd0RvdHMgfHwgISRjdXJyZW50Q2Fyb3VzZWwubGVuZ3RoKSByZXR1cm47XG4gIHZhciAkcGFnZURvdHMgPSAkY3VycmVudENhcm91c2VsLmZpbmQoJy5mbGlja2l0eS1wYWdlLWRvdHMnKSxcbiAgICAgICRkb3RzID0gJHBhZ2VEb3RzLmZpbmQoJy5kb3QnKSxcbiAgICAgIHNsaWRlVGl0bGVDbGFzcyA9IHR5cGVvZiBzbGlkZVRpdGxlQ2xhc3MgIT09ICd1bmRlZmluZWQnID8gc2xpZGVUaXRsZUNsYXNzIDogJy5jYXJvdXNlbF9faGVhZGluZyc7XG5cbiAgaWYgKCEkcGFnZURvdHMuY2xvc2VzdCgnLmZsaWNraXR5LXBhZ2UtZG90cy13cmFwcGVyJykubGVuZ3RoKSB7XG4gICAgJHBhZ2VEb3RzLndyYXAoJzxkaXYgY2xhc3M9XCJmbGlja2l0eS1wYWdlLWRvdHMtd3JhcHBlclwiPjwvZGl2PicpO1xuICB9XG5cbiAgJGRvdHMucmVtb3ZlQXR0cignYXJpYS1sYWJlbCcpLmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgdmFyICRkb3QgPSAkKHRoaXMpLFxuICAgICAgICBkb3RUZXh0ID0gJ1NsaWRlICcgKyAoaW5kZXggKyAxKSxcbiAgICAgICAgJHRhcmdldFNsaWRlSGVhZGluZyA9ICRjdXJyZW50Q2Fyb3VzZWwuZmluZChjYXJvdXNlbFNsaWRlQ2xhc3MgKyAnOmVxKCcgKyBpbmRleCArICcpJykuZmluZChzbGlkZVRpdGxlQ2xhc3MpLnRleHQoKTtcbiAgICBpZiAoJGRvdC5maW5kKCcuZmxpY2tpdHktcGFnZS1kb3RzX19idXR0b24nKS5sZW5ndGgpIHJldHVybjtcblxuICAgIGlmICgkdGFyZ2V0U2xpZGVIZWFkaW5nLmxlbmd0aCkge1xuICAgICAgZG90VGV4dCArPSAnOiAnICsgJHRhcmdldFNsaWRlSGVhZGluZztcbiAgICB9XG5cbiAgICB2YXIgJG5ld0J1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJmbGlja2l0eS1wYWdlLWRvdHNfX2J1dHRvblwiPjxzcGFuIGNsYXNzPVwidmlzdWFsbHktaGlkZGVuXCI+JyArIGRvdFRleHQgKyAnPC9zcGFuPjwvYnV0dG9uPicpO1xuICAgICRkb3QuYXBwZW5kKCRuZXdCdXR0b24pO1xuICAgICRuZXdCdXR0b24ub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJCh0aGlzKS5jbG9zZXN0KCcuZG90JykudHJpZ2dlcignY2xpY2snKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHdyYXBGbGlja2l0eVByZXZOZXh0QnV0dG9ucygkY3VycmVudENhcm91c2VsLCBzaG93QXJyb3dzKSB7XG4gIGlmICghc2hvd0Fycm93cyB8fCAhJGN1cnJlbnRDYXJvdXNlbC5sZW5ndGgpIHJldHVybjtcbiAgdmFyICRwcmV2QnV0dG9uID0gJGN1cnJlbnRDYXJvdXNlbC5maW5kKCcuZmxpY2tpdHktcHJldi1uZXh0LWJ1dHRvbi5wcmV2aW91cycpLFxuICAgICAgJG5leHRCdXR0b24gPSAkY3VycmVudENhcm91c2VsLmZpbmQoJy5mbGlja2l0eS1wcmV2LW5leHQtYnV0dG9uLm5leHQnKSxcbiAgICAgICR2aWV3cG9ydCA9ICRjdXJyZW50Q2Fyb3VzZWwuZmluZCgnLmZsaWNraXR5LXZpZXdwb3J0Jyk7XG4gICRwcmV2QnV0dG9uLmFkZCgkbmV4dEJ1dHRvbikud3JhcEFsbCgnPGRpdiBjbGFzcz1cImZsaWNraXR5LWJ1dHRvbnMtd3JhcHBlclwiPjwvZGl2PicpO1xuICAkcHJldkJ1dHRvbi5pbnNlcnRBZnRlcigkbmV4dEJ1dHRvbik7IC8vIEZsaXAgdGhlIHRhYmJpbmcgb3JkZXIgc28gdGhhdCB0aGUgbmV4dCBidXR0b24gY29tZXMgZmlyc3QoKVxuXG4gICRjdXJyZW50Q2Fyb3VzZWwuZmluZCgnLmZsaWNraXR5LWJ1dHRvbnMtd3JhcHBlcicpLmluc2VydEJlZm9yZSgkdmlld3BvcnQpOyAvLyBNb3ZlIHRoZSBidXR0b25zIGJlZm9yZSB0aGUgY29udGVudCBpbiB0aGUgdGFiYmluZyBvcmRlclxufVxuXG5mdW5jdGlvbiBjYXJvdXNlbFRhYmJpbmdDb250cm9sKCRjdXJyZW50Q2Fyb3VzZWwsIGluZGV4LCBjYXJvdXNlbFNsaWRlQ2xhc3MpIHtcbiAgaWYgKCEkY3VycmVudENhcm91c2VsLmxlbmd0aCkgcmV0dXJuO1xuICB2YXIgY2Fyb3VzZWxTbGlkZUNsYXNzID0gdHlwZW9mIGNhcm91c2VsU2xpZGVDbGFzcyAhPT0gJ3VuZGVmaW5lZCcgPyBjYXJvdXNlbFNsaWRlQ2xhc3MgOiAnLnNsaWRlJyxcbiAgICAgICRzbGlkZXMgPSAkY3VycmVudENhcm91c2VsLmZpbmQoY2Fyb3VzZWxTbGlkZUNsYXNzKSxcbiAgICAgICRzbGlkZXNTZWxlY3RlZCA9ICRjdXJyZW50Q2Fyb3VzZWwuZmluZChjYXJvdXNlbFNsaWRlQ2xhc3MgKyAnLmlzLXNlbGVjdGVkJyksXG4gICAgICAkc2xpZGVMaW5rcyA9ICRzbGlkZXMuZmluZCgnYSwgYnV0dG9uLCBpbnB1dDpub3QoW3R5cGU9XCJoaWRkZW5cIl0pLCB0ZXh0YXJlYSwgc2VsZWN0JyksXG4gICAgICAkcGFnZURvdFdyYXBwZXIgPSAkY3VycmVudENhcm91c2VsLmZpbmQoJy5mbGlja2l0eS1wYWdlLWRvdHMtd3JhcHBlcicpO1xuICAkc2xpZGVMaW5rcy5hdHRyKCd0YWJpbmRleCcsICctMScpO1xuICAkc2xpZGVzU2VsZWN0ZWQuZmluZCgnYSwgYnV0dG9uLCBpbnB1dDpub3QoW3R5cGU9XCJoaWRkZW5cIl0pLCB0ZXh0YXJlYSwgc2VsZWN0JykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgJHBhZ2VEb3RXcmFwcGVyLmZpbmQoJy5mbGlja2l0eS1wYWdlLWRvdHNfX2J1dHRvbicpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkIHRhYmluZGV4Jyk7XG4gICRwYWdlRG90V3JhcHBlci5maW5kKCcuZG90LmlzLXNlbGVjdGVkIC5mbGlja2l0eS1wYWdlLWRvdHNfX2J1dHRvbicpLmF0dHIoe1xuICAgICdkaXNhYmxlZCc6ICcnLFxuICAgICd0YWJpbmRleCc6IC0xXG4gIH0pO1xufVxuLypcbiAqIElmIHVwZGF0ZSBpcyBmYWxzZSAoZGVmYXVsdCksIGNyZWF0ZSBhIG5ldyBhcmlhLWxpdmUgcmVnaW9uIGZvciB0aGUgY2Fyb3VzZWwsIG9yIHJlLXVzZSBvbmUgdGhhdCBpcyBpbiB0aGUgbWFya3VwIHdpdGggdGhlIGNsYXNzbmFtZSAuanMtYXJpYS1saXZlXG4gKiBJZiB1cGRhdGUgaXMgc2V0IHRvIHRydWUgdGhlbiBhbWVuZCB0aGUgYXJpYS1saXZlIG1lc3NhZ2UgdG8gcmVhZCBcIk5vdyB2aWV3aW5nIHNsaWRlIFggb2YgWFwiXG4gKlxuKi9cblxuXG5mdW5jdGlvbiBjYXJvdXNlbEFyaWFMaXZlKCkge1xuICB2YXIgdXBkYXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBmYWxzZTtcbiAgdmFyICRhcmlhTGl2ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogdW5kZWZpbmVkO1xuICB2YXIgY2Fyb3VzZWxOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiB1bmRlZmluZWQ7XG4gIHZhciBjYXJvdXNlbElkID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgPyBhcmd1bWVudHNbM10gOiB1bmRlZmluZWQ7XG4gIHZhciAkY3VycmVudENhcm91c2VsID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgPyBhcmd1bWVudHNbNF0gOiB1bmRlZmluZWQ7XG4gIHZhciBzbGlkZUNvdW50ID0gYXJndW1lbnRzLmxlbmd0aCA+IDUgPyBhcmd1bWVudHNbNV0gOiB1bmRlZmluZWQ7XG4gIHZhciBmbGt0eVN0YW5kYXJkID0gYXJndW1lbnRzLmxlbmd0aCA+IDYgPyBhcmd1bWVudHNbNl0gOiB1bmRlZmluZWQ7XG4gIGlmICghJGN1cnJlbnRDYXJvdXNlbC5sZW5ndGggfHwgc2xpZGVDb3VudCA8IDIgfHwgdHlwZW9mIGNhcm91c2VsTmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcblxuICBpZiAoIXVwZGF0ZSkge1xuICAgIC8vIElmIGFyaWEgbGl2ZSBlbGVtZW50IGlzIGRldGVjdGVkIGluIHRoZSBtYXJrdXAsIHVzZSB0aGF0LiBPdGhlcndpc2UgY3JlYXRlIG9uZS5cbiAgICBpZiAoISRhcmlhTGl2ZS5sZW5ndGgpIHtcbiAgICAgICRhcmlhTGl2ZSA9ICQoJzxkaXYgY2xhc3M9XCJjYXJvdXNlbF9fYXJpYS1saXZlIGpzLWFyaWEtbGl2ZVwiIGlkPVwic2xpZGVzaG93LScgKyBjYXJvdXNlbElkICsgJ1wiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIHJvbGU9XCJzdGF0dXNcIj5Ob3cgdmlld2luZyBzbGlkZSA8c3BhbiBjbGFzcz1cImpzLWFyaWEtbGl2ZV9fdGV4dFwiPjEgb2YgJyArIHNsaWRlQ291bnQgKyAnPC9zcGFuPjogJyArIGNhcm91c2VsTmFtZSArICc8L2Rpdj4nKTtcbiAgICAgICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignYXJpYS1sYWJlbGxlZGJ5JywgJ3NsaWRlc2hvdy0nICsgY2Fyb3VzZWxJZCkucHJlcGVuZCgkYXJpYUxpdmUpO1xuICAgIH1cblxuICAgIHJldHVybiAkYXJpYUxpdmU7XG4gIH1cblxuICBpZiAodHlwZW9mIGZsa3R5U3RhbmRhcmQgPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAkYXJpYUxpdmU7XG4gICRhcmlhTGl2ZS5maW5kKCcuanMtYXJpYS1saXZlX190ZXh0JykuaHRtbChmbGt0eVN0YW5kYXJkLnNlbGVjdGVkSW5kZXggKyAxICsgJyBvZiAnICsgZmxrdHlTdGFuZGFyZC5zbGlkZXMubGVuZ3RoKTtcbiAgcmV0dXJuICRhcmlhTGl2ZTtcbn1cblxuZnVuY3Rpb24gY2Fyb3VzZWxJbml0KGNhcm91c2VsQ2xhc3MsIGNhcm91c2VsU2xpZGVDbGFzcykge1xuICB2YXIgJGNhcm91c2VscyA9ICQoY2Fyb3VzZWxDbGFzcyksXG4gICAgICBjYXJvdXNlbFNsaWRlQ2xhc3MgPSB0eXBlb2YgY2Fyb3VzZWxTbGlkZUNsYXNzICE9PSAndW5kZWZpbmVkJyA/IGNhcm91c2VsU2xpZGVDbGFzcyA6ICcuc2xpZGUnO1xuICBpZiAoISRjYXJvdXNlbHMubGVuZ3RoKSByZXR1cm47XG4gICRjYXJvdXNlbHMuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICB2YXIgJGN1cnJlbnRDYXJvdXNlbCA9ICQodGhpcyksXG4gICAgICAgIGNhcm91c2VsSWQgPSBpbmRleCArIDEsXG4gICAgICAgIHNsaWRlQ291bnQgPSAkY3VycmVudENhcm91c2VsLmZpbmQoY2Fyb3VzZWxTbGlkZUNsYXNzKS5sZW5ndGgsXG4gICAgICAgIGF1dG9QbGF5U3BlZWQgPSB0eXBlb2YgJGN1cnJlbnRDYXJvdXNlbC5hdHRyKCdkYXRhLWNhcm91c2VsLWF1dG9wbGF5JykgIT09ICd1bmRlZmluZWQnID8gJGN1cnJlbnRDYXJvdXNlbC5hdHRyKCdkYXRhLWNhcm91c2VsLWF1dG9wbGF5JykgOiBmYWxzZSxcbiAgICAgICAgYWRhcHRpdmVIZWlnaHQgPSB0eXBlb2YgJGN1cnJlbnRDYXJvdXNlbC5hdHRyKCdkYXRhLWNhcm91c2VsLWFkYXB0aXZlLWhlaWdodCcpICE9PSAndW5kZWZpbmVkJyA/ICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignZGF0YS1jYXJvdXNlbC1hZGFwdGl2ZS1oZWlnaHQnKSA6IGZhbHNlLFxuICAgICAgICBncm91cENlbGxzID0gdHlwZW9mICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignZGF0YS1jYXJvdXNlbC1ncm91cC1jZWxscycpICE9PSAndW5kZWZpbmVkJyA/ICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignZGF0YS1jYXJvdXNlbC1ncm91cC1jZWxscycpIDogZmFsc2UsXG4gICAgICAgIHNob3dEb3RzID0gJGN1cnJlbnRDYXJvdXNlbC5hdHRyKCdkYXRhLWNhcm91c2VsLWRvdHMnKSA9PT0gJ2ZhbHNlJyA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgc2hvd0Fycm93cyA9ICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignZGF0YS1jYXJvdXNlbC1hcnJvd3MnKSA9PT0gJ2ZhbHNlJyA/IGZhbHNlIDogdHJ1ZSxcbiAgICAgICAgZHJhZ2dhYmxlID0gJGN1cnJlbnRDYXJvdXNlbC5hdHRyKCdkYXRhLWNhcm91c2VsLWRyYWdnYWJsZScpID09PSAnZmFsc2UnID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICAkYXJpYUxpdmUgPSAkY3VycmVudENhcm91c2VsLmZpbmQoJy5qcy1hcmlhLWxpdmUnKTtcbiAgICBpZiAoJGN1cnJlbnRDYXJvdXNlbC5wYXJlbnQoJ2NvZGUnKS5sZW5ndGggfHwgJGN1cnJlbnRDYXJvdXNlbC5wYXJlbnQoJ3ByZScpLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgaWYgKHR5cGVvZiAkY3VycmVudENhcm91c2VsLmF0dHIoJ2RhdGEtY2Fyb3VzZWwtdGl0bGUnKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBmYWxsYmFja1RpdGxlID0gJGN1cnJlbnRDYXJvdXNlbC5hZGQoJGN1cnJlbnRDYXJvdXNlbC5jbG9zZXN0KCcud2lkZ2V0JykpLmZpbmQoJ2gxLCBoMiwgLndpZGdldF9faGVhZGluZycpLmZpcnN0KCkudGV4dCgpLnRyaW0oKTtcbiAgICAgIHZhciBjYXJvdXNlbE5hbWUgPSB0eXBlb2YgZmFsbGJhY2tUaXRsZSA9PT0gJ3VuZGVmaW5lZCcgPyAnU2xpZGVzaG93ICcgKyBjYXJvdXNlbElkIDogZmFsbGJhY2tUaXRsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNhcm91c2VsTmFtZSA9ICRjdXJyZW50Q2Fyb3VzZWwuYXR0cignZGF0YS1jYXJvdXNlbC10aXRsZScpO1xuICAgIH1cblxuICAgIGlmIChzbGlkZUNvdW50IDwgMikgcmV0dXJuO1xuICAgICRhcmlhTGl2ZSA9IGNhcm91c2VsQXJpYUxpdmUoZmFsc2UsICRhcmlhTGl2ZSwgY2Fyb3VzZWxOYW1lLCBjYXJvdXNlbElkLCAkY3VycmVudENhcm91c2VsLCBzbGlkZUNvdW50KTtcbiAgICAkY3VycmVudENhcm91c2VsLm9uKCdyZWFkeS5mbGlja2l0eScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHdyYXBGbGlja2l0eVBhZ2VEb3RzKCRjdXJyZW50Q2Fyb3VzZWwsIHNob3dEb3RzLCBjYXJvdXNlbE5hbWUpO1xuICAgICAgd3JhcEZsaWNraXR5UHJldk5leHRCdXR0b25zKCRjdXJyZW50Q2Fyb3VzZWwsIHNob3dBcnJvd3MpO1xuICAgICAgY2Fyb3VzZWxUYWJiaW5nQ29udHJvbCgkY3VycmVudENhcm91c2VsLCAwLCBjYXJvdXNlbFNsaWRlQ2xhc3MpO1xuICAgIH0pO1xuICAgICRjdXJyZW50Q2Fyb3VzZWwub24oJ3NlbGVjdC5mbGlja2l0eScsIGZ1bmN0aW9uIChldmVudCwgaW5kZXgpIHtcbiAgICAgIGNhcm91c2VsVGFiYmluZ0NvbnRyb2woJGN1cnJlbnRDYXJvdXNlbCwgaW5kZXgsIGNhcm91c2VsU2xpZGVDbGFzcyk7XG4gICAgICAkYXJpYUxpdmUgPSBjYXJvdXNlbEFyaWFMaXZlKHRydWUsICRhcmlhTGl2ZSwgY2Fyb3VzZWxOYW1lLCBjYXJvdXNlbElkLCAkY3VycmVudENhcm91c2VsLCBzbGlkZUNvdW50LCBmbGt0eVN0YW5kYXJkKTtcbiAgICB9KTtcbiAgICAkY3VycmVudENhcm91c2VsLmZsaWNraXR5KHtcbiAgICAgIGFjY2Vzc2liaWxpdHk6IGZhbHNlLFxuICAgICAgYWRhcHRpdmVIZWlnaHQ6IGFkYXB0aXZlSGVpZ2h0LFxuICAgICAgYXV0b1BsYXk6IGF1dG9QbGF5U3BlZWQsXG4gICAgICBjZWxsU2VsZWN0b3I6IGNhcm91c2VsU2xpZGVDbGFzcyxcbiAgICAgIGdyb3VwQ2VsbHM6IGdyb3VwQ2VsbHMsXG4gICAgICBkcmFnZ2FibGU6IGRyYWdnYWJsZSxcbiAgICAgIGltYWdlc0xvYWRlZDogdHJ1ZSxcbiAgICAgIHBhZ2VEb3RzOiBzaG93RG90cyxcbiAgICAgIHByZXZOZXh0QnV0dG9uczogc2hvd0Fycm93cyxcbiAgICAgIHdyYXBBcm91bmQ6IHRydWVcbiAgICB9KTtcbiAgICB2YXIgZmxrdHlTdGFuZGFyZCA9ICRjdXJyZW50Q2Fyb3VzZWwuZGF0YSgnZmxpY2tpdHknKSxcbiAgICAgICAgJGZsaWNraXR5U2xpZGVyID0gJGN1cnJlbnRDYXJvdXNlbC5maW5kKCcuZmxpY2tpdHktc2xpZGVyJyksXG4gICAgICAgICRzbGlkZUxpbmtzID0gJGN1cnJlbnRDYXJvdXNlbC5maW5kKCdhLCBpZnJhbWUnKTtcbiAgICBmbGlja2l0eVBhZ2luYXRpb25UZXh0KCRjdXJyZW50Q2Fyb3VzZWwsIGNhcm91c2VsTmFtZSk7IC8vIE9uIHdpbmRvdyByZXNpemUuLi5cblxuICAgIGlmICghZ3JvdXBDZWxscykgcmV0dXJuO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgICB3cmFwRmxpY2tpdHlQYWdlRG90cygkY3VycmVudENhcm91c2VsLCBzaG93RG90cywgY2Fyb3VzZWxOYW1lKTtcbiAgICB9LCAxMDApKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgICAkY3VycmVudENhcm91c2VsLmZsaWNraXR5KCdyZWxvYWRDZWxscycpO1xuICAgICAgd3JhcEZsaWNraXR5UGFnZURvdHMoJGN1cnJlbnRDYXJvdXNlbCwgc2hvd0RvdHMsIGNhcm91c2VsTmFtZSk7XG4gICAgfSwgMzAwKSk7XG4gIH0pO1xufVxuXG47IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogUmVzcG9uc2l2ZSB0YWJsZXNcbiAqXG4gKiBBcHBseSByZXNwb25zaXZlIGNsYXNzIGlmIHRoZSB0YWJsZSBpcyBsYXJnZXIgdGhhbiB0aGUgY29udGFpbmVyXG4gKiBDb3B5IHRhYmxlIGhlYWRpbmdzIGludG8gZWFjaCBkYXRhIGNlbGwsIHdyYXAgdGFibGUgaW4gYSBjb250YWluZXJcbiAqL1xudmFyIHJlc3BvbnNpdmVUYWJsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIC8qKlxuICAgKiBSZXNwb25zaXZlIGNoZWNrXG4gICAqXG4gICAqIEFwcGx5IHJlc3BvbnNpdmUgY2xhc3MgaWYgdGhlIHRhYmxlIGlzIGxhcmdlciB0aGFuIHRoZSBjb250YWluZXJcbiAgICovXG4gIHZhciByZXNwb25zaXZlQ2hlY2sgPSBkZWJvdW5jZShmdW5jdGlvbiAoKSB7XG4gICAgJHNpdGVNYWluLmZpbmQoJ3RhYmxlOm5vdCguY2FsZW5kYXJfX3RhYmxlKTpub3QoLmZvcm1fX21hdHJpeCknKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICB2YXIgJHRhYmxlV3JhcHBlciA9ICR0aGlzLmNsb3Nlc3QoJy50YWJsZS13cmFwcGVyJyk7XG4gICAgICAkdGFibGVXcmFwcGVyLnJlbW92ZUNsYXNzKCdyZXNwb25zaXZlJyk7XG4gICAgICBpZiAoJHRhYmxlV3JhcHBlci5jbG9zZXN0KCcuanMtYnJhbmNoLXNlY3Rpb24nKS5sZW5ndGgpIHJldHVybjtcblxuICAgICAgaWYgKCR0YWJsZVdyYXBwZXIuY2xvc2VzdCgnLm1hdHJpeC13cmFwcGVyJykubGVuZ3RoKSB7XG4gICAgICAgICR0aGlzLmFkZENsYXNzKCdmb3JtX19tYXRyaXgnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoJHRoaXMub3V0ZXJXaWR0aCgpID4gJHRhYmxlV3JhcHBlci5vdXRlcldpZHRoKCkpIHtcbiAgICAgICAgJHRhYmxlV3JhcHBlci5hZGRDbGFzcygncmVzcG9uc2l2ZScpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCAyNTApO1xuICAvKipcbiAgICogQW1lbmQgdGFibGUgbWFya3VwXG4gICAqXG4gICAqIENvcHkgdGFibGUgaGVhZGluZ3MgaW50byBlYWNoIGRhdGEgY2VsbCwgd3JhcCB0YWJsZSBpbiBhIGNvbnRhaW5lclxuICAgKi9cblxuICB2YXIgdGFibGVNYXJrVXAgPSBmdW5jdGlvbiB0YWJsZU1hcmtVcCgpIHtcbiAgICAkc2l0ZU1haW4uZmluZCgndGFibGU6bm90KC5jYWxlbmRhcl9fdGFibGUpOm5vdCguZm9ybV9fbWF0cml4KScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR0YWJsZSA9ICQodGhpcyk7XG4gICAgICAkdGFibGUuZmluZCgndGhlYWQgdGgsIHRoZWFkIHRkJykuZWFjaChmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgdmFyICR0aCA9ICQodGhpcykuaHRtbCgpLnRyaW0oKTtcbiAgICAgICAgdmFyICRjb3VudCA9IGluZGV4ICsgMTtcbiAgICAgICAgaWYgKCEkdGgubGVuZ3RoIHx8ICR0aCA9PSAnJm5ic3A7JykgcmV0dXJuO1xuICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdGQ6bnRoLWNoaWxkKCcgKyAkY291bnQgKyAnKSwgdGJvZHkgdGg6bnRoLWNoaWxkKCcgKyAkY291bnQgKyAnKScpLnByZXBlbmQoJzxzcGFuIGNsYXNzPVwibW9iaWxlLXRoXCI+JyArICR0aCArICc8c3BhbiBjbGFzcz1cIm1vYmlsZS10aF9fc2VwZXJhdG9yXCI+Ojwvc3Bhbj4gPC9zcGFuPicpO1xuICAgICAgfSk7XG4gICAgICAkdGFibGUud3JhcCgnPGRpdiBjbGFzcz1cInRhYmxlLXdyYXBwZXJcIj48L2Rpdj4nKTtcbiAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIEV4cG9zZXMgdGhlIG1ldGhvZHNcbiAgICovXG5cblxuICByZXR1cm4ge1xuICAgIGNoZWNrOiByZXNwb25zaXZlQ2hlY2ssXG4gICAgYW1lbmRNYXJrVXA6IHRhYmxlTWFya1VwXG4gIH07XG59KCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIGRhdGVJbnB1dFBvbHlmaWxsU2l0ZWltcHJvdmVGaXhlcygpIHtcbiAgaWYgKCEkZm9ybXMubGVuZ3RoIHx8ICEkYm9keS5sZW5ndGgpIHJldHVybjtcbiAgdmFyICRwb2x5ZmlsbFdyYXBwZXIgPSAkYm9keS5maW5kKCdkYXRlLWlucHV0LXBvbHlmaWxsJyk7XG4gIGlmICghJHBvbHlmaWxsV3JhcHBlci5sZW5ndGgpIHJldHVybjtcbiAgdmFyICR5ZWFyU2VsZWN0ID0gJHBvbHlmaWxsV3JhcHBlci5maW5kKCcueWVhclNlbGVjdCcpLFxuICAgICAgJHllYXJTZWxlY3RXcmFwcGVyID0gJHllYXJTZWxlY3QuY2xvc2VzdCgnLnllYXJTZWxlY3Qtd3JhcHBlcicpLFxuICAgICAgJG1vbnRoU2VsZWN0ID0gJHBvbHlmaWxsV3JhcHBlci5maW5kKCcubW9udGhTZWxlY3QnKSxcbiAgICAgICRtb250aFNlbGVjdFdyYXBwZXIgPSAkbW9udGhTZWxlY3QuY2xvc2VzdCgnLm1vbnRoU2VsZWN0LXdyYXBwZXInKTtcblxuICBpZiAodHlwZW9mICR5ZWFyU2VsZWN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICR5ZWFyU2VsZWN0LmF0dHIoJ2lkJywgJ2RhdGUtaW5wdXQtcG9seWZpbGwteWVhci1zZWxlY3QnKTtcbiAgICAkeWVhclNlbGVjdFdyYXBwZXIucHJlcGVuZCgnPGxhYmVsIGNsYXNzPVwidmlzdWFsbHktaGlkZGVuXCIgZm9yPVwiZGF0ZS1pbnB1dC1wb2x5ZmlsbC15ZWFyLXNlbGVjdFwiPlNlbGVjdCBZZWFyPC9sYWJlbD4nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgJG1vbnRoU2VsZWN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICRtb250aFNlbGVjdC5hdHRyKCdpZCcsICdkYXRlLWlucHV0LXBvbHlmaWxsLW1vbnRoLXNlbGVjdCcpO1xuICAgICRtb250aFNlbGVjdFdyYXBwZXIucHJlcGVuZCgnPGxhYmVsIGNsYXNzPVwidmlzdWFsbHktaGlkZGVuXCIgZm9yPVwiZGF0ZS1pbnB1dC1wb2x5ZmlsbC1tb250aC1zZWxlY3RcIj5TZWxlY3QgTW9udGg8L2xhYmVsPicpO1xuICB9XG5cbiAgJHBvbHlmaWxsV3JhcHBlci5hcHBlbmRUbygkc2l0ZU1haW4pO1xufVxuXG4oZnVuY3Rpb24gZGF0ZUlucHV0Rm9ybWF0KCkge1xuICBpZiAoTW9kZXJuaXpyLmlucHV0dHlwZXMuZGF0ZSkgcmV0dXJuO1xuICB2YXIgZGF0ZUZvcm1hdCA9ICd5eXl5LW1tLWRkJyxcbiAgICAgICRmb3JtRGF0ZU5vdGUgPSAnPHNwYW4gY2xhc3M9XCJmb3JtX19leHBlY3RlZC1mb3JtYXRcIj48c3BhbiBjbGFzcz1cInZpc3VhbGx5LWhpZGRlblwiPkRhdGUgZm9ybWF0OiA8L3NwYW4+PHNwYW4gY2xhc3M9XCJmb3JtX192YWxpZC1mb3JtYXRcIj4nICsgZGF0ZUZvcm1hdCArICc8L3NwYW4+PC9zcGFuPic7XG5cbiAgZnVuY3Rpb24gdXBkYXRlRGF0ZUZvcm1hdCgpIHtcbiAgICAkZm9ybXMuZmluZCgnW3R5cGU9XCJkYXRlXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgJHRoaXNEYXRlRmllbGQgPSAkKHRoaXMpLFxuICAgICAgICAgIHZhbHVlID0gJHRoaXNEYXRlRmllbGQudmFsKCksXG4gICAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgICAgZXhwZWN0ZWRGb3JtYXRSZWdFeCA9IC9eKFswLTJdWzAtOV18KDMpWzAtMV0pKFxcLykoKCgwKVswLTldKXwoKDEpWzAtMl0pKShcXC8pXFxkezR9JC8sXG4gICAgICAgICAgaXNFeHBlY3RlZEZvcm1hdCA9IGV4cGVjdGVkRm9ybWF0UmVnRXgudGVzdCh2YWx1ZSk7XG5cbiAgICAgIGlmIChpc0V4cGVjdGVkRm9ybWF0ICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHZhciBkYXRlID0gdmFsdWUuc3BsaXQoXCIvXCIpLFxuICAgICAgICAgICAgZGF5ID0gZGF0ZVswXSxcbiAgICAgICAgICAgIG1vbnRoID0gZGF0ZVsxXSxcbiAgICAgICAgICAgIHllYXIgPSBkYXRlWzJdO1xuICAgICAgICBuZXdWYWx1ZSA9IHllYXIgKyAnLScgKyBtb250aCArICctJyArIGRheTtcbiAgICAgICAgJHRoaXNEYXRlRmllbGQudmFsKG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gICRmb3Jtcy5maW5kKCdbdHlwZT1cImRhdGVcIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgJGZvcm1GaWVsZCA9ICQodGhpcyksXG4gICAgICAgICRkYXRlRmllbGRJRCA9ICRmb3JtRmllbGQuYXR0cignaWQnKSxcbiAgICAgICAgJGZvcm1Db21wb25lbnQgPSAkZm9ybUZpZWxkLmNsb3Nlc3QoJy5mb3JtX19jb21wb25lbnQnLCAnLmZvcm1fX2NvbnRyb2wnKSxcbiAgICAgICAgJGZvcm1IZWxwID0gJGZvcm1Db21wb25lbnQuZmluZCgnLmZvcm1fX2hlbHAnKTsgLy8gU2V0IGRhdGUgZm9ybWF0IGZvciBwb2x5ZmlsbCB0byBodW1hbiByZWFkYWJsZVxuXG4gICAgJGZvcm1GaWVsZC5hdHRyKHtcbiAgICAgICdhcmlhLWRlc2NyaWJlZGJ5JzogJ2hlbHBfdGV4dF8nICsgJGRhdGVGaWVsZElEXG4gICAgfSk7XG4gICAgJGZvcm1GaWVsZC5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgdXBkYXRlRGF0ZUZvcm1hdCgpO1xuICAgIH0pO1xuXG4gICAgaWYgKCRmb3JtQ29tcG9uZW50LmZpbmQoJy5mb3JtX19leHBlY3RlZC1mb3JtYXQnKS5sZW5ndGggfHwgJGZvcm1IZWxwLnRleHQoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZGF0ZUZvcm1hdCkgIT09IC0xKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCRmb3JtSGVscC5sZW5ndGgpIHtcbiAgICAgIHZhciAkZm9ybWF0SW5uZXJXcmFwcGVyID0gJzxzcGFuIGNsYXNzPVwiZm9ybV9fZXhwZWN0ZWQtZm9ybWF0LWlubmVyLXdyYXBwZXJcIj4nICsgJGZvcm1EYXRlTm90ZSArICc8L3NwYW4+JztcblxuICAgICAgaWYgKCRmb3JtSGVscC50ZXh0KCkgPT09ICdkZC9tbS95eXl5Jykge1xuICAgICAgICAkZm9ybUhlbHAuaHRtbCgkZm9ybWF0SW5uZXJXcmFwcGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRmb3JtSGVscC5hcHBlbmQoJyAnICsgJGZvcm1hdElubmVyV3JhcHBlcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkZm9ybUNvbXBvbmVudC5hcHBlbmQoJzxzcGFuIGNsYXNzPVwiZm9ybV9faGVscFwiIGlkPVwiaGVscF90ZXh0XycgKyAkZGF0ZUZpZWxkSUQgKyAnXCI+JyArICRmb3JtRGF0ZU5vdGUgKyAnPC9zcGFuPicpO1xuICB9KTtcbiAgJGZvcm1zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICQodGhpcykuc3VibWl0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHVwZGF0ZURhdGVGb3JtYXQoKTtcbiAgICB9KTtcbiAgfSk7XG59KSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyAgSXNvdG9wZSBsYXlvdXQgdXNpbmcgZGF0YSBhdHRyaWJ1dGVcbi8vICBodHRwczovL2lzb3RvcGUubWV0YWZpenp5LmNvL1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuKGZ1bmN0aW9uICgpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gICQoJ1tkYXRhLWVuYWJsZS1tYXNvbnJ5XScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICRpc290b3BlVGFyZ2V0ID0gJHRoaXMuYXR0cignZGF0YS1lbmFibGUtbWFzb25yeScpO1xuICAgICR0aGlzLmlzb3RvcGUoe1xuICAgICAgaXRlbVNlbGVjdG9yOiAkaXNvdG9wZVRhcmdldCxcbiAgICAgIGxheW91dE1vZGU6ICdtYXNvbnJ5JyxcbiAgICAgIG1hc29ucnk6IHtcbiAgICAgICAgaG9yaXpvbnRhbE9yZGVyOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoaW1hZ2VzTG9hZGVkKSB7XG4gICAgICAkdGhpcy5pbWFnZXNMb2FkZWQoKS5wcm9ncmVzcyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICR0aGlzLmlzb3RvcGUoJ2xheW91dCcpO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn0pKCk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4oZnVuY3Rpb24gKCQpIHtcbiAgZnVuY3Rpb24gZHVwbGljYXRlQnJlYWRjcnVtYnNJbnNpZGVIZXJvV2lkZ2V0KCkge1xuICAgIGlmICghJChzaXRlLnNpdGUpLmhhc0NsYXNzKCdoYXMtaGVyby13aWRnZXQnKSB8fCAhJGJyZWFkY3J1bWIubGVuZ3RoKSByZXR1cm47XG4gICAgdmFyICRoZXJvV2lkZ2V0Q29udGVudCA9ICRzaXRlT3ZlcmxheVdyYXBwZXIuZmluZCgnLnNpdGUtY29udGVudF9faGVyby13aWRnZXRzIC5oZXJvLWJhbm5lcl9fY29udGVudCcpO1xuICAgIGlmICghJGhlcm9XaWRnZXRDb250ZW50Lmxlbmd0aCkgcmV0dXJuO1xuICAgICRicmVhZGNydW1iLmNsb25lKCkucHJlcGVuZFRvKCRoZXJvV2lkZ2V0Q29udGVudCkuYWRkQ2xhc3MoJ3RhYmxldC1oaWRkZW4nKS5hdHRyKCdhcmlhLWxhYmVsJywgJ01vYmlsZSBicmVhZGNydW1iIG5hdmlnYXRpb24nKTtcbiAgfSAvLyBPbiBkb2N1bWVudCByZWFkeS4uLlxuXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgIHNldFNpdGVNaW5IZWlnaHQoKTtcbiAgICBpbml0QTExeVRvZ2dsZSgpO1xuICAgIHRvZ2dsZU1vYmlsZVN3YXAobWVudS5uYXZpZ2F0aW9uLCBtZW51LnRvZ2dsZSwgYnJlYWtwb2ludHMudGFibGV0KTtcbiAgICBoZWFkZXJUb29sdGlwTmF2aWdhdGlvbigpO1xuICAgIGR1cGxpY2F0ZUJyZWFkY3J1bWJzSW5zaWRlSGVyb1dpZGdldCgpO1xuICAgIHJlc3BvbnNpdmVUYWJsZXMuYW1lbmRNYXJrVXAoKTtcbiAgICByZXNwb25zaXZlVGFibGVzLmNoZWNrKCk7IC8vIHRlbXBvcmFyeSBzY3JvbGxlciBmb3IgbWF0cml4IHRhYmxlXG5cbiAgICAkKCcuZm9ybV9fbWF0cml4LCAubWF0cml4LXdyYXBwZXIgLnRhYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdGFibGUgPSAkKHRoaXMpO1xuICAgICAgJCh0aGlzKS53cmFwKCc8ZGl2IGNsYXNzPVwidGFibGUtd3JhcHBlci1tYXRyaXhcIj48L2Rpdj4nKS53cmFwKCc8ZGl2IGNsYXNzPVwic2Nyb2xsZXJcIj48L2Rpdj4nKTtcblxuICAgICAgaWYgKHRhYmxlLm91dGVyV2lkdGgoKSA+IHRhYmxlLnBhcmVudCgpLnBhcmVudCgpLm91dGVyV2lkdGgoKSkge1xuICAgICAgICB0YWJsZS5wYXJlbnQoKS5wYXJlbnQoKS5hZGRDbGFzcygnaGFzLXNjcm9sbCcpO1xuICAgICAgfVxuXG4gICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZSBvcmllbnRhdGlvbmNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRhYmxlLm91dGVyV2lkdGgoKSA+IHRhYmxlLnBhcmVudCgpLnBhcmVudCgpLm91dGVyV2lkdGgoKSkge1xuICAgICAgICAgIHRhYmxlLnBhcmVudCgpLnBhcmVudCgpLmFkZENsYXNzKCdoYXMtc2Nyb2xsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGFibGUucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2hhcy1zY3JvbGwnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7IC8vIFJlbW92ZSBlcnJvciBzdGF0ZXMgZnJvbSBmb3JtIGZpZWxkcyB2aWEgSlMgd2hlbiB0aGUgdXNlciBhbHRlcnMgdGhlIGNvbnRlbnRzXG5cbiAgICAkZm9ybXMuZmluZCgnLmZvcm1fX2ZpZWxkLCAuZm9ybV9fdGV4dGFyZWEsIC5mb3JtX19zZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgJHRoaXNGaWVsZCA9ICQodGhpcyksXG4gICAgICAgICAgJHRoaXNGaWVsZHNDb250cm9sID0gJHRoaXNGaWVsZC5jbG9zZXN0KCcuZm9ybV9fY29udHJvbCcpO1xuXG4gICAgICBpZiAoISR0aGlzRmllbGQudmFsKCkgJiYgJHRoaXNGaWVsZC5hdHRyKCdhcmlhLXJlcXVpcmVkJykgPT09ICd0cnVlJykge1xuICAgICAgICAkdGhpc0ZpZWxkc0NvbnRyb2wuYWRkQ2xhc3MoJ2Zvcm1fX2NvbnRyb2wtLWVycm9yJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCEkdGhpc0ZpZWxkc0NvbnRyb2wubGVuZ3RoIHx8ICEkdGhpc0ZpZWxkLnZhbCgpKSByZXR1cm47XG4gICAgICAkdGhpc0ZpZWxkc0NvbnRyb2wucmVtb3ZlQ2xhc3MoJ2Zvcm1fX2NvbnRyb2wtLWVycm9yJyk7XG4gICAgfSk7XG4gICAgdmFyICRtZW51TmF2ID0gJChtZW51Lm5hdmlnYXRpb24pLmZpbmQoJy5uYXYnKSxcbiAgICAgICAgJG1lbnVOYXZMaXN0ID0gJG1lbnVOYXYuZmluZCgnLmxpc3QtLXRpZXJlZC1uYXZpZ2F0aW9uJyksXG4gICAgICAgICRuYXZpZ2F0aW9uTGlua3MgPSAkbWVudU5hdi5maW5kKCdhJyksXG4gICAgICAgICRleHBhbmRhYmxlSXRlbXMgPSAkbWVudU5hdi5maW5kKCcubGlzdC0tdGllcmVkLW5hdmlnYXRpb24gPiAubGlzdF9faXRlbScpLFxuICAgICAgICAkcGFyZW50TGlua3MgPSAkZXhwYW5kYWJsZUl0ZW1zLmZpbmQoJz4gLmxpc3RfX2xpbmsnKSxcbiAgICAgICAgJGV4cGFuZGFibGVMaW5rcyA9ICRleHBhbmRhYmxlSXRlbXMuZmluZCgnLmxpc3RfX2xpbmstLWV4cGFuZGFibGUnKSxcbiAgICAgICAgJG5hdmlnYXRpb25MYXN0TGluayA9ICRuYXZpZ2F0aW9uTGlua3MubGFzdCgpLFxuICAgICAgICAkbGFzdFNlYXJjaFN1Z2dlc3Rpb24gPSAkKHNpdGUub3ZlcmxheXMpLmZpbmQoJy5zaXRlLXNlYXJjaC13cmFwcGVyX19saXN0IC5saXN0X19pdGVtOmxhc3QtY2hpbGQgLmxpc3RfX2xpbmsnKSxcbiAgICAgICAgJG1vYmlsZU5hdkZpcnN0TGluayA9ICRtb2JpbGVNZW51Q29udGFpbmVyLmZpbmQoJ2EnKS5maXJzdCgpLFxuICAgICAgICAkbW9iaWxlTmF2TGFzdExpbmsgPSAkbW9iaWxlTWVudUNvbnRhaW5lci5maW5kKCdhJykubGFzdCgpLFxuICAgICAgICAkbW9iaWxlQmFja0J1dHRvbnMgPSAkbW9iaWxlTWVudUNvbnRhaW5lci5maW5kKCcuc3VibGlua3NfX2JhY2stYnV0dG9uJyksXG4gICAgICAgICRtb2JpbGVDVEFCdXR0b25zID0gJG1vYmlsZU1lbnVDb250YWluZXIuZmluZCgnLnN1YmxpbmtzX19jYWxsLXRvLWFjdGlvbicpLFxuICAgICAgICAkbW9iaWxlTGFzdFN1YlRpZXJMaW5rcyA9ICRtb2JpbGVNZW51Q29udGFpbmVyLmZpbmQoJy5zdWJsaW5rcyAubGlzdC0tdGllcmVkLXN1YmxpbmtzOmxhc3QtY2hpbGQgPiAubGlzdF9faXRlbTpsYXN0LWNoaWxkID4gLmxpc3RfX2xpbmsnKSxcbiAgICAgICAgJGRlc2t0b3BDVEFCdXR0b25zID0gJGV4cGFuZGFibGVJdGVtcy5maW5kKCcuc3VibGlua3NfX2NhbGwtdG8tYWN0aW9uJyk7XG5cbiAgICBmdW5jdGlvbiBjbG9zZUFsbE1lbnVTdWJMaW5rcygpIHtcbiAgICAgIHZhciBpZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogbnVsbDtcbiAgICAgIGlmICghJGV4cGFuZGFibGVJdGVtcy5sZW5ndGgpIHJldHVybjtcbiAgICAgICRleHBhbmRhYmxlSXRlbXMuYWRkKCRtb2JpbGVNZW51Q29udGFpbmVyLmZpbmQoJy5saXN0LS10aWVyZWQtbmF2aWdhdGlvbiA+IC5saXN0X19pdGVtJykpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJHRoaXNJdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgICRzaWJsaW5nTGluayA9ICR0aGlzSXRlbS5maW5kKCcubGlzdF9fbGluay0tZXhwYW5kYWJsZScpLFxuICAgICAgICAgICAgc2libGluZ0lkID0gJHNpYmxpbmdMaW5rLmF0dHIoJ2RhdGEtYTExeS10b2dnbGUnKSxcbiAgICAgICAgICAgICRzaWJsaW5nVGFyZ2V0ID0gJHRoaXNJdGVtLmZpbmQoJyMnICsgc2libGluZ0lkKTtcbiAgICAgICAgaWYgKHR5cGVvZiBzaWJsaW5nSWQgPT09ICd1bmRlZmluZWQnIHx8IHNpYmxpbmdJZCA9PT0gaWQpIHJldHVybjtcbiAgICAgICAgJHNpYmxpbmdMaW5rLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKS5yZW1vdmVDbGFzcygnaXMtbW91c2UtY29udHJvbGxlZCcpO1xuICAgICAgICAkc2libGluZ1RhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICB9KTtcbiAgICB9IC8vIGNsb3NlIG1lbnVzIHdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBFc2NhcGUga2V5XG5cblxuICAgICRib2R5Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSAhPT0gMjcpIHJldHVybjtcblxuICAgICAgaWYgKCRib2R5Lmhhc0NsYXNzKCdtZW51LWlzLW9wZW4nKSkge1xuICAgICAgICAkbWVudVRvZ2dsZUJ1dHRvblswXS5jbGljaygpO1xuICAgICAgfSBlbHNlIGlmICgkYm9keS5oYXNDbGFzcygnc3ViLW1lbnUtaXMtb3BlbicpKSB7XG4gICAgICAgIGNsb3NlQWxsTWVudVN1YkxpbmtzKCk7XG4gICAgICAgICRib2R5LnJlbW92ZUNsYXNzKCdzdWItbWVudS1pcy1vcGVuJyk7XG4gICAgICAgICR3aW5kb3cudHJpZ2dlcignYTExeS10b2dnbGUtaGlkZTpzdWJUaWVyTmF2aWdhdGlvbkNhbGxiYWNrJyk7XG4gICAgICB9IGVsc2UgaWYgKCRib2R5Lmhhc0NsYXNzKCdzZWFyY2gtaXMtb3BlbicpKSB7XG4gICAgICAgICRzZWFyY2hUb2dnbGVbMF0uY2xpY2soKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkbWVudVRvZ2dsZUJ1dHRvbi5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgaWYgKCEkYm9keS5oYXNDbGFzcygnbWVudS1pcy1vcGVuJykgfHwgZXZlbnQua2V5Q29kZSAhPT0gOSkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKHZpZXdwb3J0cy53aWR0aCA8PSBicmVha3BvaW50cy50YWJsZXQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgaWYgKCRib2R5Lmhhc0NsYXNzKCdzdWItbWVudS1pcy1vcGVuJykpIHtcbiAgICAgICAgICAgICRtb2JpbGVNZW51Q29udGFpbmVyLmZpbmQoJy5saXN0X19saW5rW2FyaWEtZXhwYW5kZWQ9XCJ0cnVlXCJdIH4gLnN1YmxpbmtzIGEnKS5sYXN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJG1vYmlsZU5hdkxhc3RMaW5rLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICgkYm9keS5oYXNDbGFzcygnc3ViLW1lbnUtaXMtb3BlbicpKSB7XG4gICAgICAgICAgICAkbW9iaWxlTWVudUNvbnRhaW5lci5maW5kKCcuc3VibGlua3NbYXJpYS1oaWRkZW49XCJmYWxzZVwiXTplcSgwKSAuc3VibGlua3NfX2JhY2stYnV0dG9uJykuZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJG1vYmlsZU5hdkZpcnN0TGluay5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJG5hdmlnYXRpb25MYXN0TGluay5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRuYXZpZ2F0aW9uTGFzdExpbmsub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICh2aWV3cG9ydHMud2lkdGggPj0gYnJlYWtwb2ludHMudGFibGV0IHx8IGV2ZW50LmtleUNvZGUgIT09IDkgfHwgZXZlbnQuc2hpZnRLZXkpIHJldHVybjtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkbWVudVRvZ2dsZUNsb3NlQnV0dG9uLmZvY3VzKCk7XG4gICAgfSk7IC8vICBUcmlnZ2VyIGExMXlUb2dnbGUgZXZlbnRzIG9uIG1vdXNlIGVudGVyIGFuZCBsZWF2ZSBmb3IgdGhlIG1lbnUgc3ViLXRpZXJzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICRleHBhbmRhYmxlSXRlbXMub24oJ21vdXNlZW50ZXInLCBkZWJvdW5jZShmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICh2aWV3cG9ydHMud2lkdGggPD0gYnJlYWtwb2ludHMudGFibGV0KSByZXR1cm47XG4gICAgICB2YXIgJHRoaXNMaW5rID0gJCh0aGlzKS5maW5kKCcubGlzdF9fbGluay0tZXhwYW5kYWJsZScpLFxuICAgICAgICAgIGlkID0gJHRoaXNMaW5rLmF0dHIoJ2RhdGEtYTExeS10b2dnbGUnKSxcbiAgICAgICAgICBjb2xsYXBzaWJsZUJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgIGNsb3NlQWxsTWVudVN1YkxpbmtzKGlkKTtcblxuICAgICAgaWYgKCEkdGhpc0xpbmsubGVuZ3RoIHx8ICR0aGlzTGluay5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICd0cnVlJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgICQoY29sbGFwc2libGVCb3gpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgICAkdGhpc0xpbmsuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJykuYWRkQ2xhc3MoJ2lzLW1vdXNlLWNvbnRyb2xsZWQnKTtcbiAgICAgICR3aW5kb3cudHJpZ2dlcignYTExeS10b2dnbGUtc2hvdzpzdWJUaWVyTmF2aWdhdGlvbkNhbGxiYWNrJyk7XG4gICAgfSwgMTAwKSk7XG4gICAgJChzaXRlLmhlYWRlcikub24oJ21vdXNlbGVhdmUnLCBkZWJvdW5jZShmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICh2aWV3cG9ydHMud2lkdGggPD0gYnJlYWtwb2ludHMudGFibGV0KSByZXR1cm47XG4gICAgICAkZXhwYW5kYWJsZUxpbmtzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKS5yZW1vdmVDbGFzcygnaXMtbW91c2UtY29udHJvbGxlZCcpO1xuICAgICAgJGV4cGFuZGFibGVJdGVtcy5maW5kKCcuc3VibGlua3MnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAkd2luZG93LnRyaWdnZXIoJ2ExMXktdG9nZ2xlLWhpZGU6c3ViVGllck5hdmlnYXRpb25DYWxsYmFjaycpO1xuICAgICAgJChtZW51LmhvdmVySW5kaWNhdG9yKS5jc3Moe1xuICAgICAgICAndHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVgoMjV2dyknLFxuICAgICAgICAnd2lkdGgnOiAnNC41cmVtJ1xuICAgICAgfSk7XG4gICAgfSkpOyAvLyAgVHJpZ2dlciBhMTF5VG9nZ2xlIGV2ZW50cyBvbiBtb3VzZSBlbnRlciBhbmQgbGVhdmUgZm9yIHRoZSBtZW51IHN1Yi10aWVyc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAkcGFyZW50TGlua3Mub24oJ21vdXNlZW50ZXIgZm9jdXNpbicsIGRlYm91bmNlKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgaWYgKHZpZXdwb3J0cy53aWR0aCA8PSBicmVha3BvaW50cy50YWJsZXQpIHJldHVybjtcbiAgICAgIHZhciAkdGhpc0xpbmsgPSAkKHRoaXMpLFxuICAgICAgICAgIGxpc3RXaWR0aCA9ICRtZW51TmF2TGlzdC53aWR0aCgpLFxuICAgICAgICAgIGxpbmtXaWR0aCA9ICR0aGlzTGluay53aWR0aCgpLFxuICAgICAgICAgIHBvc2l0aW9uID0gJHRoaXNMaW5rLnBvc2l0aW9uKCksXG4gICAgICAgICAgaG92ZXJJbmRpY2F0b3JQYWRkaW5nT2Zmc2V0ID0gMTgsXG4gICAgICAgICAgb2Zmc2V0ID0gcGFyc2VJbnQobGlzdFdpZHRoIC0gcG9zaXRpb24ubGVmdCAtIGxpbmtXaWR0aCAtIGhvdmVySW5kaWNhdG9yUGFkZGluZ09mZnNldCksXG4gICAgICAgICAgb2Zmc2V0UnVsZTtcblxuICAgICAgaWYgKG9mZnNldCA+IDApIHtcbiAgICAgICAgb2Zmc2V0UnVsZSA9ICd0cmFuc2xhdGVYKC0nICsgb2Zmc2V0ICsgJ3B4KSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvZmZzZXRSdWxlID0gJ3RyYW5zbGF0ZVgoJyArIG9mZnNldCArICdweCknO1xuICAgICAgfVxuXG4gICAgICAkKG1lbnUuaG92ZXJJbmRpY2F0b3IpLmNzcyh7XG4gICAgICAgICd0cmFuc2Zvcm0nOiBvZmZzZXRSdWxlLFxuICAgICAgICAnd2lkdGgnOiBsaW5rV2lkdGhcbiAgICAgIH0pO1xuICAgICAgaWYgKCR0aGlzTGluay5oYXNDbGFzcygnLmxpc3RfX2xpbmstLWV4cGFuZGFibGUnKSB8fCAkdGhpc0xpbmsuYXR0cignYXJpYS1leHBhbmRlZCcpID09ICd0cnVlJykgcmV0dXJuO1xuICAgICAgJHdpbmRvdy50cmlnZ2VyKCdhMTF5LXRvZ2dsZS1oaWRlOnN1YlRpZXJOYXZpZ2F0aW9uQ2FsbGJhY2snKTtcbiAgICB9LCAxMDApKTtcbiAgICAkcGFyZW50TGlua3Mub24oJ21vdXNlZG93biB0b3VjaGVuZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgdmFyICR0aGlzTGluayA9ICQodGhpcyksXG4gICAgICAgICAgdGFyZ2V0VXJsID0gJHRoaXNMaW5rLmF0dHIoJ2hyZWYnKTtcbiAgICAgIGlmICghJHRoaXNMaW5rLmhhc0NsYXNzKCdpcy1tb3VzZS1jb250cm9sbGVkJykgfHwgdHlwZW9mIHRhcmdldFVybCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuO1xuICAgICAgd2luZG93LmxvY2F0aW9uID0gdGFyZ2V0VXJsO1xuICAgIH0pO1xuICAgICRzZWFyY2hUb2dnbGUub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICgkYm9keS5oYXNDbGFzcygnbWVudS1pcy1vcGVuJykgJiYgdmlld3BvcnRzLndpZHRoIDw9IGJyZWFrcG9pbnRzLnRhYmxldCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkbW9iaWxlTmF2Rmlyc3RMaW5rLmZvY3VzKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgIT09IDkgfHwgISRib2R5Lmhhc0NsYXNzKCdzZWFyY2gtaXMtb3BlbicpKSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICRzaXRlU2VhcmNoRm9ybUZpZWxkLmZvY3VzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkbGFzdFNlYXJjaFN1Z2dlc3Rpb24uZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2VhcmNoVG9nZ2xlLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgY2xvc2VBbGxNZW51U3ViTGlua3MoKTtcbiAgICAgICRib2R5LnJlbW92ZUNsYXNzKCdzdWItbWVudS1pcy1vcGVuJyk7XG4gICAgICAkKG1lbnUuaG92ZXJJbmRpY2F0b3IpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAkd2luZG93LnRyaWdnZXIoJ2ExMXktdG9nZ2xlLWhpZGU6c3ViVGllck5hdmlnYXRpb25DYWxsYmFjaycpO1xuICAgIH0pOyAvLyAgSGlkZSB0aGUgZm9jdXMgZWZmZWN0IG9uIGNsaWNrIGZvciBVSSBlbGVtZW50c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAkc2VhcmNoVG9nZ2xlLmFkZCgkbWVudVRvZ2dsZUJ1dHRvbikub24oJ21vdXNlZG93biB0b3VjaGVuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2hpZGUtZm9jdXMnKTtcbiAgICB9KTtcbiAgICAkc2VhcmNoVG9nZ2xlLmFkZCgkbWVudVRvZ2dsZUJ1dHRvbikub24oJ2JsdXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdoaWRlLWZvY3VzJyk7XG4gICAgfSk7XG4gICAgJHNpdGVTZWFyY2hGb3JtRmllbGQub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5rZXlDb2RlICE9PSA5IHx8ICFldmVudC5zaGlmdEtleSB8fCAhJHNlYXJjaFRvZ2dsZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkc2VhcmNoVG9nZ2xlLmZvY3VzKCk7XG4gICAgfSk7XG4gICAgJGxhc3RTZWFyY2hTdWdnZXN0aW9uLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQua2V5Q29kZSAhPT0gOSB8fCBldmVudC5zaGlmdEtleSB8fCAhJHNlYXJjaFRvZ2dsZS5sZW5ndGgpIHJldHVybjtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkc2VhcmNoVG9nZ2xlLmZvY3VzKCk7XG4gICAgfSk7XG4gICAgJG1vYmlsZU5hdkZpcnN0TGluay5hZGQoJG1vYmlsZUJhY2tCdXR0b25zKS5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgaWYgKCEkYm9keS5oYXNDbGFzcygnbWVudS1pcy1vcGVuJykgfHwgZXZlbnQua2V5Q29kZSAhPT0gOSB8fCAhZXZlbnQuc2hpZnRLZXkpIHJldHVybjtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkbWVudVRvZ2dsZS5mb2N1cygpO1xuICAgIH0pO1xuICAgICRtb2JpbGVCYWNrQnV0dG9ucy5vbignY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHZhciAkdGhpc0J1dHRvbiA9ICQodGhpcyk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICR0aGlzQnV0dG9uLmNsb3Nlc3QoJy5saXN0X19zdWJsaW5rcy13cmFwcGVyJykucHJldignLmxpc3RfX2xpbmstLWV4cGFuZGFibGUnKS5mb2N1cygpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkbW9iaWxlTmF2TGFzdExpbmsuYWRkKCRtb2JpbGVDVEFCdXR0b25zKS5hZGQoJG1vYmlsZUxhc3RTdWJUaWVyTGlua3MpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdtZW51LWlzLW9wZW4nKSB8fCBldmVudC5rZXlDb2RlICE9PSA5IHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJG1lbnVUb2dnbGUuZm9jdXMoKTtcbiAgICB9KTtcbiAgICAkZGVza3RvcENUQUJ1dHRvbnMub24oJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGlmICghJGJvZHkuaGFzQ2xhc3MoJ3N1Yi1tZW51LWlzLW9wZW4nKSB8fCBldmVudC5rZXlDb2RlICE9PSA5IHx8IGV2ZW50LnNoaWZ0S2V5KSByZXR1cm47XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY2xvc2VBbGxNZW51U3ViTGlua3MoKTtcbiAgICAgICQodGhpcykuY2xvc2VzdCgnLmxpc3QtLXRpZXJlZC1uYXZpZ2F0aW9uID4gLmxpc3RfX2l0ZW0nKS5uZXh0KCcubGlzdF9faXRlbScpLmZpbmQoJy5saXN0X19saW5rJykuZm9jdXMoKTtcbiAgICB9KTtcbiAgICAkZXhwYW5kYWJsZUxpbmtzLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdzdWItbWVudS1pcy1vcGVuJykgfHwgZXZlbnQua2V5Q29kZSAhPT0gOSB8fCAhZXZlbnQuc2hpZnRLZXkgfHwgdmlld3BvcnRzLndpZHRoIDw9IGJyZWFrcG9pbnRzLnRhYmxldCkgcmV0dXJuO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICQodGhpcykubmV4dCgnLnN1YmxpbmtzJykuZmluZCgnYScpLmxhc3QoKS5mb2N1cygpO1xuICAgIH0pO1xuICB9KTsgLy8gT24gd2luZG93IGxvYWQuLi5cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBjYXJvdXNlbEluaXQoJy5qcy1jYXJvdXNlbCcpO1xuICAgIHNraXBNYXBzKCk7XG4gICAgZGF0ZUlucHV0UG9seWZpbGxTaXRlaW1wcm92ZUZpeGVzKCk7XG4gIH0pO1xuICB2YXIgcmVzaXplRnVuY3Rpb25zID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgIGlmICgkYm9keS5oYXNDbGFzcygnc2VhcmNoLWlzLW9wZW4nKSB8fCAkYm9keS5oYXNDbGFzcygnbWVudS1pcy1vcGVuJykpIHtcbiAgICAgIG92ZXJsYXlXcmFwcGVySGVpZ2h0T2Zmc2V0KCk7XG4gICAgfVxuXG4gICAgaGVhZGVyTWVudUhlaWdodEFkanVzdCgpO1xuICB9LCAxMDApOyAvLyBPbiB3aW5kb3cgcmVzaXplLi4uXG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodmVyZ2Uudmlld3BvcnRXKCkgPT0gdmlld3BvcnRzLndpZHRoICYmIHZlcmdlLnZpZXdwb3J0SCgpID09IHZpZXdwb3J0cy5oZWlnaHQpIHJldHVybjtcbiAgICB2aWV3cG9ydHMuaGVpZ2h0ID0gdmVyZ2Uudmlld3BvcnRIKCk7XG4gICAgdmlld3BvcnRzLndpZHRoID0gdmVyZ2Uudmlld3BvcnRXKCk7XG4gICAgc2V0U2l0ZU1pbkhlaWdodCgpO1xuICAgIHRvZ2dsZU1vYmlsZVN3YXAobWVudS5uYXZpZ2F0aW9uLCBtZW51LnRvZ2dsZSwgYnJlYWtwb2ludHMudGFibGV0LCB0cnVlKTtcbiAgICByZXNwb25zaXZlVGFibGVzLmNoZWNrKCk7XG4gICAgcmVzaXplRnVuY3Rpb25zKCk7XG4gIH0pO1xuICAvKipcbiAgICogT24gb3JpZW50YXRpb24gY2hhbmdlXG4gICAqL1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICByZXNwb25zaXZlVGFibGVzLmNoZWNrKCk7XG4gICAgJChtZW51LmhvdmVySW5kaWNhdG9yKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICB9KTtcbn0pKGpRdWVyeSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgQmVnaW4gcHJpc20tY29yZS5qc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuLy8vIDxyZWZlcmVuY2UgbGliPVwiV2ViV29ya2VyXCIvPlxudmFyIF9zZWxmID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgLy8gaWYgaW4gYnJvd3NlclxuOiB0eXBlb2YgV29ya2VyR2xvYmFsU2NvcGUgIT09ICd1bmRlZmluZWQnICYmIHNlbGYgaW5zdGFuY2VvZiBXb3JrZXJHbG9iYWxTY29wZSA/IHNlbGYgLy8gaWYgaW4gd29ya2VyXG46IHt9IC8vIGlmIGluIG5vZGUganNcbjtcbi8qKlxuICogUHJpc206IExpZ2h0d2VpZ2h0LCByb2J1c3QsIGVsZWdhbnQgc3ludGF4IGhpZ2hsaWdodGluZ1xuICpcbiAqIEBsaWNlbnNlIE1JVCA8aHR0cHM6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVQ+XG4gKiBAYXV0aG9yIExlYSBWZXJvdSA8aHR0cHM6Ly9sZWEudmVyb3UubWU+XG4gKiBAbmFtZXNwYWNlXG4gKiBAcHVibGljXG4gKi9cblxuXG52YXIgUHJpc20gPSBmdW5jdGlvbiAoX3NlbGYpIHtcbiAgLy8gUHJpdmF0ZSBoZWxwZXIgdmFyc1xuICB2YXIgbGFuZyA9IC9cXGJsYW5nKD86dWFnZSk/LShbXFx3LV0rKVxcYi9pO1xuICB2YXIgdW5pcXVlSWQgPSAwO1xuICB2YXIgXyA9IHtcbiAgICAvKipcbiAgICAgKiBCeSBkZWZhdWx0LCBQcmlzbSB3aWxsIGF0dGVtcHQgdG8gaGlnaGxpZ2h0IGFsbCBjb2RlIGVsZW1lbnRzIChieSBjYWxsaW5nIHtAbGluayBQcmlzbS5oaWdobGlnaHRBbGx9KSBvbiB0aGVcbiAgICAgKiBjdXJyZW50IHBhZ2UgYWZ0ZXIgdGhlIHBhZ2UgZmluaXNoZWQgbG9hZGluZy4gVGhpcyBtaWdodCBiZSBhIHByb2JsZW0gaWYgZS5nLiB5b3Ugd2FudGVkIHRvIGFzeW5jaHJvbm91c2x5IGxvYWRcbiAgICAgKiBhZGRpdGlvbmFsIGxhbmd1YWdlcyBvciBwbHVnaW5zIHlvdXJzZWxmLlxuICAgICAqXG4gICAgICogQnkgc2V0dGluZyB0aGlzIHZhbHVlIHRvIGB0cnVlYCwgUHJpc20gd2lsbCBub3QgYXV0b21hdGljYWxseSBoaWdobGlnaHQgYWxsIGNvZGUgZWxlbWVudHMgb24gdGhlIHBhZ2UuXG4gICAgICpcbiAgICAgKiBZb3Ugb2J2aW91c2x5IGhhdmUgdG8gY2hhbmdlIHRoaXMgdmFsdWUgYmVmb3JlIHRoZSBhdXRvbWF0aWMgaGlnaGxpZ2h0aW5nIHN0YXJ0ZWQuIFRvIGRvIHRoaXMsIHlvdSBjYW4gYWRkIGFuXG4gICAgICogZW1wdHkgUHJpc20gb2JqZWN0IGludG8gdGhlIGdsb2JhbCBzY29wZSBiZWZvcmUgbG9hZGluZyB0aGUgUHJpc20gc2NyaXB0IGxpa2UgdGhpczpcbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogd2luZG93LlByaXNtID0gd2luZG93LlByaXNtIHx8IHt9O1xuICAgICAqIFByaXNtLm1hbnVhbCA9IHRydWU7XG4gICAgICogLy8gYWRkIGEgbmV3IDxzY3JpcHQ+IHRvIGxvYWQgUHJpc20ncyBzY3JpcHRcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICogQG1lbWJlcm9mIFByaXNtXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIG1hbnVhbDogX3NlbGYuUHJpc20gJiYgX3NlbGYuUHJpc20ubWFudWFsLFxuICAgIGRpc2FibGVXb3JrZXJNZXNzYWdlSGFuZGxlcjogX3NlbGYuUHJpc20gJiYgX3NlbGYuUHJpc20uZGlzYWJsZVdvcmtlck1lc3NhZ2VIYW5kbGVyLFxuXG4gICAgLyoqXG4gICAgICogQSBuYW1lc3BhY2UgZm9yIHV0aWxpdHkgbWV0aG9kcy5cbiAgICAgKlxuICAgICAqIEFsbCBmdW5jdGlvbiBpbiB0aGlzIG5hbWVzcGFjZSB0aGF0IGFyZSBub3QgZXhwbGljaXRseSBtYXJrZWQgYXMgX3B1YmxpY18gYXJlIGZvciBfX2ludGVybmFsIHVzZSBvbmx5X18gYW5kIG1heVxuICAgICAqIGNoYW5nZSBvciBkaXNhcHBlYXIgYXQgYW55IHRpbWUuXG4gICAgICpcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFByaXNtXG4gICAgICovXG4gICAgdXRpbDoge1xuICAgICAgZW5jb2RlOiBmdW5jdGlvbiBlbmNvZGUodG9rZW5zKSB7XG4gICAgICAgIGlmICh0b2tlbnMgaW5zdGFuY2VvZiBUb2tlbikge1xuICAgICAgICAgIHJldHVybiBuZXcgVG9rZW4odG9rZW5zLnR5cGUsIGVuY29kZSh0b2tlbnMuY29udGVudCksIHRva2Vucy5hbGlhcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh0b2tlbnMpKSB7XG4gICAgICAgICAgcmV0dXJuIHRva2Vucy5tYXAoZW5jb2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdG9rZW5zLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoL1xcdTAwYTAvZywgJyAnKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSB0eXBlIG9mIHRoZSBnaXZlbiB2YWx1ZS5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge2FueX0gb1xuICAgICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiB0eXBlKG51bGwpICAgICAgPT09ICdOdWxsJ1xuICAgICAgICogdHlwZSh1bmRlZmluZWQpID09PSAnVW5kZWZpbmVkJ1xuICAgICAgICogdHlwZSgxMjMpICAgICAgID09PSAnTnVtYmVyJ1xuICAgICAgICogdHlwZSgnZm9vJykgICAgID09PSAnU3RyaW5nJ1xuICAgICAgICogdHlwZSh0cnVlKSAgICAgID09PSAnQm9vbGVhbidcbiAgICAgICAqIHR5cGUoWzEsIDJdKSAgICA9PT0gJ0FycmF5J1xuICAgICAgICogdHlwZSh7fSkgICAgICAgID09PSAnT2JqZWN0J1xuICAgICAgICogdHlwZShTdHJpbmcpICAgID09PSAnRnVuY3Rpb24nXG4gICAgICAgKiB0eXBlKC9hYmMrLykgICAgPT09ICdSZWdFeHAnXG4gICAgICAgKi9cbiAgICAgIHR5cGU6IGZ1bmN0aW9uIHR5cGUobykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJucyBhIHVuaXF1ZSBudW1iZXIgZm9yIHRoZSBnaXZlbiBvYmplY3QuIExhdGVyIGNhbGxzIHdpbGwgc3RpbGwgcmV0dXJuIHRoZSBzYW1lIG51bWJlci5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAgICovXG4gICAgICBvYmpJZDogZnVuY3Rpb24gb2JqSWQob2JqKSB7XG4gICAgICAgIGlmICghb2JqWydfX2lkJ10pIHtcbiAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAnX19pZCcsIHtcbiAgICAgICAgICAgIHZhbHVlOiArK3VuaXF1ZUlkXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqWydfX2lkJ107XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYSBkZWVwIGNsb25lIG9mIHRoZSBnaXZlbiBvYmplY3QuXG4gICAgICAgKlxuICAgICAgICogVGhlIG1haW4gaW50ZW5kZWQgdXNlIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gY2xvbmUgbGFuZ3VhZ2UgZGVmaW5pdGlvbnMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtUfSBvXG4gICAgICAgKiBAcGFyYW0ge1JlY29yZDxudW1iZXIsIGFueT59IFt2aXNpdGVkXVxuICAgICAgICogQHJldHVybnMge1R9XG4gICAgICAgKiBAdGVtcGxhdGUgVFxuICAgICAgICovXG4gICAgICBjbG9uZTogZnVuY3Rpb24gZGVlcENsb25lKG8sIHZpc2l0ZWQpIHtcbiAgICAgICAgdmlzaXRlZCA9IHZpc2l0ZWQgfHwge307XG4gICAgICAgIHZhciBjbG9uZSwgaWQ7XG5cbiAgICAgICAgc3dpdGNoIChfLnV0aWwudHlwZShvKSkge1xuICAgICAgICAgIGNhc2UgJ09iamVjdCc6XG4gICAgICAgICAgICBpZCA9IF8udXRpbC5vYmpJZChvKTtcblxuICAgICAgICAgICAgaWYgKHZpc2l0ZWRbaWRdKSB7XG4gICAgICAgICAgICAgIHJldHVybiB2aXNpdGVkW2lkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2xvbmUgPVxuICAgICAgICAgICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xuICAgICAgICAgICAge307XG4gICAgICAgICAgICB2aXNpdGVkW2lkXSA9IGNsb25lO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gbykge1xuICAgICAgICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY2xvbmVba2V5XSA9IGRlZXBDbG9uZShvW2tleV0sIHZpc2l0ZWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIC8qKiBAdHlwZSB7YW55fSAqL1xuICAgICAgICAgICAgICBjbG9uZVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICAgIGlkID0gXy51dGlsLm9iaklkKG8pO1xuXG4gICAgICAgICAgICBpZiAodmlzaXRlZFtpZF0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHZpc2l0ZWRbaWRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjbG9uZSA9IFtdO1xuICAgICAgICAgICAgdmlzaXRlZFtpZF0gPSBjbG9uZTtcblxuICAgICAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cblxuICAgICAgICAgICAgLyoqIEB0eXBlIHthbnl9ICovXG4gICAgICAgICAgICBvLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgICAgY2xvbmVbaV0gPSBkZWVwQ2xvbmUodiwgdmlzaXRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIC8qKiBAdHlwZSB7YW55fSAqL1xuICAgICAgICAgICAgICBjbG9uZVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gbztcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIHRoZSBQcmlzbSBsYW5ndWFnZSBvZiB0aGUgZ2l2ZW4gZWxlbWVudCBzZXQgYnkgYSBgbGFuZ3VhZ2UteHh4eGAgb3IgYGxhbmcteHh4eGAgY2xhc3MuXG4gICAgICAgKlxuICAgICAgICogSWYgbm8gbGFuZ3VhZ2UgaXMgc2V0IGZvciB0aGUgZWxlbWVudCBvciB0aGUgZWxlbWVudCBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIGBub25lYCB3aWxsIGJlIHJldHVybmVkLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICAgICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0TGFuZ3VhZ2U6IGZ1bmN0aW9uIGdldExhbmd1YWdlKGVsZW1lbnQpIHtcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQgJiYgIWxhbmcudGVzdChlbGVtZW50LmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICByZXR1cm4gKGVsZW1lbnQuY2xhc3NOYW1lLm1hdGNoKGxhbmcpIHx8IFssICdub25lJ10pWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJ25vbmUnO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm5zIHRoZSBzY3JpcHQgZWxlbWVudCB0aGF0IGlzIGN1cnJlbnRseSBleGVjdXRpbmcuXG4gICAgICAgKlxuICAgICAgICogVGhpcyBkb2VzIF9fbm90X18gd29yayBmb3IgbGluZSBzY3JpcHQgZWxlbWVudC5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyB7SFRNTFNjcmlwdEVsZW1lbnQgfCBudWxsfVxuICAgICAgICovXG4gICAgICBjdXJyZW50U2NyaXB0OiBmdW5jdGlvbiBjdXJyZW50U2NyaXB0KCkge1xuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdjdXJyZW50U2NyaXB0JyBpbiBkb2N1bWVudCAmJiAxIDwgMlxuICAgICAgICAvKiBoYWNrIHRvIHRyaXAgVFMnIGZsb3cgYW5hbHlzaXMgKi9cbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAvKiogQHR5cGUge2FueX0gKi9cbiAgICAgICAgICAgICAgZG9jdW1lbnQuY3VycmVudFNjcmlwdFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IC8vIElFMTEgd29ya2Fyb3VuZFxuICAgICAgICAvLyB3ZSdsbCBnZXQgdGhlIHNyYyBvZiB0aGUgY3VycmVudCBzY3JpcHQgYnkgcGFyc2luZyBJRTExJ3MgZXJyb3Igc3RhY2sgdHJhY2VcbiAgICAgICAgLy8gdGhpcyB3aWxsIG5vdCB3b3JrIGZvciBpbmxpbmUgc2NyaXB0c1xuXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gR2V0IGZpbGUgc3JjIHVybCBmcm9tIHN0YWNrLiBTcGVjaWZpY2FsbHkgd29ya3Mgd2l0aCB0aGUgZm9ybWF0IG9mIHN0YWNrIHRyYWNlcyBpbiBJRS5cbiAgICAgICAgICAvLyBBIHN0YWNrIHdpbGwgbG9vayBsaWtlIHRoaXM6XG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBFcnJvclxuICAgICAgICAgIC8vICAgIGF0IF8udXRpbC5jdXJyZW50U2NyaXB0IChodHRwOi8vbG9jYWxob3N0L2NvbXBvbmVudHMvcHJpc20tY29yZS5qczoxMTk6NSlcbiAgICAgICAgICAvLyAgICBhdCBHbG9iYWwgY29kZSAoaHR0cDovL2xvY2FsaG9zdC9jb21wb25lbnRzL3ByaXNtLWNvcmUuanM6NjA2OjEpXG4gICAgICAgICAgdmFyIHNyYyA9ICgvYXQgW14oXFxyXFxuXSpcXCgoLiopOi4rOi4rXFwpJC9pLmV4ZWMoZXJyLnN0YWNrKSB8fCBbXSlbMV07XG5cbiAgICAgICAgICBpZiAoc3JjKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBzY3JpcHRzKSB7XG4gICAgICAgICAgICAgIGlmIChzY3JpcHRzW2ldLnNyYyA9PSBzcmMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0c1tpXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybnMgd2hldGhlciBhIGdpdmVuIGNsYXNzIGlzIGFjdGl2ZSBmb3IgYGVsZW1lbnRgLlxuICAgICAgICpcbiAgICAgICAqIFRoZSBjbGFzcyBjYW4gYmUgYWN0aXZhdGVkIGlmIGBlbGVtZW50YCBvciBvbmUgb2YgaXRzIGFuY2VzdG9ycyBoYXMgdGhlIGdpdmVuIGNsYXNzIGFuZCBpdCBjYW4gYmUgZGVhY3RpdmF0ZWRcbiAgICAgICAqIGlmIGBlbGVtZW50YCBvciBvbmUgb2YgaXRzIGFuY2VzdG9ycyBoYXMgdGhlIG5lZ2F0ZWQgdmVyc2lvbiBvZiB0aGUgZ2l2ZW4gY2xhc3MuIFRoZSBfbmVnYXRlZCB2ZXJzaW9uXyBvZiB0aGVcbiAgICAgICAqIGdpdmVuIGNsYXNzIGlzIGp1c3QgdGhlIGdpdmVuIGNsYXNzIHdpdGggYSBgbm8tYCBwcmVmaXguXG4gICAgICAgKlxuICAgICAgICogV2hldGhlciB0aGUgY2xhc3MgaXMgYWN0aXZlIGlzIGRldGVybWluZWQgYnkgdGhlIGNsb3Nlc3QgYW5jZXN0b3Igb2YgYGVsZW1lbnRgICh3aGVyZSBgZWxlbWVudGAgaXRzZWxmIGlzXG4gICAgICAgKiBjbG9zZXN0IGFuY2VzdG9yKSB0aGF0IGhhcyB0aGUgZ2l2ZW4gY2xhc3Mgb3IgdGhlIG5lZ2F0ZWQgdmVyc2lvbiBvZiBpdC4gSWYgbmVpdGhlciBgZWxlbWVudGAgbm9yIGFueSBvZiBpdHNcbiAgICAgICAqIGFuY2VzdG9ycyBoYXZlIHRoZSBnaXZlbiBjbGFzcyBvciB0aGUgbmVnYXRlZCB2ZXJzaW9uIG9mIGl0LCB0aGVuIHRoZSBkZWZhdWx0IGFjdGl2YXRpb24gd2lsbCBiZSByZXR1cm5lZC5cbiAgICAgICAqXG4gICAgICAgKiBJbiB0aGUgcGFyYWRveGljYWwgc2l0dWF0aW9uIHdoZXJlIHRoZSBjbG9zZXN0IGFuY2VzdG9yIGNvbnRhaW5zIF9fYm90aF9fIHRoZSBnaXZlbiBjbGFzcyBhbmQgdGhlIG5lZ2F0ZWRcbiAgICAgICAqIHZlcnNpb24gb2YgaXQsIHRoZSBjbGFzcyBpcyBjb25zaWRlcmVkIGFjdGl2ZS5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc05hbWVcbiAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRBY3RpdmF0aW9uPWZhbHNlXVxuICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICAgKi9cbiAgICAgIGlzQWN0aXZlOiBmdW5jdGlvbiBpc0FjdGl2ZShlbGVtZW50LCBjbGFzc05hbWUsIGRlZmF1bHRBY3RpdmF0aW9uKSB7XG4gICAgICAgIHZhciBubyA9ICduby0nICsgY2xhc3NOYW1lO1xuXG4gICAgICAgIHdoaWxlIChlbGVtZW50KSB7XG4gICAgICAgICAgdmFyIGNsYXNzTGlzdCA9IGVsZW1lbnQuY2xhc3NMaXN0O1xuXG4gICAgICAgICAgaWYgKGNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2xhc3NMaXN0LmNvbnRhaW5zKG5vKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gISFkZWZhdWx0QWN0aXZhdGlvbjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhpcyBuYW1lc3BhY2UgY29udGFpbnMgYWxsIGN1cnJlbnRseSBsb2FkZWQgbGFuZ3VhZ2VzIGFuZCB0aGUgc29tZSBoZWxwZXIgZnVuY3Rpb25zIHRvIGNyZWF0ZSBhbmQgbW9kaWZ5IGxhbmd1YWdlcy5cbiAgICAgKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJpc21cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgbGFuZ3VhZ2VzOiB7XG4gICAgICAvKipcbiAgICAgICAqIENyZWF0ZXMgYSBkZWVwIGNvcHkgb2YgdGhlIGxhbmd1YWdlIHdpdGggdGhlIGdpdmVuIGlkIGFuZCBhcHBlbmRzIHRoZSBnaXZlbiB0b2tlbnMuXG4gICAgICAgKlxuICAgICAgICogSWYgYSB0b2tlbiBpbiBgcmVkZWZgIGFsc28gYXBwZWFycyBpbiB0aGUgY29waWVkIGxhbmd1YWdlLCB0aGVuIHRoZSBleGlzdGluZyB0b2tlbiBpbiB0aGUgY29waWVkIGxhbmd1YWdlXG4gICAgICAgKiB3aWxsIGJlIG92ZXJ3cml0dGVuIGF0IGl0cyBvcmlnaW5hbCBwb3NpdGlvbi5cbiAgICAgICAqXG4gICAgICAgKiAjIyBCZXN0IHByYWN0aWNlc1xuICAgICAgICpcbiAgICAgICAqIFNpbmNlIHRoZSBwb3NpdGlvbiBvZiBvdmVyd3JpdGluZyB0b2tlbnMgKHRva2VuIGluIGByZWRlZmAgdGhhdCBvdmVyd3JpdGUgdG9rZW5zIGluIHRoZSBjb3BpZWQgbGFuZ3VhZ2UpXG4gICAgICAgKiBkb2Vzbid0IG1hdHRlciwgdGhleSBjYW4gdGVjaG5pY2FsbHkgYmUgaW4gYW55IG9yZGVyLiBIb3dldmVyLCB0aGlzIGNhbiBiZSBjb25mdXNpbmcgdG8gb3RoZXJzIHRoYXQgdHJ5aW5nIHRvXG4gICAgICAgKiB1bmRlcnN0YW5kIHRoZSBsYW5ndWFnZSBkZWZpbml0aW9uIGJlY2F1c2UsIG5vcm1hbGx5LCB0aGUgb3JkZXIgb2YgdG9rZW5zIG1hdHRlcnMgaW4gUHJpc20gZ3JhbW1hcnMuXG4gICAgICAgKlxuICAgICAgICogVGhlcmVmb3JlLCBpdCBpcyBlbmNvdXJhZ2VkIHRvIG9yZGVyIG92ZXJ3cml0aW5nIHRva2VucyBhY2NvcmRpbmcgdG8gdGhlIHBvc2l0aW9ucyBvZiB0aGUgb3ZlcndyaXR0ZW4gdG9rZW5zLlxuICAgICAgICogRnVydGhlcm1vcmUsIGFsbCBub24tb3ZlcndyaXRpbmcgdG9rZW5zIHNob3VsZCBiZSBwbGFjZWQgYWZ0ZXIgdGhlIG92ZXJ3cml0aW5nIG9uZXMuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZCBvZiB0aGUgbGFuZ3VhZ2UgdG8gZXh0ZW5kLiBUaGlzIGhhcyB0byBiZSBhIGtleSBpbiBgUHJpc20ubGFuZ3VhZ2VzYC5cbiAgICAgICAqIEBwYXJhbSB7R3JhbW1hcn0gcmVkZWYgVGhlIG5ldyB0b2tlbnMgdG8gYXBwZW5kLlxuICAgICAgICogQHJldHVybnMge0dyYW1tYXJ9IFRoZSBuZXcgbGFuZ3VhZ2UgY3JlYXRlZC5cbiAgICAgICAqIEBwdWJsaWNcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBQcmlzbS5sYW5ndWFnZXNbJ2Nzcy13aXRoLWNvbG9ycyddID0gUHJpc20ubGFuZ3VhZ2VzLmV4dGVuZCgnY3NzJywge1xuICAgICAgICogICAgIC8vIFByaXNtLmxhbmd1YWdlcy5jc3MgYWxyZWFkeSBoYXMgYSAnY29tbWVudCcgdG9rZW4sIHNvIHRoaXMgdG9rZW4gd2lsbCBvdmVyd3JpdGUgQ1NTJyAnY29tbWVudCcgdG9rZW5cbiAgICAgICAqICAgICAvLyBhdCBpdHMgb3JpZ2luYWwgcG9zaXRpb25cbiAgICAgICAqICAgICAnY29tbWVudCc6IHsgLi4uIH0sXG4gICAgICAgKiAgICAgLy8gQ1NTIGRvZXNuJ3QgaGF2ZSBhICdjb2xvcicgdG9rZW4sIHNvIHRoaXMgdG9rZW4gd2lsbCBiZSBhcHBlbmRlZFxuICAgICAgICogICAgICdjb2xvcic6IC9cXGIoPzpyZWR8Z3JlZW58Ymx1ZSlcXGIvXG4gICAgICAgKiB9KTtcbiAgICAgICAqL1xuICAgICAgZXh0ZW5kOiBmdW5jdGlvbiBleHRlbmQoaWQsIHJlZGVmKSB7XG4gICAgICAgIHZhciBsYW5nID0gXy51dGlsLmNsb25lKF8ubGFuZ3VhZ2VzW2lkXSk7XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHJlZGVmKSB7XG4gICAgICAgICAgbGFuZ1trZXldID0gcmVkZWZba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsYW5nO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBJbnNlcnRzIHRva2VucyBfYmVmb3JlXyBhbm90aGVyIHRva2VuIGluIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiBvciBhbnkgb3RoZXIgZ3JhbW1hci5cbiAgICAgICAqXG4gICAgICAgKiAjIyBVc2FnZVxuICAgICAgICpcbiAgICAgICAqIFRoaXMgaGVscGVyIG1ldGhvZCBtYWtlcyBpdCBlYXN5IHRvIG1vZGlmeSBleGlzdGluZyBsYW5ndWFnZXMuIEZvciBleGFtcGxlLCB0aGUgQ1NTIGxhbmd1YWdlIGRlZmluaXRpb25cbiAgICAgICAqIG5vdCBvbmx5IGRlZmluZXMgQ1NTIGhpZ2hsaWdodGluZyBmb3IgQ1NTIGRvY3VtZW50cywgYnV0IGFsc28gbmVlZHMgdG8gZGVmaW5lIGhpZ2hsaWdodGluZyBmb3IgQ1NTIGVtYmVkZGVkXG4gICAgICAgKiBpbiBIVE1MIHRocm91Z2ggYDxzdHlsZT5gIGVsZW1lbnRzLiBUbyBkbyB0aGlzLCBpdCBuZWVkcyB0byBtb2RpZnkgYFByaXNtLmxhbmd1YWdlcy5tYXJrdXBgIGFuZCBhZGQgdGhlXG4gICAgICAgKiBhcHByb3ByaWF0ZSB0b2tlbnMuIEhvd2V2ZXIsIGBQcmlzbS5sYW5ndWFnZXMubWFya3VwYCBpcyBhIHJlZ3VsYXIgSmF2YVNjcmlwdCBvYmplY3QgbGl0ZXJhbCwgc28gaWYgeW91IGRvXG4gICAgICAgKiB0aGlzOlxuICAgICAgICpcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiBQcmlzbS5sYW5ndWFnZXMubWFya3VwLnN0eWxlID0ge1xuICAgICAgICogICAgIC8vIHRva2VuXG4gICAgICAgKiB9O1xuICAgICAgICogYGBgXG4gICAgICAgKlxuICAgICAgICogdGhlbiB0aGUgYHN0eWxlYCB0b2tlbiB3aWxsIGJlIGFkZGVkIChhbmQgcHJvY2Vzc2VkKSBhdCB0aGUgZW5kLiBgaW5zZXJ0QmVmb3JlYCBhbGxvd3MgeW91IHRvIGluc2VydCB0b2tlbnNcbiAgICAgICAqIGJlZm9yZSBleGlzdGluZyB0b2tlbnMuIEZvciB0aGUgQ1NTIGV4YW1wbGUgYWJvdmUsIHlvdSB3b3VsZCB1c2UgaXQgbGlrZSB0aGlzOlxuICAgICAgICpcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiBQcmlzbS5sYW5ndWFnZXMuaW5zZXJ0QmVmb3JlKCdtYXJrdXAnLCAnY2RhdGEnLCB7XG4gICAgICAgKiAgICAgJ3N0eWxlJzoge1xuICAgICAgICogICAgICAgICAvLyB0b2tlblxuICAgICAgICogICAgIH1cbiAgICAgICAqIH0pO1xuICAgICAgICogYGBgXG4gICAgICAgKlxuICAgICAgICogIyMgU3BlY2lhbCBjYXNlc1xuICAgICAgICpcbiAgICAgICAqIElmIHRoZSBncmFtbWFycyBvZiBgaW5zaWRlYCBhbmQgYGluc2VydGAgaGF2ZSB0b2tlbnMgd2l0aCB0aGUgc2FtZSBuYW1lLCB0aGUgdG9rZW5zIGluIGBpbnNpZGVgJ3MgZ3JhbW1hclxuICAgICAgICogd2lsbCBiZSBpZ25vcmVkLlxuICAgICAgICpcbiAgICAgICAqIFRoaXMgYmVoYXZpb3IgY2FuIGJlIHVzZWQgdG8gaW5zZXJ0IHRva2VucyBhZnRlciBgYmVmb3JlYDpcbiAgICAgICAqXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogUHJpc20ubGFuZ3VhZ2VzLmluc2VydEJlZm9yZSgnbWFya3VwJywgJ2NvbW1lbnQnLCB7XG4gICAgICAgKiAgICAgJ2NvbW1lbnQnOiBQcmlzbS5sYW5ndWFnZXMubWFya3VwLmNvbW1lbnQsXG4gICAgICAgKiAgICAgLy8gdG9rZW5zIGFmdGVyICdjb21tZW50J1xuICAgICAgICogfSk7XG4gICAgICAgKiBgYGBcbiAgICAgICAqXG4gICAgICAgKiAjIyBMaW1pdGF0aW9uc1xuICAgICAgICpcbiAgICAgICAqIFRoZSBtYWluIHByb2JsZW0gYGluc2VydEJlZm9yZWAgaGFzIHRvIHNvbHZlIGlzIGl0ZXJhdGlvbiBvcmRlci4gU2luY2UgRVMyMDE1LCB0aGUgaXRlcmF0aW9uIG9yZGVyIGZvciBvYmplY3RcbiAgICAgICAqIHByb3BlcnRpZXMgaXMgZ3VhcmFudGVlZCB0byBiZSB0aGUgaW5zZXJ0aW9uIG9yZGVyIChleGNlcHQgZm9yIGludGVnZXIga2V5cykgYnV0IHNvbWUgYnJvd3NlcnMgYmVoYXZlXG4gICAgICAgKiBkaWZmZXJlbnRseSB3aGVuIGtleXMgYXJlIGRlbGV0ZWQgYW5kIHJlLWluc2VydGVkLiBTbyBgaW5zZXJ0QmVmb3JlYCBjYW4ndCBiZSBpbXBsZW1lbnRlZCBieSB0ZW1wb3JhcmlseVxuICAgICAgICogZGVsZXRpbmcgcHJvcGVydGllcyB3aGljaCBpcyBuZWNlc3NhcnkgdG8gaW5zZXJ0IGF0IGFyYml0cmFyeSBwb3NpdGlvbnMuXG4gICAgICAgKlxuICAgICAgICogVG8gc29sdmUgdGhpcyBwcm9ibGVtLCBgaW5zZXJ0QmVmb3JlYCBkb2Vzbid0IGFjdHVhbGx5IGluc2VydCB0aGUgZ2l2ZW4gdG9rZW5zIGludG8gdGhlIHRhcmdldCBvYmplY3QuXG4gICAgICAgKiBJbnN0ZWFkLCBpdCB3aWxsIGNyZWF0ZSBhIG5ldyBvYmplY3QgYW5kIHJlcGxhY2UgYWxsIHJlZmVyZW5jZXMgdG8gdGhlIHRhcmdldCBvYmplY3Qgd2l0aCB0aGUgbmV3IG9uZS4gVGhpc1xuICAgICAgICogY2FuIGJlIGRvbmUgd2l0aG91dCB0ZW1wb3JhcmlseSBkZWxldGluZyBwcm9wZXJ0aWVzLCBzbyB0aGUgaXRlcmF0aW9uIG9yZGVyIGlzIHdlbGwtZGVmaW5lZC5cbiAgICAgICAqXG4gICAgICAgKiBIb3dldmVyLCBvbmx5IHJlZmVyZW5jZXMgdGhhdCBjYW4gYmUgcmVhY2hlZCBmcm9tIGBQcmlzbS5sYW5ndWFnZXNgIG9yIGBpbnNlcnRgIHdpbGwgYmUgcmVwbGFjZWQuIEkuZS4gaWZcbiAgICAgICAqIHlvdSBob2xkIHRoZSB0YXJnZXQgb2JqZWN0IGluIGEgdmFyaWFibGUsIHRoZW4gdGhlIHZhbHVlIG9mIHRoZSB2YXJpYWJsZSB3aWxsIG5vdCBjaGFuZ2UuXG4gICAgICAgKlxuICAgICAgICogYGBganNcbiAgICAgICAqIHZhciBvbGRNYXJrdXAgPSBQcmlzbS5sYW5ndWFnZXMubWFya3VwO1xuICAgICAgICogdmFyIG5ld01hcmt1cCA9IFByaXNtLmxhbmd1YWdlcy5pbnNlcnRCZWZvcmUoJ21hcmt1cCcsICdjb21tZW50JywgeyAuLi4gfSk7XG4gICAgICAgKlxuICAgICAgICogYXNzZXJ0KG9sZE1hcmt1cCAhPT0gUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cCk7XG4gICAgICAgKiBhc3NlcnQobmV3TWFya3VwID09PSBQcmlzbS5sYW5ndWFnZXMubWFya3VwKTtcbiAgICAgICAqIGBgYFxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbnNpZGUgVGhlIHByb3BlcnR5IG9mIGByb290YCAoZS5nLiBhIGxhbmd1YWdlIGlkIGluIGBQcmlzbS5sYW5ndWFnZXNgKSB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgICogb2JqZWN0IHRvIGJlIG1vZGlmaWVkLlxuICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGJlZm9yZSBUaGUga2V5IHRvIGluc2VydCBiZWZvcmUuXG4gICAgICAgKiBAcGFyYW0ge0dyYW1tYXJ9IGluc2VydCBBbiBvYmplY3QgY29udGFpbmluZyB0aGUga2V5LXZhbHVlIHBhaXJzIHRvIGJlIGluc2VydGVkLlxuICAgICAgICogQHBhcmFtIHtPYmplY3Q8c3RyaW5nLCBhbnk+fSBbcm9vdF0gVGhlIG9iamVjdCBjb250YWluaW5nIGBpbnNpZGVgLCBpLmUuIHRoZSBvYmplY3QgdGhhdCBjb250YWlucyB0aGVcbiAgICAgICAqIG9iamVjdCB0byBiZSBtb2RpZmllZC5cbiAgICAgICAqXG4gICAgICAgKiBEZWZhdWx0cyB0byBgUHJpc20ubGFuZ3VhZ2VzYC5cbiAgICAgICAqIEByZXR1cm5zIHtHcmFtbWFyfSBUaGUgbmV3IGdyYW1tYXIgb2JqZWN0LlxuICAgICAgICogQHB1YmxpY1xuICAgICAgICovXG4gICAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uIGluc2VydEJlZm9yZShpbnNpZGUsIGJlZm9yZSwgaW5zZXJ0LCByb290KSB7XG4gICAgICAgIHJvb3QgPSByb290IHx8XG4gICAgICAgIC8qKiBAdHlwZSB7YW55fSAqL1xuICAgICAgICBfLmxhbmd1YWdlcztcbiAgICAgICAgdmFyIGdyYW1tYXIgPSByb290W2luc2lkZV07XG4gICAgICAgIC8qKiBAdHlwZSB7R3JhbW1hcn0gKi9cblxuICAgICAgICB2YXIgcmV0ID0ge307XG5cbiAgICAgICAgZm9yICh2YXIgdG9rZW4gaW4gZ3JhbW1hcikge1xuICAgICAgICAgIGlmIChncmFtbWFyLmhhc093blByb3BlcnR5KHRva2VuKSkge1xuICAgICAgICAgICAgaWYgKHRva2VuID09IGJlZm9yZSkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBuZXdUb2tlbiBpbiBpbnNlcnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5zZXJ0Lmhhc093blByb3BlcnR5KG5ld1Rva2VuKSkge1xuICAgICAgICAgICAgICAgICAgcmV0W25ld1Rva2VuXSA9IGluc2VydFtuZXdUb2tlbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IC8vIERvIG5vdCBpbnNlcnQgdG9rZW4gd2hpY2ggYWxzbyBvY2N1ciBpbiBpbnNlcnQuIFNlZSAjMTUyNVxuXG5cbiAgICAgICAgICAgIGlmICghaW5zZXJ0Lmhhc093blByb3BlcnR5KHRva2VuKSkge1xuICAgICAgICAgICAgICByZXRbdG9rZW5dID0gZ3JhbW1hclt0b2tlbl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9sZCA9IHJvb3RbaW5zaWRlXTtcbiAgICAgICAgcm9vdFtpbnNpZGVdID0gcmV0OyAvLyBVcGRhdGUgcmVmZXJlbmNlcyBpbiBvdGhlciBsYW5ndWFnZSBkZWZpbml0aW9uc1xuXG4gICAgICAgIF8ubGFuZ3VhZ2VzLkRGUyhfLmxhbmd1YWdlcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICBpZiAodmFsdWUgPT09IG9sZCAmJiBrZXkgIT0gaW5zaWRlKSB7XG4gICAgICAgICAgICB0aGlzW2tleV0gPSByZXQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfSxcbiAgICAgIC8vIFRyYXZlcnNlIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiB3aXRoIERlcHRoIEZpcnN0IFNlYXJjaFxuICAgICAgREZTOiBmdW5jdGlvbiBERlMobywgY2FsbGJhY2ssIHR5cGUsIHZpc2l0ZWQpIHtcbiAgICAgICAgdmlzaXRlZCA9IHZpc2l0ZWQgfHwge307XG4gICAgICAgIHZhciBvYmpJZCA9IF8udXRpbC5vYmpJZDtcblxuICAgICAgICBmb3IgKHZhciBpIGluIG8pIHtcbiAgICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChvLCBpLCBvW2ldLCB0eXBlIHx8IGkpO1xuXG4gICAgICAgICAgICB2YXIgcHJvcGVydHkgPSBvW2ldLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5VHlwZSA9IF8udXRpbC50eXBlKHByb3BlcnR5KTtcblxuICAgICAgICAgICAgaWYgKHByb3BlcnR5VHlwZSA9PT0gJ09iamVjdCcgJiYgIXZpc2l0ZWRbb2JqSWQocHJvcGVydHkpXSkge1xuICAgICAgICAgICAgICB2aXNpdGVkW29iaklkKHByb3BlcnR5KV0gPSB0cnVlO1xuICAgICAgICAgICAgICBERlMocHJvcGVydHksIGNhbGxiYWNrLCBudWxsLCB2aXNpdGVkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlUeXBlID09PSAnQXJyYXknICYmICF2aXNpdGVkW29iaklkKHByb3BlcnR5KV0pIHtcbiAgICAgICAgICAgICAgdmlzaXRlZFtvYmpJZChwcm9wZXJ0eSldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgREZTKHByb3BlcnR5LCBjYWxsYmFjaywgaSwgdmlzaXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBwbHVnaW5zOiB7fSxcblxuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdGhlIG1vc3QgaGlnaC1sZXZlbCBmdW5jdGlvbiBpbiBQcmlzbeKAmXMgQVBJLlxuICAgICAqIEl0IGZldGNoZXMgYWxsIHRoZSBlbGVtZW50cyB0aGF0IGhhdmUgYSBgLmxhbmd1YWdlLXh4eHhgIGNsYXNzIGFuZCB0aGVuIGNhbGxzIHtAbGluayBQcmlzbS5oaWdobGlnaHRFbGVtZW50fSBvblxuICAgICAqIGVhY2ggb25lIG9mIHRoZW0uXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gYFByaXNtLmhpZ2hsaWdodEFsbFVuZGVyKGRvY3VtZW50LCBhc3luYywgY2FsbGJhY2spYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FzeW5jPWZhbHNlXSBTYW1lIGFzIGluIHtAbGluayBQcmlzbS5oaWdobGlnaHRBbGxVbmRlcn0uXG4gICAgICogQHBhcmFtIHtIaWdobGlnaHRDYWxsYmFja30gW2NhbGxiYWNrXSBTYW1lIGFzIGluIHtAbGluayBQcmlzbS5oaWdobGlnaHRBbGxVbmRlcn0uXG4gICAgICogQG1lbWJlcm9mIFByaXNtXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIGhpZ2hsaWdodEFsbDogZnVuY3Rpb24gaGlnaGxpZ2h0QWxsKGFzeW5jLCBjYWxsYmFjaykge1xuICAgICAgXy5oaWdobGlnaHRBbGxVbmRlcihkb2N1bWVudCwgYXN5bmMsIGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyBhbGwgdGhlIGRlc2NlbmRhbnRzIG9mIGBjb250YWluZXJgIHRoYXQgaGF2ZSBhIGAubGFuZ3VhZ2UteHh4eGAgY2xhc3MgYW5kIHRoZW4gY2FsbHNcbiAgICAgKiB7QGxpbmsgUHJpc20uaGlnaGxpZ2h0RWxlbWVudH0gb24gZWFjaCBvbmUgb2YgdGhlbS5cbiAgICAgKlxuICAgICAqIFRoZSBmb2xsb3dpbmcgaG9va3Mgd2lsbCBiZSBydW46XG4gICAgICogMS4gYGJlZm9yZS1oaWdobGlnaHRhbGxgXG4gICAgICogMi4gQWxsIGhvb2tzIG9mIHtAbGluayBQcmlzbS5oaWdobGlnaHRFbGVtZW50fSBmb3IgZWFjaCBlbGVtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQYXJlbnROb2RlfSBjb250YWluZXIgVGhlIHJvb3QgZWxlbWVudCwgd2hvc2UgZGVzY2VuZGFudHMgdGhhdCBoYXZlIGEgYC5sYW5ndWFnZS14eHh4YCBjbGFzcyB3aWxsIGJlIGhpZ2hsaWdodGVkLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FzeW5jPWZhbHNlXSBXaGV0aGVyIGVhY2ggZWxlbWVudCBpcyB0byBiZSBoaWdobGlnaHRlZCBhc3luY2hyb25vdXNseSB1c2luZyBXZWIgV29ya2Vycy5cbiAgICAgKiBAcGFyYW0ge0hpZ2hsaWdodENhbGxiYWNrfSBbY2FsbGJhY2tdIEFuIG9wdGlvbmFsIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgb24gZWFjaCBlbGVtZW50IGFmdGVyIGl0cyBoaWdobGlnaHRpbmcgaXMgZG9uZS5cbiAgICAgKiBAbWVtYmVyb2YgUHJpc21cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgaGlnaGxpZ2h0QWxsVW5kZXI6IGZ1bmN0aW9uIGhpZ2hsaWdodEFsbFVuZGVyKGNvbnRhaW5lciwgYXN5bmMsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgZW52ID0ge1xuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgIGNvbnRhaW5lcjogY29udGFpbmVyLFxuICAgICAgICBzZWxlY3RvcjogJ2NvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLCBbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIGNvZGUsIGNvZGVbY2xhc3MqPVwibGFuZy1cIl0sIFtjbGFzcyo9XCJsYW5nLVwiXSBjb2RlJ1xuICAgICAgfTtcblxuICAgICAgXy5ob29rcy5ydW4oJ2JlZm9yZS1oaWdobGlnaHRhbGwnLCBlbnYpO1xuXG4gICAgICBlbnYuZWxlbWVudHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZW52LmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKGVudi5zZWxlY3RvcikpO1xuXG4gICAgICBfLmhvb2tzLnJ1bignYmVmb3JlLWFsbC1lbGVtZW50cy1oaWdobGlnaHQnLCBlbnYpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgZWxlbWVudDsgZWxlbWVudCA9IGVudi5lbGVtZW50c1tpKytdOykge1xuICAgICAgICBfLmhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCwgYXN5bmMgPT09IHRydWUsIGVudi5jYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhpZ2hsaWdodHMgdGhlIGNvZGUgaW5zaWRlIGEgc2luZ2xlIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBUaGUgZm9sbG93aW5nIGhvb2tzIHdpbGwgYmUgcnVuOlxuICAgICAqIDEuIGBiZWZvcmUtc2FuaXR5LWNoZWNrYFxuICAgICAqIDIuIGBiZWZvcmUtaGlnaGxpZ2h0YFxuICAgICAqIDMuIEFsbCBob29rcyBvZiB7QGxpbmsgUHJpc20uaGlnaGxpZ2h0fS4gVGhlc2UgaG9va3Mgd2lsbCBvbmx5IGJlIHJ1biBieSB0aGUgY3VycmVudCB3b3JrZXIgaWYgYGFzeW5jYCBpcyBgdHJ1ZWAuXG4gICAgICogNC4gYGJlZm9yZS1pbnNlcnRgXG4gICAgICogNS4gYGFmdGVyLWhpZ2hsaWdodGBcbiAgICAgKiA2LiBgY29tcGxldGVgXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgY29kZS5cbiAgICAgKiBJdCBtdXN0IGhhdmUgYSBjbGFzcyBvZiBgbGFuZ3VhZ2UteHh4eGAgdG8gYmUgcHJvY2Vzc2VkLCB3aGVyZSBgeHh4eGAgaXMgYSB2YWxpZCBsYW5ndWFnZSBpZGVudGlmaWVyLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FzeW5jPWZhbHNlXSBXaGV0aGVyIHRoZSBlbGVtZW50IGlzIHRvIGJlIGhpZ2hsaWdodGVkIGFzeW5jaHJvbm91c2x5IHVzaW5nIFdlYiBXb3JrZXJzXG4gICAgICogdG8gaW1wcm92ZSBwZXJmb3JtYW5jZSBhbmQgYXZvaWQgYmxvY2tpbmcgdGhlIFVJIHdoZW4gaGlnaGxpZ2h0aW5nIHZlcnkgbGFyZ2UgY2h1bmtzIG9mIGNvZGUuIFRoaXMgb3B0aW9uIGlzXG4gICAgICogW2Rpc2FibGVkIGJ5IGRlZmF1bHRdKGh0dHBzOi8vcHJpc21qcy5jb20vZmFxLmh0bWwjd2h5LWlzLWFzeW5jaHJvbm91cy1oaWdobGlnaHRpbmctZGlzYWJsZWQtYnktZGVmYXVsdCkuXG4gICAgICpcbiAgICAgKiBOb3RlOiBBbGwgbGFuZ3VhZ2UgZGVmaW5pdGlvbnMgcmVxdWlyZWQgdG8gaGlnaGxpZ2h0IHRoZSBjb2RlIG11c3QgYmUgaW5jbHVkZWQgaW4gdGhlIG1haW4gYHByaXNtLmpzYCBmaWxlIGZvclxuICAgICAqIGFzeW5jaHJvbm91cyBoaWdobGlnaHRpbmcgdG8gd29yay4gWW91IGNhbiBidWlsZCB5b3VyIG93biBidW5kbGUgb24gdGhlXG4gICAgICogW0Rvd25sb2FkIHBhZ2VdKGh0dHBzOi8vcHJpc21qcy5jb20vZG93bmxvYWQuaHRtbCkuXG4gICAgICogQHBhcmFtIHtIaWdobGlnaHRDYWxsYmFja30gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjayB0byBiZSBpbnZva2VkIGFmdGVyIHRoZSBoaWdobGlnaHRpbmcgaXMgZG9uZS5cbiAgICAgKiBNb3N0bHkgdXNlZnVsIHdoZW4gYGFzeW5jYCBpcyBgdHJ1ZWAsIHNpbmNlIGluIHRoYXQgY2FzZSwgdGhlIGhpZ2hsaWdodGluZyBpcyBkb25lIGFzeW5jaHJvbm91c2x5LlxuICAgICAqIEBtZW1iZXJvZiBQcmlzbVxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBoaWdobGlnaHRFbGVtZW50OiBmdW5jdGlvbiBoaWdobGlnaHRFbGVtZW50KGVsZW1lbnQsIGFzeW5jLCBjYWxsYmFjaykge1xuICAgICAgLy8gRmluZCBsYW5ndWFnZVxuICAgICAgdmFyIGxhbmd1YWdlID0gXy51dGlsLmdldExhbmd1YWdlKGVsZW1lbnQpO1xuXG4gICAgICB2YXIgZ3JhbW1hciA9IF8ubGFuZ3VhZ2VzW2xhbmd1YWdlXTsgLy8gU2V0IGxhbmd1YWdlIG9uIHRoZSBlbGVtZW50LCBpZiBub3QgcHJlc2VudFxuXG4gICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UobGFuZywgJycpLnJlcGxhY2UoL1xccysvZywgJyAnKSArICcgbGFuZ3VhZ2UtJyArIGxhbmd1YWdlOyAvLyBTZXQgbGFuZ3VhZ2Ugb24gdGhlIHBhcmVudCwgZm9yIHN0eWxpbmdcblxuICAgICAgdmFyIHBhcmVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcblxuICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3ByZScpIHtcbiAgICAgICAgcGFyZW50LmNsYXNzTmFtZSA9IHBhcmVudC5jbGFzc05hbWUucmVwbGFjZShsYW5nLCAnJykucmVwbGFjZSgvXFxzKy9nLCAnICcpICsgJyBsYW5ndWFnZS0nICsgbGFuZ3VhZ2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBjb2RlID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICAgIHZhciBlbnYgPSB7XG4gICAgICAgIGVsZW1lbnQ6IGVsZW1lbnQsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZSxcbiAgICAgICAgZ3JhbW1hcjogZ3JhbW1hcixcbiAgICAgICAgY29kZTogY29kZVxuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gaW5zZXJ0SGlnaGxpZ2h0ZWRDb2RlKGhpZ2hsaWdodGVkQ29kZSkge1xuICAgICAgICBlbnYuaGlnaGxpZ2h0ZWRDb2RlID0gaGlnaGxpZ2h0ZWRDb2RlO1xuXG4gICAgICAgIF8uaG9va3MucnVuKCdiZWZvcmUtaW5zZXJ0JywgZW52KTtcblxuICAgICAgICBlbnYuZWxlbWVudC5pbm5lckhUTUwgPSBlbnYuaGlnaGxpZ2h0ZWRDb2RlO1xuXG4gICAgICAgIF8uaG9va3MucnVuKCdhZnRlci1oaWdobGlnaHQnLCBlbnYpO1xuXG4gICAgICAgIF8uaG9va3MucnVuKCdjb21wbGV0ZScsIGVudik7XG5cbiAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2suY2FsbChlbnYuZWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIF8uaG9va3MucnVuKCdiZWZvcmUtc2FuaXR5LWNoZWNrJywgZW52KTtcblxuICAgICAgaWYgKCFlbnYuY29kZSkge1xuICAgICAgICBfLmhvb2tzLnJ1bignY29tcGxldGUnLCBlbnYpO1xuXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrLmNhbGwoZW52LmVsZW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIF8uaG9va3MucnVuKCdiZWZvcmUtaGlnaGxpZ2h0JywgZW52KTtcblxuICAgICAgaWYgKCFlbnYuZ3JhbW1hcikge1xuICAgICAgICBpbnNlcnRIaWdobGlnaHRlZENvZGUoXy51dGlsLmVuY29kZShlbnYuY29kZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChhc3luYyAmJiBfc2VsZi5Xb3JrZXIpIHtcbiAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoXy5maWxlbmFtZSk7XG5cbiAgICAgICAgd29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICBpbnNlcnRIaWdobGlnaHRlZENvZGUoZXZ0LmRhdGEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgbGFuZ3VhZ2U6IGVudi5sYW5ndWFnZSxcbiAgICAgICAgICBjb2RlOiBlbnYuY29kZSxcbiAgICAgICAgICBpbW1lZGlhdGVDbG9zZTogdHJ1ZVxuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnNlcnRIaWdobGlnaHRlZENvZGUoXy5oaWdobGlnaHQoZW52LmNvZGUsIGVudi5ncmFtbWFyLCBlbnYubGFuZ3VhZ2UpKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG93LWxldmVsIGZ1bmN0aW9uLCBvbmx5IHVzZSBpZiB5b3Uga25vdyB3aGF0IHlvdeKAmXJlIGRvaW5nLiBJdCBhY2NlcHRzIGEgc3RyaW5nIG9mIHRleHQgYXMgaW5wdXRcbiAgICAgKiBhbmQgdGhlIGxhbmd1YWdlIGRlZmluaXRpb25zIHRvIHVzZSwgYW5kIHJldHVybnMgYSBzdHJpbmcgd2l0aCB0aGUgSFRNTCBwcm9kdWNlZC5cbiAgICAgKlxuICAgICAqIFRoZSBmb2xsb3dpbmcgaG9va3Mgd2lsbCBiZSBydW46XG4gICAgICogMS4gYGJlZm9yZS10b2tlbml6ZWBcbiAgICAgKiAyLiBgYWZ0ZXItdG9rZW5pemVgXG4gICAgICogMy4gYHdyYXBgOiBPbiBlYWNoIHtAbGluayBUb2tlbn0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBBIHN0cmluZyB3aXRoIHRoZSBjb2RlIHRvIGJlIGhpZ2hsaWdodGVkLlxuICAgICAqIEBwYXJhbSB7R3JhbW1hcn0gZ3JhbW1hciBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgdG9rZW5zIHRvIHVzZS5cbiAgICAgKlxuICAgICAqIFVzdWFsbHkgYSBsYW5ndWFnZSBkZWZpbml0aW9uIGxpa2UgYFByaXNtLmxhbmd1YWdlcy5tYXJrdXBgLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSBUaGUgbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgZGVmaW5pdGlvbiBwYXNzZWQgdG8gYGdyYW1tYXJgLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBoaWdobGlnaHRlZCBIVE1MLlxuICAgICAqIEBtZW1iZXJvZiBQcmlzbVxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIFByaXNtLmhpZ2hsaWdodCgndmFyIGZvbyA9IHRydWU7JywgUHJpc20ubGFuZ3VhZ2VzLmphdmFzY3JpcHQsICdqYXZhc2NyaXB0Jyk7XG4gICAgICovXG4gICAgaGlnaGxpZ2h0OiBmdW5jdGlvbiBoaWdobGlnaHQodGV4dCwgZ3JhbW1hciwgbGFuZ3VhZ2UpIHtcbiAgICAgIHZhciBlbnYgPSB7XG4gICAgICAgIGNvZGU6IHRleHQsXG4gICAgICAgIGdyYW1tYXI6IGdyYW1tYXIsXG4gICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZVxuICAgICAgfTtcblxuICAgICAgXy5ob29rcy5ydW4oJ2JlZm9yZS10b2tlbml6ZScsIGVudik7XG5cbiAgICAgIGVudi50b2tlbnMgPSBfLnRva2VuaXplKGVudi5jb2RlLCBlbnYuZ3JhbW1hcik7XG5cbiAgICAgIF8uaG9va3MucnVuKCdhZnRlci10b2tlbml6ZScsIGVudik7XG5cbiAgICAgIHJldHVybiBUb2tlbi5zdHJpbmdpZnkoXy51dGlsLmVuY29kZShlbnYudG9rZW5zKSwgZW52Lmxhbmd1YWdlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyB0aGUgaGVhcnQgb2YgUHJpc20sIGFuZCB0aGUgbW9zdCBsb3ctbGV2ZWwgZnVuY3Rpb24geW91IGNhbiB1c2UuIEl0IGFjY2VwdHMgYSBzdHJpbmcgb2YgdGV4dCBhcyBpbnB1dFxuICAgICAqIGFuZCB0aGUgbGFuZ3VhZ2UgZGVmaW5pdGlvbnMgdG8gdXNlLCBhbmQgcmV0dXJucyBhbiBhcnJheSB3aXRoIHRoZSB0b2tlbml6ZWQgY29kZS5cbiAgICAgKlxuICAgICAqIFdoZW4gdGhlIGxhbmd1YWdlIGRlZmluaXRpb24gaW5jbHVkZXMgbmVzdGVkIHRva2VucywgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZCByZWN1cnNpdmVseSBvbiBlYWNoIG9mIHRoZXNlIHRva2Vucy5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGNvdWxkIGJlIHVzZWZ1bCBpbiBvdGhlciBjb250ZXh0cyBhcyB3ZWxsLCBhcyBhIHZlcnkgY3J1ZGUgcGFyc2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgQSBzdHJpbmcgd2l0aCB0aGUgY29kZSB0byBiZSBoaWdobGlnaHRlZC5cbiAgICAgKiBAcGFyYW0ge0dyYW1tYXJ9IGdyYW1tYXIgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHRva2VucyB0byB1c2UuXG4gICAgICpcbiAgICAgKiBVc3VhbGx5IGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiBsaWtlIGBQcmlzbS5sYW5ndWFnZXMubWFya3VwYC5cbiAgICAgKiBAcmV0dXJucyB7VG9rZW5TdHJlYW19IEFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIHRva2VucywgYSB0b2tlbiBzdHJlYW0uXG4gICAgICogQG1lbWJlcm9mIFByaXNtXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBleGFtcGxlXG4gICAgICogbGV0IGNvZGUgPSBgdmFyIGZvbyA9IDA7YDtcbiAgICAgKiBsZXQgdG9rZW5zID0gUHJpc20udG9rZW5pemUoY29kZSwgUHJpc20ubGFuZ3VhZ2VzLmphdmFzY3JpcHQpO1xuICAgICAqIHRva2Vucy5mb3JFYWNoKHRva2VuID0+IHtcbiAgICAgKiAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgUHJpc20uVG9rZW4gJiYgdG9rZW4udHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgKiAgICAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCBudW1lcmljIGxpdGVyYWw6ICR7dG9rZW4uY29udGVudH1gKTtcbiAgICAgKiAgICAgfVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRva2VuaXplOiBmdW5jdGlvbiB0b2tlbml6ZSh0ZXh0LCBncmFtbWFyKSB7XG4gICAgICB2YXIgcmVzdCA9IGdyYW1tYXIucmVzdDtcblxuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgZm9yICh2YXIgdG9rZW4gaW4gcmVzdCkge1xuICAgICAgICAgIGdyYW1tYXJbdG9rZW5dID0gcmVzdFt0b2tlbl07XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgZ3JhbW1hci5yZXN0O1xuICAgICAgfVxuXG4gICAgICB2YXIgdG9rZW5MaXN0ID0gbmV3IExpbmtlZExpc3QoKTtcbiAgICAgIGFkZEFmdGVyKHRva2VuTGlzdCwgdG9rZW5MaXN0LmhlYWQsIHRleHQpO1xuICAgICAgbWF0Y2hHcmFtbWFyKHRleHQsIHRva2VuTGlzdCwgZ3JhbW1hciwgdG9rZW5MaXN0LmhlYWQsIDApO1xuICAgICAgcmV0dXJuIHRvQXJyYXkodG9rZW5MaXN0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQcmlzbVxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBob29rczoge1xuICAgICAgYWxsOiB7fSxcblxuICAgICAgLyoqXG4gICAgICAgKiBBZGRzIHRoZSBnaXZlbiBjYWxsYmFjayB0byB0aGUgbGlzdCBvZiBjYWxsYmFja3MgZm9yIHRoZSBnaXZlbiBob29rLlxuICAgICAgICpcbiAgICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIGJlIGludm9rZWQgd2hlbiB0aGUgaG9vayBpdCBpcyByZWdpc3RlcmVkIGZvciBpcyBydW4uXG4gICAgICAgKiBIb29rcyBhcmUgdXN1YWxseSBkaXJlY3RseSBydW4gYnkgYSBoaWdobGlnaHQgZnVuY3Rpb24gYnV0IHlvdSBjYW4gYWxzbyBydW4gaG9va3MgeW91cnNlbGYuXG4gICAgICAgKlxuICAgICAgICogT25lIGNhbGxiYWNrIGZ1bmN0aW9uIGNhbiBiZSByZWdpc3RlcmVkIHRvIG11bHRpcGxlIGhvb2tzIGFuZCB0aGUgc2FtZSBob29rIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBob29rLlxuICAgICAgICogQHBhcmFtIHtIb29rQ2FsbGJhY2t9IGNhbGxiYWNrIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCBpcyBnaXZlbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG4gICAgICAgKiBAcHVibGljXG4gICAgICAgKi9cbiAgICAgIGFkZDogZnVuY3Rpb24gYWRkKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBob29rcyA9IF8uaG9va3MuYWxsO1xuICAgICAgICBob29rc1tuYW1lXSA9IGhvb2tzW25hbWVdIHx8IFtdO1xuICAgICAgICBob29rc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUnVucyBhIGhvb2sgaW52b2tpbmcgYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIHdpdGggdGhlIGdpdmVuIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbiAgICAgICAqXG4gICAgICAgKiBDYWxsYmFja3Mgd2lsbCBiZSBpbnZva2VkIHN5bmNocm9ub3VzbHkgYW5kIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aGV5IHdlcmUgcmVnaXN0ZXJlZC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgaG9vay5cbiAgICAgICAqIEBwYXJhbSB7T2JqZWN0PHN0cmluZywgYW55Pn0gZW52IFRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgb2YgdGhlIGhvb2sgcGFzc2VkIHRvIGFsbCBjYWxsYmFja3MgcmVnaXN0ZXJlZC5cbiAgICAgICAqIEBwdWJsaWNcbiAgICAgICAqL1xuICAgICAgcnVuOiBmdW5jdGlvbiBydW4obmFtZSwgZW52KSB7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBfLmhvb2tzLmFsbFtuYW1lXTtcblxuICAgICAgICBpZiAoIWNhbGxiYWNrcyB8fCAhY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBjYWxsYmFjazsgY2FsbGJhY2sgPSBjYWxsYmFja3NbaSsrXTspIHtcbiAgICAgICAgICBjYWxsYmFjayhlbnYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBUb2tlbjogVG9rZW5cbiAgfTtcbiAgX3NlbGYuUHJpc20gPSBfOyAvLyBUeXBlc2NyaXB0IG5vdGU6XG4gIC8vIFRoZSBmb2xsb3dpbmcgY2FuIGJlIHVzZWQgdG8gaW1wb3J0IHRoZSBUb2tlbiB0eXBlIGluIEpTRG9jOlxuICAvL1xuICAvLyAgIEB0eXBlZGVmIHtJbnN0YW5jZVR5cGU8aW1wb3J0KFwiLi9wcmlzbS1jb3JlXCIpW1wiVG9rZW5cIl0+fSBUb2tlblxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBTZWUge0BsaW5rIFRva2VuI3R5cGUgdHlwZX1cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBUb2tlblN0cmVhbX0gY29udGVudCBTZWUge0BsaW5rIFRva2VuI2NvbnRlbnQgY29udGVudH1cbiAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IFthbGlhc10gVGhlIGFsaWFzKGVzKSBvZiB0aGUgdG9rZW4uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWF0Y2hlZFN0cj1cIlwiXSBBIGNvcHkgb2YgdGhlIGZ1bGwgc3RyaW5nIHRoaXMgdG9rZW4gd2FzIGNyZWF0ZWQgZnJvbS5cbiAgICogQGNsYXNzXG4gICAqIEBnbG9iYWxcbiAgICogQHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBUb2tlbih0eXBlLCBjb250ZW50LCBhbGlhcywgbWF0Y2hlZFN0cikge1xuICAgIC8qKlxuICAgICAqIFRoZSB0eXBlIG9mIHRoZSB0b2tlbi5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdXN1YWxseSB0aGUga2V5IG9mIGEgcGF0dGVybiBpbiBhIHtAbGluayBHcmFtbWFyfS5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICogQHNlZSBHcmFtbWFyVG9rZW5cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAvKipcbiAgICAgKiBUaGUgc3RyaW5ncyBvciB0b2tlbnMgY29udGFpbmVkIGJ5IHRoaXMgdG9rZW4uXG4gICAgICpcbiAgICAgKiBUaGlzIHdpbGwgYmUgYSB0b2tlbiBzdHJlYW0gaWYgdGhlIHBhdHRlcm4gbWF0Y2hlZCBhbHNvIGRlZmluZWQgYW4gYGluc2lkZWAgZ3JhbW1hci5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtzdHJpbmcgfCBUb2tlblN0cmVhbX1cbiAgICAgKiBAcHVibGljXG4gICAgICovXG5cbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xuICAgIC8qKlxuICAgICAqIFRoZSBhbGlhcyhlcykgb2YgdGhlIHRva2VuLlxuICAgICAqXG4gICAgICogQHR5cGUge3N0cmluZ3xzdHJpbmdbXX1cbiAgICAgKiBAc2VlIEdyYW1tYXJUb2tlblxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cblxuICAgIHRoaXMuYWxpYXMgPSBhbGlhczsgLy8gQ29weSBvZiB0aGUgZnVsbCBzdHJpbmcgdGhpcyB0b2tlbiB3YXMgY3JlYXRlZCBmcm9tXG5cbiAgICB0aGlzLmxlbmd0aCA9IChtYXRjaGVkU3RyIHx8ICcnKS5sZW5ndGggfCAwO1xuICB9XG4gIC8qKlxuICAgKiBBIHRva2VuIHN0cmVhbSBpcyBhbiBhcnJheSBvZiBzdHJpbmdzIGFuZCB7QGxpbmsgVG9rZW4gVG9rZW59IG9iamVjdHMuXG4gICAqXG4gICAqIFRva2VuIHN0cmVhbXMgaGF2ZSB0byBmdWxmaWxsIGEgZmV3IHByb3BlcnRpZXMgdGhhdCBhcmUgYXNzdW1lZCBieSBtb3N0IGZ1bmN0aW9ucyAobW9zdGx5IGludGVybmFsIG9uZXMpIHRoYXQgcHJvY2Vzc1xuICAgKiB0aGVtLlxuICAgKlxuICAgKiAxLiBObyBhZGphY2VudCBzdHJpbmdzLlxuICAgKiAyLiBObyBlbXB0eSBzdHJpbmdzLlxuICAgKlxuICAgKiAgICBUaGUgb25seSBleGNlcHRpb24gaGVyZSBpcyB0aGUgdG9rZW4gc3RyZWFtIHRoYXQgb25seSBjb250YWlucyB0aGUgZW1wdHkgc3RyaW5nIGFuZCBub3RoaW5nIGVsc2UuXG4gICAqXG4gICAqIEB0eXBlZGVmIHtBcnJheTxzdHJpbmcgfCBUb2tlbj59IFRva2VuU3RyZWFtXG4gICAqIEBnbG9iYWxcbiAgICogQHB1YmxpY1xuICAgKi9cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIGdpdmVuIHRva2VuIG9yIHRva2VuIHN0cmVhbSB0byBhbiBIVE1MIHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGhvb2tzIHdpbGwgYmUgcnVuOlxuICAgKiAxLiBgd3JhcGA6IE9uIGVhY2gge0BsaW5rIFRva2VufS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBUb2tlbiB8IFRva2VuU3RyZWFtfSBvIFRoZSB0b2tlbiBvciB0b2tlbiBzdHJlYW0gdG8gYmUgY29udmVydGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgVGhlIG5hbWUgb2YgY3VycmVudCBsYW5ndWFnZS5cbiAgICogQHJldHVybnMge3N0cmluZ30gVGhlIEhUTUwgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRva2VuIG9yIHRva2VuIHN0cmVhbS5cbiAgICogQG1lbWJlcm9mIFRva2VuXG4gICAqIEBzdGF0aWNcbiAgICovXG5cblxuICBUb2tlbi5zdHJpbmdpZnkgPSBmdW5jdGlvbiBzdHJpbmdpZnkobywgbGFuZ3VhZ2UpIHtcbiAgICBpZiAodHlwZW9mIG8gPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KG8pKSB7XG4gICAgICB2YXIgcyA9ICcnO1xuICAgICAgby5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHMgKz0gc3RyaW5naWZ5KGUsIGxhbmd1YWdlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHM7XG4gICAgfVxuXG4gICAgdmFyIGVudiA9IHtcbiAgICAgIHR5cGU6IG8udHlwZSxcbiAgICAgIGNvbnRlbnQ6IHN0cmluZ2lmeShvLmNvbnRlbnQsIGxhbmd1YWdlKSxcbiAgICAgIHRhZzogJ3NwYW4nLFxuICAgICAgY2xhc3NlczogWyd0b2tlbicsIG8udHlwZV0sXG4gICAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZVxuICAgIH07XG4gICAgdmFyIGFsaWFzZXMgPSBvLmFsaWFzO1xuXG4gICAgaWYgKGFsaWFzZXMpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGFsaWFzZXMpKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGVudi5jbGFzc2VzLCBhbGlhc2VzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVudi5jbGFzc2VzLnB1c2goYWxpYXNlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgXy5ob29rcy5ydW4oJ3dyYXAnLCBlbnYpO1xuXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSAnJztcblxuICAgIGZvciAodmFyIG5hbWUgaW4gZW52LmF0dHJpYnV0ZXMpIHtcbiAgICAgIGF0dHJpYnV0ZXMgKz0gJyAnICsgbmFtZSArICc9XCInICsgKGVudi5hdHRyaWJ1dGVzW25hbWVdIHx8ICcnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JykgKyAnXCInO1xuICAgIH1cblxuICAgIHJldHVybiAnPCcgKyBlbnYudGFnICsgJyBjbGFzcz1cIicgKyBlbnYuY2xhc3Nlcy5qb2luKCcgJykgKyAnXCInICsgYXR0cmlidXRlcyArICc+JyArIGVudi5jb250ZW50ICsgJzwvJyArIGVudi50YWcgKyAnPic7XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICAgKiBAcGFyYW0ge0xpbmtlZExpc3Q8c3RyaW5nIHwgVG9rZW4+fSB0b2tlbkxpc3RcbiAgICogQHBhcmFtIHthbnl9IGdyYW1tYXJcbiAgICogQHBhcmFtIHtMaW5rZWRMaXN0Tm9kZTxzdHJpbmcgfCBUb2tlbj59IHN0YXJ0Tm9kZVxuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnRQb3NcbiAgICogQHBhcmFtIHtSZW1hdGNoT3B0aW9uc30gW3JlbWF0Y2hdXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKiBAcHJpdmF0ZVxuICAgKlxuICAgKiBAdHlwZWRlZiBSZW1hdGNoT3B0aW9uc1xuICAgKiBAcHJvcGVydHkge3N0cmluZ30gY2F1c2VcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHJlYWNoXG4gICAqL1xuXG5cbiAgZnVuY3Rpb24gbWF0Y2hHcmFtbWFyKHRleHQsIHRva2VuTGlzdCwgZ3JhbW1hciwgc3RhcnROb2RlLCBzdGFydFBvcywgcmVtYXRjaCkge1xuICAgIGZvciAodmFyIHRva2VuIGluIGdyYW1tYXIpIHtcbiAgICAgIGlmICghZ3JhbW1hci5oYXNPd25Qcm9wZXJ0eSh0b2tlbikgfHwgIWdyYW1tYXJbdG9rZW5dKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgcGF0dGVybnMgPSBncmFtbWFyW3Rva2VuXTtcbiAgICAgIHBhdHRlcm5zID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucykgPyBwYXR0ZXJucyA6IFtwYXR0ZXJuc107XG5cbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGF0dGVybnMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgaWYgKHJlbWF0Y2ggJiYgcmVtYXRjaC5jYXVzZSA9PSB0b2tlbiArICcsJyArIGopIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGF0dGVybk9iaiA9IHBhdHRlcm5zW2pdLFxuICAgICAgICAgICAgaW5zaWRlID0gcGF0dGVybk9iai5pbnNpZGUsXG4gICAgICAgICAgICBsb29rYmVoaW5kID0gISFwYXR0ZXJuT2JqLmxvb2tiZWhpbmQsXG4gICAgICAgICAgICBncmVlZHkgPSAhIXBhdHRlcm5PYmouZ3JlZWR5LFxuICAgICAgICAgICAgbG9va2JlaGluZExlbmd0aCA9IDAsXG4gICAgICAgICAgICBhbGlhcyA9IHBhdHRlcm5PYmouYWxpYXM7XG5cbiAgICAgICAgaWYgKGdyZWVkeSAmJiAhcGF0dGVybk9iai5wYXR0ZXJuLmdsb2JhbCkge1xuICAgICAgICAgIC8vIFdpdGhvdXQgdGhlIGdsb2JhbCBmbGFnLCBsYXN0SW5kZXggd29uJ3Qgd29ya1xuICAgICAgICAgIHZhciBmbGFncyA9IHBhdHRlcm5PYmoucGF0dGVybi50b1N0cmluZygpLm1hdGNoKC9baW1zdXldKiQvKVswXTtcbiAgICAgICAgICBwYXR0ZXJuT2JqLnBhdHRlcm4gPSBSZWdFeHAocGF0dGVybk9iai5wYXR0ZXJuLnNvdXJjZSwgZmxhZ3MgKyAnZycpO1xuICAgICAgICB9XG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xuXG5cbiAgICAgICAgdmFyIHBhdHRlcm4gPSBwYXR0ZXJuT2JqLnBhdHRlcm4gfHwgcGF0dGVybk9iajtcblxuICAgICAgICBmb3IgKCAvLyBpdGVyYXRlIHRoZSB0b2tlbiBsaXN0IGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBjdXJyZW50IHRva2VuL3N0cmluZyBwb3NpdGlvblxuICAgICAgICB2YXIgY3VycmVudE5vZGUgPSBzdGFydE5vZGUubmV4dCwgcG9zID0gc3RhcnRQb3M7IGN1cnJlbnROb2RlICE9PSB0b2tlbkxpc3QudGFpbDsgcG9zICs9IGN1cnJlbnROb2RlLnZhbHVlLmxlbmd0aCwgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5uZXh0KSB7XG4gICAgICAgICAgaWYgKHJlbWF0Y2ggJiYgcG9zID49IHJlbWF0Y2gucmVhY2gpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzdHIgPSBjdXJyZW50Tm9kZS52YWx1ZTtcblxuICAgICAgICAgIGlmICh0b2tlbkxpc3QubGVuZ3RoID4gdGV4dC5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIFNvbWV0aGluZyB3ZW50IHRlcnJpYmx5IHdyb25nLCBBQk9SVCwgQUJPUlQhXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHN0ciBpbnN0YW5jZW9mIFRva2VuKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgcmVtb3ZlQ291bnQgPSAxOyAvLyB0aGlzIGlzIHRoZSB0byBwYXJhbWV0ZXIgb2YgcmVtb3ZlQmV0d2VlblxuXG4gICAgICAgICAgaWYgKGdyZWVkeSAmJiBjdXJyZW50Tm9kZSAhPSB0b2tlbkxpc3QudGFpbC5wcmV2KSB7XG4gICAgICAgICAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IHBvcztcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IHBhdHRlcm4uZXhlYyh0ZXh0KTtcblxuICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZyb20gPSBtYXRjaC5pbmRleCArIChsb29rYmVoaW5kICYmIG1hdGNoWzFdID8gbWF0Y2hbMV0ubGVuZ3RoIDogMCk7XG4gICAgICAgICAgICB2YXIgdG8gPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBwID0gcG9zOyAvLyBmaW5kIHRoZSBub2RlIHRoYXQgY29udGFpbnMgdGhlIG1hdGNoXG5cbiAgICAgICAgICAgIHAgKz0gY3VycmVudE5vZGUudmFsdWUubGVuZ3RoO1xuXG4gICAgICAgICAgICB3aGlsZSAoZnJvbSA+PSBwKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dDtcbiAgICAgICAgICAgICAgcCArPSBjdXJyZW50Tm9kZS52YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICB9IC8vIGFkanVzdCBwb3MgKGFuZCBwKVxuXG5cbiAgICAgICAgICAgIHAgLT0gY3VycmVudE5vZGUudmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgcG9zID0gcDsgLy8gdGhlIGN1cnJlbnQgbm9kZSBpcyBhIFRva2VuLCB0aGVuIHRoZSBtYXRjaCBzdGFydHMgaW5zaWRlIGFub3RoZXIgVG9rZW4sIHdoaWNoIGlzIGludmFsaWRcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlLnZhbHVlIGluc3RhbmNlb2YgVG9rZW4pIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IC8vIGZpbmQgdGhlIGxhc3Qgbm9kZSB3aGljaCBpcyBhZmZlY3RlZCBieSB0aGlzIG1hdGNoXG5cblxuICAgICAgICAgICAgZm9yICh2YXIgayA9IGN1cnJlbnROb2RlOyBrICE9PSB0b2tlbkxpc3QudGFpbCAmJiAocCA8IHRvIHx8IHR5cGVvZiBrLnZhbHVlID09PSAnc3RyaW5nJyk7IGsgPSBrLm5leHQpIHtcbiAgICAgICAgICAgICAgcmVtb3ZlQ291bnQrKztcbiAgICAgICAgICAgICAgcCArPSBrLnZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVtb3ZlQ291bnQtLTsgLy8gcmVwbGFjZSB3aXRoIHRoZSBuZXcgbWF0Y2hcblxuICAgICAgICAgICAgc3RyID0gdGV4dC5zbGljZShwb3MsIHApO1xuICAgICAgICAgICAgbWF0Y2guaW5kZXggLT0gcG9zO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXR0ZXJuLmxhc3RJbmRleCA9IDA7XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoc3RyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIW1hdGNoKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobG9va2JlaGluZCkge1xuICAgICAgICAgICAgbG9va2JlaGluZExlbmd0aCA9IG1hdGNoWzFdID8gbWF0Y2hbMV0ubGVuZ3RoIDogMDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZnJvbSA9IG1hdGNoLmluZGV4ICsgbG9va2JlaGluZExlbmd0aCxcbiAgICAgICAgICAgICAgbWF0Y2hTdHIgPSBtYXRjaFswXS5zbGljZShsb29rYmVoaW5kTGVuZ3RoKSxcbiAgICAgICAgICAgICAgdG8gPSBmcm9tICsgbWF0Y2hTdHIubGVuZ3RoLFxuICAgICAgICAgICAgICBiZWZvcmUgPSBzdHIuc2xpY2UoMCwgZnJvbSksXG4gICAgICAgICAgICAgIGFmdGVyID0gc3RyLnNsaWNlKHRvKTtcbiAgICAgICAgICB2YXIgcmVhY2ggPSBwb3MgKyBzdHIubGVuZ3RoO1xuXG4gICAgICAgICAgaWYgKHJlbWF0Y2ggJiYgcmVhY2ggPiByZW1hdGNoLnJlYWNoKSB7XG4gICAgICAgICAgICByZW1hdGNoLnJlYWNoID0gcmVhY2g7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHJlbW92ZUZyb20gPSBjdXJyZW50Tm9kZS5wcmV2O1xuXG4gICAgICAgICAgaWYgKGJlZm9yZSkge1xuICAgICAgICAgICAgcmVtb3ZlRnJvbSA9IGFkZEFmdGVyKHRva2VuTGlzdCwgcmVtb3ZlRnJvbSwgYmVmb3JlKTtcbiAgICAgICAgICAgIHBvcyArPSBiZWZvcmUubGVuZ3RoO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlbW92ZVJhbmdlKHRva2VuTGlzdCwgcmVtb3ZlRnJvbSwgcmVtb3ZlQ291bnQpO1xuICAgICAgICAgIHZhciB3cmFwcGVkID0gbmV3IFRva2VuKHRva2VuLCBpbnNpZGUgPyBfLnRva2VuaXplKG1hdGNoU3RyLCBpbnNpZGUpIDogbWF0Y2hTdHIsIGFsaWFzLCBtYXRjaFN0cik7XG4gICAgICAgICAgY3VycmVudE5vZGUgPSBhZGRBZnRlcih0b2tlbkxpc3QsIHJlbW92ZUZyb20sIHdyYXBwZWQpO1xuXG4gICAgICAgICAgaWYgKGFmdGVyKSB7XG4gICAgICAgICAgICBhZGRBZnRlcih0b2tlbkxpc3QsIGN1cnJlbnROb2RlLCBhZnRlcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHJlbW92ZUNvdW50ID4gMSkge1xuICAgICAgICAgICAgLy8gYXQgbGVhc3Qgb25lIFRva2VuIG9iamVjdCB3YXMgcmVtb3ZlZCwgc28gd2UgaGF2ZSB0byBkbyBzb21lIHJlbWF0Y2hpbmdcbiAgICAgICAgICAgIC8vIHRoaXMgY2FuIG9ubHkgaGFwcGVuIGlmIHRoZSBjdXJyZW50IHBhdHRlcm4gaXMgZ3JlZWR5XG4gICAgICAgICAgICBtYXRjaEdyYW1tYXIodGV4dCwgdG9rZW5MaXN0LCBncmFtbWFyLCBjdXJyZW50Tm9kZS5wcmV2LCBwb3MsIHtcbiAgICAgICAgICAgICAgY2F1c2U6IHRva2VuICsgJywnICsgaixcbiAgICAgICAgICAgICAgcmVhY2g6IHJlYWNoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEB0eXBlZGVmIExpbmtlZExpc3ROb2RlXG4gICAqIEBwcm9wZXJ0eSB7VH0gdmFsdWVcbiAgICogQHByb3BlcnR5IHtMaW5rZWRMaXN0Tm9kZTxUPiB8IG51bGx9IHByZXYgVGhlIHByZXZpb3VzIG5vZGUuXG4gICAqIEBwcm9wZXJ0eSB7TGlua2VkTGlzdE5vZGU8VD4gfCBudWxsfSBuZXh0IFRoZSBuZXh0IG5vZGUuXG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqIEBwcml2YXRlXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAdGVtcGxhdGUgVFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cblxuXG4gIGZ1bmN0aW9uIExpbmtlZExpc3QoKSB7XG4gICAgLyoqIEB0eXBlIHtMaW5rZWRMaXN0Tm9kZTxUPn0gKi9cbiAgICB2YXIgaGVhZCA9IHtcbiAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgcHJldjogbnVsbCxcbiAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuICAgIC8qKiBAdHlwZSB7TGlua2VkTGlzdE5vZGU8VD59ICovXG5cbiAgICB2YXIgdGFpbCA9IHtcbiAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgcHJldjogaGVhZCxcbiAgICAgIG5leHQ6IG51bGxcbiAgICB9O1xuICAgIGhlYWQubmV4dCA9IHRhaWw7XG4gICAgLyoqIEB0eXBlIHtMaW5rZWRMaXN0Tm9kZTxUPn0gKi9cblxuICAgIHRoaXMuaGVhZCA9IGhlYWQ7XG4gICAgLyoqIEB0eXBlIHtMaW5rZWRMaXN0Tm9kZTxUPn0gKi9cblxuICAgIHRoaXMudGFpbCA9IHRhaWw7XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuICB9XG4gIC8qKlxuICAgKiBBZGRzIGEgbmV3IG5vZGUgd2l0aCB0aGUgZ2l2ZW4gdmFsdWUgdG8gdGhlIGxpc3QuXG4gICAqIEBwYXJhbSB7TGlua2VkTGlzdDxUPn0gbGlzdFxuICAgKiBAcGFyYW0ge0xpbmtlZExpc3ROb2RlPFQ+fSBub2RlXG4gICAqIEBwYXJhbSB7VH0gdmFsdWVcbiAgICogQHJldHVybnMge0xpbmtlZExpc3ROb2RlPFQ+fSBUaGUgYWRkZWQgbm9kZS5cbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG5cblxuICBmdW5jdGlvbiBhZGRBZnRlcihsaXN0LCBub2RlLCB2YWx1ZSkge1xuICAgIC8vIGFzc3VtZXMgdGhhdCBub2RlICE9IGxpc3QudGFpbCAmJiB2YWx1ZXMubGVuZ3RoID49IDBcbiAgICB2YXIgbmV4dCA9IG5vZGUubmV4dDtcbiAgICB2YXIgbmV3Tm9kZSA9IHtcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIHByZXY6IG5vZGUsXG4gICAgICBuZXh0OiBuZXh0XG4gICAgfTtcbiAgICBub2RlLm5leHQgPSBuZXdOb2RlO1xuICAgIG5leHQucHJldiA9IG5ld05vZGU7XG4gICAgbGlzdC5sZW5ndGgrKztcbiAgICByZXR1cm4gbmV3Tm9kZTtcbiAgfVxuICAvKipcbiAgICogUmVtb3ZlcyBgY291bnRgIG5vZGVzIGFmdGVyIHRoZSBnaXZlbiBub2RlLiBUaGUgZ2l2ZW4gbm9kZSB3aWxsIG5vdCBiZSByZW1vdmVkLlxuICAgKiBAcGFyYW0ge0xpbmtlZExpc3Q8VD59IGxpc3RcbiAgICogQHBhcmFtIHtMaW5rZWRMaXN0Tm9kZTxUPn0gbm9kZVxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnRcbiAgICogQHRlbXBsYXRlIFRcbiAgICovXG5cblxuICBmdW5jdGlvbiByZW1vdmVSYW5nZShsaXN0LCBub2RlLCBjb3VudCkge1xuICAgIHZhciBuZXh0ID0gbm9kZS5uZXh0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudCAmJiBuZXh0ICE9PSBsaXN0LnRhaWw7IGkrKykge1xuICAgICAgbmV4dCA9IG5leHQubmV4dDtcbiAgICB9XG5cbiAgICBub2RlLm5leHQgPSBuZXh0O1xuICAgIG5leHQucHJldiA9IG5vZGU7XG4gICAgbGlzdC5sZW5ndGggLT0gaTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtIHtMaW5rZWRMaXN0PFQ+fSBsaXN0XG4gICAqIEByZXR1cm5zIHtUW119XG4gICAqIEB0ZW1wbGF0ZSBUXG4gICAqL1xuXG5cbiAgZnVuY3Rpb24gdG9BcnJheShsaXN0KSB7XG4gICAgdmFyIGFycmF5ID0gW107XG4gICAgdmFyIG5vZGUgPSBsaXN0LmhlYWQubmV4dDtcblxuICAgIHdoaWxlIChub2RlICE9PSBsaXN0LnRhaWwpIHtcbiAgICAgIGFycmF5LnB1c2gobm9kZS52YWx1ZSk7XG4gICAgICBub2RlID0gbm9kZS5uZXh0O1xuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbiAgfVxuXG4gIGlmICghX3NlbGYuZG9jdW1lbnQpIHtcbiAgICBpZiAoIV9zZWxmLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIC8vIGluIE5vZGUuanNcbiAgICAgIHJldHVybiBfO1xuICAgIH1cblxuICAgIGlmICghXy5kaXNhYmxlV29ya2VyTWVzc2FnZUhhbmRsZXIpIHtcbiAgICAgIC8vIEluIHdvcmtlclxuICAgICAgX3NlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2dC5kYXRhKSxcbiAgICAgICAgICAgIGxhbmcgPSBtZXNzYWdlLmxhbmd1YWdlLFxuICAgICAgICAgICAgY29kZSA9IG1lc3NhZ2UuY29kZSxcbiAgICAgICAgICAgIGltbWVkaWF0ZUNsb3NlID0gbWVzc2FnZS5pbW1lZGlhdGVDbG9zZTtcblxuICAgICAgICBfc2VsZi5wb3N0TWVzc2FnZShfLmhpZ2hsaWdodChjb2RlLCBfLmxhbmd1YWdlc1tsYW5nXSwgbGFuZykpO1xuXG4gICAgICAgIGlmIChpbW1lZGlhdGVDbG9zZSkge1xuICAgICAgICAgIF9zZWxmLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gXztcbiAgfSAvLyBHZXQgY3VycmVudCBzY3JpcHQgYW5kIGhpZ2hsaWdodFxuXG5cbiAgdmFyIHNjcmlwdCA9IF8udXRpbC5jdXJyZW50U2NyaXB0KCk7XG5cbiAgaWYgKHNjcmlwdCkge1xuICAgIF8uZmlsZW5hbWUgPSBzY3JpcHQuc3JjO1xuXG4gICAgaWYgKHNjcmlwdC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbWFudWFsJykpIHtcbiAgICAgIF8ubWFudWFsID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvbWF0aWNhbGx5Q2FsbGJhY2soKSB7XG4gICAgaWYgKCFfLm1hbnVhbCkge1xuICAgICAgXy5oaWdobGlnaHRBbGwoKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIV8ubWFudWFsKSB7XG4gICAgLy8gSWYgdGhlIGRvY3VtZW50IHN0YXRlIGlzIFwibG9hZGluZ1wiLCB0aGVuIHdlJ2xsIHVzZSBET01Db250ZW50TG9hZGVkLlxuICAgIC8vIElmIHRoZSBkb2N1bWVudCBzdGF0ZSBpcyBcImludGVyYWN0aXZlXCIgYW5kIHRoZSBwcmlzbS5qcyBzY3JpcHQgaXMgZGVmZXJyZWQsIHRoZW4gd2UnbGwgYWxzbyB1c2UgdGhlXG4gICAgLy8gRE9NQ29udGVudExvYWRlZCBldmVudCBiZWNhdXNlIHRoZXJlIG1pZ2h0IGJlIHNvbWUgcGx1Z2lucyBvciBsYW5ndWFnZXMgd2hpY2ggaGF2ZSBhbHNvIGJlZW4gZGVmZXJyZWQgYW5kIHRoZXlcbiAgICAvLyBtaWdodCB0YWtlIGxvbmdlciBvbmUgYW5pbWF0aW9uIGZyYW1lIHRvIGV4ZWN1dGUgd2hpY2ggY2FuIGNyZWF0ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIG9ubHkgc29tZSBwbHVnaW5zIGhhdmVcbiAgICAvLyBiZWVuIGxvYWRlZCB3aGVuIFByaXNtLmhpZ2hsaWdodEFsbCgpIGlzIGV4ZWN1dGVkLCBkZXBlbmRpbmcgb24gaG93IGZhc3QgcmVzb3VyY2VzIGFyZSBsb2FkZWQuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9QcmlzbUpTL3ByaXNtL2lzc3Vlcy8yMTAyXG4gICAgdmFyIHJlYWR5U3RhdGUgPSBkb2N1bWVudC5yZWFkeVN0YXRlO1xuXG4gICAgaWYgKHJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJyB8fCByZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnICYmIHNjcmlwdCAmJiBzY3JpcHQuZGVmZXIpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBoaWdobGlnaHRBdXRvbWF0aWNhbGx5Q2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGhpZ2hsaWdodEF1dG9tYXRpY2FsbHlDYWxsYmFjayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChoaWdobGlnaHRBdXRvbWF0aWNhbGx5Q2FsbGJhY2ssIDE2KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gXztcbn0oX3NlbGYpO1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBQcmlzbTtcbn0gLy8gaGFjayBmb3IgY29tcG9uZW50cyB0byB3b3JrIGNvcnJlY3RseSBpbiBub2RlLmpzXG5cblxuaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIGdsb2JhbC5QcmlzbSA9IFByaXNtO1xufSAvLyBzb21lIGFkZGl0aW9uYWwgZG9jdW1lbnRhdGlvbi90eXBlc1xuXG4vKipcbiAqIFRoZSBleHBhbnNpb24gb2YgYSBzaW1wbGUgYFJlZ0V4cGAgbGl0ZXJhbCB0byBzdXBwb3J0IGFkZGl0aW9uYWwgcHJvcGVydGllcy5cbiAqXG4gKiBAdHlwZWRlZiBHcmFtbWFyVG9rZW5cbiAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBwYXR0ZXJuIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gb2YgdGhlIHRva2VuLlxuICogQHByb3BlcnR5IHtib29sZWFufSBbbG9va2JlaGluZD1mYWxzZV0gSWYgYHRydWVgLCB0aGVuIHRoZSBmaXJzdCBjYXB0dXJpbmcgZ3JvdXAgb2YgYHBhdHRlcm5gIHdpbGwgKGVmZmVjdGl2ZWx5KVxuICogYmVoYXZlIGFzIGEgbG9va2JlaGluZCBncm91cCBtZWFuaW5nIHRoYXQgdGhlIGNhcHR1cmVkIHRleHQgd2lsbCBub3QgYmUgcGFydCBvZiB0aGUgbWF0Y2hlZCB0ZXh0IG9mIHRoZSBuZXcgdG9rZW4uXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtncmVlZHk9ZmFsc2VdIFdoZXRoZXIgdGhlIHRva2VuIGlzIGdyZWVkeS5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfHN0cmluZ1tdfSBbYWxpYXNdIEFuIG9wdGlvbmFsIGFsaWFzIG9yIGxpc3Qgb2YgYWxpYXNlcy5cbiAqIEBwcm9wZXJ0eSB7R3JhbW1hcn0gW2luc2lkZV0gVGhlIG5lc3RlZCBncmFtbWFyIG9mIHRoaXMgdG9rZW4uXG4gKlxuICogVGhlIGBpbnNpZGVgIGdyYW1tYXIgd2lsbCBiZSB1c2VkIHRvIHRva2VuaXplIHRoZSB0ZXh0IHZhbHVlIG9mIGVhY2ggdG9rZW4gb2YgdGhpcyBraW5kLlxuICpcbiAqIFRoaXMgY2FuIGJlIHVzZWQgdG8gbWFrZSBuZXN0ZWQgYW5kIGV2ZW4gcmVjdXJzaXZlIGxhbmd1YWdlIGRlZmluaXRpb25zLlxuICpcbiAqIE5vdGU6IFRoaXMgY2FuIGNhdXNlIGluZmluaXRlIHJlY3Vyc2lvbi4gQmUgY2FyZWZ1bCB3aGVuIHlvdSBlbWJlZCBkaWZmZXJlbnQgbGFuZ3VhZ2VzIG9yIGV2ZW4gdGhlIHNhbWUgbGFuZ3VhZ2UgaW50b1xuICogZWFjaCBhbm90aGVyLlxuICogQGdsb2JhbFxuICogQHB1YmxpY1xuKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBHcmFtbWFyXG4gKiBAdHlwZSB7T2JqZWN0PHN0cmluZywgUmVnRXhwIHwgR3JhbW1hclRva2VuIHwgQXJyYXk8UmVnRXhwIHwgR3JhbW1hclRva2VuPj59XG4gKiBAcHJvcGVydHkge0dyYW1tYXJ9IFtyZXN0XSBBbiBvcHRpb25hbCBncmFtbWFyIG9iamVjdCB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgdG8gdGhpcyBncmFtbWFyLlxuICogQGdsb2JhbFxuICogQHB1YmxpY1xuICovXG5cbi8qKlxuICogQSBmdW5jdGlvbiB3aGljaCB3aWxsIGludm9rZWQgYWZ0ZXIgYW4gZWxlbWVudCB3YXMgc3VjY2Vzc2Z1bGx5IGhpZ2hsaWdodGVkLlxuICpcbiAqIEBjYWxsYmFjayBIaWdobGlnaHRDYWxsYmFja1xuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHN1Y2Nlc3NmdWxseSBoaWdobGlnaHRlZC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICogQGdsb2JhbFxuICogQHB1YmxpY1xuKi9cblxuLyoqXG4gKiBAY2FsbGJhY2sgSG9va0NhbGxiYWNrXG4gKiBAcGFyYW0ge09iamVjdDxzdHJpbmcsIGFueT59IGVudiBUaGUgZW52aXJvbm1lbnQgdmFyaWFibGVzIG9mIHRoZSBob29rLlxuICogQHJldHVybnMge3ZvaWR9XG4gKiBAZ2xvYmFsXG4gKiBAcHVibGljXG4gKi9cblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICBCZWdpbiBwcmlzbS1tYXJrdXAuanNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cblxuXG5QcmlzbS5sYW5ndWFnZXMubWFya3VwID0ge1xuICAnY29tbWVudCc6IC88IS0tW1xcc1xcU10qPy0tPi8sXG4gICdwcm9sb2cnOiAvPFxcP1tcXHNcXFNdKz9cXD8+LyxcbiAgJ2RvY3R5cGUnOiB7XG4gICAgLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSL3htbC8jTlQtZG9jdHlwZWRlY2xcbiAgICBwYXR0ZXJuOiAvPCFET0NUWVBFKD86W14+XCInW1xcXV18XCJbXlwiXSpcInwnW14nXSonKSsoPzpcXFsoPzpbXjxcIidcXF1dfFwiW15cIl0qXCJ8J1teJ10qJ3w8KD8hIS0tKXw8IS0tKD86W14tXXwtKD8hLT4pKSotLT4pKlxcXVxccyopPz4vaSxcbiAgICBncmVlZHk6IHRydWUsXG4gICAgaW5zaWRlOiB7XG4gICAgICAnaW50ZXJuYWwtc3Vic2V0Jzoge1xuICAgICAgICBwYXR0ZXJuOiAvKFxcWylbXFxzXFxTXSsoPz1cXF0+JCkvLFxuICAgICAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgICAgICBncmVlZHk6IHRydWUsXG4gICAgICAgIGluc2lkZTogbnVsbCAvLyBzZWUgYmVsb3dcblxuICAgICAgfSxcbiAgICAgICdzdHJpbmcnOiB7XG4gICAgICAgIHBhdHRlcm46IC9cIlteXCJdKlwifCdbXiddKicvLFxuICAgICAgICBncmVlZHk6IHRydWVcbiAgICAgIH0sXG4gICAgICAncHVuY3R1YXRpb24nOiAvXjwhfD4kfFtbXFxdXS8sXG4gICAgICAnZG9jdHlwZS10YWcnOiAvXkRPQ1RZUEUvLFxuICAgICAgJ25hbWUnOiAvW15cXHM8PidcIl0rL1xuICAgIH1cbiAgfSxcbiAgJ2NkYXRhJzogLzwhXFxbQ0RBVEFcXFtbXFxzXFxTXSo/XV0+L2ksXG4gICd0YWcnOiB7XG4gICAgcGF0dGVybjogLzxcXC8/KD8hXFxkKVteXFxzPlxcLz0kPCVdKyg/Olxccyg/OlxccypbXlxccz5cXC89XSsoPzpcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W15cXHMnXCI+PV0rKD89W1xccz5dKSl8KD89W1xccy8+XSkpKSspP1xccypcXC8/Pi8sXG4gICAgZ3JlZWR5OiB0cnVlLFxuICAgIGluc2lkZToge1xuICAgICAgJ3RhZyc6IHtcbiAgICAgICAgcGF0dGVybjogL148XFwvP1teXFxzPlxcL10rLyxcbiAgICAgICAgaW5zaWRlOiB7XG4gICAgICAgICAgJ3B1bmN0dWF0aW9uJzogL148XFwvPy8sXG4gICAgICAgICAgJ25hbWVzcGFjZSc6IC9eW15cXHM+XFwvOl0rOi9cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdhdHRyLXZhbHVlJzoge1xuICAgICAgICBwYXR0ZXJuOiAvPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W15cXHMnXCI+PV0rKS8sXG4gICAgICAgIGluc2lkZToge1xuICAgICAgICAgICdwdW5jdHVhdGlvbic6IFt7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXj0vLFxuICAgICAgICAgICAgYWxpYXM6ICdhdHRyLWVxdWFscydcbiAgICAgICAgICB9LCAvXCJ8Jy9dXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAncHVuY3R1YXRpb24nOiAvXFwvPz4vLFxuICAgICAgJ2F0dHItbmFtZSc6IHtcbiAgICAgICAgcGF0dGVybjogL1teXFxzPlxcL10rLyxcbiAgICAgICAgaW5zaWRlOiB7XG4gICAgICAgICAgJ25hbWVzcGFjZSc6IC9eW15cXHM+XFwvOl0rOi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgJ2VudGl0eSc6IFt7XG4gICAgcGF0dGVybjogLyZbXFxkYS16XXsxLDh9Oy9pLFxuICAgIGFsaWFzOiAnbmFtZWQtZW50aXR5J1xuICB9LCAvJiN4P1tcXGRhLWZdezEsOH07L2ldXG59O1xuUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cFsndGFnJ10uaW5zaWRlWydhdHRyLXZhbHVlJ10uaW5zaWRlWydlbnRpdHknXSA9IFByaXNtLmxhbmd1YWdlcy5tYXJrdXBbJ2VudGl0eSddO1xuUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cFsnZG9jdHlwZSddLmluc2lkZVsnaW50ZXJuYWwtc3Vic2V0J10uaW5zaWRlID0gUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cDsgLy8gUGx1Z2luIHRvIG1ha2UgZW50aXR5IHRpdGxlIHNob3cgdGhlIHJlYWwgZW50aXR5LCBpZGVhIGJ5IFJvbWFuIEtvbWFyb3ZcblxuUHJpc20uaG9va3MuYWRkKCd3cmFwJywgZnVuY3Rpb24gKGVudikge1xuICBpZiAoZW52LnR5cGUgPT09ICdlbnRpdHknKSB7XG4gICAgZW52LmF0dHJpYnV0ZXNbJ3RpdGxlJ10gPSBlbnYuY29udGVudC5yZXBsYWNlKC8mYW1wOy8sICcmJyk7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFByaXNtLmxhbmd1YWdlcy5tYXJrdXAudGFnLCAnYWRkSW5saW5lZCcsIHtcbiAgLyoqXG4gICAqIEFkZHMgYW4gaW5saW5lZCBsYW5ndWFnZSB0byBtYXJrdXAuXG4gICAqXG4gICAqIEFuIGV4YW1wbGUgb2YgYW4gaW5saW5lZCBsYW5ndWFnZSBpcyBDU1Mgd2l0aCBgPHN0eWxlPmAgdGFncy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIHRhZyB0aGF0IGNvbnRhaW5zIHRoZSBpbmxpbmVkIGxhbmd1YWdlLiBUaGlzIG5hbWUgd2lsbCBiZSB0cmVhdGVkIGFzXG4gICAqIGNhc2UgaW5zZW5zaXRpdmUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5nIFRoZSBsYW5ndWFnZSBrZXkuXG4gICAqIEBleGFtcGxlXG4gICAqIGFkZElubGluZWQoJ3N0eWxlJywgJ2NzcycpO1xuICAgKi9cbiAgdmFsdWU6IGZ1bmN0aW9uIGFkZElubGluZWQodGFnTmFtZSwgbGFuZykge1xuICAgIHZhciBpbmNsdWRlZENkYXRhSW5zaWRlID0ge307XG4gICAgaW5jbHVkZWRDZGF0YUluc2lkZVsnbGFuZ3VhZ2UtJyArIGxhbmddID0ge1xuICAgICAgcGF0dGVybjogLyhePCFcXFtDREFUQVxcWylbXFxzXFxTXSs/KD89XFxdXFxdPiQpL2ksXG4gICAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgICAgaW5zaWRlOiBQcmlzbS5sYW5ndWFnZXNbbGFuZ11cbiAgICB9O1xuICAgIGluY2x1ZGVkQ2RhdGFJbnNpZGVbJ2NkYXRhJ10gPSAvXjwhXFxbQ0RBVEFcXFt8XFxdXFxdPiQvaTtcbiAgICB2YXIgaW5zaWRlID0ge1xuICAgICAgJ2luY2x1ZGVkLWNkYXRhJzoge1xuICAgICAgICBwYXR0ZXJuOiAvPCFcXFtDREFUQVxcW1tcXHNcXFNdKj9cXF1cXF0+L2ksXG4gICAgICAgIGluc2lkZTogaW5jbHVkZWRDZGF0YUluc2lkZVxuICAgICAgfVxuICAgIH07XG4gICAgaW5zaWRlWydsYW5ndWFnZS0nICsgbGFuZ10gPSB7XG4gICAgICBwYXR0ZXJuOiAvW1xcc1xcU10rLyxcbiAgICAgIGluc2lkZTogUHJpc20ubGFuZ3VhZ2VzW2xhbmddXG4gICAgfTtcbiAgICB2YXIgZGVmID0ge307XG4gICAgZGVmW3RhZ05hbWVdID0ge1xuICAgICAgcGF0dGVybjogUmVnRXhwKC8oPF9fW1xcc1xcU10qPz4pKD86PCFcXFtDREFUQVxcWyg/OlteXFxdXXxcXF0oPyFcXF0+KSkqXFxdXFxdPnwoPyE8IVxcW0NEQVRBXFxbKVtcXHNcXFNdKSo/KD89PFxcL19fPikvLnNvdXJjZS5yZXBsYWNlKC9fXy9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0YWdOYW1lO1xuICAgICAgfSksICdpJyksXG4gICAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgICAgZ3JlZWR5OiB0cnVlLFxuICAgICAgaW5zaWRlOiBpbnNpZGVcbiAgICB9O1xuICAgIFByaXNtLmxhbmd1YWdlcy5pbnNlcnRCZWZvcmUoJ21hcmt1cCcsICdjZGF0YScsIGRlZik7XG4gIH1cbn0pO1xuUHJpc20ubGFuZ3VhZ2VzLmh0bWwgPSBQcmlzbS5sYW5ndWFnZXMubWFya3VwO1xuUHJpc20ubGFuZ3VhZ2VzLm1hdGhtbCA9IFByaXNtLmxhbmd1YWdlcy5tYXJrdXA7XG5QcmlzbS5sYW5ndWFnZXMuc3ZnID0gUHJpc20ubGFuZ3VhZ2VzLm1hcmt1cDtcblByaXNtLmxhbmd1YWdlcy54bWwgPSBQcmlzbS5sYW5ndWFnZXMuZXh0ZW5kKCdtYXJrdXAnLCB7fSk7XG5QcmlzbS5sYW5ndWFnZXMuc3NtbCA9IFByaXNtLmxhbmd1YWdlcy54bWw7XG5QcmlzbS5sYW5ndWFnZXMuYXRvbSA9IFByaXNtLmxhbmd1YWdlcy54bWw7XG5QcmlzbS5sYW5ndWFnZXMucnNzID0gUHJpc20ubGFuZ3VhZ2VzLnhtbDtcbi8qICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgQmVnaW4gcHJpc20tY3NzLmpzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cbihmdW5jdGlvbiAoUHJpc20pIHtcbiAgdmFyIHN0cmluZyA9IC8oXCJ8JykoPzpcXFxcKD86XFxyXFxufFtcXHNcXFNdKXwoPyFcXDEpW15cXFxcXFxyXFxuXSkqXFwxLztcbiAgUHJpc20ubGFuZ3VhZ2VzLmNzcyA9IHtcbiAgICAnY29tbWVudCc6IC9cXC9cXCpbXFxzXFxTXSo/XFwqXFwvLyxcbiAgICAnYXRydWxlJzoge1xuICAgICAgcGF0dGVybjogL0BbXFx3LV0rW1xcc1xcU10qPyg/Ojt8KD89XFxzKlxceykpLyxcbiAgICAgIGluc2lkZToge1xuICAgICAgICAncnVsZSc6IC9eQFtcXHctXSsvLFxuICAgICAgICAnc2VsZWN0b3ItZnVuY3Rpb24tYXJndW1lbnQnOiB7XG4gICAgICAgICAgcGF0dGVybjogLyhcXGJzZWxlY3RvclxccypcXCgoPyFcXHMqXFwpKVxccyopKD86W14oKV18XFwoKD86W14oKV18XFwoW14oKV0qXFwpKSpcXCkpKz8oPz1cXHMqXFwpKS8sXG4gICAgICAgICAgbG9va2JlaGluZDogdHJ1ZSxcbiAgICAgICAgICBhbGlhczogJ3NlbGVjdG9yJ1xuICAgICAgICB9LFxuICAgICAgICAna2V5d29yZCc6IHtcbiAgICAgICAgICBwYXR0ZXJuOiAvKF58W15cXHctXSkoPzphbmR8bm90fG9ubHl8b3IpKD8hW1xcdy1dKS8sXG4gICAgICAgICAgbG9va2JlaGluZDogdHJ1ZVxuICAgICAgICB9IC8vIFNlZSByZXN0IGJlbG93XG5cbiAgICAgIH1cbiAgICB9LFxuICAgICd1cmwnOiB7XG4gICAgICAvLyBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLXZhbHVlcy0zLyN1cmxzXG4gICAgICBwYXR0ZXJuOiBSZWdFeHAoJ1xcXFxidXJsXFxcXCgoPzonICsgc3RyaW5nLnNvdXJjZSArICd8JyArIC8oPzpbXlxcXFxcXHJcXG4oKVwiJ118XFxcXFtcXHNcXFNdKSovLnNvdXJjZSArICcpXFxcXCknLCAnaScpLFxuICAgICAgZ3JlZWR5OiB0cnVlLFxuICAgICAgaW5zaWRlOiB7XG4gICAgICAgICdmdW5jdGlvbic6IC9edXJsL2ksXG4gICAgICAgICdwdW5jdHVhdGlvbic6IC9eXFwofFxcKSQvLFxuICAgICAgICAnc3RyaW5nJzoge1xuICAgICAgICAgIHBhdHRlcm46IFJlZ0V4cCgnXicgKyBzdHJpbmcuc291cmNlICsgJyQnKSxcbiAgICAgICAgICBhbGlhczogJ3VybCdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJ3NlbGVjdG9yJzogUmVnRXhwKCdbXnt9XFxcXHNdKD86W157fTtcIlxcJ118JyArIHN0cmluZy5zb3VyY2UgKyAnKSo/KD89XFxcXHMqXFxcXHspJyksXG4gICAgJ3N0cmluZyc6IHtcbiAgICAgIHBhdHRlcm46IHN0cmluZyxcbiAgICAgIGdyZWVkeTogdHJ1ZVxuICAgIH0sXG4gICAgJ3Byb3BlcnR5JzogL1stX2EtelxceEEwLVxcdUZGRkZdWy1cXHdcXHhBMC1cXHVGRkZGXSooPz1cXHMqOikvaSxcbiAgICAnaW1wb3J0YW50JzogLyFpbXBvcnRhbnRcXGIvaSxcbiAgICAnZnVuY3Rpb24nOiAvWy1hLXowLTldKyg/PVxcKCkvaSxcbiAgICAncHVuY3R1YXRpb24nOiAvWygpe307OixdL1xuICB9O1xuICBQcmlzbS5sYW5ndWFnZXMuY3NzWydhdHJ1bGUnXS5pbnNpZGUucmVzdCA9IFByaXNtLmxhbmd1YWdlcy5jc3M7XG4gIHZhciBtYXJrdXAgPSBQcmlzbS5sYW5ndWFnZXMubWFya3VwO1xuXG4gIGlmIChtYXJrdXApIHtcbiAgICBtYXJrdXAudGFnLmFkZElubGluZWQoJ3N0eWxlJywgJ2NzcycpO1xuICAgIFByaXNtLmxhbmd1YWdlcy5pbnNlcnRCZWZvcmUoJ2luc2lkZScsICdhdHRyLXZhbHVlJywge1xuICAgICAgJ3N0eWxlLWF0dHInOiB7XG4gICAgICAgIHBhdHRlcm46IC9cXHMqc3R5bGU9KFwifCcpKD86XFxcXFtcXHNcXFNdfCg/IVxcMSlbXlxcXFxdKSpcXDEvaSxcbiAgICAgICAgaW5zaWRlOiB7XG4gICAgICAgICAgJ2F0dHItbmFtZSc6IHtcbiAgICAgICAgICAgIHBhdHRlcm46IC9eXFxzKnN0eWxlL2ksXG4gICAgICAgICAgICBpbnNpZGU6IG1hcmt1cC50YWcuaW5zaWRlXG4gICAgICAgICAgfSxcbiAgICAgICAgICAncHVuY3R1YXRpb24nOiAvXlxccyo9XFxzKlsnXCJdfFsnXCJdXFxzKiQvLFxuICAgICAgICAgICdhdHRyLXZhbHVlJzoge1xuICAgICAgICAgICAgcGF0dGVybjogLy4rL2ksXG4gICAgICAgICAgICBpbnNpZGU6IFByaXNtLmxhbmd1YWdlcy5jc3NcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFsaWFzOiAnbGFuZ3VhZ2UtY3NzJ1xuICAgICAgfVxuICAgIH0sIG1hcmt1cC50YWcpO1xuICB9XG59KShQcmlzbSk7XG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgIEJlZ2luIHByaXNtLWNsaWtlLmpzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cblxuUHJpc20ubGFuZ3VhZ2VzLmNsaWtlID0ge1xuICAnY29tbWVudCc6IFt7XG4gICAgcGF0dGVybjogLyhefFteXFxcXF0pXFwvXFwqW1xcc1xcU10qPyg/OlxcKlxcL3wkKS8sXG4gICAgbG9va2JlaGluZDogdHJ1ZVxuICB9LCB7XG4gICAgcGF0dGVybjogLyhefFteXFxcXDpdKVxcL1xcLy4qLyxcbiAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgIGdyZWVkeTogdHJ1ZVxuICB9XSxcbiAgJ3N0cmluZyc6IHtcbiAgICBwYXR0ZXJuOiAvKFtcIiddKSg/OlxcXFwoPzpcXHJcXG58W1xcc1xcU10pfCg/IVxcMSlbXlxcXFxcXHJcXG5dKSpcXDEvLFxuICAgIGdyZWVkeTogdHJ1ZVxuICB9LFxuICAnY2xhc3MtbmFtZSc6IHtcbiAgICBwYXR0ZXJuOiAvKFxcYig/OmNsYXNzfGludGVyZmFjZXxleHRlbmRzfGltcGxlbWVudHN8dHJhaXR8aW5zdGFuY2VvZnxuZXcpXFxzK3xcXGJjYXRjaFxccytcXCgpW1xcdy5cXFxcXSsvaSxcbiAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgIGluc2lkZToge1xuICAgICAgJ3B1bmN0dWF0aW9uJzogL1suXFxcXF0vXG4gICAgfVxuICB9LFxuICAna2V5d29yZCc6IC9cXGIoPzppZnxlbHNlfHdoaWxlfGRvfGZvcnxyZXR1cm58aW58aW5zdGFuY2VvZnxmdW5jdGlvbnxuZXd8dHJ5fHRocm93fGNhdGNofGZpbmFsbHl8bnVsbHxicmVha3xjb250aW51ZSlcXGIvLFxuICAnYm9vbGVhbic6IC9cXGIoPzp0cnVlfGZhbHNlKVxcYi8sXG4gICdmdW5jdGlvbic6IC9cXHcrKD89XFwoKS8sXG4gICdudW1iZXInOiAvXFxiMHhbXFxkYS1mXStcXGJ8KD86XFxiXFxkK1xcLj9cXGQqfFxcQlxcLlxcZCspKD86ZVsrLV0/XFxkKyk/L2ksXG4gICdvcGVyYXRvcic6IC9bPD5dPT98WyE9XT0/PT98LS0/fFxcK1xcKz98JiY/fFxcfFxcfD98Wz8qL35eJV0vLFxuICAncHVuY3R1YXRpb24nOiAvW3t9W1xcXTsoKSwuOl0vXG59O1xuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICBCZWdpbiBwcmlzbS1qYXZhc2NyaXB0LmpzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cblByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0ID0gUHJpc20ubGFuZ3VhZ2VzLmV4dGVuZCgnY2xpa2UnLCB7XG4gICdjbGFzcy1uYW1lJzogW1ByaXNtLmxhbmd1YWdlcy5jbGlrZVsnY2xhc3MtbmFtZSddLCB7XG4gICAgcGF0dGVybjogLyhefFteJFxcd1xceEEwLVxcdUZGRkZdKVtfJEEtWlxceEEwLVxcdUZGRkZdWyRcXHdcXHhBMC1cXHVGRkZGXSooPz1cXC4oPzpwcm90b3R5cGV8Y29uc3RydWN0b3IpKS8sXG4gICAgbG9va2JlaGluZDogdHJ1ZVxuICB9XSxcbiAgJ2tleXdvcmQnOiBbe1xuICAgIHBhdHRlcm46IC8oKD86Xnx9KVxccyopKD86Y2F0Y2h8ZmluYWxseSlcXGIvLFxuICAgIGxvb2tiZWhpbmQ6IHRydWVcbiAgfSwge1xuICAgIHBhdHRlcm46IC8oXnxbXi5dfFxcLlxcLlxcLlxccyopXFxiKD86YXN8YXN5bmMoPz1cXHMqKD86ZnVuY3Rpb25cXGJ8XFwofFskXFx3XFx4QTAtXFx1RkZGRl18JCkpfGF3YWl0fGJyZWFrfGNhc2V8Y2xhc3N8Y29uc3R8Y29udGludWV8ZGVidWdnZXJ8ZGVmYXVsdHxkZWxldGV8ZG98ZWxzZXxlbnVtfGV4cG9ydHxleHRlbmRzfGZvcnxmcm9tfGZ1bmN0aW9ufCg/OmdldHxzZXQpKD89XFxzKltcXFskXFx3XFx4QTAtXFx1RkZGRl0pfGlmfGltcGxlbWVudHN8aW1wb3J0fGlufGluc3RhbmNlb2Z8aW50ZXJmYWNlfGxldHxuZXd8bnVsbHxvZnxwYWNrYWdlfHByaXZhdGV8cHJvdGVjdGVkfHB1YmxpY3xyZXR1cm58c3RhdGljfHN1cGVyfHN3aXRjaHx0aGlzfHRocm93fHRyeXx0eXBlb2Z8dW5kZWZpbmVkfHZhcnx2b2lkfHdoaWxlfHdpdGh8eWllbGQpXFxiLyxcbiAgICBsb29rYmVoaW5kOiB0cnVlXG4gIH1dLFxuICAnbnVtYmVyJzogL1xcYig/Oig/OjBbeFhdKD86W1xcZEEtRmEtZl0oPzpfW1xcZEEtRmEtZl0pPykrfDBbYkJdKD86WzAxXSg/Ol9bMDFdKT8pK3wwW29PXSg/OlswLTddKD86X1swLTddKT8pKyluP3woPzpcXGQoPzpfXFxkKT8pK258TmFOfEluZmluaXR5KVxcYnwoPzpcXGIoPzpcXGQoPzpfXFxkKT8pK1xcLj8oPzpcXGQoPzpfXFxkKT8pKnxcXEJcXC4oPzpcXGQoPzpfXFxkKT8pKykoPzpbRWVdWystXT8oPzpcXGQoPzpfXFxkKT8pKyk/LyxcbiAgLy8gQWxsb3cgZm9yIGFsbCBub24tQVNDSUkgY2hhcmFjdGVycyAoU2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIwMDg0NDQpXG4gICdmdW5jdGlvbic6IC8jP1tfJGEtekEtWlxceEEwLVxcdUZGRkZdWyRcXHdcXHhBMC1cXHVGRkZGXSooPz1cXHMqKD86XFwuXFxzKig/OmFwcGx5fGJpbmR8Y2FsbClcXHMqKT9cXCgpLyxcbiAgJ29wZXJhdG9yJzogLy0tfFxcK1xcK3xcXCpcXCo9P3w9PnwmJj0/fFxcfFxcfD0/fFshPV09PXw8PD0/fD4+Pj89P3xbLSsqLyUmfF4hPTw+XT0/fFxcLnszfXxcXD9cXD89P3xcXD9cXC4/fFt+Ol0vXG59KTtcblByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0WydjbGFzcy1uYW1lJ11bMF0ucGF0dGVybiA9IC8oXFxiKD86Y2xhc3N8aW50ZXJmYWNlfGV4dGVuZHN8aW1wbGVtZW50c3xpbnN0YW5jZW9mfG5ldylcXHMrKVtcXHcuXFxcXF0rLztcblByaXNtLmxhbmd1YWdlcy5pbnNlcnRCZWZvcmUoJ2phdmFzY3JpcHQnLCAna2V5d29yZCcsIHtcbiAgJ3JlZ2V4Jzoge1xuICAgIHBhdHRlcm46IC8oKD86XnxbXiRcXHdcXHhBMC1cXHVGRkZGLlwiJ1xcXSlcXHNdfFxcYig/OnJldHVybnx5aWVsZCkpXFxzKilcXC8oPzpcXFsoPzpbXlxcXVxcXFxcXHJcXG5dfFxcXFwuKSpdfFxcXFwufFteL1xcXFxcXFtcXHJcXG5dKStcXC9bZ2lteXVzXXswLDZ9KD89KD86XFxzfFxcL1xcKig/OlteKl18XFwqKD8hXFwvKSkqXFwqXFwvKSooPzokfFtcXHJcXG4sLjs6fSlcXF1dfFxcL1xcLykpLyxcbiAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgIGdyZWVkeTogdHJ1ZVxuICB9LFxuICAvLyBUaGlzIG11c3QgYmUgZGVjbGFyZWQgYmVmb3JlIGtleXdvcmQgYmVjYXVzZSB3ZSB1c2UgXCJmdW5jdGlvblwiIGluc2lkZSB0aGUgbG9vay1mb3J3YXJkXG4gICdmdW5jdGlvbi12YXJpYWJsZSc6IHtcbiAgICBwYXR0ZXJuOiAvIz9bXyRhLXpBLVpcXHhBMC1cXHVGRkZGXVskXFx3XFx4QTAtXFx1RkZGRl0qKD89XFxzKls9Ol1cXHMqKD86YXN5bmNcXHMqKT8oPzpcXGJmdW5jdGlvblxcYnwoPzpcXCgoPzpbXigpXXxcXChbXigpXSpcXCkpKlxcKXxbXyRhLXpBLVpcXHhBMC1cXHVGRkZGXVskXFx3XFx4QTAtXFx1RkZGRl0qKVxccyo9PikpLyxcbiAgICBhbGlhczogJ2Z1bmN0aW9uJ1xuICB9LFxuICAncGFyYW1ldGVyJzogW3tcbiAgICBwYXR0ZXJuOiAvKGZ1bmN0aW9uKD86XFxzK1tfJEEtWmEtelxceEEwLVxcdUZGRkZdWyRcXHdcXHhBMC1cXHVGRkZGXSopP1xccypcXChcXHMqKSg/IVxccykoPzpbXigpXXxcXChbXigpXSpcXCkpKz8oPz1cXHMqXFwpKS8sXG4gICAgbG9va2JlaGluZDogdHJ1ZSxcbiAgICBpbnNpZGU6IFByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0XG4gIH0sIHtcbiAgICBwYXR0ZXJuOiAvW18kYS16XFx4QTAtXFx1RkZGRl1bJFxcd1xceEEwLVxcdUZGRkZdKig/PVxccyo9PikvaSxcbiAgICBpbnNpZGU6IFByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0XG4gIH0sIHtcbiAgICBwYXR0ZXJuOiAvKFxcKFxccyopKD8hXFxzKSg/OlteKCldfFxcKFteKCldKlxcKSkrPyg/PVxccypcXClcXHMqPT4pLyxcbiAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgIGluc2lkZTogUHJpc20ubGFuZ3VhZ2VzLmphdmFzY3JpcHRcbiAgfSwge1xuICAgIHBhdHRlcm46IC8oKD86XFxifFxcc3xeKSg/ISg/OmFzfGFzeW5jfGF3YWl0fGJyZWFrfGNhc2V8Y2F0Y2h8Y2xhc3N8Y29uc3R8Y29udGludWV8ZGVidWdnZXJ8ZGVmYXVsdHxkZWxldGV8ZG98ZWxzZXxlbnVtfGV4cG9ydHxleHRlbmRzfGZpbmFsbHl8Zm9yfGZyb218ZnVuY3Rpb258Z2V0fGlmfGltcGxlbWVudHN8aW1wb3J0fGlufGluc3RhbmNlb2Z8aW50ZXJmYWNlfGxldHxuZXd8bnVsbHxvZnxwYWNrYWdlfHByaXZhdGV8cHJvdGVjdGVkfHB1YmxpY3xyZXR1cm58c2V0fHN0YXRpY3xzdXBlcnxzd2l0Y2h8dGhpc3x0aHJvd3x0cnl8dHlwZW9mfHVuZGVmaW5lZHx2YXJ8dm9pZHx3aGlsZXx3aXRofHlpZWxkKSg/IVskXFx3XFx4QTAtXFx1RkZGRl0pKSg/OltfJEEtWmEtelxceEEwLVxcdUZGRkZdWyRcXHdcXHhBMC1cXHVGRkZGXSpcXHMqKVxcKFxccyp8XFxdXFxzKlxcKFxccyopKD8hXFxzKSg/OlteKCldfFxcKFteKCldKlxcKSkrPyg/PVxccypcXClcXHMqXFx7KS8sXG4gICAgbG9va2JlaGluZDogdHJ1ZSxcbiAgICBpbnNpZGU6IFByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0XG4gIH1dLFxuICAnY29uc3RhbnQnOiAvXFxiW0EtWl0oPzpbQS1aX118XFxkeD8pKlxcYi9cbn0pO1xuUHJpc20ubGFuZ3VhZ2VzLmluc2VydEJlZm9yZSgnamF2YXNjcmlwdCcsICdzdHJpbmcnLCB7XG4gICd0ZW1wbGF0ZS1zdHJpbmcnOiB7XG4gICAgcGF0dGVybjogL2AoPzpcXFxcW1xcc1xcU118XFwkeyg/Oltee31dfHsoPzpbXnt9XXx7W159XSp9KSp9KSt9fCg/IVxcJHspW15cXFxcYF0pKmAvLFxuICAgIGdyZWVkeTogdHJ1ZSxcbiAgICBpbnNpZGU6IHtcbiAgICAgICd0ZW1wbGF0ZS1wdW5jdHVhdGlvbic6IHtcbiAgICAgICAgcGF0dGVybjogL15gfGAkLyxcbiAgICAgICAgYWxpYXM6ICdzdHJpbmcnXG4gICAgICB9LFxuICAgICAgJ2ludGVycG9sYXRpb24nOiB7XG4gICAgICAgIHBhdHRlcm46IC8oKD86XnxbXlxcXFxdKSg/OlxcXFx7Mn0pKilcXCR7KD86W157fV18eyg/Oltee31dfHtbXn1dKn0pKn0pK30vLFxuICAgICAgICBsb29rYmVoaW5kOiB0cnVlLFxuICAgICAgICBpbnNpZGU6IHtcbiAgICAgICAgICAnaW50ZXJwb2xhdGlvbi1wdW5jdHVhdGlvbic6IHtcbiAgICAgICAgICAgIHBhdHRlcm46IC9eXFwke3x9JC8sXG4gICAgICAgICAgICBhbGlhczogJ3B1bmN0dWF0aW9uJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzdDogUHJpc20ubGFuZ3VhZ2VzLmphdmFzY3JpcHRcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdzdHJpbmcnOiAvW1xcc1xcU10rL1xuICAgIH1cbiAgfVxufSk7XG5cbmlmIChQcmlzbS5sYW5ndWFnZXMubWFya3VwKSB7XG4gIFByaXNtLmxhbmd1YWdlcy5tYXJrdXAudGFnLmFkZElubGluZWQoJ3NjcmlwdCcsICdqYXZhc2NyaXB0Jyk7XG59XG5cblByaXNtLmxhbmd1YWdlcy5qcyA9IFByaXNtLmxhbmd1YWdlcy5qYXZhc2NyaXB0O1xuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICBCZWdpbiBwcmlzbS1maWxlLWhpZ2hsaWdodC5qc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIHNlbGYgPT09ICd1bmRlZmluZWQnIHx8ICFzZWxmLlByaXNtIHx8ICFzZWxmLmRvY3VtZW50KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIFByaXNtID0gd2luZG93LlByaXNtO1xuICB2YXIgTE9BRElOR19NRVNTQUdFID0gJ0xvYWRpbmfigKYnO1xuXG4gIHZhciBGQUlMVVJFX01FU1NBR0UgPSBmdW5jdGlvbiBGQUlMVVJFX01FU1NBR0Uoc3RhdHVzLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuICfinJYgRXJyb3IgJyArIHN0YXR1cyArICcgd2hpbGUgZmV0Y2hpbmcgZmlsZTogJyArIG1lc3NhZ2U7XG4gIH07XG5cbiAgdmFyIEZBSUxVUkVfRU1QVFlfTUVTU0FHRSA9ICfinJYgRXJyb3I6IEZpbGUgZG9lcyBub3QgZXhpc3Qgb3IgaXMgZW1wdHknO1xuICB2YXIgRVhURU5TSU9OUyA9IHtcbiAgICAnanMnOiAnamF2YXNjcmlwdCcsXG4gICAgJ3B5JzogJ3B5dGhvbicsXG4gICAgJ3JiJzogJ3J1YnknLFxuICAgICdwczEnOiAncG93ZXJzaGVsbCcsXG4gICAgJ3BzbTEnOiAncG93ZXJzaGVsbCcsXG4gICAgJ3NoJzogJ2Jhc2gnLFxuICAgICdiYXQnOiAnYmF0Y2gnLFxuICAgICdoJzogJ2MnLFxuICAgICd0ZXgnOiAnbGF0ZXgnXG4gIH07XG4gIHZhciBTVEFUVVNfQVRUUiA9ICdkYXRhLXNyYy1zdGF0dXMnO1xuICB2YXIgU1RBVFVTX0xPQURJTkcgPSAnbG9hZGluZyc7XG4gIHZhciBTVEFUVVNfTE9BREVEID0gJ2xvYWRlZCc7XG4gIHZhciBTVEFUVVNfRkFJTEVEID0gJ2ZhaWxlZCc7XG4gIHZhciBTRUxFQ1RPUiA9ICdwcmVbZGF0YS1zcmNdOm5vdChbJyArIFNUQVRVU19BVFRSICsgJz1cIicgKyBTVEFUVVNfTE9BREVEICsgJ1wiXSknICsgJzpub3QoWycgKyBTVEFUVVNfQVRUUiArICc9XCInICsgU1RBVFVTX0xPQURJTkcgKyAnXCJdKSc7XG4gIHZhciBsYW5nID0gL1xcYmxhbmcoPzp1YWdlKT8tKFtcXHctXSspXFxiL2k7XG4gIC8qKlxuICAgKiBTZXRzIHRoZSBQcmlzbSBgbGFuZ3VhZ2UteHh4eGAgb3IgYGxhbmcteHh4eGAgY2xhc3MgdG8gdGhlIGdpdmVuIGxhbmd1YWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gc2V0TGFuZ3VhZ2VDbGFzcyhlbGVtZW50LCBsYW5ndWFnZSkge1xuICAgIHZhciBjbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZTtcbiAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUucmVwbGFjZShsYW5nLCAnICcpICsgJyBsYW5ndWFnZS0nICsgbGFuZ3VhZ2U7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWUucmVwbGFjZSgvXFxzKy9nLCAnICcpLnRyaW0oKTtcbiAgfVxuXG4gIFByaXNtLmhvb2tzLmFkZCgnYmVmb3JlLWhpZ2hsaWdodGFsbCcsIGZ1bmN0aW9uIChlbnYpIHtcbiAgICBlbnYuc2VsZWN0b3IgKz0gJywgJyArIFNFTEVDVE9SO1xuICB9KTtcbiAgUHJpc20uaG9va3MuYWRkKCdiZWZvcmUtc2FuaXR5LWNoZWNrJywgZnVuY3Rpb24gKGVudikge1xuICAgIHZhciBwcmUgPVxuICAgIC8qKiBAdHlwZSB7SFRNTFByZUVsZW1lbnR9ICovXG4gICAgZW52LmVsZW1lbnQ7XG5cbiAgICBpZiAocHJlLm1hdGNoZXMoU0VMRUNUT1IpKSB7XG4gICAgICBlbnYuY29kZSA9ICcnOyAvLyBmYXN0LXBhdGggdGhlIHdob2xlIHRoaW5nIGFuZCBnbyB0byBjb21wbGV0ZVxuXG4gICAgICBwcmUuc2V0QXR0cmlidXRlKFNUQVRVU19BVFRSLCBTVEFUVVNfTE9BRElORyk7IC8vIG1hcmsgYXMgbG9hZGluZ1xuICAgICAgLy8gYWRkIGNvZGUgZWxlbWVudCB3aXRoIGxvYWRpbmcgbWVzc2FnZVxuXG4gICAgICB2YXIgY29kZSA9IHByZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdDT0RFJykpO1xuICAgICAgY29kZS50ZXh0Q29udGVudCA9IExPQURJTkdfTUVTU0FHRTtcbiAgICAgIHZhciBzcmMgPSBwcmUuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgICAgdmFyIGxhbmd1YWdlID0gZW52Lmxhbmd1YWdlO1xuXG4gICAgICBpZiAobGFuZ3VhZ2UgPT09ICdub25lJykge1xuICAgICAgICAvLyB0aGUgbGFuZ3VhZ2UgbWlnaHQgYmUgJ25vbmUnIGJlY2F1c2UgdGhlcmUgaXMgbm8gbGFuZ3VhZ2Ugc2V0O1xuICAgICAgICAvLyBpbiB0aGlzIGNhc2UsIHdlIHdhbnQgdG8gdXNlIHRoZSBleHRlbnNpb24gYXMgdGhlIGxhbmd1YWdlXG4gICAgICAgIHZhciBleHRlbnNpb24gPSAoL1xcLihcXHcrKSQvLmV4ZWMoc3JjKSB8fCBbLCAnbm9uZSddKVsxXTtcbiAgICAgICAgbGFuZ3VhZ2UgPSBFWFRFTlNJT05TW2V4dGVuc2lvbl0gfHwgZXh0ZW5zaW9uO1xuICAgICAgfSAvLyBzZXQgbGFuZ3VhZ2UgY2xhc3Nlc1xuXG5cbiAgICAgIHNldExhbmd1YWdlQ2xhc3MoY29kZSwgbGFuZ3VhZ2UpO1xuICAgICAgc2V0TGFuZ3VhZ2VDbGFzcyhwcmUsIGxhbmd1YWdlKTsgLy8gcHJlbG9hZCB0aGUgbGFuZ3VhZ2VcblxuICAgICAgdmFyIGF1dG9sb2FkZXIgPSBQcmlzbS5wbHVnaW5zLmF1dG9sb2FkZXI7XG5cbiAgICAgIGlmIChhdXRvbG9hZGVyKSB7XG4gICAgICAgIGF1dG9sb2FkZXIubG9hZExhbmd1YWdlcyhsYW5ndWFnZSk7XG4gICAgICB9IC8vIGxvYWQgZmlsZVxuXG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKCdHRVQnLCBzcmMsIHRydWUpO1xuXG4gICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNCkge1xuICAgICAgICAgIGlmICh4aHIuc3RhdHVzIDwgNDAwICYmIHhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgICAgIC8vIG1hcmsgYXMgbG9hZGVkXG4gICAgICAgICAgICBwcmUuc2V0QXR0cmlidXRlKFNUQVRVU19BVFRSLCBTVEFUVVNfTE9BREVEKTsgLy8gaGlnaGxpZ2h0IGNvZGVcblxuICAgICAgICAgICAgY29kZS50ZXh0Q29udGVudCA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICBQcmlzbS5oaWdobGlnaHRFbGVtZW50KGNvZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtYXJrIGFzIGZhaWxlZFxuICAgICAgICAgICAgcHJlLnNldEF0dHJpYnV0ZShTVEFUVVNfQVRUUiwgU1RBVFVTX0ZBSUxFRCk7XG5cbiAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgICBjb2RlLnRleHRDb250ZW50ID0gRkFJTFVSRV9NRVNTQUdFKHhoci5zdGF0dXMsIHhoci5zdGF0dXNUZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvZGUudGV4dENvbnRlbnQgPSBGQUlMVVJFX0VNUFRZX01FU1NBR0U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB4aHIuc2VuZChudWxsKTtcbiAgICB9XG4gIH0pO1xuICBQcmlzbS5wbHVnaW5zLmZpbGVIaWdobGlnaHQgPSB7XG4gICAgLyoqXG4gICAgICogRXhlY3V0ZXMgdGhlIEZpbGUgSGlnaGxpZ2h0IHBsdWdpbiBmb3IgYWxsIG1hdGNoaW5nIGBwcmVgIGVsZW1lbnRzIHVuZGVyIHRoZSBnaXZlbiBjb250YWluZXIuXG4gICAgICpcbiAgICAgKiBOb3RlOiBFbGVtZW50cyB3aGljaCBhcmUgYWxyZWFkeSBsb2FkZWQgb3IgY3VycmVudGx5IGxvYWRpbmcgd2lsbCBub3QgYmUgdG91Y2hlZCBieSB0aGlzIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UGFyZW50Tm9kZX0gW2NvbnRhaW5lcj1kb2N1bWVudF1cbiAgICAgKi9cbiAgICBoaWdobGlnaHQ6IGZ1bmN0aW9uIGhpZ2hsaWdodChjb250YWluZXIpIHtcbiAgICAgIHZhciBlbGVtZW50cyA9IChjb250YWluZXIgfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3JBbGwoU0VMRUNUT1IpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgZWxlbWVudDsgZWxlbWVudCA9IGVsZW1lbnRzW2krK107KSB7XG4gICAgICAgIFByaXNtLmhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB2YXIgbG9nZ2VkID0gZmFsc2U7XG4gIC8qKiBAZGVwcmVjYXRlZCBVc2UgYFByaXNtLnBsdWdpbnMuZmlsZUhpZ2hsaWdodC5oaWdobGlnaHRgIGluc3RlYWQuICovXG5cbiAgUHJpc20uZmlsZUhpZ2hsaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWxvZ2dlZCkge1xuICAgICAgY29uc29sZS53YXJuKCdQcmlzbS5maWxlSGlnaGxpZ2h0IGlzIGRlcHJlY2F0ZWQuIFVzZSBgUHJpc20ucGx1Z2lucy5maWxlSGlnaGxpZ2h0LmhpZ2hsaWdodGAgaW5zdGVhZC4nKTtcbiAgICAgIGxvZ2dlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgUHJpc20ucGx1Z2lucy5maWxlSGlnaGxpZ2h0LmhpZ2hsaWdodC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufSkoKTsiXX0=
