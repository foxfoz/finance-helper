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

# Expose port
EXPOSE 8000

# Note: collectstatic runs at container startup in entrypoint.sh
# where SECRET_KEY and DATABASE_URL env variables are available

# Start command
CMD ["./backend/entrypoint.sh"]
