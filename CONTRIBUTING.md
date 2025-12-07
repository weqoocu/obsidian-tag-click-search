# 贡献指南

## 🚀 发布新版本

### 步骤

1. **更新版本号**

编辑以下三个文件：
```bash
vim manifest.json    # 修改 "version" 字段
vim package.json     # 修改 "version" 字段
vim versions.json    # 添加新版本记录
```

2. **更新 CHANGELOG.md**

记录本次更新的内容。

3. **提交代码**

```bash
git add .
git commit -m "v1.4.3: 新功能描述"
git push origin main
```

4. **创建 Release**

推送 tag 后，GitHub Actions 会自动创建 Release：

```bash
git tag -a "1.4.3" -m "v1.4.3: 新功能描述"
git push origin 1.4.3
```

等待 1-2 分钟，Release 会自动创建完成。

### GitHub Actions

推送 tag 后，GitHub Actions 会自动：
- 创建 GitHub Release
- 上传 `main.js` 和 `manifest.json`
- 生成 Release Notes

## 📝 开发指南

### 项目结构

```
.
├── main.js              # 插件主文件
├── manifest.json        # 插件清单
├── package.json         # 项目配置
├── versions.json        # 版本兼容性
├── README.md           # 用户文档
├── CHANGELOG.md        # 更新日志
├── LICENSE             # 开源许可
└── .github/
    └── workflows/
        └── release.yml  # GitHub Actions 自动发布
```

### 开发流程

1. 修改代码
2. 测试功能
3. 更新版本号（3个文件）
4. 更新 CHANGELOG.md
5. 提交并推送代码
6. 创建 tag 触发自动发布

## 🤝 提交 Pull Request

欢迎提交 PR！请确保：
- [ ] 代码功能正常
- [ ] 通过安全检查
- [ ] 更新了文档
- [ ] 更新了 CHANGELOG.md
