import { audit, publicUser, requirePermission, requireUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { hashPassword } from "../../_lib/security.js";

const VALID_ROLES = new Set(["admin", "editor", "product_editor"]);

export async function onRequestPatch(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "users");

    const targetId = context.params.id;
    const body = await readJson(context.request);
    const current = await context.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(targetId).first();

    if (!current) {
      return error("User not found.", 404);
    }

    if (body.role && !VALID_ROLES.has(body.role)) {
      return error("Invalid user role.", 400);
    }

    const next = {
      name: body.name === undefined ? current.name : String(body.name).trim(),
      email: body.email === undefined ? current.email : String(body.email).trim(),
      role: body.role || current.role,
      active: body.active === undefined ? current.active : body.active ? 1 : 0
    };

    if (targetId === user.id && !next.active) {
      return error("You cannot disable your own account.", 400);
    }

    if (body.password) {
      await context.env.DB.prepare(
        `UPDATE users
         SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
        .bind(next.name, next.email, next.role, next.active, await hashPassword(String(body.password)), targetId)
        .run();
      if (targetId === user.id) {
        await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?")
          .bind(targetId, user.session_id)
          .run();
      } else {
        await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(targetId).run();
      }
    } else {
      await context.env.DB.prepare(
        "UPDATE users SET name = ?, email = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
        .bind(next.name, next.email, next.role, next.active, targetId)
        .run();
    }

    const updated = await context.env.DB.prepare(
      "SELECT id, username, email, name, role, active, created_at, updated_at FROM users WHERE id = ?"
    )
      .bind(targetId)
      .first();

    await audit(context.env, context.request, user, "update_user", "user", targetId, current.username);

    return json({ ok: true, user: publicUser(updated) });
  });
}

export async function onRequestDelete(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "users");

    const targetId = context.params.id;
    const current = await context.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(targetId).first();

    if (!current) {
      return error("User not found.", 404);
    }

    if (targetId === user.id) {
      return error("You cannot delete your own account.", 400);
    }

    await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(targetId).run();
    await context.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(targetId).run();
    await audit(context.env, context.request, user, "delete_user", "user", targetId, current.username);

    return json({ ok: true });
  });
}
