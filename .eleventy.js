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
    "src/_routes.json",
    "src/styles.css",
    "src/script.js"
  ];

  passthroughPaths.forEach((path) => {
    if (existsSync(path)) {
      eleventyConfig.addPassthroughCopy(path);
    }
  });

  eleventyConfig.ignores.add("src/admin/**/*.html");

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
}
