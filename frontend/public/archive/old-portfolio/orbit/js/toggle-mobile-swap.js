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
function toggleMobileSwap($elem, $toggle, breakpoint, resize = false) {
    if (!$elem) return;
    if (!$toggle) return;

    breakpoint = (typeof breakpoint === 'undefined') ? breakpoints.mobile : breakpoint;

    jQuery.extend(verge);

    if (verge.viewportW() >= breakpoint) {
        $elem.setAttribute('aria-hidden', 'false');
        $elem.setAttribute('data-toggle-mobile-swap', 'above-' + breakpoint);

        [].forEach.call($toggle, function($button){
            $button.setAttribute('aria-expanded', 'true');
        });
    } else {
        if (resize === false) {
            $elem.setAttribute('data-toggle-mobile-swap', 'below-' + breakpoint);
        }

        if ($elem.getAttribute('data-toggle-mobile-swap') === ('above-' + breakpoint)) {
            $elem.setAttribute('aria-hidden', 'true');

            [].forEach.call($toggle, function($button){
                $button.setAttribute('aria-expanded', 'false');
            });

            $elem.setAttribute('data-toggle-mobile-swap', 'below-' + breakpoint);
        }
    }

    return debounce(function() {
        toggleMobileSwap($elem, $toggle, breakpoint, resize);
    }, 100);
};
