# Idea: Non-ASCII raw topic label -> stable topic_id（修复 INVALID_ARGS）

## Problem
当前 `ccw learn:ensure-topic --raw-topic-label "<中文>"` 会报：
- `INVALID_ARGS: Cannot derive topic_id from raw_topic_label`（例如：跨平台开发）

根因是“topic_id 派生”与“alias normalize”偏向 ASCII：
- raw label 含中文时，normalize 结果接近空串；
- 进而无法生成合法的 `topic_id`（通常要求安全的 ASCII path segment）。

## Goals / Invariants
- `topic_id`：稳定、ASCII、安全作为目录名/文件名片段（path segment）
- `display_name_zh`：保留原始中文（UI 展示）
- `aliases[]`：能命中中文/中英/缩写；normalize 必须支持中文（否则中文 alias 永久无法命中）
- 同一 raw label 多次 ensure：必须生成**同一个** topic_id（稳定性）

## Options

### Option A: Hash-first（推荐：最稳）
规则：当 raw label 无法 slugify 为安全 ASCII id 时，生成：
- `topic_id = "u_" + <hash8(norm_label)>`

建议：
- `norm_label` 使用 Unicode NFKC + trim + collapse whitespace（保留中文，不做 ASCII-only 过滤）
- hash 可用 `sha1`/`xxhash`（只要稳定即可），取前 8~12 位

优点：
- 不依赖拼音库、无歧义、稳定
- 任何语言都可用

缺点：
- topic_id 不可读（但 UI 可用 display_name_zh 解决）

### Option B: Pinyin slug（可读但有坑）
规则：中文转拼音，再 slugify：
- `跨平台开发` -> `kua_ping_tai_kai_fa`（示意）

优点：
- 可读

缺点：
- 依赖库、拼音多音字导致歧义；还要处理英中混写、符号

### Option C: Hybrid（折中）
- 先尝试 ASCII slug（英文/缩写）；
- 其次尝试 pinyin slug；
- 最后 fallback hash（最终兜底）

## Proposal (MVP)
采用 Option A（Hash-first）做兜底，确保“任何 raw label 都能 ensure-topic”。

### ensure-topic 输出约定（建议）
新增字段，便于审计与后续治理：
- `derived_from_raw_label`: true/false
- `topic_id_strategy`: `"slug" | "hash"`
- `normalized_raw_label`: string

### Index/alias 约定（建议）
新建 provisional topic 时：
- `display_name_zh = rawTopicLabel`
- `display_name_en = rawTopicLabel`（暂存；后续可人工修正）
- `aliases` 至少包含：`rawTopicLabel`、`topic_id`

## Edge Cases / Risks
- **同义词重复**：`跨平台开发` vs `cross-platform development`
  - 先允许各自产生不同 topic_id（或由 alias/redirect 后续收敛）
  - 后续通过 `learn:topic-add-alias` + `learn:topic-redirect` 统一
- **normalize 兼容性**：如果 alias normalize 仍是 ASCII-only，则中文 alias 会失效（必须同步修）
- **hash 冲突**：8 位存在小概率冲突；可以升到 12 位，或冲突时加 suffix `_2`

## Success Criteria
- `ccw learn:ensure-topic --raw-topic-label "跨平台开发" --json` 不再报 INVALID_ARGS
- `ccw learn:resolve-topic --raw-topic-label "跨平台开发" --json` 能命中同一 topic_id
- 中文 alias 可命中（resolve-topic 的 alias match 不再“吃掉中文”）

