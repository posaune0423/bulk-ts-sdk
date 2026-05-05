---
name: release
description: >-
  Runs fmt, lint, and test from deno.json, bumps the semver in deno.json, commits,
  creates an annotated git tag, and pushes branch and tags. Use when the user asks
  for a release, version bump, shipping a tag, or "release skill" workflow for
  this repository.
disable-model-invocation: true
---

# Release (bulk-ts-sdk)

End-to-end release prep and git tag push for this Deno SDK. **Version SSOT is `deno.json` → `version`** (npm build reads
the same value via `scripts/build_npm.ts`).

## Preconditions

- On the intended release branch; merge or cherry-pick is done beforehand.
- Resolve a **semver bump**: `patch` (default), `minor`, or `major`, and the exact next version (e.g. `0.0.9`).
- Remote is correct (`git remote -v`).

## Steps (execute in order)

1. **Quality gate** (repo root):

   ```bash
   deno task fmt
   deno task lint
   deno task test
   ```

   If `fmt` changes files, they must be included in the release commit.

2. **Bump version**\
   Set `deno.json` → `"version"` to the new semver (no `v` prefix in the file).

3. **Commit**\
   Use a dedicated version-bump commit (conventional style), for example:

   ```text
   chore(release): vX.Y.Z
   ```

   If the project uses emoji-prefixed messages, use the team mapping (e.g. `chore` → 🍱).

   Stage `deno.json` and any files touched by fmt (and nothing else unintended).

4. **Tag**\
   Annotated tag on the release commit:

   ```bash
   git tag -a "vX.Y.Z" -m "vX.Y.Z"
   ```

5. **Push**\
   Push the current branch and the tag:

   ```bash
   git push origin HEAD
   git push origin "vX.Y.Z"
   ```

   Use the real remote name and branch if not `origin` / default branch.

## After push (optional)

- **JSR / Deno publish**: uses `deno.json` version — publish when ready after tag.
- **npm**: `deno task build:npm X.Y.Z` then publish from `npm/` (version is passed explicitly to
  `scripts/build_npm.ts`).

## Do not

- Skip `lint` or `test` because the release is "small".
- Tag without a commit that updates `deno.json` (or you will ship the wrong version).
- Push tags with `--force` unless recovering from a documented mistake.
