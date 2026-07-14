#!/bin/sh
set -e

cd backend

# Run migrations
python manage.py migrate --noinput

# Start Gunicorn
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --timeout 60
