# Copilot instructions for this repository

## Build, test, and lint commands

- Install dependencies: `npm install` (CI uses `npm ci` on Node 20).
- Dev server: `npm run dev`
- Build: `npm run build`
- Unit tests (Vitest): `npm run test`
- Run one unit test file: `npx vitest run src/lib/prompt.test.ts`
- E2E tests (Playwright): `npm run test:e2e`
- Run one E2E spec: `npx playwright test tests/e2e/app.smoke.spec.ts`
- Lint: no lint script is currently defined in `package.json`.

## High-level architecture

- This is a client-only React + TypeScript + Vite app with route-based localization (`/:lang`).
- `src/main.tsx` initializes i18n, resolves preferred language from `localStorage` (`ui-language`), and redirects `/`/unknown routes to a language route.
- `src/App.tsx` is the main stateful UI for both tabs:
  - **Generator** tab: color/palette/style/category selection + preview/copy/export.
  - **Templates** tab: edit custom categories/options and selection mode.
- Default prompt data is centralized in `src/config/settings-catalog.json` and mapped into runtime objects in `src/lib/customization.ts` (`DEFAULT_PALETTES`, `DEFAULT_STYLE_PRESETS`, `DEFAULT_CATEGORIES`).
- User customizations are persisted in `localStorage` (`slide-style-prompt-customization`) with setting-version gates (`SETTINGS_VERSIONS`) so defaults can be upgraded safely.
- Localization is served from `public/locales/<lang>/translation.json` via `i18next-http-backend`; keys are consumed directly in `App.tsx` for labels and preview text.

## Key project conventions

- Keep `settings-catalog.json` and locale files in sync:
  - When updating defaults, bump `settings_version` and sync translated labels/descriptions in `public/locales/*/translation.json` (README rule).
- Default IDs are index-derived (`palette-default-<n>`, `style-default-<n>`) and used by locale keys (`paletteNames.*`, `stylePresets.*`), so ID/order changes require locale updates.
- Only default categories/options are localized by key; custom user-created categories/options are treated as user content and are not auto-translated.
- Preserve defensive data handling patterns used by the app:
  - Validate/normalize hex colors through `normalizeHexColor`.
  - Sanitize selections against available category options with `sanitizeSelections`.
  - Gate language parsing through `parseLanguage`/`isSupportedLanguage`.
- Persisted UI state relies on specific storage keys (`ui-language`, `ui-color-mode`, `slide-style-prompt-recent-colors`, `slide-style-prompt-customization`); keep key names stable unless migration is added.
