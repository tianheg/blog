#!/bin/bash
# TIL 质量控制脚本
# 基于 SKILL_TIL_编写规范.md

TIL_DIR="content/til"
ERRORS=0

echo "=== TIL 质量检查 ==="
echo ""

# 1. 检查临时文件
echo "检查临时文件 (*.org~)..."
TEMP_FILES=$(find $TIL_DIR -name "*.org~" -type f 2>/dev/null)
if [ -n "$TEMP_FILES" ]; then
    echo "❌ 发现临时文件:"
    echo "$TEMP_FILES" | while read file; do
        echo "   - $file"
    done
    ERRORS=$((ERRORS + $(echo "$TEMP_FILES" | wc -l)))
else
    echo "✅ 无临时文件"
fi
echo ""

# 2. 检查 Org 标题
echo "检查 Org 标题 (* 标题)..."
find $TIL_DIR -name "*.org" -not -name "_index.org" -not -name "TODO" | while read file; do
    if ! grep -q "^\* " "$file"; then
        echo "❌ 缺少 * 标题: $file"
    fi
done
echo ""

# 3. 统计 TIL 分布
echo "=== TIL 统计 ==="
echo ""

# 按目录统计
echo "按目录分布:"
find $TIL_DIR -mindepth 1 -type d | while read dir; do
    count=$(find "$dir" -name "*.org" -not -name "_index.org" | wc -l)
    dir_name=$(basename "$dir")
    if [ $count -gt 0 ]; then
        echo "  $dir_name: $count"
    fi
done

echo ""
echo "总计: $(find $TIL_DIR -name "*.org" -not -name "_index.org" | wc -l) 个 TIL"

# 4. 检查空文件
echo ""
echo "检查空文件..."
find $TIL_DIR -name "*.org" -size 0 | while read file; do
    echo "⚠️  空文件: $file"
done

echo ""
echo "=== 检查完成 ==="
exit $ERRORS