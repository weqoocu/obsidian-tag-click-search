# Obsidian 社区插件市场提交指南

本指南将帮助你将 Tag Click Search 插件提交到 Obsidian 官方社区插件市场。

## 📋 前置准备

### 必需条件检查清单

- [x] ✅ 插件代码已开源到 GitHub
- [x] ✅ 有明确的开源许可证（MIT License）
- [x] ✅ README.md 包含详细的使用说明
- [x] ✅ 创建了至少一个 GitHub Release
- [x] ✅ manifest.json 配置正确
- [ ] ⏳ 插件在本地测试无误
- [ ] ⏳ 阅读并遵守 Obsidian 插件开发指南

### 检查 manifest.json

确保你的 `manifest.json` 包含以下必需字段：

```json
{
  "id": "tag-click-search",
  "name": "Tag Click Search",
  "version": "1.9.0",
  "minAppVersion": "0.15.0",
  "description": "点击标签搜索笔记...",
  "author": "酷口家数字花园",
  "authorUrl": "https://github.com/weqoocu",
  "isDesktopOnly": false
}
```

## 🚀 提交流程

### 第一步：准备仓库

1. **确保仓库结构正确**

你的仓库根目录应该包含：
```
obsidian-tag-click-search/
├── main.js          # 主代码文件
├── manifest.json    # 插件清单
├── styles.css       # （可选）样式文件
├── README.md        # 说明文档
├── LICENSE          # 开源协议
└── versions.json    # 版本兼容性记录
```

2. **创建最新的 GitHub Release**

   你已经完成了这一步！确保 Release 包含：
   - `main.js`
   - `manifest.json`
   - `styles.css`（如果有）

### 第二步：Fork Obsidian Releases 仓库

1. **访问官方仓库**
   
   https://github.com/obsidianmd/obsidian-releases

2. **点击 Fork 按钮**
   
   将仓库 Fork 到你的账户下

3. **Clone 到本地**
   
   ```bash
   git clone https://github.com/YOUR_USERNAME/obsidian-releases.git
   cd obsidian-releases
   ```

### 第三步：添加你的插件信息

1. **编辑 community-plugins.json**

   在 `community-plugins.json` 文件中添加你的插件信息：

   ```json
   {
     "id": "tag-click-search",
     "name": "Tag Click Search",
     "author": "酷口家数字花园",
     "description": "点击标签搜索笔记，支持标签搜索、标题搜索、多标签AND、排除标签、组合搜索、弹窗式双日历日期范围选择，支持批量复制笔记内容，实时监听文件创建/删除/修改并自动更新搜索结果",
     "repo": "weqoocu/obsidian-tag-click-search"
   }
   ```

   **注意**：
   - 按字母顺序插入到正确位置
   - `description` 要简洁明了，不超过 250 字符
   - `repo` 格式为 `username/repository-name`

2. **提交更改**

   ```bash
   git add community-plugins.json
   git commit -m "Add Tag Click Search plugin"
   git push origin main
   ```

### 第四步：创建 Pull Request

1. **访问你 Fork 的仓库**
   
   https://github.com/YOUR_USERNAME/obsidian-releases

2. **点击 "Contribute" → "Open pull request"**

3. **填写 PR 信息**

   **标题**：
   ```
   Add Tag Click Search plugin
   ```

   **描述**：
   ```markdown
   # Plugin Submission

   - **Plugin Name**: Tag Click Search
   - **Repository**: https://github.com/weqoocu/obsidian-tag-click-search
   - **Latest Release**: v1.9.0
   - **Author**: 酷口家数字花园

   ## Description
   
   点击标签搜索笔记的 Obsidian 插件，支持：
   - 标签搜索和标题搜索
   - 多标签 AND 搜索、排除标签
   - 组合搜索功能
   - 弹窗式双日历日期范围选择
   - 批量复制笔记内容
   - 实时监听文件变化并自动更新搜索结果

   ## Checklist

   - [x] I have read and followed the plugin guidelines
   - [x] The plugin has been tested locally
   - [x] manifest.json contains all required fields
   - [x] README.md is clear and informative
   - [x] At least one GitHub release has been created
   - [x] The plugin is published under an open-source license

   ## Additional Notes

   This plugin provides a seamless tag-clicking search experience similar to TagFolder's functionality, with enhanced features like real-time file monitoring and automatic result updates.
   ```

4. **提交 Pull Request**

### 第五步：等待审核

- ⏰ **审核时间**：通常需要 1-2 周
- 📧 **保持关注**：查看 PR 评论，及时回复维护者的问题
- 🔧 **根据反馈修改**：如果有建议或要求，及时修改代码并更新

## 📝 提交后的注意事项

### 维护你的插件

1. **及时响应 Issues**
   - 用户反馈的问题
   - Bug 报告
   - 功能请求

2. **定期更新**
   - 修复已知问题
   - 添加新功能
   - 适配新版本 Obsidian

3. **更新 versions.json**
   
   每次发布新版本时更新：
   ```json
   {
     "1.9.0": "0.15.0",
     "1.8.13": "0.15.0",
     ...
   }
   ```

### 发布新版本流程

1. **更新版本号**
   - 修改 `manifest.json` 中的 `version`
   - 添加到 `versions.json`

2. **创建 GitHub Release**
   - 使用语义化版本号（如 v1.9.1）
   - 上传 `main.js` 和 `manifest.json`
   - 写清楚更新内容

3. **Obsidian 会自动检测**
   - 官方会自动抓取新版本
   - 用户会收到更新提示

## 🎯 常见问题

### Q: 提交后多久能在插件市场看到？

A: PR 被合并后，通常 24-48 小时内会在插件市场显示。

### Q: 如何修改插件描述？

A: 需要提交新的 PR 修改 `community-plugins.json` 中的描述。

### Q: 版本更新需要提交 PR 吗？

A: 不需要。只要在 GitHub 创建新 Release，Obsidian 会自动检测并更新。

### Q: 插件被拒绝了怎么办？

A: 
1. 仔细阅读审核者的反馈
2. 根据要求修改代码或文档
3. 在同一个 PR 中提交更改
4. 回复审核者说明已修改

### Q: 可以删除旧版本的 Release 吗？

A: 不建议。保留所有版本让用户可以降级。

## 📚 参考资源

- [Obsidian 插件开发文档](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian Releases 仓库](https://github.com/obsidianmd/obsidian-releases)
- [插件提交指南（英文）](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [插件审核标准](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

## 🎉 提交清单

在提交前，请确认以下所有项目：

- [ ] 仓库地址：https://github.com/weqoocu/obsidian-tag-click-search
- [ ] 已创建 v1.9.0 Release
- [ ] manifest.json 配置正确
- [ ] README.md 详细清晰
- [ ] 有开源许可证（MIT）
- [ ] Fork 了 obsidian-releases 仓库
- [ ] 在 community-plugins.json 添加了插件信息
- [ ] 创建了 Pull Request
- [ ] PR 描述完整

## 💡 提示

1. **插件 ID 唯一性**：确保 `id` 在所有插件中唯一
2. **描述简洁**：控制在 250 字符以内，突出核心功能
3. **持续维护**：提交后要持续维护，及时响应用户反馈
4. **遵守规范**：遵循 Obsidian 的插件开发规范和社区准则

---

**准备好了吗？** 🚀

按照以上步骤操作，你的插件很快就会出现在 Obsidian 社区插件市场中！

如有任何问题，欢迎查看官方文档或在社区寻求帮助。
