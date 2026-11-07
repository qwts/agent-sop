#!/usr/bin/env node
// Instantiate this template as <owner>'s agent-SOP repository.
//
//   node scripts/init.mjs <owner> [--name <repo-name>] [options]
//
// The template ships as a valid, green instance of itself (qwts identity),
// per ENG-0355's template/instance split. This script rewrites that identity
// to the derivative's, renumbers the inherited ENG genesis records into the
// reserved ENG-9xxx block so the derivative's own issue-derived numbering
// (ENG-0035) starts fresh at 0001 without collision, stamps a provenance
// record, and runs the validation gates. Nothing else changes: upstream
// capability pins stay literal unless --capability-forks repoints them.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const DOCS_GOV_PIN = "67db7dc9c20bc29222fb605b7ff9432fd58a2a3f";
const TEMPLATE_REPO = "qwts/agent-sop";

// Records this template inherits as a derivative's series genesis (the 2026-11
// conversion kept these; everything else retired to the qwts instance).
const GENESIS = [
  "0001", "0003", "0006", "0007", "0008", "0009", "0010", "0011", "0012",
  "0013", "0014", "0015", "0035", "0267", "0269", "0282", "0313", "0355",
];

const CAPABILITIES = ["qwts-agent-ci", "qwts-agent-docs-gov", "qwts-agent-inventory", "qwts-agent-sdlc"];

const TEXT_GLOBS = [".md", ".yml", ".yaml", ".json"];
const SKIP_FILES = new Set(["package-lock.json"]);
const SKIP_DIRS = new Set([".git", "node_modules"]);

let DRY = false;
const log = [];

function parseArgs(argv) {
  const args = { flags: new Set(), options: new Map(), positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--check") args.flags.add("check");
    else if (a === "--dry-run") args.flags.add("dry-run");
    else if (a === "--skip-gates") args.flags.add("skip-gates");
    else if (a === "--write-local-config") args.flags.add("write-local-config");
    else if (a === "--capability-forks") args.options.set("capability-forks", argv[++i]);
    else if (a === "--name") args.options.set("name", argv[++i]);
    else if (a === "--root") args.options.set("root", argv[++i]);
    else args.positional.push(a);
  }
  return args;
}

function isDirectory(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

function listTrackedFiles(root) {
  // Git-tracked text files only: untracked scratch never enters a rewrite.
  // Falls back to a directory walk when git is unavailable (e.g. a fixture).
  let tracked = [];
  try {
    const out = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
    tracked = out
      .split("\n")
      .filter((f) => f && !SKIP_FILES.has(f) && TEXT_GLOBS.some((g) => f.endsWith(g)));
  } catch {
    tracked = [];
  }
  if (tracked.length > 0) return tracked;
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const abs = join(dir, entry);
      if (SKIP_FILES.has(entry)) continue;
      if (isDirectory(abs)) {
        if (entry === ".git" || entry === "node_modules") continue;
        walk(abs);
      } else if (TEXT_GLOBS.some((g) => entry.endsWith(g))) out.push(abs);
    }
  };
  walk(root);
  return out.map((abs) => abs.slice(root.length + 1));
}

function read(root, rel) { return readFileSync(join(root, rel), "utf8"); }

// Disk-truthful text file list: git's index goes stale the moment this script
// renames docs/decisions/ files, so reconcile it with the directory itself.
function currentFiles(root) {
  const tracked = listTrackedFiles(root).filter((f) => existsSync(join(root, f)));
  const dir = join(root, "docs", "decisions");
  const decisions = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => `docs/decisions/${f}`)
    : [];
  return [...new Set([...tracked, ...decisions])];
}

function write(root, rel, text) {
  log.push(`  write: ${rel}`);
  if (!DRY) writeFileSync(join(root, rel), text);
}

function replaceIn(root, rels, re, to, label) {
  for (const rel of rels) {
    const before = read(root, rel);
    const after = before.replace(re, to);
    if (after !== before) {
      write(root, rel, after);
      log.push(`  ${label}: ${rel}`);
    }
  }
}

function renameInDecisionsDir(root, from, to) {
  log.push(`  rename: docs/decisions/${from} -> docs/decisions/${to}`);
  if (!DRY) renameSync(join(root, "docs", "decisions", from), join(root, "docs", "decisions", to));
}

// --- identity -------------------------------------------------------------

function substituteIdentity(root, owner, name) {
  const year = new Date().getFullYear();
  replaceIn(root, [".github/CODEOWNERS"], /\@qwts\b/g, `@${owner}`, "codeowners");
  replaceIn(root, ["LICENSE"], /Copyright \(c\) \d{4} qwts/, `Copyright (c) ${year} ${owner}`, "license");
  replaceIn(root, ["package.json"], /"name": "agent-sop"/, `"name": "${name}"`, "package");
  replaceIn(root, ["README.md"], /^# agent-sop$/m, `# ${name}`, "readme");
  replaceIn(
    root,
    [".github/ISSUE_TEMPLATE/feature.yml"],
    /github\.com\/qwts\/agent-sop\/blob\/main/g,
    `github.com/${owner}/${name}/blob/main`,
    "issue-template",
  );
}

// --- docs-gov config ------------------------------------------------------

function rewriteDocsGovConfig(root, owner, name) {
  const rel = "docs-gov.config.json";
  const config = JSON.parse(read(root, rel));
  config.decisionSeries.homeRepo = `${owner}/${name}`;
  config.decisionSeries.homeRepoAliases = [TEMPLATE_REPO];
  config.decisionSeries.grandfathered = ["docs/decisions/ENG-9???-*.md"];
  const issue = `^(${owner}|qwts)/[\\w.-]+#\\d+$`;
  const issueInherited = `^(${owner}|qwts)/[\\w.-]+#\\d+$|^predates issue-first \\(ENG-9013\\)$`;
  config.structure.requiredFields = [
    ...config.structure.requiredFields.filter((r) => !r.fields.some((f) => f.name === "Issue")),
    {
      glob: "docs/decisions/ENG-*.md",
      exclude: ["docs/decisions/ENG-9???-*.md"],
      fields: [{ name: "Issue", pattern: issue }],
    },
    {
      glob: "docs/decisions/ENG-9???-*.md",
      fields: [{ name: "Issue", pattern: issueInherited }],
    },
  ];
  write(root, rel, `${JSON.stringify(config, null, 2)}\n`);
  log.push(`  docs-gov config: homeRepo ${owner}/${name}, inherited records grandfathered to ENG-9xxx`);
}

// --- ENG-9xxx renumber ----------------------------------------------------

function renumberGenesis(root) {
  const set = new Set(GENESIS);
  // 0006 -> 9006: the reserved block replaces the leading digit, keeping the
  // four-digit field width.
  const to9 = (n) => `ENG-9${n.slice(1)}`;
  const dir = join(root, "docs", "decisions");
  for (const n of GENESIS) {
    for (const f of readdirSync(dir)) {
      const m = f.match(new RegExp(`^ENG-${n}-(.+)$`));
      if (m) renameInDecisionsDir(root, f, `${to9(n)}-${m[1]}`);
    }
  }
  log.push(`  renumbered ${GENESIS.length} inherited records into the ENG-9xxx block`);
  // Token rewrite: only numbers an inherited record owns. Retired numbers stay
  // as written — their records live in the qwts instance under those numbers.
  // The list is taken fresh: the renames above made the caller's list stale
  // for docs/decisions/.
  const re = /ENG-(\d{4})\b/g;
  for (const rel of currentFiles(root)) {
    const before = read(root, rel);
    const after = before.replace(re, (m, n) => (set.has(n) ? to9(n) : m));
    if (after !== before) {
      write(root, rel, after);
      log.push(`  renumber citations: ${rel}`);
    }
  }
}

// --- genesis record --------------------------------------------------------

function stampGenesis(root, owner, name) {
  const today = new Date().toISOString().slice(0, 10);
  const rel = "docs/decisions/ENG-0000-template-provenance.md";
  const body = `# ENG-0000: This repository is instantiated from the agent-sop template

**Status:** Accepted
**Date:** ${today}
**Issue:** ${owner}/${name}#0

## Context

This repository was created from the public [\`${TEMPLATE_REPO}\`](https://github.com/${TEMPLATE_REPO})
template — the vendor-neutral agent SOP repository: the ENG decision series,
the shared SOPs, the org-wide agent conventions, the shared skills catalog,
and the SDLC guides. Mechanisms live in capability repositories consumed at
pinned commits (ENG-9355).

## Decision

1. This repository adopts the template's shared SOPs, agent conventions, and
   the inherited ENG records as its fleet's baseline, under ENG-9008's
   inherit-by-default rule.
2. The inherited records are renumbered into the reserved ENG-9xxx block so
   this repository's own issue-derived numbering (ENG-9035) starts fresh:
   a new record's number is its originating issue number here.
3. This record's number is the reserved provenance slot; once a tracking
   issue exists, its Issue field is re-pointed there, or a later record
   supersedes this one.

## Consequences

- The gates (docs-gov, markdownlint) pass from the first push; CI consumes
  the pinned capability repositories.
- Fleet repositories link their baselines here and never copy them
  (ENG-9008). Variations are recorded deltas.
`;
  write(root, rel, body);
  // Index row on top of the table.
  const indexRel = "docs/decisions/README.md";
  const index = read(root, indexRel);
  const row = `| [ENG-0000](ENG-0000-template-provenance.md) | This repository is instantiated from the agent-sop template | Accepted |\n`;
  const marker = "| --- | --- | --- |\n";
  if (!index.includes(marker)) throw new Error("decision index table not found");
  write(root, indexRel, index.replace(marker, `${marker}${row}`));
  log.push(`  genesis record: ${rel} (+ index row)`);
}

// --- capability forks ------------------------------------------------------

function repointCapabilityForks(root, files, forkOwner) {
  for (const cap of CAPABILITIES) {
    replaceIn(root, files, new RegExp(`qwts/${cap}/`, "g"), `${forkOwner}/${cap}/`, "fork");
  }
  replaceIn(root, files, /github\.com\/qwts\/qwts-agent-/g, `github.com/${forkOwner}/qwts-agent-`, "fork");
}

// --- local pointer ----------------------------------------------------------

export function localConfigSnippet(owner, name) {
  return `# Written by scripts/init.mjs — the one local pointer of ENG-0355.
[repos]
sop = "${owner}/${name}"
# org = "${owner}/${owner}-agent-org"  # add when the org repository exists
`;
}

function writeLocalConfig(owner, name) {
  const dir = join(homedir(), ".config", "agent-sop");
  const target = join(dir, "config.toml");
  if (existsSync(target)) {
    log.push(`  local pointer: ${target} already exists — left untouched`);
    return;
  }
  log.push(`  local pointer: write ${target}`);
  if (!DRY) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(target, localConfigSnippet(owner, name));
  }
}

// --- org-neutrality check ---------------------------------------------------

const ALLOW_PATTERNS = [
  /github\.com\/qwts\//,                    // upstream capability and instance links
  /\bqwts-agent-(ci|docs-gov|inventory|sdlc|org|sop)\b/, // capability repository names
  /\bqwts\/qwts-agent-/,                    // uses: lines and pin paths
  /\bqwts instance\b/,                      // history prose
  /`qwts` account/,                         // README history note
  /qwts\/agent-sop/,                        // template provenance
  /"pattern": ".*qwts/,                     // docs-gov Issue patterns cite provenance
  /"homeRepoAliases"/,                      // alias list, rewritten by init
  /`qwts\/` \(the inherited records/,       // instantiation doc: provenance prose
  /public `qwts` capabilities/,             // instantiation doc: fork escape hatch
];

const IDENTITY_FILES = ["CODEOWNERS", "LICENSE"];

export function checkNeutrality(root) {
  const findings = [];
  // The template ships as a valid instance of itself, so its own identity
  // files legitimately carry the origin identity; a derivative must not.
  let templateMode = false;
  try {
    templateMode = JSON.parse(read(root, "docs-gov.config.json")).decisionSeries?.homeRepo === TEMPLATE_REPO;
  } catch { /* absent config behaves as derivative */ }
  const files = listTrackedFiles(root)
    .filter((f) => !f.startsWith("docs/decisions/"))
    .concat(IDENTITY_FILES.filter((f) => existsSync(join(root, f))));
  for (const rel of [...new Set(files)]) {
    if (templateMode && IDENTITY_FILES.includes(rel)) continue;
    if (templateMode && rel === "docs/reference/template-instantiation.md") continue; // documents the substitution
    const lines = read(root, rel).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!/\bqwts\b/i.test(lines[i])) continue;
      if (ALLOW_PATTERNS.some((p) => p.test(lines[i]))) continue;
      findings.push({ file: rel, line: i + 1, text: lines[i].trim().slice(0, 120) });
    }
  }
  return findings;
}

// --- gates -------------------------------------------------------------------

function runGates(root) {
  const run = (cmd, args) => {
    log.push(`  gate: ${cmd} ${args.join(" ")}`);
    execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
  };
  run("npm", ["ci"]);
  run("npm", ["run", "lint:markdown"]);
  const tmp = join("/tmp", `docs-gov-init-${randomUUID().slice(0, 8)}`);
  execFileSync("git", ["clone", "-q", "https://github.com/qwts/qwts-agent-docs-gov.git", tmp]);
  execFileSync("git", ["-C", tmp, "checkout", "-q", DOCS_GOV_PIN]);
  log.push("  gate: docs-gov (pinned)");
  execFileSync("node", [join(tmp, "tools", "docs-gov", "docs-gov.mjs"), "--root", "."], { cwd: root, stdio: "inherit" });
}

// --- plan ----------------------------------------------------------------------

export function planInstantiation(root, owner, name, args, { dry = false } = {}) {
  DRY = dry;
  log.length = 0;
  const config = JSON.parse(read(root, "docs-gov.config.json"));
  if (config.decisionSeries?.homeRepo !== TEMPLATE_REPO) {
    throw new Error("this checkout is already instantiated (docs-gov homeRepo is not the template's) — refusing to run twice");
  }
  substituteIdentity(root, owner, name);
  renumberGenesis(root);
  // Disk-truthful list: the renumber renamed docs/decisions/ files.
  const files = currentFiles(root);
  rewriteDocsGovConfig(root, owner, name);
  stampGenesis(root, owner, name);
  const forkOwner = args.options.get("capability-forks");
  if (forkOwner) repointCapabilityForks(root, files, forkOwner);
  if (args.flags.has("write-local-config")) writeLocalConfig(owner, name);
  return log.slice();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.options.get("root") ?? process.cwd());
  if (args.flags.has("check")) {
    const findings = checkNeutrality(root);
    if (findings.length === 0) {
      console.log("org-neutrality check: OK — no stray org identity outside the allowlist");
      return;
    }
    console.error(`org-neutrality check: ${findings.length} finding(s):`);
    for (const f of findings) console.error(`  ${f.file}:${f.line}: ${f.text}`);
    process.exitCode = 1;
    return;
  }
  const owner = args.positional[0];
  if (!owner || !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(owner)) {
    console.error("usage: node scripts/init.mjs <owner> [--name <repo-name>] [--capability-forks <owner>] [--write-local-config] [--dry-run] [--skip-gates]");
    process.exitCode = 1;
    return;
  }
  const name = args.options.get("name") ?? `${owner}-agent-sop`;
  if (args.flags.has("dry-run")) {
    console.log(`dry run — would apply to ${root}:\n${planInstantiation(root, owner, name, args, { dry: true }).join("\n")}`);
    return;
  }
  planInstantiation(root, owner, name, args);
  console.log(`instantiated ${owner}/${name}:\n${log.join("\n")}`);
  if (!args.flags.has("skip-gates")) runGates(root);
  console.log(`\nLocal pointer (~/.config/agent-sop/config.toml):\n${localConfigSnippet(owner, name)}`);
}

function invokedAsScript() {
  // realpath both sides: macOS /tmp is a symlink, and import.meta.url resolves
  // through it while process.argv[1] does not.
  try {
    return realpathSync(process.argv[1] ?? "") === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedAsScript()) main();
