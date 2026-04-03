---
name: update-work-history
description: Create or update the work-history doc for the current branch based on unstaged/staged changes
---

Document the current branch's work in `docs/claude/work-history/`.

## Step 1 — Gather context

Run these in parallel:

```
git diff HEAD          # all changes (staged + unstaged) vs last commit
git diff main...HEAD   # all commits on this branch vs main
git branch --show-current
```

Also read the existing file in `docs/claude/work-history/` for this branch if one exists (see Step 2).

## Step 2 — Resolve the target file

Derive the filename from the branch name and the current date:

- Pattern: `YYYY-Mmm__<Feature-slug>.md`
- `YYYY-Mmm` = current year and abbreviated month with capital first letter (e.g. `2026-Apr`)
- `<Feature-slug>` = human-readable feature name derived from the branch name, with words separated by hyphens (e.g. branch `feature/add-tab-detail` → `Tab-detail-page`)

Check whether `docs/claude/work-history/<filename>.md` already exists:
- If it exists → update it in place
- If not → create it using the structure below

## Step 3 — Write or update the file

Use this structure (see existing files for tone and level of detail):

```markdown
# <Feature Title>

**Date:** <Month> <Year>
**Branch:** `<branch-name>`

## What was built

<1-3 sentence summary of the overall goal>

### <Subsection per logical area of work>

<Detail: components created/changed, hooks, state, patterns used>

## Files changed

\```
<tree of files added or significantly changed, with a short inline note>
\```
```

### Guidelines

- Group changes by logical area (components, state, API, tests, config), not by file
- For each new component, note: where it lives, what props it accepts, what it renders
- For each new hook or state slice, note: what it fetches/manages, what it returns
- For extracted/shared components, note: who consumes them and why they were extracted
- For bug fixes, note: what the bug was, what caused it, how it was fixed
- Keep the "Files changed" section as a quick reference tree — one line per file with a brief annotation
- Do not include implementation details that are obvious from reading the code
- Do not include timestamps or author names — git history is the record for that

## Step 4 — Do not commit

Only write the file. Do not stage or commit it — that is handled separately.
