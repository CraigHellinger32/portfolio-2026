(function() {
    'use strict';

    $('pre code.html, pre code.js').each(function() {
        $(this).html($(this).html().replace(/</gi, '&lt;').replace(/>/gi, '&gt;'));
    });

    $('.tab').click(function(e){
        e.preventDefault();
        var tabname = 'code.' + $(this).attr('data-tab');
        $(this).siblings('pre').hide().removeClass('hidden');
        $(this).parent().find(tabname).parent().show().removeClass('hidden');

        $(this).parent().find('.tab').removeClass('active');
        $(this).addClass('active');
    });
})();
