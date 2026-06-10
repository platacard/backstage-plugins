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

const { Octokit } = require('@octokit/rest');

const [TAG_NAME, BOOL_CREATE_RELEASE] = process.argv.slice(2);

if (!BOOL_CREATE_RELEASE) {
  console.log(
    '\nRunning script in Dry Run mode. It will output details, will create a draft release but will NOT publish it.',
  );
}

const GH_OWNER = 'Platacard';
const GH_REPO = 'backstage-plugins';
// Extract the PR number from either a merge commit
// ("Merge pull request #123 from ...") or a squash/rebase commit
// ("Some title (#123)"), so release notes work regardless of merge strategy.
const PR_NUMBER_PATTERNS = [
  /^Merge pull request #(?<prNumber>[0-9]+) from/,
  /\(#(?<prNumber>[0-9]+)\)/,
];
// changesets/action opens its PR from the `changeset-release/<baseBranch>`
// branch. We detect changeset releases via the PR head ref (robust to
// merge/squash/rebase) to strip the boilerplate header changesets prepends.
const CHANGESET_RELEASE_BRANCH = 'changeset-release/main';

// Initialize a GitHub client
const { GITHUB_TOKEN } = process.env;
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Get the message of the commit responsible for a tag
async function getCommitMessageUsingTagName(tagName) {
  // Get the tag SHA using the provided tag name
  const refData = await octokit.git.getRef({
    owner: GH_OWNER,
    repo: GH_REPO,
    ref: `tags/${tagName}`,
  });
  if (refData.status !== 200) {
    console.error('refData:');
    console.error(refData);
    throw new Error(
      'Something went wrong when getting the tag SHA using tag name',
    );
  }
  const tagSha = refData.data.object.sha;
  console.log(`SHA for the tag ${TAG_NAME} is ${tagSha}`);

  // Get the commit SHA using the tag SHA
  const tagData = await octokit.git.getTag({
    owner: GH_OWNER,
    repo: GH_REPO,
    tag_sha: tagSha,
  });
  if (tagData.status !== 200) {
    console.error('tagData:');
    console.error(tagData);
    throw new Error(
      'Something went wrong when getting the commit SHA using tag SHA',
    );
  }
  const commitSha = tagData.data.object.sha;

  // Get the commit message using the commit SHA
  const commitData = await octokit.git.getCommit({
    owner: GH_OWNER,
    repo: GH_REPO,
    commit_sha: commitSha,
  });
  if (commitData.status !== 200) {
    console.error('commitData:');
    console.error(commitData);
    throw new Error(
      'Something went wrong when getting the commit message using commit SHA',
    );
  }

  return commitData.data.message;
}

// Resolve the PR behind the tagged commit and derive the release description
// from its body.
async function getReleaseDescriptionFromCommitMessage(commitMessage) {
  let prNumber;
  for (const pattern of PR_NUMBER_PATTERNS) {
    const match = commitMessage.match(pattern);
    if (match) {
      prNumber = match.groups.prNumber;
      break;
    }
  }
  if (!prNumber) {
    throw new Error(
      `Could not find a PR number in commit message: ${commitMessage}`,
    );
  }

  const { data } = await octokit.pulls.get({
    owner: GH_OWNER,
    repo: GH_REPO,
    pull_number: prNumber,
  });

  // changesets prepends a boilerplate header to the Version Packages PR body;
  // strip it for changeset releases (detected via the PR's source branch).
  const body = data.body ?? '';
  const isChangesetRelease = data.head.ref === CHANGESET_RELEASE_BRANCH;
  if (isChangesetRelease) {
    return body.split('\n').slice(3).join('\n');
  }

  return body;
}

// Create Release on GitHub.
async function createRelease(releaseDescription) {
  // Create draft release if BOOL_CREATE_RELEASE is undefined
  // Publish release if BOOL_CREATE_RELEASE is not undefined
  const boolCreateDraft = !BOOL_CREATE_RELEASE;

  const releaseResponse = await octokit.repos.createRelease({
    owner: GH_OWNER,
    repo: GH_REPO,
    tag_name: TAG_NAME,
    name: TAG_NAME,
    body: releaseDescription,
    draft: boolCreateDraft,
    prerelease: false,
  });

  if (releaseResponse.status === 201) {
    if (boolCreateDraft) {
      console.log('Created draft release! Click Publish to notify users.');
    } else {
      console.log('Published release!');
    }
    console.log(releaseResponse.data.html_url);
  } else {
    console.error(releaseResponse);
    throw new Error('Something went wrong when creating the release.');
  }
}

async function main() {
  const commitMessage = await getCommitMessageUsingTagName(TAG_NAME);
  const releaseDescription =
    await getReleaseDescriptionFromCommitMessage(commitMessage);

  await createRelease(releaseDescription);
}

main().catch(error => {
  console.error(error.stack);
  process.exit(1);
});
