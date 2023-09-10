.PHONY: api
api:
	cd api/WealthManager/ && dotnet watch run

.PHONY: web
web:
	cd web && bun run dev