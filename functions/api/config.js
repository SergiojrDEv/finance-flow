export async function onRequest(context) {
  const url = context.env.SUPABASE_URL;
  const anonKey = context.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return new Response(JSON.stringify({ error: "Supabase config is missing." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify({ url, anonKey }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
