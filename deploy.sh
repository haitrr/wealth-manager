echo "backing up database"
./backup.sh
echo "deploying app"
docker compose -f docker-compose.prod.yml up -d --build
echo "deploying cli"
pnpm link --global
echo "updating openclaw skill"
cp skills/wm/SKILL.md ~/.openclaw/workspace/skills/wm/SKILL.md
echo "all done"
