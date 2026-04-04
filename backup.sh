#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BLUE}${BOLD}Running database backup...${RESET}"
docker compose -f docker-compose.prod.yml exec postgres-backup /backup.sh \
  && echo -e "  ${GREEN}✓${RESET} Backup complete at $(date '+%Y-%m-%d %H:%M:%S')" \
  || { echo -e "  ${RED}✗ Backup failed${RESET}"; exit 1; }
