# Machine memory guard retirement

The owner [retired the guard on 2026-09-15](https://github.com/qwts/agent-sop/discussions/370#discussioncomment-18456085).
The implementation and dormant backlog are removed from both `agent-sop` and
`qwts-agent-sop`; no standalone extraction or reactivation is planned.

## Disposition

The unfinished requests and defects close as **not planned**:
#179, #223, #238, #240, #301, #302, #303, #308, #327, #329, and #330.
PR #203 implemented only the arithmetic portion of #179; PR #258 implemented
Finding 2 of #223. Retirement does not claim their remaining scope was fixed.

The guard was already removed from harness registration and distribution in
#331. The final cleanup removes the dormant implementation, npm entrypoint,
guard tests, and empty guard-only Copilot adapter. The empty Windsurf baseline
remains so repository-owned identity entries still compose. Identity hooks
and their independent conformance tests remain. The retired-path inventory
continues to remove previously distributed files during manual recovery;
scheduled synchronization remains disabled.

## Historical evidence

- [ENG-0138](../decisions/ENG-0138-machine-scoped-agent-memory-budget.md)
  retains the original proposal and its retirement amendment.
- [Source before retirement](https://github.com/qwts/agent-sop/tree/41af9d7917a418810b3277f2cec969e4e003b0b3/tools/agent-guard)
  preserves the implementation and tests at an immutable revision.
- [Former operational reference](https://github.com/qwts/agent-sop/blob/41af9d7917a418810b3277f2cec969e4e003b0b3/docs/reference/agent-memory-guard.md)
  preserves the old behavior for investigation, not current instructions.

Any future reconsideration starts with a new discussion and a review of what
failed. The separate [local validation policy](agent-conventions.md#validation-before-push)
and computer-use credential-boundary proposal (#333) are unchanged.
