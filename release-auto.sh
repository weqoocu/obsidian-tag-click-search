#!/bin/bash

# 自动发布脚本 - 使用 GitHub Actions
# 这个脚本会创建并推送 tag，触发自动 release

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 自动发布 Obsidian 插件${NC}"
echo "=================================="

# 运行预发布检查
echo -e "${BLUE}🔍 运行预发布检查...${NC}"
echo ""

if bash pre-release-check.sh; then
    echo ""
    echo -e "${GREEN}✅ 预发布检查通过${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ 预发布检查未通过，已取消发布${NC}"
    exit 1
fi

# 获取当前版本号
VERSION=$(node -p "require('./manifest.json').version")
echo -e "${GREEN}📦 当前版本: v${VERSION}${NC}"

# 检查是否在 main 分支
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  当前不在 main 分支 (当前: $BRANCH)${NC}"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
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

# 确认发布
echo ""
echo -e "${BLUE}准备发布 v${VERSION}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "确认发布? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 获取 commit 信息用于 tag message
echo ""
echo -e "${BLUE}请输入此版本的简短描述 (回车使用默认):${NC}"
read -p "> " TAG_MESSAGE

if [ -z "$TAG_MESSAGE" ]; then
    TAG_MESSAGE="v${VERSION}: Release"
fi

# 创建 tag
echo -e "${GREEN}🏷️  创建 Git tag...${NC}"
git tag -a "$VERSION" -m "$TAG_MESSAGE"

# 推送 tag (这会触发 GitHub Actions)
echo -e "${GREEN}🚀 推送 tag 到 GitHub...${NC}"
git push origin "$VERSION"

echo ""
echo -e "${GREEN}✅ Tag 已推送！${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 自动 Release 流程已启动！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 GitHub Actions 正在自动创建 Release...${NC}"
echo ""
echo -e "🔗 查看 Actions 进度:"
echo -e "   ${BLUE}https://github.com/weqoocu/obsidian-tag-click-search/actions${NC}"
echo ""
echo -e "🔗 稍后查看 Release:"
echo -e "   ${BLUE}https://github.com/weqoocu/obsidian-tag-click-search/releases/tag/${VERSION}${NC}"
echo ""
echo -e "${GREEN}💡 提示：${NC}Release 通常在 1-2 分钟内完成"
echo ""
