---
name: pr
description: Open a pull request for the current branch following project conventions
---

Create a pull request for the current branch.

## Title format

- Feature work: `Feature: <Title>`
- Bug fixes: `Bugfix: <Title>`

Title must start with a capital letter (e.g. `Feature: Add items modal`, `Bugfix: Fix modal sheet background`).

## Steps

1. Run `git status`, `git diff`, `git log`, and `git diff main...HEAD` in parallel to understand what's changing.
2. Determine whether this is a feature or a bugfix.
3. Draft a title using the correct prefix and a capital-letter title.
4. Push the branch to remote with `-u` if not already pushed.
5. Create the PR with `gh pr create` using a HEREDOC body:

```
gh pr create --title "<Prefix>: <Title>" --body "$(cat <<'EOF'
## Summary
- <bullet points>

## Test plan
- [ ] <testing steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

6. Return the PR URL.

## Merging a PR

Always merge with squash and delete the remote branch in one command:

```
gh pr merge <PR-number-or-URL> --squash --delete-branch
```

- `--squash` keeps the main branch history clean (one commit per feature/fix)
- `--delete-branch` removes the remote branch immediately after merge

The local branch is cleaned up automatically by a post-merge hook (switches to main, pulls, deletes local branch).
