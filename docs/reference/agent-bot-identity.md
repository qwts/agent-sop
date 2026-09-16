# Agent bot identity governance

The `qwts` organization uses one GitHub App per agent so bot-authored pull
requests remain eligible for the human approval required by the
[branch, PR, and review SOP](../sop/branch-pr-review.md). This document owns
the policy; the roster is data in the organization's org repository, under the
[agent-org](https://github.com/qwts/agent-org/blob/de1a4ecfb86b652e246a3d56cf358b035ce39be4/README.md) contract; the standalone
[`agent-bot-identity`](https://github.com/qwts/agent-bot-identity/tree/9ff7ce00b6a6945c7f249cf7a6ebf37cf58e86ee)
repository owns runtime code, installation, hooks, token minting, and
troubleshooting ([ENG-0128](../decisions/ENG-0128-agent-bot-runtime-ownership.md)).

## Organization identity model

- Every independently attributable agent has its own App; the active roster
  is **harness-level** — one App per harness, no active model-level
  identities ([ENG-0339](../decisions/ENG-0339-os-account-determines-persona.md)).
- Resolution picks the harness's default App, with macOS account name as the
  fallback detection input. A worktree pin
  ([ENG-0079](../decisions/ENG-0079-per-agent-identity.md)) remains the
  explicit override but must name an active App: reactivating a retired
  slug means restoring its row, App, and installations, not pinning it.
- Agents use short-lived installation tokens; humans never author through an
  agent App, and agent Apps never approve pull requests.
- Bot territory is the harness's macOS account, not a directory; worktrees
  are layout only, with no enforcement (ENG-0339 supersedes ENG-0045).
- Conversation-level Agent IDs add audit provenance without granting authority
  ([ENG-0081](../decisions/ENG-0081-transcript-bound-agent-execution-identities.md)).

## Roster

`governance/agents.json` in the org repository is the source of truth, and
`governance/organization-profile.json` beside it is the secret-free projection
the runtime bootstraps from. Drift validates every active App against every
active and onboarding governed repository; retired identities keep their rows
but leave the active set.

Which identities are active, one per harness
([ENG-0339](../decisions/ENG-0339-os-account-determines-persona.md): the
harness-level slug is also the macOS agent account name), and which are
retired is read from `governance/agents.json` in the org repository, never
from this document: a copy here would go stale on the next roster change and
would put one organization's data in a template every organization consumes.

Adding an App requires one roster row with its exact slug, harness, and active
status. Removing access means retiring the row, revoking or narrowing the App,
and verifying drift; never delete history to hide a former identity.

## Permissions and installation coverage

Each App is owned by `qwts`, installed only on selected repositories, and has:

- Contents: read and write.
- Pull requests: read and write.
- Issues: read and write.
- Metadata: read.

No App receives approval authority, org-wide installation, user-to-server
OAuth, or unrelated permissions. Every active App must be installed on every
active and onboarding repository in the org repository's `governance/repos.json`;
a narrower scope is drift, not a per-agent exception.

## Runtime contract

Governed integrations invoke the installed executable by name or through an
explicit `AGENT_BOT_BIN` override. They never import runtime modules or depend
on a clone path. The stable contracts used here are:

```text
agent-bot setup-worktree
agent-bot mint-token --app <slug> --json
agent-bot claude-worktree-create
agent-bot doctor
```

The mint command's stdout is a credential and must be parsed without logging.
Missing executables, nonzero exits, malformed JSON, and missing tokens fail
closed. Installation and CLI details are in the pinned standalone
[README](https://github.com/qwts/agent-bot-identity/blob/9ff7ce00b6a6945c7f249cf7a6ebf37cf58e86ee/README.md).
