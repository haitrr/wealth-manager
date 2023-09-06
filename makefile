.PHONY: api
api:
	cd api/WealthManager/ && dotnet run

.PHONY: web
web:
	cd web && yarn run dev