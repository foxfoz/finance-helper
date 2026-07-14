#!/bin/sh
set -e

cd backend

echo "=== ENV DEBUG ==="
echo "SECRET_KEY exists: $(test -n "$SECRET_KEY" && echo YES || echo NO)"
echo "DATABASE_URL exists: $(test -n "$DATABASE_URL" && echo YES || echo NO)"
echo "PORT: ${PORT:-8000}"
echo "PWD: $(pwd)"
echo "=== STATICFILES CHECK ==="
ls -la staticfiles/ 2>/dev/null || echo "staticfiles/ not found"
echo "=== RUNNING COLLECTSTATIC ==="
python manage.py collectstatic --noinput
ls -la staticfiles_collected/ 2>/dev/null || echo "staticfiles_collected/ not found"
echo "=== RUNNING MIGRATIONS ==="
python manage.py migrate --noinput
echo "=== STARTING GUNICORN ==="
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --timeout 60
