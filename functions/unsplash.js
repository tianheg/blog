export async function onRequest(context) {
  const { fetch } = context; // Use the fetch from context
  const { UNSPLASH_ACCESS_KEY } = context.env;

  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await response.json();
    const imageUrl = data.urls.regular;
    return new Response(`<img src="${imageUrl}">`, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("An error occurred while fetching the image.", { status: 500 });
  }
}
