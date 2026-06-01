import { requirePermission, requireUser } from "../_lib/auth.js";
import { handle, json } from "../_lib/http.js";

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "logs");

    const result = await context.env.DB.prepare(
      `SELECT id, username, action, target_type, target_id, details, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 80`
    ).all();

    return json({ ok: true, logs: result.results || [] });
  });
}
