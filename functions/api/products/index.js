import { audit, requirePermission, requireUser } from "../../_lib/auth.js";
import { error, handle, json, readJson } from "../../_lib/http.js";
import { getJsonFile, listJsonFiles, putJsonFile } from "../../_lib/github.js";

function productPath(slug) {
  return `src/products/${slug}.json`;
}

function validSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || "");
}

export async function onRequestGet(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "products");

    const products = await listJsonFiles(context.env, "src/products");
    products.sort((a, b) => (a.order || 999) - (b.order || 999));

    return json({ ok: true, products });
  });
}

export async function onRequestPost(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "products");

    const body = await readJson(context.request);
    const product = body.product;

    if (!product || !validSlug(product.slug)) {
      return error("A valid product slug is required.", 400);
    }

    const existing = await getJsonFile(context.env, productPath(product.slug));
    if (existing) {
      return error("A product with this slug already exists.", 409);
    }

    await putJsonFile(context.env, productPath(product.slug), product, `Create product ${product.title || product.slug}`);
    await audit(context.env, context.request, user, "create_product", "product", product.slug, product.title || product.slug);

    return json({ ok: true, product });
  });
}
