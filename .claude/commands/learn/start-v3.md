# Workflow Learn Start Command (/learn:start) v3.0

## 1. 概览 (Overview)

本命令是智能学习工作流的**战略规划起点**。它不仅仅生成一份大纲，而是通过构建**知行二元（Theory-Practice）**的技能矩阵和**认知脚手架（Cognitive Scaffolding）**，生成一份完全匹配用户当前“手感”和“心理状态”的原子化任务清单。

**核心特性 (v3.0):**
- **知行二元矩阵**：摒弃单一评分，将技能拆解为 **T (Theory/理论)** 和 **P (Practice/实战)** 两个维度，精准识别“眼高手低”或“野路子”型学习者。
- **认知适配规划**：根据用户的**脚手架密度 (Scaffolding Density)** 需求，动态调整任务的颗粒度（是直接发布“实现登录”，还是拆解为 5 个微步骤）。
- **模态感知搜索**：根据学习风格（如 Visual vs Textual），在资源搜索时自动注入对应的格式过滤，确保资源“合胃口”。
- **成长型日志 (Feedback Journal)**：预留结构化日志字段，用于记录全生命周期的导师评价、错题反思和计划调整，打造可进化的用户画像。

## 2. 用法 (Usage)

```bash
/learn:start [FLAGS] <LEARNING_GOAL>

# Flags
-q, --quick                跳过诊断阶段 (默认 T/P 设为 0.5)
-l, --language <lang>      强制输出语言 (默认 zh-CN)
```

## 3. 执行流程 (Execution Process)

```
阶段 1: 深度画像捕获 (Profiling)
   ├─ 初始化维度 & 数据结构
   ├─ 循环提问 -> 萃取 Facts -> 更新 Profile
   │  ├─ 识别 学习模态 (Visual/Text/Code-first)
   │  └─ 识别 认知特征 (挫折耐受度 -> 决定脚手架密度)
   └─ 输出: Profile (含初步 T/P 矩阵)

阶段 2: 知行二元诊断 (T/P Diagnosis)
   ├─ 针对核心技能生成双维探针:
   │  ├─ T-Probe: 概念辨析、原理选择 (测理论)
   │  └─ P-Probe: 代码填空、Bug修复 (测实战)
   ├─ 用户作答 -> 更新 Skill Matrix { T: val, P: val }
   └─ 记录 diagnosis_log

阶段 3: 策略化规划 (Strategic Planning)
   ├─ 读取 T/P Matrix & Scaffolding Density
   ├─ cli-curriculum-architect 生成 Task List:
   │  ├─ T高P低 -> 生成 "Lab/Project" 类型任务 (补实战)
   │  ├─ T低P高 -> 生成 "Deep Dive" 类型任务 (补理论)
   │  └─ 高密度脚手架 -> 将 1 个任务拆解为 3-5 个微步骤
   └─ ⚠️ Gemini 审查 (逻辑性与依赖检查)

阶段 4: 模态资源注入 (Modality Injection)
   ├─ 读取 pedagogy.modality (如 "Video-Preferred")
   ├─ 构造 Search Query (添加 site:youtube 或 filetype:pdf)
   ├─ 分级搜索 (Gold/Silver/Bronze)
   └─ 输出: 最终 plan.json
```

## 4. 数据结构定义 (JSON Schema)

### Profile.json (v3.0 核心)

```json
{
  "meta": { "session_id": "learn-rust-2024" },
  
  // 1. 六大宏观维度 (用于阈值控制)
  "dimensions": {
    "target_clarity": 0.95,
    "current_competency": 0.6, // 综合加权分
    "learning_style": 0.9,
    "constraints": 0.9,
    "psychological": 0.9,
    "prerequisites": 0.9
  },
  
  "data": {
    "goal": "学习 Rust 并重写现有的 CLI 工具",
    
    // [新] 知行二元矩阵：区分理论与实战
    "skill_matrix": {
      "C++":  { "T": 0.8, "P": 0.7 }, // 熟练
      "Rust": { "T": 0.4, "P": 0.1 }  // 懂一点概念(OwnerShip)，手写不出来
    },
    
    // [新] 认知配置：决定任务生成的颗粒度
    "cognitive": {
      "scaffolding_density": "High", // High=新手/焦虑，任务需切碎; Low=专家，任务粗放
      "feedback_preference": "Encouraging"
    },
    
    // [新] 教学模态：决定资源搜索偏好
    "pedagogy": {
      "modality": "Visual", // Visual, Textual, Pragmatic(Code-first)
      "banned_sources": ["Academic Papers"]
    },

    // [新] 成长日志：留存后续流程 (Ask/Review/Mentor) 的评价
    "feedback_journal": [
      {
        "stage": "Diagnosis",
        "timestamp": "2024-05-20T10:00:00Z",
        "source": "cli-diagnostic-agent",
        "content": "用户在 Rust 生命周期概念上存在误解，建议加强 Borrow Checker 的可视化演示。",
        "action_taken": "Adjusted Rust T-score to 0.4"
      }
      // 未来 /learn:ask 或 /learn:mentor 的记录将追加于此
    ]
  }
}
```

## 5. 实现细节 (Implementation)

### 阶段 1: 深度画像捕获

```javascript
// 重点在于提取 cognitive 和 pedagogy
const extractionPrompt = `
  输入: 用户回答 ${JSON.stringify(answers)}
  任务: 
  1. 更新 'data'。
  2. 分析用户的挫折耐受度，设定 cognitive.scaffolding_density (High/Medium/Low)。
  3. 分析用户的资源偏好，设定 pedagogy.modality (Visual/Textual/Interactive)。
  4. 如果提到具体技术，初始化 skill_matrix，默认 T=0.3, P=0.1。
`;
// ... (执行 Task 并更新 Profile)
```

### 阶段 2: 知行二元诊断 (Theory vs Practice)

```javascript
if (!flags.includes('--quick')) {
  const skills = Object.keys(profile.data.skill_matrix);
  
  for (const skill of skills) {
    const current = profile.data.skill_matrix[skill]; // { T: 0.4, P: 0.1 }
    
    // 生成分离的探针
    const quiz = GenerateQuiz({
      skill: skill,
      theory_level: current.T,
      practice_level: current.P,
      count: 4 // 2 Theory Questions, 2 Practice Challenges
    });
    
    const results = AskUserQuestion(quiz);
    
    // 独立计算 T 和 P 的分数
    const newT = calculateScore(results.theory_answers, current.T);
    const newP = calculateScore(results.practice_answers, current.P);
    
    // 更新矩阵
    profile.data.skill_matrix[skill] = { T: newT, P: newP };
    
    // 写入日志
    profile.data.feedback_journal.push({
      stage: "Diagnosis",
      content: `Tested ${skill}. Theory delta: ${newT - current.T}, Practice delta: ${newP - current.P}.`
    });
  }
}
```

### 阶段 3: 策略化规划 (The Architect)

**核心逻辑**：不处理具体排期，专注于任务的内容策略与颗粒度。

```javascript
Task(
  subagent_type="cli-curriculum-architect",
  prompt=`
  Input Profile: ${JSON.stringify(profile)}
  
  Strategy Requirements:
  1. **Check Gap**: 
     - If T > P + 0.4 (眼高手低): Generate "Hands-on Labs" & "Code Repetition".
     - If P > T + 0.4 (野路子): Generate "Refactoring" & "Deep Dive Reading".
     
  2. **Check Scaffolding**:
     - If cognitive.scaffolding_density == "High": 
       Break complex tasks (e.g., "Build HTTP Server") into micro-steps:
       (a) Setup Cargo.toml, (b) Write Hello World, (c) Bind TCP port, (d) Handle Connection.
     - If "Low": Just output "Build HTTP Server".
     
  3. **Metadata**:
     - Each task must have 'estimated_minutes' and 'energy_type' (High/Low) 
       (to be used by future scheduling agents).
  `
)
```

### 阶段 4: 模态资源注入

```javascript
const modality = profile.data.pedagogy.modality; // e.g., "Visual"
const TIERS = [/* Gold, Silver, Bronze */];

plan.tasks = await Promise.all(plan.tasks.map(async (task) => {
  // 动态构建 Query
  let baseQuery = `${task.keywords} tutorial`;
  
  // 模态加权
  if (modality === "Visual") baseQuery += " site:youtube.com OR site:egghead.io";
  else if (modality === "Pragmatic") baseQuery += " site:github.com OR 'example code'";
  
  // 执行分级搜索 (同 v2.0，但在 Query 上更精准)
  // ...
  return { ...task, resources: searchResult };
}))
```

## 6. 交付物

完成执行后，系统生成两个文件：

1.  **`profile.json` (Living Persona)**: 包含 T/P 矩阵、认知配置和初始日志。此文件将在后续学习过程中被持续追加写入。
2.  **`plan.json` (Strategic Curriculum)**: 包含适配了认知深度的任务列表，每个任务带有时长和精力元数据，等待 `/learn:mentor` 进行每日排期。