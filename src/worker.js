function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function getSupabaseConfig(env) {
  const url = env?.SUPABASE_URL;
  const anonKey = env?.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/config") {
      const config = getSupabaseConfig(env);
      if (!config) {
        return json({ error: "Supabase config is missing." }, { status: 500 });
      }
      return json(config);
    }

    return env.ASSETS.fetch(request);
  },
};

export { getSupabaseConfig };
