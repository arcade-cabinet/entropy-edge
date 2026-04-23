---
title: Release
updated: 2026-04-23
status: current
domain: ops
---

# Release

## Tooling

- [release-please](https://github.com/googleapis/release-please-action)
  reads Conventional Commits on `main`, opens a release PR with a
  bumped version + CHANGELOG update, and on merge tags a release.
- `release.yml` runs on tagged releases.
- `cd.yml` deploys Pages on every `push: main`.

## Cutting a release

1. Merge PRs with Conventional Commit messages to `main`.
2. `release-please-action` auto-opens a release PR.
3. Review the CHANGELOG, merge when ready — tag + release job fires.

## Manifest state

Tracked in `.release-please-manifest.json`. Do not hand-edit.

## Pre-1.0 rules

`bump-minor-pre-major: true`, `bump-patch-for-minor-pre-major: false`.
