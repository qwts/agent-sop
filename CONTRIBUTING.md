# Contributing

This repository is the org's cross-repo home for engineering decisions (ENG
records), shared SOPs, and guides; the mechanisms it used to host live in
capability repositories consumed at pinned commits (see [README.md](README.md)).
How work moves here:

- **Decisions**: new or changed cross-repo direction is issue-first
  ([ENG-0013](docs/decisions/ENG-0013-issue-first-provenance.md)): open a
  GitHub issue holding the why, then land the ENG record citing it — format,
  numbering, and the supersede-don't-rewrite rule are in
  [docs/decisions/README.md](docs/decisions/README.md). Records enter as
  `Proposed`; the repo owner flips them to `Accepted` in review. All records
  are reviewed against the
  [ENG-0012 priority order](docs/decisions/ENG-0012-decision-priority-order.md).
- **SOPs**: shared procedures live in the [shared SOPs index](docs/sop/README.md) and follow
  [ENG-0008](docs/decisions/ENG-0008-shared-sop-inheritance.md) — baseline
  edits here propagate to every repo, so changes go through PR review with
  the changelog updated.
- **Workflow**: branch → PR → review → merge to `main`, per the shared
  [branch, PR, and review SOP](docs/sop/branch-pr-review.md). Features
  additionally follow the [feature-lifecycle SOP](docs/sop/feature-lifecycle.md)
  ([ENG-0007](docs/decisions/ENG-0007-feature-lifecycle-convention.md)):
  problem, requirements, design, proposed patterns at open; closeout at close.
  Before opening or updating a PR, run the local gates listed in
  [AGENTS.md](AGENTS.md): the docs-gov check from the pinned capability and
  `npm run lint:markdown`.
- **Shared CI** ([ENG-0004](docs/decisions/ENG-0004-centralize-shared-cicd.md),
  amended by [ENG-0355](docs/decisions/ENG-0355-static-router-one-pointer-pinned-capabilities.md)):
  the composite actions and reusable workflows live in `qwts-agent-ci` and
  `qwts-agent-docs-gov` and are consumed at a 40-hex commit; a pin bump in
  this repository is a reviewed PR, and the capability repository's own CI
  passes on a change before any consumer pins it.
- **Agent primitives**: `AGENTS.md`, skills, prompts, and MCP config move
  through the same PR review as source code — see
  [AGENTS.md](AGENTS.md) and [ENG-0006](docs/decisions/ENG-0006-agentic-primitives-governance.md).
