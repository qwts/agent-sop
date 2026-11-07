# ENG-0006: Governance of agentic primitives — one canonical source, progressive disclosure, eval-gated changes

**Status:** Proposed
**Date:** 2026-07-22
**Issue:** predates issue-first (ENG-0013)

## Context

Agents write most of the code in this org (the standing premise since
[ENG-0002](https://github.com/qwts/qwts-agent-sop/blob/main/docs/decisions/ENG-0002-static-analysis-direction.md)), and every repo now carries files whose only job is to steer them:
instruction files, slash commands, tool settings, and soon skills and MCP
servers. An agent-orchestration product raises the stakes — its agent
configuration *is* product surface.

The survey that prompted this record (2026-07-22, in the origin fleet; the
fleet-specific tables are preserved in the instance's copy of this record)
found every repo carrying steering files in some state: canonical
`AGENTS.md` with thin vendor pointers; vendor files that had quietly become
the de-facto canonical source; and leftover scaffolding boilerplate — a
stale setup checklist — re-read by every session.

Three observations drive this record:

1. **The good pattern already exists but is convention, not policy.** One
   repo's vendor file opened: *"Start with `AGENTS.md`… This file only adds
   vendor-specific orientation; do not duplicate `AGENTS.md` here."* That is
   exactly right, and nothing required the next repo to do it — another repo
   never adopted it.
2. **These files are attack surface, not documentation.** An instruction file
   steers an agent that holds the repo's write access; a skill or MCP server
   is third-party code in the loop (the same supply-chain class as the
   unpinned actions ENG-0005 found). Today none of it gets security review
   distinct from "it's markdown."
3. **Nothing is measured.** Instruction and skill edits ship on vibes; there
   is no eval answering "did this change make agents better or just longer."
   Meanwhile the tooling to do this properly now exists —
   [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) (MIT, May
   2026) treats a skill file as a trainable parameter: trajectory-driven
   edits, validation-gated updates, a deployable `best_skill.md` artifact.

## Decision

This governs **all agent-customization primitives** — AGENTS.md, vendor
instruction files (CLAUDE.md, copilot-instructions.md, `.cursor` rules),
skills, slash commands, MCP configuration, agent workflows, hooks — **and any
future paradigm in this space**, which inherits these rules by default rather
than arriving ungoverned.

1. **One canonical, vendor-neutral source per repo: `AGENTS.md`.** Vendor
   files are thin adapters: orientation plus a pointer, plus content that is
   genuinely vendor-specific (genuine Copilot *review* rules qualify;
   restated architecture does not). **The test: a shared fact stated in two
   agent files is a bug**, the same way duplicated logic is. Semantic
   redundancy is the failure mode — every restatement is a second copy an
   agent must reconcile and a second place for drift to hide.
2. **Progressive disclosure.** The root file is a map, not a manual: short
   orientation, with depth loaded on demand — per-directory context files,
   skills whose name+description headers are always visible while bodies load
   only when relevant, links into `docs/`. Instructions carry only what an
   agent cannot derive from the code, CI, or existing docs; anything
   derivable is noise that taxes every session's context window. File length
   ratchets like coverage floors: it may shrink freely, growth needs a
   reason.
3. **Agent primitives follow Secure SDLC/STLC.** They are code and move
   through the same lifecycle as code:
   - **Reviewed:** changes land via PR like any source change — no direct
     pushes to instruction files, skills, or MCP config.
   - **Supply-chain controlled:** MCP servers and third-party skills are
     allow-listed per repo and pinned (version or hash), mirroring the
     ENG-0005 SHA-pinning direction for actions. Tool permissions in
     `settings.json` are least-privilege. No secrets in any agent file.
   - **Threat-modeled:** instruction files and skills are prompt-injection
     vectors; content an agent fetches (issues, web, third-party skills) is
     untrusted input, and repo instructions must never instruct agents to
     bypass that boundary.
   - **Tested (the STLC half):** agent-produced code passes the same
     machine-checkable gates as human code (ENG-0002/ENG-0005) — that is
     what makes the "agents write most of the code" premise safe — and the
     primitives themselves get validation in CI (lint, link-check, and a
     duplication check between AGENTS.md and vendor adapters; `jscpd`
     already measures this class).
4. **Evals are the heart.** A change to a skill or instruction file that
   claims to improve agent behavior is validated the way SkillOpt validates
   a skill edit: against tasks, gated on measured improvement. Concretely:
   - Each repo keeps a small set of **golden tasks** (representative issues
     an agent should complete correctly) as its eval set.
   - High-leverage skills are *trained*, not hand-tuned: SkillOpt (or a
     successor — the library is pinned and replaceable; the
     validation-gated-update principle is what this record adopts) produces
     the deployed artifact.
   - An instruction-file PR states what behavior it changes and, where
     feasible, cites eval evidence. "It reads better" is not evidence.
   - An agent-orchestration product dogfoods this from day one: shipping
     agent configuration that is itself unmeasured would be self-refuting.
5. **Placement follows [ENG-0003](ENG-0003-repo-is-documentation-source-of-truth.md)
   and [ENG-0004](https://github.com/qwts/qwts-agent-sop/blob/main/docs/decisions/ENG-0004-centralize-shared-cicd.md):** org-wide agent conventions live
   in this repository and repos point to them; only repo-specific content
   lives in the repo's own AGENTS.md. Shared eval harness wiring is a
   reusable workflow when it stabilizes.
6. **Existing repos must align — there is no grandfathering.** This record
   is prescriptive going forward, and "going forward" includes the current
   repos: each one gets a tracked alignment issue, and a repo is conformant
   only when (a) AGENTS.md exists and is canonical, (b) every vendor file is
   a thin adapter with zero duplicated shared semantics, (c) the root file
   passes a progressive-disclosure review, and (d) agent-facing supply chain
   (MCP servers, third-party skills, tool permissions) is pinned and
   least-privilege. New repos are born conformant; existing repos
   converge rather than coexist with the standard.

## Consequences

- Immediate, mandatory per-repo work (tracked as alignment issues, one per
  repo): the repo whose vendor file had become the de-facto canonical source
  extracts a canonical `AGENTS.md` from it and deletes the
  scaffolding-boilerplate copilot-instructions; this repository adds a root
  AGENTS.md of its own **and brings its existing vendor agent/prompt suite
  under this governance** — vendor-specific interactive handoffs are
  legitimate vendor content, but they get the same review-as-code,
  dedupe-against-`docs/`, and disclosure discipline as everything else; the
  repos with the largest root files take progressive-disclosure passes; the
  already-close pair is audited for duplication; a new repo is bootstrapped
  conformant with its first code.
- Eval-gating adds real friction and token cost to what used to be a
  ten-second markdown edit. Accepted deliberately: unmeasured instruction
  growth is how context windows rot. The golden-task sets start small
  (three to five tasks) so the gate is cheap enough to survive.
- SkillOpt is two months old. Betting on the library is a risk; the record
  therefore binds to the *practice* (trajectory-driven, validation-gated
  skill edits) and treats the library as the current best implementation.
- Vendor adapters stay thin only under discipline; until the CI duplication
  check exists, enforcement is review-time and will occasionally fail.
- "Future paradigms inherit this by default" means a new primitive may be
  briefly over-constrained until an amendment tailors rules to it. That is
  the right failure direction — the alternative is the stale scaffolding
  checklist, multiplied by every new vendor's file format.

## References

- [Org-wide agent conventions](../reference/agent-conventions.md) — the shared working agreement this record's decision item 5 places in this repository; every repo's `AGENTS.md` links here instead of restating it
- [Agentic primitives conformance checklist](../reference/agentic-primitives-conformance-checklist.md) — the operationalized §6 checklist per-repo alignment issues link to
- [ENG-0002](https://github.com/qwts/qwts-agent-sop/blob/main/docs/decisions/ENG-0002-static-analysis-direction.md) — the "agents write most of the code, quality must be machine-checkable" premise this extends to the agents' own configuration
- [ENG-0003](ENG-0003-repo-is-documentation-source-of-truth.md) / [ENG-0004](https://github.com/qwts/qwts-agent-sop/blob/main/docs/decisions/ENG-0004-centralize-shared-cicd.md) — placement and shared-workflow delivery model
- [ENG-0005](https://github.com/qwts/qwts-agent-sop/blob/main/docs/decisions/ENG-0005-static-analysis-survey-results.md) — the supply-chain pinning direction MCP/skill governance mirrors
- [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) · [MSR blog: agent skills as trainable parameters](https://www.microsoft.com/en-us/research/blog/skillopt-agent-skills-as-trainable-parameters/)
- [agents.md](https://agents.md) — the vendor-neutral AGENTS.md convention this adopts as canonical
