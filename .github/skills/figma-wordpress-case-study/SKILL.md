---
name: figma-wordpress-case-study
description: "Use when populating, updating or syncing a portfolio case study in WordPress from a Figma frame, including Figma MCP text and images, WordPress REST API media uploads, ACF sidebar fields and frontend verification."
argument-hint: "Figma frame URL and case study title or slug"
---

# Figma to WordPress case study

Populate an existing case study from the requested Figma frame, including its text, images and sidebar. The WordPress backend and Next.js frontend are separate; use the WordPress API, not a local frontend route, to update content.

## 1. Inspect the source and existing case study

1. Extract the file key and node ID from the Figma URL. Use Figma MCP metadata and a screenshot to identify the relevant frame, then read the content nodes with design context or the appropriate Figma MCP inspection tool. Follow the Figma MCP's current skill prerequisites. Read the actual text and links, identify each image and its order, and distinguish main content from sidebar content. Do not invent missing copy or infer facts from a screenshot.
2. Confirm WordPress is reachable. In this Local site the backend is `http://pf2026.local` (check the current configuration if it differs). Discover the target post and a comparable existing case study:

   ```sh
   curl -fsS 'http://pf2026.local/wp-json/wp/v2/case_study?per_page=100&_fields=id,slug,title,content'
   ```

   Match title and slug before writing; never assume a remembered post ID. Read the current post and inspect a comparable case study's content and fields so existing information, links, status, featured image and unrelated metadata are not overwritten.
3. Check `frontend/components/ContentPanel/ContentPanel.js` and `frontend/components/PageSidebar/PageSidebar.js` if the integration has changed. The panel renders the post's `content` as the main column and `caseStudies.pageSidebar` as the sidebar; the existing CSS supplies the responsive two-column layout when a sidebar exists. Do not put an entire two-column layout into `content` or add inline layout styles.

## 2. Obtain assets and prepare content

- Obtain the actual images using the Figma MCP's current asset/export workflow. Use the screenshot for comparison, not as a substitute for individual assets. Check file types, dimensions, content and order. Figma asset URLs are temporary; never put them in WordPress content.
- Upload images through the WordPress media REST endpoint, `/wp-json/wp/v2/media`, with authenticated requests, correct MIME type and filename. Set meaningful alt text when appropriate. Use the returned attachment URLs/IDs; do not copy files directly into uploads and leave them unregistered.
- Prepare semantic HTML with paragraphs, headings, lists, links and images in the design's reading order. Preserve existing placeholder wording where present; do not invent facts. Use the existing panel and sidebar styling, not hardcoded Figma colours or bespoke column markup.
- The case-study ACF group exposes `subtitle`, `startYear`, `endYear` and `pageSidebar` through GraphQL, but is not currently exposed through standard REST. Confirm this against the current plugin configuration. Do not assume an empty REST `acf` response means the fields are empty: read them via GraphQL.

## 3. Authenticate and update safely

- Prefer an existing properly authorized WordPress application password. Do not guess credentials, read or print secrets, commit them, or send them to an unrelated service. Application passwords require HTTPS except for a trusted local development site.
- If no credential is available and local administrative access is authorized, the previously successful workflow created a **temporary** application password using Local's bundled PHP and WP-CLI, used it for authenticated REST requests, then revoked and verified its removal. Discover the current user, runtime, socket and paths rather than assuming them. On this installation the WP-CLI phar was under `/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar`; Local's PHP and MySQL socket were under `~/Library/Application Support/Local/`.
- WP-CLI operations are `user application-password create <user-id> <unique-name> --porcelain`, `user application-password list <user-id> --fields=uuid,name --format=json`, and `user application-password delete <user-id> <uuid> --yes`. Capture the created password privately in memory; use it for HTTP Basic authentication without displaying it in logs. In a `finally` cleanup, find the uniquely named credential, revoke it and verify it is absent. Report cleanup failure explicitly.
- **Localhost-only direct database access:** On localhost/development-only sites without working WP-CLI or auth, direct MySQL updates are acceptable as a last resort. Local by Flywheel stores MySQL socket at `~/Library/Application Support/Local/run/<hash>/mysql/mysqld.sock`. Use Local's bundled MySQL client (typically at `/Applications/Local.app/Contents/Resources/extraResources/lightning-services/mysql-8.4.0+N/bin/darwin-arm64/bin/mysql`) with socket path `-S` flag and database credentials from `wp-config.php`. Always escape content with proper SQL string literals or parameterized queries to prevent injection. Example:
  ```bash
  LOCAL_MYSQL="/Applications/Local.app/Contents/Resources/extraResources/lightning-services/mysql-8.4.0+2/bin/darwin-arm64/bin/mysql"
  SOCKET="$HOME/Library/Application Support/Local/run/HASH/mysql/mysqld.sock"
  $LOCAL_MYSQL -S "$SOCKET" -u root -proot database_name << EOF
  UPDATE wp_posts SET post_content = '...' WHERE ID = 7;
  EOF
  ```
  Never do this on production or shared infrastructure.
- Update only the intended post's supplied fields with authenticated `POST /wp-json/wp/v2/case_study/<id>` using a JSON payload, normally `content`. Upload media first. Preserve publication status unless a change is explicitly requested. Back up or capture the original content and field values before mutation, check HTTP errors, and do not claim success until readback.
- If required ACF fields cannot be written through the authorized API, explain the limitation and request approval for an appropriate supported WordPress/ACF update mechanism. Do not silently skip the sidebar, modify the database directly without documenting the reason, create an ad hoc unauthenticated/token endpoint, or alter plugin security/CORS to bypass authentication. Existing custom endpoints must not be assumed safe or necessary.

## 4. Verify the result

1. Read the updated post back from REST and compare text, links and media references with Figma. Inspect saved status and confirm unrelated fields were preserved.
2. Query the actual frontend GraphQL endpoint (normally `http://pf2026.local/graphql`) for the selected `caseStudy`, including `content` and `caseStudies { subtitle startYear endYear pageSidebar }`. Check both columns and image URLs. GraphQL/REST success alone does not establish that the frontend works.
3. Open the case-study panel in the frontend and check desktop and mobile layouts, text, image order, responsive image loading and sidebar. Investigate actual browser/network errors if it fails; do not assume CORS or change security settings without evidence.
4. Confirm temporary credentials are revoked and remove only temporary files created for the task. Report any missing assets, inaccessible field updates or verification limitations.
