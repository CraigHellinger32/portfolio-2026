var navigation = (function() {
    /**
     * Toggle Menu.
     *
     * @param {Object} toggleType - menu / search / pagesIn
     *
     * Refer to globals.js for properties within these objects
     */
    var menuToggle = function(toggleType) {
        /**
         * Looping through toggles in case there are multiple
         * buttons toggling the same content
         */
        [].forEach.call(toggleType.toggle, function(elem){
            elem.addEventListener('click', function() {
                if (toggleType.navigation.getAttribute('aria-hidden') === 'true') {
                    openMenu(toggleType);
                } else {
                    closeMenu(toggleType);
                }
            });
        });
    };

    /**
     * Opens the menu.
     * If Menu is closed, add class
     *
     * @param {Object} toggleType  - passed from 'menuToggle()'
     */
    var openMenu = function(toggleType) {
        // scrollLock(); // Lock scroll

        setTimeout(function() {
            toggleType.navigation.classList.add('is-open');
        }, 5);
    };

    /**
     * Closes the menu.
     * If Menu is open, remove class
     *
     * @param {Object} toggleType  - passed from 'menuToggle()'
     */
    var closeMenu = function(toggleType) {
        // scrollLock(false); // Unlock scroll lock

        setTimeout(function() {
            toggleType.navigation.classList.remove('is-open');
        }, 200);
    };

    /**
     * Close all menus.
     *
     * @param {HTMLElement} elem - The toggle button
     *
     * Argument is passed from forEach in 'menuToggle()'
     */
    var closeAllMenus = function(elem) {
        if (elem.getAttribute('aria-expanded') === 'false') {
            [].forEach.call(headerToggles, function(toggle) {
                var containerClass = toggle.getAttribute('data-a11y-toggle'),
                    container = document.getElementById(containerClass);

                toggle.setAttribute('aria-expanded', 'false');
                container.setAttribute('aria-hidden', 'true');
                container.classList.remove('is-open');
            });
        }
    };

    /**
     * Toggle the search form in header
     */
    var searchToggle = function() {
        search.navigation.classList.toggle('is-active');

        var searchExpanded = search.navigation.classList.contains('is-active');

        if (searchExpanded) {
            setTimeout(function() {
                var searchHeight = search.navigation.offsetHeight;

                site.site.classList.add('search-is-open');
                site.site.style.transform = 'translateY(' + searchHeight + 'px)';
                search.navigation.classList.add('is-open');
            }, 50);
        } else {
            site.site.style.transform = 'translateY(0)';

            setTimeout(function() {
                site.site.classList.remove('search-is-open');
                search.navigation.classList.remove('is-open');
            }, 200);
        }
    }

    /**
     * Exposes the methods
     */
    return {
        toggle: menuToggle,
        searchToggle: searchToggle
    }

})();
