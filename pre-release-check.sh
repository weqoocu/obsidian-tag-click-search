#!/bin/bash

# 预发布检查脚本
# 在发布前进行完整性和安全性检查

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 预发布检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 检查版本号是否一致
echo -e "${BLUE}[1/6] 检查版本号一致性...${NC}"

VERSION_MANIFEST=$(node -p "require('./manifest.json').version" 2>/dev/null)
VERSION_PACKAGE=$(node -p "require('./package.json').version" 2>/dev/null)

if [ "$VERSION_MANIFEST" != "$VERSION_PACKAGE" ]; then
    echo -e "${RED}❌ 错误：版本号不一致${NC}"
    echo -e "   manifest.json: ${VERSION_MANIFEST}"
    echo -e "   package.json:  ${VERSION_PACKAGE}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ 版本号一致: v${VERSION_MANIFEST}${NC}"
fi

# 检查 versions.json 是否包含当前版本
if ! grep -q "\"$VERSION_MANIFEST\"" versions.json; then
    echo -e "${RED}❌ 错误：versions.json 中缺少版本 ${VERSION_MANIFEST}${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ versions.json 已包含当前版本${NC}"
fi

echo ""

# 2. 检查是否有未提交的更改
echo -e "${BLUE}[2/6] 检查 Git 状态...${NC}"

if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  警告：有未提交的更改${NC}"
    git status -s
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ 没有未提交的更改${NC}"
fi

echo ""

# 3. 检查最近的提交是否更新了版本号
echo -e "${BLUE}[3/6] 检查最近提交是否更新版本号...${NC}"

LAST_COMMIT=$(git log -1 --pretty=%B)
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

if echo "$CHANGED_FILES" | grep -q "manifest.json\|package.json\|versions.json"; then
    echo -e "${GREEN}✅ 最近提交已更新版本文件${NC}"
    echo -e "   修改的文件："
    echo "$CHANGED_FILES" | grep "manifest.json\|package.json\|versions.json" | sed 's/^/   - /'
else
    echo -e "${YELLOW}⚠️  警告：最近提交未更新版本文件${NC}"
    echo -e "   最后提交信息: ${LAST_COMMIT}"
    echo -e "   ${YELLOW}建议：如果这是新版本发布，请确保已更新版本号${NC}"
    ((WARNINGS++))
fi

echo ""

# 4. 检查敏感信息
echo -e "${BLUE}[4/6] 扫描敏感信息...${NC}"

SENSITIVE_PATTERNS=(
    "password"
    "passwd"
    "api_key"
    "apikey"
    "secret"
    "token"
    "access_key"
    "private_key"
    "credential"
    "腾讯"
    "tencent"
    "weixin"
    "微信"
    "内部"
)

FOUND_SENSITIVE=false

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    # 搜索 .js 和 .json 文件（排除 node_modules）
    RESULTS=$(grep -rin "$pattern" --include="*.js" --include="*.json" --exclude-dir=node_modules --exclude-dir=release-* . || true)
    
    if [ ! -z "$RESULTS" ]; then
        if [ "$FOUND_SENSITIVE" = false ]; then
            echo -e "${YELLOW}⚠️  发现可能的敏感关键词：${NC}"
            FOUND_SENSITIVE=true
        fi
        echo -e "${YELLOW}   关键词 '${pattern}':${NC}"
        echo "$RESULTS" | head -3 | sed 's/^/     /'
        if [ $(echo "$RESULTS" | wc -l) -gt 3 ]; then
            echo -e "     ${YELLOW}... 还有 $(($(echo "$RESULTS" | wc -l) - 3)) 处${NC}"
        fi
        ((WARNINGS++))
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    echo -e "${GREEN}✅ 未发现明显的敏感信息${NC}"
fi

echo ""

# 5. 检查不相关文件
echo -e "${BLUE}[5/6] 检查不相关文件...${NC}"

UNWANTED_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "*.log"
    "*.tmp"
    "*.swp"
    "*~"
    ".DS_Store"
    "Thumbs.db"
)

FOUND_UNWANTED=false

for pattern in "${UNWANTED_FILES[@]}"; do
    FILES=$(find . -name "$pattern" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/release-*/*" 2>/dev/null || true)
    
    if [ ! -z "$FILES" ]; then
        if [ "$FOUND_UNWANTED" = false ]; then
            echo -e "${YELLOW}⚠️  发现不应提交的文件：${NC}"
            FOUND_UNWANTED=true
        fi
        echo "$FILES" | sed 's/^/   /'
        ((WARNINGS++))
    fi
done

# 检查 release 临时目录
RELEASE_DIRS=$(find . -maxdepth 1 -type d -name "release-*" 2>/dev/null || true)
if [ ! -z "$RELEASE_DIRS" ]; then
    echo -e "${YELLOW}⚠️  发现 release 临时目录：${NC}"
    echo "$RELEASE_DIRS" | sed 's/^/   /'
    echo -e "   ${YELLOW}建议：这些目录应该在 .gitignore 中${NC}"
    ((WARNINGS++))
    FOUND_UNWANTED=true
fi

if [ "$FOUND_UNWANTED" = false ]; then
    echo -e "${GREEN}✅ 未发现不相关文件${NC}"
fi

echo ""

# 6. 检查必需文件
echo -e "${BLUE}[6/6] 检查必需文件...${NC}"

REQUIRED_FILES=(
    "main.js"
    "manifest.json"
    "README.md"
    "LICENSE"
)

ALL_REQUIRED_EXIST=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ 错误：缺少必需文件 ${file}${NC}"
        ((ERRORS++))
        ALL_REQUIRED_EXIST=false
    fi
done

if [ "$ALL_REQUIRED_EXIST" = true ]; then
    echo -e "${GREEN}✅ 所有必需文件都存在${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 显示总结
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 检查通过！可以安全发布${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  检查通过但有 ${WARNINGS} 个警告${NC}"
    echo -e "${YELLOW}建议：检查上述警告后再发布${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    read -p "是否继续发布? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    else
        exit 1
    fi
else
    echo -e "${RED}❌ 检查失败：${ERRORS} 个错误，${WARNINGS} 个警告${NC}"
    echo -e "${RED}必须修复所有错误后才能发布${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
