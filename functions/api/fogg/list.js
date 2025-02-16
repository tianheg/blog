export async function onRequest(context) {
  try {
    // 1. Fetch tasks from KV store
    const tasks = await context.env.TASKS.get('tasks');
    
    // 2. Handle missing tasks
    if (!tasks) {
      return new Response(JSON.stringify({
        status: "err",
        message: "No tasks found"
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Parse JSON data
    const parsedTasks = JSON.parse(tasks);

    // 4. Configure CORS headers
    const apiHost = new URL(context.request.url).hostname;
    const allowedOrigin = `https://${apiHost}`;
    const requestOrigin = context.request.headers.get('Origin');

    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': 'GET',
      'Vary': 'Origin',
      'Access-Control-Allow-Origin': requestOrigin === allowedOrigin ? allowedOrigin : 'none'
    };

    // 5. Return successful response
    return new Response(JSON.stringify({
      status: "ok",
      data: parsedTasks
    }), { headers: corsHeaders });

  } catch (error) {
    // 6. Handle errors with CORS restrictions
    return new Response(JSON.stringify({
      status: "err",
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'none'
      }
    });
  }
}