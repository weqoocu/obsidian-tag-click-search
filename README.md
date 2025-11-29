# Tag Click Search - 标签点击搜索插件

[![GitHub release](https://img.shields.io/github/v/release/yourusername/obsidian-tag-click-search)](https://github.com/yourusername/obsidian-tag-click-search/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/yourusername/obsidian-tag-click-search/total)](https://github.com/yourusername/obsidian-tag-click-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🏷️ 一个简单而强大的 Obsidian 插件，让标签搜索变得更加便捷！

## 🌟 功能简介

这是一个为 Obsidian 开发的插件，实现了类似 TagFolder 插件中的 "Search tags inside TagFolder when clicking tags" 功能。让你能够通过简单的点击操作，快速找到所有包含特定标签的笔记。

## ✨ 主要功能

### 🎯 一键标签搜索
- **阅读模式**：直接点击标签链接（`#标签名`）
- **编辑模式**：点击编辑器中的标签文本
- **实时响应**：无需等待，即点即搜

### 📊 智能结果展示
- 🔍 自动打开专用搜索结果面板
- 📝 列出所有包含该标签的笔记
- 🔤 按笔记的 `title` 属性（frontmatter）智能排序
- 📈 显示匹配文件数量统计

### 🌏 完美中文支持
- ✅ 完美支持中文标签搜索
- ✅ 中文字符自然排序
- ✅ 混合中英文标签处理

### 🔧 高度兼容
- 🤝 与 Tag Wrangler 完美兼容
- 🤝 与 TagFolder 可同时使用
- 🤝 与 Dataview 无冲突
- 📱 支持桌面端和移动端

## 🚀 快速开始

### 📦 安装方法

#### 方法一：手动安装（推荐）

1. 下载最新版本的 [Release](https://github.com/weqoocu/obsidian-tag-click-search/releases)
2. 解压下载的文件
3. 将文件夹复制到你的 Obsidian vault 的 `.obsidian/plugins/` 目录下
4. 重启 Obsidian
5. 在 设置 → 社区插件 中启用 "Tag Click Search"

#### 方法二：通过 BRAT 插件安装

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中添加仓库：`weqoocu/obsidian-tag-click-search`
3. 启用插件

### 📁 文件结构
```
.obsidian/plugins/tag-click-search/
├── manifest.json
├── main.js
└── README.md
```

## 📖 使用指南

### 🖱️ 基本操作

1. **在阅读模式下**：
   - 直接点击任何标签链接（如 `#项目管理`、`#学习笔记`）
   - 插件会立即响应并显示搜索结果

2. **在编辑模式下**：
   - 点击编辑器中的标签文本
   - 支持正在输入的标签

3. **查看结果**：
   - 搜索结果会在右侧边栏的专用面板中显示
   - 点击任意结果项可直接打开对应笔记
   - 结果按笔记标题智能排序

### ⌨️ 快捷键支持

- 可以在 Obsidian 设置 → 快捷键 中为 "搜索当前光标处的标签" 命令设置自定义快捷键
- 建议设置：`Ctrl/Cmd + Shift + T`

### 📋 排序规则

- **优先级1**：使用笔记 frontmatter 中的 `title` 字段
- **优先级2**：如果没有 `title` 字段，则使用文件名
- **排序方式**：支持中文、英文、数字的自然排序

#### 示例 frontmatter：
```yaml
---
title: "我的学习笔记"
tags: [学习, 笔记, 知识管理]
---
```

## 🔧 技术原理

### 🎯 标签检测机制
- **阅读模式**：监听 `a.tag[href^="#"]` 元素的点击事件
- **编辑模式**：监听 `.cm-hashtag` 元素的点击事件
- **智能识别**：自动提取标签名称，支持嵌套标签

### 🔍 搜索算法
1. **文件遍历**：遍历 vault 中的所有 markdown 文件
2. **标签匹配**：检查文件的 `tags` 和 `frontmatter.tags` 字段
3. **模糊匹配**：忽略大小写，支持部分匹配
4. **结果过滤**：排除已删除和无效文件

### 📊 结果展示
- **自定义视图**：创建专用的搜索结果视图
- **实时更新**：支持文件变化的实时响应
- **交互优化**：点击结果直接跳转到对应笔记

## 🆚 与其他插件的对比

| 功能特性 | TagFolder | Tag Wrangler | **Tag Click Search** |
|---------|-----------|--------------|---------------------|
| 🖱️ 点击标签搜索 | ✅ | ❌ | ✅ |
| 📊 按 title 排序 | ✅ | ❌ | ✅ |
| 📁 文件夹视图 | ✅ | ❌ | ❌ |
| 🏷️ 标签管理 | ❌ | ✅ | ❌ |
| 🔄 独立运行 | ❌ | ✅ | ✅ |
| 🤝 插件兼容性 | ⚠️ | ✅ | ✅ |
| 🌏 中文支持 | ⚠️ | ✅ | ✅ |
| 📱 移动端支持 | ❌ | ✅ | ✅ |
| ⚡ 性能优化 | ⚠️ | ✅ | ✅ |

### 💡 为什么选择 Tag Click Search？

- **🎯 专注核心功能**：只做标签点击搜索，做到极致
- **🚀 轻量高效**：代码简洁，性能优异
- **🤝 完美兼容**：可与其他标签插件同时使用
- **🌏 中文优化**：专门优化了中文标签的处理

## ⚙️ 配置选项

当前版本为简化版本，专注于核心功能。未来版本计划添加：

- 🎨 **显示设置**：自定义搜索结果面板的样式
- 📊 **排序选项**：支持按创建时间、修改时间、文件大小排序
- 🔢 **结果限制**：设置最大显示文件数量
- 🎯 **搜索范围**：限制搜索特定文件夹
- 📱 **移动端优化**：针对移动设备的界面调整

## 🔧 故障排除

### ❌ 插件无法工作

**可能原因及解决方案：**

1. **插件未启用**
   ```
   解决方案：设置 → 社区插件 → 启用 "Tag Click Search"
   ```

2. **缓存问题**
   ```
   解决方案：重启 Obsidian 或重新加载插件
   ```

3. **权限问题**
   ```
   解决方案：检查文件权限，确保 Obsidian 可以读取插件文件
   ```

### 🔍 搜索结果不准确

**可能原因及解决方案：**

1. **标签格式错误**
   ```yaml
   # ❌ 错误格式
   tags: 学习笔记
   
   # ✅ 正确格式
   tags: [学习, 笔记]
   # 或
   tags:
     - 学习
     - 笔记
   ```

2. **元数据缓存过期**
   ```
   解决方案：设置 → 文件与链接 → 重建索引
   ```

### 📊 排序显示异常

**可能原因及解决方案：**

1. **title 字段格式问题**
   ```yaml
   # ❌ 错误格式
   title: 123
   
   # ✅ 正确格式
   title: "我的笔记标题"
   ```

2. **特殊字符问题**
   ```
   解决方案：避免在 title 中使用特殊控制字符
   ```

### 🐛 如何报告问题

如果遇到其他问题，请：

1. **收集信息**：
   - Obsidian 版本
   - 插件版本
   - 操作系统
   - 错误截图

2. **提交 Issue**：
   - 访问 [GitHub Issues](https://github.com/weqoocu/obsidian-tag-click-search/issues)
   - 使用提供的模板描述问题
   - 附上相关日志信息

## 🗺️ 开发路线图

### 🎯 近期计划 (v1.1.x)

- [ ] 🎨 **配置面板**：添加插件设置界面
- [ ] 📊 **多种排序**：支持按时间、大小等排序
- [ ] 🔢 **结果分页**：处理大量搜索结果
- [ ] 🎯 **搜索范围**：限制特定文件夹搜索

### 🚀 中期计划 (v1.2.x)

- [ ] 🏷️ **嵌套标签**：支持层级标签的展示
- [ ] 🔍 **多标签搜索**：同时搜索多个标签
- [ ] 📱 **移动端优化**：改进移动设备体验
- [ ] 🎨 **主题适配**：适配更多 Obsidian 主题

### 🌟 长期计划 (v2.0.x)

- [ ] 📈 **搜索统计**：标签使用频率分析
- [ ] 🔄 **搜索历史**：记录搜索历史
- [ ] 🤖 **智能推荐**：基于使用习惯推荐相关标签
- [ ] 🔗 **标签关系图**：可视化标签关系

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 🐛 报告问题

1. 查看 [现有 Issues](https://github.com/yourusername/obsidian-tag-click-search/issues)
2. 使用 Issue 模板创建新问题
3. 提供详细的复现步骤

### 💡 功能建议

1. 在 [Discussions](https://github.com/yourusername/obsidian-tag-click-search/discussions) 中讨论
2. 详细描述功能需求和使用场景
3. 考虑功能的通用性和实现复杂度

### 🔧 代码贡献

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 📝 文档贡献

- 改进 README 文档
- 添加使用示例
- 翻译成其他语言
- 制作使用教程

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- 💡 **灵感来源**：[TagFolder](https://github.com/vrtmrz/obsidian-tagfolder) 插件
- 🤝 **兼容性**：[Tag Wrangler](https://github.com/pjeby/tag-wrangler) 插件
- 🌟 **社区支持**：Obsidian 中文社区
- 🎨 **设计参考**：Obsidian 官方插件设计规范

## 📞 联系方式

- 🐛 **问题反馈**：[GitHub Issues](https://github.com/yourusername/obsidian-tag-click-search/issues)
- 💬 **功能讨论**：[GitHub Discussions](https://github.com/yourusername/obsidian-tag-click-search/discussions)
- 📧 **邮件联系**：your-email@example.com
- 🌐 **个人网站**：[酷口家数字花园](https://your-website.com)

---

<div align="center">

**⭐ 如果这个插件对你有帮助，请给个 Star 支持一下！**

[![Star History Chart](https://api.star-history.com/svg?repos=weqoocu/obsidian-tag-click-search&type=Date)](https://star-history.com/#weqoocu/obsidian-tag-click-search&Date)

**🎉 享受愉快的标签搜索体验！**

</div>
