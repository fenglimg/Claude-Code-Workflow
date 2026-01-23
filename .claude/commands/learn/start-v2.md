# Workflow Learn Start Command (/learn:start) v2.0

## 1. 概览 (Overview)

高度定制化的智能学习规划命令。该命令通过严格的阈值控制构建全息学生画像，采用**二分逼近法**精确量化技能矩阵，支持**动态深度**（针对不同技能点生成不同深度的计划），并具备**资源搜索优雅降级**能力。

**核心能力 (v2.0):**
- **无状态画像构建：** 采用“即时萃取”策略，对话历史转化为结构化 Data 后即刻丢弃，保持 Profile 轻量纯净。
- **动态深度矩阵 (Skill Matrix)：** 取代单一能力评分，构建 KV 结构的细粒度技能表（如 `React: 0.9, CSS: 0.2`），指导生成“有的放矢”的非均匀学习大纲。
- **二分法能力诊断：** 基于初始声明，利用 Max 4 题的混合探针，通过二分算法（Binary Search）快速校准技能评分。
- **分级资源注入：** 引入 Gold/Silver/Bronze 三级资源标准，在高质量资源缺失时自动降级匹配，杜绝流程死锁。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过 Phase 2 能力诊断 (默认信任用户声明)
-l, --language <lang>      强制输出语言 (默认 zh-CN)

# Arguments
<learning-goal>            学习目标描述 (如 "零基础学习 TypeScript 并在两周内写出插件")
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 全息画像捕获 (Stateless Profiling)
   ├─ 初始化六大维度 (目标/现状/能力/约束/偏好/心理)
   ├─ 循环直到 MIN(所有维度评分) >= 0.9:
   │  ├─ 识别短板维度 -> Agent 生成针对性问题
   │  ├─ AskUserQuestion -> 收集回答
   │  ├─ ⚡️ Agent 萃取 Facts -> 写入 profile.data (不存聊天记录)
   │  └─ 重新打分 -> 更新 profile.dimensions
   └─ 输出: profile.json (含初步 Skill Matrix)

阶段 2: 能力诊断与定级 (Binary Search Diagnosis)
   ├─ 读取 profile.data.skill_matrix 中的技能项
   ├─ 遍历每个技能 (Top 3 核心技能):
   │  ├─ 生成混合探针 (当前水平 + 向上/向下边界 + 陷阱)
   │  ├─ 用户作答 -> 判定结果
   │  ├─ ⚡️ 二分算法计算新等级: New = (Current + Boundary) / 2
   │  └─ 记录 profile.data.diagnosis_log (具体错题记录)
   └─ 输出: profile.json (校准后的 Skill Matrix)

阶段 3: 动态深度规划 (Dynamic Depth Planning)
   ├─ cli-curriculum-architect -> 读取 Skill Matrix & Diagnosis Log
   │  └─ 策略: 高分技能(>0.8)跳过基础，低分技能(<0.4)强化细节
   ├─ ⚠️ 阻断式审查 (Gemini CLI):
   │  └─ 检查逻辑流、前置依赖、认知负荷
   └─ 交互确认 -> 批准/修改

阶段 4: 分级资源注入 (Tiered Resource Injection)
   ├─ 遍历原子任务
   ├─ 尝试 Gold Tier (Score >= 0.8, 强相关, 权威)
   ├─ 失败 -> 尝试 Silver Tier (Score >= 0.6, 社区优质)
   ├─ 失败 -> 尝试 Bronze Tier (Score >= 0.4, 宽泛相关)
   └─ 失败 -> 生成通用 Google Search Link (Fallback)
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

### 阶段 1: 全息画像捕获 (无状态化)

**核心逻辑**：移除 `history` 数组，每轮问答后强制进行“信息蒸馏”。

```javascript
// 初始化 Profile
let profile = {
  dimensions: { target_clarity: 0.1, current_competency: 0.1, /*...*/ },
  data: {
    skill_matrix: {} // 动态深度矩阵
  }
}

const THRESHOLD = 0.9

while (true) {
  // 1. 找出短板维度
  const weakDimensions = Object.keys(profile.dimensions).filter(k => profile.dimensions[k] < THRESHOLD)
  if (weakDimensions.length === 0) break;

  // 2. 生成问题 (不携带过往冗余历史，只带当前 Data)
  const profilingTask = Task(
    subagent_type="cli-profiler-agent",
    prompt=`
    当前已知数据: ${JSON.stringify(profile.data)}
    未达标维度: ${weakDimensions.join(', ')}
    任务: 生成 1-3 个问题以补全数据，使评分达标。
    `
  )
  const questions = JSON.parse(Read(profilingTask.output_file)).questions

  // 3. 用户交互
  const answers = AskUserQuestion({ questions: questions.map(q => ({ question: q.text, options: q.options })) })

  // 4. ⚡️ 信息萃取与维度打分 (Extract & Discard)
  const updateTask = Task(
    subagent_type="cli-profiler-agent",
    prompt=`
    输入: 用户回答 ${JSON.stringify(answers)}
    当前数据: ${JSON.stringify(profile.data)}
    
    操作:
    1. 从回答中提取关键事实(Facts)。
    2. 更新 'data' 字段 (如: 把 "我懂一点React" 解析为 skill_matrix: {"React": 0.3})。
    3. 基于 BARS 标准重新评估所有维度分数。
    4. **仅输出更新后的 Profile JSON，不要包含对话历史。**
    `
  )
  profile = JSON.parse(Read(updateTask.output_file))
}

Write(`${sessionFolder}/profile.json`, JSON.stringify(profile, null, 2))
```

### 阶段 2: 能力诊断 (二分逼近法)

**核心逻辑**：通过一次交互（Max 4题）快速校准 `skill_matrix` 中的关键项。

```javascript
if (!flags.includes('--quick')) {
  // 识别需要验证的核心技能 (Top 3)
  const skillsToCheck = Object.keys(profile.data.skill_matrix).slice(0, 3);
  
  for (const skill of skillsToCheck) {
    let currentLevel = profile.data.skill_matrix[skill];
    
    // 1. 生成混合探针 (Max 4)
    // 包含: Anchor(当前等级), Upper(等级+0.3), Lower(等级-0.3), Trap(概念陷阱)
    const diagTask = Task(
       subagent_type="cli-diagnostic-agent",
       prompt=`生成针对 ${skill} (Current Level: ${currentLevel}) 的 4 道混合难度代码测试题。`
    )
    const quiz = JSON.parse(Read(diagTask.output_file))

    // 2. 用户作答
    const results = AskUserQuestion({ questions: quiz.questions })

    // 3. ⚡️ 二分定级逻辑
    // 简单模拟 Agent 的评估逻辑
    const evalResult = await AgentEvaluate(results, quiz); // 返回 { passed_anchor: true, passed_upper: false, ... }
    
    let newLevel = currentLevel;
    if (evalResult.passed_upper) {
      // 表现超预期 -> 向上二分: (Current + 1.0) / 2
      newLevel = (currentLevel + 1.0) / 2;
    } else if (evalResult.passed_anchor) {
      // 符合预期 -> 保持或微调
      newLevel = currentLevel;
    } else {
      // 低于预期 -> 向下二分: (Current + 0.0) / 2
      newLevel = (currentLevel + 0.0) / 2;
    }

    // 更新矩阵与日志
    profile.data.skill_matrix[skill] = parseFloat(newLevel.toFixed(2));
    if (!profile.data.diagnosis_log) profile.data.diagnosis_log = [];
    profile.data.diagnosis_log.push({ skill, old: currentLevel, new: newLevel, details: evalResult.summary });
  }

  // 更新综合能力分 (加权平均)
  const levels = Object.values(profile.data.skill_matrix);
  profile.dimensions.current_competency = levels.reduce((a,b)=>a+b, 0) / levels.length;
  
  Write(`${sessionFolder}/profile.json`, JSON.stringify(profile, null, 2))
}
```

### 阶段 3: 动态深度规划 (Dynamic Depth)

**核心逻辑**：Gemini 必须根据 Skill Matrix 调整课程密度。

```javascript
// 1. 生成规划
Task(
  subagent_type="cli-curriculum-architect",
  prompt=`
  输入 Profile: ${JSON.stringify(profile)}
  重点参考: data.skill_matrix 和 data.diagnosis_log
  
  要求:
  - 动态深度 (Dynamic Depth): 
    - 对于评分 > 0.8 的技能，仅安排"复习/查漏补缺"的高级任务。
    - 对于评分 < 0.4 的技能，安排"基础概念+实战练习"的详细任务。
    - 对于 diagnosis_log 中记录的错题点（如 "闭包失效"），必须安排专项修复任务。
  `
)
// ...后续 Gemini 审查逻辑同 v1.0，但增加了对 Matrix 匹配度的检查...
```

### 阶段 4: 分级资源注入 (Tiered Fallback)

**核心逻辑**：定义 Gold/Silver/Bronze 标准，循环降级，确保任务可执行。

```javascript
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`))

// 定义资源分级
const TIERS = [
  { name: "Gold",   threshold: 0.8, strict: true,  desc: "权威/高匹配" },
  { name: "Silver", threshold: 0.6, strict: false, desc: "社区优质/一般匹配" },
  { name: "Bronze", threshold: 0.4, strict: false, desc: "宽泛相关" }
]

plan.tasks = await Promise.all(plan.tasks.map(async (task) => {
  let finalResources = []
  
  // ⚡️ 分级循环
  for (const tier of TIERS) {
    // 构建查询: Gold 模式下强制加 site:official-docs 等
    let query = `${task.keywords} tutorial`
    if (tier.strict) query += " site:official-docs.io OR site:github.com"
    
    // 执行搜索
    const searchRes = await execute_mcp_tool('mcp__exa__web_search_exa', { query, num_results: 3 })
    
    // 评分 (伪代码)
    const scored = searchRes.results.map(r => ({ ...r, score: calculateScore(r, task) }))
    
    // 筛选符合当前 Tier 的资源
    const valid = scored.filter(r => r.score >= tier.threshold)
    
    if (valid.length > 0) {
      finalResources = valid.slice(0, 3).map(r => ({ ...r, tier: tier.name }))
      break; // 找到即停止，不再降级
    }
  }

  // ⚡️ 最终兜底 (Fallback)
  if (finalResources.length === 0) {
     finalResources.push({
       title: "Manual Search (Fallback)",
       url: `https://www.google.com/search?q=${encodeURIComponent(task.title)}`,
       tier: "Fallback",
       rationale: "自动搜索未发现匹配资源，请手动查阅。"
     })
  }

  return { ...task, resources: finalResources }
}))

Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2))
```

## 5. JSON Schema 定义 (v2.0)

### Profile.json (最终版)

```json
{
  "meta": {
    "session_id": "learn-ts-2024",
    "generated_at": "..."
  },
  "dimensions": {
    "target_clarity": 0.95,
    "current_competency": 0.65, 
    "learning_style": 0.9,
    "constraints": 0.9,
    "psychological": 0.9,
    "prerequisites": 0.9
  },
  "data": {
    "goal": "学习 TS 开发 VSCode 插件",
    "constraints": "仅周末有空",
    
    // 细粒度技能矩阵
    "skill_matrix": {
      "JavaScript": 0.85,
      "TypeScript": 0.2,
      "VSCode API": 0.0
    },
    
    // 诊断日志 (Planner 参考用)
    "diagnosis_log": [
      {
        "skill": "JavaScript",
        "old_level": 0.7,
        "new_level": 0.85,
        "details": "Passed closure traps, showed advanced understanding."
      }
    ]
  }
  // history 字段已移除
}
```

### Plan.json (最终版)

```json
{
  "phases": [
    {
      "title": "Phase 1: TypeScript Basics",
      "rationale": "Due to low score (0.2) in Skill Matrix.",
      "tasks": [
        {
          "id": "t-1",
          "title": "Interface vs Types",
          "resources": [
            {
              "title": "TS Official Handbook",
              "url": "...",
              "score": 0.92,
              "tier": "Gold"
            }
          ]
        }
      ]
    },
    {
      "title": "Phase 2: JavaScript Advanced Patterns",
      "rationale": "Skipped basic syntax due to high score (0.85). Focused on review.",
      "tasks": [...]
    }
  ]
}
```