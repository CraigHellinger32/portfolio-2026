'use strict';

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
    $(element)
        .closest('.flickity-enabled')
        .flickity('stopPlayer');
}

// Add text to buttons
function flickityPaginationText($el, carouselName) {
    $el.find('.flickity-prev-next-button.next').attr('aria-label', 'Next slide: ' + carouselName).append('<span class="visually-hidden">Next slide: ' + carouselName + '</span>');
    $el.find('.flickity-prev-next-button.previous').attr('aria-label', 'Previous slide: ' + carouselName).append('<span class="visually-hidden">Previous slide: ' + carouselName + '</span>');
    $el.find('.flickity-button-icon').attr({ 'preserveAspectRatio': 'xMinYMid', 'aria-hidden': 'true', 'focusable': 'false' });
}

function wrapFlickityPageDots($currentCarousel, showDots, carouselName, carouselSlideClass, slideTitleClass) {
    if (!showDots || !$currentCarousel.length) return;

    var $pageDots = $currentCarousel.find('.flickity-page-dots'),
        $dots = $pageDots.find('.dot'),
        slideTitleClass = typeof slideTitleClass !== 'undefined' ? slideTitleClass : '.carousel__heading';

    $pageDots.wrap('<div class="flickity-page-dots-wrapper"></div>');
    $dots.removeAttr('aria-label').each(function( index ) {
        var $dot = $(this),
            dotText = 'Slide ' + (index + 1),
            $targetSlideHeading = $currentCarousel.find(carouselSlideClass + ':eq(' + index + ')').find(slideTitleClass).text();

        if ($targetSlideHeading.length) {
            dotText += ': ' + $targetSlideHeading;
        }

        var $newButton = $('<button class="flickity-page-dots__button"><span class="visually-hidden">' + dotText + '</span></button>');

        $dot.append($newButton);

        $newButton.on('click', function( event ) {
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
    $pageDotWrapper.find('.dot.is-selected .flickity-page-dots__button').attr({ 'disabled': '', 'tabindex': -1 });
}

/*
 * If update is false (default), create a new aria-live region for the carousel, or re-use one that is in the markup with the classname .js-aria-live
 * If update is set to true then amend the aria-live message to read "Now viewing slide X of X"
 *
*/
function carouselAriaLive(update = false, $ariaLive, carouselName, carouselId, $currentCarousel, slideCount, flktyStandard) {
    if (!$currentCarousel.length || slideCount < 2 || typeof carouselName === 'undefined' ) return;

    if (!update) {
        // If aria live element is detected in the markup, use that. Otherwise create one.
        if (!$ariaLive.length) {
            $ariaLive = $('<div class="carousel__aria-live js-aria-live" id="slideshow-' + carouselId + '" aria-live="polite" aria-atomic="true" role="status">Now viewing slide <span class="js-aria-live__text">1 of ' + slideCount + '</span>: ' + carouselName + '</div>');
            $currentCarousel.attr('aria-labelledby', 'slideshow-' + carouselId).prepend($ariaLive);
        }

        return $ariaLive;
    }

    if (typeof flktyStandard == 'undefined') return $ariaLive;

    $ariaLive.find('.js-aria-live__text').html((flktyStandard.selectedIndex + 1) + ' of ' + flktyStandard.slides.length);

    return $ariaLive;
}

function carouselInit (carouselClass, carouselSlideClass) {
    var $carousels = $(carouselClass),
        carouselSlideClass = typeof carouselSlideClass !== 'undefined' ? carouselSlideClass : '.slide';

    if (!$carousels.length) return;

    $carousels.each(function(index) {
        var $currentCarousel = $(this),
            carouselId = index + 1,
            slideCount = $currentCarousel.find(carouselSlideClass).length,
            autoPlaySpeed = typeof $currentCarousel.attr('data-carousel-autoplay') !== 'undefined' ? $currentCarousel.attr('data-carousel-autoplay') : false,
            adaptiveHeight = typeof $currentCarousel.attr('data-carousel-adaptive-height') !== 'undefined' ? $currentCarousel.attr('data-carousel-adaptive-height') : false,
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

        $currentCarousel.on('ready.flickity', function() {
            wrapFlickityPageDots($currentCarousel, showDots, carouselName);
            wrapFlickityPrevNextButtons($currentCarousel, showArrows);
            carouselTabbingControl($currentCarousel, 0, carouselSlideClass);
        });

        $currentCarousel.on('select.flickity', function( event, index ) {
            carouselTabbingControl($currentCarousel, index, carouselSlideClass);
            $ariaLive = carouselAriaLive(true, $ariaLive, carouselName, carouselId, $currentCarousel, slideCount, flktyStandard);
        });

        $currentCarousel.flickity({
            accessibility: false,
            adaptiveHeight: adaptiveHeight,
            autoPlay: autoPlaySpeed,
            cellSelector: carouselSlideClass,
            draggable: draggable,
            imagesLoaded: true,
            pageDots: showDots,
            prevNextButtons: showArrows,
            wrapAround: true
        });

        var flktyStandard = $currentCarousel.data('flickity'),
            $flickitySlider = $currentCarousel.find('.flickity-slider'),
            $slideLinks = $currentCarousel.find('a, iframe');

        flickityPaginationText($currentCarousel, carouselName);
    });
};
