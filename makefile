dev:
	npm run dev

add-migration:
	npx prisma migrate dev --name $(name)

migrate:
	npx prisma db push