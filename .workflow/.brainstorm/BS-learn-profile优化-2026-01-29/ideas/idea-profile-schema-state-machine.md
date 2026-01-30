# Idea Deep-Dive: Profile Schema + 状态流转 + 回滚（asserted / inferred / provenance）

目标：在“不强制 Goal Type、不要求经验自评、pre_context 先采集个人偏好”的前提下，把 profile 做成：
- 可用：能直接驱动后续 plan（任务颗粒度/节奏/反馈/巩固）与 learn:profile update
- 可控：inferred 不会“写死”用户画像，必须可纠错、可回滚
- 可审计：每个字段/技能都能追溯来源（provenance）

---

## 1) Snapshot Schema（当前画像快照）

建议做两层：
- `profile_snapshot`：面向业务读取（推荐/计划/展示），读取快
- `profile_events`：面向审计/回滚（append-only），写入快

### profile_snapshot（示例）
```json
{
  "profile_id": "prof_...",
  "user_id": "user_...",
  "status": "draft|active|archived",
  "version": 12,
  "updated_at": "ISO-8601",
  "data": {
    "basic": {
      "preferred_language": "free_text",
      "locale": "free_text"
    },
    "pre_context": {
      "template_version": "pre_context_v1.3",
      "raw": { "q1": "text", "q2": "text", "q3": "text", "q4": "text" },
      "parsed": {
        "study_time_windows": "text",
        "session_length": "text",
        "weekly_cadence": "text",
        "focus_duration": "text",
        "energy_state_preference": "text",
        "common_interruptions": "text",
        "resume_preference": "text",
        "learning_mode_preference": "text",
        "output_format_preference": "text",
        "content_organization_preference": "text",
        "feedback_preference": "text",
        "correction_strictness_preference": "text",
        "retention_preference": "text"
      },
      "provenance": {
        "source": "ask_user_question",
        "captured_at": "ISO-8601"
      }
    },
    "skills": {
      "asserted": [],
      "inferred": []
    },
    "learning_profile": {
      "prior_knowledge": {
        "what_i_can_do": "text",
        "what_confuses_me": "text",
        "common_misconceptions": "text"
      },
      "motivation": {
        "why_learning_now": "text"
      },
      "accountability": {
        "accountability_preference": "text"
      }
    }
  }
}
```

说明：
- `pre_context` 是 plan 主要输入（个人因素），accountability/motivation 作为后续渐进字段，不在 pre_context 4 问内强制采集。
- `version` 每次变更递增（由事件驱动）。

---

## 2) Skills 数据结构（asserted vs inferred）

### asserted skill（用户自述）
```json
{
  "skill_id": "as_...",
  "name": "Cocos 开发",
  "normalized_name": "cocos",
  "evidence_text": "用户原话片段",
  "captured_at": "ISO-8601",
  "source": "user"
}
```

规则：
- asserted 默认即为 confirmed（不需要系统判定）
- 可允许用户删除/更正（产生事件，版本前进）

### inferred skill（系统推断）
```json
{
  "skill_id": "is_...",
  "name": "2D/3D 渲染基础",
  "taxonomy_id": "tax_rendering_basics",
  "confidence": 0.45,
  "status": "proposed|confirmed|rejected|superseded",
  "evidence": {
    "type": "taxonomy_match|semantic_retrieval|rule|assessment_signal",
    "source_text": "Cocos 开发",
    "source_item_id": "as_...",
    "engine_version": "tax_v0.1",
    "retrieved_ids": ["tax_rendering_basics", "tax_game_engine_workflow"],
    "rule_id": "rule_engine_dev_v1"
  },
  "captured_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

规则（关键）：
- inferred 新生成时必须是 `proposed`（不要直接写入“核心画像”）
- `confirmed/rejected` 必须来自用户确认或强信号（例如多轮一致证据 + 明确文本确认）
- 新证据出现时不要覆盖旧项，走 `superseded`（保留历史链）

---

## 3) Events Schema（回滚/审计的基础）

### profile_event（append-only）
```json
{
  "event_id": "evt_...",
  "profile_id": "prof_...",
  "version": 13,
  "type": "PROFILE_CREATED|PRECONTEXT_CAPTURED|ASSERTED_SKILL_ADDED|ASSERTED_SKILL_REMOVED|INFERRED_SKILL_PROPOSED|INFERRED_SKILL_CONFIRMED|INFERRED_SKILL_REJECTED|FIELD_SET|ROLLBACK_TO_VERSION",
  "actor": "user|agent|system",
  "created_at": "ISO-8601",
  "payload": {}
}
```

建议的 payload 约定：
- `PRECONTEXT_CAPTURED`: { template_version, raw, parsed, provenance }
- `ASSERTED_SKILL_ADDED`: { skill }
- `INFERRED_SKILL_PROPOSED`: { skill }
- `INFERRED_SKILL_CONFIRMED/REJECTED`: { skill_id, reason_text?, evidence? }
- `FIELD_SET`: { path: "data.learning_profile.motivation.why_learning_now", value, source? }
- `ROLLBACK_TO_VERSION`: { target_version, reason? }

---

## 4) 状态流转（状态机）

### profile lifecycle
- `draft`：创建中（pre_context 已采集/未采集都可），允许多次修改
- `active`：create 流程结束后可进入 active（即便用户选择“暂时结束”也可 active）
- `archived`：用户注销/重建新 profile 时归档

### inferred skill status
- `proposed` -> `confirmed`（用户确认 / 强信号 + 用户不反对的确认语句）
- `proposed` -> `rejected`（用户否认）
- `confirmed` -> `superseded`（出现新证据导致更准确的 taxonomy/技能表述；旧项保留但不再参与推荐）
- `rejected` -> `proposed`（仅当有“新证据”且明确说明“基于新信息再次提出”，避免反复打扰）

---

## 5) 回滚策略（两档）

### A. 最小可用回滚（MVP，推荐先落地）
- 保存 `profile_snapshot`（current）+ `profile_events`（全量）
- 回滚操作：写入 `ROLLBACK_TO_VERSION(target_version)` 事件
- 读取 current 时：
  - 方案 1：从最近 snapshot 重新 fold events 到最新（需要 fold 引擎）
  - 方案 2：直接把 snapshot 回写为 target_version 的结果（后台重建并写一个新 snapshot）

### B. 强回滚（事件溯源为主）
- 不依赖直接回写旧快照；任何“回滚”都是“新版本的变更事件”
- 保证：永远不会“删除历史”，只改变当前生效视图

---

## 6) 需要你最终拍板的 3 个细节（否则实现会分叉）

1) confirmed inferred 的来源：
   - 仅用户明确确认？
   - 还是允许“强信号自动确认”（例如连续两次评估/对话一致）？

2) rejected 的冷却/再提：
   - 被 reject 的 inferred，多久内不再提？
   - 需要什么级别的新证据才允许重新 proposed？

3) taxonomy 的版本与引用：
   - `engine_version` 作为强制字段吗？（影响回归与解释）

