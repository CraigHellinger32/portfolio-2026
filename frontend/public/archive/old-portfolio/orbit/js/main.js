'use strict';

(function($) {

    // On document ready...
    document.addEventListener("DOMContentLoaded", function() {
        setSiteMinHeight();
        initA11yToggle();
        navigation.toggle(menu);
        navigation.toggle(pagesIn);

        if (search.toggle !== undefined) {
            search.toggle.addEventListener('click', function() {
                navigation.searchToggle();
            });
        }

        toggleMobileSwap(pagesIn.navigation, pagesIn.toggle, breakpoints.tablet);

        responsiveTables.amendMarkUp();
        responsiveTables.check();

        // temporary scroller for matrix table
        $('.form__matrix, .matrix-wrapper .table').each(function() {
            var table = $(this);

            $(this).wrap('<div class="table-wrapper-matrix"></div>').wrap('<div class="scroller"></div>');

            if (table.outerWidth() > table.parent().parent().outerWidth()) {
                table.parent().parent().addClass('has-scroll');
            }

            $(window).on('resize orientationchange', function() {
                if (table.outerWidth() > table.parent().parent().outerWidth()) {
                    table.parent().parent().addClass('has-scroll');
                }
                else {
                    table.parent().parent().removeClass('has-scroll');
                }
            });
        });

        //  Re-focus to the last link in the menu on back-tab
        //  Close menu when esc key is pressed
        // ========================================================
        var $navigation             = $(menu.navigation);
        var $menuClose              = $(menu.toggle);
        var $navigationLinks        = $navigation.find('a');
        var $navigationLastLink     = $navigationLinks.last();
        var $searchClose            = $(search.toggle);
        var $searchNav              = $(search.navigation);
        var $searchBtn              = $searchNav.find('.form__append-group .button');
        var $searchInput            = $searchNav.find('.form__append-group .form__field');

        $body.on('keydown', function(event) {
            if ($menuClose.attr('aria-expanded') == 'true') {
                if (event.keyCode === 9 && $menuClose.is(':focus')) {
                    if (event.shiftKey) {
                        event.preventDefault();
                        $navigationLastLink.focus();
                    }
                }

                if (event.keyCode === 27) {
                    $menuClose.attr('aria-expanded', 'false');
                    $navigation.attr('aria-hidden', 'true');
                    $menuClose.focus();

                    setTimeout(function() {
                        $navigation.removeClass('is-open');
                    }, 200);
                }
            }

            if ($searchClose.attr('aria-expanded') == 'true') {
                if (event.keyCode === 9 && $searchClose.is(':focus')) {
                    if (event.shiftKey) {
                        event.preventDefault();
                        $searchBtn.focus();
                    }
                }

                if (event.keyCode === 9 && $searchInput.is(':focus')) {
                    if (event.shiftKey) {
                        event.preventDefault();
                        $searchClose.focus();
                    }
                }

                if (event.keyCode === 27) {
                    $searchNav.removeClass('is-active');
                    $searchNav.attr('aria-hidden', 'true');
                    $searchClose.attr('aria-expanded', 'false');
                    $body.css('transform', '');
                    $searchClose.focus();

                    setTimeout(function() {
                        $searchNav.removeClass('is-open');
                        $body.removeClass('search-is-open');
                    }, 200);
                }
            }
        });
    });


    // On window load...
    window.addEventListener('load', function() {
        carouselInit('.js-carousel');
        skipMaps();
        dateInputPolyfillSiteimproveFixes();
    });


    // On window resize...
    window.addEventListener('resize', function() {
        if (verge.viewportW() == viewports.width) return;

        viewports.height = verge.viewportH();
        viewports.width = verge.viewportW();

        setSiteMinHeight();
        toggleMobileSwap(pagesIn.navigation, pagesIn.toggle, breakpoints.tablet, true);
        responsiveTables.check();
    });

    /**
     * On orientation change
     */
    window.addEventListener('orientationchange', function() {
        responsiveTables.check();
    });

})(jQuery);
