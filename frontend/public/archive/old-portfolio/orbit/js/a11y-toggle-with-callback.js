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
var initA11yToggle = function() {};

(function () {
  'use strict';

  var internalId = 0;
  var togglesMap = {};
  var targetsMap = {};

  function $ (selector, context) {
      return Array.prototype.slice.call(
          (context || document).querySelectorAll(selector)
      );
  }

  function getClosestToggle (element) {
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

  function handleToggle (toggle) {
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

  initA11yToggle = function (context) {
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
          toggleInit.initEvent('a11y-toggle:'+toggle.getAttribute('data-a11y-callback'), true, true);
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
})();
