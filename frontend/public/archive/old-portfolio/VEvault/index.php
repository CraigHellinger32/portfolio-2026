<?php include 'include/simple_html_dom.php'; ?>
<?php include 'include/functions.php'; ?>

<!DOCTYPE html>
<html dir="ltr" lang="en-GB">
	<head>
	    <meta charset="UTF-8" />
	    <title>Vision Express Email Vault</title>
	    <link rel="shortcut icon" href="favicon.ico" type="image/vnd.microsoft.icon" />
	    <link rel="stylesheet" type="text/css" media="all" href="css/styles.css" />
	    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
	    <script type="text/javascript" src="js/plugins.js"></script>
	    <!--[if lt IE 9]>
		<script src="js/html5shiv.js"></script>
		<![endif]-->
	</head>
	<body>
		<div id="message"><p class="central"></p></div>
		<header>
				<div id="logo">
					<div class="central"><img src="images/tribe-logo.png" alt="Tribe Brand Communication" title="Tribe Brand Communication" /></div>
				</div>
				<?php $header = getHeader(); if ($header != '') : ?>
					<div id="headerLinks">
						<div class="central">
							<h1>Current email: <span><?php echo $header; ?></span></h1>
							<ul>
								<li class="flag"><a href="mailto:chellinger@tribeuk.co.uk?Subject=Please Review Email: <?php echo $header; ?>&Body=Please describe the issue(s) with the email here.">Flag for review</a></li>
								<!--<li class="litmus"><a href="<?php echo $base_url; ?>include/sendemail.php?t=Litmus&e=<?php echo $header; ?>">Send to Litmus</a></li>
								<li class="gmail"><a href="<?php echo $base_url; ?>include/sendemail.php?t=Gmail&e=<?php echo $header; ?>">Send to Gmail</a></li>-->
							</ul>
						</div>
					</div>
				<?php endif; ?>
				<div id="formBar">
					<div class="central">
						<div id="formWrapper">
							<form id="search_m" method="get" action="index.php">
								<h2>Find email by:</h2>
								<div class="field">
									<label for="segment">Segment</label>
									<select name="segment" id="segment">
										<option value="">Segment</option>
										<option value="1"<?php if ($_GET['segment'] == '1') { echo ' selected="selected"'; } ?>>ITM 01</option>
										<option value="2"<?php if ($_GET['segment'] == '2') { echo ' selected="selected"'; } ?>>ITM 02</option>
										<option value="3"<?php if ($_GET['segment'] == '3') { echo ' selected="selected"'; } ?>>ITM 03</option>
										<option value="4"<?php if ($_GET['segment'] == '4') { echo ' selected="selected"'; } ?>>ITM 04</option>
										<option value="5"<?php if ($_GET['segment'] == '5') { echo ' selected="selected"'; } ?>>ITM 05</option>
										<option value="21"<?php if ($_GET['segment'] == '21') { echo ' selected="selected"'; } ?>>TY 21</option>
										<option value="22"<?php if ($_GET['segment'] == '22') { echo ' selected="selected"'; } ?>>TY 22</option>
										<option value="23"<?php if ($_GET['segment'] == '23') { echo ' selected="selected"'; } ?>>TY 23</option>
										<?php /*<option value="101"<?php if ($_GET['segment'] == '101') { echo ' selected="selected"'; } ?>>ANN 101</option>
										<option value="102"<?php if ($_GET['segment'] == '102') { echo ' selected="selected"'; } ?>>ANN 102</option>
										<option value="103"<?php if ($_GET['segment'] == '103') { echo ' selected="selected"'; } ?>>ANN 103</option>
										<option value="104"<?php if ($_GET['segment'] == '104') { echo ' selected="selected"'; } ?>>ANN 104</option>
										<option value="105"<?php if ($_GET['segment'] == '105') { echo ' selected="selected"'; } ?>>ANN 105</option>
										<option value="106"<?php if ($_GET['segment'] == '106') { echo ' selected="selected"'; } ?>>ANN 106</option>
										<option value="107"<?php if ($_GET['segment'] == '107') { echo ' selected="selected"'; } ?>>ANN 107</option>
										<option value="108"<?php if ($_GET['segment'] == '108') { echo ' selected="selected"'; } ?>>ANN 108</option>
										<option value="109"<?php if ($_GET['segment'] == '109') { echo ' selected="selected"'; } ?>>ANN 109</option>
										<option value="110"<?php if ($_GET['segment'] == '110') { echo ' selected="selected"'; } ?>>ANN 110</option>
										<option value="111"<?php if ($_GET['segment'] == '111') { echo ' selected="selected"'; } ?>>ANN 111</option>
										<option value="112"<?php if ($_GET['segment'] == '112') { echo ' selected="selected"'; } ?>>ANN 112</option> */ ?>
										<option value="">Show all</option>
									</select>
								</div>
								<?php /*<div class="field">
									<label for="gender">Gender</label>
									<select name="gender" id="gender">
										<option value="">Gender</option>
										<option value="m"<?php if ($_GET['gender'] == 'm') { echo ' selected="selected"'; } ?>>Male</option>
										<option value="f"<?php if ($_GET['gender'] == 'f') { echo ' selected="selected"'; } ?>>Female</option>
									</select>
								</div>
								<div class="field">
									<label for="age">Age</label>
									<select name="age" id="age">
										<option value="">Age</option>
										<option value="18"<?php if ($_GET['age'] == '18') { echo ' selected="selected"'; } ?>>18-29</option>
										<option value="30"<?php if ($_GET['age'] == '30') { echo ' selected="selected"'; } ?>>30-48</option>
										<option value="49"<?php if ($_GET['age'] == '49') { echo ' selected="selected"'; } ?>>49+</option>
									</select>
								</div>
								<div class="field">
									<label for="version">Version</label>
									<select name="version" id="version">
										<option value="">Version</option>
										<option value="1"<?php if ($_GET['version'] == '1') { echo ' selected="selected"'; } ?>>1</option>
									</select>
								</div>*/ ?>
								<div class="field">
									<label for="week">Week Commencing</label>
									<select name="week" id="week">
										<option value="">Week</option>
										<option value="140501" <?php if ($_GET['week'] == "140501") { echo ' selected="selected"'; } ?>>01/05/2014</option>
										<?php
// 											$weekStart = strtotime('03 September 2012');
// 											$finalWeek = getThisMonday();
// 											while ($weekStart <= $finalWeek) {
// 												echo '<option value="' . date('dmy', $weekStart) . '"';
// 												if ($_GET['week'] == date('jmy', $weekStart)) {
// 													echo ' selected="selected"';
// 												}
// 												echo '>' . date('d/m/Y', $weekStart) . '</option>';
// 												$weekStart += 604800; // plus 7 days
// 											}
// 											
										?>
									</select>
								</div>
								<div class="field">
									<input type="submit" class="btnsubmit" id="multisearch" name="search" value="multi" />
								</div>
								<div class="clearfix"></div>
							</form>
							<?php /*<form id="search_i" method="get" action="index.php">
								<div class="field inputfield">
									<label for="emailid">Find email by ID:</label>
									<input type="text" value="<?php if (!empty($_GET['emailid'])) { echo $_GET['emailid']; } else { echo ''; } ?>" id="emailid" name="emailid" />
								</div>
								<div class="field">
									<input type="submit" class="btnsubmit" id="idsearch" name="search" value="id" />
								</div>
							</form> */ ?>
						</div>
					</div>
				</div>
			</form>
		</header>
		<div id="email">
			<?php if ($_GET['emailid'] != '' || $_GET['week'] != ''): ?>
				<?php echo getEmailHTML($_GET); ?>
			<?php else: ?>
				<div class="central">
					<img src="images/intro.png" />
				</div>
			<?php endif; ?>
		</div>
		<pre id="code">
			<code>
				<?php echo htmlspecialchars(getEmailHTML($_GET)); ?>
			</code>
		</pre>
	</body>
</html>