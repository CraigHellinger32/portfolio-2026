<?php
	include 'functions.php';
	$data = array();

	switch($_GET['t']) {
		case 'multisearch':
			$data['segment'] = $_GET['s'];
			$data['week'] = $_GET['w'];
			break;
		case 'idsearch':
			$data = reverseEmailID($_GET['e']);
			break;
	}
	$path = $GLOBALS['local_base_path'] . "images/tyitm/" . $data['week'] . "/header-TY.jpg";
	
	echo json_encode(array('response' => 'success', 'path' => $path));
	
	/*if (file_exists($path) || $data['segment'] > 100) {
		echo json_encode(array('response' => 'success', 'path' => $path));
	} else {
		echo json_encode(array('response' => 'fail', 'path' => $path));
	}*/
	
	
?>