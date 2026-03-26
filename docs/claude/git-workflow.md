# Git Workflow

## Starting a feature

1. Branch off `main` using the naming convention `feature/<feature-title>`:

```bash
git checkout main && git pull
git checkout -b feature/<feature-title>
```

2. Create a plan document in `docs/claude/work-history/` named `YYYY-MMM__<Feature-title>.md` and commit it to the branch before starting work.

---

## During development

- As each phase of the plan is completed, update the plan document (mark steps done, add notes) and commit + push.
- Commit messages should be concise and describe *why*, not just *what*.
- Keep commits focused — one logical change per commit.

---

## Raising a PR

When the feature is complete:

1. Run the full preflight suite locally and confirm it passes before opening the PR:

```bash
npm run ts:check
npm run lint:check
npm run test
```

2. Push the branch and open a PR against `main`:

```bash
git push -u origin feature/<feature-title>
gh pr create --title "<title>" --body "..."
```

3. The PR description should cover: what changed, why, and a test plan.
4. The PR must pass the **Preflight** CI check before merging.
5. Add a **WIP** label if work is still in progress.

---

## After merging

Delete the branch both locally and remotely — no stale branches:

```bash
git checkout main && git pull
git branch -d feature/<feature-title>
git push origin --delete feature/<feature-title>
```
