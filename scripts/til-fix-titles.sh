#!/bin/bash
# 修复缺少 * 标题的 TIL 文件

declare -A TITLE_MAP=(
    ["content/til/life/money.org"]="理财观念"
    ["content/til/life/great-words.org"]="名言警句"
    ["content/til/life/pos.org"]="POS 机知识"
    ["content/til/life/shebao.org"]="社保知识"
    ["content/til/life/zufang.org"]="租房经验"
    ["content/til/misc/talk-about-independent-thinking.org"]="论独立思考"
    ["content/til/misc/find-product-ideas.org"]="产品创意发现"
    ["content/til/misc/react-instantsearch.org"]="React InstantSearch"
    ["content/til/software/others.org"]="其他软件工具"
    ["content/til/software/ai.org"]="AI 学习资料"
    ["content/til/software/how-to.org"]="如何做事"
    ["content/til/software/bind-command.org"]="bind 命令"
    ["content/til/software/reactjs.org"]="React.js"
    ["content/til/software/linux-driver.org"]="Linux 驱动"
)

for file in "${!TITLE_MAP[@]}"; do
    if [ -f "$file" ]; then
        title="${TITLE_MAP[$file]}"
        # 检查是否已有 * 标题
        if ! grep -q "^\* " "$file"; then
            # 在第一行前添加标题
            temp_file="${file}.tmp"
            echo "* $title" > "$temp_file"
            echo "" >> "$temp_file"
            cat "$file" >> "$temp_file"
            mv "$temp_file" "$file"
            echo "✅ 已修复: $file -> * $title"
        else
            echo "ℹ️  已有标题: $file"
        fi
    else
        echo "❌ 文件不存在: $file"
    fi
done

echo ""
echo "修复完成！"