---
name: ship
description: Stage changes, generate a commit message, commit using a git alias, and push
disable-model-invocation: true
---

Follow these steps to commit changes:

## 1. Review changes

Run `git status` (never use `-uall`) and `git diff` (both staged and unstaged) to understand all current changes.

## 2. Stage files

Stage the relevant files by name. Never use `git add -A` or `git add .`. Never stage files that may contain secrets (`.env`, credentials, private keys, etc.) — warn the user if any are detected.

## 3. Generate a commit message

- Run `git log --oneline -10` to see recent commit style.
- Analyze the staged diff and draft a concise conventional commit message (e.g. `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Focus on the "why" rather than the "what".
- Keep it to 1-2 sentences.
- Show the proposed message to the user before committing.

## 4. Choose the git alias

Ask the user which alias to use:

- **`git cai`** — AI-attributed commit (sets author to "AI Generated (hhkaos)" and prefixes the message with "AI: ")
- **`git ch`** — Regular commit with the user's default git identity

## 5. Commit

Run the chosen alias with the commit message. For example:
- `git cai "feat: add dark mode toggle to settings page"`
- `git ch "feat: add dark mode toggle to settings page"`

## 6. Push

Ask the user whether to push. If yes, run `git push`. If the branch has no upstream, use `git push -u origin <branch>`.
