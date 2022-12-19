.PHONY: api
api:
	cd api/WealthManager/ && dotnet run

.PHONY: web
web:
	cd web/wealth-manager && yarn run dev