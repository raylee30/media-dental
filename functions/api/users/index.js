import { audit, publicUser, requirePermission, requireUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { hashPassword, randomId } from "../../_lib/security.js";

const VALID_ROLES = new Set(["admin", "editor", "product_editor"]);

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "users");

    const result = await context.env.DB.prepare(
      "SELECT id, username, email, name, role, active, created_at, updated_at FROM users ORDER BY created_at DESC"
    ).all();

    return json({ ok: true, users: (result.results || []).map(publicUser) });
  });
}

export async function onRequestPost(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "users");

    const body = await readJson(context.request);

    if (!body.username || !body.password || !VALID_ROLES.has(body.role)) {
      return error("Username, role and password are required.", 400);
    }

    const username = String(body.username).trim();
    const email = body.email ? String(body.email).trim() : `${username}@local.admin`;
    const existing = await context.env.DB.prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .bind(username, email)
      .first();

    if (existing) {
      return error("This username already exists.", 409);
    }

    const newUser = {
      id: randomId("usr_"),
      username,
      email,
      name: username,
      role: body.role,
      passwordHash: await hashPassword(String(body.password))
    };

    await context.env.DB.prepare(
      `INSERT INTO users (id, username, email, name, role, password_hash, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(newUser.id, newUser.username, newUser.email, newUser.name, newUser.role, newUser.passwordHash)
      .run();

    await audit(context.env, context.request, user, "create_user", "user", newUser.id, newUser.username);

    return json({
      ok: true,
      user: publicUser({ ...newUser, active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    });
  });
}
