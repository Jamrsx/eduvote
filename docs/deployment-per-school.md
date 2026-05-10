# Deploying Eduvote per school (one database per institution)

Each school runs its **own** MySQL (or compatible) database. The application schema is identical everywhere; **tenant isolation is the database**, not a `school_id` column.

## Provisioning a new school

1. **Create an empty database** (example: `northridge_elections`) with UTF-8 support (`utf8mb4_unicode_ci`).
2. **Copy `.env`** for that deployment and set:
   - `APP_NAME`, `APP_URL` as appropriate for the institution.
   - `DB_DATABASE` to the new database name (and `DB_USERNAME` / `DB_PASSWORD` as required).
3. **Install dependencies** (`composer install --no-dev`, `npm ci && npm run build` on the server if you serve the Vite build from disk).
4. **Run migrations**: `php artisan migrate --force`.
5. **Create the first admin user** (tinker, seeder, or registration flow you expose): assign `users.role = 'admin'`.
6. **Cron / scheduler**: point the system crontab to Laravel’s scheduler so `elections:sync-statuses` runs every minute (the default project schedule already registers this command).

## Optional: one codebase, many databases

If you host a single Laravel app and switch databases per hostname (subdomain), resolve the tenant’s `DB_DATABASE` in middleware and call `Config::set('database.connections.mysql.database', ...)` (or use a dedicated connection name) **before** handling the request. Do not add `school_id` to election tables; the separate database **is** the tenant boundary.

## Operations

- **Backups**: back up each school’s database on its own schedule.
- **Upgrades**: pull the new release, run `php artisan migrate --force` against **each** school database.
