# Dependency security maintenance

Use Node.js 24. Dependencies and lockfiles have been updated against the current advisory database. CI audits the full dependency graph and builds the application.

Run `npm ci`, `npm audit`, and `npm run build`.

The Bun lockfile is also refreshed and checked with `bun audit`. ESLint 10 supports the patched minimatch API used by the override. Regenerate both lockfiles when updating dependencies.

The minimatch override patches the linter/build-tool dependency until its parent updates. Builds verify compatibility with the patched dependency.
