# CCW 贡献者指南

> 如何为 CCW 项目贡献代码

---

## 贡献流程

### 1. Fork 和 Clone

```bash
git clone https://github.com/your-username/Claude-Code-Workflow.git
cd Claude-Code-Workflow
npm install
```

### 2. 创建分支

```bash
git checkout -b feat/your-feature
```

### 3. 开发和测试

```bash
npm run build
npm test
```

### 4. 提交 PR

- 遵循 Conventional Commits 格式
- 包含清晰的 PR 描述
- 关联相关 Issue

---

## 代码规范

### TypeScript

- 使用 strict 模式
- 遵循现有代码风格
- 添加必要的类型注释

### 提交信息

```
type(scope): subject

- type: feat/fix/refactor/docs/test/chore
- scope: 可选，影响的模块
- subject: 简短描述
```

---

## 测试要求

### 单元测试

- 新功能必须有测试
- 测试覆盖率 > 80%

### 集成测试

- 修改核心流程需要集成测试
- 使用 `npm run test:integration`

---

## 添加新功能

### 添加新技能

参考: [添加新技能指南](../deep-dive/extension/add-new-skill.md)

### 添加新命令

参考: [添加新命令指南](../deep-dive/extension/add-new-command.md)

### 添加新代理

参考: [添加新代理指南](../deep-dive/extension/add-new-agent.md)

---

## 文档更新

- 更新相关 README
- 更新 knowledge-base 文档
- 添加必要的代码注释

---

## 相关资源

- [扩展指南](../deep-dive/extension/)
- [设计决策](../deep-dive/architecture/design-decisions.md)
- [模块交互](../deep-dive/architecture/module-interactions.md)

---

*贡献者指南 - CCW Knowledge Base*
