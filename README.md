# agent-sop

The vendor-neutral template for a fleet's agent standard-operating-procedures repository: the ENG decision series, the shared SOPs, the org-wide agent conventions, the shared skills catalog, and the SDLC guides. Create `<your-name>-agent-sop` from it, run the init script the template ships, push, and your copy passes its own governance gates on the first push. The mechanisms a derived fleet consumes — shared CI, the docs-governance gate, the dependency inventory, the Copilot SDLC chain — live in [capability repositories](#capability-repositories), each consumed at a pinned commit ([ENG-0355](docs/decisions/ENG-0355-static-router-one-pointer-pinned-capabilities.md)).

The `qwts` account runs its own instance of this template as [qwts-agent-sop](https://github.com/qwts/qwts-agent-sop); history through 2026-11 — the qwts-specific decision records, fleet surveys, and the rename archaeology (formerly `playbook-engineering`, renamed 2026-09-14, [#355](https://github.com/qwts/agent-sop/issues/355)) — is preserved there, and this repository keeps only what generalizes.

It is also the home for **cross-repo engineering decisions** — see the [decision index](docs/decisions/README.md) — and for the org-wide agent conventions every repo's [AGENTS.md](AGENTS.md) points to; see [AGENTS.md](AGENTS.md) for this repo's own agent context.

## Using this template

```bash
# after "Use this template" created <owner>/<owner>-agent-sop, and you cloned it:
node scripts/init.mjs <owner>
```

The script rewrites the identity surfaces (`CODEOWNERS`, license, package name, issue-template links), renumbers the inherited decision records into a reserved block so your own issue-derived numbering starts fresh, stamps a provenance record, runs the validation gates, and prints the `~/.config/agent-sop/config.toml` pointer that routes an agent harness to the new repository. Details and options: [template instantiation](docs/reference/template-instantiation.md). How harnesses find and consume the result: [harness bootstrap](docs/reference/harness-bootstrap.md).

## Engineering decisions (ENG series)

Durable records for decisions that span more than one repository: tooling
direction, shared conventions, where things live, language and platform choices.

### 📐 [Decision index](docs/decisions/README.md)

Decisions owned by a single repository stay in that repository. The routing test
is simple: **if exactly one repo would have to change, it is not an ENG record.**

## Documentation Structure

The `docs/` folder contains 22 comprehensive guides covering the complete Software Development Life Cycle (SDLC), organized by phase:

### 📋 [Complete Documentation Index](docs/00-documentation_index.md)

**Planning Phase** (Documents 1-6): Requirements, architecture, security, and technology decisions
- [Requirements Gathering](docs/01-requirements_gathering.md)
- [Technology Selection & PoC](docs/02-technology_selection_and_poc.md)
- [Data Governance & Strategy](docs/03-data_governance_and_strategy.md)
- [Security & Compliance Planning](docs/04-security_and_compliance_planning.md)
- [Testing Strategy](docs/05-testing_strategy.md)
- [Architecture Planning](docs/06-architecture_planning.md)

**Development Phase** (Documents 7-16): Infrastructure, deployment, and technical implementation
- [Project Structure Planning](docs/07-project_structure_planning.md)
- [Infrastructure Guidelines](docs/08-infrastructure_guidelines.md)
- [Compute Selection](docs/09-compute_selection.md)
- [Database & Storage Planning](docs/10-database_and_storage_planning.md)
- [Networking & Load Balancing](docs/11-networking_and_load_balancing.md)
- [Observability Stack Planning](docs/12-observability_stack_planning.md)
- [CI/CD Planning](docs/13-cicd_planning.md)
- [Disaster Recovery Planning](docs/14-disaster_recovery_planning.md)
- [Cost Optimization & FinOps](docs/15-cost_optimization_and_finops.md)
- [Performance & Optimization Planning](docs/16-performance_and_optimization_planning.md)

**Operations Phase** (Documents 17-22): Launch preparation, operations, and project completion
- [UAT & Pilot](docs/17-uat_and_pilot.md)
- [Final Validations](docs/18-final_validations.md)
- [End User Training & Change Management](docs/19-end_user_training_and_change_management.md)
- [Launch Checklist](docs/20-launch_checklist.md)
- [Post-Launch Operations](docs/21-post_launch_operations.md)
- [Decommissioning & Retirement](docs/22-decommissioning_and_retirement.md)

Each document includes navigation links, prerequisites, and cross-references to related topics. Use these guides to align on best practices, ensure consistency, and drive quality in your projects.

## Shared standards and tooling

- Organization data — the governed-repos manifest, the agent App roster and its secret-free profile, and the pinned capability map are not in this template. They live in an organization's own org repository, created from the [agent-org](https://github.com/qwts/agent-org/tree/de1a4ecfb86b652e246a3d56cf358b035ce39be4) template, whose contract is [the governed-repos manifest](https://github.com/qwts/agent-org/blob/de1a4ecfb86b652e246a3d56cf358b035ce39be4/docs/manifest.md) and its generated [governed repositories](https://github.com/qwts/agent-org/blob/de1a4ecfb86b652e246a3d56cf358b035ce39be4/docs/governed-repos.md) table (ENG-0011); the agent-bot organization operations runbook (registration, verification, and incident expectations) lives there too.
- [Shared SOPs](docs/sop/README.md) — org-wide standard operating procedures for how work moves, inherited by every repo (ENG-0008).
- [Org-wide agent conventions](docs/reference/agent-conventions.md) — the shared agent working agreement every repo's `AGENTS.md` links to (ENG-0006).
- [Agentic primitives conformance checklist](docs/reference/agentic-primitives-conformance-checklist.md) — the ENG-0006 §6 checklist per-repo alignment issues link to.
- [Shared agent skills](skills/README.md) — skills centralized here and installed into every agent harness, rather than copied per repo (ENG-0006).
- [Dependency reuse policy](docs/reference/dependency-reuse-policy.md) — the ENG-0269 cache contract every consumer of the shared `bounded-dependency-install` action follows.
- [Documentation style guide](docs/23-documentation_style_guide.md) — conventions for writing docs in this playbook.
- [Contributing](CONTRIBUTING.md) — how changes to this repository land.

## Capability repositories

Each mechanism lives in its own repository and is consumed at a 40-hex commit, never a branch or tag. The pins below are the ones this repository's own CI and docs use. A derived fleet either consumes the same public pins — the default, so CI is green from the first push — or forks the capability repositories and repoints its pins ([ENG-0282](docs/decisions/ENG-0282-immutable-pins-recorded-selection-no-aligner.md)); whichever it chooses is recorded in its org repository's `org.json`. Every link goes to the pinned revision.

- [qwts-agent-ci](https://github.com/qwts/qwts-agent-ci/tree/3a5617b287d922e37f262210a1d8750d8217b56d) at `3a5617b` — shared CI (ENG-0267, ENG-0269): the composite actions `ci-policy`, `bounded-command`, `bounded-dependency-install`, `changeset-release-count`, and `ci-runtime-check`, the runtime-policy checker, and the [CI execution policy](https://github.com/qwts/qwts-agent-ci/blob/3a5617b287d922e37f262210a1d8750d8217b56d/docs/ci-execution-policy.md), [CI runtime budgets](https://github.com/qwts/qwts-agent-ci/blob/3a5617b287d922e37f262210a1d8750d8217b56d/docs/ci-runtime-policy.md), [governed CI rollout checklist](https://github.com/qwts/qwts-agent-ci/blob/3a5617b287d922e37f262210a1d8750d8217b56d/docs/governed-ci-rollout.md), and [release-lifecycle fleet handoff](https://github.com/qwts/qwts-agent-ci/blob/3a5617b287d922e37f262210a1d8750d8217b56d/docs/governed-ci-release-lifecycle-fleet.md).
- [qwts-agent-docs-gov](https://github.com/qwts/qwts-agent-docs-gov/tree/67db7dc9c20bc29222fb605b7ff9432fd58a2a3f) at `67db7dc` — the `docs-gov` gate and its reusable workflow, plus the on-demand `docs-eval` loop (ENG-0009, ENG-0010): [documentation governance](https://github.com/qwts/qwts-agent-docs-gov/blob/67db7dc9c20bc29222fb605b7ff9432fd58a2a3f/docs/documentation-governance.md) and [docs evaluation](https://github.com/qwts/qwts-agent-docs-gov/blob/67db7dc9c20bc29222fb605b7ff9432fd58a2a3f/docs/docs-evaluation.md).
- [qwts-agent-inventory](https://github.com/qwts/qwts-agent-inventory/tree/d5746df21099c0394663b35dd16eacd171052a80) at `d5746df` — the report-only [dependency & tooling inventory](https://github.com/qwts/qwts-agent-inventory/blob/d5746df21099c0394663b35dd16eacd171052a80/docs/dependency-inventory.md), its reusable workflow, and the weekly fleet catalog (ENG-0015).
- [qwts-agent-sdlc](https://github.com/qwts/qwts-agent-sdlc/tree/9168b22ad2a7c71938ae12c1c412753773887f04) at `9168b22` — the VS Code Copilot SDLC chain that walks the guides above: seven custom agents, 29 slash-command prompts, the Copilot instructions file, and the [usage guide](https://github.com/qwts/qwts-agent-sdlc/blob/9168b22ad2a7c71938ae12c1c412753773887f04/docs/usage.md).
- [qwts/agentic-code-analysis](https://github.com/qwts/agentic-code-analysis) — the advisory semantic-ratchet workflow lives there: [semantic-ratchet.yml](https://github.com/qwts/agentic-code-analysis/blob/428d35650ac0f304acf6513b6640179ab0438753/.github/workflows/semantic-ratchet.yml) and [semantic-ratchets.md](https://github.com/qwts/agentic-code-analysis/blob/428d35650ac0f304acf6513b6640179ab0438753/docs/reference/semantic-ratchets.md) at `428d356`.
