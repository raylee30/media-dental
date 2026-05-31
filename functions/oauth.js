export async function onRequestGet({ env, request }) {
  const clientId = env.OAUTH_GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response("Missing OAUTH_GITHUB_CLIENT_ID", { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = env.OAUTH_REDIRECT_URI || `${url.origin}/oauth/callback`;
  const scope = env.OAUTH_GITHUB_SCOPE || "repo";
  const state = crypto.randomUUID();
  const authUrl = new URL("https://github.com/login/oauth/authorize");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": `decap_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    }
  });
}
