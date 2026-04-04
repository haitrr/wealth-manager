#!/bin/bash
set -e

BOLD='\033[1m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${BOLD}=== Upgrading wealth-manager ===${RESET}"
echo "Started at $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo -e "${BLUE}${BOLD}[1/2]${RESET} ${BOLD}Pulling latest changes${RESET}"
git pull && echo -e "  ${GREEN}✓${RESET} Up to date" || { echo -e "  ${RED}✗ git pull failed${RESET}"; exit 1; }

echo ""
echo -e "${BLUE}${BOLD}[2/2]${RESET} ${BOLD}Running deploy${RESET}"
./deploy.sh
