# AGENTS.md

Canonical, vendor-neutral agent context for this repository, per [ENG-0006](docs/decisions/ENG-0006-agentic-primitives-governance.md). This repository carries no vendor instruction file of its own: the Copilot custom-agent/prompt suite that walks the SDLC guides, and the Copilot instructions file that routes to it, live in [qwts-agent-sdlc](https://github.com/qwts/qwts-agent-sdlc/tree/9168b22ad2a7c71938ae12c1c412753773887f04) as thin adapters that add vendor-specific orientation and never restate what is here.

## What this repository is

The org's cross-repo home for engineering decisions (ENG records), shared SOPs, the org-wide agent conventions, and the SDLC guides. The mechanisms every `qwts` repo consumes — shared CI, the docs-governance gate, the dependency inventory, the Copilot SDLC chain — live in capability repositories, each pinned to a commit. Full map: [README.md](README.md).

<!-- governed:shared-agent-discovery:start -->

## Shared agent conventions and skills

PR-first workflow, validation-before-push, commit and PR hygiene, and the
untrusted-input threat model are defined once, for every repo, in the
[org-wide agent conventions](https://github.com/qwts/agent-sop/blob/main/docs/reference/agent-conventions.md).
Before creating or copying a repo-local skill, consult the reviewed
[shared agent skills](https://github.com/qwts/agent-sop/blob/74e775ef23d8e7d8f8e693ccc2329f430978c096/skills/README.md)
index. Reuse only the pinned version supplied by the governed harness; a skill
genuinely specific to this repository belongs in its local context.
This repository is governed by
[agent-sop](https://github.com/qwts/agent-sop) — its
[shared SOPs](https://github.com/qwts/agent-sop/blob/main/docs/sop/README.md)
and [engineering decisions](https://github.com/qwts/agent-sop/blob/main/docs/decisions/README.md)
apply here by default
([ENG-0008](https://github.com/qwts/agent-sop/blob/main/docs/decisions/ENG-0008-shared-sop-inheritance.md):
inherit by default, vary by explicit delta).
<!-- governed:shared-agent-discovery:end -->

## What is specific to this repository

- **ENG records:** format, numbering, and the supersede-don't-rewrite rule are in [docs/decisions/README.md](docs/decisions/README.md). Adding or changing a record updates its row in that index table in the same PR — an unindexed record fails docs-gov's `orphan-doc` check.
- **SOPs:** baselines under [docs/sop/](docs/sop/) propagate to every repo per [ENG-0008](docs/decisions/ENG-0008-shared-sop-inheritance.md); edits need the changelog at the bottom of the SOP updated.
- **Governed scope:** the set of governed repos is the manifest `governance/repos.json` in the organization's org repository, not in this template ([ENG-0011](docs/decisions/ENG-0011-governed-scope-manifest.md); the contract and its validators are [agent-org](https://github.com/qwts/agent-org/blob/de1a4ecfb86b652e246a3d56cf358b035ce39be4/docs/manifest.md)). Editing the manifest, the App roster, or the capability pins is a PR there; nothing here holds or checks organization data.
- **Docs-gov gate:** every change under `docs/` or `skills/`, plus this file, must pass the docs-gov check and `npm run lint:markdown` before a PR is opened or updated. The check runs from the pinned `qwts-agent-docs-gov` capability — the same commit `.github/workflows/ci.yml` calls — against this repository's `docs-gov.config.json`:

  ```bash
  git clone -q https://github.com/qwts/qwts-agent-docs-gov.git /tmp/docs-gov && git -C /tmp/docs-gov checkout -q 67db7dc9c20bc29222fb605b7ff9432fd58a2a3f && node /tmp/docs-gov/tools/docs-gov/docs-gov.mjs --root .
  ```

  See [documentation governance](https://github.com/qwts/qwts-agent-docs-gov/blob/67db7dc9c20bc29222fb605b7ff9432fd58a2a3f/docs/documentation-governance.md) for what each rule catches. New files must be reachable by link from [README.md](README.md), or the `orphan-doc` rule fails them.
- **Machine memory guard:** retired by the owner. The [retirement record](docs/reference/agent-memory-guard.md) preserves the decision, issue dispositions, and historical source; downstream removal paths remain recorded.
- **Shared skills:** [skills/](skills/README.md) holds skills installed into every agent's harness, not just this repo's. They are ENG-0006 primitives owned in `.github/CODEOWNERS` and subject to the same gates as docs; adding one means linking it from the skills index.
- **Shared CI:** this repository hosts no reusable workflows or composite actions any more. Its own `.github/workflows/ci.yml` consumes `qwts-agent-ci` (Action Policy, bounded installer, runtime-policy check) and `qwts-agent-docs-gov` (the docs gate) at the 40-hex commits listed in [README.md](README.md) ([ENG-0004](docs/decisions/ENG-0004-centralize-shared-cicd.md) as amended by [ENG-0355](docs/decisions/ENG-0355-static-router-one-pointer-pinned-capabilities.md)). A pin bump is a reviewed PR here; the [pin-reachability guard](https://github.com/qwts/qwts-agent-ci/blob/3a5617b287d922e37f262210a1d8750d8217b56d/tools/pins/pin-reachability.mjs) in `qwts-agent-ci` ([ENG-0282](docs/decisions/ENG-0282-immutable-pins-recorded-selection-no-aligner.md)), run from a checkout of that repository at the pinned commit with this repository's root as the working directory, verifies each pin is reachable from the capability repository's default branch.

## ENG-0006 conformance

This repo's own status against the checklist: [agentic primitives conformance checklist](docs/reference/agentic-primitives-conformance-checklist.md).
