SHELL := /bin/zsh

ROOT := /Users/dev/Desktop/assess/kalos-assessment
API_DIR := $(ROOT)/apps/membergpt-api

.PHONY: db api dashboard up down logs seed reset

db:
	cd $(ROOT) && docker start kalos-postgres || docker compose -f docker-compose.yml up -d
	@echo "Database should be running on localhost:5432"

api:
	cd $(API_DIR) && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

dashboard:
	cd $(ROOT) && rm -rf apps/dashboard/.next && pnpm --filter dashboard dev

seed:
	cd $(ROOT) && pnpm db:push && pnpm db:seed

up:
	@echo "Start these in separate terminals:"
	@echo "1) make db"
	@echo "2) make api"
	@echo "3) make dashboard"

down:
	-docker stop kalos-postgres

logs:
	docker logs -f kalos-postgres

reset:
	cd $(ROOT) && pnpm db:push && pnpm db:seed