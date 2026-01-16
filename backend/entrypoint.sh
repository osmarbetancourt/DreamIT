#!/bin/sh
set -e

# Reconstruct Google service account JSON from .env variables if present
# Write Google service account JSON with proper newlines in private_key
# Write Google service account JSON with proper newlines in private_key
# Write Google service account JSON with private_key as a single line with \n escapes
if [ -n "$GOOGLE_SA_PRIVATE_KEY" ]; then
  # Convert any real newlines in the private key to literal \n for JSON compatibility
  PRIVATE_KEY_ESCAPED=$(printf "%s" "$GOOGLE_SA_PRIVATE_KEY" | sed ':a;N;$!ba;s/\n/\\n/g')
  cat <<EOF > /app/google_service_account.json
{
  "type": "$GOOGLE_SA_TYPE",
  "project_id": "$GOOGLE_SA_PROJECT_ID",
  "private_key_id": "$GOOGLE_SA_PRIVATE_KEY_ID",
  "private_key": "$PRIVATE_KEY_ESCAPED",
  "client_email": "$GOOGLE_SA_CLIENT_EMAIL",
  "client_id": "$GOOGLE_SA_CLIENT_ID",
  "auth_uri": "$GOOGLE_SA_AUTH_URI",
  "token_uri": "$GOOGLE_SA_TOKEN_URI",
  "auth_provider_x509_cert_url": "$GOOGLE_SA_AUTH_PROVIDER_X509_CERT_URL",
  "client_x509_cert_url": "$GOOGLE_SA_CLIENT_X509_CERT_URL",
  "universe_domain": "$GOOGLE_SA_UNIVERSE_DOMAIN"
}
EOF
fi

# Apply database migrations
python manage.py migrate --noinput

# Collect static files for Render persistent disk
python manage.py collectstatic --noinput

PROJECT_MODULE="${DJANGO_PROJECT:-dreamit}"
CELERY_APP="${CELERY_APP:-${PROJECT_MODULE}}"

# Start server
if [ "$1" = "celery" ]; then
  shift
  exec celery -A "$CELERY_APP" worker --loglevel=INFO "$@"
else
  exec gunicorn "${PROJECT_MODULE}.asgi:application" \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${WEB_CONCURRENCY:-3} \
    --timeout 300 \
    --graceful-timeout ${GUNICORN_GRACEFUL_TIMEOUT:-30} \
    --keep-alive ${GUNICORN_KEEP_ALIVE:-5} \
    --access-logfile - \
    --error-logfile - \
    --log-level ${LOG_LEVEL:-info}
fi