import { audit, clearSessionCookie, getSessionUser, SESSION_COOKIE } from "../../_lib/auth.js";
import { getCookie, handle, json } from "../../_lib/http.js";
import { sha256 } from "../../_lib/security.js";

export async function onRequestPost(context) {
  return handle(async () => {
    const { env, request } = context;
    const user = await getSessionUser(env, request);
    const token = getCookie(request, SESSION_COOKIE);

    if (token) {
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
    }

    if (user) {
      await audit(env, request, user, "logout", "account", user.id);
    }

    return json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": clearSessionCookie()
        }
      }
    );
  });
}
