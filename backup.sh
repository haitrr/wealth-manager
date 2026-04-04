#!/bin/bash
set -e

echo "running backup"
docker compose -f docker-compose.prod.yml exec postgres-backup /backup.sh
echo "backup done"
