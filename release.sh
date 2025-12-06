#!/bin/bash

# Obsidian Plugin Release Script
# 自动化发布 GitHub Release

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Obsidian Plugin Release Script${NC}"
echo "=================================="

# 检查是否安装了 gh (GitHub CLI)
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
    echo ""
    echo "请先安装 GitHub CLI:"
    echo "  macOS:   brew install gh"
    echo "  Linux:   https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  Windows: https://github.com/cli/cli/releases"
    echo ""
    echo "安装后运行: gh auth login"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  请先登录 GitHub CLI${NC}"
    gh auth login
fi

# 获取当前版本号
VERSION=$(node -p "require('./manifest.json').version")
echo -e "${GREEN}📦 当前版本: v${VERSION}${NC}"

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ 有未提交的更改，请先提交${NC}"
    git status -s
    exit 1
fi

# 检查 tag 是否已存在
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag ${VERSION} 已存在${NC}"
    read -p "是否删除并重新创建? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$VERSION"
        git push origin ":refs/tags/$VERSION" 2>/dev/null || true
        echo -e "${GREEN}✅ 已删除旧 tag${NC}"
    else
        echo -e "${YELLOW}❌ 已取消${NC}"
        exit 1
    fi
fi

# 生成 Release Notes
echo -e "${GREEN}📝 生成 Release Notes...${NC}"
RELEASE_NOTES=$(cat <<EOF
## 🔧 改进

### 📱 移动端返回按钮位置优化
- **返回按钮从顶部移至底部**
  - 更符合移动端操作习惯
  - 减少手指移动距离
  - 底部固定（sticky），便于快速点击

### 🎨 界面优化
- 增大按钮尺寸和内边距（14px）
- 添加阴影效果，提升视觉层次
- 更圆润的按钮圆角（8px）

## 📦 安装方法

### 手动安装
1. 下载下方的 \`main.js\` 和 \`manifest.json\`
2. 复制到 \`.obsidian/plugins/tag-click-search/\` 目录
3. 在 Obsidian 设置中启用插件

### 通过 BRAT
1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 添加此仓库：\`weqoocu/obsidian-tag-click-search\`

---

查看 [完整更新日志](https://github.com/weqoocu/obsidian-tag-click-search/blob/main/CHANGELOG.md)
EOF
)

# 创建并推送 tag
echo -e "${GREEN}🏷️  创建 Git tag...${NC}"
git tag -a "$VERSION" -m "v${VERSION}: 移动端返回按钮移至底部，优化操作体验"
git push origin "$VERSION"
echo -e "${GREEN}✅ Tag 已推送${NC}"

# 创建 GitHub Release
echo -e "${GREEN}🚀 创建 GitHub Release...${NC}"
gh release create "$VERSION" \
    --title "v${VERSION} - 移动端返回按钮位置优化" \
    --notes "$RELEASE_NOTES" \
    main.js \
    manifest.json

echo ""
echo -e "${GREEN}✅ Release 发布成功！${NC}"
echo -e "${GREEN}🔗 查看: https://github.com/weqoocu/obsidian-tag-click-search/releases/tag/${VERSION}${NC}"
