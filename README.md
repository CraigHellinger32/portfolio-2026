# portfolio-2026
Portfolio website

## Production deployment

The WordPress CMS runs on Lightsail at `https://cms.craighellinger.co.uk`;
the Next.js frontend deploys separately to Vercel. Local development continues
to use Local. See [production setup and one-time migration](docs/deployment.md)
before enabling the backend GitHub Actions workflow.

## WordPress plugins

Third-party plugins are installed with Composer; their files are not tracked in
Git. The custom `pf2026-content` plugin stays tracked under
`app/public/wp-content/plugins/`. No Bedrock migration is required.

### Audited baseline

All seven plugins were active at migration. Versions are intentionally pinned to
preserve the existing installation; this migration does not upgrade plugins.

| Plugin directory | Version | Source |
| --- | --- | --- |
| `advanced-custom-fields` | 6.8.10 | Official ACF Composer repository |
| `ewww-image-optimizer` | 8.9.1 | WPackagist |
| `faustwp` | 1.9.1 | WPackagist |
| `safe-svg` | 2.5.2 | WPackagist |
| `wp-graphql` | 2.25.0 | WPackagist |
| `wpgraphql-acf` | 3.0.0 | WPackagist |
| `pf2026-content` | 1.0.0 | This repository |

The five WPackagist distributions matched the local plugin files exactly.
The official ACF distribution has the same version and application files, plus
an `Update URI` header and its upstream `includes/Updater/` integration, absent
from the previous local copy. Existing local files were left untouched; a fresh
Composer install uses that official distribution. No local content customizations
were found in the third-party plugin code.

### Install locally or during deployment

Run from the repository root with Composer 2.2+ and a working PHP CLI
(PHP 7.4 minimum; tested with PHP 8.2). The installed plugin baseline requires
WordPress 6.8 or later. ZIP extraction needs `unzip`, `7z`, or PHP's ZIP extension.

```sh
composer validate --strict --no-check-all
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
composer check-platform-reqs --no-dev
```

`--no-check-all` permits the intentional exact version constraints. Commit both
`composer.json` and `composer.lock`; deploy with **install**, not **update**.
Only the explicitly allowed `composer/installers` plugin runs. It installs
WordPress plugins into `app/public/wp-content/plugins/`; its own files live in
the ignored root `vendor/` directory. No ACF license key is needed for this free
edition. Never commit Composer credentials (`auth.json` is ignored).

On Local for macOS, if the system PHP is unavailable, prefix Composer with the
PHP binary bundled with Local:

```sh
"/path/to/Local/php/bin/php" /usr/local/bin/composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
```

The first install in an existing checkout may ask to replace unmanaged plugin
directories. Back them up first if they have local edits. Do not edit third-party
code directly: put portfolio functionality in `pf2026-content`.

### Deployment boundaries

Build/install into a fresh release directory before switching production traffic,
rather than replacing active plugin folders in place. Include the tracked custom
plugin and Composer-installed plugin folders in the deployed artifact. Root
`vendor/` is build tooling for these packages, not a WordPress bootstrap dependency.

Composer installs code only. WordPress core, configuration/secrets, the database,
uploads, web-server configuration, and the Next.js frontend still need their own
deployment setup. See [frontend setup](frontend/README.md) for frontend and media
configuration. Do not point the web-server document root at the repository root;
WordPress's document root is `app/public`.

An existing database retains plugin activation and settings. On a new database,
activate the dependencies before the custom plugin:

```sh
wp --path=app/public plugin activate advanced-custom-fields ewww-image-optimizer faustwp safe-svg wp-graphql wpgraphql-acf
wp --path=app/public plugin activate pf2026-content
```

Disable WordPress automatic plugin updates for Composer-managed plugins and
deploy updates through the lockfile. A production-only
`define( 'DISALLOW_FILE_MODS', true );` in `wp-config.php` can enforce this, but
also disables dashboard installation/editing/updating of themes and plugins.
Keep that deployment policy out of local development configuration.

EWWW's generated optimizer binaries under `wp-content/ewww/` are separate from its
plugin package and are not changed by this migration. On the target server,
verify OS-compatible EWWW tools, execution permissions, writable media paths, and
WebP conversion; Composer alone does not provision these or regenerate media.

### Updating or adding plugins

Make changes locally or in a staging environment, never by running an unrestricted
`composer update` on production. For example, replacing `X.Y.Z` with the reviewed
release:

```sh
composer require wpackagist-plugin/wp-graphql:X.Y.Z --no-update
composer update wpackagist-plugin/wp-graphql --with-dependencies
composer validate --strict --no-check-all
```

For ACF use `wpengine/advanced-custom-fields`, not a WordPress.org alternative.
For another WordPress.org plugin, use `composer require
wpackagist-plugin/PLUGIN-SLUG:X.Y.Z`. Review release notes and the lockfile diff,
back up the database, and test WordPress, GraphQL/ACF, the frontend, and media
handling before committing the manifest and lockfile. Composer advisory results
do not replace checking upstream WordPress plugin notices.

Removing plugin files from tracking does not erase their previous Git history.
Local plugin files remain available and ignored; only the custom plugin stays
version-controlled.
