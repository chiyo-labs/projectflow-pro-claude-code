# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server (Turbopack, outputs to .next/dev)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint (next build no longer lints automatically)
```

## Project Overview

**ProjectFlow Pro** — a single-page project management tool for AI/freelance developers. No backend, no auth. All data persists in `localStorage`. Stack: Next.js 16, React 19.2, TypeScript, Tailwind CSS v4.

Target: AI developers and freelancers managing client engagements from brief → delivery → retrospective.

## Architecture

The app is a single route (`/`) with client-side section switching via a sidebar. The sidebar lists workflow stages; clicking a stage swaps the main content panel. Because the app uses `localStorage` and event handlers throughout, almost every component will be a Client Component (`'use client'`).

**Implemented sections** (in sidebar order):
- `brief` — Client Brief: project name, client, description
- `hearing` — Hearing: Why / Who / What / How Q&A items
- `requirements` — Requirements: in-scope / out-of-scope / Phase 2
- `proposal` — Proposal: problem, solution, tech stack, cost
- `wbs` — WBS: tasks, durations, status
- `progress` — Progress: done / next / blockers
- `delivery` — Delivery checklist
- `retrospective` — Retrospective: tech / PM / improvements
- `email` — Email templates with copy button

**localStorage pattern**: `useLocalStorage` hook (`src/hooks/useLocalStorage.ts`) reads on hydration, writes on every change. Key: `projectflow_pro_v1`. SSR-safe via `isHydrated` flag — show `<LoadingSkeleton>` until true. `_version: '1'` guard in `loadProject()` rejects incompatible stored data.

**Adding a new section** — touch these files in order:
1. `src/types/project.ts` — add interface + field to `ProjectData` + value to `SectionId`
2. `src/lib/storage.ts` — add field with default to `getDefaultProject()`
3. `src/hooks/useProjectData.ts` — add `updateX` callback
4. `src/components/layout/Sidebar.tsx` — add nav item to `NAV_GROUPS`
5. `src/components/layout/AppShell.tsx` — add case to `renderSection()` and destructure `updateX`
6. `src/components/sections/NewSection.tsx` — new component (use `SectionShell` wrapper)

**AI generation pattern** — three parts work together:
- `src/hooks/useAiGenerate.ts` — generic fetch hook returning `{ generate, isLoading, error, result, reset }`
- `src/components/ui/AiPreviewModal.tsx` — modal that shows the result with Apply / Close buttons
- `src/app/api/ai/<name>/route.ts` — POST handler: reads env `ANTHROPIC_API_KEY`, calls Claude, parses JSON response

All existing AI routes (`generate-hearing`, `generate-requirements`, `generate-proposal`) follow the same pattern: system prompt for JSON-only output, regex strip of markdown fences, `try-catch` around `JSON.parse`, `console.log` of raw response.

**Email templates** (`src/lib/emailTemplates.ts`) — each template is a `{ subject, body }` function receiving `ProjectData`. Optional `isEmpty(data)` + `emptyMessage` fields control the empty-state UI in `EmailTemplates.tsx`.

## Next.js 16 Breaking Changes to Know

This project runs **Next.js 16**, which differs significantly from training data. Always read `node_modules/next/dist/docs/` before using an API. Key changes:

- **`params` and `searchParams` are async** — always `await props.params` and `await props.searchParams` in pages/layouts.
- **`next lint` is removed** — use `eslint` directly (already in `package.json`).
- **`next build` does not lint** — run `npm run lint` separately.
- **Turbopack is the default bundler** — no `--turbopack` flag needed.
- **`middleware` → `proxy`** — rename `middleware.ts` to `proxy.ts` and the export to `proxy`.
- **No `serverRuntimeConfig` / `publicRuntimeConfig`** — use `process.env` directly; prefix client-visible vars with `NEXT_PUBLIC_`.
- **`revalidateTag` requires a second argument** (a `cacheLife` profile string, e.g. `'max'`).
- **Parallel routes need `default.js`** — builds fail without it.
- **`next/legacy/image` is deprecated** — use `next/image`.
- **`images.domains` is deprecated** — use `images.remotePatterns`.
- **`experimental.turbopack`** moved to top-level `turbopack` in `next.config.ts`.
- **React Context is not supported in Server Components** — wrap context providers in a Client Component.
- **Dev output** goes to `.next/dev`; production build output goes to `.next`.

## Tailwind CSS v4

This project uses Tailwind v4 with its new syntax:

```css
@import "tailwindcss";        /* replaces @tailwind base/components/utilities */

@theme inline {               /* extends the theme */
  --color-primary: #3b82f6;
}
```

Do not use `@tailwind base`, `@tailwind components`, or `@tailwind utilities` — those are v3 syntax.
