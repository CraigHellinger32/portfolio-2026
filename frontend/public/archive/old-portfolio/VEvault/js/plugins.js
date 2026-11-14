$(document).ready(function() {
	
	// Validate
	$("input[type=submit]").click(function(e) {
		e.preventDefault();
    	var $i = $(this).attr("id");
    	var $form = $(this).closest('form')
    	var $s;
    	var $g;
    	var $a;
    	var $v;
    	var $w;
    	var $e;
    	
		// hide button / show loader
		$(this).addClass("loader");
		switch($i) {
			case 'multisearch':
				$s = $("#segment").val();
				/*$g = $("#gender").val();
				$a = $("#age").val();
				$v = $("#version").val();*/
				$w = $("#week").val();
				break;
			case 'idsearch':
				$e = $("#emailid").val();
		}
			
		// check if A2 image exists
		$.getJSON('include/checkimage.php', {t:$i, s:$s, w:$w, e:$e}, function(data) {
			console.log("path = " + data.path);
			if (data.response == 'success') {		    
				// submit form if exists  
				$form.submit();
			} else {
				// hide loader / show button
				$("#" + $i).removeClass("loader");
				
				// show error
				var message = 'Sorry, we could not find that email. Please ensure all fields are correct and try again. ' + $s;
				showMessage(message, 'error');
			}		
	    });
		
	});
	
	
	if (parseFloat($("#segment").val()) > 100) {
		$("#gender, #age, #version").attr("disabled", "disabled");
	}
	 
    $("#segment").change(function() {
	    if (parseFloat($(this).val()) > 100) {
			$("#gender, #age, #version").attr("disabled", "disabled");
	    } else {
			$("#gender, #age, #version").removeAttr("disabled");
		}
    });


	// Send Emails
	$(".litmus a, .gmail a").click( function(e) {
		e.preventDefault();
		// send email
		$.getJSON($(this).attr("href"), function(data) {
			var message;
			if (data.response == 'success') {
				// show success message
				message = 'The message has been sent to ' + data.to + '.';
			} else {
				// show error message
				message = 'There was an error sending the message. Please try again or contact Tribe for assistance.';
			}
			showMessage(message, 'notice');
		});
	});
	
});

function showMessage(message, $class) {
	$("#message p").text(message);
	$("#message").removeAttr('class').addClass($class).slideDown().animate({
		opacity: 1
	}, 1000, function() {
		$(this).slideUp();
	});
}
	
$(document).keydown(function(e){
    if (e.keyCode == 37) {
       window.location = $('#prev').attr("href");
       return false;
    }
    if (e.keyCode == 39) {
       window.location = $('#next').attr("href");
       return false;
    }
});