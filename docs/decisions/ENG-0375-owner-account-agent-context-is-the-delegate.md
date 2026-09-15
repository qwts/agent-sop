# ENG-0375: Agent context in the owner's account is the delegate — no marker, no undelegable set

**Status:** Proposed
**Date:** 2026-09-15
**Issue:** qwts/agent-sop#375

## Context

[ENG-0339](ENG-0339-os-account-determines-persona.md) decided who an agent
running unpinned in the owner's macOS account *is*: the human's delegate.
[ENG-0353](ENG-0353-delegate-writes-require-an-explicit-marker.md) then
required a human-origin delegation marker before that delegate could touch
the human credential, and declared review approval, merge, and token export
undelegable even with a marker.

The marker was never built. What the fleet ran instead was the pre-0339
refusal: the installed `gh` shim refused stock `gh` from any agent context
outside a bot worktree, unconditionally. On 2026-09-15 the rename in
[#355](https://github.com/qwts/agent-sop/issues/355) and the memory-guard
retirement in [#374](https://github.com/qwts/agent-sop/pull/374) produced a
fleet-wide reconcile — 29 bot-authored pull requests across 17 governed
repositories — and the delegate could not approve a single one. The owner
had to hand-approve, or hand the delegate a working shim, before governance
could converge. ENG-0353's own diagnosis ("the delegate the persona model
promises cannot actually operate") was still true four days after it was
written, and the rule it proposed would have kept the approval step manual
by design.

Meanwhile the agent-bot-identity 0.5.0 shim already implements the ENG-0339
persona directly: in the owner's account an untold harness gets stock `gh`,
and its README states that a delegate's "commits, pushes, and `gh` run as
you, and nothing is refused". The refusal the fleet experienced came from a
stale shim build, not from a decision anyone had made to keep it.

## Decision

1. **Agent context in the owner's account is the delegate, full stop.**
   Unpinned work in the owner's macOS account runs under the human
   credential with human attribution, per ENG-0339. There is no delegation
   marker, no ceremony, and no environment variable to set. A stated bot
   identity (`--app`, `GH_AGENT_APP`, a checkout pin, an agent account)
   still mints and acts as that App; nothing here changes the bot path.

2. **There is no undelegable operation set.** Review approval, merge,
   auto-merge, repository settings, and every other write the owner can
   perform, the delegate can perform. The human-review bar on agent work is
   carried by *authorship*, not by refusing the delegate: agent-authored PRs
   come from `qwts-*-agent[bot]` or `chores-dumb[bot]`
   ([ENG-0016](ENG-0016-agent-pr-bot-identity.md), the branch-and-PR SOP),
   and the human persona approves them. GitHub's own rule that an author
   cannot approve their own PR keeps the two roles distinct.

3. **Credential export stays refused by the shim's existing design, not by
   policy.** `gh auth token` from agent context with a bot identity resolved
   would print the human's token instead of minting the bot's; the 0.5.0
   shim already guards that path as a credential boundary. That guard is a
   correctness property of identity resolution and is not a delegation rule.

4. **The owner-approval mint gate stays.** agent-bot-identity#204 requires a
   macOS authorization dialog for an *unmarked explicit `--app` mint* in the
   owner's account. That gates minting a bot credential from unpinned
   context, a different question from the delegate using the human
   credential, and it does not obstruct delegate work. It is kept as is.

5. **Audit is the runtime's log, attribution is unchanged.** ENG-0353's
   "logged, not marked" survives as ENG-0339 already states it: delegate
   commits carry no `Agent-Identity` trailer, and who acted is answered by
   the runtime's records, not by the artifact.

6. **The shim's passthrough is the documented design.** agent-bot-identity's
   README already describes it; this record makes it a governance
   commitment. A shim build that refuses stock `gh` to an untold harness in
   the owner's account is a defect to fix by reinstalling
   (`agent-bot install-gh-shim`), not a control.

## Why

Requiring a human-origin marker for every delegation, and carving out
approve and merge as undelegable, optimised for a threat the persona model
had already answered: an agent in the owner's account is the owner's
delegate by construction, and the owner accepts that when they run it there.
Keeping the refusal in place did not stop misuse; it stopped governance. The
work agents produce is bot-authored and reviewable; letting the delegate
approve it is how the owner exercises review through the harness rather
than around it.

## Consequences

- ENG-0353 decisions 2 and 3 (the marker and the shim/guard check with a
  fixed undelegable set) are struck. Decision 1 (attribution unchanged) and
  decision 4 (logged, not marked) survive as restated here. Decision 5
  (`doctor` reports delegation state) is moot: there is no state to report.
  Decision 6 (the review bar is undelegable) is reversed by decision 2 above.
- agent-bot-identity#181 (marker issuance, shim and guard marker checks,
  doctor reporting) closes as won't-do. No runtime change is needed: 0.5.0
  already behaves as this record requires.
- A stale shim on a machine reproduces the old refusal. `agent-bot doctor`
  and `agent-bot bootstrap` should treat a shim older than the installed
  package as a finding; that is an agent-bot-identity follow-up, not a
  decision.
- The delegate can approve its own harness's bot-authored PRs in one run
  (the codex-sync approval helper does this today for the harness-sync
  lane). Extending that helper to the reconciler's `governance/baseline-seed`
  lane is now worth doing; it was pointless while approval was undelegable.
- The downside, stated: nothing in the owner's account distinguishes an
  agent that was asked to approve from one that decided to. The owner
  accepts this because the alternative was no delegate at all, and because
  the audit trail (bot authorship of the work, the runtime's delegate log)
  still shows what was approved and by which persona.
