# Python/Django Dockerfile
FROM python:3.11-slim

# Create a non-root user and group
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies for psycopg/psycopg2 builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --upgrade pip --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org && \
    pip install -r requirements.txt --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org

COPY . /app/

RUN mkdir -p /var/data && chown -R appuser:appgroup /app /var/data \
    && chmod -R 775 /app /var/data \
    && mkdir -p /tmp/.fontconfig /tmp/.cache/fontconfig \
    && chmod -R 777 /tmp/.fontconfig /tmp/.cache

# Set HOME to /tmp so fontconfig can write its cache
ENV HOME=/tmp
ENV FONTCONFIG_PATH=/tmp/.cache/fontconfig

ENV FONTCONFIG_CACHE=/tmp/.fontconfig

USER appuser

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]