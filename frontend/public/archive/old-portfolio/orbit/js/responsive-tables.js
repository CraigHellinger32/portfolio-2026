/**
 * Responsive tables
 *
 * Apply responsive class if the table is larger than the container
 * Copy table headings into each data cell, wrap table in a container
 */

var responsiveTables = (function() {
    /**
     * Responsive check
     *
     * Apply responsive class if the table is larger than the container
     */
    var responsiveCheck = debounce(function() {
        $siteMain.find('table:not(.calendar__table):not(.form__matrix)').each(function() {
            var $this = $(this);
            var $tableWrapper = $this.closest('.table-wrapper');
            $tableWrapper.removeClass('responsive');

            if ($tableWrapper.closest('.js-branch-section').length) return;

            if ($tableWrapper.closest('.matrix-wrapper').length) {
                $this.addClass('form__matrix');
                return;
            }

            if ($this.outerWidth() > $tableWrapper.outerWidth()) {
                $tableWrapper.addClass('responsive');
            }
        });
    }, 250);

    /**
     * Amend table markup
     *
     * Copy table headings into each data cell, wrap table in a container
     */
    var tableMarkUp = function() {
        $siteMain.find('table:not(.calendar__table):not(.form__matrix)').each(function() {
            var $table = $(this);
            $table.find('thead th, thead td').each(function(index) {
                var $th = $(this).html().trim();
                var $count = index + 1;
                if (!$th.length || $th == '&nbsp;') return;
                $table.find('tbody td:nth-child(' + $count + '), tbody th:nth-child(' + $count + ')').prepend('<span class="mobile-th">' + $th + '<span class="mobile-th__seperator">:</span> </span>');
            });
            $table.wrap('<div class="table-wrapper"></div>')
        });
    }

    /**
     * Exposes the methods
     */
    return {
        check: responsiveCheck,
        amendMarkUp: tableMarkUp
    }
})();
