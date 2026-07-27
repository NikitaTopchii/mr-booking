---
name: commit
description: Validate all repository changes, create a meaningful Conventional Commit message from the staged diff, and create one local Git commit. Use only when the user explicitly asks to commit current work.
---

# Commit

Invoke this skill only after an explicit user request. It creates one local
commit and MUST NOT push. Invoke it as `$commit` or select it through
`/skills` in Codex; it does not define a literal custom `/commit` command.

## 1. Read repository rules

Read the root `AGENTS.md`, `package.json`, and the current Git state. Inspect
the paths in staged, unstaged, and untracked changes. For each path, walk from
the repository root to its containing directory and read every applicable
nested `AGENTS.md`; do not assume nested instructions were loaded
automatically. Follow the routed documents required by the root and nested
instructions.

## 2. Validate Git state

Run and inspect `git status --short`, the current branch, staged and unstaged
changes, unresolved conflicts, and merge, rebase, or cherry-pick state.

Stop without committing if there are no changes, HEAD is detached, conflicts
exist, an in-progress operation needs manual resolution, likely secrets are
present, generated or database files were added accidentally, or clearly
unrelated changes require separate commits.

Never amend automatically, force, push, use `--no-verify`, disable hooks, or
rewrite shared history.

## 3. Inspect for secrets and junk

Before staging, inspect changed and untracked files for `.env` files, private
keys, credentials, tokens, local SQLite database/WAL/SHM files, coverage or
build output, temporary or editor files, and large unrelated binaries.

Do not print secret values. If anything suspicious is found, stop and report
only its path and the reason.

## 4. Run complete verification

Use the package manager pinned in `package.json` and run:

```text
yarn verify:commit
```

Do not commit after a failed check. Do not change production code or tests
merely to make verification pass. If Prettier fails, report the failure and
stop; do not hide or automatically rewrite it. The user may run
`yarn format:write` or ask for a formatting fix, after which the complete
verification MUST run again.

## 5. Review the final changes

After successful verification, run `git diff --check`, inspect the complete
diff, confirm checks generated no unexpected files, and decide whether the
changes are one coherent unit. If not, stop and propose a specific split.

## 6. Stage the coherent change

Run `git add -A`, then inspect `git status --short`,
`git diff --cached --stat`, and `git diff --cached`. Do not commit an empty
staged diff.

Re-evaluate the final staged paths, discover their applicable nested
`AGENTS.md` files, and confirm the staged changes comply with every relevant
routed rule. Stop if they do not. Generate the message only from the staged
diff.

## 7. Write a meaningful message

Use `<type>[optional scope]: <description>`. Allowed types are `feat`, `fix`,
`refactor`, `perf`, `test`, `docs`, `build`, `ci`, `ops`, `chore`, `style`,
and `revert`.

Choose a scope from the actual owning Nx domain or concern, such as `auth`,
`booking`, `rooms`, `schedule`, `notifications`, `pwa`, `api`, `web`, `ui`,
`db`, `docker`, or `repo`.

The subject MUST accurately describe staged changes, use imperative mood,
start its description with a capital letter, omit a final period, and stay at
or below 50 characters when reasonably possible. Never use vague subjects
such as `wip`, `update`, `changes`, or `fix stuff`.

Separate a body with a blank line and wrap it at 72 characters. Explain what
changed, why, and any important trade-offs. Omit the body when the subject
fully explains a very small change. Put breaking changes and real issue
references in footers; never invent an issue number.

Example:

```text
feat(booking): Add slot race protection

Reserve each 30-minute interval atomically so concurrent requests
cannot create overlapping room bookings.
```

## 8. Create one local commit

Write the message to a temporary file outside the repository and run
`git commit -F <temporary-message-file>`. Allow normal hooks to run. If a hook
fails, do not bypass it or commit. Delete the temporary file afterwards.

## 9. Report

Report the short hash, full subject, optional body summary, committed files,
quality commands that passed, and whether uncommitted changes remain. Do not
push.
