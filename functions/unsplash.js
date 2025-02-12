export async function onRequest(context) {
  const { fetch } = context; // Use the fetch from context
  const { UNSPLASH_ACCESS_KEY } = context.env;

  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data?.urls?.regular) {
      throw new Error('Invalid response structure from Unsplash API');
    }
    
    const imageUrl = data.urls.regular;
    return new Response(`<img src="${imageUrl}">`, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error('Full error:', error, 'Response data:', data);
    return new Response(`Error fetching image: ${error.message}`, { 
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
