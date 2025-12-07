#!/bin/bash

# 完整发布工作流脚本
# 包含：清理 → 检查 → 提交 → 发布

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}   📦 Obsidian 插件完整发布流程${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 步骤 1: 清理不相关文件
echo -e "${BLUE}[步骤 1/4] 清理不相关文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
bash cleanup.sh
echo ""

# 步骤 2: 预发布检查
echo -e "${BLUE}[步骤 2/4] 预发布安全检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if ! bash pre-release-check.sh; then
    echo ""
    echo -e "${RED}❌ 检查未通过，已终止发布${NC}"
    exit 1
fi
echo ""

# 步骤 3: 提交到 GitHub
echo -e "${BLUE}[步骤 3/4] 提交代码到 GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 检查是否有未提交的更改
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}✅ 没有未提交的更改${NC}"
else
    echo -e "${YELLOW}发现未提交的更改：${NC}"
    git status -s
    echo ""
    read -p "是否提交这些更改? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        # 获取版本号
        VERSION=$(node -p "require('./manifest.json').version")
        
        # 默认提交信息
        DEFAULT_MSG="v${VERSION}: Update"
        
        echo ""
        echo -e "${BLUE}请输入提交信息 (回车使用默认):${NC}"
        echo -e "${YELLOW}默认: ${DEFAULT_MSG}${NC}"
        read -p "> " COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="$DEFAULT_MSG"
        fi
        
        git add .
        git commit -m "$COMMIT_MSG"
        
        echo ""
        read -p "是否推送到 GitHub? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git push origin main
            echo -e "${GREEN}✅ 已推送到 GitHub${NC}"
        else
            echo -e "${YELLOW}⚠️  代码已提交但未推送${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  跳过提交${NC}"
    fi
fi
echo ""

# 步骤 4: 自动发布 Release
echo -e "${BLUE}[步骤 4/4] 发布 GitHub Release${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "是否创建 GitHub Release? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    bash release-auto.sh
else
    echo -e "${YELLOW}⚠️  跳过 Release 创建${NC}"
fi

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 发布流程完成！${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
