import { requirePermission, requireUser } from "../../_lib/auth.js";
import { summarizeAnalytics } from "../../_lib/analytics.js";
import { handle, json } from "../../_lib/http.js";

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "analytics");

    const url = new URL(context.request.url);
    const range = Number(url.searchParams.get("range")) === 30 ? 30 : 7;
    const result = await context.env.DB.prepare(
      `SELECT *
       FROM analytics_events
       WHERE created_at >= datetime('now', '-60 days')
       ORDER BY created_at ASC
       LIMIT 20000`
    ).all();

    return json({ ok: true, summary: summarizeAnalytics(result.results || [], { range }) });
  });
}
