import { audit } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { hashPassword, randomId } from "../../_lib/security.js";

export async function onRequestPost(context) {
  return handle(async () => {
    const { env, request } = context;
    const body = await readJson(request);
    const setupToken = env.ADMIN_SETUP_TOKEN;

    if (!setupToken || body.setupToken !== setupToken) {
      return error("Invalid setup token.", 403);
    }

    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM users").first();
    if (Number(count.total) > 0) {
      return error("Initial administrator already exists.", 409);
    }

    if (!body.username || !body.email || !body.name || !body.password) {
      return error("Username, email, name and password are required.", 400);
    }

    const user = {
      id: randomId("usr_"),
      username: String(body.username).trim(),
      email: String(body.email).trim(),
      name: String(body.name).trim(),
      role: "admin",
      passwordHash: await hashPassword(String(body.password))
    };

    await env.DB.prepare(
      `INSERT INTO users (id, username, email, name, role, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(user.id, user.username, user.email, user.name, user.role, user.passwordHash)
      .run();

    await audit(env, request, user, "create_initial_admin", "user", user.id, `Created ${user.username}`);

    return json({ ok: true, user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role } });
  });
}
