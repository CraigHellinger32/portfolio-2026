<?php
/**
 * Update Cyber-spacial content
 */

// Load WordPress
define('WP_USE_THEMES', false);
require(dirname(dirname(dirname(dirname(__FILE__)))) . '/wp-load.php');

// Get the cleaned content from file
$content = file_get_contents('/tmp/cyber_content.html');

// Update the post
$result = wp_update_post([
    'ID' => 7,
    'post_content' => $content,
]);

if (is_wp_error($result)) {
    echo json_encode(['success' => false, 'error' => $result->get_error_message()]);
} else {
    echo json_encode(['success' => true, 'post_id' => $result]);
}
