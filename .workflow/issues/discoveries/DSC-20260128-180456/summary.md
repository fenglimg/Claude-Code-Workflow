# Discovery Summary: DSC-20260128-180456

**Target**: learn:profile, learn:plan, learn:execute
**Scope**: .claude/commands/learn/** + ccw/src/commands/learn*.ts + learn schemas
**Perspectives**: bug, security, test, ux, quality, performance, maintainability, best-practices
**Total Findings**: 33
**Issues Generated**: 11

## Priority Breakdown
- Critical: 2
- High: 6
- Medium: 3

## Top Findings
1. **[Critical] JSON shell-escaping/injection risk in learn:execute** (.claude/commands/learn/execute.md:407,447)
2. **[Critical] mcp-runner is not a strong sandbox on Node < 22** (.claude/commands/learn/_internal/mcp-runner.js:140)
3. **[High] Stale lock file can permanently block learn workflow** (ccw/src/commands/learn.ts:194)
4. **[High] learn:plan uses bash-only mv and unquoted paths** (.claude/commands/learn/plan.md:495,511)
5. **[High] learn:plan bypasses lock-protected CLI APIs for session writes** (.claude/commands/learn/plan.md:493)

## Notes
- Several command docs rely on bash utilities (ls/cat/mv). This is brittle on Windows and increases injection surface.
- CLI state APIs are lock-protected and validated, but learn:plan still performs direct file writes.
- Test coverage is currently missing for learn state commands and doc-runtime helpers.

## Next Steps
- Review generated issues in discovery-issues.jsonl and run /issue:plan on the high/critical ones.
- Prioritize ISS-DSC-001 and ISS-DSC-002 for security hardening.
