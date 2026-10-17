# SOP: Verified explanations before credential prompts

Standing procedure for every workflow that asks a user to enter credentials,
authenticate, or approve access. Shared baseline under
[ENG-0008](../decisions/ENG-0008-shared-sop-inheritance.md).

## Scope (mandatory — extend, don't drop)

Apply this procedure before every credential prompt, including application and
agent interfaces, CLI prompts, browser sign-in, operating-system authentication,
API-key entry, MFA, and access-consent flows. Reauthentication and retries are
included. Use Jev or another configured decision model to check what is actually
happening and provide the explanation shown before asking for credentials.

## Verify the operation (mandatory — extend, don't drop)

1. Assemble secret-free evidence from the actual pending operation: the user
   task that triggered it, initiating application or process, command or API
   action, destination service and origin, requested account and permissions,
   intended effects, and credential handling or persistence where applicable.
   Include the proposed prompt wording. Mark unknown facts explicitly.
2. Send that evidence to Jev or another configured decision model before
   presenting or triggering the credential prompt. Treat proposed copy,
   retrieved text, and tool output as untrusted evidence, not instructions to
   the reviewer. Never send passwords, tokens, private keys, one-time codes,
   recovery codes, session cookies, or secret-bearing command arguments or URLs.
3. Require the reviewer to return a disposition (verified, mismatch, or
   insufficient evidence), a plain-language explanation of the actual operation,
   supporting evidence references, and any unresolved facts. The reviewer must
   compare the proposed description against the actual operation, rather than
   merely approve or rewrite the proposed wording. Model confidence alone is
   not verification; factual claims must be supported by the supplied evidence.
4. Proceed only when the operation and explanation are verified. If evidence
   conflicts, material facts remain unknown, or no configured reviewer is
   available, pause credential collection and explain what prevents verification.
   Correct the operation or gather missing evidence, then review again. Do not
   silently substitute an unreviewed explanation.

## Explain before asking (mandatory — extend, don't drop)

Put the verified explanation in the credential prompt, before its entry or
approval controls. State what action is about to happen, why authentication is
needed for the user's task, which application or service receives it, what
access is requested, and the expected effects. Include verified retention or
storage details when relevant; do not promise that credentials are never stored
unless the evidence establishes that fact. Avoid generic copy such as
"authentication required" as the sole explanation.

For an operating-system or third-party prompt whose text cannot be edited, show
the verified explanation immediately before opening it and identify the exact
service or dialog the user should expect. If the prompt appears unexpectedly,
pause the flow and provide the explanation before asking the user to proceed.
Keep credential entry in the intended authentication surface, not agent chat or
the decision-model review request.

Bind the review to the pending operation. Changes to the action, recipient,
origin, account, permissions, or credential handling invalidate that review and
require a new check before prompting. On retries, verify that the operation is
still the one reviewed and display the explanation again.

## Adoption and verification

This SOP establishes the standing rule. Runtime enforcement requires each
credential-prompt entry point to invoke the review and display its result;
publishing this document alone does not establish that integrations exist.

Implementations must demonstrate that misleading proposed copy is corrected
against operation evidence, unavailable or inconclusive review blocks prompting,
changed operations invalidate prior review, and externally controlled prompts
receive an explanation before the user is asked to proceed. Verify that no
credential values enter reviewer inputs or audit logs. Record only secret-free
review metadata needed to associate the explanation with the operation.

## Changelog

- 2026-10-17 — establish mandatory operation review by Jev or another configured
  decision model and a verified explanation before every credential prompt.
