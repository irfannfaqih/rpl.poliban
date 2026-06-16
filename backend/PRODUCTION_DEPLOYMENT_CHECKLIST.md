# SIRPL Production Deployment Checklist

## Environment

- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`, HTTPS `APP_URL`, and the correct `FRONTEND_URL`.
- [ ] Generate and securely store `APP_KEY`; never generate a new key during routine deploys.
- [ ] Use MySQL with a dedicated least-privilege database account.
- [ ] Use a shared cache store when running more than one application instance.
- [ ] Use `QUEUE_CONNECTION=database` or Redis; never use `sync` in production.
- [ ] Configure SMTP credentials and a verified sender address.
- [ ] Configure daily or centralized logging at `info` level.
- [ ] Bind an `ExternalErrorTracker` implementation through `EXTERNAL_ERROR_TRACKER` when an external service is available.

## Deploy

- [ ] Put the application in maintenance mode when schema changes require it.
- [ ] Run `composer install --no-dev --classmap-authoritative`.
- [ ] Run `php artisan migrate --force`.
- [ ] Run `php artisan optimize` to cache config, events, routes, and views.
- [ ] Build the frontend with `npm ci && npm run build`.
- [ ] Ensure `storage` and `bootstrap/cache` are writable by the application user.
- [ ] Verify private documents are not served directly by the web server.
- [ ] Restart workers with `php artisan queue:restart` after every backend deploy.
- [ ] Run the scheduler every minute: `php artisan schedule:run`.

## Worker Operations

- [ ] Install the Supervisor definition from `deploy/supervisor/sirpl-worker.conf` and adjust paths/process count.
- [ ] Keep worker `--timeout` below `DB_QUEUE_RETRY_AFTER`.
- [ ] Confirm graceful shutdown has at least 90 seconds.
- [ ] Run `php artisan queue:health --fail-on-unhealthy`.
- [ ] Run `php artisan queue:probe --wait=10` while a worker is running.
- [ ] Alert when failed jobs exist, heartbeat is stale, or queue depth grows continuously.
- [ ] Review and retry failed jobs only after the root cause is fixed.

## Readiness

- [ ] `GET /health/live` returns HTTP 200.
- [ ] `GET /health/ready` returns HTTP 200 and all dependency checks are ready.
- [ ] Stop routing traffic to an instance when readiness returns HTTP 503.
- [ ] Monitor slow query, request duration, queue duration, job processing, and queue failure metrics.

## Rollback

- [ ] Keep the previous application release available.
- [ ] Verify the migration rollback procedure in staging before production.
- [ ] Do not roll back migrations that would discard production data.
- [ ] Restart queue workers after application rollback.
