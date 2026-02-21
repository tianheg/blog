export default {
  async fetch(request, env) {
    // 只处理 /api/chat 路径的 POST 请求
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const apiKey = env.MOONSHOT_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "MOONSHOT_API_KEY 环境变量未配置" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "请求体格式错误" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const moonshotResponse = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await moonshotResponse.json();

      return new Response(JSON.stringify(data), {
        status: moonshotResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 其他路径交由静态资源处理（Cloudflare Assets）
    return env.ASSETS.fetch(request);
  },
};
