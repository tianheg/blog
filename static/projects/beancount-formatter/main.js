// 显示状态消息
function showStatus(message, isError = false) {
	const statusEl = document.getElementById("statusMessage");
	statusEl.textContent = message;
	statusEl.className =
		"status-message " + (isError ? "status-error" : "status-success");
	statusEl.style.display = "block";

	setTimeout(() => {
		statusEl.style.display = "none";
	}, 5000);
}

// 复制到剪贴板
async function copyOutput() {
    const output = document.getElementById("beancountOutput");
    const outputText = output.value;
    
    try {
        // 优先使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(outputText);
            showStatus("已复制到剪贴板！");
        } else {
            // 降级方案：使用传统方法
            output.select();
            document.execCommand("copy");
            showStatus("已复制到剪贴板！");
            // 取消选择状态
            window.getSelection().removeAllRanges();
        }
    } catch (err) {
        console.error('复制失败:', err);
        showStatus("复制失败，请手动复制", true);
    }
}

// 本地的 parseTransaction 函数已移除：现在仅使用 AI（LLM）来生成 Beancount 输出

// 生成Beancount格式
async function generateBeancount() {
	const input = document.getElementById("userInput").value.trim();
	const outputEl = document.getElementById("beancountOutput");
	const generateBtn = document.querySelector(".generate-btn");

	if (!input) {
		showStatus("请输入记账信息", true);
		return;
	}

	// 显示加载状态
	generateBtn.disabled = true;
	generateBtn.innerHTML = '生成中<span class="loading"></span>';

	try {
		const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "moonshot-v1-8k",
					messages: [
						{
							role: "system",
							content: `你是一个专业的Beancount格式转换助手。你需要将用户的自然语言记账信息转换为标准的Beancount格式。你需要从用户的描述中正确识别日期。

重要约束（必须遵守）：
1) 严禁随机或自行创造新的账户名称。只能使用由网页提供的账户或下列标准支出分类：Expenses:Food, Expenses:Transport, Expenses:Housing, Expenses:Clothing。
2) 可用的资产/负债/收入账户将通过用户设置提供——不要替换或改写这些账户名。注意：现金账户已移除，禁止在输出中使用任何现金类账户。
    银行账户用于记录存款/收入，信用卡账户用于大多数支付/支出场景。若描述中没有明确支付方式，请优先使用信用卡作为支付账户，银行用于收入/存款记录（默认账户设置：银行/信用卡/默认支出/默认收入）。
3) 输出必须严格为Beancount条目，不要包含任何额外的解释、建议或注释。

描述（引号内）要求：
1) 描述中不得包含任何金额、数字或币种符号（例如 $、USD、CNY、元 等）。当涉及金额或币种时，请仅在账户金额字段中显示，不要在描述中重复。
2) 描述应简洁地说明交易的行为或用途：
   - 交通类：使用行为描述，如 "乘坐地铁"、"乘公交" 而不是 "地铁7元"
   - 餐饮类：使用 "午饭"、"晚餐" 等，而不是 "午饭25元"
   - 购物类：使用 "购买衣服"、"买咖啡" 等，而不是 "衣服300元"

货币识别说明：当文本中出现美元符号 "$" 或货币代码 "USD" 时，请将其识别为 USD。支持的金额格式示例：$12.34、12.34 USD、USD 12.34、以及中文的 12.34元（或 CNY）。

格式要求：
- 第一行: YYYY-MM-DD * "描述"
- 接下来两行分别为账户和金额，每行以两个空格开头，金额带币种（例如 25.00 CNY）。借贷平衡（两个金额数值相等，符号相反）。

日期处理规则：
- 使用东八区（UTC+8）时间
- 如果提到"昨天"，使用当前日期减去1天
- 如果提到"前天"，使用当前日期减去2天
- 如果提到具体日期（如"9月1日"），使用今年的对应日期
- 如果没有提到日期，使用当前日期

示例输出格式：
2025-09-21 * "晚饭"
  Expenses:Food            25.00 CNY
  Assets:Bank:Checking    -25.00 CNY
`,
						},
						{
							role: "user",
							content: `今天是 ${new Date(Date.now() + (8 * 3600 * 1000)).toISOString().split("T")[0]}。下面是允许使用的账户/分类（仅允许使用这些名称）：\n银行账户: ${document.getElementById("bankAccount").value}\n信用卡账户: ${document.getElementById("creditCardAccount").value}\n默认支出账户: ${document.getElementById("expenseAccount").value}\n默认收入账户: ${document.getElementById("incomeAccount").value}\n可用支出分类: Expenses:Food, Expenses:Transport, Expenses:Housing, Expenses:Clothing\n\n记账信息: ${input}\n\n请只输出Beancount格式的记账内容，且只能使用上述允许的账户或由网页设置提供的账户。`,
						},
					],
				}),
		});
		if (!response.ok) throw new Error("API请求失败");
		const data = await response.json();
		// 假设返回格式如下：data.choices[0].message.content
		let llmOutput = data.choices[0].message.content;

		// --- 输出校验与替换逻辑 ---
		const settings = {
			bank: document.getElementById("bankAccount").value,
			credit: document.getElementById("creditCardAccount").value,
			expense: document.getElementById("expenseAccount").value,
			income: document.getElementById("incomeAccount").value,
		};

		// 允许的账户与分类（必须与system提示保持一致）
		const allowedAccounts = new Set([
			settings.bank,
			settings.credit,
			settings.expense,
			settings.income,
			"Expenses:Food",
			"Expenses:Transport",
			"Expenses:Housing",
			"Expenses:Clothing",
		]);

		// 简单正则查找输出中的账户名（形如以大写字母开头并包含:的账户）
		const accountRegex = /([A-Za-z]+(?::[A-Za-z]+)+)/g;
		const foundAccounts = llmOutput.match(accountRegex) || [];
		let replaced = false;

		foundAccounts.forEach((acc) => {
			if (!allowedAccounts.has(acc)) {
				// 如果是支出类账户（包含 Expenses），则替换为默认支出，否则替换为信用卡（主要使用信用卡支付）
				const replacement = acc.startsWith("Expenses")
					? settings.expense
					: settings.credit;
				const safeAcc = acc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // 转义
				const accRe = new RegExp("\\b" + safeAcc + "\\b", "g");
				llmOutput = llmOutput.replace(accRe, replacement);
				replaced = true;
			}
		});

		if (replaced) {
			showStatus("生成成功（已对不允许的账户进行了替换）");
		} else {
			showStatus("生成成功！");
		}

		// 额外后处理：确保描述（引号内）不包含任何金额或货币符号
		let descriptionReplaced = false;
		// 匹配第一行中的描述：引号内内容
		const descLineMatch = llmOutput.match(/^.*\*\s*"([^"]*)"/m);
		if (descLineMatch?.[1]) {
			const originalDesc = descLineMatch[1];
			// 删除金额与货币的常见写法，例如 $12.34、12.34元、12.34 USD、USD 12.34、裸数字等
			const cleanedDesc = originalDesc
				.replace(
					/\$\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:元|CNY|USD)|USD\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?/gi,
					"",
				)
				.trim();
			if (cleanedDesc !== originalDesc) {
				descriptionReplaced = true;
				// 在原输出中替换描述
				const escapedOriginal = originalDesc.replace(
					/[.*+?^${}()|[\]\\]/g,
					"\\$&",
				);
				const descRe = new RegExp('"' + escapedOriginal + '"', "");
				llmOutput = llmOutput.replace(descRe, '"' + cleanedDesc + '"');
			}
		}

		if (replaced && descriptionReplaced) {
			showStatus("生成成功（已对不允许的账户进行了替换；描述中的金额已移除）");
		} else if (descriptionReplaced) {
			showStatus("生成成功（描述中的金额已移除）");
		}

		// 标准化缩进：每个交易的第一行（日期行）不缩进，账户行缩进两个空格
		const lines = llmOutput.split("\n");
		if (lines.length > 1) {
			const processedLines = [];
			let inTransaction = false;
			
			for (const line of lines) {
				if (line.trim() === "") {
					processedLines.push("");
					continue;
				}
				
				// 检测是否是交易的第一行（包含日期和*）
				if (line.match(/^\d{4}-\d{2}-\d{2}\s+\*/)) {
					// 交易第一行，不缩进
					processedLines.push(line.trimStart());
					inTransaction = true;
				} else if (inTransaction) {
					// 交易内的账户行，缩进两个空格
					processedLines.push("  " + line.replace(/^\s+/, "").trimStart());
				} else {
					// 其他情况，保持原样
					processedLines.push(line);
				}
			}
			
			llmOutput = processedLines.join("\n");
		}

		outputEl.value = llmOutput;
	} catch (error) {
		showStatus("生成失败：" + error.message, true);
		outputEl.value = "";
	} finally {
		generateBtn.disabled = false;
		generateBtn.innerHTML = "生成Beancount格式";
	}
}

// 回车键触发生成
document.getElementById("userInput").addEventListener("keypress", (e) => {
	if (e.key === "Enter" && e.ctrlKey) {
		generateBeancount();
	}
});

// 保存设置到本地存储
document
	.querySelectorAll(".setting-group input, .setting-group select")
	.forEach((element) => {
		element.addEventListener("change", function () {
			localStorage.setItem(this.id, this.value);
		});

		// 加载保存的设置
		const savedValue = localStorage.getItem(element.id);
		if (savedValue) {
			element.value = savedValue;
		}
	});