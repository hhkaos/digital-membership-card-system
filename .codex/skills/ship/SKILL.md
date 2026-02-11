---
name: ship
description: Stage changes, generate a commit message, commit using a git alias, and push.
metadata:
  short-description: Commit and push with project docs updates
---

# Ship

Use this skill when the user asks to commit and push current work.

## 1. Review changes

1. Run `git status` (never use `-uall`).
2. Run `git diff` for unstaged changes.
3. Run `git diff --staged` for staged changes.
4. Understand all current modifications before staging anything else.

## 2. Update project documentation

Update only files directly impacted by the current change set.

### End-user docs HTML regeneration

- If files under `docs/manuals/end-user/` changed, run:
  - `npm run docs:generate`
- This regenerates:
  - `issuer/public/docs/index.html`
  - `verification/public/docs/index.html`
  - related assets in each app `public/docs/assets/`
- If regeneration updates files, include those generated files in the same commit.

### `CHANGELOG.md`

- Add an entry under `## [Unreleased]`.
- Put each change under the right subsection: `Added`, `Changed`, `Fixed`, or `Removed`.
- Create subsection headers if missing.
- Keep entries concise (one bullet per logical change).

### `docs/TODO.md`

- Update checkboxes and status labels to match the current state.
- Adjust V2 progress, metrics, or success criteria only when affected.

### `docs/SPEC.md`

- Update only if behavior, architecture, acceptance criteria, or dependencies changed.
- Skip for internal-only changes (refactors, tests, tooling-only updates).

## 3. Stage files safely

1. Stage files explicitly by name (`git add <file>`).
2. Never use `git add -A` or `git add .`.
3. Never stage secrets (`.env`, credentials, private keys). Warn the user if detected.

## 4. Draft commit message

1. Review recent style with `git log --oneline -10`.
2. Analyze the staged diff and draft a concise conventional commit:
   - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
3. Keep it to 1-2 sentences and emphasize why the change exists.
4. Show the proposed message to the user before committing.

## 5. Choose git alias

Ask the user which alias to use:

- `git cai` for AI-attributed commit (prefixes message with `AI: `)
- `git ch` for regular commit with default git identity

## 6. Commit

Run the chosen alias with the approved message, for example:

- `git cai "feat: add dark mode toggle to settings page"`
- `git ch "feat: add dark mode toggle to settings page"`

## 7. Push

1. Run `git push`.
2. If no upstream exists, run `git push -u origin <branch>`.
