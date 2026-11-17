# Production: Lightsail CMS and Vercel frontend

## What goes where

| Environment | WordPress | Frontend |
| --- | --- | --- |
| Development | Local: `http://pf2026.local` | Local Next.js dev server |
| Production | `https://cms.craighellinger.co.uk` | Vercel, using the production CMS |

Next.js talks to WordPress over GraphQL, not directly to its database.
Local and production have independent databases. Migration is a one-time copy;
subsequent code deployments never import a database or sync uploads.

The repo has no custom theme. Backend application code is the tracked
`pf2026-content` plugin. The local database currently selects the standard
`twentytwentyfive` theme, and local WordPress is 7.1.3. Install a compatible
WordPress version and that theme on production before importing the database.
WordPress core and standard themes are not deployed by this workflow.

## 1. One-time server prerequisites

The following layout is **manual setup**, not a workflow step:

```text
/var/www/portfolio/
  composer.json
  composer.lock
  app/public -> /var/www/html
  incoming/                   private staged builds
  backups/                    private database/code backups
/var/www/html/                 existing WordPress document root
```

The existing symlink is sufficient. Do not recreate it on every deployment.
Confirm the actual web-server document root is `/var/www/html`, not
`/var/www/portfolio`. Backups, incoming builds and Composer credentials must never
be accessible over HTTP.

SSH into Lightsail as `admin` and check:

```sh
php -v
php -m
composer --version
wp --info
rsync --version
command -v tar flock curl
readlink -f /var/www/portfolio/app/public
wp --path=/var/www/html core version
wp --path=/var/www/html theme list
```

Composer 2.5.5 meets this project's minimum. PHP CLI and web PHP should use the
same supported version/extensions (local validation used PHP 8.2). WP-CLI needs
database access and a MySQL/MariaDB client for export/import. Composer needs ZIP
extraction; EWWW needs compatible executable optimization tools. Install missing
utilities for the server's actual distribution; don't change the web PHP version
blindly. Install WP-CLI following its
[official instructions](https://make.wordpress.org/cli/handbook/guides/installing/).

The `admin` account needs write access to `/var/www/portfolio`, the six managed
plugin folders, `pf2026-content`, and WordPress's `.maintenance` file location.
The web PHP user needs read/execute access to plugin code and write access to
uploads/EWWW runtime files. Do not use world-writable permissions or run Composer
as root. The workflow preserves plugin executable bits for EWWW tools.

Keep `/var/www/portfolio/incoming` and `/var/www/portfolio/backups` private:

```sh
umask 077
mkdir -p /var/www/portfolio/incoming /var/www/portfolio/backups
chmod 700 /var/www/portfolio/incoming /var/www/portfolio/backups
```

Ensure `wp` and `composer` work in a **non-interactive SSH session**, not just an
interactive shell; use system PATH installations or configure the account's
non-interactive PATH. The workflow uses port 22, SSH user `admin`, and these fixed
paths. It never uses sudo.

## 2. First plugin installation (before importing local data)

Back up the new server's existing database, configuration, uploads, and plugin
folders first, even if the installation is disposable. Take a Lightsail snapshot
as a broader recovery point. Use private backup locations, never the web root.

From the local repository root, copy only the manifests and custom plugin
(replace `YOUR_STATIC_IP` with the verified SSH destination):

```sh
rsync -av composer.json composer.lock admin@YOUR_STATIC_IP:/var/www/portfolio/
rsync -av app/public/wp-content/plugins/pf2026-content/ \
  admin@YOUR_STATIC_IP:/var/www/html/wp-content/plugins/pf2026-content/
```

On Lightsail:

```sh
cd /var/www/portfolio
umask 022
composer validate --strict --no-check-all
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
composer check-platform-reqs --no-dev
wp --path=/var/www/html plugin list
```

If existing unmanaged directories block the first Composer install, move only
those individual plugin directories into a private backup, then retry. Do not
delete the entire plugins directory, replace `wp-config.php`, or overwrite
uploads. Confirm WordPress is functional before continuing.

For ongoing deployments, Composer builds in an isolated incoming directory,
then the script synchronizes the installed plugin code into WordPress. This avoids
Composer's unmanaged-directory problem and keeps the existing symlink layout.

## 3. One-time database and media migration

**This replaces the production database, including users, passwords and settings.**
It has deliberately not been automated or executed. Local remains unchanged.
Schedule a quiet window: stop content editing, scheduled jobs and external writes
on the target until verification is complete.

### Export from Local

Open Local's **Site shell** for this site so PHP, WP-CLI and MySQL use Local's
runtime. Store the dump in a private directory outside the repo and web root:

```sh
umask 077
mkdir -p "$HOME/pf2026-migration"
wp db check
wp db export "$HOME/pf2026-migration/local.sql" --single-transaction
wp db prefix
wp option get home
wp option get siteurl
```

The current local prefix is `wp_`; verify it at export time. Confirm production's
`$table_prefix` matches **before import**, otherwise WordPress will query the
wrong tables. Adjust production configuration manually if needed; retain its
database credentials, salts, HTTPS settings, and other host-specific values.

From your Mac, securely transfer the dump and all media, including generated
thumbnails, WebP siblings, SVGs and the CV PDF:

```sh
scp "$HOME/pf2026-migration/local.sql" admin@YOUR_STATIC_IP:/var/www/portfolio/backups/local-import.sql
rsync -av app/public/wp-content/uploads/ admin@YOUR_STATIC_IP:/var/www/html/wp-content/uploads/
```

Do not sync `wp-content/ewww` from macOS: its executables may be incompatible
with Linux. Let the server's EWWW installation provision compatible tools.

### Back up and import on Lightsail

Choose a unique backup filename; do not overwrite an earlier recovery point.
If the site is already in maintenance mode, investigate before proceeding.

```sh
umask 077
wp --path=/var/www/html maintenance-mode activate
wp --path=/var/www/html db export /var/www/portfolio/backups/before-import.sql --single-transaction
wp --path=/var/www/html --skip-plugins --skip-themes db import /var/www/portfolio/backups/local-import.sql
```

Keep maintenance active through verification (WordPress's native maintenance
marker expires after about ten minutes; renew it if needed). In a lengthy
migration, use a web-server maintenance rule to reliably block public access.

WP-CLI's serialized-data-aware replacement is essential for ACF/options.
Run a dry run, review counts/tables, then the actual command:

```sh
wp --path=/var/www/html --skip-plugins --skip-themes search-replace \
  'http://pf2026.local' 'https://cms.craighellinger.co.uk' \
  --all-tables-with-prefix --skip-columns=guid --precise --dry-run
wp --path=/var/www/html --skip-plugins --skip-themes search-replace \
  'http://pf2026.local' 'https://cms.craighellinger.co.uk' \
  --all-tables-with-prefix --skip-columns=guid --precise
wp --path=/var/www/html --skip-plugins --skip-themes option update home 'https://cms.craighellinger.co.uk'
wp --path=/var/www/html --skip-plugins --skip-themes option update siteurl 'https://cms.craighellinger.co.uk'
```

Check for `https://pf2026.local` and protocol-relative `//pf2026.local` values as
well; dry-run and replace those separately if present. Do not globally replace
the bare hostname or use SQL text replacement on serialized data. GUIDs are
identifiers, not public media URLs, and intentionally remain unchanged.

The import restores local users/password hashes. Use a known authorized local
admin account, or reset the intended production admin password securely via
WP-CLI's `--prompt=user_pass` rather than putting it in shell history. Remove
unneeded development users/application passwords, and rotate production-only
secrets in the appropriate settings after import.

### Restore production-specific settings and verify

- Check `WP_HOME`/`WP_SITEURL` overrides in production configuration if option
  updates don't affect the reported URLs. Keep HTTPS correct behind Lightsail's
  proxy/load balancer; do not disable certificate checks.
- Ensure `twentytwentyfive` exists. Import preserves the selected theme.
- Activate the six Composer plugins before `pf2026-content` if necessary:

  ```sh
  wp --path=/var/www/html plugin activate advanced-custom-fields ewww-image-optimizer faustwp safe-svg wp-graphql wpgraphql-acf
  wp --path=/var/www/html plugin activate pf2026-content
  wp --path=/var/www/html db check
  wp --path=/var/www/html cache flush
  wp --path=/var/www/html rewrite flush
  ```

- In Faust settings, replace the local frontend URL with the production Vercel
  frontend URL/custom domain. Use the production Faust secret in Vercel.
- Review upload-path options and EWWW settings for absolute macOS paths. Preserve
  Media Library attachment IDs and `pf2026_cv_attachment_id`.
- Verify media read permissions and EWWW's Linux tools. Follow the
  [media configuration guide](../frontend/README.md#image-delivery) if previews
  or WebP copies are missing; back up before bulk regeneration.
- Disable development/debug output and unwanted outbound mail/integrations.
- List plugins and compare all seven versions with the
  [audited baseline](../README.md#audited-baseline).
- Query GraphQL using WP-CLI while public HTTP is in maintenance:

  ```sh
  wp --path=/var/www/html eval '$r = graphql(["query" => "{ caseStudies(first: 1) { nodes { databaseId title content caseStudies { pageSidebar redactPanelImages } } } cvUrl }"]); echo wp_json_encode($r, JSON_PRETTY_PRINT);'
  ```

  Confirm there are no `errors`, content/sidebar values are present, upload/CV
  URLs use the CMS hostname, and corresponding files exist.

Only after these checks:

```sh
wp --path=/var/www/html maintenance-mode deactivate
curl -fsS 'https://cms.craighellinger.co.uk/wp-json/' -o /dev/null
curl -fsS 'https://cms.craighellinger.co.uk/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ caseStudies(first: 1) { nodes { databaseId title } } cvUrl }"}'
```

HTTP 200 alone isn't sufficient: check GraphQL's `errors` and returned URLs.
Then check the Vercel site manually: case-study cards, both expanded columns,
blurred/unlocked images, password flow, SVGs and CV download. Do not send real
visitor traffic until both halves work. Delete only the named transferred import
dump after success; retain encrypted/access-controlled backups under your chosen
retention policy. Dumps contain user data and secrets; never commit them.

## 4. Enable GitHub Actions backend deployment

Create a GitHub **production environment**, preferably with required approval
and deployment branches restricted to `main`. Configure its secrets:

| Secret | Value |
| --- | --- |
| `LIGHTSAIL_HOST` | Static IP or SSH hostname (no scheme, port or username) |
| `LIGHTSAIL_SSH_KEY` | Dedicated deployment private key |
| `LIGHTSAIL_KNOWN_HOSTS` | Verified SSH known_hosts line(s) for that exact host |

Generate a dedicated Ed25519 key outside the repo, install its public key into
`/home/admin/.ssh/authorized_keys`, and keep the private key only in GitHub's
secret store. Disable forwarding/PTY for that key using the `restrict`
authorized_keys option if the server supports it. This key still permits remote
commands as `admin`; protect it accordingly. Never paste the private key in chat.

Get the server host-key fingerprint from the trusted Lightsail console:

```sh
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Obtain its known_hosts line on your Mac (`ssh-keyscan -t ed25519 YOUR_STATIC_IP`),
compare the fingerprint via `ssh-keygen -lf`, and only then save that line as
`LIGHTSAIL_KNOWN_HOSTS`. Do not blindly trust a key scanned during deployment.
Allow port 22 from the chosen GitHub runner network; standard hosted runner IPs
change. For restricted firewalls, use a runner with fixed egress or an appropriate
private connection rather than assuming Lightsail browser-SSH access suffices.

Run **Deploy WordPress backend** manually on `main` for the first deployment,
after bootstrap and migration. Later pushes to `main` trigger it only when
Composer files, the custom plugin, deployment script or workflow change.
Frontend-only changes don't deploy the backend.

The workflow runs isolated deployment tests before opening SSH. To run them
locally without contacting production:

```sh
node --test scripts/tests/deploy-backend.test.mjs
```

These need Node.js, Bash, PHP CLI, rsync and tar. If the system PHP is broken,
set `DEPLOY_TEST_PHP` to Local's absolute PHP executable path. Tests use temporary
WordPress directories and stub external commands; they do not prove that the
real server's credentials, database or permissions are configured correctly.

The workflow:

1. Verifies the pinned SSH host key.
2. Uploads only the two Composer files, custom plugin, and deployment script into
   a private, unique incoming directory.
3. Locks deployments with `flock`, checks production `siteurl`, installs from
   `composer.lock`, and validates platform requirements **before downtime**.
4. Enables maintenance, exports the live database, and archives live plugins.
5. Deactivates dependencies removed from the previous production lockfile and
   moves their folders into the private backup. Synchronizes each current managed
   plugin directory with scoped `rsync --delete` (including executable
   permissions), then updates the root manifests.
6. Checks GraphQL/ACF schema through WordPress, leaves maintenance, and checks
   public REST availability. Failed commands fail the workflow.

No theme, core, uploads, configuration, database import, or local secrets are
deployed. Unmanaged server plugins are not automatically deleted: review
`wp plugin list` at bootstrap and remove unwanted ones deliberately. After that,
the previous production lockfile identifies Composer dependencies to remove;
their old files remain in the private backup, not the live plugins directory.

Disable automatic/dashboard updates for managed plugins to prevent version drift.
For production, `DISALLOW_FILE_MODS` in `wp-config.php` can enforce that policy
(it also blocks dashboard core/theme/plugin installs and updates).
The workflow does not modify production configuration.

### Failures, rollback and retention

Failures before maintenance leave the live code untouched. Failures after it
starts intentionally do not reopen a potentially mixed plugin installation.
WordPress normally expires native maintenance after ten minutes, so investigate
promptly and use a server maintenance rule for a prolonged incident. Do not
blindly rerun over a partial deployment.

Backups are at `/var/www/portfolio/backups/RUN-ATTEMPT/`. To roll back, keep
maintenance active, move the affected live plugin folders into a separate private
quarantine directory, and restore `plugins.tar.gz` into `wp-content` with the
correct ownership and readable/executable modes. Restore the previous root
manifests if present and reactivate any dependencies removed by the failed
deployment. Simple archive extraction over existing files does **not**
remove new files, so do not use that as a complete rollback.

The SQL backup is a separate recovery option: plugin loading may have run schema
upgrades. Restore it only after considering any newer production writes; it
replaces data. This workflow does not automate destructive database rollback.
Verify WordPress/GraphQL before removing maintenance.

Successful and failed incoming directories/backups are retained for inspection.
Set a disk-space alert and an explicit retention/backup policy; remove only
reviewed individual release directories, not the whole deployment root.

## 5. Vercel frontend, independent of Lightsail

Import this GitHub repo into Vercel, use Next.js detection, and set **Root
Directory** to `frontend`. Configure production environment variables:

| Variable | Production value |
| --- | --- |
| `NEXT_PUBLIC_WORDPRESS_URL` | `https://cms.craighellinger.co.uk` |
| `FAUST_SECRET_KEY` | Secret from the production Faust WordPress settings |
| `IMAGE_UNLOCK_PASSWORD` | Shared portfolio password, server-only |
| `IMAGE_UNLOCK_COOKIE_SECRET` | Independently generated random secret, 32+ characters |

Keep Local's URL and development secrets in ignored `frontend/.env.local`.
Do not replace local values with production ones or connect Local WordPress to
the production database. The image allowlist already derives from
`NEXT_PUBLIC_WORDPRESS_URL`, so no hardcoded host change is necessary.

Scope Vercel's environment variables intentionally: preview deployments also
need a reachable CMS, and should not receive production secrets by accident.
Don't assume Local is reachable from Vercel. Use the Vercel setting to skip
deployments when the root directory has not changed; confirm a backend-only push
is skipped. Leave frontend builds on Vercel rather than GitHub Actions.

For schema changes, deploy backward-compatible backend additions first, then
frontend consumers. The two integrations do not guarantee deployment ordering.
If required later, coordinate them with a Vercel deploy hook after backend
success rather than adding production database migration to every deploy.
