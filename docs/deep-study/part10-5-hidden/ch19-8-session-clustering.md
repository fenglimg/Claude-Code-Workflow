# Chapter 19.8: Session Clustering Service

> **定位**: 会话智能聚类与渐进式披露索引
> **核心文件**: `ccw/src/core/session-clustering-service.ts`
> **设计目标**: 通过多维度相似度分析，将相关会话组织为集群，支持上下文检索

## 19.8.1 架构概述

Session Clustering Service 是 CCW 记忆系统的智能索引组件，负责：

1. **多源会话收集**: 从 Core Memory、CLI History、Workflow Session 收集会话
2. **相似度计算**: 5 维度加权相似度评估
3. **层次聚类**: 使用凝聚聚类算法组织会话
4. **渐进式披露**: 根据场景返回相关上下文索引

```
┌───────────────────────────────────────────────────────────────┐
│                Session Clustering Service                      │
│                                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │   Collect     │  │   Calculate   │  │    Index      │     │
│  │   Sessions    │──►│  Similarity   │──►│  Generation   │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
│          │                  │                  │               │
│          ▼                  ▼                  ▼               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐     │
│  │ Core Memory   │  │ Relevance     │  │ Progressive   │     │
│  │ CLI History   │  │   Matrix      │  │  Disclosure   │     │
│  │ Workflow      │  │               │  │   Index       │     │
│  └───────────────┘  └───────────────┘  └───────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

## 19.8.2 5 维相似度计算

### 19.8.2.1 权重分布

```typescript
const WEIGHTS = {
  fileOverlap: 0.2,       // 文件路径重叠
  temporalProximity: 0.15, // 时间接近度
  keywordSimilarity: 0.15, // 关键词相似度
  vectorSimilarity: 0.3,   // 向量嵌入相似度
  intentAlignment: 0.2,    // 意图对齐度
};
// 总和 = 1.0
```

### 19.8.2.2 综合相似度公式

```
Relevance(s1, s2) = 
  0.20 × FileOverlap(s1, s2) +
  0.15 × TemporalProximity(s1, s2) +
  0.15 × KeywordSimilarity(s1, s2) +
  0.30 × VectorSimilarity(s1, s2) +
  0.20 × IntentAlignment(s1, s2)
```

### 19.8.2.3 各维度详解

#### File Overlap (文件路径重叠)

使用 Jaccard 相似度计算文件模式重叠：

```typescript
private calculateFileOverlap(s1: SessionMetadataCache, s2: SessionMetadataCache): number {
  const files1 = new Set(s1.file_patterns || []);
  const files2 = new Set(s2.file_patterns || []);

  if (files1.size === 0 || files2.size === 0) return 0;

  const intersection = new Set([...files1].filter(f => files2.has(f)));
  const union = new Set([...files1, ...files2]);

  return intersection.size / union.size;
}
```

#### Temporal Proximity (时间接近度)

基于时间差的分段评分：

```typescript
private calculateTemporalProximity(s1: SessionMetadataCache, s2: SessionMetadataCache): number {
  const diffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);

  if (diffHours <= 24) return 1.0;      // 24小时内: 100%
  if (diffHours <= 24 * 7) return 0.7;   // 7天内: 70%
  if (diffHours <= 24 * 30) return 0.4;  // 30天内: 40%
  return 0.1;                            // 超过30天: 10%
}
```

#### Keyword Similarity (关键词相似度)

使用 Jaccard 相似度计算关键词重叠：

```typescript
private calculateSemanticSimilarity(s1: SessionMetadataCache, s2: SessionMetadataCache): number {
  const kw1 = new Set(s1.keywords || []);
  const kw2 = new Set(s2.keywords || []);

  const intersection = new Set([...kw1].filter(k => kw2.has(k)));
  const union = new Set([...kw1, ...kw2]);

  return intersection.size / union.size;
}
```

#### Vector Similarity (向量相似度)

使用预计算的嵌入向量计算余弦相似度：

```typescript
private calculateVectorSimilarity(s1: SessionMetadataCache, s2: SessionMetadataCache): number {
  const embedding1 = this.getSessionEmbedding(s1.session_id);
  const embedding2 = this.getSessionEmbedding(s2.session_id);

  if (!embedding1 || !embedding2) return 0;

  return this.cosineSimilarity(embedding1, embedding2);
}

private cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### Intent Alignment (意图对齐度)

基于标题和摘要的词重叠：

```typescript
private calculateIntentAlignment(s1: SessionMetadataCache, s2: SessionMetadataCache): number {
  const text1 = ((s1.title || '') + ' ' + (s1.summary || '')).toLowerCase();
  const text2 = ((s2.title || '') + ' ' + (s2.summary || '')).toLowerCase();

  const words1 = text1.split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.split(/\s+/).filter(w => w.length > 3);

  const intersection = new Set([...set1].filter(w => set2.has(w)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}
```

## 19.8.3 层次聚类算法

### 19.8.3.1 算法概述

使用凝聚聚类 (Agglomerative Clustering) 的平均链接 (Average Linkage) 方法：

```typescript
private agglomerativeClustering(
  sessions: SessionMetadataCache[],
  relevanceMatrix: number[][],
  threshold: number  // CLUSTER_THRESHOLD = 0.4
): SessionMetadataCache[][] {
  // 初始化: 每个会话是一个独立的簇
  const clusters: Set<number>[] = sessions.map((_, i) => new Set([i]));

  while (true) {
    // 找到最高平均链接分数的簇对
    let maxScore = -1, mergeI = -1, mergeJ = -1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const score = this.averageLinkage(clusters[i], clusters[j], relevanceMatrix);
        if (score > maxScore) {
          maxScore = score;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    // 如果最高分数低于阈值，停止
    if (maxScore < threshold) break;

    // 合并簇
    const merged = new Set([...clusters[mergeI], ...clusters[mergeJ]]);
    clusters.splice(mergeJ, 1);
    clusters.splice(mergeI, 1);
    clusters.push(merged);
  }

  return clusters.map(cluster => Array.from(cluster).map(i => sessions[i]));
}
```

### 19.8.3.2 平均链接计算

```typescript
private averageLinkage(
  cluster1: Set<number>,
  cluster2: Set<number>,
  relevanceMatrix: number[][]
): number {
  let sum = 0, count = 0;

  for (const i of cluster1) {
    for (const j of cluster2) {
      sum += relevanceMatrix[i][j];
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}
```

### 19.8.3.3 聚类阈值

```typescript
const CLUSTER_THRESHOLD = 0.4;  // 中等相似度阈值
```

- 高于 0.4: 会话被认为足够相似，可以归入同一簇
- 低于 0.4: 会话保持独立

## 19.8.4 渐进式披露索引

### 19.8.4.1 索引类型

```typescript
async getProgressiveIndex(options: {
  type: 'session-start' | 'context';
  sessionId?: string;
  prompt?: string;
}): Promise<string>
```

| 类型 | 场景 | 返回内容 |
|------|------|----------|
| `session-start` | 新会话开始 | 最近的活跃簇 + 未聚类会话 |
| `context` | 上下文检索 | 与 Prompt 意图匹配的会话 |

### 19.8.4.2 Session-Start 索引

```markdown
<ccw-session-context>
## 📋 Session Context (Progressive Disclosure)

### 🔗 Active Clusters

**auth-jwt** (5 sessions)
> Intent: Implement JWT authentication

| Session | Type | Title |
|---------|------|-------|
| mem-001 | Core | JWT token generation |
| mem-002 | Core | Refresh token flow |
| ... | ... | +3 more |

### 📝 Recent Sessions (Unclustered)

| Session | Type | Title | Date |
|---------|------|-------|------|
| cli-123 | CLI | Fix login bug | 2026-02-18 |

**MCP Tools**:
```
# Resume session
mcp__ccw-tools__core_memory({ "operation": "export", "id": "mem-001" })

# Load cluster context
mcp__ccw-tools__core_memory({ "operation": "search", "query": "cluster:cluster-abc" })
```
</ccw-session-context>
```

### 19.8.4.3 Intent-Matched 索引

```markdown
<ccw-session-context>
## 📋 Intent-Matched Sessions

**Detected Intent**: jwt, authentication, token

### 🔗 Matched Clusters

**auth-jwt** (85% avg match)
> Implement JWT authentication

| Session | Match | Title |
|---------|-------|-------|
| mem-001 | 92% | JWT token generation |
| mem-002 | 78% | Refresh token flow |

### 📝 Individual Matches

| Session | Type | Match | Title |
|---------|------|-------|-------|
| cli-456 | CLI | 75% | Token validation fix |

**MCP Tools**:
```
# Resume top match
mcp__ccw-tools__core_memory({ "operation": "export", "id": "mem-001" })
```
</ccw-session-context>
```

## 19.8.5 会话元数据

### 19.8.5.1 SessionMetadataCache 结构

```typescript
interface SessionMetadataCache {
  session_id: string;
  session_type: 'core_memory' | 'workflow' | 'cli_history' | 'native';
  title: string;
  summary: string;
  keywords: string[];
  token_estimate: number;
  file_patterns: string[];
  created_at: string;
  last_accessed: string;
  access_count: number;
}
```

### 19.8.5.2 关键词提取

从会话内容中提取关键词：

```typescript
private extractKeywords(content: string): string[] {
  const keywords = new Set<string>();

  // 1. 文件路径 (src/xxx, .ts, .js)
  // 2. 函数/类名 (camelCase, PascalCase)
  // 3. 技术术语 (框架、库、概念)
  // 4. 通用词汇 (>= 4 字符，非停用词)

  return Array.from(keywords).slice(0, 20);
}
```

**技术术语列表**:
- 框架: react, vue, angular, typescript, javascript, node, express
- 认证: auth, authentication, jwt, oauth, session, token
- 数据: api, rest, graphql, database, sql, mongodb, redis
- 测试: test, testing, jest, mocha, vitest
- 开发: refactor, optimization, performance, bug, fix, error, issue
- CCW 特定: cluster, memory, hook, service, context, workflow, skill

## 19.8.6 自动聚类流程

```typescript
async autocluster(options?: ClusteringOptions): Promise<ClusteringResult> {
  // 1. 收集会话
  const allSessions = await this.collectSessions(options);

  // 2. 过滤已聚类的会话
  const sessions = allSessions.filter(s => {
    const clusters = this.coreMemoryStore.getSessionClusters(s.session_id);
    return clusters.length === 0;
  });

  // 3. 更新元数据缓存
  for (const session of sessions) {
    this.coreMemoryStore.upsertSessionMetadata(session);
  }

  // 4. 计算相似度矩阵
  const relevanceMatrix: number[][] = ...;

  // 5. 层次聚类
  const newPotentialClusters = this.agglomerativeClustering(
    sessions, relevanceMatrix, CLUSTER_THRESHOLD
  );

  // 6. 处理簇: 创建新簇或合并到现有簇
  for (const clusterSessions of newPotentialClusters) {
    const existingCluster = this.findExistingClusterForSessions(sessionIds);
    
    if (existingCluster && this.shouldMergeWithExisting(...)) {
      // 合并到现有簇
    } else {
      // 创建新簇
      const clusterName = this.generateClusterName(clusterSessions);
      const clusterIntent = this.generateClusterIntent(clusterSessions);
    }
  }

  return { clustersCreated, sessionsProcessed, sessionsClustered };
}
```

## 19.8.7 簇命名与意图生成

### 19.8.7.1 簇命名

基于关键词频率生成：

```typescript
private generateClusterName(members: SessionMetadataCache[]): string {
  const keywordFreq = new Map<string, number>();
  for (const member of members) {
    for (const keyword of member.keywords || []) {
      keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
    }
  }

  const sorted = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => kw);

  if (sorted.length >= 2) {
    return `${sorted[0]}-${sorted[1]}`;  // e.g., "auth-jwt"
  }
  return sorted[0] || 'unnamed-cluster';
}
```

### 19.8.7.2 意图生成

基于动作词检测：

```typescript
private generateClusterIntent(members: SessionMetadataCache[]): string {
  const actionWords = ['implement', 'refactor', 'fix', 'add', 'create', 'update', 'optimize'];
  const titles = members.map(m => (m.title || '').toLowerCase());

  for (const action of actionWords) {
    const count = titles.filter(t => t.includes(action)).length;
    if (count >= members.length / 2) {
      return `${action.charAt(0).toUpperCase() + action.slice(1)} ${this.generateClusterName(members)}`;
    }
  }

  return `Work on ${this.generateClusterName(members)}`;
}
```

## 19.8.8 去重机制

```typescript
async deduplicateClusters(): Promise<{ merged: number; deleted: number; remaining: number }> {
  // 1. 按名称分组
  const byName = new Map<string, typeof clusters>();
  for (const cluster of clusters) {
    const key = cluster.name.toLowerCase().trim();
    byName.set(key, [...]);
  }

  // 2. 合并同名簇
  for (const [name, group] of byName) {
    if (group.length >= 2) {
      this.coreMemoryStore.mergeClusters(target.id, sources);
    }
  }

  // 3. 检测高重叠簇 (>50%)
  // 4. 删除空簇
}
```

## 19.8.9 配置选项

```typescript
interface ClusteringOptions {
  scope?: 'all' | 'recent' | 'unclustered';
  timeRange?: { start: string; end: string };
  minClusterSize?: number;  // 默认 2
}

interface ClusteringResult {
  clustersCreated: number;
  sessionsProcessed: number;
  sessionsClustered: number;
}
```

## 19.8.10 设计决策

1. **5 维相似度**: 综合考虑文件、时间、关键词、向量和意图
2. **阈值 0.4**: 平衡聚类精度和召回率
3. **渐进式披露**: 根据场景返回不同粒度的索引
4. **去重机制**: 防止重复聚类
5. **元数据缓存**: 避免重复计算

---

*返回: [Part X.5 索引](./README.md)*
