/**
 * External Link Check
 *
 * Check for extenal links within .editor and add a class.
 *
 * To ignore external links, add the following
 * data attribute to your markup:
 * [data-external-link="false"]
 */
(function(){
    'use strict';

    var links = document.querySelectorAll('.editor a');

    [].forEach.call(links, function(elem){
        if (location.hostname === elem.hostname || !elem.hostname.length)
            return;

        if (elem.getAttribute('data-external-link') === 'false' || elem.classList.contains('button'))
            return;

        var htmlContent = elem.innerHTML;
        var lastIndex = htmlContent.lastIndexOf(" ");
        var htmlContentArray = htmlContent.split(" ");

        elem.classList.add('link-external');
        elem.setAttribute('aria-label', 'external: ' + elem.innerText);

        htmlContent = htmlContent.trim().substring(0, lastIndex);

        elem.innerHTML = '<span class="link-external__text">' + htmlContent.trim() +
            ' </span><span class="link-external__orphan"><span class="link-external__text">' +
            htmlContentArray[htmlContentArray.length - 1].trim() + '</span>&nbsp;<span class="icon icon-external-link"></span></span>';
    });
})();
