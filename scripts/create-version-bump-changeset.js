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
 * Writes a changeset for every PUBLIC workspace package whose package.json was
 * modified by `backstage-cli versions:bump`. Releases in this repo are driven
 * entirely by changesets, so without this a Backstage bump would update the
 * dependency ranges but never publish the resulting plugin versions.
 *
 * Invoked by .github/workflows/backstage-version-bump.yaml after the bump runs.
 * Exits 0 writing nothing when no public package changed (changeset-less commit,
 * which the release pipeline correctly ignores).
 */

const { execFileSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

// Glob roots that hold workspace packages, mirroring package.json "workspaces".
const WORKSPACE_DIRS = ['packages', 'plugins'];

function changedPackageJsonPaths() {
  // Compare the working tree (post-bump, pre-commit) against HEAD.
  const out = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .map(line => line.trim())
    .filter(
      path =>
        path.endsWith('/package.json') &&
        WORKSPACE_DIRS.some(dir => path.startsWith(`${dir}/`)),
    );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  const changed = changedPackageJsonPaths();

  const publicNames = changed
    .map(path => readJson(join(process.cwd(), path)))
    .filter(pkg => pkg.private !== true && pkg.name)
    .map(pkg => pkg.name)
    .sort();

  if (publicNames.length === 0) {
    console.log('No public packages changed by the bump; skipping changeset.');
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
