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

add_action( 'acf/include_fields', function () {
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group( [
		'key'                => 'group_6adfb503aeaf9',
		'title'              => 'Case studies',
		'active'             => true,
		'show_in_rest'       => 0,
		'show_in_graphql'    => 1,
		'graphql_field_name' => 'caseStudies',
		'map_graphql_types_from_location_rules' => 0,
		'graphql_types'      => '',
		'fields'             => [
			[
				'key'                => 'field_6adfbe51c7fce',
				'label'              => 'Chemical symbol',
				'name'               => 'chemical-symbol',
				'type'               => 'text',
				'required'           => 1,
				'default_value'      => 'Aa',
				'maxlength'          => 3,
				'allow_in_bindings'  => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'chemical-symbol',
				'graphql_non_null'   => 0,
			],
			[
				'key'                => 'field_6adfb503dee09',
				'label'              => 'Subtitle',
				'name'               => 'subtitle',
				'type'               => 'text',
				'required'           => 0,
				'default_value'      => '',
				'allow_in_bindings'  => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'subtitle',
				'graphql_non_null'   => 0,
			],
			[
				'key'                     => 'field_6adfc9d985e02',
				'label'                   => 'Client',
				'name'                    => 'client',
				'type'                    => 'relationship',
				'required'                => 0,
				'post_type'               => [ 'client' ],
				'filters'                 => [ 'search' ],
				'return_format'           => 'object',
				'allow_in_bindings'       => 0,
				'bidirectional'           => 0,
				'bidirectional_target'    => [],
				'show_in_graphql'         => 1,
				'graphql_field_name'      => 'client',
				'graphql_connection_type' => 'one_to_many',
			],
		],
		'location'           => [
			[
				[ 'param' => 'post_type', 'operator' => '==', 'value' => 'case_study' ],
			],
		],
	] );

	acf_add_local_field_group( [
		'key'                => 'group_6adfcb22ce565',
		'title'              => 'Clients',
		'active'             => true,
		'show_in_rest'       => 0,
		'show_in_graphql'    => 1,
		'graphql_field_name' => 'clients',
		'map_graphql_types_from_location_rules' => 0,
		'graphql_types'      => '',
		'fields'             => [
			[
				'key'                => 'field_6adfcfd87a7af',
				'label'              => 'Hide on front page',
				'name'               => 'hide_on_front_page',
				'type'               => 'true_false',
				'required'           => 0,
				'default_value'      => 0,
				'allow_in_bindings'  => 0,
				'ui'                 => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'hideOnFrontPage',
				'graphql_non_null'   => 0,
			],
			[
				'key'                => 'field_6adfcb22cf20a',
				'label'              => 'Chemical symbol',
				'name'               => 'chemical-symbol',
				'type'               => 'text',
				'required'           => 1,
				'default_value'      => 'Aa',
				'maxlength'          => 3,
				'allow_in_bindings'  => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'chemical-symbol',
				'graphql_non_null'   => 0,
			],
		],
		'location'           => [
			[
				[ 'param' => 'post_type', 'operator' => '==', 'value' => 'client' ],
			],
		],
	] );

	acf_add_local_field_group( [
		'key'                => 'group_pf2026_client_branding',
		'title'              => 'Client branding',
		'show_in_graphql'    => true,
		'graphql_field_name' => 'clientBranding',
		'fields'             => [
			[
				'key'                => 'field_pf2026_client_logo_size',
				'label'              => 'Logo size',
				'name'               => 'logo_size',
				'type'               => 'select',
				'instructions'       => 'Choose the optical logo size. Wide suits long wordmarks; Compact suits smaller marks. Applies to both original and light logos.',
				'choices'            => [
					'compact'  => 'Compact',
					'standard' => 'Standard',
					'wide'     => 'Wide',
				],
				'default_value'      => 'standard',
				'return_format'      => 'value',
				'show_in_graphql'    => true,
				'graphql_field_name' => 'logoSize',
			],
			[
				'key'                => 'field_pf2026_client_light_logo',
				'label'              => 'Light logo',
				'name'               => 'light_logo',
				'type'               => 'image',
				'instructions'       => 'Optional reversed logo for colored or dark backgrounds. Use a transparent image.',
				'return_format'      => 'array',
				'show_in_graphql'    => true,
				'graphql_field_name' => 'lightLogo',
			],
		],
		'location'           => [
			[
				[ 'param' => 'post_type', 'operator' => '==', 'value' => 'client' ],
			],
		],
	] );
} );

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