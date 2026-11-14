function dateInputPolyfillSiteimproveFixes() {
    if (!$forms.length || !$body.length) return;

    let $polyfillWrapper = $body.find('date-input-polyfill');

    if (!$polyfillWrapper.length) return;

    let $yearSelect = $polyfillWrapper.find('.yearSelect'),
        $yearSelectWrapper = $yearSelect.closest('.yearSelect-wrapper'),
        $monthSelect = $polyfillWrapper.find('.monthSelect'),
        $monthSelectWrapper = $monthSelect.closest('.monthSelect-wrapper');

    if (typeof $yearSelect !== 'undefined') {
        $yearSelect.attr('id', 'date-input-polyfill-year-select');
        $yearSelectWrapper.prepend('<label class="visually-hidden" for="date-input-polyfill-year-select">Select Year</label>');
    }

    if (typeof $monthSelect !== 'undefined') {
        $monthSelect.attr('id', 'date-input-polyfill-month-select');
        $monthSelectWrapper.prepend('<label class="visually-hidden" for="date-input-polyfill-month-select">Select Month</label>');
    }

    $polyfillWrapper.appendTo($siteMain);
}

(function dateInputFormat() {
    if (Modernizr.inputtypes.date)
        return;

    let dateFormat = 'yyyy-mm-dd',
    $formDateNote = '<span class="form__expected-format"><span class="visually-hidden">Date format: </span><span class="form__valid-format">' + dateFormat + '</span></span>';

    function updateDateFormat() {
        $forms.find('[type="date"]').each(function() {
            let $thisDateField = $(this),
                value = $thisDateField.val(),
                newValue,
                expectedFormatRegEx = /^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/,
                isExpectedFormat = expectedFormatRegEx.test(value);

                if(isExpectedFormat && value !== null) {
                    let date = value.split("/"),
                        day = date[0],
                        month = date[1],
                        year = date[2];
                    newValue = year + '-' + month + '-' + day;
                    $thisDateField.val(newValue);
                }
        });
    }

    $forms.find('[type="date"]').each(function() {
        let $formField = $(this),
            $dateFieldID = $formField.attr('id'),
            $formComponent = $formField.closest('.form__component', '.form__control'),
            $formHelp = $formComponent.find('.form__help');

        // Set date format for polyfill to human readable
        $formField.attr({
            'aria-describedby': 'help_text_' + $dateFieldID
        });

        $formField.on('change', function() {
            updateDateFormat();
        });

        if ($formComponent.find('.form__expected-format').length || $formHelp.text().toLowerCase().indexOf(dateFormat) !== -1) {
            return;
        }

        if ($formHelp.length) {
            let $formatInnerWrapper = '<span class="form__expected-format-inner-wrapper">' + $formDateNote + '</span>';

            if ($formHelp.text() === 'dd/mm/yyyy') {
                $formHelp.html($formatInnerWrapper);
            } else {
                $formHelp.append(' ' + $formatInnerWrapper);
            }
            return;
        }

        $formComponent.append('<span class="form__help" id="help_text_' + $dateFieldID + '">' + $formDateNote + '</span>');
    });

    $forms.each(function() {
        $(this).submit(function() {
            updateDateFormat();
        });
    });
})();
