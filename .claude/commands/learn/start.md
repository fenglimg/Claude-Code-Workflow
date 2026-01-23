# Workflow Learn Start Command (/learn:start)

## 1. 概览 (Overview)

高度定制化的智能学习规划命令。该命令通过严格的阈值控制构建全息学生画像，合并宏观与微观规划阶段并引入 Gemini 实时审查，最后利用 MCP 工具进行多维度权重的资源搜索与注入。

**核心能力：**
- **严格的全息画像构建：** 定义六大维度，采用“短板补齐”策略，循环提问直到**每一项**指标均达到 0.9 以上（而非平均值）。
- **量化的能力诊断：** 基于行为锚定等级评价法（BARS）的置信度评分标准，原位更新 Profile 数据。
- **一体化规划与审查：** 合并大纲与细节生成，强制前台挂载 Gemini CLI 进行教学逻辑与依赖审查，确保规划的科学性。
- **加权资源注入：** 集成 `mcp__exa__web_search_exa`，基于（内容质量、权威性、时效性）多维度权重算法筛选资源，不达标自动重搜。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过能力诊断阶段 (默认置信度设为 0.5)
-l, --language <lang>      强制输出语言 (默认 zh-CN)

# Arguments
<learning-goal>            学习目标描述 (如 "零基础学习 TypeScript 并在两周内写出插件")
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 全息画像捕获 (严格阈值循环)
   ├─ 初始化六大维度 (目标/现状/能力/约束/偏好/心理)
   ├─ 循环直到 MIN(所有维度评分) >= 0.9:
   │  ├─ 识别评分最低的维度 -> Agent 生成针对性问题 (Max 4题)
   │  ├─ AskUserQuestion -> 收集回答
   │  └─ Agent 更新 profile.json -> 基于行为标准重新打分
   └─ 输出: profile.json (高保真)

阶段 2: 能力诊断与定级 (可选)
   ├─ 读取 profile.json 中的 claimed_skills
   ├─ 循环直到 技能置信度 >= 0.9 (基于行为评分):
   │  ├─ Agent 生成代码挑战/陷阱题 (Max 4题)
   │  ├─ 用户作答 -> Agent 评估
   │  └─ 更新 profile.json (原位更新 verification 字段)
   └─ 输出: profile.json (已校准)

阶段 3: 一体化规划与审查 (Merge Phase)
   ├─ cli-curriculum-architect -> 生成完整 Plan (阶段 + 原子任务)
   ├─ ⚠️ 阻断式审查: Gemini CLI 读取 Profile + Plan
   │  └─ 检查逻辑流、前置依赖、认知负荷 -> 输出修订版 Plan
   ├─ 交互确认:
   │  ├─ 展示修订后的大纲与样张
   │  └─ AskUserQuestion: 批准 / 修改反馈 / 重新生成
   └─ 决策: 批准 -> 进入阶段 4; 修改 -> 回滚重生成

阶段 4: 加权资源注入 (Resource Injection)
   ├─ 遍历 Plan 中的每个原子任务
   ├─ 提取关键词 -> mcp__exa__web_search_exa
   ├─ 质量加权评分 (权重算法):
   │  └─ 权威性(40%) + 内容匹配(40%) + 时效性(20%)
   ├─ 判定:
   │  ├─ 分数 >= 0.8 -> 注入任务
   │  └─ 分数 < 0.8 -> 分析短板 (如太旧/非权威) -> 调整 Prompt 重搜
   └─ 输出: plan.json (含资源)

阶段 5: 交付
   └─ 写入 plan.json 与 profile.json
```

## 4. 实现细节 (Implementation)

### 会话初始化

```javascript
const getUtc8ISOString = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
const taskSlug = learning_goal.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)
const sessionId = `learn-${taskSlug}-${getUtc8ISOString().substring(0, 10)}`
const sessionFolder = `.workflow/.learn-start/${sessionId}`

bash(`mkdir -p ${sessionFolder}`)
```

### 阶段 1: 全息画像捕获 (严格阈值 >= 0.9)

**核心逻辑**：不看平均分，关注“木桶效应”的最短板。

```javascript
// 初始化 Profile 结构
let profile = {
  // 六大核心维度
  dimensions: {
    target_clarity: 0.1,      // 目标具体化程度
    current_competency: 0.1,  // 现有能力评估
    learning_style: 0.1,      // 学习风格/认知偏好
    constraints: 0.1,         // 时间/资源/环境约束
    psychological: 0.1,       // 动机/毅力/压力源
    prerequisites: 0.1        // 前置知识储备
  },
  data: {}, // 具体的文本信息
  history: [] // 问答历史
}

const THRESHOLD = 0.9

// 评分行为锚定标准 (传入 Prompt)
const SCORING_RUBRIC = `
0.1: 未知或仅有模糊概念。
0.3: 用户提供了笼统描述 (如"我想学编程")。
0.5: 用户提供了单一维度的信息 (如"我只有周末有空")。
0.7: 用户提供了具体但未量化的信息 (如"我懂一点 Python 基础")。
0.9: 用户提供了可量化、有证据支持或极其详尽的限定 (如"我能用 Flask 写 REST API，每周二四晚 8-10 点学习，预算 50 刀")。
1.0: 经过交叉验证的确定性事实。
`

// 循环直到所有维度达标
while (true) {
  // 1. 找出低于阈值的维度
  const weakDimensions = Object.keys(profile.dimensions).filter(k => profile.dimensions[k] < THRESHOLD)
  
  if (weakDimensions.length === 0) break; // 全部达标，退出

  // 2. 针对短板生成问题
  const profilingTask = Task(
    subagent_type="cli-profiler-agent",
    description="画像补全提问",
    prompt=`
    当前画像: ${JSON.stringify(profile)}
    评分标准: ${SCORING_RUBRIC}
    未达标维度: ${weakDimensions.join(', ')}
    
    任务:
    1. 针对评分最低的 1-2 个维度生成针对性问题。
    2. 问题必须旨在挖掘细节，将评分推高至 0.9。
    3. 每次最多生成 4 个问题。
    
    输出格式: JSON { questions: [...] }
    `
  )
  const questions = JSON.parse(Read(profilingTask.output_file)).questions

  // 3. 用户交互 (Max 4题)
  const answers = AskUserQuestion({
    questions: questions.slice(0, 4).map(q => ({
      question: q.text,
      options: q.options || []
    }))
  })

  // 4. 更新画像并重新打分
  const updateTask = Task(
    subagent_type="cli-profiler-agent",
    prompt=`
    基于用户回答: ${JSON.stringify(answers)}
    更新 profile.json 的 'data' 字段。
    依据上述评分标准，重新评估 'dimensions' 中的所有分数。
    必须严格打分，不要虚高。
    `
  )
  profile = JSON.parse(Read(updateTask.output_file))
}

// 保存最终画像
Write(`${sessionFolder}/profile.json`, JSON.stringify(profile, null, 2))
```

### 阶段 2: 能力诊断与定级 (Confidence Check)

**核心逻辑**：原位更新 `profile.json`，基于行为确信度。

```javascript
if (!flags.includes('--quick')) {
  // 诊断置信度标准
  const CONFIDENCE_RUBRIC = `
  0.0: 无数据。
  0.3: 仅用户口头声称，未验证。
  0.5: 回答了基础概念题，但缺乏细节。
  0.7: 正确回答了单一代码挑战。
  0.9: 连续通过陷阱题或边界条件测试，表现出深层理解。
  `

  let confidence = 0.0 // 初始置信度
  let round = 0

  while (confidence < 0.9 && round < 2) {
    // 生成诊断题
    const diagTask = Task(
       subagent_type="cli-diagnostic-agent",
       prompt=`
       基于 Profile: ${JSON.stringify(profile)}
       目标: 验证用户声称的技能水平是否真实。
       生成 3-4 道代码挑战或概念陷阱题 (非简单的选择题)。
       `
    )
    const quiz = JSON.parse(Read(diagTask.output_file))

    // 用户作答
    const results = AskUserQuestion({
       questions: quiz.questions.map(q => ({
          question: q.content,
          multiSelect: false,
          options: q.choices 
       }))
    })

    // 评估并更新 Profile (预留字段 verification_log)
    const evalTask = Task(
       subagent_type="cli-diagnostic-agent",
       prompt=`
       标准: ${CONFIDENCE_RUBRIC}
       评估用户表现: ${JSON.stringify(results)}
       
       操作:
       1. 更新 profile.data.verified_skills。
       2. 计算新的整体置信度分数 (confidence_score)。
       3. 在 profile.verification_log 中记录评估理由。
       `
    )
    const update = JSON.parse(Read(evalTask.output_file))
    profile = update.profile
    confidence = update.confidence_score
    round++
  }
  
  // 覆盖保存
  Write(`${sessionFolder}/profile.json`, JSON.stringify(profile, null, 2))
}
```

### 阶段 3: 一体化规划与审查 (Unified Planning)

**核心逻辑**：生成与审查合并，Gemini CLI 前台阻断，确保质量。

```javascript
let planApproved = false

while (!planApproved) {
  // 1. 生成 完整计划 (大纲 + 细节)
  Task(
    subagent_type="cli-curriculum-architect",
    prompt=`
    输入: ${JSON.stringify(profile)}
    任务: 生成完整的学习计划 plan.json。
    要求:
    - 包含阶段 (Phases) 和原子任务 (Tasks)。
    - 任务必须具体可执行 (Actionable)。
    `
  )
  let draftPlan = JSON.parse(Read(`${sessionFolder}/plan-draft.json`))

  // 2. ⚠️ Gemini CLI 审查 (Foreground Blocking)
  console.log("正在进行教学逻辑与依赖性审查 (Gemini)...")
  const reviewResult = Bash(`
    ccw tool exec gemini_review_plan \
      --profile "${sessionFolder}/profile.json" \
      --plan "${sessionFolder}/plan-draft.json" \
      --focus "pedagogical_logic,dependencies,cognitive_load"
  `)
  // 假设 Gemini CLI 直接返回修复后的 JSON 或 修改建议
  // 这里简化为应用修复
  const refinedPlan = JSON.parse(reviewResult)

  // 3. 交互式确认
  console.log(`\n### 规划建议\n目标: ${refinedPlan.goal}\n总阶段: ${refinedPlan.phases.length}`)
  refinedPlan.phases.forEach(p => {
      console.log(`- ${p.title}: ${p.tasks.length} 个任务`)
  })

  const userFeedback = AskUserQuestion({
    questions: [{
      question: "请确认生成的学习规划：",
      options: [
        { label: "批准并开始搜索资源", description: "进入下一步" },
        { label: "修改", description: "提供反馈并重新生成" },
        { label: "取消", description: "退出" }
      ]
    }]
  })

  if (userFeedback.choice.startsWith("批准")) {
    planApproved = true
    Write(`${sessionFolder}/plan.json`, JSON.stringify(refinedPlan, null, 2))
  } else if (userFeedback.choice.startsWith("修改")) {
    const feedback = AskUserQuestion({ questions: [{ question: "请输入您的具体修改建议：" }] })
    // 将 feedback 注入下一次循环的 Prompt 上下文
    // update context...
  } else {
    exit(0)
  }
}
```

### 阶段 4: 加权资源注入 (Weighted Resource Injection)

**核心逻辑**：Plan 确定后才找资源。多维度权重评分，动态重试。

```javascript
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`))
console.log("开始资源注入，正在评估资源质量...")

// 权重定义
const WEIGHTS = {
  authority: 0.4,  // 权威性 (官方文档, 知名社区)
  relevance: 0.4,  // 内容匹配度
  recency: 0.2     // 时效性 (对于技术类尤为重要)
}

// 遍历任务处理 (可并行)
plan.tasks = await Promise.all(plan.tasks.map(async (task) => {
  let bestResources = []
  let attempts = 0
  let query = `${task.keywords} tutorial guide ${profile.data.tech_preference || ''}`

  while (bestResources.length === 0 && attempts < 2) {
    // 1. 调用 MCP 搜索
    const searchResult = await execute_mcp_tool('mcp__exa__web_search_exa', {
      query: query,
      num_results: 5,
      use_autoprompt: true
    })

    // 2. 评分逻辑
    const scoredResources = searchResult.results.map(res => {
      // 简化的评分伪代码
      const authorityScore = checkDomainAuthority(res.url) // 0-1
      const relevanceScore = checkSemanticMatch(res.text, task.description) // 0-1
      const recencyScore = checkDate(res.published_date) // 0-1
      
      const totalScore = (authorityScore * WEIGHTS.authority) +
                         (relevanceScore * WEIGHTS.relevance) +
                         (recencyScore * WEIGHTS.recency)
      
      return { ...res, score: totalScore, scores: { authorityScore, relevanceScore } }
    })

    // 3. 筛选达标资源 (>= 0.8)
    bestResources = scoredResources.filter(r => r.score >= 0.8).slice(0, 3)

    // 4. 失败处理：动态调整 Prompt
    if (bestResources.length === 0) {
      attempts++
      // 分析失败原因：如果普遍权威性低
      const avgAuth = scoredResources.reduce((a,b)=>a+b.scores.authorityScore,0) / scoredResources.length
      if (avgAuth < 0.5) {
         query += " site:official-docs.io OR site:github.com" // 强制权威域
      } else {
         query += " 2024" // 强制时效
      }
    }
  }

  // 即使重试失败，也保留分数最高的作为兜底，但标记警告
  if (bestResources.length === 0) {
     // Fallback logic...
  }

  return { ...task, resources: bestResources }
}))

Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2))
```

### 阶段 5: 交付

```javascript
console.log(`
## 学习规划构建完成 ✅

**文件产出**:
1. 用户全息画像: ${sessionFolder}/profile.json
2. 执行计划(含资源): ${sessionFolder}/plan.json

**下一步**:
运行 /workflow:learn-execute --plan ${sessionFolder}/plan.json 开始学习。
`)
```

## JSON Schema 定义 (更新)

### Profile.json (最终版)
```json
{
  "dimensions": {
    "target_clarity": 0.95,
    "current_competency": 0.9,
    "learning_style": 0.9,
    "constraints": 0.9,
    "psychological": 0.9,
    "prerequisites": 0.9
  },
  "data": {
    "goal": "...",
    "tech_stack": "...",
    "verified_skills": [
      { "skill": "Python Async", "level": "Competent", "confidence": 0.92 }
    ]
  },
  "verification_log": [
    "Round 1: Passed closure traps.",
    "Round 2: Failed memory management edge cases."
  ]
}
```

### Plan.json (最终版)
```json
{
  "phases": [
    {
      "title": "Phase 1: Foundation",
      "tasks": [
        {
          "id": "t-1",
          "title": "Understand Event Loop",
          "resources": [
            {
              "title": "MDN Event Loop",
              "url": "...",
              "score": 0.92,
              "rationale": "High authority and perfect semantic match."
            }
          ]
        }
      ]
    }
  ]
}
```