export async function onRequest(context) {
  // Get the value of the 'tasks' key from the KV data store
  const tasks = await context.env.TASKS.get('tasks'); // Fetch the value for the 'tasks' key

  if (!tasks) {
    return new Response(JSON.stringify({ status: "err", msg: "No tasks found" }), {
      headers: { 
        'Content-Type': 'application/json'
      },
      status: 404 // Not Found
    });
  }

  return new Response(tasks, {
    headers: { 
      'Content-Type': 'application/json'
    },
  });
}