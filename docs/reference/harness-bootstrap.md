# Harness bootstrap

How an agent harness finds this repository and what it should read once it
arrives. This repository is the fleet's SOP source in the static-router
architecture of [ENG-0355](../decisions/ENG-0355-static-router-one-pointer-pinned-capabilities.md):
nothing pushes into a harness, and nothing preloads at conversation start.

## The one local pointer

`~/.config/agent-sop/config.toml` is the only local state. Its `[repos]`
table names the repositories an agent works from:

```toml
[repos]
sop = "<owner>/<owner>-agent-sop"
# org = "<owner>/<owner>-agent-org"    # when the org repository exists
```

The file is written by a person or by the instantiation script
([template instantiation](template-instantiation.md)), never fetched, and
holds no secrets. An agent resolving a procedure records the 40-hex commit it
read from in the work it produces ([ENG-0282](../decisions/ENG-0282-immutable-pins-recorded-selection-no-aligner.md)),
so its output is auditable against an exact revision.

The public router at agentsop.ai is stateless: its zones route questions to
files inside the repositories this config names, and the site itself names no
repository, organization, or commit.

## What a harness reads here

- **Self-check:** the gates this repository holds itself to — the pinned
  docs-gov check and `npm run lint:markdown`, both documented in
  [AGENTS.md](../../AGENTS.md). A harness validating its own edits to this
  repository runs exactly those.
- **How-to:** the SDLC guides under `docs/` (planning, development, and
  operations), loaded on demand per topic — never in bulk.
- **Catalog:** the [shared skills index](../../skills/README.md). Skills that
  live here install by symlink so a pull updates every machine:

  ```bash
  SOP_ROOT="$(git rev-parse --show-toplevel)"
  ln -sfn "$SOP_ROOT/skills/<name>" ~/.claude/skills/<name>
  ```

- **Rules:** [org-wide agent conventions](agent-conventions.md) for
  PR-first workflow, validation-before-push, and the untrusted-input threat
  model; the [shared SOPs](../sop/README.md) for how work moves.

## Fleet repositories point here

A repository governed by this fleet does not copy any of the above into its
own tree ([ENG-0008](../decisions/ENG-0008-shared-sop-inheritance.md): a copy
is a fork; a fork is drift). Its `AGENTS.md` carries the governed
shared-agent-discovery block with **absolute** links into this repository,
for example:

```markdown
This repository is governed by <owner>/<owner>-agent-sop — its
[shared SOPs](https://github.com/<owner>/<owner>-agent-sop/blob/main/docs/sop/README.md)
and [engineering decisions](https://github.com/<owner>/<owner>-agent-sop/blob/main/docs/decisions/README.md)
apply here by default.
```

Only the block is projected; repo-specific context stays outside it. This
repository's own [AGENTS.md](../../AGENTS.md) uses relative links for the
same block, because it is the SOP home itself.
