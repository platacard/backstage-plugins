#!/usr/bin/env node

/* eslint-disable import/no-extraneous-dependencies */
/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Writes a changeset covering every PUBLIC workspace package after
 * `backstage-cli versions:bump`. Releases in this repo are driven entirely by
 * changesets, so without this a Backstage bump would update the dependency
 * versions but never publish the resulting plugin versions.
 *
 * Package manifests here use the Backstage yarn plugin's `backstage:^` ranges,
 * so a bump never touches the packages' package.json files — only
 * backstage.json and yarn.lock. We therefore can't diff package.json files to
 * find affected packages (they never change); instead, like
 * backstage/community-plugins, the changeset lists ALL public workspace
 * packages whenever backstage.json was bumped.
 *
 * Invoked by .github/workflows/backstage-version-bump.yaml after the bump runs.
 * Exits 0 writing nothing when backstage.json is unchanged (already on the
 * latest release).
 */

const { execFileSync } = require('child_process');
const { readFileSync, readdirSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

// Glob roots that hold workspace packages, mirroring package.json "workspaces".
const WORKSPACE_DIRS = ['packages', 'plugins'];

function bumpChangedBackstageVersion() {
  // Compare the working tree (post-bump, pre-commit) against HEAD.
  const out = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map(line => line.trim())
    .includes('backstage.json');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function publicWorkspacePackageNames() {
  const names = [];
  for (const dir of WORKSPACE_DIRS) {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      const manifest = join(process.cwd(), dir, entry, 'package.json');
      if (!existsSync(manifest)) {
        continue;
      }
      const pkg = readJson(manifest);
      if (pkg.private !== true && pkg.name) {
        names.push(pkg.name);
      }
    }
  }
  return names.sort();
}

function main() {
  if (!bumpChangedBackstageVersion()) {
    console.log('backstage.json is unchanged; skipping changeset.');
    return;
  }

  const publicNames = publicWorkspacePackageNames();

  if (publicNames.length === 0) {
    console.log('No public workspace packages found; skipping changeset.');
    return;
  }

  const backstageVersion = readJson(
    join(process.cwd(), 'backstage.json'),
  ).version;

  const frontmatter = publicNames.map(name => `'${name}': patch`).join('\n');

  const body = `Bumped Backstage dependencies to version \`${backstageVersion}\`.`;

  const contents = `---\n${frontmatter}\n---\n\n${body}\n`;

  // Fixed filename keeps re-runs idempotent: a second bump before merge
  // overwrites rather than piling up changesets.
  const target = join(process.cwd(), '.changeset', 'backstage-version-bump.md');
  writeFileSync(target, contents);

  console.log(
    `Wrote changeset for ${
      publicNames.length
    } package(s):\n  ${publicNames.join('\n  ')}`,
  );
}

main();
