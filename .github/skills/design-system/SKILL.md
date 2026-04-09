# Design System Skill

## Summary

Workflow skill to unify and enforce a project-wide design system: central design tokens, typography scale, spacing rules, and a small library of reusable UI components. Use this skill to scaffold the foundation files, scaffold core UI components, and perform guided refactors of pages to adopt the design system.

## When to use

- Refactoring UI files to remove inline colors/classes.
- Creating or standardizing UI components (`Button`, `Badge`, `Modal`, `PageHeader`, `KPICard`).
- Adding or updating design tokens, typography, spacing, or Tailwind config.

## Inputs / Triggers

- Files or prompts that mention: `tokens.ts`, `typography.ts`, `spacing.ts`, `src/components/ui`, `index.css`, `tailwind.config.ts`, or any page under `src/` that contains UI markup.
- Example trigger prompts: "Refactor Dashboard.tsx to use the design system", "Standardize badges across src/".

## Outputs

- New or updated foundation files: `src/styles/tokens.ts`, `src/styles/typography.ts`, `src/styles/spacing.ts`, `src/index.css` (CSS variables).
- Scaffolding for `src/components/ui/*` core components and `src/components/ui/index.ts` (barrel exports).
- Suggested diffs or applied edits replacing inline colors/variants with tokens and replacing raw elements with UI components.

## High-level Goals

1. Centralize colors and gradients into `src/styles/tokens.ts` or CSS variables.
2. Centralize typography into `src/styles/typography.ts` with semantic aliases (e.g., `pageTitle`, `bodyText`).
3. Centralize spacing and radius rules in `src/styles/spacing.ts`.
4. Provide a small, consistent UI component library under `src/components/ui/` and replace ad-hoc markup with those components.
5. Respect RTL and accessibility (WCAG AA contrast) constraints.

## Step-by-step Workflow (what the skill performs)

1. Discovery
   - Scan target files for inline `#hex` colors, raw Tailwind color classes (e.g., `bg-blue-600`), repeated spacing/padding classes, and ad-hoc badges/buttons.
   - Produce a short report of occurrences and suggested token mappings.

2. Foundation (create/update)
   - Create `src/styles/tokens.ts` with named colors and gradients.
   - Create `src/styles/typography.ts` with font families, sizes, weights, and `textStyles` aliases.
   - Create `src/styles/spacing.ts` with spacing aliases and `radius` values.
   - Update `src/index.css` to add CSS variables mapping to tokens.
   - If Tailwind is used, suggest the minimal `tailwind.config.ts` updates to expose tokens as utilities.

3. Component scaffolding
   - Scaffold minimal, typed implementations for: `Button`, `Badge`, `Modal`, `PageHeader`, `KPICard`, `Card` under `src/components/ui/` and add `src/components/ui/index.ts` barrel exports.

4. Refactor pass (guided)
   - Replace inline buttons with `<Button variant="..." size="...">`.
   - Replace raw badges/spans with `<Badge variant="...">` mapped to `tokens.status.*`.
   - Replace raw color Tailwind classes or hex values with token-based classes or CSS variables.
   - Replace inconsistent radii with `spacing.radius` aliases (`rounded-lg` for cards, `rounded-full` for badges).

5. QA and acceptance
   - Run static checks: no inline hex colors remain, components exported from `src/components/ui/index.ts`.
   - Produce a short checklist report tying changes to Success Criteria.

## Decision Points

- Enforcement strictness: strict (ban new Tailwind color classes in feature files; require all colors in `tokens.ts`) vs lenient (allow Tailwind color classes during prototyping). The skill asks this once before bulk edits.
- Tailwind config changes: if tokens require new classes, propose `tailwind.config.ts` edits but do not auto-commit without confirmation.

## Success Criteria (automated checks)

- No `#hex` color literals anywhere under `src/`.
- No ad-hoc Tailwind color classes (optional — depends on enforcement setting).
- All pages use `Button` for actions and `Badge` for status chips where applicable.
- `src/components/ui/index.ts` exports the core components.
- Typography uses the semantic aliases from `src/styles/typography.ts`.

## Examples (Before → After patterns)

Before:

```
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg">إضافة</button>
```

After:

```
import { Button } from 'src/components/ui'
<Button variant="primary" size="md">إضافة</Button>
```

Before:

```
<span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">متوفر</span>
```

After:

```
import { Badge } from 'src/components/ui'
<Badge variant="emerald">متوفر</Badge>
```

## Agent Implementation Notes (how agents should operate)

- Keep changes minimal and focused per file; open a single PR-sized diff rather than sweeping unrelated edits.
- When replacing tokens, create a suggested mapping file (JSON) showing `found_value -> token` for reviewer approval.
- Do not auto-commit changes to `tailwind.config.ts` without explicit confirmation.
- For RTL, prefer logical margin utilities (`ms-`, `me-`) when altering layout classes.

## Suggested Prompts to Invoke This Skill

- "Run the design-system skill on Dashboard.tsx and apply token replacements (strict)."
- "Scaffold core UI components for the design system and export them."
- "Scan src/ for inline hex colors and propose token mappings."

## Files created/modified by this skill (foundation)

- `src/styles/tokens.ts` — colors & gradients
- `src/styles/typography.ts` — font families, sizes, aliases
- `src/styles/spacing.ts` — spacing & radius aliases
- `src/index.css` — CSS variables
- `src/components/ui/*` — Button.tsx, Badge.tsx, Modal.tsx, PageHeader.tsx, KPICard.tsx, Card.tsx, index.ts

## Ambiguities to confirm with requester

1. Enforcement strictness: ban Tailwind color classes in feature files, or allow during prototyping?
2. Accept automated `tailwind.config.ts` edits, or require a follow-up PR for config changes?

End of skill
