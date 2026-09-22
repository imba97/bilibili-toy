// filepath: vite.config.ts
//
// `vite-plus` (the `vp` CLI) extends Vite's `defineConfig` so that all
// toolchain blocks (`fmt`, `lint`, `check`, `test`, `staged`) live in this
// one file alongside the Vite-specific bits.
// See: https://viteplus.dev/config
//
// Bilibili Toy SDK wrapper:
//   - Pure TS, zero runtime deps, no Vue.
//   - `vp pack` emits a single ESM entry (src/index.ts) with .d.ts.
//
// The official `toy-sdk.d.ts` (B 站 Toy 平台的环境类型声明) lives at
// `src/types/toy-sdk.d.ts`. We mirror it into `dist/types/` via a Vite/Rolldown
// plugin so the file shows up in `vp pack`'s emit report alongside
// `index.mjs` / `index.d.mts`. It's exposed via
// `package.json#exports["./types/toy-sdk.d.ts"]`.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite-plus'

const here = dirname(fileURLToPath(import.meta.url))

const toySdkTypesSrc = resolve(here, 'src/types/toy-sdk.d.ts')

/**
 * Tiny Rolldown/Vite plugin that emits `src/types/toy-sdk.d.ts` into
 * `dist/types/toy-sdk.d.ts` as a first-class bundle asset.
 *
 * Uses `this.emitFile` (Vite/Rolldown shared hook context) so the file is
 * registered in the bundler's virtual FS — that means tsdown's `writeBundle`
 * report lists it alongside `index.mjs` / `index.d.mts` instead of it being
 * a side-effect write the reporter never sees.
 *
 * Hooked ONLY into `pack.plugins` (so tsdown — which is what `vp pack`
 * actually invokes — picks it up). We deliberately do NOT add it to the
 * top-level `plugins` array: `vp test` / `vp dev` run in serve mode where
 * `emitFile` is unavailable and the plugin would log a warning.
 */
function copyToySdkTypesPlugin(): Plugin {
  return {
    name: 'copy-toy-sdk-types',
    // `buildStart` fires before any chunk work; registering the file here
    // means by the time `writeBundle` runs, `bundle` already contains it.
    buildStart() {
      const source = readFileSync(toySdkTypesSrc)
      this.emitFile({
        type: 'asset',
        fileName: 'types/toy-sdk.d.ts',
        source
      })
    }
  }
}

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: resolve(here, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs'
    },
    rollupOptions: {
      // Zero runtime deps — bundle everything (including any transitive).
      external: []
    }
  },

  // --- Pack: tsdown under the hood ---
  pack: {
    entry: {
      index: 'src/index.ts'
    },
    // Minify the published JS so consumers download less and parse faster.
    // tsdown defaults: treeshake=true, minify=false. We flip minify on and
    // keep treeshake explicit. Sourcemaps stay off — `index.mjs` is small
    // enough that stack traces in dev are enough to triage.
    minify: true,
    treeshake: true,
    sourcemap: false,
    // `vp pack` delegates to tsdown, which reads `pack.plugins` and merges
    // them with its own (see vite-plus/pack-bin.js:
    // `merged.plugins = [...plugins, externalDtsTypeOnlyPlugin()]`).
    // Intentionally NOT in the top-level `plugins` array — see plugin JSDoc.
    plugins: [copyToySdkTypesPlugin()]
  },

  // --- Format (Oxfmt) ---
  fmt: {
    singleQuote: true,
    semi: false,
    trailingComma: 'none'
  },

  // --- Lint (Oxlint) ---
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },

  // --- Test (Vitest) ---
  // Tests live under `tests/` mirroring `src/` so source and tests stay
  // cleanly separated (no `.test.ts` files mixed into published sources).
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  },

  // --- Pre-commit ---
  staged: {
    '*.{ts}': ['fmt', 'lint', 'check']
  }
})
