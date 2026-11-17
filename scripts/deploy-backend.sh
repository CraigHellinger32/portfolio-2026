  #!/usr/bin/env bash
  set -euo pipefail
  umask 077

  root=/var/www/portfolio
  wordpress=/var/www/html
  incoming=${1:?Usage: bash deploy-backend.sh /var/www/portfolio/incoming/RUN-ATTEMPT}

  fail() {
    printf 'Deployment failed: %s\n' "$*" >&2
    exit 1
  }

  [[ "$incoming" =~ ^/var/www/portfolio/incoming/[0-9]+-[0-9]+$ ]] ||
    fail "Unexpected incoming release path"
  for tool in php composer wp rsync tar flock curl; do
    command -v "$tool" >/dev/null || fail "Required command is missing: $tool"
  done
  [[ -L "$root/app/public" ]] || fail "Create the app/public symlink manually first"
  [[ "$(cd "$root/app/public" && pwd -P)" == "$(cd "$wordpress" && pwd -P)" ]] ||
    fail "app/public must resolve to the WordPress installation"
  [[ -f "$incoming/composer.json" && -f "$incoming/composer.lock" ]] ||
    fail "Release is missing Composer files"
  [[ -f "$incoming/app/public/wp-content/plugins/pf2026-content/pf2026-content.php" ]] ||
    fail "Release is missing the custom plugin"
  [[ ! -L "$incoming/app/public" ]] || fail "Incoming release must be an isolated directory"

  exec 9>"$root/deploy.lock"
  flock -n 9 || fail "Another backend deployment is running"

  wp_live() {
    wp --path="$wordpress" "$@"
  }

  wp_live --skip-plugins --skip-themes core is-installed
  [[ "$(wp_live --skip-plugins --skip-themes option get siteurl)" == "https://cms.craighellinger.co.uk" ]] ||
    fail "WordPress siteurl does not match the production CMS"
  if wp_live --skip-plugins --skip-themes maintenance-mode is-active; then
    fail "WordPress is already in maintenance mode; resolve the previous operation first"
  fi

  cd "$incoming"
  composer validate --strict --no-check-all
  composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
  composer check-platform-reqs --no-dev

  php /dev/stdin "$root/composer.lock" <<'PHP' > "$incoming/managed-plugins.txt"
<?php
function plugin_names(string $file): array {
    $lock = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    $names = [];
    foreach ($lock['packages'] as $package) {
        if ($package['type'] !== 'wordpress-plugin') {
            continue;
        }
        $name = basename($package['name']);
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $name) || $name === 'pf2026-content') {
            throw new RuntimeException('Unexpected plugin package: ' . $package['name']);
        }
        $names[] = $name;
    }
    return $names;
}
$current = plugin_names('composer.lock');
$previous = is_file($argv[1]) ? plugin_names($argv[1]) : [];
$removed = array_diff($previous, $current);
file_put_contents('removed-plugins.txt', implode('', array_map(fn($name) => "$name\n", $removed)));
echo implode("\n", [...$current, 'pf2026-content']), "\n";
PHP

  while IFS= read -r plugin; do
    [[ -d "$incoming/app/public/wp-content/plugins/$plugin" ]] ||
      fail "Installed plugin directory is missing: $plugin"
    [[ ! -L "$wordpress/wp-content/plugins/$plugin" ]] ||
      fail "Refusing to overwrite a symlinked live plugin: $plugin"
  done < "$incoming/managed-plugins.txt"
  while IFS= read -r plugin; do
    [[ ! -L "$wordpress/wp-content/plugins/$plugin" ]] ||
      fail "Refusing to remove a symlinked live plugin: $plugin"
  done < "$incoming/removed-plugins.txt"

  backup="$root/backups/$(basename "$incoming")"
  mkdir -p "$root/backups"
  mkdir "$backup"
  maintenance_started=false
  on_exit() {
    status=$?
    if (( status != 0 )); then
      printf 'Release failed. Backup directory: %s\n' "$backup" >&2
      if [[ "$maintenance_started" == true ]]; then
        printf 'Maintenance was NOT deactivated. Inspect/restore before reopening the site. WordPress normally expires maintenance after 10 minutes.\n' >&2
      fi
    fi
  }
  trap on_exit EXIT

  wp_live --skip-plugins --skip-themes maintenance-mode activate
  maintenance_started=true
  wp_live --skip-plugins --skip-themes db export "$backup/database.sql" --single-transaction
  tar -czf "$backup/plugins.tar.gz" -C "$wordpress/wp-content" plugins
  for file in composer.json composer.lock; do
    if [[ -f "$root/$file" ]]; then
      cp "$root/$file" "$backup/$file"
    fi
  done

  while IFS= read -r plugin; do
    if [[ -d "$wordpress/wp-content/plugins/$plugin" ]]; then
      wp_live plugin deactivate "$plugin"
      mv "$wordpress/wp-content/plugins/$plugin" "$backup/removed-$plugin"
    fi
  done < "$incoming/removed-plugins.txt"

  while IFS= read -r plugin; do
    mkdir -p "$wordpress/wp-content/plugins/$plugin"
    rsync -rlpt --delete --chmod=Du=rwx,Dgo=rx,Fu=rwX,Fgo=rX \
      "$incoming/app/public/wp-content/plugins/$plugin/" \
      "$wordpress/wp-content/plugins/$plugin/"
  done < "$incoming/managed-plugins.txt"
  cp "$incoming/composer.json" "$incoming/composer.lock" "$root/"

  wp_live eval '
  if (!function_exists("graphql")) {
      WP_CLI::error("WPGraphQL is not active. Complete first-time plugin activation.");
  }
  $result = graphql(["query" => "{ caseStudies(first: 1) { nodes { databaseId content caseStudies { pageSidebar redactPanelImages } } } }"]);
  if (!empty($result["errors"]) || !isset($result["data"]["caseStudies"]["nodes"])) {
      WP_CLI::error(wp_json_encode($result));
  }
  WP_CLI::success("GraphQL and custom ACF schema are available.");
  '
  wp_live --skip-plugins --skip-themes maintenance-mode deactivate
  maintenance_started=false
  curl --fail --silent --show-error --max-time 60 \
    'https://cms.craighellinger.co.uk/wp-json/' --output /dev/null
  printf 'Backend deployment complete. Backup: %s\n' "$backup"
