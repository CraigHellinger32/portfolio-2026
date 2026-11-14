//  Siteimprove fixes for embedded maps
// ========================================================

function initMaps() {
    // ORBIT-130 - We will no longer try to fix Siteimprove errors on Google Maps
    // https://issuetracker.google.com/issues/69541792
    // Advice for clients to conform with WCAG 2.1 AA standard is to provide text alternatives for the information in the map.
    return;
}

function skipMaps() {
    if (typeof skipEmbeddedMapsForwards !== 'object' || typeof skipEmbeddedMapsBackwards !== 'object') {
        return;
    }

    var $skipMapButtonForwards = $(skipEmbeddedMapsForwards);
    var $skipMapButtonBackwards = $(skipEmbeddedMapsBackwards);
    var $skipMapButtons = $skipMapButtonForwards.add($skipMapButtonBackwards);

    $skipMapButtons.focus(function() {
        $(this).removeClass('visually-hidden');
    });

    $skipMapButtons.blur(function() {
        $(this).addClass('visually-hidden');
    });

    $skipMapButtons.on('click', function(event) {
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
}
