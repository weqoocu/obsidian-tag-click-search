# 📦 完整发布指南

## 🚀 一键发布（推荐）

使用完整的发布工作流脚本，自动完成所有步骤：

```bash
bash publish.sh
```

这个脚本会自动：
1. ✅ 清理不相关文件
2. ✅ 安全检查（版本号、敏感信息等）
3. ✅ 提交代码到 GitHub
4. ✅ 创建 GitHub Release

---

## 📋 详细步骤

### 步骤 1: 更新版本号

编辑以下三个文件，将版本号从 `1.4.2` 改为新版本（如 `1.4.3`）：

```bash
# 编辑这三个文件
vim manifest.json    # 修改 "version" 字段
vim package.json     # 修改 "version" 字段
vim versions.json    # 添加新版本记录
```

### 步骤 2: 使用一键发布

```bash
bash publish.sh
```

脚本会引导你完成整个流程，包括：
- 自动清理临时文件
- 检查版本号一致性
- 扫描敏感信息
- 提交并推送代码
- 创建 GitHub Release

---

## 🛠️ 独立工具脚本

如果你想分步执行，可以使用以下独立脚本：

### 1️⃣ 清理不相关文件

```bash
bash cleanup.sh
```

自动删除：
- Release 临时目录（`release-*`）
- 临时 release notes（`RELEASE_NOTES_v*.md`）
- 系统文件（`.DS_Store`）
- 日志文件（`*.log`）

### 2️⃣ 预发布检查

```bash
bash pre-release-check.sh
```

检查内容：
- ✅ 版本号一致性（manifest.json, package.json, versions.json）
- ✅ Git 状态（是否有未提交的更改）
- ✅ 版本号是否已更新
- ✅ 扫描敏感信息（密码、token、内部信息等）
- ✅ 检查不相关文件
- ✅ 检查必需文件

### 3️⃣ 自动发布 Release

```bash
bash release-auto.sh
```

自动执行：
- 创建 Git tag
- 推送 tag 到 GitHub
- 触发 GitHub Actions
- 自动创建 Release

---

## 🔍 安全检查说明

### 检查的敏感关键词：

- `password`, `passwd`
- `api_key`, `apikey`
- `secret`, `token`
- `access_key`, `private_key`
- `credential`
- `腾讯`, `tencent`
- `weixin`, `微信`
- `内部`

### 检查的不相关文件：

- `.env`, `.env.local`, `.env.production`
- `*.log`, `*.tmp`, `*.swp`
- `.DS_Store`, `Thumbs.db`
- `release-*/` 目录
- `RELEASE_NOTES_v*.md` 临时文件

---

## 📝 发布前检查清单

手动检查：

- [ ] 代码功能测试通过
- [ ] 版本号已更新（3个文件）
- [ ] CHANGELOG.md 已更新
- [ ] 没有敏感信息
- [ ] 没有临时文件
- [ ] README 准确描述功能

---

## ⚡ 快速命令参考

```bash
# 完整发布流程（推荐）
bash publish.sh

# 仅清理文件
bash cleanup.sh

# 仅检查（不发布）
bash pre-release-check.sh

# 仅发布 Release
bash release-auto.sh
```

---

## 🔧 GitHub Actions 自动化

当你推送 tag 时，GitHub Actions 会自动：

1. 检出代码
2. 读取版本信息
3. 生成 Release Notes
4. 创建 GitHub Release
5. 上传 `main.js` 和 `manifest.json`

查看 Actions 进度：
https://github.com/weqoocu/obsidian-tag-click-search/actions

---

## ❓ 常见问题

### Q: 如果预发布检查失败怎么办？

A: 根据错误信息修复问题：
- **版本号不一致**：检查并更新三个文件中的版本号
- **发现敏感信息**：检查并删除敏感内容
- **有未提交的更改**：先提交或丢弃更改

### Q: 可以跳过某些检查吗？

A: 不建议。所有检查都是为了确保发布安全和规范。

### Q: Release 创建失败怎么办？

A: 
1. 查看 GitHub Actions 日志
2. 删除失败的 tag：`git tag -d 1.4.3 && git push origin :refs/tags/1.4.3`
3. 修复问题后重新发布

---

## 📚 相关文档

- [自动 Release 指南](./RELEASE_AUTO.md)
- [如何发布](./HOW_TO_RELEASE.md)
- [发布指南](./RELEASE_GUIDE.md)
- [更新日志](./CHANGELOG.md)

---

**🎉 祝你发布顺利！**
