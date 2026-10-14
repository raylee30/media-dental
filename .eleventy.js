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
