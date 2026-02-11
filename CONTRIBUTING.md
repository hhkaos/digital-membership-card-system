# Contributing to AMPA Digital Membership Card System

Thanks for helping improve the project! This guide covers how to set up the repo, run checks, and record AI-assisted work in commits.

## ✅ Before you start

- **Node.js >= 20** (recommended: use `nvm` and the `.nvmrc`)
- **npm** (comes with Node)
- macOS/Linux/Windows supported

## 📦 Install dependencies

From the repo root:

1. Install root dependencies (Husky hooks):
   - `npm install`
2. Install app dependencies:
   - `cd verification && npm install`
   - `cd ../issuer && npm install`

## ▶️ Run the apps locally

- **Issuer app** (card generation, local only):
  - `cd issuer && npm run dev`
  - Opens at http://localhost:5174

- **Verification app** (public verification UI):
  - `cd verification && npm run dev`
  - Opens at http://localhost:5173

## ✅ Tests and linting

- Run all tests from the repo root:
  - `npm test`
- Run tests per app:
  - `cd issuer && npm test`
  - `cd verification && npm test`
- Lint:
  - `cd issuer && npm run lint`
  - `cd verification && npm run lint`

> Note: a pre-push hook runs tests automatically via Husky.

## 🤖 AI-generated code policy

We want AI-assisted changes to be **clearly attributable** and easy to audit. Please use the dedicated Git alias when the commit contains AI-generated code or significant AI assistance.

### 1) Configure your Git aliases

Add this to your **global** Git config (`~/.gitconfig`):

```
[alias]
  cai = "!f(){ git -c user.name='AI Generated ([YOUR GITHUB USERNAME])' -c user.email='ai@invalid' commit -m \"AI: $1\"; }; f"
  ch = "!f(){ git commit -m \"$1\"; }; f"
```

Alternatively, configure via command line:

```
git config --global alias.cai "!f(){ git -c user.name='AI Generated ([YOUR GITHUB USERNAME])' -c user.email='ai@invalid' commit -m \"AI: \$1\"; }; f"
git config --global alias.ch "!f(){ git commit -m \"\$1\"; }; f"
```

### 2) Use the aliases

- AI-assisted commit:
  - `git cai "scaffold store locator UI"`
- Regular human commit:
  - `git ch "fix accessibility and edge cases"`

### 3) Expectations

- **Review** AI output before committing.
- Prefer small, focused commits.
- Mention AI usage in PR description when relevant.

## 🛠️ Claude Code skills

If you use [Claude Code](https://docs.anthropic.com/en/docs/claude-code), this project includes custom skills (slash commands) that automate common workflows:

### `/ship` — commit and push

1. Type `/ship` in the Claude Code chat.
2. Claude reviews your changes, updates `CHANGELOG.md`, stages the relevant files, and generates a commit message following the project's conventional commit style.
3. You choose the alias: **`git cai`** (AI-attributed) or **`git ch`** (regular).
4. Claude commits and pushes for you.

Skill definition: `.claude/skills/ship/SKILL.md`

### `/release` — create a versioned release

1. Type `/release` in the Claude Code chat.
2. Claude shows the unreleased changelog entries and suggests a version bump (major, minor, or patch) based on the nature of the changes.
3. Claude updates `CHANGELOG.md`, bumps `package.json` versions, runs tests, builds both apps, and creates zip assets.
4. You choose the commit alias, then Claude commits, tags, pushes, and creates a GitHub Release with the changelog notes and build artifacts attached.

Skill definition: `.claude/skills/release/SKILL.md`

## 🔐 Security and data handling

- **Never commit private keys** or unredacted member data.
- `verification/src/config.json` must contain **only public keys**.
- CSV examples should use fake/sample data.

## ✅ Pull request checklist

- Tests and lint pass
- Clear description of changes
- Screenshots for UI changes (if applicable)
- Link related issues or tasks

## 💬 Need help?

Open an issue or start a discussion in the repository. We’re happy to help.
