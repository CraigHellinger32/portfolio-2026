(function() {
    // a11y-toggle connected toggle functions
    // ======================================

    function collapse (toggle) {
      var id = toggle.getAttribute('data-a11y-toggle');
      var collapsibleBox = document.getElementById(id);
      collapsibleBox.setAttribute('aria-hidden', true);
      toggle.setAttribute('aria-expanded', false);
    };

    function getToggleFromTarget (element) {
        while(!element.hasAttribute('data-a11y-toggle')) {
            element = element.parentNode;
        }

        return element;
    };

    function collapseAll (event) {
      groupedToggles
        .filter(function (toggle) {

          return toggle !== getToggleFromTarget(event.target);
        })
        .forEach(collapse);
    };

    var groupedToggles = Array.prototype.slice.call(
        document.querySelectorAll('.connected-toggles [data-a11y-toggle]')
    );

    groupedToggles.forEach(function (toggle) {
      toggle.addEventListener('click', collapseAll);
    });

    $('a[data-a11y-toggle]').on('click', function(event){
        event.preventDefault();
    });
})();
