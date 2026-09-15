// Harness identity and permission contracts survive retirement of the memory guard.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GOVERNED_HOOK_ADAPTER_FILES } from '../lib/baseline-files.mjs';

function json(relative) {
  return JSON.parse(readFileSync(relative, 'utf8'));
}

function hookCommands(value) {
  return (value ?? []).flatMap((entry) => (entry.hooks ?? []).map((hook) => hook.command ?? ''));
}

test('retired memory guard has no implementation, package entrypoint, or harness invocation', () => {
  assert.equal(existsSync('tools/agent-guard'), false);
  const scripts = json('package.json').scripts;
  assert.equal(Object.hasOwn(scripts, 'guard'), false);
  assert.doesNotMatch(JSON.stringify(scripts), /tools\/agent-guard/u);
  for (const adapter of GOVERNED_HOOK_ADAPTER_FILES) {
    assert.doesNotMatch(JSON.stringify(json(adapter).hooks), /tools\/agent-guard|guard-agent-command\.mjs|run-guarded\.mjs/u, adapter);
  }
});

test('uninstalled identity adapters ship with the fleet harness', () => {
  const cursor = (json('.cursor/hooks.json').hooks?.beforeShellExecution ?? [])
    .map((hook) => hook.command ?? '');
  const claude = hookCommands(json('.claude/settings.json').hooks?.PreToolUse);
  const codex = hookCommands(json('.codex/hooks.json').hooks?.PreToolUse);
  for (const [path, commands] of [
    ['.cursor/hooks.json', cursor],
    ['.claude/settings.json', claude],
    ['.codex/hooks.json', codex],
  ]) {
    assert.ok(
      commands.some((command) => (
        command.includes('agent-bot agent-hook')
        && command.includes('AGENT_BOT_UNMANAGED_AUTHORS')
      )),
      `${path} must carry the uninstalled identity adapter (ENG-0128)`,
    );
  }
});

test('the worktree-identity hook remains installed', () => {
  assert.ok(
    hookCommands(json('.claude/settings.json').hooks?.WorktreeCreate).some((command) => command.includes('claude-worktree-create')),
    'WorktreeCreate must still mint the per-worktree bot identity (ENG-0016)',
  );
});

test('tool permissions stay least-privilege: no blanket Bash or wildcard allow', () => {
  const allow = (json('.claude/settings.json').permissions?.allow ?? []).map(String);
  for (const rule of allow) {
    assert.notEqual(rule, '*', 'a wildcard allow defeats the permission prompt entirely');
    assert.notEqual(rule, 'Bash', 'blanket Bash allow removes command-specific approval');
    assert.doesNotMatch(rule, /^Bash\(\*\)$/u, 'blanket Bash allow removes command-specific approval');
  }
});

test('the heavy lanes are not pre-approved back open in the permission allow-list', () => {
  // Retiring the memory guard does not change the separate local validation policy.
  const allow = (json('.claude/settings.json').permissions?.allow ?? []).map(String);
  for (const rule of allow) {
    assert.doesNotMatch(rule, /npm run (ci|test:e2e|test:stories|test:perf|test:cov)/u, `${rule} pre-approves a heavy lane that the local validation policy reserves for CI`);
  }
});
