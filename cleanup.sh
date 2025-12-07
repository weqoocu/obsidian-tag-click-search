#!/bin/bash

# 清理不相关文件脚本
# 删除不应该提交到 git 的临时文件和目录

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🧹 清理不相关文件${NC}"
echo "=================================="

CLEANED=0

# 1. 清理 release 临时目录
echo -e "${YELLOW}清理 release 临时目录...${NC}"
if ls -d release-* >/dev/null 2>&1; then
    for dir in release-*; do
        if [ -d "$dir" ]; then
            echo "  删除: $dir"
            rm -rf "$dir"
            ((CLEANED++))
        fi
    done
else
    echo "  没有 release 临时目录"
fi

# 2. 清理临时的 release notes
echo -e "${YELLOW}清理临时 release notes...${NC}"
if ls RELEASE_NOTES_v*.md >/dev/null 2>&1; then
    for file in RELEASE_NOTES_v*.md; do
        if [ -f "$file" ]; then
            echo "  删除: $file"
            rm -f "$file"
            ((CLEANED++))
        fi
    done
else
    echo "  没有临时 release notes"
fi

# 3. 清理 macOS 系统文件
echo -e "${YELLOW}清理系统文件...${NC}"
if find . -name ".DS_Store" -not -path "*/node_modules/*" | grep -q .; then
    find . -name ".DS_Store" -not -path "*/node_modules/*" -delete
    echo "  删除: .DS_Store 文件"
    ((CLEANED++))
else
    echo "  没有 .DS_Store 文件"
fi

# 4. 清理日志文件
echo -e "${YELLOW}清理日志文件...${NC}"
if ls *.log >/dev/null 2>&1; then
    for file in *.log; do
        if [ -f "$file" ]; then
            echo "  删除: $file"
            rm -f "$file"
            ((CLEANED++))
        fi
    done
else
    echo "  没有日志文件"
fi

# 5. 清理临时文件
echo -e "${YELLOW}清理临时文件...${NC}"
TEMP_PATTERNS=("*.tmp" "*.swp" "*~")
FOUND_TEMP=false

for pattern in "${TEMP_PATTERNS[@]}"; do
    if ls $pattern >/dev/null 2>&1; then
        for file in $pattern; do
            if [ -f "$file" ]; then
                echo "  删除: $file"
                rm -f "$file"
                ((CLEANED++))
                FOUND_TEMP=true
            fi
        done
    fi
done

if [ "$FOUND_TEMP" = false ]; then
    echo "  没有临时文件"
fi

echo ""
echo -e "${GREEN}✅ 清理完成！删除了 ${CLEANED} 个文件/目录${NC}"

# 显示 git 状态
if [[ -n $(git status -s) ]]; then
    echo ""
    echo -e "${YELLOW}当前 Git 状态：${NC}"
    git status -s
fi
