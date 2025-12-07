#!/bin/bash

# 手动发布脚本（不需要 GitHub CLI）
# 这个脚本会帮你准备好所有文件和说明

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}📦 准备 Release 文件${NC}"
echo "=================================="

# 获取版本号
VERSION=$(node -p "require('./manifest.json').version" 2>/dev/null || cat manifest.json | grep version | head -1 | awk -F'"' '{print $4}')
echo -e "${GREEN}版本: v${VERSION}${NC}"

# 创建发布目录
RELEASE_DIR="release-${VERSION}"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# 复制必要文件
echo -e "${BLUE}📋 复制文件...${NC}"
cp main.js "$RELEASE_DIR/"
cp manifest.json "$RELEASE_DIR/"

if [ -f "styles.css" ]; then
    cp styles.css "$RELEASE_DIR/"
fi

# 生成 Release Notes
cat > "$RELEASE_DIR/RELEASE_NOTES.md" <<'EOF'
## 🔧 功能优化

### 📝 复制功能优化

#### 1. 使用 title 属性作为标题
- **改进前**：复制笔记时使用文件名（filename）作为标题
- **改进后**：优先使用笔记 frontmatter 中的 `title` 属性作为标题
- **优势**：复制的内容标题更有意义，更符合笔记的实际内容

#### 2. 自动过滤特殊内容
复制时会自动移除以下内容，只保留纯文字：
- ✅ iframe 嵌入内容
- ✅ mactagmap 短代码
- ✅ Obsidian base 引用
- ✅ Markdown 图片
- ✅ Obsidian 图片嵌入
- ✅ 多余空行

#### 3. 智能内容处理
- 过滤后如果笔记内容为空，则不会添加到复制结果中
- 确保复制的内容干净、纯粹，适合直接使用

## 📦 安装方法

### 手动安装
1. 下载 `main.js` 和 `manifest.json`
2. 复制到 `.obsidian/plugins/tag-click-search/` 目录
3. 在 Obsidian 设置中启用插件

### 通过 BRAT
1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 添加此仓库：`weqoocu/obsidian-tag-click-search`

---

查看 [完整更新日志](https://github.com/weqoocu/obsidian-tag-click-search/blob/main/CHANGELOG.md)
EOF

# 创建发布说明文件
cat > "$RELEASE_DIR/HOW_TO_RELEASE.txt" <<EOF
================================
📦 发布 v${VERSION} 的步骤
================================

1. 访问 Release 创建页面:
   https://github.com/weqoocu/obsidian-tag-click-search/releases/new?tag=${VERSION}

2. 填写表单:
   - Tag: ${VERSION} (已自动创建)
   - Release title: v${VERSION} - 复制功能优化：使用title属性，过滤特殊内容
   - Description: 复制 RELEASE_NOTES.md 的内容

3. 上传文件:
   - 拖拽或选择以下文件:
     ✓ main.js
     ✓ manifest.json

4. 点击 "Publish release" 按钮

================================
文件已准备在: ${RELEASE_DIR}/
================================
EOF

echo ""
echo -e "${GREEN}✅ 准备完成！${NC}"
echo ""
echo -e "${YELLOW}📂 文件位置: ${RELEASE_DIR}/${NC}"
echo ""
echo "包含以下文件:"
ls -lh "$RELEASE_DIR/"
echo ""
echo -e "${BLUE}📖 请查看: ${RELEASE_DIR}/HOW_TO_RELEASE.txt${NC}"
echo ""
echo -e "${GREEN}🔗 快速链接:${NC}"
echo "   https://github.com/weqoocu/obsidian-tag-click-search/releases/new?tag=${VERSION}"
echo ""

# 自动打开浏览器 (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "是否打开浏览器创建 Release? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        open "https://github.com/weqoocu/obsidian-tag-click-search/releases/new?tag=${VERSION}"
        open "$RELEASE_DIR"
    fi
fi
