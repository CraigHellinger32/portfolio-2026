<?php

	//$base_url = 'http://www.visionexpressemailvault.co.uk/';
	//$local_base_path = '/websites/123reg/LinuxPackage24/vi/si/on/visionexpressemailvault.co.uk/public_html/';

	$base_url = 'http://www.craighellinger.co.uk/VEvault/';
	$local_base_path = '/kunden/homepages/8/d469912823/htdocs/craighellinger/VEvault/';

	function getThisMonday() {
		$monday = strtotime(date('m/d/Y'));
		while(date('D', $monday) != 'Mon'){ 
			$monday -= 86400; //minus 1 day 
		} 
		
		return $monday;
	}
	
	function getImagePath($loc, $data, $base) {
		$type = 'tyitm';
		if ($data['segment'] > 100) {
			$type = 'anni';
		}
		return $base . 'images/' . $type . '/' . $data['week'] . '/' . $data['segment'] . '_' . $loc . '_' . $data['gender'] . '_' . $data['age'] . '_' . $data['version'];
	}
	
	function getHeader() {
		if ($_GET['emailid'] != '') {
			$header = $_GET['emailid'];
		} elseif ($_GET['week'] != '') {
			$segment = $_GET['segment'];
			$week = $_GET['week'];
			
			
			$type = 'TYITM';
			if ($segment > 100) {
				$type = 'ANNI';
				$version = '';
			}
			
			$header = $type . '_' . $week . '_S' . $segment;
			
		} else {
			$header = '';
		}
		return str_replace('__', '_', $header);
	}
	
	function getEmailNumber($segment, $gender, $age) {
		if ($segment > 100) {
			return '';
		} else {
			$n = ($segment * 6) - 5;
			
			if ($gender == 'm') {
				$n += 3;
			}
			
			if ($age == '30') {
				$n++;
			} elseif ($age == '49') {
				$n += 2;
			}
		
			return str_pad($n,3,"0",STR_PAD_LEFT) . '_';
		}
	}
	
	function reverseEmailID($emailid) {
		$ex = explode('_', $emailid);
		$data = array();
		$data['week'] = $ex[1];
		$data['segment'] = str_replace('S', '', $ex[count($ex) - 1]);
		$data['version'] = ($data['segment'] > 100) ? '' : intval($ex[3]);
		if ($data['segment'] > 100) {;
			$data['gender'] = '';
			$data['age'] = '';
		} else {
		$eid = intval($ex[2]);
			if ($eid % 6 == 0) {
				$data['gender'] = 'm';
				$data['age'] = '49';
			} elseif ($eid % 6 == 5) {
				$data['gender'] = 'm';
				$data['age'] = '30';
			} elseif ($eid % 6 == 4) {
				$data['gender'] = 'm';
				$data['age'] = '18';
			} elseif ($eid % 6 == 3) {
				$data['gender'] = 'f';
				$data['age'] = '49';
			} elseif ($eid % 6 == 2) {
				$data['gender'] = 'f';
				$data['age'] = '30';
			} else {
				$data['gender'] = 'f';
				$data['age'] = '18';
			}
		}
		
		return $data;
	}
	
	function getEmailHTML($data) {
		/*if ($data['emailid'] != '') {
			foreach(reverseEmailID($data['emailid']) as $key => $val) {
			    $data[$key] = $val;
			}
		}*/
		
		// $template = file_get_contents($GLOBALS['local_base_path'] . 'include/' . $data['week'] . '/message.html');

		/*** Create DOM from URL or file ***/
		/*** for more info visit http://simplehtmldom.sourceforge.net/manual.htm ***/
		
		//$html = file_get_html('http://www.visionexpressemailvault.co.uk/include/' . $data['week'] . '/message.html');
		$html = file_get_html('http://www.craighellinger.co.uk/VEvault/include/' . $data['week'] . '/message.html');
		echo "<h1>Hello " . $data['segment'] . "</h1>";
		if ($data['segment'] == NULL) {
			
			foreach($html->find('[data-segments]') as $element) {
				
				$label = '<div class="segment-tag">Segment';
				
				$arr = explode( ',', $element->attr['data-segments'] );
				if (count($arr) > 1) {
					$label .= 's ';
				} else {
					$label .= ' ';
				}
				foreach($arr as $arr_segment) {
					$label .= $arr_segment . ", ";
				} // end nested foreach
				$label .=  '</div>';
				$element->outertext = $label . $element->outertext;
			} // foreach
			
		} else {
			
			foreach($html->find('[data-segments]') as $element) {
				$arr = explode( ',', $element->attr['data-segments'] );
				$flag = 0;
				foreach($arr as $arr_segment) {
					if ($arr_segment == $data['segment']) {
						$flag = 1;
					}
				} // end nested foreach
				if ($flag == 1) {
					// remove element from html dom
					$element->outertext = '';
				}
			} // foreach
		} // else

       	// insert next and previous links
		$previous = '<a href="' . getPreviousLink($data) . '" id="prev">Previous</a>';
		$next = '<a href="' . getNextLink($data) . '" id="next">Next</a>';

       	# output it!
		return $previous . $html->save() . $next;

		$html->clear();
		unset($html);

		/* if ($data['segment'] < 100) {
			$locations = array('A3', 'A4', 'A5', 'A6', 'B1', 'B1s', 'B1b', 'B2', 'B2s', 'B2b', 'B3', 'B3s', 'B3b', 'B4', 'B4s', 'B4b', 'B5', 'D', 'E1', 'E2', 'E3', 'E4');			
			foreach ($locations as $loc) {
				$template = str_replace('###' . $loc . '###', getImagePath($loc, $data, $GLOBALS['base_url']), $template);
			}
		} else {
			$template = str_replace('###SEG###', $data['segment'], $template);
			$template = str_replace('###WEEK###', $data['week'], $template);
		}	
		
		$template = addAText($template, $data['segment']);
		$template = addTerms($template, $data['segment']); */
		
		
		// return $previous . $template . $next;
	}
	
	function addAText($text, $segment) {
		
		switch ($segment) {
			case 1:
				$title = "Hello there.";
				$subtitle= "Now we know your prescription...";
				$copy = "You can choose your perfect eyewear. Find the best styles to suit your look with these great offers.";
				break;
			case 2:
				$title = "Hello there.";
				$subtitle= "Your prescription hasn't changed...";
				$copy = "But your glasses can. Choose the perfect style to update your look with these great offers.";
				break;
			case 3:
				$title = "Hello again.";
				$subtitle= "Your prescription has changed...";
				$copy = "Find the best styles to update your look with these great offers.";
				break;
			case 4:
				$title = "Hello again.";
				$subtitle= "Your prescription has changed...";
				$copy = "Find the best styles to update your look with these great offers.";
				break;
			case 5:
				$title = "Hello again.";
				$subtitle= "Your prescription has changed...";
				$copy = "Find the best styles to update your look with these great offers.";
				break;
			case 21:
				$title = "Hello there.";
				$subtitle= "How are your new glasses?";
				$copy = "As you're updating your look, you can also get 10% off sunglasses as well as loads of other great offers...";
				break;
			case 22:
				$title = "Hello there.";
				$subtitle= "How are your new glasses?";
				$copy = "As you're updating your look, you can also try contact lenses for free (with &pound;60 off when you buy glasses), get 10% off sunglasses and loads of other great offers...";
				break;
			case 23:
				$title = "Hello there.";
				$subtitle= "How are your new glasses?";
				$copy = "As you're updating your look, you can also try contact lenses for free (with &pound;60 off when you buy glasses), as well as loads of other great offers...";
				break;
			
		}
		$copy = preg_replace('/\s([^\s]*)$/','&nbsp;\1',$copy);

		
		$text = str_replace('###TITLE###', $title,  $text);
		$text = str_replace('###SUBTITLE###', $subtitle, $text);
		$text = str_replace('###COPY###', $copy, $text);
		
		return $text;
	}
	
	function addTerms($text, $segment) {
		$expdate = strtotime("+30 day", time());
		$expdate = date('jS F Y', $expdate);

		
		$sunglasses = "10% off sunglasses valid against a pair of non-prescription sunglasses. Can be upgraded to your prescription from &pound;39 for single vision lenses. Not to be used in conjunction with any other offer, discount (excl. NHS benefits) or promotion. Valid until " . $expdate . ".<br><br>";
		$thirtyoff = "&pound;30 discount valid when you purchase frames with prescription lenses or upon joining our Direct Debit contact lens scheme. Not to be used in conjunction with any other offer, discount (excl. NHS benefits) or promotion or the &pound;29/&pound;59 ranges. Valid at any Vision Express store (excl. Eire and designer outlet stores). Valid until " . $expdate . ".<br><br>";
		
		
		switch ($segment) {
			case 1:
				$terms = $thirtyoff;
				break;
			case 2:
				$terms = $thirtyoff;
				break;
			case 3:
				$terms = $thirtyoff;
				break;
			case 4:
				$terms = $thirtyoff . $sunglasses;
				break;
			case 5:
				$terms = $thirtyoff;
				break;
			case 21:
				$terms = $sunglasses;
				break;
			case 22:
				$terms = $sunglasses;
				break;
			case 23:
				$terms = "";
				break;
			case 101:
				$terms = $thirtyoff;
				break;
			case 102:
				$terms = $sunglasses . $thirtyoff;
				break;
			case 103:
				$terms = $thirtyoff;
				break;
			case 104:
				$terms = $sunglasses;
				break;
			case 105:
				$terms = $thirtyoff;
				break;
			case 106:
				$terms = $sunglasses . $thirtyoff;
				break;
			case 107:
				$terms = $thirtyoff;
				break;
			case 108:
				$terms = $sunglasses;
				break;
			case 109:
				$terms = $thirtyoff;
				break;
			case 110:
				$terms = $sunglasses . $thirtyoff;
				break;
			case 111:
				$terms = $thirtyoff;
				break;
			case 112:
				$terms = $sunglasses;
				break;			
		}
		
		$text = str_replace('###TERMS###', $terms, $text);
		
		return $text;
	}
	
	function getNextLink($data) {
		
		$segment = $data['segment'];
		
		if ($segment > 100) {
			if ($segment == 112) {
				//reset
				$segment = 1;
				$age = 18;
				$gender = "f";
			} else {
				$segment++;
			}
		} elseif ($data['gender'] == 'm' && $data['age'] == 49) {
			if ($segment == 23) {
				$segment = 101;
			} elseif ($segment != 5) {
				$segment++;
			}  else {
				$segment = 21;
			}
		}
		
		if ($data['segment'] < 100) {
			if ($data['age'] == 18) {
				$age = 30;
			} elseif ($data['age'] == 30) {
				$age = 49;
			} elseif ($data['age'] == 49) {
				$age = 18;
			}
			
			if ($data['age'] == 49) {
				$gender = ($data['gender'] == 'm') ? 'f' : 'm';
			} else {
				$gender = $data['gender'];
			}
		}
		
		
		return '/index.php?segment=' . $segment . '&gender=' . $gender . '&age=' . $age . '&version=' . $data['version'] . '&week=' . $data['week'];
		
	}
	
	function getPreviousLink($data) {
		
		$segment = $data['segment'];
		$version = ($data['version'] == '') ? 1 : $data['version'];
		
		if ($segment > 100) {
			if ($segment == 101) {
				//reset
				$segment = 23;
				$age = 49;
				$gender = "m";
			} else {
				$segment--;
			}
		} elseif ($data['gender'] == 'f' && $data['age'] == 18) {
			if ($segment == 1) {
				$segment = 112;
			} elseif ($segment != 21) {
				$segment--;
			}  else {
				$segment = 5;
			}
		}
		
		if ($data['segment'] < 100) {
			if ($data['age'] == 18) {
				$age = 49;
			} elseif ($data['age'] == 30) {
				$age = 18;
			} elseif ($data['age'] == 49) {
				$age = 30;
			}
			
			if ($data['age'] == 18) {
				$gender = ($data['gender'] == 'm') ? 'f' : 'm';
			} else {
				$gender = $data['gender'];
			}
		}
		
		
		
		
		return '/index.php?segment=' . $segment . '&gender=' . $gender . '&age=' . $age . '&version=' . $version . '&week=' . $data['week'];
	}
?>