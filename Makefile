.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

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

dev: ## Start frontend & backend in dev mode
	@lsof -ti:8000,5173 | xargs kill -9 2>/dev/null || true
	docker compose up -d mysql
	(cd backend && DATABASE_URL=mysql+pymysql://root:root@localhost:3306/request_sigknow uv run uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	trap 'kill 0' INT; wait

sh: ## Open a shell in the backend container
	docker compose exec backend sh

status: ## Show container status
	docker compose ps
