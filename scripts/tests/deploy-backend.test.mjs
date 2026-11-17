import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  rmSync, statSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(new URL("../deploy-backend.sh", import.meta.url), "utf8");

function fixture(t, failure = "") {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-deploy-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const root = join(dir, "portfolio");
  const wordpress = join(dir, "wordpress");
  const incoming = join(root, "incoming/123-1");
  const bin = join(dir, "bin");
  const plugins = join(wordpress, "wp-content/plugins");
  const staged = join(incoming, "app/public/wp-content/plugins");
  const write = (file, value, mode = 0o644) => {
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, value);
    chmodSync(file, mode);
  };
  mkdirSync(join(root, "app"), { recursive: true });
  mkdirSync(plugins, { recursive: true });
  mkdirSync(bin);
  symlinkSync(wordpress, join(root, "app/public"));
  write(join(incoming, "composer.json"), "{}");
  write(join(incoming, "composer.lock"), JSON.stringify({
    packages: [{ name: "wpackagist-plugin/example", type: "wordpress-plugin" }],
  }));
  write(join(root, "composer.lock"), JSON.stringify({
    packages: [
      { name: "wpackagist-plugin/example", type: "wordpress-plugin" },
      { name: "wpackagist-plugin/retired", type: "wordpress-plugin" },
    ],
  }));
  write(join(plugins, "example/stale.php"), "old");
  write(join(plugins, "retired/plugin.php"), "retired");
  write(join(plugins, "unmanaged/plugin.php"), "unmanaged");
  write(join(wordpress, "wp-content/uploads/keep.jpg"), "media");
  write(join(staged, "example/plugin.php"), "new");
  write(join(staged, "example/encoder"), "binary", 0o755);
  write(join(staged, "pf2026-content/pf2026-content.php"), "custom");
  write(join(dir, "deploy.sh"), source
    .replaceAll("/var/www/portfolio", root)
    .replaceAll("/var/www/html", wordpress));
  const command = (name, body) => write(join(bin, name), `#!/bin/bash\nset -eu\n${body}\n`, 0o755);
  command("composer", '[[ "$FAILURE" != composer ]]');
  command("flock", "exit 0");
  command("curl", `
if [[ "$FAILURE" == http ]]; then
  printf 'curl: (22) The requested URL returned error: 404\\n' >&2
  exit 22
fi`);
  command("wp", `
printf '%s\\n' "$*" >> "$TEST_DIR/wp.log"
case "$*" in
  *"option get siteurl") echo https://cms.craighellinger.co.uk ;;
  *"maintenance-mode is-active") test -f "$TEST_DIR/maintenance" ;;
  *"maintenance-mode activate") touch "$TEST_DIR/maintenance" ;;
  *"maintenance-mode deactivate") rm "$TEST_DIR/maintenance" ;;
  *"db export"*)
    if [[ "$FAILURE" == backup ]]; then exit 1; fi
    for arg in "$@"; do
      case "$arg" in *.sql) printf 'backup' > "$arg";; esac
    done ;;
  *"eval"*) [[ "$FAILURE" != schema ]] ;;
esac`);
  if (process.env.DEPLOY_TEST_PHP) {
    symlinkSync(process.env.DEPLOY_TEST_PHP, join(bin, "php"));
  }
  const run = (path = incoming) => spawnSync("bash", [join(dir, "deploy.sh"), path], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAILURE: failure, TEST_DIR: dir },
  });
  return { dir, root, incoming, plugins, wordpress, run };
}

test("deploys exact plugin files, preserves executable tools/media, and backs up retired dependencies", (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(f.plugins, "example/plugin.php"), "utf8"), "new");
  assert.equal(existsSync(join(f.plugins, "example/stale.php")), false);
  assert.ok(statSync(join(f.plugins, "example/encoder")).mode & 0o111);
  assert.equal(statSync(join(f.plugins, "example/plugin.php")).mode & 0o777, 0o644);
  assert.equal(statSync(join(f.plugins, "example")).mode & 0o777, 0o755);
  assert.equal(existsSync(join(f.plugins, "retired")), false);
  assert.ok(existsSync(join(f.root, "backups/123-1/removed-retired/plugin.php")));
  assert.ok(existsSync(join(f.root, "backups/123-1/plugins.tar.gz")));
  assert.equal(readFileSync(join(f.root, "backups/123-1/database.sql"), "utf8"), "backup");
  assert.equal(readFileSync(join(f.plugins, "unmanaged/plugin.php"), "utf8"), "unmanaged");
  assert.equal(readFileSync(join(f.wordpress, "wp-content/uploads/keep.jpg"), "utf8"), "media");
  assert.equal(existsSync(join(f.dir, "maintenance")), false);
});

test("Composer failure leaves live code untouched and never enables maintenance", (t) => {
  const f = fixture(t, "composer");
  assert.notEqual(f.run().status, 0);
  assert.ok(existsSync(join(f.plugins, "example/stale.php")));
  assert.equal(existsSync(join(f.dir, "maintenance")), false);
  assert.equal(existsSync(join(f.root, "backups")), false);
});

test("backup failure stops before modifying plugins and reports maintenance state", (t) => {
  const f = fixture(t, "backup");
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.ok(existsSync(join(f.plugins, "example/stale.php")));
  assert.ok(existsSync(join(f.dir, "maintenance")));
  assert.match(result.stderr, /Maintenance was NOT deactivated/);
});

test("schema failure does not reopen a broken deployment", (t) => {
  const f = fixture(t, "schema");
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.ok(existsSync(join(f.plugins, "example/plugin.php")));
  assert.ok(existsSync(join(f.dir, "maintenance")));
  assert.match(result.stderr, /Maintenance was NOT deactivated/);
});

test("HTTP failure reports that code is live and points to rewrite diagnostics", (t) => {
  const f = fixture(t, "http");
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.ok(existsSync(join(f.plugins, "example/plugin.php")));
  assert.equal(existsSync(join(f.dir, "maintenance")), false);
  assert.match(result.stderr, /Public REST check failed after maintenance was deactivated/);
  assert.match(result.stderr, /deployed code is already live/);
  assert.match(result.stderr, /web-server rewrite configuration/);
  assert.doesNotMatch(result.stderr, /Maintenance was NOT deactivated/);
  assert.doesNotMatch(result.stdout, /Backend deployment complete/);
});

test("rejects unexpected release paths before touching WordPress", (t) => {
  const f = fixture(t);
  const result = f.run(`${f.incoming}/../../`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unexpected incoming release path/);
  assert.equal(existsSync(join(f.dir, "wp.log")), false);
});
