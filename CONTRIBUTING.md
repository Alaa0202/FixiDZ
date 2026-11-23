# Git Workflow

## Branches

- `main`: stable version. NEVER push directly to it.
- `develop`: integration branch.
- `feature/<topic>`: one branch per Trello card, created from `develop`.
  Examples: `feature/auth`, `feature/repairs-list`, `feature/inventory`.

## Task lifecycle

1. Move the Trello card to **In Progress**.
2. `git checkout develop && git pull && git checkout -b feature/my-topic`
3. Code and make small, clear commits.
4. `git push -u origin feature/my-topic`, then open a **Pull Request** into `develop`.
5. Move the card to **Under Review**: at least one other member reviews and tests it.
6. Once approved, merge the PR and move the card to **Done**.

## Commit messages

Format: `type: short description`

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `refactor:` code cleanup

Example: `feat: add the new repair form`

## Rules

- Run `git pull` before you start working.
- Never commit passwords or `.env` files.
- One PR = one Trello card. Put the card name in the PR title.
