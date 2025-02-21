export async function onRequestGet(context) {
  try {
    // 0. Get API tokens from environment variables
    const token = context.env.GTS_ACCESS_TOKEN;
    const flomoApiUrl = context.env.FLOMO_API_URL;
    
    // 1. Fetch from external API with auth header
    const response = await fetch('https://social.tianheg.co/api/v1/accounts/01J6578X3CGB280NRDH89ZEH3A/statuses?exclude_replies=true&exclude_reblogs=true', {
      headers: {
        'User-Agent': 'Cloudflare-Worker',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 2. Check if response is OK
    if (!response.ok) {
      return new Response('API request failed', { status: response.status });
    }
    
    // 3. Parse JSON data and filter fields
    const data = await response.json();
    const filteredData = data.map(post => ({
      created_at: post.created_at,
      url: post.url,
      text: post.text
    }));
    
    // NEW: Post to Flomo for each status
    if (flomoApiUrl && flomoToken) {
      for (const post of filteredData) {
        const flomoContent = `#gts\n${post.text}\n${post.url}`;
        await fetch(flomoApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: flomoContent })
        });
      }
    }
    
    // 4. Derive allowed origin from request host
    const apiHost = new URL(context.request.url).hostname;
    const allowedOrigin = `https://${apiHost}`;
    const requestOrigin = context.request.headers.get('Origin');
    
    // 5. Validate origin and set headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': 'GET',
      'Vary': 'Origin',
      'Access-Control-Allow-Origin': requestOrigin === allowedOrigin ? allowedOrigin : 'none'
    };
    
    return new Response(JSON.stringify(filteredData), { headers: corsHeaders });
    
  } catch (error) {
    // 6. Handle errors with CORS restrictions
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'none'
      }
    });
  }
}
