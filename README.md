# MEIJIA DENTAL 11ty + Sveltia CMS

This version keeps the existing visual design and moves editable content into CMS-friendly data files.

- Home page content: `src/_data/home.json`
- Product content: `src/products/*.json`
- Product list page: `src/products.html`
- Product detail template: `src/product.njk`
- Resource articles: `src/resources/*.md`
- CMS config: `src/admin/config.yml`

Editors can use `/admin/` to update page content, products and articles without editing HTML.

## Local Development

```bash
npm install
npm run dev
```

Open:

- Website: `http://localhost:8080`
- CMS: `http://localhost:8080/admin/`

For local CMS editing, use Chrome or another Chromium-based browser at `http://localhost:8080/admin/index.html`. Choose **Work with Local Repository**, then select the project folder the first time. The CMS saves article text and pasted images to the selected local repository, so no CMS proxy process is needed. This local workflow is not supported in Safari or Firefox.

## Resources

Open **文章管理** in `/admin/` to create an English article under **材料与产品** or **公司介绍**. The initial title determines the article URL. The date controls display order. Select **关联产品** to link the article with product pages in both directions. The article editor accepts formatted text from web pages and Word, with a raw Markdown mode for source editing. Paste images directly into the editor to upload them into the website and insert them in the article.

Keep **草稿** enabled while editing, then choose **保存**. Use the CMS preview pane to review the text layout, or open its `/resources/<slug>/` URL on the local development server. Turn **草稿** off and save again to publish on the next production build. Turning it back on removes the article page, its links and its sitemap entry from that build. Article content is text and Markdown stored in the repository.

## Cloudflare Pages

Build command:

```bash
npm run build
```

Build output directory:

```bash
_site
```

## Search visibility

The build creates `/sitemap.xml` from the main pages, products and published articles. It also copies `src/robots.txt` into the output. Public pages use the clean Cloudflare Pages URLs as their canonical addresses; `/admin/` is marked `noindex`.

After deploying to the production domain, check that `/sitemap.xml` returns XML and `/robots.txt` returns plain text. In Google Search Console, verify ownership of `https://www.mjsmiles.com`, submit `https://www.mjsmiles.com/sitemap.xml`, and inspect the homepage and a product URL for indexing errors. Search Console verification requires access to the site's DNS or deployed files.

If the production domain changes, update both `src/_data/site.json` and the sitemap address in `src/robots.txt` before building.

## GitHub OAuth

Create a GitHub OAuth App and set the callback URL to:

```text
https://www.mjsmiles.com/oauth/callback
```

Then add these Cloudflare Pages environment variables:

```text
OAUTH_GITHUB_CLIENT_ID=your_github_oauth_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
OAUTH_GITHUB_SCOPE=repo
```

For a public-only repository, you may use `public_repo` instead of `repo`.
