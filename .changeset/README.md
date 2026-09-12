# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Adding a Changeset

When you make a change that should be released, run:

```bash
pnpm changeset
# or: npm run changeset
```

This will create a markdown file in `.changeset/` describing your change.

## Release Process

1. Changesets are added to PRs
2. On merge to `main`, the `release` workflow creates a "Version Packages" PR
3. When that PR is merged, packages are published and GitHub Release is created

## Change Types

- `patch` - Bug fixes, minor improvements
- `minor` - New features, backward compatible
- `major` - Breaking changes

## Monorepo (khal)

For the khal monorepo, changesets handles cross-package versioning with `updateInternalDependencies: "patch"`.
