# Idea Deep Dive: Seed Ladder (V0)

## One-liner
用3~5道“阶梯式Seed题”把学生在目标topic的能力快速定位到一个离散level，并输出confidence，用于后续严格难度匹配推荐。

## Why it helps
- 题量少但信息密度高(比随机Seed更快收敛)
- 结果可解释(level + 触发规则)
- 对冷启动/新topic更稳(先验+校正)

## Core Mechanics
- 预先把 `S(topic)` 按难度分层：easy/mid/hard
- 起手mid；根据作答信号跳转下一层
- 通过“阈值+迟滞”输出 `level` 与 `confidence`

## Data/Metadata Needed (MVP)
- item.topic tag
- item.difficulty(可先用历史正确率分桶近似)
- answer logs: correct/time/hints/retries

## MVP Definition
- 每topic配置3个难度桶，每桶各选2题作为seed池
- 每次进入topic最多做3题seed：mid -> (easy|hard) -> (easy|hard)
- 输出: level(0-4) + confidence(0-1)
- 推荐阶段仅做: 难度窗口 + safety rails

## Risks / Failure Modes
- topic粒度过粗：同一topic内难度差异大，seed定位不稳
- difficulty标定不准：阶梯不“阶梯”，导致跳转误判
- 作答噪声：抄答案/猜题导致level虚高

## Mitigations
- 给level更新加迟滞与置信度；低置信度时多做1题seed
- 监控每题的“区分度 proxy”(不同能力段正确率差)
- 对异常行为做降权(极端耗时/提示/连续秒答等)

## Success Metrics
- 进入推荐后首题成功率落在目标区间(例如55%~75%)
- 连续失败/连续成功长度下降
- seed题量/耗时受控(平均<=3题)

## Recommendation
优先推进(适合一期落地)，误概念对比Seed作为可插拔二期模块。
