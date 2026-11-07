# Shared agent skills

The fleet's skills home — no per-repo copies. Skills are agent primitives under
[ENG-0006](../docs/decisions/ENG-0006-agentic-primitives-governance.md): read as
directives, shipped with executable scripts, reviewed as code, and owned in
`.github/CODEOWNERS`. A skill listed here either lives in this repo under
`skills/<name>/` or lives in the repo that owns its domain and is cataloged
here by link — never copied into this tree.

## Available skills

None yet. The catalog fills as a fleet gains skills worth sharing across
repos; a skill that only one repo needs belongs in that repo's own tree.

## Installing

Externally owned skills install per the instructions in their own repo's
`SKILL.md`, linked above.

Skills that live in this repo follow one shape — each skill's `SKILL.md`
carries its own install line, symlinking the skill directory into the harness
so a `git pull` here updates every machine, rather than copying and drifting:

```bash
SOP_ROOT="$(git rev-parse --show-toplevel)"
ln -sfn "$SOP_ROOT/skills/<name>" ~/.claude/skills/<name>
```

Distribution is manual today. Automating it — a worktree-create step, or a
plugin marketplace — waits until there are enough shared skills to justify the
machinery; the second skill added here is the signal that the manual step has
become the problem.

## Adding a skill

1. `skills/<name>/SKILL.md` with `name` and `description` frontmatter. The
   description is always in an agent's context while the body loads only when
   relevant, so it must say *when to use this* — that string is the whole
   trigger (ENG-0006 progressive disclosure).
2. Link it from **Available skills** above. `docs-gov` fails a skill reachable
   from no index: guidance nothing links to is guidance no agent loads.
3. Keep it under the `perDoc` token budget. A skill that needs more is usually
   two skills.
4. State what an agent cannot derive from the code or existing docs, and link
   rather than restate — a shared fact in two agent files is a bug
   (ENG-0006 item 1).
5. Treat any script it ships as the supply chain it is: no secrets, no network
   fetch of unpinned code, least privilege.
