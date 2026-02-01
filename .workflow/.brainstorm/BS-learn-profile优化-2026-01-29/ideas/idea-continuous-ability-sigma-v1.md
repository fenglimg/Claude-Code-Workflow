# Idea Deep Dive: Continuous Ability (0..1) + <=0.1 Convergence

## One-liner
把学生在某topic的能力表示为 `ability∈[0,1]`，并显式维护不确定度 `sigma`；Seed阶段用信息增益选题，使 `sigma<=0.1` 才允许“高置信结束”，否则加题或保守推荐。

## Why it matches the feedback
- 能表达“部分具备更高能力”(连续刻度)
- 避免硬切档带来的不适配
- 适用于跨学科/非编程领域(只要难度能标定)

## Option A: Interval Halving (binary-search-like)
- State: interval [L,U] (start [0,1])
- Item has threshold difficulty d (the pass-line ability)
- Choose d=(L+U)/2 each step
- Update:
  - confident correct -> L=d
  - confident wrong -> U=d
  - low-confidence -> partial move, increase sigma
- Best-case after 4 items: width <= 0.0625
- Needs: calibrated difficulty + high discrimination

## Option B: Bayesian / IRT-lite
- Item params: b in [0,1], discrimination a
- P(correct|θ)=sigmoid(a*(θ-b))
- Update posterior after each item; output mean(θ) and CI_width as uncertainty
- Next item: pick b≈mean(θ) with highest a (max information)
- Stop: CI_width<=0.1 or N_seed_max

## How “all correct / all wrong” rules fit
- Convert to boundary evidence:
  - all correct + clean signals -> raise lower bound quickly; allow small explore rate
  - all wrong + clean signals -> lower upper bound quickly; switch to explain/easier
  - correct with many hints/time -> do NOT treat as high ability; keep sigma high

## MVP (practical)
- If no calibrated b/a:
  - approximate b by historical correctness quantiles per item (per cohort)
  - prefer items with stable stats; continuously re-calibrate
- Run with N_seed_target=4, N_seed_max=6:
  - try to converge <=0.1 in 4; if not, add 1-2 confirmatory items
  - if still not, output ability with low confidence and conservative recommendation

## Success criteria
- %sessions with sigma<=0.1 within 4 items (and within 6 as fallback)
- Recommendation first-item success rate stays in target band
- Extremes (long fail streaks / boredom streaks) decrease
