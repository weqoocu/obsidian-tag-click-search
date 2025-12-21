# 快速发布指南 - Tag Click Search

## 🎯 一键复制信息

### 插件基本信息

```json
{
  "id": "tag-click-search",
  "name": "Tag Click Search",
  "author": "酷口家数字花园",
  "description": "点击标签搜索笔记，支持标签搜索、标题搜索、多标签AND、排除标签、组合搜索、弹窗式双日历日期范围选择，支持批量复制笔记内容，实时监听文件创建/删除/修改并自动更新搜索结果",
  "repo": "weqoocu/obsidian-tag-click-search"
}
```

### 仓库链接

- **GitHub 仓库**: https://github.com/weqoocu/obsidian-tag-click-search
- **最新 Release**: https://github.com/weqoocu/obsidian-tag-click-search/releases/latest
- **Issues**: https://github.com/weqoocu/obsidian-tag-click-search/issues

## 📋 提交到 Obsidian 社区插件市场（5 步）

### 1️⃣ Fork 官方仓库

```bash
# 访问并 Fork
https://github.com/obsidianmd/obsidian-releases

# Clone 到本地
git clone https://github.com/YOUR_USERNAME/obsidian-releases.git
cd obsidian-releases
```

### 2️⃣ 添加插件信息

编辑 `community-plugins.json`，在合适位置（按字母顺序）插入：

```json
{
  "id": "tag-click-search",
  "name": "Tag Click Search",
  "author": "酷口家数字花园",
  "description": "点击标签搜索笔记，支持标签搜索、标题搜索、多标签AND、排除标签、组合搜索、弹窗式双日历日期范围选择，支持批量复制笔记内容，实时监听文件创建/删除/修改并自动更新搜索结果",
  "repo": "weqoocu/obsidian-tag-click-search"
}
```

### 3️⃣ 提交更改

```bash
git add community-plugins.json
git commit -m "Add Tag Click Search plugin"
git push origin main
```

### 4️⃣ 创建 Pull Request

**PR 标题**:
```
Add Tag Click Search plugin
```

**PR 描述** (复制粘贴):
```markdown
# Plugin Submission

- **Plugin Name**: Tag Click Search
- **Repository**: https://github.com/weqoocu/obsidian-tag-click-search
- **Latest Release**: v1.9.0
- **Author**: 酷口家数字花园

## Description

点击标签搜索笔记的 Obsidian 插件，提供类似 TagFolder 的标签点击搜索功能，并增强了以下特性：

### 核心功能
- ✅ 标签点击搜索（阅读模式和编辑模式）
- ✅ 标题搜索功能
- ✅ 多标签 AND 搜索
- ✅ 排除标签功能
- ✅ 组合搜索（标签 + 标题关键词）

### 高级功能
- ✅ 弹窗式双日历日期范围选择
- ✅ 批量复制笔记内容
- ✅ 实时文件监听（创建/删除/修改自动更新）
- ✅ 智能排序（支持中文）

### 技术特点
- 🔄 实时响应文件变化
- 📱 支持桌面端和移动端
- 🌏 完美支持中文
- 🤝 与其他插件完美兼容

## Checklist

- [x] I have read and followed the plugin guidelines
- [x] The plugin has been tested locally
- [x] manifest.json contains all required fields
- [x] README.md is clear and informative
- [x] At least one GitHub release has been created
- [x] The plugin is published under an open-source license (MIT)

## Additional Notes

This plugin fills the gap for users who need a lightweight tag-clicking search solution after TagFolder was discontinued. It maintains the core functionality while adding modern features like real-time file monitoring and enhanced search capabilities.

The plugin has been thoroughly tested and is actively maintained. We are committed to providing timely support and updates.
```

### 5️⃣ 等待审核

- ⏰ 审核时间：1-2 周
- 📧 关注 PR 评论
- 🔧 及时回复和修改

## 🔄 发布新版本（自动）

每次发布新版本只需：

```bash
# 1. 更新版本号
# - manifest.json 中的 version
# - versions.json 添加新版本

# 2. 创建 Git tag
git tag -a v1.9.1 -m "版本说明"
git push origin v1.9.1

# 3. 在 GitHub 创建 Release
# - 上传 main.js
# - 上传 manifest.json
# - 填写更新说明

# Obsidian 会自动检测并通知用户更新
```

## 📞 需要帮助？

- 📖 [完整提交指南](./OBSIDIAN_PLUGIN_SUBMISSION.md)
- 🌐 [官方文档](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- 💬 [Obsidian 论坛](https://forum.obsidian.md/)
- 🐛 [报告问题](https://github.com/weqoocu/obsidian-tag-click-search/issues)

## ✅ 当前状态

- [x] ✅ 代码已推送到 GitHub
- [x] ✅ 已创建 v1.9.0 Release
- [x] ✅ 已创建 Git tag
- [x] ✅ README 和 CHANGELOG 已更新
- [ ] ⏳ 等待提交到 Obsidian 社区市场
- [ ] ⏳ 等待审核通过

---

**🚀 准备好了？开始提交吧！**
