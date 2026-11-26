import { basename } from "node:path";

export default function () {
  return {
    layout: "resource.njk",
    navSection: "resources",
    permalink: ({ page }) => `/resources/${basename(page.inputPath, ".md")}/index.html`
  };
}
