import { audit, requirePermission, requireUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { getJsonFile, putJsonFile } from "../../_lib/github.js";

const CONTENT_FILES = {
  home: "src/_data/home.json",
  about: "src/_data/aboutPage.json",
  productsPage: "src/_data/productsPage.json"
};

const CONTENT_LABELS = {
  home: "首页",
  about: "About 页面",
  productsPage: "Products 页面"
};

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "pages");

    const page = context.params.page;
    const path = CONTENT_FILES[page];

    if (!path) {
      return error("Unknown content page.", 404);
    }

    return json({ ok: true, page, label: CONTENT_LABELS[page], data: await getJsonFile(context.env, path) });
  });
}

export async function onRequestPut(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "pages");

    const page = context.params.page;
    const path = CONTENT_FILES[page];

    if (!path) {
      return error("Unknown content page.", 404);
    }

    const body = await readJson(context.request);
    if (!body.data || typeof body.data !== "object") {
      return error("Page data is required.", 400);
    }

    await putJsonFile(context.env, path, body.data, `Update ${CONTENT_LABELS[page]} from custom admin`);
    await audit(context.env, context.request, user, "update_page", "page", page, `Updated ${CONTENT_LABELS[page]}`);

    return json({ ok: true });
  });
}
