"""
Django settings for dreamit project.

Environment-driven configuration modeled after your `gym_project` settings.
This file reads secrets and flags from environment variables (via dotenv)
and provides sane defaults for local development.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load .env when present
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY') or 'django-insecure-!d70#lpk&6)_6tr5u(zmue2t2q=fxu)m!np2s#0^amt5aw+$!u'
if not SECRET_KEY:
    raise RuntimeError('DJANGO_SECRET_KEY is not set; define it in the environment or .env file.')

DEBUG = os.getenv('DJANGO_DEBUG', 'true').lower() in ('true', '1', 'yes')

_host_env = os.getenv('DJANGO_ALLOWED_HOSTS') or os.getenv('ALLOWED_HOSTS')
ALLOWED_HOSTS = _host_env.split(',') if _host_env else []


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'django.contrib.postgres',
    'import_export',
    'adrf',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'dreamit.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dreamit.wsgi.application'


# Database configuration: prefer Postgres (from env), otherwise fallback to sqlite
if os.getenv('POSTGRES_DB'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'django_db'),
            'USER': os.getenv('POSTGRES_USER', 'django_user'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'django_password'),
            'HOST': os.getenv('POSTGRES_HOST', 'db'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Caracas'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Use whitenoise for static file serving in production containers
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS
CORS_ALLOW_ALL_ORIGINS = True


# Build CSRF_TRUSTED_ORIGINS from ALLOWED_HOSTS
def _build_csrf_origins(hosts):
    origins = []
    for host in hosts:
        host = host.strip()
        if not host:
            continue
        if host.startswith('0.0.0.0'):
            continue
        if host in ('localhost', '127.0.0.1'):
            if DEBUG:
                origins.extend([f"http://{host}", f"https://{host}"])
            continue
        if ' ' in host or '.' not in host:
            continue
        if DEBUG:
            origins.extend([f"http://{host}", f"https://{host}"])
        else:
            origins.append(f"https://{host}")
    return origins

CSRF_TRUSTED_ORIGINS = _build_csrf_origins(ALLOWED_HOSTS)

#AUTH_USER_MODEL = 'api.User'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'PAGE_SIZE': int(os.getenv('API_PAGE_SIZE', '50')),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', '60'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', '7'))),
}

# Google OAuth client (used for ID token verification in GoogleLoginView)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# Cloud object storage (Cloudflare R2 / S3 compatible)
R2_S3_ENDPOINT = os.getenv('R2_S3_ENDPOINT')
R2_S3_API = os.getenv('R2_S3_API')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_PUBLIC_BASE_URL = os.getenv('R2_PUBLIC_BASE_URL') or R2_S3_API or R2_S3_ENDPOINT

# Celery / Redis configuration
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json', 'pickle']
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True


# Logging: simple console logger
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'formatters': {
        'simple': {
            'format': '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

