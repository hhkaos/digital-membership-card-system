---
name: ship
description: Stage changes, generate a commit message, commit using a git alias, and push
disable-model-invocation: true
---

Follow these steps to commit changes:

## 1. Review changes

Run `git status` (never use `-uall`) and `git diff` (both staged and unstaged) to understand all current changes.

## 2. Update project documentation

Review the changes and update the following files as needed:

### CHANGELOG.md
Read `CHANGELOG.md` and add an entry under the `[Unreleased]` section describing the change. Place it under the appropriate subsection (`Added`, `Changed`, `Fixed`, `Removed`). Create the subsection if it doesn't exist. Keep entries concise (one bullet point per logical change). Each entry MUST specify which app it applies to (e.g. "Issuer:", "Verification:", "Both apps:", "Docs:") at the start of the bullet point so readers know the scope at a glance.

### docs/TODO.md
Read `docs/TODO.md` and update checkboxes or status labels to reflect the current state of the project. For example:
- Mark completed tasks as `[x]`
- Update phase status labels (e.g. `⬜ TODO` → `🚧 IN PROGRESS` → `✅ COMPLETE`)
- Update the V2 Progress Tracking section if a phase status changed
- Update test counts or other metrics if they changed
- Only modify items directly related to the current changes

### docs/SPEC.md
Read `docs/SPEC.md` and update it only if the changes affect the technical specification. For example:
- New or changed features that alter the documented architecture or behavior
- New acceptance criteria that should be checked off
- Updated technology choices or dependencies
- Skip this file if the changes are purely internal (refactoring, tests, tooling)

## 3. Stage files

Stage the relevant files by name, including any updated documentation files (`CHANGELOG.md`, `docs/TODO.md`, `docs/SPEC.md`). Never use `git add -A` or `git add .`. Never stage files that may contain secrets (`.env`, credentials, private keys, etc.) — warn the user if any are detected.

## 4. Generate a commit message

- Run `git log --oneline -10` to see recent commit style.
- Analyze the staged diff and draft a concise conventional commit message (e.g. `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Focus on the "why" rather than the "what".
- Keep it to 1-2 sentences.
- Show the proposed message to the user before committing.

## 5. Choose the git alias

Ask the user which alias to use:

- **`git cai`** — AI-attributed commit (sets author to "AI Generated (hhkaos)" and prefixes the message with "AI: ")
- **`git ch`** — Regular commit with the user's default git identity

## 6. Commit

Run the chosen alias with the commit message. For example:
- `git cai "feat: add dark mode toggle to settings page"`
- `git ch "feat: add dark mode toggle to settings page"`

## 7. Push

Run `git push`. If the branch has no upstream, use `git push -u origin <branch>`.
