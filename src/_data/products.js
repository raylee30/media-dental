import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export default function () {
  const productsDir = join(process.cwd(), "src/products");

  if (!existsSync(productsDir)) {
    return [];
  }

  return readdirSync(productsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const product = JSON.parse(readFileSync(join(productsDir, file), "utf8"));

      return {
        ...product,
        url: `/${product.slug}`
      };
    })
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}
