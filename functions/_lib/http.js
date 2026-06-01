export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ ok: false, error: message, ...extra }, { status });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Response(JSON.stringify({ ok: false, error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
}

export async function handle(action) {
  try {
    return await action();
  } catch (caught) {
    if (caught instanceof Response) {
      return caught;
    }

    return error(caught?.message || "Unexpected server error.", 500);
  }
}
