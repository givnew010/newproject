---
name: "design-system-restructure"
description: "Execute the phased Design System implementation plan (Phases 1–5) using attached design-restructure-plan.md. Scaffolds tokens, typography, spacing, core UI components, extracts layout pieces, and optionally refactors pages. Asks for decision points before large edits."
scope: "user"
skills:
  - design-system
  - agent-customization
author: "copilot"
---

Purpose
-------
Run and apply (or preview) the phased implementation tasks defined in `attached_assets/design-restructure-plan.md`.

When to use
-----------
- You want the assistant to implement the Design System foundation, scaffold core UI components, extract layout, and refactor pages.
- You want an automated, repeatable workflow that can run one phase at a time or the entire plan.

Inputs (parameters)
-------------------
- `phase` (string): Which phase to run. Allowed values:
  - `1` | `foundation` — create tokens, typography, spacing, update index.css
  - `2` | `core` — scaffold Button, Badge, Modal, PageHeader, KPICard
  - `3` | `layout` — extract Sidebar/Header, create AppShell
  - `4` | `pages` — refactor Dashboard, SalesInvoices, PurchaseInvoices, Reports, Warehouses, Settings
  - `5` | `forms` — scaffold Input/Select/Textarea and update forms
  - `all` — run all phases sequentially (prompts for confirmations at decision points)
- `enforcement` (string): `strict` or `lenient`. `strict` replaces raw Tailwind color classes and `#hex` values with tokens; `lenient` suggests mappings but may leave some Tailwind classes.
- `applyEdits` (boolean): If `true`, write changes to files; if `false`, only produce diffs and suggestions.
- `updateTailwind` (string): `ask` | `yes` | `no`. Whether to automatically edit `tailwind.config.ts` when tokens require it. Default `ask`.
- `createPR` (boolean): If `true`, create a branch and commit changes locally (if environment allows). Default `false`.
- `commitMessage` (string, optional): Commit message to use when `createPR=true`.

Behavior / Steps the assistant should perform
-------------------------------------------
1. Discovery
   - Load `attached_assets/design-restructure-plan.md` and the `design-system` skill guidance.
   - Scan `src/` for inline `#hex` colors, raw Tailwind color classes (e.g., `bg-blue-600`), repeated spacing classes, and ad-hoc badges/buttons.
   - Produce a short report and a suggested token mapping JSON `{foundValue: suggestedToken}`.

2. Foundation (phase=1)
   - Create `src/styles/tokens.ts`, `src/styles/typography.ts`, `src/styles/spacing.ts` using the plan as the source of truth.
   - Update `src/index.css` to include CSS variable fallbacks for tokens.
   - If `applyEdits=true`, write those files. Otherwise, output file contents as diffs.

3. Component scaffolding (phase=2)
   - Scaffold typed, minimal implementations for `Button`, `Badge`, `Modal`, `PageHeader`, `KPICard` in `src/components/ui/` and add `src/components/ui/index.ts` barrel exports.
   - Prefer small, reviewable stubs that import tokens/spacing/typography.

4. Layout extraction (phase=3)
   - Extract `Sidebar` and `Header` from `App.tsx` into `src/components/layout/` and scaffold `AppShell.tsx` that composes them with the rest of the app.

5. Refactor pass (phase=4)
   - For each target page (Dashboard, SalesInvoices, PurchaseInvoices, Reports, Warehouses, Settings):
     - Replace ad-hoc buttons with `<Button>`.
     - Replace ad-hoc badges/spans with `<Badge>`.
     - Replace direct color hex or raw Tailwind color classes with tokens or CSS variables (if `enforcement=strict`, apply replacements; otherwise, propose mappings).

6. Forms (phase=5)
   - Add `Input`, `Select`, `Textarea` components under `src/components/ui/` and update forms to use them when safe.

7. QA & Reporting
   - Produce a JSON object with `filesCreated`, `filesModified`, `tokenMappings`, `checklist` (success criteria from plan), and a human summary.
   - Run the automated checks from the `design-system` skill: no `#hex` under `src/` (if enforcement strict), `src/components/ui/index.ts` exports, and consistency checks.

Decision Points (ask the user before proceeding)
------------------------------------------------
- Enforcement mode: strict vs lenient (must confirm for destructive replacements).
- Whether to modify `tailwind.config.ts` automatically.
- Whether to commit changes and create a branch locally.

Outputs
-------
- Human summary of changes and checklist.
- Machine-readable JSON with `filesCreated[]`, `filesModified[]`, `tokenMappings[]`, `todoStatus[]` (sync with workspace TODOs).
- Unified diff patches when `applyEdits=false`.

Constraints & Safety
--------------------
- Do not modify `tailwind.config.ts` unless `updateTailwind=yes` or explicit confirmation received when `updateTailwind=ask`.
- Keep edits focused and atomic; do not perform unrelated refactors.
- Respect RTL conventions: prefer `ms-`/`me-` utilities when changing margins/paddings.
- Always prompt before large-scale destructive changes.

Examples (invocations)
----------------------
- Preview foundation changes (no edits):
  - `phase: foundation, enforcement: strict, applyEdits: false`

- Apply foundation and scaffold core components (ask for tailwind changes):
  - `phase: all, enforcement: strict, applyEdits: true, updateTailwind: ask, createPR: false`

- Run only UI scaffolding and page refactors as proposals:
  - `phase: core, applyEdits: false, enforcement: lenient`

Clarifying questions the assistant must ask if arguments are missing
-------------------------------------------------------------------
1. Which `phase` should I run now? (`foundation`|`core`|`layout`|`pages`|`forms`|`all`)
2. Enforcement preference? (`strict` or `lenient`)
3. Should I write changes or only produce diffs? (`applyEdits=true|false`)
4. Can I modify `tailwind.config.ts` if needed? (`updateTailwind=yes|no|ask`)

Suggested follow-ups
--------------------
- After running a phase, ask: "Run next phase now?" and update the TODO list status.
- When ready, create a PR branch name suggestion: `design-system/foundation` or `design-system/{phase}`.

Notes for maintainers
---------------------
- This prompt is a single-task workflow that drives the `design-system` skill. For multi-stage automation with gated approvals, consider authoring a small custom agent or skill that sequences phases and records reviewer approvals.

---
