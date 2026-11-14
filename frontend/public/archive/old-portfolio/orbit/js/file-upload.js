// Custom file upload form fields
// ========================================================
// See demo at http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/
// ========================================================
(function() {
    if (!$forms.length) return;

    $forms.find('.form__field--upload, .form__field--image-upload').each( function() {
        let $input   = $(this),
            $label   = $input.closest('.form__control').find('.form__label'),
            labelVal = $label.text(),
            clonedLabelClass = 'form__label--upload';

        // Only apply the following javascript if we're NOT using dropzone
        if (!$input.parent('.form__component--file').length && !$input.parent('.form__component--image-upload').length) return;

        if ($(this).hasClass('form__field--image-upload')) {
            clonedLabelClass = 'form__label--image-upload'
        }

        $input.after($label.clone().addClass(clonedLabelClass));

        $label.replaceWith(function() {
            return '<span class="form__label">' + this.innerHTML + '</span>';
        });

        $label = $input.next('.form__label');

        $input.on('change', function(event) {
            var fileName = '';

            if (event.target.value) {
                fileName = event.target.value.split('\\').pop();
            }

            if (fileName !== '') {
                $label.text(fileName);
            } else {
                $label.text(labelVal);
            }
        });

        $input
        .on('focus', function(){ $input.addClass('has-focus'); })
        .on('focusout', function(){ $input.removeClass('has-focus'); });
    });
})();
