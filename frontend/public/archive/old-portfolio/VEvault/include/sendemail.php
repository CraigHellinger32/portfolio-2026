<?php
	include 'functions.php';

	switch($_GET['t']) {
		case 'Gmail':
			$to = 'wty.ve.tribe.archive@gmail.com';
			break;
		case 'Litmus':
			$to = 'tribe.ac28836.new@emailtests.com';
			break;
	}
	$subject = $_GET['e'];
	$body = getEmailHTML(reverseEmailID($_GET['e']));
	
	$headers  = 'MIME-Version: 1.0' . "\r\n";
	$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
	$headers .= 'From: Vision Express Email Vault <design@tribeuk.co.uk>' . "\r\n";
	
// 	echo $body; // debugging

	if(mail($to, $subject, $body, $headers)) {
		echo json_encode(array('response' => 'success', 'to' => $_GET['t']));
	} else {
		echo json_encode(array('response' => 'fail', 'to' => $_GET['t']));
	}
	
	
?>