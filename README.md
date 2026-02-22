# Slide Style Prompt Generator

![License](https://img.shields.io/badge/License-MIT-green)
![Data Version](https://img.shields.io/badge/data--version-v0.0.1-purple)

A multilingual web app that helps users generate slide-style prompts for LLM tools (for example Gemini and NotebookLM).

## Features

- 3-step generation flow:
  - Slide style
  - Color palette/theme
  - Content + category chips
- Multilingual UI:
  - English (`/en`)
  - Traditional Chinese (`/zh-TW`)
  - Simplified Chinese (`/zh-CN`)
  - Japanese (`/ja`)
  - Korean (`/ko`)
  - Spanish (`/es`)
  - German (`/de`)
  - French (`/fr`)
  - Russian (`/ru`)
- Copy and export prompt text
- Theme mode (light/dark)
- Config versioning (`settings_version`) for palette/style/category upgrades

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- react-i18next
- Playwright + Vitest

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Run dev server

```bash
npm run dev
```

### 3) Build

```bash
npm run build
```

### 4) Run tests

```bash
npm run test
npm run test:e2e
```

## Configuration Versioning

Default settings are centralized in:

- `src/config/settings-catalog.json`

This file contains:

- `settings_version`
- default palettes
- default styles
- default categories

When you release a settings update (example `v0.0.1` -> `v0.0.2`):

1. Update `settings_version` in `src/config/settings-catalog.json`
2. Update default data in the same file
3. Sync translated labels/descriptions in `public/locales/*/translation.json`

## Notes

- All data are stored in browser, not in any server.
- No runtime environment variables are required by default
- Prompt options are automatically upgrade when load to the page

