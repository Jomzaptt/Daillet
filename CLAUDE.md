# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daillet is a personal expense/income tracking web app (记账管理系统) built as a single-page application with offline-first IndexedDB storage. The UI is in Chinese by default with English i18n support.

## Commands

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Type-check (`tsc -b`) then build for production (`vite build`)
- `npm run lint` — ESLint on all files
- `npx vitest` — Run tests (Vitest with jsdom)
- `npx vitest run src/lib/db.test.ts` — Run a single test file

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS 3 + Dexie (IndexedDB) + i18next + Recharts

**Data layer (`src/lib/db.ts`):**
- Dexie database `DailletDB` with three tables: `categories`, `records`, `events`
- Sensitive fields (amount, category name, note, event name) are encrypted at rest using AES via `crypto-js` before being stored in IndexedDB. The encryption key is stored in `localStorage` (`daillet_secret_key`).
- `initializeDb()` seeds default categories on first launch
- All DB reads must go through `decrypt()` to get plaintext values

**Routing (`src/App.tsx`):**
- `react-router-dom` with sidebar (desktop) / bottom tab bar (mobile) layout
- Routes: `/` (Dashboard/expenses), `/income`, `/events`, `/events/:id` (EventDetail), `/reports`, `/settings`

**Components (`src/components/`):**
- `AddRecordModal` — modal for adding expense/income records; supports optional `defaultEventId` and `dateRange` props for event-scoped entries
- `CategoryManager` — inline CRUD for expense/income categories
- `EventModal` — modal for creating time-bounded events (专题)

**Theming:**
- CSS custom properties in `src/index.css` (light/dark, `darkMode: 'class'` in Tailwind)
- Theme state managed in `App.tsx`, persisted to `localStorage`
- shadcn/ui-style color tokens (`primary`, `muted`, `destructive`, etc.)

**i18n (`src/i18n.ts`):**
- Inline resource bundles for `zh` and `en`, default language is `zh`

**Testing:**
- Vitest with jsdom + `fake-indexeddb` for IndexedDB simulation
- `setupTests.ts` wipes and re-opens the DB before each test via `beforeEach`
- `src/lib/db.test.ts` — unit tests for encryption and DB operations
- `src/lib/stress.test.ts` — performance benchmarks for bulk insert and queries (5475 records)

## Key Patterns

- Path alias: `@` maps to `src/` (configured in `vite.config.ts`)
- Use `useLiveQuery` from `dexie-react-hooks` for reactive DB queries in components
- `cn()` utility (clsx + tailwind-merge) is defined in `App.tsx` — used for conditional class merging
- Icons come from `lucide-react`
- `@typescript-eslint/no-explicit-any` is allowed; `no-unused-vars` is a warning
