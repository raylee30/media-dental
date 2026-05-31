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
