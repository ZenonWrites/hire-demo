#!/bin/sh
set -e

mkdir -p /app/data

python manage.py makemigrations core --noinput
python manage.py migrate --noinput
python manage.py seed

# Create the superuser automatically using the env variables
if [ "$DJANGO_SUPERUSER_USERNAME" ]; then
    python manage.py createsuperuser --noinput || true
fi

echo "Backend ready at http://0.0.0.0:8000 (use your computer's LAN IP from your phone)"
exec python manage.py runserver 0.0.0.0:8000