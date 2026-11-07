// Tests for scripts/init.mjs — run with: node --test scripts/
// Each instantiation test unpacks the real repository (git archive HEAD) into
// a temp directory, runs the plan against it, and asserts the resulting tree.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { planInstantiation, checkNeutrality, localConfigSnippet } from "./init.mjs";

// The pristine template tree: the most recent commit in this checkout's
// history whose docs-gov.config.json still names the template as homeRepo.
// In this repository that is HEAD; in a derivative it is the pre-instantiation
// commit the template shipped. Without one (squashed history), instantiation
// tests skip instead of failing derivative CI.
let TEMPLATE_COMMIT;
function findTemplateCommit() {
  const shas = execFileSync("git", ["log", "--format=%H", "-n", "60", "HEAD"], { encoding: "utf8" })
    .trim()
    .split("\n");
  for (const sha of shas) {
    let cfg;
    try {
      cfg = execFileSync("git", ["show", `${sha}:docs-gov.config.json`], { encoding: "utf8" });
    } catch { continue; }
    try {
      if (JSON.parse(cfg).decisionSeries?.homeRepo === "qwts/agent-sop") return sha;
    } catch { continue; }
  }
  return null;
}

function makeFixture(t) {
  TEMPLATE_COMMIT ??= findTemplateCommit();
  if (!TEMPLATE_COMMIT) return null;
  const dir = mkdtempSync(join(tmpdir(), "init-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const archive = execFileSync("git", ["archive", TEMPLATE_COMMIT], { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  execFileSync("tar", ["-x", "-C", dir], { input: archive });
  // A derivative checkout carries the template's git history — that is what
  // the provenance capture reads — so give the fixture the same shape.
  const git = (args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git(["init", "-q", "-b", "main"]);
  git(["add", "-A"]);
  git(["-c", "user.email=fixture@example.invalid", "-c", "user.name=fixture", "commit", "-q", "-m", "pristine template fixture"]);
  return dir;
}

const argsFor = (extra = []) => ({
  flags: new Set(),
  options: new Map(extra.map((o) => [o[0], o[1]])),
  positional: [],
});

test("localConfigSnippet names the sop repo and leaves org commented", (t) => {
  const s = localConfigSnippet("octocat", "octocat-agent-sop");
  assert.match(s, /\[repos\]/);
  assert.match(s, /sop = "octocat\/octocat-agent-sop"/);
  assert.match(s, /# org = /);
});

test("planInstantiation renames inherited records into the ENG-9xxx block", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  assert.ok(existsSync(join(dir, "docs/decisions/ENG-9006-agentic-primitives-governance.md")));
  assert.ok(existsSync(join(dir, "docs/decisions/ENG-9355-static-router-one-pointer-pinned-capabilities.md")));
  assert.ok(!existsSync(join(dir, "docs/decisions/ENG-0006-agentic-primitives-governance.md")));
  // Retired records were already deleted from the template; none come back.
  assert.ok(!existsSync(join(dir, "docs/decisions/ENG-0004-centralize-shared-cicd.md")));
});

test("planInstantiation rewrites citations for inherited numbers only", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /ENG-9006/);
  assert.match(agents, /ENG-9008/);
  assert.ok(!/ENG-0006\b/.test(agents));
  // Retired numbers keep their names: they live in the qwts instance's series.
  const index = readFileSync(join(dir, "docs/decisions/README.md"), "utf8");
  assert.match(index, /ENG-0002/);
  const charter = readFileSync(join(dir, "docs/decisions/ENG-9355-static-router-one-pointer-pinned-capabilities.md"), "utf8");
  assert.match(charter, /qwts-agent-sop\/blob\/main\/docs\/decisions\/ENG-0004-centralize-shared-cicd\.md/);
});

test("planInstantiation rewrites identity surfaces", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  assert.match(readFileSync(join(dir, ".github/CODEOWNERS"), "utf8"), /@octocat/);
  assert.ok(!/@qwts\b/.test(readFileSync(join(dir, ".github/CODEOWNERS"), "utf8")));
  assert.match(readFileSync(join(dir, "LICENSE"), "utf8"), /Copyright \(c\) \d{4} octocat/);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(pkg.name, "octocat-agent-sop");
  assert.match(readFileSync(join(dir, "README.md"), "utf8"), /^# octocat-agent-sop$/m);
  const feature = readFileSync(join(dir, ".github/ISSUE_TEMPLATE/feature.yml"), "utf8");
  assert.match(feature, /github\.com\/octocat\/octocat-agent-sop\/blob\/main/);
  assert.ok(!feature.includes("github.com/qwts/agent-sop/blob"));
});

test("planInstantiation rewrites the docs-gov config for the derivative", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  const config = JSON.parse(readFileSync(join(dir, "docs-gov.config.json"), "utf8"));
  assert.equal(config.decisionSeries.homeRepo, "octocat/octocat-agent-sop");
  assert.deepEqual(config.decisionSeries.homeRepoAliases, ["qwts/agent-sop"]);
  assert.deepEqual(config.decisionSeries.grandfathered, ["docs/decisions/ENG-9???-*.md"]);
  const issueRules = config.structure.requiredFields.filter((r) =>
    r.fields.some((f) => f.name === "Issue"),
  );
  assert.equal(issueRules.length, 2);
  assert.equal(issueRules[0].fields[0].pattern, "^(octocat|qwts)/[\\w.-]+#\\d+$");
  assert.match(issueRules[1].fields[0].pattern, /ENG-9013/);
  // Status/Date rule survives untouched.
  const statusRule = config.structure.requiredFields.find((r) =>
    r.fields.some((f) => f.name === "Status"),
  );
  assert.ok(statusRule, "Status/Date rule kept");
});

test("planInstantiation stamps the genesis record and its index row", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  const genesis = readFileSync(join(dir, "docs/decisions/ENG-0000-template-provenance.md"), "utf8");
  assert.match(genesis, /\*\*Issue:\*\* octocat\/octocat-agent-sop#0/);
  assert.match(genesis, /ENG-9008/); // genesis text cites renumbered records
  // The provenance must pin the immutable template revision, not a mutable URL.
  assert.match(genesis, /Source revision:\*\* `[0-9a-f]{40}`/);
  const index = readFileSync(join(dir, "docs/decisions/README.md"), "utf8");
  assert.match(index, /ENG-0000-template-provenance\.md/);
});

test("planInstantiation repoints capability pins with --capability-forks", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor([["capability-forks", "octocat"]]));
  const ci = readFileSync(join(dir, ".github/workflows/ci.yml"), "utf8");
  assert.match(ci, /octocat\/qwts-agent-ci\/\.github\/actions\/ci-policy@/);
  assert.ok(!ci.includes("qwts/qwts-agent-ci/"));
});

test("dry run leaves the tree untouched", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  const before = readFileSync(join(dir, "docs-gov.config.json"), "utf8");
  const codeowners = readFileSync(join(dir, ".github/CODEOWNERS"), "utf8");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor(), { dry: true });
  assert.equal(readFileSync(join(dir, "docs-gov.config.json"), "utf8"), before);
  assert.equal(readFileSync(join(dir, ".github/CODEOWNERS"), "utf8"), codeowners);
  assert.ok(!existsSync(join(dir, "docs/decisions/ENG-0000-template-provenance.md")));
});

test("planInstantiation refuses to run twice", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor());
  assert.throws(() => planInstantiation(dir, "octocat", "octocat-agent-sop", argsFor()), /already instantiated/);
});

test("checkNeutrality flags stray org identity but allows the allowlist", (t) => {
  const dir = makeFixture(t);
  if (!dir) return t.skip("no pristine template commit in this checkout's history");
  mkdirSync(join(dir, "docs/tmp-check"), { recursive: true });
  writeFileSync(join(dir, "docs/tmp-check/a.md"), "contact the qwts administrators\n");
  writeFileSync(join(dir, "docs/tmp-check/b.md"), "pins live in qwts-agent-ci; see https://github.com/qwts/qwts-agent-ci\n");
  // The scan reads git-tracked files; stage the probes so they are scanned.
  execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "pipe" });
  const findings = checkNeutrality(dir);
  const flagged = findings.map((f) => f.file);
  assert.ok(flagged.includes("docs/tmp-check/a.md"), "stray identity flagged");
  assert.ok(!flagged.includes("docs/tmp-check/b.md"), "capability references allowed");
});
