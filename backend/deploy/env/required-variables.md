# Production Environment Required Variables

## Backend

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://rplpoliban.my.id`
- `APP_KEY` generated with `php artisan key:generate --show`
- `DB_CONNECTION=mysql`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `QUEUE_CONNECTION=database`
- `CACHE_STORE=database`
- `SESSION_DRIVER=database`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_DOMAIN=.rplpoliban.my.id`
- `SANCTUM_STATEFUL_DOMAINS=rplpoliban.my.id,www.rplpoliban.my.id`
- `FILESYSTEM_DISK=local`
- Mail SMTP variables for real notification delivery
- `MAIL_TIMEOUT=15`
- `MAIL_EHLO_DOMAIN=rplpoliban.my.id`

## Frontend

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://rplpoliban.my.id/api`

## Operating System

- PHP-FPM socket expected by Nginx: `/run/php/php8.3-fpm.sock`
- Deploy root: `/var/www/sirpl`
- Backup root: `/var/backups/sirpl`
- Queue worker managed by Supervisor program `sirpl-worker`
- Frontend managed by PM2 app `sirpl-frontend`
