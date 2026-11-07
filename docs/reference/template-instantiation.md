# Template instantiation

How a repository created from this template becomes a working agent-SOP home:
one script run, then a push. The script is [scripts/init.mjs](../../scripts/init.mjs);
this reference is the argument between the steps.

The template ships as a valid, green instance of itself — its own CI and
docs-gov pass with the origin identity — so every file a derivative receives
is one the gates have already accepted. Instantiation rewrites identity only;
mechanisms, pins, and procedures are untouched.

## Prerequisites

- The repository was created from this template ("Use this template"), and
  Node.js 22+ is installed locally.
- Network access for the gates: `npm ci`, and a clone of the pinned
  docs-gov capability (the same command [AGENTS.md](../../AGENTS.md) documents).
- A GitHub account whose login is the `<owner>` the repository lives under.

## Steps

1. **Create the repository.** Default name: `<owner>-agent-sop`. Any name
   works — pass it with `--name`. The ENG record numbers this template
   inherits occupy low values, so the name itself carries no constraint.
2. **Clone it and run the script from the repository root:**

   ```bash
   node scripts/init.mjs <owner>
   ```

3. **Review and push.** The script prints every file it touched, runs the
   gates, and prints the local pointer to write. CI is green on the first
   push.

## What the script changes

- **Identity surfaces:** the `CODEOWNERS` owner, the license copyright line,
  the `package.json` name, the README title, and the feature issue
  template's absolute links.
- **docs-gov configuration:** `homeRepo` becomes `<owner>/<name>`; the
  issue-derived `Issue` field pattern accepts both the new owner and
  `qwts/` (the inherited records cite origin issues as provenance); the
  inherited records are grandfathered to the renumbered block.
- **ENG-9xxx renumber:** the eighteen inherited records move to a reserved
  block (record `0001` becomes `9001`, record `0355` becomes `9355`) and every
  citation of them is rewritten. This is what makes [ENG-0035](../decisions/ENG-0035-issue-derived-record-numbers.md)
  work unchanged in the derivative: a new record's number is its own issue
  number, starting at `0001`, with no collision against inherited history.
  Records that retired from the template keep their original numbers — they
  are the qwts instance's records now, and citations to them point there.
- **Provenance record:** `ENG-0000-template-provenance.md` records the
  template commit and the adoption decision, with an index row. Its number
  is a reserved slot; re-point its `Issue` field once a tracking issue
  exists, or supersede it.

## Options

- `--name <repo-name>` — repository name when it is not `<owner>-agent-sop`.
- `--capability-forks <owner>` — repoint the capability pins at forks under
  `<owner>` instead of consuming the public `qwts` capabilities. The commit
  pins stay the same (a fork shares upstream history), so
  [ENG-0282](../decisions/ENG-0282-immutable-pins-recorded-selection-no-aligner.md)
  reachability holds. The default — no flag — consumes the public pins, and
  CI is green from the first push.
- `--write-local-config` — write `~/.config/agent-sop/config.toml` (left
  untouched if it exists). Without the flag the snippet is printed.
- `--dry-run` — print the plan, write nothing.
- `--skip-gates` — skip `npm ci`, markdownlint, and docs-gov (CI will run
  them anyway).

## After instantiation

- `npm run check:template` is the org-neutrality lint: it fails on any stray
  origin identity outside the allowlist (upstream pins, instance links, and
  provenance prose). CI runs it. Use it to verify a manual edit did not
  reintroduce template-owned identity.
- The repo registers no decision-series state beyond its own records; its
  fleet's org data belongs in an org repository built from the org-repo
  contract ([ENG-0011](../decisions/ENG-0011-governed-scope-manifest.md)).
- Agent harnesses find this repository through the local pointer; see
  [harness bootstrap](harness-bootstrap.md).
