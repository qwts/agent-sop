# ENG-0353: Delegate writes in the owner account require an explicit marker

**Status:** Proposed
**Date:** 2026-09-11
**Issue:** qwts/playbook-engineering#353

## Context

[ENG-0339](ENG-0339-os-account-determines-persona.md) settled who an agent in
the owner's macOS account *is*: the human's delegate — human attribution,
human accountability, no `Agent-Identity` trailer, human workflow end to end.
What it did not settle is the mechanism. The runtime guards predate that
decision and still treat "agent context plus human credential" as an attack
to block, so the delegate the persona model promises cannot actually operate
(qwts/agent-bot-identity#181): the `gh` shim refuses stock `gh` outside bot
territory, and the `pre-commit` guard refuses human-attributed commits — the
fleet-registry commit in managed-machine-config failed exactly this way
(qwts/managed-machine#108). The observed workarounds — shadowing the shim on
`PATH`, clearing agent env markers — are indistinguishable from spoofing and
leave no audit trail.

This is a different class from the bounded human-origin grants of the
[ENG-0016 amendment](ENG-0016-agent-pr-bot-identity.md). Those broker named
remote operations through the identity service; the daemon performs the act
and the agent never holds a credential. A delegate's writes are local — a
commit in a working tree, stock `gh` run in the owner's account — performed
by the agent process itself under the human persona. The grant service does
not cover them; pretending it does would either route `git commit` through a
broker or hand the human token to the agent, both rejected by that amendment.

## Decision

1. **Attribution stays decided; this record governs authorization.** The
   delegate persona remains the default for unpinned agent context in the
   owner's account per ENG-0339 — nothing here changes who a commit is
   attributed to. What requires a decision is when agent context may reach
   the human credential at all.
2. **Human-credential use from agent context requires a delegation marker.**
   The marker is recorded state (for example `agent-bot delegate enable`),
   created only through a human-origin path the agent cannot complete — an OS
   authorization dialog naming the account and the harness, in the same
   spirit as the SSH-enrollment ceremony and the grant-creation bar of the
   ENG-0016 amendment. A conversational "yes" is not a marker, and an env var
   the agent could set itself is not either; the marker must be verifiable
   state the runtime trusts, not input the agent controls.
3. **The shim and the guard check the marker, then pass.** With a valid
   marker and agent context in the owner's account, the `gh` shim passes
   stock `gh` through and the `pre-commit` guard permits the human-attributed
   commit. Without it, both refuse exactly as today — the marker widens
   nothing in an agent account, for root, or under a foreign `HOME`, where
   the refusal stands unconditionally.
4. **Delegate writes are logged, not marked.** Each write the shim or guard
   allows under a marker is recorded as delegated in the runtime's own
   records. Commits carry no `Agent-Identity` trailer or other agent marker —
   ENG-0339's clean-attribution rule stands; audit lives in the log, not in
   the artifact.
5. **`doctor` reports delegation state.** Whether a marker is active, which
   harness/account it names, and when it was granted are part of readiness
   diagnosis.
6. **The review bar stays undelegable.** A delegate's human-attributed work
   cannot satisfy human-approval requirements — the branch/PR SOP already
   forbids agent PRs authored by the human account, and this marker does not
   change that. Work meant for the agent review path still runs pinned or in
   the harness account.

## Why

The persona model without an authorization mechanism produced the worst of
both: the delegate was nominally the default but mechanically impossible, so
operators reached for spoofing-shaped workarounds. Requiring a verifiable
marker — rather than letting agent context in the owner account use the human
credential unconditionally — keeps the dangerous half of the operation
explicit while leaving the decided default intact. An agent session that
wanders into the owner account unpinned still cannot touch the credential
unless a human authorized delegation, which is the property the pre-0339
guards were actually built to protect.

## Consequences

- A human-origin ceremony gates every delegation: issuing a marker needs the
  same class of authorization as SSH enrollment, so "the agent asked and got
  told yes" never suffices.
- Delegate commits remain human commits; any reviewer auditing *who* acted
  consults the delegation log, not the commit — the trailer suggestion in
  qwts/agent-bot-identity#181 is declined in favor of ENG-0339's clean
  attribution.
- Local delegate writes and remote brokered grants are now two distinct,
  separately-authorized mechanisms; tooling must not conflate them, and a
  marker never spends a #108 grant or vice versa.
- Runtime work lives in qwts/agent-bot-identity#181 (marker check in the
  shim and guard, marker issuance, doctor reporting); this record carries no
  implementation.
