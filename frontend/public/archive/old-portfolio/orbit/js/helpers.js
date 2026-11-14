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
};


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
};

/**
 * Set a min-height on pages with minimal content
 *
 * 100vh doesn't account for the browser controls on some devices.
 * So we need to measure min-height using javascript.
 *
 */
const setSiteMinHeight = debounce(function() {
    let $site = $(site.site),
        $siteHeight = $site.innerHeight(),
        newMinHeight = 'calc(100vh - ' + ($siteHeight - viewports.height) + 'px)';

    if (viewports.height === $siteHeight) return;

    $site.css({'min-height': newMinHeight});

    // After the calculation has been made, remove the inline calc style IF the site content is still larger than the viewport.
    $siteHeight = $site.innerHeight();

    if ($siteHeight > viewports.height) {
        $site.css({'min-height': ''});
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
function scrollLock(lockingScroll = true) {

    if (!$(site.site).length) return;

    if (lockingScroll == true) {

        $(site.site).css('top', -$(window).scrollTop());
        $html.attr('data-scroll-lock', 'true')

    } else {

        if (!$html.attr('data-scroll-lock').length) return;

        var resetScroll = parseInt($(site.site).css('top')) * -1;

        $html.removeAttr('data-scroll-lock');
        $(site.site).css('top', 'auto');
        $('html, body').animate({
            scrollTop: resetScroll
        }, 0);

    }
};


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
(function() {
    $('[data-scroll-to]').on('click', function(event) {
        var $this = $(this),
            targetData = $this.attr('data-scroll-to'),
            $target = $(targetData);

        if ($target.offset() === undefined)
            return;

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
(function() {
    $('[data-focus]').on('focus', function() {
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
(function() {
    $('[data-matchHeight]').each(function(){
        var $this = $(this);
        var matchHeightTarget = $this.attr('data-matchHeight');
        $this.find(matchHeightTarget).matchHeight();
    });

    $('[data-matchHeight-parent]').each(function(){
        var $this = $(this);
        var $matchHeightParent = $this.closest($this.attr('data-matchHeight-parent'));
        var $matchHeightTargetObj = $matchHeightParent.find($this.attr('data-matchHeight-with'));

        if (!$matchHeightTargetObj.length) {
            return;
        }

        $this.add($matchHeightTargetObj).matchHeight();
    });
})();
