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

function getMissingSupabaseConfigKeys(env) {
  return [
    ["SUPABASE_URL", env?.SUPABASE_URL],
    ["SUPABASE_ANON_KEY", env?.SUPABASE_ANON_KEY],
  ].filter(([, value]) => !value).map(([key]) => key);
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/config") {
      const config = getSupabaseConfig(env);
      if (!config) {
        return json({
          error: "Supabase config is missing.",
          missing: getMissingSupabaseConfigKeys(env),
        }, { status: 500 });
      }
      return json(config);
    }

    return env.ASSETS.fetch(request);
  },
};

export { getMissingSupabaseConfigKeys, getSupabaseConfig };
