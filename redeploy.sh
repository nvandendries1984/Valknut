#!/bin/bash

set -e

echo "🛑 Docker containers stoppen..."
docker compose down

echo "🔨 Docker images bouwen..."
docker compose build

echo "🚀 Docker containers starten (detached)..."
docker compose up -d

echo "✅ Klaar!"
