default:
    just dev

# Start all required services and the dev server
dev:
    docker compose up -d postgres
    pnpm dev

# Start only the Next.js dev server (assumes postgres is running)
next:
    pnpm dev

# Start postgres in the background
db:
    docker compose up -d postgres

# Seed the database
seed:
    pnpm db:seed

# Stop all services
stop:
    docker compose down

# View postgres logs
db-logs:
    docker compose logs -f postgres
