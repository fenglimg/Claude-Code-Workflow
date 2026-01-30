# Idea Deep-Dive: 删除 KeywordDictionary.json + 替代机制

## Problem
- KeywordDictionary.json 属于静态字典：
  - 维护成本高（新增/改名/过时）
  - 难覆盖多语言/同义表达
  - 容易在流程中形成“单点真相”，一旦过时会系统性误判

## Proposal
- 正式停用并删除 `KeywordDictionary.json`（确认主流程不依赖）。
- 用“可版本化、可扩展、可回归”的替代机制支持两类能力：
  1) 知识点集合（用于覆盖率计算、题库组织）
  2) 语义召回（用于技能联想、题目选择）

## Replacement Options

### Option A: Small Stable Taxonomy (recommended as backbone)
- 维护一个小而稳定的 taxonomy（例如 YAML/JSON/DB 表）：
  - `id`, `name`, `description`, `subpoints[]`, `examples[]`, `prerequisites[]`, `version`
- 优点：可控、可回归、适合覆盖率
- 缺点：仍需维护，但范围可控

### Option B: Embedding Retrieval (recommended as supplement)
- 用 embedding 检索 taxonomy 项：从用户输入中召回相关知识点/技能簇
- 优点：对同义表达/自然语言鲁棒
- 缺点：需要回归集和阈值策略，且必须记录版本与阈值

## Migration / Compatibility
- 先做一次“依赖扫描”：确认没有地方读取 KeywordDictionary.json。
- 若历史数据存了“字典 key”：
  - 提供映射表到 taxonomy id（一次性迁移）
  - 或保留旧 key 作为 provenance 字段，不再参与新逻辑

## Risks & Mitigations
- 风险：taxonomy 初期覆盖不全导致覆盖率偏低
  - 缓解：先聚焦高频领域；覆盖率作为相对指标，不作为唯一决策
- 风险：embedding 召回误召
  - 缓解：阈值 + Top-K 限制 + 人工回归集验证

## MVP
- 建一个最小 taxonomy（10-20 个主题，每个 5-10 个 subpoints）
- 打通：覆盖率计算引用 taxonomy 版本
- 完成删除 KeywordDictionary.json，并加回归测试防止重新引入依赖
