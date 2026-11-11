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

// Add CORS headers for GraphQL and REST API
add_action( 'init', function () {
	if ( defined( 'REST_REQUEST' ) || ( isset( $_SERVER['REQUEST_URI'] ) && false !== strpos( $_SERVER['REQUEST_URI'], '/graphql' ) ) ) {
		header( 'Access-Control-Allow-Origin: *' );
		header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With' );
		header( 'Access-Control-Max-Age: 3600' );
		
		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
			status_header( 200 );
			exit;
		}
	}
}, 1 );

add_action( 'graphql_register_types', function () {
	register_graphql_field( 'RootQuery', 'cvUrl', [
		'type'        => 'String',
		'description' => 'The current public CV PDF URL from the Media Library.',
		'resolve'     => function () {
			$attachment_id = (int) get_option( 'pf2026_cv_attachment_id' );
			if ( ! $attachment_id || 'application/pdf' !== get_post_mime_type( $attachment_id ) ) {
				return null;
			}
			return wp_get_attachment_url( $attachment_id ) ?: null;
		},
	] );
} );

add_action( 'after_setup_theme', function () {
	add_image_size( 'pf2026-400', 400, 0, false );
	add_image_size( 'pf2026-480', 480, 0, false );
	add_image_size( 'pf2026-880', 880, 0, false );
} );

function pf2026_responsive_content_images( $html, $sidebar = false ) {
	if ( ! is_string( $html ) || '' === $html || is_admin() ) {
		return $html;
	}

	$has_sidebar = $sidebar || ( function_exists( 'get_field' ) && get_field( 'page-sidebar', get_the_ID(), false ) );
	if ( $sidebar ) {
		$sizes = '(max-width: 767px) calc(100vw - 40px), (max-width: 1319px) calc(35.6564vw - 30.665px), 440px';
	} elseif ( $has_sidebar ) {
		$sizes = '(max-width: 767px) calc(100vw - 40px), (max-width: 1319px) calc(64.3436vw - 55.335px), 794px';
	} else {
		$sizes = '(max-width: 1319px) calc(100vw - 40px), 1280px';
	}

	$tags = new WP_HTML_Tag_Processor( $html );
	while ( $tags->next_tag( 'IMG' ) ) {
		if ( 'sidebar' === $tags->get_attribute( 'data-pf2026-image-context' ) && ! $sidebar ) {
			continue;
		}
		if ( $sidebar ) {
			$tags->set_attribute( 'data-pf2026-image-context', 'sidebar' );
		}
		if ( $tags->get_attribute( 'srcset' ) ) {
			$tags->set_attribute( 'sizes', ( 'lazy' === $tags->get_attribute( 'loading' ) ? 'auto, ' : '' ) . $sizes );
		}
	}

	return apply_filters( 'eio_parse_page_html', $tags->get_updated_html() );
}

add_filter( 'the_content', function ( $html ) {
	return 'case_study' === get_post_type() ? pf2026_responsive_content_images( $html ) : $html;
}, 30 );

add_filter( 'acf/format_value/key=field_6ae9084b81a9d', function ( $html ) {
	return pf2026_responsive_content_images( $html, true );
}, 30 );

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
				'key'                => 'field_pf2026_case_study_start_year',
				'label'              => 'Start year',
				'name'               => 'start_year',
				'type'               => 'number',
				'instructions'       => 'The project year, or the first year of a date range.',
				'min'                => 1900,
				'max'                => 2100,
				'step'               => 1,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'startYear',
			],
			[
				'key'                => 'field_pf2026_case_study_end_year',
				'label'              => 'End year',
				'name'               => 'end_year',
				'type'               => 'number',
				'instructions'       => 'Optional. Leave empty for a single year; otherwise enter the final year of the project.',
				'min'                => 1900,
				'max'                => 2100,
				'step'               => 1,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'endYear',
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
			[
				'key'                => 'field_6ae9084b81a9d',
				'label'              => 'Page sidebar',
				'name'               => 'page-sidebar',
				'type'               => 'wysiwyg',
				'required'           => 0,
				'default_value'      => '',
				'allow_in_bindings'  => 0,
				'tabs'               => 'all',
				'toolbar'            => 'full',
				'media_upload'       => 1,
				'delay'              => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'pageSidebar',
				'graphql_non_null'   => 0,
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
		'key'                => 'group_6ae7b11a76f72',
		'title'              => 'Skills',
		'active'             => true,
		'show_in_rest'       => 0,
		'show_in_graphql'    => 1,
		'graphql_field_name' => 'skills',
		'map_graphql_types_from_location_rules' => 0,
		'graphql_types'      => '',
		'fields'             => [
			[
				'key'                => 'field_6ae7b11a1b53a',
				'label'              => 'Chemical symbol',
				'name'               => 'chemical_symbol',
				'type'               => 'text',
				'required'           => 0,
				'default_value'      => 'Aa',
				'maxlength'          => 3,
				'allow_in_bindings'  => 0,
				'show_in_graphql'    => 1,
				'graphql_field_name' => 'chemicalSymbol',
				'graphql_non_null'   => 0,
			],
		],
		'location'           => [
			[
				[ 'param' => 'post_type', 'operator' => '==', 'value' => 'skill' ],
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

add_filter( 'acf/validate_value/key=field_pf2026_case_study_end_year', function ( $valid, $value ) {
	if ( true !== $valid || '' === $value || null === $value ) {
		return $valid;
	}
	$start = $_POST['acf']['field_pf2026_case_study_start_year'] ?? null;
	if ( is_numeric( $start ) && (int) $value < (int) $start ) {
		return 'End year must be the same as or later than Start year.';
	}
	return $valid;
}, 10, 2 );

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