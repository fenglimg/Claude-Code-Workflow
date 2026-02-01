# Coverage (Cycle-1)

This repo currently runs Node unit tests without a coverage collector in `npm test`.

Cycle-1 added tests for:
- pack CLI roundtrip (resolve/read/write)
- append-profile-event whitelist (ASSESSMENT_* allowed, unknown rejected)

If/when coverage tooling is added, these areas should show coverage increases in:
- `ccw/src/commands/learn.ts`
- `ccw/src/cli.ts`

