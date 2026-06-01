const app = document.querySelector("#app");

const state = {
  user: null,
  roles: {},
  section: "dashboard",
  pageKey: "home",
  formData: null,
  formDataPage: "",
  products: [],
  images: [],
  productOriginalSlug: "",
  analyticsRange: 7,
  analytics: null,
  setupMode: false,
  busy: false
};

const pageMeta = {
  home: { title: "首页内容", endpoint: "/api/content/home" },
  about: { title: "About 页面", endpoint: "/api/content/about" },
  productsPage: { title: "Products 页面", endpoint: "/api/content/productsPage" }
};

const navItems = [
  { key: "dashboard", label: "仪表盘" },
  { key: "analytics", label: "数据统计", permission: "analytics" },
  { key: "pages", label: "页面内容", permission: "pages" },
  { key: "products", label: "产品管理", permission: "products" },
  { key: "users", label: "用户管理", permission: "users" },
  { key: "logs", label: "日志管理", permission: "logs" },
  { key: "account", label: "账号设置" }
];

const pageSchemas = {
  home: [
    objectField("第一屏：大标题和背景图", "hero", [
      imageField("背景图片", "image"),
      textField("主标题", "title"),
      textareaField("副标题", "subtitle"),
      textField("小标题", "eyebrow", false),
      textField("主按钮文字", "primary_button_label"),
      textField("主按钮链接", "primary_button_link"),
      textField("副按钮文字", "secondary_button_label"),
      textField("副按钮链接", "secondary_button_link"),
      listField("三条亮点数据", "metrics", [
        textField("重点文字", "value"),
        textField("说明文字", "label")
      ]),
      textField("图片说明", "image_alt", false)
    ]),
    listField("首页：三条服务亮点", "service_overview", [
      textField("编号", "number"),
      textField("标题", "title"),
      textareaField("描述", "description")
    ]),
    objectField("首页：关于我们预览", "about", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      listField("介绍段落", "paragraphs", textareaField("段落内容", "")),
      textField("按钮文字", "button_label"),
      textField("按钮链接", "button_link"),
      listField("右侧信息卡片", "facts", [
        textField("标题", "title"),
        textareaField("描述", "description")
      ])
    ]),
    objectField("首页：产品区域标题", "product_section", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("描述", "description"),
      numberField("首页显示几个产品", "max_items")
    ]),
    objectField("首页：能力介绍", "capabilities", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("描述", "description"),
      listField("能力项目", "items", [
        textField("标题", "title"),
        textareaField("描述", "description")
      ])
    ]),
    objectField("首页：工作流程", "workflow", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      listField("流程步骤", "steps", [
        textField("步骤标题", "title"),
        textareaField("步骤描述", "description")
      ])
    ]),
    objectField("首页：合作优势", "quality", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      listField("优势列表", "items", textField("优势内容", ""))
    ]),
    objectField("首页：联系方式", "contact", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("描述", "description"),
      textField("电话", "phone"),
      textField("电话链接", "phone_link"),
      textField("邮箱", "email"),
      textField("邮箱链接", "email_link"),
      textField("WhatsApp", "whatsapp"),
      textField("WhatsApp 链接", "whatsapp_link"),
      textareaField("地址", "address")
    ]),
    objectField("全站：品牌和顶部按钮", "brand", [
      textField("品牌名称", "name"),
      textField("品牌副标题", "tagline"),
      imageField("Logo", "logo")
    ], true),
    objectField("全站：导航按钮", "nav", [
      textField("右上角按钮文字", "send_case_label"),
      textField("右上角按钮链接", "send_case_link")
    ], true),
    objectField("全站：页脚", "footer", [
      textField("公司名称", "company_name"),
      textField("公司法定名称", "company_legal_name"),
      textField("版权文字", "copyright")
    ], true),
    objectField("高级设置：SEO", "seo", [
      textField("浏览器标题", "title"),
      textareaField("页面描述", "description")
    ], true)
  ],
  about: [
    objectField("页面顶部：标题和背景图", "hero", [
      imageField("背景图片", "image"),
      textField("小标题", "eyebrow", false),
      textField("主标题", "title"),
      textareaField("副标题", "subtitle"),
      textField("图片说明", "image_alt", false)
    ]),
    objectField("公司介绍", "introduction", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      listField("介绍段落", "paragraphs", textareaField("段落内容", ""))
    ]),
    listField("公司信息卡片", "facts", [
      textField("项目名", "label"),
      textField("内容", "value")
    ]),
    objectField("工厂图片区域", "factory", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("描述", "description"),
      listField("工厂图片", "gallery", [
        imageField("图片", "image"),
        textField("图片标题", "title"),
        textareaField("图片说明", "caption"),
        textField("图片 Alt 说明", "alt", false)
      ])
    ]),
    objectField("主要业务", "business", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      listField("业务项目", "items", [
        textField("编号", "number"),
        textField("标题", "title"),
        textareaField("描述", "description")
      ])
    ]),
    objectField("底部引导按钮", "cta", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textField("按钮文字", "button_label"),
      textField("按钮链接", "button_link")
    ]),
    objectField("高级设置：SEO", "seo", [
      textField("浏览器标题", "title"),
      textareaField("页面描述", "description")
    ], true)
  ],
  productsPage: [
    objectField("页面顶部：标题和背景图", "hero", [
      imageField("背景图片", "image"),
      textField("小标题", "eyebrow", false),
      textField("主标题", "title"),
      textareaField("副标题", "subtitle"),
      textField("图片说明", "image_alt", false)
    ]),
    objectField("产品列表标题", "product_list", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("描述", "description")
    ]),
    objectField("询盘表单文案", "inquiry", [
      textField("小标题", "eyebrow", false),
      textField("标题", "title"),
      textareaField("说明", "description"),
      textField("姓名字段名", "name_label"),
      textField("邮箱字段名", "email_label"),
      textField("产品分类字段名", "category_label"),
      textField("产品分类默认提示", "category_placeholder"),
      textField("数量字段名", "quantity_label"),
      textField("数量提示", "quantity_placeholder"),
      textField("留言字段名", "message_label"),
      textareaField("留言提示", "message_placeholder"),
      textField("按钮文字", "button_label")
    ]),
    objectField("高级设置：SEO", "seo", [
      textField("浏览器标题", "title"),
      textareaField("页面描述", "description")
    ], true)
  ]
};

const productSchema = [
  numberField("显示排序", "order"),
  textField("产品名称", "title"),
  textField("网址英文名", "slug"),
  textField("所属分类", "category"),
  textareaField("列表页简短描述", "short_description"),
  textareaField("详情页产品介绍", "description"),
  imageField("产品卡片图片", "card_image"),
  listField("详情页轮播图片", "gallery", [
    imageField("图片", "image"),
    textareaField("图片下方文字", "caption"),
    textField("图片 Alt 说明", "alt", false)
  ]),
  listField("产品详情参数", "details", [
    textField("项目名", "label"),
    textareaField("内容", "text")
  ]),
  relationField("相关产品", "related_products"),
  objectField("询盘表单文案", "inquiry", [
    textField("询盘标题", "title"),
    textareaField("询盘说明", "description"),
    textField("数量输入框提示", "quantity_placeholder"),
    textField("留言输入框提示", "message_placeholder")
  ], true),
  listField("标签", "tags", textField("标签", ""), true),
  textField("产品卡片缩写", "icon", true),
  textField("产品卡片图片说明", "card_alt", false),
  objectField("高级设置：SEO", "seo", [
    textField("浏览器标题", "title"),
    textareaField("页面描述", "description")
  ], true)
];

function textField(label, name, required = true) {
  return { type: "text", label, name, required };
}

function textareaField(label, name, required = true) {
  return { type: "textarea", label, name, required };
}

function numberField(label, name) {
  return { type: "number", label, name };
}

function imageField(label, name) {
  return { type: "image", label, name };
}

function objectField(label, name, fields, collapsed = false) {
  return { type: "object", label, name, fields, collapsed };
}

function listField(label, name, item, collapsed = false) {
  return { type: "list", label, name, item, collapsed };
}

function relationField(label, name) {
  return { type: "relation", label, name };
}

function can(permission) {
  return state.user?.permissions?.includes(permission);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "操作失败，请稍后再试。");
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message, isError = false) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = `toast${isError ? " is-error" : ""}`;
  el.textContent = message;
  document.body.append(el);
  window.setTimeout(() => el.remove(), 3600);
}

function getPath(object, path) {
  if (!path) return object;
  return path.split(".").reduce((current, part) => current?.[part], object);
}

function setPath(object, path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((current, part) => {
    if (current[part] === undefined) current[part] = {};
    return current[part];
  }, object);
  target[last] = value;
}

function defaultValue(field) {
  if (Array.isArray(field)) {
    return Object.fromEntries(field.map((item) => [item.name, defaultValue(item)]));
  }
  if (field.type === "object") {
    return Object.fromEntries(field.fields.map((item) => [item.name, defaultValue(item)]));
  }
  if (field.type === "list" || field.type === "relation") return [];
  if (field.type === "number") return 1;
  return "";
}

function renderShell(content) {
  const visibleNav = navItems.filter((item) => !item.permission || can(item.permission));
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>美嘉牙科后台</strong>
          <span>MEIJIA DENTAL CMS</span>
        </div>
        <nav class="nav-list">
          ${visibleNav.map((item) => `<button class="nav-button${state.section === item.key ? " is-active" : ""}" data-section="${item.key}">${item.label}</button>`).join("")}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(state.user.name || state.user.username)}</strong>
          <span>${escapeHtml(state.user.roleLabel)}</span>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="page-title">
            <h1>${titleForSection()}</h1>
            <p>${subtitleForSection()}</p>
          </div>
          <div class="topbar-actions">
            <span class="badge">${escapeHtml(state.user.roleLabel)}</span>
            <a class="button secondary" href="/" target="_blank" rel="noreferrer">查看网站</a>
            <button class="button ghost" data-action="logout">退出</button>
          </div>
        </div>
        ${content}
      </main>
    </div>
  `;
}

function titleForSection() {
  return {
    dashboard: "仪表盘",
    analytics: "数据统计",
    pages: "页面内容",
    products: "产品管理",
    users: "用户管理",
    logs: "日志管理",
    account: "账号设置"
  }[state.section] || "后台管理";
}

function subtitleForSection() {
  return {
    dashboard: "查看网站内容状态和最近修改。",
    analytics: "查看访问量、来源、热门产品、询盘点击和访客访问轨迹。",
    pages: "修改首页、About 页面和 Products 页面。",
    products: "新增或修改产品分类、描述、配图和询盘文案。",
    users: "新增用户、修改角色、禁用账号或重置密码。",
    logs: "查看最近的后台操作日志。",
    account: "修改自己的登录密码。"
  }[state.section] || "";
}

function renderLogin() {
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <h1>${state.setupMode ? "初始化管理员" : "后台登录"}</h1>
        <p>${state.setupMode ? "只在第一次部署时使用。需要 Cloudflare 环境变量 ADMIN_SETUP_TOKEN。" : "请输入后台账号和密码，不需要 GitHub 账号。"}</p>
        <form data-form="${state.setupMode ? "setup" : "login"}" class="grid">
          ${state.setupMode ? `
            <div class="field"><label>初始化密钥</label><input name="setupToken" type="password" required /></div>
            <div class="field"><label>姓名</label><input name="name" required /></div>
            <div class="field"><label>邮箱</label><input name="email" type="email" required /></div>
          ` : ""}
          <div class="field"><label>账号或邮箱</label><input name="username" autocomplete="username" required /></div>
          <div class="field"><label>密码</label><input name="password" type="password" autocomplete="${state.setupMode ? "new-password" : "current-password"}" required /></div>
          <button class="button primary" type="submit">${state.setupMode ? "创建超级管理员" : "登录"}</button>
        </form>
        <div class="inline-actions">
          <button class="button ghost small" data-action="toggle-setup">${state.setupMode ? "返回登录" : "首次部署？初始化管理员"}</button>
        </div>
      </div>
    </div>
  `;
}

async function renderDashboard() {
  const productCount = can("products") ? (await ensureProducts()).length : 0;
  let logs = [];
  if (can("logs")) {
    logs = (await api("/api/logs")).logs.slice(0, 8);
  }

  renderShell(`
    <div class="grid three">
      <div class="stat"><span>当前账号</span><strong>${escapeHtml(state.user.name)}</strong></div>
      <div class="stat"><span>权限角色</span><strong>${escapeHtml(state.user.roleLabel)}</strong></div>
      <div class="stat"><span>产品数量</span><strong>${productCount}</strong></div>
    </div>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>快速入口</h2>
          <p class="muted">选择最常用的编辑区域。</p>
        </div>
      </div>
      <div class="inline-actions">
        ${can("pages") ? `<button class="button secondary" data-section="pages">编辑页面内容</button>` : ""}
        ${can("products") ? `<button class="button secondary" data-section="products">管理产品</button>` : ""}
        ${can("analytics") ? `<button class="button secondary" data-section="analytics">查看数据统计</button>` : ""}
        <button class="button secondary" data-section="account">修改密码</button>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>最近记录</h2></div>
      ${renderLogTable(logs)}
    </section>
  `);
}

async function renderAnalytics() {
  if (!can("analytics")) return renderNoPermission();
  const response = await api(`/api/analytics/summary?range=${state.analyticsRange}`);
  const summary = response.summary;
  const totals = summary.totals;
  state.analytics = summary;

  renderShell(`
    <div class="analytics-toolbar">
      <div>
        <strong>统计范围</strong>
        <span class="muted">当前图表显示近 ${summary.range} 天数据。</span>
      </div>
      <div class="segmented">
        <button class="${state.analyticsRange === 7 ? "is-active" : ""}" data-analytics-range="7">近 7 天</button>
        <button class="${state.analyticsRange === 30 ? "is-active" : ""}" data-analytics-range="30">近 30 天</button>
      </div>
    </div>

    <div class="analytics-stats">
      ${analyticsStat("今日页面浏览量", totals.today_pv)}
      ${analyticsStat("今日独立访客", totals.today_uv)}
      ${analyticsStat("今日 IP", totals.today_ip)}
      ${analyticsStat("询盘点击", totals.inquiry_clicks)}
      ${analyticsStat("近 7 天浏览量 / 访客", `${formatNumber(totals.pv_7d)} / ${formatNumber(totals.uv_7d)}`)}
      ${analyticsStat("近 30 天浏览量 / 访客", `${formatNumber(totals.pv_30d)} / ${formatNumber(totals.uv_30d)}`)}
      ${analyticsStat("平均停留时长", formatDuration(totals.average_session_duration))}
      ${analyticsStat("跳出率 / 转化率", `${formatPercent(totals.bounce_rate)} / ${formatPercent(totals.conversion_rate)}`)}
      ${analyticsStat("新访客 / 老访客", `${formatNumber(totals.new_visitors)} / ${formatNumber(totals.returning_visitors)}`)}
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>页面浏览量 / 独立访客趋势</h2>
          <p class="muted">看网站整体有没有人在看，以及独立访客是否增长。</p>
        </div>
      </div>
      ${renderLineChart(summary.trend, [
        { key: "pv", label: "页面浏览量", color: "#007b83" },
        { key: "uv", label: "独立访客", color: "#df6d5c" }
      ])}
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>询盘点击趋势</h2>
          <p class="muted">统计 Send Inquiry、Email、WhatsApp 三类动作。</p>
        </div>
      </div>
      ${renderLineChart(summary.inquiry_trend, [
        { key: "send_inquiry", label: "Send Inquiry", color: "#007b83" },
        { key: "email", label: "Email", color: "#c99c45" },
        { key: "whatsapp", label: "WhatsApp", color: "#2f855a" }
      ])}
    </section>

    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><h2>流量来源</h2></div>
        ${renderBarList(summary.sources, "pv", (item) => item.label, (item) => `浏览量 ${formatNumber(item.pv)} · 访客 ${formatNumber(item.uv)} · 转化 ${formatNumber(item.conversions)}`)}
      </section>
      <section class="panel">
        <div class="panel-header"><h2>设备占比</h2></div>
        ${renderBarList(summary.devices, "pv", (item) => item.label, (item) => `浏览量 ${formatNumber(item.pv)} · 访客 ${formatNumber(item.uv)}`)}
      </section>
      <section class="panel">
        <div class="panel-header"><h2>浏览器</h2></div>
        ${renderBarList(summary.browsers, "pv", (item) => item.label, (item) => `浏览量 ${formatNumber(item.pv)} · 访客 ${formatNumber(item.uv)}`)}
      </section>
      <section class="panel">
        <div class="panel-header"><h2>操作系统</h2></div>
        ${renderBarList(summary.operating_systems, "pv", (item) => item.label, (item) => `浏览量 ${formatNumber(item.pv)} · 访客 ${formatNumber(item.uv)}`)}
      </section>
    </div>

    <div class="grid two">
      <section class="panel">
        <div class="panel-header"><h2>转化漏斗</h2></div>
        ${renderFunnel(summary.funnel)}
      </section>
      <section class="panel">
        <div class="panel-header"><h2>业务转化</h2></div>
        ${renderBarList(summary.conversions, "count", (item) => item.label, (item) => `${formatNumber(item.count)} 次`)}
      </section>
    </div>

    <section class="panel">
      <div class="panel-header"><h2>热门页面</h2></div>
      ${renderTopPagesTable(summary.top_pages)}
    </section>

    <section class="panel">
      <div class="panel-header"><h2>产品热度</h2></div>
      ${renderProductsAnalyticsTable(summary.products)}
    </section>

    <section class="panel">
      <div class="panel-header"><h2>离开页面</h2></div>
      ${renderExitPagesTable(summary.exit_pages)}
    </section>

    <section class="panel">
      <div class="panel-header"><h2>访客访问轨迹</h2></div>
      ${renderVisitorJourneys(summary.visitor_journeys)}
    </section>

    <section class="panel">
      <div class="panel-header"><h2>404 错误追踪</h2></div>
      ${renderNotFoundTable(summary.not_found)}
    </section>
  `);
}

function analyticsStat(label, value) {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(Number(value) || 0);
}

function formatPercent(value) {
  return `${((Number(value) || 0) * 100).toFixed(1)}%`;
}

function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  if (value < 60) return `${Math.round(value)} 秒`;
  const minutes = Math.floor(value / 60);
  const remain = Math.round(value % 60);
  return `${minutes} 分 ${remain} 秒`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
}

function renderLineChart(rows, series) {
  const data = rows || [];
  if (!data.length) return `<div class="empty">暂无数据。</div>`;

  const width = 760;
  const height = 240;
  const padX = 42;
  const padY = 34;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padY * 2;
  const max = Math.max(1, ...data.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)));
  const pointsFor = (key) => data.map((row, index) => {
    const x = padX + (data.length === 1 ? plotWidth / 2 : (plotWidth * index) / (data.length - 1));
    const y = height - padY - ((Number(row[key]) || 0) / max) * plotHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `
    <div class="chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend chart">
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" />
        <line x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" />
        ${[0.25, 0.5, 0.75].map((step) => {
          const y = height - padY - step * plotHeight;
          return `<line class="chart-grid-line" x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" />`;
        }).join("")}
        ${series.map((item) => `<polyline points="${pointsFor(item.key)}" stroke="${item.color}" />`).join("")}
        ${data.map((row, index) => {
          const x = padX + (data.length === 1 ? plotWidth / 2 : (plotWidth * index) / (data.length - 1));
          const label = String(row.date || "").slice(5).replace("-", "/");
          return `<text x="${x}" y="${height - 8}" text-anchor="middle">${escapeHtml(label)}</text>`;
        }).join("")}
      </svg>
      <div class="chart-legend">
        ${series.map((item) => `<span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderBarList(items, valueKey, labelFn, metaFn) {
  if (!items?.length) return `<div class="empty">暂无数据。</div>`;
  const max = Math.max(1, ...items.map((item) => Number(item[valueKey]) || 0));

  return `
    <div class="bar-list">
      ${items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = Math.max(4, (value / max) * 100);
        return `
          <div class="bar-row">
            <div>
              <strong>${escapeHtml(labelFn(item))}</strong>
              <span>${escapeHtml(metaFn(item))}</span>
            </div>
            <div class="bar-track"><i style="width:${width}%"></i></div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderFunnel(items) {
  if (!items?.length) return `<div class="empty">暂无数据。</div>`;
  const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));
  return `
    <div class="funnel-list">
      ${items.map((item, index) => {
        const value = Number(item.count) || 0;
        const width = Math.max(6, (value / max) * 100);
        return `
          <div class="funnel-row">
            <span>${index + 1}. ${escapeHtml(item.label)}</span>
            <strong>${formatNumber(value)}</strong>
            <i style="width:${width}%"></i>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTopPagesTable(pages) {
  if (!pages?.length) return `<div class="empty">暂无页面访问数据。</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>页面</th><th>页面浏览量</th><th>独立访客</th><th>平均停留</th><th>离开次数</th></tr></thead>
        <tbody>
          ${pages.slice(0, 12).map((page) => `
            <tr>
              <td><strong>${escapeHtml(page.title)}</strong><br><span class="muted">${escapeHtml(page.path)}</span></td>
              <td>${formatNumber(page.pv)}</td>
              <td>${formatNumber(page.uv)}</td>
              <td>${formatDuration(page.average_duration)}</td>
              <td>${formatNumber(page.exits)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProductsAnalyticsTable(products) {
  if (!products?.length) return `<div class="empty">暂无产品访问数据。</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>产品</th><th>页面浏览量</th><th>独立访客</th><th>询盘点击</th><th>转化率</th></tr></thead>
        <tbody>
          ${products.slice(0, 12).map((product) => `
            <tr>
              <td><strong>${escapeHtml(product.title)}</strong><br><span class="muted">${escapeHtml(product.slug)}</span></td>
              <td>${formatNumber(product.pv)}</td>
              <td>${formatNumber(product.uv)}</td>
              <td>${formatNumber(product.inquiry_clicks)}</td>
              <td>${formatPercent(product.conversion_rate)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderExitPagesTable(pages) {
  if (!pages?.length) return `<div class="empty">暂无离开页面数据。</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>页面</th><th>离开次数</th><th>页面浏览量</th></tr></thead>
        <tbody>
          ${pages.slice(0, 10).map((page) => `
            <tr>
              <td><strong>${escapeHtml(page.title)}</strong><br><span class="muted">${escapeHtml(page.path)}</span></td>
              <td>${formatNumber(page.exits)}</td>
              <td>${formatNumber(page.pv)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderVisitorJourneys(journeys) {
  if (!journeys?.length) return `<div class="empty">暂无访客轨迹。打开前台页面后这里会开始出现数据。</div>`;
  return `
    <div class="journey-list">
      ${journeys.slice(0, 10).map((journey) => `
        <article class="journey-card">
          <div class="journey-head">
            <div>
              <strong>${escapeHtml(journey.visitor_label)}</strong>
              <span>${escapeHtml(journey.source)} · ${escapeHtml(journey.device)} · ${formatDuration(journey.duration_seconds)}</span>
            </div>
            <time>${formatDateTime(journey.started_at)}</time>
          </div>
          <ol>
            ${journey.events.slice(0, 12).map((item) => `
              <li>
                <time>${formatDateTime(item.time)}</time>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.product || item.page)}</strong>
                <em>${escapeHtml(item.path)}</em>
              </li>
            `).join("")}
          </ol>
        </article>
      `).join("")}
    </div>
  `;
}

function renderNotFoundTable(items) {
  if (!items?.length) return `<div class="empty">暂无 404 错误。</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>错误页面</th><th>来源</th><th>次数</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${escapeHtml(item.path)}</td>
              <td>${escapeHtml(item.referrer || "-")}</td>
              <td>${formatNumber(item.count)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function renderPages() {
  if (!can("pages")) return renderNoPermission();
  const meta = pageMeta[state.pageKey];
  if (!state.formData || state.formDataPage !== state.pageKey) {
    const response = await api(meta.endpoint);
    state.formData = response.data;
    state.formDataPage = state.pageKey;
  }
  renderShell(`
    <div class="tabs">
      ${Object.entries(pageMeta).map(([key, item]) => `<button class="tab${state.pageKey === key ? " is-active" : ""}" data-page="${key}">${item.title}</button>`).join("")}
    </div>
    <form class="panel form-grid" data-form="page">
      <div class="panel-header field full">
        <div>
          <h2>${meta.title}</h2>
          <p class="muted">修改后点击底部保存。前台仍然建议填写英文内容。</p>
        </div>
      </div>
      ${renderFields(pageSchemas[state.pageKey], state.formData)}
      <div class="form-actions">
        <button class="button primary" type="submit">保存 ${meta.title}</button>
      </div>
    </form>
  `);
}

async function renderProducts() {
  if (!can("products")) return renderNoPermission();
  await ensureProducts(true);
  if (state.productOriginalSlug) {
    return renderProductEditor();
  }

  renderShell(`
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>产品列表</h2>
          <p class="muted">产品会自动出现在首页、Products 页面和相关产品选择里。</p>
        </div>
        <button class="button primary" data-action="new-product">新增产品</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>排序</th><th>产品名称</th><th>网址英文名</th><th>分类</th><th>操作</th></tr></thead>
          <tbody>
            ${state.products.map((product) => `
              <tr>
                <td>${escapeHtml(product.order)}</td>
                <td><strong>${escapeHtml(product.title)}</strong><br><span class="muted">${escapeHtml(product.short_description || "")}</span></td>
                <td>${escapeHtml(product.slug)}</td>
                <td>${escapeHtml(product.category || "")}</td>
                <td>
                  <button class="button secondary small" data-edit-product="${escapeHtml(product.slug)}">编辑</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `);
}

function renderProductEditor() {
  renderShell(`
    <form class="panel form-grid" data-form="product">
      <div class="panel-header field full">
        <div>
          <h2>${state.productOriginalSlug === "__new__" ? "新增产品" : `编辑产品：${escapeHtml(state.formData.title)}`}</h2>
          <p class="muted">网址英文名建议上线后不要随便改，避免旧链接失效。</p>
        </div>
        <button class="button secondary" type="button" data-action="back-products">返回列表</button>
      </div>
      ${renderFields(productSchema, state.formData)}
      <div class="form-actions inline-actions">
        <button class="button primary" type="submit">保存产品</button>
        ${state.productOriginalSlug !== "__new__" ? `<button class="button danger" type="button" data-action="delete-product">删除产品</button>` : ""}
      </div>
    </form>
  `);
}

async function renderUsers() {
  if (!can("users")) return renderNoPermission();
  const users = (await api("/api/users")).users || [];
  renderShell(`
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>新增用户</h2>
          <p class="muted">少量多人协作建议只给需要的权限。</p>
        </div>
      </div>
      <form class="form-grid" data-form="create-user">
        <div class="field"><label>账号</label><input name="username" required /></div>
        <div class="field"><label>初始密码</label><input name="password" type="password" required /></div>
        <div class="field"><label>角色</label>${roleSelect("role", "editor")}</div>
        <div class="form-actions"><button class="button primary" type="submit">创建用户</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>用户列表</h2></div>
      <table>
        <thead><tr><th>账号</th><th>角色</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          ${users.map((item) => `
            <tr>
              <td>${escapeHtml(item.username)}</td>
              <td>${roleSelect("role", item.role, `data-user-role="${item.id}"`)}</td>
              <td>${item.active ? "启用" : "禁用"}</td>
              <td class="inline-actions">
                <button class="button secondary small" data-toggle-user="${item.id}" data-active="${item.active ? "0" : "1"}">${item.active ? "禁用" : "启用"}</button>
                <button class="button secondary small" data-reset-user="${item.id}">重置密码</button>
                <button class="button danger small" data-delete-user="${item.id}">删除</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `);
}

async function renderLogs() {
  if (!can("logs")) return renderNoPermission();
  const logs = (await api("/api/logs")).logs || [];
  renderShell(`<section class="panel">${renderLogTable(logs)}</section>`);
}

function renderAccount() {
  renderShell(`
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>修改密码</h2>
          <p class="muted">修改后，其他设备上的登录状态会失效。</p>
        </div>
      </div>
      <form class="form-grid" data-form="password">
        <div class="field"><label>当前密码</label><input name="currentPassword" type="password" required /></div>
        <div class="field"><label>新密码</label><input name="newPassword" type="password" minlength="8" required /></div>
        <div class="form-actions"><button class="button primary" type="submit">保存新密码</button></div>
      </form>
    </section>
  `);
}

function renderNoPermission() {
  renderShell(`<section class="panel"><div class="empty">当前账号没有访问这个区域的权限。</div></section>`);
}

function renderLogTable(logs) {
  if (!logs?.length) return `<div class="empty">暂无记录。</div>`;
  return `
    <table>
      <thead><tr><th>时间</th><th>用户</th><th>动作</th><th>对象</th><th>说明</th></tr></thead>
      <tbody>
        ${logs.map((log) => `
          <tr>
            <td>${escapeHtml(log.created_at)}</td>
            <td>${escapeHtml(log.username || "-")}</td>
            <td>${escapeHtml(log.action)}</td>
            <td>${escapeHtml(log.target_type)} / ${escapeHtml(log.target_id || "-")}</td>
            <td>${escapeHtml(log.details || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function roleSelect(name, selected, attrs = "") {
  const roles = [
    ["admin", "超级管理员"],
    ["editor", "内容管理员"],
    ["product_editor", "产品编辑"]
  ];
  return `<select name="${name}" ${attrs}>${roles.map(([value, label]) => `<option value="${value}"${selected === value ? " selected" : ""}>${label}</option>`).join("")}</select>`;
}

function renderFields(schema, data, basePath = "") {
  return schema.map((field) => renderField(field, data, basePath ? `${basePath}.${field.name}` : field.name)).join("");
}

function renderField(field, data, path) {
  const value = getPath(data, path);
  const label = escapeHtml(field.label);

  if (field.type === "object") {
    return `
      <section class="field-object">
        <div class="field-title">${label}</div>
        <div class="object-grid">
          ${renderFields(field.fields, data, path)}
        </div>
      </section>
    `;
  }

  if (field.type === "list") {
    const list = Array.isArray(value) ? value : [];
    return `
      <section class="field-list">
        <div class="list-item-header">
          <div class="field-title">${label}</div>
          <button class="button secondary small" type="button" data-add-list="${path}">添加</button>
        </div>
        <div class="list-items">
          ${list.map((item, index) => renderListItem(field, data, path, item, index)).join("") || `<div class="empty">暂无内容，点击“添加”。</div>`}
        </div>
      </section>
    `;
  }

  if (field.type === "relation") {
    const selected = Array.isArray(value) ? value : [];
    return `
      <div class="field full">
        <div class="field-title">${label}</div>
        <div class="inline-actions">
          ${state.products.filter((product) => product.slug !== state.formData?.slug).map((product) => `
            <label class="button secondary small">
              <input type="checkbox" data-relation-path="${path}" value="${escapeHtml(product.slug)}"${selected.includes(product.slug) ? " checked" : ""} />
              ${escapeHtml(product.title)}
            </label>
          `).join("") || `<span class="muted">暂无可选产品</span>`}
        </div>
      </div>
    `;
  }

  if (field.type === "image") {
    return `
      <div class="field full">
        <label>${label}</label>
        <div class="image-row">
          <img class="image-preview" src="${escapeHtml(value || "")}" alt="" onerror="this.removeAttribute('src')" />
          <div>
            <input data-path="${path}" value="${escapeHtml(value || "")}" placeholder="/assets/uploads/example.jpg" />
            <div class="inline-actions">
              <label class="button secondary small">
                上传并压缩
                <input class="hidden" type="file" accept="image/*" data-file-path="${path}" />
              </label>
            </div>
            <p class="hint">建议上传清晰横图，产品图最好不小于 1200x900。系统会保持原图比例压缩，前台会按统一比例裁切，不会拉伸变形。</p>
          </div>
        </div>
      </div>
    `;
  }

  const full = field.type === "textarea" ? " full" : "";
  const input = field.type === "textarea"
    ? `<textarea data-path="${path}">${escapeHtml(value || "")}</textarea>`
    : `<input data-path="${path}" type="${field.type === "number" ? "number" : "text"}" value="${escapeHtml(value ?? "")}" ${field.required === false ? "" : "required"} />`;

  return `<div class="field${full}"><label>${label}</label>${input}</div>`;
}

function renderListItem(field, data, path, item, index) {
  const itemPath = `${path}.${index}`;
  const body = Array.isArray(field.item)
    ? `<div class="object-grid">${field.item.map((child) => renderField(child, data, `${itemPath}.${child.name}`)).join("")}</div>`
    : renderField({ ...field.item, label: field.item.label || field.label, name: index }, { [index]: item }, String(index)).replaceAll(`data-path="${index}"`, `data-path="${itemPath}"`);

  return `
    <div class="list-item">
      <div class="list-item-header">
        <strong>${escapeHtml(summaryForItem(item, index))}</strong>
        <button class="button danger small" type="button" data-remove-list="${path}" data-index="${index}">删除</button>
      </div>
      ${body}
    </div>
  `;
}

function summaryForItem(item, index) {
  if (typeof item === "string") return item || `第 ${index + 1} 项`;
  return item?.title || item?.label || item?.caption || item?.value || `第 ${index + 1} 项`;
}

function schemaAt(path) {
  const root = state.section === "products" && state.productOriginalSlug ? productSchema : pageSchemas[state.pageKey];
  const parts = path.split(".");
  let fields = root;
  let current;

  for (const part of parts) {
    if (/^\d+$/.test(part)) continue;
    current = fields.find((item) => item.name === part);
    if (!current) return null;
    if (current.type === "object") fields = current.fields;
    if (current.type === "list") fields = Array.isArray(current.item) ? current.item : [current.item];
  }

  return current;
}

async function ensureProducts(force = false) {
  if (!force && state.products.length) return state.products;
  state.products = (await api("/api/products")).products || [];
  return state.products;
}

function newProduct() {
  const index = state.products.length + 1;
  return {
    order: index,
    title: "New Product",
    slug: `new-product-${index}`,
    icon: "NP",
    category: "Fixed Restorations",
    short_description: "",
    description: "",
    card_image: "",
    card_alt: "",
    tags: [],
    gallery: [],
    details: [],
    related_products: [],
    inquiry: {
      title: "Request quotation support.",
      description: "Send material, shade, quantity, case files and delivery requirements. Our team will reply by email or WhatsApp.",
      quantity_placeholder: "Example: 12 zirconia crowns",
      message_placeholder: "Material, shade, delivery date or special notes"
    },
    seo: {
      title: "New Product | MEIJIA DENTAL",
      description: ""
    }
  };
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1800;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    name: file.name.replace(/\.[^.]+$/, ".jpg"),
    base64,
    originalBytes: file.size,
    compressedBytes: blob.size
  };
}

async function uploadFile(file) {
  toast("正在压缩并上传图片...");
  const compressed = await compressImage(file);
  const result = await api("/api/uploads", {
    method: "POST",
    body: JSON.stringify({ name: compressed.name, base64: compressed.base64 })
  });
  toast(`上传完成，已从 ${formatBytes(compressed.originalBytes)} 压缩到 ${formatBytes(compressed.compressedBytes)}`);
  return result.image.path;
}

function formatBytes(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

async function render() {
  if (!state.user) {
    renderLogin();
    return;
  }

  if (state.section === "dashboard") return renderDashboard();
  if (state.section === "analytics") return renderAnalytics();
  if (state.section === "pages") return renderPages();
  if (state.section === "products") return renderProducts();
  if (state.section === "users") return renderUsers();
  if (state.section === "logs") return renderLogs();
  if (state.section === "account") return renderAccount();
}

async function init() {
  try {
    const session = await api("/api/auth/session");
    state.user = session.user;
    state.roles = session.roles || {};
  } catch {
    state.user = null;
  }
  await render();
}

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const kind = form.dataset.form;
  const values = Object.fromEntries(new FormData(form));

  try {
    if (kind === "login") {
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
      state.user = result.user;
      state.formData = null;
      state.formDataPage = "";
      toast("登录成功");
    }
    if (kind === "setup") {
      await api("/api/setup/init", { method: "POST", body: JSON.stringify(values) });
      state.setupMode = false;
      toast("超级管理员已创建，请登录。");
    }
    if (kind === "page") {
      await api(pageMeta[state.pageKey].endpoint, { method: "PUT", body: JSON.stringify({ data: state.formData }) });
      toast("页面内容已保存，Cloudflare 会自动重新部署。");
    }
    if (kind === "product") {
      const method = state.productOriginalSlug === "__new__" ? "POST" : "PUT";
      const url = state.productOriginalSlug === "__new__" ? "/api/products" : `/api/products/${state.productOriginalSlug}`;
      await api(url, { method, body: JSON.stringify({ product: state.formData }) });
      state.productOriginalSlug = "";
      await ensureProducts(true);
      toast("产品已保存，Cloudflare 会自动重新部署。");
    }
    if (kind === "create-user") {
      await api("/api/users", { method: "POST", body: JSON.stringify(values) });
      toast("用户已创建。");
    }
    if (kind === "password") {
      await api("/api/auth/password", { method: "POST", body: JSON.stringify(values) });
      form.reset();
      toast("密码已修改。");
    }
    await render();
  } catch (error) {
    toast(error.message, true);
  }
});

app.addEventListener("input", (event) => {
  const input = event.target.closest("[data-path]");
  if (!input || !state.formData) return;
  const value = input.type === "number" ? Number(input.value) : input.value;
  setPath(state.formData, input.dataset.path, value);
});

app.addEventListener("change", async (event) => {
  const relation = event.target.closest("[data-relation-path]");
  if (relation) {
    const path = relation.dataset.relationPath;
    const checked = [...app.querySelectorAll(`[data-relation-path="${CSS.escape(path)}"]:checked`)].map((item) => item.value);
    setPath(state.formData, path, checked);
    return;
  }

  const roleSelectEl = event.target.closest("[data-user-role]");
  if (roleSelectEl) {
    try {
      await api(`/api/users/${roleSelectEl.dataset.userRole}`, {
        method: "PATCH",
        body: JSON.stringify({ role: roleSelectEl.value })
      });
      toast("角色已更新。");
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }

  const fileInput = event.target.closest("[data-file-path]");
  if (fileInput?.files?.[0]) {
    try {
      const path = await uploadFile(fileInput.files[0]);
      setPath(state.formData, fileInput.dataset.filePath, path);
      await render();
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }

});

app.addEventListener("click", async (event) => {
  const sectionButton = event.target.closest("[data-section]");
  const action = event.target.closest("[data-action]")?.dataset.action;

  try {
    if (sectionButton) {
      const nextSection = sectionButton.dataset.section;
      if (nextSection !== state.section) {
        state.formData = null;
        state.formDataPage = "";
      }
      state.section = nextSection;
      state.productOriginalSlug = "";
      await render();
      return;
    }

    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      state.pageKey = pageButton.dataset.page;
      state.formData = null;
      state.formDataPage = "";
      await renderPages();
      return;
    }

    const analyticsRange = event.target.closest("[data-analytics-range]");
    if (analyticsRange) {
      state.analyticsRange = Number(analyticsRange.dataset.analyticsRange) === 30 ? 30 : 7;
      await renderAnalytics();
      return;
    }

    const addList = event.target.closest("[data-add-list]");
    if (addList) {
      const path = addList.dataset.addList;
      const field = schemaAt(path);
      const list = getPath(state.formData, path) || [];
      list.push(defaultValue(field.item));
      setPath(state.formData, path, list);
      await render();
      return;
    }

    const removeList = event.target.closest("[data-remove-list]");
    if (removeList) {
      const path = removeList.dataset.removeList;
      const list = getPath(state.formData, path) || [];
      list.splice(Number(removeList.dataset.index), 1);
      setPath(state.formData, path, list);
      await render();
      return;
    }

    const editProduct = event.target.closest("[data-edit-product]");
    if (editProduct) {
      await ensureProducts(true);
      state.formData = structuredClone(state.products.find((product) => product.slug === editProduct.dataset.editProduct));
      state.productOriginalSlug = state.formData.slug;
      await renderProductEditor();
      return;
    }

    const toggleUser = event.target.closest("[data-toggle-user]");
    if (toggleUser) {
      await api(`/api/users/${toggleUser.dataset.toggleUser}`, {
        method: "PATCH",
        body: JSON.stringify({ active: toggleUser.dataset.active === "1" })
      });
      toast("用户状态已更新。");
      await renderUsers();
      return;
    }

    const resetUser = event.target.closest("[data-reset-user]");
    if (resetUser) {
      const password = window.prompt("请输入这个用户的新密码，至少 8 位：");
      if (password && password.length >= 8) {
        await api(`/api/users/${resetUser.dataset.resetUser}`, {
          method: "PATCH",
          body: JSON.stringify({ password })
        });
        toast("密码已重置。");
      } else if (password) {
        toast("新密码至少需要 8 位。", true);
      }
      return;
    }

    const deleteUser = event.target.closest("[data-delete-user]");
    if (deleteUser) {
      if (window.confirm("确定删除这个用户吗？删除后不能恢复。")) {
        await api(`/api/users/${deleteUser.dataset.deleteUser}`, { method: "DELETE" });
        toast("用户已删除。");
        await renderUsers();
      }
      return;
    }

    if (action === "toggle-setup") {
      state.setupMode = !state.setupMode;
      renderLogin();
      return;
    }
    if (action === "logout") {
      await api("/api/auth/logout", { method: "POST" });
      state.user = null;
      toast("已退出。");
      renderLogin();
      return;
    }
    if (action === "new-product") {
      state.formData = newProduct();
      state.productOriginalSlug = "__new__";
      await renderProductEditor();
      return;
    }
    if (action === "back-products") {
      state.productOriginalSlug = "";
      await renderProducts();
      return;
    }
    if (action === "delete-product") {
      if (window.confirm("确定删除这个产品吗？删除后会触发重新部署。")) {
        await api(`/api/products/${state.productOriginalSlug}`, { method: "DELETE" });
        state.productOriginalSlug = "";
        await ensureProducts(true);
        toast("产品已删除。");
        await renderProducts();
      }
    }
  } catch (error) {
    toast(error.message, true);
  }
});

init();
