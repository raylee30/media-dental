import { getSessionUser, publicUser, ROLES } from "../../_lib/auth.js";
import { handle, json } from "../../_lib/http.js";

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await getSessionUser(context.env, context.request);
    return json({ ok: true, user: publicUser(user), roles: ROLES });
  });
}
