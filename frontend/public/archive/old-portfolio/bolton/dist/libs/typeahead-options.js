(function() {
    'use strict';

    $(document).ready(function() {
        var jsonurl = [
            {
            "key": "Category",
            "disp": "Category: This will add a category to the query",
            "disp_t": "H",
            "wt": "100",
            "cat": "Restrict to category: ",
            "cat_t": "",
            "action": "s:Category",
            "action_t": "E"
            },
            {
            "key": "Category",
            "disp": "Category: This is another category",
            "disp_t": "H",
            "wt": "12",
            "cat": "Restrict to category: ",
            "cat_t": "",
            "action": "s:Category2",
            "action_t": "E"
            },
            {
            "key": "Category",
            "disp": "Category: This is a third category",
            "disp_t": "H",
            "wt": "18",
            "cat": "Restrict to category: ",
            "cat_t": "",
            "action": "s:Category3",
            "action_t": "E"
            },
            {
            "key": "URL",
            "disp": "URL: This will open an URL",
            "disp_t": "T",
            "wt": "88",
            "cat": "Action samples",
            "cat_t": "",
            "action": "http://test-data.funnelback.com/",
            "action_t": "U"
            },
            {
            "key": "URL",
            "disp": "URL: This will also open an URL",
            "disp_t": "T",
            "wt": "23",
            "cat": "Action samples",
            "cat_t": "",
            "action": "http://test-data2.funnelback.com/",
            "action_t": "U"
            },
            {
            "key": "URL",
            "disp": "URL: This will open another URL",
            "disp_t": "T",
            "wt": "96",
            "cat": "Action samples",
            "cat_t": "",
            "action": "http://test-data3.funnelback.com/",
            "action_t": "U"
            },
            {
            "key": "Callback",
            "disp": "Callback: This will call a JS callback",
            "disp_t": "T",
            "wt": "45",
            "cat": "Action samples",
            "cat_t": "",
            "action": "alert('This is that JS callback you requested.')",
            "action_t": "C"
            },
            {
            "key": "Callback",
            "disp": "Callback: This will also call a JS callback",
            "disp_t": "T",
            "wt": "54",
            "cat": "Action samples",
            "cat_t": "",
            "action": "alert('This is that JS callback you requested.')",
            "action_t": "C"
            },
            {
            "key": "Callback",
            "disp": "Callback: This will call another JS callback",
            "disp_t": "T",
            "wt": "80",
            "cat": "Action samples",
            "cat_t": "",
            "action": "alert('This is that JS callback you requested.')",
            "action_t": "C"
            },
            {
            "key": "Query",
            "disp": "Query: This will run a query",
            "disp_t": "T",
            "wt": "1",
            "cat": "Action samples",
            "cat_t": "",
            "action": "a query",
            "action_t": "Q"
            },
            {
            "key": "Query",
            "disp": "Query: This will run also query",
            "disp_t": "T",
            "wt": "13",
            "cat": "Action samples",
            "cat_t": "",
            "action": "query 2",
            "action_t": "Q"
            },
            {
            "key": "Query",
            "disp": "Query: This will run another query",
            "disp_t": "T",
            "wt": "61",
            "cat": "Action samples",
            "cat_t": "",
            "action": "another query",
            "action_t": "Q"
            },
            {
            "key": "Standard",
            "disp": "Standard: This is a standard result",
            "disp_t": "T",
            "wt": "3.873",
            "cat": "",
            "cat_t": "",
            "action": "",
            "action_t": "S"
            },
            {
            "key": "Standard",
            "disp": "Standard: This is also a standard result",
            "disp_t": "T",
            "wt": "12",
            "cat": "",
            "cat_t": "",
            "action": "",
            "action_t": "S"
            },
            {
            "key": "Standard",
            "disp": "Standard: This is another standard result",
            "disp_t": "T",
            "wt": "44",
            "cat": "",
            "cat_t": "",
            "action": "",
            "action_t": "S"
            },
            {
            "key": "Json",
            "disp": {"display":"Json","category":"Shoes","price":"£100"},
            "disp_t": "J",
            "wt": "100",
            "cat": "Shoes",
            "cat_t": "",
            "action": "department:shoes",
            "action_t": "E"
            },
            {
            "key": "Json",
            "disp": {"display":"Json","category":"Clothes","price":"£100"},
            "disp_t": "J",
            "wt": "6",
            "cat": "Clothes",
            "cat_t": "",
            "action": "department:clothes",
            "action_t": "E"
            },
            {
            "key": "Json",
            "disp": {"display":"Json","category":"Tech","price":"£100"},
            "disp_t": "J",
            "wt": "1",
            "cat": "Tech",
            "cat_t": "",
            "action": "department:tech",
            "action_t": "E"
            }
        ];

        var profile = '&profile=' + $('form[role="search"] input[name="profile"]').val();
        if (profile == '&profile=undefined') { profile = ''; }
        var baseurl = location.origin + location.pathname + '?collection=' + $('form[role="search"] input[name="collection"]').val() + profile;

        var fbSuggestions = new Bloodhound({
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('key'),
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          local: jsonurl
        });

        fbSuggestions.initialize();

        $('#query.sg-query').typeahead({
          highlight: true
        },
        {
          name: 'fb-suggestions',
          displayKey: 'disp',
          source: fbSuggestions.ttAdapter(),
          templates: {
            empty: [
              '<span class="empty-message">Unable to find any suggestions for your query...</span>'
            ].join('\n'),
            suggestion: function(data){
              displayitem = "";
              switch (data.disp_t) {
                  case 'J':
                      $.each(data.disp, function(key, value) {
                          displayitem += (key, value);
                          displayitem += " "
                      });
                      break;
                  default:
                      displayitem = data.disp;
                      break;
              }
              switch (data.action_t) {
                  case 'Q':
                      displayitem = '<a href="' + baseurl + '&query=' + data.action + '">' + displayitem + '</a>';
                      break;
                  case 'E':
                      displayitem = '<a href="' + baseurl + '&query=' + data.key + '&' + data.action + '">' + displayitem + '</a>';
                      break;
                  case 'U':
                      displayitem = '<a href="' + data.action + '">' + displayitem + '</a>';
                      break;
                  case 'C':
                      displayitem = '<a href="#" onClick="' + data.action + '">'  + displayitem + '</a>';
                      break;
                  default:
                      displayitem = '<a href="' + baseurl + '&query=' + data.disp + '">' + displayitem + '</a>';
                      break;
              }
              return displayitem;
            }
          }
        });

     });
})();
