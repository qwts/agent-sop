# Agent SOP framework

Agent SOP publishes shared scaffolding. The user owns the configuration and
selected sources. An agent loads its local organization profile and follows
static routers to the appropriate procedures and skills.

## Repository responsibilities

- [agent-sop](https://github.com/qwts/agent-sop) maintains the public framework,
  reusable material, and the intended static site at `agentsop.ai`.
- [agent-org](https://github.com/qwts/agent-org) provides an organization template.
- [qwts-agent-org](https://github.com/qwts/qwts-agent-org) holds the maintainer's
  organization configuration and lookup information.
- [qwts-agent-sop](https://github.com/qwts/qwts-agent-sop) holds the maintainer's
  adopted procedures, fleet governance, and operational tooling.

Other organizations own their instances and select their sources. Missing
configuration must never substitute the maintainer's environment. Offered
procedures and skills require explicit selection. Template-derived copies need
deliberate updates; references to shared skills should identify the revision
used so an agent's instructions can be traced to repository history.

## Static routing

The intended entry flow is:

```text
Static router
  -> initialize or load the local organization profile
  -> resolve the applicable procedure from the user's configuration
  -> retrieve the required skills for the current task
  -> use the user's configured repositories, workflows, and tools
```

`llms.txt` starts with bootstrap and stays compact. `llms-full.txt` expands
resolution and precedence rules; it does not concatenate every configured
repository. Both remain static. An HTTP client cannot obtain browser-local
configuration merely by fetching a router.

## Configuration ownership

The human entry point is a logo and configuration form. Drafts remain in the
browser, with file import and export. Users may deliberately publish the export
in their own repository. Browser editing state, published repository
configuration, and the local agent profile are separate storage surfaces.
Public configuration contains references and non-secret settings, never
credentials. No account system or configuration database is required.

The proposed local profile is `~/.config/agentsop/org.toml`. Bootstrap preserves
an existing valid profile. If none exists, it validates a supplied file or
public configuration reference before initialization. Without a source it
requests one; an invalid profile produces an explanation rather than fallback.
Reading the entry instructions repeatedly does not reset configuration.

## Decisions still open

- The minimal versioned TOML schema, task-to-procedure bindings, skill and role
  references, and explicit override or extension rules.
- The public configuration location and initial source-selector convention.
- Source provenance, explicit refresh, and handling local modifications.
- Whether to honor `$XDG_CONFIG_HOME` and the smallest bootstrap mechanism
  supported by the intended harnesses.

Repository-backed static hosting is preferred. Arbitrary owner/repository paths
must not be assumed to work without host support. Future `org`, `actions`, and
`comms` namespaces describe possible routing surfaces, not service commitments.

## Current implementation state

The organization-specific repository has been seeded with preserved history.
The form, configuration contract, bootstrap helper, routers, and site publishing
are not yet implemented. Legacy operational files stay in `agent-sop` while
consumers are migrated through review; this compatibility retention does not
make those files public framework defaults.

See [the organization discussion](https://github.com/qwts/agent-org/discussions/2),
[the SOP split discussion](https://github.com/qwts/agent-sop/discussions/365), and
[migration tracking](https://github.com/qwts/qwts-agent-sop/issues/1).
