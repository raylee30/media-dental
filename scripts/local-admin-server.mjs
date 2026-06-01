import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { promisify } from "node:util";
import { normalizeAnalyticsEvent, summarizeAnalytics } from "../functions/_lib/analytics.js";
import { hashPassword, randomId, randomToken, verifyPassword } from "../functions/_lib/security.js";

const root = process.cwd();
const siteDir = join(root, "_site");
const dbPath = join(root, ".local-admin-db.json");
const port = Number(process.env.PORT || 8024);
const execFileAsync = promisify(execFile);
let buildQueue = Promise.resolve();

const roles = {
  admin: {
    label: "超级管理员",
    permissions: ["pages", "products", "uploads", "users", "logs", "analytics"]
  },
  editor: {
    label: "内容管理员",
    permissions: ["pages", "products", "uploads", "logs", "analytics"]
  },
  product_editor: {
    label: "产品编辑",
    permissions: ["products", "uploads"]
  }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function json(response, status = 200) {
  return {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(response, null, 2)
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    roleLabel: roles[user.role]?.label || user.role,
    permissions: roles[user.role]?.permissions || [],
    active: Boolean(user.active),
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

async function loadDb() {
  if (!existsSync(dbPath)) {
    const now = new Date().toISOString();
    const admin = {
      id: "usr_local_admin",
      username: "admin",
      email: "admin@local.test",
      name: "临时管理员",
      role: "admin",
      active: true,
      password_hash: await hashPassword("admin"),
      created_at: now,
      updated_at: now
    };

    writeFileSync(dbPath, JSON.stringify({ users: [admin], sessions: [], logs: [], analytics_events: [] }, null, 2));
  }

  const db = JSON.parse(readFileSync(dbPath, "utf8"));
  db.users ||= [];
  db.sessions ||= [];
  db.logs ||= [];
  db.analytics_events ||= [];
  return db;
}

function saveDb(db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function parseCookies(request) {
  const cookie = request.headers.cookie || "";
  return Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

async function requestJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function getUser(request, db) {
  const token = parseCookies(request).mj_admin_session;
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token && item.expires_at > Date.now());
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.user_id && item.active);
  return user || null;
}

function can(user, permission) {
  return Boolean(roles[user?.role]?.permissions.includes(permission));
}

function requirePermission(user, permission) {
  if (!user) return json({ ok: false, error: "Please log in first." }, 401);
  if (!can(user, permission)) return json({ ok: false, error: "You do not have permission for this action." }, 403);
  return null;
}

function audit(db, user, action, targetType, targetId = "", details = "") {
  db.logs.unshift({
    id: randomId("log_"),
    username: user?.username || "",
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    created_at: new Date().toISOString()
  });
  db.logs = db.logs.slice(0, 120);
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function writeJsonFile(path, data) {
  writeFileSync(join(root, path), `${JSON.stringify(data, null, 2)}\n`);
}

async function rebuildSite() {
  buildQueue = buildQueue.then(async () => {
    console.log("Rebuilding static site...");
    await execFileAsync("npm", ["run", "build"], { cwd: root });
  });

  return buildQueue;
}

function productPath(slug) {
  return `src/products/${slug}.json`;
}

function listProducts() {
  return readdirSync(join(root, "src/products"))
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJsonFile(`src/products/${name}`))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

function routeContentPage(page) {
  return {
    home: "src/_data/home.json",
    about: "src/_data/aboutPage.json",
    productsPage: "src/_data/productsPage.json"
  }[page];
}

function safeUploadName(name) {
  const extension = (name.includes(".") ? name.split(".").pop() : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${Date.now()}-${base || "image"}.${extension}`;
}

async function handleApi(request, url) {
  const db = await loadDb();
  const user = await getUser(request, db);
  const method = request.method;
  const path = url.pathname;

  if (path === "/api/analytics/track" && method === "POST") {
    const body = await requestJson(request);
    const event = normalizeAnalyticsEvent(body, {
      id: randomId("evt_"),
      ip: request.socket.remoteAddress || "127.0.0.1",
      userAgent: request.headers["user-agent"] || "",
      country: "Local"
    });
    db.analytics_events.push(event);
    db.analytics_events = db.analytics_events.slice(-20000);
    saveDb(db);
    return json({ ok: true });
  }

  if (path === "/api/analytics/pixel" && method === "GET") {
    const event = normalizeAnalyticsEvent(Object.fromEntries(url.searchParams.entries()), {
      id: randomId("evt_"),
      ip: request.socket.remoteAddress || "127.0.0.1",
      userAgent: request.headers["user-agent"] || "",
      country: "Local"
    });
    db.analytics_events.push(event);
    db.analytics_events = db.analytics_events.slice(-20000);
    saveDb(db);
    return {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store"
      },
      body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    };
  }

  if (path === "/api/auth/session" && method === "GET") {
    return json({ ok: true, user: publicUser(user), roles });
  }

  if (path === "/api/auth/login" && method === "POST") {
    const body = await requestJson(request);
    const found = db.users.find((item) => item.username === body.username || item.email === body.username);
    if (!found || !found.active || !(await verifyPassword(String(body.password || ""), found.password_hash))) {
      return json({ ok: false, error: "Incorrect username or password." }, 401);
    }
    const token = randomToken();
    db.sessions.push({ token, user_id: found.id, expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    audit(db, found, "login", "account", found.id);
    saveDb(db);
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": `mj_admin_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
      },
      body: JSON.stringify({ ok: true, user: publicUser(found) })
    };
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const token = parseCookies(request).mj_admin_session;
    db.sessions = db.sessions.filter((session) => session.token !== token);
    if (user) audit(db, user, "logout", "account", user.id);
    saveDb(db);
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": "mj_admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
      },
      body: JSON.stringify({ ok: true })
    };
  }

  if (path === "/api/auth/password" && method === "POST") {
    if (!user) return json({ ok: false, error: "Please log in first." }, 401);
    const body = await requestJson(request);
    if (!(await verifyPassword(String(body.currentPassword || ""), user.password_hash))) {
      return json({ ok: false, error: "Current password is incorrect." }, 401);
    }
    if (!body.newPassword || String(body.newPassword).length < 8) {
      return json({ ok: false, error: "New password must be at least 8 characters." }, 400);
    }
    user.password_hash = await hashPassword(String(body.newPassword));
    user.updated_at = new Date().toISOString();
    audit(db, user, "change_password", "account", user.id);
    saveDb(db);
    return json({ ok: true });
  }

  if (path === "/api/logs" && method === "GET") {
    const denied = requirePermission(user, "logs");
    if (denied) return denied;
    return json({ ok: true, logs: db.logs.slice(0, 80) });
  }

  if (path === "/api/analytics/summary" && method === "GET") {
    const denied = requirePermission(user, "analytics");
    if (denied) return denied;
    const range = Number(url.searchParams.get("range")) === 30 ? 30 : 7;
    return json({ ok: true, summary: summarizeAnalytics(db.analytics_events || [], { range }) });
  }

  if (path === "/api/users" && method === "GET") {
    const denied = requirePermission(user, "users");
    if (denied) return denied;
    return json({ ok: true, users: db.users.map(publicUser) });
  }

  if (path === "/api/users" && method === "POST") {
    const denied = requirePermission(user, "users");
    if (denied) return denied;
    const body = await requestJson(request);
    const username = String(body.username || "").trim();
    const email = body.email ? String(body.email).trim() : `${username}@local.admin`;
    if (!username || !body.password) {
      return json({ ok: false, error: "Username and password are required." }, 400);
    }
    if (db.users.some((item) => item.username === username || item.email === email)) {
      return json({ ok: false, error: "This username already exists." }, 409);
    }
    const now = new Date().toISOString();
    const newUser = {
      id: randomId("usr_"),
      username,
      email,
      name: username,
      role: body.role || "editor",
      active: true,
      password_hash: await hashPassword(String(body.password || "")),
      created_at: now,
      updated_at: now
    };
    db.users.push(newUser);
    audit(db, user, "create_user", "user", newUser.id, newUser.username);
    saveDb(db);
    return json({ ok: true, user: publicUser(newUser) });
  }

  if (path.startsWith("/api/users/") && method === "PATCH") {
    const denied = requirePermission(user, "users");
    if (denied) return denied;
    const id = decodeURIComponent(path.split("/").pop());
    const target = db.users.find((item) => item.id === id);
    if (!target) return json({ ok: false, error: "User not found." }, 404);
    const body = await requestJson(request);
    if (body.name !== undefined) target.name = String(body.name).trim();
    if (body.email !== undefined) target.email = String(body.email).trim();
    if (body.role !== undefined) target.role = String(body.role);
    if (body.active !== undefined) target.active = Boolean(body.active);
    if (body.password) target.password_hash = await hashPassword(String(body.password));
    target.updated_at = new Date().toISOString();
    audit(db, user, "update_user", "user", target.id, target.username);
    saveDb(db);
    return json({ ok: true, user: publicUser(target) });
  }

  if (path.startsWith("/api/users/") && method === "DELETE") {
    const denied = requirePermission(user, "users");
    if (denied) return denied;
    const id = decodeURIComponent(path.split("/").pop());
    const index = db.users.findIndex((item) => item.id === id);
    if (index < 0) return json({ ok: false, error: "User not found." }, 404);
    if (id === user.id) return json({ ok: false, error: "You cannot delete your own account." }, 400);
    const [target] = db.users.splice(index, 1);
    db.sessions = db.sessions.filter((session) => session.user_id !== id);
    audit(db, user, "delete_user", "user", id, target.username);
    saveDb(db);
    return json({ ok: true });
  }

  if (path.startsWith("/api/content/")) {
    const denied = requirePermission(user, "pages");
    if (denied) return denied;
    const page = decodeURIComponent(path.split("/").pop());
    const file = routeContentPage(page);
    if (!file) return json({ ok: false, error: "Unknown content page." }, 404);
    if (method === "GET") return json({ ok: true, page, data: readJsonFile(file) });
    if (method === "PUT") {
      const body = await requestJson(request);
      writeJsonFile(file, body.data);
      audit(db, user, "update_page", "page", page);
      saveDb(db);
      await rebuildSite();
      return json({ ok: true });
    }
  }

  if (path === "/api/products" && method === "GET") {
    const denied = requirePermission(user, "products");
    if (denied) return denied;
    return json({ ok: true, products: listProducts() });
  }

  if (path === "/api/products" && method === "POST") {
    const denied = requirePermission(user, "products");
    if (denied) return denied;
    const body = await requestJson(request);
    writeJsonFile(productPath(body.product.slug), body.product);
    audit(db, user, "create_product", "product", body.product.slug, body.product.title);
    saveDb(db);
    await rebuildSite();
    return json({ ok: true, product: body.product });
  }

  if (path.startsWith("/api/products/")) {
    const denied = requirePermission(user, "products");
    if (denied) return denied;
    const slug = decodeURIComponent(path.split("/").pop());
    if (method === "GET") return json({ ok: true, product: readJsonFile(productPath(slug)) });
    if (method === "PUT") {
      const body = await requestJson(request);
      writeJsonFile(productPath(body.product.slug), body.product);
      audit(db, user, "update_product", "product", body.product.slug, body.product.title);
      saveDb(db);
      await rebuildSite();
      return json({ ok: true, product: body.product });
    }
    if (method === "DELETE") {
      return json({ ok: false, error: "Local preview does not delete product files." }, 400);
    }
  }

  if (path === "/api/uploads" && method === "GET") {
    const denied = requirePermission(user, "uploads");
    if (denied) return denied;
    const uploadDir = join(root, "src/assets/uploads");
    const images = existsSync(uploadDir)
      ? readdirSync(uploadDir)
          .filter((name) => !name.startsWith("."))
          .map((name) => ({ name, path: `/assets/uploads/${name}`, size: statSync(join(uploadDir, name)).size }))
      : [];
    return json({ ok: true, images });
  }

  if (path === "/api/uploads" && method === "POST") {
    const denied = requirePermission(user, "uploads");
    if (denied) return denied;
    const body = await requestJson(request);
    const name = safeUploadName(body.name || "image.jpg");
    const uploadDir = join(root, "src/assets/uploads");
    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(join(uploadDir, name), Buffer.from(String(body.base64 || "").replace(/^data:[^;]+;base64,/, ""), "base64"));
    audit(db, user, "upload_image", "image", `/assets/uploads/${name}`, body.name || name);
    saveDb(db);
    await rebuildSite();
    return json({ ok: true, image: { name, path: `/assets/uploads/${name}` } });
  }

  return json({ ok: false, error: "Not found." }, 404);
}

function staticFilePath(urlPath) {
  let pathname = decodeURIComponent(urlPath);
  if (pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const file = join(siteDir, normalized);
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (pathname.startsWith("/assets/uploads/")) {
    const uploadFile = join(root, "src", pathname);
    if (existsSync(uploadFile) && statSync(uploadFile).isFile()) return uploadFile;
  }
  const notFound = join(siteDir, "404.html");
  return existsSync(notFound) ? notFound : join(siteDir, "index.html");
}

function send(res, result) {
  res.writeHead(result.status, result.headers);
  res.end(result.body);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith("/api/")) {
      send(res, await handleApi(req, url));
      return;
    }

    const file = staticFilePath(url.pathname);
    const extension = extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    res.end(readFileSync(file));
  } catch (error) {
    send(res, json({ ok: false, error: error.message || "Local server error." }, 500));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local admin preview: http://127.0.0.1:${port}/admin/`);
  console.log("Temporary login: admin / admin");
});
