import { audit, createSession, publicUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { verifyPassword } from "../../_lib/security.js";

export async function onRequestPost(context) {
  return handle(async () => {
    const { env, request } = context;
    const { username, password } = await readJson(request);

    if (!username || !password) {
      return error("Username and password are required.", 400);
    }

    const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? OR email = ?")
      .bind(String(username).trim(), String(username).trim())
      .first();

    if (!user || !user.active || !(await verifyPassword(String(password), user.password_hash))) {
      return error("Incorrect username or password.", 401);
    }

    const session = await createSession(env, user.id);
    await audit(env, request, user, "login", "account", user.id);

    return json(
      {
        ok: true,
        user: publicUser(user)
      },
      {
        headers: {
          "Set-Cookie": session.cookie
        }
      }
    );
  });
}
