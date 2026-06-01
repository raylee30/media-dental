# Custom Admin Deployment Checklist

This checklist is for the MEIJIA DENTAL custom admin backend.

## 1. Create D1

In Cloudflare:

1. Open Workers & Pages.
2. Go to D1.
3. Create a database, for example `meijia-dental-admin`.
4. Run `schema.sql` in the D1 console, or use Wrangler:

```bash
wrangler d1 execute meijia-dental-admin --remote --file=./schema.sql
```

If the database already exists from the first custom admin version, run the analytics migration instead:

```bash
wrangler d1 execute meijia-dental-admin --remote --file=./migrations/0002_analytics.sql
```

To add the default super admin account, run:

```bash
wrangler d1 execute meijia-dental-admin --remote --file=./migrations/0003_default_admin.sql
```

Default admin:

```text
Username: admin
Password: meijiaadmin
```

Change this password after the first successful login.

## 2. Bind D1 To Pages

In the Pages project:

1. Open Settings.
2. Open Bindings.
3. Add D1 database binding.
4. Variable name must be:

```text
DB
```

5. Select the D1 database.

Cloudflare Pages Functions expose bindings through `context.env`.

## 3. Create GitHub Token

Create a fine-grained GitHub token for the repository.

Required permission:

```text
Contents: Read and write
```

The custom admin uses GitHub's repository contents API to update JSON files and uploaded images.

## 4. Add Environment Variables

In Cloudflare Pages, add:

```text
GITHUB_TOKEN=your_token
GITHUB_OWNER=raylee30
GITHUB_REPO=media-dental
GITHUB_BRANCH=main
ADMIN_SETUP_TOKEN=a_long_random_setup_token
```

Use a long random value for `ADMIN_SETUP_TOKEN`.

## 5. Deploy

Cloudflare Pages settings:

```text
Build command: npm run build
Build output directory: _site
```

After deployment, open:

```text
https://www.mjsmiles.com/admin/
```

If the default admin migration has been run, log in directly with `admin / meijiaadmin`.
If you do not use the default admin, click `首次部署？初始化管理员`, enter `ADMIN_SETUP_TOKEN`, and create the first super admin.

## 6. Analytics

The site records anonymous visitor analytics through `/api/analytics/track` and `/api/analytics/pixel`.

Tracked data includes:

- PV, UV and IP count.
- Average session duration and bounce rate.
- Traffic source, device, browser and operating system.
- Top pages, exit pages and 404 pages.
- Product page views and inquiry clicks.
- Visitor journey timelines.

Form content is not stored in analytics.

## 7. Roles

- Super admin: pages, products, uploads, users, logs and analytics.
- Content admin: pages, products, uploads, logs and analytics.
- Product editor: products and uploads.

## 8. Rollback

If the custom admin version is not acceptable, revert to the previous Git commit:

```bash
git log --oneline
git revert <commit_id>
git push
```
