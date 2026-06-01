import { audit, requirePermission, requireUser } from "../../_lib/auth.js";
import { deleteFile, getJsonFile, putJsonFile } from "../../_lib/github.js";
import { error, handle, json, readJson } from "../../_lib/http.js";

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

    const slug = context.params.slug;
    if (!validSlug(slug)) {
      return error("Invalid product slug.", 400);
    }

    const product = await getJsonFile(context.env, productPath(slug));
    if (!product) {
      return error("Product not found.", 404);
    }

    return json({ ok: true, product });
  });
}

export async function onRequestPut(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "products");

    const currentSlug = context.params.slug;
    const body = await readJson(context.request);
    const product = body.product;

    if (!validSlug(currentSlug) || !product || !validSlug(product.slug)) {
      return error("A valid product slug is required.", 400);
    }

    await putJsonFile(context.env, productPath(product.slug), product, `Update product ${product.title || product.slug}`);

    if (product.slug !== currentSlug) {
      await deleteFile(context.env, productPath(currentSlug), `Remove old product slug ${currentSlug}`);
    }

    await audit(context.env, context.request, user, "update_product", "product", product.slug, product.title || product.slug);

    return json({ ok: true, product });
  });
}

export async function onRequestDelete(context) {
  return handle(async () => {
    const user = await requireUser(context);
    requirePermission(user, "products");

    const slug = context.params.slug;
    if (!validSlug(slug)) {
      return error("Invalid product slug.", 400);
    }

    await deleteFile(context.env, productPath(slug), `Delete product ${slug}`);
    await audit(context.env, context.request, user, "delete_product", "product", slug);

    return json({ ok: true });
  });
}
