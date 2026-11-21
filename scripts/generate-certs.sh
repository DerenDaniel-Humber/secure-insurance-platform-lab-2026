#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
chmod 600 certs/localhost-key.pem
printf 'Created development certificate files in backend/certs. Do not use these in production.
'
