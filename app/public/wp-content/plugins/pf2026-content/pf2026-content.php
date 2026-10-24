<?php
/**
 * Plugin Name: Craig's portfolio 2026
 * Description: Custom content functionality for PF2026.
 * Version: 1.0.0
 * Requires PHP: 7.4
 * Text Domain: pf2026-content
 *
 * @package PF2026Content
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', function () {
	$post_types = [
		'case_study' => [
			'name'          => 'Case Studies',
			'singular_name' => 'Case Study',
			'slug'          => 'case-studies',
			'graphql_single' => 'caseStudy',
			'graphql_plural' => 'caseStudies',
            'menu_icon'     => 'dashicons-open-folder',
		],
		'client'     => [
			'name'          => 'Clients',
			'singular_name' => 'Client',
			'slug'          => 'clients',
			'graphql_single' => 'client',
			'graphql_plural' => 'clients',
            'menu_icon'     => 'dashicons-nametag',
		],
		'skill'      => [
			'name'          => 'Skills',
			'singular_name' => 'Skill',
			'slug'          => 'skills',
			'graphql_single' => 'skill',
			'graphql_plural' => 'skills',
            'menu_icon'     => 'dashicons-hammer',
		],
	];

	foreach ( $post_types as $post_type => $config ) {
		register_post_type(
			$post_type,
			[
				'labels'              => [
					'name'          => $config['name'],
					'singular_name' => $config['singular_name'],
				],
				'public'              => true,
				'has_archive'         => true,
				'rewrite'             => [ 'slug' => $config['slug'] ],
				'supports'            => [ 'title', 'editor', 'excerpt', 'thumbnail' ],
				'show_in_rest'        => true,
				'show_in_graphql'     => true,
				'graphql_single_name' => $config['graphql_single'],
				'graphql_plural_name' => $config['graphql_plural'],
                'menu_icon'           => $config['menu_icon'] ?? 'dashicons-admin-post',
			]
		);
	}
} );