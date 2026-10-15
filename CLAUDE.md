# TFT openers

Static web app for looking up Teamfight Tactics Set 18 openers and the comps they lead into. The spec is `docs/spec.md` (also issue #1). Work is tracked as GitHub issues, one vertical slice each.

## Working on an issue

- Read the issue and the spec sections it touches before writing code.
- Branch from `main` as `<issue number>-<short-slug>`, for example `2-champion-grid`.
- Never push to `main`. Open a pull request whose body contains `Closes #<issue number>`.
- Keep the PR to the issue's scope. Note anything out of scope as a comment on the issue instead of building it.
- If the issue is ambiguous or conflicts with the spec, stop and comment on the issue with the question and your recommended answer. Don't guess on decisions that change the data model or user-facing behavior.
- If you hit an unforeseen problem with the agreed approach, stop and explain it in a comment instead of working around it.

## Tooling

- Node 24 (`.nvmrc`) and pnpm (`packageManager`). Don't add other package managers.
- `pnpm run test` must pass before every commit.
- Install packages only on the host. In the sandbox `node_modules` is read-only, so ask the user.

## Code style

- TypeScript with ECMAScript 2023 features. 2-space indentation.
- Use `type` for type definitions, not `interface`.
- No `any`. Use `unknown` when a type is truly unknown, then narrow it.
- Prefer functional patterns: pure functions, `map`/`filter`/`reduce`, no shared mutable state. Use `for...of` when a loop reads better.
- Arrow functions, `async`/`await`, template literals, destructuring, `import`/`export`.
- Descriptive names (`selectedChampionIds`, not `ids`).
- Always handle errors. Never fail silently: surface errors to the user or throw with a clear message.

## Comments

- Short, simple English sentences.
- Comment only when the code doesn't explain itself. Don't restate the obvious.

## Testing

- Write tests for every new feature, covering the happy path and edge cases.
- Test through the two seams from the spec: the import transform (raw source data in, data bundle out) and the domain store (actions in, query results out). Test external behavior, not internal helpers.
- No UI component tests and no end-to-end tests.

## Writing in files and PRs

- No em dashes or semicolons in prose. Use commas or separate sentences.
- Sentence case headings.
- No filler intros, closers or hedge words ("might", "perhaps") unless the uncertainty is real.
- Prefer bullets over numbered lists unless order matters.
