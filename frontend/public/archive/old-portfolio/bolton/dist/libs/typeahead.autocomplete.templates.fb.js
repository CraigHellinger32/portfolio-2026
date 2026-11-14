// TYPEAHEAD TEMPLATES

// ORGANIC SUGGESTIONS
header__organic = "<p class=\"tt-dropdown-menu__heading\">Suggestions</p>";
result__organic = "<a class=\"tt-suggestion__link\" href=\"/s/search.html?collection=showcase-multichannel_completion&amp;query={{disp}}\" title=\"Search for '{{disp}}'\">{{disp}}</a>";
empty__organic = "<p class=\"form__error-message\">No suggestions found.</p>";

// NEWS SUGGESTIONS
header__news = "<p class=\"tt-dropdown-menu__heading\">News</p>";
result__news = "<div class=\"suggestion-wrapper suggestion-news\"><a class=\"suggestion-wrapper__link\" href=\"{{disp.url}}\"><img class=\"suggestion-wrapper__image\" src=\"{{disp.image}}\" alt=\"Image: {{disp.title}}\" /><div class=\"suggestion-wrapper__text\"><span class=\"suggestion-title\">{{disp.title}}</span><span class=\"suggestion-subtitle\">{{disp.category}}, {{disp.year}}</span></div></a></div>";
empty__news = "<p class=\"form__error-message\">No suggestions found.</p><p><a href=\"/search?query={{query}}&collection=showcase-news\">Search for <strong><em>{{query}}</em></strong> in <strong>News</strong>.</a></p>";

// EVENT SUGGESTIONS
header__events = "<p class=\"tt-dropdown-menu__heading\">Events</p>";
result__events = "<div class=\"suggestion-wrapper suggestion-event\"><a class=\"suggestion-wrapper__link\" href=\"{{disp.url}}\"><img class=\"suggestion-wrapper__image\" src=\"{{disp.image}}\" alt=\"Image: {{disp.title}}\" /><div class=\"suggestion-wrapper__text\"><span class=\"suggestion-text\">{{disp.title}}</span><span class=\"suggestion-subtitle\">{{#if disp.artist}}{{disp.artist}} - {{/if}}{{disp.location}}<br/>{{disp.startDate}}{{#if disp.endDate}} - {{disp.endDate}}{{/if}}</span></div></a></div>";
empty__events = "<p class=\"form__error-message\">No suggestions found.</p><p><a href=\"/search?query={{query}}&collection=showcase-events\">Search for <strong><em>{{query}}</em></strong> in <strong>Events</strong>.</a></p>";
