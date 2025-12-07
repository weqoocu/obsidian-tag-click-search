# 贡献指南

## 🚀 发布新版本

### 快速发布

```bash
# 1. 更新版本号（编辑这3个文件）
vim manifest.json    # 修改 "version"
vim package.json     # 修改 "version"
vim versions.json    # 添加新版本

# 2. 一键发布
bash publish.sh
```

### 发布流程说明

`publish.sh` 会自动完成：
1. ✅ 清理临时文件（`cleanup.sh`）
2. ✅ 安全检查（`pre-release-check.sh`）
   - 检查版本号一致性
   - 扫描敏感信息
   - 检查不相关文件
3. ✅ 提交到 GitHub
4. ✅ 创建 Release（通过 GitHub Actions）

### 安全检查

预发布检查会扫描：
- 🔒 敏感信息：password, token, api_key, secret 等
- 🗑️ 临时文件：.env, .log, .DS_Store 等
- ✅ 版本号一致性

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
├── publish.sh          # 一键发布脚本
├── cleanup.sh          # 清理脚本
├── pre-release-check.sh # 安全检查脚本
└── .github/
    └── workflows/
        └── release.yml  # 自动 Release
```

### 开发流程

1. 修改代码
2. 测试功能
3. 更新版本号
4. 更新 CHANGELOG.md
5. 运行 `bash publish.sh`

## 🤝 提交 Pull Request

欢迎提交 PR！请确保：
- [ ] 代码功能正常
- [ ] 通过安全检查
- [ ] 更新了文档
- [ ] 更新了 CHANGELOG.md
