#!/usr/bin/env bash
# Arranca el dashboard LWS Options Lab en local.
# Uso:  ./start.sh   (o haz doble clic si tu sistema lo permite)
set -e
cd "$(dirname "$0")"

echo "▶  Instalando dependencias (solo la primera vez tarda)…"
npm install --no-audit --no-fund

echo "▶  Arrancando el dashboard…"
echo "   Abre tu navegador en:  http://localhost:3000"
npm run dev
