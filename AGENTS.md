# AGENTS.md — bilibili-toy

> **Repo**: <https://github.com/imba97/bilibili-toy>
> Typed SDK for the Bilibili Toy platform creator APIs. Zero runtime deps.

## Scope

This repo is a **single-package TypeScript library**. It used to live as
`packages/bilibili-toy` inside the [bilibili-toy-starter](https://github.com/imba97/bilibili-toy-starter)
monorepo, but has since been split out so it can be installed from npm
independently of any Toy application.

## Hard rules for AI agents

- **Do NOT re-add monorepo glue.** No `packages/*`, no `pnpm-workspace.yaml`,
  no `workspace:*` deps. This repo is `pnpm`-installable on its own.
- **Run `vp check` before committing.** It runs Oxfmt + Oxlint + tsc and is fast.
- **`vp pack` is the release build.** It produces `dist/index.mjs` + the
  `dist/index.d.mts` ambient types. The Toy bundler reads these — if you
  edit SDK sources without running `vp pack`, downstream consumers
  (`bilibili-toy-starter` and any other Toy app) still get the previous
  build.
- **Release flow**: `bumpp` (commit + tag + push) triggers GitHub Actions
  (`.github/workflows/release.yaml`), which runs `pnpm test`, `pnpm run
  pack`, and `pnpm publish --access public --no-git-checks`.
- **Pure TS, zero runtime deps.** Don't add runtime dependencies. The whole
  point of this SDK is to be a thin, typed wrapper over `window.toy`.
- **Don't create `toy.yaml`.** This repo has nothing to do with publishing
  to the Bilibili Toy platform — that's the starter repo's job.

## Useful commands

| Command          | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | Watch build (vite-plus)                                       |
| `pnpm build`     | Toy-style build (`vp build`)                                  |
| `pnpm pack`      | Library build → `dist/index.mjs` + `dist/index.d.mts`         |
| `pnpm test`      | Vitest across `tests/`                                        |
| `pnpm check`     | Format + lint + type-check                                    |
| `pnpm fmt`/`lint`/`staged` | Individual checks                                   |
| `pnpm release`   | bumpp: bump version, commit, tag, push                        |

## Editing rules

- Edit `src/<file>.ts` to change the SDK behavior.
- Edit `src/types/toy-sdk.d.ts` only when the official Toy SDK gains new
  ambient declarations; the build copies this into `dist/types/`.
- Do **not** edit anything under `dist/` — it's a build artifact.
- Do **not** add `eslint`, `prettier`, or `tsdown.config.ts`. `vite-plus`
  handles all of these through `vite.config.ts`.
- Tests live under `tests/` mirroring `src/`. Do not put `.test.ts` files
  inside `src/` — the publish filter is just `["dist"]`, so tests can't
  leak into the published tarball, but keeping them separate keeps the
  source tree tidy.
