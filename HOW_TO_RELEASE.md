# 📦 如何发布新版本

## 🎯 快速开始

### 现在有三种发布方式：

## ✨ 方式一：自动 Release（推荐）⭐

使用 GitHub Actions 自动创建 Release，最简单！

### 步骤：

1. **修改代码并更新版本号**
   ```bash
   # 编辑这三个文件中的版本号：
   # - manifest.json
   # - package.json  
   # - versions.json
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "v1.4.3: 新功能描述"
   git push origin main
   ```

3. **运行自动发布脚本**
   ```bash
   bash release-auto.sh
   ```

4. **等待 1-2 分钟**，GitHub Actions 会自动创建 Release！

查看详细文档：[RELEASE_AUTO.md](./RELEASE_AUTO.md)

---

## 🖥️ 方式二：使用 GitHub CLI

需要先安装 GitHub CLI (`gh`)。

### 安装 GitHub CLI：

**macOS**:
```bash
brew install gh
gh auth login
```

**Linux**:
参考：https://github.com/cli/cli/blob/trunk/docs/install_linux.md

**Windows**:
下载：https://github.com/cli/cli/releases

### 步骤：

1. **修改代码并更新版本号**（同上）

2. **提交代码**（同上）

3. **运行发布脚本**
   ```bash
   bash release.sh
   ```

脚本会自动：
- ✅ 创建 Git tag
- ✅ 推送 tag
- ✅ 创建 GitHub Release
- ✅ 上传 main.js 和 manifest.json

---

## ✋ 方式三：手动发布

不需要安装任何工具，但步骤较多。

### 步骤：

1. **修改代码并更新版本号**（同上）

2. **提交代码**（同上）

3. **运行手动发布脚本**
   ```bash
   bash release-manual.sh
   ```

4. **按照提示操作**
   - 脚本会创建 `release-1.4.3/` 目录
   - 包含所有需要的文件
   - 自动打开浏览器

5. **在 GitHub 上创建 Release**
   - 上传 main.js 和 manifest.json
   - 复制 RELEASE_NOTES.md 的内容
   - 点击 "Publish release"

---

## 📋 版本号更新清单

每次发布前，确保更新这三个文件：

### 1. manifest.json
```json
{
  "version": "1.4.3"
}
```

### 2. package.json
```json
{
  "version": "1.4.3"
}
```

### 3. versions.json
```json
{
  "1.4.3": "0.15.0",
  "1.4.2": "0.15.0",
  ...
}
```

---

## 📝 自定义 Release Notes（可选）

### 创建版本专属的 Release Notes：

```bash
# 创建文件：RELEASE_NOTES_v1.4.3.md
cat > RELEASE_NOTES_v1.4.3.md <<EOF
## 🔧 功能优化

### ✨ 新功能
- 添加了某某功能

### 🐛 Bug 修复  
- 修复了某某问题

## 📦 安装方法
...
EOF
```

如果使用自动 Release，GitHub Actions 会自动使用这个文件。

---

## 🔄 完整工作流示例

```bash
# 1. 开发新功能
vim main.js

# 2. 更新版本号（手动编辑三个文件）
vim manifest.json package.json versions.json

# 3. 提交代码
git add .
git commit -m "v1.4.3: 添加新功能"
git push origin main

# 4. 自动发布（推荐）
bash release-auto.sh

# 等待 1-2 分钟，完成！🎉
```

---

## 🎉 推荐流程

**新手/省事** → 使用 **自动 Release**（方式一）

**已有 gh CLI** → 使用 **GitHub CLI**（方式二）  

**无法安装工具** → 使用 **手动发布**（方式三）

---

## 📚 相关文档

- [自动 Release 详细指南](./RELEASE_AUTO.md)
- [发布指南](./RELEASE_GUIDE.md)
- [更新日志](./CHANGELOG.md)

---

**问题反馈**: https://github.com/weqoocu/obsidian-tag-click-search/issues
