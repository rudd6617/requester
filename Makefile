.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@awk '/^## ---/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 8) } /^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-14s\033[0m %s\n", $$1, substr($$0, index($$0, "## ") + 3) }' $(MAKEFILE_LIST)
	@echo ""

## --- 服務管理
init: ## Copy .env.example to .env (if not exists)
	@test -f .env || cp .env.example .env && echo ".env ready"

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

rebuild: ## Rebuild and start all services
	docker compose up -d --build

status: ## Show container status
	docker compose ps

sh: ## Open a shell in the backend container
	docker compose exec backend sh

dev: ## Start frontend & backend in dev mode
	@lsof -ti:8000,5173 | xargs kill -9 2>/dev/null || true
	docker compose up -d mysql
	(cd backend && DATABASE_URL=mysql+pymysql://root:root@localhost:3306/requester uv run uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	trap 'kill 0' INT; wait

## --- 資料操作
seed: ## Seed database with sample data
	docker compose exec backend uv run python seed.py

create-user: ## Create a new user interactively
	docker compose exec -it backend uv run python scripts/create_user.py
