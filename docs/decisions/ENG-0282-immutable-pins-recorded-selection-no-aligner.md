# ENG-0282: Versioning is immutable pins with recorded selection; there is no aligner

**Status:** Proposed
**Date:** 2026-09-15
**Issue:** qwts/agent-sop#282

## Context

[ENG-0279](ENG-0279-immutable-releases-and-repo-lockfiles.md) proposed
signed, immutable releases with a hash manifest, a per-repository lockfile
(`.playbook/lock.json`), and a nightly aligner that opens one align PR per
repository, under the rule that the fleet runs one version, the latest.
[ENG-0355](ENG-0355-static-router-one-pointer-pinned-capabilities.md) then
retired push distribution: nothing is copied into a repository any more, so
there are no distributed files to hash, no lockfile to write, and no aligner
to run. What ENG-0279 got right, that a consumed reference must be immutable
and auditable, still needs a home. Issue #282 is that home.

## Decision

1. **Every consumed reference is a commit.** `uses:` lines, the entries of an
   org repository's `org.json`, and the router's sources name a 40-hex commit.
   Tags may be published for people; nothing consumes them. A branch or a
   moving tag in any of these places is a validation error.
2. **The pin is the record.** Selection is recorded where it is consumed: the
   consumer's workflow file, the org repository's `org.json`, the router's
   `routes.json`. There is no separate lockfile, because a second record of
   the same choice can only disagree with the first.
3. **Pins are verified reachable.** A pinned commit must be an ancestor of the
   pinned repository's default branch, so a squash merge never leaves a
   consumer on a dangling object. The pin-reachability check that enforced
   this here moves to `qwts-agent-ci` and applies to every consumer's
   workflows and to `org.json`.
4. **Capability repositories forbid moving history.** Tag deletion and tag
   updates are refused by a tag ruleset, and the default branch is
   protected, so a pinned commit stays reachable. This is an owner setting
   per repository, recorded in the fleet manifest.
5. **Updating is a reviewed pull request in the consumer**, opened by whoever
   needs the change: a person, or a bot on request. There is no scheduled
   aligner and no fleet-wide latest rule. A repository behind a pin holds a
   recorded choice, not a drift state; a dashboard may show which pin each
   repository carries and never fails one for it.
6. **Rollback is a pin change in the same place.** A defective commit is
   superseded by a fixed one; consumers move when they choose. Nothing is
   yanked, because nothing was pushed.

## Consequences

- ENG-0279 is superseded. ENG-0004's amendment of 2026-08-22, which pointed at
  immutable releases, is itself superseded by the amendment that points here:
  consumers pin exact commits directly, and no release is required.
- Nothing to build: no release manifest, no hash tooling, no lockfile schema,
  no aligner workflow, no staleness view. The tag ruleset and the reachability
  check are the whole integrity surface.
- A security-critical fix propagates only as fast as consumers merge their
  bump. The mitigation is a bot-authored bump PR opened across consumers on
  request, a fan-out someone triggers, not a scheduler.
- Auditing "what is this repository running" is reading its own files: the
  commit in each `uses:` line and in `org.json`, all reachable from a
  protected default branch.
- Version churn in a consumer is visible as pull requests in that consumer,
  which is the review point ENG-0279 wanted and the fleet keeps.

## Alternatives

- **Keep the aligner but make it opt-in:** rejected. An opt-in scheduler is a
  push channel with an off switch, and every repository would carry the stub.
- **Floating major tags (`@v1`):** rejected, as ENG-0279 already found. A
  mutable reference cannot be audited and propagates silently.
- **A lockfile in each repository:** rejected. It duplicates the pin and can
  disagree with the `uses:` line it claims to describe.
- **Fleet-wide latest as a gate:** rejected. It turns every upstream commit
  into a fleet-wide obligation, which is the propagation model ENG-0355 ended.

## References

- [ENG-0004](ENG-0004-centralize-shared-cicd.md), [ENG-0279](ENG-0279-immutable-releases-and-repo-lockfiles.md),
  [ENG-0355](ENG-0355-static-router-one-pointer-pinned-capabilities.md).
