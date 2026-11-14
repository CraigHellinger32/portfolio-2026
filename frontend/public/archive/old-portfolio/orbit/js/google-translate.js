//  Initiate Google Translate
// ========================================================
function googleTranslateElementInit() {
    var $siteHeader = $(site.header);
    var $siteFooter = $(site.footer);

    var $googleTranslateWrapper = $siteHeader.add($siteFooter).find('#google_translate_element');

    if (!$googleTranslateWrapper.length) {
        return;
    }

    var trackingCode = $googleTranslateWrapper.attr('data-google-analytics-id');
    var $googleTranslateBanner = $('.goog-te-banner');

    if (trackingCode.length) {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            gaTrack: true,
            gaId: trackingCode
        }, 'google_translate_element');
    } else {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
        }, 'google_translate_element');
    }

    $googleTranslateWrapper.find('.goog-logo-link').remove();

    // Fix Wave Toolbar errors
    $googleTranslateWrapper.find('.goog-te-combo').attr('id', 'goog-te-combo');
    $googleTranslateWrapper.find('.goog-te-gadget').prepend('<label class="visually-hidden" for="goog-te-combo">Translate this website into different languages using Google Translate</label>');
    $googleTranslateBanner.find('.goog-logo-link').find('img').attr('alt', 'Google Logo');

    var $googleSkipTranslate = $('#goog-gt-tt');
    $googleSkipTranslate.find('.logo').find('img').attr('alt', 'Google Logo');
    $googleSkipTranslate.find('.title').remove();

    $googleTranslateWrapper.bind('DOMNodeInserted', function(event) {
        var buttonText = $googleTranslateWrapper.attr('data-button-text');

        if (buttonText && buttonText.length) {
            $googleTranslateWrapper.find('.goog-te-menu-value span:first, .goog-te-combo option:first-child').html(buttonText);
        }

        $googleTranslateWrapper.removeClass('google-translate--loading');
    });
}
