const EVENT_TYPES = new Set([
  "page_view",
  "page_ping",
  "page_exit",
  "send_inquiry_click",
  "email_click",
  "whatsapp_click",
  "product_link_click",
  "not_found"
]);

const CONVERSION_EVENTS = new Set(["send_inquiry_click", "email_click", "whatsapp_click"]);

function text(value, fallback = "", max = 240) {
  return String(value ?? fallback).trim().slice(0, max);
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolInt(value) {
  return value === true || value === 1 || value === "1" ? 1 : 0;
}

function parseDate(value) {
  if (value instanceof Date) return value;
  const source = String(value || "");
  const normalized = source.includes("T") ? source : `${source.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function dateKey(value) {
  return parseDate(value).toISOString().slice(0, 10);
}

function startDate(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date;
}

function lastDays(days) {
  const start = startDate(days);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function uniqueCount(items, selector) {
  return new Set(items.map(selector).filter(Boolean)).size;
}

function sameHost(referrer, currentUrl) {
  try {
    if (!referrer || !currentUrl) return false;
    return new URL(referrer).hostname === new URL(currentUrl).hostname;
  } catch {
    return false;
  }
}

export function classifySource(referrer = "", currentUrl = "") {
  const ref = text(referrer, "", 600);

  if (!ref || sameHost(ref, currentUrl)) {
    return { source_type: "direct", source_label: "直接访问" };
  }

  let hostname = "";
  try {
    hostname = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return { source_type: "direct", source_label: "直接访问" };
  }

  const searchHosts = ["google.", "baidu.", "bing.", "yahoo.", "duckduckgo.", "sogou.", "so.com"];
  const socialHosts = [
    "facebook.",
    "instagram.",
    "linkedin.",
    "twitter.",
    "x.com",
    "youtube.",
    "tiktok.",
    "wechat.",
    "weixin.",
    "zhihu.",
    "xiaohongshu.",
    "douyin."
  ];

  if (searchHosts.some((item) => hostname.includes(item))) {
    return { source_type: "search", source_label: hostname };
  }

  if (socialHosts.some((item) => hostname.includes(item))) {
    return { source_type: "social", source_label: hostname };
  }

  return { source_type: "referral", source_label: hostname };
}

export function parseUserAgent(userAgent = "") {
  const ua = String(userAgent || "");
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);
  const isMobile = !isTablet && /mobile|iphone|ipod|android|blackberry|phone/i.test(ua);
  const device_type = isTablet ? "平板" : isMobile ? "手机" : "电脑";

  let browser = "其他";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";

  let os = "其他";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os|macintosh/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device_type, browser, os };
}

export function normalizeAnalyticsEvent(body, meta = {}) {
  const eventType = EVENT_TYPES.has(body?.event_type) ? body.event_type : "page_view";
  const source = classifySource(body?.referrer, body?.url);
  const userAgentInfo = parseUserAgent(meta.userAgent);
  const path = text(body?.path || "/", "/", 360) || "/";

  return {
    id: meta.id,
    visitor_id: text(body?.visitor_id, "unknown", 80),
    session_id: text(body?.session_id, "unknown", 80),
    event_type: eventType,
    path,
    page_title: text(body?.page_title || path, path, 220),
    page_type: text(body?.page_type || "page", "page", 80),
    product_slug: text(body?.product_slug, "", 120),
    product_title: text(body?.product_title, "", 180),
    referrer: text(body?.referrer, "", 600),
    source_type: source.source_type,
    source_label: source.source_label,
    device_type: userAgentInfo.device_type,
    browser: userAgentInfo.browser,
    os: userAgentInfo.os,
    country: text(meta.country || "Unknown", "Unknown", 80),
    ip: text(meta.ip, "", 100),
    duration_seconds: Math.min(7200, Math.max(0, Math.round(number(body?.duration_seconds, 0)))),
    is_new_visitor: boolInt(body?.is_new_visitor),
    user_agent: text(meta.userAgent, "", 600),
    created_at: meta.createdAt || new Date().toISOString()
  };
}

function labelForEvent(event) {
  return {
    page_view: "访问页面",
    page_ping: "停留中",
    page_exit: "离开页面",
    send_inquiry_click: "点击 Send Inquiry",
    email_click: "点击 Email",
    whatsapp_click: "点击 WhatsApp",
    product_link_click: "点击产品链接",
    not_found: "访问 404"
  }[event.event_type] || event.event_type;
}

function groupAdd(map, key, create) {
  if (!map.has(key)) map.set(key, create());
  return map.get(key);
}

function shortVisitorId(value) {
  return String(value || "unknown").replace(/^mj_/, "").slice(0, 8).toUpperCase();
}

function emptySummary(range) {
  return {
    range,
    generated_at: new Date().toISOString(),
    totals: {
      today_pv: 0,
      today_uv: 0,
      today_ip: 0,
      pv_7d: 0,
      uv_7d: 0,
      pv_30d: 0,
      uv_30d: 0,
      average_session_duration: 0,
      bounce_rate: 0,
      inquiry_clicks: 0,
      conversion_rate: 0,
      new_visitors: 0,
      returning_visitors: 0
    },
    trend: lastDays(range).map((day) => ({ date: day, pv: 0, uv: 0, inquiry: 0 })),
    inquiry_trend: lastDays(range).map((day) => ({ date: day, send_inquiry: 0, email: 0, whatsapp: 0 })),
    sources: [],
    devices: [],
    browsers: [],
    operating_systems: [],
    top_pages: [],
    exit_pages: [],
    products: [],
    conversions: [],
    funnel: [],
    visitor_journeys: [],
    not_found: []
  };
}

export function summarizeAnalytics(rows = [], options = {}) {
  const range = options.range === 30 ? 30 : 7;
  if (!rows.length) return emptySummary(range);

  const events = rows
    .map((event) => ({ ...event, created: parseDate(event.created_at) }))
    .filter((event) => event.created.getTime() > 0)
    .sort((a, b) => a.created - b.created);

  const today = new Date().toISOString().slice(0, 10);
  const rangeStart = startDate(range);
  const start7 = startDate(7);
  const start30 = startDate(30);
  const periodEvents = events.filter((event) => event.created >= rangeStart);
  const pageViews = periodEvents.filter((event) => event.event_type === "page_view");
  const conversions = periodEvents.filter((event) => CONVERSION_EVENTS.has(event.event_type));
  const allPageViews = events.filter((event) => event.event_type === "page_view");
  const pageViews7 = events.filter((event) => event.event_type === "page_view" && event.created >= start7);
  const pageViews30 = events.filter((event) => event.event_type === "page_view" && event.created >= start30);
  const todayViews = allPageViews.filter((event) => dateKey(event.created_at) === today);

  const sessions = new Map();
  periodEvents.forEach((event) => {
    const session = groupAdd(sessions, event.session_id || `${event.visitor_id}-${dateKey(event.created_at)}`, () => ({
      session_id: event.session_id,
      visitor_id: event.visitor_id,
      source_type: event.source_type,
      source_label: event.source_label,
      device_type: event.device_type,
      page_views: [],
      events: [],
      max_duration: 0,
      started_at: event.created,
      ended_at: event.created
    }));

    session.events.push(event);
    if (event.event_type === "page_view") session.page_views.push(event);
    if (event.duration_seconds) session.max_duration = Math.max(session.max_duration, Number(event.duration_seconds) || 0);
    if (event.created < session.started_at) session.started_at = event.created;
    if (event.created > session.ended_at) session.ended_at = event.created;
  });

  const activeSessions = [...sessions.values()].filter((session) => session.page_views.length > 0);
  const sessionDurations = activeSessions.map((session) => {
    const span = Math.max(0, Math.round((session.ended_at - session.started_at) / 1000));
    return Math.max(session.max_duration, span);
  });
  const averageSessionDuration = sessionDurations.length
    ? Math.round(sessionDurations.reduce((sum, item) => sum + item, 0) / sessionDurations.length)
    : 0;
  const bounces = activeSessions.filter((session) => session.page_views.length === 1).length;

  const days = lastDays(range);
  const trend = days.map((day) => {
    const dayViews = pageViews.filter((event) => dateKey(event.created_at) === day);
    const dayConversions = conversions.filter((event) => dateKey(event.created_at) === day);
    return {
      date: day,
      pv: dayViews.length,
      uv: uniqueCount(dayViews, (event) => event.visitor_id),
      inquiry: dayConversions.length
    };
  });

  const inquiryTrend = days.map((day) => {
    const dayConversions = conversions.filter((event) => dateKey(event.created_at) === day);
    return {
      date: day,
      send_inquiry: dayConversions.filter((event) => event.event_type === "send_inquiry_click").length,
      email: dayConversions.filter((event) => event.event_type === "email_click").length,
      whatsapp: dayConversions.filter((event) => event.event_type === "whatsapp_click").length
    };
  });

  const visitorFirstView = new Map();
  pageViews.forEach((event) => {
    if (!visitorFirstView.has(event.visitor_id)) visitorFirstView.set(event.visitor_id, event);
  });

  const visitors = [...visitorFirstView.values()];
  const newVisitors = visitors.filter((event) => Number(event.is_new_visitor) === 1).length;
  const returningVisitors = Math.max(0, visitors.length - newVisitors);

  const sourceSessions = new Map();
  activeSessions.forEach((session) => {
    sourceSessions.set(session.session_id, {
      source_type: session.source_type || "direct",
      source_label: session.source_label || "直接访问"
    });
  });

  function groupDimension(items, keyFn, labelFn = keyFn) {
    const map = new Map();
    items.forEach((event) => {
      const key = keyFn(event) || "未知";
      const item = groupAdd(map, key, () => ({ key, label: labelFn(event) || key, pv: 0, visitors: new Set(), conversions: 0 }));
      item.pv += event.event_type === "page_view" ? 1 : 0;
      item.visitors.add(event.visitor_id);
    });
    conversions.forEach((event) => {
      const source = sourceSessions.get(event.session_id);
      if (!source && keyFn !== sourceKey) return;
      const synthetic = source ? { source_type: source.source_type, source_label: source.source_label } : event;
      const key = keyFn(synthetic) || "未知";
      const item = map.get(key);
      if (item) item.conversions += 1;
    });
    return [...map.values()]
      .map((item) => ({ key: item.key, label: item.label, pv: item.pv, uv: item.visitors.size, conversions: item.conversions }))
      .sort((a, b) => b.pv - a.pv)
      .slice(0, 12);
  }

  const sourceKey = (event) => event.source_type || "direct";
  const sources = groupDimension(pageViews, sourceKey, (event) => {
    return {
      direct: "直接访问",
      search: "搜索引擎",
      social: "社交媒体",
      referral: "外部网站"
    }[event.source_type] || event.source_label || "未知";
  });

  const pageMap = new Map();
  pageViews.forEach((event) => {
    const page = groupAdd(pageMap, event.path, () => ({
      path: event.path,
      title: event.page_title || event.path,
      page_type: event.page_type,
      pv: 0,
      visitors: new Set(),
      duration_total: 0,
      duration_count: 0,
      exits: 0
    }));
    page.pv += 1;
    page.visitors.add(event.visitor_id);
  });

  periodEvents.filter((event) => event.event_type === "page_ping" || event.event_type === "page_exit").forEach((event) => {
    const page = pageMap.get(event.path);
    if (!page || !event.duration_seconds) return;
    page.duration_total += Number(event.duration_seconds) || 0;
    page.duration_count += 1;
  });

  periodEvents.filter((event) => event.event_type === "page_exit").forEach((event) => {
    const page = pageMap.get(event.path);
    if (page) page.exits += 1;
  });

  if (!periodEvents.some((event) => event.event_type === "page_exit")) {
    activeSessions.forEach((session) => {
      const lastView = session.page_views.at(-1);
      const page = lastView ? pageMap.get(lastView.path) : null;
      if (page) page.exits += 1;
    });
  }

  const topPages = [...pageMap.values()]
    .map((page) => ({
      path: page.path,
      title: page.title,
      page_type: page.page_type,
      pv: page.pv,
      uv: page.visitors.size,
      average_duration: page.duration_count ? Math.round(page.duration_total / page.duration_count) : 0,
      exits: page.exits
    }))
    .sort((a, b) => b.pv - a.pv)
    .slice(0, 20);

  const exitPages = [...topPages].sort((a, b) => b.exits - a.exits).slice(0, 12);

  const productMap = new Map();
  pageViews
    .filter((event) => event.page_type === "product_detail" || event.product_slug)
    .forEach((event) => {
      const key = event.product_slug || event.path;
      const product = groupAdd(productMap, key, () => ({
        slug: key,
        title: event.product_title || event.page_title || key,
        pv: 0,
        visitors: new Set(),
        inquiry_clicks: 0
      }));
      product.pv += 1;
      product.visitors.add(event.visitor_id);
    });

  conversions.forEach((event) => {
    if (!event.product_slug && event.page_type !== "product_detail") return;
    const key = event.product_slug || event.path;
    const product = groupAdd(productMap, key, () => ({
      slug: key,
      title: event.product_title || event.page_title || key,
      pv: 0,
      visitors: new Set(),
      inquiry_clicks: 0
    }));
    product.inquiry_clicks += 1;
  });

  const products = [...productMap.values()]
    .map((product) => ({
      slug: product.slug,
      title: product.title,
      pv: product.pv,
      uv: product.visitors.size,
      inquiry_clicks: product.inquiry_clicks,
      conversion_rate: product.visitors.size ? product.inquiry_clicks / product.visitors.size : 0
    }))
    .sort((a, b) => b.pv - a.pv)
    .slice(0, 20);

  const conversionMap = new Map();
  conversions.forEach((event) => {
    const label = {
      send_inquiry_click: "Send Inquiry",
      email_click: "Email",
      whatsapp_click: "WhatsApp"
    }[event.event_type];
    const item = groupAdd(conversionMap, event.event_type, () => ({ key: event.event_type, label, count: 0 }));
    item.count += 1;
  });

  const notFoundMap = new Map();
  periodEvents.filter((event) => event.event_type === "not_found").forEach((event) => {
    const item = groupAdd(notFoundMap, event.path, () => ({ path: event.path, referrer: event.referrer || "-", count: 0 }));
    item.count += 1;
  });

  const visitorJourneys = [...activeSessions]
    .sort((a, b) => b.started_at - a.started_at)
    .slice(0, 30)
    .map((session) => ({
      session_id: session.session_id,
      visitor_label: `访客 ${shortVisitorId(session.visitor_id)}`,
      source: session.source_label || "直接访问",
      device: session.device_type || "未知",
      started_at: session.started_at.toISOString(),
      duration_seconds: sessionDurations[activeSessions.indexOf(session)] || 0,
      events: session.events
        .filter((event) => event.event_type !== "page_ping")
        .map((event) => ({
          time: event.created.toISOString(),
          type: event.event_type,
          label: labelForEvent(event),
          page: event.page_title || event.path,
          path: event.path,
          product: event.product_title || ""
        }))
    }));

  const productListVisitors = new Set(pageViews.filter((event) => event.page_type === "products").map((event) => event.visitor_id));
  const productDetailVisitors = new Set(pageViews.filter((event) => event.page_type === "product_detail").map((event) => event.visitor_id));
  const conversionVisitors = new Set(conversions.map((event) => event.visitor_id));

  return {
    range,
    generated_at: new Date().toISOString(),
    totals: {
      today_pv: todayViews.length,
      today_uv: uniqueCount(todayViews, (event) => event.visitor_id),
      today_ip: uniqueCount(todayViews, (event) => event.ip),
      pv_7d: pageViews7.length,
      uv_7d: uniqueCount(pageViews7, (event) => event.visitor_id),
      pv_30d: pageViews30.length,
      uv_30d: uniqueCount(pageViews30, (event) => event.visitor_id),
      average_session_duration: averageSessionDuration,
      bounce_rate: activeSessions.length ? bounces / activeSessions.length : 0,
      inquiry_clicks: conversions.length,
      conversion_rate: uniqueCount(pageViews, (event) => event.visitor_id)
        ? conversions.length / uniqueCount(pageViews, (event) => event.visitor_id)
        : 0,
      new_visitors: newVisitors,
      returning_visitors: returningVisitors
    },
    trend,
    inquiry_trend: inquiryTrend,
    sources,
    devices: groupDimension(pageViews, (event) => event.device_type || "未知"),
    browsers: groupDimension(pageViews, (event) => event.browser || "未知"),
    operating_systems: groupDimension(pageViews, (event) => event.os || "未知"),
    top_pages: topPages,
    exit_pages: exitPages,
    products,
    conversions: [...conversionMap.values()].sort((a, b) => b.count - a.count),
    funnel: [
      { label: "访问网站", count: uniqueCount(pageViews, (event) => event.visitor_id) },
      { label: "查看 Products", count: productListVisitors.size },
      { label: "进入产品详情", count: productDetailVisitors.size },
      { label: "点击询盘", count: conversionVisitors.size }
    ],
    visitor_journeys: visitorJourneys,
    not_found: [...notFoundMap.values()].sort((a, b) => b.count - a.count).slice(0, 20)
  };
}
