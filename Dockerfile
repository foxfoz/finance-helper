# Stage 1: Build React frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build


# Stage 2: Python backend
FROM python:3.11-slim AS backend

WORKDIR /app

# Build arguments for Django collectstatic
ARG SECRET_KEY=build-time-secret-key-not-for-production
ARG DATABASE_URL=

# Install system dependencies for psycopg2 and pandas
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend staticfiles
COPY --from=frontend-builder /app/frontend/dist ./backend/staticfiles/

# Collect static files
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings
RUN cd backend && python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Start command (Railway provides $PORT)
CMD cd backend && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 60
