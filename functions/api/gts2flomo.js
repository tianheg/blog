export async function onRequestPost({ request, env }) {
  try {
    const { FLOMO_API_URL: flomoApiUrl, GTS_ID: gtsKv } = env;
    
    // Fetch data from external API
    const apiResponse = await fetch('https://tianheg.co/api/gts');
    if (!apiResponse.ok) throw new Error('Failed to fetch data from GTS API');
    const data = await apiResponse.json();

    // Get existing processed IDs from KV
    const processedUrls = new Set(await gtsKv.list({ prefix: 'url:' }));

    // Filter new items and Re-read posts
    const newItems = data.filter(post => 
      post.text && 
      post.url &&
      !post.text.startsWith('Re-read') &&
      !processedUrls.has(`url:${post.url}`)
    );

    // Process new items
    if (flomoApiUrl && newItems.length > 0) {
      for (const post of newItems) {
        const flomoContent = `#gts\n${post.text}\n${post.url}`;
        await fetch(flomoApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: flomoContent })
        });
        // Store processed URL in KV
        await gtsKv.put(`url:${post.url}`, new Date().toISOString());
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Added ${newItems.length} new items to Flomo`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
