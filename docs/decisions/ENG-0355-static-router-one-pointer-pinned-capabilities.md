# ENG-0355: Distribution is a static router, one local pointer, and pinned capabilities

**Status:** Proposed
**Date:** 2026-09-15
**Issue:** qwts/agent-sop#355

## Context

Four records assume this repository distributes: [ENG-0004](ENG-0004-centralize-shared-cicd.md)
publishes shared CI under a moving major tag, [ENG-0011](ENG-0011-governed-scope-manifest.md)
makes the manifest the source of truth that tooling converges repositories
toward, [ENG-0038](ENG-0038-governance-reconciler.md) proposes the reconciler
that pushes seeds into them, and [ENG-0279](ENG-0279-immutable-releases-and-repo-lockfiles.md)
proposes an aligner that opens a pull request in every repository per release.
Each channel writes into other repositories, needs an operator or bot token
to do it, and leaves a machine unable to answer the first question an agent
has: which organization am I working for, and where are its procedures?

Issue #355 opened as "package the tooling as a CLI with a Homebrew formula".
Its naming half closed with the rename to `agent-sop` (#364). The remaining
half, how procedures, configuration, and tooling reach a machine, was worked
out in discussions [#365](https://github.com/qwts/agent-sop/discussions/365)
(template versus instance), [#367](https://github.com/qwts/agent-sop/discussions/367)
(cleanup), [#371](https://github.com/qwts/agent-sop/discussions/371)
(distribution), [#372](https://github.com/qwts/agent-sop/discussions/372)
(the router), and [qwts/agent-org#2](https://github.com/qwts/agent-org/discussions/2)
(the org repository). Observed costs that drove it: 33 workflow files in 11
repositories pin composite actions under a name this repository no longer
has; the reconcile, drift, and sync lanes needed tokens and produced pull
requests nobody asked for; and a public template carried one organization's
private-looking data (its roster, its manifest, its account notes).

## Decision

1. **Nothing is pushed.** A machine or a repository pulls what it uses by a
   pinned reference, a 40-hex commit. The push lanes are retired
   ([#377](https://github.com/qwts/agent-sop/pull/377)). No tool writes into a
   governed repository; adoption is a reviewed pull request in that repository.
2. **One local pointer.** `~/.config/agentsop/config.toml` carries
   `repos.org = "owner/repo@ref"` and nothing else required. It is written by a
   person or bootstrap tooling, never fetched, and holds no secrets. An
   optional `repos.sop` overrides the SOP instance for testing a change.
3. **The org repository resolves names.** `org.json` at its root pins the SOP
   instance and every capability, each as repository, commit, entry file, and
   one-line summary. `qwts/agent-org` is the public template (schema,
   validators, examples); `qwts/qwts-agent-org` is the qwts instance. The
   governed-scope manifest of ENG-0011, the App roster, and the organization
   profile move there; ENG-0011 stands with its files at the new home.
4. **Zones route questions; the org repository routes names.** `agentsop.ai`
   is a static router (`qwts/agentsop.ai`): zones `root`, `start`, `org`,
   `sop`, `comms`, `skills`, three files each (`index.html`, `llms.txt`,
   `llms-full.txt`), sources that are template repositories pinned by commit.
   No instance and no capability is named on the site, and a capability never
   gets a zone: adding or replacing one is a change in the org repository.
5. **This repository keeps rules, procedures, and guides.** SOPs, the ENG
   series, the SDLC guides, the skills catalog rules, and its own docs-gov
   configuration stay. Each mechanism moves to a capability repository:
   `qwts-agent-ci` (composite actions, CI policy, runtime budgets, pin
   reachability, `release-lifecycles.json`), `qwts-agent-docs-gov` (docs-gov,
   docs-eval, the reusable workflow), `qwts-agent-inventory` (the inventory,
   its reusable workflow, the fleet catalog), `qwts-agent-sdlc` (the Copilot
   agents, prompts, and usage guide); the semantic-ratchet workflow goes to
   `qwts/agentic-code-analysis`. Consumers re-pin to
   `qwts/qwts-agent-ci/.github/actions/<name>@<commit>` and the equivalent
   workflow paths.
6. **The routing unit is a procedure.** A procedure names a capability or a
   skill; an agent resolves the name through `org.json` and loads only that,
   at the pinned commit. Nothing is preloaded at conversation start.

## Consequences

- ENG-0038 is superseded: there is no reconciler. Repository settings remain
  a human action; baseline files are adopted by reviewed pull request under
  the [repository baseline files SOP](../sop/repo-baseline-files.md).
- ENG-0004 is amended: shared CI's home is `qwts-agent-ci`, the consumption
  path changes, and its "this repository's CI passes first" rule applies
  there. ENG-0279 is superseded separately by
  [ENG-0282](ENG-0282-immutable-pins-recorded-selection-no-aligner.md).
- Instance data leaves the public template. This repository's docs name no
  organization; qwts-specific reference material moves to `qwts-agent-org`.
- One more repository per capability, each with its own CI, CODEOWNERS, and
  docs index. A pin bump is a pull request in every consumer; there is no
  aligner to fan it out, so a security-critical fix propagates only as fast
  as consumers merge. A bot may open the bump PRs on request.
- Template and instance can drift. The instance records the template commit
  it took and shares the same validation (`npm run check`); nothing else is
  shared, by design.
- The router needs DNS and hosting the owner operates (GitHub Pages behind
  Cloudflare DNS). Until the records exist, the site's links are pins into
  repositories, so an unreachable site loses nothing but the map.
- The 33 stale pins are a one-time re-pin tracked in #371; until each merges,
  that repository's shared CI is broken exactly as it was before this record.
- Not decided here: whether any capability grows a CLI or a Homebrew formula.
  Nothing currently needs one; if one does, it is that capability's decision.

## Alternatives

- **Immutable releases with align PRs (ENG-0279):** rejected as the
  distribution channel. It is still push-shaped, a bot writing into every
  repository on a schedule. Its immutability requirement survives in ENG-0282.
- **A CLI with a Homebrew formula (the original #355):** rejected. It installs
  a copy on every machine, which is the drift source this design removes; a
  machine now carries one pointer and reads everything else at a commit.
- **A subdomain per capability:** rejected. The org repository already
  answers names; a zone per tool would double the routing surface and let the
  site and the org repository disagree.
- **Keep everything in one repository:** rejected. Instance data in a public
  template, tool contracts mixed with rules, and 30-plus consumers re-pinning
  to a repository that has been renamed three times.

## References

- [ENG-0004](ENG-0004-centralize-shared-cicd.md), [ENG-0011](ENG-0011-governed-scope-manifest.md),
  [ENG-0038](ENG-0038-governance-reconciler.md), [ENG-0279](ENG-0279-immutable-releases-and-repo-lockfiles.md),
  [ENG-0282](ENG-0282-immutable-pins-recorded-selection-no-aligner.md).
- Discussions #365, #367, #371, #372, and qwts/agent-org#2, linked above.

## Amendment, 2026-09-16

The owner's specification in [#372](https://github.com/qwts/agent-sop/discussions/372)
(the opening description and the comment of 2026-09-16 with the arrival
flow and the start text) corrects two decision points as recorded above.
The recorded text stays as history; what applies is:

- **Point 2.** The local file is `~/.config/agent-sop/config.toml`. Its
  `[repos]` table names the agent's repositories: `org` (required), `sop`
  (optional when `org.json` in the org repository pins it), and `comms`
  (optional). Nothing else is local.
- **Point 4.** The zones are `root`, `start`, `org`, `sop`, and `comms`;
  the catalog is the third layer of `sop`, not a zone. The site names no
  repository, organization, or commit, template or otherwise: each zone
  lists files as paths inside the repositories the config file names, and
  the only absolute links are to the site itself. `start` is the owner's
  three steps verbatim. Every `llms.txt` stays under 1600 bytes and every
  `llms-full.txt` under 3200.

Pins by commit (ENG-0282) still apply to what the config file and
`org.json` name; the site itself carries none.
