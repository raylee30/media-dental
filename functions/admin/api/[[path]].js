const apiPrefix = "/admin/api";
const additionsOrigin = "https://cms-auth.mjsmiles.com";

export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const path = incoming.pathname.slice(apiPrefix.length);

  if (path !== "/version" && !path.startsWith("/v1/")) {
    return new Response(null, { status: 404 });
  }

  const upstream = new URL(additionsOrigin);
  upstream.pathname = path;
  upstream.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete("Cookie");
  headers.delete("Host");

  // Preserve the client IP for the Additions rate limiter on same-zone subrequests.
  headers.delete("X-Real-IP");
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) headers.set("X-Real-IP", clientIp);

  const response = await fetch(new Request(upstream, request), {
    headers,
    redirect: "manual"
  });

  if (response.status === 101) return response;

  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "no-store");
  return result;
}
