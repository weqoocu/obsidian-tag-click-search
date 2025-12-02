# 🎉 Tag Click Search v1.1.0 - 手动输入搜索功能

## ✨ 新功能

### 🔍 搜索输入框
现在你可以在搜索结果面板中直接输入标签名进行搜索，无需点击现有的标签！

**主要特性：**
- 📝 **灵活输入**：支持直接输入标签名，不需要 `#` 前缀
- 🔄 **格式兼容**：输入 `标签名` 或 `#标签名` 都可以正常搜索
- ⌨️ **快捷操作**：按 Enter 键即可快速搜索
- 🎨 **美观界面**：专业的搜索输入框设计

### 📸 使用示例

```
输入框中可以输入：
✅ "项目管理"       → 搜索 #项目管理
✅ "#项目管理"      → 搜索 #项目管理
✅ "学习/笔记"      → 搜索 #学习/笔记
✅ "#学习/笔记"     → 搜索 #学习/笔记
```

## 🔄 使用方法

### 方法一：手动输入搜索
1. 打开标签搜索面板（点击任意标签或使用快捷键）
2. 在顶部输入框中输入标签名
3. 点击"搜索"按钮或按回车键
4. 查看搜索结果

### 方法二：点击标签搜索（原有功能）
1. 在阅读模式或编辑模式下点击标签
2. 自动打开搜索结果面板
3. 可以继续使用输入框搜索其他标签

## 🆕 与 v1.0.3 的区别

| 功能 | v1.0.3 | v1.1.0 |
|------|--------|--------|
| 点击标签搜索 | ✅ | ✅ |
| 手动输入搜索 | ❌ | ✅ |
| 搜索输入框 | ❌ | ✅ |
| 回车键搜索 | ❌ | ✅ |
| 格式自动处理 | - | ✅ |

## 📦 安装方法

### 升级现有版本
如果你已经安装了 v1.0.3：
1. 下载新版本的 `main.js` 和 `manifest.json`
2. 替换原有文件
3. 重启 Obsidian

### 全新安装
1. 下载下方的 `main.js` 和 `manifest.json` 文件
2. 在你的 Obsidian vault 中创建文件夹：`.obsidian/plugins/tag-click-search/`
3. 将下载的文件放入该文件夹
4. 重启 Obsidian
5. 在 设置 → 社区插件 中启用 "Tag Click Search"

### 通过 BRAT 更新
1. 在 BRAT 插件中点击更新
2. 重启 Obsidian

## 🎯 技术改进

- 📊 **视图增强**：为搜索结果视图添加了输入控件
- 🎨 **样式优化**：使用 Obsidian 原生变量，完美适配主题
- 🔧 **代码优化**：改进了组件间的通信机制
- 🐛 **Bug 修复**：修复了一些潜在的边界情况

## 🔧 系统要求

- **最低 Obsidian 版本**：0.15.0
- **支持平台**：Windows、macOS、Linux、iOS、Android

## 🐛 已知问题

目前没有已知问题。如果遇到问题，请到 [GitHub Issues](https://github.com/weqoocu/obsidian-tag-click-search/issues) 报告。

## 📞 联系方式

- 🐛 **问题反馈**：[GitHub Issues](https://github.com/weqoocu/obsidian-tag-click-search/issues)
- 💬 **功能讨论**：[GitHub Discussions](https://github.com/weqoocu/obsidian-tag-click-search/discussions)
- 📧 **邮件联系**：musicleaf@qq.com
- 🌐 **个人网站**：[酷口家数字花园](https://weqoocu.com)

## 📖 详细文档

完整的使用指南和技术文档：https://github.com/weqoocu/obsidian-tag-click-search

---

**⭐ 如果这个插件对你有帮助，请给个 Star 支持一下！**

**🎉 享受更便捷的标签搜索体验！**