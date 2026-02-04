# Gap Report：learn:profile（需求文档 vs CCW 现有 corpus）

## Reference（Oracle）

- Slash doc：`.claude/commands/learn/profile.md`
- Internal modules：
  - `.claude/commands/learn/_internal/assess.js`
  - `.claude/commands/learn/_internal/mcp-runner.js`
  - `.claude/commands/learn/_internal/error-handler.js`
  - `.claude/commands/learn/_internal/json-parser.js`
- CLI State API：`ccw/src/commands/learn.ts`

## P0 Gaps（Must Fix）

- None（需求文档与现有 corpus 的核心能力面一致：Topic V0、Create/Update、seed/full pack、Cycle-4 评估循环、best-effort events/telemetry）。 

## P1 Gaps（Should Fix）

- 入口文件约定不一致：需求文档建议 `.claude/commands/learn/profile.js` 作为主入口，但本仓库 slash corpus 以 `*.md` 为入口，`_internal/*.js` 提供可复用逻辑。
- 输出产物路径需明确以 CCW learn CLI 为准：需求文档中的 `profile.json` / `events/<id>.ndjson` 需要落到实际路径 `.workflow/learn/profiles/<id>.json` 与 `.workflow/learn/profiles/events/<id>.ndjson`（以及 snapshot/telemetry/packs）。
- Allowed-tools 表述：需求文档写“File IO (Read/Write)”，但现有 `/learn:profile` 的实现主要通过 `Bash` 调 `ccw learn:*` 完成写入，不一定需要 `Write(*)` 工具；需要在命令文档中明确“禁止直接 Write `.workflow/learn/**`”。

## P2 Gaps（Optional）

- 评估“Must Evidence”口径：需求文档提及 Must Evidence，但未给出判定清单；可以在 `assess.js` 中固定最小证据策略（例如至少 1 次 pass + 1 次 fail 或至少覆盖 2 个 difficulty 区间）。
- Update Flow 的 Topic 输入 UX：可增加“中文 label 自动转 hash”的明示规则与提示（避免用户误以为必须输入 `t_...`）。

## Implementation Hints（Tooling/Server）

- `ccw/src/commands/learn.ts`（state/profile/events/packs/taxonomy 的真实路径与 schema 约束）
- `.claude/commands/learn/_internal/assess.js`（Cycle-4 assessment 的权威实现位置）

## Proposed Fix Plan（Minimal）

1) 在命令入口层面统一口径：
   - 以 `.claude/commands/learn/profile.md` 为入口（对齐 corpus），如需 `.js` 编排层则作为可选增强并在文档中说明 runtime 依赖。
2) 在文档与 outline 中固定真实落盘路径（全部以 `.workflow/learn/**` 为准）。
3) 在 `Error Handling` 章节明确：
   - Bash JSON 必须单引号转义
   - CLI JSON 使用健壮解析
   - events/telemetry best-effort 不阻断主流程
