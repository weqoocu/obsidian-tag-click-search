# 🤖 自动 Release 指南

## 📋 概述

现在你可以通过 GitHub Actions 自动创建 Release！只需推送一个 tag，GitHub 就会自动完成所有工作。

## 🚀 使用方法

### 方式一：使用自动脚本（推荐）

1. **更新版本号**：
   ```bash
   # 编辑 manifest.json, package.json, versions.json
   # 将版本号从 1.4.2 改为 1.4.3
   ```

2. **提交代码**：
   ```bash
   git add .
   git commit -m "v1.4.3: 新功能描述"
   git push origin main
   ```

3. **运行自动发布脚本**：
   ```bash
   bash release-auto.sh
   ```

4. **完成**！🎉
   - 脚本会自动创建并推送 tag
   - GitHub Actions 会自动创建 Release
   - Release 中会自动包含 `main.js` 和 `manifest.json`

### 方式二：手动推送 tag

如果你熟悉 git 操作，也可以手动推送 tag：

```bash
# 创建 tag
git tag -a "1.4.3" -m "v1.4.3: 新功能描述"

# 推送 tag
git push origin 1.4.3
```

推送后，GitHub Actions 会自动创建 Release。

## 📝 自定义 Release Notes

### 方法 1：创建版本专属的 Release Notes

在项目根目录创建文件：`RELEASE_NOTES_v1.4.3.md`

```markdown
## 🔧 功能优化

### ✨ 新功能
- 添加了某某功能
- 改进了某某体验

### 🐛 Bug 修复
- 修复了某某问题
```

GitHub Actions 会自动使用这个文件作为 Release 说明。

### 方法 2：在 CHANGELOG.md 中维护

在 `CHANGELOG.md` 中按格式记录：

```markdown
## [1.4.3] - 2025-12-07

### Added
- 新功能描述

### Changed
- 改进描述

### Fixed
- 修复描述
```

GitHub Actions 会自动提取对应版本的内容。

## 🔧 工作原理

### GitHub Actions 工作流

文件位置：`.github/workflows/release.yml`

**触发条件**：
- 当推送任何 tag 时自动触发

**自动执行**：
1. ✅ 检出代码
2. ✅ 读取版本信息
3. ✅ 生成或读取 Release Notes
4. ✅ 创建 GitHub Release
5. ✅ 上传 `main.js` 和 `manifest.json`

### 发布流程图

```
更新代码 → 提交 → 推送 tag
                      ↓
              GitHub Actions 触发
                      ↓
           自动创建 Release 🎉
                      ↓
              用户可以下载安装
```

## 📦 完整发布流程

### 1. 开发新功能

```bash
# 编辑代码
vim main.js

# 测试功能
# ...
```

### 2. 更新版本号

编辑这三个文件：
- `manifest.json` - 修改 `version` 字段
- `package.json` - 修改 `version` 字段
- `versions.json` - 添加新版本记录

### 3. 创建 Release Notes（可选）

```bash
# 创建版本专属的 Release Notes
cat > RELEASE_NOTES_v1.4.3.md <<EOF
## 🔧 功能优化

### ✨ 新功能
- 添加了 XXX 功能

## 📦 安装方法
...
EOF
```

### 4. 提交代码

```bash
git add .
git commit -m "v1.4.3: 添加新功能"
git push origin main
```

### 5. 自动发布

```bash
bash release-auto.sh
```

或手动：

```bash
git tag -a "1.4.3" -m "v1.4.3: 添加新功能"
git push origin 1.4.3
```

### 6. 等待自动完成

- 访问：https://github.com/weqoocu/obsidian-tag-click-search/actions
- 查看 Actions 执行进度（通常 1-2 分钟）
- 完成后访问 Releases 页面查看

## 🎯 优势

### 🚀 自动化
- 无需手动上传文件
- 无需手动填写表单
- 一键完成所有操作

### 📝 规范化
- Release 格式统一
- 版本信息自动提取
- 文件自动打包上传

### ⏱️ 高效
- 从几分钟缩短到几秒钟
- 减少人为错误
- 专注于开发本身

## 🔍 查看 Release

创建后访问：
- **Releases 页面**：https://github.com/weqoocu/obsidian-tag-click-search/releases
- **特定版本**：https://github.com/weqoocu/obsidian-tag-click-search/releases/tag/1.4.3

## ❓ 常见问题

### Q: 如果 Release 创建失败怎么办？

A: 查看 GitHub Actions 日志：
1. 访问 Actions 页面
2. 点击失败的 workflow
3. 查看错误信息
4. 修复后删除 tag 重新推送

### Q: 可以修改已创建的 Release 吗？

A: 可以！在 GitHub Release 页面点击 "Edit" 即可修改。

### Q: 可以创建预发布版本吗？

A: 可以，修改 `.github/workflows/release.yml` 中的 `prerelease: false` 为 `true`，或在 tag 名称中包含 `beta`、`alpha` 等。

## 📚 参考资料

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Obsidian 插件发布指南](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)

---

**🎉 享受自动化的便利吧！**
