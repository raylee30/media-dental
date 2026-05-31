function readCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));

  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

function authResponse(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  return new Response(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>GitHub Authorization</title></head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        function receiveMessage(event) {
          if (event.data === "authorizing:github" && window.opener) {
            window.opener.postMessage(message, event.origin);
          }
        }
        window.addEventListener("message", receiveMessage, false);
        if (window.opener) {
          window.opener.postMessage("authorizing:github", "*");
        }
      })();
    </script>
  </body>
</html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "decap_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    }
  });
}

export async function onRequestGet({ env, request }) {
  const clientId = env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return authResponse("error", { error: "Missing GitHub OAuth environment variables." });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = readCookie(request, "decap_oauth_state");

  if (!code || !state || state !== cookieState) {
    return authResponse("error", { error: "Invalid GitHub OAuth response." });
  }

  const redirectUri = env.OAUTH_REDIRECT_URI || `${url.origin}/oauth/callback`;
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      state
    })
  });
  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return authResponse("error", { error: tokenData.error_description || "GitHub token request failed." });
  }

  return authResponse("success", { token: tokenData.access_token, provider: "github" });
}
