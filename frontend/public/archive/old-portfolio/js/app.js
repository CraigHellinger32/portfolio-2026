// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs

$(document).ready(function() {

	$(document).foundation();

  $(document).foundation({
    accordion: {
      multi_expand: true
    }
  });

  function scrollToAnchor(aid){
      var aTag = $("a[name='"+ aid +"']");
      
       $('html,body').animate({
        scrollTop: aTag.offset().top
        }, {
        duration: 1000,
        complete: function() {
          console.log("hello!");
          scrolling = false;
        }
      });
  }

  var scrolling = false;

  $('nav ul li a').click(function(e) {
    e.preventDefault();
    scrolling = true;

    $(this).parent().siblings().removeClass("active");
    $(this).parent().addClass("active");
    
    var full_url = this.href;
    var parts = full_url.split("#");
    var trgt = parts[1];

    scrollToAnchor(trgt);

  });

  $( window ).scroll(function() {
    if (scrolling == false) {
        $('nav ul li').each(function() {
          if ($(this).find('a').attr('href') != null) {
            var full_url = $(this).find('a').attr('href');
            var parts = full_url.split("#");
            var trgt = parts[1];

            var aTag_offset = $("a[name='"+ trgt +"']").offset().top;

            if ($(window).scrollTop() > aTag_offset - 280) {
                $(this).siblings().removeClass("active");
                $(this).addClass("active");
                // console.log(trgt + " - " + aTag_offset + " - " + $(window).scrollTop());
            }

          } // if
        }); // each
    }
  });

  $('.accordion .accordion-navigation > a').click(function(e) {
    if (!$(this).hasClass('expander')) {
      window.open($(this).attr('href'));
    }
  }); 

	$('#iframe').load(function() {
          var contentIframe = $(this).contents();
          var documentIframe = contentIframe.get(0);
          $('#Default', documentIframe).perfectScrollbar({
            wheelSpeed: 20,
            wheelPropagation: true,
            minScrollbarLength: 20,
            includePadding: true
          });
        });

  $('#taglist li a').click(function(e) {
      e.preventDefault();

      var iframe_url = $(this).data('url');
      var iframe_height = $(this).data('page-height');

      $('.accordion').show();

      //return tpu(this);
      $('.accordion #' + $(this).data('project')).siblings().removeClass("visible");
      $('.accordion #' + $(this).data('project')).addClass("visible");
      console.log($('.iphone #iframe').attr('src'));
      $('.iphone iframe').css('opacity', 1);
      $('.iphone #iframe').attr('src', 'iframe-content.html?src=' + iframe_url + '&h=' + iframe_height);
  });

}); // end doc ready


var oopts = {
 textFont: 'nexa_boldregular, arial,sans-serif',
 textHeight: 20,
 maxSpeed: 0.1,
 decel: 0.9,
 depth: 0.99,
 outlineColour: '#f6f',
 outlineThickness: 3,
 pulsateTo: 0.2,
 pulsateTime: 0.5,
 wheelZoom: false
}, ttags = 'taglist', lock, shape = 'sphere';
window.onload = function() {
 TagCanvas.textFont = 'nexa_boldregular, arial, sans-serif';
 TagCanvas.textColour = '#fff';
 TagCanvas.textHeight = 22;
 TagCanvas.outlineMethod = false;
 TagCanvas.outlineColour = 'transparent';
 TagCanvas.maxSpeed = 0.03;
 TagCanvas.minBrightness = 0.2;
 TagCanvas.depth = 0.92;
 TagCanvas.pulsateTo = 0.6;
 TagCanvas.initial = [0.1,-0.1];
 TagCanvas.decel = 0.98;
 TagCanvas.reverse = true;
 TagCanvas.hideTags = false;
 TagCanvas.shadow = false;
 TagCanvas.shadowBlur = 3;
 TagCanvas.weight = false;
 TagCanvas.imageScale = null;
 TagCanvas.fadeIn = 1000;
 TagCanvas.clickToFront = 600;
 TagCanvas.wheelZoom = false;
 try {
  TagCanvas.Start('tagcanvas','taglist');
  // TagCanvas.Start('smallCanvas','moreTags', oopts);
 } catch(e) {
  // document.getElementById('cmsg').style.display='none';
  document.getElementsByTagName('canvas')[0].style.border='0';
 }
};
function BGImage(e) {
 // document.getElementById('tagcanvas').style.backgroundImage = (e.checked ? 'url(images/canvas_bg1.png)' : 'none');
}
function restart() {
 TagCanvas.shape = shape;
 TagCanvas.lock = lock;
 TagCanvas.Start('tagcanvas',ttags);
}
function changetags(t) {
 ttags = t;
 restart();
}
function changeshape(s) {
 var locks = { hcylinder: 'x', vcylinder: 'y', hring: 'x', vring: 'y', sphere: '' };
 lock = locks[s] || '';
 shape = s;
 TagCanvas.initial = (lock == 'x' && [0,0.2]) || (lock == 'y' && [0.2,0]) || [0.2,0.2];
 restart();
}
function tpu(s) {
 document.getElementById('sout').innerHTML = s.innerHTML;
 return false;
}
