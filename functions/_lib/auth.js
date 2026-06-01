import { clientIp, error, getCookie } from "./http.js";
import { randomId, randomToken, sha256 } from "./security.js";

export const SESSION_COOKIE = "mj_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const ROLES = {
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

export function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    roleLabel: ROLES[user.role]?.label || user.role,
    permissions: ROLES[user.role]?.permissions || [],
    active: Boolean(user.active),
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export async function createSession(env, userId) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const sessionId = randomId("sess_");
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
  )
    .bind(sessionId, userId, tokenHash, expiresAt)
    .run();

  return {
    token,
    cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`
  };
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getSessionUser(env, request) {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT sessions.id AS session_id, sessions.expires_at, users.*
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  if (!row || row.expires_at < Date.now() || !row.active) {
    return null;
  }

  await env.DB.prepare("UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(row.session_id)
    .run();

  return row;
}

export async function requireUser(context) {
  const user = await getSessionUser(context.env, context.request);

  if (!user) {
    throw error("Please log in first.", 401);
  }

  return user;
}

export function hasPermission(user, permission) {
  return Boolean(ROLES[user.role]?.permissions.includes(permission));
}

export function requirePermission(user, permission) {
  if (!hasPermission(user, permission)) {
    throw error("You do not have permission for this action.", 403);
  }
}

export async function audit(env, request, user, action, targetType, targetId = "", details = "") {
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, user_id, username, action, target_type, target_id, details, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      randomId("log_"),
      user?.id || "",
      user?.username || "",
      action,
      targetType,
      targetId,
      typeof details === "string" ? details : JSON.stringify(details),
      request ? clientIp(request) : ""
    )
    .run();
}
