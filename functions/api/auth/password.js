import { audit, requireUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { hashPassword, verifyPassword } from "../../_lib/security.js";

export async function onRequestPost(context) {
  return handle(async () => {
    const user = await requireUser(context);
    const { currentPassword, newPassword } = await readJson(context.request);

    if (!currentPassword || !newPassword || String(newPassword).length < 8) {
      return error("Current password and a new password of at least 8 characters are required.", 400);
    }

    if (!(await verifyPassword(String(currentPassword), user.password_hash))) {
      return error("Current password is incorrect.", 401);
    }

    await context.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(await hashPassword(String(newPassword)), user.id)
      .run();

    await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?")
      .bind(user.id, user.session_id)
      .run();

    await audit(context.env, context.request, user, "change_password", "account", user.id);

    return json({ ok: true });
  });
}
