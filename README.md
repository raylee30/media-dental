# MEIJIA DENTAL 11ty + Decap CMS

This version keeps the existing visual design and moves editable content into CMS-friendly data files.

- Home page content: `src/_data/home.json`
- Product content: `src/products/*.json`
- Product list page: `src/products.html`
- Product detail template: `src/product.njk`
- CMS config: `src/admin/config.yml`

Editors can use `/admin/` to update the home page and add or edit products without touching HTML.

## Local Development

```bash
npm install
npm run dev
```

Open:

- Website: `http://localhost:8080`
- CMS: `http://localhost:8080/admin/`

For local CMS editing, run Decap's local backend in a second terminal:

```bash
npx decap-server
```

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

The build creates `/sitemap.xml` from the three main pages and every product in `src/products/*.json`. It also copies `src/robots.txt` into the output. Public pages use the clean Cloudflare Pages URLs as their canonical addresses; `/admin/` is marked `noindex`.

After deploying to the production domain, check that `/sitemap.xml` returns XML and `/robots.txt` returns plain text. In Google Search Console, verify ownership of `https://www.mjsmiles.com`, submit `https://www.mjsmiles.com/sitemap.xml`, and inspect the homepage and a product URL for indexing errors. Search Console verification requires access to the site's DNS or deployed files.

If the production domain changes, update both `src/_data/site.json` and the sitemap address in `src/robots.txt` before building.

## GitHub OAuth

Create a GitHub OAuth App and set the callback URL to:

```text
https://YOUR-CLOUDFLARE-PAGES-DOMAIN.pages.dev/oauth/callback
```

Then add these Cloudflare Pages environment variables:

```text
OAUTH_GITHUB_CLIENT_ID=your_github_oauth_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
OAUTH_GITHUB_SCOPE=repo
```

For a public-only repository, you may use `public_repo` instead of `repo`.
