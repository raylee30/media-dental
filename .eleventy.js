import { existsSync } from "node:fs";

export default function (eleventyConfig) {
  const passthroughPaths = [
    "src/admin",
    "src/assets",
    "src/images",
    "src/css",
    "src/js",
    "src/fonts",
    "src/_headers",
    "src/robots.txt",
    "src/styles.css",
    "src/script.js"
  ];

  passthroughPaths.forEach((path) => {
    if (existsSync(path)) {
      eleventyConfig.addPassthroughCopy(path);
    }
  });

  eleventyConfig.ignores.add("src/admin/**/*.html");
  eleventyConfig.addFilter("cleanUrl", (url) => {
    if (url === "/index.html") return "/";
    return url.replace(/\.html$/, "");
  });

  const resourceFiles = "./src/resources/*.md";
  eleventyConfig.addPreprocessor("resourceDrafts", "md", (data) => {
    if (process.env.ELEVENTY_RUN_MODE === "build"
      && data.navSection === "resources"
      && data.draft !== false) {
      return false;
    }
  });
  eleventyConfig.addCollection("publishedResources", (collection) => collection
    .getFilteredByGlob(resourceFiles)
    .filter(({ data }) => data.draft === false)
    .sort((first, second) => second.date - first.date || first.url.localeCompare(second.url)));

  const resourceDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
  eleventyConfig.addFilter("resourceDate", (date) => resourceDate.format(date));
  eleventyConfig.addFilter("isoDate", (date) => date.toISOString().slice(0, 10));
  eleventyConfig.addFilter("resourcesForProduct", (resources, slug) => resources
    .filter(({ data }) => data.related_products?.includes(slug)));
  eleventyConfig.addFilter("productsForResource", (products, slugs = []) => products
    .filter(({ slug }) => slugs.includes(slug)));

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false
  };
}
