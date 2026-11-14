//  Isotope layout using data attribute
//  https://isotope.metafizzy.co/
// ==================================

(function() {
    'use strict';

    $('[data-enable-masonry]').each(function(){
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
            $this.imagesLoaded().progress(function() {
                $this.isotope('layout');
            });
        }
    });
})();
