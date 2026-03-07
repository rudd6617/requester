# Request

內部需求收集與開發調度系統。業務端提交需求，RD 團隊透過看板管理開發進度。

## 功能

- **需求提交** — 任何人可提交需求（標題、描述、業務影響、優先級）
- **Backlog** — 需求列表，支援排序、篩選、搜尋、分頁
- **看板** — 拖拉式 Kanban（待辦 → 進行中 → 審查中 → 已完成），按團隊篩選
- **甘特圖** — 依日期視覺化開發排程
- **團隊管理** — 建立團隊、分配需求
- **評論** — 需求討論串
- **權限控制** — RD 登入後可操作看板與團隊管理，一般使用者僅能提交需求與查看

## Tech Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Ant Design, dnd-kit   |
| Backend  | FastAPI, SQLAlchemy 2, Alembic, Pydantic 2        |
| Database | MySQL 8                                           |
| Auth     | JWT (HS256) + bcrypt                               |
| Infra    | Docker Compose, nginx                             |

## 快速開始

### Docker（推薦）

```bash
make init      # 建立 .env（首次）
make up        # 啟動所有服務
```

啟動後：
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

### 本地開發

前置需求：Python 3.13+、Node 22+、[uv](https://docs.astral.sh/uv/)、Docker（MySQL）

```bash
make dev
```

會同時啟動：
- MySQL container（port 3306）
- Backend dev server（port 8000，hot reload）
- Frontend dev server（port 5173，HMR）

## 環境變數

複製 `.env.example` 為 `.env`：

| 變數                 | 說明              | 預設值                                              |
| -------------------- | ----------------- | --------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD`| MySQL root 密碼   | `root`                                              |
| `MYSQL_DATABASE`     | 資料庫名稱        | `request_sigknow`                                   |
| `FRONTEND_PORT`      | 前端對外 port      | `3000`                                              |
| `DATABASE_URL`       | SQLAlchemy 連線字串 | `mysql+pymysql://root:root@mysql:3306/request_sigknow` |
| `SECRET_KEY`         | JWT 簽名密鑰       | `dev-secret-change-in-production`                   |

## 專案結構

```
backend/
  app/
    main.py          # FastAPI 入口，CORS、router 掛載
    models.py         # SQLAlchemy ORM models
    schemas.py        # Pydantic request/response schemas
    auth.py           # JWT + bcrypt
    database.py       # DB session
    routers/          # API endpoints
      auth.py         #   註冊、登入
      requests.py     #   需求 CRUD
      kanban.py       #   看板卡片操作
      teams.py        #   團隊管理
      comments.py     #   評論
  alembic/            # DB migrations

frontend/
  src/
    pages/            # 頁面元件
      Backlog.tsx     #   需求列表
      KanbanBoard.tsx #   看板 + 甘特圖
      TeamManage.tsx  #   團隊管理
      RequestForm.tsx #   需求提交表單
    components/       # 共用元件
    hooks/            # React Query hooks
    contexts/         # AuthContext
    api/              # Axios client
```

## 資料模型

```
Request (需求)
├── id, title, description, business_impact
├── requester, priority, status
├── start_date, due_date
├── 1:1 → KanbanCard
└── 1:N → Comment

KanbanCard (看板卡片)
├── id, assignee, stage, position
├── N:1 → Request
└── N:1 → Team

Team (團隊)
├── id, name, description
└── 1:N → KanbanCard

User (使用者)
├── id, username, display_name, password_hash
└── 1:N → Comment
```

**需求狀態流程：** `new` → `assigned`（建立卡片時自動）→ `done`（卡片移至已完成）→ `archived`（手動結案）

## API 概覽

| Method  | Endpoint                     | 說明         | 權限   |
| ------- | ---------------------------- | ------------ | ------ |
| POST    | `/auth/register`             | 註冊         | 公開   |
| POST    | `/auth/login`                | 登入         | 公開   |
| GET     | `/requests`                  | 需求列表     | 公開   |
| POST    | `/requests`                  | 提交需求     | 公開   |
| PATCH   | `/requests/:id`              | 更新需求     | RD     |
| GET     | `/kanban/cards`              | 取得看板     | 公開   |
| POST    | `/kanban/cards`              | 建立/指派卡片 | RD     |
| PATCH   | `/kanban/cards/:id`          | 更新卡片     | RD     |
| PATCH   | `/kanban/cards/:id/move`     | 移動卡片     | RD     |
| GET/POST| `/comments`                  | 評論         | 公開   |
| CRUD    | `/teams`                     | 團隊管理     | RD     |

## Make 指令

```
make help      # 顯示所有指令
make init      # 初始化 .env
make up        # 啟動服務 (Docker)
make down      # 停止服務
make rebuild   # 重建並啟動
make restart   # 重啟服務
make dev       # 本地開發模式
make sh        # 進入 backend 容器
make status    # 查看容器狀態
```
