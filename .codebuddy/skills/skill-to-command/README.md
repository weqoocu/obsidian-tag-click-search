## 技能文档

### 基本信息
- 技能名: `skill-to-command`
- 创建人: @AI Assistant
- 版本: v1.0.0
- 更新时间: 2025-12-03

### 适用场景
- 当需要为已有的 skill 创建对应的快捷指令时
- 当需要将 skill 暴露为用户可直接调用的命令时
- 当需要整理和规范化 commands 目录结构时

### 前置条件
- 已存在目标 skill（位于 `.codebuddy/skills/` 目录下）
- skill 包含有效的 SKILL.md 文件

### 使用示例
```
将 wecom-sender skill 转换为快捷指令
```

```
为 tapd-daily-report skill 创建对应的命令
```

```
把 yuanbao-automation 技能转成快捷指令
```

### 注意事项
⚠️ 快捷指令是 skill 的入口点，不实现具体功能
⚠️ 需要根据 skill 功能选择合适的分类目录
⚠️ 如果没有合适的分类目录，会自动创建新目录

### 已知问题
- [ ] 暂无

### 相关技能
- `skill-creator`: 创建新的 skill
- `wecom-sender`: 发送企业微信消息（示例 skill）
