# MEIJIA DENTAL 11ty Website + Custom Admin

This project keeps the public website as a fast 11ty static site and replaces Decap CMS with a custom Chinese admin system.

## Editable Content

- Home page: `src/_data/home.json`
- About page: `src/_data/aboutPage.json`
- Products page: `src/_data/productsPage.json`
- Product detail pages: `src/products/*.json`
- Admin app: `src/admin`
- Cloudflare Pages Functions API: `functions/api`

## Local Website Development

```bash
npm install
npm run build
```

To preview the generated static site:

```bash
cd _site
python3 -m http.server 8022
```

Open:

- Website: `http://127.0.0.1:8022/`
- Admin shell: `http://127.0.0.1:8022/admin/`

The plain Python server can only preview the admin login screen. Login, saving, users and uploads require Cloudflare Pages Functions.

## Cloudflare Pages Build Settings

Build command:

```bash
npm run build
```

Build output directory:

```bash
_site
```

## Required Cloudflare Resources

Create one D1 database and bind it to Pages Functions as:

```text
DB
```

Run the schema:

```bash
wrangler d1 execute meijia-dental-admin --file=./schema.sql
```

## Required Environment Variables

Set these in Cloudflare Pages:

```text
GITHUB_TOKEN=your_github_fine_grained_token
GITHUB_OWNER=raylee30
GITHUB_REPO=media-dental
GITHUB_BRANCH=main
ADMIN_SETUP_TOKEN=a_long_random_setup_token
```

The GitHub token must have repository Contents read/write permission because the admin saves JSON and images back into the repository.

## First Admin Account

After deployment:

1. Open `/admin/`.
2. Click `首次部署？初始化管理员`.
3. Enter `ADMIN_SETUP_TOKEN`.
4. Create the first super admin.
5. Log in with the new admin account.

The setup endpoint refuses to create another initial admin after the first user exists.

## Roles

- `admin`: pages, products, uploads, users and logs.
- `editor`: pages, products, uploads and logs.
- `product_editor`: products and uploads.

## Notes

- This custom admin no longer uses GitHub OAuth or Decap CMS.
- Passwords are stored in D1 as PBKDF2 hashes.
- Sessions use HttpOnly cookies.
- Uploads are compressed in the browser before being written to `src/assets/uploads` through the GitHub API.
