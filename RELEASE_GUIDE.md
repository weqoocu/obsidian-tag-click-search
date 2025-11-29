# 🚀 发布指南

## 📋 完整发布流程

### 1️⃣ GitHub 仓库创建

1. **登录 GitHub**：访问 [github.com](https://github.com)

2. **创建新仓库**：
   ```
   仓库名称：obsidian-tag-click-search
   描述：点击标签自动搜索并按 title 排序显示包含该标签的笔记 - Obsidian Plugin
   可见性：Public
   ```

3. **推送代码**：
   ```bash
   # 在项目目录执行
   git remote add origin https://github.com/YOUR_USERNAME/obsidian-tag-click-search.git
   git branch -M main
   git push -u origin main
   ```

### 2️⃣ 创建 GitHub Release

1. **进入 Releases 页面**：
   - 在 GitHub 仓库页面点击 "Releases"
   - 点击 "Create a new release"

2. **填写 Release 信息**：
   ```
   Tag version: v1.0.3
   Release title: Tag Click Search v1.0.3 - 首个正式版本
   
   描述：
   🎉 Tag Click Search 首个正式版本发布！
   
   ✨ 主要功能：
   - 🎯 点击标签自动搜索功能
   - 📊 按笔记 title 属性智能排序
   - 🌏 完美支持中文标签和排序
   - 📱 支持桌面端和移动端
   - 🤝 与其他插件完美兼容
   
   📦 安装方法：
   1. 下载下方的 main.js 和 manifest.json 文件
   2. 在你的 vault 中创建 .obsidian/plugins/tag-click-search/ 文件夹
   3. 将下载的文件放入该文件夹
   4. 重启 Obsidian 并在设置中启用插件
   
   🔗 详细文档：https://github.com/YOUR_USERNAME/obsidian-tag-click-search
   ```

3. **上传文件**：
   - 上传 `main.js`
   - 上传 `manifest.json`
   - 上传 `README.md`（可选）

4. **发布**：点击 "Publish release"

### 3️⃣ 申请加入 Obsidian 官方插件市场

1. **Fork obsidian-releases 仓库**：
   - 访问 [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)
   - 点击 Fork

2. **添加插件信息**：
   - 编辑 `community-plugins.json` 文件
   - 添加你的插件信息：
   ```json
   {
     "id": "tag-click-search",
     "name": "Tag Click Search",
     "author": "酷口家数字花园",
     "description": "点击标签自动搜索并按 title 排序显示包含该标签的笔记",
     "repo": "YOUR_USERNAME/obsidian-tag-click-search"
   }
   ```

3. **创建 Pull Request**：
   - 提交变更并创建 PR
   - 等待 Obsidian 团队审核

### 4️⃣ 推广和维护

1. **社区推广**：
   - 在 Obsidian 中文社区分享
   - 在相关论坛发布介绍
   - 制作使用教程视频

2. **持续维护**：
   - 及时回复 Issues
   - 定期更新功能
   - 收集用户反馈

## 📁 必需文件清单

✅ 已完成的文件：
- [x] `main.js` - 插件主文件
- [x] `manifest.json` - 插件清单
- [x] `README.md` - 项目文档
- [x] `LICENSE` - 开源许可证
- [x] `package.json` - 项目配置
- [x] `CHANGELOG.md` - 更新日志
- [x] `versions.json` - 版本兼容性
- [x] `.gitignore` - Git 忽略文件
- [x] GitHub Issue 模板
- [x] GitHub PR 模板

## 🔧 发布前检查清单

- [ ] 代码已提交到 GitHub
- [ ] README 文档完整
- [ ] 版本号正确 (manifest.json, package.json)
- [ ] 测试插件功能正常
- [ ] 创建 GitHub Release
- [ ] 上传必需文件到 Release
- [ ] 申请加入官方插件市场

## 📞 需要帮助？

如果在发布过程中遇到问题：

1. **查看官方文档**：[Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
2. **参考其他插件**：查看成功插件的仓库结构
3. **社区求助**：在 Obsidian Discord 或论坛求助

## 🎯 下一步

发布完成后，建议：

1. **监控反馈**：关注 GitHub Issues 和用户反馈
2. **计划更新**：根据用户需求规划新功能
3. **维护文档**：保持文档的更新和准确性
4. **社区互动**：积极参与 Obsidian 开发者社区

---

**🎉 祝你的插件发布成功！**