export async function onRequestGet(context) {
  try {
    // 0. Get API token from environment variables
    const token = context.env.GTS_ACCESS_TOKEN;
    
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
    
    // 3. Parse JSON data
    const data = await response.json();
    
    // 4. Return response with proper headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    // 5. Handle errors
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
