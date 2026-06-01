import { audit, requirePermission, requireUser } from "../_lib/auth.js";
import { listDirectory, putBase64File } from "../_lib/github.js";
import { error, handle, json, readJson } from "../_lib/http.js";

const MAX_BYTES = 4 * 1024 * 1024;

function safeFileName(name) {
  const dot = name.includes(".") ? name.split(".").pop().toLowerCase() : "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${Date.now()}-${base || "image"}.${dot}`;
}

function base64ByteLength(base64) {
  const clean = base64.replace(/\s/g, "");
  return Math.floor((clean.length * 3) / 4);
}

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "uploads");

    const files = await listDirectory(context.env, "src/assets/uploads");
    const images = files
      .filter((file) => file.type === "file")
      .map((file) => ({
        name: file.name,
        path: `/assets/uploads/${file.name}`,
        size: file.size || 0
      }))
      .sort((a, b) => b.name.localeCompare(a.name));

    return json({ ok: true, images });
  });
}

export async function onRequestPost(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "uploads");

    const body = await readJson(context.request);
    const name = body.name || "image.jpg";
    const base64 = String(body.base64 || "").replace(/^data:[^;]+;base64,/, "");

    if (!base64) {
      return error("Image content is required.", 400);
    }

    if (base64ByteLength(base64) > MAX_BYTES) {
      return error("Compressed image is too large. Please use an image under 4MB.", 400);
    }

    const fileName = safeFileName(name);
    const repoPath = `src/assets/uploads/${fileName}`;
    const publicPath = `/assets/uploads/${fileName}`;

    await putBase64File(context.env, repoPath, base64, `Upload image ${fileName}`);
    await audit(context.env, context.request, user, "upload_image", "image", publicPath, `${name} -> ${publicPath}`);

    return json({ ok: true, image: { name: fileName, path: publicPath } });
  });
}
