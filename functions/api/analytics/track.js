import { normalizeAnalyticsEvent } from "../../_lib/analytics.js";
import { clientIp, handle, json, readJson } from "../../_lib/http.js";
import { randomId } from "../../_lib/security.js";

export async function saveAnalyticsEvent(context, body) {
  const event = normalizeAnalyticsEvent(body, {
    id: randomId("evt_"),
    ip: clientIp(context.request),
    userAgent: context.request.headers.get("User-Agent") || "",
    country: context.request.cf?.country || "Unknown"
  });

  await context.env.DB.prepare(
    `INSERT INTO analytics_events (
      id, visitor_id, session_id, event_type, path, page_title, page_type,
      product_slug, product_title, referrer, source_type, source_label,
      device_type, browser, os, country, ip, duration_seconds,
      is_new_visitor, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.id,
      event.visitor_id,
      event.session_id,
      event.event_type,
      event.path,
      event.page_title,
      event.page_type,
      event.product_slug,
      event.product_title,
      event.referrer,
      event.source_type,
      event.source_label,
      event.device_type,
      event.browser,
      event.os,
      event.country,
      event.ip,
      event.duration_seconds,
      event.is_new_visitor,
      event.user_agent
    )
    .run();

  return event;
}

export async function onRequestPost(context) {
  return handle(async () => {
    const body = await readJson(context.request);
    await saveAnalyticsEvent(context, body);
    return json({ ok: true });
  });
}
