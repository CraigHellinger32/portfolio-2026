$(document).ready(function(){

var suggest = [
{
"key": "author",
"disp": "author",
"disp_t": "T",
"wt": "112.858",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "and",
"disp": "and",
"disp_t": "T",
"wt": "112.756",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "add",
"disp": "add",
"disp_t": "T",
"wt": "109.165",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "arrive",
"disp": "arrive",
"disp_t": "T",
"wt": "108.894",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "available",
"disp": "available",
"disp_t": "T",
"wt": "108.761",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "as",
"disp": "as",
"disp_t": "T",
"wt": "93.343",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "an",
"disp": "an",
"disp_t": "T",
"wt": "91.531",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "at",
"disp": "at",
"disp_t": "T",
"wt": "87.704",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "all",
"disp": "all",
"disp_t": "T",
"wt": "85.463",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
},
{
"key": "are",
"disp": "are",
"disp_t": "T",
"wt": "80.889",
"cat": "",
"cat_t": "",
"action": "",
"action_t": "S"
}
];

var suggestpeople = [
{
"key": "Ada E.",
"disp": {"title":"Ada E. Yonath","image":"../images/mobile/375w_hotel-bolton.jpg","year":"2009","category":"chemistry","url":"http://www.nobelprize.org/nobel_prizes/chemistry/laureates/2009/yonath-facts.html"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.nobelprize.org/nobel_prizes/chemistry/laureates/2009/yonath-facts.html",
"action_t": "U"
},
{
"key": "Abdus",
"disp": {"title":"Abdus Salam","image":"../images/paul-sinah.jpg","year":"1979","category":"physics","url":"http://www.nobelprize.org/nobel_prizes/physics/laureates/1979/salam-facts.html"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.nobelprize.org/nobel_prizes/physics/laureates/1979/salam-facts.html",
"action_t": "U"
},
{
"key": "Abrikosov",
"disp": {"title":"Alexei A. Abrikosov","image":"files/multichannel/images/img4.jpg","year":"2003","category":"physics","url":"http://www.nobelprize.org/nobel_prizes/physics/laureates/2003/abrikosov-facts.html"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.nobelprize.org/nobel_prizes/physics/laureates/2003/abrikosov-facts.html",
"action_t": "U"
}
];

var suggestevents = [
{
"key": "Australian",
"disp": {"title":"Australian Haydn Ensemble -Michael Haydn Requiem","image":"../images/mobile/375w_bolton-town-hall.jpg","startDate":"2015-08-08","endDate":"2015-08-08","location":"St James Church","url":"http://www.sydneyoperahouse.com/whatson/ahe15_michael_haydn_requiem.aspx"},
"disp_t": "J",
"wt": "0.5",
"cat": "",
"cat_t": "",
"action": "http://www.sydneyoperahouse.com/whatson/ahe15_michael_haydn_requiem.aspx",
"action_t": "U"
},
{
"key": "Australian",
"disp": {"title":"Australian Haydn Ensemble - Beethoven's Piano Concerto","image":"../images/mobile/375w_car-park.jpg","startDate":"2015-06-21","endDate":"2015-06-22","location":"Utzon Room","url":"http://www.sydneyoperahouse.com/whatson/ahe15_beethovens_piano_concerto.aspx"},
"disp_t": "J",
"wt": "0.5",
"cat": "",
"cat_t": "",
"action": "http://www.sydneyoperahouse.com/whatson/ahe15_beethovens_piano_concerto.aspx",
"action_t": "U"
},
{
"key": "A",
"disp": {"title":"Lennon: Through A Glass Onion","image":"files/multichannel/images/img3.jpg","startDate":"2015-04-28","endDate":"2015-05-03","location":"Playhouse","url":"http://www.sydneyoperahouse.com/whatson/lennon_through_a_glass_onion_15.aspx"},
"disp_t": "J",
"wt": "0.5",
"cat": "",
"cat_t": "",
"action": "http://www.sydneyoperahouse.com/whatson/lennon_through_a_glass_onion_15.aspx",
"action_t": "U"
}
];

var suggestlocations = [
{
"key": "Albert Road Children's Centre",
"disp": {"title":"Albert Road Children's Centre","latitude":"51.5564226801553","longitude":"0.0737736872493705","category":"Education","address":"LBR CHILDRENS RESOURCE CENTRE 53 ALBERT ROAD ILFORD IG1 1HL","url":"http://www.redbridge.gov.uk/Map/children-s-centres/albert-road-children-s-centre"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.redbridge.gov.uk/Map/children-s-centres/albert-road-children-s-centre",
"action_t": "U"
},
{
"key": "Aldborough (A3)",
"disp": {"title":"Aldborough (A3)","latitude":"51.5780997137961","longitude":"0.0869782345599526","category":"Council and Democracy","address":"76 NETLEY ROAD BARKINGSIDE ILFORD IG2 7NP","url":"http://www.redbridge.gov.uk/Map/polling-districts/aldborough-a3"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.redbridge.gov.uk/Map/polling-districts/aldborough-a3",
"action_t": "U"
},
{
"key": "Al-Noor Independent School",
"disp": {"title":"Al-Noor Independent School","latitude":"51.5631987355583","longitude":"0.116462479609888","category":"Education","address":"619-629 GREEN LANE Seven Kings ILFORD IG3 9RP","url":"http://www.redbridge.gov.uk/Map/private-and-independent-schools/al-noor-independent-school"},
"disp_t": "J",
"wt": "100",
"cat": "",
"cat_t": "",
"action": "http://www.redbridge.gov.uk/Map/private-and-independent-schools/al-noor-independent-school",
"action_t": "U"
}
];

// Bloodhound setup
var organic =  new Bloodhound({
   datumTokenizer: Bloodhound.tokenizers.obj.whitespace('key')
  ,queryTokenizer: Bloodhound.tokenizers.whitespace
  ,limit: 6
  ,local : suggest
});

var events =  new Bloodhound({
     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('key')
    ,queryTokenizer: Bloodhound.tokenizers.whitespace
    ,limit: 3
    ,local: suggestevents
});

var news =  new Bloodhound({
     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('key')
    ,queryTokenizer: Bloodhound.tokenizers.whitespace
    ,limit: 3
    ,local: suggestpeople
});

// Initialise
organic.initialize();
events.initialize();
news.initialize();

$siteHeader.find("#search-site").add("#query-mc").add(".page-header #keywords").add('.page-content #keywords-1').typeahead({
    minLength : 1,
    hint: true,
    highlight: true
  }
 ,{
   name : "organic"
   ,displayKey : "value"
   ,source : organic.ttAdapter()
   ,templates : {
       empty : Handlebars.compile(empty__organic)
      ,header : Handlebars.compile(header__organic)
      ,suggestion : Handlebars.compile(result__organic)
     }
   }
  ,{
    name : "events"
   ,displayKey : "value"
   ,source : events.ttAdapter()
   ,templates : {
       empty : Handlebars.compile(empty__events)
      ,header : Handlebars.compile(header__events)
      ,suggestion : Handlebars.compile(result__events)
     }
   }
  ,{
    name : "news"
   ,displayKey : "value"
   ,source : news.ttAdapter()
   ,templates : {
       empty : Handlebars.compile(empty__news)
      ,header : Handlebars.compile(header__news)
      ,suggestion : Handlebars.compile(result__news)
     }
   }
).on('typeahead:selected',function($e, datum){
        // Debug only
        console.log(datum);
        // For entries with a URL
        if(datum.url){
          location = datum.url;
          return false;
        }
	// We never fire a direct search
});
});
