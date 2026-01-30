# Idea Deep-Dive: 画像初始化（asserted vs inferred）+ 动态技能联想

## Problem
- 用户自述技能点往往是“标签化”的（如“Cocos 开发”），难以直接用于推荐/评估。
- 纯靠静态字典联想维护成本高且容易过时；但完全不联想会丢失大量可用信息。

## Proposal
- Profile 拆分两类技能：
  - `asserted_skills`: 用户明确自述（原文为准）
  - `inferred_skills`: 系统联想（必须带证据与置信度，默认低置信度不进入“核心画像”）
- inferred 的生成方式：taxonomy + 语义检索 + 规则补充（不依赖 KeywordDictionary.json）。

## Example (User says: "Cocos 开发")
- asserted_skills:
  - { name: "Cocos 开发", evidence: "用户自述", captured_at: ... }
- inferred_skills（示例）：
  - { name: "游戏引擎基础", confidence: 0.55, evidence: "Cocos 开发 → 引擎工作流", ... }
  - { name: "2D/3D 渲染基础", confidence: 0.45, evidence: "常见引擎开发相关", ... }
  - { name: "脚本/组件化开发", confidence: 0.60, evidence: "Cocos 组件脚本模式", ... }
  - { name: "性能分析与优化（入门）", confidence: 0.35, evidence: "引擎开发常见需求", ... }

## Data Model (suggested)
```json
{
  "profile": {
    "basic": {
      "locale": "free_text",
      "preferred_language": "free_text"
    },
    "asserted_skills": [
      {
        "name": "string",
        "evidence": "user_statement",
        "evidence_text": "string",
        "captured_at": "ISO-8601"
      }
    ],
    "inferred_skills": [
      {
        "name": "string",
        "confidence": 0.0,
        "evidence": {
          "type": "taxonomy_match|semantic_retrieval|rule",
          "source_text": "string",
          "source_item_id": "string",
          "version": "string"
        },
        "captured_at": "ISO-8601",
        "status": "proposed|confirmed|rejected"
      }
    ]
  }
}
```

## Inference Strategy (no static keyword dictionary)
1. 维护一个小而稳定的 skill taxonomy（可配置文件/数据库），每项包含：名称、描述、相关主题、示例。
2. 将 asserted skill 的描述（或原文）做语义检索，召回最相关的 taxonomy 项（Top-K）。
3. 用轻量规则补充（例如“引擎”类技能通常关联“渲染/资源/脚本/调试”）。
4. 输出 inferred_skills，并生成 1-2 句“推断解释”。

## Confirmation / Correction UX
- 在 create 阶段给用户一个选择：
  - 立即深评（learn:profile update）
  - 暂时结束（后续自然对话中再更新）
- 对 inferred_skills：
  - 低成本纠错：用户一句话否认/修正即可（例如“我只做过 UI，不涉及渲染”）。

## Risks & Mitigations
- 风险：过度推断导致推荐偏航
  - 缓解：inferred 默认 `proposed`；低置信度不进入核心；必须保存证据并允许撤销
- 风险：taxonomy 仍然需要维护
  - 缓解：taxonomy 保持“小而稳定”；embedding 召回只做辅助，不追求全覆盖

## MVP
- 引入 asserted/inferred 字段 + provenance
- 先做 10-20 个高频技能 taxonomy（例如：前端/后端/数据/游戏/移动）
- UI/对话支持“确认/否认/补充一句话”

## Success Metrics
- 用户对推断的确认率/否认率
- 推断纠错后的稳定性（同类对话中推断是否反复）
- 推荐命中率提升（或学习任务完成率提升）

## Next: Schema + State + Rollback
- 具体的数据结构（snapshot + events）、状态流转（proposed/confirmed/rejected/superseded）与回滚策略（MVP/强回滚）已整理在：
  - `ideas/idea-profile-schema-state-machine.md`
